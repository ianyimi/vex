import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, anonymousClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"

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
 * Also mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so
 * `AdminTopNav`'s sign-in/out control has a `signInHref`/`signOut` to call —
 * this provider wraps the WHOLE app (root `layout.tsx`), so it reaches the
 * admin tree under `/admin` the same as every other route. `signOut` mirrors
 * `SessionButton.tsx`'s own sequence exactly: sign out, then `router.refresh()`
 * either way (success or failure — a stale client cache after a failed sign-out
 * is worse than a redundant refresh) so the admin panel's server-resolved auth
 * state and route guard re-evaluate.
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
