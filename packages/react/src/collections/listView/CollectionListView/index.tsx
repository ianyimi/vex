"use client";

import {
  completeListViewColumnOrder,
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  PEEK_PANEL_DEFAULT_WIDTH_PX,
  readableListViewSearchFields,
  resolveListViewQueryState,
  resolveListViewSearchField,
  VERSION_SYSTEM_FIELDS,
  type ColumnEntry,
  type CollectionConfig,
  type CollectionListViewProps,
  type CollectionSlug,
  type CollectionTableSort,
  type ResolvedFieldPermissions,
  type TDocument,
  type ListDensity,
  type ListViewConfigCookieValues,
  type VexWhere,
} from "@vexcms/core";
import { type ColumnDef } from "@tanstack/react-table";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { RevalidateButton } from "../../../revalidate/RevalidateButton";
import { useVexConfig } from "../../../config/VexConfigContext";
import { getCollectionColumnDefs } from "../../../fields";
import { useCanReadField, useFieldPermissions, usePermission } from "../../../access";
import { DataTable, isInteractiveRowTarget } from "../../../ui/data-table/DataTable";
import { QueryErrorBoundary } from "../../../ui/QueryErrorBoundary";
import { AdminNotFound } from "../../../admin/AdminNotFound";
import { adminHref } from "../../../admin/adminHref";
import { ListViewLayout, useColumnsWithActions } from "../ListViewLayout";
import { ListViewPeek } from "../peek/ListViewPeek";
import { useListViewPeekPrefetch } from "../peek/useListViewPeekPrefetch";
import { useSavedListViewPrefetch } from "../savedListViews/useSavedListViewPrefetch";
import { ListViewContextProvider } from "../ListViewContext";
import { useListViewUrlState, type UseListViewUrlStateReturn } from "../useListViewUrlState";
import {
  decodeViewSource,
  decodeViewUrlValue,
  isPlaceholderLocalView,
  resolveEffectiveFilterWhere,
  useSavedListViews,
} from "../savedListViews/useSavedListViews";
import { ListViewEmptyState } from "../ListViewEmptyState";
import { ListViewQueryError } from "../ListViewQueryError";
import {
  writeListViewDensityCookie,
  writeListViewPeekWidthCookie,
  writeListViewPeekTabCookie,
  writeListViewSkeletonRowCountCookie,
} from "../writeListViewConfigCookies";
import { MODALS } from "../../../modals/constants";
import { buildStatusColumn } from "./listViewStatusColumn";
import { useListViewServerSeed } from "./useListViewServerSeed";

/**
 * The field name backing a column, read off TanStack's `accessorKey`.
 * `undefined` for a synthetic, non-field column (`select`, `actions`) —
 * `vex_status` DOES set `accessorKey` (see `buildStatusColumn`'s own doc
 * comment) and so resolves like any real field here.
 *
 * @param column - A `ColumnDef` from the table's resolved column list.
 * @returns The column's `accessorKey` as a string, or `undefined` when the
 *   column has none (a synthetic column keyed only by `id`).
 */
function columnFieldKey(column: ColumnDef<TDocument, unknown>): string | undefined {
  return "accessorKey" in column ? String(column.accessorKey) : undefined;
}

/**
 * Collection list view component.
 *
 * Renders a data table of all documents in a collection. The shell (title, header actions,
 * view tabs, toolbar, table frame) never reads row data and renders immediately from
 * config/URL/cookies — only the table body, footer, and bulk-selection count come from a
 * live query, isolated inside `CollectionListViewData`'s own `<Suspense>` boundary
 * (developer-binding redesign: TanStack Query v5 + Next.js App Router streaming —
 * `NextAdminPage` prefetches the identical `convexQuery(...)` key via `prefetchQuery` +
 * `dehydrate`/`HydrationBoundary`, without awaiting it, so the shell streams first and the
 * row data streams in behind it). Search, sort, filter, and page size all round-trip
 * through the URL (Decision 9).
 *
 * This component renders the *content area only* — wrap it in `AdminLayout`.
 *
 * Owns the shared list state (collection, URL state, selection, density,
 * visible columns, `onInspect`) and mounts `ListViewContextProvider` around
 * `ListViewLayout` (Decision 37), which delegates to `ListViewLayout` for the
 * actual composition of the seven `list.*` slots and the toolbar.
 * `RevalidateButton` renders in the SAME header row as the title and
 * `list.header.actions` (Decision 23 — owned by `CollectionListView`
 * itself, never a slot contribution), passed through `ListViewLayout`'s
 * `headerExtra` prop rather than as a sibling block, so the header never
 * splits onto two lines.
 *
 * Density (Decision 29) is seeded from `props.initialPreferences?.density`
 * (resolved server-side from the consolidated `vex-admin` cookie, Decision 51) —
 * never from `useLocalStorage`, which would make the client's first paint
 * depend on an effect. `onDensityChange` both updates local state and
 * writes the cookie, so the next server render agrees before any client JS
 * runs.
 *
 * `liveRows`/`isSearchFetching` are lifted state: `CollectionListViewData`
 * (the Suspense-wrapped inner component) reports the resolved page and
 * fetch status up via `onRowsChange`/`onSearchFetchingChange` so
 * `ListViewContextProvider`'s `selection.selectedDocs`/`isSearchFetching` —
 * read by things OUTSIDE the Suspense boundary (the bulk-actions bar,
 * `ListViewSearch`'s spinner) — stay correct without those consumers needing to
 * live inside the boundary themselves. Both start empty/`false` — nothing
 * can be selected or mid-search before the first page exists anyway, so
 * this is a no-op during the (brief) streaming window, never a
 * user-visible gap.
 *
 * @param props - View props.
 * @param props.collection - The slug of the collection to list, resolved
 *   from `useVexConfig()` — the single provenance for collection config.
 * @param props.initialPreferences - Layout-affecting preferences resolved
 *   server-side from cookies (Decision 42).
 * @returns The collection data table, or a not-found message when
 *   `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionListView collection="posts" />
 * ```
 *
 * On a versioned collection (`collection.versions.drafts`), requests
 * `drafts: true` (gated on `readDrafts`) so an in-progress edit's draft
 * row is visible. `find`/`search` themselves page over one "canonical"
 * row per logical document and merge each linked draft's fields back in,
 * server-side, per page (`collections/mergeDraftCounterparts.ts`,
 * `@vexcms/core`) — `pagination.results` already carries one row per
 * logical document, never a draft row split from its published
 * counterpart. The public read path is unaffected: it never requests
 * drafts and never sees a draft row, paired or standalone.
 */
