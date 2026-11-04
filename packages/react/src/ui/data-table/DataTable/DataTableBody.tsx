"use client";

import { flexRender, type HeaderGroup, type Table } from "@tanstack/react-table";
import { Fragment, type ComponentProps } from "react";
import { cn } from "../../../utils/cn";
import { Button } from "../../button";
import { Checkbox } from "../../checkbox";
import { DIVIDER_HIGHLIGHT_CLASS } from "../../resizeHandleStyles";
import { Skeleton } from "../../skeleton";
import { TableBody, TableCell, TableRow } from "../../table";
import {
  ACTIONS_CELL_BODY_CLASS,
  ALIGNMENT_CLASS,
  PINNED_DATA_CELL_BODY_CLASS,
  SELECTION_CELL_BODY_CLASS,
  SELECTION_CHECKBOX_WRAPPER_CLASS,
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

/** Loading-skeleton row count when the caller gives no `pageSize` (an unmigrated caller). */
const SKELETON_ROW_COUNT_FALLBACK = 8;

export interface DataTableBodyProps<TData extends { _id: string }> {
  isInitialLoading: boolean;
  table: Table<TData>;
  /** `table.getHeaderGroups()[0]` — built from the caller's real `columns`, used to size/shape the skeleton body's own cells identically to the settled body's. */
  headerRow: HeaderGroup<TData> | undefined;
  pageSize?: number;
  /**
   * The best count the caller already knows for THIS view before a single
   * row has rendered — `totalCount` (a prior page's `totalDocs`, or a
   * row-count cookie) — so the skeleton isn't blindly `pageSize` rows tall
   * when the real answer is going to be smaller (a 3-row collection
   * skeletonizing 25 rows, then collapsing, is its own layout shift).
   * `null`/`undefined`/unknown falls back to `pageSize`.
   */
  knownRowCount?: number | null;
  rowClass: string;
  pinnedLeftIds: string[];
  pinnedRightIds: string[];
  isRefetching: boolean;
  getRowProps?: (
    row: TData,
  ) => Pick<ComponentProps<"tr">, "onPointerEnter" | "onPointerLeave" | "onFocus" | "onDoubleClick">;
  highlightedRowId?: string;
  activeDividerFieldId: string | null;
  liveWidth: (columnId: string, declaredSize: number | undefined) => number;
}

/**
 * `DataTable`'s own `<tbody>` — either the loading skeleton (one `Skeleton` cell
 * per header the current instance actually resolved, same `rowClass`/widths the
 * settled rows use) or the settled, real-data rows, each cell sized/bordered/
 * pinned identically to its header counterpart (`DataTableHeader`) via the SAME
 * shared `dataTableCellClasses` helpers. Pulled out of `DataTable/index.tsx`
 * (Phase 3 of the structure refactor) as a pure split — same JSX, same closures
 * over the resize state `useDataTableColumnResize` now owns, just passed down
 * as props (`liveWidth`/`activeDividerFieldId`) instead of captured directly.
 */
export function DataTableBody<TData extends { _id: string }>({
  isInitialLoading,
  table,
  headerRow,
  pageSize,
  knownRowCount,
  rowClass,
  pinnedLeftIds,
  pinnedRightIds,
  isRefetching,
  getRowProps,
  highlightedRowId,
  activeDividerFieldId,
  liveWidth,
}: DataTableBodyProps<TData>) {
  if (isInitialLoading) {
    // Real loading state, no separate skeleton file: the SAME `TableBody`/`TableRow`/
    // `TableCell` the settled rows use, at the SAME `rowClass` (density) height, one
    // `Skeleton` cell per header this instance actually resolved (`headerRow`, built
    // from the caller's real `columns` — never a hand-picked guess), each cell sized
    // via the SAME `resolveColumnWidthStyle` call the header/settled-body loops use —
    // so there is nothing here that can drift from the settled table it's replacing,
    // widths included. The pinned `select`/`actions` columns render their REAL,
    // disabled controls (a disabled `Checkbox`, a disabled ⋯ trigger — both centered
    // exactly like the settled cells via the same wrapper classes/`data-slot`), not a
    // generic bar: there is nothing meaningful to skeletonize about an icon-sized
    // control, and a disabled real control communicates "this row isn't interactive
    // yet" more clearly than an empty cell. Every other column's bar is `w-full`
    // (fills the cell's own content width, matching each column's real resolved
    // width) rather than a fixed guess.
    const pageSizeOrFallback = pageSize ?? SKELETON_ROW_COUNT_FALLBACK;
    // `knownRowCount` (`totalCount`, if the caller already has one — a prior page's
    // `totalDocs`, or a row-count cookie) caps the skeleton at the REAL expected row
    // count instead of always rendering a full page's worth: a 3-row collection
    // skeletonizing `pageSize` (25, or the 8-row fallback) rows then collapsing to 3
    // is its own layout shift, exactly what this skeleton exists to avoid. Unknown
    // (`null`/`undefined`) falls back to `pageSizeOrFallback` unchanged. `Math.max(1,
    // …)` — a genuinely empty collection still renders ONE skeleton row rather than
    // none, so the loading state isn't indistinguishable from the empty state.
    const skeletonRowCount =
      knownRowCount == null ? pageSizeOrFallback : Math.max(1, Math.min(knownRowCount, pageSizeOrFallback));
    return (
      <TableBody>
        {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => {
          const headers = headerRow?.headers ?? [];
          const spacerIndex = findRightPinnedInsertIndex(headers, (h) => h.column.getIsPinned());
          const spacerGripHeader = resolveSpacerGripHeader(headers, spacerIndex);
          return (
            <TableRow key={rowIndex} className={rowClass}>
              {headers.map((header, index) => {
                const isSelectColumn = header.column.id === "select";
                const isActionsColumn = header.column.id === "actions";
                const pinnedSide = header.column.getIsPinned();
                const isPinnedDataColumn = pinnedSide !== false && !isSelectColumn && !isActionsColumn;
                const isResizeBoundaryLeft = pinnedSide === "left" && header.column.id === pinnedLeftIds.at(-1);
                const isResizeBoundaryRight = pinnedSide === "right" && header.column.id === pinnedRightIds[0];
                const isResizable =
                  !isSelectColumn && !isActionsColumn && header.column.columnDef.enableResizing !== false;
                const isSpacerGripColumn = spacerGripHeader?.column.id === header.column.id;
                const isSuppressedByBoundaryGrip = isSuppressedByPinnedRightGrip(headers, index, pinnedRightIds);
                const cell = (
                  <TableCell
                    key={header.id}
                    className={cn(
                      rowClass,
                      "border-b",
                      isResizable && "relative",
                      isSelectColumn && SELECTION_CELL_BODY_CLASS,
                      isActionsColumn && ACTIONS_CELL_BODY_CLASS,
                      isPinnedDataColumn && PINNED_DATA_CELL_BODY_CLASS,
                      isPinnedDataColumn && isResizeBoundaryLeft && "border-r",
                      isPinnedDataColumn && isResizeBoundaryRight && "border-l",
                      resolveCellDividerClass({
                        isFirst: index === 0,
                        isSelectColumn,
                        isActionsColumn,
                        isFirstRightPinned: isResizeBoundaryRight,
                        previousHasBorderRight: previousDrawsBorderRight(headers, index, pinnedLeftIds),
                      }),
                    )}
                    style={{
                      ...resolveColumnWidthStyle(
                        liveWidth(header.column.id, header.column.columnDef.size),
                        isSelectColumn,
                        isActionsColumn,
                      ),
                      ...resolvePinnedOffsetStyle(
                        isPinnedDataColumn ? pinnedSide : false,
                        () => header.column.getStart("left"),
                        () => header.column.getAfter("right"),
                      ),
                    }}
                  >
                    {isSelectColumn ? (
                      <div className={SELECTION_CHECKBOX_WRAPPER_CLASS}>
                        <Checkbox disabled />
                      </div>
                    ) : isActionsColumn ? (
                      <div className="flex items-center justify-center" data-slot="row-actions">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          icon="EllipsisVertical"
                          iconPosition="center"
                          className="shrink-0 text-muted-foreground"
                          aria-label="Loading"
                          disabled
                        />
                      </div>
                    ) : (
                      <Skeleton className="h-3.5 w-full rounded" />
                    )}
                    {isResizable && !isSpacerGripColumn && !isSuppressedByBoundaryGrip && (
                      <div
                        aria-hidden="true"
                        data-active={activeDividerFieldId === header.column.id}
                        className={cn(
                          DIVIDER_HIGHLIGHT_CLASS,
                          resolveDividerZIndexClass(pinnedSide !== false, "highlight"),
                          pinnedSide === "right" ? "left-0" : "right-0",
                        )}
                      />
                    )}
                  </TableCell>
                );
                if (index !== spacerIndex) return cell;
                return (
                  <Fragment key={`spacer-${header.id}`}>
                    <TableCell
                      aria-hidden="true"
                      className={cn(rowClass, SPACER_CELL_CLASS, spacerGripHeader && "relative")}
                    >
                      <Skeleton className="h-3.5 w-full rounded" />
                      {spacerGripHeader && (
                        <div
                          aria-hidden="true"
                          data-active={activeDividerFieldId === spacerGripHeader.column.id}
                          className={cn(
                            DIVIDER_HIGHLIGHT_CLASS,
                            resolveDividerZIndexClass(false, "highlight"),
                            "right-0",
                          )}
                        />
                      )}
                    </TableCell>
                    {cell}
                  </Fragment>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    );
  }

  return (
    <TableBody aria-busy={isRefetching} className={cn(isRefetching && "opacity-60")}>
      {table.getRowModel().rows.map((row) => {
        const cells = row.getVisibleCells();
        const spacerIndex = findRightPinnedInsertIndex(cells, (c) => c.column.getIsPinned());
        const spacerGripHeader = resolveSpacerGripHeader(cells, spacerIndex);
        return (
          <TableRow
            key={row.id}
            className={rowClass}
            data-state={
              row.getIsSelected() ? "selected" : row.original._id === highlightedRowId ? "highlighted" : undefined
            }
            {...getRowProps?.(row.original)}
          >
            {cells.map((cell, index) => {
              const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
              const isSelectColumn = cell.column.id === "select";
              const isActionsColumn = cell.column.id === "actions";
              const pinnedSide = cell.column.getIsPinned();
              const isPinnedDataColumn = pinnedSide !== false && !isSelectColumn && !isActionsColumn;
              const isResizeBoundaryLeft = pinnedSide === "left" && cell.column.id === pinnedLeftIds.at(-1);
              const isResizeBoundaryRight = pinnedSide === "right" && cell.column.id === pinnedRightIds[0];
              const isResizable =
                !isSelectColumn && !isActionsColumn && cell.column.columnDef.enableResizing !== false;
              const isSpacerGripColumn = spacerGripHeader?.column.id === cell.column.id;
              const isSuppressedByBoundaryGrip = isSuppressedByPinnedRightGrip(cells, index, pinnedRightIds);
              const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
              const tableCell = (
                <TableCell
                  key={cell.id}
                  className={cn(
                    rowClass,
                    "border-b",
                    isResizable && "relative",
                    ALIGNMENT_CLASS[meta?.align ?? "left"],
                    isSelectColumn && SELECTION_CELL_BODY_CLASS,
                    isActionsColumn && ACTIONS_CELL_BODY_CLASS,
                    isPinnedDataColumn && PINNED_DATA_CELL_BODY_CLASS,
                    isPinnedDataColumn && isResizeBoundaryLeft && "border-r",
                    isPinnedDataColumn && isResizeBoundaryRight && "border-l",
                    resolveCellDividerClass({
                      isFirst: index === 0,
                      isSelectColumn,
                      isActionsColumn,
                      isFirstRightPinned: isResizeBoundaryRight,
                      previousHasBorderRight: previousDrawsBorderRight(cells, index, pinnedLeftIds),
                    }),
                  )}
                  style={{
                    ...resolveColumnWidthStyle(
                      liveWidth(cell.column.id, cell.column.columnDef.size),
                      isSelectColumn,
                      isActionsColumn,
                    ),
                    ...resolvePinnedOffsetStyle(
                      isPinnedDataColumn ? pinnedSide : false,
                      () => cell.column.getStart("left"),
                      () => cell.column.getAfter("right"),
                    ),
                  }}
                >
                  {isSelectColumn || isActionsColumn ? cellContent : <div className="min-w-0 truncate">{cellContent}</div>}
                  {isResizable && !isSpacerGripColumn && !isSuppressedByBoundaryGrip && (
                    <div
                      aria-hidden="true"
                      data-active={activeDividerFieldId === cell.column.id}
                      className={cn(
                        DIVIDER_HIGHLIGHT_CLASS,
                        resolveDividerZIndexClass(pinnedSide !== false, "highlight"),
                        pinnedSide === "right" ? "left-0" : "right-0",
                      )}
                    />
                  )}
                </TableCell>
              );
              if (index !== spacerIndex) return tableCell;
              return (
                <Fragment key={`spacer-${cell.id}`}>
                  <TableCell
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
                  </TableCell>
                  {tableCell}
                </Fragment>
              );
            })}
          </TableRow>
        );
      })}
    </TableBody>
  );
}
