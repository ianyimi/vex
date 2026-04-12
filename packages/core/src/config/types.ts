import { CollectionConfig } from "../collections";

/**
 * User-facing configuration input for the VexCMS admin panel.
 *
 * All properties are optional — omitted properties fall back to the defaults below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   sidebar: {
 *     side: "left", // sidebar rendered on the left side of the viewport
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Move the sidebar to the right side
 * defineConfig({
 *   admin: { sidebar: { side: "right" } },
 *   collections: [posts],
 * })
 * ```
 *
 * @see {@link AdminConfig} for the resolved type after defaults are applied
 * @see {@link defineConfig} for the config function
 */
export interface AdminConfigInput {
  /**
   * Navigation sidebar configuration for the admin panel.
   *
   * Controls the sidebar that houses collection links and navigation items.
   * All properties are optional; omitted values fall back to the defaults below.
   *
   * **Defaults applied by `defineConfig()`:**
   * ```ts
   * { side: "left" } // sidebar rendered on the left side of the viewport
   * ```
   */
  sidebar?: {
    /**
     * Which side of the viewport the admin sidebar is anchored to.
     *
     * - `"left"` — sidebar sits on the left (default)
     * - `"right"` — sidebar sits on the right
     */
    side?: "left" | "right";
  };
}

/**
 * Resolved admin panel configuration after defaults are applied by `defineConfig()`.
 *
 * @see {@link AdminConfigInput} for the user-facing input type
 * @see {@link defineConfig} for the config function
 */
export interface AdminConfig {
  /** Navigation sidebar configuration — always present after defaults are applied. */
  sidebar: {
    /** Which side of the viewport the admin sidebar is anchored to. */
    side: "left" | "right";
  };
}

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
 * // Register a collection
 * defineConfig({
 *   collections: [
 *     defineCollection({ slug: "posts", fields: { title: text() } }),
 *   ],
 * });
 *
 * // Register collections and customise the admin panel
 * defineConfig({
 *   admin: { sidebar: { side: "right" } },
 *   collections: [posts, authors],
 * });
 * ```
 *
 * @see {@link VexConfig} for the resolved type after defaults are applied
 * @see {@link defineConfig} for the config function
 */
export interface VexConfigInput {
  /**
   * Admin panel configuration. All properties are optional — omitted values fall back to defaults.
   *
   * **Defaults applied by `defineConfig()`:**
   * ```ts
   * { sidebar: { side: "left" } }
   * ```
   *
   * @see {@link AdminConfigInput} for all available options
   */
  admin?: AdminConfigInput;
  /** Content collections to register with the CMS. Defaults to `[]` if omitted. */
  collections?: CollectionConfig[];
  /**
   * URL prefix for all admin panel routes.
   *
   * Default: `"/admin"`. Override when mounting the admin UI at a custom path
   * (e.g. `"/cms"` or `"/dashboard/admin"`).
   */
  basePath?: string;
}

/**
 * Resolved Vex CMS configuration after defaults are applied by `defineConfig()`.
 *
 * @see {@link VexConfigInput} for the user-facing input type
 * @see {@link defineConfig} for the config function
 */
export interface VexConfig {
  /** Resolved admin panel configuration — always fully populated after defaults are applied. */
  admin: AdminConfig;
  /** All registered content collections — always an array after defaults are applied. */
  collections: CollectionConfig[];
  /** URL prefix for all admin panel routes — always set after defaults are applied. */
  basePath: string;
}
