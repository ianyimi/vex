import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import { VERSION_SYSTEM_FIELDS, type VexVersionStatus } from "./constants";
import { VexVersionDocument } from "../documents/types";

/** One immutable history row as stored in `vex_versions`. */
export interface VexVersion {
  _id: GenericId<"vex_versions">;
  _creationTime: number;
  collection: string;
  documentId: string;
  version: number;
  status: VexVersionStatus;
  snapshot: unknown;
  createdBy?: string;
  parentVersion?: number;
  restoredFrom?: number;
  publishedAt?: number;
}

/**
 * Appends one immutable snapshot row to `vex_versions`.
 *
 * Called by every write path in this spec that changes a document's stored
 * content or publish status (`saveDraft`, `publish`, `unpublish`, and the
 * bootstrap snapshot `saveDraft` takes of a published row's "v1 published"
 * state on first edit) — never called directly by a Convex handler.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex mutation context (`vex_versions` is written here).
 * @param props.collection - The collection slug the versioned document belongs to.
 * @param props.documentId - The document's `_id`, stringified. Always the
 *   published row's `_id` once one exists, or the sole draft row's `_id`
 *   for a never-published document — the published `_id` never changes
 *   (design-review §2.2), so this never needs to be re-pointed mid-history.
 * @param props.status - `"draft"` or `"published"` — the state THIS
 *   snapshot captures, independent of the row's CURRENT status by the time
 *   anyone reads it back.
 * @param props.snapshot - The document's user-defined fields, already
 *   stripped via {@link extractUserFields} by the caller.
 * @param props.createdBy - The acting user's id, when known.
 * @param props.parentVersion - The version number this one was derived
 *   from (omitted for a document's very first version).
 * @param props.restoredFrom - Set only when this version's content came
 *   from restoring an older version — the source version's number.
 * @param props.publishedAt - Set once a document has ever been published,
 *   carried forward on every subsequent version (including drafts) so "was
 *   this ever live" survives unpublish. Omitted for content that has never
 *   been published.
 * @returns The new version's row number — one greater than the document's
 *   current latest version, or `1` if it has none yet.
 */
export async function createVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  status: VexVersionStatus;
  snapshot: Record<string, unknown>;
  createdBy?: string;
  parentVersion?: number;
  restoredFrom?: number;
  publishedAt?: number;
}): Promise<number> {
  const latest = await getLatestVersion({
    ctx: props.ctx,
    collection: props.collection,
    documentId: props.documentId,
  });
  const nextVersion = (latest?.version ?? 0) + 1;
  // @ts-expect-error convex tab;e undefined here
  await props.ctx.db.insert("vex_versions", {
    collection: props.collection,
    documentId: props.documentId,
    version: nextVersion,
    status: props.status,
    snapshot: props.snapshot,
    createdBy: props.createdBy,
    parentVersion: props.parentVersion,
    restoredFrom: props.restoredFrom,
    publishedAt: props.publishedAt,
  });
  return nextVersion;
}

/**
 * Returns a document's highest-numbered `vex_versions` row, or `null` if it
 * has no version history yet.
 *
 * Always queries via the `by_document_version` index and takes the single
 * newest row — never `.collect()`s the full history, since this runs on
 * every `saveDraft`/`publish` call to compute the next version number.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @returns The latest version row, or `null` when the document has never
 *   been snapshotted.
 */
export async function getLatestVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
}): Promise<VexVersion | null> {
  const version = await props.ctx.db
    .query("vex_versions")
    .withIndex("by_document_version", (q) =>
      // @ts-expect-error chain compound index fields. undefined in project src
      q.eq("collection", props.collection as never).eq("documentId", props.documentId),
    )
    .order("desc")
    .first();

  return (version as unknown as VexVersion) ?? null;
}

/**
 * Returns one specific version row by its document and version number.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @param props.version - The version number to fetch.
 * @returns The matching row, or `null` when no such version exists (an
 *   invalid/out-of-range number, or a version `deleteVersion` already removed).
 */
export async function getVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  version: number;
}): Promise<VexVersion | null> {
  const version = await props.ctx.db
    .query("vex_versions")
    .withIndex("by_document_version", (q) =>
      q
        .eq("collection", props.collection as never)
        // @ts-expect-error chain compound index fields. undefined in project src
        .eq("documentId", props.documentId as never)
        .eq("version", props.version),
    )
    .unique();
  return (version as unknown as VexVersion) ?? null;
}

/**
 * Returns every `vex_versions` row for a document, newest first.
 *
 * Unbounded by default (decision 3: no automatic pruning) — `limit` exists
 * only to cap what a single history-dropdown render fetches, not to express
 * a retention policy.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.documentId - The document's `_id`, stringified.
 * @param props.limit - Maximum number of rows to return, newest first.
 *   Omitted returns the full history.
 * @returns Version rows ordered by `version` descending.
 */
export async function listVersions<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: CollectionSlug;
  documentId: string;
  limit?: number;
}): Promise<VexVersion[]> {
  const query = props.ctx.db
    .query("vex_versions")
    .withIndex("by_document_version", (q) =>
      // @ts-expect-error chain compound index fields. undefined in project src
      q.eq("collection", props.collection as never).eq("documentId", props.documentId),
    )
    .order("desc");
  const versions =
    props.limit === undefined ? await query.collect() : await query.take(props.limit);
  return versions as unknown as VexVersion[];
}

/**
 * Finds the draft row pointing at a published document, if one exists.
 *
 * The link is one-directional (design-review §2.3): the published row
 * never carries a pointer back to its draft, so this is the only way to
 * answer "does this document have an active draft" — one indexed lookup,
 * never a scan, and never a reactive subscription touching the published
 * row itself.
 *
 * @param props - Input props.
 * @param props.ctx - A Convex query or mutation context.
 * @param props.collection - The collection slug.
 * @param props.publishedId - The published row's `_id`.
 * @returns The draft row whose `vex_publishedId` equals `props.publishedId`,
 *   or `null` when the document has no outstanding draft.
 */
export async function findDraftRow<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(props: {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  collection: TCollectionSlug;
  publishedId: GenericId<TCollectionSlug>;
}): Promise<VexVersionDocument | null> {
  const draft = await props.ctx.db
    .query(props.collection as never)
    .withIndex("by_published", (q) =>
      q.eq(VERSION_SYSTEM_FIELDS.publishedId.slug, props.publishedId as never),
    )
    .unique();
  return (draft as VexVersionDocument) ?? null;
}
