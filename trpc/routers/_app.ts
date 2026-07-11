import { createTRPCRouter } from '../init'
import { profileRouter } from './profile'
import { companyRouter } from './company'
import { invitationRouter } from './invitation'
import { usageRouter } from './usage'

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  company: companyRouter,
  invitation: invitationRouter,
  usage: usageRouter,
})

export type AppRouter = typeof appRouter
