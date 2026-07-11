'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import {
  buildCardMetrics,
  formatCalls,
  formatCurrency,
  formatPercent,
  formatTokens,
} from './usage-metrics'
import { useMemo } from 'react'
import { DataCard, DataCardProps, DataCardSkeleton } from './data-card'

import {
  ActivityIcon,
  AlertTriangleIcon,
  DatabaseIcon,
  EuroIcon,
  GaugeIcon,
} from 'lucide-react'

export function CardsSection() {
  const trpc = useTRPC()

  const { data: usage, isLoading: usageLoading } = useQuery(
    trpc.usage.getUsageOverview.queryOptions(),
  )

  const { data: budget, isLoading: budgetLoading } = useQuery(
    trpc.company.getCurrentMonthBudget.queryOptions(),
  )

  const isLoading = usageLoading || budgetLoading

  const metrics = useMemo(() => {
    if (!usage) return null
    return buildCardMetrics(usage, budget?.budget)
  }, [usage, budget?.budget])

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
          icon: EuroIcon,
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
          : cardsData?.map((card) => <DataCard key={card.title} {...card} />)}
      </div>
    </section>
  )
}
