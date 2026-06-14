'use client'

import { useQuery } from '@tanstack/react-query'

import { useTRPC } from '@/trpc/client'

export function HomeGreeting() {
  const trpc = useTRPC()
  const hello = useQuery(trpc.hello.queryOptions({ text: 'world' }))

  if (hello.isLoading) {
    return <p className="text-muted-foreground">Loading greeting...</p>
  }

  if (hello.isError) {
    return <p className="text-destructive">Failed to load greeting.</p>
  }

  return <p className="text-muted-foreground">{hello.data?.greeting}</p>
}
