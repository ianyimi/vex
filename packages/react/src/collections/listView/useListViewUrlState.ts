"use client";

import { useCallback, useMemo, useRef, useTransition } from "react";
import { parseAsString, useQueryStates } from "nuqs";
import {
  parseListViewUrlState,
  serializeListViewUrlState,
  VEX_VIEW_SOURCES,
  type ColumnEntry,
  type CollectionConfig,
  type ListViewUrlState,
  type ListViewSort,
  type VexViewState,
  type VexWhereNode,
} from "@vexcms/core";
import {
  decodeViewUrlValue,
  encodeViewUrlValue,
  type SavedListViewEntry,
  type ListViewStateSnapshot,
} from "./savedListViews/useSavedListViews";
import { useIsRouteCovered } from "../../config/useIsRouteCovered";
import { useLastUncoveredValue } from "../../config/useLastUncoveredValue";

/** Per-setter history override — every setter has its own default history-push behavior; pass `{ push: true }` to force a history entry (e.g. Enter in search) or `{ push: false }` to force a silent replace. */
export interface ListViewUrlSetOptions {
  push?: boolean;
}

/** Setters mirroring {@link ListViewUrlState}'s fields. */
export interface UseListViewUrlStateReturn<TFieldSlug extends string = string>
  extends ListViewUrlState<TFieldSlug> {
  /**
   * `true` while ANY `startTransition`-wrapped URL-state write (any setter below) is in
   * flight — includes display-only writes (`setPeek`, `setCols`) that never touch the
   * table's own query. Most consumers want {@link isQueryPending} instead; this stays
   * (available for anything that genuinely needs "is ANY URL write still settling" —
   * `CollectionListView` used to OR this
   * blanket flag into its `isRefetching` dimming, so a peek Previous/Next click or a
   * column reorder/resize/pin — neither of which the table's query depends on — dimmed
   * the table for the transition's duration even though its rows were never going to
   * change; see `isQueryPending`'s own doc comment for the fix).
   */
  isPending: boolean;
  /**
   * `true` only while a `startTransition`-wrapped write that CAN change the table's own
   * query (`q`/`qf`/`sort`/`filter`/`size`/`view` — the keys `resolveListViewQueryState`/
   * `useVexListQuery`'s own `resetKey`s are built from) is in flight. `false` for a
   * peek-only (`setPeek`) or columns-only (`setCols`) write, even while `isPending` is
   * `true` for it — consumers dimming stale rows during a re-suspend (`isRefetching`,
   * `CollectionListView.tsx`) should read THIS, not `isPending`, or they dim for writes
   * that were never going to touch what's on screen.
   *
   * A patch that mixes a query-affecting key with a display-only one (e.g. a plain
   * `setSort`/`setFilter`/etc. call) still counts as query-affecting — the classification
   * is "does ANY key in the latest patch matter," not "do ALL of them." `applyView` is the
   * one exception: it ALWAYS writes `q`/`qf`/`sort`/`filter`/`size`/`view`/`cols` together
   * (see its own doc comment), so classifying it by key presence alone would dim the table
   * on every view switch even when the target view's own search/sort/filter/size are
   * IDENTICAL to what's already active (switching tabs between views
   * built off the same base state dimmed the table for no visible change) — `applyView`
   * instead classifies itself by comparing its computed values against the CURRENT params
   * (see `isQueryAffectingViewSwitch`), only marking the transition query-affecting when
   * `q`/`qf`/`sort`/`filter`/`size` actually differ, never on `view`/`cols` alone.
   * Two different-kind writes racing inside the SAME still-settling transition (a sort
   * change immediately followed by a peek click before the sort's own transition
   * commits) stay `true` until that transition settles, even for the trailing
   * display-only write — an accepted, intentionally conservative worst case (dims when
   * it technically didn't have to for that SPECIFIC write), never the other way around
   * (never reads `false` while a query-affecting write is still genuinely in flight).
   */
  isQueryPending: boolean;
  /** `undefined` omits `q=` (inherit the active view's own search — `applyView`/Reset); `""` is an EXPLICIT clear, distinct from that. Live typing only ever passes a concrete string, never `undefined`. */
  setQ: (q: string | undefined, options?: ListViewUrlSetOptions) => void;
  setQf: (qf: TFieldSlug | undefined, options?: ListViewUrlSetOptions) => void;
  setSort: (
    sort: ListViewSort<TFieldSlug> | undefined,
    options?: ListViewUrlSetOptions,
  ) => void;
  /** `undefined` omits `filter=` (inherit the active view's own filter — `applyView`/Reset); `null` is the explicit "user cleared it" sentinel, distinct from that ("Clear all" on a view with its own saved filter). */
  setFilter: (
    filter: VexWhereNode<TFieldSlug> | undefined | null,
    options?: ListViewUrlSetOptions,
  ) => void;
  setSize: (size: number | undefined, options?: ListViewUrlSetOptions) => void;
  setView: (view: string | undefined, options?: ListViewUrlSetOptions) => void;
  setPeek: (peek: string | undefined, options?: ListViewUrlSetOptions) => void;
  /** Replaces the full column list — every field, in display order, each possibly carrying width/pinned/hidden overrides. Discrete — pushes a history entry by default, like a drag-drop reorder/resize/pin always should. */
  setCols: (columns: ColumnEntry<TFieldSlug>[], options?: ListViewUrlSetOptions) => void;
  /**
   * Switches to `view`, writing `q`/`qf`/`sort`/`filter`/`size`/`view`/`cols`
   * in ONE atomic URL write, diffed against `view`'s OWN baseline — the per-field
   * `setQ`/`setQf`/.../`setCols` calls
   * `SavedListViewTabs.tsx`'s `applyView` used to make were all diffed against
   * the STALE pre-switch `viewState` (it only updates on a re-render,
   * never mid-function-body), so switching FROM a shared/config view
   * (a real baseline) TO a view whose fields differ from that OLD
   * baseline wrote them explicitly instead of omitting them against the
   * NEW target's own baseline — e.g. switching shared→All left a
   * redundant `cols=` (and potentially `sort=`/`qf=`/`size=`) behind.
   * @param view - The view being switched to.
   * @param effectiveColumns - The VISIBLE columns to apply (`view.columns
   *   ?? defaultView?.columns ?? []`, caller-resolved — this hook has no
   *   `defaultView` lookup of its own).
   */
  applyView: (
    view: SavedListViewEntry<TFieldSlug>,
    options?: ListViewUrlSetOptions,
  ) => void;
}

