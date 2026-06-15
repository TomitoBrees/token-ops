import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/login/logout-button'
import { createClient } from '@/lib/server'
import { getQueryClient, trpc } from '@/trpc/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(trpc.profile.getProfile.queryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-svh w-full flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Hello, World!</h1>
        <LogoutButton />
      </div>
    </HydrationBoundary>
  )
}
