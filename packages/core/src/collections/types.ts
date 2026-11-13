import { AdminField, DataFieldSlug } from "../fields";
import { ConvexSystemField, CollectionSystemField, COLLECTION_INPUT } from "./constants";
import type { ComponentContributionInput, ComponentHKT, EditComponentsConfigInput } from "../components/types";
import type { CollectionSlug } from "../types/generated";
import { TDocument } from "../documents/types";
import { IconName } from "../utils";
import type { CollectionHooks, CollectionHooksInput } from "./hooks";
import type { AdminLivePreviewConfig, AdminLivePreviewConfigInput } from "../livePreview";
import type { DocumentByCollectionSlug } from "../types/generated";
import type { VexVersionStatus } from "../versions";
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";

/**
 * This collection's own additive contributions to its list-view slots (S17/S18),
 * merged with `vex.list.*` built-ins by `ListViewLayout` — never here. Every array is
 * optional and empty by default, the same split as the root `admin.components.blocks`/
 * `array` input (`config/types.ts`).
 */
export interface AdminListComponentsInput {
  /** `list.header.actions` — additive entries beside the built-in "+ New" button. */
  headerActions?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.toolbar` — additive entries in the toolbar row. */
  toolbar?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.filters` — additive entries in the filter row. */
  filters?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.beforeTable` — additive entries above the table. */
  beforeTable?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.afterTable` — additive entries below the table. */
  afterTable?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.row.actions` — additive entries rendered as `DropdownMenuItem`s in the per-row ⋯ menu, alongside the built-in Open/Inspect/Copy ID/Delete actions. */
  rowActions?: ComponentContributionInput<ComponentHKT, unknown>[];
  /** `list.bulkActions` — additive entries rendered inline in the toolbar's bulk-selection group (never a floating bar). */
  bulkActions?: ComponentContributionInput<ComponentHKT, unknown>[];
}

/**
 * Resolved list-slot contributions after `defineCollection()` — always present, every list
 * defaulted and ordered (`collections/config.ts`'s `components` resolution, beside the
 * existing `table`/`livePreview` resolution).
 */
export interface AdminListComponents {
  headerActions: ComponentContributionInput<ComponentHKT, unknown>[];
  toolbar: ComponentContributionInput<ComponentHKT, unknown>[];
  filters: ComponentContributionInput<ComponentHKT, unknown>[];
  beforeTable: ComponentContributionInput<ComponentHKT, unknown>[];
  afterTable: ComponentContributionInput<ComponentHKT, unknown>[];
  rowActions: ComponentContributionInput<ComponentHKT, unknown>[];
  bulkActions: ComponentContributionInput<ComponentHKT, unknown>[];
}

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
 * A portable table sort: a field slug (or `_creationTime`) plus direction.
 * Used by `admin.view.state.sort`, `find`'s `sort` arg, the list URL, and
 * saved views — the same shape everywhere so a stored view stays
 * backend-neutral.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface CollectionTableSort<TFieldSlug extends string = string> {
  /** The field to sort by, or `"_creationTime"` for insertion order. */
  field: TFieldSlug | "_creationTime";
  /** Sort direction — matches Convex `.order()`. */
  order: "asc" | "desc";
}

/**
 * One entry in a view's `columns` array — either a bare field slug (visible,
 * every other attribute defaulted) or an object carrying this column's own
 * width/pin/visibility/capability overrides. The array is the view's FULL
 * display order, visible or not; `hidden: true` is what marks a listed
 * entry as hidden (there is no other visibility signal). `resolveListViewColumnConfig`
 * (`collections/listView/listViewColumnConfig.ts`) is the ONE place an entry, the
 * owning field's own `admin.*` default, and the global type default are
 * resolved into a column's final config — VIEWS ALWAYS WIN over a field's
 * own declared default.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export type ColumnEntry<TFieldSlug extends string = string> =
  | TFieldSlug
  | {
      field: TFieldSlug;
      /** Pixel width override. Falls back to `field.admin.width`, then `FIELD_TYPE_DEFAULT_WIDTH[field.type]`. */
      width?: number;
      /** Sticky pin side. No field-level default exists for this — unset means unpinned. */
      pinned?: "left" | "right";
      /** Hides this column. No field-level default exists for this — unset means visible. */
      hidden?: boolean;
      /** Overrides `field.admin.enableSorting` for THIS view only. Still needs a declared index regardless of which tier turned it on — checked by `validateSavedListViewConfig`. */
      enableSorting?: boolean;
      /** Overrides `field.admin.enableHiding` for THIS view only. */
      enableHiding?: boolean;
    };

/**
 * Reads the field slug a {@link ColumnEntry} names, whichever of its two
 * shapes it is — the one piece of a `ColumnEntry` every order/visibility
 * helper that doesn't otherwise care about width/pin/hidden overrides
 * needs (`listView/listViewUrlState.ts`'s view-baseline diff, `resolveListViewQueryState`'s
 * legacy bare-slug consumers).
 *
 * @param entry - A bare field slug, or an object entry carrying overrides.
 * @returns `entry` itself when it's a bare slug, otherwise `entry.field`.
 */
export function columnEntryField<TFieldSlug extends string = string>(
  entry: ColumnEntry<TFieldSlug>,
): TFieldSlug {
  return typeof entry === "string" ? entry : entry.field;
}

/**
 * One saved view's filter/sort/search/column/page-size state, PLUS the
 * collection-wide list settings that used to live
 * on the now-deleted `admin.table` — `admin.view`'s own input type and
 * {@link VexViewConfig}'s `state` are the SAME type, a superset, every key
 * optional. An `admin.views[n]` entry may therefore override collection-wide
 * settings too, not just its own per-view query state (`validateSavedListViewConfig`
 * / `defineCollection` resolve an unset collection-wide key against
 * `admin.view`'s own resolved value, then the global default — the same
 * two-tier fallback `admin.view` itself already uses against the global
 * default, one level deeper). `name`/`description` are meaningful only for
 * `admin.view`/`admin.views[n]` entries, which have no separate identity
 * wrapper of their own the way a `VexViewConfig` does (its `name`/
 * `description` live OUTSIDE `state`, unused here) — a shared/local view
 * never sets them on its own `state`.
 *
 * `where` is collection-structure-agnostic (`VexWhereNodeOf<unknown>`): a
 * saved/URL view is a portable JSON blob, not re-validated against the
 * owning collection's exact field union until it is applied. On a `config`
 * view, `where`'s field names ARE checked against the real collection, but
 * at `defineCollection` time (`validateSavedListViewConfig`), not by this type.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexViewState<TFieldSlug extends string = string> = {
  /** Tab label — `admin.view`/`admin.views[n]` only. @default "All" (`admin.view` only) */
  name?: string;
  /** Shown in the view-identity popover/tooltip — `admin.view`/`admin.views[n]` only. */
  description?: string;
  where?: VexWhereNodeOf<unknown>;
  sort?: CollectionTableSort<TFieldSlug>;
  search?: string;
  searchField?: TFieldSlug;
  /**
   * The view's FULL column display order, visible or
   * not, in display order — see {@link ColumnEntry}. A saved view from
   * before this unification only ever listed its VISIBLE fields as bare
   * slugs; that shape still parses
   * correctly here (every entry is a valid bare-slug `ColumnEntry`), and
   * `resolveListViewQueryState`'s completion step appends any field it
   * doesn't name, in field-declaration order, as hidden.
   */
  columns?: ColumnEntry<TFieldSlug>[];
  pageSize?: number;
  /**
   * The Inspect peek panel's width in px, resized by dragging its left
   * edge — `undefined`
   * means this view never saved an explicit width, so switching TO it
   * leaves whatever width is currently in the `vex-admin:<collection>`
   * cookie untouched (the SAME "no explicit value means inherit" rule
   * `pageSize` already follows). Clamped client-side to
   * `[PEEK_PANEL_MIN_WIDTH_PX, 60% of the viewport]` on both drag and
   * read.
   */
  peekWidth?: number;
  /**
   * Collection-wide: fields the list search bar queries, in picker order —
   * the first entry is the default when the user starts typing. Each entry
   * must name a field declaring its own `searchIndex`; checked by
   * `validateSavedListViewConfig`. Omit (on `admin.view`, with no `admin.views[n]`
   * override either) to hide the search bar entirely. Renamed, plural,
   * from the deleted `admin.table.searchField` — stops
   * colliding with this same type's own per-view singular `searchField`).
   * @default undefined (search bar hidden)
   */
  searchFields?: readonly TFieldSlug[];
  /**
   * Collection-wide: available page-size options in the pagination controls. Unset, the
   * defaults plus this view's `pageSize` when it isn't one of them (`pageSize: 20` →
   * `[10, 20, 25, 50, 100]`). `[]` (or one entry) hides the picker.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * Collection-wide: caps the total-count scan on the list's first page:
   * `find` counts with `take(countLimit + 1)` instead of
   * `.collect()`, and returns `totalDocsCapped: true` once the cap is hit.
   * @default 10000
   */
  countLimit?: number;
  /**
   * Collection-wide: default number of items per page fetched from the
   * server (always at least `pageSize`, the client page size).
   * @default 100
   */
  serverPageSize?: number;
  /** Collection-wide: bulk action configuration. @default { delete: true } */
  bulkActions?: {
    /** Enable bulk delete action. @default true */
    delete?: boolean;
  };
};

/**
 * The resolved default ("All") view — shaped exactly like a {@link
 * VexViewConfig} (fixed `viewId: "default"`, reserved — `useSavedListViews`
 * merges it into the tab list first, like any other view) so every
 * consumer that already treats a view generically (tabs, `toClientSavedListViewConfig`,
 * `matchDeclaredSavedListViewFilter`, modified-state diffing) needs no special case
 * for it. Every `state` key but `where`/`searchField` is always resolved
 * (never `undefined`) — `defineCollection` fills every gap the
 * project didn't declare (absorbing every former `admin.table.*` default),
 * three-tier chain (URL → active view → this) bottoms out at.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 */
export interface ResolvedDefaultView<TFieldSlug extends string = string> {
  /** Fixed, reserved — never collides with a project's own `admin.views` entry (checked by `validateSavedListViewConfig`). */
  viewId: "default";
  /** Tab label. `"All"` unless the project names it. */
  name: string;
  description?: string;
  state: {
    /** A hidden filter — same treatment as a preset view's own: a lock badge, `composeSavedListViewWhere` composition, `matchDeclaredSavedListViewFilter` trusts it. */
    where?: VexWhereNodeOf<unknown>;
    /** Always resolved. @default { field: "_creationTime", order: "desc" } */
    sort: CollectionTableSort<TFieldSlug>;
    /** Always resolved. @default every non-hidden data field, bare-slug entries */
    columns: ColumnEntry<TFieldSlug>[];
    /** Always resolved. @default 10 */
    pageSize: number;
    /** `undefined` when the collection declares no `searchFields` at all. */
    searchField?: TFieldSlug;
    /** Always resolved. @default [] (search bar hidden) */
    searchFields: readonly TFieldSlug[];
    /** Always resolved. @default [10, 25, 50, 100], plus a custom `pageSize` */
    pageSizeOptions: number[];
    /** Always resolved. @default 10000 */
    countLimit: number;
    /** Always resolved. @default 100 */
    serverPageSize: number;
    /** Always resolved. @default { delete: true } */
    bulkActions: { delete: boolean };
  };
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
   * The default ("All") view — the view active whenever the URL carries no
   * `view=` param, AND the collection-wide list
   * settings that used to live on the now-deleted `admin.table`
   * (`searchFields`, `pageSizeOptions`, `countLimit`, `serverPageSize`,
   * `bulkActions`) — see {@link VexViewState}, the same type `admin.views[n]`
   * entries share.
   *
   * @default { sort: { field: "_creationTime", order: "desc" }, columns: every non-hidden field, pageSize: 10, searchFields: [], pageSizeOptions: [10, 25, 50, 100], countLimit: 10000, serverPageSize: 100, bulkActions: { delete: true } }
   */
  view?: VexViewState<TFieldSlug>;
  /**
   * Additional preset views, rendered as tabs after the default ("All")
   * tab, in declaration order — read-only in the admin panel (the
   * `config` source). Merged at render time with `shared` (`vex_views`)
   * and `local` (browser) views by `viewId` (`useSavedListViews`).
   * Replaces the former `admin.table.views` (clean cutover).
   * Every `viewId` must be unique within this collection (including against
   * the reserved `"default"` id), every `where` must only name this
   * collection's own fields (plus `"_creationTime"`/`"vex_status"`), every
   * `sort.field` must lead a declared index, every `searchField` must be
   * declared on `admin.view`'s own resolved `searchFields`, and every
   * `columns` entry must be a known field — all checked by `validateSavedListViewConfig`.
   *
   * **Hidden view filters are hidden from the UI, not secret.** A view's
   * `state.where` ships in the client bundle like an access rule —
   * don't encode sensitive thresholds or identifiers in it.
   * UI code never reads `state.where` directly; it reads the
   * {@link VexClientViewConfig} projection `toClientSavedListViewConfig` builds
   * instead, which replaces `where` with `hasHiddenFilter`/`hiddenFilterCount`.
   * The ONE other reader of the raw `where` is `composeSavedListViewWhere`
   * (`collections/savedListViews/composeSavedListViewWhere.ts`), which ANDs it into the `where`
   * the client sends — `find`/`search` take no `view` argument.
   *
   * @default []
   */
  views?: VexViewConfig<TFieldSlug>[];
  /**
   * Live preview for this collection — the resolver from a document to the
   * public URL its preview iframe renders, plus panel behaviour. Omit to
   * disable live preview for this collection.
   */
  livePreview?: AdminLivePreviewConfigInput<Partial<DocumentByCollectionSlug<TCollectionSlug>>>;
  /**
   * Collection-level `edit.*` slot contributions and built-in overrides —
   * merged with the project-wide config of the same shape by `resolveEditSlot` at render time.
   * Also carries this collection's own additive contributions to its own `list.*` slots
   * (S17/S18) — create, search, filters, columns, views, and row/bulk delete are built-ins
   * (`vex.list.*`) and need no entry here; this is only for custom row/bulk actions and other
   * project-authored contributions, merged with `vex.list.*` built-ins by `ListViewLayout`, never
   * here.
   *
   * The seven list-slot arrays are merged flat into the existing
   * `components` object (alongside `components.edit`) rather than a
   * second standalone `components` property, which would collide with
   * the edit-view's own `components?: { edit?: EditComponentsConfigInput<TComponent> }`
   * on this same interface — matching the
   * `collection.admin.components.rowActions` access pattern verbatim, with no extra `.list`
   * nesting level to introduce.
   */
  components?: {
    edit?: EditComponentsConfigInput<TComponent>;
  } & AdminListComponentsInput;
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

  /** The resolved default ("All") view — always present, and every collection-wide list setting that used to live on the now-deleted `admin.table`. See {@link ResolvedDefaultView}. */
  view: ResolvedDefaultView<TFieldSlug>;
  /** Resolved preset views, `where` intact — see the `views` warning on {@link AdminCollectionConfigInput}. */
  views: VexViewConfig<TFieldSlug>[];
  /** Resolved live preview config. `undefined` when the collection omits it. */
  livePreview?: AdminLivePreviewConfig<Partial<DocumentByCollectionSlug<TCollectionSlug>>>;
  /**
   * Collection-level `edit.*` slot contributions and built-in overrides, passed through
   * unresolved — `resolveEditSlot` applies every default when assembling one flat slot id at
   * render time. The seven `list.*` keys (`headerActions`/`toolbar`/`filters`/`beforeTable`/
   * `afterTable`/`rowActions`/`bulkActions`) are resolved and always present, every list
   * defaulted to `[]` and ordered (`collections/config.ts`'s `components` resolution, beside
   * the existing `view`/`livePreview` resolution) — unlike `edit`, which stays unresolved.
   */
  components: {
    edit?: EditComponentsConfigInput<TComponent>;
  } & AdminListComponents;
}

/**
 * Field slugs valid wherever a collection's OWN data-field slugs are
 * accepted in its admin/index config (`admin.view.sort`/`columns`,
 * `admin.views[].state`, `indexes[].fields`) — {@link DataFieldSlug}`<TFields>`
 * PLUS the `updatedAt` `defineCollection` auto-injects into every
 * collection's `fields` record, UNLESS the collection opts out with
 * `timestamps: false` (`TTimestamps extends false`). `TFields` never
 * contains `updatedAt` at the type level — `defineCollection`'s own
 * signature rejects hand-declaring it (the reserved-key guard) — so the
 * injection is the only place that key can come from, and
 * `DataFieldSlug<TFields>` alone can never see it.
 *
 * @typeParam TFields - The collection's own literal `fields` record, as
 *   authored (never including the injected key).
 * @typeParam TTimestamps - The literal `timestamps` option
 *   `defineCollection` was called with — `const`-inferred at the call
 *   site, defaulting to `true` to match the runtime default (inject
 *   unless explicitly opted out).
 */
export type CollectionDataFieldSlug<TFields, TTimestamps extends boolean = true> =
  | DataFieldSlug<TFields>
  | (TTimestamps extends false ? never : "updatedAt");

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
  TTimestamps extends boolean = true,
> {
  /** Admin panel behaviour for this collection. All properties are optional. */
  admin?: AdminCollectionConfigInput<
    CollectionDataFieldSlug<TFields, TTimestamps>,
    TComponent,
    TCollectionSlug extends CollectionSlug ? TCollectionSlug : CollectionSlug
  >;
  /**
   * Hides every admin-authored create entry point for this collection — the
   * list view's "+ New {label}" action, `?createNew=true`'s create-document
   * modal, and a relationship field's picker Create tab/trigger when this
   * collection is the target — for a collection whose rows only ever come
   * from an external write path (e.g. the auth adapter's user collection,
   * populated by sign-up, never by an admin-authored create form). Also
   * makes the `vex:create` Convex endpoint (`collectionsApi`) reject with a
   * `ConvexError`. Edit remains unaffected, and `create()` imported directly
   * from `@vexcms/core/server` still works — this only blocks the
   * admin-facing entry points and the one network endpoint the admin UI
   * itself calls, not every programmatic write path.
   *
   * Top-level (not under `admin`) so `mergeAuthCollections`'s generic merge
   * (`auth/mergeCollections.ts`) carries an auth adapter's own value through
   * even when a project supplies its own `users.ts` with no admin block at
   * all.
   *
   * @default false
   */
  disableCreate?: boolean;
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
    fields: NoInfer<CollectionDataFieldSlug<TFields, TTimestamps>>[];
    /**
     * Also narrow this index on `vex_status` for draft/publish status
     * composition (`versions/statusQueryConstraint.ts`). Only valid
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
  timestamps?: TTimestamps;
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
     * (`cascadeVersionedDelete`). Set `false` to leave the draft
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
  TTimestamps extends boolean = boolean,
  /**
   * The collection's field-slug union, passed explicitly by `defineCollection` and
   * defaulted from `TFields` otherwise. A separate parameter (not derived inline) on
   * purpose: deriving it via `keyof TFields` inside this interface makes TypeScript's
   * variance probe mark `TFields` INVARIANT (more fields → more slugs reads as
   * contravariant), and TS 5.x editors then reject every concrete collection passed
   * where `CollectionConfig` (the `Record<string, AdminField>` default) is expected —
   * `defineConfig({ collections })`, `validateSavedListViewConfig`, … With the slugs as
   * their own covariant parameter, `TFields` only appears in `fields`, so both are
   * measured covariant and assignment works on every TypeScript version.
   */
  TFieldSlug extends string = CollectionDataFieldSlug<TFields, TTimestamps>,
> {
  /** Resolved admin panel configuration for this collection. */
  admin: AdminCollectionConfig<TFieldSlug, TComponent, TCollectionSlug>;
  /**
   * Hides every admin-authored create entry point for this collection, and
   * makes the `vex:create` endpoint reject. Always present — defaults to
   * `false`. @see {@link CollectionConfigInput#disableCreate}
   */
  disableCreate: boolean;
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
    fields: NoInfer<TFieldSlug>[];
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
  /**
   * The raw input `defineCollection()` was called with, attached
   * non-enumerably under this symbol key — an ordinary object spread of a
   * resolved `CollectionConfig` (`{ ...collection }`) drops it. The ONE
   * reader is `mergeAuthCollections`'s generic merge, which needs the exact
   * authored shape back to tell "a key the project genuinely set to
   * `undefined`" apart from "a key `defineCollection` resolved to a
   * default", and to merge the two sides' `fields` on its own, different
   * rule.
   *
   * Deliberately untyped against this interface's own generic params
   * (always the fully-defaulted `CollectionConfigInput`): threading
   * `TFieldMeta`/`TComponent` through here would put them in a contravariant
   * (function-prop) position, making `CollectionConfig` itself invariant in
   * those params — every call site that currently relies on a MORE specific
   * collection being assignable where a less-specific one is expected (e.g.
   * `betterAuthAdapter`'s `AuthCollectionConfig[]` push) would break. A
   * reader narrows with its own cast instead, the same boundary
   * `mergeSingleCollection` already crosses for the locked-field check.
   * @see {@link COLLECTION_INPUT}
   */
  readonly [COLLECTION_INPUT]?: CollectionConfigInput;
}

/**
 * One saved view: an identity (`viewId`, `name`, optional `description`)
 * plus its {@link VexViewState}. The shape of `admin.views` entries (config
 * source) and of `savedListViews/localSavedListViewsStore.ts`'s local entries;
 * {@link VexStoredView} extends it for the `shared` (`vex_views`) source.
 * {@link ResolvedDefaultView} (`admin.view`) is structurally this same
 * shape too (fixed `viewId: "default"`), so a merged view list can treat
 * every source uniformly.
 *
 * This is the full shape — `state.where` intact. It is what
 * `CollectionConfig.admin.views` entries resolve to (above), and it ships
 * to the browser whole, as part of `VexClientConfig` (hidden
 * from the UI, not secret). `find`/`search` take no `view` argument and
 * never see this type — the client reads `state.where` directly in
 * this file, CLIENT-SIDE, to build the plain `where` it sends) and
 * `toClientSavedListViewConfig` (`collections/savedListViews/toClientSavedListViewConfig.ts`, this file,
 * CLIENT-SIDE, called by `useSavedListViews`, to strip `where` for
 * display). Server-side, `matchDeclaredSavedListViewFilter` separately
 * reads a collection's `admin.view`/`admin.views` `where` to recognize a
 * trusted declared filter inside the request `where` it receives — it
 * never reads THIS type, only the collection's own `admin.view`/`admin.views`
 * off `VexConfig`. Everything else in `@vexcms/react` reads a
 * `config`-source view through {@link VexClientViewConfig} instead.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexViewConfig<TFieldSlug extends string = string> = {
  viewId: string;
  name: string;
  description?: string;
  state: VexViewState<TFieldSlug>;
};

/**
 * A `vex_views` row shape: a {@link VexViewConfig} plus the fields only a
 * shared, server-stored view carries — which collection it belongs to, the
 * organization it is scoped to when `access.orgCollectionSlug` is declared,
 * and who created it. A shared view's `where` is the
 * caller's own, built through the filter builder UI — unlike a `config`
 * view's, it is never hidden (that's a `config`-source-only rule).
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexStoredView<TFieldSlug extends string = string> = VexViewConfig<TFieldSlug> & {
  collection: string;
  organizationId?: string;
  createdBy: string;
};

/** {@link VexViewState} with `where` removed — the shape {@link VexClientViewConfig} carries. */
export type VexClientViewState<TFieldSlug extends string = string> = Omit<
  VexViewState<TFieldSlug>,
  "where"
>;

/**
 * The client-safe projection of a `config`-source {@link VexViewConfig} —
 * every field except `state.where`, plus the portion of `where` SAFE to
 * show as a locked chip (`visibleWhere` — every condition on a field the
 * caller can READ) and a hidden-filter summary covering only the REST —
 * `hasHiddenFilter` (whether any condition names a field the caller can't
 * read) and `hiddenFilterCount` (how many leaf conditions, in its DNF
 * tree, counting through `and`/`or`/`not`, are on such a field).
 *
 * Built by `toClientSavedListViewConfig` (`collections/savedListViews/toClientSavedListViewConfig.ts`),
 * called CLIENT-SIDE by `useSavedListViews`, straight off
 * `collection.admin.views` (and `admin.view`, the resolved default) as
 * read from the bundled `VexClientConfig` — that object IS directly
 * imported into client JS, so `state.where` already shipped to the
 * browser as plain text before this function ever runs. `toClientSavedListViewConfig`
 * doesn't keep `where` out of the bundle; it keeps UI CODE from reading
 * it directly, so the filter builder, chips, and every other control
 * only ever see `visibleWhere`/`hasHiddenFilter`/`hiddenFilterCount`. The
 * `listViews` query never touches a `config`-source (or default) view at
 * all — it returns `shared` views only. To actually QUERY a
 * config/default view, the list passes the RAW `VexViewConfig` (not this
 * type) to `composeSavedListViewWhere`.
 *
 * `shared` and `local` views need no client projection — their `where` is
 * the caller's own and travels as a full {@link VexStoredView} / local
 * {@link VexViewConfig}.
 *
 * @typeParam TFieldSlug - Union of this collection's field slugs.
 */
export type VexClientViewConfig<TFieldSlug extends string = string> = {
  viewId: string;
  name: string;
  description?: string;
  state: VexClientViewState<TFieldSlug>;
  /** The portion of the declared `where` safe to show as a read-only, non-removable filter chip — every condition on a field the current caller can read. `undefined` when every condition is on an unreadable field (or there is no `where` at all). */
  visibleWhere?: VexWhereNodeOf<unknown>;
  hasHiddenFilter: boolean;
  hiddenFilterCount: number;
};

/**
 * Props every `list.toolbar` contribution receives — the
 * collection the list view is showing. Deliberately minimal, mirroring
 * `EditSlotProps`'s `{ kind, slug }` (`components/types.ts`): the richer
 * list-wide state (`urlState`, `columns`, `columnMenuEntries`,
 * selection, density, …) comes from `useListViewContext()` (`@vexcms/react`), which a
 * built-in or a project's own contribution calls itself, exactly as
 * `edit.*` contributions call `useVexDocument()` rather than receiving
 * document state as a prop. Lives here, not in `components/types.ts`
 * alongside `EditSlotProps`, because it needs the real `CollectionConfig`
 * type, which `components/types.ts` cannot import without a circular
 * dependency (`collections/types.ts` already imports component types the
 * other way).
 */
export interface ListSlotProps {
  /** The collection the list view is showing. */
  collection: CollectionConfig;
}
