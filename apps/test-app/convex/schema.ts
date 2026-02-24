import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_JWKS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
} from "~/db/constants"

export default defineSchema({
  // Better Auth component tables (type definitions only - actual tables are in component)
  [TABLE_SLUG_USERS]: defineTable({
    name: v.string(),
    banExpires: v.optional(v.number()), // admin plugin
    banned: v.optional(v.boolean()), // admin plugin
    banReason: v.optional(v.string()), // admin plugin
    createdAt: v.number(),
    displayUsername: v.optional(v.union(v.null(), v.string())),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.union(v.null(), v.boolean())),
    phoneNumber: v.optional(v.union(v.null(), v.string())),
    phoneNumberVerified: v.optional(v.union(v.null(), v.boolean())),
    role: v.array(v.string()), // admin plugin
    twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
    updatedAt: v.number(),
    userId: v.optional(v.union(v.null(), v.string())),
    username: v.optional(v.union(v.null(), v.string())),
  }).index("by_email", ["email"]),

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

  [TABLE_SLUG_SESSIONS]: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    impersonatedBy: v.optional(v.id(TABLE_SLUG_USERS)), // admin plugin
    ipAddress: v.optional(v.string()),
    token: v.string(),
    updatedAt: v.number(),
    userAgent: v.optional(v.string()),
    userId: v.id(TABLE_SLUG_USERS),
  }).index("by_token", ["token"]),

  [TABLE_SLUG_VERIFICATIONS]: defineTable({
    createdAt: v.number(),
    expiresAt: v.number(),
    identifier: v.string(),
    updatedAt: v.number(),
    value: v.string(),
  })
    .index("by_identifier", ["identifier"])
    .index("by_expiresAt", ["expiresAt"]),

  [TABLE_SLUG_JWKS]: defineTable({
    createdAt: v.number(),
    privateKey: v.optional(v.string()),
    publicKey: v.string(),
  }),
})
