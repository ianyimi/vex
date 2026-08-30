import type { UseSuspenseQueryOptions } from "@tanstack/react-query";
import type {
  FunctionReference,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions as ConvexPaginationOptions,
  PaginationResult as ConvexPaginationResult,
} from "convex/server";

import {
  ADMIN_FIELDS,
  CheckboxFieldType,
  DateFieldType,
  NumberFieldType,
  SelectFieldType,
  TextFieldType,
  type AdminFieldType,
} from "../fields";
import type {
  CollectionsFieldTypeMap,
  CollectionSlug,
  CustomActionsBySlug,
  DocumentBySlug,
} from "../types/generated";
import { VexDocument } from "./convex";
import { VexConfig } from "../config";
import { QueryAction, DraftAction, CrudAction } from "../access";

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape rather than displaying the opaque alias. Without this,
 * hover would show `Populated<"posts", { parent: true }>` instead of the
 * expanded `{ _id: ...; parent: Post[]; ... }` form.
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

// ── Generic args base types ─────────────────────────────────────────────────
//
// Every public `vex.*` function's args interface extends one of these four
// types. They factor out the `ctx` discriminator (and `populate` for queries)
// so per-function args interfaces only carry their unique fields.
//
// Future shared fields (access-control hints, logging tags, request timeouts,
// etc.) get added to the appropriate base — every function inherits them.

/**
 * Base shape for client-side args of a `vex.*` query function.
 *
 * Carries the `ctx?: never` discriminator (forbids passing a Convex query
 * context) and the `populate` field, since every query function that returns
 * documents supports relationship population (the only outlier is `count`,
 * which returns a number and overrides `populate?: never`).
 *
 * Function-specific args interfaces extend this and add their own per-function
 * fields. `limit` stays per-function because it doesn't apply to single-doc
 * queries (`get`) or scalar queries (`count`).
 *
 * @typeParam TCollectionSlug - The collection slug; used to narrow `populate` keys via
 *   `RelationshipKeysOf<TCollectionSlug>`. Defaults to the full `CollectionSlug` union.
 * @typeParam TPopulate - The populate object. Defaults to
 *   `Record<string, never>` (no relationships populated).
 *
 * @example Inheritance pattern
 * ```ts
 * // find — adds slug + limit; populate inherited
 * interface FindClientArgs<TCollectionSlug, TPopulate>
 *   extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
 *   slug: TCollectionSlug;
 *   limit?: number;
 * }
 *
 * // get — adds id; populate inherited; no limit (single-doc)
 * interface GetClientArgs<TCollectionSlug, TPopulate>
 *   extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
 *   id: GenericId<TCollectionSlug>;
 * }
 *
 * // search — adds slug + query + index fields + limit; populate inherited
 * interface SearchClientArgs<TCollectionSlug, TPopulate>
 *   extends GenericQueryClientParams<TCollectionSlug, TPopulate> {
 *   slug: TCollectionSlug;
 *   query: string;
 *   searchIndexName: string;
 *   searchField: string;
 *   limit?: number;
 * }
 *
 * // count — returns a number, has no docs to populate; overrides populate
 * interface CountClientArgs<TCollectionSlug>
 *   extends GenericQueryClientParams<TCollectionSlug> {
 *   slug: TCollectionSlug;
 *   populate?: never;
 * }
 * ```
 */
export interface GenericQueryClientParams<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  D extends number = number,
> {
  /** Discriminator: client args MUST NOT supply `auth`. */
  auth?: never;
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
  /** Recursive populate object, type-narrowed against `RelationshipKeysOf<TCollectionSlug>`. */
  populate?: TPopulate;
  /**
   * Auto-populate all relationship fields to this many levels.
   *
   * Inferred as the literal `D` so a wrapper that threads `D` through to its
   * return type narrows accordingly (`depth: 2` → depth-populated doc). A
   * non-literal `number` degrades to `VexDocument` via {@link DepthPopulated}'s
   * guard. `D` defaults to `number`, so wrappers that do not thread it keep the
   * plain passthrough they had before.
   *
   * Use `populate` for documented consumer code; `depth` is internal.
   */
  depth?: D;
  /**
   * When `true`, the wrapper passes convexQuery's `"skip"` sentinel instead of
   * args, so the query is not issued. Use for conditional queries (e.g. an id
   * that is not known yet) without violating the Rules of Hooks.
   */
  skip?: boolean;
}

