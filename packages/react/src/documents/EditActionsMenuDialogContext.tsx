"use client";

import { createContext, use, type ReactNode } from "react";

/**
 * State {@link useEditActionsMenuDialog} exposes to an `edit.actionsMenu` contribution.
 */
export interface EditActionsMenuDialogState {
  /**
   * Opens `node` as the menu's dialog host content. `DocumentEditActionsMenu` renders the host
   * OUTSIDE `DropdownMenuContent`, so it survives the dropdown closing — base-ui unmounts
   * `DropdownMenuContent` and every item inside it the moment a `DropdownMenuItem`'s `onSelect`
   * closes the menu, so an item cannot own a dialog, or any state for a promise that resolves
   * after the click (e.g. Duplicate's create, whose fallback dialog must open once the request
   * rejects — by then the item that started it is already gone).
   */
  open: (node: ReactNode) => void;
  /** Closes the current dialog host content. */
  close: () => void;
}

/**
 * Provides {@link EditActionsMenuDialogState} to every contribution rendered inside one
 * `DocumentEditActionsMenu`'s dropdown. Has no default — {@link useEditActionsMenuDialog} throws
 * outside it, the same pattern as `VexDocumentContext`/`DocumentEditRuntimeContext`.
 */
export const EditActionsMenuDialogContext = createContext<EditActionsMenuDialogState | null>(
  null,
);

/**
 * Provides {@link EditActionsMenuDialogState} — the caller (`DocumentEditActionsMenu`) owns the
 * `useState` backing `value` and renders the current dialog node itself, outside
 * `DropdownMenuContent`; this component only forwards that value through context.
 *
 * @param props.value - The dialog host's `open`/`close` functions.
 * @param props.children - The menu's dropdown content.
 * @returns `children` wrapped in the provider.
 */
export function EditActionsMenuDialogProvider(props: {
  value: EditActionsMenuDialogState;
  children: ReactNode;
}) {
  return (
    <EditActionsMenuDialogContext value={props.value}>{props.children}</EditActionsMenuDialogContext>
  );
}

/**
 * A dialog host for an `edit.actionsMenu` contribution (built-in or project) whose action opens
 * a dialog — directly from a menu item's `onSelect`, or from a promise callback that resolves
 * after the menu has already closed (decision: Step 4 post-implementation note's duplicate
 * fallback, reused here). Calling `open` again replaces the current dialog node; `close` clears
 * it. See {@link EditActionsMenuDialogState.open} for why a contribution cannot render its own
 * dialog inline instead.
 *
 * @returns `{ open, close }`.
 * @throws When rendered outside `DocumentEditActionsMenu`'s dropdown.
 */
export function useEditActionsMenuDialog(): EditActionsMenuDialogState {
  const ctx = use(EditActionsMenuDialogContext);
  if (!ctx) {
    throw new Error(
      "useEditActionsMenuDialog must be used within an edit.actionsMenu contribution, rendered by DocumentEditActionsMenu.",
    );
  }
  return ctx;
}
