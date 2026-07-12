import { companyUsageDaily, companyUsageOverview } from '@/drizzle/schema'
import { createTRPCRouter, protectedProcedure } from '../init'
import { getUserCompanyMembership } from '../lib/membership'
import { and, asc, eq, gte } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const usageRouter = createTRPCRouter({
	getUsageOverview: protectedProcedure.query(async ({ ctx }) => {
		const userMembership = await getUserCompanyMembership(
			ctx.db,
			ctx.user.sub,
		)
		if (!userMembership || !userMembership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		const usageOverviewData =
			await ctx.db.query.companyUsageOverview.findFirst({
				where: eq(
					companyUsageOverview.companyId,
					userMembership.company.id,
				),
			})
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

	getUsageTrend: protectedProcedure
		.input(z.number())
		.query(async ({ ctx, input }) => {
			const membership = await getUserCompanyMembership(
				ctx.db,
				ctx.user.sub,
			)

			if (!membership || !membership.company) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'The current user doesnt have a company',
				})
			}

			const start = new Date()
			start.setUTCDate(start.getUTCDate() - (input - 1))
			const startDate = start.toISOString().slice(0, 10)

			const usages = await ctx.db
				.select()
				.from(companyUsageDaily)
				.where(
					and(
						eq(companyUsageDaily.companyId, membership.company.id),
						gte(companyUsageDaily.date, startDate),
					),
				)
				.orderBy(asc(companyUsageDaily.date))

			return usages.map(
				({ date, totalCalls, tokensConsumed, totalCostUsd }) => ({
					date,
					totalCalls,
					tokensConsumed,
					totalCostUsd,
				}),
			)
		}),
})
