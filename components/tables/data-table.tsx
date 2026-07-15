'use client'

import {
	formatCalls,
	formatCurrency,
	formatPercent,
	formatTokens,
} from '@/components/data-cards/usage-metrics'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDashboardPeriod } from '../dashboard/dashboard-period-context'

const PLACEHOLDER_SHARE = 5.5

function getInitials(name: string | null): string {
	if (!name) return '?'

	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const cardClassName = 'border border-border shadow-sm ring-0'

function DataTableSkeleton() {
	return (
		<Card className={cardClassName}>
			<CardHeader>
				<Skeleton className="h-5 w-32" />
			</CardHeader>
			<CardContent>
				<div className="overflow-hidden rounded-lg border border-border">
					<div className="flex flex-col gap-3 p-4">
						{Array.from({ length: 8 }).map((_, index) => (
							<Skeleton key={index} className="h-10 w-full" />
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

export function DataTable() {
	const trpc = useTRPC()

	const { period } = useDashboardPeriod()

	const { data: topUsers, isLoading } = useQuery(
		trpc.usage.getTopUsers.queryOptions(period),
	)

	if (isLoading) {
		return <DataTableSkeleton />
	}

	return (
		<Card className={cardClassName}>
			<CardHeader>
				<CardTitle>Top consumers</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-hidden rounded-lg border border-border">
					<Table>
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								<TableHead className="px-4 py-3 text-muted-foreground">
									User
								</TableHead>
								<TableHead className="px-4 py-3 text-right text-muted-foreground">
									Calls
								</TableHead>
								<TableHead className="px-4 py-3 text-right text-muted-foreground">
									Tokens
								</TableHead>
								<TableHead className="px-4 py-3 text-right text-muted-foreground">
									Cost
								</TableHead>
								<TableHead className="w-36 px-4 py-3 pl-8 text-right text-muted-foreground">
									Share
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{topUsers?.map((user) => (
								<TableRow key={user.email}>
									<TableCell className="px-4 py-3">
										<div className="flex items-center gap-3">
											<Avatar size="sm">
												<AvatarFallback>
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col gap-0.5">
												<span className="font-medium">
													{user.name ?? 'Unknown'}
												</span>
												<span className="text-muted-foreground">
													{user.email}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="px-4 py-3 text-right tabular-nums">
										{formatCalls(user.totalCalls)}
									</TableCell>
									<TableCell className="px-4 py-3 text-right tabular-nums">
										{formatTokens(user.tokensConsumed)}
									</TableCell>
									<TableCell className="px-4 py-3 text-right font-semibold tabular-nums">
										{formatCurrency(
											Number(user.totalCostUsd),
										)}
									</TableCell>
									<TableCell className="px-4 py-3 pl-8">
										<div className="flex items-center gap-3">
											<Progress
												value={PLACEHOLDER_SHARE}
												className="h-1.5"
											/>
											<span className="w-12 shrink-0 text-right text-sm tabular-nums">
												{formatPercent(
													PLACEHOLDER_SHARE,
												)}
											</span>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}
