'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

export function CodeBlock({ code }: { code: string }) {
	const { copied, copy } = useCopyToClipboard()

	return (
		<div className="relative rounded-lg border bg-muted">
			<Button
				size="sm"
				variant="outline"
				onClick={() => copy(code)}
				className="absolute top-2 right-2"
			>
				{copied ? (
					<CheckIcon data-icon="inline-start" />
				) : (
					<CopyIcon data-icon="inline-start" />
				)}
				{copied ? 'Copied' : 'Copy'}
			</Button>
			<pre className="max-h-80 overflow-auto p-3 pr-24 font-mono text-xs leading-relaxed">
				<code>{code}</code>
			</pre>
		</div>
	)
}
