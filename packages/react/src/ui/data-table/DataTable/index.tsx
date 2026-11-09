"use client";

import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnPinningState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  columnEntryField,
  type CollectionTableSort,
  type ColumnEntry,
  type ListDensity,
  type VexDocument,
} from "@vexcms/core";
import { useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from "react";
import { Checkbox } from "../../checkbox";
import { ScrollArea } from "../../scroll-area";
import { Table } from "../../table";
import { DataTableBody } from "./DataTableBody";
import { DENSITY_ROW_CLASS, SELECTION_CHECKBOX_WRAPPER_CLASS } from "./dataTableCellClasses";
import { DataTableFooter } from "./DataTableFooter";
import { DataTableHeader } from "./DataTableHeader";
import { useDataTableColumnResize } from "./useDataTableColumnResize";

/**
 * Whether a DOM event's target is (or is inside) an interactive part of a
 * row — the selection checkbox, a cell's own link (e.g. a title column's
 * edit-view link), or the row's ⋯ actions-menu trigger. `DataTable`'s own
 * row loop doesn't call this itself (it stays peek/selection-agnostic,
 * per {@link DataTableProps.getRowProps}'s own doc comment); a caller
 * building a row-level `onDoubleClick` handler (e.g. "double-click opens
 * the Inspect peek") checks this FIRST and bails when it's `true`, so
 * double-clicking one of those interactive elements keeps doing exactly
 * what a single click on it already does (toggle selection, navigate,
 * open the menu) instead of ALSO triggering the row-level action.
 *
 * @param target - A DOM event's `target` (e.g. `event.target`).
 * @returns `true` when `target` is, or is nested inside, a `<button>`,
 *   `<a>`, `<input>`, or `[role="checkbox"]` element.
 */
export function isInteractiveRowTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('button, a, input, [role="checkbox"]') !== null;
}

/**
 * Props for DataTable component.
 *
 * @typeParam TData - Row data type (must have `_id` field for selection)
 *
 * **Defaults:**
 * - `isDone`: true
 * - `isLoadingMore`: false
 * - `enableRowSelection`: false
 * - `isLoading`: false
 * - `density`: "comfortable"
 */
export interface DataTableProps<TData extends { _id: string }> {
  /** Array of data to display in table rows. */
  data: TData[];

  /** TanStack Table column definitions. */
  columns: ColumnDef<TData>[];

  // Load More pagination

  /**
   * Whether all results have been loaded.
   * When `true`, Load More button is hidden.
   */
  isDone?: boolean;

  /**
   * Callback when Load More button is clicked.
   * Parent should fetch next page and append to data.
   */
  onLoadMore?: () => void;

  /**
   * Whether Load More query is in flight.
   * Shows loading state on button.
   */
  isLoadingMore?: boolean;

  /**
   * Total count of documents across all pages.
   *
   * - `number` when count succeeded
   * - `null` when collection has >32k documents
   * - `undefined` when count not requested
   *
   * Used in the "Showing N of M" footer status line.
   */
  totalCount?: number | null;

  // Features

  /** Enable checkbox column for row selection. */
  enableRowSelection?: boolean;

  /**
   * The currently-selected row ids — a controlled component (like every other primitive in
   * this package): the caller owns the selection and this table only renders it and reports
   * changes, it never persists its own copy. Keyed by `_id` (`getRowId`), so a selection
   * reported against a row that later disappears from `data` (a delete) naturally stops being
   * checked rather than silently pointing at a different row by index. Defaults to `[]`.
   */
  selectedIds?: string[];

  /**
   * Invoked whenever the selected row ids change (a row toggled, "select all" toggled, or the
   * caller itself passed a new `selectedIds`, e.g. "Select all N loaded" or Clear). The
   * caller — `ListViewLayout` — owns what a selection means (the `list.bulkActions` slot's
   * `docs`), not this generic table.
   */
  onSelectionChange?: (selectedIds: string[]) => void;

