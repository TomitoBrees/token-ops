import {
	companyMembers,
	companyUsageDaily,
	memberUsageDaily,
	modelUsageDaily,
	profiles,
} from '@/drizzle/schema'
import { createTRPCRouter, protectedProcedure } from '../init'
import { getUserCompanyMembership } from '../lib/membership'
import { and, asc, desc, eq, gte, lte, sum } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const usageRouter = createTRPCRouter({
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

	getTopUsers: protectedProcedure
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

	getTopModels: protectedProcedure
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

			const topModels = await ctx.db
				.select({
					model: modelUsageDaily.model,
					totalCalls: sum(modelUsageDaily.totalCalls),
					tokensConsumed: sum(modelUsageDaily.tokensConsumed),
					totalCostUsd: sum(modelUsageDaily.totalCostUsd),
				})
				.from(modelUsageDaily)
				.where(
					and(
						eq(modelUsageDaily.companyId, membership.company.id),
						gte(modelUsageDaily.date, startDate),
					),
				)
				.groupBy(modelUsageDaily.model)
				.orderBy(desc(sum(modelUsageDaily.totalCostUsd)))
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
})
