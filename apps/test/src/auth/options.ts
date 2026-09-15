import type { BetterAuthOptions } from "better-auth";

import { createPlugins } from "./plugins";
import { authSchema } from "./schema";

// `plugins` on the shared schema is a descriptor map for
// `betterAuthCollections`, not Better Auth plugin instances — dropped by name
// here rather than shadowed by the override below, so the intent survives a
// reordering of this object literal.
const { plugins: _pluginDescriptors, ...schemaOptions } = authSchema;

/**
 * Better Auth options for the demo/development site.
 *
 * Model names and `user.additionalFields` come from `./schema`, the one
 * module both this file and `~/vex.config` read — so a field added there
 * shows up in the admin panel and in the database without being written
 * twice. Everything here on top of that spread is server-only: the secret,
 * the base URL, and the real plugin instances.
 *
 * @see ./schema for the shared, client-safe half
 * @see createPlugins in ./plugins
 */
export const authOptions: BetterAuthOptions = {
  ...schemaOptions,
  baseURL: process.env.SITE_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: createPlugins(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.SITE_URL!],
};
