import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server"

/**
 * Status values for version records.
 * - "draft": a saved draft
 * - "published": this snapshot was published to the main document
 * - "autosave": an autosave version (coalesced in-place)
 */
export type VersionStatus = "draft" | "published" | "autosave"

/**
 * Gets the next version number for a document.
 */
export async function getNextVersionNumber<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<number> {
  const latest = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_latest", (q: any) =>
      q.eq("collection", props.collection).eq("documentId", props.documentId),
    )
    .order("desc")
    .first()

  return latest ? (latest.version as number) + 1 : 1
}

/**
 * Creates a new version record in the vex_versions table.
 */
export async function createVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  snapshot: Record<string, unknown>
  status: VersionStatus
  createdBy: string | null
  restoredFrom?: number
}): Promise<{ versionId: string; version: number }> {
  const version = await getNextVersionNumber({
    ctx: props.ctx,
    collection: props.collection,
    documentId: props.documentId,
  })

  const versionId = await (props.ctx.db as any).insert("vex_versions", {
    collection: props.collection,
    documentId: props.documentId,
    version,
    status: props.status,
    snapshot: props.snapshot,
    createdAt: Date.now(),
    createdBy: props.createdBy ?? undefined,
    isAutosave: props.status === "autosave",
    restoredFrom: props.restoredFrom ?? undefined,
  })

  return { versionId: versionId as string, version }
}

/**
 * Gets the latest version for a document (any status).
 * Used by the admin edit view to load the most recent content.
 */
export async function getLatestVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<Record<string, unknown> | null> {
  const latest = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_latest", (q: any) =>
      q.eq("collection", props.collection).eq("documentId", props.documentId),
    )
    .order("desc")
    .first()

  return latest as Record<string, unknown> | null
}

/**
 * Gets the latest version with status "published" for a document.
 */
export async function getLatestPublishedVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
}): Promise<Record<string, unknown> | null> {
  const latest = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_status", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("status", "published"),
    )
    .order("desc")
    .first()

  return latest as Record<string, unknown> | null
}

/**
 * Lists all versions for a document, ordered newest first.
 * Excludes autosave versions from the list.
 */
export async function listVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
  limit?: number
}): Promise<Record<string, unknown>[]> {
  const versions = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_latest", (q: any) =>
      q.eq("collection", props.collection).eq("documentId", props.documentId),
    )
    .order("desc")
    .take(props.limit ?? 50)

  return (versions as Record<string, unknown>[])
    .filter((v) => !v.isAutosave)
    .map((v) => ({
      _id: v._id,
      version: v.version,
      status: v.status,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      isAutosave: v.isAutosave,
      restoredFrom: v.restoredFrom ?? null,
    }))
}

/**
 * Gets a specific version by version number.
 * Includes the full snapshot for restore preview.
 */
export async function getVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  collection: string
  documentId: string
  version: number
}): Promise<Record<string, unknown> | null> {
  const version = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_version", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("version", props.version),
    )
    .first()

  return version as Record<string, unknown> | null
}

/**
 * Finds the latest autosave version for a document and updates it in-place.
 * If no autosave exists, creates a new one.
 */
export async function coalesceAutosave<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  snapshot: Record<string, unknown>
  createdBy: string | null
}): Promise<{ versionId: string; version: number }> {
  const existing = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_autosave", (q: any) =>
      q
        .eq("collection", props.collection)
        .eq("documentId", props.documentId)
        .eq("isAutosave", true),
    )
    .order("desc")
    .first()

  if (existing) {
    await (props.ctx.db as any).patch(existing._id, {
      snapshot: props.snapshot,
      createdAt: Date.now(),
    })
    return { versionId: existing._id as string, version: existing.version as number }
  }

  return createVersion({
    ctx: props.ctx,
    collection: props.collection,
    documentId: props.documentId,
    snapshot: props.snapshot,
    status: "autosave",
    createdBy: props.createdBy,
  })
}

/**
 * Cleans up old versions exceeding the maxPerDoc limit.
 * Preserves all published versions regardless of limit.
 * Never deletes the most recent version.
 */
export async function cleanupOldVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  collection: string
  documentId: string
  maxPerDoc: number
}): Promise<void> {
  if (props.maxPerDoc === 0) return

  const allVersions = await (props.ctx.db as any)
    .query("vex_versions")
    .withIndex("by_document_latest", (q: any) =>
      q.eq("collection", props.collection).eq("documentId", props.documentId),
    )
    .order("desc")
    .collect()

  if (allVersions.length <= props.maxPerDoc) return

  const toKeep = allVersions.slice(0, props.maxPerDoc)
  const candidates = allVersions.slice(props.maxPerDoc)

  for (const candidate of candidates) {
    // Always preserve published versions
    if (candidate.status === "published") continue
    await (props.ctx.db as any).delete(candidate._id)
  }
}
