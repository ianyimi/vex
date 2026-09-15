import type { AuthCollectionConfig } from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";

import { betterAuthAdapter } from "./adapter";
import type {
  BetterAuthPluginDescriptors,
  PluginDBSchema,
} from "./pluginSchemas";
import { resolvePluginStubs } from "./pluginSchemas";

/** Schema-affecting settings for one of Better Auth's four core tables. */
export interface BetterAuthCoreTableInput {
  /** Table name this model is stored under. Defaults to Better Auth's own (`user`, `session`, …). */
  modelName?: string | undefined;
  /** Renames of Better Auth's built-in columns. */
  fields?: Record<string, string> | undefined;
  /** Extra columns on this table, in Better Auth's `DBFieldAttribute` shape. */
  additionalFields?: Record<string, DBFieldAttribute> | undefined;
}

/**
 * Client-safe description of a Better Auth setup — everything that determines
 * which collections exist and which fields they carry, and nothing else.
 *
 * Author this once in a module with no server imports (conventionally
 * `src/auth/schema.ts`), spread it into your `authOptions` beside the secret,
 * base URL, and real plugin instances, and pass the whole object to
 * {@link betterAuthCollections} from `vex.config.ts`. `plugins` is ignored by
 * `BetterAuthOptions` — it is a descriptor map, not plugin instances — so
 * `authOptions` drops that one key and overrides it with the real factories.
 *
 * @see {@link betterAuthCollections}
 */
export interface BetterAuthSchemaInput {
  /** The user table. */
  user?: BetterAuthCoreTableInput | undefined;
  /** The session table. */
  session?: BetterAuthCoreTableInput | undefined;
  /** The account table. */
  account?: BetterAuthCoreTableInput | undefined;
  /** The verification table. */
  verification?: BetterAuthCoreTableInput | undefined;
  /**
   * Which Better Auth plugins are registered, and their schema-affecting
   * options. `true` takes a plugin's default schema.
   */
  plugins?: BetterAuthPluginDescriptors | undefined;
  /**
   * Schemas of plugins `@vexcms/better-auth` does not model — read `schema`
   * off the real plugin instance on your server and pass the value here.
   */
  extraSchema?: PluginDBSchema | PluginDBSchema[] | undefined;
}

/**
 * Builds the Vex auth collections a Better Auth setup implies, without
 * instantiating a single Better Auth plugin.
 *
 * Runs Better Auth's own `getAuthTables` over plain `{ id, schema }` plugin
 * stubs resolved from this package's generated schema snapshot, then converts
 * the result with the same pipeline `betterAuthAdapter` uses on the server —
 * so the collections are identical to the live adapter's by construction, and
 * `packages/better-auth/src/pluginSchemas.test.ts` asserts exactly that.
 *
 * Safe to call from `vex.config.ts`: the whole graph is `@vexcms/core` plus
 * `better-auth/db` (~1 KB gzipped). Instantiating real plugin factories here
 * instead would add ~154 KB gzipped to the admin bundle.
 *
 * @param schema - The client-safe description of your Better Auth setup.
 * @returns The auth collections, ready for `defineConfig({ authCollections })`.
 * @throws {Error} When `plugins` names a plugin whose schema is not modelled — use `extraSchema`.
 *
 * @example
 * ```ts
 * // src/auth/schema.ts — no server imports, safe in the browser bundle
 * export const authSchema = {
 *   user: { modelName: "user", additionalFields: { roles: { type: "string[]", required: true } } },
 *   plugins: { admin: true, anonymous: true, organization: { teams: true }, convex: true },
 * } satisfies BetterAuthSchemaInput;
 *
 * // src/vex.config.ts
 * export default defineConfig({ authCollections: betterAuthCollections(authSchema) });
 *
 * // src/auth/options.ts — one source of truth for model names and fields
 * const { plugins: _descriptors, ...schemaOptions } = authSchema;
 * export const authOptions: BetterAuthOptions = {
 *   ...schemaOptions,
 *   secret: process.env.BETTER_AUTH_SECRET,
 *   plugins: createPlugins(),
 * };
 * ```
 *
 * @see {@link BetterAuthSchemaInput} for the input shape
 * @see {@link betterAuthAdapter} for the server-side adapter that verifies this result
 */
export function betterAuthCollections(
  schema: BetterAuthSchemaInput = {},
): AuthCollectionConfig[] {
  const { plugins, extraSchema, ...coreTables } = schema;
  const config: BetterAuthOptions = {
    ...coreTables,
    plugins: resolvePluginStubs({ plugins, extraSchema }) as never,
  };
  return betterAuthAdapter({ config }).collections;
}
