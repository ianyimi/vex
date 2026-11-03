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
} from "../ui/alert-dialog";

/** Props for {@link UnsavedChangesDialog}. */
export interface UnsavedChangesDialogProps {
  /** Whether the dialog is open — mirrors a currently blocked in-app navigation. */
  open: boolean;
  /** Fires with `false` on Stay, Escape, or an overlay click. */
  onOpenChange: (open: boolean) => void;
  /** Lets the blocked navigation continue. */
  onLeave: () => void;
}

/**
 * Stay / Leave confirmation (decision 3) shown when the navigation-blocker
 * adapter intercepts an in-app link or router navigation, or `useVexNavigate`
 * consults the guard, while the edit view is dirty. The unload case (closing
 * the tab, a hard reload) is handled separately by the browser's native
 * `beforeunload` prompt, which forbids custom UI — this dialog never renders
 * for that path.
 *
 * @param props - {@link UnsavedChangesDialogProps}.
 * @returns The Stay / Leave alert dialog.
 */
export function UnsavedChangesDialog(props: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave this page, they will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={props.onLeave}>
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
