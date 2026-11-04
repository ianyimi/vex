import { useEffect, useRef, useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQueryClient, useSuspenseQuery, type UseSuspenseQueryOptions } from "@tanstack/react-query";
import {
  buildListViewFindQueryArgs,
  buildListViewSearchQueryArgs,
  vexConvexApi,
  type CollectionConfig,
  type CollectionSlug,
  type CollectionTableSort,
  type PaginationResult,
  type TDocument,
  type VexDocument,
  type VexWhere,
} from "@vexcms/core";
import { useVexListQuery, type UseVexListQueryReturn } from "../../../hooks";

/** Props {@link useListViewServerSeed} needs to build and seed its one `useSuspenseQuery` call. */
export interface UseListViewServerSeedProps {
  collection: CollectionConfig;
  drafts: boolean | undefined;
  isSearchActive: boolean;
  where: VexWhere<CollectionSlug> | undefined;
  sort: CollectionTableSort<string> | undefined;
  search: string;
  searchField: string | undefined;
  pageSize: number;
}

/**
 * Seeds `useVexListQuery` (unchanged — still owns pagination/cursor-accumulation/draft-pair
 * typing exactly as before) from a `useSuspenseQuery(convexQuery(...))` call whose query key
 * is built from the EXACT SAME `buildListViewFindQueryArgs`/`buildListViewSearchQueryArgs` helpers
 * `NextAdminPage`'s server-side `prefetchQuery` call uses (keeping the server and client args in parity, now
 * enforced by sharing the args-building code instead of just documenting the match) — the
 * streamed, dehydrated promise `<HydrationBoundary>` populated the cache with is what this
 * `useSuspenseQuery` call actually suspends on, not a fresh client fetch.
 *
 * Frozen to THIS COMPONENT INSTANCE's first render (see the frozen-seed/`activeSeedOptions` comments inside the function body for
 * the full mechanism): re-computing this query's key on every live search/sort/filter change
 * (no `key` prop remounts this component across those) made it re-suspend on each one —
 * `startTransition` (`useListViewUrlState`'s own setters) was relied on to suppress the resulting
 * fallback but does not reliably do so here. `useVexListQuery` below already keeps previous
 * rows on screen through any of those changes on its own (`placeholderData: keepPreviousData`,
 * bridged across a find/search mode switch too) — the seed never needs a second opinion once
 * the very first page has been consumed from it, and its own Convex subscription is released
 * (swapped to a synthetic, non-Convex key holding the same data) once that happens, so it
 * doesn't keep one extra, never-again-read websocket subscription open to the component's
 * FIRST query args for as long as the component stays mounted. This is the ONE
 * `useSuspenseQuery` in the tree (not a `useQuery`/`useSuspenseQuery` pair) — `useVexListQuery`
 * itself stays a plain `useQuery` under the hood (via `usePaginatedQuery`), so Load More and
 * cursor accumulation never re-suspend this boundary; only the SEED does, and it now never
 * re-suspends at all after its first resolve.
 *
 * @param props - Resolved collection/query props from `CollectionListViewData`.
 * @returns The live `useVexListQuery` pagination state, seeded from the resolved SSR promise.
 */
