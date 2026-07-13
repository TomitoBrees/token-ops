import { UsageTrendChart } from '@/components/charts/usage-trend-chart'
import { CardsSection } from '@/components/data-cards/cards-section'
import { AppSidebar } from '@/components/nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function Page() {
	const queryClient = getQueryClient()

	await queryClient.prefetchQuery(trpc.usage.getUsageOverview.queryOptions())
	await queryClient.prefetchQuery(trpc.usage.getUsageTrend.queryOptions(30))
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
			<AppSidebar variant="inset" />
			<SidebarInset>
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
						<HydrationBoundary state={dehydrate(queryClient)}>
							<CardsSection />
						</HydrationBoundary>
						<div>
							<HydrationBoundary state={dehydrate(queryClient)}>
								<UsageTrendChart />
							</HydrationBoundary>
						</div>
						{/* TODO: Add data table */}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
