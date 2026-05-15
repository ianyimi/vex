import { CollectionConfig } from "../collections";
import { VexAuthAdapter } from "../auth/types";

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
 * User-facing schema generation configuration for `defineConfig()`.
 *
 * Controls where generated files are written and whether automatic database
 * migrations run when the schema changes. All properties are optional; omitted
 * properties fall back to the defaults listed below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   outputPath:      "/convex/vex.schema.ts", // vex.schema.ts output location
 *   typesOutputPath: "/convex/vex.types.ts",  // vex.types.ts output location
 *   autoMigrate:     false,                   // no auto-migration on schema change
 *   autoRemove:      false,                   // removed tables stay in schema.ts
 * }
 *
 * @see {@link SchemaConfig} for the resolved type after defaults are applied
 */
export interface SchemaConfigInput {
  /**
   * Path (relative to project root) where `vex.schema.ts` is written.
   *
   * Default: `"/convex/vex.schema.ts"`
   */
  outputPath?: string;
}

/**
 * Resolved schema generation configuration after defaults are applied.
 *
 * @see {@link SchemaConfigInput} for the user-facing input type
 */
export interface SchemaConfig {
  /** Path where `vex.schema.ts` is written. Always set after defaults are applied. */
  outputPath: string;
}

/**
 * User-facing schema generation configuration for `defineConfig()`.
 *
 * Controls where generated files are written and whether automatic database
 * migrations run when the schema changes. All properties are optional; omitted
 * properties fall back to the defaults listed below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   outputPath:      "/convex/vex.schema.ts", // vex.schema.ts output location
 *   typesOutputPath: "/convex/vex.types.ts",  // vex.types.ts output location
 *   autoMigrate:     false,                   // no auto-migration on schema change
 *   autoRemove:      false,                   // removed tables stay in schema.ts
 * }
 *
 * @see {@link SchemaConfig} for the resolved type after defaults are applied
 */
export interface TypesConfigInput {
  /**
   * Path (relative to project root) where `vex.types.ts` is written.
   *
   * Default: `"/convex/vex.schema.ts"`
   */
  outputPath?: string;
}

/**
 * Resolved schema generation configuration after defaults are applied.
 *
 * @see {@link SchemaConfigInput} for the user-facing input type
 */
export interface TypesConfig {
  /** Path where `vex.types.ts` is written. Always set after defaults are applied. */
  outputPath: string;
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
  /**
   * Schema generation configuration — controls output paths and auto-migration.
   * All properties are optional; omitted values fall back to defaults.
   *
   * @see {@link SchemaConfigInput} for all available options
   */
  schema?: SchemaConfigInput;
  types?: TypesConfigInput;
  /**
   * Auth adapter to register authentication collections (user, session,
   * account, verification, etc.) alongside user-defined collections.
   *
   * Pass the return value of an auth adapter (e.g.
   * {@link betterAuthAdapter} from `@vexcms/better-auth`). Auth collections
   * are merged with user collections by `defineConfig()` — protected auth
   * collections cannot be overridden, and locked fields are preserved.
   *
   * @see {@link VexAuthAdapter} for the adapter interface
   * @see {@link betterAuthAdapter} for the Better Auth implementation
   */
  auth?: VexAuthAdapter;
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
  /** Resolved schema generation configuration — always fully populated after defaults are applied. */
  schema: SchemaConfig;
  types: TypesConfig;
  /**
   * Auth adapter registered with this config. Auth collections are merged
   * with user-defined collections — protected collections and locked fields
   * are preserved during merge.
   *
   * @see {@link VexAuthAdapter} for the adapter interface
   * @see {@link betterAuthAdapter} for the Better Auth implementation
   */
  auth?: VexAuthAdapter;
}
