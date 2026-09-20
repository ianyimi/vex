import { CollectionConfig } from "../collections";
import { AuthCollectionConfig, VexAuthAdapter } from "../auth/types";
import { MediaCollectionConfig, VexStorageAdapter } from "../media";
import { StorageAdapterSlug } from "../types";
import { GlobalConfig } from "../globals";
import { VexAccessConfig } from "../access";
import { VexRoutesConfig } from "../routes";
import { LivePreviewConfig, LivePreviewConfigInput } from "../livePreview";

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
    /**
     * How the sidebar in the admin panel collapses
     *
     * - `"offcanvas"` — A collapsible sidebar that slides in from the left or right.
     * - `"icon"` — A sidebar that collapses to icons.
     * - `"none"` — A non-collapsible sidebar.
     */
    collapsible?: "offcanvas" | "none" | "icon";
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
    /**
     * How the sidebar in the admin panel collapses
     */
    collapsible: "offcanvas" | "none" | "icon";
  };
}

/**
 * User-facing schema generation configuration for `defineConfig()`.
 *
 * Controls where the generated `vex.schema.ts` is written. All properties are
 * optional; omitted properties fall back to the defaults listed below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   outputPath: "/convex/vex.schema.ts", // vex.schema.ts output location
 * }
 * ```
 *
 * Automatic migration on schema change is **not implemented**. `autoMigrate` is
 * deliberately absent from this type; passing `autoMigrate: true` through an untyped
 * config throws at `defineConfig()` rather than silently migrating nothing.
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
 * User-facing type generation configuration for `defineConfig()`.
 *
 * Controls where the generated `vex.types.ts` is written. All properties are
 * optional; omitted properties fall back to the defaults listed below.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * {
 *   outputPath: "/src/vex.types.ts", // vex.types.ts output location
 * }
 * ```
 *
 * @see {@link TypesConfig} for the resolved type after defaults are applied
 */
