"use client";

import { useState, useEffect, useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useAuthTransition, useVexAuth } from "../auth";
import type { FindClientPaginatedArgs } from "../client";
import { whereArg } from "../collections/api/whereArg";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionSlug, PaginationResult, VexDocument } from "@vexcms/core";

/**
 * Whether `error` is Convex's own `InvalidCursor` — a `cursor` rejected because the
 * query it was captured under no longer matches (most commonly: a sign-in/sign-out
 * changed the identity-dependent RBAC filter `find`/`search` bake into the query,
 * which Convex ties the cursor to server-side). Matched by substring, not a
 * structured `VexError`/`ConvexError` `.data` payload — this is thrown by Convex's
 * OWN pagination internals, not app code, so it never carries one.
 *
 * @param error - The query error to classify.
 * @returns `true` when the message names `InvalidCursor`.
 */
function isInvalidCursorError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("InvalidCursor");
}

/**
 * Props for the `usePaginatedQuery` hook.
 *
 * @typeParam TCollectionSlug - Collection slug type
 *
 * **Defaults:**
 * - `initialNumItems`: 100
 * - `depth`: 1
 * - `includeTotalCount`: true
 */
export interface UsePaginatedQueryProps<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /**
   * Initial data from SSR (optional).
   * Can be either an array of documents or a PaginationResult.
   */
  initialData?: PaginationResult<TDocument>;

  /**
   * Query arguments for the 'find()' api function.
   *
   * @see FindClientArgs
   *
   * Count is fetched only on first page load. Returns `null` if
   * collection has >32k documents.
   */
  query: FindClientPaginatedArgs<TCollectionSlug>;

  /**
   * Items to show per 'Load More'
   */
  clientPageSize?: number;

  /**
   * Whether the underlying query runs at all. @default true
   *
   * `useVexListQuery` calls this hook unconditionally from both its
   * `find`-mode and search-mode branches, flipping `enabled` per branch so
   * only the active one issues a real request.
   */
  enabled?: boolean;
}

/**
 * Return type of usePaginatedCollection hook.
 *
 * Mimics Convex's usePaginatedQuery API for consistency.
 */
export interface UsePaginatedQueryReturn<TDocument extends VexDocument = VexDocument> {
  /**
   * All loaded documents (accumulated across Load More calls).
   * Starts with first page, grows as user clicks Load More.
   */
  results: TDocument[];

  /**
   * Total document count across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents (Convex limit)
   * - `undefined` when count hasn't loaded yet or `includeTotalCount=false`
   */
  totalDocs: number | null | undefined;

  /**
   * Whether `totalDocs` is a floor, not an exact count — `find` counted
   * with `take(countLimit + 1)` and hit the cap.
   * `false` once `totalDocs` is `null`/`undefined` (count not loaded, or
   * the collection is below the old 32k scan limit this hook never hits
   * anymore since `find` itself caps the scan).
   */
  totalDocsCapped: boolean;

  /**
   * Whether all documents have been loaded.
   * When `true`, Load More button should be hidden.
   */
  isDone: boolean;

  /**
   * Load more documents. Fetches the next page using `initialNumItems`.
   */
  loadMore: () => void;

  /**
   * Whether the FIRST page of the current query is still in flight OR hasn't been committed
   * into `results` yet — `true` until `results` genuinely reflects a real answer, not just
   * until TanStack's own raw fetch status flips. Use for loading states on Load More button.
   */
  isPending: boolean;

  /**
   * TanStack's own "a fetch is in flight for the CURRENT query identity" flag. Reliable
   * against the fake test backend's genuinely-awaited `t.run()` (`hooksSuite.tsx` asserts
   * against it directly), but NOT against the real Convex client: live updates arrive via
   * a direct `queryClient.setQueryData` write from its websocket subscription
   * (`@convex-dev/react-query`), never a tracked refetch, so this can read `false`
   * throughout a query-identity change that visibly swaps `results` (confirmed live,
   * 2026-11-01 investigation) — use {@link isSettling} for a search/sort/filter-driven
   * spinner instead; this is kept for Load More's own in-flight state and existing test
   * coverage against the fake backend.
   */
  isFetching: boolean;