  /**
   * Per-row DOM event handlers, spread onto each `<TableRow>`. Generic —
   * `DataTable` has no concept of peeking, prefetching, or the Inspect
   * peek; `ListViewLayout`/`CollectionListViewData` forward their own
   * `onRowHoverStart`/`onRowHoverEnd`/`onRowFocus`/row-double-click
   * handlers through it (`onDoubleClick` added for the
   * double-click-opens-peek follow-up — see {@link isInteractiveRowTarget}
   * for the guard a caller's own handler should apply first).
   */
  getRowProps?: (
    row: TData,
  ) => Pick<ComponentProps<"tr">, "onPointerEnter" | "onPointerLeave" | "onFocus" | "onDoubleClick">;

  /**
   * The id of one row to visually highlight — a transparent-primary
   * background (`bg-primary/10`, opaque `color-mix()` equivalent on
   * sticky/pinned cells, same recipe as hover/selected already use),
   * applied via `data-state="highlighted"`. Generic, like `getRowProps`
   * above: `DataTable` has no concept of WHY a row is highlighted — the
   * collection list view's Inspect peek is the first caller, passing its
   * own `peekId`. Precedence: a row
   * selected for bulk actions always wins (`data-state="selected"`
   * takes priority over `"highlighted"` at the point this is computed —
   * never both at once), and highlighted always wins over hover (an
   * `!` on the highlighted rule in `ui/table.tsx` — hovering the
   * currently-peeked row must not make it look like any other row).
   */
  highlightedRowId?: string;

  // Loading

  /**
   * Whether initial data is loading.
   * Shows loading skeleton in table body.
   */
  isPending?: boolean;

  // Sorting

  /**
   * The list's current sort (one `{ field, order }`, never
   * TanStack's multi-column `SortingState`). `undefined` means no column is
   * actively driving the sort — every sortable header then renders unsorted.
   */
  sort?: CollectionTableSort<string>;

  /**
   * Invoked with the next sort state when a sortable header is clicked
   * (`undefined` clears back to `defaultView.sort`). Only columns whose
   * `ColumnDef.enableSorting` is `true` render as clickable — set centrally
   * by `getCollectionColumnDefs` from each field's `admin.enableSorting`.
   */
  onSortChange?: (sort: CollectionTableSort<string> | undefined) => void;

  /**
   * `true` while a search is active — every sortable header disables itself
   * and shows "Sorted by relevance" instead of calling
   * `onSortChange`.
   */
  sortDisabled?: boolean;

  // Column order, visibility, pinning, resizing

  /**
   * The active view's FULL column list — every field, exactly once, in
   * display order, each a {@link ColumnEntry} (possibly carrying `width`/
   * `pinned`/`hidden` overrides). `undefined` keeps TanStack's own natural
   * (declaration) order, every column visible, nothing pinned/resized
   * beyond each columnDef's own static `size` (an unmigrated caller keeps
   * today's behavior). One array drives order, visibility, pinning
   * (sticky left/right groups, offsets from `column.getStart`/`.getAfter`),
   * AND resizing (each column's CSS width) together.
   */
  columnEntries?: ColumnEntry<string>[];

  /**
   * Invoked when the user RESIZES a column via its header's own drag handle
   * or focused `ArrowLeft`/`ArrowRight` — the ONE way this component itself
   * mutates `columnEntries` (reorder/hide/pin all come from the columns
   * menu instead, `ListViewColumnsAction`/`DataTableColumnsMenu`, which calls
   * the SAME setter the caller passes there — resizing is NOT
   * controlled from this menu, only from the header's own drag handle.
   * Called with the FULL next array (one entry's `width` replaced), never a
   * partial patch. Omit to make every column's width effectively read-only
   * (the resize handle still drags visually but never commits).
   */
  onColumnEntriesChange?: (columns: ColumnEntry<string>[]) => void;

  /** Row density, cookie-backed by the caller. @default "comfortable" */
  density?: ListDensity;

  // Pagination footer

  /** The current page size — used ONLY to label the Load More button ("Load 25 more"); the Select itself renders in `ListViewToolbar`, not here. */
  pageSize?: number;

  /** Whether `totalCount` hit `collection.admin.view.state.countLimit` — the footer then shows `"{totalCount.toLocaleString()}+"` instead of the bare number. Ignored when `totalCount` is `null`/`undefined`. */
  totalDocsCapped?: boolean;

