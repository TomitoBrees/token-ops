'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { buildCardMetrics } from './usage-metrics'
import { useMemo } from 'react'

export function CardsSection() {
  const trpc = useTRPC()

  const {
    data: usage,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery(trpc.usage.getUsageOverview.queryOptions())

  const {
    data: budget,
    isLoading: budgetLoading,
    error: budgetError,
  } = useQuery(trpc.company.getCurrentMonthBudget.queryOptions())

  const metrics = useMemo(() => {
    if (!usage) return null
    return buildCardMetrics(usage)
  }, [usage])

  return (
    <div>
      <h1>Cards Section</h1>
    </div>
  )
}
