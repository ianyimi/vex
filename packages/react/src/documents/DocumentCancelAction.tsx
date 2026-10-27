"use client";

import { useStore } from "@tanstack/react-form";
import type { EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "./VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { EditActionsMenuItem } from "./EditActionsMenuItem";
import type { ActionPlacement } from "../ui/ActionsMenu";
import { Button, Icon } from "../ui";

/** Props for {@link DocumentCancelAction}. */
export interface DocumentCancelActionProps extends EditSlotProps {
  /**
   * Which surface this render is for (decision: responsive header collapse) — `"inline"`
   * (default) renders the header button, `"menu"` renders an `EditActionsMenuItem`. Only
   * `CollectionEditView`/`GlobalEditView` ever pass `"menu"`, via `useHeaderActionsCollapse`,
   * once the measured header is too narrow to hold every action on one row even with Delete and
   * Preview already collapsed.
   */
  placement?: ActionPlacement;
}

/**
 * Built-in `vex.cancel` contribution for `edit.header.actions` — and, once the header collapses
 * it, `edit.actionsMenu` too (same component, different `placement`, never both at once — only
 * one of the two outlets ever includes it in its resolved list at a time). Resets the form to its
 * last loaded values — the same inline Cancel button both edit views rendered before this became
 * a contribution, now reorderable/hideable like every other header action (decision 13).
 *
 * @param props - `{ kind, slug, placement? }` — `kind`/`slug` unused beyond satisfying the
 *   contribution shape — `useVexForm`/`useVexDocument` already resolve the loaded resource's
 *   form/state.
 * @returns The Cancel button or menu item.
 */
export function DocumentCancelAction(props: DocumentCancelActionProps) {
  const document = useVexDocument();
  const form = useVexForm()!;
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const disabled = !document.canEdit || isDefaultValue;

  if (props.placement === "menu") {
    return (
      <EditActionsMenuItem disabled={disabled} icon={<Icon name="Undo2" />} onSelect={() => form.reset()}>
        Cancel
      </EditActionsMenuItem>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="transition-all duration-300"
      disabled={disabled}
      onClick={() => form.reset()}
    >
      Cancel
    </Button>
  );
}
