import type { GenericMutationCtx, GenericQueryCtx, GenericDataModel } from "convex/server";

/**
 * Upserts a preview snapshot for a document.
 * If a snapshot already exists for this collection+document, it is updated in place.
 * If not, a new entry is created.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 * @param props.snapshot - Complete field snapshot from the form
 */
export async function upsertPreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: string;
  documentId: string;
  snapshot: Record<string, unknown>;
}): Promise<void> {
  const existing = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_status", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("status", "previewSnapshot"),
    )
    .first();

  if (existing) {
    await (props.ctx.db as any).patch(existing._id, {
      snapshot: props.snapshot,
      createdAt: Date.now(),
    });
  } else {
    await (props.ctx.db as any).insert("vex_versions", {
      collection: props.collection,
      documentId: props.documentId,
      version: 0,
      status: "previewSnapshot",
      snapshot: props.snapshot,
      createdAt: Date.now(),
      createdBy: undefined,
      isAutosave: false,
      restoredFrom: undefined,
    });
  }
}

/**
 * Deletes the preview snapshot for a document.
 * Called after a successful save to clean up transient state.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 */
export async function deletePreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: string;
  documentId: string;
}): Promise<void> {
  const entries = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_status", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("status", "previewSnapshot"),
    )
    .collect();

  for (const entry of entries) {
    await (props.ctx.db as any).delete(entry._id);
  }
}

/**
 * Gets the preview snapshot for a document, if one exists.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 * @returns The snapshot data, or null if no preview snapshot exists
 */
export async function getPreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  collection: string;
  documentId: string;
}): Promise<Record<string, unknown> | null> {
  const entry = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_status", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("status", "previewSnapshot"),
    )
    .first();

  if (!entry) return null;
  return entry.snapshot as Record<string, unknown>;
}
