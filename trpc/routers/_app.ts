import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../init'
import { profileRouter } from './profile'

export const appRouter = createTRPCRouter({
  profile: profileRouter
})

export type AppRouter = typeof appRouter
