import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/login/logout-button'
import { createClient } from '@/lib/server'
import { getQueryClient, trpc } from '@/trpc/server'
import { TRPCError } from '@trpc/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const queryClient = getQueryClient()

  const companyData = await queryClient.fetchQuery(
    trpc.company.getCompany.queryOptions(),
  )
  if (!companyData) {
    redirect('/create-company')
  } else {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-svh w-full flex-col items-center justify-center gap-4">
      Hello World!
    </div>
  )
}
