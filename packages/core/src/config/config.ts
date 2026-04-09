import { VexConfig, VexConfigInput } from "./types";

/**
 * Resolves a raw Vex config input into a fully-populated `VexConfig`.
 *
 * Applies defaults for any omitted properties — currently, an absent
 * `collections` array is replaced with an empty array so downstream
 * consumers can always iterate without null-checking.
 *
 * @param config - The raw Vex configuration supplied by the caller.
 * @returns The resolved `VexConfig` with all defaults applied.
 *
 * @example
 * ```ts
 * defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() } }),
 *   ],
 * });
 * ```
 *
 * @see {@link VexConfigInput} for the user-facing input type
 * @see {@link VexConfig} for the resolved return type
 */
export function defineConfig(config: VexConfigInput): VexConfig {
  return {
    collections: [],
    ...config,
    admin: {
      ...config.admin,
      sidebar: {
        side: "left",
        ...config.admin?.sidebar,
      },
    },
  };
}
