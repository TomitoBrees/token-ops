import * as React from 'react'
import Link from 'next/link'
import {
	ArrowRight,
	Bell,
	LineChart,
	Lock,
	Share2,
	Users,
	Waypoints,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { TokenitoIcon } from '@/components/tokenito-icon'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Item,
	ItemActions,
	ItemContent,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'
import { Progress } from '@/components/ui/progress'

const features = [
	{
		icon: LineChart,
		title: 'Real-time spend',
		description:
			'Every request is metered the moment it hits the proxy. No end-of-month surprises, no reconciliation.',
	},
	{
		icon: Users,
		title: 'Per-person & per-model',
		description:
			'Break down usage by employee, team, project or model. Find the outlier before finance does.',
	},
	{
		icon: Lock,
		title: 'Scoped tokens',
		description:
			'Issue and revoke per-developer proxy tokens without ever sharing a shared master key.',
	},
]

const steps = [
	{
		title: 'Create your workspace',
		description: 'Sign up, name your org and invite your team by email.',
	},
	{
		title: 'Point to the proxy',
		description: (
			<>
				Swap your base URL to{' '}
				<span className="font-brand">Tokenito</span> and add your unique{' '}
				<code className="font-mono text-foreground">x-proxy-token</code>{' '}
				in the CLI or your IDE extension.
			</>
		),
	},
	{
		title: 'Watch the dashboard',
		description:
			"Spend, tokens and budget populate in real time. Set caps and alerts whenever you're ready.",
	},
]

const spendBars = [
	{ height: 45, tone: 'bg-primary/35' },
	{ height: 68, tone: 'bg-primary/85' },
	{ height: 52, tone: 'bg-primary/35' },
	{ height: 88, tone: 'bg-primary/85' },
	{ height: 62, tone: 'bg-primary/60' },
	{ height: 96, tone: 'bg-primary' },
	{ height: 72, tone: 'bg-primary/60' },
]

export default function Home() {
	return (
		<main className="min-h-svh bg-background text-foreground">
			<header className="border-b">
				<nav className="flex h-20 w-full items-center justify-between px-8 lg:px-12">
					<div className="flex items-center gap-10">
						<Link href="/" className="flex items-center gap-3">
							<TokenitoIcon
								className="size-9"
								aria-hidden="true"
							/>
							<span className="font-brand text-xl font-semibold tracking-tight">
								Tokenito
							</span>
						</Link>

						<div className="hidden items-center gap-8 text-base font-medium text-muted-foreground md:flex">
							<Link
								href="#features"
								className="transition-colors hover:text-foreground"
							>
								Features
							</Link>
							<Link
								href="#how-it-works"
								className="transition-colors hover:text-foreground"
							>
								How it works
							</Link>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<Button variant="ghost" asChild>
							<Link href="/auth/login">Sign in</Link>
						</Button>
						<Button asChild>
							<Link href="/auth/sign-up">Start free</Link>
						</Button>
					</div>
				</nav>
			</header>

			<section className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
				<div className="flex max-w-2xl flex-col gap-9">
					<div className="flex flex-col gap-6">
						<h1 className="max-w-3xl text-5xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
							Every AI token, one line of spend
						</h1>
						<p className="max-w-xl text-xl leading-8 text-muted-foreground">
							Route your team through{' '}
							<span className="font-brand">Tokenito</span>&apos;s
							proxy and watch usage, cost and budget by person,
							model and project in real time.
						</p>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row">
						<Button size="lg" asChild>
							<Link href="/auth/sign-up">
								Start free
								<ArrowRight
									data-icon="inline-end"
									aria-hidden="true"
								/>
							</Link>
						</Button>
						<Button size="lg" variant="outline" asChild>
							<Link href="/auth/sign-up">Book a demo</Link>
						</Button>
					</div>
				</div>

				<div className="relative w-full">
					<div className="absolute inset-x-8 top-12 h-72 rounded-full bg-primary/10 blur-3xl" />
					<div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/10">
						<div className="flex h-11 items-center gap-2 border-b bg-muted/40 px-5">
							<span className="size-3 rounded-full bg-muted-foreground/20" />
							<span className="size-3 rounded-full bg-muted-foreground/20" />
							<span className="size-3 rounded-full bg-muted-foreground/20" />
						</div>

						<div className="flex flex-col gap-4 p-5 md:p-6">
							<div className="grid gap-4 sm:grid-cols-2">
								<Card className="rounded-lg shadow-none">
									<CardHeader>
										<CardDescription>
											This month
										</CardDescription>
										<CardTitle className="text-3xl font-semibold tracking-tight">
											$12,480
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm font-medium text-primary">
											+8.2% vs last
										</p>
									</CardContent>
								</Card>

								<Card className="rounded-lg shadow-none">
									<CardHeader>
										<CardDescription>
											Budget used
										</CardDescription>
										<CardTitle className="text-3xl font-semibold tracking-tight">
											62%
										</CardTitle>
									</CardHeader>
									<CardContent>
										<Progress value={62} className="h-2" />
									</CardContent>
								</Card>
							</div>

							<Card className="rounded-lg shadow-none">
								<CardHeader>
									<CardDescription>
										Spend, last 7 days
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex h-40 items-end gap-3">
										{spendBars.map((bar, index) => (
											<div
												key={index}
												className="flex h-full flex-1 items-end"
											>
												<div
													className={`w-full rounded-t-md ${bar.tone}`}
													style={{
														height: `${bar.height}%`,
													}}
												/>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							<Item variant="outline" className="bg-card">
								<ItemMedia>
									<Avatar>
										<AvatarFallback className="text-xs font-semibold">
											AK
										</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle className="font-semibold">
										claude-sonnet
									</ItemTitle>
								</ItemContent>
								<ItemActions>
									<span className="font-mono text-sm font-semibold">
										$3,120
									</span>
								</ItemActions>
							</Item>
						</div>
					</div>
				</div>
			</section>

			<section id="features" className="border-t bg-muted/30">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 lg:px-8">
					<div className="flex max-w-3xl flex-col items-center gap-4 text-center">
						<p className="text-sm font-semibold text-primary">
							Features
						</p>
						<h2 className="text-4xl font-bold tracking-tight whitespace-nowrap sm:text-5xl">
							Cost control, without the spreadsheet
						</h2>
						<p className="text-lg whitespace-nowrap text-muted-foreground">
							Everything a platform team needs to see, split and
							cap AI spend across the whole org.
						</p>
					</div>

					<div className="mt-16 grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{features.map(({ icon: Icon, title, description }) => (
							<Card
								key={title}
								className="rounded-2xl border shadow-none ring-0"
							>
								<CardHeader>
									<div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-primary/10">
										<Icon
											className="size-5 text-primary"
											aria-hidden="true"
										/>
									</div>
									<CardTitle className="text-lg font-semibold">
										{title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{description}
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section id="how-it-works" className="border-t">
				<div className="mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 lg:px-8">
					<div className="flex max-w-3xl flex-col items-center gap-4 text-center">
						<p className="text-sm font-semibold text-primary">
							How it works
						</p>
						<h2 className="text-4xl font-bold tracking-tight whitespace-nowrap sm:text-5xl">
							Live in under two minutes
						</h2>
						<p className="max-w-xl text-lg text-muted-foreground text-balance">
							No SDK to install, no code to rewrite. Change one
							base URL and you&apos;re tracking.
						</p>
					</div>

					<div className="relative mt-20 w-full">
						<div className="absolute top-5 right-[16.6667%] left-[16.6667%] hidden h-px bg-border sm:block" />
						<div className="relative grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
							{steps.map((step, index) => (
								<div
									key={step.title}
									className="flex flex-col items-center gap-4 text-center"
								>
									<span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
										{index + 1}
									</span>
									<div className="flex flex-col gap-2">
										<h3 className="text-lg font-semibold">
											{step.title}
										</h3>
										<p className="text-sm text-muted-foreground">
											{step.description}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<footer className="border-t bg-muted/30">
				<div className="flex w-full items-center justify-between px-4 py-4">
					<div className="flex items-center gap-2">
						<Link href="/" className="flex items-center gap-2">
							<TokenitoIcon
								className="size-6"
								aria-hidden="true"
							/>
							<span className="font-brand text-sm font-semibold tracking-tight">
								Tokenito
							</span>
						</Link>
						<span className="text-sm text-muted-foreground">
							©{' '}
							<span className="font-brand">
								2026 Tokenito, Inc.
							</span>
						</span>
					</div>

					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" asChild>
							<Link
								href="https://www.linkedin.com/in/tom-l-hotellier/"
								aria-label="LinkedIn"
								target="_blank"
								rel="noopener noreferrer"
							>
								<LinkedinIcon aria-hidden="true" />
							</Link>
						</Button>
						<Button variant="ghost" size="icon" asChild>
							<Link
								href="https://github.com/TomitoBrees"
								aria-label="GitHub"
								target="_blank"
								rel="noopener noreferrer"
							>
								<GithubIcon aria-hidden="true" />
							</Link>
						</Button>
					</div>
				</div>
			</footer>
		</main>
	)
}

function LinkedinIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.56V9h3.554v11.452z" />
		</svg>
	)
}

function GithubIcon(props: React.ComponentProps<'svg'>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.092-.647.35-1.088.636-1.339-2.221-.253-4.556-1.113-4.556-4.951 0-1.093.39-1.987 1.029-2.687-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.594 1.028 2.687 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"
			/>
		</svg>
	)
}
