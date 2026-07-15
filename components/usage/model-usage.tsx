'use client'

import { useMemo } from 'react'

import {
	formatCalls,
	formatCurrency,
	formatPercent,
	formatTokens,
} from '@/components/data-cards/usage-metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDashboardPeriod } from '../dashboard/dashboard-period-context'

const MODEL_PROGRESS_COLORS = [
	'[&_[data-slot=progress-indicator]]:bg-chart-model-1',
	'[&_[data-slot=progress-indicator]]:bg-chart-model-2',
	'[&_[data-slot=progress-indicator]]:bg-chart-model-3',
] as const

const MODEL_DOT_COLORS = [
	'bg-chart-model-1',
	'bg-chart-model-2',
	'bg-chart-model-3',
] as const

const cardClassName = 'border border-border shadow-sm ring-0'

function formatModelName(model: string): string {
	const displayNames: Record<string, string> = {
		'claude-opus-4': 'Claude Opus 4',
		'claude-sonnet-4': 'Claude Sonnet',
		'claude-haiku': 'Claude Haiku',
		fable: 'Fable',
	}

	return displayNames[model] ?? model
}

type ModelUsageRowProps = {
	name: string
	cost: number
	sharePercent: number
	totalCalls: number
	tokensConsumed: number
	colorIndex: number
}

function ModelUsageRow({
	name,
	cost,
	sharePercent,
	totalCalls,
	tokensConsumed,
	colorIndex,
}: ModelUsageRowProps) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-4">
				<div className="flex min-w-0 items-center gap-2">
					<span
						className={cn(
							'size-2 shrink-0 rounded-full',
							MODEL_DOT_COLORS[colorIndex],
						)}
					/>
					<span className="truncate font-medium">{name}</span>
				</div>
				<p className="shrink-0 text-sm tabular-nums">
					<span className="font-semibold">
						{formatCurrency(cost)}
					</span>
					<span className="text-muted-foreground">
						{' '}
						· {formatPercent(sharePercent)}
					</span>
				</p>
			</div>
			<Progress
				value={sharePercent}
				className={cn('h-1.5', MODEL_PROGRESS_COLORS[colorIndex])}
			/>
			<p className="text-xs text-muted-foreground tabular-nums">
				{formatCalls(totalCalls)} calls · {formatTokens(tokensConsumed)}{' '}
				tokens
			</p>
		</div>
	)
}

function ModelUsageSkeleton() {
	return (
		<Card className={cardClassName}>
			<CardHeader>
				<Skeleton className="h-5 w-36" />
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{Array.from({ length: 3 }).map((_, index) => (
					<div key={index} className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-4">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-28" />
						</div>
						<Skeleton className="h-1.5 w-full rounded-full" />
						<Skeleton className="h-3 w-40" />
					</div>
				))}
			</CardContent>
		</Card>
	)
}

export function ModelUsage() {
	const trpc = useTRPC()

	const { period, scope } = useDashboardPeriod()
	const { data: topModels, isLoading } = useQuery(
		trpc.usage.listTopModelsByCost.queryOptions({
			period,
			scope,
		}),
	)

	const modelsWithShare = useMemo(() => {
		if (!topModels?.length) return []

		const totalCost = topModels.reduce(
			(sum, model) => sum + Number(model.totalCostUsd),
			0,
		)

		return topModels.map((model, index) => ({
			...model,
			cost: Number(model.totalCostUsd),
			sharePercent:
				totalCost > 0
					? (Number(model.totalCostUsd) / totalCost) * 100
					: 0,
			colorIndex: index % MODEL_DOT_COLORS.length,
		}))
	}, [topModels])

	if (isLoading) {
		return <ModelUsageSkeleton />
	}

	return (
		<Card className={cardClassName}>
			<CardHeader>
				<CardTitle>Usage by model</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				{modelsWithShare.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No model usage recorded for this period.
					</p>
				) : (
					modelsWithShare.map((model) => (
						<ModelUsageRow
							key={model.model}
							name={formatModelName(model.model)}
							cost={model.cost}
							sharePercent={model.sharePercent}
							totalCalls={model.totalCalls}
							tokensConsumed={model.tokensConsumed}
							colorIndex={model.colorIndex}
						/>
					))
				)}
			</CardContent>
		</Card>
	)
}
