import type {
  PaginationOptions as ConvexPaginationOptions,
  PaginationResult as ConvexPaginationResult,
} from "convex/server";
import type { GenericId } from "convex/values";

import { ADMIN_FIELDS, CheckboxFieldType, DateFieldType, NumberFieldType, SelectFieldType, TextFieldType, type AdminFieldType } from "../fields";
import type {
  CollectionsFieldTypeMap,
  CollectionsPopulateMap,
  CollectionSlug,
  CustomActionsBySlug,
  DocumentBySlug,
  GlobalDocumentBySlug,
  GlobalRelationshipKeysOf,
  GlobalRelationshipTargetOf,
  GlobalSlug,
  PopulateMapEntry,
} from "../types/generated";
import { QueryAction, DraftAction, CrudAction } from "../access/constants";

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape rather than displaying the opaque alias. Without this,
 * hovering a type built from several nested conditionals shows the alias
 * name, not its resolved shape.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Per-call access options. Server-side only — NEVER accept these from a registered
 * Convex function's `args`: an action no role declares falls through to
 * `defaultPermissionMode` (default `allow`), so a client-chosen action reads anything.
 *
 * @typeParam A - Action union accepted for this call shape.
 */
export interface AccessCallOptions<A extends string = string> {
  /**
   * Permission action to check instead of the function's natural verb. Use for custom
   * actions (`listFeatured`) and for draft reads (`readDrafts`).
   *
   * @defaultValue the function's natural verb (`read`, `create`, `update`, `delete`)
   */
  action?: A;
  /**
   * Skip RBAC for this call entirely. Also skips `getAuth`, so a public read costs no
   * session lookup.
   *
   * @defaultValue false
   */
  bypass?: boolean;
}

/**
 * Actions a query-shaped call may check. `(string & {})` keeps literal autocomplete.
 *
 * NOT `| DraftAction`: `QueryAction` already carries `readDrafts` (the only
 * query-shaped draft verb), so adding the full draft union would offer
 * `saveDraft`/`publish`/`unpublish` - mutation verbs - in every query position.
 */
export type QueryCallAction = QueryAction | (string & {});

/** Actions a mutation-shaped call may check. The draft verbs minus `readDrafts`. */
export type MutationCallAction = CrudAction | Exclude<DraftAction, QueryAction> | (string & {});

/** Custom actions of one kind declared for slug `S` in the generated registry. @internal */
type CustomCallActionsFor<
  S extends string,
  K extends "query" | "mutation",
> = S extends keyof CustomActionsBySlug
  ? CustomActionsBySlug[S] extends Record<K, infer A extends string>
    ? A
    : never
  : never;

/**
 * Actions a query-shaped call on collection `S` may check.
 *
 * Pre-generation the registry is `{}`, so this collapses to {@link QueryCallAction} —
 * arbitrary strings stay accepted, which is what lets core's own tests exercise custom
 * actions against an unaugmented registry. Post-generation the `(string & {})` arm is
 * REPLACED by the slug's declared union: a custom verb autocompletes exactly where it
 * is declared and is a compile error everywhere else.
 */
export type QueryCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? QueryCallAction
  : QueryAction | CustomCallActionsFor<S, "query">;

/** Mutation-shaped counterpart of {@link QueryCallActionFor}. */
export type MutationCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? MutationCallAction
  : CrudAction | Exclude<DraftAction, QueryAction> | CustomCallActionsFor<S, "mutation">;

// ── Per-collection field-type helpers ─────────────────────────────────────
//
// Read the `CollectionsFieldTypeMap` property on the augmented
// `GeneratedVexTypes` registry (populated by `vex generate`). Used by
// `populate` typing, sortable-column inference, and future filter ops.

/**
 * Returns the union of field keys on `TCollectionSlug` that have field type `TType`.
 *
 * Reads the `CollectionsFieldTypeMap` property on the augmented `GeneratedVexTypes`
 * registry — populated by `vex generate` from the user's collection configs.
 * Returns `never` when the slug has no fields of that type, or when the
 * registry hasn't been augmented yet (fresh project).
 *
 * @typeParam TCollectionSlug - The collection slug.
 * @typeParam TType - The field type literal (e.g., `"text"`, `"relationship"`).
 *
 * @example
 * ```ts
 * type AuthorRelationships = FieldKeysOfType<"posts", "relationship">;
 * // → "author" | "category"
 */
