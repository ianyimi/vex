import { ConvexError } from "convex/values"

import { mutation, query } from "../_generated/server"

import { TABLE_SLUG_USERS } from "~/db/constants"
import { USER_ROLES } from "~/db/constants/auth"

/**
 * Check if the admin panel has been bootstrapped (at least one admin exists).
 * Used by the landing page to determine whether to show "Sign Up" or "Sign In".
 */
export const isBootstrapped = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query(TABLE_SLUG_USERS).collect()

    return allUsers.some((user) => {
      const roles = user.role ?? []
      return roles.includes(USER_ROLES.admin)
    })
  },
})

/**
 * Promote the current user to admin if no admin exists yet.
 * Called after the first user signs up.
 *
 * Convex mutations are serialized, so two simultaneous signups
 * cannot both become admin — the second will see the first's promotion.
 */
export const promoteFirstAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) {
      throw new ConvexError("Not authenticated")
    }

    // Find the current user by email
    const currentUser = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!currentUser) {
      throw new ConvexError("User not found")
    }

    // Check if any user already has admin role
    const allUsers = await ctx.db.query(TABLE_SLUG_USERS).collect()
    const hasAdmin = allUsers.some((user) => {
      const roles = user.role ?? []
      return roles.includes(USER_ROLES.admin)
    })

    if (hasAdmin) {
      return { promoted: false }
    }

    // Promote this user to admin
    const currentRoles = currentUser.role ?? []
    if (!currentRoles.includes(USER_ROLES.admin)) {
      await ctx.db.patch(currentUser._id, {
        role: [...currentRoles, USER_ROLES.admin],
      })
    }

    return { promoted: true }
  },
})

/**
 * Get the onboarding completion status for a user.
 */
export const getOnboardingStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) return { complete: false }

    const user = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) return { complete: false }

    return { complete: !!(user as any).vex_onboarding_complete }
  },
})

/**
 * Mark the onboarding tour as complete for the current user.
 */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) return

    const user = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) return

    await ctx.db.patch(user._id, {
      vex_onboarding_complete: true,
    } as any)
  },
})

/**
 * Reset the onboarding tour for the current user (restart tour).
 */
export const resetOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity?.email) return

    const user = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) return

    await ctx.db.patch(user._id, {
      vex_onboarding_complete: false,
    } as any)
  },
})