  // Empty and error states

  /** Rendered in place of the table body when `data.length === 0 && isDone` — one of `ListViewEmptyState`'s three variants, chosen by the caller (`CollectionListView`), since only it knows whether a search/filter is active. */
  emptyState?: ReactNode;

  /** Rendered in place of the whole scroll area (header included) when the underlying query failed — `ListViewQueryError`, built by the caller from `useVexListQuery`'s error. Takes priority over `emptyState`. */
  queryError?: ReactNode;

  /**
   * `true` while the CURRENT page is stale (`usePaginatedQuery`'s own
   * `isPlaceholderData`) — a view/filter/sort switch keeps
   * showing the PREVIOUS query's rows, dimmed (`opacity-60`) and marked
   * `aria-busy="true"` on `<tbody>`, instead of a blank/loading frame,
   * until the new page replaces them. Rows stay fully interactive while
   * this is `true` — Load More and row actions on the stale rows remain
   * valid.
   */
  isRefetching?: boolean;
}

/**
 * Generic data table component with Load More pagination and row selection.
 *
 * Renders `DataTableHeader` (the sticky `<thead>`), `DataTableBody` (the
 * settled rows or loading skeleton), and `DataTableFooter` (the "Showing N
 * of M" / Load More status line) inside a shared `ScrollArea`/`Table` frame
 * — this file owns the TanStack Table instance (row selection, column
 * visibility/order/pinning), the density/row-class derivation, and the
 * sticky-header-height measurement effect; `useDataTableColumnResize` owns
 * the custom column-resize state all three child components read from.
 *
 * @param props - {@link DataTableProps}.
 * @returns The rendered table (or its error/empty-state substitute), plus the pinned footer.
 */
