import type { ReactNode } from "react"

import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, apiKeyClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { env } from "~/env.mjs"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), apiKeyClient(), convexClient()],
})

export const { signIn, signOut, useSession } = authClient

// copied from code example, unsure if this is actually useful or not
// eslint-disable-next-line @typescript-eslint/no-misused-promises, @typescript-eslint/no-empty-function
authClient.$store.listen("$sessionSignal", async () => {})

export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={true}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
