import { cache } from "react"

import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

import { api } from "@convex/_generated/api"
import { AUTH_COOKIE_PREFIX } from "~/db/constants"
import { env } from "~/env.mjs"

/**
 * Whether a caught query error looks like it was rejected for a stale/invalid
 * token specifically — used only to decide whether `jwtCache` (below) should
 * force a real token refresh and retry once, never to classify errors for
 * any other purpose.
 */
function isAuthTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /unauthenticated|not authenticated|invalid token|expired/i.test(message)
}

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken: getTokenUncached,
  handler,
  isAuthenticated,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  // BUG FIX (developer-reported jwtCache measured at ~170ms instead of a local
  // decode's <5ms): `getToken`'s own jwtCache path reads `opts.cookiePrefix`
  // (a TOP-LEVEL option, not nested under `jwtCache`) to find this app's own
  // `<prefix>.convex_jwt` cookie at all — without it, it looks for a
  // bare/`__Secure-` `convex_jwt` cookie that never exists here, so every call
  // silently fell through to the network path despite `jwtCache.enabled: true`.
  cookiePrefix: AUTH_COOKIE_PREFIX,
  // Developer decision: trust a locally-decoded, non-expired JWT cookie
  // instead of hitting `/api/auth/convex/token` on every request — this was
  // the single largest hop in the admin panel's own reload waterfall (perf
  // fix). Keeps the library's own default (short) JWT lifetime, not
  // extended here.
  //
  // Tradeoff, accepted by the developer: an SSR permission change (a role
  // edit, a ban, a revoked session) can lag by up to the JWT's own lifetime
  // before THIS cache notices — the stale local decode is trusted until it
  // expires or a query call fails with what `isAuthTokenError` recognizes as
  // an auth error, which forces one real refresh+retry. This is a UX/latency
  // tradeoff only, not a security hole: Convex re-checks `hasPermission`
  // against the TOKEN'S OWN claims on every single query regardless of this
  // cache, so a revoked/stale token can still only ever read/write what its
  // own (possibly stale) claims allow — never more.
  jwtCache: {
    enabled: true,
    isAuthError: isAuthTokenError,
  },
})

/**
 * Memoized per request (React `cache()`). `layout.tsx`, `page.tsx`, and
 * `AuthServerProvider` each independently need the session token — before
 * this, each called the uncached version, so one admin page load cost 2-3
 * real cookie-verify round trips for identical data. `cache()` collapses
 * every call within one render pass into the FIRST one's promise; the rest
 * await it for free.
 */
export const getToken = cache(getTokenUncached)

/**
 * Memoized per request (React `cache()`), for the same reason as `getToken`
 * above: `layout.tsx`, `page.tsx`, and `AuthServerProvider` each
 * independently fetched `{ user, organization }` via `getUserOrg` — 3 real
 * Convex round trips for identical data on one admin page load. Safe to call
 * unconditionally regardless of whether a session exists: an unauthenticated
 * caller resolves to `{ user: null, organization: undefined }`, never throws
 * (see `convex/auth/api.ts`'s own `getUserOrg` handler).
 */
export const getUserOrg = cache(() => fetchAuthQuery(api.auth.api.getUserOrg, {}))
