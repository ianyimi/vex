import { AdminField, DataFieldSlug } from "../fields";
import { ConvexSystemField, CollectionSystemField } from "./constants";
import type { ComponentHKT, EditComponentsConfigInput } from "../components/types";
import type { CollectionSlug } from "../types/generated";
import { TDocument } from "../documents/types";
import { IconName } from "../utils";
import type { CollectionHooks, CollectionHooksInput } from "./hooks";
import type { AdminLivePreviewConfig, AdminLivePreviewConfigInput } from "../livePreview";
import type { DocumentByCollectionSlug } from "../types/generated";
import type { VexVersionStatus } from "../versions";

/**
 * Props received by a custom preview component for relationship rendering.
 *
 * `TCollectionSlug` is the slug of the doc being rendered. In a picker row, this is the
 * candidate target doc's slug. In a list-table cell, this is the parent
 * collection's slug (the table row's `row.original`). In the trigger's
 * selected-value chip, it is the resolved target doc's slug.
 *
 * `fieldKey` is the relationship field's key on the parent collection (e.g.
 * `"author"`). In picker rows the component may ignore it; in list cells it
 * gives access to the IDs via `doc[fieldKey]`.
 *
 * @typeParam TCollectionSlug - The slug of the doc being rendered.
 */
export interface RelationshipPreviewProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  /** The document being previewed. */
  doc: TDocument;
  /** The relationship field key on the parent collection. */
  fieldKey: string;
  /** The resolved collection config matching `doc`. */
  config: CollectionConfig<TCollectionSlug>;
}

/**
 * Configuration for data table display and behavior in the admin panel.
 */
export interface CollectionTableConfigInput {
  /**
   * Default number of items per page.
   * @default 10
   */
  defaultPageSize?: number;

  /**
   * Default number of items per page fetch from the server.
   * @default 100
   */
  serverPageSize?: number;

  /**
   * Available page size options in the pagination controls.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];

  /**
   * Default sort field and order.
   * Must be an indexed field for performance.
   * @default { field: "_creationTime", order: "desc" }
   */
  defaultSort?: {
    field: string;
    order: "asc" | "desc";
  };

  /**
   * Bulk action configuration.
   */
  bulkActions?: {
    /**
     * Enable bulk delete action.
     * @default true
     */
    delete: boolean;
  };

  /**
   * Default visible columns (by field key).
   * If not specified, all columns are shown.
   * NOTE: deferred to column visibility spec.
   */
  defaultColumns?: string[];
}

/**
 * Configuration for data table display and behavior in the admin panel.
 */
export interface CollectionTableConfig {
  /**
   * Default number of items per page on the client.
   * @default 10
   */
  defaultPageSize: number;

  /**
   * Default number of items per page fetch from the server.
   * @default 100
   */
  serverPageSize: number;

  /**
   * Available page size options in the pagination controls.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions: number[];

  /**
   * Default sort field and order.
   * Must be an indexed field for performance.
   * @default { field: "_creationTime", order: "desc" }
   */
  defaultSort: {
    field: string;
    order: "asc" | "desc";
  };

  /**
   * Bulk action configuration.
   */
  bulkActions: {
    /**
     * Enable bulk delete action.
     * @default true
     */
    delete: boolean;
  };

  /**
   * Default visible columns (by field key).
   * If not specified, all columns are shown.
   * NOTE: deferred to column visibility spec.
   */
  defaultColumns: string[];
}

/**
 * Admin panel configuration input for a collection.
 *
 * Controls how the collection is presented and queried in the admin panel.
 * All properties are optional.
 *
 * **Defaults applied by `defineCollection()`:**
 * ```ts
 * {
 *   useAsTitle: "_id", // falls back to the Convex document ID if not set
 * }
 * ```
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: { title: text({ required: true }) },
 *   admin: { useAsTitle: "title" },
 * })
 * ```
 *
 * @see {@link AdminCollectionConfig} for the resolved type after defaults are applied
 */
export interface AdminCollectionConfigInput<
  TFieldSlug extends string = ConvexSystemField,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /**
   * The field whose value is displayed as the document's human-readable title
   * throughout the admin panel (list rows, breadcrumbs, relation pickers).
   *
   * Accepts any user-defined field slug from this collection, or a built-in
   * Convex system field (`"_id"` | `"_creationTime"`). Setting a user-defined
   * field also auto-generates a database index (`by_<field>`) and a search
   * index (`search_<field>`) for fast admin queries. Omit to fall back to `"_id"`.
   */
  useAsTitle?: ConvexSystemField | NoInfer<TFieldSlug>;
  /**
   * A valid Lucide icon name for this collection in the admin sidebar
   * See https://lucide.dev/icons/
   */
  icon?: IconName;
  /**
   * Data table configuration for list view.
   */
  table?: CollectionTableConfigInput;
  /**
   * Live preview for this collection — the resolver from a document to the
   * public URL its preview iframe renders, plus panel behaviour. Omit to
   * disable live preview for this collection.
   */
  livePreview?: AdminLivePreviewConfigInput<Partial<DocumentByCollectionSlug<TCollectionSlug>>>;
  /** Collection-level `edit.*` slot contributions and built-in overrides (decision 11/14) — merged with the project-wide config of the same shape by `resolveEditSlot` at render time. */
  components?: {
    edit?: EditComponentsConfigInput<TComponent>;
  };
}

