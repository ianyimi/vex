import type { BetterAuthSchemaInput } from "@vexcms/better-auth/client";

import {
  TABLE_SLUG_ACCOUNTS,
  TABLE_SLUG_SESSIONS,
  TABLE_SLUG_USERS,
  TABLE_SLUG_VERIFICATIONS,
  USER_ROLES,
} from "~/db/constants";

/**
 * Everything about this app's Better Auth setup that determines which
 * collections exist and which fields they carry — and nothing else.
 *
 * Deliberately a separate module from `./options`: this one is imported by
 * `~/vex.config` and therefore compiles into the browser bundle, while
 * `options.ts` reads `process.env` and pulls `better-auth/next-js` (→
 * `next/headers`) through its plugin list. Importing any binding from
 * `options.ts` would evaluate all of that, so the shared half lives here and
 * `options.ts` spreads it.
 *
 * `plugins` names which plugins are registered plus the options that change
 * their tables (`organization.teams`, per-table `additionalFields`). Runtime
 * plugin options — roles, invitation mailers, secrets — stay on the real
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
    organization: {
      teams: true,
      schema: {
        organization: {
          additionalFields: {
            test: { type: "string", input: false, required: false },
          },
        },
        invitation: {
          additionalFields: {
            roles: { type: "string[]", input: true, required: true },
          },
        },
      },
    },
  },
} satisfies BetterAuthSchemaInput;
