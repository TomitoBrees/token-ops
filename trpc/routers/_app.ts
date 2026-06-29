import { createTRPCRouter } from '../init'
import { profileRouter } from './profile'
import { companyRouter } from './company'
import { invitationRouter } from './invitation'

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  company: companyRouter,
  invitation: invitationRouter,
})

export type AppRouter = typeof appRouter
