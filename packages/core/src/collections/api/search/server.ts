import type {
  DocumentByInfo,
  GenericDataModel,
  NamedTableInfo,
  QueryInitializer,
} from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type {
  DocReturnItem,
  GenericQueryServerParams,
  SearchReturn,
  SearchReturnPaginated,
} from "../types";
import type {
  PaginationOptions,
  PaginationResult,
  PopulateShape,
} from "../../../db/types";
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  isFieldAllowed,
  PERMISSION_SCOPES,
  resolveFieldPermissions,
  resolveQueryConstraint,
  VexAccessError,
} from "../../../access";
import type { ConvexQueryFilterFn } from "../../../access/convexTypes";
import {
  andConvexQueryFilters,
  convertCommitTsWhereToNs,
  normalizeArrayStoredWhere,
  whereFieldNames,
  whereToConvexQueryFilter,
  type VexWhere,
  type VexWhereNode,
} from "../../../db/queryArgs";
import { readableDocuments } from "../../../db/documents";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { canonicalRowFilter, requiresPublishedOnly, VERSION_STATUSES } from "../../../versions";
import { resolveWhereFields } from "../../query/resolveWhereFields";
import { mergeDraftCounterparts } from "../../query/mergeDraftCounterparts";
import { resolveTotalDocsCap } from "../../query/resolveTotalDocsCap";
import { VexError } from "../../../errors";

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
  /**
   * The field the search index is built on. Must match `searchField` in the
   * index declaration. When `config` is supplied, validated against the
   * collection's `admin.view.state.searchFields` allow-list — a field outside it
   * throws a `VexError` naming the field and the declared list — and
   * against the caller's field-read access, which throws a
   * `VexAccessError`: search hits on a field the caller cannot read
   * would leak its values just as much as a sortable column would.
   */
  searchField: string;

  /**
   * Always absent on `search` — typed `never` so a caller building args
   * from shared `{ sort, search, searchField }` state gets a compile error
   * if it forwards `sort` here. `search` also throws a `VexError` at
   * runtime if one arrives anyway (search results are relevance-ordered,
   * so sort and search are mutually exclusive). Clear `sort` before
   * searching, or clear the search query to sort — `find`'s `sort` is the
   * only route to a sorted read.
   */
  sort?: never;
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
 * Pass `paginationOpts: { ..., totalDocs: true }` to also count matching
 * search results on the first page (`cursor: null`) only — same
 * `take(countLimit + 1)` cap and `totalDocs`/`totalDocsCapped` contract as
 * `find`; see its own JSDoc for the full explanation.
 *
 * @param args - Search arguments including query, filters, pagination, and count options
 * @returns Array of documents, or a `PaginationResult` (`{ page,
 *   continueCursor, isDone }`, plus `totalDocs`/`totalDocsCapped` when the
 *   first page requested a count) when `paginationOpts` is given
 *
 * @example
 * ```ts
 * // With pagination and a first-page count
 * const result = await search({
 *   ctx,
 *   collection: "posts",
 *   query: "react hooks",
 *   searchIndexName: "search_posts",
 *   searchField: "title",
 *   paginationOpts: { numItems: 100, cursor: null, totalDocs: true },
 * });
 * // result: { page: [...], continueCursor: "...", isDone: false, totalDocs: 42, totalDocsCapped: false }
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
  const rawSort = (args as { sort?: unknown }).sort;
  if (rawSort !== undefined) {
    throw new VexError({
      code: "SORT_WHILE_SEARCHING",
      collection: args.collection,
      message: `search: collection "${args.collection}" was called with "sort" while searching. Search results are relevance-ordered — clear "sort" to search, or clear the search query to sort.`,
    });
  }
  const collectionConfig = args.config?.collections.find((c) => c.slug === args.collection);
  const where = normalizeArrayStoredWhere({
    where: convertCommitTsWhereToNs({
      where: args.where as VexWhereNode<string> | undefined,
      fields: collectionConfig?.fields ?? {},
    }),
    fields: collectionConfig?.fields ?? {},
  });
  // `admin.view.state.searchFields` is ALWAYS an array on a REAL
  // `defineCollection()`-resolved config (`[]` when the project declares
  // none, not `undefined` the way the deleted `admin.table.searchField`
  // was) — `?.` on `view`/`state` too since a hand-rolled test fixture
  // (`as unknown as VexConfig`) may not resolve them at all, in which
  // case the check is skipped entirely (permissive, matching every other
  // `?.`-guarded test-fixture fallback in this file). A REAL, resolved
  // empty array is different: `admin.view.searchFields: []` means "no
  // search fields declared" — the search bar itself is hidden
  // client-side, and the server rejects every `searchField` here too (an
  // empty array never `.includes()` anything), not just the fields the
  // UI happens to not render for.
  const searchFieldAllowList = collectionConfig?.admin.view?.state?.searchFields;
  if (searchFieldAllowList !== undefined && !searchFieldAllowList.includes(args.searchField)) {
    throw new VexError({
      code: "SEARCH_FIELD_NOT_ALLOWED",
      collection: args.collection,
      searchField: args.searchField,
      message:
        searchFieldAllowList.length === 0
          ? `search: collection "${args.collection}" declares no admin.view.state.searchFields — search is disabled for this collection.`
          : `search: collection "${args.collection}" was called with searchField "${args.searchField}", which is not declared in admin.view.state.searchFields (${searchFieldAllowList.join(", ")}).`,
    });
  }

  const { access, action, resource } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: args.drafts === true ? DRAFT_ACTIONS.readDrafts : CRUD_ACTIONS.read,
    resource: args.collection,
  });
  // A caller who may read SOME documents of this collection but not THIS
  // field gets a hard reject. A caller denied the whole `read` action (a
  // flat `false`/predicate, `scope: "any"` false) is unaffected here —
  // that denial is enforced as always, downstream, by
  // `resolveQueryConstraint` / `readableDocuments`, which filter to an
  // empty result rather than throw; throwing here too would turn every
  // deny-all search into an error instead of the established empty read.
  if (
    access !== undefined &&
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    })
  ) {
    const searchFieldPermissions = resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    });
    if (!isFieldAllowed(searchFieldPermissions, args.searchField)) {
      throw new VexAccessError({
        resource,
        action,
        field: args.searchField,
        message: `search: collection "${args.collection}" was called with searchField "${args.searchField}", which the caller cannot read.`,
      });
    }
  }
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
  // Draft-pair pagination fix: when this read effectively gets drafts on a
  // versioned collection, narrow the query to "canonical" rows — one per
  // logical document — instead of returning a linked draft row as its own
  // separate row for the client to pair up (`mergeDraftCounterparts`
  // attaches each linked draft's fields back on per page, below).
  const draftCanonicalFilter = canonicalRowFilter({
    config: args.config,
    collection: args.collection,
    drafts: args.drafts,
  });
  const filter = andConvexQueryFilters({
    filters: [
      accessFilter,
      whereToConvexQueryFilter({
        where: where as VexWhere<string> | undefined,
        fields: whereFieldNames({ config: args.config, collection: args.collection }),
      }),
      draftCanonicalFilter,
    ],
  });
  // A request `where` part that deep-equals a config view's own `where` is
  // trusted server config, exempt from the field-read check below, with
  // a lazy fall back to a readable shared view's own declared filter —
  // see `resolveWhereFields` for the pipeline, shared with
  // `find/server.ts`.
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
  const searchQuery = buildQuery({
    ...args,
    filter,
  });

  const readable = (fetched: readonly DocumentByInfo<NamedTableInfo<DataModel, string>>[]) =>
    readableDocuments({ docs: fetched, access, auth: args.auth, resource, action, whereFields, fields: collectionConfig?.fields });

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

  // Draft-pair pagination fix: `docs` is already canonical-row-only (via
  // `draftCanonicalFilter` above); attach each published row's linked
  // draft counterpart now, before populate, so a populated relationship
  // reflects the draft's own field values rather than the stale
  // published ones.
  if (args.drafts === true && collectionConfig?.versions?.drafts === true) {
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

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate<TPopulate>(args.config, args.collection, args.depth)
      : undefined);

  const finalDocs =
    !effectivePopulate || Object.keys(effectivePopulate).length === 0
      ? (docs as DocReturnItem<TCollectionSlug, TPopulate, D>[])
      : ((await populateDocs(
          args.ctx,
          docs,
          effectivePopulate,
          args.drafts,
          args.config,
        )) as DocReturnItem<TCollectionSlug, TPopulate, D>[]);

  if (args.paginationOpts) {
    // See `find/server.ts`'s identical `viewerId` doc comment.
    const viewerId = (args.auth?.user?._id as string | undefined) ?? null;
    if (args.paginationOpts.totalDocs && !args.paginationOpts.cursor && convexPaginationResult) {
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
      // of `.collect()`-ing the whole matching set — see `resolveTotalDocsCap`
      // (shared with `find/server.ts`) for why `totalDocsCapped` is
      // decided on the RAW window length, not the readable-filtered
      // length. Clamped to 1023: a Convex search query returns at most 1024
      // results, so a higher cap could never be exceeded and the "+" would
      // silently never show.
      const countLimit = Math.min(collectionConfig?.admin.view?.state?.countLimit ?? 10000, 1023);
      const countQuery = buildQuery({ ...args, filter }); // Same search params
      const { totalDocs, totalDocsCapped } = await resolveTotalDocsCap({ countQuery, countLimit, readable });
      return {
        ...convexPaginationResult,
        page: finalDocs,
        totalDocs,
        totalDocsCapped,
        viewerId,
      };
    }

    if (convexPaginationResult) {
      // Return Convex pagination result directly with populated docs
      return {
        ...convexPaginationResult,
        page: finalDocs as DocReturnItem<TCollectionSlug, TPopulate, D>[],
        viewerId,
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
