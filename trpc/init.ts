import { initTRPC, TRPCError } from '@trpc/server'

import { db } from '@/db'
import { createClient } from '@/lib/server'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return {
    headers: opts.headers,
    supabase,
    user: data?.claims ?? null,
    db,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create()

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
