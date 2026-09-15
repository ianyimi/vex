/**
 * Client-safe entry point for `@vexcms/better-auth`.
 *
 * The browser imports this — never the package root, which re-exports the
 * Convex DB adapter and pulls `convex/server` into the graph. Everything here
 * is pure data transformation: `@vexcms/core` plus Better Auth's
 * `getAuthTables`/`mergeSchema` (~1 KB gzipped), with no plugin factories, no
 * environment reads, and no server SDKs.
 *
 * @example
 * ```ts
 * // src/vex.config.ts
 * import { betterAuthCollections } from "@vexcms/better-auth/client";
 * import { authSchema } from "./auth/schema";
 *
 * export default defineConfig({ authCollections: betterAuthCollections(authSchema) });
 * ```
 *
 * @module
 */
export { betterAuthCollections } from "./collections";
export type {
  BetterAuthCoreTableInput,
  BetterAuthSchemaInput,
} from "./collections";
export type {
  BetterAuthPluginDescriptors,
  BetterAuthPluginName,
  ModelledPluginDescriptors,
  ModelledPluginName,
  PluginDBSchema,
  PluginSchemaOverride,
} from "./pluginSchemas";
