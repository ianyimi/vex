import { internal } from "@convex/_generated/api"
import { internalMutation } from "@convex/_generated/server"

import { ANONYMOUS_USER_MAX_AGE_MS, ANONYMOUS_USER_PURGE_BATCH_SIZE, TABLE_SLUG_ACCOUNTS, TABLE_SLUG_API_KEYS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * Deletes anonymous Better Auth users (`isAnonymous: true`) older than
 * `ANONYMOUS_USER_MAX_AGE_MS`, plus each deleted user's `session`, `account`
 * and `apikey` rows (looked up by `by_userId` / `by_referenceId`, deleted
 * before the user row itself so no row ever points at a missing user). Runs
 * through a raw `internalMutation`, mirroring `convex/auth/db.ts`, because
 * Better Auth's own tables are written through raw internal mutations, never
 * `vexMutation` triggers.
 *
 * Each run scans `by_creation_time` and filters to anonymous users, reading
 * every older row — including non-anonymous ones the filter discards — until
 * it has collected `ANONYMOUS_USER_PURGE_BATCH_SIZE` matches or runs out of
 * older rows. `take(ANONYMOUS_USER_PURGE_BATCH_SIZE)` bounds the number of
 * *matches*, not the number of rows read per run (backlogged:
 * `.agent/docs/product/backlog.md`, "Purge scan cost for long-lived users").
 * When the batch is full, schedules another run of itself immediately
 * (`ctx.scheduler.runAfter(0, ...)`) so a large backlog drains over
 * consecutive runs instead of blocking the cron's own schedule.
 *
 * @returns `{ deleted, rescheduled }` — `deleted` is the number of user rows
 * removed this run; `rescheduled` is whether another run was scheduled
 * because the batch was full.
 */
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; rescheduled: boolean }> => {
    const cutoff = Date.now() - ANONYMOUS_USER_MAX_AGE_MS
    const candidates = await ctx.db
      .query(TABLE_SLUG_USERS)
      .withIndex("by_creation_time", (q) => q.lt("_creationTime", cutoff))
      .filter((q) => q.eq(q.field("isAnonymous"), true))
      .take(ANONYMOUS_USER_PURGE_BATCH_SIZE)

    for (const candidate of candidates) {
      const sessions = await ctx.db
        .query(TABLE_SLUG_SESSIONS)
        .withIndex("by_userId", (q) => q.eq("userId", candidate._id))
        .collect()
      for (const session of sessions) {
        await ctx.db.delete(session._id)
      }

      const accounts = await ctx.db
        .query(TABLE_SLUG_ACCOUNTS)
        .withIndex("by_userId", (q) => q.eq("userId", candidate._id))
        .collect()
      for (const account of accounts) {
        await ctx.db.delete(account._id)
      }

      const apikeys = await ctx.db
        .query(TABLE_SLUG_API_KEYS)
        .withIndex("by_referenceId", (q) => q.eq("referenceId", candidate._id))
        .collect()
      for (const apikey of apikeys) {
        await ctx.db.delete(apikey._id)
      }

      await ctx.db.delete(candidate._id)
    }

    const rescheduled = candidates.length === ANONYMOUS_USER_PURGE_BATCH_SIZE
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.auth.anonymousUsers.purgeExpired, {})
    }

    return { deleted: candidates.length, rescheduled }
  },
})
