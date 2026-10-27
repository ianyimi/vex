"use client";

import { Button } from "../button";

/**
 * Props for DataTableBulkActions component.
 */
export interface DataTableBulkActionsProps {
  /** Number of currently selected rows. The bar renders nothing when this is 0. */
  selectedCount: number;
  /** Invoked when the delete button is pressed — opens the confirmation modal. */
  onDelete: () => void;
  /** Invoked when the clear button is pressed — drops the current selection. */
  onClear: () => void;
  /** Whether a bulk delete is in progress; disables both buttons. */
  isDeleting?: boolean;
}

/**
 * Floating bulk action bar, shown while one or more rows are selected.
 *
 * Rendered by {@link DataTable} only when a bulk action is actually available —
 * a caller whose role cannot delete passes no handler, so no bar appears.
 *
 * @param props - Component props.
 * @param props.selectedCount - Number of selected rows; 0 renders nothing.
 * @param props.onDelete - Opens the bulk-delete confirmation modal.
 * @param props.onClear - Clears the current selection.
 * @param props.isDeleting - Disables both buttons while a delete is in flight.
 * @returns The action bar, or `null` when nothing is selected.
 *
 * @example
 * ```tsx
 * <DataTableBulkActions
 *   selectedCount={selectedIds.length}
 *   onDelete={() => setDeleteModalOpen(true)}
 *   onClear={() => setRowSelection({})}
 *   isDeleting={isDeleting}
 * />
 * ```
 */
export function DataTableBulkActions({
  selectedCount,
  onDelete,
  onClear,
  isDeleting,
}: DataTableBulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed z-200 top-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5">
      <span className="text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          icon="Trash2"
        >
          Delete
        </Button>
        <Button variant="outline" size="sm" onClick={onClear} disabled={isDeleting} icon="X">
          Clear
        </Button>
      </div>
    </div>
  );
}
