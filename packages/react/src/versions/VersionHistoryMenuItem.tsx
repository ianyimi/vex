"use client";

import { DRAFT_ACTIONS, type CollectionSlug, type EditSlotProps, type GlobalSlug } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexConfig } from "../config/VexConfigContext";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { useEditActionsMenuDialog } from "../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../documents/EditActionsMenuItem";
import { usePermission } from "../access";
import { Icon } from "../ui";
import { VersionHistoryDialogContent, type VersionHistoryTarget } from "./VersionHistoryPanel";

/**
 * Built-in `vex.versionHistory` contribution for `edit.actionsMenu` (decision: developer
 * feedback — history moved out of the always-inline header row into the ⋯ menu, right after
 * Preview, since it is consulted far less often than Save/Publish/Cancel). Renders nothing for a
 * non-versioned resource, or without `readDrafts`.
 *
 * Selecting the item opens {@link VersionHistoryDialogContent} through
 * `useEditActionsMenuDialog().open(...)` rather than owning the dialog itself — the dropdown
 * unmounts this item the instant it is selected, so any dialog it opens must be hosted outside
 * the dropdown to survive the close (same pattern `CollectionDeleteMenuItem`/
 * `CollectionDuplicateMenuItem` already use).
 *
 * @param props - `{ kind, slug }`.
 * @returns The History menu item, or `null`.
 */
export function VersionHistoryMenuItem(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const runtime = useDocumentEditRuntime();
  const dialog = useEditActionsMenuDialog();

  const resolved =
    props.kind === "collection"
      ? config.collections.find((c) => c.slug === props.slug)
      : config.globals.find((g) => g.slug === props.slug);
  const resource = props.slug;
  const canReadDrafts = usePermission({ resource, action: DRAFT_ACTIONS.readDrafts });

  if (!resolved?.versions.drafts || !canReadDrafts) return null;

  const target: VersionHistoryTarget =
    props.kind === "collection"
      ? { collection: props.slug as CollectionSlug, documentId: document.id! }
      : { global: props.slug as GlobalSlug };

  function openHistory(): void {
    dialog.open(
      <VersionHistoryDialogContent
        target={target}
        hasDraft={document.status === "draft"}
        viewingVersion={runtime.viewedVersion?.version ?? null}
        onViewVersion={runtime.onViewVersion}
        hasUnsavedChanges={document.isDirty}
        activeVersion={
          (document.saved as { vex_activeVersion?: number } | undefined)?.vex_activeVersion ?? null
        }
        onClose={dialog.close}
      />,
    );
  }

  return (
    <EditActionsMenuItem icon={<Icon name="History" />} onSelect={openHistory}>
      History
    </EditActionsMenuItem>
  );
}
