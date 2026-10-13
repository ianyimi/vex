import type {
  ExpressionOrValue,
  FilterBuilder,
  GenericDataModel,
  IndexNames,
  IndexRange,
  IndexRangeBuilder,
  NamedIndex,
  NamedTableInfo,
  TableNamesInDataModel,
  QueryInitializer,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryServerParams,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
} from "../types";
import {
  AccessFilterFn,
  hasPermission,
  type IndexRangeFn,
  pickQueryIndex,
  type QueryIndex,
  resolveAccessConstraint,
  resolveAccessIndex,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../access";
import { resolveReadCall } from "../utils";
import { composeStatusConstraint } from "../../versions";

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
   * Maximum number of documents to return. Defaults to 100.
   * Applied as the terminal `.take(n)` on the Convex query.
   */
  limit?: number;

  /**
   * Result ordering. Equivalent to `.order("asc" | "desc")` on the Convex
   * query. Defaults to `"asc"` (insertion order).
   */
  order?: "asc" | "desc";

  /**
   * Filter predicate applied after index narrowing. Equivalent to
   * `.filter(q => q.eq(q.field("published"), true))` on the Convex query.
   *
   * Prefer `withIndex` for performance — `filter` scans every document
   * in the range and is O(n). Use `filter` for secondary conditions that
   * can't be expressed as index equality ranges.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", filter: q => q.eq(q.field("published"), true) })
   * ```
   */
  filter?: (
    q: FilterBuilder<
      NamedTableInfo<
        DataModel,
        TCollectionSlug extends TableNamesInDataModel<DataModel> ? TCollectionSlug : never
      >
    >,
  ) => ExpressionOrValue<boolean>;

  /**
   * Index to use for the query, with an optional equality/range constraint.
   * Equivalent to `.withIndex(name, range?)` on the Convex query.
   *
   * Using an index is strongly preferred over `filter` for performance.
   *
   * @example
   * ```ts
   * find({ ctx, collection: "posts", withIndex: { name: "by_slug", range: q => q.eq("slug", "hello") } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_score", range: q => q.gte("score", 50) } })
   * find({ ctx, collection: "posts", withIndex: { name: "by_publishedAt" } })
   * ```
   */
  withIndex?: TCollectionSlug extends TableNamesInDataModel<DataModel>
    ? {
        name: IndexNames<NamedTableInfo<DataModel, TCollectionSlug>>;
        range?: (
          q: IndexRangeBuilder<
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            any,
            NamedIndex<
              NamedTableInfo<DataModel, TCollectionSlug>,
              IndexNames<NamedTableInfo<DataModel, TCollectionSlug>>
            >
          >,
        ) => IndexRange;
      }
    : never;

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
  const accessIndex = resolveAccessIndex({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  // `FindServerArgs.withIndex` is a conditional type over `TCollectionSlug`, still an
  // unresolved type parameter here — TypeScript cannot reduce it, so it stays opaque.
  // The runtime shape is exactly `{ name, range? }`, already checked against the
  // collection at the public call site.
  const callerIndex = args.withIndex as { name: string; range?: IndexRangeFn } | undefined;
  const rbacResolvedIndex = pickQueryIndex({ accessIndex, callerIndex });
  const rbacFilter = resolveAccessConstraint({
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
  // OWN `draftStatus` declaration (Step 13 D2–D4, `versions/statusConstraint.ts`)
  // — a `drafts: true` read against a `draftStatus: true`-only index drops the
  // range and re-applies it as a filter, so no access inputs are needed here.
  const { resolvedIndex, accessFilter } = composeStatusConstraint({
    config: args.config,
    collection: args.collection,
    drafts: wantsDrafts,
    resolvedIndex: rbacResolvedIndex,
    accessFilter: rbacFilter,
  });

  const findQuery = buildQuery<DataModel, TCollectionSlug, TPopulate, D>({
    ...args,
    resolvedIndex,
    accessFilter,
  });

  // 4. paginate OR take
  let docs;
  let convexPaginationResult: Awaited<ReturnType<typeof findQuery.paginate>> | undefined;
  if (args.paginationOpts) {
    convexPaginationResult = await findQuery.paginate(args.paginationOpts);
    docs = convexPaginationResult.page.filter((d) =>
      hasPermission({
        access,
        resource,
        action,
        data: d,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
      }),
    );
  } else if (args.limit) {
    docs = (await findQuery.take(args.limit)).filter((d) =>
      hasPermission({
        access,
        resource,
        action,
        data: d,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
      }),
    );
  } else {
    docs = (await findQuery.collect()).filter((d) =>
      hasPermission({
        access,
        resource,
        action,
        data: d,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
      }),
    );
  }

  docs = docs.map((d) =>
    stripDeniedFields(
      d,
      resolveFieldPermissions({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    ),
  );

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
            accessFilter,
          }); // Same filters as main query
          const totalDocs = (await countQuery.collect()).filter((d) =>
            hasPermission({
              access,
              resource,
              action,
              data: d,
              user: args.auth?.user ?? null,
              organization: args.auth?.organization,
            }),
          );
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
    resolvedIndex?: QueryIndex;
    accessFilter?: AccessFilterFn;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  const tableName = props.collection;
  let q = props.ctx.db.query(tableName);

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
  // 3. filter — secondary predicate, full range scan.
  if (props.accessFilter && props.filter) {
    q = q.filter((filterQ) => filterQ.and(props.accessFilter!(filterQ), props.filter!(filterQ)));
  } else if (props.accessFilter) {
    q = q.filter(props.accessFilter);
  } else if (props.filter) {
    q = q.filter(props.filter);
  }

  return q;
}
