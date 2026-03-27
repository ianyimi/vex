"use client"

import { type PropsWithChildren } from "react"

import BetterAuthClientProvider from "~/auth/client"

export default function ClientProviders({ children }: PropsWithChildren) {
  return <BetterAuthClientProvider>{children}</BetterAuthClientProvider>
}
