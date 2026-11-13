import { ConvexError } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { USER_ROLES } from "~/db/constants/auth"
import { find, update } from "~/vexcms/api"

import { query } from "../_generated/server"
import { vexMutation as mutation } from "../vex"

/**
 * Check whether the admin panel has been bootstrapped (at least one admin
 * exists). Used by `WelcomePage` to decide between "Sign Up" and "Sign In".
 */
export const isBootstrapped = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await find({ ctx, collection: TABLE_SLUG_USERS, access: { bypass: true } })
    return allUsers.some((user) => user.roles?.includes(USER_ROLES.admin))
  },
})

/**
 * Promote the current user to admin if no admin exists yet. Called after the
 * first user signs up.
 *
 * Convex mutations are serialized, so two simultaneous signups cannot both
 * become admin — the second observes the first's promotion and no-ops.
 */
export const promoteFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) {
      throw new ConvexError("Not authenticated")
    }

    const [currentUser] = await find({
      ctx,
      collection: TABLE_SLUG_USERS,
      withIndex: { name: "by_email", range: (q) => q.eq("email", identity.email!) },
      limit: 1,
      access: { bypass: true },
    })

    if (!currentUser) {
      throw new ConvexError("User not found")
    }

    const allUsers = await find({ ctx, collection: TABLE_SLUG_USERS, access: { bypass: true } })
    const hasAdmin = allUsers.some((user) => user.roles?.includes(USER_ROLES.admin))

    if (hasAdmin) {
      return { promoted: false }
    }

    const currentRoles = currentUser.roles ?? []
    if (!currentRoles.includes(USER_ROLES.admin)) {
      await update({
        ctx,
        collection: TABLE_SLUG_USERS,
        id: currentUser._id,
        data: { roles: [...currentRoles, USER_ROLES.admin] },
        access: { bypass: true },
      })
    }

    return { promoted: true }
  },
})