/** Every list URL key stored as its literal raw string (or `null`) — `@vexcms/core`'s `listUrlParams.ts` owns all validation/typing, this layer is nuqs plumbing only. */
const RAW_PARSERS = {
  q: parseAsString,
  qf: parseAsString,
  sort: parseAsString,
  filter: parseAsString,
  size: parseAsString,
  view: parseAsString,
  peek: parseAsString,
  cols: parseAsString,
};

/**
 * Patch keys that can change the table's own query — the same keys `resolveListViewQueryState`/
 * `useVexListQuery`'s own `resetKey`s are built from (`collection`/`drafts`/`numItems` are
 * never part of a URL patch, so they're not listed here). `view`, `peek` and `cols` are
 * deliberately absent — `view` only changes which columns/filters/sort are displayed (it
 * is never itself read by the query args), and `peek`/`cols` aren't read by the query args
 * at all either, see `isQueryPending`'s own doc comment (`UseListViewUrlStateReturn`) for why
 * that distinction exists.
 */
const QUERY_AFFECTING_PATCH_KEYS: Record<string, true> = {
  q: true,
  qf: true,
  sort: true,
  filter: true,
  size: true,
};

/**
 * Whether `patch` contains at least one key that can change the table's own query —
 * extracted as a pure, exported function (not inlined in `writeParams`) so the
 * classification itself is unit-testable without exercising `useTransition`'s real
 * scheduling (its own "pending" window settles faster than a jsdom test can observe,
 * confirmed empirically — `act()` flushes the whole transition before `result.current`
 * can ever show `isPending: true`). A mix of a query-affecting key and a display-only one
 * (e.g. a plain `setSort`/`setFilter`/etc. call racing a `setPeek`) counts as
 * query-affecting — see {@link UseListViewUrlStateReturn.isQueryPending}'s own doc comment.
 * `applyView` does NOT use this function — its all-at-once `q`/`sort`/.../`cols` write
 * would always contain every query-affecting key regardless of whether the target view's
 * own values actually differ from what's already active; see
 * {@link isQueryAffectingViewSwitch} below for its own, value-diffing classification.
 *
 * @param patch - The patch a setter is about to write (the SAME object `writeParams`
 *   receives — only the keys present matter, not their values).
 * @returns `true` if `patch` contains `q`/`qf`/`sort`/`filter`/`size`; `false` for a patch
 *   containing ONLY `view`/`peek`/`cols` (or none of those, an empty patch).
 */
