import { HOUR, RateLimiter } from "@convex-dev/rate-limiter"

import { AUTH_RATE_LIMIT_HEADERS, AUTH_RATE_LIMIT_NAMES, AUTH_RATE_LIMITED_PATHS } from "~/db/constants"

import type { ActionCtx, MutationCtx } from "../_generated/server"

import { components } from "../_generated/api"

/**
 * Rate limits for `/api/auth/*` sign-in and sign-up traffic, keyed per
 * attested client IP (`hashClientIp`) or shared across one unattested bucket
 * for requests `limitAuthRequest` cannot verify came through the Next proxy.
 *
 * - `anonymousSignInPerIp` / `emailSignUpPerIp`: token buckets, so a burst up
 *   to `capacity` succeeds immediately and the rest refill at `rate`/`period`.
 * - `unattested`: one fixed-window bucket shared by every request that fails
 *   attestation, regardless of its claimed IP.
 * - `globalUserCreation`: one fixed-window bucket shared by all attested and
 *   unattested traffic together, capping total new-user creation regardless
 *   of how it is distributed across IPs.
 */
export const authRateLimiter = new RateLimiter(components.rateLimiter, {
  [AUTH_RATE_LIMIT_NAMES.anonymousSignInPerIp]: { capacity: 5, kind: "token bucket", period: HOUR, rate: 10 },
  [AUTH_RATE_LIMIT_NAMES.emailSignUpPerIp]: { capacity: 3, kind: "token bucket", period: HOUR, rate: 5 },
  [AUTH_RATE_LIMIT_NAMES.globalUserCreation]: { kind: "fixed window", period: HOUR, rate: 600 },
  [AUTH_RATE_LIMIT_NAMES.unattested]: { kind: "fixed window", period: HOUR, rate: 30 },
})

/**
 * Derives an `authRateLimiter` key for an attested client IP without storing
 * the raw IP anywhere.
 *
 * @param props.ip the attested client IP (`AUTH_RATE_LIMIT_HEADERS.clientIp`).
 * @param props.secret `AUTH_PROXY_SECRET`, folded into the hash so the key
 * space cannot be precomputed from the IP alone.
 * @returns a hex `SHA-256(secret + ":" + ip)` digest, via Convex's Web Crypto
 * (`crypto.subtle.digest`).
 */
export async function hashClientIp(props: { ip: string; secret: string }): Promise<string> {
  const data = new TextEncoder().encode(`${props.secret}:${props.ip}`)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Enforces `authRateLimiter` on `AUTH_RATE_LIMITED_PATHS` POST requests,
 * called from `convex/http.ts` before `createAuth(ctx).handler(request)` runs.
 *
 * A request is attested only when `AUTH_RATE_LIMIT_HEADERS.proxySecret`
 * matches `AUTH_PROXY_SECRET` — anything else, including a forged
 * `AUTH_RATE_LIMIT_HEADERS.clientIp` on a direct `.convex.site` call, draws
 * from the shared `unattested` bucket instead of a per-IP one.
 *
 * @param props.ctx the `httpAction` ctx in production; a mutation ctx in
 * tests. `authRateLimiter.limit` accepts both.
 * @param props.request the incoming `Request`.
 * @returns `null` when the request is not subject to a limit or passes every
 * applicable limit; a `429 Response` with a `Retry-After` header (seconds,
 * rounded up) when any applicable limit fails.
 * @throws never — rate-limit failures are returned as a `Response`, not
 * thrown.
 */
export async function limitAuthRequest(props: { ctx: ActionCtx | MutationCtx; request: Request }): Promise<null | Response> {
  if (props.request.method !== "POST") {
    return null
  }

  const path = new URL(props.request.url).pathname
  const limitName =
    path === AUTH_RATE_LIMITED_PATHS.anonymousSignIn
      ? AUTH_RATE_LIMIT_NAMES.anonymousSignInPerIp
      : path === AUTH_RATE_LIMITED_PATHS.emailSignUp
        ? AUTH_RATE_LIMIT_NAMES.emailSignUpPerIp
        : null

  if (limitName === null) {
    return null
  }

  const secret = process.env.AUTH_PROXY_SECRET
  const attested = secret !== undefined && props.request.headers.get(AUTH_RATE_LIMIT_HEADERS.proxySecret) === secret

  const firstResult = attested
    ? await authRateLimiter.limit(props.ctx, limitName, {
        key: await hashClientIp({ ip: props.request.headers.get(AUTH_RATE_LIMIT_HEADERS.clientIp) ?? "", secret }),
      })
    : await authRateLimiter.limit(props.ctx, AUTH_RATE_LIMIT_NAMES.unattested, {})

  if (!firstResult.ok) {
    return new Response(null, { headers: { "Retry-After": String(Math.ceil(firstResult.retryAfter / 1000)) }, status: 429 })
  }

  const globalResult = await authRateLimiter.limit(props.ctx, AUTH_RATE_LIMIT_NAMES.globalUserCreation, {})
  if (!globalResult.ok) {
    return new Response(null, { headers: { "Retry-After": String(Math.ceil(globalResult.retryAfter / 1000)) }, status: 429 })
  }

  return null
}
