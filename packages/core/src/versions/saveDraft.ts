import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../db/types";
import { DRAFT_ACTIONS } from "../access";
import { valuesEqual } from "../utils/valuesEqual";
import { prepareEdit } from "../db/prepareEdit";
import type { CollectionOrGlobal } from "../types/utils";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion, getVersion, listVersions } from "./model";
import { removeVexFields } from "./removeVexFields";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `saveDraft` implementation shared by both versioned
 * collections and versioned globals. Every per-kind difference — which table
 * the rows live in, how a row's user fields are extracted, and how a draft
 * row's insert/patch payload is shaped (flat on a collection row, nested
 * under `data` on a `vex_globals` row) — is already resolved into `rows`
 * (see {@link resolveVersionedTarget}); this function never branches on
 * `target.kind` itself.
 *
 * Mirrors the original collection-only `saveDraft` (and `upsertGlobal`'s
 * former versioned-draft branch) step for step: bootstrap (or reuse) the
 * draft row, snapshotting the pre-edit published state the first time a
 * draft branches off it; run the shared `prepareEdit` merge/validate
 * pipeline against the draft row's stored content; patch the draft row; and
 * record one `"draft"`-status history row.
 *
 * **Authorization is evaluated against the STORED draft row**, never
 * against the incoming payload — `prepareEdit` passes `changes: data` to
 * `hasPermission` internally, which is what lets a field-level permission
 * map deny individual keys.
 *
 * Does NOT stamp `updatedAt`: an autosave tick is not a real edit of the
 * live document; `publish` stamps it once, on promotion.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + merge inputs.
 * @returns The draft row's `_id`, as a string.
 * @throws {ConvexError} Propagated from `prepareEdit` on validation failure.
 * @throws {VexAccessError} When the caller is not permitted to save this draft.
 */
export async function saveDraftShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  data: Record<string, unknown>;
  restoredFrom?: number;
  rows: VersionedTargetRows<DataModel>;
}): Promise<string> {
  const data = removeVexFields({ doc: props.data });

  let draftRow = props.rows.draftRow;
  const publishedRow = props.rows.publishedRow;

  if (draftRow === null) {
    if (publishedRow !== null) {
      // Snapshot the pre-edit published state the first time a draft branches
      // off it — but only when history doesn't already hold that exact content
      // as a published row (it always does once publish stamps every state;
      // this write remains for legacy documents predating that invariant).
      const publishedFields = props.rows.toUserFields(publishedRow);
      const existing = await listVersions({
        ctx: props.ctx,
        collection: props.rows.historyCollection,
        documentId: props.rows.documentId,
      });
      const alreadySnapshotted = existing.some(
        (row) =>
          row.status === VERSION_STATUSES.published.key &&
          valuesEqual(row.snapshot, publishedFields),
      );
      if (!alreadySnapshotted) {
        await createVersion({
          ctx: props.ctx,
          collection: props.rows.historyCollection,
          documentId: props.rows.documentId,
          status: VERSION_STATUSES.published.key,
          snapshot: publishedFields,
          publishedAt: publishedRow.vex_publishedAt as number | undefined,
        });
      }
    }
    const insertPayload = props.rows.buildDraftInsert(
      publishedRow ? props.rows.toUserFields(publishedRow) : {},
      publishedRow?._id as string | undefined,
    );
    const draftRowId = await props.ctx.db.insert(props.rows.table, insertPayload as never);
    draftRow = (await props.ctx.db.get(props.rows.table, draftRowId)) as Record<string, unknown>;
  }

  const baseVersion =
    props.restoredFrom === undefined
      ? null
      : await getVersion({
          ctx: props.ctx,
          collection: props.rows.historyCollection,
          documentId: props.rows.documentId,
          version: props.restoredFrom,
        });
  if (props.restoredFrom !== undefined && baseVersion === null) {
    throw new ConvexError(`Version ${props.restoredFrom} does not exist`);
  }

  const { patch, transformedFields } = await prepareEdit({
    ctx: props.ctx,
    config: props.config,
    target: props.target,
    action: DRAFT_ACTIONS.saveDraft,
    access: props.access,
    auth: props.auth,
    storedDoc: (baseVersion?.snapshot ?? props.rows.toUserFields(draftRow)) as never,
    changes: data,
    partial: true,
    validateKeys: "changed",
  });

  await props.ctx.db.patch(
    draftRow._id as never,
    (baseVersion
      ? props.rows.buildDraftReplace(draftRow, removeVexFields({ doc: transformedFields }))
      : props.rows.buildDraftPatch(draftRow, patch)) as never,
  );

  // Restoring a version verbatim (restoredFrom set, no edits on top) makes
  // THAT row the current draft: the active-version pointer moves to it and no
  // new history row is written. Anything else records one draft row.
  const restoresVerbatim = props.restoredFrom !== undefined && Object.keys(data).length === 0;
  let activeVersion: number;
  if (restoresVerbatim) {
    activeVersion = props.restoredFrom as number;
  } else {
    const previous = await getLatestVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
    });
    const publishedAt =
      (publishedRow?.vex_publishedAt as number | undefined) ??
      (draftRow.vex_publishedAt as number | undefined);

    activeVersion = await createVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
      status: VERSION_STATUSES.draft.key,
      snapshot: removeVexFields({ doc: transformedFields }),
      createdBy:
        typeof props.auth?.user?.["_id"] === "string"
          ? (props.auth.user["_id"] as string)
          : undefined,
      parentVersion: props.restoredFrom ?? previous?.version,
      restoredFrom: props.restoredFrom,
      publishedAt,
    });
  }
  await props.ctx.db.patch(draftRow._id as never, { vex_activeVersion: activeVersion } as never);

  return String(draftRow._id);
}
