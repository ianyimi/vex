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

/** Props for {@link SavedListViewPromoteDialog}. */
export interface SavedListViewPromoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The target view's name — `undefined` while closed (`SavedListViewTabs`' `promoteTarget` is `null`). */
  viewName: string | undefined;
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * The "promote to shared" confirmation dialog — open/mutation state and the actual promote
 * call (save-shared then remove-local, Decision 14) are owned by `SavedListViewTabs`
 * (index.tsx); this component only renders the confirm UI.
 * @param props - See {@link SavedListViewPromoteDialogProps}.
 * @returns The confirmation dialog.
 */
export function SavedListViewPromoteDialog(props: SavedListViewPromoteDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Share &ldquo;{props.viewName}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            Everyone with access will be able to see and use this view. It will be removed from your local views.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction isPending={props.isPending} onClick={props.onConfirm}>
            Share view
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
