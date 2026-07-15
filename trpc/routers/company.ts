import { and, eq } from 'drizzle-orm'
import z from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import {
	companies,
	companyBudgets,
	companyMembers,
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

				await tx.insert(companyMembers).values({
					userId: ctx.user.sub,
					companyId: company.id,
					role: 'owner',
				})

				return company
			})
		}),

	getCurrentMonthBudget: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		const today = new Date()
		const currentMonth = today.getMonth() + 1
		const currentYear = today.getFullYear()

		return ctx.db.query.companyBudgets.findFirst({
			where: and(
				eq(companyBudgets.companyId, membership.company.id),
				eq(companyBudgets.month, currentMonth),
				eq(companyBudgets.year, currentYear),
			),
		})
	}),
})
