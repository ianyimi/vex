import { whereToNode } from "../../db/queryArgs";
import type { VexWhere, VexWhereNode } from "../../db/queryArgs";
import type { MediaCollectionConfig } from "../../media";
import type { CollectionSlug } from "../../types/generated";
import type { VexFindPaginatedArgs, VexSearchArgs } from "../api/types";
import type { CollectionConfig, CollectionTableSort } from "../types";

/**
 * Resolves a `where` prop — a builder callback or an already-plain node — to the plain
 * node Convex accepts. Every server caller of this module already passes a plain node
 * (`resolveListViewQueryState`'s output); only a client caller of `useVexListQuery` may still
 * pass a builder callback directly.
 *
 * @param where - A plain `VexWhereNode`, a builder callback, or `undefined`.
 * @returns `undefined` when `where` is `undefined`; otherwise the plain node,
 *   calling `whereToNode` first when `where` is a builder callback.
 */
function resolveWhere<TFieldSlug extends string>(
  where: VexWhere<TFieldSlug> | undefined,
): VexWhereNode<string> | undefined {
  if (where === undefined) return undefined;
  return (typeof where === "function" ? whereToNode<TFieldSlug>(where) : where) as VexWhereNode<string>;
}

/** Props shared by {@link buildListViewFindQueryArgs} and {@link buildListViewSearchQueryArgs}. */
interface BuildListViewQueryArgsBaseProps<TFieldSlug extends string = string> {
  /** The resolved collection (or media collection) config — same object `useVexListQuery` and `NextAdminPage` both already hold. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Predicate over the collection's fields: a builder callback or an already-plain node. */
  where?: VexWhere<TFieldSlug>;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Documents to fetch this round-trip — already `Math.max(collection.admin.view.state.serverPageSize,
   * pageSize)` (Step 8's "the server batch always covers at least one client page" rule).
   * That `Math.max` stays at each CALLER's own site, beside the `pageSize`/`size` value it
   * reads, rather than moving in here — `useVexListQuery` and `NextAdminPage` read
   * `pageSize` from two different places (a hook prop vs. `resolveListViewQueryState`'s
   * output), so there is no single shared `pageSize` input to compute it from.
   */
  numItems: number;
  /** Load More's cursor. `undefined`/omitted means the first page — every server prefetch reads one. */
  cursor?: string | null;
}

/** Props for {@link buildListViewFindQueryArgs}. */
export interface BuildListViewFindQueryArgsProps<TFieldSlug extends string = string>
  extends BuildListViewQueryArgsBaseProps<TFieldSlug> {
  /** Portable sort (Design Decision 5). Parked while searching (Design Decision 7) — {@link buildListViewSearchQueryArgs} has no `sort` param at all. */
  sort?: CollectionTableSort<TFieldSlug>;
  /** Relationship auto-populate depth. */
  depth?: number;
}

/**
 * Builds the exact `findPaginated` Convex args for one list page — shared by
 * `useVexListQuery`'s find-mode branch (client, Step 8) and `NextAdminPage`'s prerender
 * (server, Design Decision 39), so the two can't drift.
 *
 * @param props - Input props.
 * @returns The args, ready for `convexQuery(vexConvexApi.findPaginated, …)` or
 *   `fetchQuery(vexConvexApi.findPaginated, …)`.
 */
export function buildListViewFindQueryArgs<TFieldSlug extends string = string>(
  props: BuildListViewFindQueryArgsProps<TFieldSlug>,
): VexFindPaginatedArgs & { sort?: CollectionTableSort<string> } {
  return {
    collection: props.collection.slug as CollectionSlug,
    where: resolveWhere(props.where),
    sort: props.sort as CollectionTableSort<string> | undefined,
    drafts: props.drafts,
    depth: props.depth,
    paginationOpts: { numItems: props.numItems, totalDocs: true, cursor: props.cursor ?? null },
  };
}

/** Props for {@link buildListViewSearchQueryArgs}. */
export interface BuildListViewSearchQueryArgsProps<TFieldSlug extends string = string>
  extends BuildListViewQueryArgsBaseProps<TFieldSlug> {
  /** Raw search text. Never empty — the caller branches to {@link buildListViewFindQueryArgs} instead when it is. */
  search: string;
  /** Which `admin.view.state.searchFields` entry `search` queries — `validateSavedListViewConfig` (Design Decision 3) guarantees it has a declared `searchIndex`. */
  searchField: TFieldSlug;
}

/**
 * Builds the exact `search` Convex args for one list page — shared by `useVexListQuery`'s
 * search-mode branch (client, Step 8) and `NextAdminPage`'s prerender (server, Design
 * Decision 39). `sort` is never part of this call (Design Decision 7) — search results
 * are relevance-ordered.
 *
 * @throws {Error} When `searchField` names a field with no declared `searchIndex` —
 *   `validateSavedListViewConfig` (Design Decision 3) already prevents this at config time, so
 *   reaching it here means a caller bug, not a config gap.
 * @param props - Input props.
 * @returns The args, ready for `convexQuery(vexConvexApi.search, …)` or
 *   `fetchQuery(vexConvexApi.search, …)`.
 */
export function buildListViewSearchQueryArgs<TFieldSlug extends string = string>(
  props: BuildListViewSearchQueryArgsProps<TFieldSlug>,
): VexSearchArgs {
  const field = (props.collection.fields as Record<string, { searchIndex?: { name: string } } | undefined>)[
    props.searchField as string
  ];
  if (field === undefined || field.searchIndex === undefined) {
    throw new Error(`buildListViewSearchQueryArgs: field "${String(props.searchField)}" has no declared searchIndex`);
  }
  return {
    collection: props.collection.slug,
    searchIndexName: field.searchIndex.name,
    searchField: props.searchField as string,
    query: props.search,
    where: resolveWhere(props.where),
    drafts: props.drafts,
    paginationOpts: { numItems: props.numItems, cursor: props.cursor ?? null },
  };
}
