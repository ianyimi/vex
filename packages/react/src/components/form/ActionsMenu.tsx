"use client";

import type { ReactNode } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../styles/utils";

/**
 * The ⋯ menu every form container uses for its secondary actions — an
 * array's Collapse all / Expand all, a blocks field's header actions, one
 * array item's or block's item actions — so they sit on the same line as the
 * label they belong to instead of wrapping onto rows of their own.
 *
 * @param props.label - Accessible name for the trigger (`"<Field> actions"`).
 * @param props.children - `DropdownMenuItem`s (and separators) to list.
 * @returns The trigger button and its dropdown content.
 */
export function ActionsMenu(props: { label: string; children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            icon="EllipsisVertical"
            iconPosition="center"
            className="shrink-0 text-muted-foreground"
            aria-label={props.label}
          />
        }
      />
      <DropdownMenuContent align="end">{props.children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Where one item action renders — beside the item, or in its ⋯ menu. */
export type ActionPlacement = "inline" | "menu";

/**
 * One item action (duplicate, move, remove) rendered for one surface: as an
 * icon button beside the item, or as an item in its ⋯ menu. Callers pick the
 * surface from `useCompactForm` so an action is never shown in both at
 * once. Array items and blocks use the same icons and styling so the same
 * action reads the same everywhere.
 *
 * @param props.placement - The surface this render is for.
 * @param props.icon - The action's icon element.
 * @param props.label - Menu item text.
 * @param props.ariaLabel - Accessible name for the inline icon button.
 * @param props.disabled - Whether the action is unavailable.
 * @param props.onClick - Performs the action.
 * @param props.destructive - Styles the action as destructive (remove).
 * @returns The inline button or the menu item.
 */
export function SurfacedAction(props: {
  placement: ActionPlacement;
  icon: ReactNode;
  label: string;
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  destructive?: boolean;
}) {
  if (props.placement === "inline") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={props.disabled}
        onClick={props.onClick}
        aria-label={props.ariaLabel}
        className={cn(
          "shrink-0 text-muted-foreground transition-all duration-300",
          props.destructive ? "hover:text-destructive" : "hover:text-foreground",
        )}
      >
        {props.icon}
      </Button>
    );
  }
  return (
    <DropdownMenuItem
      variant={props.destructive ? "destructive" : "default"}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.icon}
      {props.label}
    </DropdownMenuItem>
  );
}

/**
 * One field-level header action (Copy all, Paste, Replace all, Collapse all,
 * Expand all) rendered for one surface: a text button on the field's label
 * row while there is room, or an item in the field's ⋯ menu when there is
 * not — callers render exactly one surface at a time.
 *
 * @param props.placement - The surface this render is for.
 * @param props.icon - The action's icon element (shown in the menu).
 * @param props.label - Button / menu item text.
 * @param props.disabled - Whether the action is unavailable.
 * @param props.onClick - Performs the action.
 * @returns The inline button or the menu item.
 */
export function HeaderAction(props: {
  placement: ActionPlacement;
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  if (props.placement === "inline") {
    return (
      <Button type="button" variant="ghost" size="sm" disabled={props.disabled} onClick={props.onClick}>
        {props.label}
      </Button>
    );
  }
  return (
    <DropdownMenuItem disabled={props.disabled} onClick={props.onClick}>
      {props.icon}
      {props.label}
    </DropdownMenuItem>
  );
}
