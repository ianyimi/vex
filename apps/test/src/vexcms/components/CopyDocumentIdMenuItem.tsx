"use client";

import { toast } from "sonner";
import { useVexDocument, EditActionsMenuItem, Icon } from "@vexcms/react";

/**
 * Root-level `edit.actionsMenu` item, dogfooding `admin.components.edit.actionsMenu.items` —
 * copies the currently-open document's id to the clipboard. Scoped to collections only via its
 * own `access` predicate in `vex.config.ts` (a global singleton has no per-document id worth
 * copying) — renders nothing else here beyond a brand-new, never-saved document (no id yet).
 */
export function CopyDocumentIdMenuItem() {
  const document = useVexDocument();
  if (!document.id) return null;

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(document.id!);
      toast("Document ID copied to clipboard.");
    } catch {
      toast.error("Could not copy the document ID.");
    }
  }

  return (
    <EditActionsMenuItem
      icon={<Icon name="Copy" />}
      onSelect={() => {
        void handleCopy();
      }}
    >
      Copy ID
    </EditActionsMenuItem>
  );
}
