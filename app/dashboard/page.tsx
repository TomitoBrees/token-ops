import { DashboardContent } from '@/components/dashboard/dashboard-content'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardPeriodProvider } from '@/components/dashboard/dashboard-period-context'
import { AppSidebar } from '@/components/nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function Page() {
	const queryClient = getQueryClient()

	await queryClient.prefetchQuery(trpc.company.getCompany.queryOptions())
	await queryClient.prefetchQuery(trpc.profile.getProfile.queryOptions())
	await queryClient.prefetchQuery(
		trpc.usage.getCurrentMonthUsage.queryOptions({ scope: 'personal' }),
	)
	await queryClient.prefetchQuery(
		trpc.usage.getDailyUsage.queryOptions({
			period: 30,
			scope: 'personal',
		}),
	)
	await queryClient.prefetchQuery(
		trpc.usage.listTopConsumersByUsage.queryOptions(30),
	)
	await queryClient.prefetchQuery(
		trpc.usage.listTopModelsByCost.queryOptions({
			period: 30,
			scope: 'personal',
		}),
	)
	await queryClient.prefetchQuery(trpc.usage.isFirstUse.queryOptions())
	await queryClient.prefetchQuery(
		trpc.company.getMemberBudget.queryOptions(),
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
							<DashboardContent />
						</HydrationBoundary>
					</div>
				</DashboardPeriodProvider>
			</SidebarInset>
		</SidebarProvider>
	)
}
