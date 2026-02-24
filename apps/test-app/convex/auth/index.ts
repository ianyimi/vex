import type { GenericActionCtx } from "convex/server"

import { betterAuth } from "better-auth"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

import type { DataModel } from "../_generated/dataModel"

import schema from "../schema"
import { convexAdapter } from "./adapter"
import betterAuthPlugins from "./plugins"

export const createAuth = (
  ctx: GenericActionCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    account: {
      modelName: TABLE_SLUG_ACCOUNTS,
    },
    baseURL: process.env.SITE_URL,
    database: convexAdapter(ctx, schema),
    emailAndPassword: {
      enabled: true,
    },
    logger: {
      disabled: optionsOnly,
    },
    plugins: betterAuthPlugins,
    secret: process.env.BETTER_AUTH_SECRET,
    session: {
      modelName: TABLE_SLUG_SESSIONS,
    },
    trustedOrigins: [process.env.SITE_URL!],
    user: {
      additionalFields: {
        role: {
          type: "string[]",
          defaultValue: [USER_ROLES.user],
          required: true,
        },
      },
      modelName: TABLE_SLUG_USERS,
    },
    verification: {
      modelName: TABLE_SLUG_VERIFICATIONS,
    },
  })
}
