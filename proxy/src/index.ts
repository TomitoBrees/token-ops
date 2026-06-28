import { Hono } from 'hono'

import type {
  Message,
  MessageCreateParamsBase,
  RawMessageStreamEvent,
  Usage,
} from '@anthropic-ai/sdk/resources/messages'

/* TYPES */

type Env = {
  SUPABASE_URL: string          // e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_KEY: string  // service_role key (never the anon key)
}

type Variables = {
  customer: Customer;
}


type Customer = {
  id: string
  proxy_token: string
  name: string
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

const app = new Hono<{Bindings: Env, Variables: Variables}>()

/* AUTH */

app.use('/v1/*', async (c, next) => {
  const proxyToken = c.req.header(PROXY_TOKEN_HEADER)

  if (!proxyToken) {
    return c.json({
      error : {
        type: 'auth_error',
        message: 'Missing X-Proxy-Token header. Check your TokenOps dashboard for setup instructions.',
      }
    }, 401)
  }


  const customer = await fetchCustomerByToken(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY, proxyToken)
  if (!proxyToken) {
    return c.json({
      error : {
        type: 'auth_error',
        message: 'Your X-Proxy-Token is not associated with your TokenOps account. Check your TokenOps dashboard for setup instructions.',
      }
    }, 401)
  }

  c.set('customer', customer!)
  await next()
})

/* Main route */
app.all('/v1/*', async (c) => {
  const customer = c.get('customer')
  const upstreamUrl = `${ANTHROPIC_API_BASE}${c.req.path}${new URL(c.req.url).search}`

  const headers = new Headers()
  for (const [key, value] of c.req.raw.headers) {
    if (!HEADERS_TO_STRIP.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  }

  const model = extractModelFromRequest(c.req.raw)

  const upstreamResponse = await fetch(upstreamUrl, {
    method: c.req.method,
    headers,
    body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body: undefined,
  })

  const isStreaming = upstreamResponse.headers.get('content-type')?.includes('text/event-stream') ?? false

  /* Non streaming response */

  if (!isStreaming) {
    const body = (await upstreamResponse.json()) as Message
    const usage = body.usage
    // Put that in the DB
    // Return the response
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

    const pipePromise = pipeStreamAndExtractUsage(writable, readable, usage)
    // Put that in the DB
    // Return the response

  }
})


/* UTILS */
async function fetchCustomerByToken(supabaseUrl: string, serviceKey: string, proxyToken: string): Promise<Customer | null> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/customers?proxy_token=eq.${encodeURIComponent(proxyToken)}&select=id,proxy_token,name&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  )
 
  if (!res.ok) {
    console.error('Supabase customer lookup failed:', res.status, await res.text())
    return null
  }
 
  const rows = (await res.json()) as Customer[]
  return rows[0] ?? null

}

async function insertUsage() {
  // TODO: Insert usage in dedicated table
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
  usage: Usage
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

      buffer += decoder.decode(value, {stream: true})
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const event = JSON.parse(data) as RawMessageStreamEvent
          parseUsageFromEvent(event, usage)
        } catch {

        }
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
  }

  if (event.type === 'message_delta') {
    usage.output_tokens = event.usage.output_tokens
    if (event.usage.input_tokens != null) {
      usage.input_tokens = event.usage.input_tokens
    }
    if (event.usage.cache_creation_input_tokens != null) {
      usage.cache_creation_input_tokens = event.usage.cache_creation_input_tokens
    }
    if (event.usage.cache_read_input_tokens != null) {
      usage.cache_read_input_tokens = event.usage.cache_read_input_tokens
    }
    if (event.usage.server_tool_use != null) {
      usage.server_tool_use = event.usage.server_tool_use
    }
  }
}

app.get('/api/', (c) => {
  return c.text('Hello Hono!')
})

export default app
