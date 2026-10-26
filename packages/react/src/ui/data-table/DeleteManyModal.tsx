"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../alert-dialog";

export interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  /**
   * Called when user confirms deletion.
   * Parent component should call vexConvexApi.remove({ ids: [...] })
   */
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
  entityName?: string;
}

/**
 * Confirmation modal for bulk delete actions.
 *
 * Shows count of items to be deleted and warns user that action cannot be undone.
 * Parent component is responsible for calling the remove mutation.
 *
 * @example
 * ```tsx
 * const removeMutation = useMutation(convexMutation(anyApi.vex.remove));
 *
 * const handleBulkDelete = async () => {
 *   await removeMutation.mutateAsync({ ids: selection.selectedIds });
 *   selection.clearSelection();
 * };
 *
 * <BulkDeleteModal
 *   open={deleteModalOpen}
 *   onOpenChange={setDeleteModalOpen}
 *   selectedCount={selection.selectedIds.length}
 *   onConfirm={handleBulkDelete}
 *   isDeleting={removeMutation.isPending}
 *   entityName="posts"
 * />
 * ```
 */
export function BulkDeleteModal({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isDeleting,
  entityName = "items",
}: BulkDeleteModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {selectedCount} {selectedCount === 1 ? entityName.slice(0, -1) : entityName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>
              {selectedCount} {entityName}
            </strong>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
