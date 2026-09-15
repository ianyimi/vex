import type { BetterAuthOptions } from "better-auth"

import { anonRoleDatabaseHook } from "@vexcms/better-auth"

import { USER_ROLES } from "~/db/constants"

import { createPlugins } from "./plugins"
import { authSchema } from "./schema"

// `plugins` on the shared schema is a descriptor map for
// `betterAuthCollections`, not Better Auth plugin instances — dropped by name
// so the intent survives a reordering of the object literal below.
const { plugins: _pluginDescriptors, ...schemaOptions } = authSchema

/**
 * Better Auth options for the marketing site.
 *
 * Model names and `user.additionalFields` come from `./schema`, the one module
 * both this file and `~/vex.config` read, so a field added there reaches the
 * database and the admin panel without being written twice.
 *
 * @see ./schema for the shared, client-safe half
 */
export const authOptions: BetterAuthOptions = {
  ...schemaOptions,
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
  trustedOrigins: [process.env.SITE_URL!],
}
