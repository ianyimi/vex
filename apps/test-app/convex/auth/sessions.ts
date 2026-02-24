import { v } from "convex/values"

import { TABLE_SLUG_SESSIONS, type TABLE_SLUG_USERS } from "~/db/constants"

import type { Id } from "../_generated/dataModel"

import { query } from "../_generated/server"

/**
 * Get session with user data by session token
 * Used for server-side authentication in Next.js
 */
export const getSessionWithUser = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the session by token
    const session = await ctx.db
      .query(TABLE_SLUG_SESSIONS)
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first()

    if (!session) {
      return null
    }

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      console.error("Session Expired")
      return null
    }

    // Get the user data
    const user = await ctx.db.get(session.userId as Id<typeof TABLE_SLUG_USERS>)

    if (!user) {
      return null
    }

    return {
      session: {
        id: session._id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        token: session.token,
        userAgent: session.userAgent,
        userId: session.userId,
      },
      user: {
        id: user.userId ?? user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
      },
    }
  },
})
