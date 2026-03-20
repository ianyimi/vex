"use client"

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexReactClient } from "convex/react"
import { type ReactNode } from "react"

import { authClient } from "~/auth/client"
import { env } from "~/env.mjs"

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

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexBetterAuthProvider>
  )
}
