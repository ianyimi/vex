"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "../button";
import type { UseTableSelectionReturn } from "../../../hooks/useTableSelection";

/**
 * Props for DataTableBulkActions component.
 */
export interface DataTableBulkActionsProps {
  /** Selection state and controls from useTableSelection hook. */
  selection: UseTableSelectionReturn;
  /** Callback when delete button is clicked. */
  onDelete: () => void;
  /** Whether delete action is in progress. */
  isDeleting?: boolean;
}

/**
 * Floating bulk action bar that appears when items are selected.
 *
 * Displays selection count and bulk actions (delete, etc.).
 * Positioned at bottom of table with slide-up animation.
 *
 * @param props - Component props
 * @returns Bulk action bar UI
 *
 * @example
 * ```tsx
 * const selection = useTableSelection({ totalCount: 500 });
 *
 * <DataTableBulkActions
 *   selection={selection}
 *   onDelete={() => setDeleteModalOpen(true)}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DataTableBulkActions({
  selection,
  onDelete,
  isDeleting,
}: DataTableBulkActionsProps) {
  const count = selection.getSelectionCount();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {count} {count === 1 ? "item" : "items"} selected
        </span>
        {selection.state.mode === "all" && (
          <span className="text-xs text-muted-foreground">(all in table)</span>
        )}
        {selection.state.mode === "inverse" && (
          <span className="text-xs text-muted-foreground">(inverse mode)</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="destructive" size="sm" onClick={onDelete} disabled={isDeleting}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selection.clearSelection}
          disabled={isDeleting}
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
