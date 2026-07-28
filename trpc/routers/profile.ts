import { eq } from 'drizzle-orm'

import { protectedProcedure, createTRPCRouter } from '../init'

import { profiles } from '@/drizzle/schema'
import { TRPCError } from '@trpc/server'
import { getUserCompanyMembership } from '../lib/membership'

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
	getProxyToken: protectedProcedure.query(async ({ ctx }) => {
		const membership = await getUserCompanyMembership(ctx.db, ctx.user.sub)
		if (!membership || !membership.company) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a company',
			})
		}

		if (!membership.membership.proxy_token) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'The current user doesnt have a proxy token',
			})
		}

		return membership.membership.proxy_token
	}),
})
