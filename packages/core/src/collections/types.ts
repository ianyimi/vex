import { AdminField } from "../fields";
import { CoreAdminField } from "./constants";
import type { ApplyComponent, ComponentHKT } from "../fields";
import type { CollectionSlug } from "../types/generated";
import { TDocument } from "../api/convex";
import { LucideIconName } from "../utils";

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
  TFieldSlug extends string = CoreAdminField,
  TComponent extends ComponentHKT = ComponentHKT,
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
  useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>;
  /**
   * Custom component overrides for rendering this collection's docs in
   * relationship contexts (picker rows, table cells, selected-value chips).
   *
   * Override per-relationship via `RelationshipFieldInput.admin.components.preview`.
   *
   * Slot type is `ApplyComponent<F, RelationshipPreviewProps>` — in pure-core
   * context (`F = ComponentHKT`) this resolves to `unknown`. In React context
   * (`F = ReactHKT`, exposed via `@vexcms/react`) this resolves to
   * `ComponentType<RelationshipPreviewProps>`.
   */
  components?: {
    /** Component used to render a doc of this collection as a relationship preview. */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps>;
  };
  /**
   * A valid Lucide icon name for this collection in the admin sidebar
   * See https://lucide.dev/icons/
   */
  icon?: LucideIconName;
  /**
   * Data table configuration for list view.
   */
  table?: CollectionTableConfigInput;
}

/**
 * Resolved admin panel configuration for a collection after defaults are applied.
 *
 * @see {@link AdminCollectionConfigInput} for the user-facing input type
 */
export interface AdminCollectionConfig<
  TFieldSlug extends string = CoreAdminField,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** The field used as the document's human-readable title in the admin panel. */
  useAsTitle: CoreAdminField | NoInfer<TFieldSlug>;
  components: {
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps>;
  };
  icon?: LucideIconName;
  /**
   * Data table configuration for list view.
   */
  table: CollectionTableConfig;
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
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Admin panel behaviour for this collection. All properties are optional. */
  admin?: AdminCollectionConfigInput<TFieldSlug, TComponent>;
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
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** Override the PascalCase interface name used in generated TypeScript types. Inferred from `slug` by `defineCollection` if omitted. */
  interfaceName?: string;
  /** Index definitions that create indexes on this collection in Convex. */
  indexes?: {
    name: string;
    fields: NoInfer<TFieldSlug>[];
  }[];
  meta?: TCollectionMeta;
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
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Resolved admin panel configuration for this collection. */
  admin: AdminCollectionConfig<TFieldSlug, TComponent>;
  /** Convex table name for this collection. */
  slug: TCollectionSlug;
  /** Display names shown in the admin panel — always present after defaults are applied. */
  labels: {
    /** Singular display name (e.g. `"Post"`). */
    singular: string;
    /** Plural display name (e.g. `"Posts"`). */
    plural: string;
  };
  /** Resolved field definitions for this collection. */
  fields: Record<TFieldSlug, AdminField<TFieldMeta>>;
  /** PascalCase identifier derived from `slug`, used as the TypeScript interface name in generated types (e.g. `"posts"` → `"Posts"`). */
  interfaceName: string;
  /** Index definitions that create indexes on this collection in Convex. */
  indexes?: {
    name: string;
    fields: NoInfer<TFieldSlug>[];
  }[];
  meta: TCollectionMeta;
}
