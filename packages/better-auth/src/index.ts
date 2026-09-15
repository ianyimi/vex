/**
 * Entry point for the `@vexcms/better-auth` package.
 *
 * Integrates [Better Auth](https://better-auth.com/) with VexCMS as the auth backend. This is
 * the **server-only** half of the package — it re-exports `betterAuthAdapter()`, which closes
 * over your real Better Auth options (plugin factories, secrets), and Convex DB-adapter wiring.
 * Never import this entry point from client code; the browser imports
 * `@vexcms/better-auth/client` instead, which derives the same collections from a plain-data
 * schema description with no plugin factories or environment reads.
 *
 * Call `betterAuthAdapter()` in `vex.config.server.ts` to register Better Auth collections
 * as VexCMS collections — `defineServerConfig()` also uses its `collections` to verify the
 * `authCollections` the client config declared still match, throwing `VexAuthConfigError` on
 * drift. Use `authDbApi()` and `createBetterAuthAdapter()` in your Convex schema to wire the
 * DB adapter.
 *
 * @example
 * ```ts
 * // vex.config.server.ts
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 * import { defineServerConfig } from "@vexcms/core";
 *
 * import { authOptions } from "~/auth/options";
 *
 * import vexConfig from "./vex.config";
 *
 * export default defineServerConfig({
 *   config: vexConfig,
 *   server: {
 *     auth: { adapter: betterAuthAdapter({ config: authOptions }) },
 *   },
 * });
 * ```
 *
 * @example
 * ```ts
 * // convex/auth/db.ts — wire the DB adapter into Convex
 * import { authDbApi } from "@vexcms/better-auth/convex";
 * import { internalMutation, internalQuery } from "convex/_generated/server";
 * import schema from "../schema";
 *
 * export const {
 *   dbCreate,
 *   dbFindOne,
 *   dbFindMany,
 *   dbCount,
 *   dbUpdate,
 *   dbUpdateMany,
 *   dbDelete,
 *   dbDeleteMany,
 * } = authDbApi({ schema, internalQuery, internalMutation });
 * ```
 *
 * @see {@link betterAuthAdapter} for the main Vex auth adapter function
 * @see {@link authDbApi} for wiring the Convex DB operations
 * @see {@link better-auth/src!betterAuthCollections} for the client-safe half, from `@vexcms/better-auth/client`
 */
export { betterAuthAdapter, type BetterAuthAdapterOptions } from "./adapter";
export {
  authDbApi,
  createBetterAuthAdapter,
  convexAdapter,
  createGetAuth,
  anonRoleDatabaseHook,
  type CreateBetterAuthAdapterArgs,
  type CreateBetterAuthAdapterResult,
} from "./convex";
