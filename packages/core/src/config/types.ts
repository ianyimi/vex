import { CollectionConfig } from "../collections";

/**
 * User-facing configuration input passed to `defineConfig()`.
 *
 * All properties are optional — omitting `collections` produces an empty CMS
 * with no custom content types registered.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   collections: [], // no collections registered — the CMS starts empty
 * }
 * ```
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
 * @see {@link VexConfig} for the resolved type after defaults are applied
 * @see {@link defineConfig} for the config function
 */
export interface VexConfigInput {
  /** Content collections to register with the CMS. Defaults to `[]` if omitted. */
  collections?: CollectionConfig[];
}

/**
 * Resolved Vex CMS configuration after defaults are applied by `defineConfig()`.
 *
 * @see {@link VexConfigInput} for the user-facing input type
 * @see {@link defineConfig} for the config function
 */
export interface VexConfig {
  /** All registered content collections — always an array after defaults are applied. */
  collections: CollectionConfig[];
}