/**
 * Base shape for server-side args of a `vex.*` query function.
 *
 * Carries `ctx`, `populate`, `depth`, and `config`. `populate` and `depth`
 * are mutually exclusive — TypeScript enforces this via conditional constraints:
 * `populate` becomes `never` when `D ≠ 0`; `depth` and `config` become `never`
 * when `TPopulate` is non-empty. Passing both is a compile error at the call site.
 *
 * All three query functions (`find`, `get`, `search`) extend this base and
 * inherit these constraints without re-declaring them.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - The collection slug.
 * @typeParam TPopulate - The populate object.
 * @typeParam D - Depth literal (0 = no depth, default). Captured as a literal
 *   via `const D extends number = 0` on the implementing function.
 */
export interface GenericQueryServerParams<
  DataModel extends GenericDataModel = GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  D extends number = 0,
> {
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<QueryCallActionFor<TCollectionSlug>>;
  /** The auth config of the current user making the query.
   * @example
   * ```ts
   * { user: {...}, organization: {...} }
   * ```
   */
  auth?: VexApiAuth;
  /** Discriminator: server args MUST supply a Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /**
   * Recursive populate object, type-narrowed against `RelationshipKeysOf<TCollectionSlug>`.
   * Mutually exclusive with `depth` — becomes `never` when `D ≠ 0`.
   */
  populate?: [D] extends [0] ? TPopulate : never;
  /**
   * Auto-populate all relationship fields to this many levels.
   * Becomes `never` when `TPopulate` is non-empty. Use `populate` for
   * consumer-facing code; this is an internal escape hatch for `CollectionListView`.
   */
  depth?: [TPopulate] extends [Record<string, never>] ? D : never;
  /**
   * The resolved `VexConfig`. Required alongside `depth`; passed
   * from the `queryApi` factory closure so the Convex handler has schema info.
   */
  config?: [TPopulate] extends [Record<string, never>] ? VexConfig : never;
}

/**
 * Base shape for client-side args of a `vex.*` mutation function. Mirrors
 * {@link GenericQueryClientParams} but exists separately so query-only
 * options (`populate`) don't leak into the mutation base, and so future
 * mutation-only shared fields have a clear home.
 */
export interface GenericMutationClientParams {
  /** Discriminator: client args MUST NOT supply `auth`. */
  auth?: never;
  /** Discriminator: client args MUST NOT supply `ctx`. */
  ctx?: never;
}

