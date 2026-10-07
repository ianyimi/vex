import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError } from "convex/values";

import type { VexConfig } from "../config";
import type { AccessCallOptions, VexApiAuth } from "../api/types";
import { DRAFT_ACTIONS } from "../access";
import { prepareEdit } from "../api/prepareEdit";
import type { CollectionOrGlobal } from "../types/utils";
import { assertNoDraftRelationships } from "./assertNoDraftRelationships";
import { VERSION_STATUSES } from "./constants";
import { createVersion, getLatestVersion } from "./model";
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
 * Takes no `data` of its own — it always promotes whatever is CURRENTLY
 * stored on `rows.draftRow`. A draft row is always a complete copy of the
 * document's fields (bootstrapped as a full copy of the published state, or
 * of `{}` for a brand-new document, and every `saveDraft` patch lands flatly
 * on that same complete set), so passing `rows.toUserFields(draftRow)` as
 * `prepareEdit`'s `incoming` — merged over `storedDoc` (the current
 * published row's fields, or `{}` when none exists yet) via `prepareEdit`'s
 * own `{ ...storedDoc, ...incoming }` step — reproduces the draft's complete
 * content exactly, the same "every field, no partial merge" shape `create`'s
 * own strict pass already has. A caller with pending, not-yet-saved form
 * edits (Step 10's UI) saves them as a draft FIRST, then calls this — never
 * merges them in here.
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
 *   happens to match), the published row is patched with the draft's
 *   validated fields, and the now-redundant draft row is deleted.
 * - `rows.publishedRow` is `null` (the document/global has never been
 *   published — `create`'s `versions.defaultStatus: "draft"` path produces
 *   exactly this row shape): the draft row is promoted IN PLACE — patched to
 *   `vex_status: "published"` — keeping its own `_id`. This is decision 1's
 *   id-stability invariant applied from a document's FIRST publish onward:
 *   the only way a draft-only row's `_id` could become unstable here is if
 *   this function minted a different one for that first publish, and it
 *   does not. Decision 11 independently confirms this branch still exists
 *   post-redesign: it names "the promote-in-place branch of Step 9" as the
 *   thing that must now ALSO emit exactly one history row (previously none),
 *   which only makes sense if there is still a promote-in-place branch.
 *
 * Both branches record exactly one history row (decision 11: every publish
 * is attributed and emits one node, no exceptions).
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @param props - Resolved target + rows.
 * @returns The published row's `_id`, as a string — stable across every
 *   future publish once this call returns.
 * @throws {ConvexError} `"No draft to publish for this document."` when
 *   `rows.draftRow` is `null`; propagated from `prepareEdit` on strict-
 *   validation failure (`{ message, errors }` or `{ message, field }`);
 *   propagated from `assertNoDraftRelationships` (`{ message, field }`) when
 *   a relationship field still points at a draft.
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
}): Promise<string> {
  const draftRow = props.rows.draftRow;
  if (draftRow === null) {
    throw new ConvexError("No draft to publish for this document.");
  }
  const publishedRow = props.rows.publishedRow;

  const { transformedFields } = await prepareEdit<DataModel>({
    ctx: props.ctx,
    config: props.config,
    target: props.target,
    action: DRAFT_ACTIONS.publish,
    access: props.access,
    auth: props.auth,
    storedDoc: (publishedRow ? props.rows.toUserFields(publishedRow) : {}) as never,
    changes: props.rows.toUserFields(draftRow),
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
  const previous = await getLatestVersion({
    ctx: props.ctx,
    collection: props.rows.historyCollection,
    documentId: props.rows.documentId,
  });

  if (publishedRow !== null) {
    await createVersion({
      ctx: props.ctx,
      collection: props.rows.historyCollection,
      documentId: props.rows.documentId,
      status: VERSION_STATUSES.published.key,
      snapshot: props.rows.toUserFields(publishedRow),
      publishedAt: publishedRow.vex_publishedAt as number | undefined,
      createdBy,
      parentVersion: previous?.version,
    });
    await props.ctx.db.patch(
      publishedRow._id as never,
      {
        ...props.rows.buildDraftPatch(publishedRow, transformedFields),
        vex_publishedAt: now,
      } as never,
    );
    await props.ctx.db.delete(draftRow._id as never);
    return String(publishedRow._id);
  }

  await props.ctx.db.patch(
    draftRow._id as never,
    {
      ...props.rows.buildDraftPatch(draftRow, transformedFields),
      vex_status: VERSION_STATUSES.published.key,
      vex_publishedAt: now,
    } as never,
  );
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
  return String(draftRow._id);
}