export type FieldKeysOfType<
  TCollectionSlug extends CollectionSlug,
  TType extends AdminFieldType,
> = TCollectionSlug extends keyof CollectionsFieldTypeMap
  ? TType extends keyof CollectionsFieldTypeMap[TCollectionSlug]
    ? CollectionsFieldTypeMap[TCollectionSlug][TType] & string
    : never
  : never;

/** Field keys on `TCollectionSlug` that are relationship fields. */
export type RelationshipKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/** Field keys on `TCollectionSlug` that are text fields. */
export type TextKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/**
 * Field keys on `TCollectionSlug` that are sortable in list views (text, number, date,
 * checkbox, select). Used by future `defaultView.sort` typing and the data-table
 * column registry.
 */
export type SortableKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  TextFieldType | NumberFieldType | DateFieldType | CheckboxFieldType | SelectFieldType
>;

/**
 * Resolves a relationship field's target slug.
 *
 * Reads the *resolved* `RelationshipField.collection.slug` from the
 * `GeneratedVexTypes` document shape (the relationship field key on a doc
 * stores the target slug as part of its branded `Id<TargetSlug>` type).
 * Falls back to `CollectionSlug` if not resolvable.
 */
export type RelationshipTargetOf<
  TCollectionSlug extends CollectionSlug,
  TKey extends string,
> = TCollectionSlug extends keyof DocumentBySlug
  ? TKey extends keyof DocumentBySlug[TCollectionSlug]
    ? NonNullable<DocumentBySlug[TCollectionSlug][TKey]> extends ReadonlyArray<{
        __tableName: infer T;
      }>
      ? T extends CollectionSlug
        ? T
        : CollectionSlug
      : CollectionSlug
    : CollectionSlug
  : CollectionSlug;

/**
 * Resolves the populate OPTION type for one {@link PopulateMapEntry} —
 * the value a caller may put at a given key once `PopulateShape`/
 * `ContainerPopulateShape` has located it in the field tree.
 *
 * - `relationship` / `upload` — a leaf: `true` (populate, no further
 *   recursion) or `{ populate: PopulateShape<Target> }` (populate AND
 *   recurse into the target's own relationships).
 * - `group` — the group's OWN nested container shape, applied directly
 *   (no `{ populate }` wrapper — a group is part of THIS document, not a
 *   separate target collection to recurse into).
 * - `blocks` — an object keyed by each block's `blockType` slug, each
 *   value that block's own nested container shape.
 *
 * @typeParam TEntry - One {@link CollectionsPopulateMap} leaf/container entry.
 */
export type PopulateOptionForEntry<TEntry extends PopulateMapEntry> = TEntry extends {
  kind: "relationship" | "upload";
  target: infer Target extends string;
}
  ? Target extends CollectionSlug
    ? true | { populate: PopulateShape<Target> }
    : true
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? ContainerPopulateShape<TFields>
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? { [B in keyof TBlocks]?: ContainerPopulateShape<TBlocks[B]> }
      : never;

/**
 * Populate options for one container level of the field tree — a
 * collection's top-level fields, a `group()`'s own sub-fields, or one
 * `blocks()` block type's own fields. Keyed by {@link PopulateMapEntry}
 * map (built by `fieldsToPopulateMap` at `vex generate` time), so only
 * keys that actually resolve to a relationship/upload field (at any
 * nesting depth) are legal here.
 *
 * @typeParam TMap - A {@link CollectionsPopulateMap} entry's nested map
 *   (or the top-level per-collection map itself).
 */
export type ContainerPopulateShape<TMap extends Record<string, PopulateMapEntry>> = {
  [K in keyof TMap]?: PopulateOptionForEntry<TMap[K]>;
};

/**
 * Resolves `TCollectionSlug`'s populate map from the augmented
 * `CollectionsPopulateMap` registry, falling back to an empty map when the
 * slug isn't registered (pre-`vex generate`, or an internal recursive use
 * with the full `CollectionSlug` union).
 *
 * Factored out so `PopulateShape`'s own immediate form is a plain mapped
 * type (`ContainerPopulateShape<...>`), not a conditional — a generic
 * `TPopulate extends PopulateShape<TCollectionSlug> = {}`-style default
 * (used throughout `collections/api/types.ts`/`server.ts`) is checked
 * against `PopulateShape`'s OWN unresolved form, and a conditional at that
 * outermost position fails to resolve for an abstract `TCollectionSlug` —
 * even `{}` stops satisfying it. A plain mapped type whose KEY DOMAIN is
 * computed via a conditional (here, inside this helper) does not have that
 * problem, matching every other field-type-map-driven shape in this file
 * (`RelationshipKeysOf` et al.) that already did it this way.
 */
