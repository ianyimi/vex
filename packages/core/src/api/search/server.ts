import type {
  DocumentByInfo,
  ExpressionOrValue,
  FilterBuilder,
  GenericDataModel,
  NamedTableInfo,
  QueryInitializer,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DocReturnItem,
  GenericQueryServerParams,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
  SearchReturn,
  SearchReturnPaginated,
} from "../types";
import { AccessFilterFn, CRUD_ACTIONS, hasPermission, resolveAccessConstraint } from "../../access";
import { resolveAccessCall } from "../utils";

/**
 * Server-side args for `search`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The collection to search — must match a registered collection slug. */
  collection: TCollectionSlug;
  /** The search text. Pass `""` to list recent documents (falls back to `.take()`). */
  query: string;
  /** The `.searchIndex()` name declared in the Convex schema (e.g. `"search_name"`). */
  searchIndexName: string;
  /** The field the search index is built on. Must match `searchField` in the index declaration. */
  searchField: string;
  /** Maximum number of results. Defaults to 20. */
  limit?: number;
  /**
   * Pagination options. When provided, the function returns a `PaginationResult`
   * with `{ page, continueCursor, isDone }` instead of a plain array.
   *
   * Uses Convex's native `.paginate(opts)` API under the hood.
   */
  paginationOpts?: PaginationOptions;
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
}

// Overload 1: WITHOUT paginationOpts → returns array (most common case)
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts?: never;
  },
  // Inlined rather than `SearchReturn<…>` so hover resolves to `Doc[]` — see the
  // display/assignability note in `../types`.
): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;

// Overload 2: WITH paginationOpts → returns PaginationResult
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    paginationOpts: PaginationOptions;
  },
): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;

/**
 * Search documents in a collection with optional pagination and total count.
 *
 * When `includeTotalCount=true`, runs `.collect()` on the first page to count all
 * matching search results. Returns `null` if count exceeds 32k documents.
 *
 * @param args - Search arguments including query, filters, pagination, and count options
 * @returns Array of documents or PaginationResult with optional totalCount
 *
 * @example
 * ```ts
 * // With pagination and count (first page only)
 * const result = await search({
 *   ctx,
 *   collection: "posts",
 *   query: "react hooks",
 *   searchIndexName: "search_posts",
 *   searchField: "title",
 *   paginationOpts: { numItems: 100, cursor: null },
 *   includeTotalCount: true,
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalCount: 42 }
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<
  SearchReturn<TCollectionSlug, TPopulate, D> | SearchReturnPaginated<TCollectionSlug, TPopulate, D>
> {
  const { access, action, resource } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: args.collection,
  });
  const accessFilter = resolveAccessConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  const searchQuery = buildQuery({
    ...args,
    accessFilter,
  });

  let docs: DocumentByInfo<NamedTableInfo<DataModel, string>>[];
  let convexPaginationResult: Awaited<ReturnType<typeof searchQuery.paginate>> | undefined;
  if (args.paginationOpts) {
    convexPaginationResult = await searchQuery.paginate(args.paginationOpts);
    docs = convexPaginationResult.page.filter((d) =>
      hasPermission({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    );
  } else if (args.limit) {
    docs = (await searchQuery.take(args.limit)).filter((d) =>
      hasPermission({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    );
  } else {
    docs = (await searchQuery.collect()).filter((d) =>
      hasPermission({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    );
  }

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate<TPopulate>(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? (docs as DocReturnItem<TCollectionSlug, TPopulate, D>[])
      : ((await populateDocs(args.ctx, docs, effectivePopulate)) as DocReturnItem<
          TCollectionSlug,
          TPopulate,
          D
        >[]);

  if (args.paginationOpts) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        // Build same search query but collect all to count
        const countQuery = buildQuery(args); // Same search params
        const allDocs = (await countQuery.collect()).filter((d) =>
          hasPermission({
            access,
            user: args.auth?.user ?? null,
            organization: args.auth?.organization,
            resource,
            action,
            data: d,
          }),
        );

        if (convexPaginationResult) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: allDocs.length,
          };
        }
      } catch (error) {
        console.warn("Failed to count search results:", error);
        if (convexPaginationResult) {
          return {
            ...convexPaginationResult,
            page: finalDocs,
            totalDocs: null,
          };
        }
      }
    }

    if (convexPaginationResult) {
      // Return Convex pagination result directly with populated docs
      return {
        ...convexPaginationResult,
        page: finalDocs as DocReturnItem<TCollectionSlug, TPopulate, D>[],
      };
    }
  }

  return finalDocs as DocReturnItem<TCollectionSlug, TPopulate, D>[];
}

function buildQuery<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D> & {
    accessFilter?: AccessFilterFn;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = args.ctx.db.query(args.collection);
  if (args.query) {
    // @ts-expect-error building query piece by piece from query args
    q = q.withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query));
  }
  if (args.accessFilter && args.filter) {
    q = q.filter((fq) => fq.and(args.accessFilter!(fq), args.filter!(fq)));
  } else if (args.accessFilter) {
    q = q.filter(args.accessFilter);
  } else if (args.filter) {
    q = q.filter(args.filter);
  }
  return q;
}
