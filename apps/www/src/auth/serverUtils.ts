import { api } from "@convex/_generated/api"
import { getSessionCookie } from "better-auth/cookies"
import { fetchQuery } from "convex/nextjs"
import { headers } from "next/headers"

import { AUTH_COOKIE_PREFIX, AUTH_RATE_LIMIT_HEADERS } from "~/db/constants"
import { env } from "~/env.mjs"

/**
 * Read the Better Auth session token from cookies.
 *
 * Uses Better Auth's own reader with this app's `AUTH_COOKIE_PREFIX` rather
 * than a literal cookie name (AP-022): it checks `__Secure-<prefix>.session_token`
 * (https) then `<prefix>.session_token` (http), and the unique prefix keeps a
 * different Better Auth app on the same host from being read as this one.
 */
export async function getSessionToken() {
  const sessionTokenCookie = getSessionCookie(await headers(), { cookiePrefix: AUTH_COOKIE_PREFIX })

  if (!sessionTokenCookie) {return null}

  // better-auth stores tokens as "<raw_token>.<hmac_signature>" (2 parts, not a JWT)
  // The raw token (first part) is what's indexed in the DB by_token
  if (sessionTokenCookie.includes(".")) {
    return sessionTokenCookie.split(".")[0]
  }

  return sessionTokenCookie
}

/**
 * Wraps a Better Auth Next.js route handler ({@link handler}'s `{ GET, POST }`
 * shape) so every proxied request carries proof of its client IP before
 * Better Auth forwards it to `.convex.site`. Vercel overwrites
 * `x-forwarded-for` with the real client IP and never forwards external IPs,
 * so its first value is trustworthy inside this handler. A caller hitting
 * `.convex.site` directly can forge any header, so the Convex side
 * (`convex/auth/rateLimits.ts`'s `limitAuthRequest`) only trusts these two
 * headers when `proxySecret` matches `AUTH_PROXY_SECRET`.
 *
 * Always overwrites any client-sent `AUTH_RATE_LIMIT_HEADERS` values on the
 * cloned request — a caller cannot smuggle its own attestation past this
 * proxy hop.
 *
 * @param props.handler the unwrapped `{ GET, POST }` handler from
 * `convexBetterAuthNextJs`.
 * @returns a `{ GET, POST }` handler with the same signature, each method
 * cloning its `Request` with `AUTH_RATE_LIMIT_HEADERS.clientIp` and
 * `AUTH_RATE_LIMIT_HEADERS.proxySecret` set before delegating to the
 * matching method on `props.handler`.
 */
export function withClientIpAttestation(props: {
  handler: { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> }
}): { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> } {
  function attest(request: Request): Request {
    const clientIp = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ?? ""
    const headers = new Headers(request.headers)
    headers.set(AUTH_RATE_LIMIT_HEADERS.clientIp, clientIp)
    headers.set(AUTH_RATE_LIMIT_HEADERS.proxySecret, env.AUTH_PROXY_SECRET)
    return new Request(request, { headers })
  }

  return {
    GET: (request: Request) => props.handler.GET(attest(request)),
    POST: (request: Request) => props.handler.POST(attest(request)),
  }
}

/**
 * Get current user session in Next.js server components/actions
 * Validates the Better Auth session token from cookies and fetches user data
 */
export const getCurrentUser = async () => {
  try {
    const sessionToken = await getSessionToken()
    if (!sessionToken) {return null}

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) {return null}
    return session.user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

/**
 * Get full session (user + session data) in Next.js server components/actions
 */
export async function getSession() {
  try {
    const sessionToken = await getSessionToken()
    if (!sessionToken) {return null}

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) {return null}
    return session
  } catch (error) {
    console.error("[getSession] Error:", error)
    return null
  }
}
