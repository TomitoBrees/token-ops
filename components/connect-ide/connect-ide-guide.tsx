'use client'

import { useQuery } from '@tanstack/react-query'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { CodeBlock } from './code-block'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTRPC } from '@/trpc/client'

const PROXY_URL =
	process.env.NEXT_PUBLIC_PROXY_URL ?? 'https://your-proxy.workers.dev'

const TOKEN_PLACEHOLDER = 'your-proxy-token'

const CLIENTS = [
	{
		value: 'cli',
		label: 'CLI (terminal)',
		hint: 'Add to ~/.claude/settings.json so every terminal session uses the proxy.',
	},
	{
		value: 'editor',
		label: 'VS Code',
		hint: 'Add to .claude/settings.json at your project root so this workspace uses the proxy.',
	},
] as const

function buildSettingsSnippet(proxyToken: string) {
	return `{
  "env": {
    "ANTHROPIC_BASE_URL": "${PROXY_URL}",
    "ANTHROPIC_AUTH_TOKEN": "sk-ant-...",
    "ANTHROPIC_CUSTOM_HEADERS": "x-proxy-token: ${proxyToken}"
  }
}`
}

function GuideStep({
	step,
	title,
	description,
	children,
}: {
	step: number
	title: string
	description: ReactNode
	children: ReactNode
}) {
	return (
		<section className="flex flex-col">
			<div className="flex items-center gap-3">
				<Badge className="size-7 shrink-0 rounded-full p-0 tabular-nums">
					{step}
				</Badge>
				<h3 className="text-sm leading-snug font-medium">{title}</h3>
			</div>
			<div className="flex flex-col gap-3 pl-10">
				<p className="text-sm text-muted-foreground">{description}</p>
				{children}
			</div>
		</section>
	)
}

function ProxyTokenField() {
	const trpc = useTRPC()
	const proxyToken = useQuery(trpc.profile.getProxyToken.queryOptions())

	if (proxyToken.isPending) {
		return <Skeleton className="h-11 w-full rounded-lg" />
	}

	if (proxyToken.isError) {
		return (
			<Alert variant="destructive">
				<CircleAlertIcon />
				<AlertTitle>No proxy token yet</AlertTitle>
				<AlertDescription>{proxyToken.error.message}</AlertDescription>
			</Alert>
		)
	}

	return <CodeBlock code={proxyToken.data} />
}

function ClientConfig() {
	const trpc = useTRPC()
	const proxyToken = useQuery(trpc.profile.getProxyToken.queryOptions())
	const snippet = buildSettingsSnippet(proxyToken.data ?? TOKEN_PLACEHOLDER)

	return (
		<Tabs defaultValue={CLIENTS[0].value}>
			<TabsList>
				{CLIENTS.map((client) => (
					<TabsTrigger key={client.value} value={client.value}>
						{client.label}
					</TabsTrigger>
				))}
			</TabsList>
			{CLIENTS.map((client) => (
				<TabsContent
					key={client.value}
					value={client.value}
					className="flex flex-col gap-2"
				>
					<p className="text-sm text-muted-foreground">
						{client.hint}
					</p>
					<CodeBlock code={snippet} />
				</TabsContent>
			))}
		</Tabs>
	)
}

export function ConnectIdeGuide({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false)

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>{children}</SheetTrigger>

			<SheetContent className="gap-0 data-[side=right]:sm:max-w-3xl">
				<SheetHeader>
					<SheetTitle>Connect your IDE</SheetTitle>
					<SheetDescription>
						Route your Claude Code traffic through the proxy so
						usage lands on your dashboard.
					</SheetDescription>
				</SheetHeader>

				<Separator />

				<div className="flex min-h-0 flex-1 flex-col gap-8 overflow-hidden bg-muted/40 p-4">
					<GuideStep
						step={1}
						title="Your proxy token"
						description={
							<>
								Unique to your account. Sent as the{' '}
								<code className="font-mono text-foreground">
									x-proxy-token
								</code>{' '}
								header so we can attribute traffic to you.
							</>
						}
					>
						<ProxyTokenField />
					</GuideStep>

					<GuideStep
						step={2}
						title="Configure your client"
						description="Pick how you run Claude Code — you only need one of these."
					>
						<ClientConfig />
					</GuideStep>

					<Alert>
						<InfoIcon />
						<AlertDescription>
							Restart your agent after editing the config. Your
							first request should appear here within a minute.
						</AlertDescription>
					</Alert>
				</div>
			</SheetContent>
		</Sheet>
	)
}
