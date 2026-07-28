'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCopyToClipboard(resetDelay = 2000) {
	const [copied, setCopied] = useState(false)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [])

	const copy = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value)
			} catch {
				return
			}

			setCopied(true)
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
			timeoutRef.current = setTimeout(() => setCopied(false), resetDelay)
		},
		[resetDelay],
	)

	return { copied, copy }
}
