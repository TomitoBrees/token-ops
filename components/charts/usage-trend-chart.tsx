'use client'

import * as React from 'react'
import { Area, AreaChart, XAxis } from 'recharts'

import { buildCumulativeTrendData } from '@/components/data-cards/usage-metrics'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDashboardPeriod } from '../dashboard/dashboard-period-context'

export const description = 'A simple area chart'

const chartConfig = {
	cost: {
		label: 'Cost ($)',
		color: 'var(--chart-cost)',
	},
} satisfies ChartConfig

export function UsageTrendChart() {
	const trpc = useTRPC()
	const { period, scope } = useDashboardPeriod()

	const { data: usage, isLoading: usageLoading } = useQuery(
		trpc.usage.getDailyUsage.queryOptions({
			period,
			scope,
		}),
	)

	const chartData = React.useMemo(() => {
		const trendData = buildCumulativeTrendData(period, usage ?? [])

		if (period === 7) {
			return trendData.map(({ date, dailyCostUsd }) => ({
				date,
				cost: dailyCostUsd,
			}))
		}

		return trendData.map(({ date, cumulativeCostUsd }) => ({
			date,
			cost: cumulativeCostUsd,
		}))
	}, [usage, period])

	return (
		<Card className="pt-0">
			<CardHeader className="flex items-center gap-2 space-y-0 py-3 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<CardTitle>Usage trend</CardTitle>
					<CardDescription>
						{period === 7
							? 'Daily spend - Last 7 days'
							: 'Cumulative spend - Last 30 days'}
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:px-6 ">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[250px] w-full"
				>
					<AreaChart data={chartData}>
						<defs>
							<linearGradient
								id="fillCost"
								x1="0"
								y1="0"
								x2="0"
								y2="1"
							>
								<stop
									offset="5%"
									stopColor="var(--color-cost)"
									stopOpacity={0.8}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-cost)"
									stopOpacity={0.4}
								/>
							</linearGradient>
						</defs>
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value)
								return date.toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
								})
							}}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="line"
									nameKey="cost"
									labelFormatter={(value) => {
										return new Date(
											value,
										).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										})
									}}
								/>
							}
						/>
						<Area
							dataKey="cost"
							type="linear"
							fill="url(#fillCost)"
							stroke="var(--color-cost)"
							strokeWidth={2.5}
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}
