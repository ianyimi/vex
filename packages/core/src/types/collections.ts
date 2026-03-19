// =============================================================================
// COLLECTION TYPES — Object-based configuration
// =============================================================================

import type { VexField, InferFieldsType } from "./fields";
import type { LivePreviewConfig } from "./livePreview";

/**
 * System field keys injected into all user collection schemas.
 * `vex_status` is always present; `vex_version` and `vex_publishedAt`
 * are added when `versions.drafts` is enabled.
 */
export type VersioningFieldKeys = "vex_status" | "vex_version" | "vex_publishedAt";

/**
 * Admin UI configuration for a collection.
 * Controls how the collection appears and behaves in the admin panel.
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  /**
   * Group this collection under a heading in the sidebar.
   * Collections with the same group string are grouped together.
   */
  group?: string;
  /**
   * Icon name for the collection in the sidebar.
   * Uses Lucide icon names (e.g. `"file-text"`, `"users"`, `"settings"`).
   */
  icon?: string;
  /**
   * Field key to use as the document title in list views.
   * Should reference a text-like field from the collection's fields,
   * or an auth field key when `auth` is provided.
   */
  useAsTitle?: keyof TFields | TExtraKeys;
  /**
   * Field keys to show as default columns in the list view.
   * If not set, all fields are shown (with `_id` first).
   * When set, only the specified fields are shown — `_id` is only
   * included if explicitly listed.
   * When `auth` is provided, auth field keys (e.g. `"email"`) are also accepted.
   */
  defaultColumns?: ("_id" | keyof TFields | TExtraKeys)[];
  /**
   * Disable the "Create New" button in the admin list view.
   *
   * Default: `false`
   */
  disableCreate?: boolean;
  /**
   * Disable the delete action in the admin panel.
   *
   * Default: `false`
   */
  disableDelete?: boolean;
  /**
   * Live preview configuration.
   * When set, the admin edit view shows a toggleable side-by-side preview panel
   * with an iframe loading the configured URL.
   *
   * Works with or without `versions.drafts` — the admin panel writes a transient
   * preview snapshot to `vex_versions` on form changes. The preview iframe fetches
   * this snapshot via `vexQuery` with Convex's real-time subscriptions.
   */
  livePreview?: LivePreviewConfig<TFields>;
}

/**
 * Index definition for a collection.
 * Compound indexes include multiple fields — order matters.
 */
export interface IndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  /**
   * Index name (must be unique within the collection).
   * Convention: `"by_<field>"` for single-field, `"by_<field1>_<field2>"` for compound.
   */
  name: string;
  /**
   * Field names to include in the index. Order matters for compound indexes.
   */
  fields: (keyof TFields & string | TExtraKeys)[];
}

/**
 * Search index definition for a collection.
 * Enables full-text search on a field with optional filter fields.
 */
export interface SearchIndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TExtraKeys extends string = never,
> {
  /**
   * Search index name (must be unique within the collection).
   * Convention: `"search_<field>"`.
   */
  name: string;
  /**
   * The field to perform full-text search on.
   */
  searchField: keyof TFields & string | TExtraKeys;
  /**
   * Optional fields to filter search results by.
   */
  filterFields?: (keyof TFields & string | TExtraKeys)[];
}

/**
 * Configuration for versioning and draft/publish workflow on a collection.
 * When `drafts` is enabled, the admin panel shows Save Draft + Publish
 * instead of a simple Save button.
 */
export interface VersionsConfig {
  /**
   * Enable the draft/publish workflow.
   * When true, new documents start as drafts and must be explicitly published.
   * The schema gets `_status`, `_version`, and `_publishedAt` fields injected.
   *
   * Default: `false`
   */
  drafts?: boolean;

  /**
   * Enable autosave. Requires `drafts: true`.
   * When `true`, uses a default 2000ms interval.
   * When an object, specify a custom interval.
   *
   * Default: `false`
   */
  autosave?: boolean | {
    /** Interval in milliseconds between autosaves. Default: 2000 */
    interval: number;
  };

  /**
   * Maximum number of versions to keep per document.
   * Oldest non-published versions are deleted when exceeded.
   * `0` means unlimited.
   *
   * Default: `100`
   */
  maxPerDoc?: number;
}

/**
 * A collection definition. Users create these as plain objects
 * with `as const satisfies VexCollection`.
 *
 * @example
 * ```ts
 * const posts = {
 *   slug: "posts",
 *   fields: {
 *     title: { type: "text", label: "Title", required: true },
 *   },
 * } as const satisfies VexCollection;
 * ```
 */
export interface VexCollection<
  TFields extends Record<string, any> = any,
  TExtraKeys extends string = string,
  TSlug extends string = string,
> {
  /** The collection identifier, used in URLs and the database. */
  readonly slug: TSlug;
  /**
   * The fields that make up documents in this collection.
   * Each key becomes a field name, and the value defines
   * its type (e.g. `{ type: "text" }`, `{ type: "number" }`, `{ type: "select", ... }`).
   */
  fields: TFields;
  /**
   * The name of the table generated for this collection in the
   * generated vex schema file. Defaults to the collection slug.
   */
  tableName?: string;
  /**
   * Display labels for the collection in the admin UI.
   * If not provided, labels are derived from the collection slug.
   */
  labels?: {
    /** Singular label (e.g. `"Post"`). */
    singular?: string;
    /** Plural label (e.g. `"Posts"`). */
    plural?: string;
  };
  /**
   * Admin UI configuration for this collection.
   * Controls sidebar grouping, icons, list columns, and permissions.
   */
  admin?: CollectionAdminConfig<TFields, TExtraKeys>;
  /**
   * Database indexes for this collection.
   */
  indexes?: IndexConfig<TFields, TExtraKeys>[];
  /**
   * Search indexes for full-text search on this collection.
   */
  searchIndexes?: SearchIndexConfig<TFields, TExtraKeys>[];
  /**
   * Versioning and draft/publish workflow configuration.
   * When `versions.drafts` is `true`, the collection gets draft/publish
   * workflow in the admin panel and version history tracking.
   *
   * Only available on user collections (including auth-merged collections).
   * NOT available on media collections — use VexMediaCollection for those.
   */
  versions?: VersionsConfig;
  /**
   * When true, the CLI generates typed per-collection query/mutation files
   * for this collection (`convex/vex/api/{slug}.ts` + `convex/vex/model/api/{slug}.ts`).
   *
   * Defaults to `true` for user-defined collections and media collections.
   * Auth adapter collections default to `false` — set explicitly to opt in.
   */
  generateApi?: boolean;
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "BlogPost"
   */
  interfaceName?: string;
  /**
   * Type helper — use `typeof collection._docType` to get the
   * inferred document shape for this collection.
   */
  readonly _docType?: InferFieldsType<TFields>;
}

/**
 * A VexCollection with erased generics, suitable for heterogeneous arrays.
 *
 * @deprecated Use `VexCollection` instead — its default generics accept the
 * same values. This alias is kept only for backwards compatibility.
 */
export type AnyVexCollection = VexCollection<any, any>;
