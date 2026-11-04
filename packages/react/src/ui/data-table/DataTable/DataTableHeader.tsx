"use client";

import { flexRender, type Table } from "@tanstack/react-table";
import type { CollectionTableSort } from "@vexcms/core";
import { Fragment } from "react";
import { cn } from "../../../utils/cn";
import { DIVIDER_HIGHLIGHT_CLASS, resolveResizeGripClass } from "../../resizeHandleStyles";
import { TableHead, TableHeader, TableRow } from "../../table";
import { DataTableSortHeader } from "../DataTableSortHeader";
import {
  ACTIONS_CELL_HEADER_CLASS,
  ALIGNMENT_CLASS,
  HEADER_OPAQUE_BG_CLASS,
  PINNED_DATA_CELL_HEADER_CLASS,
  SELECTION_CELL_HEADER_CLASS,
  SPACER_CELL_CLASS,
  findRightPinnedInsertIndex,
  isSuppressedByPinnedRightGrip,
  previousDrawsBorderRight,
  resolveCellDividerClass,
  resolveColumnWidthStyle,
  resolveDividerZIndexClass,
  resolvePinnedOffsetStyle,
  resolveSpacerGripHeader,
  type DataTableColumnMeta,
} from "./dataTableCellClasses";
import type { UseDataTableColumnResizeResult } from "./useDataTableColumnResize";

export interface DataTableHeaderProps<TData>
  extends Pick<
    UseDataTableColumnResizeResult,
    | "liveDrag"
    | "activeDividerFieldId"
    | "liveWidth"
    | "startResize"
    | "handleResizeKeyDown"
    | "setHoveredDividerFieldId"
  > {
  table: Table<TData>;
  rowClass: string;
  pinnedLeftIds: string[];
  pinnedRightIds: string[];
  sort?: CollectionTableSort<string>;
  onSortChange?: (sort: CollectionTableSort<string> | undefined) => void;
  sortDisabled?: boolean;
}

/**
 * `DataTable`'s own sticky `<thead>` — one `<TableRow>` per `table.getHeaderGroups()`
 * entry (always exactly one, VexCMS never nests column groups), rendering each
 * header's label (plain or `DataTableSortHeader` for a sortable column), its own
 * resize grip/handle/divider-highlight, and — right
 * before the pinned-right group begins — a borderless spacer cell that may itself
 * host the LAST unpinned column's relocated grip (`resolveSpacerGripHeader`'s own
 * doc comment). Pulled out of `DataTable/index.tsx` (Phase 3 of the structure
 * refactor) as a pure split — same JSX, same closures over the resize state
 * `useDataTableColumnResize` now owns, just passed down as props instead of
 * captured directly.
 */
