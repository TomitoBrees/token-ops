import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../init'

export const appRouter = createTRPCRouter({
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query(({ input }) => {
      return {
        greeting: `hello ${input.text}`,
      }
    }),
  me: protectedProcedure.query(({ ctx }) => {
    return {
      sub: ctx.user.sub,
    }
  }),
})

export type AppRouter = typeof appRouter