export function CollectionListView<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDoc extends TDocument = TDocument,
>(props: CollectionListViewProps<TCollectionSlug>) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  if (!collection) {
    return (
      <AdminNotFound
        variant="collection"
        detail={`Collection "${props.collection}" doesn't exist.`}
        backHref={adminHref({ type: "collections" }, config.basePath)}
        backLabel="Back to collections"
      />
    );
  }

  const isVersioned = collection.versions.drafts;

  const initialPreferences: ListViewConfigCookieValues = props.initialPreferences ?? {
    density: "comfortable",
    chipsVisible: true,
    peekWidth: PEEK_PANEL_DEFAULT_WIDTH_PX,
    peekTab: "fields",
  };
  const [density, setDensity] = useState<ListDensity>(initialPreferences.density);
  const onDensityChange = (next: ListDensity) => {
    setDensity(next);
    writeListViewDensityCookie({ basePath: config.basePath, density: next });
  };
  const [peekTab, setPeekTab] = useState<"fields" | "json">(initialPreferences.peekTab);
  const onPeekTabChange = (next: "fields" | "json") => {
    setPeekTab(next);
    writeListViewPeekTabCookie({ basePath: config.basePath, tab: next });
  };
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const canCreate = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.create,
    scope: PERMISSION_SCOPES.any,
  });
  const canDelete = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.delete,
    scope: PERMISSION_SCOPES.any,
  });
  const [, setCreateModalOpen] = useQueryState(MODALS.createDocument.urlParam, parseAsBoolean);

  // `useSavedListViews` runs FIRST — it doesn't depend on `urlState` at all,
  // and `useListViewUrlState`'s setters now need `savedViews` to diff a
  // write against the active view's own saved state (Decision 9/45/48,
  // the redundant-`?sort=`-on-its-own-baseline fix), not just the
  // collection's bare default.
  const {
    views: savedViews,
    rawConfigViews,
    sharedViews,
  } = useSavedListViews({
    collection: collection.slug,
    initialLocalIndex: props.initialLocalIndex,
  });
  const urlState = useListViewUrlState({ collection, views: savedViews });
  // Decision 45/48: an absent `?view=` resolves to the default ("All")
  // view instead of `undefined` — it is a real view now (fixed id
  // "default"), always present in `savedViews`, so its own hidden filter
  // (if any) correctly drives `activeViewHiddenFilter`'s lock badge too.
  const activeViewId = decodeViewUrlValue(urlState.view) ?? "default";
  const activeViewSource = decodeViewSource(urlState.view);
  const activeView = savedViews.find((view) => view.viewId === activeViewId);
  const activeViewHiddenFilter = activeView?.hasHiddenFilter
    ? { count: activeView.hiddenFilterCount, description: activeView.description }
    : undefined;
  // Developer-reported follow-up (access-system-fields.md Decision 11): a
  // SHARED view's own saved filter must show as normal, EDITABLE chips —
  // same as any URL filter — when every field it references is readable
  // (never for a declared `config`/`default` view, whose filter stays
  // hidden-badge-only regardless of readability, by design). `ListViewToolbar`'s
  // `where` prop used to feed `ListViewFilterBuilder`/`ListViewFilterChips`/the eye
  // toggle from `urlState.filter` alone, which is `undefined` for an
  // unmodified shared-view link (its state isn't URL-embedded the way a
  // local view's is, Decision 41) — so a readable shared filter was
  // invisible UI-wise for every caller, not just one who can't read a
  // field in it (confirmed live, zero chips for an unrestricted admin
  // session on a readable shared view). See `resolveEffectiveFilterWhere`'s
  // own doc for the exact rule.
  const effectiveFilterWhere = resolveEffectiveFilterWhere({ urlFilter: urlState.filter, activeView });

  // The single place `where`/`sort`/`search`/`searchField`/`pageSize`/
  // `columnOrder`/`visibleColumns` resolve from the URL + active view's
  // own saved state + the collection's `admin.view` defaults (Decision
  // 39/Step 14, Decision 47) — the EXACT same core function
  // `NextAdminPage`'s server prefetch calls, fed the raw
  // `configView`/`sharedView` (`where` intact, Decision 25's hidden
  // filter) rather than `useSavedListViews`' own display-projected `views`
  // list (which has `where` stripped) — so the client's own query args
  // (AND its first-paint columns) can never drift from what the server
  // already prefetched under the same query key (no refetch, no flash).
  // A `local` view never needs `configView`/`sharedView` here either —
  // Decision 41 already requires its full state in the URL, so
  // `urlState` alone is already complete for it, exactly mirroring
  // `NextAdminPage.tsx`'s own identical split. Computed HERE, before
  // `visibleColumns`/`columnOrder`'s own `useState` below, specifically
  // so those can seed directly from it on the FIRST render (developer-
  // reported fix: a view with hidden columns used to show every column
  // for one frame, then narrow once a `useEffect` corrected it — the
  // server has no equivalent effect to run, so its OWN first (and only)
  // render permanently disagreed with the client's post-effect one).
  const configView =
    activeViewSource === "config"
      ? rawConfigViews.find((view) => view.viewId === activeViewId)
      : undefined;
  const sharedView =
    activeViewSource === "shared"
      ? sharedViews.find((view) => view.viewId === activeViewId)
      : undefined;
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    // Deliberately no `data`: a column is shown or hidden for the whole
    // table, so the question is "is this field denied for EVERY document",
    // not "for this one" — `scope: "any"` answers exactly that.
    scope: PERMISSION_SCOPES.any,
  });
  // Same resource/action/scope as `fieldPermissions` above, via the shared
  // helper every other Part 2 gating site uses (`ListViewFilterBuilder`/
  // `ListViewFilterChips`/`ListViewPeek`) — system fields (`vex_status`, and a
  // hypothetical Created/Updated At) and UI fields (e.g. Word Count) are
  // gated through this identically to a regular data field (access-
  // system-fields plan, part 2a).
  const canReadField = useCanReadField({ resource: collection.slug });

  // Resolved BEFORE `resolveListViewQueryState` (not just for `resolveListViewSearchField`/
  // `columns` below any more) so it can also drop a user-added filter condition
  // on an unreadable field (access-system-fields.md Decision 11) — the SAME
  // `resolveFieldPermissions` instance `NextAdminPage.tsx`'s own server call
  // feeds it, so server and client agree on whether a condition gets dropped,
  // not just on the sort/search narrowing they already agreed on.
  const resolved = resolveListViewQueryState({ collection, params: urlState, configView, sharedView, fieldPermissions });

  // Seeded from `resolved.peekWidth` (the ACTIVE VIEW's own saved width)
  // first, falling back to the collection-wide `vex-admin:<collection>`
  // cookie's `peekWidth` only when the view never saved one of its own —
  // developer-reported fix: a shared view whose own width differed from
  // whatever this browser's cookie happened to hold (from browsing OTHER
  // views in the same collection) used to show a false "Modified: preview
  // width" on every direct/fresh load, since this used to seed PURELY from
  // the cookie, with no awareness of the active view at all — unlike
  // `columnEntries`/`resolved.columns` below, which already got this right.
  // Flash-free for `config`/`shared` views: `resolved` is the SAME pure
  // function `NextAdminPage`'s own server render calls with the SAME
  // `configView`/`sharedView` inputs, so server and client agree on the
  // very first render. A `local` view's own width isn't visible to
  // `resolved` at all (Decision 41 — its state lives in `localStorage`, not
  // `configView`/`sharedView`) — the view-sync effect below (the SAME one
  // that already re-syncs `columnEntries` once `localStorage` hydrates)
  // re-seeds it from the merged `activeView.peekWidth` once that resolves.
  const [peekWidth, setPeekWidth] = useState<number>(resolved.peekWidth ?? initialPreferences.peekWidth);
  // Tracks whether the user has explicitly resized the peek (drag,
  // keyboard, or the double-click/"Reset width" shortcut — anything
  // routed through `ListViewPeek`'s own `onWidthChange`) since `activeViewId`
  // last changed — reset to `false` by the view-sync effect below.
  // Developer decision (binding, "peek-resize-save-rule"): Save only
  // starts persisting a `peekWidth` into a view that never had one of its
  // own when THIS flag is `true` — landing on such a view and saving some
  // OTHER change (search/sort/filter/…) must not silently bake in
  // whatever this browser's unrelated remembered width happens to be.
  const peekWidthTouchedRef = useRef(false);
  // `undefined` is Reset/"view switched to one with no saved width" —
  // falls back to the collection-wide default (Decision, developer-
  // approved "peek-resize": mirrors `writeListViewChipsVisibleCookie`'s own
  // "always resolves to a concrete value" contract, `ListViewConfigCookieValues`
  // never holds `undefined`). `source` defaults to `"user"` — the ONLY
  // value `ListViewPeek`'s own `onWidthChange` prop ever supplies (a genuine
  // drag/keyboard/double-click action) — `"view"` is for Reset/a
  // `SavedListViewTabs` tab-click switch RESTORING a specific view's own saved
  // width, which must persist the SAME way but must NOT count as the
  // user having "touched" the width on whatever view is now active.
  const onPeekWidthChange = (next: number | undefined, source: "user" | "view" = "user") => {
    const nextResolved = next ?? PEEK_PANEL_DEFAULT_WIDTH_PX;
    setPeekWidth(nextResolved);
    if (source === "user") peekWidthTouchedRef.current = true;
    writeListViewPeekWidthCookie({
      basePath: config.basePath,
      collectionSlug: collection.slug,
      width: next,
    });
  };

  // Seeded directly from `resolved.columns` — NO effect-based correction
  // needed for the FIRST render, since `resolved` is computed identically
  // server- and client-side from the SAME inputs (`urlState`/
  // `configView`/`sharedView`, all synchronously available on both sides
  // for every source EXCEPT a stale legacy local view missing its own
  // `cols=`, handled by the backfill effect below).
  const [columnEntries, setColumnEntries] = useState<ColumnEntry<string>[]>(resolved.columns);
  // Re-syncs local state when the ACTIVE VIEW ITSELF resolves to new data
  // a render or two after `activeViewId` last changed — `resolved` only
  // reads `activeView` indirectly via `configView`/`sharedView` (both
  // always `undefined` for a `local` source), so it does NOT by itself
  // react to `localStorage` hydrating a local view's REAL (possibly
  // narrower) `columns`/width after the cookie-index placeholder's first
  // paint (Decision 41's own known gap: the server never sees
  // `localStorage`). ALSO re-syncs `peekWidth` the same way (developer-
  // reported fix, "peek-resize-view-sync") — `resolved.peekWidth` above
  // already seeds it flash-free for `config`/`shared` views on the FIRST
  // render, but a `local` view's own saved width (like its columns) isn't
  // visible to `resolved` at all, only to this effect's `activeView`.
  // `syncedViewIdRef` guards a ONE-TIME re-sync per `activeViewId`
  // transition, never again after, so it can't clobber a later manual
  // column/width edit — see git history for the original render-phase-
  // `setState` bug this `useEffect` placement fixed.
  const syncedViewIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (activeView === undefined || isPlaceholderLocalView(activeView)) return;
    if (syncedViewIdRef.current === activeViewId) return;
    syncedViewIdRef.current = activeViewId;
    // A fresh view-id transition always starts "untouched" — whatever the
    // PREVIOUS view's resize history was doesn't carry over to this one.
    peekWidthTouchedRef.current = false;
    // Same `urlState.cols ?? activeView.columns ?? collection default`
    // precedence `resolved` itself uses — preferring the URL keeps an
    // in-progress, not-yet-saved reorder/pin/resize/visibility edit
    // intact across this resync (it only fires once per view-id
    // transition, so a LIVE edit mid-session never gets clobbered by the
    // view's own stored value reasserting itself).
    const rawColumns = urlState.cols ?? activeView.columns ?? collection.admin.view.state.columns;
    const realColumns = completeListViewColumnOrder({ order: rawColumns, collection });
    setColumnEntries(realColumns);
    // Deliberately `setPeekWidth` only, NOT `onPeekWidthChange` — this is a
    // passive re-sync of the DISPLAYED width to match the view just landed
    // on, not a user action, so it must not persist to the collection-wide
    // `vex-admin:<collection>` cookie the way an explicit resize/Reset/tab-
    // click switch does (that would silently overwrite the user's own
    // remembered preference just from visiting a view with a different
    // saved width). ONLY re-syncs when the view HAS its own explicit width
    // (unlike `columns` above, which always has a value — the collection's
    // own default when nothing else is declared) — a view WITHOUT one
    // leaves `peekWidth` exactly as it already is (whatever the cookie/an
    // earlier live resize left it at), rather than collapsing it to
    // `PEEK_PANEL_DEFAULT_WIDTH_PX` and silently discarding the user's own
    // independent, unrelated preference (regression caught live: a plain
    // view switch used to reset ANY browser-remembered width back to the
    // hardcoded default the instant this effect ran, defeating the whole
    // point of `peekWidth` being a persisted preference at all).
    if (activeView.peekWidth !== undefined) {
      setPeekWidth(activeView.peekWidth);
    }
    // Self-heals a STALE local-view URL that predates Decision 47/48
    // (never wrote its own `cols=`, so this exact scenario — the real
    // columns resolving only after `localStorage` hydrates — is
    // unavoidable for it specifically; chosen over growing the
    // server-readable cookie to also carry columns, since every NEW
    // save/apply already writes `cols=` going forward (Decision 41:
    // local view state belongs in the URL) — a silent `replace` write,
    // so the NEXT load of this SAME URL already has `cols=` and never
    // flashes again. Writes the FULL completed array (Decision 48's
    // own `cols=` semantic — every field, not just the visible subset
    // Step 20's own grammar carried).
    if (activeViewSource === "local" && urlState.cols === undefined) {
      urlState.setCols(realColumns, { push: false });
    }
  }, [
    activeViewId,
    activeViewSource,
    activeView?.source,
    activeView?.columns,
    activeView?.peekWidth,
    collection.admin.view.state.columns,
    urlState.cols,
  ]);
  // Replaces the full `columns` array AND the URL (Decision 48) — the ONE
  // setter every in-place column-layout interaction uses (the columns
  // menu's drag-reorder/checkbox/pin control, `DataTable`'s own resize
  // handle). Collapsed from Step 20's separate `onVisibleColumnsChange`/
  // `onColumnOrderChange`/`onColumnsChange` trio — there is only one
  // array now, so the race between two independent setters that trio
  // existed to avoid (developer-reported) can no longer happen at all.
  const onColumnsChange = (next: ColumnEntry<string>[]) => {
    setColumnEntries(next);
    urlState.setCols(next);
  };
  // LOCAL STATE ONLY — no `urlState.setCols` write (developer-reported:
  // switching views now writes `cols=` as ONE field in `urlState.applyView`'s
  // single atomic URL write, diffed against the TARGET view's own
  // baseline; a SEPARATE `urlState.setCols` call here would either
  // double-write or — worse — diff against the STALE pre-switch
  // baseline `onColumnsChange` above would've used, exactly the bug
  // being fixed). Used by `SavedListViewTabs.tsx`'s `applyView` and
  // `ListViewModifiedControls.tsx`'s save-as-copy switch.
  const onColumnsStateChange = (next: ColumnEntry<string>[]) => {
    setColumnEntries(next);
  };

  // Decision 9/26: a URL with no `qf` (or an invalid/unreadable one) must
  // still resolve to a real, readable field before a search query ever
  // reaches the server — `resolveListViewSearchField` is the ONE place this
  // resolution happens, shared with `ListViewSearch`'s own field picker
  // (`ListViewSearchAction` → `ListViewSearch`), so the query and the picker's
  // displayed field can never disagree. It's fed `resolved.searchField`
  // (the URL/view/collection-default-resolved field `resolveListViewQueryState`
  // already computed — the same value the server would use) rather than
  // re-deriving the qf/view/default fallback chain a second time; the only
  // thing it adds on top is READABILITY filtering, which the server can't
  // apply (it has no per-caller field-access identity to check against) —
  // when `resolved.searchField` IS readable this matches the server
  // exactly; when it isn't, this degrades client-side to the first
  // READABLE entry instead (or `undefined`, when none are readable —
  // `ListViewSearch` renders nothing then, and searching must be a no-op too).
  // A whitespace-only `q` (`"  "`) is also treated as "no search" —
  // `.trim()` here, not on the value actually sent, so a search for a
  // string that's meaningfully all-whitespace stays possible if it's ever
  // needed, while the common "URL still has a stray space" case runs
  // `find` instead of `search`.
  const resolvedSearchField = resolveListViewSearchField({
    collection,
    qf: resolved.searchField,
    fieldPermissions,
  });
  const isSearchActive = resolved.search.trim() !== "" && resolvedSearchField !== undefined;
  const drafts = isVersioned ? true : undefined;

  const columns = useMemo(() => {
    const fieldColumns = getCollectionColumnDefs({ collection, columns: columnEntries }).filter(
      (column) => {
        const key = columnFieldKey(column);
        return key === undefined || canReadField(key);
      },
    );
    // `vex_status` is never in `collection.fields` (it's synthesized, not
    // declared), so it can't flow through the `getCollectionColumnDefs`
    // filter above — gated here instead, the same `canReadField` check
    // (access-system-fields plan, part 2a): a field map that denies
    // "vex_status" (or wildcard-denies and never lists it) must hide the
    // Status column exactly like any other unreadable field, not just the
    // ones `collection.fields` declares.
    const canReadStatus = isVersioned && canReadField(VERSION_SYSTEM_FIELDS.status.slug);
    return canReadStatus
      ? ([buildStatusColumn(columnEntries), ...fieldColumns] as typeof fieldColumns)
      : fieldColumns;
  }, [collection, columnEntries, canReadField, isVersioned]);
  const columnsWithActions = useColumnsWithActions(columns, collection);

  // Decision 47: widened from "hideable columns only" to EVERY readable,
  // field-backed column — the columns menu now also reorders, not just
  // hides, so a non-hideable field still needs a row (disabled,
  // permanently-checked checkbox, but a working drag handle). Filters to
  // `columnFieldKey(c) !== undefined` rather than falling back to `c.id`
  // the way the old mapper did — `select`/`actions` (synthetic, no
  // `accessorKey`) stay excluded this way; `vex_status` (the synthetic
  // versioned-only status column) DOES set `accessorKey` now (Decision 48
  // follow-up, developer-reported: it used to be excluded the same way
  // select/actions are, which meant it could never be resized/pinned/
  // hidden/reordered at all) and so correctly appears here like any real
  // field.
  const columnMenuEntries = useMemo(
    () =>
      columns
        .filter((c) => columnFieldKey(c) !== undefined)
        .map((c) => ({
          field: columnFieldKey(c)!,
          label: (c.meta as { label?: string } | undefined)?.label ?? (c.id as string),
          hideable: c.enableHiding === true,
        })),
    [columns],
  );

  const viewPrefetch = useSavedListViewPrefetch({ collection, urlState, rawConfigViews, sharedViews });

  // Lifted from `CollectionListViewData` (see doc comment above) — both default empty/false,
  // harmless before the first page exists.
  const [liveRows, setLiveRows] = useState<TDoc[]>([]);
  const [isSearchFetching, setIsSearchFetching] = useState(false);

  // Decision 50: relationship/upload filter id -> target document title,
  // seeded server-side (`props.initialFilterValueTitles`) so a filter
  // chip/row never flashes from the raw id. `setFilterValueTitle` is a
  // plain closure (not `useCallback` — no setter in this file's own
  // `ListViewContextProvider` value is, since that object is already
  // recreated every render regardless), called directly by the
  // relationship/upload `FilterInput`s' own picker `onSelect` and their
  // one-shot cold-load fallback query.
  const [filterValueTitles, setFilterValueTitles] = useState<Record<string, string | null>>(
    props.initialFilterValueTitles ?? {},
  );
  function setFilterValueTitle(id: string, title: string | null) {
    setFilterValueTitles((prev) => (prev[id] === title ? prev : { ...prev, [id]: title }));
  }

  const selectedDocs = useMemo(
    () => liveRows.filter((row) => selectedIds.includes(row._id as string)),
    [liveRows, selectedIds],
  );

  return (
    <ListViewContextProvider
      value={{
        collection,
        urlState,
        columns: columnEntries,
        onColumnsChange,
        onColumnsStateChange,
        peekWidth,
        peekWidthTouched: peekWidthTouchedRef.current,
        onPeekWidthChange,
        columnMenuEntries,
        density,
        onDensityChange,
        selection: { selectedIds, selectedDocs, setSelectedIds, canDelete },
        hasActiveView: urlState.view !== undefined,
        activeViewHiddenFilter,
        isSearchFetching: isSearchActive && isSearchFetching,
        onInspect: (id: string) => urlState.setPeek(id),
        viewPrefetch,
        filterValueTitles,
        setFilterValueTitle,
        staleSortField: resolved.staleSortField,
        staleSearchField: resolved.staleSearchField,
        staleFilterField: resolved.staleFilterField,
        effectiveFilterWhere,
      }}
    >
      {/*
       * `ListViewPeek` renders BEFORE `ListViewLayout` deliberately — MUST precede the
       * table in DOM order (developer-reported, live-investigated freeze,
       * Step 13's own digest entry has the full write-up): rendering it
       * AFTER `<ListViewLayout>` (hence after the whole table, later in DOM
       * order) caused a hard input freeze in Chrome — confirmed via a raw
       * CDP `Input.dispatchMouseEvent` that never resolved — specifically
       * when the peek's rich text field first mounted (a genuine Convex
       * document with a `richtext` field, e.g. navigating onto a post
       * whose body isn't empty). Root cause not fully pinned to a single
       * Chrome internal (ruled out: CSS containment — 9 properties tried
       * individually on the panel's own root; visual overlap with the
       * table — tested at 3 non-overlapping geometries; DOM ancestry — a
       * `createPortal` to `document.body` still hung), but DOM ORDER
       * relative to the table is a confirmed, controlled, binary switch:
       * peek-after-table hangs, peek-before-table (identical CSS,
       * identical `position: fixed` placement) is clean. Do not move this
       * below `<ListViewLayout>` and do not portal it to the end of
       * `<body>` without re-confirming against that exact repro first.
       * `ListViewPeek` is a plain `fixed` overlay at every width, never an
       * in-flow flex sibling, so no wrapper is needed for it — and a
       * wrapper around `ListViewLayout` alone turned out actively harmful
       * (see the comment on `ListViewLayout` below).
       */}
      <ListViewPeek
        collection={collection}
        peekId={urlState.peek}
        rows={liveRows}
        onPeekChange={urlState.setPeek}
        width={peekWidth}
        onWidthChange={onPeekWidthChange}
        activeTab={peekTab}
        onActiveTabChange={onPeekTabChange}
      />
      {/*
       * `<ListViewLayout>` renders with no wrapper (developer decision
       * 2026-11-01): a `flex h-full min-h-0 flex-1` row wrapper briefly
       * lived here with `<ListViewLayout>` as its ONLY flex-item child —
       * `ListViewLayout`'s own root also sets `container-type: inline-size`
       * (`@container/list`), and a flex item with `container-type:
       * inline-size` and no explicit `flex-1`/`min-w-0`/`w-full` of ITS
       * OWN collapses to 0 width (no intrinsic content size once
       * containment applies) — the whole list/table disappeared.
       * `ListViewLayout`'s own `h-full` is sufficient on its own, exactly
       * like every step before Step 13.
       */}
      <ListViewLayout
        collection={collection}
        canCreate={canCreate}
        canDelete={canDelete}
        headerExtra={<RevalidateButton collection={collection.slug} />}
        initialPreferences={initialPreferences}
        initialLocalIndex={props.initialLocalIndex}
        tableSlot={
          <QueryErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              // Same frame as the Suspense fallback/settled table below (zero shift,
              // polish fixes Decision 1) — the SAME `DataTable` with `queryError` set
              // instead of `isPending`, rather than a separate error-only layout.
              // Catches the seed `useSuspenseQuery`'s own throw inside
              // `CollectionListViewData` (a dehydrated/live "error"-status query — a
              // stale `?sort=` link's `UNINDEXED_SORT` most commonly), which used to
              // crash past this point entirely before `pagination.error` ever had a
              // chance to run.
              <DataTable
                data={[]}
                columns={columnsWithActions}
                isDone={props.initialSkeletonDone ?? false}
                enableRowSelection
                selectedIds={selectedIds}
                columnEntries={columnEntries}
                density={density}
                pageSize={
                  props.initialSkeletonRowCount ??
                  urlState.size ??
                  collection.admin.view.state.pageSize
                }
                queryError={
                  <ListViewQueryError
                    error={error}
                    collectionLabelPlural={collection.labels.plural.toLowerCase()}
                    onRetry={resetErrorBoundary}
                    sortFieldLabel={resolved.sort?.field}
                    onRemoveSort={() => urlState.setSort(undefined)}
                  />
                }
              />
            )}
          >
            <Suspense
              fallback={
                // Real loading state, not a separate skeleton file: the SAME `DataTable`
                // the settled content renders, with `isPending` driving its own real
                // skeleton rows/footer (this file's sibling change) — same columns, same
                // density. Row count AND footer variant (Decision 49 follow-up, zero footer
                // shift): the cookie-stored `{n, done}` this SAME view last settled with,
                // when known, instead of a fixed `pageSize`/Load-More-height guess — `0` rows
                // renders no skeleton rows and no footer (see `DataTable`'s own `pageSize !==
                // 0` footer guard); no cookie entry falls back to `pageSize` rows / the taller
                // Load More button variant (the safer default when the real footer's shape is
                // genuinely unknown).
                <DataTable
                  data={[]}
                  columns={columnsWithActions}
                  isPending
                  isDone={props.initialSkeletonDone ?? false}
                  enableRowSelection
                  selectedIds={selectedIds}
                  columnEntries={columnEntries}
                  density={density}
                  pageSize={
                    props.initialSkeletonRowCount ??
                    urlState.size ??
                    collection.admin.view.state.pageSize
                  }
                />
              }
            >
              <CollectionListViewData<TDoc>
                collection={collection}
                drafts={drafts}
                isSearchActive={isSearchActive}
                where={resolved.where as VexWhere<CollectionSlug>}
                sort={isSearchActive ? undefined : resolved.sort}
                search={isSearchActive ? resolved.search : ""}
                searchField={resolvedSearchField}
                pageSize={resolved.pageSize}
                resolvedSearch={resolved.search}
                resolvedSortField={resolved.sort?.field}
                fieldPermissions={fieldPermissions}
                canCreate={canCreate}
                columnsWithActions={columnsWithActions as ColumnDef<TDoc>[]}
                urlState={urlState}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                density={density}
                columnEntries={columnEntries}
                onColumnEntriesChange={onColumnsChange}
                activeViewId={activeViewId}
                onRowsChange={setLiveRows}
                onSearchFetchingChange={setIsSearchFetching}
                onCreate={() => setCreateModalOpen(true)}
              />
            </Suspense>
          </QueryErrorBoundary>
        }
      />
    </ListViewContextProvider>
  );
}

