import type { BetterAuthOptions } from "better-auth"

import { anonRoleDatabaseHook } from "@vexcms/better-auth"

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
  databaseHooks: {
    // Ties Better Auth's anonymous-plugin users to `access.anonRole` (see
    // `~/auth/access.ts`) by stamping the same role explicitly, rather than
    // relying solely on `roles`' `defaultValue` below — which every new user
    // gets regardless of `isAnonymous`, anon-plugin or not.
    user: anonRoleDatabaseHook(USER_ROLES.user),
  },
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
