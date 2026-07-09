import z from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import { companies, companyMembers, profiles } from '@/drizzle/schema'

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
  createCompany: protectedProcedure
    .input(z.object({ name: z.string(), size: z.enum(COMPANY_SIZE_OPTIONS) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [company] = await tx
          .insert(companies)
          .values({ name: input.name, size: MAX_SIZE_BY_RANGE[input.size] })
          .returning()

        await tx.insert(companyMembers).values({
          userId: ctx.user.sub,
          companyId: company.id,
          role: 'owner',
        })

        return company
      })
    }),
})