/**
 * Base shape for server-side args of a `vex.*` mutation function. Used inside
 * custom Convex mutation handlers; receives the Convex mutation context
 * (which is a superset of `GenericQueryCtx` — read+write vs. read-only).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface GenericMutationServerParams<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<MutationCallActionFor<TCollectionSlug>>;
  /** The auth config of the current user making the query.
   * @example
   * ```ts
   * { user: {...}, organization: {...} }
   * ```
   */
  auth?: VexApiAuth;
  /** Discriminator: server args MUST supply a Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /**
   * The resolved `VexConfig`. Required for rbac access control during operations
   * from the `queryApi` factory closure so the Convex handler has schema info.
   */
  config: VexConfig;
}

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
 * Computes the equivalent `PopulateShape` for automatically populating all
 * relationship fields on `TCollectionSlug` to `D` levels deep.
 *
 * This is the type-level counterpart of `buildDepthPopulate`. The computed
 * shape is a valid `PopulateShape<TCollectionSlug>` and can be fed directly into
 * `Populated<TCollectionSlug, DepthPopulate<TCollectionSlug, D>>`.
 *
 * **How the counter works:** `_Counter` is a tuple of `0`s whose `length`
 * tracks how many levels have been descended. At the penultimate level
 * (`[..._Counter, 0]["length"] extends D`) fields are emitted as `true`
 * (populate, no further recursion). At intermediate levels they are emitted as
 * `{ populate: DepthPopulate<Target, D, [..._Counter, 0]> }`.
 *
 * **Practical depth limit: 3.** TypeScript instantiation count grows
 * exponentially with D × relationship-key-count-per-collection. D=1,2,3 is
 * safe for typical VexCMS schemas; D≥4 may cause noticeable `tsc` slowdown.
 * Runtime has no limit.
 *
 * @typeParam TCollectionSlug - The collection slug to start from.
 * @typeParam D - The depth as a literal number (1, 2, or 3 recommended).
 * @typeParam _Counter - Internal tuple counter — callers must not supply this.
 *
 * @example Resolved shape for depth 1 on posts with an author relationship
 * ```ts
 * // DepthPopulate<"posts", 1> → { author?: true }
 * // Equivalent to writing `populate: { author: true }` explicitly
 * ```
 * @example Resolved shape for depth 2
 * ```ts
 * // DepthPopulate<"posts", 2> → { author?: { populate: { team?: true } } }
 * // Equivalent to `populate: { author: { populate: { team: true } } }`
 * ```
 */
export type DepthPopulate<
  TCollectionSlug extends CollectionSlug,
  D extends number,
  _Counter extends 0[] = [],
> = _Counter["length"] extends D
  ? Record<string, never>
  : [..._Counter, 0]["length"] extends D
    ? { [K in RelationshipKeysOf<TCollectionSlug>]?: true }
    : {
        [K in RelationshipKeysOf<TCollectionSlug>]?: {
          populate: DepthPopulate<RelationshipTargetOf<TCollectionSlug, K>, D, [..._Counter, 0]>;
        };
      };

/**
 * Return type of `find` / `get` / `search` when `depth` is provided instead
 * of an explicit `populate` object.
 *
 * Delegates to `Populated<TCollectionSlug, DepthPopulate<TCollectionSlug, D>>` — the same type
 * the explicit populate path produces — so the narrowed shape is identical to
 * what you would get by writing all relationship keys by hand.
 *
 * **Non-literal fallback:** `number extends D` (i.e., `D` is not a literal)
 * short-circuits to `VexDocument` to avoid evaluating an infinite recursive
 * type. `depth` is only called internally with literal values (`1`), so this
 * only fires when depth comes from a non-literal `number` variable.
 *
 * **`depth: 0`** (the default) returns raw un-populated docs — identical to
 * omitting both `depth` and `populate`.
 *
 * @typeParam TCollectionSlug - The collection slug.
 * @typeParam D - The depth literal.
 */
export type DepthPopulated<
  TCollectionSlug extends CollectionSlug,
  D extends number,
> = number extends D
  ? VexDocument
  : D extends 0
    ? TCollectionSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TCollectionSlug]
      : never
    : TCollectionSlug extends keyof DocumentBySlug
      ? Prettify<Populated<TCollectionSlug, DepthPopulate<TCollectionSlug, D>>>
      : never;

// ── Client wrapper return contracts ─────────────────────────────────────────
//
// The Convex endpoints registered by `collectionsApi` are monomorphic: one
// registered function serves every collection, so a `FunctionReference`'s
// return type is fixed at codegen time and a runtime `collection` value can
// never narrow it. The `@vexcms/core/client` wrappers therefore re-attach the
// per-slug type at the CALL SITE by casting the funcRef to the types below.
// The cast is sound because the endpoint really does return that collection's
// document at runtime — `get` (server) reads the row from that table.
//
// These are also the contracts the future per-collection codegen reuses, so
// the narrowing logic lives here exactly once.

