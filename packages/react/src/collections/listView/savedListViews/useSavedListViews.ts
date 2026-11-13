"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import {
  columnEntriesEqual,
  completeListViewColumnOrder,
  CRUD_ACTIONS,
  isFieldReadable,
  isSearchFieldValid,
  isSortFieldValid,
  PERMISSION_SCOPES,
  splitWhereByReadability,
  toClientSavedListViewConfig,
  VEX_VIEW_SOURCES,
  type ColumnEntry,
  type CollectionConfig,
  type CollectionSlug,
  type ResolvedFieldPermissions,
  type VexClientViewConfig,
  type VexStoredView,
  type VexViewConfig,
  type VexViewSource,
  type VexWhereNodeOf,
} from "@vexcms/core";
import type { LocalSavedListViewsIndexEntry } from "@vexcms/core";
import { listViews } from "../../api/listViews/client";
import { useFieldPermissions } from "../../../access";
import { useVexConfig } from "../../../config/VexConfigContext";
import { useLocalSavedListViews } from "./localSavedListViewsStore";

/** One merged saved view, display-ready. */
export interface SavedListViewEntry<TFieldSlug extends string = string> {
  viewId: string;
  name: string;
  description?: string;
  where: VexViewConfig<TFieldSlug>["state"]["where"];
  /** The portion of `where` safe to show the current caller — a read-only, non-removable chip for `config`/`default` sources (whose OWN `where` stays locked, never user-editable regardless of readability), a normal EDITABLE chip for `shared`/`local` (always the caller's own `where` for `local`, which is never hidden by construction). Computed by {@link splitWhereByReadability} for `config`/`default`/`shared`; always equal to `where` for `local`. */
  visibleWhere?: VexWhereNodeOf<unknown>;
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  search?: string;
  searchField?: TFieldSlug;
  /** The view's FULL column list, always complete — every one of the collection's own data fields, exactly once, in display order, each a {@link ColumnEntry} (possibly carrying `width`/`pinned`/`hidden` overrides), via `completeListViewColumnOrder`. `diffViewState` compares this element-for-element, order-sensitive, per-entry-deep-equal (`columnEntriesEqual`) — order, width, pin, AND hidden state all factor into "is this view modified" with one check, replacing an earlier separate order-only `columnOrder` plus set-equality `columns`. */
  columns: ColumnEntry<TFieldSlug>[];
  pageSize?: number;
  /** The peek panel's saved width in px — `undefined` means this view never saved an explicit width, inheriting whatever's currently in the `vex-admin:<collection>` cookie. */
  peekWidth?: number;
  source: VexViewSource;
  createdBy?: string;
  hasHiddenFilter: boolean;
  hiddenFilterCount: number;
  /**
   * `true` ONLY for a `local`-source cookie-index placeholder
   * ({@link toIndexEntry} — before `localStorage` hydrates).
   * `where === undefined`/`sort === undefined` alone can't distinguish a
   * placeholder from a REAL, fully-loaded local view that simply never
   * declared explicit state (`state: {}`, a valid, common case — "no
   * explicit value means inherit defaults") — both shapes are
   * structurally identical otherwise, so this explicit flag is the only
   * reliable signal. `undefined` (falsy) for every other entry — default,
   * config, shared, and a REAL local view alike.
   */
  isPlaceholder?: boolean;
}

/** A merged view's resolved runtime state — the live query/sort/filter/column/page-size values `ListView` applies and diffs against, independent of which `SavedListViewEntry` they came from. */
export interface ListViewStateSnapshot<TFieldSlug extends string = string> {
  search: string | undefined;
  searchField: TFieldSlug | undefined;
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  where: VexViewConfig<TFieldSlug>["state"]["where"];
  /** The FULL column list — every data field, exactly once, in display order, each a {@link ColumnEntry}. */
  columns: ColumnEntry<TFieldSlug>[];
  pageSize: number;
  /** The peek panel's current width in px — the cookie's live value, compared against the active view's own saved `peekWidth` the SAME way `pageSize` is. */
  peekWidth: number;
}

/**
 * The state captured for an in-progress "Save as new"/"Rename"/"Save as
 * copy" dialog (`SavedListViewTabs.tsx`'s `PendingSaveDialog`,
 * `ListViewModifiedControls.tsx`'s `PendingCopyDialog`) — identical to
 * {@link ListViewStateSnapshot} except `peekWidth`, which is optional
 * here: a view
 * being created/renamed from one with no saved width of its own keeps
 * `peekWidth` entirely unset UNLESS the user explicitly resized the peek
 * while on it, rather than always carrying the live (possibly unrelated,
 * merely-remembered) value the way every OTHER field here does.
 */
export type PendingViewSaveState<TFieldSlug extends string = string> = Omit<
  ListViewStateSnapshot<TFieldSlug>,
  "peekWidth"
> & {
  peekWidth: number | undefined;
};

/** Props for {@link useSavedListViews}. */
export interface UseSavedListViewsProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  collection: TCollectionSlug;
  /**
   * The shared views `NextAdminPage` prefetched server-side —
   * seeds `useQuery`'s `initialData`, so the first client render
   * reuses the server's `listViews` result instead of starting `isPending`.
   * `undefined` on a client-only mount (tests, Storybook).
   */
  initialViews?: VexStoredView[];
  /**
   * The consolidated `vex-admin:<collection>` cookie's `localViews` field, read on
   * the server — tabs for these render on first
   * paint even before `localStorage` hydrates. Entries here carry only
   * `{ viewId, name }`; `useLocalSavedListViews`'s real `localStorage` read
   * supersedes this the moment it resolves client-side.
   */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
}

