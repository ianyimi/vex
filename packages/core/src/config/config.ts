import { mergeAuthCollections } from "../auth/mergeCollections";
import { VexConfig, VexConfigInput } from "./types";

/**
 * Resolves a raw Vex config input into a fully-populated `VexConfig`.
 *
 * Applies defaults for any omitted properties — an absent `collections`
 * array is replaced with an empty array so downstream consumers can always
 * iterate without null-checking.
 *
 * When an `auth` adapter is provided, its collections are merged with
 * user-defined collections via {@link mergeAuthCollections}. Protected
 * auth collections cannot be overridden, and locked fields are preserved.
 *
 * @param config - The raw Vex configuration supplied by the caller.
 * @returns The resolved `VexConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * // Basic config with user-defined collections only
 * defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() } }),
 *   ],
 * });
 * ```
 *
 * @example
 * ```ts
 * // Config with Better Auth integration
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 *
 * defineConfig({
 *   auth: betterAuthAdapter(authOptions),
 *   collections: [posts, authors],
 * });
 * ```
 *
 * @see {@link VexConfigInput} for the user-facing input type
 * @see {@link VexConfig} for the resolved return type
 * @see {@link mergeAuthCollections} for auth collection merge logic
 * @see {@link betterAuthAdapter} for the Better Auth adapter
 */
export function defineConfig(config?: VexConfigInput): VexConfig {
  return {
    basePath: "/admin",
    ...config,
    auth: config?.auth,
    collections: mergeAuthCollections({
      authCollections: config?.auth?.collections ?? [],
      userCollections: config?.collections ?? [],
    }),
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        ...config?.admin?.sidebar,
      },
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
  };
}
