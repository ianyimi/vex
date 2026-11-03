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
 * Inline bulk-action group — count, Delete, Clear — rendered wherever its caller places it
 * (Decision 22: inline in the toolbar area, left of Filter, never a floating overlay).
 *
 * Sized by the `@container/list` root, not `md:` — this group can appear inside a narrow
 * split pane at any viewport width (list-view-overhaul Step 16). Below `@lg/list` it fills
 * the full row width (it stands in for the whole Filter row there, Decision 22's last
 * sentence) with larger touch targets, and Delete/Clear drop to icon-only — a single
 * `<Button>` instance per action whose `aria-label` stays fixed ("Delete"/"Clear selection")
 * while only an inner text `<span>` toggles visibility via CSS, so there is exactly one
 * accessible "Delete"/"Clear" control at any width (never a duplicated trigger with the
 * same accessible name, the trap `ListViewToolbar`'s own ⋯ fold stages had to design around).
 *
 * Rendered standalone by `MediaCollectionListView` (its own selection state, no surrounding
 * toolbar group of its own) only when a selection is non-empty and the caller has delete
 * access. `ListViewToolbar`'s own `list.bulkActions` slot (`vex.list.bulk.delete`,
 * `ListViewBulkDeleteAction`) does NOT use this component — it already sits inside `ListViewToolbar`'s
 * own count/"Select all N loaded"/Clear group, so it renders a bare Delete button instead;
 * wrapping it in this self-contained card too produced two visibly separate bulk bars.
 *
 * @param props - Component props.
 * @param props.selectedCount - Number of selected rows; 0 renders nothing.
 * @param props.onDelete - Opens the bulk-delete confirmation modal.
 * @param props.onClear - Clears the current selection.
 * @param props.isDeleting - Disables both buttons while a delete is in flight.
 * @returns The inline action group, or `null` when nothing is selected.
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
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-background px-4 py-3 @lg/list:w-auto">
      <span className="flex-1 truncate text-sm font-medium">
        {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          icon="Trash2"
          aria-label="Delete"
          className="h-10 px-3 @lg/list:h-7 @lg/list:px-2.5"
        >
          <span className="hidden @lg/list:inline">Delete</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          disabled={isDeleting}
          icon="X"
          aria-label="Clear"
          className="h-10 px-3 @lg/list:h-7 @lg/list:px-2.5"
        >
          <span className="hidden @lg/list:inline">Clear</span>
        </Button>
      </div>
    </div>
  );
}