export function DataTable<TData extends VexDocument>({
  data,
  columns: baseColumns,

  isDone = true,
  onLoadMore,
  isLoadingMore = false,
  totalCount,

  enableRowSelection,
  selectedIds = [],
  onSelectionChange,

  sort,
  onSortChange,
  sortDisabled,

  columnEntries,
  onColumnEntriesChange,
  density = "comfortable",

  pageSize,
  totalDocsCapped,

  emptyState,
  queryError,
  isRefetching = false,
  isPending = false,
  getRowProps,
  highlightedRowId,
}: DataTableProps<TData>): ReactNode {
  // Keyed by `_id` (`getRowId` below), not by row index — a row removed from `data` after a
  // delete simply has no matching key here anymore, rather than a stale index pointing at a
  // different row once the array re-renders shorter.
  const rowSelection = useMemo<RowSelectionState>(
    () => Object.fromEntries(selectedIds.map((id) => [id, true])),
    [selectedIds],
  );

  // Computed early (not just once near the render return) so `checkboxColumn`'s own `header`
  // function below can disable the "select all" checkbox while the skeleton body is showing —
  // the header row renders unconditionally (pending or not), unlike the body, which swaps to a
  // completely different skeleton `TableBody` branch further down.
  const isInitialLoading = isPending && data.length === 0;

  // Add checkbox column if row selection enabled
  const columns = useMemo(() => {
    if (!enableRowSelection) return baseColumns;

    const checkboxColumn: ColumnDef<TData> = {
      id: "select",
      header: ({ table }) => (
        <div className={SELECTION_CHECKBOX_WRAPPER_CLASS}>
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            disabled={isInitialLoading}
            aria-label="Select all rows"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className={SELECTION_CHECKBOX_WRAPPER_CLASS}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Select row ${row.id}`}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      // This column's width is NEVER read from `columnDef.size`/`liveWidth()`
      // at all — `resolveColumnWidthStyle` returns `undefined` unconditionally
      // for the select column, which sizes itself via
      // `SELECTION_CELL_SHARED_CLASS`'s own hardcoded `w-12` instead. `size`
      // here is purely documentation of that same 48px intent.
      size: 48,
    };

    return [checkboxColumn, ...baseColumns];
  }, [baseColumns, enableRowSelection, isInitialLoading]);

  const columnVisibility = useMemo(
    () => {
      const hiddenByField = new Map<string, boolean>();
      for (const entry of columnEntries ?? []) {
        hiddenByField.set(columnEntryField(entry), typeof entry === "string" ? false : (entry.hidden ?? false));
      }
      return Object.fromEntries(
        columns
          .filter((c) => c.enableHiding)
          .map((c) => [
            c.id as string,
            columnEntries === undefined ? true : !(hiddenByField.get(c.id as string) ?? false),
          ]),
      );
    },
    [columns, columnEntries],
  );

  // Resolves `columnEntries` (every data field) against this
  // table's actual id list: walks the NATURAL order (`select` first,
  // `_status`/data fields/`actions` after, whichever `columns` itself
  // already declares), and at each position whose id IS named in
  // `columnEntries`, substitutes the NEXT entry from `columnEntries`' own
  // sequence (preserving the caller's chosen relative order among just
  // those fields); an id NOT named in `columnEntries` (`select`/`_status`/
  // `actions`, none of them real data fields) keeps its fixed natural
  // position untouched. `undefined` when the caller passed no
  // `columnEntries` at all — TanStack Table's OWN internal `state.columnOrder`
  // (its `useReactTable` option, fed by `resolvedColumnOrder` below — NOT the removed vex
  // `columnOrder` PROP this component took before `columnEntries` replaced it, see the
  // `columnEntries` doc comment above) then stays unset, i.e. the natural declaration
  // order (today's unmigrated behavior, unchanged).
  const resolvedColumnOrder = useMemo<string[] | undefined>(() => {
    if (columnEntries === undefined) return undefined;
    const order = columnEntries.map((entry) => columnEntryField(entry));
    const reorderable = new Set(order);
    let cursor = 0;
    return columns.map((c) => {
      const id = c.id as string;
      return reorderable.has(id) ? order[cursor++]! : id;
    });
  }, [columns, columnEntries]);

  // The pinned groups — `select` is ALWAYS first in `left`
  // (when row selection is enabled) and `actions` is ALWAYS last in
  // `right` (when a row-actions column exists), "stays outermost": a user-pinned data column's own sticky offset
  // (`column.getStart`/`.getAfter` below) therefore automatically accounts
  // for their 48px without this component needing to special-case it.
  const columnPinning = useMemo<ColumnPinningState>(() => {
    const left: string[] = enableRowSelection ? ["select"] : [];
    const right: string[] = [];
    for (const entry of columnEntries ?? []) {
      if (typeof entry === "string") continue;
      if (entry.pinned === "left") left.push(entry.field);
      else if (entry.pinned === "right") right.push(entry.field);
    }
    if (baseColumns.some((c) => c.id === "actions")) right.push("actions");
    return { left, right };
  }, [baseColumns, columnEntries, enableRowSelection]);
  // `ColumnPinningState`'s own type makes both fields optional — always
  // provided above, so these two locals are never actually `undefined`,
  // just type-narrowed once here instead of at every one of their many
  // read sites below.
  const pinnedLeftIds = columnPinning.left ?? [];
  const pinnedRightIds = columnPinning.right ?? [];

  const containerRef = useRef<HTMLDivElement>(null);
  const {
    liveDrag,
    activeDividerFieldId,
    setHoveredDividerFieldId,
    liveWidth,
    startResize,
    handleResizeKeyDown,
    minColumnWidth,
    maxColumnWidth,
  } = useDataTableColumnResize(containerRef, columnEntries, onColumnEntriesChange);

  const table = useReactTable({
    data,
    columns,

    // VexCMS sorts by exactly one `{ field, order }`, never
    // TanStack's multi-column `SortingState` — `sort`/`onSortChange` are
    // read directly by `DataTableHeader`, never fed into this table's own
    // sorting state.
    enableSorting: false,

    // Row selection — controlled, keyed by `_id`.
    enableRowSelection,
    getRowId: (row) => row._id,

    state: {
      rowSelection,
      columnVisibility,
      columnOrder: resolvedColumnOrder,
      columnPinning,
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
    },

    // Core
    getCoreRowModel: getCoreRowModel(),
  });

  const rowClass = DENSITY_ROW_CLASS[density];

  // Post-mount measurement (never during SSR, so first paint is unaffected): publishes the
  // sticky header row's height as `--vex-table-header-h` on the ScrollArea root, so the
  // vertical scrollbar track starts BELOW the header (only the body rows scroll; the track
  // never overlaps the header). Written straight to the DOM (no state, no re-render); before
  // this first measurement the track is thumbless anyway. The row-actions trigger is NOT
  // nudged when the scrollbar appears: it stays centered in
  // its cell at all times. Observers re-attach when the table/empty-state/skeleton branch
  // may have swapped (`[data.length, isPending, isDone, density, queryError]` — the error
  // branch unmounts the ScrollArea, so recovery needs a fresh measurement).
  useEffect(() => {
    const root = containerRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area"]');
    const thead = containerRef.current?.querySelector<HTMLElement>('[data-slot="table-header"]');
    if (!root || !thead) return;
    const measure = () => root.style.setProperty("--vex-table-header-h", `${thead.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(thead);
    return () => observer.disconnect();
  }, [data.length, isPending, isDone, density, queryError]);

  if (queryError) {
    return <div className="flex min-h-0 flex-1 flex-col gap-2">{queryError}</div>;
  }

  const headerRow = table.getHeaderGroups()[0];

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border"
      ref={containerRef}
    >
      {/*
       * `rounded-md border` lives on THIS outer wrapper (not `ScrollArea`'s own
       * className, as before) and the footer carries NO independent border of
       * its own beyond its existing `border-t` — the old
       * split (`ScrollArea`'s own full 4-side border + an 8px `gap-2` + the
       * footer's own `border-t`) painted as a visible DOUBLE line (the
       * ScrollArea's bottom edge, then a gap, then the footer's top edge).
       * One shared frame + one internal divider (`border-t`) reads as a
       * single line. `overflow-hidden` clips `ScrollArea`'s own square
       * corners (its `rounded-[inherit]` Viewport now inherits an unrounded
       * parent, since the radius moved up a level) to this wrapper's own
       * rounded corners — visually identical from the outside.
       */}
      <ScrollArea
        verticalScrollbarClassName="top-[var(--vex-table-header-h,0px)]! data-vertical:h-auto"
        className="min-h-0 flex-1"
      >
        {data.length === 0 && isDone && !isPending && emptyState ? (
          <div className="flex h-full items-center justify-center">{emptyState}</div>
        ) : (
          <Table className="border-separate border-spacing-0 table-fixed">
            <DataTableHeader
              table={table}
              rowClass={rowClass}
              pinnedLeftIds={pinnedLeftIds}
              pinnedRightIds={pinnedRightIds}
              sort={sort}
              onSortChange={onSortChange}
              sortDisabled={sortDisabled}
              liveDrag={liveDrag}
              activeDividerFieldId={activeDividerFieldId}
              liveWidth={liveWidth}
              startResize={startResize}
              handleResizeKeyDown={handleResizeKeyDown}
              minColumnWidth={minColumnWidth}
              maxColumnWidth={maxColumnWidth}
              setHoveredDividerFieldId={setHoveredDividerFieldId}
            />
            <DataTableBody
              isInitialLoading={isInitialLoading}
              table={table}
              headerRow={headerRow}
              pageSize={pageSize}
              knownRowCount={totalCount}
              rowClass={rowClass}
              density={density}
              pinnedLeftIds={pinnedLeftIds}
              pinnedRightIds={pinnedRightIds}
              isRefetching={isRefetching}
              getRowProps={getRowProps}
              highlightedRowId={highlightedRowId}
              activeDividerFieldId={activeDividerFieldId}
              liveWidth={liveWidth}
            />
          </Table>
        )}
      </ScrollArea>

      <DataTableFooter
        dataLength={data.length}
        isInitialLoading={isInitialLoading}
        isDone={isDone}
        pageSize={pageSize}
        totalCount={totalCount}
        totalDocsCapped={totalDocsCapped}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </div>
  );
}
