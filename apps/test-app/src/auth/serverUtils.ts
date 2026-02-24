import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { cookies } from "next/headers"

export async function getSessionToken() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("better-auth.session_token")?.value.split(".")[0]
  if (!sessionToken) {
    console.error("Error getting session token")
    return null
  }
  return sessionToken
}

/**
 * Get current user session in Next.js server components/actions
 * Validates the Better Auth session token from cookies and fetches user data
 */
export const getCurrentUser = async () => {
  try {
    const sessionToken = await getSessionToken()

    if (!sessionToken) {
      return null
    }

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) {
      return null
    }
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

    if (!sessionToken) {
      console.log("no session token")
      return null
    }

    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken,
    })
    if (!session?.user) {
      console.log("no session")
      return null
    }
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}
