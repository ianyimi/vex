import { type DataModel } from "@convex/_generated/dataModel"
import schema from "@convex/schema"
import { type BetterAuthOptions } from "better-auth"
import { type GenericActionCtx } from "convex/server"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

import { convexAdapter } from "./adapter"
import betterAuthPlugins from "./plugins"

export const betterAuthOptions: BetterAuthOptions = {
  account: {
    modelName: TABLE_SLUG_ACCOUNTS,
  },
  baseURL: process.env.SITE_URL,
  emailAndPassword: {
    enabled: true,
  },
  logger: {
    disabled: false,
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
}

export function buildBetterAuthOptions({
  ctx,
  optionsOnly = false,
}: {
  ctx: GenericActionCtx<DataModel>
  optionsOnly?: boolean
}) {
  return {
    ...betterAuthOptions,
    database: convexAdapter(ctx, schema),
    logger: {
      ...betterAuthOptions.logger,
      disabled: optionsOnly,
    },
  }
}
