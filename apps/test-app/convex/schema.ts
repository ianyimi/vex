import { extendTable } from "@vexcms/core"
import { defineSchema } from "convex/server"
import { v } from "convex/values"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_ARTICLES,
  TABLE_SLUG_CATEGORIES,
  TABLE_SLUG_JWKS,
  TABLE_SLUG_POSTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
} from "~/db/constants"

import {
  account,
  apikey,
  articles,
  categories,
  jwks,
  posts,
  session,
  user,
  verification,
  media,
  vex_versions,
} from "./vex.schema"

export default defineSchema({
  media,
  apikey,
  [TABLE_SLUG_ARTICLES]: articles,
  [TABLE_SLUG_CATEGORIES]: categories,
  [TABLE_SLUG_POSTS]: extendTable({
    additionalFields: {
      test: v.optional(v.string()),
    },
    table: posts,
  })
    .index("by_status", ["status"])
    .index("by_test", ["test"]),
  // Better Auth component tables (type definitions only - actual tables are in component)
  [TABLE_SLUG_ACCOUNTS]: account,
  [TABLE_SLUG_SESSIONS]: session,
  [TABLE_SLUG_USERS]: user,

  [TABLE_SLUG_VERIFICATIONS]: verification,

  [TABLE_SLUG_JWKS]: jwks,

  vex_versions,
})