/** Return shape of {@link useSavedListViews}. */
export interface UseSavedListViewsResult<TFieldSlug extends string = string> {
  views: SavedListViewEntry<TFieldSlug>[];
  project: string;
  isPending: boolean;
  /** Whether the shared-views query's last attempt failed — drives the "Couldn't load shared views" toast, now surfaced by a plain `useEffect` in `SavedListViewTabs.tsx` rather than a `<QueryErrorBoundary>` (the Suspense split this used to require no longer exists — `NextAdminPage`'s `listViews` prefetch is unconditionally awaited, so there is no more "resolves later" case to stream in). */
  isError: boolean;
  /** The shared-views query's error, when {@link isError} is `true`. */
  error: unknown;
  /** Re-attempts the shared-views query directly (TanStack Query's own `refetch`) — the "Couldn't load shared views" toast's Retry action. */
  refetch: () => void;
  /**
   * This collection's `admin.views` (config source), `where` intact —
   * the raw shape `resolveListViewQueryState` (`@vexcms/core`) needs
   * as its `configView` input to compose a hidden filter with the caller's
   * own. Distinct from `views`' own config entries, which are projected
   * through `toClientSavedListViewConfig` and have `where` stripped.
   * The resolved DEFAULT view (`admin.view`) needs no equivalent raw field
   * here — `resolveListViewQueryState` reads `collection.admin.view` directly
   * off the `CollectionConfig` it already receives.
   */
  rawConfigViews: VexViewConfig<TFieldSlug>[];
  /**
   * The live `vex_views` query result (shared source), unmerged — the raw
   * shape `resolveListViewQueryState`'s `sharedView` input needs. Distinct from
   * `views`' own shared entries, which are display-projected.
   */
  sharedViews: VexStoredView<TFieldSlug>[];
  /**
   * The resolved `CollectionConfig`, `undefined` only for an unknown slug.
   * Exposed so `resolveEffectiveViewState`'s
   * `collection` prop — needed to validate a stale `sort`/`searchField` —
   * can be threaded straight from this hook's own result, without a
   * second `config.collections.find(...)` lookup in every consumer.
   */
  collection: CollectionConfig | undefined;
}

function toEntry<TFieldSlug extends string>(props: {
  view: (VexStoredView<TFieldSlug> | VexViewConfig<TFieldSlug>) & { createdBy?: string };
  source: Exclude<VexViewSource, "config">;
  collection: CollectionConfig | undefined;
  /**
   * The caller's resolved field-read permissions — used ONLY for a
   * `shared` source: a condition in the view's own saved `where` naming a
   * field this caller can't read is split OUT of `visibleWhere` and
   * counted into `hiddenFilterCount` (same convention
   * `toClientSavedListViewConfig`'s config-view branch already uses, via
   * the SAME shared `splitWhereByReadability`), so `SavedListViewHiddenFilterBadge`
   * surfaces it — the SAME "declared filter, applied regardless, never
   * shown as values" treatment a config view's hidden `where` already
   * gets (`resolveListViewQueryState.ts`'s own `isSharedViewActive`
   * exemption is the OTHER half of this fix — the filter stays APPLIED;
   * this half makes its READABLE portion VISIBLE as an editable chip, and
   * only its unreadable portion a lock, instead of either showing nothing
   * or hiding the whole tree the moment ANY one condition is unreadable).
   * Never applied to `local` — a local view's own filter is the user's
   * own, live-editable URL state, never "hidden" by construction, so
   * `visibleWhere` always equals `where` for it.
   */
  fieldPermissions?: ResolvedFieldPermissions;
}): SavedListViewEntry<TFieldSlug> {
  const where = props.view.state.where;
  const split =
    props.source === VEX_VIEW_SOURCES.shared && props.fieldPermissions !== undefined && where !== undefined
      ? splitWhereByReadability(where, (field) => isFieldReadable(props.fieldPermissions!, field))
      : undefined;
  return {
    viewId: props.view.viewId,
    name: props.view.name,
    description: props.view.description,
    where: props.view.state.where,
    visibleWhere: split === undefined ? where : split.visible,
    sort: props.view.state.sort,
    search: props.view.state.search,
    searchField: props.view.state.searchField,
    columns:
      props.collection === undefined
        ? []
        : completeListViewColumnOrder({
            // A view that never declared explicit `columns` at all (as
            // opposed to a PARTIAL array — that's `completeListViewColumnOrder`'s
            // own back-compat job below) means "inherit the collection's
            // default columns", not "show nothing" — falls back to the
            // collection's own resolved default (every non-hidden field,
            // visible, bare-slug entries) rather than letting
            // `completeListViewColumnOrder({order: undefined, …})`'s own
            // "nothing named → every field explicitly hidden" rule apply
            // here (that rule exists for migrating an OLD view's
            // genuinely-partial `columns`, not for a view that's simply
            // silent on columns altogether — this
            // conflation falsely flagged "Modified: columns" on every
            // such view, and Reset hid every column on one instead of
            // restoring the collection default).
            order: props.view.state.columns ?? (props.collection.admin.view.state.columns as ColumnEntry<TFieldSlug>[]),
            collection: props.collection,
          }),
    pageSize: props.view.state.pageSize,
    peekWidth: props.view.state.peekWidth,
    source: props.source,
    createdBy: props.view.createdBy,
    hasHiddenFilter: (split?.hiddenCount ?? 0) > 0,
    hiddenFilterCount: split?.hiddenCount ?? 0,
  };
}

