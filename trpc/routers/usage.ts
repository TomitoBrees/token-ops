import { companyMembers, profiles, usageDaily } from '@/drizzle/schema'
import { createTRPCRouter, protectedProcedure } from '../init'
import { getUserCompanyMembership } from '../lib/membership'
import { and, asc, count, desc, eq, gte, lte, sum } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const usageRouter = createTRPCRouter({
	getDailyUsage: protectedProcedure
		.input(
			z.object({
				period: z.number(),
				scope: z.enum(['company', 'personal']).default('personal'),
			}),
		)
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

			const effectiveScope =
				input.scope === 'company' && membership.role === 'owner'
					? 'company'
					: 'personal'

			const start = new Date()
			start.setUTCDate(start.getUTCDate() - (input.period - 1))
			const startDate = start.toISOString().slice(0, 10)

			const scopeFilter =
				effectiveScope === 'company'
					? eq(usageDaily.companyId, membership.company.id)
					: eq(usageDaily.companyMemberId, membership.membership.id)

			const usages = await ctx.db
				.select({
					date: usageDaily.date,
					totalCalls: sum(usageDaily.totalCalls),
					tokensConsumed: sum(usageDaily.tokensConsumed),
					totalCostUsd: sum(usageDaily.totalCostUsd),
				})
				.from(usageDaily)
				.where(and(scopeFilter, gte(usageDaily.date, startDate)))
				.groupBy(usageDaily.date)
				.orderBy(asc(usageDaily.date))

			return usages.map(
				({ date, totalCalls, tokensConsumed, totalCostUsd }) => ({
					date,
					totalCalls: Number(totalCalls ?? 0),
					tokensConsumed: Number(tokensConsumed ?? 0),
					totalCostUsd: totalCostUsd ?? '0',
				}),
			)
		}),

	listTopModelsByCost: protectedProcedure
		.input(
			z.object({
				period: z.number(),
				scope: z.enum(['company', 'personal']).default('personal'),
			}),
		)
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

			const effectiveScope =
				input.scope === 'company' && membership.role === 'owner'
					? 'company'
					: 'personal'

			const start = new Date()
			start.setUTCDate(start.getUTCDate() - (input.period - 1))
			const startDate = start.toISOString().slice(0, 10)

			const scopeFilter =
				effectiveScope === 'company'
					? eq(usageDaily.companyId, membership.company.id)
					: eq(usageDaily.companyMemberId, membership.membership.id)

			const topModels = await ctx.db
				.select({
					model: usageDaily.model,
					totalCalls: sum(usageDaily.totalCalls),
					tokensConsumed: sum(usageDaily.tokensConsumed),
					totalCostUsd: sum(usageDaily.totalCostUsd),
				})
				.from(usageDaily)
				.where(and(scopeFilter, gte(usageDaily.date, startDate)))
				.groupBy(usageDaily.model)
				.orderBy(desc(sum(usageDaily.totalCostUsd)))
				.limit(3)
			return topModels.map(
				({ model, totalCalls, tokensConsumed, totalCostUsd }) => ({
					model,
					totalCalls: Number(totalCalls ?? 0),
					tokensConsumed: Number(tokensConsumed ?? 0),
					totalCostUsd,
				}),
			)
		}),

	listTopConsumersByUsage: protectedProcedure
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

			const topUsers = await ctx.db
				.select({
					name: profiles.displayName,
					email: profiles.email,
					totalCalls: sum(usageDaily.totalCalls),
					tokensConsumed: sum(usageDaily.tokensConsumed),
					totalCostUsd: sum(usageDaily.totalCostUsd),
				})
				.from(usageDaily)
				.innerJoin(
					companyMembers,
					eq(usageDaily.companyMemberId, companyMembers.id),
				)
				.innerJoin(profiles, eq(companyMembers.userId, profiles.id))
				.where(
					and(
						eq(usageDaily.companyId, membership.company.id),
						gte(usageDaily.date, startDate),
					),
				)
				.groupBy(
					usageDaily.companyMemberId,
					profiles.displayName,
					profiles.email,
				)
				.orderBy(desc(sum(usageDaily.totalCostUsd)))
				.limit(8)

			return topUsers.map(
				({
					name,
					email,
					totalCalls,
					tokensConsumed,
					totalCostUsd,
				}) => ({
					name,
					email,
					totalCalls: Number(totalCalls ?? 0),
					tokensConsumed: Number(tokensConsumed ?? 0),
					totalCostUsd,
				}),
			)
		}),

	getCurrentMonthUsage: protectedProcedure
		.input(
			z.object({
				scope: z.enum(['company', 'personal']).default('personal'),
			}),
		)
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

			const effectiveScope =
				input.scope === 'company' && membership.role === 'owner'
					? 'company'
					: 'personal'

			const today = new Date()
			const year = today.getFullYear()
			const month = today.getMonth()
			const monthStr = String(month + 1).padStart(2, '0')
			const startDate = `${year}-${monthStr}-01`
			const endDate = `${year}-${monthStr}-${String(today.getDate()).padStart(2, '0')}`

			const scopeFilter =
				effectiveScope === 'company'
					? eq(usageDaily.companyId, membership.company.id)
					: eq(usageDaily.companyMemberId, membership.membership.id)

			const [usage] = await ctx.db
				.select({
					totalCalls: sum(usageDaily.totalCalls),
					tokensConsumed: sum(usageDaily.tokensConsumed),
					totalCostUsd: sum(usageDaily.totalCostUsd),
				})
				.from(usageDaily)
				.where(
					and(
						scopeFilter,
						gte(usageDaily.date, startDate),
						lte(usageDaily.date, endDate),
					),
				)

			return {
				totalCalls: Number(usage?.totalCalls ?? 0),
				tokensConsumed: Number(usage?.tokensConsumed ?? 0),
				totalCostUsd: usage?.totalCostUsd ?? '0',
			}
		}),
	isFirstUse: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		const usageCount = await ctx.db
			.select({ count: count() })
			.from(usageDaily)
			.where(eq(usageDaily.companyMemberId, membership.membership.id))

		return usageCount[0].count === 0
	}),
})
