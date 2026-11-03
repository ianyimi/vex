"use client";

import type { EditSlotProps } from "@vexcms/core";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { EditActionsMenuItem } from "../documents/EditActionsMenuItem";
import type { ActionPlacement } from "../ui/ActionsMenu";
import { Button, Icon } from "../ui";

/** Props for {@link LivePreviewToggleAction}. */
export interface LivePreviewToggleActionProps extends EditSlotProps {
  /**
   * Which surface this render is for (decision: responsive header collapse) — `"inline"`
   * (default) renders the header button, `"menu"` renders an `EditActionsMenuItem`. Only
   * `CollectionEditView`/`GlobalEditView` ever pass `"menu"`, via `useHeaderActionsCollapse`,
   * once the measured header is too narrow to hold every action on one row.
   */
  placement?: ActionPlacement;
}

/**
 * Built-in `vex.livePreview` contribution for `edit.header.actions` — and, once the header
 * collapses it, `edit.actionsMenu` too (same component, different `placement`, never both at
 * once — only one of the two outlets ever includes it in its resolved list at a time). Renders
 * nothing when the resource has no resolved `livePreview` config (`runtime.livePreview` is
 * `undefined`).
 *
 * @param props - `{ kind, slug, placement? }` — `kind`/`slug` unused; the panel state travels
 *   through `useDocumentEditRuntime`.
 * @returns The Preview toggle button or menu item, or `null`.
 */
export function LivePreviewToggleAction(props: LivePreviewToggleActionProps) {
  const runtime = useDocumentEditRuntime();
  if (!runtime.livePreview) return null;
  const { toggle, isOpen } = runtime.livePreview;

  if (props.placement === "menu") {
    return (
      <EditActionsMenuItem onSelect={toggle} icon={<Icon name={isOpen ? "Eye" : "EyeOff"} />}>
        Preview
      </EditActionsMenuItem>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      icon={isOpen ? "Eye" : "EyeOff"}
      aria-pressed={isOpen}
    >
      Preview
    </Button>
  );
}