export function isQueryAffectingPatch(patch: Record<string, unknown>): boolean {
  return Object.keys(patch).some((key) => QUERY_AFFECTING_PATCH_KEYS[key] === true);
}

/**
 * Whether `value` and `other` differ for a query-affecting field's comparison purposes —
 * `JSON.stringify`-based (content-equal), matching `ListViewFilterBuilder.tsx`'s own
 * `filter`-comparison convention, and normalizing `undefined`/`null` to the same `null`
 * so "unset" compares equal regardless of which sentinel either side happens to use (a
 * view's own `search`/`searchField`/`sort`/`where`/`pageSize` and `ListViewUrlState`'s matching
 * fields don't always agree on which one they default to).
 *
 * @param value - One side of the comparison.
 * @param other - The other side of the comparison.
 * @returns `true` when the two values differ after `undefined`/`null` normalization.
 */
function queryValueChanged(value: unknown, other: unknown): boolean {
  return JSON.stringify(value ?? null) !== JSON.stringify(other ?? null);
}

/**
 * Whether `applyView`'s own computed patch actually changes any query-affecting field
 * (`q`/`qf`/`sort`/`filter`/`size`) relative to `current` (the CURRENT, pre-switch
 * params) — distinct from {@link isQueryAffectingPatch}'s key-presence check, since
 * `applyView` ALWAYS writes `q`/`qf`/`sort`/`filter`/`size` together (every field, every
 * switch — see `applyView`'s own doc comment), so classifying it by key presence alone
 * would dim the table on EVERY view switch, even one that only changes `view`/`cols`
 * (switching between two views built off the same search/sort/filter/
 * size — most commonly a "duplicate as copy" right after saving it — dimmed the table for
 * a change nothing on screen was ever going to reflect). `view` and `cols` are
 * deliberately excluded from the comparison, same as {@link isQueryAffectingPatch} — a
 * view switch's displayed COLUMNS changing doesn't make its underlying QUERY pending.
 *
 * @param current - `params`, the CURRENT (pre-switch) parsed URL state.
 * @param patch - `applyView`'s own computed patch (same shape passed to `writeParams`).
 * @returns `true` if `q`/`qf`/`sort`/`filter`/`size` differ between `current` and `patch`;
 *   `false` when the target view's own values exactly match what's already active (even
 *   though `view` — and `cols` — still get written either way).
 */
export function isQueryAffectingViewSwitch<TFieldSlug extends string>(
  current: Partial<ListViewUrlState<TFieldSlug>>,
  patch: Partial<ListViewUrlState<TFieldSlug>>,
): boolean {
  return (
    queryValueChanged(current.q, patch.q) ||
    queryValueChanged(current.qf, patch.qf) ||
    queryValueChanged(current.sort, patch.sort) ||
    queryValueChanged(current.filter, patch.filter) ||
    queryValueChanged(current.size, patch.size)
  );
}

/**
 * Drives the collection list view's shareable URL state via `nuqs`, using
 * `@vexcms/core`'s {@link parseListViewUrlState}/{@link serializeListViewUrlState}
 * for the compact grammar. The codec itself lives in core
 * so `NextAdminPage` parses the exact same params
 * server-side, with no react/nuqs dependency to drag along — this hook is
 * nothing more than a `nuqs` binding over it.
 *
 * @param props - Input props.
 * @param props.collection - Constrains `qf`/`sort.field`/`size` and
 *   resolves `filter`'s field types.
 * @param props.views - `useSavedListViews().views` (the merged, display-ready
 *   list) — resolves the ACTIVE view's own saved `sort`/`searchField`/
 *   `pageSize`/`columns` as the baseline every setter below diffs
 *   against before writing to the URL (a param that
 *   already equals the active view's own value, or — absent that — the
 *   collection's resolved default, is never written; a stale `?sort=…`
 *   that already matches is DROPPED, not just withheld going forward).
 *   `undefined` (the default) falls back to diffing against only the
 *   collection's default view, matching every `local`-source view's own
 *   self-contained-URL design automatically, since a
 *   `local` entry is excluded from this lookup below regardless.
 * @returns The parsed state plus setters.
 *
 * @example
 * ```tsx
 * const { views } = useSavedListViews({ collection: collection.slug });
 * const url = useListViewUrlState({ collection, views });
 * useVexListQuery({
 *   collection: collection.slug,
 *   where: url.filter,
 *   sort: url.q ? undefined : url.sort, // parked while searching
 *   search: url.q,
 *   searchField: url.qf,
 *   pageSize: url.size,
 * });
 * ```
 */
