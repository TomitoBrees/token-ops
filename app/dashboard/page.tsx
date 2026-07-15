import { BudgetChart } from '@/components/charts/budget-chart'
import { UsageTrendChart } from '@/components/charts/usage-trend-chart'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardPeriodProvider } from '@/components/dashboard/dashboard-period-context'
import { CardsSection } from '@/components/data-cards/cards-section'
import { DataTable } from '@/components/tables/data-table'
import { ModelUsage } from '@/components/usage/model-usage'
import { AppSidebar } from '@/components/nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function Page() {
	const queryClient = getQueryClient()

	await queryClient.prefetchQuery(trpc.usage.getCurrentMonthUsage.queryOptions())
	await queryClient.prefetchQuery(trpc.usage.getUsageTrend.queryOptions(30))
	await queryClient.prefetchQuery(trpc.usage.getTopUsers.queryOptions(30))
	await queryClient.prefetchQuery(trpc.usage.getTopModels.queryOptions(30))
	await queryClient.prefetchQuery(
		trpc.company.getCurrentMonthBudget.queryOptions(),
	)

	return (
		<SidebarProvider
			style={
				{
					'--sidebar-width': 'calc(var(--spacing) * 72)',
					'--header-height': 'calc(var(--spacing) * 12)',
				} as React.CSSProperties
			}
		>
			<AppSidebar variant="sidebar" />
			<SidebarInset className="bg-muted">
				<DashboardPeriodProvider>
					<DashboardHeader />
					<div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
						<HydrationBoundary state={dehydrate(queryClient)}>
							<CardsSection />
						</HydrationBoundary>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<UsageTrendChart />
						</HydrationBoundary>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
								<div className="xl:col-span-2">
									<ModelUsage />
								</div>
								<div className="xl:col-span-1">
									<BudgetChart />
								</div>
							</div>
						</HydrationBoundary>
						<HydrationBoundary state={dehydrate(queryClient)}>
							<DataTable />
						</HydrationBoundary>
					</div>
				</DashboardPeriodProvider>
			</SidebarInset>
		</SidebarProvider>
	)
}
