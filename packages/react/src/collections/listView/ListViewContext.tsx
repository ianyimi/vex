"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CollectionConfig, ColumnEntry, ListDensity, VexWhereNodeOf } from "@vexcms/core";
import type { TDocument } from "@vexcms/core";
import type { UseListViewUrlStateReturn } from "./useListViewUrlState";
import type { UseListViewPrefetchReturn } from "./savedListViews/useSavedListViewPrefetch";

/**
 * The shared list-view state every `list.*` slot contribution reads via
 * `useListViewContext()` — collection identity, URL state, selection,
 * per-browser density (cookie-backed), visible
 * columns, and the Inspect-peek opener. Row-scoped data
 * (`docs` for `list.row.actions`/`list.bulkActions`) stays a `SlotOutlet`
 * `contributedProps` prop instead — it varies per contribution call, so it
 * cannot live in one shared context value. The current page's rows
 * similarly stay a `ListViewLayout`/`DataTable` prop, never context — nothing
 * reading `useListViewContext()` needs the whole page, only the ids
 * `selection` already carries.
 */
export interface ListViewContextState<TDoc extends TDocument = TDocument> {
  /** The resolved collection config. */
  collection: CollectionConfig;
  /** This list's URL state (`useListViewUrlState`, this step). */
  urlState: UseListViewUrlStateReturn;
  /** Row selection. */
  selection: {
    /** The ids of currently-selected rows (`DataTable`'s `onSelectionChange`). */
    selectedIds: string[];
    /** The currently-selected rows, resolved from `selectedIds` against the loaded page. */
    selectedDocs: TDoc[];
    /** Replaces the current selection. */
    setSelectedIds: (ids: string[]) => void;
    /** Whether the caller may delete documents in this collection. */
    canDelete: boolean;
  };
  /** Per-browser table density, cookie-backed — seeded from `CollectionListView`'s `initialPreferences` prop, never read from `useLocalStorage`. */
  density: ListDensity;
  /** Replaces the density preference; the caller (`CollectionListView`) updates its own state AND writes it into the consolidated `vex-admin` cookie (`writeListViewDensityCookie`) so the next server render matches with no flash. Read by `vex.list.columns` (`ListViewColumnsAction.tsx`) alongside `density` itself. */
  onDensityChange: (density: ListDensity) => void;
  /**
   * The active view's FULL column list, always complete —
   * every one of the collection's own data fields, exactly once, in
   * display order, each a {@link ColumnEntry} (possibly carrying
   * `width`/`pinned`/`hidden` overrides). Threads straight to
   * `DataTable`'s own `columns` prop and drives the columns menu's row
   * sequence/checkbox/pin-control state. Replaces separate
   * `visibleColumns`/`columnOrder`/`onVisibleColumnsChange`/
   * `onColumnOrderChange` fields — one array, one
   * general setter (`onColumnsChange` below), no atomic-pair race
   * possible anymore.
   */
  columns: ColumnEntry<string>[];
  /** Replaces the full `columns` array AND pushes `urlState.setCols` — the ONE setter every IN-PLACE column-layout interaction uses (`ListViewColumnsAction`/`DataTableColumnsMenu`'s drag/checkbox/pin control, `DataTable`'s own resize handle). */
  onColumnsChange: (columns: ColumnEntry<string>[]) => void;
  /**
   * Same `columns`-replacing shape as `onColumnsChange`, but LOCAL STATE
   * ONLY — no `urlState.setCols` write. Used by a view SWITCH
   * (`SavedListViewTabs.tsx`'s `applyView`, `ListViewModifiedControls.tsx`'s
   * save-as-copy), which writes `cols=` itself as ONE field in
   * `urlState.applyView`'s single atomic URL write, diffed against the
   * TARGET view's own baseline — not the STALE pre-switch one
   * `onColumnsChange`'s own `urlState.setCols` call would've used
   * (switching FROM a shared/config view left a
   * redundant `cols=`, since a separate `setCols` call here diffs
   * against the OLD view's baseline).
   */
  onColumnsStateChange: (columns: ColumnEntry<string>[]) => void;
  /** The peek panel's live width in px ("peek-resize") — the cookie's current value, mirroring `columns` above. */
  peekWidth: number;
  /** Whether the user has explicitly resized the peek (drag/keyboard/double-click) since the active view last changed ("peek-resize-save-rule") — `false` for a passive view-sync re-seed or a Reset/tab-click restore. Drives whether Save starts persisting a `peekWidth` into a view that never had one of its own. */
  peekWidthTouched: boolean;
  /** Persists a new width (drag/keyboard commit, Reset, or a view switch restoring the target view's own saved width) via `writeListViewPeekWidthCookie`. `source` (default `"user"`) distinguishes a genuine resize (marks {@link peekWidthTouched}) from Reset/a tab-click restoring a specific view's own saved width (`"view"` — persists the same way but never counts as the user having touched the ACTIVE view's width). */
  onPeekWidthChange: (width: number | undefined, source?: "user" | "view") => void;
  /** Every READABLE column (widened from "hideable only"), for the columns menu; each tagged `hideable` for the checkbox's enabled/disabled state. Renamed from `hideableColumns`. */
  columnMenuEntries: { field: string; label: string; hideable: boolean }[];
  /** Whether a saved view (config/shared/local) is currently active (`urlState.view` decodes to a merged view's id). */
  hasActiveView: boolean;
  /** The active view's hidden-filter summary (`VexClientViewConfig.hasHiddenFilter`/`hiddenFilterCount`), or `undefined` when no view is active or it declares no hidden filter — drives `SavedListViewHiddenFilterBadge` (`ListViewToolbar`). */
  activeViewHiddenFilter?: { count: number; description?: string };
  /** Whether a search fetch is currently in flight for the ACTIVE search (not a background `find` refetch) — `ListViewSearch`'s own in-input spinner reads this while the previous page's rows stay on screen (keep-previous-data). `false` while no search is active at all. */
  isSearchFetching: boolean;
  /** Opens the Inspect peek for a document id. `undefined` until then. */
  onInspect?: (id: string) => void;
  /** Tab hover/focus prefetch handlers + the in-flight `pendingViewId` — `SavedListViewTabs` wires its `TabsTrigger`s to this. */
  viewPrefetch: UseListViewPrefetchReturn;
  /**
   * Resolved titles for every `relationship`/`upload` id a filter row/chip
   * currently needs to display — keyed by raw id, seeded
   * from `CollectionListView`'s `initialFilterValueTitles` prop
   * (`NextAdminPage`'s own `collectListViewFilterRelationshipValues` server
   * prefetch). `undefined` for an id neither the server nor this
   * session's own `setFilterValueTitle` calls have resolved yet —
   * `relationship`/`upload` `FilterInput`s and `ListViewFilterChips.tsx` both
   * fall back to the raw id in that case, never a blocking state.
   */
  filterValueTitles: Record<string, string | null>;
  /**
   * Records one id's resolved title — called directly by the
   * `relationship`/`upload` `FilterInput`s' own picker `onSelect` (the
   * common "user just picked it" path, title already known from the
   * picker's own document list) and by their one-shot cold-load fallback
   * query. `null` records a confirmed not-found/denied id (so the raw-id
   * fallback renders immediately instead of re-querying every render).
   */
  setFilterValueTitle: (id: string, title: string | null) => void;
  /**
   * Set (to the field that was dropped) when the active view's own `sort.field`
   * no longer exists/leads no declared index and fell back to the collection
   * default (`resolveListViewQueryState`/`resolveEffectiveViewState`)
   * — drives `StaleSavedListViewNotice`'s dismissible toolbar notice. `undefined` when
   * `sort` needed no correction.
   */
  staleSortField?: string;
  /** Same as {@link staleSortField}, for `searchField`. */
  staleSearchField?: string;
  /**
   * Set (to the field that was dropped) when a USER-added filter condition —
   * a URL `filter=`, or a LOCAL view's own saved filter (its full state is
   * always URL-embedded, indistinguishable from a raw URL
   * filter) — named a field the caller can no longer read
   * and `resolveListViewQueryState`
   * dropped it rather than sending a condition the server would reject.
   * Never set for a declared/config view's own hidden filter (stays exempt,
   * applied regardless of readability) OR a SHARED view's own saved filter
   * (ALSO exempt — a declared filter by the same literal-grouping rule,
   * same as config; see {@link effectiveFilterWhere}'s own doc for how a
   * shared view's filter is surfaced instead, readable or not).
   * Same dismissible-notice shape as {@link staleSortField}/{@link staleSearchField}.
   */
  staleFilterField?: string;
  /**
   * The filter `ListViewFilterBuilder`/`ListViewFilterChips`/the eye toggle should
   * DISPLAY and let the user EDIT — distinct from `urlState.filter` alone: a
   * SHARED view's own saved filter never reaches `urlState.filter` for an
   * unmodified link (its state isn't URL-embedded the way a local view's
   * is), so without this, a readable shared filter was invisible — no
   * chips, no eye toggle, no "Filter N" count — for EVERY caller, not just
   * one who can't read a field in it. `urlState.filter` (set or explicitly
   * cleared) always wins when present; otherwise, an ACTIVE shared view's
   * own `visibleWhere` (`SavedListViewEntry.visibleWhere` —
   * `splitWhereByReadability`'s output, already narrowed to conditions on
   * fields the caller can read) substitutes — editing it writes a real
   * `urlState.filter`, same as editing any other filter. A condition on
   * an UNREADABLE field never reaches here even when a sibling condition
   * in the same view IS readable — only that one stays
   * `SavedListViewHiddenFilterBadge`-only. `undefined` for a declared
   * (config/default) view, whose own readable portion is a LOCKED chip
   * instead ({@link lockedFilterWhere}, never user-editable).
   */
  effectiveFilterWhere?: VexWhereNodeOf<unknown>;
  /**
   * The portion of the ACTIVE `config`/`default` view's own declared
   * `where` that's safe to show as a LOCKED (non-removable) filter chip —
   * every condition on a field the current caller can read
   * (`SavedListViewEntry.visibleWhere` for a `config`/`default` source;
   * `undefined` for every other source, and for a `config`/`default`
   * view with no readable condition at all). Distinct from {@link
   * effectiveFilterWhere}, which is EDITABLE state and only ever a
   * `shared`/`local`/URL filter — a config view's own condition is never
   * user-editable, so it renders through a separate, remove-button-less
   * chip instead.
   */
  lockedFilterWhere?: VexWhereNodeOf<unknown>;
}

