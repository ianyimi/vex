"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { buildListViewFindQueryArgs, buildListViewSearchQueryArgs, vexConvexApi } from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionSlug,
  CollectionTableSort,
  MediaCollectionConfig,
  PaginationResult,
  VexDocument,
  VexWhere,
} from "@vexcms/core";
import type { FindClientPaginatedArgs } from "../client";
import { whereArg } from "../collections/api/whereArg";
import { usePaginatedQuery } from "./usePaginatedQuery";
import type { UsePaginatedQueryReturn } from "./usePaginatedQuery";

/**
 * Props for {@link useVexListQuery}.
 *
 * `collection` takes the resolved config object, not a bare slug — the same
 * shape `usePaginatedSearch` already accepts — so this hook can read
 * `admin.view.state.serverPageSize` without a second lookup, and works for both a
 * `CollectionConfig` and a `MediaCollectionConfig` without a `TCollectionSlug`
 * generic (those are two separate slug unions no single type parameter can
 * express without an overload pair this hook doesn't need).
 *
 * There is no `view` prop: `find`/`search` take no view argument (Design
 * Decision 25/26). A caller that needs a config view's hidden filter
 * composes it into `where` itself with `composeSavedListViewWhere({ viewWhere,
 * filter })` (Step 5, `@vexcms/core`) before it ever reaches this hook —
 * the hook only ever sees one plain `where`.
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 */
export interface UseVexListQueryProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config, from `useVexConfig()`. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** Predicate over the collection's fields: a builder callback or a plain node. */
  where?: VexWhere<CollectionSlug>;
  /**
   * Portable sort — never an index name (Design Decision 5). Ignored, and
   * never sent, while `search` is a non-empty string (Design Decision 7).
   */
  sort?: CollectionTableSort<string>;
  /**
   * Raw search text. `undefined`/`""` runs `find` + `sort`. A non-empty
   * value switches to a search-mode query against `searchField`'s declared
   * index and parks `sort` — never sent to `search` (Design Decision 7).
   */
  search?: string;
  /**
   * Which `admin.view.state.searchFields` entry `search` queries. Required when
   * `search` is non-empty — the caller (Step 10's search picker) always
   * supplies one, and `validateSavedListViewConfig` (Design Decision 3) guarantees
   * that entry has a declared `searchIndex`.
   */
  searchField?: string;
  /** Include draft versions of versioned documents. */
  drafts?: boolean;
  /**
   * Documents revealed per Load More click / page-size select — independent
   * of the server's larger fetch batch. Changing this prop, `where`, `sort`,
   * or `search` resets the list to the first page (Design Decision 8): a
   * `where`/`sort`/`drafts` change clears the accumulated pages, and a
   * `pageSize`-only change re-windows the already-loaded rows to the new
   * size without an extra fetch. Both branches below inherit this from
   * their own render-time query-identity tracking.
   */
  pageSize: number;
  /** Relationship auto-populate depth, forwarded to `find`. */
  depth?: number;
  /** Server-prefetched first page, for SSR hydration. */
  initialData?: PaginationResult<TDocument>;
}

/** Return value of {@link useVexListQuery} — identical shape to `usePaginatedQuery`'s. */
export type UseVexListQueryReturn<TDocument extends VexDocument = VexDocument> =
  UsePaginatedQueryReturn<TDocument>;

