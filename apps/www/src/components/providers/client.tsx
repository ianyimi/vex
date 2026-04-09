"use client"

import { type PropsWithChildren } from "react"

import BetterAuthClientProvider from "~/auth/client"
import ConvexClientProvider from "~/components/providers/convex"

export default function ClientProviders({ children }: PropsWithChildren) {
  return (
    <ConvexClientProvider>
      <BetterAuthClientProvider>{children}</BetterAuthClientProvider>
    </ConvexClientProvider>
  )
}
