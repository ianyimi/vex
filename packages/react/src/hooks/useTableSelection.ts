"use client";

import { useState, useCallback, useMemo } from "react";
import type { SelectionState, SelectionMode } from "@vexcms/core";

/**
 * Props for useTableSelection hook.
 */
export interface UseTableSelectionProps {
  /** Total count of items in the table (for "all" mode). */
  totalCount?: number;
  /** Callback when selection state changes. */
  onSelectionChange?: (state: SelectionState) => void;
}

/**
 * Return type of useTableSelection hook.
 */
export interface UseTableSelectionReturn {
  /** Current selection state. */
  state: SelectionState;
  /** Toggle selection for a single row. */
  toggleRow: (id: string) => void;
  /** Select all rows on current page. */
  selectPage: (pageIds: string[]) => void;
  /** Deselect all rows. */
  clearSelection: () => void;
  /** Toggle "select all in table" mode. */
  toggleSelectAll: () => void;
  /** Toggle "inverse" mode (everything selected except deselected). */
  toggleInverseMode: () => void;
  /** Check if a row is selected. */
  isRowSelected: (id: string) => boolean;
  /** Get count of selected items (handles inverse mode). */
  getSelectionCount: () => number;
}

/**
 * Manages row selection state for data tables with bulk actions.
 *
 * Supports three selection modes:
 * - `page`: Select all rows on current page
 * - `all`: Select all rows in the entire table
 * - `inverse`: Select all rows except explicitly deselected ones
 *
 * @param props - Selection configuration
 * @returns Selection state and control functions
 *
 * @example
 * ```tsx
 * const selection = useTableSelection({ totalCount: 500 });
 *
 * <Checkbox
 *   checked={selection.isRowSelected(row.id)}
 *   onCheckedChange={() => selection.toggleRow(row.id)}
 * />
 *
 * <Button onClick={selection.toggleSelectAll}>
 *   Select all {selection.state.totalCount} items
 * </Button>
 * ```
 */
export function useTableSelection(props: UseTableSelectionProps = {}): UseTableSelectionReturn {
  const { totalCount, onSelectionChange } = props;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<SelectionMode>("none");

  const state: SelectionState = useMemo(() => ({ selectedIds, mode }), [selectedIds, mode]);

  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        // If no items selected after toggle, reset mode to "none"
        if (next.size === 0) {
          setMode("none");
        } else if (mode === "none") {
          setMode("page");
        }

        onSelectionChange?.({ selectedIds: next, mode });
        return next;
      });
    },
    [mode, onSelectionChange],
  );

  const selectPage = useCallback(
    (pageIds: string[]) => {
      const next = new Set(pageIds);
      setSelectedIds(next);
      setMode(next.size > 0 ? "page" : "none");
      onSelectionChange?.({
        selectedIds: next,
        mode: next.size > 0 ? "page" : "none",
      });
    },
    [onSelectionChange],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setMode("none");
    onSelectionChange?.({ selectedIds: new Set(), mode: "none" });
  }, [onSelectionChange]);

  const toggleSelectAll = useCallback(() => {
    if (mode === "all") {
      // Deselect all
      clearSelection();
    } else {
      // Select all in table
      setMode("all");
      setSelectedIds(new Set()); // IDs will be fetched on bulk action
      onSelectionChange?.({ selectedIds: new Set(), mode: "all" });
    }
  }, [mode, clearSelection, onSelectionChange]);

  const toggleInverseMode = useCallback(() => {
    if (mode === "inverse") {
      // Exit inverse mode
      clearSelection();
    } else {
      // Enter inverse mode (everything selected except deselected)
      setMode("inverse");
      setSelectedIds(new Set()); // IDs represent EXCLUDED items in this mode
      onSelectionChange?.({ selectedIds: new Set(), mode: "inverse" });
    }
  }, [mode, clearSelection, onSelectionChange]);

  const isRowSelected = useCallback(
    (id: string) => {
      if (mode === "all") return true;
      if (mode === "inverse") return !selectedIds.has(id);
      return selectedIds.has(id);
    },
    [mode, selectedIds],
  );

  const getSelectionCount = useCallback(() => {
    if (mode === "all") return totalCount ?? 0;
    if (mode === "inverse") return (totalCount ?? 0) - selectedIds.size;
    return selectedIds.size;
  }, [mode, selectedIds, totalCount]);

  return {
    state,
    toggleRow,
    selectPage,
    clearSelection,
    toggleSelectAll,
    toggleInverseMode,
    isRowSelected,
    getSelectionCount,
  };
}