/**
 * The data-dependent inner half of {@link CollectionListView}'s split (developer-binding
 * redesign) — everything that needs the actual rows: the live query, the table body +
 * footer (via `DataTable`), empty/error states, and row-hover peek prefetching. Rendered
 * inside its own `<Suspense>` boundary by `CollectionListView`, so a slow query only ever
 * delays THIS subtree, never the shell around it.
 *
 * The seed `useSuspenseQuery`/`useVexListQuery` mechanism (frozen-first-render args, the
 * one-time release to a synthetic non-Convex key) lives in {@link useListViewServerSeed}
 * (sibling file) — see its own doc comment for the full mechanism.
 *
 * @param props - Resolved collection/query/URL-state/selection props lifted
 *   from `CollectionListView`, plus the `onRowsChange`/`onSearchFetchingChange`
 *   callbacks used to report the live page back up to it.
 * @returns The `DataTable` rendering the current page of rows (or its
 *   empty/error state), with row-hover peek prefetching wired onto each row.
 */
function CollectionListViewData<TDoc extends TDocument = TDocument>(props: {
  collection: CollectionConfig;
  drafts: boolean | undefined;
  isSearchActive: boolean;
  where: VexWhere<CollectionSlug> | undefined;
  sort: CollectionTableSort<string> | undefined;
  search: string;
  searchField: string | undefined;
  pageSize: number;
  resolvedSearch: string;
  resolvedSortField: string | undefined;
  fieldPermissions: ResolvedFieldPermissions;
  canCreate: boolean;
  columnsWithActions: ColumnDef<TDoc>[];
  urlState: UseListViewUrlStateReturn;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  density: ListDensity;
  columnEntries: ColumnEntry<string>[];
  onColumnEntriesChange: (columns: ColumnEntry<string>[]) => void;
  /** The active view's id (Decision 45's `"default"` included) — scopes the row-count cookie write below (Decision 49 follow-up) per view. */
  activeViewId: string;
  onRowsChange: (rows: TDoc[]) => void;
  onSearchFetchingChange: (fetching: boolean) => void;
  onCreate: () => void;
}) {
  const config = useVexConfig();

  // The seed `useSuspenseQuery`/frozen-key release mechanism and the live `useVexListQuery`
  // call it feeds both live in `useListViewServerSeed` (sibling file) — see its own doc
  // comment for the full seed/release/`activeSeedOptions` mechanism.
  const pagination = useListViewServerSeed<TDoc>({
    collection: props.collection,
    drafts: props.drafts,
    isSearchActive: props.isSearchActive,
    where: props.where,
    sort: props.sort,
    search: props.search,
    searchField: props.searchField,
    pageSize: props.pageSize,
  });

  // Draft-pair pagination fix: `find`/`search` already merge a versioned collection's linked
  // draft back onto its published row per page (`collections/mergeDraftCounterparts.ts`,
  // core), so `pagination.results` is already one row per logical document — no client-side
  // collapse pass needed. The ternary is a type-only identity cast (not a real branch): it
  // keeps the same union shape `ListViewPeek`/`ListViewLayout`'s shared generic already inferred
  // (versioned rows additionally typed with `hasUnpublishedChanges`, set server-side; a
  // non-versioned collection's rows are never read through it, since `buildStatusColumn`
  // isn't in `columnsWithActions` then).
  const rows = (
    props.collection.versions.drafts
      ? (pagination.results as (TDoc & { hasUnpublishedChanges: boolean })[])
      : pagination.results
  ) as TDoc[];

  // `pagination.results` is a fresh `.slice()` every render (`usePaginatedQuery`'s own
  // `visibleResults`), never referentially stable even with identical data — calling
  // `onRowsChange` (lifts state to the parent) on every render would loop forever (parent
  // re-renders → this re-renders → "new" `rows` reference → effect fires again). Only call
  // it when the actual row IDENTITY (ids, in order) changes.
  const rowIdsKey = rows.map((row) => row._id).join(",");
  // The write-guard key also includes `isDone` — a Load More click can flip `isDone` from
  // `false` to `true` on its LAST page while leaving the FIRST page's row ids unchanged in
  // rare cases (e.g. a `pageSize`-exact total), and the footer's own skeleton variant
  // (Decision 49 follow-up: zero footer shift) depends on `isDone`, not just row identity.
  const settleKey = `${rowIdsKey}|${pagination.isDone}`;
  const lastSettleKeyRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastSettleKeyRef.current === settleKey) return;
    const rowIdsChanged = lastSettleKeyRef.current?.split("|")[0] !== rowIdsKey;
    lastSettleKeyRef.current = settleKey;
    if (rowIdsChanged) props.onRowsChange(rows);
    // Decision 49 follow-up (developer decision): the NEXT server render's loading skeleton
    // reads this to show the SAME row count AND footer variant (Load More vs "That's
    // everything") this view just settled with, instead of a fixed `pageSize`/Load-More-height
    // guess — written only once a result has genuinely settled (never during `isPending`,
    // which would persist a stale/placeholder count), capped at `pageSize` (a defensive clamp —
    // `pagination.results` should never exceed it, but the cookie's own contract promises a
    // capped value regardless of how it got here).
    if (!pagination.isPending) {
      writeListViewSkeletonRowCountCookie({
        basePath: config.basePath,
        collectionSlug: props.collection.slug,
        viewId: props.activeViewId,
        count: Math.min(rows.length, props.pageSize),
        done: pagination.isDone,
      });
    }
  }, [settleKey, pagination.isPending]);
  // `isSettling`, not `isFetching` (developer-reported regression fix, 2026-11-01): the
  // real Convex client pushes a live update straight into the query cache via its own
  // websocket subscription rather than through a tracked refetch, so `isFetching` can read
  // `false` for the ENTIRE duration of a visible search/sort/filter-driven row swap — see
  // `usePaginatedQuery.ts`'s own `isFetching`/`isSettling` doc comments. `isSettling` is
  // derived from `results` itself having been synced for the current query identity, so it
  // works identically for both the real client and the fake test backend.
  useEffect(() => {
    props.onSearchFetchingChange(pagination.isSettling);
  }, [pagination.isSettling]);

  const prefetch = useListViewPeekPrefetch({
    collection: props.collection,
    rows,
    peekId: props.urlState.peek,
  });

  const emptyState = useMemo(() => {
    if (pagination.error || !pagination.isDone || rows.length > 0) return undefined;
    if (props.isSearchActive) {
      const readable = readableListViewSearchFields({
        collection: props.collection,
        fieldPermissions: props.fieldPermissions,
      });
      const otherField = readable.find((f) => f !== props.searchField);
      return (
        <ListViewEmptyState
          variant="noSearchResults"
          collectionLabelPlural={props.collection.labels.plural.toLowerCase()}
          collectionLabelSingular={props.collection.labels.singular.toLowerCase()}
          searchQuery={props.resolvedSearch}
          searchFieldLabel={props.searchField}
          otherSearchFieldLabel={otherField}
          onSearchOtherField={otherField ? () => props.urlState.setQf(otherField) : undefined}
          onClearSearch={() => props.urlState.setQ("")}
        />
      );
    }
    if (props.where !== undefined) {
      return (
        <ListViewEmptyState
          variant="noFilterResults"
          collectionLabelPlural={props.collection.labels.plural.toLowerCase()}
          collectionLabelSingular={props.collection.labels.singular.toLowerCase()}
          onClearFilters={() => props.urlState.setFilter(undefined)}
        />
      );
    }
    return (
      <ListViewEmptyState
        variant="empty"
        collectionLabelPlural={props.collection.labels.plural.toLowerCase()}
        collectionLabelSingular={props.collection.labels.singular.toLowerCase()}
        canCreate={props.canCreate}
        onCreate={props.onCreate}
      />
    );
  }, [
    pagination.error,
    pagination.isDone,
    rows.length,
    props.isSearchActive,
    props.searchField,
    props.resolvedSearch,
    props.where,
    props.collection,
    props.fieldPermissions,
    props.canCreate,
    props.onCreate,
  ]);

  // `pagination.error` is a LIVE re-fetch error (the client's own `useVexListQuery`, e.g.
  // after a successful initial load and a later Retry/interaction failing) — the SEED
  // query's own dehydrated/live error (the common case: a stale `?sort=` link's
  // `UNINDEXED_SORT`, or the server's own prefetch failing) is caught further up by
  // `QueryErrorBoundary` (polish fixes, Decision 1) wrapping this component's `<Suspense>`
  // boundary, which never lets this component mount at all on that path — no
  // `initialQueryError` prop/ref-latching mechanism needed here anymore (that mechanism
  // never actually ran in practice: the seed `useSuspenseQuery` above throws synchronously,
  // server AND client, before this line could ever execute on an error).
  const queryError =
    pagination.error !== undefined ? (
      <ListViewQueryError
        error={pagination.error}
        collectionLabelPlural={props.collection.labels.plural.toLowerCase()}
        onRetry={pagination.retry}
        sortFieldLabel={props.resolvedSortField}
        onRemoveSort={() => props.urlState.setSort(undefined)}
      />
    ) : undefined;

  return (
    <DataTable
      highlightedRowId={props.urlState.peek}
      data={rows}
      columns={props.columnsWithActions}
      isDone={pagination.isDone}
      isPending={pagination.isPending}
      onLoadMore={pagination.loadMore}
      isLoadingMore={pagination.isPending}
      totalCount={pagination.totalDocs}
      totalDocsCapped={pagination.totalDocsCapped}
      enableRowSelection
      selectedIds={props.selectedIds}
      onSelectionChange={props.setSelectedIds}
      sort={props.urlState.q ? undefined : props.urlState.sort}
      onSortChange={props.urlState.setSort}
      sortDisabled={!!props.urlState.q}
      columnEntries={props.columnEntries}
      onColumnEntriesChange={props.onColumnEntriesChange}
      density={props.density}
      pageSize={props.urlState.size ?? props.collection.admin.view.state.pageSize}
      emptyState={emptyState}
      queryError={queryError}
      isRefetching={pagination.isSettling || props.urlState.isQueryPending}
      getRowProps={(row) => ({
        onPointerEnter: () => prefetch.onRowPointerEnter(row._id),
        onPointerLeave: () => prefetch.onRowPointerLeave(),
        onFocus: () => prefetch.onRowFocus(row._id),
        // Developer-requested (2026-11-01): double-click opens the Inspect
        // peek for this row (switches it, if one is already open — `setPeek`
        // always replaces the current target). Guarded against the
        // selection checkbox, a cell's own link, and the row's ⋯
        // actions-menu trigger — double-clicking any of those keeps doing
        // exactly what a single click there already does, never ALSO opens
        // the peek. A single click on anything else is unaffected: this
        // table never had its own row-level click handler before.
        onDoubleClick: (event) => {
          if (isInteractiveRowTarget(event.target)) return;
          props.urlState.setPeek(row._id);
        },
      })}
    />
  );
}