/**
 * Tanstack-query options as produced by `convexQuery` for a non-`"skip"` call,
 * with the result pinned to `TReturn` instead of the funcRef's baked type.
 *
 * Named deliberately: publishing this contract as `ReturnType<typeof
 * convexQuery>` instantiates the adapter's generics at their constraints and
 * collapses the query data to `any`.
 *
 * @typeParam TArgs - The endpoint's args shape.
 * @typeParam TReturn - The narrowed return type for this call.
 */
export type VexQueryOptions<TArgs extends Record<string, unknown>, TReturn> = Pick<
  UseSuspenseQueryOptions<
    TReturn,
    Error,
    TReturn,
    ["convexQuery", FunctionReference<"query", "public", TArgs, TReturn>, TArgs]
  >,
  "queryKey" | "queryFn" | "staleTime"
>;

/**
 * The per-document element type shared by `get`, `find`, and `search`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TCollectionSlug]` (raw doc).
 * - No populate + `D > 0` → `DepthPopulated<TCollectionSlug, D>`.
 * - With populate → `Prettify<Populated<TCollectionSlug, TPopulate>>`.
 *
 * Resolves to `never` when the slug is absent from the generated registry
 * (pre-`vex generate`). Nullability is applied by the per-operation aliases.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type DocReturnItem<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TCollectionSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TCollectionSlug]
      : never
    : DepthPopulated<TCollectionSlug, D>
  : TCollectionSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TCollectionSlug, TPopulate>>
    : never;

/**
 * Return type of `get` — a {@link DocReturnItem}, or `null` when no document
 * matches the id. Shared by the server function and the client wrapper's query
 * data so both narrow identically from the collection slug.
 *
 * The `[never]` guard keeps the unregistered-slug case as `never` rather than
 * collapsing it to `null`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type GetReturn<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> = [DocReturnItem<TCollectionSlug, TPopulate, D>] extends [never]
  ? never
  : DocReturnItem<TCollectionSlug, TPopulate, D> | null;

// ── Display / assignability tradeoff (read before "simplifying" this) ────────
//
// The four aliases below have PLAIN bodies, and the `find`/`search` signatures
// deliberately inline `DocReturnItem<…>[]` rather than referencing them.
//
// Why: TypeScript prints a referenced non-conditional alias by NAME, so a
// signature returning `FindReturn<…>` hovers as
// `FindReturn<"session", Record<string, never>, 0>` — useless. Inlining
// `DocReturnItem<…>[]` hovers as `SessionDocument[]`, because `DocReturnItem` is
// a conditional and must be resolved to be displayed. (That is also why
// `GetReturn` reads cleanly: its body is a top-level conditional.)
//
// The tempting fix — wrapping these bodies in a no-op
// `[X] extends [infer T] ? T[] : never` — does force clean display, but a
// deferred conditional is not assignable while `TCollectionSlug`/`TPopulate`/`D`
// are still generic, so every `find`/`search` implementation then needs an
// `as` cast (the price `get` already pays). Plain bodies + inlined signatures
// gets clean display AND no casts.
//
// These names are kept exported as documented contracts for consumers who want
// to annotate their own helpers.

/**
 * Return type of `find` without `paginationOpts` — an array of
 * {@link DocReturnItem}. Shared by the server function and the client wrapper's
 * query data so both narrow identically from the collection slug.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type FindReturn<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> = DocReturnItem<TCollectionSlug, TPopulate, D>[];

/**
 * Return type of `find` with `paginationOpts` — a Convex `PaginationResult`
 * whose `page` entries are {@link DocReturnItem}.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type FindReturnPaginated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> = PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>;

/**
 * Return type of `search` without `paginationOpts`. Identical in shape to
 * {@link FindReturn}; kept as a distinct name so each operation's contract can
 * diverge without a breaking rename.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type SearchReturn<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> = DocReturnItem<TCollectionSlug, TPopulate, D>[];

/**
 * Return type of `search` with `paginationOpts`.
 *
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 */
export type SearchReturnPaginated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> = PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>;

/**
 * Pagination options for Convex queries.
 * Matches Convex's native `paginationOptsValidator` shape.
 */
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
