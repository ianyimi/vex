import type { VexQueryCtx } from "@vexcms/core"

import { TABLE_SLUG_USERS } from "~/db/constants"

import type { MutationCtx, QueryCtx } from "../_generated/server"

export type UserAuth = {
  roles: string[]
  user: Record<string, unknown>
}

/**
 * Returns the authenticated user and their roles, or null if unauthenticated.
 * Called by all generated collection query and mutation files.
 *
 * Overloaded to accept QueryCtx, MutationCtx, and VexQueryCtx.
 */
export async function getUser(ctx: QueryCtx): Promise<null | UserAuth>
export async function getUser(ctx: MutationCtx): Promise<null | UserAuth>
export async function getUser(ctx: VexQueryCtx): Promise<null | UserAuth>
export async function getUser(ctx: MutationCtx | QueryCtx | VexQueryCtx): Promise<null | UserAuth> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.email) {
    return null
  }

  const user = await (ctx.db as QueryCtx["db"])
    .query(TABLE_SLUG_USERS)
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first()

  if (!user) {
    return null
  }

  return {
    roles: (user.role as string[]) ?? [],
    user: user as Record<string, unknown>,
  }
}
