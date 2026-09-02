import type { BetterAuthOptions } from "better-auth"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

import { createPlugins } from "./plugins"

export const authOptions: BetterAuthOptions = {
  account: {
    modelName: TABLE_SLUG_ACCOUNTS,
  },
  baseURL: process.env.SITE_URL,
  emailAndPassword: {
        enabled: true
      },
  plugins: createPlugins(),
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    modelName: TABLE_SLUG_SESSIONS,
  },
  trustedOrigins: [process.env.SITE_URL!],
  user: {
    additionalFields: {
      roles: {
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
