import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"

import { env } from "~/env.mjs"

/**
 * Global Better Auth client for this project.
 *
 * Configured with the site's auth base URL and plugins for admin roles,
 * anonymous access, API key auth, and Convex session storage. Add
 * `organizationClient()` from `better-auth/client/plugins` here if you enable
 * organizations (`--orgs`, or by hand later) — the server-side `organization()`
 * plugin alone does not surface org UI on the client.
 *
 * @see signIn, signOut, useSession — destructured from this client
 * @see BetterAuthClientProvider — wraps the app with this client
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), anonymousClient(), apiKeyClient(), convexClient()],
})

export const { signIn, signOut, useSession } = authClient

// eslint-disable-next-line @typescript-eslint/no-empty-function
authClient.$store.listen("$sessionSignal", () => {})

/**
 * Also mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so the admin
 * panel's top-bar sign-in/out control (`AdminTopNav`) has a `signInHref`/`signOut`
 * to call. `signOut` signs out then refreshes either way (success or failure — a
 * stale client cache after a failed sign-out is worse than a redundant refresh) so
 * the admin panel's server-resolved auth state and route guard re-evaluate.
 */
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
      <VexAdminAuthAdapterProvider
        value={{
          signInHref: (redirectTo) =>
            `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
          signOut: () =>
            signOut()
              .then(() => router.refresh())
              .catch(() => router.refresh()),
        }}
      >
        {children}
      </VexAdminAuthAdapterProvider>
    </AuthUIProvider>
  )
}
