import type {
  DocumentByInfo,
  GenericDataModel,
  NamedTableInfo,
  QueryInitializer,
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
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  resolveQueryConstraint,
  SYSTEM_FIELD_KEYS,
} from "../../access";
import type { ConvexQueryFilterFn } from "../../access/convexTypes";
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  type VexWhere,
} from "../queryArgs";
import { readableDocuments, resolveAccessCall } from "../utils";
import { requiresPublishedOnly, VERSION_STATUSES } from "../../versions";

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
  /**
   * Maximum number of results, applied as the terminal `.take(n)`. Omit it, or
   * pass `0`, to return every match (`.collect()`). Ignored when
   * `paginationOpts` is set.
   */
  limit?: number;
  /**
   * Pagination options. When provided, the function returns a `PaginationResult`
   * with `{ page, continueCursor, isDone }` instead of a plain array.
   *
   * Uses Convex's native `.paginate(opts)` API under the hood.
   */
  paginationOpts?: PaginationOptions;
  /**
   * Predicate over the collection's fields, applied to the search results.
   * Same builder as `find`'s `where`.
   *
   * @example
   * ```ts
   * search({ ctx, collection: "posts", query: "hello", searchIndexName: "search_title", searchField: "title", where: (q) => q.eq("published", true) })
   * search({ ctx, collection: "posts", query: "hello", searchIndexName: "search_title", searchField: "title", where: { field: "published", op: "eq", value: true } })
   * ```
   */
  where?: VexWhere<TCollectionSlug>;
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
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
    defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
    resource: args.collection,
  });
  const rbacFilter = resolveQueryConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource,
    action,
  });
  let accessFilter: ConvexQueryFilterFn | undefined = rbacFilter;
  if (
    requiresPublishedOnly({
      config: args.config,
      collection: args.collection,
      drafts: args.drafts,
    })
  ) {
    const statusFilter: ConvexQueryFilterFn = (q) =>
      q.eq(q.field("vex_status"), VERSION_STATUSES.published.key);
    accessFilter = rbacFilter ? (q) => q.and(rbacFilter(q), statusFilter(q)) : statusFilter;
  }
  const filter = andConvexQueryFilters({
    filters: [
      accessFilter,
      whereToConvexQueryFilter({
        where: args.where as VexWhere<string> | undefined,
        fields: whereFieldNames({ config: args.config, collection: args.collection }),
      }),
    ],
  });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const whereFields =
    access !== undefined && args.where !== undefined
      ? referencedWhereFields({ where: args.where as VexWhere<string> }).filter((field) => !SYSTEM_FIELD_KEYS.has(field))
      : [];
  const searchQuery = buildQuery({
    ...args,
    filter,
  });

  const readable = (fetched: readonly DocumentByInfo<NamedTableInfo<DataModel, string>>[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields });

  let docs: DocumentByInfo<NamedTableInfo<DataModel, string>>[];
  let convexPaginationResult: Awaited<ReturnType<typeof searchQuery.paginate>> | undefined;
  if (args.paginationOpts) {
    convexPaginationResult = await searchQuery.paginate(args.paginationOpts);
    docs = readable(convexPaginationResult.page);
  } else if (args.limit !== undefined && args.limit > 0) {
    docs = readable(await searchQuery.take(args.limit));
  } else {
    docs = readable(await searchQuery.collect());
  }

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate<TPopulate>(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? (docs as DocReturnItem<TCollectionSlug, TPopulate, D>[])
      : ((await populateDocs(args.ctx, docs, effectivePopulate, args.drafts)) as DocReturnItem<
          TCollectionSlug,
          TPopulate,
          D
        >[]);

  if (args.paginationOpts) {
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor) {
      try {
        // Build same search query but collect all to count
        const countQuery = buildQuery({ ...args, filter }); // Same search params
        const allDocs = readable(await countQuery.collect());

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
  args: Omit<SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>, "where"> & {
    filter?: ConvexQueryFilterFn;
  },
): QueryInitializer<NamedTableInfo<DataModel, TCollectionSlug>> {
  let q = args.ctx.db.query(args.collection);
  if (args.query) {
    // @ts-expect-error building query piece by piece from query args
    q = q.withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query));
  }
  if (args.filter) q = q.filter(args.filter);
  return q;
}
