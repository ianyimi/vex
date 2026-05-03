"use client"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import { useEffect, useState, type ReactNode } from "react"

import { authClient } from "~/auth/client"
import { env } from "~/env.mjs"

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL, {
  expectAuth: true,
})

/**
 * Wires Convex, TanStack Query, and Better Auth together for the app.
 *
 * Initialises a shared `ConvexReactClient` and `ConvexQueryClient`, connects
 * them so TanStack Query subscriptions are backed by Convex reactivity, and
 * wraps children in `ConvexBetterAuthProvider` (for session management) and
 * `QueryClientProvider` (for data fetching).
 *
 * @param props.children - The subtree that needs Convex and query access.
 */
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convexQueryClient] = useState(
    () => new ConvexQueryClient(convex)
  )
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: convexQueryClient.queryFn(),
          queryKeyHashFn: convexQueryClient.hashFn()
        }
      }
    })
  )
  useEffect(() => {
    convexQueryClient.connect(queryClient)
  }, [convexQueryClient, queryClient])
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexBetterAuthProvider>
  )
}
