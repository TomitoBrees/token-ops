type UsageOverview = {
  totalCalls: number
  tokensConsumed: number
  totalCostUsd: string
}

type Budget = {
  amount: number
}

export type CardMetrics = {
  numberOfCalls: number
  tokensConsumed: number
  totalCost: number
  costPerCall: number
  currentMonthBudget?: number
  budgetUsedPercent?: number
}

export function buildCardMetrics(
  usage: UsageOverview,
  budget?: number,
): CardMetrics {
  const totalCost = Number(usage.totalCostUsd)
  const totalCalls = Number(usage.totalCalls)

  const costPerCall = totalCalls > 0 ? totalCost / totalCalls : 0
  if (!budget) {
    return {
      numberOfCalls: totalCalls,
      tokensConsumed: usage.tokensConsumed,
      totalCost,
      costPerCall,
    }
  }

  const budgetUsedPercent =
    budget > 0 ? Math.round((totalCost / budget) * 100) : 0

  return {
    numberOfCalls: totalCalls,
    tokensConsumed: usage.tokensConsumed,
    totalCost,
    costPerCall,
    currentMonthBudget: budget,
    budgetUsedPercent,
  }
}