export function DataTableHeader<TData>({
  table,
  rowClass,
  pinnedLeftIds,
  pinnedRightIds,
  sort,
  onSortChange,
  sortDisabled,
  liveDrag,
  activeDividerFieldId,
  liveWidth,
  startResize,
  handleResizeKeyDown,
  setHoveredDividerFieldId,
}: DataTableHeaderProps<TData>) {
  return (
    <TableHeader className={cn("sticky top-0 z-10", HEADER_OPAQUE_BG_CLASS)}>
      {table.getHeaderGroups().map((hg) => {
        const spacerIndex = findRightPinnedInsertIndex(hg.headers, (h) => h.column.getIsPinned());
        const spacerGripHeader = resolveSpacerGripHeader(hg.headers, spacerIndex);
        return (
          <TableRow key={hg.id} className={cn(rowClass, `hover:${HEADER_OPAQUE_BG_CLASS}`)}>
            {hg.headers.map((header, index) => {
              const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
              const isSelectColumn = header.column.id === "select";
              const isActionsColumn = header.column.id === "actions";
              const pinnedSide = header.column.getIsPinned();
              const isPinnedDataColumn = pinnedSide !== false && !isSelectColumn && !isActionsColumn;
              const isResizeBoundaryLeft = pinnedSide === "left" && header.column.id === pinnedLeftIds.at(-1);
              const isResizeBoundaryRight = pinnedSide === "right" && header.column.id === pinnedRightIds[0];
              const width = liveWidth(header.column.id, header.column.columnDef.size);
              // Developer-reported audit: `isResizable` previously only
              // excluded `select`/`actions` (both ALWAYS non-resizable,
              // hardcoded) — a column whose OWN `columnDef.enableResizing`
              // is explicitly `false` (a standard TanStack `ColumnDef`
              // option, no caller sets it yet, but the component must
              // still honor it like any other `ColumnDef` field) got a
              // grip anyway. `!== false` (not `=== true`) — absent/
              // `undefined` still means resizable, the established default.
              const isResizable =
                !isSelectColumn && !isActionsColumn && header.column.columnDef.enableResizing !== false;
              // This column's own grip/handle/highlight is rendered in the
              // SPACER cell instead, right before it (`resolveSpacerGripHeader`'s
              // own doc comment) — suppressed here so there's no second copy.
              const isSpacerGripColumn = spacerGripHeader?.column.id === header.column.id;
              // This column's own right edge sits exactly at the pinned-right
              // boundary, which the NEXT column (the first pinned-right one)
              // already draws its own grip for — suppressed here so there's
              // no second copy (`isSuppressedByPinnedRightGrip`'s own doc
              // comment: duplicate-grip boundary bug).
              const isSuppressedByBoundaryGrip = isSuppressedByPinnedRightGrip(hg.headers, index, pinnedRightIds);
              const isDividerActive = activeDividerFieldId === header.column.id;
              // NOT `header.column.getCanSort()` — TanStack's own `getCanSort()`
              // is gated by the table-level `enableSorting: false` option set
              // above (deliberately, to disable TanStack's OWN internal sort
              // state machinery), which makes `getCanSort()`
              // return `false` for EVERY column regardless of its own
              // `columnDef.enableSorting`. Reading the columnDef's own
              // `enableSorting` directly is what `getCollectionColumnDefs`'s
              // `resolveListViewColumnConfig`-sourced value (this JSDoc's own
              // `onSortChange` comment above) was always meant to drive.
              const isSortable = header.column.columnDef.enableSorting === true;
              const headerContent = isSortable ? (
                <DataTableSortHeader
                  label={meta?.label ?? header.column.id}
                  field={header.column.id}
                  sort={sort}
                  onSortChange={onSortChange ?? (() => {})}
                  enableSorting
                  disabled={sortDisabled}
                />
              ) : (
                flexRender(header.column.columnDef.header, header.getContext())
              );
              // `aria-sort` (WAI-ARIA grid convention: on the `<th>` itself, not
              // the inner sort button) — `undefined` (omitted) for a non-sortable
              // column; `"none"` for a sortable column that ISN'T the active sort
              // field, including every sortable column while search is active
              // (`sort` itself is `undefined` then — "parked"
              // rule in `ListViewLayout.tsx` — `sort?.field` can never match, so this
              // falls out of the SAME comparison with no extra `sortDisabled`
              // branch needed); `"ascending"`/`"descending"` for the active field.
              const ariaSort: "ascending" | "descending" | "none" | undefined = !isSortable
                ? undefined
                : sort?.field !== header.column.id
                  ? "none"
                  : sort.order === "asc"
                    ? "ascending"
                    : "descending";
              const headerCell = (
                <TableHead
                  key={header.id}
                  // `aria-labelledby` (not `aria-label`) pointing at the label
                  // content `<div>` below — name-from-content would otherwise
                  // concatenate the resize handle's OWN `aria-label` into this
                  // cell's accessible name too, e.g. "Title Resize Title column"
                  // (developer/sibling-agent-reported via DataTable's own test
                  // suite). Referencing the label element directly (rather than
                  // a hand-computed string) stays correct for ANY header
                  // content, including `DataTableSortHeader`'s own rendered
                  // text, not just a plain string. `undefined` for
                  // `select`/`actions`, whose accessible name correctly comes
                  // from their real content (the checkbox/trigger), not a label.
                  aria-labelledby={isSelectColumn || isActionsColumn ? undefined : `${header.id}-label`}
                  aria-sort={ariaSort}
                  className={cn(
                    rowClass,
                    "border-b",
                    isResizable && "relative",
                    ALIGNMENT_CLASS[meta?.align ?? "left"],
                    isSelectColumn && SELECTION_CELL_HEADER_CLASS,
                    isActionsColumn && ACTIONS_CELL_HEADER_CLASS,
                    isPinnedDataColumn && PINNED_DATA_CELL_HEADER_CLASS,
                    isPinnedDataColumn && isResizeBoundaryLeft && "border-r",
                    isPinnedDataColumn && isResizeBoundaryRight && "border-l",
                    resolveCellDividerClass({
                      isFirst: index === 0,
                      isSelectColumn,
                      isActionsColumn,
                      isFirstRightPinned: isResizeBoundaryRight,
                      previousHasBorderRight: previousDrawsBorderRight(hg.headers, index, pinnedLeftIds),
                    }),
                  )}
                  style={{
                    ...resolveColumnWidthStyle(width, isSelectColumn, isActionsColumn),
                    ...resolvePinnedOffsetStyle(
                      isPinnedDataColumn ? pinnedSide : false,
                      () => header.column.getStart("left"),
                      () => header.column.getAfter("right"),
                    ),
                  }}
                >
                  {isSelectColumn || isActionsColumn ? (
                    headerContent
                  ) : (
                    <div className="min-w-0 truncate" id={`${header.id}-label`}>
                      {headerContent}
                    </div>
                  )}
                  {isResizable && !isSpacerGripColumn && !isSuppressedByBoundaryGrip && (
                    <div
                      aria-hidden="true"
                      data-active={isDividerActive}
                      className={cn(
                        DIVIDER_HIGHLIGHT_CLASS,
                        resolveDividerZIndexClass(pinnedSide !== false, "highlight"),
                        pinnedSide === "right" ? "left-0" : "right-0",
                      )}
                    />
                  )}
                  {isResizable && !isSpacerGripColumn && !isSuppressedByBoundaryGrip && (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${meta?.label ?? header.column.id} column`}
                      tabIndex={0}
                      className={cn(
                        "absolute top-0 h-full w-1.5 cursor-col-resize touch-none select-none focus-visible:outline-none",
                        resolveDividerZIndexClass(pinnedSide !== false, "handle"),
                        pinnedSide === "right" ? "left-0" : "right-0",
                      )}
                      data-resizing={liveDrag?.fieldId === header.column.id}
                      onMouseDown={startResize(header.column.id, width, pinnedSide === "right")}
                      onTouchStart={startResize(header.column.id, width, pinnedSide === "right")}
                      onMouseEnter={() => setHoveredDividerFieldId(header.column.id)}
                      onMouseLeave={() =>
                        setHoveredDividerFieldId((prev) => (prev === header.column.id ? null : prev))
                      }
                      onFocus={() => setHoveredDividerFieldId(header.column.id)}
                      onBlur={() => setHoveredDividerFieldId((prev) => (prev === header.column.id ? null : prev))}
                      onKeyDown={(event) => handleResizeKeyDown(header.column.id, width, pinnedSide === "right", event)}
                    >
                      <div
                        aria-hidden="true"
                        className={resolveResizeGripClass(pinnedSide === "right" ? "left" : "right")}
                      />
                    </div>
                  )}
                </TableHead>
              );
              if (index !== spacerIndex) return headerCell;
              const spacerMeta = spacerGripHeader?.column.columnDef.meta as DataTableColumnMeta | undefined;
              const spacerGripWidth = spacerGripHeader
                ? liveWidth(spacerGripHeader.column.id, spacerGripHeader.column.columnDef.size)
                : 0;
              return (
                <Fragment key={`spacer-${header.id}`}>
                  <TableHead
                    aria-hidden="true"
                    className={cn(rowClass, SPACER_CELL_CLASS, spacerGripHeader && "relative")}
                  >
                    {spacerGripHeader && (
                      <div
                        aria-hidden="true"
                        data-active={activeDividerFieldId === spacerGripHeader.column.id}
                        className={cn(DIVIDER_HIGHLIGHT_CLASS, resolveDividerZIndexClass(false, "highlight"), "right-0")}
                      />
                    )}
                    {spacerGripHeader && (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${spacerMeta?.label ?? spacerGripHeader.column.id} column`}
                        tabIndex={0}
                        className={cn(
                          "absolute top-0 h-full w-1.5 cursor-col-resize touch-none select-none focus-visible:outline-none",
                          resolveDividerZIndexClass(false, "handle"),
                          "right-0",
                        )}
                        data-resizing={liveDrag?.fieldId === spacerGripHeader.column.id}
                        onMouseDown={startResize(spacerGripHeader.column.id, spacerGripWidth, false)}
                        onTouchStart={startResize(spacerGripHeader.column.id, spacerGripWidth, false)}
                        onMouseEnter={() => setHoveredDividerFieldId(spacerGripHeader.column.id)}
                        onMouseLeave={() =>
                          setHoveredDividerFieldId((prev) => (prev === spacerGripHeader.column.id ? null : prev))
                        }
                        onFocus={() => setHoveredDividerFieldId(spacerGripHeader.column.id)}
                        onBlur={() =>
                          setHoveredDividerFieldId((prev) => (prev === spacerGripHeader.column.id ? null : prev))
                        }
                        onKeyDown={(event) =>
                          handleResizeKeyDown(spacerGripHeader.column.id, spacerGripWidth, false, event)
                        }
                      >
                        <div aria-hidden="true" className={resolveResizeGripClass("right")} />
                      </div>
                    )}
                  </TableHead>
                  {headerCell}
                </Fragment>
              );
            })}
          </TableRow>
        );
      })}
    </TableHeader>
  );
}
