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
} from "../../../../ui/alert-dialog";

/** Props for {@link SavedListViewDeleteDialog}. */
export interface SavedListViewDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The target view's name — `undefined` while closed (`SavedListViewTabs`' `deleteTarget` is `null`). */
  viewName: string | undefined;
  /** Whether the target view is a shared (vs. local) view — picks the warning copy. */
  isShared: boolean;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * The delete-confirmation dialog — open/mutation state and the actual delete call are owned
 * by `SavedListViewTabs` (index.tsx); this component only renders the confirm UI.
 * @param props - See {@link SavedListViewDeleteDialogProps}.
 * @returns The confirmation dialog.
 */
export function SavedListViewDeleteDialog(props: SavedListViewDeleteDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{props.viewName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {props.isShared
              ? "Everyone with access to this view will lose it."
              : "This view is only visible to you, in this browser."}{" "}
            This can&rsquo;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" isPending={props.isPending} onClick={props.onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
