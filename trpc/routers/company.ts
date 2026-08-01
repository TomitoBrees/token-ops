import { eq } from 'drizzle-orm'
import z from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import {
	companies,
	companyBudgets,
	companyMembers,
	membersBudgets,
	profiles,
} from '@/drizzle/schema'
import { getUserCompanyMembership } from '../lib/membership'
import { TRPCError } from '@trpc/server'

const COMPANY_SIZE_OPTIONS = [
	'1-10',
	'11-50',
	'51-200',
	'201-500',
	'500+',
] as const

type CompanySize = (typeof COMPANY_SIZE_OPTIONS)[number]

const MAX_SIZE_BY_RANGE: Record<CompanySize, number> = {
	'1-10': 10,
	'11-50': 50,
	'51-200': 200,
	'201-500': 500,
	'500+': 500,
}

export const companyRouter = createTRPCRouter({
	getCompany: protectedProcedure.query(async ({ ctx }) => {
		return await getUserCompanyMembership(ctx.db, ctx.user.sub)
	}),

	createCompany: protectedProcedure
		.input(
			z.object({ name: z.string(), size: z.enum(COMPANY_SIZE_OPTIONS) }),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.transaction(async (tx) => {
				const [company] = await tx
					.insert(companies)
					.values({
						name: input.name,
						size: MAX_SIZE_BY_RANGE[input.size],
					})
					.returning()

				const [member] = await tx
					.insert(companyMembers)
					.values({
						userId: ctx.user.sub,
						companyId: company.id,
						role: 'owner',
					})
					.returning()

				await tx.insert(companyBudgets).values({
					companyId: company.id,
					budget: 1000,
				})

				await tx.insert(membersBudgets).values({
					companyMemberId: member.id,
					budget: 300,
				})

				return company
			})
		}),

	getCompanyBudget: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		return ctx.db.query.companyBudgets.findFirst({
			where: eq(companyBudgets.companyId, membership.company.id),
		})
	}),

	getMemberBudget: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		return ctx.db.query.membersBudgets.findFirst({
			where: eq(membersBudgets.companyMemberId, membership.membership.id),
		})
	}),

	setMemberBudget: protectedProcedure
		.input(z.object({ budget: z.number().int().min(0) }))
		.mutation(async ({ ctx, input }) => {
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

			const [budget] = await ctx.db
				.insert(membersBudgets)
				.values({
					companyMemberId: membership.membership.id,
					budget: input.budget,
				})
				.onConflictDoUpdate({
					target: membersBudgets.companyMemberId,
					set: { budget: input.budget },
				})
				.returning()

			return budget
		}),

	setCompanyBudget: protectedProcedure
		.input(z.object({ budget: z.number().int().min(0) }))
		.mutation(async ({ ctx, input }) => {
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

			if (membership.role !== 'owner') {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message:
						'Only company admins can update the company budget',
				})
			}

			const [budget] = await ctx.db
				.insert(companyBudgets)
				.values({
					companyId: membership.company.id,
					budget: input.budget,
				})
				.onConflictDoUpdate({
					target: companyBudgets.companyId,
					set: { budget: input.budget },
				})
				.returning()

			return budget
		}),
})
