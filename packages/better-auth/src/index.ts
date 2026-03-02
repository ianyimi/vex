import type { VexAuthAdapter, AuthTableDefinition } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import type { TableSlugs } from "./types";

interface VexBetterAuthOptions {
  config?: BetterAuthOptions;
}
/**
 * Creates a VexAuthAdapter from a BetterAuthOptions config.
 *
 * Accepts the same config object you pass to betterAuth() on the server.
 * Only reads schema-affecting properties (modelNames, additionalFields, plugins).
 * Runtime options (database, secret, baseURL, etc.) are ignored.
 *
 * @example
 * ```ts
 * import { vexBetterAuth } from "@vexcms/better-auth";
 * import { admin } from "better-auth/plugins";
 *
 * export default defineConfig({
 *   auth: vexBetterAuth({
 *     user: { modelName: "users" },
 *     plugins: [admin()],
 *   }),
 *   // ...
 * });
 * ```
 */
export function vexBetterAuth(props?: VexBetterAuthOptions): VexAuthAdapter {
  const slugs: TableSlugs = {
    userSlug: props?.config?.user?.modelName ?? "user",
    sessionSlug: props?.config?.session?.modelName ?? "session",
    accountSlug: props?.config?.account?.modelName ?? "account",
    verificationSlug: props?.config?.verification?.modelName ?? "verification",
  };

  // TODO: replace these with extractUserFields(config) in Step 5
  const userFields = {};

  // TODO: replace with buildBaseTables(slugs) in Step 6
  const tables: AuthTableDefinition[] = [];

  // TODO: wire in resolvePluginContributions() in Step 7

  return {
    name: "better-auth",
    userCollection: slugs.userSlug,
    userFields,
    tables,
  };
}
