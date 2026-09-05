/**
 * Entry point for the `@vexcms/better-auth` package.
 *
 * Integrates [Better Auth](https://better-auth.com/) with VexCMS as the auth backend.
 * Call `betterAuthAdapter()` in `vex.config.ts` to register Better Auth collections
 * as VexCMS collections. Use `authDbApi()` and `createBetterAuthAdapter()` in your
 * Convex schema to wire the DB adapter.
 *
 * @example
 * ```ts
 * // vex.config.ts
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 * import { authOptions } from "~/auth/options";
 *
 * export default defineConfig({
 *   auth: betterAuthAdapter({ config: authOptions }),
 *   collections: [posts],
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
