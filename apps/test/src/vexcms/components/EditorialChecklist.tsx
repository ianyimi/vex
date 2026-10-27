"use client";

import { useVexDocument } from "@vexcms/react";

/**
 * Reminder card above the post's fields: posts are a draft/publish collection
 * (`versions.drafts`, `versions.autosave`), so this exists to dogfood a
 * collection-level `admin.components.edit.beforeFields` contribution that
 * reads document status rather than field values.
 */
export function EditorialChecklist() {
  const document = useVexDocument();

  if (document.status !== "draft") return null;

  return (
    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      Draft — confirm the slug and related posts before publishing.
    </div>
  );
}
