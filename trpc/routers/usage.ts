import { companyUsageOverview } from '@/drizzle/schema'
import { createTRPCRouter, protectedProcedure } from '../init'
import { getUserCompanyMembership } from '../lib/membership'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

export const usageRouter = createTRPCRouter({
  getUsageOverview: protectedProcedure.query(async ({ ctx }) => {
    const userMembership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
    if (!userMembership || !userMembership.company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'The current user doesnt have a company',
      })
    }

    const usageOverviewData = await ctx.db.query.companyUsageOverview.findFirst(
      {
        where: eq(companyUsageOverview.companyId, userMembership.company.id),
      },
    )
    if (!usageOverviewData) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No usage found for this company',
      })
    }

    const { totalCalls, tokensConsumed, totalCostUsd } = usageOverviewData

    return {
      totalCalls,
      tokensConsumed,
      totalCostUsd,
    }
  }),
})
