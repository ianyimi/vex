import type { VexAuthAdapter } from "@vexcms/core";
import type { BetterAuthOptions } from "better-auth";
import { extractAuthTables } from "./extract/tables";

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
  const tables = extractAuthTables(props?.config ?? {});

  return {
    name: "better-auth",
    tables,
  };
}
