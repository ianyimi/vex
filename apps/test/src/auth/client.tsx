import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, anonymousClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { env } from "~/env.mjs"

/**
 * Global Better Auth client for the VexCMS admin panel.
 *
 * Configured with the site's auth base URL, CSRF protection, and plugins for
 * admin roles, anonymous access, organization/team support, API key auth,
 * and Convex session storage.
 *
 * @see signIn, signOut, useSession — destructured from this client
 * @see BetterAuthClientProvider — wraps the app with this client
 */
export const authClient = createAuthClient({
  basePath: "/api/auth",
  baseURL: env.NEXT_PUBLIC_SITE_URL,
  plugins: [adminClient(), anonymousClient(), organizationClient(), apiKeyClient(), convexClient()],
})

export const { signIn, signOut, useSession } = authClient

// copied from code example, unsure if this is actually useful or not
// eslint-disable-next-line @typescript-eslint/no-empty-function
authClient.$store.listen("$sessionSignal", () => {})

/**
 * Provides Better Auth session state and UI components to the Next.js app.
 *
 * Wraps children with `AuthUIProvider` from `@daveyplate/better-auth-ui`, wiring
 * in the `authClient`, credential-based sign-in, Next.js `<Link>`, and router
 * navigation. On every session change the Next.js router refreshes to update
 * server-side session data.
 *
 * Must be placed near the root of the app — required by `useSession()` and all
 * components that read auth state.
 *
 * @param props.children - App content to wrap with auth context.
 * @example
 * ```tsx
 * // app/layout.tsx
 * <BetterAuthClientProvider>
 *   {children}
 * </BetterAuthClientProvider>
 * ```
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
      {children}
    </AuthUIProvider>
  )
}
