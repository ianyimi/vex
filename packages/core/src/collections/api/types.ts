import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { VexDocument } from "../../documents/types";
import { VexConfig } from "../../config";
import type {
  AccessCallOptions,
  MutationCallActionFor,
  Populated,
  PopulateShape,
  Prettify,
  PaginationOptions,
  PaginationResult,
  QueryCallActionFor,
  RelationshipKeysOf,
  RelationshipTargetOf,
  VexApiAuth,
} from "../../db/types";
import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";

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
  /**
   * When `true` on a versioned collection, includes the document's draft
   * row alongside its published row — gated server-side on the `readDrafts`
   * action (Step 13). Ignored for a non-versioned collection.
   */
  drafts?: boolean;
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
// never narrow it. The `@vexcms/react/client` wrappers therefore re-attach the
// per-slug type at the CALL SITE by casting the funcRef to the types below.
// The cast is sound because the endpoint really does return that collection's
// document at runtime — `get` (server) reads the row from that table.
//
// These are also the contracts the future per-collection codegen reuses, so
// the narrowing logic lives here exactly once.

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

/** Args for `api.vex.find`. */
export interface VexFindArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts?: PaginationOptions;
  drafts?: boolean;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.find`. */
export interface VexFindPaginatedArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts: PaginationOptions;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.get`. */
export interface VexGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  populate?: unknown;
  depth?: number;
  drafts?: boolean;
}

/** Args for `api.vex.search`. */
export interface VexSearchArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: unknown;
  depth?: number;
  paginationOpts?: PaginationOptions;
  drafts?: boolean;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.create`. */
export interface VexCreateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.update`. */
export interface VexUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.remove`. */
export interface VexRemoveArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  ids: string[];
  softDelete?: string;
}