export function useListViewUrlState<TFieldSlug extends string = string>(props: {
  collection: CollectionConfig;
  views?: SavedListViewEntry<TFieldSlug>[];
}): UseListViewUrlStateReturn<TFieldSlug> {
  // `startTransition` (React's own) wraps every URL-state write below — the dehydrated-
  // streaming redesign's `useSuspenseQuery` re-suspends on a changed query key (a view/
  // filter/sort switch), and `startTransition` is what keeps the LAST committed content on
  // screen instead of showing the Suspense fallback while the new query resolves (React's
  // own documented mechanism for this — not `useQuery`'s `keepPreviousData`, which
  // `useSuspenseQuery` doesn't support). `isPending` (exposed below) is the blanket "ANY
  // write is in flight" signal; `isQueryPending` (below) narrows it to writes that can
  // actually change the query — see both fields' own doc comments
  // (`UseListViewUrlStateReturn`) for the bug this split fixes.
  const [isPending, startTransition] = useTransition();
  const [liveRaw, setRaw] = useQueryStates(RAW_PARSERS, { startTransition });
  // A covering route (the sign-in modal) owns the URL — keep reading the list's own query,
  // or its filter/view/search drop and the wrong rows load behind the modal. Writes are
  // dropped while covered too: one would land on the modal's URL, not the list's (Escape
  // closing the modal also reaches the peek's global Escape handler; a search debounce
  // can settle just after the modal opens).
  const isRouteCovered = useIsRouteCovered();
  const raw = useLastUncoveredValue(liveRaw);
  // Accumulates "was ANY patch written during the CURRENT pending transition
  // query-affecting" — set (never cleared mid-transition) by `writeParams` below, and
  // reset once the transition settles (same synchronous-during-render adjustment style
  // `usePaginatedQuery.ts`/`useVexListQuery.ts`'s own `resetKey` blocks use). Accumulating
  // rather than overwriting is deliberate: a query-affecting write followed by a
  // display-only one BEFORE the first write's own transition commits must still read
  // `true` — see `isQueryPending`'s own doc comment for why this direction of imprecision
  // (dims when it technically didn't have to) is the accepted one, never the reverse.
  const isQueryAffectingPendingRef = useRef(false);
  if (!isPending && isQueryAffectingPendingRef.current) {
    isQueryAffectingPendingRef.current = false;
  }
  const isQueryPending = isPending && isQueryAffectingPendingRef.current;

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        Object.entries(raw).filter((entry): entry is [string, string] => entry[1] !== null),
      ),
    [raw],
  );

  const params = useMemo(
    () => parseListViewUrlState<TFieldSlug>({ searchParams, collection: props.collection }),
    [searchParams, props.collection],
  );

  // The active DECLARED (`default`/`config`) or `shared` view's own saved
  // state — `undefined` for a `local`-source view (its full
  // state always stays in the URL, there's no server-side row to fall
  // back to) or when `props.views` wasn't supplied/hasn't resolved it
  // yet. Mirrors `resolveListViewQueryState`'s own `declaredView?.state ??
  // sharedView?.state` exactly, from the SAME merged `views` list
  // `SavedListViewTabs`/`CollectionListView` already resolve `activeView`
  // from, so this can't disagree with what the rest of the page renders
  // as "the active view."
  const viewState = useMemo<VexViewState<TFieldSlug> | undefined>(() => {
    const activeViewId = decodeViewUrlValue(params.view) ?? "default";
    const activeView = props.views?.find((view) => view.viewId === activeViewId);
    if (activeView === undefined || activeView.source === VEX_VIEW_SOURCES.local) return undefined;
    return {
      sort: activeView.sort,
      searchField: activeView.searchField,
      pageSize: activeView.pageSize,
      columns: activeView.columns,
    };
  }, [params.view, props.views]);

  // Shared by `applyPatch` (diffs against the CURRENT render's memoized
  // `viewState`) and `applyView` (diffs against the TARGET view's own
  // baseline instead, computed fresh per call — see `applyView`'s own
  // doc comment for why `applyPatch` alone isn't enough for a view
  // switch).
  const writeParams = useCallback(
    (
      patch: Partial<ListViewUrlState<TFieldSlug>>,
      push: boolean,
      viewStateForWrite: VexViewState<string> | undefined,
      // `applyView` passes its own `isQueryAffectingViewSwitch` result here instead of
      // relying on the default — see that function's own doc comment for why its
      // all-at-once patch can't be classified by key presence alone the way every other
      // setter's single-key patch can.
      isQueryAffecting: boolean = isQueryAffectingPatch(patch),
    ) => {
      if (isRouteCovered) return;
      // Classify BEFORE `setRaw` starts the transition — `isQueryPending` (above) reads
      // this ref on the SAME render `isPending` first flips `true`, so the mutation must
      // happen synchronously in this event-handler call, not inside the transition.
      if (isQueryAffecting) {
        isQueryAffectingPendingRef.current = true;
      }
      const next = serializeListViewUrlState({
        params: { ...params, ...patch } as Partial<ListViewUrlState<string>>,
        collection: props.collection,
        viewState: viewStateForWrite,
      });
      // Only the PATCHED keys go into this `setRaw` call — each key's
      // compact-grammar serialization is self-contained (never depends on
      // a sibling key's value), so restricting the record this way lets
      // nuqs's own same-tick batching merge several setter calls into one
      // history entry correctly. Setting every key from a full rebuild
      // against `params` would instead re-assert each UNCHANGED key from
      // this render's (potentially stale, pre-batch) snapshot, clobbering
      // a sibling setter's own in-flight change to that key.
      const record: Record<string, string | null> = {};
      for (const key of Object.keys(patch)) {
        record[key] = next.get(key);
      }
      void setRaw(record, { history: push ? "push" : "replace" });
    },
    [isRouteCovered, params, props.collection, setRaw],
  );

  const applyPatch = useCallback(
    (patch: Partial<ListViewUrlState<TFieldSlug>>, push: boolean) => {
      writeParams(patch, push, viewState as VexViewState<string> | undefined);
    },
    [writeParams, viewState],
  );

  const setQ = useCallback(
    (q: string | undefined, options?: ListViewUrlSetOptions) => {
      // A `qf` with no active query is stale UI state — only when
      // EXPLICITLY cleared to "" (typing), not when reverting to
      // "inherit" (`undefined`, used by applyView/Reset, which set `qf`
      // separately right after via their own explicit call).
      const patch: Partial<ListViewUrlState<TFieldSlug>> = q === "" ? { q, qf: undefined } : { q };
      applyPatch(patch, options?.push ?? false);
    },
    [applyPatch],
  );

  const setQf = useCallback(
    (qf: TFieldSlug | undefined, options?: ListViewUrlSetOptions) => {
      applyPatch({ qf }, options?.push ?? false);
    },
    [applyPatch],
  );

  const setSort = useCallback(
    (sort: ListViewSort<TFieldSlug> | undefined, options?: ListViewUrlSetOptions) => {
      applyPatch({ sort }, options?.push ?? true);
    },
    [applyPatch],
  );

  const setFilter = useCallback(
    (filter: VexWhereNode<TFieldSlug> | undefined | null, options?: ListViewUrlSetOptions) => {
      applyPatch({ filter }, options?.push ?? false);
    },
    [applyPatch],
  );

  const setSize = useCallback(
    (size: number | undefined, options?: ListViewUrlSetOptions) => {
      applyPatch({ size }, options?.push ?? true);
    },
    [applyPatch],
  );

  const setView = useCallback(
    (view: string | undefined, options?: ListViewUrlSetOptions) => {
      applyPatch({ view }, options?.push ?? true);
    },
    [applyPatch],
  );

  const setPeek = useCallback(
    (peek: string | undefined, options?: ListViewUrlSetOptions) => {
      applyPatch({ peek }, options?.push ?? true);
    },
    [applyPatch],
  );

  const setCols = useCallback(
    (columns: ColumnEntry<TFieldSlug>[], options?: ListViewUrlSetOptions) => {
      applyPatch({ cols: columns }, options?.push ?? true);
    },
    [applyPatch],
  );

  const applyView = useCallback(
    (view: SavedListViewEntry<TFieldSlug>, options?: ListViewUrlSetOptions) => {
      const isDefault = view.viewId === "default";
      // The TARGET view's own baseline — NOT `viewState` above (that's
      // still the OLD, pre-switch view until a re-render; see this
      // method's own doc comment). A `local` target never gets a
      // baseline (every field below is written explicitly).
      const targetViewState: VexViewState<TFieldSlug> | undefined =
        view.source === VEX_VIEW_SOURCES.local
          ? undefined
          : { sort: view.sort, searchField: view.searchField, pageSize: view.pageSize, columns: view.columns };
      const patch: Partial<ListViewUrlState<TFieldSlug>> = {
        q: view.search,
        qf: view.searchField,
        sort: view.sort,
        filter: view.where as VexWhereNode<TFieldSlug> | undefined,
        // The CURRENT `size=` wins over the target view's own saved `pageSize`
        // ("rows per load" reset to the view's default
        // on every switch) — `params.size` is `undefined` only when the user
        // never overrode it (inheriting whatever view was active before), in
        // which case the target view's own `pageSize` still applies, same as
        // every other field below. Once the user HAS picked an explicit size
        // (`setSize`, a real `?size=`), it's a browser-wide preference that
        // survives every later view switch, not a per-view saved value.
        size: params.size ?? view.pageSize,
        view: isDefault ? undefined : encodeViewUrlValue(view),
        // `view.columns` is ALREADY the full, complete
        // column list — no `effectiveColumns` filter needed anymore
        // (the separate visible/order split a now-removed subset filter existed to reconcile is gone along with it).
        cols: view.columns,
      };
      writeParams(
        patch,
        options?.push ?? true,
        targetViewState as VexViewState<string> | undefined,
        isQueryAffectingViewSwitch(params, patch),
      );
    },
    [writeParams, params],
  );

  return {
    ...params,
    isPending,
    isQueryPending,
    setQ,
    setQf,
    setSort,
    setFilter,
    setSize,
    setView,
    setPeek,
    setCols,
    applyView,
  };
}

