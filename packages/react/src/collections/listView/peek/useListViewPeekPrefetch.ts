"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import {
  vexConvexApi,
  buildGetArgs,
  type CollectionConfig,
  type MediaCollectionConfig,
  type VexDocument,
} from "@vexcms/core";

/**
 * Hover delay (ms) before {@link useListViewPeekPrefetch} prefetches a row's
 * full document (Design Decision 27). Keyboard focus prefetches
 * immediately, with no delay.
 */
export const LIST_VIEW_PEEK_HOVER_DELAY_MS = 150;

/**
 * Props for {@link useListViewPeekPrefetch}.
 *
 * @typeParam TDocument - The document shape `rows` holds.
 */
export interface UseListViewPeekPrefetchProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config `rows` belongs to. */
  collection: CollectionConfig | MediaCollectionConfig;
  /** The list's currently loaded, already version-collapsed rows. */
  rows: TDocument[];
  /** The `peek` URL param — while set, the neighbouring rows ±1 prefetch too. */
  peekId: string | undefined;
}

/** Return value of {@link useListViewPeekPrefetch} — row event handlers, meant to be spread onto each row. */
export interface UseListViewPeekPrefetchReturn {
  /** Attach to a row's `onPointerEnter`: starts the hover-prefetch timer. */
  onRowPointerEnter: (id: string) => void;
  /** Attach to a row's `onPointerLeave`: cancels a pending hover-prefetch timer. */
  onRowPointerLeave: () => void;
  /** Attach to a row's `onFocus`: prefetches immediately, no delay. */
  onRowFocus: (id: string) => void;
}

/**
 * Warms the `useVexDocQuery` cache for a row's full document before
 * `ListViewPeek` (`./ListViewPeek`) opens it (Design Decision 27): on row hover
 * (after {@link LIST_VIEW_PEEK_HOVER_DELAY_MS}) or keyboard focus, and for the
 * neighbouring rows ±1 of `props.peekId` while the peek is open. Eviction
 * is TanStack Query's own `gcTime` — there is no custom LRU.
 *
 * @typeParam TDocument - The document shape `props.rows` holds.
 * @param props - {@link UseListViewPeekPrefetchProps}.
 * @returns Row event handlers; see {@link UseListViewPeekPrefetchReturn}.
 *
 * @example
 * ```tsx
 * const prefetch = useListViewPeekPrefetch({ collection, rows, peekId: urlState.peek });
 * <ListViewLayout
 *   onRowHoverStart={prefetch.onRowPointerEnter}
 *   onRowHoverEnd={prefetch.onRowPointerLeave}
 *   onRowFocus={prefetch.onRowFocus}
 * />
 * ```
 */
export function useListViewPeekPrefetch<TDocument extends VexDocument = VexDocument>(
  props: UseListViewPeekPrefetchProps<TDocument>,
): UseListViewPeekPrefetchReturn {
  const queryClient = useQueryClient();

  // Same shared `buildGetArgs` helper (polish fixes, Decision 3) `useVexDocQuery`'s own
  // callers build their args with, so a prefetch and the peek's own subsequent query share
  // one cache entry — no second round trip when the peek opens.
  const prefetch = useCallback(
    (id: string) => {
      void queryClient.prefetchQuery(convexQuery(vexConvexApi.get, buildGetArgs({ id, collection: props.collection })));
    },
    [queryClient, props.collection],
  );

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onRowPointerEnter = useCallback(
    (id: string) => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => prefetch(id), LIST_VIEW_PEEK_HOVER_DELAY_MS);
    },
    [prefetch],
  );

  // Cancels only the pending timer — a prefetch already in flight is left
  // to resolve into the cache (eviction is `gcTime`, Decision 27).
  const onRowPointerLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
  }, []);

  const onRowFocus = useCallback(
    (id: string) => {
      prefetch(id);
    },
    [prefetch],
  );

  // A pending prefetch never fires for an already-unmounted row.
  useEffect(() => {
    return () => {
      clearTimeout(hoverTimer.current);
    };
  }, []);

  // "The neighbouring rows ±1 prefetch while the peek is open" (Decision
  // 27). `props.peekId` outside `props.rows` (a deep link) → index is
  // `-1`, neither neighbour exists, this effect is a no-op.
  useEffect(() => {
    if (props.peekId === undefined) return;
    const index = props.rows.findIndex((row) => row._id === props.peekId);
    if (index === -1) return;
    const previous = props.rows[index - 1];
    const next = props.rows[index + 1];
    if (previous) prefetch(previous._id);
    if (next) prefetch(next._id);
  }, [props.peekId, props.rows, prefetch]);

  return { onRowPointerEnter, onRowPointerLeave, onRowFocus };
}