type PopulateMapFor<TCollectionSlug extends CollectionSlug> =
  TCollectionSlug extends keyof CollectionsPopulateMap ? CollectionsPopulateMap[TCollectionSlug] : {};

/**
 * Recursive populate options for `TCollectionSlug`, type-restricted to
 * paths the augmented `CollectionsPopulateMap` registry (populated by
 * `vex generate`) resolves to a relationship or upload field — including
 * one nested inside a `group()`, an `array()` item, or a `blocks()` block
 * (keyed by `blockType`). `tabs()`/`row()`/`collapsible()` need no special
 * handling: `CollectionsPopulateMap` is built from `getDataFields`, which
 * already hoists their fields to the containing level.
 *
 * @example
 * ```ts
 * // `content` is a blocks() field; `hero` is a block's `blockType`;
 * // `image` is an upload() field declared on that block.
 * populate: { content: { hero: { image: true } } }
 * ```
 *
 * @typeParam TCollectionSlug - The collection slug to narrow populatable
 *   paths against. Defaults to the full `CollectionSlug` union for
 *   internal recursive use (a relationship/upload target).
 */
export type PopulateShape<TCollectionSlug extends CollectionSlug = CollectionSlug> = ContainerPopulateShape<
  PopulateMapFor<TCollectionSlug>
>;

/**
 * Placeholder `populateDocs` substitutes for a populated relationship/upload
 * target the caller's resolved read decision denies, in place of the real
 * `Doc<TargetSlug>` — same seam `AccessDeniedItemRow` already renders for a
 * direct `get()` on a relationship/upload field's own id, now reached
 * through a populated field too.
 *
 * Carries just enough to render a locked row without ever exposing the
 * target document's own fields: `_id` (so a list key / remove action still
 * has something to key off), and the same `{ code, resource, action }` shape
 * `VexAccessError.data` carries for a direct denied read. A denial that is
 * only FIELD-scoped (the caller may read the target doc, just not every
 * field on it) never produces this — the target doc comes back with the
 * denied fields stripped by `stripDeniedFields` instead, same as a direct
 * `get`/`find`/`search` read.
 *
 * @typeParam TResource - The target collection's slug.
 */
export interface HiddenDocument<TResource extends string = string> {
  /** The target document's own id, never stripped. */
  _id: GenericId<TResource>;
  /** Always `"ACCESS_DENIED"` — mirrors `VexAccessError.data.code`. */
  code: "ACCESS_DENIED";
  /** The denied target collection's slug. */
  resource: TResource;
  /** Always `"read"` — populate only ever resolves a target for reading. */
  action: "read";
}

/**
 * Result type of a populated query — `DocumentBySlug[TCollectionSlug]` with
 * each path listed in `TPopulate` replaced from raw `Id[]` to resolved
 * `Doc[]`, including a path nested inside a `group()`, an `array()` item,
 * or a `blocks()` block (keyed by `blockType`). Unlisted keys — at any
 * level — keep their original type untouched.
 *
 * Recurses through a leaf's own `{ populate: ... }` (D12: unbounded
 * nesting across target collections) and transparently through every
 * `group`/`blocks` container {@link CollectionsPopulateMap} describes,
 * driven structurally by `TPopulate` rather than walking the field tree
 * again — the same map `PopulateShape` itself is restricted against.
 *
 * Each populated array's element type also includes {@link HiddenDocument} —
 * `populateDocs` applies the target collection's own read rule (and
 * field-permission map) to every resolved target, exactly as a direct `get`
 * on that collection would, so a caller without read access on the target
 * gets a placeholder in its place rather than the document's real fields.
 */
export type Populated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
> = TCollectionSlug extends keyof DocumentBySlug
  ? TCollectionSlug extends keyof CollectionsPopulateMap
    ? ApplyContainerPopulate<DocumentBySlug[TCollectionSlug], CollectionsPopulateMap[TCollectionSlug], TPopulate>
    : DocumentBySlug[TCollectionSlug]
  : never;

