import type { GenericDataModel, GenericDocument, NamedTableInfo, QueryInitializer } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryServerParams,
} from "../types";
import type {
  PaginationOptions,
  PaginationResult,
  PopulateShape,
} from "../../../db/types";
import {
  AccessDocFieldFor,
  resolveQueryConstraint,
  resolveQueryIndex as resolveAccessQueryIndex,
} from "../../../access";
import { pickConvexQueryIndex } from "../../../access/pickConvexQueryIndex";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "../../../access/convexTypes";
import type { ConstraintResult } from "../../../access/queryConstraintTypes";
import {
  andConvexQueryFilters,
  convertCommitTsWhereToNs,
  normalizeArrayStoredWhere,
  whereFieldNames,
  whereToConvexQueryFilter,
  withIndexToConvexQueryIndex,
  type VexWhere,
  type VexWhereNode,
  type VexWithIndex,
} from "../../../db/queryArgs";
import { findCollectionConfig, readableDocuments } from "../../../db/documents";
import { resolveReadCall } from "../../../access/resolveReadCall";
import { canonicalRowFilter, composeStatusQueryConstraint } from "../../../versions";
import { resolveQueryIndex } from "../../query/resolveQueryIndex";
import { mergeDraftCounterparts } from "../../query/mergeDraftCounterparts";
import { resolveWhereFields } from "../../query/resolveWhereFields";
import { resolveTotalDocsCap } from "../../query/resolveTotalDocsCap";
import type { CollectionTableSort } from "../../types";
import { VexError } from "../../../errors";

/**
 * Server-side args for `find`. Extends {@link GenericQueryServerParams}
 * to inherit `ctx`, `populate`, `depth`, and `config` (with their mutual-exclusion
 * constraints). All query-chain options map to `ctx.db.query()` equivalents
 * applied in order: `withIndex` → `order` → `filter` → `take`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface FindServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The collection to query — must match a registered collection slug. */
  collection: TCollectionSlug;

  /**
   * Maximum number of documents to return, applied as the terminal `.take(n)`
   * on the Convex query. Omit it, or pass `0`, to return every matching
   * document (`.collect()`). Ignored when `paginationOpts` is set.
   */
  limit?: number;

  /**
   * Result ordering. Equivalent to `.order("asc" | "desc")` on the Convex
   * query. Defaults to `"asc"` (insertion order).
   */
  order?: "asc" | "desc";

  /**
   * Predicate over the collection's fields, applied after index narrowing.
   * Fields are referenced by name; combine with `q.and` / `q.or` / `q.not`.
   *
   * Prefer `withIndex` for performance: on Convex, `where` scans every document
   * in the narrowed range.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", where: (q) => q.eq("published", true) })
   * find({ ctx, collection: "posts", where: { field: "published", op: "eq", value: true } })
   * ```
   */
  where?: VexWhere<TCollectionSlug>;

  /**
   * Index to read through, with an optional range over its fields in
   * declaration order. Strongly preferred over `where` for performance.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: (q) => q.eq("slug", "hello") } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_score", range: (q) => q.gte("score", 50) } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_publishedAt" } })
   * ```
   */
  withIndex?: VexWithIndex<TCollectionSlug>;

  /**
   * Portable sort — `{ field, order }`. The server resolves `field` to an
   * index via `resolveQueryIndex`, which also pushes matching equalities
   * from `where` into that index's range when one is available — callers
   * never name an index directly. Mutually exclusive with `withIndex` —
   * passing both throws a `VexError`.
   *
   * The resolved index competes for the query's one `withIndex` slot
   * through the same `pickConvexQueryIndex` arbitration as `withIndex` (an
   * access-constraint index wins a free slot; a same-named index merges
   * ranges; a differently-named caller index displaces it and the access
   * rule falls back to `.filter()`) — `sort` carries no precedence of its
   * own over an access-contributed index.
   *
   * Rejected with a `VexAccessError` when the caller cannot read
   * `sort.field` — sort order alone would leak the field's values.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", sort: { field: "publishedAt", order: "desc" } })
   * ```
   */
  sort?: CollectionTableSort<AccessDocFieldFor<TCollectionSlug>>;

  /**
   * Pagination options. When provided, the function returns a `PaginationResult`
   * with `{ page, continueCursor, isDone }` instead of a plain array.
   *
   * Uses Convex's native `.paginate(opts)` API under the hood.
   */
  paginationOpts?: PaginationOptions;

  /**
   * Include draft rows for a versioned collection. Defaults to `false`.
   *
   * The two-row draft model (design-review.md §1) means an unfiltered query on a
   * versioned collection returns the same logical document twice — once
   * `vex_status: "published"`, once `vex_status: "draft"` — so `find` injects a
   * published-only constraint unless this is `true`. Ignored for a collection that
   * doesn't declare `versions.drafts`.
   *
   * Also switches the RBAC action this call resolves against, from `"read"` to
   * `"readDrafts"` (`DRAFT_ACTIONS.readDrafts`) — but only when the caller's
   * role grants `readDrafts` at all. A caller without it silently falls back
   * to the published-only read (the same non-throwing fallback `getGlobal`
   * uses), so one set of query args serves every caller: the admin list view
   * and its server prefetch can both always send `drafts: true` for a
   * versioned collection without knowing who is asking.
   */
  drafts?: boolean;
}

