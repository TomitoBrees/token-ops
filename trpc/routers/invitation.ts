import z from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'
import {
	companyInvitations,
	companyMembers,
	MEMBER_ROLES,
	profiles,
} from '@/drizzle/schema'
import { eq } from 'drizzle-orm/sql'
import { TRPCError } from '@trpc/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const invitationRouter = createTRPCRouter({
	inviteMember: protectedProcedure
		.input(z.object({ email: z.string(), role: z.enum(MEMBER_ROLES) }))
		.mutation(async ({ ctx, input }) => {
			const [invitation] = await ctx.db.transaction(async (tx) => {
				const adminMembership = await tx.query.companyMembers.findFirst(
					{
						where: eq(companyMembers.userId, ctx.user.sub),
					},
				)
				if (!adminMembership) {
					throw new TRPCError({ code: 'NOT_FOUND' })
				}
				return await tx
					.insert(companyInvitations)
					.values({
						email: input.email,
						role: input.role,
						company_id: adminMembership.companyId,
					})
					.returning()
			})

			const supabaseAdmin = createAdminClient()
			const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
				input.email,
				{
					// Used as `next` by the Invite email template (must NOT point at /auth/confirm again)
					redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password?next=/invite/complete/${invitation.id}`,
				},
			)
			if (error) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: error.message,
				})
			}

			return invitation
		}),

	acceptInvitation: protectedProcedure
		.input(
			z.object({
				invitationId: z.uuid(),
				displayName: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const invitation = await ctx.db.query.companyInvitations.findFirst({
				where: eq(companyInvitations.id, input.invitationId),
			})

			if (!invitation) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invitation not found',
				})
			}

			if (invitation.status !== 'pending') {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Invitation is no longer pending',
				})
			}

			if (!invitation.company_id) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Invitation has no company',
				})
			}

			const profile = await ctx.db.query.profiles.findFirst({
				where: eq(profiles.id, ctx.user.sub),
			})

			if (!profile) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Profile not found',
				})
			}

			const userEmail =
				profile.email ?? (ctx.user as { email?: string }).email
			if (
				!userEmail ||
				userEmail.toLowerCase() !== invitation.email.toLowerCase()
			) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Invitation email does not match your account',
				})
			}

			return ctx.db.transaction(async (tx) => {
				await tx
					.update(profiles)
					.set({ displayName: input.displayName })
					.where(eq(profiles.id, ctx.user.sub))

				await tx.insert(companyMembers).values({
					userId: ctx.user.sub,
					companyId: invitation.company_id,
					role: invitation.role,
				})

				const [accepted] = await tx
					.update(companyInvitations)
					.set({ status: 'accepted' })
					.where(eq(companyInvitations.id, invitation.id))
					.returning()

				return accepted
			})
		}),

	getInvitationFromId: protectedProcedure
		.input(z.uuid())
		.query(async ({ ctx, input }) => {
			const invitation = await ctx.db.query.companyInvitations.findFirst({
				where: eq(companyInvitations.id, input),
				with: { company: true },
			})

			if (!invitation) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Invitation not found',
				})
			}

			return invitation
		}),
})
