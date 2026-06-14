import { redirect } from 'next/navigation'

import { LogoutButton } from '@/components/login/logout-button'
import { createClient } from '@/lib/server'

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  return (
    <div className="flex h-svh w-full items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Hello, World!</h1>
      <LogoutButton />
    </div>
  )
}
