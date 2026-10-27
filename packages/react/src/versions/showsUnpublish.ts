import type { VexDocumentState } from "../documents/VexDocumentContext";
import type { DocumentEditRuntimeState } from "../documents/DocumentEditRuntimeContext";

/**
 * Shared Publish/Unpublish condition (decision: developer feedback) — Publish and Unpublish
 * share one spot in `edit.header.actions`/`edit.actionsMenu`, and exactly one of the two ever
 * renders. `VersionUnpublishAction` renders when this is `true`; `VersionPublishAction` renders
 * its `showsUnpublishInstead` case (the SAME condition) and bails when it is `true`, deferring to
 * Unpublish. Extracted so the two built-ins can no longer drift apart by hand.
 *
 * @param args.document - The current edit view's `VexDocumentState`.
 * @param args.runtime - The current edit view's `DocumentEditRuntimeState`.
 * @returns `true` when Unpublish (not Publish) is the correct action for the live state.
 */
export function showsUnpublish(args: {
  document: VexDocumentState;
  runtime: DocumentEditRuntimeState;
}): boolean {
  const { document, runtime } = args;
  return document.status === "published" && !document.isDirty && runtime.viewedVersion === null;
}