export function useListViewServerSeed<TDoc extends TDocument = TDocument>(
  props: UseListViewServerSeedProps,
): UseVexListQueryReturn<TDoc> {
  const numItems = Math.max(props.collection.admin.view.state.serverPageSize, props.pageSize);

  // Cast matches `NextAdminPage.tsx`'s own `as Promise<PaginationResult<VexDocument>>` on its
  // `search` prefetch (`useVexListQuerySearch`'s own `Array.isArray(data)`
  // normalization) — `vexConvexApi.search`'s broader return type vs `findPaginated`'s narrower
  // one is the same generic-narrowing gap documented elsewhere. No `initialData` option here
  // (`CollectionListViewProps.initialData` is gone): every real
  // caller either goes through `NextAdminPage`'s streamed `HydrationBoundary` (dehydrated
  // cache) or seeds TanStack's query cache directly (tests, other non-Next callers) — a plain
  // prop seed on this component duplicated that mechanism for no caller that still exists.
  const queryOptions: UseSuspenseQueryOptions<PaginationResult<VexDocument>> = {
    ...((props.isSearchActive
      ? convexQuery(
          vexConvexApi.search,
          buildListViewSearchQueryArgs({
            collection: props.collection,
            where: props.where as VexWhere<string> | undefined,
            search: props.search,
            searchField: props.searchField as string,
            drafts: props.drafts,
            numItems,
          }),
        )
      : convexQuery(
          vexConvexApi.findPaginated,
          buildListViewFindQueryArgs({
            collection: props.collection,
            where: props.where as VexWhere<string> | undefined,
            sort: props.sort,
            drafts: props.drafts,
            depth: 1,
            numItems,
          }),
        )) as unknown as UseSuspenseQueryOptions<PaginationResult<VexDocument>>),
  };
  // Frozen to THIS COMPONENT INSTANCE's first render (`useRef`'s initial-value argument is
  // only ever consumed once, on mount — every later render's freshly-computed `queryOptions`
  // above is thrown away) — this is the ONE
  // `useSuspenseQuery` in the tree, existing only to hand `NextAdminPage`'s dehydrated SSR
  // page to `useVexListQuery` below as `initialData` on first mount. Re-computing its own
  // key on every live search/sort/filter change (no `key` prop remounts this component
  // across those — same instance throughout) made it re-suspend on each one: a LIVE,
  // client-only key change has no dehydrated cache entry to resolve synchronously, so it
  // genuinely re-fetches and throws, and `useSuspenseQuery` has no `placeholderData`
  // equivalent to keep the old page showing meanwhile — `startTransition` (`useListViewUrlState`'s
  // own setters) was relied on to suppress the resulting fallback but does not reliably do
  // so here (nuqs's URL state update is not a plain React state write `startTransition` can
  // fully absorb). `useVexListQuery` below already keeps previous rows on screen through any
  // of those changes on its own (its own `placeholderData: keepPreviousData`, now bridged
  // across a find/search mode switch too) — the seed never needs a second opinion once the
  // very first page has been consumed from it.
  const initialQueryOptionsRef = useRef(queryOptions);
  const queryClient = useQueryClient();
  // The ACTIVE query options this `useSuspenseQuery` call below reads — starts as the
  // frozen first-render args (above), then is swapped EXACTLY ONCE (the effect below) to a
  // synthetic, non-Convex key holding the SAME already-resolved data, releasing the real
  // Convex key's own websocket subscription once it's no longer needed (Main's review —
  // the frozen key would otherwise keep ONE extra, never-again-read subscription open to
  // the component's FIRST query args for as long as this component stays mounted, even
  // long after the user has searched/sorted/filtered away from that initial state).
  const [activeSeedOptions, setActiveSeedOptions] = useState(initialQueryOptionsRef.current);
  const seed = useSuspenseQuery(activeSeedOptions);

  useEffect(() => {
    // Runs exactly once: by the time an effect runs, `useSuspenseQuery` above has already
    // resolved (it would have thrown/suspended otherwise, never reaching a commit), so
    // `seed.data` is guaranteed real here. Swapping to a key `ConvexQueryClient`'s own
    // `isConvexQuery()` check doesn't recognize (not the `["convexQuery", func, args]`
    // shape) means it never sets up a subscription for the NEW key at all, while the OLD
    // (real) key's observer count drops to 0 the moment this component re-renders with
    // the new `activeSeedOptions` — `useVexListQuery` below already has `seed.data` as its
    // own `initialData` by then, so this never re-suspends anything.
    if (activeSeedOptions !== initialQueryOptionsRef.current) return;
    const releasedOptions: UseSuspenseQueryOptions<PaginationResult<VexDocument>> = {
      queryKey: ["vex-seed-released", initialQueryOptionsRef.current.queryKey] as unknown as readonly unknown[],
      queryFn: () => seed.data,
      staleTime: Infinity,
    };
    queryClient.setQueryData(releasedOptions.queryKey, seed.data);
    setActiveSeedOptions(releasedOptions);
  }, []);

  return useVexListQuery<TDoc>({
    collection: props.collection,
    drafts: props.drafts,
    depth: 1,
    where: props.where,
    sort: props.sort,
    search: props.search,
    searchField: props.searchField,
    pageSize: props.pageSize,
    initialData: seed.data as PaginationResult<TDoc>,
  });
}