/**
 * A bare `{ viewId, name }` index entry, projected into display shape until the real local view loads.
 * @param entry - The cookie-sourced `{ viewId, name }` placeholder from `initialLocalIndex`.
 * @param collection - Resolves the full field-declaration order for `columns` — `undefined` only when the collection itself wasn't found.
 * @returns A placeholder `SavedListViewEntry` (`source: "local"`, `isPlaceholder: true`) with no `where`/`sort` and the collection's default columns.
 */
function toIndexEntry<TFieldSlug extends string>(
  entry: LocalSavedListViewsIndexEntry,
  collection: CollectionConfig | undefined,
): SavedListViewEntry<TFieldSlug> {
  return {
    viewId: entry.viewId,
    name: entry.name,
    where: undefined,
    sort: undefined,
    columns:
      collection === undefined
        ? []
        : completeListViewColumnOrder({ order: collection.admin.view.state.columns as ColumnEntry<TFieldSlug>[], collection }),
    source: VEX_VIEW_SOURCES.local,
    isPlaceholder: true,
    hasHiddenFilter: false,
    hiddenFilterCount: 0,
  };
}

/**
 * Projects the resolved default ("All") view (`admin.view`, read straight off the
 * `CollectionConfig`) from its raw `VexClientViewConfig` shape into the display-ready
 * `SavedListViewEntry` shape every OTHER merged entry already has — shared by
 * {@link mergeListViews} (the merge's own entry #0) and any caller that
 * needs a `SavedListViewEntry` for the default view WITHOUT going through the
 * full merge (e.g. `SavedListViewTabs`' non-suspending shell, which only reads
 * `useSavedListViewsCommon`'s raw `defaultView` — never the shared-views query
 * — but still needs `applyView`-compatible shape for its "switch to
 * default" fallbacks).
 *
 * @param defaultView - `useSavedListViewsCommon`'s raw `defaultView` — `undefined` only when the collection itself wasn't found (an unknown slug).
 * @param collection - Resolves the full field-declaration order for `columns` — `undefined` only when the collection itself wasn't found.
 * @returns The default view's `SavedListViewEntry`, or `undefined` when `defaultView` is.
 */
export function toDefaultEntry<TFieldSlug extends string>(
  defaultView: VexClientViewConfig<TFieldSlug> | undefined,
  collection: CollectionConfig | undefined,
): SavedListViewEntry<TFieldSlug> | undefined {
  if (defaultView === undefined) return undefined;
  return {
    viewId: defaultView.viewId,
    name: defaultView.name,
    description: defaultView.description,
    where: undefined,
    visibleWhere: defaultView.visibleWhere,
    sort: defaultView.state.sort,
    search: defaultView.state.search,
    searchField: defaultView.state.searchField,
    columns:
      collection === undefined
        ? []
        : completeListViewColumnOrder({ order: defaultView.state.columns, collection }),
    pageSize: defaultView.state.pageSize,
    peekWidth: defaultView.state.peekWidth,
    source: VEX_VIEW_SOURCES.default,
    hasHiddenFilter: defaultView.hasHiddenFilter,
    hiddenFilterCount: defaultView.hiddenFilterCount,
  };
}