// Overload 1: WITHOUT paginationOpts → returns array (most common case)
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts?: never;
  },
  // Inlined rather than `FindReturn<…>` so hover resolves to `Doc[]` — see the
  // display/assignability note in `../types`.
): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;

// Overload 2: WITH paginationOpts → returns PaginationResult
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts: PaginationOptions;
  },
): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;

/**
 * Find documents in a collection with optional pagination and total count.
 *
 * Pass `paginationOpts: { ..., totalDocs: true }` to also count matching
 * documents on the first page (`cursor: null`) only. Counts with
 * `take(countLimit + 1)` instead of `.collect()`-ing the whole matching
 * set (default `countLimit` 10000) — `totalDocs` is
 * the exact count up to that cap, never `null`; `totalDocsCapped: true`
 * means more matching documents exist beyond the cap and `totalDocs`
 * equals `countLimit`, a floor rather than an exact count.
 *
 * Prefer calling this through `vexServerApi()`'s bound `find`, which threads
 * `config` (and a resolved `auth`) for you — a raw call omitting `config` is a
 * type error, and a raw call omitting `auth` runs as `anonRole`.
 *
 * @param args - Find arguments including filters, sort, pagination, and count options
 * @returns Array of documents, or a `PaginationResult` (`{ page,
 *   continueCursor, isDone }`, plus `totalDocs`/`totalDocsCapped` when the
 *   first page requested a count) when `paginationOpts` is given
 *
 * @example
 * ```ts
 * // Without pagination
 * const docs = await find({ ctx, config, collection: "posts" });
 *
 * // With pagination
 * const result = await find({
 *   ctx,
 *   config,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false }
 *
 * // With pagination and a first-page count
 * const result = await find({
 *   ctx,
 *   config,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null, totalDocs: true },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalDocs: 1523, totalDocsCapped: false }
 * ```
 */
export async function find<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<
  FindReturn<TCollectionSlug, TPopulate, D> | FindReturnPaginated<TCollectionSlug, TPopulate, D>
