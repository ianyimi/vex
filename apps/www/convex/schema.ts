import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ============================================================================
  // APP TABLES
  // ============================================================================

  posts: defineTable({
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
  }),

  // ============================================================================
  // BETTER AUTH TABLES
  // ============================================================================

  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Admin plugin
    role: v.array(v.string()),
    banned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    banExpires: v.optional(v.number()),
    // Username plugin
    username: v.optional(v.union(v.null(), v.string())),
    displayUsername: v.optional(v.union(v.null(), v.string())),
    // Two-factor plugin
    twoFactorEnabled: v.optional(v.union(v.null(), v.boolean())),
    // Phone number plugin
    phoneNumber: v.optional(v.union(v.null(), v.string())),
    phoneNumberVerified: v.optional(v.union(v.null(), v.boolean())),
    // Anonymous plugin
    isAnonymous: v.optional(v.union(v.null(), v.boolean())),
    userId: v.optional(v.union(v.null(), v.string())),
  }).index("by_email", ["email"]),

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

  session: defineTable({
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    userId: v.id("user"),
    // Admin plugin
    impersonatedBy: v.optional(v.id("user")),
  }).index("by_token", ["token"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_identifier", ["identifier"])
    .index("by_expiresAt", ["expiresAt"]),

  jwks: defineTable({
    publicKey: v.string(),
    privateKey: v.optional(v.string()),
    createdAt: v.number(),
  }),
})
