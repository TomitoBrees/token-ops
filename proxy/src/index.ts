import { Hono } from 'hono'

import type {
	Message,
	MessageCreateParamsBase,
	RawMessageStreamEvent,
	Usage,
} from '@anthropic-ai/sdk/resources/messages'

import { calcPrice, extractUsage, findProvider } from '@pydantic/genai-prices'

const ANTHROPIC_PROVIDER = findProvider({ providerId: 'anthropic' })

/* TYPES */

type Env = {
	SUPABASE_URL: string // e.g. https://xxxx.supabase.co
	SUPABASE_SERVICE_KEY: string // service_role key (never the anon key)
}

type Variables = {
	companyMember: CompanyMember
}

type CompanyMember = {
	id: string
	user_id: string
	company_id: string
	proxy_token: string
}

interface UsageEventPayload {
	company_member_id: string
	model: string
	input_tokens: number
	output_tokens: number
	cache_creation_input_tokens: number
	cache_creation_5m_input_tokens: number
	cache_creation_1h_input_tokens: number
	cache_read_input_tokens: number
	estimated_cost_usd: number
}

/* CONSTANTS */

const ANTHROPIC_API_BASE = 'https://api.anthropic.com'
const PROXY_TOKEN_HEADER = 'x-proxy-token'

const HEADERS_TO_STRIP = new Set([
	'host',
	'cf-ray',
	'cf-connecting-ip',
	'cf-ipcountry',
	'cf-visitor',
	'cdn-loopback',
	'x-forwarded-for',
	'x-forwarded-proto',
	PROXY_TOKEN_HEADER, // never leak our internal header to Anthropic
])

/* APP */

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

/* AUTH */

app.use('/v1/*', async (c, next) => {
	const proxyToken = c.req.header(PROXY_TOKEN_HEADER)

	if (!proxyToken) {
		return c.json(
			{
				error: {
					type: 'auth_error',
					message:
						'Missing X-Proxy-Token header. Check your Tokenito dashboard for setup instructions.',
				},
			},
			401,
		)
	}

	const companyMember = await fetchCustomerByToken(
		c.env.SUPABASE_URL,
		c.env.SUPABASE_SERVICE_KEY,
		proxyToken,
	)
	if (!companyMember) {
		return c.json(
			{
				error: {
					type: 'auth_error',
					message:
						'Your X-Proxy-Token is not associated with your Tokenito account. Check your Tokenito dashboard for setup instructions.',
				},
			},
			401,
		)
	}

	c.set('companyMember', companyMember)
	await next()
})

/* Main route */
app.all('/v1/*', async (c) => {
	const companyMember = c.get('companyMember')
	const upstreamUrl = `${ANTHROPIC_API_BASE}${c.req.path}${new URL(c.req.url).search}`

	const headers = new Headers()
	for (const [key, value] of c.req.raw.headers) {
		if (!HEADERS_TO_STRIP.has(key.toLowerCase())) {
			headers.set(key, value)
		}
	}

	const model = await extractModelFromRequest(c.req.raw)

	const upstreamResponse = await fetch(upstreamUrl, {
		method: c.req.method,
		headers,
		body:
			c.req.method !== 'GET' && c.req.method !== 'HEAD'
				? c.req.raw.body
				: undefined,
	})

	const isStreaming =
		upstreamResponse.headers
			.get('content-type')
			?.includes('text/event-stream') ?? false

	/* Non streaming response */

	if (!isStreaming) {
		const bodyText = await upstreamResponse.text()
		if (upstreamResponse.ok && c.req.path === '/v1/messages') {
			try {
				const body = JSON.parse(bodyText) as Message
				const usage = body.usage

				const cc = splitCacheCreation(usage)

				c.executionCtx.waitUntil(
					insertUsage(
						c.env.SUPABASE_URL,
						c.env.SUPABASE_SERVICE_KEY,
						{
							company_member_id: companyMember.id,
							model,
							input_tokens: usage.input_tokens ?? 0,
							output_tokens: usage.output_tokens ?? 0,
							cache_read_input_tokens:
								usage.cache_read_input_tokens ?? 0,
							estimated_cost_usd: estimateCostUsd(model, usage),
							cache_creation_input_tokens: cc.total,
							cache_creation_5m_input_tokens: cc.fiveMin,
							cache_creation_1h_input_tokens: cc.oneHour,
						},
					),
				)
			} catch {}
		}
		return new Response(bodyText, {
			status: upstreamResponse.status,
			headers: upstreamResponse.headers,
		})
	}

	/* Steaming response */
	else if (isStreaming && upstreamResponse.body) {
		const { readable, writable } = new TransformStream()
		const usage: Usage = {
			input_tokens: 0,
			output_tokens: 0,
			cache_creation_input_tokens: 0,
			cache_read_input_tokens: 0,
			cache_creation: null,
			inference_geo: null,
			output_tokens_details: null,
			server_tool_use: null,
			service_tier: null,
		}

		const pipePromise = pipeStreamAndExtractUsage(
			writable,
			upstreamResponse.body,
			usage,
		)

		c.executionCtx.waitUntil(
			pipePromise.then(() => {
				if (!upstreamResponse.ok || c.req.path !== '/v1/messages')
					return

				const cc = splitCacheCreation(usage)
				return insertUsage(
					c.env.SUPABASE_URL,
					c.env.SUPABASE_SERVICE_KEY,
					{
						company_member_id: companyMember.id,
						model: model,
						input_tokens: usage.input_tokens || 0,
						output_tokens: usage.output_tokens || 0,
						cache_read_input_tokens:
							usage.cache_read_input_tokens || 0,
						estimated_cost_usd: estimateCostUsd(model, usage),
						cache_creation_input_tokens: cc.total,
						cache_creation_5m_input_tokens: cc.fiveMin,
						cache_creation_1h_input_tokens: cc.oneHour,
					},
				)
			}),
		)

		return new Response(readable, {
			status: upstreamResponse.status,
			headers: upstreamResponse.headers,
		})
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		headers: upstreamResponse.headers,
	})
})