> {
  // Effective drafts flag + the action it resolves under — see `resolveReadCall`
  // for the fallback a caller without `readDrafts` gets.
  const { access, action, resource, wantsDrafts } = resolveReadCall({
    config: args.config,
    access: args.access,
    auth: args.auth,
    collection: args.collection,
    drafts: args.drafts,
  });
  if (args.sort && args.withIndex) {
    throw new VexError({
      code: "SORT_WITH_INDEX",
      collection: args.collection,
      message: `find: collection "${args.collection}" was called with both "sort" and "withIndex". Clients send "sort" (portable) or "withIndex" (explicit), never both.`,
    });
  }
  const accessIndex = resolveAccessQueryIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  const collectionConfig = findCollectionConfig({ config: args.config, slug: args.collection });
  const where = normalizeArrayStoredWhere({
    where: convertCommitTsWhereToNs({
      where: args.where as VexWhereNode<string> | undefined,
      fields: collectionConfig?.fields ?? {},
    }),
    fields: collectionConfig?.fields ?? {},
  });
  // Portable sort + filter-index pushdown. Skipped when the caller names
  // an explicit `withIndex` — that index is authoritative, and automatic
  // pushdown would otherwise compete for the same query slot.
  const queryIndexResolution = args.withIndex
    ? undefined
    : resolveQueryIndex({
        config: args.config,
        collection: args.collection,
        where: where as VexWhereNode<string> | undefined,
        sort: args.sort as CollectionTableSort<string> | undefined,
        drafts: wantsDrafts,
        access,
        auth: args.auth,
        action,
        resource,
      });
  const callerIndex = queryIndexResolution?.indexName
    ? { name: queryIndexResolution.indexName, range: queryIndexResolution.range }
    : withIndexToConvexQueryIndex({
        withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
      });
  // `where` minus whatever pushdown above pushed into the index's own
  // range — those equalities are already enforced by `withIndex`, so
  // re-applying them in `.filter()` would be redundant. The explicit-`withIndex`
  // path ran no pushdown, so it keeps the caller's full `where`.
  const pushdownRemainder = args.withIndex
    ? (where as VexWhereNode<string> | undefined)
    : queryIndexResolution?.remainder;
  const callerFilter = whereToConvexQueryFilter({
    where: pushdownRemainder as VexWhere<string> | undefined,
    fields: whereFieldNames({ config: args.config, collection: args.collection }),
  });
  // A request `where` part that deep-equals a config view's own `where` is
  // trusted server config, exempt from the field-read check below; only
  // the REMAINING parts of `where` still need every referenced field to
  // be readable, with a lazy fall back to a readable shared view's own
  // declared filter — see `resolveWhereFields` for the pipeline, shared
  // with `search/server.ts`.
  const whereFields = await resolveWhereFields({
    ctx: args.ctx,
    config: args.config as VexConfig,
    collection: args.collection,
    collectionConfig,
    where: where as VexWhereNode<string> | undefined,
    access,
    callerAccess: args.access,
    auth: args.auth,
    resource,
  });
  const rbacResolvedIndex = pickConvexQueryIndex({ accessIndex, callerIndex });
  const rbacFilter = resolveQueryConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
    indexAlreadyApplied: accessIndex !== undefined && rbacResolvedIndex?.name === accessIndex.name,
  });
  // Status narrowing is independent of RBAC (design-review.md §3.1) — it runs
  // whenever `requiresPublishedOnly` says so, whether or not `access` above is
  // `undefined` (bypassed or unconfigured). Also arbitrates the winning index's
  // OWN `draftStatus` declaration (`versions/statusQueryConstraint.ts`)
  // — a `drafts: true` read against a `draftStatus: true`-only index drops the
  // range and re-applies it as a filter, so no access inputs are needed here.
  const { resolvedIndex, accessFilter } = composeStatusQueryConstraint({
    config: args.config,
    collection: args.collection,
    drafts: wantsDrafts,
    resolvedIndex: rbacResolvedIndex,
    accessFilter: rbacFilter,
  });
  // Draft-pair pagination fix: when this read effectively gets drafts on a
  // versioned collection, narrow the query to "canonical" rows — one per
  // logical document — instead of returning a linked draft row as its own
  // separate row for the client to pair up (`mergeDraftCounterparts`
  // attaches each linked draft's fields back on per page, below).
  const draftCanonicalFilter = canonicalRowFilter({
    config: args.config,
    collection: args.collection,
    drafts: wantsDrafts,
  });

  // `resolveQueryIndex`'s no-`sort` branch always reports `order: "asc"`
  // (its own default, matching no-pushdown insertion order) — that must
  // NOT clobber `args.order` when the caller never asked for a `sort` at
  // all, so the pushdown-resolved order only applies when `sort` was set.
  const resolvedOrder = args.sort ? (queryIndexResolution?.order ?? args.order) : args.order;
  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
    ...args,
    order: resolvedOrder,
    resolvedIndex,
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter, draftCanonicalFilter] }),
  });

  const readable = (fetched: readonly GenericDocument[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields, fields: collectionConfig?.fields });

  // 4. paginate OR take
  let docs;
  let convexPaginationResult: Awaited<ReturnType<typeof findQuery.paginate>> | undefined;
  if (args.paginationOpts) {
    convexPaginationResult = await findQuery.paginate(args.paginationOpts);
    docs = readable(convexPaginationResult.page);
  } else if (args.limit !== undefined && args.limit > 0) {
    docs = readable(await findQuery.take(args.limit));
  } else {
    docs = readable(await findQuery.collect());
  }

  // Draft-pair pagination fix: `docs` is already canonical-row-only (via
  // `draftCanonicalFilter` above); attach each published row's linked
  // draft counterpart now, before populate, so a populated relationship
  // reflects the draft's own field values rather than the stale
  // published ones.
  if (wantsDrafts && collectionConfig?.versions?.drafts === true) {
    docs = await mergeDraftCounterparts({
      ctx: args.ctx,
      collection: args.collection,
      docs,
      access,
      auth: args.auth,
      resource,
      action,
      fields: collectionConfig?.fields,
    });
  }

  // Explicit populate takes precedence over depth (D11).
  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate<TPopulate>(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? (docs as unknown as FindReturn<TCollectionSlug, TPopulate, D>)
      : ((await populateDocs(
          args.ctx,
          docs,
          effectivePopulate,
          wantsDrafts,
          args.config,
          access,
          args.auth,
        )) as unknown as FindReturn<TCollectionSlug, TPopulate, D>);

  if (args.paginationOpts && convexPaginationResult) {
    // The caller's identity, stamped onto every paginated page so the client can tell
    // a page resolved under the IDENTITY IT EXPECTS apart from one that's merely
    // arriving late from a subscription re-evaluating under a DIFFERENT (old or
    // in-flight) identity — see `useVexListQuery.ts`'s auth-transition marker doc
    // comment for the client half of this contract. `_id` (not `id`): `VexApiAuth.user`
    // is a real Convex document by convention.
    const viewerId = (args.auth?.user?._id as string | undefined) ?? null;
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      if (convexPaginationResult.isDone) {
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: finalDocs.length,
          totalDocsCapped: false,
          viewerId,
        };
      }
      // Counts at most `countLimit + 1` rows instead
      // of `.collect()`-ing the whole matching set — the old unbounded
      // count re-scanned every matching row on each list open and failed
      // outright above Convex's ~32k-document transaction scan limit. See
      // `resolveTotalDocsCap` (shared with `search/server.ts`) for why
      // `totalDocsCapped` is decided on the RAW window length, not the
      // readable-filtered length.
      const countLimit = collectionConfig?.admin.view?.state?.countLimit ?? 10000;
      const countQuery = buildQuery({
        ...args,
        order: resolvedOrder,
        resolvedIndex,
        filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter, draftCanonicalFilter] }),
      }); // Same filters as main query
      const { totalDocs, totalDocsCapped } = await resolveTotalDocsCap({ countQuery, countLimit, readable });
      return {
        ...convexPaginationResult,
        page: finalDocs,
        totalDocs,
        totalDocsCapped,
        viewerId,
      };
    }

    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs,
      viewerId,
    };
  }

  return finalDocs;
}

function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  props: FindServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    resolvedIndex?: ConvexQueryIndex;
    filter?: ConvexQueryFilterFn;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = props.ctx.db.query(props.collection);

  // 1. withIndex — narrows the scan (most efficient).
  if (props.resolvedIndex) {
    // @ts-expect-error building query piece by piece from query args
    q = props.resolvedIndex.range
      ? q.withIndex(props.resolvedIndex.name, props.resolvedIndex.range)
      : q.withIndex(props.resolvedIndex.name);
  }
  // 2. order — applied after index selection.
  // @ts-expect-error building query piece by piece from query args
  if (props.order) q = q.order(props.order);
  // 3. filter — access constraint and caller `where`, already and-ed by `andConvexQueryFilters`.
  if (props.filter) q = q.filter(props.filter);

  return q;
}
