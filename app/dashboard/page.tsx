import { CardsSection } from '@/components/data-cards/cards-section'
import { AppSidebar } from '@/components/nav/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useTRPC } from '@/trpc/client'
import { getQueryClient, trpc } from '@/trpc/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function Page() {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery(trpc.usage.getUsageOverview.queryOptions())
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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <HydrationBoundary state={dehydrate(queryClient)}>
                <CardsSection />
              </HydrationBoundary>
              <div className="px-4 lg:px-6">{/* TODO: Add chart */}</div>
              {/* TODO: Add data table */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
