"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import {
  SLOT_IDS,
  VEX_VIEW_SOURCES,
  serializeListViewUrlState,
  type CollectionConfig,
  type ComponentContributionInput,
  type ListViewConfigCookieValues,
  type LocalSavedListViewsIndexEntry,
  type TDocument,
  type VexStoredView,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { DataTable, isInteractiveRowTarget } from "../../ui/data-table/DataTable";
import { ActionsMenu } from "../../ui/ActionsMenu";
import { useListViewContext } from "./ListViewContext";
import { StaleSavedListViewNotice } from "./savedListViews/StaleSavedListViewNotice";
import { ListViewToolbar } from "./toolbar/ListViewToolbar";
import { SavedListViewTabs } from "./savedListViews/SavedListViewTabs";
import type { ListViewUrlStateSlice } from "./useListViewUrlState";
import { listHeaderActionsBuiltins, listRowActionsBuiltins } from "./listViewBuiltinSlotContributions";
import type { ListViewRowSlotProps } from "./rowActions/ListViewRowOpenAction";

/** Props for {@link ListViewLayout}. */
export interface ListViewLayoutProps<TDoc extends TDocument = TDocument> {
  collection: CollectionConfig;
  /** Omit when `tableSlot` is given — the caller renders its own `DataTable` there instead, with its own `rows`. Used for `ListViewToolbar`'s "N selected" bulk bar only in that case; defaults to `[]`, harmless since nothing can be selected before rows exist. */
  rows?: TDoc[];
  /** Omit when `tableSlot` is given — the caller builds its own columns for its own `DataTable` there. */
  columns?: ColumnDef<TDoc>[];
  isDone?: boolean;
  isPending?: boolean;
  totalCount?: number | null;
  onLoadMore?: () => void;
  /**
   * Replaces the inline `<DataTable>` call entirely when given — the per-component-Suspense
   * split: `ListViewLayout` itself never depends on row data, so the title/
   * tabs/toolbar/table-frame-adjacent slots it owns can stream immediately regardless of how
   * long the actual rows take; the caller wraps ITS OWN `<DataTable>` (or a `<Suspense>`
   * around one) and passes it here. `rows`/`isDone`/`isPending`/`totalCount`/`onLoadMore`/
   * `columns`/`totalDocsCapped`/`emptyState`/`queryError`/`isRefetching`/`onRowHover*`/
   * `onRowFocus` are then unused (the caller's own `<DataTable>` reads its own data directly)
   * except `rows`, still read by `ListViewToolbar`'s bulk-selection bar above this slot.
   */
  tableSlot?: ReactNode;
  /** Extra header-row content rendered left of `list.header.actions`' own output (e.g. `RevalidateButton`, owned and rendered by `CollectionListView` itself, never a slot contribution, but placed in this same row so the header never splits onto two lines). */
  headerExtra?: ReactNode;
  /** Layout-affecting list preferences resolved server-side (`parseListViewConfigCookies`) — forwarded from `CollectionListView`'s own `initialPreferences` prop. `ListViewToolbar`'s own `ListViewFilterChips`/`ListViewFilterVisibilityToggle` are the only consumers of its `chipsVisible` field; `density` is read elsewhere (via `useListViewContext()`). */
  initialPreferences: ListViewConfigCookieValues;
  /** Whether `totalCount` hit `collection.admin.view.state.countLimit` — forwarded to `DataTable`'s footer. */
  totalDocsCapped?: boolean;
  /** Whether the caller may create a new document — gates the empty state's own Create button (`ListViewCreateAction` self-gates separately for the header). */
  canCreate: boolean;
  /** Whether the caller may delete documents in this collection. */
  canDelete: boolean;
  /** Rendered in place of the table body when there's nothing to show (`ListViewEmptyState`) — chosen by the caller, since only it knows whether a search/filter is active. */
  emptyState?: ReactNode;
  /** Rendered in place of the whole scroll area when the underlying query failed (`ListViewQueryError`) — takes priority over `emptyState`. */
  queryError?: ReactNode;
  /** Server-prefetched shared views — forwarded to `SavedListViewTabs`. */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index — forwarded to `SavedListViewTabs`. */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
  /** Row hover-prefetch start, forwarded to `DataTable`'s `getRowProps`. Omit to disable prefetching. */
  onRowHoverStart?: (id: string) => void;
  /** Row hover-prefetch cancel, forwarded to `DataTable`'s `getRowProps`. */
  onRowHoverEnd?: () => void;
  /** Row focus-prefetch, forwarded to `DataTable`'s `getRowProps`. */
  onRowFocus?: (id: string) => void;
  /** Forwarded straight to `DataTable`'s own `isRefetching` — composition-only. */
  isRefetching?: boolean;
}

