import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../db/types";
import { resolveAccessCall } from "../access/resolveAccessCall";
import { DRAFT_ACTIONS, hasPermission } from "../access";
import type { CollectionOrGlobal } from "../types/utils";
import { VERSION_STATUSES } from "./constants";
import { listVersions, type VexVersion } from "./model";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `unpublish` implementation shared by both versioned
 * collections and versioned globals. Every per-kind difference — which
 * table the row lives in, how its user fields are extracted — is already
 * resolved into `rows` (see {@link resolveVersionedTarget}); this function
 * never branches on `target.kind` itself.
 *
 * **Demote-and-promote, never append.** Writes NO history row:
 * 1. The version row recording the content being taken down (the
 *    `published`-status row with the greatest `publishedAt`) is demoted —
 *    `status` → `"draft"` and its `publishedAt` REMOVED. An explicitly
 *    unpublished version loses its "was live" stamp; a version merely
 *    superseded by a later publish keeps it.
 * 2. When an earlier published version exists, its snapshot is promoted
 *    onto the live row IN PLACE — same `_id`, `vex_publishedAt` set to that
 *    version's `publishedAt`, `vex_status` stays `"published"`. The
 *    document stays live, showing the previous published content.
 * 3. With no earlier published version, the document goes offline: the
 *    live row flips to `"draft"` and its `vex_publishedAt` is removed.
 *
 * **Rejects while an active draft row exists** for the document: the
 * caller must publish or discard that draft first, or this unpublish would
 * leave a `draft` row whose `vex_publishedId` points at a row that is no
 * longer published — a state nothing downstream can make sense of.
 * **Rejects when there is no published row** — nothing to take down.
 *
 * The permission check goes through `resolveAccessCall` + `hasPermission`
 * with `changes: undefined`: `unpublish` is a status transition whose
 * restored content is, by construction, content that already passed a
 * `publish` permission check when it first went live.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + the rows this call is really touching.
 * @returns The live row's `_id`, as a string.
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

  // The version timeline, newest-first. `current` is the row recording what
  // is being taken down; `previous` is the next-most-recently published
  // content, promoted below when present.
  const versions = await listVersions({
    ctx,
    collection: rows.historyCollection,
    documentId: rows.documentId,
  });
  const published = versions
    .filter(
      (row): row is VexVersion & { publishedAt: number } =>
        row.status === VERSION_STATUSES.published.key && row.publishedAt !== undefined,
    )
    .sort((a, b) => b.publishedAt - a.publishedAt);
  const [current, previous] = published;

  // Demote the taken-down version: back to draft, "was live" stamp removed
  // so it never outranks `previous` in a later promotion.
  if (current !== undefined) {
    await ctx.db.patch(current._id as never, {
      status: VERSION_STATUSES.draft.key,
      publishedAt: undefined,
    } as never);
  }

  if (previous !== undefined) {
    // Promote in place: same `_id`, previous content, previous publishedAt;
    // the document stays published. No history row is written — both states
    // already have one.
    await ctx.db.patch(publishedRow._id as never, {
      ...rows.buildDraftReplace(publishedRow, previous.snapshot as Record<string, unknown>),
      vex_publishedAt: previous.publishedAt,
      vex_activeVersion: previous.version,
    } as never);
  } else {
    // Nothing to promote: the document goes offline. The explicit unpublish
    // removes the live row's "was ever live" stamp too.
    await ctx.db.patch(publishedRow._id as never, {
      vex_status: VERSION_STATUSES.draft.key,
      vex_publishedAt: undefined,
      vex_activeVersion: current?.version,
    } as never);
  }

  return String(publishedRow._id);
}
