import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"
import { disableLivePreview } from "@vexcms/next/livePreview/client"
import { useAuthTransition } from "@vexcms/react"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { env } from "~/env.mjs"
import config from "~/vex.config"

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
  // Same-origin in the browser: a Vercel deployment's own URL (`vex-….vercel.app`)
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
 * Mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so the admin
 * panel's top-bar sign-in/out control (`AdminTopNav`) has a `signInHref`/`signOut`
 * to call. `signOut` signs out, then hard-navigates (a full document load, NOT
 * `router.refresh()`/`router.push()`) to `config.auth.signOut.redirectTo` — the
 * admin shell must never render in a signed-out state, and a client-side refresh
 * keeps it mounted while queries re-run anonymously and the route guard redirects
 * underneath it (the multi-second "sidebar lingers, then a sign-in flash" sequence
 * this hard navigation avoids).
 */
export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  // Needs an `AuthTransitionProvider` ancestor — `ConvexClientProvider`
  // (`~/components/providers/convex.tsx`) mounts it one level up from this
  // component, same as `~/components/providers/client.tsx`'s nesting order.
  const { beginTransition } = useAuthTransition()
  return (
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
          // `skipRefresh: true` — this `signOut` already hard-navigates
          // below, so `useNextAuthTransitionRefresh`'s OWN `router.refresh()`
          // for this same transition would only race that hard navigation
          // (see that hook's own doc comment, `@vexcms/next`).
          // `useBeginAuthTransitionOnSessionChange` (`~/components/providers/convex.tsx`)
          // also reactively catches this once `authClient.useSession()`
          // updates, so this call is a latency optimization, not the only path.
          beginTransition(null, { skipRefresh: true })
          // Clears any stale live-preview cookies left over from this tab or
          // the pop-out preview tab — see `disableLivePreview`'s own doc
          // comment. Fire-and-forget: it never throws, so it cannot block
          // sign-out either way.
          void disableLivePreview()
          const goToDestination = () => {
            window.location.href = config.auth.signOut.redirectTo
          }
          // Hard-navigate either way (success or failure) — a stale client
          // cache after a failed sign-out is worse than a redundant navigation,
          // and a full document load re-resolves auth state fresh regardless.
          return signOut().then(goToDestination).catch(goToDestination)
        },
      }}
    >
      {children}
    </VexAdminAuthAdapterProvider>
  )
}