/**
 * Renders a collection's list view around the seven `list.*` slots (S17/S18): a header row
 * (`list.header.actions`), a toolbar/filter area (`ListViewToolbar`'s `list.toolbar`, `list.filters`)
 * with an inline bulk-selection group ahead of it while rows are selected, the table flanked by
 * `list.beforeTable`/`list.afterTable`, and a per-row ⋯ menu (`list.row.actions`).
 *
 * The root element is a named size container, `@container/list` — every
 * narrower-container variant downstream (`ListViewToolbar`'s CSS collapse, later steps' view-tab
 * overflow and peek layout) targets this one container, the same convention
 * `CollectionEditView.tsx` established with `@3xl/form`.
 *
 * Reads shared list state (selection, density, visible columns, url state, `onInspect`) via
 * `useListViewContext()` — `CollectionListView` owns that state and mounts
 * `ListViewContextProvider` around this component (mirrors `VexDocumentProvider`/
 * `CollectionEditView`'s split), so `ListViewLayout` is a context CONSUMER only, never a
 * provider.
 *
 * @param props - {@link ListViewLayoutProps}.
 * @returns The composed list view.
 */
export function ListViewLayout<TDoc extends TDocument = TDocument>(
  props: ListViewLayoutProps<TDoc>,
): ReactNode {
  const {
    collection,
    selection,
    urlState,
    columns: columnEntries,
    onColumnsChange,
    onColumnsStateChange,
    peekWidth,
    peekWidthTouched,
    onPeekWidthChange,
    density,
    viewPrefetch,
  } = useListViewContext();
  // Lifted so `ListViewToolbar`'s own `ListViewFilterChips`/`ListViewFilterVisibilityToggle`
  // (both rendered directly by it, always inline in its row) share one source of truth for
  // the chip row's visibility.
  const [chipsVisible, setChipsVisible] = useState(props.initialPreferences.chipsVisible);

  const columnsWithActions = useColumnsWithActions(props.columns ?? [], collection);

  // Copy link serializes the full URL state (instead of
  // `view=local:<id>`) only while a LOCAL view is active — determined
  // straight from the `view=<source>:<id>` URL grammar, with
  // no extra `useSavedListViews()` call needed (`SavedListViewTabs` already owns
  // that for the tab strip itself).
  const isLocalViewActive = urlState.view?.startsWith(`${VEX_VIEW_SOURCES.local}:`) ?? false;
  const buildCopyLinkHref = isLocalViewActive
    ? () => {
        const params = serializeListViewUrlState({
          params: {
            q: urlState.q,
            qf: urlState.qf,
            // Parked while searching — never sent alongside `q`.
            sort: urlState.q ? undefined : urlState.sort,
            filter: urlState.filter,
            size: urlState.size,
            view: undefined,
            peek: urlState.peek,
          },
          collection,
        });
        const queryString = params.toString();
        return `${window.location.origin}${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
      }
    : undefined;

  return (
    <div className="@container/list flex h-full min-h-0 flex-col gap-2">
      {/*
       * Title row: the collection's plural label plus the header actions,
       * ALWAYS on one line together (opening a view
       * never changes this row's content or height, so the actions stay
       * vertically aligned with the title at every width, with or
       * without an active view) — mirrors the edit view's own single-row
       * header and the original list view design. The heading is ALWAYS just
       * `collection.labels.plural` (no view name, separator, badge, or description
       * anywhere in this row, regardless of which view is active). The
       * active `TabsTrigger` in `SavedListViewTabs` below is the only
       * indicator of which view is open; a view's own description, when
       * it has one, surfaces as a hover tooltip on that tab instead
       * (`SavedListViewTabs.tsx`). No gap is reserved between this row and
       * `SavedListViewTabs`, or between any row below it — the whole column
       * uses one uniform `gap-2` so the page reads dense regardless of
       * view state.
       */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 pt-4">
        <h1 className="text-2xl font-bold">{collection.labels.plural}</h1>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {props.headerExtra}
          <SlotOutlet
            slotId={SLOT_IDS.list.headerActions}
            builtins={listHeaderActionsBuiltins()}
            contributions={
              collection.admin.components
                .headerActions as unknown as ComponentContributionInput<ReactHKT, Record<string, never>>[]
            }
            contributedProps={{}}
          />
        </div>
      </div>

      <SavedListViewTabs
        collection={collection.slug}
        // `UseListViewUrlStateReturn`'s `filter`/`setFilter` are typed via core's
        // `VexWhereNode<TFieldSlug>` (db/queryArgs.ts); `ListViewUrlStateSlice`'s
        // are typed via `VexWhereNodeOf<unknown>` (access/queryConstraintTypes.ts,
        // `VexViewState`'s deliberately collection-structure-agnostic `where`)
        // — two distinct, structurally-near-identical `{ field, op, value }`
        // tree aliases that don't unify generically. Same runtime shape;
        // only surfaces in a consuming app's concrete generated-slug-union
        // typecheck context, same class of gap prior steps hit.
        urlState={urlState as unknown as ListViewUrlStateSlice}
        defaultPageSize={collection.admin.view.state.pageSize}
        columns={columnEntries}
        onColumnsChange={onColumnsChange}
        onColumnsStateChange={onColumnsStateChange}
        peekWidth={peekWidth}
        peekWidthTouched={peekWidthTouched}
        onPeekWidthChange={onPeekWidthChange}
        initialViews={props.initialViews}
        initialLocalIndex={props.initialLocalIndex}
        viewPrefetch={viewPrefetch}
        // `CollectionListView`'s own `pagination.isPending` for the currently
        // active view's real query (NOT the hover/focus prefetch above) —
        // the tab spinner used to be driven
        // by `viewPrefetch.pendingViewId` alone, which a silent hover-only
        // prefetch also sets, leaving the icon spinning after the pointer
        // moved away without a click. Driving it off the real query's own
        // pending state means it only appears once a switch is actually in
        // flight, and clears the instant that query settles.
        isQueryPending={props.isPending ?? false}
      />

      <ListViewToolbar
        rows={props.rows ?? []}
        buildCopyLinkHref={buildCopyLinkHref}
        chipsVisible={chipsVisible}
        onChipsVisibleChange={setChipsVisible}
        initialViews={props.initialViews}
        initialLocalIndex={props.initialLocalIndex}
      />

      <StaleSavedListViewNotice />

      <SlotOutlet
        slotId={SLOT_IDS.list.beforeTable}
        builtins={[]}
        contributions={
          collection.admin.components
            .beforeTable as unknown as ComponentContributionInput<ReactHKT, Record<string, never>>[]
        }
        contributedProps={{}}
      />

      {props.tableSlot ?? (
        <DataTable
          highlightedRowId={urlState.peek}
          data={props.rows ?? []}
          columns={columnsWithActions}
          isDone={props.isDone ?? true}
          onLoadMore={props.onLoadMore}
          isLoadingMore={props.isPending}
          isPending={props.isPending}
          totalCount={props.totalCount}
          totalDocsCapped={props.totalDocsCapped}
          enableRowSelection
          selectedIds={selection.selectedIds}
          onSelectionChange={selection.setSelectedIds}
          sort={urlState.q ? undefined : urlState.sort}
          onSortChange={urlState.setSort}
          sortDisabled={!!urlState.q}
          columnEntries={columnEntries}
          onColumnEntriesChange={onColumnsChange}
          density={density}
          pageSize={urlState.size ?? collection.admin.view.state.pageSize}
          emptyState={props.emptyState}
          queryError={props.queryError}
          isRefetching={props.isRefetching}
          getRowProps={(row) => ({
            onPointerEnter: () => props.onRowHoverStart?.(row._id),
            onPointerLeave: () => props.onRowHoverEnd?.(),
            onFocus: () => props.onRowFocus?.(row._id),
            // See `CollectionListViewData`'s own identical handler
            // (`CollectionListView.tsx`) for the full rationale — this is
            // the fallback path for a caller that doesn't supply `tableSlot`.
            onDoubleClick: (event) => {
              if (isInteractiveRowTarget(event.target)) return;
              urlState.setPeek(row._id);
            },
          })}
        />
      )}

      <SlotOutlet
        slotId={SLOT_IDS.list.afterTable}
        builtins={[]}
        contributions={
          collection.admin.components
            .afterTable as unknown as ComponentContributionInput<ReactHKT, Record<string, never>>[]
        }
        contributedProps={{}}
      />
    </div>
  );
}

/**
 * Builds the data columns plus the fixed, non-hideable "actions" column every list table
 * ends with — shared by `ListViewLayout`'s own inline `<DataTable>` fallback and
 * `CollectionListViewData`'s (`CollectionListView.tsx`) Suspense-wrapped one, so the row-
 * actions menu cell can't drift between the two call sites. Takes `collection` as a
 * parameter rather than reading it off `useListViewContext()` — `CollectionListView` itself
 * (the shell split's outer component, NOT inside its own `ListViewContextProvider` yet)
 * needs this for the Suspense fallback's columns too, so this hook can't depend on the
 * context it hasn't mounted yet at that call site.
 *
 * @param columns - The collection's own data columns (no actions column).
 * @param collection - The resolved collection config, for the actions menu's label/slot.
 * @returns `columns` plus the trailing actions column.
 */
export function useColumnsWithActions<TDoc extends TDocument = TDocument>(
  columns: ColumnDef<TDoc>[],
  collection: CollectionConfig,
): ColumnDef<TDoc>[] {
  return useMemo<ColumnDef<TDoc>[]>(
    () => [
      ...columns,
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          // `DataTable`'s sticky `right-0`, zero-padding `ACTIONS_CELL_*_CLASS` cell (the
          // sticky selection column, mirrored on the opposite edge) centers its content
          // via a wrapping flex `<div>`, not cell padding — matching the checkbox column's own
          // `SELECTION_CHECKBOX_WRAPPER_CLASS` convention, since `display: flex` on the `<td>`
          // itself would pull it out of the table's row-height layout. The trigger stays
          // centered in its cell at all times, scrollbar or not.
          <div className="flex items-center justify-center" data-slot="row-actions">
            <ActionsMenu label={`${collection.labels.singular} actions`}>
              <SlotOutlet
                slotId={SLOT_IDS.list.rowActions}
                builtins={listRowActionsBuiltins()}
                contributions={
                  collection.admin.components
                    .rowActions as unknown as ComponentContributionInput<ReactHKT, ListViewRowSlotProps>[]
                }
                contributedProps={{ docs: [row.original] }}
              />
            </ActionsMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        // This column's width is NEVER read from `columnDef.size`/
        // `DataTable`'s own `liveWidth()` at all — `resolveColumnWidthStyle`
        // returns `undefined` unconditionally for the actions column, which
        // sizes itself via `ACTIONS_CELL_SHARED_CLASS`'s own hardcoded
        // `w-12` instead. `size` here is purely documentation of that same
        // 48px intent.
        size: 48,
      },
    ],
    [columns, collection],
  );
}
