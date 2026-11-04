"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import {
  buildListViewFindQueryArgs,
  buildListViewSearchQueryArgs,
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  resolveListViewQueryState,
  vexConvexApi,
  VEX_VIEW_SOURCES,
  type CollectionConfig,
  type VexStoredView,
  type VexViewConfig,
  type VexWhere,
} from "@vexcms/core";
import { useFieldPermissions } from "../../../access";
import { LIST_VIEW_PEEK_HOVER_DELAY_MS } from "../peek/useListViewPeekPrefetch";
import { decodeViewUrlValue, encodeViewUrlValue, type SavedListViewEntry } from "./useSavedListViews";

/** TanStack Query's own `gcTime` for a view-tab prefetch — short-lived: a tour of every tab without clicking any must leave no lingering subscription past this window. */
const LIST_VIEW_PREFETCH_GC_TIME_MS = 30_000;

/** Props for {@link useSavedListViewPrefetch}. */
export interface UseListViewPrefetchProps<TFieldSlug extends string = string> {
  /** The resolved collection config — supplies `admin.view.state.serverPageSize`/`admin.view`, same as `useVexListQuery`. */
  collection: CollectionConfig;
  /** The currently active `?view=` URL value — a hover over the ALREADY-active tab is a no-op (its data is already live, not stale). */
  urlState: { view: string | undefined };
  /** `useSavedListViews()`'s raw (hidden-filter-intact) config views — `collection.admin.views`. */
  rawConfigViews: VexViewConfig<TFieldSlug>[];
  /** `useSavedListViews()`'s raw shared views, from `listViews` (live query). */
  sharedViews: VexStoredView<TFieldSlug>[];
}

/** Return value of {@link useSavedListViewPrefetch}. */
export interface UseListViewPrefetchReturn<TFieldSlug extends string = string> {
  /** Attach to a tab's `onPointerEnter`: starts the hover-prefetch timer. */
  onTabPointerEnter: (view: SavedListViewEntry<TFieldSlug>) => void;
  /** Attach to a tab's `onPointerLeave`: cancels a pending hover-prefetch timer. */
  onTabPointerLeave: () => void;
  /** Attach to a tab's `onFocus`: prefetches immediately, no delay (a real click also fires this — the browser default for a focusable tab — so this single handler covers both "hover-warmed" and "just clicked, still loading" without a separate signal from the query itself). */
  onTabFocus: (view: SavedListViewEntry<TFieldSlug>) => void;
  /** The `viewId` of the tab a prefetch is currently in flight for (hover-triggered or click/focus-triggered alike) — drives `SavedListViewTabs`' inline spinner. `undefined` when nothing is in flight. */
  pendingViewId: string | undefined;
}

/**
 * Warms the list query cache for a saved view's tab before it's clicked:
 * on {@link LIST_VIEW_PEEK_HOVER_DELAY_MS} hover or immediate keyboard focus, resolves the
 * hovered tab's OWN saved state (NOT the currently active URL's state) through the same
 * `resolveListViewQueryState` → `buildListViewFindQueryArgs`/`buildListViewSearchQueryArgs` pipeline
 * `CollectionListView`'s own query and `NextAdminPage`'s server prefetch both already go
 * through — so a subsequent real click finds its query already warm under the EXACT same
 * cache key, no second round trip.
 *
 * A `local`-source tab is never prefetched this way — a
 * local view's full state already lives in the URL the instant it's selected (read synchronously
 * from `localStorage`, no network round trip to warm). The currently-ACTIVE tab is also
 * skipped — its query is already live, re-prefetching it would just duplicate work.
 *
 * @typeParam TFieldSlug - The collection's own field slugs.
 * @param props - {@link UseListViewPrefetchProps}.
 * @returns Tab event handlers and the in-flight `pendingViewId`; see {@link UseListViewPrefetchReturn}.
 */
