import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { DRAFT_ACTIONS } from "../access";
import { prepareEdit } from "../api/prepareEdit";
import type { CollectionOrGlobal } from "../types/utils";
import { assertNoDraftRelationships } from "./assertNoDraftRelationships";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion, getVersion, type VexVersion } from "./model";
import { removeVexFields } from "./removeVexFields";
import type { VersionedTargetRows } from "./resolveVersionedTarget";

/**
 * Kind-agnostic `publish` implementation shared by both versioned
 * collections and versioned globals — the `publish` counterpart to
 * `saveDraftShared` (`versions/saveDraft.ts`). Every per-kind difference
 * (table, user-field extraction, how a patch payload nests) is already
 * resolved into `rows` (see {@link resolveVersionedTarget}); this function
 * never branches on `target.kind`.
 *
 * Promotes whatever is CURRENTLY stored on `rows.draftRow` (or
 * `rows.publishedRow` when there is no draft), merged with optional
 * `props.data` — pending, not-yet-saved form edits — applied on top. A
 * draft row is always a complete copy of the document's fields
 * (bootstrapped as a full copy of the published state, or of `{}` for a
 * brand-new document, and every `saveDraft` patch lands flatly on that
 * same complete set), so `{ ...toUserFields(draftRow ?? publishedRow),
 * ...data }`, passed as `prepareEdit`'s `changes` — merged over
 * `storedDoc` (the current published row's fields, or `{}` when none
 * exists yet) via `prepareEdit`'s own `{ ...storedDoc, ...changes }` step
 * — reproduces the full intended content, the same "every field, no
 * partial merge" shape `create`'s own strict pass already has.
 *
 * Validates STRICTLY (`partial: false, validateKeys: "all"` — decision 4): a
 * draft may be incomplete, a published document may not.
 *
 * Two write shapes, exactly the two decision 1's two-row model already
 * established, re-targeted through `rows` instead of a raw `vex_publishedId`
 * check:
 * - `rows.publishedRow` exists: the superseded published state is archived
 *   to history (its OWN content and OWN `publishedAt`, before being
 *   overwritten — deliberately redundant with whatever `saveDraftShared`'s
 *   own bootstrap already archived when the draft first branched off, since
 *   decision 11 records one node per transition even when adjacent content
 *   happens to match), the published row is patched with the merged
 *   validated fields, and any now-redundant draft row is deleted.
 * - `rows.publishedRow` is `null` (the document/global has never been
 *   published — `create`'s `versions.defaultStatus: "draft"` path produces
 *   exactly this row shape): a draft row is promoted IN PLACE — patched to
 *   `vex_status: "published"` — keeping its own `_id`; if there is no draft
 *   row either (only possible for a global with no rows at all — a
 *   collection always has a row), one is inserted directly as published.
 *   This is decision 1's id-stability invariant applied from a document's
 *   FIRST publish onward: the only way a draft-only row's `_id` could
 *   become unstable here is if this function minted a different one for
 *   that first publish, and it does not. Decision 11 independently
 *   confirms this branch still exists post-redesign: it names "the
 *   promote-in-place branch of Step 9" as the thing that must now ALSO
 *   emit exactly one history row (previously none), which only makes sense
 *   if there is still a promote-in-place branch.
 *
 * Both branches record exactly one history row (decision 11: every publish
 * is attributed and emits one node, no exceptions).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + rows, plus optional `data` to merge on
 *   top of the draft/published row before publishing.
 * @returns The published row's `_id`, as a string — stable across every
 *   future publish once this call returns.
 * @throws {ConvexError} `"Nothing to publish: no draft and no changes."`
 *   when `rows.draftRow` is `null` and `props.data` is empty or omitted;
 *   propagated from `prepareEdit` on strict-validation failure
 *   (`{ message, errors }` or `{ message, field }`); propagated from
 *   `assertNoDraftRelationships` (`{ message, field }`) when a relationship
 *   field still points at a draft.
 * @throws {VexAccessError} When the caller is not permitted to publish.
 * @example
 * ```ts
 * const rows = await resolveVersionedTarget({ ctx, collection: "posts", id });
 * const publishedId = await publishShared({
 *   ctx, config, target: { kind: "collection", config: postsConfig }, rows,
 * });
 * ```
 */