function mergeListViews<TFieldSlug extends string>(props: {
  /** The resolved default ("All") view, display-projected — `undefined` only when the collection itself wasn't found (an unknown slug). */
  defaultView?: VexClientViewConfig<TFieldSlug>;
  config: VexClientViewConfig<TFieldSlug>[];
  shared: VexStoredView<TFieldSlug>[];
  local: VexViewConfig<TFieldSlug>[];
  localIndex: LocalSavedListViewsIndexEntry[];
  /**
   * Whether `local` has definitely been read from `localStorage` at least
   * once this page load (post-hydration-resync, see {@link useIsHydrated})
   * — `false` only during SSR and the very first (hydration-matching)
   * client render, when `local` is still the `[]` placeholder even if real
   * local views exist. Gates whether a `localIndex` entry with no matching
   * `local` view is trusted as "not hydrated yet" (pre-hydration, keep the
   * placeholder) or treated as deleted (post-hydration, drop it) —
   * deleting a local view left its cookie-index
   * entry's placeholder tab on screen until a full page refresh, since
   * `localIndex` is an immutable server-read snapshot that never updates
   * mid-session and previously always won a missing id.
   */
  localHydrated: boolean;
  /** Resolves the full field-declaration order for `columns` — `undefined` only when the collection itself wasn't found (an unknown slug). */
  collection: CollectionConfig | undefined;
  /** The caller's resolved field-read permissions — forwarded to `toEntry` for a `shared` view's own hidden-filter badge. */
  fieldPermissions?: ResolvedFieldPermissions;
}): SavedListViewEntry<TFieldSlug>[] {
  const merged = new Map<string, SavedListViewEntry<TFieldSlug>>();
  const columns = (order: ColumnEntry<TFieldSlug>[] | undefined): ColumnEntry<TFieldSlug>[] =>
    props.collection === undefined
      ? []
      : completeListViewColumnOrder({
          // Same "undeclared means inherit the collection default, not
          // completeListViewColumnOrder's own hidden-fill rule" fix as `toEntry`'s
          // own doc comment explains.
          order: order ?? (props.collection.admin.view.state.columns as ColumnEntry<TFieldSlug>[]),
          collection: props.collection,
        });
  // The default view is always entry #0 — its `viewId`
  // ("default") is reserved and unique by construction (`validateSavedListViewConfig`),
  // so nothing below ever collides with or overrides it.
  const defaultEntry = toDefaultEntry(props.defaultView, props.collection);
  if (defaultEntry !== undefined) merged.set(defaultEntry.viewId, defaultEntry);
  // `listViews`'s own server doc comment: "unordered" — `.withIndex(...).collect()` with no
  // `.order()` secondary key doesn't guarantee the SAME row order across two SEPARATE
  // executions of the query against IDENTICAL data (confirmed live: a hydration mismatch —
  // "this tree will be regenerated on the client" — between `NextAdminPage`'s server-side
  // `fetchQuery` snapshot and the client's own live Convex subscription for the SAME
  // unchanged shared-views set, surfaced by the shell-streaming follow-up now that the
  // server no longer threads one shared JS array reference straight through as `initialData`
  // — two INDEPENDENT query executions can legitimately come back in different orders).
  // Sorted by `viewId` (a Convex document id — stable, always present, and roughly
  // chronological in practice) so the RENDERED tab order is deterministic regardless of
  // which order the backend happens to return rows in, eliminating the mismatch outright
  // rather than relying on React's hydration-failure recovery to paper over it.
  for (const view of [...props.shared].sort((a, b) => (a.viewId < b.viewId ? -1 : a.viewId > b.viewId ? 1 : 0))) {
    merged.set(
      view.viewId,
      toEntry({ view, source: VEX_VIEW_SOURCES.shared, collection: props.collection, fieldPermissions: props.fieldPermissions }),
    );
  }
  // The cookie index fills in tabs for local views that
  // haven't hydrated from `localStorage` yet — before hydration,
  // `props.local` is `[]`, so without this every local-view tab would
  // flash in after mount, which is the layout shift this spec eliminates.
  // Once hydrated (`localHydrated`), `props.local` is authoritative — an
  // index entry with no matching real view is a DELETED one (the cookie
  // snapshot is static for the rest of the page load), not an unhydrated
  // one, and is skipped rather than kept as a ghost placeholder tab.
  const realLocalIds = new Set(props.local.map((view) => view.viewId));
  for (const entry of props.localIndex) {
    if (props.localHydrated && !realLocalIds.has(entry.viewId)) continue;
    if (!merged.has(entry.viewId)) merged.set(entry.viewId, toIndexEntry(entry, props.collection));
  }
  for (const view of props.local) {
    if (!merged.has(view.viewId) || merged.get(view.viewId)?.source === VEX_VIEW_SOURCES.local) {
      merged.set(view.viewId, toEntry({ view, source: VEX_VIEW_SOURCES.local, collection: props.collection }));
    }
  }
  for (const view of props.config) {
    if (!merged.has(view.viewId)) {
      merged.set(view.viewId, {
        viewId: view.viewId,
        name: view.name,
        description: view.description,
        where: undefined,
        visibleWhere: view.visibleWhere,
        sort: view.state.sort,
        search: view.state.search,
        searchField: view.state.searchField,
        columns: columns(view.state.columns),
        pageSize: view.state.pageSize,
        peekWidth: view.state.peekWidth,
        source: VEX_VIEW_SOURCES.config,
        hasHiddenFilter: view.hasHiddenFilter,
        hiddenFilterCount: view.hiddenFilterCount,
      });
    }
  }
  return [...merged.values()];
}

/**
 * Whether `local` views (via {@link useLocalSavedListViews}) have definitely been
 * read from `localStorage` at least once this page load — `false` during
 * SSR and the very first (hydration-matching) client render, `true` from
 * the next commit onward. `useSyncExternalStore`-based, same mechanism and
 * timing `useLocalSavedListViews`'s own hook uses, so by the time this flips `true`
 * `useLocalSavedListViews`'s return value is guaranteed to already be the real,
 * resynced one (both resync in the SAME commit, before any effect runs) —
 * required for {@link mergeListViews}'s `localHydrated` gate to never prune
 * a real, not-yet-read local view's placeholder (which would reintroduce
 * the mount-flash the cookie index exists to prevent).
 * @returns `false` during SSR and the first client render, `true` once `useSyncExternalStore` has resynced post-hydration.
 */
function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * The config/default/local-view plumbing {@link useSavedListViews} shares with every other
 * caller that needs the resolved collection/config/local/default-view pieces, independent
 * of the shared-views query itself (which {@link useSavedListViews} alone reads).
 * @param props - `collection`, plus the server-prefetched `initialViews`/`initialLocalIndex`.
 * @returns The resolved `collection`, its raw/`toClientSavedListViewConfig`-projected config views, the projected `defaultView`, `localViews` (via {@link useLocalSavedListViews}), `localHydrated`, and the active Convex `project` URL.
 */
export function useSavedListViewsCommon<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
>(props: UseSavedListViewsProps<TCollectionSlug>) {
  const config = useVexConfig();
  const convex = useConvex();
  const collection = config.collections.find((c) => c.slug === props.collection);
  // Forwarded to `toClientSavedListViewConfig` (config/default views) and
  // `mergeListViews` → `toEntry` (shared views) so a condition naming a
  // field THIS caller can't read is the ONLY thing that ever flips
  // `hasHiddenFilter` on — a condition on a readable field stays a
  // visible chip regardless of source.
  const fieldPermissions = useFieldPermissions({
    resource: collection?.slug ?? "",
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });
  const rawConfigViews = useMemo(
    () => (collection?.admin.views ?? []) as VexViewConfig<TFieldSlug>[],
    [collection?.admin.views],
  );
  const configViews = useMemo(
    () =>
      rawConfigViews.map((view) =>
        toClientSavedListViewConfig(view, (field) => isFieldReadable(fieldPermissions, field)),
      ) as VexClientViewConfig<TFieldSlug>[],
    [rawConfigViews, fieldPermissions],
  );
  const defaultView = useMemo(
    () =>
      collection === undefined
        ? undefined
        : (toClientSavedListViewConfig(
            collection.admin.view as VexViewConfig<TFieldSlug>,
            (field) => isFieldReadable(fieldPermissions, field),
          ) as VexClientViewConfig<TFieldSlug>),
    [collection?.admin.view, fieldPermissions],
  );
  const localViews = useLocalSavedListViews({
    basePath: config.basePath,
    project: convex.url,
    collection: props.collection,
  }) as VexViewConfig<TFieldSlug>[];
  const localHydrated = useIsHydrated();
  return { collection, rawConfigViews, configViews, defaultView, localViews, localHydrated, fieldPermissions, project: convex.url };
}