/* UTILS */
async function fetchCustomerByToken(
	supabaseUrl: string,
	serviceKey: string,
	proxyToken: string,
): Promise<CompanyMember | null> {
	const res = await fetch(
		`${supabaseUrl}/rest/v1/company_members?proxy_token=eq.${encodeURIComponent(proxyToken)}&select=id,user_id,company_id,proxy_token&limit=1`,
		{
			headers: {
				apikey: serviceKey,
				Authorization: `Bearer ${serviceKey}`,
			},
		},
	)

	if (!res.ok) {
		console.error(
			'Supabase customer lookup failed:',
			res.status,
			await res.text(),
		)
		return null
	}

	const rows = (await res.json()) as CompanyMember[]
	return rows[0] ?? null
}

async function insertUsage(
	supabaseUrl: string,
	serviceKey: string,
	payload: UsageEventPayload,
) {
	try {
		const res = await fetch(`${supabaseUrl}/rest/v1/usage_events`, {
			method: 'POST',
			headers: {
				apikey: serviceKey,
				Authorization: `Bearer ${serviceKey}`,
				'Content-Type': 'application/json',
				Prefer: 'return=minimal',
			},
			body: JSON.stringify(payload),
		})

		if (!res.ok) {
			console.error(
				'Supabase usage log failed:',
				res.status,
				await res.text(),
			)
		}
	} catch (err) {
		console.error('Failed to log usage:', err)
	}
}

async function extractModelFromRequest(request: Request): Promise<string> {
	try {
		const cloned = request.clone()
		const body = (await cloned.json()) as MessageCreateParamsBase
		return body.model ?? 'unknown'
	} catch {
		return 'unknown'
	}
}

async function pipeStreamAndExtractUsage(
	writable: WritableStream<Uint8Array>,
	readable: ReadableStream<Uint8Array>,
	usage: Usage,
) {
	const reader = readable.getReader()
	const writer = writable.getWriter()
	const decoder = new TextDecoder()
	let buffer = ''

	try {
		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			await writer.write(value)

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() ?? ''

			for (const line of lines) {
				if (!line.startsWith('data: ')) continue
				const data = line.slice(6).trim()
				if (data === '[DONE]') continue

				try {
					const event = JSON.parse(data) as RawMessageStreamEvent
					parseUsageFromEvent(event, usage)
				} catch {}
			}
		}
	} finally {
		await writer.close()
	}
}

function parseUsageFromEvent(event: RawMessageStreamEvent, usage: Usage) {
	if (event.type === 'message_start') {
		const u = event.message.usage
		usage.input_tokens = u.input_tokens
		usage.cache_creation_input_tokens = u.cache_creation_input_tokens
		usage.cache_read_input_tokens = u.cache_read_input_tokens
		usage.cache_creation = u.cache_creation ?? null
	}

	if (event.type === 'message_delta') {
		usage.output_tokens = event.usage.output_tokens
		if (event.usage.input_tokens != null) {
			usage.input_tokens = event.usage.input_tokens
		}
		if (event.usage.cache_creation_input_tokens != null) {
			usage.cache_creation_input_tokens =
				event.usage.cache_creation_input_tokens
		}
		if (event.usage.cache_read_input_tokens != null) {
			usage.cache_read_input_tokens = event.usage.cache_read_input_tokens
		}
		if (event.usage.server_tool_use != null) {
			usage.server_tool_use = event.usage.server_tool_use
		}
	}
}

function splitCacheCreation(u: {
	cache_creation_input_tokens?: number | null
	cache_creation?: {
		ephemeral_5m_input_tokens?: number | null
		ephemeral_1h_input_tokens?: number | null
	} | null
}) {
	const total = u.cache_creation_input_tokens ?? 0
	const detail = u.cache_creation

	if (!detail) return { fiveMin: total, oneHour: 0, total }

	return {
		fiveMin: detail.ephemeral_5m_input_tokens ?? 0,
		oneHour: detail.ephemeral_1h_input_tokens ?? 0,
		total,
	}
}

function estimateCostUsd(model: string, usage: Usage): number {
	if (!ANTHROPIC_PROVIDER) return 0

	try {
		const extracted = extractUsage(ANTHROPIC_PROVIDER, { model, usage })
		const result = calcPrice(extracted.usage, extracted.model ?? model, {
			providerId: 'anthropic',
		})
		return result?.total_price ?? 0
	} catch {
		return 0
	}
}

export default app