/**
 * Resolved admin panel configuration for a collection after defaults are applied.
 *
 * @see {@link AdminCollectionConfigInput} for the user-facing input type
 */
export interface AdminCollectionConfig<
  TFieldSlug extends string = ConvexSystemField,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** The field used as the document's human-readable title in the admin panel. */
  useAsTitle: ConvexSystemField | NoInfer<TFieldSlug>;
  icon?: IconName;
  /**
   * Data table configuration for list view.
   */
  table: CollectionTableConfig;
  /** Resolved live preview config. `undefined` when the collection omits it. */
  livePreview?: AdminLivePreviewConfig<Partial<DocumentByCollectionSlug<TCollectionSlug>>>;
  /** Collection-level `edit.*` slot contributions and built-in overrides, passed through unresolved — `resolveEditSlot` applies every default when assembling one flat slot id at render time. */
  components?: {
    edit?: EditComponentsConfigInput<TComponent>;
  };
}

/**
 * Configuration input for a `defineCollection()` call.
 *
 * A collection maps to a Convex database table. `slug` becomes the table name,
 * `fields` defines its shape, and `labels` controls how the collection appears
 * in the admin panel. Omitted labels are inferred from the slug.
 *
 * **Defaults applied by `defineCollection()`:**
 * ```ts
 * {
 *   labels: {
 *     singular: "Post",   // title-cased from slug ("posts" → "Post")
 *     plural:   "Posts",  // title-cased + pluralised from slug
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: text({ required: true }),
 *     body:  richtext(),
 *   },
 * })
 * ```
 *
 * @see {@link CollectionConfig} for the resolved type after defaults are applied
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfigInput<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends string = string,
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = false,
> {
  /** Admin panel behaviour for this collection. All properties are optional. */
  admin?: AdminCollectionConfigInput<
    DataFieldSlug<TFields>,
    TComponent,
    TCollectionSlug extends CollectionSlug ? TCollectionSlug : CollectionSlug
  >;
  /** Convex table name — used as the database table identifier and URL slug in the admin panel. */
  slug: TCollectionSlug;
  /**
   * Display names shown in the admin panel navigation and list views.
   * Both are inferred from `slug` if omitted.
   */
  labels?: {
    /** Singular display name (e.g. `"Post"`). Inferred from slug if omitted. */
    singular?: string;
    /** Plural display name (e.g. `"Posts"`). Inferred from slug if omitted. */
    plural?: string;
  };
  /** Field definitions that make up this collection's document shape. */
  fields: TFields;
  /** Override the PascalCase interface name used in generated TypeScript types. Inferred from `slug` by `defineCollection` if omitted. */
  interfaceName?: string;
  /** Index definitions that create indexes on this collection in Convex. */
  indexes?: {
    name: string;
    fields: NoInfer<DataFieldSlug<TFields>>[];
    /**
     * Also narrow this index on `vex_status` for draft/publish status
     * composition (Step 13, `versions/statusQueryConstraint.ts`). Only valid
     * when this collection declares `versions.drafts: true` —
     * `defineCollection` throws otherwise for a dynamically-assembled
     * config; a literal `{ drafts: false }` (or omitted) config fails to
     * typecheck a `draftStatus` here at all, since this property only
     * exists when `TDrafts` is the literal `true`.
     *
     * - `true` — REPLACES the index with its `vex_status`-prefixed physical
     *   form (`.index(name, ["vex_status", ...fields])`); no unprefixed
     *   physical index exists for `name`. A `drafts: true` read that picks
     *   this index cannot narrow through it and drops to `.filter()` for
     *   any RBAC/caller range (dev-only warning, once per index).
     * - `"both"` — emits the unprefixed index AND a `vex_status`-prefixed
     *   twin (`` `${name}__draftStatus` `` — internal, never a selectable
     *   `IndexNameFor` member), so a published-only read and a `drafts:
     *   true` read on `name` both stay index-narrowed.
     *
     * @example
     * ```ts
     * indexes: [{ name: "by_slug", fields: ["slug"], draftStatus: "both" }]
     * ```
     */
    draftStatus?: TDrafts extends true ? true | "both" : never;
  }[];
  meta?: TCollectionMeta;
  /**
   * When `false`, opts this collection out of the auto-maintained `updatedAt`
   * timestamp `defineCollection` otherwise injects into every collection's
   * `fields`. Use for a collection that genuinely must not carry one — an
   * append-only log, or a table whose shape is dictated by an external system.
   *
   * Naming a field `updatedAt` yourself is a compile-time error in
   * `defineCollection`'s signature (`[keyof TFields & ReservedCollectionFieldKey]
   * extends [never]`), mirroring `GlobalConfigInput`'s identical
   * `ReservedGlobalFieldKey` guard.
   *
   * @defaultValue `true`
   */
  timestamps?: boolean;
  /** Lifecycle hooks for this collection. */
  hooks?: CollectionHooksInput<
    TCollectionSlug extends CollectionSlug ? TCollectionSlug : CollectionSlug
  >;
  /**
   * Draft and versioning config for this collection. Enabling `drafts` adds
   * `vex_status` / `vex_publishedAt` / `vex_publishedId` to the generated
   * table (`generateVexSchema`) and the draft-workflow actions
   * (`readDrafts`, `saveDraft`, `publish`, `unpublish`, `deleteVersions`)
   * to this resource's subject in `defineAccess`.
   */
  versions?: {
    /** Enable the draft/publish workflow for this collection. @defaultValue `false` */
    drafts?: TDrafts;
    /**
     * The `vex_status` a newly `create()`d document starts with. `"published"`
     * also stamps `vex_publishedAt`; `"draft"` inserts a draft-only row (no
     * `vex_publishedId`, no `vex_publishedAt`). Ignored when `drafts` is
     * `false`. @defaultValue `"draft"`
     */
    defaultStatus?: VexVersionStatus;
    /**
     * Debounce background saves to the draft row while the edit form is
     * open. Ignored when `drafts` is `false`. @defaultValue `false`
     */
    autosave?: {
      /**
       * Enable or disable autosaves to new drafts
       */
      enabled: boolean;
      /**
       * Debounce (milliseconds) to autosave after inputs have changed
       */
      debounceMs?: number;
    };
    /**
     * When a document is deleted (`remove`), also delete its draft row (if
     * any) and every `vex_versions` history row for it in the same action
     * (`cascadeVersionedDelete`, Step 11). Set `false` to leave the draft
     * row and history behind — orphaned rows are inert (no query reads a
     * draft/history row without its own explicit `drafts: true` /
     * `listVersions` call, so nothing surfaces them by accident), but they
     * do occupy storage indefinitely and a future `saveDraft`/`publish` on
     * a REUSED id could resurface stale history. Ignored when `drafts` is
     * `false` — there is nothing to cascade. @defaultValue `true`
     */
    cascadeDelete?: boolean;
  };
}

