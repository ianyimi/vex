import { internalMutation, internalQuery } from "@convex/_generated/server"
import { authDbApi } from "@vexcms/better-auth"

import schema from "../schema"

/**
 * Convex internal mutations and queries that implement Better Auth's DB interface.
 *
 * Wire these into your Convex schema so `@vexcms/better-auth` can call them
 * via `ctx.runMutation(anyApi.auth.db.dbCreate, ...)`:
 *
 * ```ts
 * // convex/schema.ts
 * import { dbCreate, dbFindOne, ... } from "./auth/db";
 *
 * // register as internal (visibility: internal) in your schema tables:
 * export default defineSchema({
 *   users: defineTable(...).index("by_email", ["email"]),
 *   sessions: defineTable(...).index("by_token", ["token"]),
 * }, {
 *   internal: {
 *     dbCreate,
 *     dbFindOne,
 *     dbFindMany,
 *     dbCount,
 *     dbUpdate,
 *     dbUpdateMany,
 *     dbDelete,
 *     dbDeleteMany,
 *   },
 * });
 * ```
 *
 * @see {@link authDbApi} for the factory that produces these functions
 */
export const {
  dbCreate,
  dbFindOne,
  dbFindMany,
  dbCount,
  dbUpdate,
  dbUpdateMany,
  dbDelete,
  dbDeleteMany,
} = authDbApi({ schema, internalQuery, internalMutation })
