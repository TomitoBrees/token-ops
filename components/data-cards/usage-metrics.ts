type UsageOverview = {
	totalCalls: number
	tokensConsumed: number
	totalCostUsd: string
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
	const formatted = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(Math.abs(value))
	const prefix = value < 0 ? '-$ ' : '$ '
	return `${prefix}${formatted}`
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

export type UsageTrendDay = {
	date: string
	totalCalls: number
	tokensConsumed: number
	totalCostUsd: string
}

export type CumulativeTrendDay = {
	date: string
	dailyCostUsd: number
	cumulativeCostUsd: number
}

export function buildCumulativeTrendData(
	days: number,
	rows: UsageTrendDay[],
): CumulativeTrendDay[] {
	const costByDate = new Map(
		rows.map((row) => [row.date, Number(row.totalCostUsd)]),
	)

	const start = new Date()
	start.setUTCDate(start.getUTCDate() - (days - 1))

	let cumulativeCostUsd = 0
	const result: CumulativeTrendDay[] = []

	for (let i = 0; i < days; i++) {
		const date = new Date(start)
		date.setUTCDate(start.getUTCDate() + i)
		const dateStr = date.toISOString().slice(0, 10)
		const dailyCostUsd = costByDate.get(dateStr) ?? 0
		cumulativeCostUsd += dailyCostUsd
		result.push({ date: dateStr, dailyCostUsd, cumulativeCostUsd })
	}

	return result
}
