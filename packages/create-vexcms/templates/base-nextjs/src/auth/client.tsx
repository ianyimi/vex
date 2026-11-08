import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuthTransition } from "@vexcms/react"
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
  // Same-origin in the browser: a Vercel deployment's own URL (`….vercel.app`)
  // differs from `NEXT_PUBLIC_SITE_URL`, and a cross-origin call is blocked by
  // the CSP's `connect-src 'self'`. The env value only serves server renders,
  // where there is no window.
  baseURL: typeof window === "undefined" ? env.NEXT_PUBLIC_SITE_URL : window.location.origin,
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
  // Needs an `AuthTransitionProvider` ancestor — `ConvexClientProvider`
  // (`~/components/providers/convex.tsx`) mounts it one level up from this
  // component, same as `~/components/providers/client.tsx`'s nesting order.
  const { beginTransition } = useAuthTransition()
  return (
    <AuthUIProvider
      authClient={authClient}
      /* {{EMAIL_PASSWORD_CREDENTIALS}} */
      // {{OAUTH_UI_PROVIDERS}}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      <VexAdminAuthAdapterProvider
        value={{
          // `modal=1` is the signal `app/@auth/(.)auth/[pathname]/view.tsx`
          // uses to tell this deliberate "Sign in" click apart from a server
          // GUARD redirect (middleware, or `/admin`'s own `redirect(...)`)
          // that also carries `redirectTo` — both would otherwise collapse
          // onto the same `isGuardRedirect` branch and render the full-screen
          // card instead of the dialog `AdminTopNav`'s control expects.
          signInHref: (redirectTo) =>
            `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&modal=1`,
          signOut: () => {
            // Set BEFORE the network call starts, not after it resolves — the
            // one case the identity is known with zero ambiguity ahead of
            // time (always `null`), so list hooks start ignoring stale pages
            // as early as possible (`@vexcms/react`'s `useAuthTransition`).
            // `useBeginAuthTransitionOnSessionChange` (`~/components/providers/convex.tsx`)
            // also reactively catches this once `authClient.useSession()`
            // updates, so this call is a latency optimization, not the only path.
            beginTransition(null)
            return signOut()
              .then(() => router.refresh())
              .catch(() => router.refresh())
          },
        }}
      >
        {children}
      </VexAdminAuthAdapterProvider>
    </AuthUIProvider>
  )
}