/** The subset of {@link useListViewUrlState}'s return value `SavedListViewTabs` reads and writes. */
export interface ListViewUrlStateSlice<TFieldSlug extends string = string> {
  q: string | undefined;
  qf: TFieldSlug | undefined;
  sort: ListViewStateSnapshot<TFieldSlug>["sort"];
  filter: ListViewStateSnapshot<TFieldSlug>["where"] | null;
  size: number | undefined;
  view: string | undefined;
  /** `undefined` means "omit `q=`, inherit the active view's own search" (used by `applyView`/Reset); `""` is an EXPLICIT clear, distinct from that (matches `ListViewUrlState.q`/`useListViewUrlState`'s real `setQ` contract). Live typing (`ListViewSearch.tsx`) only ever passes a concrete string, never `undefined`. */
  setQ: (value: string | undefined) => void;
  setQf: (value: TFieldSlug | undefined) => void;
  setSort: (value: ListViewStateSnapshot<TFieldSlug>["sort"]) => void;
  /** `undefined` omits `filter=` (inherit); `null` is the explicit "user cleared it" sentinel, distinct from that (matches `ListViewUrlState.filter`). */
  setFilter: (value: ListViewStateSnapshot<TFieldSlug>["where"] | null) => void;
  setSize: (value: number | undefined) => void;
  setView: (value: string | undefined) => void;
  /** Switches to `view`, writing every field (`q`/`qf`/`sort`/`filter`/`size`/`view`/`cols`) in ONE atomic URL write, diffed against `view`'s OWN baseline — see `useListViewUrlState`'s own doc comment (the old per-field `setX` sequence diffed against the STALE pre-switch view). */
  applyView: (view: SavedListViewEntry<TFieldSlug>) => void;
}
