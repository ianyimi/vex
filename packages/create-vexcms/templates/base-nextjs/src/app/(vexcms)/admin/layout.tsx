import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { getToken, getUserOrgForVexApi } from "~/auth/server"

/**
 * `AuthServerProvider` (`~/components/providers/auth`) used to wrap `{children}` here —
 * removed (perf fix, measured): it `await`s `getToken()`/`getUserOrg()` BEFORE
 * returning its own `{children}`, so React cannot begin streaming ANYTHING inside it
 * until that resolves, regardless of `NextAdminLayout`'s own `authPromise` plumbing.
 * Safe to remove: its own `AuthContext` (`useAuth()`) has zero consumers inside the
 * admin tree.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Not awaited — `NextAdminLayout` resolves it inside the sidebar's OWN `<Suspense>`
  // boundary (`@vexcms/react`'s `AdminLayout`), so `{children}` and this layout's own
  // static chrome stream immediately instead of waiting on a Convex round trip.
  const authPromise = getUserOrgForVexApi()
  // Awaited, unlike `authPromise` above: `getToken()` is `cache()`-memoized AND, when a
  // valid JWT cookie is present, resolves from a local decode (no network round trip —
  // see `auth/server.ts`'s `jwtCache` comment), so this costs far less than `getUserOrg()`
  // would. It must be awaited (not streamed via Suspense): the `<meta name="vex-session">`
  // it gates below needs to land in the INITIAL, non-deferred SSR HTML — before any
  // client script hydrates — for `convex.tsx`'s `hasSessionHint()` to see it synchronously
  // at hydration time (see that module's own doc comment).
  const sessionToken = await getToken()
  return (
    // `VexConfigProvider` is mounted once by the root layout's
    // `ClientProviders`, for the admin and the public site alike.
    <>
      {/* Tells `components/providers/convex.tsx`'s `hasSessionHint()` that a Better Auth
          session exists for this request, synchronously and before hydration — Better Auth's
          own `session_token` cookie is `httpOnly`, so `document.cookie` can never see it
          client-side. Never the token itself: just a presence marker. */}
      {sessionToken ? <meta name="vex-session" content="1" /> : null}
      <NextAdminLayout authPromise={authPromise}>{children}</NextAdminLayout>
    </>
  )
}
