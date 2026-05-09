"use client"

import type { ReactNode } from "react"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"

import { authClient } from "~/auth/client"
import { env } from "~/env.mjs"

// Clients are module-level singletons — created once, before any React
// component renders. This means connect() is called synchronously, so
// ConvexQueryClient.subscribeInner() is already listening to the query cache
// before any query fires its "added" event. If connect() were called inside
// a useEffect (after render), queries added to the cache during the first
// render would miss the "added" event and never get a Convex WebSocket
// subscription, breaking reactivity after mutations.
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL, {
  expectAuth: true,
})
const convexQueryClient = new ConvexQueryClient(convex)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: convexQueryClient.queryFn(),
      queryKeyHashFn: convexQueryClient.hashFn(),
    },
  },
})
convexQueryClient.connect(queryClient)

/**
 * Wires Convex, TanStack Query, and Better Auth together for the app.
 *
 * Clients are module-level singletons connected synchronously so Convex
 * reactive subscriptions are established before any query is added to the
 * TanStack Query cache. See module-level comment above.
 *
 * @param props.children - The subtree that needs Convex and query access.
 */
export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexBetterAuthProvider>
  )
}
