"use client";

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../ui";

/** Props for {@link SavedListViewActionsMenu}. */
export interface SavedListViewActionsMenuProps {
  /** Whether Rename is actionable for the active view (disabled, not hidden, for `default`/`config` sources). */
  canRename: boolean;
  /** Whether Delete is actionable for the active view (disabled, not hidden, for `default`/`config` sources). */
  canDelete: boolean;
  /** Whether "Promote to shared" renders at all — only a local view, with create + shared-view access. */
  canPromote: boolean;
  onRename: () => void;
  onPromote: () => void;
  onDelete: () => void;
}

/**
 * The active view's ellipsis actions menu (Rename/Promote to shared/Delete) — the dialogs
 * these open (rename reuses `SaveListViewDialog`; delete/promote are
 * `SavedListViewDeleteDialog`/`SavedListViewPromoteDialog`) and their open/mutation state
 * are owned by `SavedListViewTabs` (index.tsx); this component only renders the trigger
 * button + menu and forwards clicks.
 * @param props - See {@link SavedListViewActionsMenuProps}.
 * @returns The ellipsis dropdown trigger + menu.
 */
export function SavedListViewActionsMenu(props: SavedListViewActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            icon="EllipsisVertical"
            iconPosition="center"
            aria-label="View actions"
            className="hidden shrink-0 self-center @md/list:inline-flex"
          />
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem disabled={!props.canRename} onClick={props.onRename}>
          Rename
        </DropdownMenuItem>
        {props.canPromote && (
          <DropdownMenuItem onClick={props.onPromote}>Promote to shared</DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" disabled={!props.canDelete} onClick={props.onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
