import type { DataModel } from "@convex/_generated/dataModel"
import type { GenericQueryCtx } from "convex/server"

import { query } from "@convex/_generated/server"

import { TABLE_SLUG_USERS } from "~/db/constants"

import { access } from "../../src/vexcms/access"

async function getUser(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.email) return null

  const user = await ctx.db
    .query(TABLE_SLUG_USERS)
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first()

  return user ?? null
}

/**
 * List users available for impersonation.
 * Only accessible by users with adminRoles.
 */
export const listImpersonatableUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getUser(ctx)
    if (!currentUser) return []

    const roles = (currentUser.role as string[]) ?? []

    // Check if user has an adminRole
    const isAdmin = roles.some((r) => access.adminRoles.includes(r))
    if (!isAdmin) return []

    // Fetch all users except the current one
    const allUsers = await ctx.db.query(TABLE_SLUG_USERS).collect()

    return allUsers
      .filter((u) => u._id !== currentUser._id)
      .map((u) => ({
        id: u._id as string,
        name: u.name as string,
        email: u.email as string,
        avatar: (u.image as string) ?? undefined,
        roles: (u.role as string[]) ?? [],
      }))
  },
})