/**
 * Reads and merges a collection's saved views: the resolved `default`
 * ("All") view (`admin.view`, read straight off the
 * bundled client config and projected through `toClientSavedListViewConfig` right
 * here — the SAME client-safe projection a `config` entry gets), `config`
 * (`admin.views`, read straight off the bundled client config and
 * projected through `toClientSavedListViewConfig`), `shared`
 * (`vex_views`, live-subscribed via `listViews`, seeded from
 * `props.initialViews` when the server prefetched it), and
 * `local` (this browser's `localStorage` via `useLocalSavedListViews`, seeded for
 * first paint by `props.initialLocalIndex`'s cookie-backed index).
 *
 * A plain `useQuery` for the shared-views slice, seeded by the dehydrated cache
 * `NextAdminPage`'s now-unconditionally-awaited `listViews` prefetch populates
 * (reverted the earlier un-awaited/streamed
 * version, which committed SSR "pending" into the HTML and hydrated with fresher
 * client data, a confirmed "Hydration failed" error) — by the time ANY caller
 * renders, the cache already has `status: "success"` data, so `isPending` is
 * already `false` on the very first render; no Suspense/streaming split is
 * needed anymore (removed — `useListViewsSuspense`/`useListViewsFallback` used
 * to exist here specifically to stream shared views in once the un-awaited
 * prefetch settled; that case no longer exists, and the nested `<Suspense>`
 * boundary it required turned out to have its OWN cost: React's streaming SSR
 * ships a nested boundary's fallback in the FIRST flush and the resolved
 * content as a later chunk even when the data is already synchronously
 * available — confirmed live via a JS-disabled curl/browser check, the exact
 * flash the view-switcher trigger's "always show the active view's name" fix
 * needed NOT to have).
 *
 * @param props - See {@link UseSavedListViewsProps}.
 * @returns The merged view list (default view first), the current project
 *   key, whether the shared-views query is still pending, its error state,
 *   and the raw `config`/`shared` source lists `resolveListViewQueryState`
 *   (`@vexcms/core`) needs to resolve the active view's own hidden
 *   filter/state for query-building — `views`' own merged entries are
 *   display-projected and unsuitable for that (a config/default entry's
 *   `where` is stripped).
 */
export function useSavedListViews<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
>(props: UseSavedListViewsProps<TCollectionSlug>): UseSavedListViewsResult<TFieldSlug> {
  const common = useSavedListViewsCommon<TCollectionSlug, TFieldSlug>(props);
  const sharedQuery = useQuery({
    ...listViews({ collection: props.collection }),
    initialData: props.initialViews as VexStoredView<TFieldSlug>[] | undefined,
  });
  const sharedViews = (sharedQuery.data ?? []) as VexStoredView<TFieldSlug>[];
  // Forwarded to `mergeListViews` →
  // `toEntry` so a SHARED view's own saved `where` naming a field THIS
  // caller can't read is split OUT into `hiddenFilterCount` instead of
  // silently applying with no visible indication at all — resolved
  // ONCE in `useSavedListViewsCommon`, shared with its own `configViews`/
  // `defaultView` projection so every source agrees about what's readable.
  const fieldPermissions = common.fieldPermissions;

  const views = useMemo(
    () =>
      mergeListViews({
        defaultView: common.defaultView,
        config: common.configViews,
        shared: sharedViews,
        local: common.localViews,
        localIndex: props.initialLocalIndex ?? [],
        localHydrated: common.localHydrated,
        collection: common.collection,
        fieldPermissions,
      }),
    [
      common.defaultView,
      common.configViews,
      sharedViews,
      common.localViews,
      common.localHydrated,
      props.initialLocalIndex,
      common.collection,
      fieldPermissions,
    ],
  );

  return {
    views,
    project: common.project,
    isPending: sharedQuery.isPending,
    isError: sharedQuery.isError,
    error: sharedQuery.error,
    refetch: () => void sharedQuery.refetch(),
    rawConfigViews: common.rawConfigViews,
    sharedViews,
    collection: common.collection,
  };
}

/** How the active view's state diverges from its saved baseline — drives the modified-state Save/Reset UI. */
export type ListViewDiffCategory = "search" | "sort" | "filters" | "columns" | "pageSize" | "peekWidth";

/** The categories a view's live state has diverged from its saved baseline in, plus how many leaf `where` conditions the live state's filter tree has. */
export interface ListViewDiff {
  categories: ListViewDiffCategory[];
  filterCount: number;
}

/**
 * Recursively counts leaf filter conditions in a `where` tree — `and`/`or` nodes sum their children's counts, a `not` node delegates to its single child, and any other (leaf) node counts as `1`; `undefined`/`null` counts as `0`.
 * @param node - A `where`-tree node (an `and`/`or`/`not` combinator, a leaf condition, or `undefined`/`null`).
 * @returns The number of leaf conditions `node` contains.
 */
