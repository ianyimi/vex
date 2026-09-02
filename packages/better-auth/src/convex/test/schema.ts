import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Fixture schema for `@vexcms/better-auth` tests.
 * Includes all the auth-related tables that better-auth uses.
 */
const schema = defineSchema({
  // Better Auth core tables
  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    role: v.optional(v.string()),
    banned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    banExpires: v.optional(v.number()),
    userId: v.optional(v.string()),
  })
    .index("by_email", ["email"]),

  session: defineTable({
    token: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.number()),
    refreshTokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_accountId", ["accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_identifier", ["identifier"]),

  apikey: defineTable({
    key: v.string(),
    name: v.optional(v.string()),
    userId: v.string(),
    referenceId: v.string(),
    prefix: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    permissions: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_key", ["key"]),

  jwks: defineTable({
    publicKey: v.string(),
    privateKey: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  }),

  // Test tables for generic CRUD operations
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    content: v.optional(v.string()),
    published: v.optional(v.boolean()),
    authorId: v.string(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_authorId", ["authorId"])
    .index("by_published", ["published"]),

  authors: defineTable({
    name: v.string(),
    bio: v.optional(v.string()),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});

export default schema;