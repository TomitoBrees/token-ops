'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { buildCardMetrics } from '../data-cards/usage-metrics'

export function useDashboardMetrics() {
	const trpc = useTRPC()
	const { data: usage, isLoading: usageLoading } = useQuery(
		trpc.usage.getUsageOverview.queryOptions(),
	)
	const { data: budget, isLoading: budgetLoading } = useQuery(
		trpc.company.getCurrentMonthBudget.queryOptions(),
	)
	const metrics = useMemo(
		() => (usage ? buildCardMetrics(usage, budget?.budget) : null),
		[usage, budget?.budget],
	)
	return { metrics, isLoading: usageLoading || budgetLoading }
}
