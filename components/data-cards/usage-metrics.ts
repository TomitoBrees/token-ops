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

const numberFormat = new Intl.NumberFormat('de-DE')

export function formatCalls(value: number): string {
  return numberFormat.format(value)
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) {
    return `${numberFormat.format(Math.round((value / 1_000_000) * 10) / 10)} M`
  }
  if (value >= 1_000) {
    return `${numberFormat.format(Math.round((value / 1_000) * 10) / 10)} K`
  }
  return formatCalls(value)
}

export function formatCurrency(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${numberFormat.format(Math.round(value * 10) / 10)} %`
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