function countWhereConditions(node: unknown): number {
  if (node === undefined || node === null) return 0;
  if (node !== null && typeof node === "object") {
    if ("and" in node && Array.isArray(node.and)) {
      return node.and.reduce((sum: number, c: unknown) => sum + countWhereConditions(c), 0);
    }
    if ("or" in node && Array.isArray(node.or)) {
      return node.or.reduce((sum: number, c: unknown) => sum + countWhereConditions(c), 0);
    }
    if ("not" in node) return countWhereConditions(node.not);
  }
  return 1;
}

/**
 * Compares the active view's live state against its saved baseline and
 * reports which categories (search, sort, filters, columns, pageSize)
 * differ, plus the live `where`'s leaf filter count — drives the
 * modified-state Save/Reset UI and its filter-count badge.
 * @param props.current - The live, resolved `ListViewStateSnapshot`.
 * @param props.saved - The active view's saved `SavedListViewEntry` baseline.
 * @returns The diverged `categories` and `filterCount` of `props.current.where`.
 */
export function diffViewState<TFieldSlug extends string>(props: {
  current: ListViewStateSnapshot<TFieldSlug>;
  saved: SavedListViewEntry<TFieldSlug>;
}): ListViewDiff {
  const categories: ListViewDiffCategory[] = [];
  // Normalizes `""` and `undefined` as the same "no search" state — a
  // saved view with no search (`search: undefined`) and a fresh, unmodified
  // read of it (`resolveEffectiveViewState`'s `search` always resolves to a
  // definite `string`, `""` at worst) must never count as "modified".
  if (
    (props.current.search || undefined) !== (props.saved.search || undefined) ||
    props.current.searchField !== props.saved.searchField
  ) {
    categories.push("search");
  }
  if (
    props.current.sort?.field !== props.saved.sort?.field ||
    props.current.sort?.order !== props.saved.sort?.order
  ) {
    categories.push("sort");
  }
  if (JSON.stringify(props.current.where ?? null) !== JSON.stringify(props.saved.where ?? null)) {
    categories.push("filters");
  }
  // `columns` is ALWAYS fully resolved (`completeListViewColumnOrder`,
  // never `undefined`/partial, including for a view that never declared
  // explicit `columns`), so a single order-sensitive, per-entry-deep-equal
  // comparison (`columnEntriesEqual`) is both necessary AND sufficient —
  // order, width, pin, AND hidden state (an earlier separate set-equality
  // `columns`-vs-order-only `columnOrder` split collapses into this one
  // check since there's only one array to compare now).
  if (!columnEntriesEqual(props.current.columns, props.saved.columns)) categories.push("columns");
  if (props.saved.pageSize !== undefined && props.current.pageSize !== props.saved.pageSize) {
    categories.push("pageSize");
  }
  // Peek width counts toward
  // "Modified" ONLY for a view that has its OWN saved `peekWidth` — same
  // skip-when-undefined shape as `pageSize` above. A view with no saved
  // width never shows "Modified: preview width", whatever the live width
  // currently is — it's just this browser's own remembered preference,
  // not something that view has an opinion about. (The PRIOR fix this
  // replaced made resizing on such a view show "Modified" by comparing
  // against `PEEK_PANEL_DEFAULT_WIDTH_PX`.)
  if (props.saved.peekWidth !== undefined && props.current.peekWidth !== props.saved.peekWidth) {
    categories.push("peekWidth");
  }
  return { categories, filterCount: countWhereConditions(props.current.where) };
}

/** The `?view=`/`q`/`qf`/`sort`/`filter`/`size` URL params a shareable link for a `local`-source view's CURRENT (possibly modified) state encodes — `view` is always `undefined` here since a share link carries raw state, not a view id. */
export interface ListShareParams<TFieldSlug extends string = string> {
  view: undefined;
  q: string | undefined;
  qf: TFieldSlug | undefined;
  sort: VexViewConfig<TFieldSlug>["state"]["sort"];
  filter: VexViewConfig<TFieldSlug>["state"]["where"];
  size: number;
}

/**
 * Builds the shareable URL params for the active view's live state —
 * `undefined` unless `activeView` is a `local`-source view (
 * only local views' state is worth sharing raw, since shared/config/
 * default views are already addressable by their own `view=` id).
 * @param props.activeView - The currently active merged view, or `undefined`.
 * @param props.state - The live, resolved `ListViewStateSnapshot` to encode.
 * @returns The `ListShareParams` for `props.state`, or `undefined` when `activeView` isn't a `local`-source view.
 */
export function resolveListShareParams<TFieldSlug extends string>(props: {
  activeView: SavedListViewEntry<TFieldSlug> | undefined;
  state: ListViewStateSnapshot<TFieldSlug>;
}): ListShareParams<TFieldSlug> | undefined {
  if (props.activeView?.source !== VEX_VIEW_SOURCES.local) return undefined;
  return {
    view: undefined,
    q: props.state.search,
    qf: props.state.searchField,
    sort: props.state.sort,
    filter: props.state.where,
    size: props.state.pageSize,
  };
}

/**
 * Encodes a merged view's URL `view=` value (the `<source>:<id>`
 * grammar) — the inverse of {@link decodeViewUrlValue}. `useListViewUrlState`
 * keeps the raw `view` param opaque; this is the one place that
 * knows the merged view list well enough to build it.
 *
 * @param view - The view to encode — only its `source`/`viewId` matter.
 * @returns The `<source>:<id>` string to pass to `urlState.setView`.
 */
export function encodeViewUrlValue(view: Pick<SavedListViewEntry, "source" | "viewId">): string {
  return `${view.source}:${view.viewId}`;
}