export function useSavedListViewPrefetch<TFieldSlug extends string = string>(
  props: UseListViewPrefetchProps<TFieldSlug>,
): UseListViewPrefetchReturn<TFieldSlug> {
  const queryClient = useQueryClient();
  const [pendingViewId, setPendingViewId] = useState<string | undefined>(undefined);
  // Same instance `CollectionListView.tsx`'s own `resolveListViewQueryState` call
  // feeds — a shared view's own saved `where` naming a field this caller
  // can't read must drop here too,
  // or hovering warms a DIFFERENT query key (filter intact) than a real
  // click resolves to (filter dropped), missing the warm cache entirely —
  // the same "two different query keys, a refetch" class the sort/search prefetch
  // already forbids for sort/search. Local views are already skipped above
  // (never prefetched at all), so this only matters for `shared`/`config`.
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });

  const prefetch = useCallback(
    (view: SavedListViewEntry<TFieldSlug>) => {
      if (view.source === VEX_VIEW_SOURCES.local) return;
      const activeViewId = decodeViewUrlValue(props.urlState.view) ?? "default";
      if (view.viewId === activeViewId) return;

      const configView =
        view.source === VEX_VIEW_SOURCES.config
          ? props.rawConfigViews.find((candidate) => candidate.viewId === view.viewId)
          : undefined;
      const sharedView =
        view.source === VEX_VIEW_SOURCES.shared
          ? props.sharedViews.find((candidate) => candidate.viewId === view.viewId)
          : undefined;

      // Empty/default `ListViewUrlState` — every field EXCEPT `view` falls back to
      // the hovered view's own saved state via `resolveListViewQueryState`
      // (NOT the currently active URL's own q/sort/filter/size), exactly
      // what a fresh click of that tab would resolve to. `q: undefined`
      // (not `""`) — `resolveListViewQueryState` treats a DEFINED `q` (even
      // `""`) as an explicit "clear the view's saved search" (Decision
      // 9's clear-sentinel grammar, `Step4TableConfig`'s fix); `undefined`
      // is the "inherit" sentinel this prefetch needs (a real bug: with
      // `q: ""` here, hovering a shared/config view whose OWN saved state
      // includes a search used to always prefetch via `findPaginated`
      // instead of `search`, silently warming the wrong query).
      const resolved = resolveListViewQueryState({
        collection: props.collection,
        params: {
          q: undefined,
          qf: undefined,
          sort: undefined,
          filter: undefined,
          size: undefined,
          view: view.source === VEX_VIEW_SOURCES.default ? undefined : encodeViewUrlValue(view),
          peek: undefined,
          cols: undefined,
        },
        configView,
        sharedView,
        fieldPermissions,
      });
      const isVersioned = "versions" in props.collection && props.collection.versions.drafts;
      const drafts = isVersioned ? true : undefined;
      const numItems = Math.max(props.collection.admin.view.state.serverPageSize, resolved.pageSize);
      const isSearchActive = resolved.search.trim() !== "" && resolved.searchField !== undefined;

      setPendingViewId(view.viewId);
      const promise = isSearchActive
        ? queryClient.prefetchQuery({
            ...convexQuery(
              vexConvexApi.search,
              buildListViewSearchQueryArgs({
                collection: props.collection,
                where: resolved.where as VexWhere<TFieldSlug>,
                search: resolved.search,
                searchField: resolved.searchField as TFieldSlug,
                drafts,
                numItems,
              }),
            ),
            gcTime: LIST_VIEW_PREFETCH_GC_TIME_MS,
          })
        : queryClient.prefetchQuery({
            ...convexQuery(
              vexConvexApi.findPaginated,
              buildListViewFindQueryArgs({
                collection: props.collection,
                where: resolved.where as VexWhere<TFieldSlug>,
                sort: resolved.sort,
                drafts,
                depth: 1,
                numItems,
              }),
            ),
            gcTime: LIST_VIEW_PREFETCH_GC_TIME_MS,
          });
      void promise.finally(() => {
        // Only clears the spinner for the hover/click that started THIS
        // prefetch — an abandoned earlier hover's `finally` must never
        // clear a NEWER tab's still-in-flight pending state (a tour of
        // several tabs in quick succession).
        setPendingViewId((current) => (current === view.viewId ? undefined : current));
      });
    },
    [props.collection, props.rawConfigViews, props.sharedViews, props.urlState.view, queryClient, fieldPermissions],
  );
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onTabPointerEnter = useCallback(
    (view: SavedListViewEntry<TFieldSlug>) => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => prefetch(view), LIST_VIEW_PEEK_HOVER_DELAY_MS);
    },
    [prefetch],
  );

  // Cancels only the pending TIMER — a prefetch already in flight is left to
  // resolve into the cache (eviction is `gcTime` above, same as the peek prefetch).
  const onTabPointerLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
  }, []);

  const onTabFocus = useCallback(
    (view: SavedListViewEntry<TFieldSlug>) => {
      prefetch(view);
    },
    [prefetch],
  );

  // A pending hover-timer never fires for an already-unmounted tab strip.
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimer.current);
    };
  }, []);

  return { onTabPointerEnter, onTabPointerLeave, onTabFocus, pendingViewId };
}
