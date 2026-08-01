'use client'

import { BudgetChart } from '@/components/charts/budget-chart'
import { UsageTrendChart } from '@/components/charts/usage-trend-chart'
import { CardsSection } from '@/components/data-cards/cards-section'
import { DataTable } from '@/components/tables/data-table'
import { ModelUsage } from '@/components/usage/model-usage'

import { ConnectIdeBanner } from './connect-ide-banner'
import { useDashboardPeriod } from './dashboard-period-context'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

export function DashboardContent() {
	const { scope } = useDashboardPeriod()
	const trpc = useTRPC()
	const { data: isFirstUse } = useQuery(trpc.usage.isFirstUse.queryOptions())

	return (
		<>
			{scope === 'personal' && isFirstUse && <ConnectIdeBanner />}
			<CardsSection />
			<UsageTrendChart />
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="xl:col-span-2">
					<ModelUsage />
				</div>
				<div className="xl:col-span-1">
					<BudgetChart />
				</div>
			</div>
			{scope === 'company' && <DataTable />}
		</>
	)
}