/**
 * Unconstrained counterpart of {@link Populated} for `DepthPopulated`'s own
 * use — `TPopulate` carries NO `extends PopulateShape<TCollectionSlug>`
 * bound.
 *
 * `DepthPopulate`'s own walk is ALWAYS a valid `PopulateShape` by
 * construction, so nothing needs to re-verify it — but `Populated`'s own
 * constrained second parameter forced exactly that (via an
 * `& PopulateShape<TCollectionSlug>` bridge, needed only because
 * `DepthPopulate`'s mapped-type key domain is a separate, though
 * equivalent, expression from `PopulateShape`'s own — see `DepthPopulate`'s
 * own doc comment). That bridge multiplies TWO already-recursive container
 * walks (the depth walk AND the populate-shape walk) together for every
 * instantiation, which overflows TypeScript's instantiation depth limit
 * (`TS2589`) on a real, many-collection project — `DepthPopulate`'s OWN
 * "practical depth limit: 3" note is about ITS OWN recursion; the
 * intersection bridge made the COMBINED cost worse than either alone.
 *
 * Internal-use only — never accept arbitrary caller-supplied `TPopulate`
 * through this alias; it has no key-safety checking at all.
 */
export type ApplyDepthPopulate<TCollectionSlug extends CollectionSlug, TPopulate> =
  TCollectionSlug extends keyof DocumentBySlug
    ? TCollectionSlug extends keyof CollectionsPopulateMap
      ? ApplyContainerPopulate<DocumentBySlug[TCollectionSlug], CollectionsPopulateMap[TCollectionSlug], TPopulate>
      : DocumentBySlug[TCollectionSlug]
    : never;

/**
 * Applies `TOpt` (a {@link ContainerPopulateShape} value) over `TValue` (the
 * real document/group/block-item shape at this same container level),
 * guided by `TMap` (the matching {@link CollectionsPopulateMap} entry map).
 * Every key of `TValue` is preserved; only keys both present in `TMap` AND
 * requested in `TOpt` are replaced. @see {@link Populated}
 */
type ApplyContainerPopulate<TValue, TMap extends Record<string, PopulateMapEntry>, TOpt> = {
  [K in keyof TValue]: K extends keyof TMap
    ? K extends keyof TOpt
      ? ApplyEntryPopulate<TValue[K], TMap[K], TOpt[K]>
      : TValue[K]
    : TValue[K];
};

/** One field's populated value, dispatched by its {@link PopulateMapEntry} kind. @see {@link Populated} */
type ApplyEntryPopulate<TValue, TEntry extends PopulateMapEntry, TOpt> = TEntry extends {
  kind: "relationship" | "upload";
  target: infer Target extends string;
}
  ? TOpt extends true | { populate: unknown }
    ? Target extends CollectionSlug
      ? Target extends keyof DocumentBySlug
        ? TOpt extends { populate: infer NestedPopulate }
          ? NestedPopulate extends PopulateShape<Target>
            ? (Populated<Target, NestedPopulate> | HiddenDocument<Target>)[]
            : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
          : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
        : TValue
      : TValue
    : TValue
  : TEntry extends { kind: "group"; fields: infer TFields extends Record<string, PopulateMapEntry> }
    ? TOpt extends Record<string, unknown>
      ? NonNullable<TValue> extends ReadonlyArray<infer Item>
        ? ApplyContainerPopulate<Item, TFields, TOpt>[]
        : ApplyContainerPopulate<TValue, TFields, TOpt>
      : TValue
    : TEntry extends {
          kind: "blocks";
          blocks: infer TBlocks extends Record<string, Record<string, PopulateMapEntry>>;
        }
      ? TOpt extends Record<string, unknown>
        ? NonNullable<TValue> extends ReadonlyArray<infer Item>
          ? ApplyBlockItemPopulate<Item, TBlocks, TOpt>[]
          : TValue
        : TValue
      : TValue;

/**
 * Applies a `blocks()` populate option to one block-union member `TItem`.
 * `TItem` is a bare conditional-type parameter, so this DISTRIBUTES over
 * the block union automatically — each block type is checked against its
 * own `blockType` literal independently. @see {@link Populated}
 */
type ApplyBlockItemPopulate<
  TItem,
  TBlocks extends Record<string, Record<string, PopulateMapEntry>>,
  TOpt,