  /**
   * `true` from the render where the query's identity (where/sort/drafts/numItems) changes
   * until `results` has been synced with the REAL answer for that new identity — unlike
   * {@link isFetching}/{@link isPlaceholderData}, this is derived from `results` actually
   * having been written, not from React Query's own fetch-lifecycle bookkeeping, so it
   * works identically whether the new answer arrives via a tracked refetch or a live
   * websocket push straight into the cache. A search field reads this (not `isFetching`) to
   * show its own in-input spinner while the previous page's rows stay on screen. `false`
   * during a Load More (a `cursor` change under the SAME identity) — that has its own
   * loading state (`isPending`), not a "the page you're looking at is stale" one.
   */
  isSettling: boolean;

  /**
   * TanStack's own flag: `true` while `results` is showing
   * the PREVIOUS query's rows because `placeholderData: keepPreviousData`
   * is keeping them on screen during a query-identity change (e.g. a view
   * switch), not the CURRENT query's own data yet. Distinct from
   * `isFetching` — that's `true` for ANY in-flight fetch under the SAME
   * query identity too (a Load More page, a background refetch); this is
   * specifically "what you're looking at right now is stale." A caller
   * (`DataTable`'s `isRefetching` prop) uses this to dim the table body
   * and mark it `aria-busy` without ever rendering a blank/loading frame.
   */
  isPlaceholderData: boolean;

  /**
   * The query's error, when the underlying fetch rejected — `undefined`
   * while loading or once it has succeeded. Surfaces a `VexError` thrown
   * server-side (e.g. `UNINDEXED_SORT`) so a caller like `ListViewQueryError`
   * can render a specific message instead of the empty-results
   * state a rejected query would otherwise look like.
   */
  error?: unknown;

  /** Re-runs the failed query, without resetting any already-loaded pages. */
  retry: () => void;
}

/**
 * Hook for cursor-based pagination of VexCMS collections with Load More pattern.
 *
 * Manages:
 * - Convex cursor-based pagination using `find()` API
 * - Accumulates results across multiple Load More calls
 * - Extracts `totalCount` from first page response
 * - Mimics Convex `usePaginatedQuery` API for consistency
 *
 * @typeParam TCollectionSlug - Collection slug type
 * @param props - Hook configuration
 * @returns Pagination state and controls
 *
 * @example
 * ```tsx
 * const {
 *   results,
 *   totalCount,
 *   isDone,
 *   loadMore,
 *   isLoading,
 * } = usePaginatedCollection({
 *   collection: "posts",
 *   initialNumItems: 100,
 *   includeTotalCount: true,
 * });
 *
 * // Show total count in header
 * <p>
 *   {totalCount !== null && totalCount !== undefined ? (
 *     <>{totalCount.toLocaleString()} documents</>
 *   ) : (
 *     <>10,000+ documents</>
 *   )}
 * </p>
 *
 * // Show Load More button
 * {!isDone && (
 *   <Button onClick={() => loadMore(100)} disabled={isLoading}>
 *     {isLoading ? "Loading..." : "Load More"}
 *   </Button>
 * )}
 * ```
 *
 * @see `find` - Server function for querying documents
 * @see {@link PaginationResult} - Return type with totalCount
 */
