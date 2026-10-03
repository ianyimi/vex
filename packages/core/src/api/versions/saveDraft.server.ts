import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, TableNamesInDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import { DRAFT_ACTIONS } from "../../access";
import { prepareEdit } from "../prepareEdit";
import { createVersion, findDraftRow, getLatestVersion } from "../../versions/model";
import { extractUserFields } from "../../versions/extractUserFields";
import type { GenericVersionsMutationServerArgs, VersionsDataInput } from "./types";
import { VERSION_STATUSES } from "../../versions";
import { VexVersionDocument } from "../convex";

/**
 * Server-side args for `saveDraft`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface SaveDraftServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericVersionsMutationServerArgs<DataModel, TCollectionSlug> {
  /**
   * The document id the caller currently has loaded — the published row's id
   * on every edit after the first, or a draft row's own id (never-published
   * document, or a draft already active). Both are resolved transparently.
   */
  id: GenericId<TCollectionSlug>;
  /** Partial field values to merge into the draft row. Unspecified fields are left unchanged. */
  data: VersionsDataInput<DataModel>;
  /**
   * The version number this save restores from, when the caller is reverting to
   * an older snapshot (fetched separately via `getVersionSnapshot`, Step 8).
   * Recorded on the emitted `vex_versions` row for lineage; otherwise unused.
   */
  restoredFrom?: number;
}

/**
 * Patches (or bootstraps) the draft row for a versioned collection's document and
 * records a `"draft"`-status history row. Server-side only.
 *
 * Delegates the merge/`beforeChange`/validate pipeline to `prepareEdit` — the
 * SAME function `update()` calls — rather than duplicating it: this is the
 * concrete reason `saveDraft` cannot just call `update()` directly. `update()`
 * always patches the exact `args.id` it was given; `saveDraft` may need to write
 * to a DIFFERENT row (bootstrap a new draft) than the id the caller referenced.
 * `prepareEdit` is the part of `update()`'s pipeline that doesn't care which row
 * it's for — this function supplies its own row resolution and its own write,
 * reusing only the shared merge/validate core.
 *
 * **Authorization is evaluated against the STORED draft row**, never against
 * `args.data` — the correction this spec makes relative to the original
 * 2026-08-23 draft, which authorized against whichever row the caller supplied.
 * `prepareEdit` passes `changes: args.data` to `hasPermission` internally,
 * which is what lets a field-level permission map deny individual keys.
 *
 * Does NOT stamp `updatedAt`: an autosave tick is not a real edit of the live
 * document; `publish` stamps it once, on promotion.
 *
 * Known gap: two concurrent FIRST saves on the same never-drafted document can
 * both find no draft and both bootstrap one — no unique index on
 * `vex_publishedId` prevents the second row.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, id, data, restoredFrom? }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the draft row's `_id` as a string.
 * @throws {ConvexError} When `collection`/`config`, or the target document, cannot be
 *   resolved, or when the collection does not declare `versions.drafts: true`.
 * @throws {VexAccessError} When the caller is not permitted to save this draft.
 * @example
 * ```ts
 * import { saveDraft } from "@vexcms/core/server";
 *
 * export const savePostDraft = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) =>
 *     saveDraft({ ctx, config, collection: "posts", id: args.id, data: args.data }),
 * });
 * ```
 */
export async function saveDraft<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: SaveDraftServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  const collection = args.config?.collections.find((c) => c.slug === args.collection);
  if (!args.config || !collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }
  if (!collection.versions.drafts) {
    throw new ConvexError(
      `Collection "${args.collection}" does not have drafts enabled — set versions: { drafts: true } to use saveDraft`,
    );
  }
  const data = extractUserFields({ doc: args.data });
  const targetRow = (await args.ctx.db.get(args.collection, args.id)) as VexVersionDocument | null;
  if (targetRow === null) {
    throw new ConvexError(
      `No document found for id "${args.id}" in collection "${args.collection}"`,
    );
  }

  let draftRow: VexVersionDocument | null = null;
  if (targetRow.vex_status === VERSION_STATUSES.draft.key) {
    draftRow = targetRow;
  } else {
    draftRow = await findDraftRow<DataModel, TCollectionSlug>({
      ctx: args.ctx,
      collection: args.collection,
      publishedId: targetRow._id as GenericId<TCollectionSlug>,
    });
  }
  if (draftRow === null) {
    await createVersion({
      ctx: args.ctx,
      collection: args.collection,
      documentId: targetRow._id,
      status: VERSION_STATUSES.published.key,
      snapshot: extractUserFields({ doc: targetRow }),
      publishedAt: targetRow.vex_publishedAt,
    });
    const draftRowId = await args.ctx.db.insert(args.collection, {
      ...extractUserFields({ doc: targetRow }),
      vex_status: VERSION_STATUSES.draft.key,
      vex_publishedId: targetRow._id,
    } as never);
    draftRow = (await args.ctx.db.get(args.collection, draftRowId)) as VexVersionDocument;
  }

  const { patch, transformedFields } = await prepareEdit({
    ctx: args.ctx,
    config: args.config,
    target: { kind: "collection", config: collection },
    action: DRAFT_ACTIONS.saveDraft,
    access: args.access,
    auth: args.auth,
    storedDoc: extractUserFields({ doc: draftRow as never }) as never,
    incoming: data,
    partial: true,
    validateKeys: "changed",
  });
  await args.ctx.db.patch(
    draftRow._id as GenericId<TableNamesInDataModel<DataModel>>,
    patch as never,
  );

  const documentId = String(draftRow.vex_publishedId ?? draftRow._id);
  const previous = await getLatestVersion({
    ctx: args.ctx,
    collection: args.collection,
    documentId,
  });
  const publishedRow =
    draftRow.vex_publishedId === undefined
      ? null
      : draftRow.vex_publishedId === targetRow._id
        ? targetRow
        : ((await args.ctx.db.get(
            args.collection,
            draftRow.vex_publishedId as GenericId<TCollectionSlug>,
          )) as VexVersionDocument | null);
  const publishedAt = publishedRow?.vex_publishedAt ?? draftRow.vex_publishedAt;
  await createVersion({
    ctx: args.ctx,
    collection: args.collection,
    documentId,
    status: VERSION_STATUSES.draft.key,
    snapshot: extractUserFields({ doc: transformedFields }),
    createdBy:
      typeof args.auth?.user?.["_id"] === "string" ? (args.auth.user["_id"] as string) : undefined,
    parentVersion: previous?.version,
    restoredFrom: args.restoredFrom,
    publishedAt,
  });

  return draftRow._id;
}