export interface TypesConfigInput {
  /**
   * Path (relative to project root) where `vex.types.ts` is written.
   *
   * Default: `"/src/vex.types.ts"`
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
 * Client-side upload functions for each registered presigned-url adapter.
 *
 * Keys are `StorageAdapterSlug` — only adapters whose `type` is
 * `"presigned-url"` and whose `name` appears in the config are valid.
 * After `vex generate`, this is narrowed to the exact set of adapter
 * names in the project.
 *
 * @example
 * ```ts
 * // vex.config.ts — one entry per registered adapter
 * import { uploadFile } from "@vexcms/file-storage-convex/client";
 *
 * export default defineConfig({
 *   storage: { clientUploads: { convex: uploadFile } },
 * });
 * ```
 */
export type ClientUploadMap = Record<
  StorageAdapterSlug,
  (
    file: any,
    uploadUrl: string,
  ) => Promise<{
    storageId: string;
    url?: string;
    [key: string]: unknown;
  }>
>;

/**
 * User-facing, client-safe configuration input passed to `defineConfig()`.
 *
 * Every property here is safe to import directly into a browser bundle: no
 * server SDKs, no environment variables, no class instances. Auth
 * collections reach this input as plain data — built by the auth package's
 * own client-safe builder (e.g. `betterAuthCollections()` from
 * `@vexcms/better-auth/client`) — never as the live auth adapter, which
 * requires the full server-side auth options object.
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
 * @see {@link VexClientConfig} for the resolved return type
 * @see {@link VexServerConfigInput} for the server-only half layered on by `defineServerConfig()`
 * @see {@link defineConfig} for the config function
 */
export interface VexClientConfigInput {
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
  access?: VexAccessConfig;
  /** Content collections to register with the CMS. Defaults to `[]` if omitted. */
  collections?: CollectionConfig[];
  /** Singleton global documents. Each produced by `defineGlobal()`. Slugs must be unique. */
  globals?: GlobalConfig[];
  /**
   * Media collections declared directly on the client config. Each entry
   * is the output of a storage package's `defineMediaCollection()`
   * (e.g. {@link file-storage-convex/src!defineMediaCollection} from
   * `@vexcms/file-storage-convex/client`), which is itself client-safe.
   * `defineServerConfig()` checks that every entry's `meta.storageAdapter`
   * names a registered adapter.
   *
   * @see {@link MediaCollectionConfig} for the resolved shape
   */
  mediaCollections?: MediaCollectionConfig[];
  /**
   * Auth collections the project's auth package derived from its auth schema
   * — e.g. `betterAuthCollections(authSchema)` from
   * `@vexcms/better-auth/client`. `defineConfig()` treats a missing value as
   * `[]`, which is the correct shape for a project with no auth.
   *
   * Authoring these by hand is possible but pointless: they are merged with
   * `collections` exactly as the live adapter merges them, and
   * `defineServerConfig()` throws when they disagree with the registered
   * adapter.
   *
   * @see {@link AuthCollectionConfig} for the shape
   * @see {@link mergeAuthCollections} for the merge logic
   */
  authCollections?: AuthCollectionConfig[];
  /**
   * URL prefix for all admin panel routes.
   *
   * Default: `"/admin"`. Override when mounting the admin UI at a custom path
   * (e.g. `"/cms"` or `"/dashboard/admin"`).
   */
  basePath?: string;
  /**
   * Maps documents to the public paths that render them. Omit for a project
   * with no public pages, or whose public pages read no CMS documents.
   *
   * Cache revalidation is its first consumer — a save purges the paths `map`
   * returns — but the same answer also drives admin "View page" links, sitemap
   * URLs, and preview links, so it is named for what it describes rather than
   * for one user of it.
   *
   * @see {@link VexRoutesConfig} for all available options
   */
  routes?: VexRoutesConfig;
  /**
   * Live-preview config — the `postMessage` origin allowlist every preview
   * listener validates against, plus the simulated-viewport breakpoints the
   * preview panel offers.
   *
   * @see {@link LivePreviewConfigInput} for all available options
   */
  livePreview?: LivePreviewConfigInput;
  /**
   * Client-side upload functions, keyed by storage adapter slug.
   *
   * These are the only storage-adapter-shaped values allowed on the client
   * config — plain functions, never the adapter class instance.
   * `useStorageAdapterMap()` reads this map directly.
   *
   * @see {@link ClientUploadMap} for the value shape
   */
  storage?: {
    clientUploads?: ClientUploadMap;
  };
  /**
   * Schema generation configuration — output path and auto-migration flags.
   * All properties are optional; omitted values fall back to defaults.
   *
   * Read only by the CLI (`packages/cli/src/lib/generateSchema.ts`), never by
   * the browser — but it lives here rather than on the server config because
   * it is a plain settings object that breaks nothing in a client bundle, and
   * `vex.config.ts` is the one file the developer edits for settings.
   *
   * @see {@link SchemaConfigInput} for all available options
   */
  schema?: SchemaConfigInput;
  /**
   * Type generation configuration — where `vex.types.ts` is written.
   *
   * @see {@link TypesConfigInput} for all available options
   */
  types?: TypesConfigInput;
}

/**
 * Server-only configuration input passed to `defineServerConfig()`, layered
 * on top of an already-resolved `VexClientConfig`.
 *
 * A field appears in this interface only if placing it on the client config
 * would break the client bundle: `auth.adapter` and `storage.adapters` are
 * the only two.
 *
 * @see {@link VexClientConfig} for the client half this layers onto
 * @see {@link VexConfig} for the resolved return type
 * @see {@link defineServerConfig} for the config function
 */
export interface VexServerConfigInput {
  /**
   * Auth configuration — mirrors the `storage` group's shape: the adapter
   * instance under `.adapter`. The group is optional, but `adapter` is
   * required WITHIN it: `server.auth` present guarantees an adapter, so no
   * consumer needs a nested existence check.
   *
   * Omit the whole group for a project with no auth, or one that does not
   * want its client-declared `authCollections` verified.
   */
  auth?: {
    /**
     * Live auth adapter, constructed from the real server-side auth options
     * (e.g. {@link better-auth/src!betterAuthAdapter} from
     * `@vexcms/better-auth`).
     *
     * Its collections are the source of truth: `defineServerConfig()`
     * compares them against the `authCollections` the client config declared
     * and throws when the two disagree, which is the only place that check
     * can run — the browser cannot evaluate these options.
     *
     * @see {@link VexAuthAdapter} for the adapter interface
     * @see {@link better-auth/src!betterAuthAdapter} for the Better Auth implementation
     */
    adapter: VexAuthAdapter;
  };
  /**
   * Storage configuration — server-side adapter instances only. Media
   * collections themselves are declared on the client config; adapters here
   * are consulted only to confirm every `mediaCollection.meta.storageAdapter`
   * resolves to a registered instance.
   *
   * `clientUploads` is deliberately NOT accepted here. `VexConfigProvider`
   * mounts the CLIENT config, so an upload function supplied only on the
   * server config would exist server-side and never reach the browser —
   * the admin upload UI would silently have no uploader. The type forbids
   * the mistake instead of letting it fail at runtime.
   *
   * @see {@link VexStorageAdapter} for the adapter interface
   */
  storage?: {
    /** Storage adapters configured for the project. */
    adapters: VexStorageAdapter[];
  };
}

/**
 * Resolved client-side Vex CMS configuration after `defineConfig()` applies
 * defaults. Structurally contained by {@link VexConfig} — every field here
 * is also readable on a full `VexConfig`, so server code written against the
 * old monolithic shape continues to compile.
 *
 * @see {@link VexClientConfigInput} for the user-facing input type
 * @see {@link defineConfig} for the config function
 */
export interface VexClientConfig {
  /** Resolved admin panel configuration — always fully populated after defaults are applied. */
  admin: AdminConfig;
  access?: VexAccessConfig;
  /**
   * All registered content collections — user-defined collections merged
   * with `authCollections` and internal collections, in that order. Always
   * an array after defaults are applied.
   *
   * @see {@link mergeAuthCollections} for the merge order and precedence rules
   */
  collections: CollectionConfig[];
  /** Resolved global configs. Always present; defaults to `[]`. */
  globals: GlobalConfig[];
  /**
   * Media collections declared on the client config, validated against
   * `upload()` field references. Always present; defaults to `[]`.
   *
   * @see {@link MediaCollectionConfig} for the resolved shape
   */
  mediaCollections: MediaCollectionConfig[];
  /**
   * Auth collections built by the project's auth package's client-safe
   * builder (e.g. `betterAuthCollections()` from `@vexcms/better-auth/client`),
   * before merging into `collections`. Always present; defaults to `[]` for a
   * project with no auth.
   *
   * @see {@link AuthCollectionConfig} for the shape
   */
  authCollections: AuthCollectionConfig[];
  /** URL prefix for all admin panel routes — always set after defaults are applied. */
  basePath: string;
  /**
   * Resolved route map. `undefined` when the project never configured
   * `routes` — it is opt-in.
   */
  routes?: VexRoutesConfig;
  /**
   * Resolved live-preview config — the `postMessage` origin allowlist and the
   * breakpoint matrix. Always present; defaults applied by `defineConfig()`.
   */
  livePreview: LivePreviewConfig;
  /**
   * Client-side upload functions, keyed by storage adapter slug. Always
   * present; defaults to `{}`.
   *
   * @see {@link ClientUploadMap} for the value shape
   */
  storage: { clientUploads: ClientUploadMap };
  /**
   * Resolved schema generation configuration — always fully populated after
   * defaults are applied. Consumed by the CLI only; present on the client
   * config because it is inert settings data, not a bundle hazard.
   */
  schema: SchemaConfig;
  /** Resolved type generation configuration — always fully populated after defaults are applied. */
  types: TypesConfig;
}

/**
 * Resolved Vex CMS configuration after `defineServerConfig()` layers server
 * settings onto an already-resolved `VexClientConfig`. Structurally contains
 * every client field via `extends` (spread, not nested) — every existing
 * server-side or Convex `config.collections` / `config.access` reader
 * compiles unchanged against this type.
 *
 * @see {@link VexServerConfigInput} for the user-facing server input type
 * @see {@link defineServerConfig} for the config function
 */
export interface VexConfig extends VexClientConfig {
  /**
   * Auth configuration, present only when the server config registered an
   * adapter. Mirrors `storage`'s shape: adapter instance under the group.
   * `adapter` is required within the group — `config.auth` present ⇔ adapter
   * present, so consumers check the group once and never null-check
   * `adapter` inside it.
   *
   * @see {@link VexAuthAdapter} for the adapter interface
   * @see {@link better-auth/src!betterAuthAdapter} for the Better Auth implementation
   */
  auth?: { adapter: VexAuthAdapter };
  /** Storage adapters and client-side upload functions, both always resolved. */
  storage: { clientUploads: ClientUploadMap; adapters: VexStorageAdapter[] };
}
