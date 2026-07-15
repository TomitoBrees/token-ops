'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
	buildCardMetrics,
	buildUsageOverview,
} from '../data-cards/usage-metrics'

export function useDashboardMetrics(period: 7 | 30) {
	const trpc = useTRPC()
	const { data: usage, isLoading: usageLoading } = useQuery(
		trpc.usage.getUsageTrend.queryOptions(period),
	)
	const metrics = useMemo(
		() => (usage ? buildCardMetrics(buildUsageOverview(usage)) : null),
		[usage],
	)
	return { metrics, isLoading: usageLoading }
}