/**
 * Lists documents in a collection — the data source every list view reads
 * through (Design Decision 19). Convex is the only implementation; a
 * plugin/adapter/adopted-table source is a later swap of this hook's body,
 * not its callers.
 *
 * The `find`-mode path (no `search`) wraps `usePaginatedQuery`: the server
 * batch size (`collection.admin.view.state.serverPageSize`) always covers at
 * least one client page — `paginationOpts.numItems` is
 * `Math.max(serverPageSize, pageSize)`, while `pageSize` itself becomes
 * `usePaginatedQuery`'s `clientPageSize`. The search-mode path runs the same
 * windowing against `vexConvexApi.search`. Both are called on every render
 * — each disabled via `enabled` while the other is active — so switching
 * between them never violates the Rules of Hooks. Search mode has no
 * `totalDocs`/`totalDocsCapped` — Convex search results carry no count.
 *
 * Each sub-hook has its own WITHIN-mode `keepPreviousData` (a sort/filter/search-text
 * change while staying in the same mode never blanks the table — `usePaginatedQuery`'s
 * own `resetKey` logic, `useVexListQuerySearch`'s own `resetKey` logic, both Decision 46).
 * But `find`/`search` are two SEPARATE hook instances with two separate state machines —
 * the moment a search starts (or is cleared), the dispatcher below switches which one is
 * active, and the NEWLY active one has never run before: it has no previous data of its
 * own for `keepPreviousData` to keep, even though the OTHER (now-disabled) one still has
 * perfectly good rows on screen (developer-reported: the table skeletons/empties for a
 * frame right as a search starts or is cleared). `lastSettledRef` below bridges that gap —
 * it remembers the last settled (non-pending) result regardless of which mode produced it,
 * and the newly-active mode's own rows are shown in its place only once THAT mode has
 * settled too.
 *
 * @typeParam TDocument - The document shape `results` resolves to.
 * @param props - Hook configuration.
 * @returns Pagination state and controls, matching `usePaginatedQuery`'s shape.
 *
 * @example
 * ```tsx
 * const pagination = useVexListQuery({
 *   collection,
 *   where: composeSavedListViewWhere({ viewWhere: activeConfigView?.where, filter }),
 *   drafts: isVersioned,
 *   depth: 1,
 *   pageSize: collection.admin.view.state.pageSize,
 *   initialData: props.initialData,
 * });
 * ```
 */
export function useVexListQuery<TDocument extends VexDocument = VexDocument>(
  props: UseVexListQueryProps<TDocument>,
): UseVexListQueryReturn<TDocument> {
  const isSearching = (props.search?.length ?? 0) > 0;
  const numItems = Math.max(props.collection.admin.view.state.serverPageSize, props.pageSize);

  const findQueryArgs = useMemo(
    () =>
      buildListViewFindQueryArgs({
        collection: props.collection,
        where: props.where as VexWhere<string> | undefined,
        sort: props.sort,
        drafts: props.drafts,
        depth: props.depth,
        numItems,
      }) as FindClientPaginatedArgs,
    // Deps intentionally key on `props.collection.slug`, not `props.collection` — it is not
    // referentially stable across renders (a fresh config object from the caller's own
    // render), but only `.slug` ever feeds the built args — keying on the slug instead of
    // the whole object avoids rebuilding (and re-triggering `usePaginatedQuery`'s own
    // content-based `resetKey`) on every parent re-render where nothing the args actually
    // depend on changed.
    [props.collection.slug, props.where, props.sort, props.drafts, props.depth, numItems],
  );

  const findResult = usePaginatedQuery<TDocument>({
    query: findQueryArgs,
    initialData: props.initialData,
    clientPageSize: props.pageSize,
    enabled: !isSearching,
  });

  const searchResult = useVexListQuerySearch<TDocument>({
    collection: props.collection,
    where: props.where,
    search: props.search ?? "",
    searchField: props.searchField,
    drafts: props.drafts,
    pageSize: props.pageSize,
    numItems,
    initialData: props.initialData,
    enabled: isSearching,
  });

  const active = isSearching ? searchResult : findResult;

  // Mutated during render, not in an effect — this needs to be current for THIS render's
  // own return value below, and a ref write during render (not a state write) is the
  // documented pattern for "remember the last value for next time" bookkeeping that must
  // not itself trigger a re-render. `active.isPending` (not `isFetching`) is the gate: a
  // disabled query keeps its last cached `data` (React Query never clears it just because
  // `enabled` flipped false), so the NON-active mode's own last `isPending` stays `false`
  // throughout — only the NEWLY-active mode reports `isPending: true` on its first-ever
  // fetch, which is exactly the frame this ref exists to paper over.
  const lastSettledRef = useRef<UseVexListQueryReturn<TDocument> | undefined>(undefined);
  if (!active.isPending) {
    lastSettledRef.current = active;
  }
  if (active.isPending && lastSettledRef.current) {
    return {
      ...active,
      results: lastSettledRef.current.results,
      totalDocs: lastSettledRef.current.totalDocs,
      totalDocsCapped: lastSettledRef.current.totalDocsCapped,
      isDone: lastSettledRef.current.isDone,
      isPending: false,
      isPlaceholderData: true,
    };
  }
  return active;
}

