import type { BetterAuthSchemaInput } from "@vexcms/better-auth/client"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

/**
 * Everything about this site's Better Auth setup that determines which
 * collections exist and which fields they carry — and nothing else.
 *
 * Deliberately a separate module from `./options`: this one is imported by
 * `~/vex.config` and therefore compiles into the browser bundle, while
 * `options.ts` reads `process.env` and pulls `better-auth/next-js` (→
 * `next/headers`) through its plugin list.
 *
 * Runtime plugin options — admin roles, secrets, mailers — stay on the real
 * instances in `./plugins`, so nothing server-side can leak into the client
 * bundle through this file.
 *
 * @see betterAuthCollections in @vexcms/better-auth/client
 * @see ./options for the server-side options that spread this
 */
export const authSchema = {
  account: { modelName: TABLE_SLUG_ACCOUNTS },
  session: { modelName: TABLE_SLUG_SESSIONS },
  user: {
    modelName: TABLE_SLUG_USERS,
    additionalFields: {
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.user],
        required: true,
      },
    },
  },
  verification: { modelName: TABLE_SLUG_VERIFICATIONS },
  plugins: {
    admin: true,
    anonymous: true,
    apiKey: true,
    convex: true,
  },
} satisfies BetterAuthSchemaInput
