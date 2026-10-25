import { api } from "@convex/_generated/api"
import { getSessionCookie } from "better-auth/cookies"
import { fetchQuery } from "convex/nextjs"
import { headers } from "next/headers"

import { AUTH_COOKIE_PREFIX } from "~/db/constants"

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

  if (!sessionTokenCookie) return null

  // better-auth stores tokens as "<raw_token>.<hmac_signature>" (2 parts, not a JWT)
  // The raw token (first part) is what's indexed in the DB by_token
  if (sessionTokenCookie.includes(".")) {
    return sessionTokenCookie.split(".")[0]
  }

  return sessionTokenCookie
}

/**
 * Get current user session in Next.js server components/actions
 * Validates the Better Auth session token from cookies and fetches user data
 */
export const getCurrentUser = async () => {
  try {
    const sessionToken = await getSessionToken()
    if (!sessionToken) return null

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) return null
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
    if (!sessionToken) return null

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) return null
    return session
  } catch (error) {
    console.error("[getSession] Error:", error)
    return null
  }
}
