'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
	DASHBOARD_PERIODS,
	type DashboardPeriod,
	useDashboardPeriod,
} from './dashboard-period-context'

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
	7: 'Last 7 days',
	30: 'Last 30 days',
}

export function DashboardHeader() {
	const { period, setPeriod } = useDashboardPeriod()

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
		</header>
	)
}
