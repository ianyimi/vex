import type { BetterAuthSchemaInput } from "@vexcms/better-auth/client"

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants"

/**
 * Everything about your Better Auth setup that determines which collections
 * exist and which fields they carry — and nothing else.
 *
 * This is the one auth module the browser reads: `src/vex.config.ts` passes it
 * to `betterAuthCollections()` to build the admin panel's auth collections,
 * and `./options` spreads it so the same model names and fields reach the
 * database. Add a `user.additionalFields` entry here and it shows up in both.
 *
 * Keep it inert. `./options` reads `process.env` and `./plugins` pulls
 * `better-auth/next-js` (→ `next/headers`), which is why they are separate
 * files — importing either from the client config would drag the server into
 * your browser bundle. Runtime plugin options (admin roles, mailers, OAuth
 * secrets) belong on the real plugin instances in `./plugins`; only options
 * that change which TABLES exist belong here.
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
    // {{ORGANIZATIONS_SCHEMA}}
  },
} satisfies BetterAuthSchemaInput
