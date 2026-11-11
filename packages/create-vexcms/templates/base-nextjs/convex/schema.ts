import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { TABLE_SLUG_ACCOUNTS } from "~/db/constants"

import {
  apikey,
  images,
  jwks,
  session,
  user,
  verification,
  vex_versions,
  vex_views,
} from "./vex.schema"

export default defineSchema({
  vex_versions,
  vex_views,
  user,
  // `organization`/`team`/`teamMember`/`member`/`invitation`/`vex_globals` are
  // hand-written, not imported from `./vex.schema` — the generator only emits
  // them when the `organization()` plugin (`--orgs`) or a registered global is
  // actually present in `vex.config.ts`. `access.ts` and every `getAuth`
  // caller (`convex/vex.ts`, `convex/vex/media.ts`, `convex/vex/globals.ts`)
  // reference `orgCollectionSlug`/`resolveOrgs: true` unconditionally, so
  // these tables must exist in the schema from day one — enabling `--orgs`
  // or registering a global later needs no schema migration.
  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
  }).index("by_slug", ["slug"]),
  images,
  team: defineTable({
    name: v.string(),
    organizationId: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index("by_organizationId", ["organizationId"]),
  teamMember: defineTable({
    teamId: v.string(),
    userId: v.string(),
    createdAt: v.optional(v.number()),
  })
    .index("by_teamId", ["teamId"])
    .index("by_userId", ["userId"]),
  organization: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.string()),
    createdAt: v.number(),
    metadata: v.optional(v.string()),
  }).index("by_slug", ["slug"]),
  member: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_userId", ["userId"]),
  invitation: defineTable({
    organizationId: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
    teamId: v.optional(v.string()),
    status: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    inviterId: v.string(),
    roles: v.array(v.string()),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_email", ["email"]),
  session,
  verification,
  apikey,
  jwks,

  [TABLE_SLUG_ACCOUNTS]: defineTable({
    accessToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    accountId: v.string(),
    createdAt: v.number(),
    idToken: v.optional(v.string()),
    password: v.optional(v.string()),
    providerId: v.string(),
    refreshToken: v.optional(v.string()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    updatedAt: v.number(),
    userId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),
})