/**
 * Decodes the `view=<source>:<id>` URL param (`useListViewUrlState().view`,
 * already source-validated by core's `parseListViewUrlState`) down to the bare
 * `viewId` — the merged `views` list (see {@link useSavedListViews}) is keyed by
 * `viewId` alone, so once parsed, the source prefix is informational only
 * (each merged entry already carries its own `.source`).
 *
 * @param raw - `useListViewUrlState().view`, or `undefined` when no view is active.
 * @returns The bare `viewId`, or `undefined` when `raw` is `undefined`.
 */
export function decodeViewUrlValue(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const separatorIndex = raw.indexOf(":");
  return separatorIndex === -1 ? undefined : raw.slice(separatorIndex + 1);
}

/**
 * Decodes the `view=<source>:<id>` URL param down to its `<source>` prefix
 * — the counterpart to {@link decodeViewUrlValue} (which decodes the
 * `<id>`). `CollectionListView` needs the source to know which RAW list
 * (`rawConfigViews`/`sharedViews`, see {@link UseSavedListViewsResult}) to look
 * the active view up in before calling core's `resolveListViewQueryState`
 * — mirrors `NextAdminPage.tsx`'s own identical `params.view`
 * split, server-side.
 *
 * @param raw - `useListViewUrlState().view`, or `undefined` when no view is active.
 * @returns The validated source, or `undefined` when `raw` is `undefined` or malformed
 *   (already source-validated by core's `parseListViewUrlState`, so malformed only means absent).
 */
export function decodeViewSource(raw: string | undefined): VexViewSource | undefined {
  if (raw === undefined) return undefined;
  const separatorIndex = raw.indexOf(":");
  if (separatorIndex === -1) return undefined;
  const source = raw.slice(0, separatorIndex);
  return source === VEX_VIEW_SOURCES.config || source === VEX_VIEW_SOURCES.shared || source === VEX_VIEW_SOURCES.local
    ? source
    : undefined;
}

/**
 * Whether `view` is still a `local`-source COOKIE-INDEX PLACEHOLDER
 * (`toIndexEntry`, used server-side and for the first
 * client render before `localStorage` hydrates) rather than the view's
 * REAL, hydrated data. Reads the entry's own {@link SavedListViewEntry.isPlaceholder}
 * flag, NOT `where === undefined` — a REAL, fully-loaded local view that
 * simply never declared explicit state (`state: {}`, a valid, common case
 * — "no explicit value means inherit defaults") is
 * structurally IDENTICAL to a placeholder (`where`/`sort` both `undefined`
 * on both — `columns` is always fully resolved regardless),
 * so only an explicit flag can tell them apart.
 *
 * Shared by `CollectionListView.tsx` (gates its `columns` one-time
 * resync — a placeholder must not be treated as "already resolved") and
 * `ListViewModifiedControls.tsx` (gates its
 * "Modified" diff — a local view's URL already carries
 * its full state, so comparing the URL's real values against an EMPTY
 * placeholder falsely flags "Modified" on a cold SSR/reload, until the
 * real `localStorage` data lands).
 *
 * @param view - A merged entry from {@link useSavedListViews}' own `views`, or
 *   `undefined` when no view resolved at all.
 * @returns Whether `view` is an unresolved local placeholder.
 */
export function isPlaceholderLocalView<TFieldSlug extends string>(
  view: SavedListViewEntry<TFieldSlug> | undefined,
): boolean {
  return view?.source === VEX_VIEW_SOURCES.local && view.isPlaceholder === true;
}

/**
 * Merges the URL's own per-field state with the active view's saved values,
 * falling back to the view only for a field the URL doesn't carry (
 * "only params that differ from the saved view appear" is lossy to
 * PARSE without this — a view's own saved search/sort/filter/pageSize would
 * otherwise silently vanish on a fresh load of its URL: a hard reload, a
 * shared link, or simply switching tabs client-side without ever having
 * clicked it this session. Feeds both the live query (`CollectionListView`)
 * and the modified-state diff (`SavedListViewTabs`) from one shared
 * implementation, so they can never disagree about what "no override" means).
 *
 * `q`/`filter` are tri-state: `undefined` means the
 * URL never carried the key — inherit `activeView`'s own value. An
 * EXPLICIT empty value (`q: ""`, `filter: null`) means the user actively
 * cleared it — stays empty, never re-inherited. Before this fix, both
 * states collapsed to the same "" `/`undefined`, so clicking "Clear all"
 * on a view with its own saved filter silently re-inherited that exact
 * filter: no "Modified" badge, no way to Reset/Save the cleared state, and
 * a refresh brought the filter right back since nothing durable was ever
 * written. `sort`/`searchField`/`pageSize` stay plain `?? activeView?.X`
 * — none of them has a "Clear" UI action distinct from picking a NEW
 * concrete value, so there's no equivalent ambiguity for them to resolve.
 *
 * For a `config`-source view, `activeView.where` is always `undefined` (its
 * hidden filter never reaches the merged view list) — `where`
 * here resolves to the URL's own filter when present, else stays
 * `undefined`, which is exactly right: `composeQueryWhere` folds the config
 * view's hidden condition in separately, by `activeViewId`, not through
 * this function.
 *
 * `sort`/`searchField` are validated against
 * `props.collection` via `@vexcms/core`'s `isSortFieldValid`/`isSearchFieldValid`
 * — the SAME functions `resolveListViewQueryState` (core) uses, so the client and
 * server can never disagree about what counts as stale. A stale value falls
 * back to the collection's own default sort/searchField, reported via
 * `staleSortField`/`staleSearchField` for the toolbar's dismissible notice.
 * This matters beyond the notice: `currentState` built from this function's
 * result is what `ListViewModifiedControls`'s "Save in place"/"Save as a
 * copy" and `SavedListViewTabs`'s "Save as new view" actually WRITE — without
 * this fallback, hitting Save on a stale view would silently re-save the
 * SAME stale field, forever. The view itself is never rewritten automatically;
 * only an explicit Save (now self-healing) writes the corrected value.
 *
 * @param props - The raw URL fields plus the resolved active view (or
 *   `undefined` when no view is active, in which case every field passes
 *   through unchanged) and the collection to validate `sort`/`searchField` against.
 * @returns The effective `search`/`searchField`/`sort`/`where`/`pageSize`
 *   to drive both the query and the diff, plus `staleSortField`/`staleSearchField`
 *   when a fallback occurred.
 */
