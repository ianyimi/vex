import type { GenericDataModel, GenericDocument, NamedTableInfo, QueryInitializer } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
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
  resolveQueryConstraint,
  resolveQueryIndex,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
import { pickConvexQueryIndex } from "../../../access/pickConvexQueryIndex";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "../../../access/convexTypes";
import type { ConstraintResult } from "../../../access/queryConstraintTypes";
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  withIndexToConvexQueryIndex,
  type VexWhere,
  type VexWithIndex,
} from "../../../db/queryArgs";
import { readableDocuments } from "../../../db/documents";
import { resolveReadCall } from "../../../access/resolveReadCall";
import { composeStatusQueryConstraint } from "../../../versions";

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
 * When `includeTotalCount=true`, runs `.collect()` on the first page to count all
 * matching documents. Returns `null` if count exceeds 32k documents.
 *
 * @param args - Find arguments including filters, sort, pagination, and count options
 * @returns Array of documents or PaginationResult with optional totalCount
 *
 * @example
 * ```ts
 * // Without pagination
 * const docs = await find({ ctx, collection: "posts" });
 *
 * // With pagination
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false }
 *
 * // With pagination and count (first page only)
 * const result = await find({
 *   ctx,
 *   collection: "posts",
 *   paginationOpts: { numItems: 100, cursor: null },
 *   includeTotalCount: true,
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalCount: 1523 }
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
  const accessIndex = resolveQueryIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  const callerIndex = withIndexToConvexQueryIndex({
    withIndex: args.withIndex as { name: string; range?: (q: never) => ConstraintResult } | undefined,
  });
  const callerFilter = whereToConvexQueryFilter({
    where: args.where as VexWhere<string> | undefined,
    fields: whereFieldNames({ config: args.config, collection: args.collection }),
  });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && args.where !== undefined
      ? referencedWhereFields({ where: args.where as VexWhere<string> }).filter((field) => !SYSTEM_FIELD_KEYS.has(field))
      : [];
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
  // OWN `draftStatus` declaration (Step 13 D2–D4, `versions/statusQueryConstraint.ts`)
  // — a `drafts: true` read against a `draftStatus: true`-only index drops the
  // range and re-applies it as a filter, so no access inputs are needed here.
  const { resolvedIndex, accessFilter } = composeStatusQueryConstraint({
    config: args.config,
    collection: args.collection,
    drafts: wantsDrafts,
    resolvedIndex: rbacResolvedIndex,
    accessFilter: rbacFilter,
  });

  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
    ...args,
    resolvedIndex,
    filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
  });

  const readable = (fetched: readonly GenericDocument[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields });

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
        )) as unknown as FindReturn<TCollectionSlug, TPopulate, D>);

  if (args.paginationOpts && convexPaginationResult) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        if (convexPaginationResult.isDone) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: finalDocs.length,
          };
        } else {
          // Build same query (with filters) but collect all to count
          const countQuery = buildQuery({
            ...args,
            resolvedIndex,
            filter: andConvexQueryFilters({ filters: [accessFilter, callerFilter] }),
          }); // Same filters as main query
          const totalDocs = readable(await countQuery.collect());
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: totalDocs.length,
          };
        }
      } catch (error) {
        // .collect() failed (>32k docs or other limit)
        console.warn("Failed to collect all documents:", error);
        return {
          ...convexPaginationResult,
          page: finalDocs,
          totalDocs: null, // Signals "too large to count"
        };
      }
    }

    // Return Convex pagination result directly with populated docs
    return {
      ...convexPaginationResult,
      page: finalDocs,
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