export async function publishShared<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  rows: VersionedTargetRows<DataModel>;
  data?: Record<string, unknown>;
  /**
   * Publish this history version's snapshot (plus `data` on top) instead of
   * the draft. Records a history row only when `data` adds edits.
   */
  version?: number;
}): Promise<string> {
  if (props.version !== undefined) {
    return publishFromVersion({ ...props, version: props.version });
  }
  const draftRow = props.rows.draftRow;
  const publishedRow = props.rows.publishedRow;
  const data = props.data ?? {};
  if (draftRow === null && Object.keys(data).length === 0) {
    throw new ConvexError("Nothing to publish: no draft and no changes.");
  }
  const baseRow = draftRow ?? publishedRow;
  const changes = { ...(baseRow ? props.rows.toUserFields(baseRow) : {}), ...data };

  const { transformedFields } = await prepareEdit<DataModel>({
    ctx: props.ctx,
    config: props.config,
    target: props.target,
    action: DRAFT_ACTIONS.publish,
    access: props.access,
    auth: props.auth,
    storedDoc: (publishedRow ? props.rows.toUserFields(publishedRow) : {}) as never,
    changes,
    partial: false,
    validateKeys: "all",
  });

  await assertNoDraftRelationships({
    ctx: props.ctx,
    target: props.target,
    document: transformedFields,
  });

  const now = Date.now();
  const createdBy =
    typeof props.auth?.user?.["_id"] === "string" ? (props.auth.user["_id"] as string) : undefined;
  let previous = await getLatestVersion({
    ctx: props.ctx,
    collection: props.rows.historyCollection,
    documentId: props.rows.documentId,
  });

  const rowId =
    publishedRow?._id ??
    draftRow?._id ??
    (await props.ctx.db.insert(
      props.rows.table as never,
      {
        ...props.rows.buildDraftInsert(transformedFields, undefined),
        vex_status: VERSION_STATUSES.published.key,
      } as never,
    ));
  const rowBeforePublish = publishedRow ?? draftRow;

  if (previous === null && publishedRow !== null) {
    await createVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
      status: VERSION_STATUSES.published.key,
      snapshot: props.rows.toUserFields(publishedRow),
      publishedAt: publishedRow.vex_publishedAt as number | undefined,
    });
    previous = await getLatestVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
    });
  }

  await props.ctx.db.patch(
    rowId as never,
    {
      ...(rowBeforePublish ? props.rows.buildDraftPatch(rowBeforePublish, transformedFields) : {}),
      vex_status: VERSION_STATUSES.published.key,
      vex_publishedAt: now,
    } as never,
  );
  if (publishedRow !== null && draftRow !== null) {
    await props.ctx.db.delete(draftRow._id as never);
  }

  const publishesSavedDraft = draftRow !== null && Object.keys(data).length === 0;
  if (publishesSavedDraft && previous !== null) {
    await markVersionPublished({ ctx: props.ctx, version: previous, publishedAt: now });
  } else {
    await createVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
      status: VERSION_STATUSES.published.key,
      snapshot: removeVexFields({ doc: transformedFields }),
      publishedAt: now,
      createdBy,
      parentVersion: previous?.version,
    });
  }
  return String(rowId);
}

async function publishFromVersion<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  config: VexConfig;
  target: CollectionOrGlobal;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  rows: VersionedTargetRows<DataModel>;
  data?: Record<string, unknown>;
  version: number;
}): Promise<string> {
  const base = await getVersion({
    ctx: props.ctx,
    collection: props.rows.historyCollection,
    documentId: props.rows.documentId,
    version: props.version,
  });
  if (base === null) {
    throw new ConvexError(`Version ${props.version} does not exist`);
  }
  const data = props.data ?? {};

  const { transformedFields } = await prepareEdit<DataModel>({
    ctx: props.ctx,
    config: props.config,
    target: props.target,
    action: DRAFT_ACTIONS.publish,
    access: props.access,
    auth: props.auth,
    storedDoc: base.snapshot as never,
    changes: data,
    partial: false,
    validateKeys: "all",
  });

  await assertNoDraftRelationships({
    ctx: props.ctx,
    target: props.target,
    document: transformedFields,
  });

  const now = Date.now();
  const userFields = removeVexFields({ doc: transformedFields });
  const targetRow = props.rows.publishedRow ?? props.rows.draftRow;
  if (targetRow === null) {
    throw new ConvexError("Nothing to publish: the document has no rows.");
  }

  await props.ctx.db.patch(
    targetRow._id as never,
    {
      ...props.rows.buildDraftReplace(targetRow, userFields),
      vex_status: VERSION_STATUSES.published.key,
      vex_publishedAt: now,
    } as never,
  );
  if (props.rows.publishedRow !== null && props.rows.draftRow !== null) {
    await props.ctx.db.delete(props.rows.draftRow._id as never);
  }

  if (Object.keys(data).length > 0) {
    await createVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
      status: VERSION_STATUSES.published.key,
      snapshot: userFields,
      publishedAt: now,
      createdBy:
        typeof props.auth?.user?.["_id"] === "string"
          ? (props.auth.user["_id"] as string)
          : undefined,
      parentVersion: props.version,
      restoredFrom: props.version,
    });
  } else {
    await markVersionPublished({ ctx: props.ctx, version: base, publishedAt: now });
  }
  return String(targetRow._id);
}

async function markVersionPublished<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  version: VexVersion;
  publishedAt: number;
}): Promise<void> {
  await props.ctx.db.patch(
    props.version._id as never,
    { status: VERSION_STATUSES.published.key, publishedAt: props.publishedAt } as never,
  );
}