export function resolveEffectiveViewState<TFieldSlug extends string>(props: {
  collection: CollectionConfig;
  q: string | undefined;
  qf: TFieldSlug | undefined;
  sort: ListViewStateSnapshot<TFieldSlug>["sort"];
  filter: ListViewStateSnapshot<TFieldSlug>["where"] | null;
  size: number | undefined;
  activeView: SavedListViewEntry<TFieldSlug> | undefined;
}): {
  search: string;
  searchField: TFieldSlug | undefined;
  sort: ListViewStateSnapshot<TFieldSlug>["sort"];
  where: ListViewStateSnapshot<TFieldSlug>["where"];
  pageSize: number | undefined;
  staleSortField?: string;
  staleSearchField?: string;
} {
  const defaultSort = props.collection.admin.view.state.sort as ListViewStateSnapshot<TFieldSlug>["sort"];
  const resolvedSort = props.sort ?? props.activeView?.sort;
  const sortValid = isSortFieldValid({ collection: props.collection, field: resolvedSort?.field });
  const sort = sortValid ? resolvedSort : defaultSort;
  const staleSortField = sortValid ? undefined : resolvedSort?.field;

  const defaultSearchField = props.collection.admin.view.state.searchField as TFieldSlug | undefined;
  const resolvedSearchField = props.qf ?? props.activeView?.searchField;
  const searchFieldValid = isSearchFieldValid({ collection: props.collection, field: resolvedSearchField });
  const searchField = searchFieldValid ? resolvedSearchField : defaultSearchField;
  const staleSearchField = searchFieldValid ? undefined : resolvedSearchField;

  return {
    search: props.q !== undefined ? props.q : (props.activeView?.search ?? ""),
    searchField,
    sort,
    where: props.filter !== undefined ? (props.filter ?? undefined) : props.activeView?.where,
    pageSize: props.size ?? props.activeView?.pageSize,
    ...(staleSortField !== undefined ? { staleSortField } : {}),
    ...(staleSearchField !== undefined ? { staleSearchField } : {}),
  };
}

/**
 * The filter `ListViewFilterBuilder`/`ListViewFilterChips`/the eye toggle should
 * DISPLAY and let the user EDIT — distinct from {@link resolveEffectiveViewState}'s
 * own `where` (that one feeds `ListViewModifiedControls`'s/`SavedListViewTabs`'s
 * internal diff/save bookkeeping, which never renders the value to a user,
 * so it already safely falls back to ANY active view's own full `where`
 * regardless of readability — a declared config/default view's `where` is
 * structurally `undefined` by the time it reaches here anyway,
 * `toClientSavedListViewConfig`/`toDefaultEntry` strip it at the source,
 * leaving only `visibleWhere`). THIS function is for the opposite case —
 * deciding what's safe to show the user directly, EDITABLE — so it adds
 * the ONE check that matters there: a SHARED view's own saved filter
 * never reaches `urlFilter` for an unmodified link (its state isn't
 * URL-embedded the way a local view's is), so without this, a readable
 * shared filter was invisible — no chips, no eye toggle, no "Filter N"
 * count — for EVERY caller, not just one who can't read a field in it
 * (confirmed live, zero chips for an unrestricted admin session on a
 * readable shared view). `activeView.visibleWhere` ({@link toEntry}'s
 * {@link splitWhereByReadability} output) is ALREADY the exact subset
 * safe to hand the user as editable state — every condition on a field
 * the caller can't read is already excluded, whether or not some OTHER
 * sibling condition in the same view is readable (a config/default
 * view's own readable portion is a LOCKED chip instead, read via
 * `activeView.visibleWhere` directly by the caller that renders those —
 * never through this function, which only ever returns a shared/local
 * view's own EDITABLE state).
 *
 * @param props - Input props.
 * @param props.urlFilter - `urlState.filter` — `undefined` (no override,
 *   inherit the active view) or `null` (the user explicitly cleared it,
 *   never re-inherit) or a real filter (the user's own, always wins).
 * @param props.activeView - The resolved active view, or `undefined` when
 *   none is (the default view is always present once resolved, so this is
 *   only `undefined` before `savedViews` itself has resolved).
 * @returns The filter to display/edit, or `undefined` for none.
 */
export function resolveEffectiveFilterWhere<TFieldSlug extends string>(props: {
  urlFilter: ListViewStateSnapshot<TFieldSlug>["where"] | null | undefined;
  activeView: SavedListViewEntry<TFieldSlug> | undefined;
}): ListViewStateSnapshot<TFieldSlug>["where"] {
  if (props.urlFilter !== undefined) return props.urlFilter ?? undefined;
  if (props.activeView?.source === VEX_VIEW_SOURCES.shared) {
    return props.activeView.visibleWhere as ListViewStateSnapshot<TFieldSlug>["where"];
  }
  return undefined;
}