/**
 * Resolved collection configuration after defaults are applied by `defineCollection()`.
 *
 * @see {@link CollectionConfigInput} for the user-facing input type
 * @see {@link defineCollection} for the config function
 */
export interface CollectionConfig<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFields extends Record<string, AdminField> = Record<string, AdminField>,
  TComponent extends ComponentHKT = ComponentHKT,
  TDrafts extends boolean = boolean,
> {
  /** Resolved admin panel configuration for this collection. */
  admin: AdminCollectionConfig<DataFieldSlug<TFields>, TComponent, TCollectionSlug>;
  /** Convex table name for this collection. */
  slug: TCollectionSlug;
  /** Display names shown in the admin panel — always present after defaults are applied. */
  labels: {
    /** Singular display name (e.g. `"Post"`). */
    singular: string;
    /** Plural display name (e.g. `"Posts"`). */
    plural: string;
  };
  /**
   * Resolved field definitions for this collection.
   *
   * The `ReservedCollectionFieldKey` half covers the `updatedAt` field
   * `defineCollection` injects. It is `Partial` because `{ timestamps: false }`
   * opts out, so reading it must be null-checked — the same reason
   * `stampUpdatedAt` treats an absent entry as "do not stamp".
   */
  fields: Partial<Record<CollectionSystemField, AdminField<TFieldMeta>>> & TFields;
  /** PascalCase identifier derived from `slug`, used as the TypeScript interface name in generated types (e.g. `"posts"` → `"Posts"`). */
  interfaceName: string;
  /** Index definitions that create indexes on this collection in Convex. */
  indexes?: {
    name: string;
    fields: NoInfer<DataFieldSlug<TFields>>[];
    draftStatus?: TDrafts extends true ? true | "both" : never;
  }[];
  meta: TCollectionMeta;
  /** Resolved lifecycle hooks. Always present; defaults to `{}`. */
  hooks: CollectionHooks<TCollectionSlug>;
  versions: {
    drafts: TDrafts;
    defaultStatus: VexVersionStatus;
    autosave: {
      enabled: boolean;
      debounceMs: number;
    };
    cascadeDelete: boolean;
  };
}
