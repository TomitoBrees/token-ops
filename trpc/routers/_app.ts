import { createTRPCRouter } from '../init'
import { profileRouter } from './profile'
import { companyRouter } from './company'

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  company: companyRouter
})

export type AppRouter = typeof appRouter