/** Default value is `null` so a consumer rendered outside any provider throws instead of reading stale state. */
export const ListViewContext = createContext<ListViewContextState | null>(null);

/**
 * Mounts `ListViewContext` for the subtree it wraps. `CollectionListView` is the only
 * caller — it recomputes {@link ListViewContextState} from its own state every render and
 * wraps `ListViewLayout` with it.
 *
 * @param props.value - The resolved list state to provide.
 * @param props.children - The subtree that consumes it (`ListViewLayout` and its seven `list.*` `SlotOutlet`s).
 * @returns The context provider wrapping `props.children`.
 */
export function ListViewContextProvider(props: {
  value: ListViewContextState;
  children: ReactNode;
}): ReactNode {
  return (
    <ListViewContext.Provider value={props.value}>
      {props.children}
    </ListViewContext.Provider>
  );
}

/**
 * Exposes the current list view's shared state to a built-in or third-party `list.*`
 * slot contribution. Backed by `ListViewContext`, mounted by `CollectionListView`.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current `ListViewContextState`.
 * @throws When rendered outside a `ListViewContextProvider`.
 */
export function useListViewContext(): ListViewContextState {
  const value = useContext(ListViewContext);
  if (value === null) {
    throw new Error("useListViewContext() must be used within a ListViewContextProvider.");
  }
  return value;
}