/**
 * The search-mode half of {@link useVexListQuery}: cursor-paginates
 * `vexConvexApi.search` against `searchField`'s declared index, windowed to
 * `pageSize` rows per Load More exactly like `usePaginatedQuery`'s own
 * `find`-mode accumulator, so the two branches are interchangeable to
 * {@link useVexListQuery}'s caller. `sort` is never part of this query
 * (Design Decision 7) — search results are relevance-ordered.
 *
 * @throws {Error} When `enabled` is `true` and `searchField` is missing, or
 *   names a field with no declared `searchIndex` — both are config-time
 *   errors `validateTableConfig` (Design Decision 3) already prevents, so
 *   reaching either here means a caller bug, not a config gap.
 * @returns The same shape {@link useVexListQuery} returns: the accumulated
 *   rows across all loaded pages, loading/exhausted status, and a
 *   `loadMore` to fetch the next page.
 */
function useVexListQuerySearch<TDocument extends VexDocument = VexDocument>(props: {
  collection: CollectionConfig | MediaCollectionConfig;
  where?: VexWhere<CollectionSlug>;
  search: string;
  searchField: string | undefined;
  drafts: boolean | undefined;
  pageSize: number;
  numItems: number;
  /** Server-prefetched first page, for SSR hydration of a search-active first load. */
  initialData?: PaginationResult<TDocument>;
  enabled: boolean;
}): UseVexListQueryReturn<TDocument> {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<TDocument[]>(props.initialData?.page ?? []);
  const [isDone, setIsDone] = useState(props.initialData?.isDone ?? false);
  const [clientPageIndex, setClientPageIndex] = useState(0);

  if (props.enabled && props.searchField === undefined) {
    throw new Error("useVexListQuery: `searchField` is required when `search` is non-empty");
  }

  // Cast widens `CollectionSlug` (a union of the consuming app's literal
  // slugs) to `whereArg`'s own generic `S extends string`: TS's
  // contravariant check on the builder-callback form of `VexWhere<S>`
  // doesn't distribute over a union slug type, even though any concrete
  // member of that union is assignable on its own.
  const resolvedWhere = whereArg(props.where as VexWhere<string> | undefined);
  const resetKey = JSON.stringify({
    collection: props.collection.slug,
    where: resolvedWhere,
    search: props.search,
    searchField: props.searchField,
    drafts: props.drafts,
    numItems: props.numItems,
  });
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  // See `usePaginatedQuery.ts`'s identical `settledResetKey` doc comment — same Convex
  // live-push-bypasses-React-Query's-fetch-lifecycle issue, same fix, same `null`-unless-
  // `initialData` starting value (so `isSettling` doesn't trivially read `false` before
  // the very first fetch has even resolved), in this hook's own search-mode state machine.
  const [settledResetKey, setSettledResetKey] = useState<string | null>(
    props.initialData ? resetKey : null,
  );
  const [prevPageSize, setPrevPageSize] = useState(props.pageSize);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPrevPageSize(props.pageSize);
    setCursor(null);
    setClientPageIndex(0);
    // `allResults`/`isDone` are DELIBERATELY left as-is here (no eager
    // clear) — the developer-reported "table empties while the next
    // search is pending" bug: the previous search's (or `find`'s) rows
    // stay on screen, and `placeholderData: keepPreviousData` below keeps
    // `data` as the PREVIOUS query's result while the new one is in
    // flight, so the effect below's `cursor === null` branch keeps
    // re-applying the same old page until genuinely fresh data for this
    // new `resetKey` arrives, at which point it REPLACES `allResults`
    // (first-page semantics, `cursor === null`) rather than appending.
    // `isFetching` (below) is what a caller like `ListViewSearch` reads to
    // show its own in-input spinner in the meantime.
  } else if (props.pageSize !== prevPageSize) {
    setPrevPageSize(props.pageSize);
    setClientPageIndex(0);
  }

  const endIndex = (clientPageIndex + 1) * props.pageSize;
  const visibleResults = allResults.slice(0, endIndex);
  const needsServerFetch = endIndex >= allResults.length && !isDone;
  const clientIsDone = isDone && endIndex >= allResults.length;

  function loadMore() {
    if (clientIsDone) return;
    if (needsServerFetch && result.continueCursor) {
      setCursor(result.continueCursor);
    }
    setClientPageIndex((prev) => prev + 1);
  }

  // `buildListViewSearchQueryArgs` (Step 14) is the ONE place the `search` Convex
  // args get built — shared with `NextAdminPage`'s server prerender, so the
  // two can't drift (layout-stability.md). `undefined` (disabled, or no
  // `searchField` — guarded above) falls through to the `"skip"` sentinel
  // below, not just `enabled: false`: ConvexQueryClient subscribes to every
  // query in the cache, so a disabled-but-built query still hits the server
  // (with an empty `searchField`).
  const searchArgs =
    props.enabled && props.searchField !== undefined
      ? buildListViewSearchQueryArgs({
          collection: props.collection,
          where: resolvedWhere,
          search: props.search,
          searchField: props.searchField,
          drafts: props.drafts,
          numItems: props.numItems,
          cursor,
        })
      : undefined;

  // `placeholderData: keepPreviousData` keeps the PREVIOUS search's `data` visible while a new
  // query key (a new `query`/`searchField`/`where`) is in flight — paired with the reset block
  // above leaving `allResults` untouched on a `resetKey` change, this is what keeps rows on
  // screen instead of flashing empty while the user types.
  const { data, isPending, isFetching, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    ...convexQuery(vexConvexApi.search, (searchArgs ?? "skip") as never),
    ...(cursor === null && props.initialData ? { initialData: props.initialData } : {}),
    enabled: props.enabled,
    placeholderData: keepPreviousData,
  });
  // Tracks the `data` object reference the sync effect below has already processed — see
  // `usePaginatedQuery.ts`'s identical `lastProcessedDataRef` doc comment.
  const lastProcessedDataRef = useRef<typeof data>(undefined);

  const result = useMemo<PaginationResult<TDocument>>(() => {
    const empty = { page: [] as TDocument[], continueCursor: "", isDone: false };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  useEffect(() => {
    // `isPlaceholderData` guards against syncing a STALE page — same fix, same reasoning as
    // `usePaginatedQuery.ts`'s identical effect (Step 19's own find-mode regression fix):
    // with `placeholderData: keepPreviousData` above, `result.page` keeps showing the
    // PREVIOUS query's page for a render or two after `resetKey`/`cursor` changes, until the
    // new query actually resolves. This search-mode twin was missing the same guard —
    // developer-reported: a view switch that changes `search`/`where` right after a Load
    // More click (a `cursor !== null` append still in flight) could append that STALE
    // placeholder page again once the new query resolves, duplicating a row's key
    // (`getRowId: row => row._id`) in `allResults` — a duplicate React key the table then
    // reconciles unpredictably across re-renders (the peeked row's `data-state="highlighted"`
    // landing on whichever of the two colliding fibers React happens to keep), which is
    // exactly the inconsistent "highlighted sometimes, not others" symptom. Waiting for
    // `isPlaceholderData` to clear means this effect only ever syncs genuinely fresh data.
    if (result.page && !isPlaceholderData) {
      if (cursor === null) {
        setAllResults(result.page);
        // See `usePaginatedQuery.ts`'s identical fix/comment — `result.page` is always a
        // truthy array, even the `useMemo` above's own empty `isLoading`/`isError`/`!data`
        // fallback, so this effect fires on the very first render too, before any real
        // fetch completes; `data !== lastProcessedDataRef.current` is the genuine "this is
        // a NEW answer" check that works under both the fake backend's tracked refetch and
        // the real client's live websocket push.
        if (data !== undefined && data !== lastProcessedDataRef.current) {
          lastProcessedDataRef.current = data;
          setSettledResetKey(resetKey);
        }
      } else {
        setAllResults((prev) => [...prev, ...result.page]);
      }
      setIsDone(result.isDone);
    }
  }, [result.page, result.isDone, cursor, resetKey, isLoading, data, isPlaceholderData]);

  const isSettling = resetKey !== settledResetKey;

  return {
    results: visibleResults,
    totalDocs: undefined,
    totalDocsCapped: false,
    isDone: clientIsDone,
    loadMore,
    isPending,
    isFetching,
    isSettling,
    isPlaceholderData,
    error: isError ? error : undefined,
    retry: () => {
      void refetch();
    },
  };
}