export function usePaginatedQuery<
  TDocument extends VexDocument = VexDocument,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>({
  initialData,
  query,
  clientPageSize,
  enabled = true,
}: UsePaginatedQueryProps<TDocument, TCollectionSlug>): UsePaginatedQueryReturn<TDocument> {
  const [cursor, setCursor] = useState<string | null>(null);

  const [allResults, setAllResults] = useState<TDocument[]>(initialData?.page ?? []);

  const [isDone, setIsDone] = useState(initialData?.isDone ?? false);

  // Retained ONLY as the Load More fallback (a cursor'd page's own
  // response never carries `totalDocs` — `find`/`search` only compute it
  // for a `cursor: null` first page). While `cursor === null`, the
  // displayed total is derived straight from `result` below instead,
  // never read from here — so clearing this on a `resetKey` change (the
  // reset block right below) has no visible effect until the user
  // actually clicks Load More under the NEW query identity, at which
  // point it must be THIS query's own total, not a stale one left over
  // from the query this `resetKey` replaced.
  const [retainedTotalDocs, setRetainedTotalDocs] = useState<number | null | undefined>(
    initialData?.totalDocs,
  );
  const [retainedTotalDocsCapped, setRetainedTotalDocsCapped] = useState<boolean>(
    initialData?.totalDocsCapped ?? false,
  );

  const [clientPageIndex, setClientPageIndex] = useState(0);

  const { user } = useVexAuth();
  const { expectedIdentity, isTransitionPending, confirmTransition } = useAuthTransition();
  const identity = (user?._id as string | undefined) ?? null;
  const resolvedWhere = whereArg(query.where);
  // `identity` (the signed-in caller's doc id, `null` when signed out) is part of the
  // reset key, not just `collection`/`where`/`sort`/`drafts`/`numItems`: a sign-in or
  // sign-out changes the identity-dependent RBAC filter Convex bakes into THIS query's
  // underlying index/filter chain (`find`'s `accessFilter`), so a `cursor` captured under
  // the OLD identity is no longer valid for the SAME args under the NEW one — Convex's own
  // pagination rejects it server-side with `InvalidCursor: ...cursor is from a different
  // query` (developer-reported: reproduces reliably once "Load More" has been clicked at
  // least once, then the user signs in or out — `cursor` was never null, so the reset
  // block below never ran). Without this, `retry`/`refetch()` (the same args, same stale
  // cursor) throws the identical error forever — only a full reload, which remounts this
  // hook with a fresh `cursor: null`, recovers.
  //
  // `useVexAuth()` (server-seeded, refreshed via `router.refresh()` on every real sign-in/
  // out — see `AuthUIProvider.onSessionChange`/`VexAdminAuthAdapterProvider.signOut` in the
  // app's own auth client), not `useConvexAuth()` (`convex/react`): the latter requires a
  // `ConvexProviderWithAuth` ancestor this hook's existing test harness (`createFakeConvexClient`
  // + a bare `ConvexQueryClient`, no `ConvexProvider`) doesn't mount, and `useVexAuth()` is
  // already this exact codebase's established identity signal for the SAME class of problem
  // (`useFieldPermissions()` reactively drops a now-unreadable `sort`/`search`/filter field
  // the identical way).
  const resetKey = JSON.stringify({
    collection: query.collection,
    where: resolvedWhere,
    sort: query.sort,
    drafts: query.drafts,
    numItems: query.paginationOpts.numItems,
    identity,
  });
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  // Developer-reported regression fix: Convex's own React Query integration pushes a
  // LIVE update straight into the cache via `queryClient.setQueryData` (its websocket
  // subscription, `@convex-dev/react-query`'s `ConvexQueryClient.onUpdateQueryKeyHash`)
  // rather than through a tracked `queryFn` refetch — so neither `isFetching` nor
  // `isPlaceholderData` ever flips for a query-identity change under the REAL client (only
  // under the fake test backend's genuinely-awaited `t.run()`, where both work as
  // documented — confirmed directly: a live `?q=` search showed `resultsLen` changing from
  // 8 to 0 with `isFetching`/`isPlaceholderData` reading `false` throughout, 2026-11-01
  // investigation). `settledResetKey` tracks which `resetKey` the CURRENTLY-DISPLAYED
  // `allResults` actually corresponds to, independent of either flag — see `isSettling`
  // below. Starts as `null` (never equal to a real `resetKey`, a JSON string) unless
  // `initialData` was provided — an SSR/dehydrated-cache seed means the first render
  // already has real data for THIS key, so `isSettling` should correctly start `false`
  // there; with no seed, it must start `true` (matching `isPending`'s own semantics) until
  // the very first fetch actually settles, not `false` from the first render just because
  // `resetKey` trivially equals itself on mount.
  const [settledResetKey, setSettledResetKey] = useState<string | null>(initialData ? resetKey : null);
  const [prevClientPageSize, setPrevClientPageSize] = useState(clientPageSize);
  const [hasReset, setHasReset] = useState(false);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPrevClientPageSize(clientPageSize);
    setHasReset(true);
    setCursor(null);
    setClientPageIndex(0);
    setRetainedTotalDocs(undefined);
    setRetainedTotalDocsCapped(false);
    // Deliberately does NOT clear `allResults`/`isDone` here:
    // the whole point of `placeholderData: keepPreviousData` below is that
    // `result.page` keeps showing the PREVIOUS query's rows — stale, not
    // blank — until the new query actually resolves, at which point the
    // `useEffect` below (which syncs `allResults`/`isDone` FROM `result`)
    // naturally swaps in the fresh page. Clearing here would race ahead of
    // that and paint an empty table for one frame regardless of what
    // TanStack is keeping around, defeating the whole fix.
  } else if (clientPageSize !== prevClientPageSize) {
    setPrevClientPageSize(clientPageSize);
    setClientPageIndex(0);
  }

  const startIndex = 0;
  const endIndex = (clientPageIndex + 1) * (clientPageSize ?? query.paginationOpts.numItems);
  const visibleResults = allResults.slice(startIndex, endIndex);
  const needsServerFetch = endIndex >= allResults.length && !isDone;
  const clientIsDone = isDone && endIndex >= allResults.length;

  function loadMore() {
    // `clientPageIndex` always advances first so an already-accumulated page
    // is revealed on THIS call, not the next one (HOOK-4): the prior
    // implementation only advanced the index once the accumulator already
    // covered the visible window, so a fetch-triggering call revealed
    // nothing until a second call caught up. A server fetch is still queued
    // whenever the (pre-advance) window was already at the edge of loaded
    // data, so the newly-revealed slice keeps filling in behind it.
    if (clientIsDone) return;
    if (needsServerFetch && result.continueCursor) {
      setCursor(result.continueCursor);
    }
    setClientPageIndex((prev) => prev + 1);
  }

  // This hook is generic over `TCollectionSlug` — the collection is only known
  // at runtime, so it queries the generic paginated endpoint rather than the
  // per-slug `find()` wrapper, which narrows only for a literal slug. The
  // caller asserts the document shape via `TDocument`; see the memo below.
  const { data, isPending, isFetching, isLoading, isError, error, refetch, isPlaceholderData } = useQuery({
    ...convexQuery(vexConvexApi.findPaginated, {
      ...query,
      where: resolvedWhere,
      paginationOpts: {
        ...query.paginationOpts,
        cursor,
      },
    }),
    enabled,
    placeholderData: keepPreviousData,
    ...(cursor === null && initialData && !hasReset ? { initialData } : {}),
  });

  // Recovers from a transient `InvalidCursor` in the SAME render, before anything
  // paints — not an effect. `identity` above already normally resets `cursor` back
  // to `null` via `resetKey` on a sign-in/out, but Convex's OWN live auth update
  // (the SAME subscription re-evaluated under the new identity) can land before
  // `useVexAuth()` catches up through `router.refresh()`'s round trip, hitting the
  // stale `cursor` in that gap — developer-reported: a visible "Couldn't load…"
  // flash on sign-in, and a PERSISTENT one on sign-out (no OTHER re-render was
  // ever forced to retry with the by-then-corrected, still-non-null `cursor`).
  // Setting state here (not in a `useEffect`) means React re-runs this render
  // with `cursor: null` before committing anything to the screen — an effect-based
  // recovery would still paint `ListViewQueryError` for one frame first. Guarded by
  // `cursor !== null`, which this itself clears: cannot loop even if the same
  // error recurs for an unrelated reason, since the retried render sends `cursor:
  // null` and a repeat `InvalidCursor` is specifically a NON-null-cursor condition.
  if (cursor !== null && isError && isInvalidCursorError(error)) {
    setCursor(null);
    setClientPageIndex(0);
  }

  const result = useMemo<PaginationResult<TDocument>>(() => {
    // Empty placeholder for "no data yet". `continueCursor: ""` is a falsy
    // placeholder, never a real cursor: it is only read for truthiness in
    // `loadMore`, so `setCursor` never receives it and Convex only ever sees
    // `null` (first page) or a genuine cursor. `data` is absent both while
    // the query is still loading and after it rejects, so `isDone` can't be
    // inferred from its mere absence (HOOK-6) — it must default to `false`
    // ("not done") and only the array-response branch below, which is
    // genuinely a complete non-paginated result, overrides it to `true`.
    const empty = {
      page: [] as TDocument[],
      continueCursor: "",
      isDone: false,
    };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);

  // Derived display total: while on the first page (`cursor === null`),
  // read it straight off `result` — a placeholder response during a
  // `resetKey` transition (view/filter/search/size change) is the
  // PREVIOUS query's own resolved data (`placeholderData: keepPreviousData`
  // above), so this naturally shows the previous total until the new
  // first page actually lands, then switches to it — no separate
  // "is this stale" check needed for that case. `Object.hasOwn`
  // distinguishes a real (possibly `null`, for the >32k-docs case)
  // `totalDocs` from the caller never having requested one at all. Off
  // the first page (after Load More), `find`/`search` never resend
  // `totalDocs` on a cursor'd page, so this falls back to the value
  // retained from THIS query's own first page (below).
  const resultHasTotalDocs = Object.hasOwn(result, "totalDocs");
  const totalDocs =
    cursor === null ? (resultHasTotalDocs ? result.totalDocs : retainedTotalDocs) : retainedTotalDocs;
  const totalDocsCapped =
    cursor === null
      ? resultHasTotalDocs
        ? (result.totalDocsCapped ?? false)
        : retainedTotalDocsCapped
      : retainedTotalDocsCapped;

  useEffect(() => {
    // Captures the CURRENT query's own first-page total for later Load
    // More calls (which paginate past page 1, where `find`/`search` never
    // resend `totalDocs`) — and for live reactive updates to this SAME
    // first page (e.g. an insert/delete elsewhere while the list stays
    // open): Convex pushes a fresh `data` for the SAME query identity,
    // this effect re-fires, and the retained value tracks it. Skipped
    // during a placeholder render (`isPlaceholderData`) so a
    // transitional, not-yet-THIS-query response is never captured as
    // this query's own total.
    if (cursor === null && !isPlaceholderData && resultHasTotalDocs) {
      setRetainedTotalDocs(result.totalDocs);
      setRetainedTotalDocsCapped(result.totalDocsCapped ?? false);
    }
  }, [cursor, isPlaceholderData, resultHasTotalDocs, result.totalDocs, result.totalDocsCapped]);

  useEffect(() => {
    // `isPlaceholderData` guards against syncing a STALE page: with
    // `placeholderData: keepPreviousData` above, `result.page` keeps
    // showing the PREVIOUS cursor's/query's page for a render or two after
    // `cursor`/`resetKey` changes, until the new query actually resolves.
    // Without this guard, a `loadMore()`-triggered cursor change would
    // append that stale (still-previous-page) data to `allResults` on this
    // first, placeholder render, then append the REAL new page again once
    // it resolves — duplicating rows. Waiting for `isPlaceholderData` to
    // clear means this effect only ever syncs genuinely fresh data.
    if (!result.page || isPlaceholderData) return;
    if (cursor === null) {
      // `isError` MUST be checked before treating `result.page` as real data: the
      // `useMemo` above returns the SAME safe `{ page: [] }` fallback for "still
      // loading" AND "the query errored" — TanStack keeps the query's last-known
      // `data` around even in `status: "error"` (`ConvexQueryClient.onUpdateQueryKeyHash`'s
      // error push only sets `status`/`fetchStatus`/`error`, never touches `data`),
      // so this effect used to run on every error too and commit that empty `[]` as
      // if it were a real (zero-row) answer — wiping out whatever rows were already
      // showing. Developer-reported: rows dim, then DISAPPEAR. Returning here instead
      // leaves `allResults` exactly as it was; whether the error ITSELF is shown is
      // decided entirely by the returned `error` field below.
      if (isError) return;
      // A sign-in/out has no args-level signal here (page 1: `cursor`/`where`/`sort`
      // never change), so this stays on the SAME TanStack query entry while Convex
      // re-evaluates the still-open subscription under the changing identity
      // (`onUpdateQueryKeyHash`, `@convex-dev/react-query`) — a push during that
      // window can carry a DIFFERENT identity than the one the client now expects.
      // `find`/`search` stamp every page with `viewerId` (the identity it was
      // produced under) for exactly this comparison: while a transition is pending
      // (`beginTransition` was called — the `signOut` wrapper, or a reactive watch on
      // the session — and no matching page has confirmed it yet), a page whose
      // `viewerId` doesn't match `expectedIdentity` is NOT a genuine answer for the
      // identity the user is now looking at — ignore it, keep the CURRENT (dimmed)
      // rows, and wait for the one that matches. `viewerId === undefined` (a test
      // fixture predating this field, or no `AuthTransitionProvider` mounted) always
      // passes — this never gates anything unless the host app opted in.
      const pushViewerId = (data as { viewerId?: string | null } | undefined)?.viewerId;
      if (isTransitionPending && pushViewerId !== undefined && pushViewerId !== expectedIdentity) {
        return;
      }
      setAllResults(result.page);
      // `result.page` is ALWAYS a truthy array once `isError`/placeholder are ruled
      // out — `data !== undefined` alone is enough to tell "a genuine answer" apart
      // from the very first render (before any fetch has completed at all).
      if (data !== undefined) {
        setSettledResetKey(resetKey);
      }
      setIsDone(result.isDone);
      if (isTransitionPending) confirmTransition();
    } else {
      setAllResults((prev) => [...prev, ...result.page]);
      setIsDone(result.isDone);
    }
  }, [
    result.page,
    result.isDone,
    cursor,
    isPlaceholderData,
    isError,
    resetKey,
    data,
    isTransitionPending,
    expectedIdentity,
    confirmTransition,
  ]);

  // `true` from the render where `resetKey` changes until the sync effect above records
  // that key as settled — unlike `isFetching`/`isPlaceholderData` (unreliable here, see
  // above), this works identically whether the real answer arrives via a tracked refetch
  // (the fake test backend) or a live websocket push straight into the cache (the real
  // Convex client) — it never depends on React Query's own fetch-lifecycle bookkeeping
  // noticing anything, only on `allResults` itself actually having been written for this
  // key. Load More (a `cursor` change under the SAME `resetKey`) never sets this — a
  // search/sort/filter/size change is a VISIBLE "is this still the old page" question (an
  // in-input spinner, no skeleton); accumulating a later page behind the ones already on
  // screen is not the same kind of event (`isPending`, surfaced separately, already covers
  // the Load More button's own loading state).
  const isSettling = resetKey !== settledResetKey;

  // TanStack's raw `isPending` (destructured above) flips to `false` the instant `data`
  // resolves for a query that NEVER had `placeholderData` to fall back on — which, thanks
  // to `keepPreviousData` above, is true for exactly one window in this hook's whole
  // lifetime: the very FIRST load (no `initialData`, `settledResetKey` still `null`). That
  // flip lands one render BEFORE the sync effect above has actually written the resolved
  // page into `allResults` — a real render with `isPending: false` and `results: []`
  // (2026-11-12 CI flake, `useSavedListViews.loadMoreParity.test.tsx`: passed 5/5 locally,
  // failed on a slower runner where that one-render gap was wide enough for `waitFor` to
  // catch it). EVERY later identity change (sort/filter/search/size/a sign-in or -out) is
  // already safe without this: `keepPreviousData` keeps raw `isPending` `false` throughout
  // (`isSettling`/`isPlaceholderData` above cover "is this stale" instead), and `allResults`
  // is deliberately never cleared on a `resetKey` change — so gating broadly on
  // `isSettling` here (instead of narrowing to `settledResetKey === null`) would make a
  // plain sort/filter switch report `isPending: true` again too, flipping Load More's own
  // button spinner (`isLoadingMore`, fed straight from this field by every caller) on for a
  // switch that was never "loading more" — a real behavior change this fix must not cause.
  // `!isError` matches `error` (below): a first-load rejection must surface immediately as
  // an error, not spin forever as if still pending.
  const resolvedIsPending = isPending || (settledResetKey === null && !isError);

  return {
    results: visibleResults,
    totalDocs,
    totalDocsCapped,
    isDone: clientIsDone,
    loadMore,
    isPending: resolvedIsPending,
    isFetching,
    isSettling,
    isPlaceholderData,
    // `settledResetKey !== null` means SOME resetKey (not necessarily the current one —
    // see `isSettling` above) has already rendered real data at least once in this
    // component's lifetime; `isTransitionPending` means the auth-transition marker
    // (above) is still waiting for a page tagged with `expectedIdentity`. A query
    // error is never shown while EITHER holds: `ConvexQueryClient.onUpdateQueryKeyHash`
    // pushes an error straight into the SAME TanStack cache entry this `useQuery` is
    // STILL watching whenever `cursor`/the rest of `resetKey` didn't change (page 1 —
    // a sign-in/out changes the identity-dependent RBAC filter `find` evaluates
    // under, with no args-level signal to react to, so the query key never rotates),
    // bypassing the normal fetch lifecycle entirely. An error has no `viewerId` to
    // compare (it's a thrown exception, not a tagged page) — treating "a transition
    // is pending" as sufficient reason to distrust it is the same "ignore anything
    // that isn't confirmed" rule the sync effect above applies to successful pages.
    // `isSettling` (above) still reports `true` for the stretch, so the caller's
    // existing "dim while settling" treatment covers it with the LAST GOOD rows still
    // visible, never a blank or error screen. A component's very FIRST load failing
    // has no prior good render to fall back to (`settledResetKey === null`) and no
    // transition pending either, and still surfaces normally.
    error: isError && !isTransitionPending && settledResetKey === null ? error : undefined,
    retry: () => {
      void refetch();
    },
  };
}


