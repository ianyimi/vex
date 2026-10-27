"use client";

import type { ReactNode } from "react";
import { DropdownMenuItem } from "../ui/dropdown-menu";

/** Props for {@link EditActionsMenuItem}. */
export interface EditActionsMenuItemProps {
  /** Runs when the item is chosen (click, Enter, or Space) — wired to `DropdownMenuItem`'s own `onClick`. */
  onSelect: () => void;
  /** Disables the item (e.g. no permission, a mutation already pending). */
  disabled?: boolean;
  /** Leading icon element. */
  icon?: ReactNode;
  /** Styles the item as a destructive action (red text, matching `DropdownMenuItem`'s `variant="destructive"`). */
  destructive?: boolean;
  /** The item's label. */
  children: ReactNode;
}

/**
 * The row every `edit.actionsMenu` contribution renders — a styled `DropdownMenuItem` wrapper so
 * every built-in and project item reads consistently (icon + label, keyboard-accessible,
 * disabled/destructive states) the same way `ui/ActionsMenu`'s `SurfacedAction`/`HeaderAction`
 * keep block/array item actions consistent. Exported from the package barrel so a project's
 * `edit.actionsMenu` contribution renders through the same component the built-ins do.
 *
 * @param props - See {@link EditActionsMenuItemProps}.
 * @returns A `DropdownMenuItem` with the icon placed before the label.
 */
export function EditActionsMenuItem(props: EditActionsMenuItemProps) {
  return (
    <DropdownMenuItem
      variant={props.destructive ? "destructive" : "default"}
      disabled={props.disabled}
      onClick={props.onSelect}
    >
      {props.icon}
      {props.children}
    </DropdownMenuItem>
  );
}
