import { eq } from 'drizzle-orm'
import { Context } from '../init'
import { companyMembers } from '@/drizzle/schema'

export async function getUserCompanyMembership(
  db: Context['db'],
  userId: string,
) {
  const membership = await db.query.companyMembers.findFirst({
    where: eq(companyMembers.userId, userId),
    with: { company: true },
  })
  if (!membership) return null
  return { company: membership.company, role: membership.role, membership }
}
