import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { TABLE_SLUG_ACCOUNTS, TABLE_SLUG_USERS } from "~/db/constants";

import {
  apikey,
  footers,
  headers,
  images,
  invitation,
  jwks,
  member,
  organization,
  pages,
  session,
  site_settings,
  team,
  teamMember,
  themes,
  verification,
  vex_globals,
} from "./vex.schema";

export default defineSchema({
  vex_globals,
  images,
  team,
  teamMember,
  organization,
  member,
  invitation,
  site_settings,
  session,
  verification,
  apikey,
  jwks,
  headers,
  footers,
  themes,
  pages,

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
    role: v.optional(v.string()), // admin plugin — single string in BA 1.5
    roles: v.array(v.string()), // our multi-role field via additionalFields
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
});
