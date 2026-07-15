'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

import {
	DASHBOARD_PERIODS,
	type DashboardPeriod,
	useDashboardPeriod,
} from './dashboard-period-context'
import { UsageScopeSelector } from './usage-scope-selector'

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
	7: 'Last 7 days',
	30: 'Last 30 days',
}

function PeriodSelector() {
	const { period, setPeriod } = useDashboardPeriod()

	return (
		<Tabs
			value={String(period)}
			onValueChange={(value) =>
				setPeriod(Number(value) as DashboardPeriod)
			}
		>
			<TabsList>
				{DASHBOARD_PERIODS.map((days) => (
					<TabsTrigger key={days} value={String(days)}>
						{PERIOD_LABELS[days]}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

function AdminDashboardHeader() {
	const trpc = useTRPC()
	const { data: companyData, isLoading: companyLoading } = useQuery(
		trpc.company.getCompany.queryOptions(),
	)
	const { data: profile, isLoading: profileLoading } = useQuery(
		trpc.profile.getProfile.queryOptions(),
	)

	if (companyLoading || profileLoading) {
		return (
			<header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-4 py-4 lg:px-6">
				<Skeleton className="h-10 w-52" />
				<Skeleton className="h-8 w-52" />
			</header>
		)
	}

	if (!companyData?.company || !profile) return null

	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-4 py-4 lg:px-6">
			<UsageScopeSelector
				userName={profile.displayName ?? 'You'}
				companyName={companyData.company.name}
			/>
			<PeriodSelector />
		</header>
	)
}

function MemberDashboardHeader() {
	const { period } = useDashboardPeriod()

	return (
		<header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-4 py-4 lg:px-6">
			<div className="flex items-baseline gap-2">
				<h2 className="text-lg font-semibold tracking-tight">
					Usage Overview
				</h2>
				<span className="text-sm text-muted-foreground">
					{PERIOD_LABELS[period]}
				</span>
			</div>
			<PeriodSelector />
		</header>
	)
}

export function DashboardHeader() {
	const trpc = useTRPC()
	const { data: companyData, isLoading } = useQuery(
		trpc.company.getCompany.queryOptions(),
	)

	if (isLoading) {
		return (
			<header className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-4 py-4 lg:px-6">
				<Skeleton className="h-10 w-52" />
				<Skeleton className="h-8 w-52" />
			</header>
		)
	}

	const isAdmin = companyData?.role === 'owner'

	if (isAdmin) {
		return <AdminDashboardHeader />
	}

	return <MemberDashboardHeader />
}
