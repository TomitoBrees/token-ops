import { eq } from 'drizzle-orm'

import { protectedProcedure, createTRPCRouter } from '../init'

import { profiles } from '@/drizzle/schema'
import { TRPCError } from '@trpc/server'

export const profileRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.profiles.findFirst({
      where: eq(profiles.id, ctx.user.sub),
    })
    if (!profile) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }

    return profile
  }),
})