> = TItem extends { blockType: infer BT extends string }
  ? BT extends keyof TOpt
    ? BT extends keyof TBlocks
      ? ApplyContainerPopulate<TItem, TBlocks[BT], TOpt[BT]>
      : TItem
    : TItem
  : TItem;

/**
 * Populate options for a global — keys restricted to relationship fields via
 * `GlobalRelationshipKeysOf<TGlobalSlug>`, each resolving `{ populate }` to a
 * real `PopulateShape<Target>` for the relationship's target COLLECTION
 * (never `Record<string, unknown>`) — globals relate to collections, not to
 * other globals, so a populated global relationship recurses into the
 * target collection's OWN nested populate machinery (`PopulateShape`),
 * reaching a field nested inside that collection's `blocks()`/`array()`/
 * `group()` the same way a direct collection-to-collection populate would.
 *
 * @typeParam TGlobalSlug - The global slug.
 */
export type GlobalPopulateShape<TGlobalSlug extends GlobalSlug = GlobalSlug> = {
  [K in GlobalRelationshipKeysOf<TGlobalSlug>]?:
    | true
    | { populate: PopulateShape<GlobalRelationshipTargetOf<TGlobalSlug, K & string>> };
};

/**
 * Return type of `globals.get` when `populate` is provided. Maps over
 * `GlobalDocumentBySlug[TGlobalSlug]`, replacing each populated relationship
 * field's raw `Id[]` with the real target collection document array (or
 * `Populated<Target, NestedPopulate>` when `{ populate }` recurses further)
 * — the global counterpart of `Populated<TCollectionSlug, TPopulate>`.
 *
 * @typeParam TGlobalSlug - The global slug.
 * @typeParam TPopulate - The populate options object.
 */
export type GlobalPopulated<
  TGlobalSlug extends GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug>,
> = TGlobalSlug extends keyof GlobalDocumentBySlug
  ? {
      [K in keyof GlobalDocumentBySlug[TGlobalSlug]]: K extends keyof TPopulate
        ? K extends string
          ? GlobalRelationshipTargetOf<TGlobalSlug, K> extends infer Target
            ? Target extends CollectionSlug
              ? Target extends keyof DocumentBySlug
                ? TPopulate[K] extends { populate: infer NestedPopulate }
                  ? NestedPopulate extends PopulateShape<Target>
                    ? (Populated<Target, NestedPopulate> | HiddenDocument<Target>)[]
                    : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
                  : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
                : GlobalDocumentBySlug[TGlobalSlug][K]
              : GlobalDocumentBySlug[TGlobalSlug][K]
            : GlobalDocumentBySlug[TGlobalSlug][K]
          : GlobalDocumentBySlug[TGlobalSlug][K]
        : GlobalDocumentBySlug[TGlobalSlug][K];
    }
  : never;

/**
 * Unconstrained counterpart of {@link GlobalPopulated} for `GetGlobalReturn`'s
 * own `depth` branch — same rationale as {@link ApplyDepthPopulate}:
 * `GlobalDepthPopulate`'s walk is valid by construction, so nothing needs to
 * re-verify it against `GlobalPopulateShape`'s own constraint (which would
 * otherwise need the same expensive `& GlobalPopulateShape<TGlobalSlug>`
 * bridge `DepthPopulated` used to need). Internal-use only.
 */
export type ApplyGlobalDepthPopulate<TGlobalSlug extends GlobalSlug, TPopulate> =
  TGlobalSlug extends keyof GlobalDocumentBySlug
    ? {
        [K in keyof GlobalDocumentBySlug[TGlobalSlug]]: K extends keyof TPopulate
          ? K extends string
            ? GlobalRelationshipTargetOf<TGlobalSlug, K> extends infer Target
              ? Target extends CollectionSlug
                ? Target extends keyof DocumentBySlug
                  ? TPopulate[K] extends { populate: infer NestedPopulate }
                    ? NestedPopulate extends PopulateShape<Target>
                      ? (Populated<Target, NestedPopulate> | HiddenDocument<Target>)[]
                      : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
                    : (DocumentBySlug[Target] | HiddenDocument<Target>)[]
                  : GlobalDocumentBySlug[TGlobalSlug][K]
                : GlobalDocumentBySlug[TGlobalSlug][K]
              : GlobalDocumentBySlug[TGlobalSlug][K]
            : GlobalDocumentBySlug[TGlobalSlug][K]
          : GlobalDocumentBySlug[TGlobalSlug][K];
      }
    : never;

