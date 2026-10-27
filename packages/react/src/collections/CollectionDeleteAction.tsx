"use client";

import { useState } from "react";
import { CRUD_ACTIONS, vexConvexApi, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexMutation } from "../hooks";
import { usePermission } from "../access";
import { adminHref } from "../admin/adminHref";
import { useVexNavigate } from "../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../documents/useUnsavedChangesGuard";
import { useEditActionsMenuDialog } from "../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../documents/EditActionsMenuItem";
import type { ActionPlacement } from "../ui/ActionsMenu";
import { Button, Icon } from "../ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";

/** Props for {@link CollectionDeleteAction}. */
export interface CollectionDeleteActionProps extends EditSlotProps {
  /**
   * Which surface this render is for (decision: responsive header collapse) — `"inline"`
   * (default) renders the header button, `"menu"` renders an `EditActionsMenuItem`. Only
   * `CollectionEditView` ever passes `"menu"`, via `useHeaderActionsCollapse`, once the measured
   * header is too narrow to hold every action on one row.
   */
  placement?: ActionPlacement;
}

/**
 * Shared delete-mutation wiring for both placements of {@link CollectionDeleteAction} — the
 * permission gate, the mutation, and the delete + navigate sequence. `onConfirmed` runs before
 * the mutation starts (closes whichever confirm UI — local state inline, the dialog host's
 * `close()` from the menu) so a slow request never leaves a stale confirm dialog open under it.
 *
 * @param props - The edit slot's `{ kind, slug }`.
 * @returns `canDelete` (the delete permission), `isPending`, and `handleDelete(onConfirmed)`.
 */
function useCollectionDelete(
  props: EditSlotProps,
): { canDelete: boolean; isPending: boolean; handleDelete: (onConfirmed: () => void) => Promise<void> } {
  const config = useVexConfig();
  const document = useVexDocument();
  const navigate = useVexNavigate();
  const releaseUnsavedChangesGuard = useReleaseUnsavedChangesGuard();

  const canDelete = usePermission({ resource: props.slug, action: CRUD_ACTIONS.delete });

  const { mutateAsync, isPending } = useVexMutation({
    collection: props.slug,
    mutationFn: vexConvexApi.remove,
    operation: "remove",
    getChanges: () => [{ before: document.saved }],
  });

  async function handleDelete(onConfirmed: () => void): Promise<void> {
    onConfirmed();
    try {
      await mutateAsync({ ids: [document.id!], collection: props.slug });
    } catch {
      return;
    }
    releaseUnsavedChangesGuard();
    navigate(adminHref({ type: "collection", slug: props.slug }, config.basePath));
  }

  return { canDelete, isPending, handleDelete };
}

/**
 * Built-in `vex.delete` contribution for `edit.header.actions` — and, once the header collapses
 * it, `edit.actionsMenu` too (decision: responsive header collapse). Collection-only —
 * `CollectionEditView` appends it directly to the builtins it passes into both outlets;
 * `documentEditBuiltinContributions` never includes it.
 *
 * Dispatches to one of two sub-components by `props.placement` rather than branching inline, so
 * each can call its own hooks unconditionally (`useEditActionsMenuDialog` throws outside the
 * menu's dropdown) — only one of the two is ever mounted for a given document, since only one of
 * the two outlets ever includes `vex.delete` in its resolved list at a time.
 *
 * @param props - `{ kind: "collection", slug, placement? }`.
 * @returns The Delete button or menu item, plus its confirmation dialog.
 */
export function CollectionDeleteAction(props: CollectionDeleteActionProps) {
  if (props.placement === "menu") return <CollectionDeleteMenuItem {...props} />;
  return <CollectionDeleteButton {...props} />;
}

/**
 * The inline header-button placement: Delete plus a confirm `Dialog`, both backed by local
 * `confirming` state — this component stays mounted throughout, so `isPending` stays reactive.
 *
 * @param props - The edit slot's `{ kind, slug }`.
 * @returns The Delete button and its confirm dialog.
 * @throws Never — a rejected mutation is toasted (via `useVexMutation`'s own `onError`), never re-thrown.
 */
function CollectionDeleteButton(props: EditSlotProps) {
  const [confirming, setConfirming] = useState(false);
  const { canDelete, isPending, handleDelete } = useCollectionDelete(props);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        icon="Trash2"
        className="transition-all duration-300"
        disabled={!canDelete}
        onClick={() => setConfirming(true)}
      >
        Delete
      </Button>
      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This permanently deletes the document. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              icon="Trash2"
              disabled={isPending}
              onClick={() => {
                void handleDelete(() => setConfirming(false));
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * The collapsed menu-item placement: selecting it opens the SAME confirm dialog through
 * `useEditActionsMenuDialog().open(...)` instead of local state — this component unmounts the
 * instant the dropdown closes on select, so it cannot own the confirm dialog itself.
 *
 * @param props - The edit slot's `{ kind, slug }`.
 * @returns The Delete menu item.
 * @throws Never — a rejected mutation is toasted (via `useVexMutation`'s own `onError`), never re-thrown.
 */
function CollectionDeleteMenuItem(props: EditSlotProps) {
  const dialog = useEditActionsMenuDialog();
  const { canDelete, isPending, handleDelete } = useCollectionDelete(props);

  function openConfirm(): void {
    dialog.open(
      <Dialog open onOpenChange={(open) => !open && dialog.close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This permanently deletes the document. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              icon="Trash2"
              onClick={() => {
                void handleDelete(dialog.close);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
  }

  return (
    <EditActionsMenuItem
      destructive
      disabled={!canDelete || isPending}
      icon={<Icon name="Trash2" />}
      onSelect={openConfirm}
    >
      Delete
    </EditActionsMenuItem>
  );
}
