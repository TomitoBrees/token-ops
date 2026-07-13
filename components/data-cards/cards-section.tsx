'use client'

import {
	formatCalls,
	formatCurrency,
	formatPercent,
	formatTokens,
} from './usage-metrics'
import { DataCard, DataCardProps, DataCardSkeleton } from './data-card'

import {
	ActivityIcon,
	DatabaseIcon,
	DollarSignIcon,
	GaugeIcon,
} from 'lucide-react'
import { useDashboardMetrics } from '../dashboard/use-dashboard-metrics'

export function CardsSection() {
	const { metrics, isLoading } = useDashboardMetrics()

	const cardsData: DataCardProps[] | null = metrics
		? [
				{
					title: 'Number of calls',
					value: formatCalls(metrics.numberOfCalls),
					description: 'API requests this period',
					icon: ActivityIcon,
				},
				{
					title: 'Tokens consumed',
					value: formatTokens(metrics.tokensConsumed),
					description: 'Input + output combined',
					icon: DatabaseIcon,
				},
				{
					title: 'Total cost',
					value: formatCurrency(metrics.totalCost),
					description: `${formatCurrency(metrics.costPerCall, 4)} per call`,
					icon: DollarSignIcon,
				},
			]
		: null

	if (
		cardsData &&
		metrics?.budgetUsedPercent != null &&
		metrics.currentMonthBudget
	) {
		cardsData.push({
			variant: 'progress',
			title: 'Budget used',
			value: formatPercent(metrics.budgetUsedPercent),
			description: `${formatCurrency(metrics.totalCost)} of ${formatCurrency(metrics.currentMonthBudget)} this month`,
			icon: GaugeIcon,
			progress: metrics.budgetUsedPercent,
		})
	}

	return (
		<section className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{isLoading
					? Array.from({ length: 4 }).map((_, index) => (
							<DataCardSkeleton key={index} />
						))
					: cardsData?.map((card) => (
							<DataCard key={card.title} {...card} />
						))}
			</div>
		</section>
	)
}