/**
 * Pagination options for Convex queries.
 *
 * Re-exported from `convex/server` for convenience. This is the exact type
 * that Convex's `.paginate(opts)` API expects.
 *
 * @see https://docs.convex.dev/database/pagination
 */
export type PaginationOptions = ConvexPaginationOptions & {
  /**
   * Whether to include a total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful
   * re-counting. Counts at most `admin.view.state.countLimit + 1` matching
   * documents (default 10000; `search` clamps to 1023, Convex's search-result ceiling) — see `PaginationResult.totalDocsCapped`.
   *
   * @default false
   */
  totalDocs?: boolean;
};

/**
 * `totalDocs` / `totalDocsCapped` are only present on the first page
 * (`cursor: null`) of a call that requested `paginationOpts.totalDocs:
 * true` — `find` / `search` count at most `admin.view.state.countLimit + 1`
 * rows (default 10000) instead of `.collect()`-ing every matching row.
 * `totalDocsCapped: true` means the real count is AT
 * LEAST `totalDocs` — the UI renders "Showing 25 of 10,000+" rather than an
 * exact number past the cap.
 *
 * `viewerId` is the caller's resolved identity (`VexApiAuth.user._id`, `null`
 * for an anonymous/no-session caller) at the moment THIS page was produced —
 * present on every REAL paginated page `find`/`search` return, not just the
 * first; optional only because synthetic/empty placeholders elsewhere (a
 * fresh hook's initial render, test fixtures predating this field) don't
 * carry one — absent is "no information," never treated as a mismatch. A
 * live Convex subscription re-evaluates under a NEW identity in place (no
 * new query key), so a page can arrive tagged with an OLDER or newer
 * identity than what the client currently expects while a sign-in/out is
 * still settling; comparing `viewerId` against the client's own
 * expected-identity marker (see `@vexcms/react`'s `useAuthTransition`) is
 * what lets the list hooks ignore a page — success OR a thrown error like
 * Convex's `InvalidCursor` — that doesn't match, instead of flashing it.
 */
export type PaginationResult<T> = ConvexPaginationResult<T> & {
  totalDocs?: number;
  totalDocsCapped?: boolean;
  viewerId?: string | null;
};

/**
 * Client-side pagination state.
 * Tracks cursor stack for forward/backward navigation.
 */
export interface PaginationState {
  /** Current page number (1-based). */
  currentPage: number;
  /** Items per page. */
  pageSize: number;
  /** Stack of cursors for backward navigation. */
  cursorStack: (string | null)[];
  /** Current cursor (top of stack). */
  cursor: string | null;
  /** Whether there are more pages after current page. */
  hasNextPage: boolean;
  /** Whether there are previous pages. */
  hasPreviousPage: boolean;
  /** Total count of items (optional — requires separate count query). */
  totalCount?: number;
}

/**
 * Selection mode for data tables.
 */
export type SelectionMode =
  | "none" // No items selected
  | "page" // Items on current page selected
  | "all" // All items in table selected
  | "inverse"; // All items selected except explicitly deselected ones

/**
 * Selection state for bulk actions.
 */
export interface SelectionState {
  /** Set of selected document IDs. */
  selectedIds: Set<string>;
  /** Current selection mode. */
  mode: SelectionMode;
}

// ── RBAC enforcement seam ───────────────────────────────────────────────────
//
// Consumed by `queryApi` / `mutationApi` / `globalsApi` in `./server`. Kept here
// (not `./server`) because these describe the factories collectively, not one
// operation, and this file is barrel-exported from the package root.

/**
 * The resolved caller identity RBAC guards check against. Returned by a
 * user-supplied `getAuth` callback.
 *
 * @see {@link VexApiOptions} for where `getAuth` is configured.
 */
export type VexApiAuth = {
  /**
   * Passed as `hasPermission`'s `user` — shape is caller-defined. Must include
   * whatever field `access.userRolesField` names (a role string or string[])
   * for role resolution to succeed; a user object without it resolves to an
   * empty role list and denies every check.
   */
  user: Record<string, unknown> | null;
  /**
   * Passed as `hasPermission`'s `organization`. Shape is caller-defined; omit
   * when the access config has no `orgCollectionSlug`.
   */
  organization?: Record<string, unknown>;
};
