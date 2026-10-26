import type {
  PaginationOptions as ConvexPaginationOptions,
  PaginationResult as ConvexPaginationResult,
} from "convex/server";

import { ADMIN_FIELDS, CheckboxFieldType, DateFieldType, NumberFieldType, SelectFieldType, TextFieldType, type AdminFieldType } from "../fields";
import type { CollectionsFieldTypeMap, CollectionSlug, CustomActionsBySlug, DocumentBySlug } from "../types/generated";
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
 * checkbox, select). Used by future `defaultSort` typing and the data-table
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
 * Recursive populate options, type-restricted to relationship field keys per
 * the augmented `CollectionsFieldTypeMap` registry.
 *
 * @typeParam TCollectionSlug - The collection slug to narrow relationship keys against.
 *   Defaults to the full `CollectionSlug` union for internal recursive use.
 */
export type PopulateShape<TCollectionSlug extends CollectionSlug = CollectionSlug> = {
  [K in RelationshipKeysOf<TCollectionSlug>]?:
    | true
    | {
        populate: PopulateShape<RelationshipTargetOf<TCollectionSlug, K>>;
      };
};

/**
 * Result type of a populated query — `Doc<TCollectionSlug>` with each key listed in
 * `TPopulate` replaced from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.
 * Recurses if the populate value has a nested `populate` field (D12: unbounded
 * nesting).
 *
 * Keys not in `TPopulate` keep their original `Id[]` type. Non-relationship
 * keys are left untouched.
 */
export type Populated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
> = TCollectionSlug extends keyof DocumentBySlug
  ? {
      [K in keyof DocumentBySlug[TCollectionSlug]]: K extends keyof TPopulate
        ? K extends string
          ? RelationshipTargetOf<TCollectionSlug, K> extends infer Target
            ? Target extends CollectionSlug
              ? Target extends keyof DocumentBySlug
                ? // Recurse if nested populate is provided.
                  TPopulate[K] extends {
                    populate: infer NestedPopulate;
                  }
                  ? NestedPopulate extends PopulateShape<Target>
                    ? Populated<Target, NestedPopulate>[]
                    : DocumentBySlug[Target][]
                  : DocumentBySlug[Target][]
                : DocumentBySlug[TCollectionSlug][K]
              : DocumentBySlug[TCollectionSlug][K]
            : DocumentBySlug[TCollectionSlug][K]
          : DocumentBySlug[TCollectionSlug][K]
        : DocumentBySlug[TCollectionSlug][K];
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
   * Whether to include total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful re-counting.
   * Counts all documents matching the current filters/search query.
   *
   * Returns `null` if the count exceeds Convex transaction limits (>32k documents).
   *
   * @default false
   */
  totalDocs?: boolean;
};

/**
 * Pagination result from Convex query.
 *
 * Re-exported from `convex/server`. Returned by queries using `.paginate(opts)`.
 *
 * Includes:
 * - `page: T[]` — Current page of results
 * - `isDone: boolean` — Whether this is the last page
 * - `continueCursor: string` — Cursor to fetch next page
 * - `splitCursor?: string | null` — Cursor to split large pages (optional)
 * - `pageStatus?: "SplitRecommended" | "SplitRequired" | null` — Indicates when to split (optional)
 *
 * @see https://docs.convex.dev/database/pagination
 */
export type PaginationResult<T> = ConvexPaginationResult<T> & {
  totalDocs?: number | null;
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
