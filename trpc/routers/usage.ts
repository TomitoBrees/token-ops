import {
	companyMembers,
	companyUsageDaily,
	memberUsageDaily,
	companyModelUsageDaily,
	profiles,
	memberModelUsageDaily,
} from '@/drizzle/schema'
import { createTRPCRouter, protectedProcedure } from '../init'
import { getUserCompanyMembership } from '../lib/membership'
import { and, asc, desc, eq, gte, lte, sum } from 'drizzle-orm'
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

			const usages =
				effectiveScope === 'company'
					? await ctx.db
							.select()
							.from(companyUsageDaily)
							.where(
								and(
									eq(
										companyUsageDaily.companyId,
										membership.company.id,
									),
									gte(companyUsageDaily.date, startDate),
								),
							)
							.orderBy(asc(companyUsageDaily.date))
					: await ctx.db
							.select()
							.from(memberUsageDaily)
							.where(
								and(
									eq(
										memberUsageDaily.companyMemberId,
										membership.membership.id,
									),
									gte(memberUsageDaily.date, startDate),
								),
							)
							.orderBy(asc(memberUsageDaily.date))

			return usages.map(
				({ date, totalCalls, tokensConsumed, totalCostUsd }) => ({
					date,
					totalCalls,
					tokensConsumed,
					totalCostUsd,
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

			const topModels =
				effectiveScope === 'company'
					? await ctx.db
							.select({
								model: companyModelUsageDaily.model,
								totalCalls: sum(
									companyModelUsageDaily.totalCalls,
								),
								tokensConsumed: sum(
									companyModelUsageDaily.tokensConsumed,
								),
								totalCostUsd: sum(
									companyModelUsageDaily.totalCostUsd,
								),
							})
							.from(companyModelUsageDaily)
							.where(
								and(
									eq(
										companyModelUsageDaily.companyId,
										membership.company.id,
									),
									gte(companyModelUsageDaily.date, startDate),
								),
							)
							.groupBy(companyModelUsageDaily.model)
							.orderBy(
								desc(sum(companyModelUsageDaily.totalCostUsd)),
							)
							.limit(3)
					: await ctx.db
							.select({
								model: memberModelUsageDaily.model,
								totalCalls: sum(
									memberModelUsageDaily.totalCalls,
								),
								tokensConsumed: sum(
									memberModelUsageDaily.tokensConsumed,
								),
								totalCostUsd: sum(
									memberModelUsageDaily.totalCostUsd,
								),
							})
							.from(memberModelUsageDaily)
							.where(
								and(
									eq(
										memberModelUsageDaily.companyMemberId,
										membership.membership.id,
									),
									gte(memberModelUsageDaily.date, startDate),
								),
							)
							.groupBy(memberModelUsageDaily.model)
							.orderBy(
								desc(sum(memberModelUsageDaily.totalCostUsd)),
							)
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
					totalCalls: sum(memberUsageDaily.totalCalls),
					tokensConsumed: sum(memberUsageDaily.tokensConsumed),
					totalCostUsd: sum(memberUsageDaily.totalCostUsd),
				})
				.from(memberUsageDaily)
				.innerJoin(
					companyMembers,
					eq(memberUsageDaily.companyMemberId, companyMembers.id),
				)
				.innerJoin(profiles, eq(companyMembers.userId, profiles.id))
				.where(
					and(
						eq(memberUsageDaily.companyId, membership.company.id),
						gte(memberUsageDaily.date, startDate),
					),
				)
				.groupBy(
					memberUsageDaily.companyMemberId,
					profiles.displayName,
					profiles.email,
				)
				.orderBy(desc(sum(memberUsageDaily.totalCostUsd)))
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

	getCurrentMonthUsage: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)

		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		const today = new Date()
		const year = today.getFullYear()
		const month = today.getMonth()
		const monthStr = String(month + 1).padStart(2, '0')
		const startDate = `${year}-${monthStr}-01`
		const endDate = `${year}-${monthStr}-${String(today.getDate()).padStart(2, '0')}`

		const [usage] = await ctx.db
			.select({
				totalCalls: sum(companyUsageDaily.totalCalls),
				tokensConsumed: sum(companyUsageDaily.tokensConsumed),
				totalCostUsd: sum(companyUsageDaily.totalCostUsd),
			})
			.from(companyUsageDaily)
			.where(
				and(
					eq(companyUsageDaily.companyId, membership.company.id),
					gte(companyUsageDaily.date, startDate),
					lte(companyUsageDaily.date, endDate),
				),
			)

		return {
			totalCalls: Number(usage?.totalCalls ?? 0),
			tokensConsumed: Number(usage?.tokensConsumed ?? 0),
			totalCostUsd: usage?.totalCostUsd ?? '0',
		}
	}),
})
