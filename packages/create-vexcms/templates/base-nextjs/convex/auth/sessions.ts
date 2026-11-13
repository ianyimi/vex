import { type Id } from "@convex/_generated/dataModel"
import { v } from "convex/values"

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"
import { find, get } from "~/vexcms/api"

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
    const [session] = await find({
      ctx,
      collection: TABLE_SLUG_SESSIONS,
      withIndex: { name: "by_token", range: (q) => q.eq("token", args.sessionToken) },
      limit: 1,
      access: { bypass: true },
    })

    if (!session) {return null}

    if (session.expiresAt < Date.now()) {
      console.error("[getSessionWithUser] Session Expired")
      return null
    }

    const userId = session.userId
    if (!userId) {return null}

    const user = await get({ ctx, collection: TABLE_SLUG_USERS, id: userId as Id<typeof TABLE_SLUG_USERS>, access: { bypass: true } })
    if (!user) {return null}

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
        roles: user.roles,
      },
    }
  },
})
