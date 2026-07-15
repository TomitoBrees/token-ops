'use client'

import {
	Label,
	PolarAngleAxis,
	PolarRadiusAxis,
	RadialBar,
	RadialBarChart,
} from 'recharts'

import {
	formatCurrency,
	formatPercent,
} from '@/components/data-cards/usage-metrics'
import { useMonthlyBudget } from '@/components/dashboard/use-monthly-budget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const cardClassName = 'h-full border border-border shadow-sm ring-0'

const chartConfig = {
	used: {
		label: 'Used',
	},
	budget: {
		label: 'Budget used',
		color: 'var(--warning)',
	},
} satisfies ChartConfig

type BudgetMetricProps = {
	label: string
	value: string
	className?: string
}

function BudgetMetric({ label, value, className }: BudgetMetricProps) {
	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="text-lg font-semibold tracking-tight">{value}</p>
		</div>
	)
}

function BudgetChartSkeleton() {
	return (
		<Card className={cardClassName}>
			<CardHeader>
				<Skeleton className="h-5 w-32" />
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-6">
					<Skeleton className="size-36 shrink-0 rounded-full" />
					<div className="flex flex-1 flex-col gap-6">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-12 w-full" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

type BudgetRadialProps = {
	percent: number
}

function BudgetRadial({ percent }: BudgetRadialProps) {
	const clampedPercent = Math.min(100, Math.max(0, percent))
	const chartData = [
		{
			segment: 'budget',
			used: clampedPercent,
			fill: 'var(--color-budget)',
		},
	]

	return (
		<ChartContainer
			config={chartConfig}
			className="mx-auto aspect-square size-36 shrink-0"
		>
			<RadialBarChart
				data={chartData}
				startAngle={90}
				endAngle={-270}
				innerRadius={54}
				outerRadius={70}
			>
				<PolarAngleAxis
					type="number"
					domain={[0, 100]}
					tick={false}
					tickLine={false}
					axisLine={false}
				/>
				<RadialBar dataKey="used" background cornerRadius={10} />
				<PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
					<Label
						content={({ viewBox }) => {
							if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
								return (
									<text
										x={viewBox.cx}
										y={viewBox.cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={viewBox.cx}
											y={viewBox.cy}
											className="fill-warning text-2xl font-semibold"
										>
											{formatPercent(percent)}
										</tspan>
										<tspan
											x={viewBox.cx}
											y={(viewBox.cy ?? 0) + 20}
											className="fill-muted-foreground text-sm"
										>
											used
										</tspan>
									</text>
								)
							}
						}}
					/>
				</PolarRadiusAxis>
			</RadialBarChart>
		</ChartContainer>
	)
}

export function BudgetChart() {
	const { metrics, isLoading } = useMonthlyBudget()

	if (isLoading) {
		return <BudgetChartSkeleton />
	}

	if (!metrics) {
		return null
	}

	const { totalCost, currentMonthBudget, usedPercent, remaining } = metrics

	return (
		<Card className={cardClassName}>
			<CardHeader>
				<CardTitle>Monthly budget</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-6">
					<BudgetRadial percent={usedPercent} />
					<div className="flex flex-1 flex-col gap-3">
						<BudgetMetric
							label="Spent"
							value={formatCurrency(totalCost)}
						/>
						<BudgetMetric
							label="Remaining"
							value={formatCurrency(remaining)}
						/>
						<BudgetMetric
							label="Budget"
							value={formatCurrency(currentMonthBudget)}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
