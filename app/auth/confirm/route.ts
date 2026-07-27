import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { type NextRequest } from 'next/server'

import { createClient } from '@/lib/server'

function resolveNext(nextParam: string | null, origin: string): string {
	if (!nextParam) return '/'

	let candidate = nextParam

	if (!candidate.startsWith('/')) {
		try {
			const url = new URL(candidate)
			if (url.origin !== origin) return '/'
			candidate = `${url.pathname}${url.search}`
		} catch {
			return '/'
		}
	}

	// Ignore nested confirm links (common when redirectTo pointed at /auth/confirm)
	if (candidate.startsWith('/auth/confirm')) {
		const nested = new URL(candidate, origin)
		return resolveNext(nested.searchParams.get('next'), origin)
	}

	return candidate.startsWith('/') ? candidate : '/'
}

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url)
	const token_hash = searchParams.get('token_hash')
	const type = searchParams.get('type') as EmailOtpType | null
	const next = resolveNext(searchParams.get('next'), origin)

	if (token_hash && type) {
		const supabase = await createClient()

		const { error } = await supabase.auth.verifyOtp({
			type,
			token_hash,
		})
		if (!error) {
			redirect(next)
		} else {
			redirect(`/auth/error?error=${error?.message}`)
		}
	}

	redirect(`/auth/error?error=No token hash or type`)
}
