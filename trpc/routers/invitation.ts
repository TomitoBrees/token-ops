import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { company_invitations, companyMembers, MEMBER_ROLES } from "@/drizzle/schema";
import { eq } from "drizzle-orm/sql";
import { TRPCError } from "@trpc/server";
import { createAdminClient } from "@/lib/supabase/admin";


export const invitationRouter = createTRPCRouter({
    inviteMember: protectedProcedure
    .input(z.object({email: z.string(), role: z.enum(MEMBER_ROLES)}))
    .mutation(async ({ctx, input}) => {

        const [invitation] = await ctx.db.transaction(async (tx) => {
            const adminMembership = await tx.query.companyMembers.findFirst({
                    where: eq(companyMembers.userId, ctx.user.sub)
                })
            if (!adminMembership) {
                throw new TRPCError({ code: 'NOT_FOUND'})
            }
            return await tx.insert(company_invitations).values({email: input.email, role: input.role, company_id: adminMembership.companyId}).returning()
        })

        const supabaseAdmin = createAdminClient()
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            input.email,{ redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/invite/complete/${invitation.id}`},
        )
        if (error) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: error.message })
        }

        return invitation
    })
})