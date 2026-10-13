import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { resolveAccessCall } from "../api/utils";
import { DRAFT_ACTIONS, hasPermission } from "../access";
import type { CollectionOrGlobal } from "../types/utils";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion } from "./model";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `unpublish` implementation shared by both versioned
 * collections and versioned globals. Every per-kind difference — which
 * table the row lives in, how its user fields are extracted for the
 * history snapshot — is already resolved into `rows` (see
 * {@link resolveVersionedTarget}); this function never branches on
 * `target.kind` itself.
 *
 * Flips the currently-published row's `vex_status` back to `"draft"` and
 * records one `"published"`-status history row capturing the content that
 * was just taken down — the same row shape `saveDraft`'s pre-edit snapshot
 * records, so a document's history reads as an unbroken "what was live,
 * when" timeline across either operation.
 *
 * **Rejects while an active draft row exists** for the document: the
 * caller must publish or discard that draft first, or this unpublish would
 * leave a `draft` row whose `vex_publishedId` points at a row that is no
 * longer published — a state nothing downstream can make sense of.
 * **Rejects when there is no published row** — nothing to take down.
 *
 * No field values move — this is a status-only transition, so unlike
 * `saveDraft`/`publish` there is no `data` payload, no `prepareEdit` call,
 * and no field-level permission gating. The permission check goes straight
 * through `resolveAccessCall` + `hasPermission` with `changes: undefined`:
 * `unpublish` is not in `hasPermission`'s built-in payload-bearing action
 * set (only `create`/`update`), so a field-map-shaped `unpublish` rule
 * simply projects (grants) rather than tripping the "field map but no
 * changes supplied" throw — correct for a status-only action.
 *
 * `vex_publishedAt` is carried forward unchanged, both on the live row and
 * the emitted history row — it records "was this ever live," which stays
 * true after an unpublish, never reset to indicate otherwise.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + the rows this call is really touching.
 * @returns The published row's `_id` (now flipped to a draft row), as a string.
 * @throws {ConvexError} When there is no published row to unpublish, or when
 *   an active draft row already exists for the document.
 * @throws {VexAccessError} When the caller is not permitted to unpublish this document.
 */
export async function unpublishShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  rows: VersionedTargetRows<DataModel>;
}): Promise<string> {
  const { ctx, config, target, rows } = props;
  const resource = target.config.slug;

  if (rows.publishedRow === null) {
    throw new ConvexError(
      target.kind === "collection"
        ? `No published document to unpublish for collection "${resource}".`
        : `Global "${resource}" has never been published.`,
    );
  }
  if (rows.draftRow !== null) {
    throw new ConvexError("Publish or discard the active draft before unpublishing.");
  }
  const publishedRow = rows.publishedRow;

  const { access, action } = resolveAccessCall({
    config,
    access: props.access,
    defaultAction: DRAFT_ACTIONS.unpublish,
    resource,
  });
  hasPermission({
    access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource,
    action,
    data: rows.toUserFields(publishedRow),
    changes: undefined,
    throwOnDenied: true,
  });

  const previous = await getLatestVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
  });
  await createVersion({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
    status: VERSION_STATUSES.published.key,
    snapshot: rows.toUserFields(publishedRow),
    publishedAt: publishedRow.vex_publishedAt as number | undefined,
    createdBy:
      typeof props.auth?.user?.["_id"] === "string" ? (props.auth.user["_id"] as string) : undefined,
    parentVersion: previous?.version,
  });

  // Deliberately NOT `rows.buildDraftPatch` — that helper merges a CONTENT
  // patch (nested under `data` for a global); `vex_status` is a top-level
  // system field on every versioned row regardless of kind, so one direct
  // patch closes out either branch identically. No `stampUpdatedAt`:
  // `vex_status` is a reserved system field, not a user field, so
  // `updatedAt` (which tracks user field edits) is intentionally left
  // alone. `vex_publishedAt` is also left untouched on this patch, for the
  // same "carried forward, never rewritten backwards" reason.
  await ctx.db.patch(publishedRow._id as never, { vex_status: VERSION_STATUSES.draft.key } as never);

  return String(publishedRow._id);
}
