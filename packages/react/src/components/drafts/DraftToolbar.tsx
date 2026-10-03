"use client";

import type { VexVersionStatus } from "@vexcms/core";
import { Button } from "../ui";
import { StatusBadge } from "./StatusBadge";

/** One toolbar button's wiring, supplied by the owning edit view. */
export interface DraftToolbarAction {
  /** Fires the view's own mutation handler. */
  onClick: () => void;
  /** Shows the button's spinner while the mutation is in flight. */
  isPending: boolean;
  /** Permission/state gate computed by the view (e.g. `!canSaveDraft`). */
  disabled: boolean;
}

/** Props for {@link DraftToolbar}. */
export interface DraftToolbarProps {
  /**
   * The loaded row's `vex_status`. `undefined` when nothing is stored yet
   * (a versioned global before its first save) — the badge is hidden then,
   * since there is no state to describe.
   */
  status: VexVersionStatus | undefined;
  /** Save Draft button wiring. */
  saveDraft: DraftToolbarAction;
}

/**
 * Draft-workflow controls for a versioned collection document or global:
 * the publish-state badge and one button per draft action. Shared by
 * `CollectionEditView` and `GlobalEditView`; owns no mutations — each view
 * passes its own handlers, since the two write through different endpoints.
 *
 * Renders a fragment so the buttons flow inside the caller's existing
 * header button row, beside its Preview/Revalidate buttons.
 *
 * @param props - See {@link DraftToolbarProps}.
 * @returns The badge (when `status` is set) followed by the action buttons.
 * @throws Never.
 *
 * @example
 * ```tsx
 * <DraftToolbar
 *   status={isDraftDoc ? "draft" : "published"}
 *   saveDraft={{ onClick: handleSaveDraft, isPending: isSavingDraft, disabled: !canSaveDraft }}
 * />
 * ```
 */
export function DraftToolbar(props: DraftToolbarProps) {
  return (
    <>
      {props.status && <StatusBadge status={props.status} />}
      <Button
        type="button"
        variant="outline"
        className="transition-all duration-300"
        isPending={props.saveDraft.isPending}
        disabled={props.saveDraft.disabled}
        onClick={props.saveDraft.onClick}
      >
        Save Draft
      </Button>
    </>
  );
}
