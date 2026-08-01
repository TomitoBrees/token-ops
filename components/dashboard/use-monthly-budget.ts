'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useDashboardPeriod } from './dashboard-period-context'

export type MonthlyBudgetMetrics = {
	totalCost: number
	currentMonthBudget: number
	usedPercent: number
	remaining: number
}

export function useMonthlyBudget() {
	const trpc = useTRPC()
	const { scope } = useDashboardPeriod()
	const { data: usage, isLoading: usageLoading } = useQuery(
		trpc.usage.getCurrentMonthUsage.queryOptions({ scope }),
	)
	const { data: memberBudget, isLoading: memberBudgetLoading } = useQuery({
		...trpc.company.getMemberBudget.queryOptions(),
		enabled: scope === 'personal',
	})
	const { data: companyBudget, isLoading: companyBudgetLoading } = useQuery({
		...trpc.company.getCompanyBudget.queryOptions(),
		enabled: scope === 'company',
	})
	const budget = scope === 'personal' ? memberBudget : companyBudget
	const budgetLoading =
		scope === 'personal' ? memberBudgetLoading : companyBudgetLoading

	const metrics = useMemo((): MonthlyBudgetMetrics | null => {
		if (!usage || budget?.budget == null) return null

		const totalCost = Number(usage.totalCostUsd)
		const currentMonthBudget = budget.budget
		const usedPercent =
			currentMonthBudget > 0
				? (totalCost / currentMonthBudget) * 100
				: 0

		return {
			totalCost,
			currentMonthBudget,
			usedPercent,
			remaining: Math.max(0, currentMonthBudget - totalCost),
		}
	}, [usage, budget?.budget])

	return { metrics, isLoading: usageLoading || budgetLoading }
}
