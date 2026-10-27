import type { DocumentByName, GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { findDraftRow, listVersions } from "../../../versions/model";

/**
 * Server-side args for `remove`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface RemoveServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Document ID(s) to delete.
   * Pass a single ID in an array for one document, or multiple IDs for bulk delete.
   */
  ids: GenericId<TCollectionSlug>[];
  /**
   * Optional soft delete field name.
   * If provided, sets this field to `true` instead of permanently deleting.
   * @example "deleted" — sets { deleted: true } on the document(s)
   */
  softDelete?: string;
}

/**
 * Deletes one or more documents. Server-side only.
 * Named `remove` to avoid collision with the JavaScript `delete` keyword.
 *
 * Supports both hard delete (permanent) and soft delete (mark as deleted).
 * Pass `softDelete` field name to soft delete instead of permanently removing.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, ids, softDelete? }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example Single delete
 * ```ts
 * import { remove } from "@vexcms/core/server";
 *
 * export const deletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => remove({ ctx, ids: [args.id] }),
 * });
 * ```
 * @example Bulk delete
 * ```ts
 * export const bulkDeletePosts = mutation({
 *   args: { ids: v.array(v.id("posts")) },
 *   handler: (ctx, args) => remove({ ctx, ids: args.ids }),
 * });
 * ```
 * @example Soft delete
 * ```ts
 * export const softDeletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) =>
 *     remove({ ctx, ids: [args.id], softDelete: "deleted" }),
 * });
 * ```
 *
 * On a versioned collection with `versions.cascadeDelete` (default `true`), a
 * hard delete of either row of a document cascades to its draft row (if any)
 * and all of its `vex_versions` history (design-review.md §3.4) — see
 * `cascadeVersionedDelete` below. Deleting a draft-only row (never published,
 * no `vex_publishedId`) deletes just that row and its own version history —
 * there is no published counterpart to also remove. Set
 * `versions.cascadeDelete: false` to leave the draft row and history behind
 * instead — the collection config, not a call-site argument, decides this
 * per collection. A soft delete never cascades either way: the row is not
 * actually removed.
 *
 */
export async function remove<
  DataModel extends GenericDataModel = GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: RemoveServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  async function removeById(id: GenericId<TCollectionSlug>): Promise<void> {
    let doc: DocumentByName<DataModel, TCollectionSlug> | null | undefined = undefined;
    if (args.config.access !== undefined) {
      doc = await args.ctx.db.get(id);
      const { access, action, resource } = resolveAccessCall({
        config: args.config,
        access: args.access,
        defaultAction: CRUD_ACTIONS.delete,
        resource: args.collection,
      });
      hasPermission({
        throwOnDenied: true,
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: doc ?? undefined,
      });
    }

    if (args.softDelete) {
      return await args.ctx.db.patch(args.collection, id, { [args.softDelete as never]: true });
    }

    const collection = args.config.collections.find((c) => c.slug === args.collection);
    if (!collection) {
      throw new ConvexError(`No collection registered with slug "${args.collection}"`);
    }

    if (collection.versions.drafts && collection.versions.cascadeDelete) {
      if (doc === undefined) {
        doc = await args.ctx.db.get(id);
      }
      if (doc !== null) {
        await cascadeVersionedDelete({
          ctx: args.ctx,
          collection: args.collection,
          doc: doc as never,
        });
      }
    }

    if (collection.hooks?.beforeDelete && doc !== null) {
      if (doc === undefined) {
        doc = await args.ctx.db.get(id);
      }
      await collection.hooks.beforeDelete<DataModel>({
        id: id,
        doc: doc as never,
        collection,
        ctx: args.ctx,
      });
    }

    return await args.ctx.db.delete(args.collection, id);
  }

  await Promise.all(args.ids.map((id) => removeById(id)));
}

/**
 * Cascades a document delete across the two-row draft model
 * (design-review.md §3.4): removing EITHER row removes the whole logical
 * document — the other row of the pair and every `vex_versions` history row.
 * Called by `removeById` before the row passed to `remove()` is itself
 * deleted. Removing via the draft row deletes its published parent too: the
 * collapsed list view shows the draft row for a document with an active
 * draft, so a list-view delete arrives with the draft's `_id` and means
 * "delete this document", not "discard the draft". A draft-only row (never
 * published) has no other row; only its own history is cleared.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 * @param args - `{ ctx, collection, doc }`.
 * @param args.ctx - Convex mutation context.
 * @param args.collection - The collection slug the document belongs to.
 * @param args.doc - The row passed to `remove()` — the published row or its draft.
 * @returns Promise resolving once the other row of the pair (if any) and all
 *   version rows for this document are gone.
 * @throws Never beyond what `ctx.db` itself throws.
 */
async function cascadeVersionedDelete<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: {
  ctx: GenericMutationCtx<DataModel>;
  collection: TCollectionSlug;
  doc: DocumentByName<DataModel, TCollectionSlug>;
}): Promise<void> {
  // `DocumentByName` over a generic slug cannot be reduced, so its system
  // fields are unreadable here; every versioned row carries these two.
  type VersionedRow = { _id: GenericId<TCollectionSlug>; vex_publishedId?: GenericId<TCollectionSlug> };
  const doc: VersionedRow = args.doc as VersionedRow;
  // A draft row points at its published parent; a published row (or a
  // never-published draft-only row) is its own logical identity.
  const publishedId = doc.vex_publishedId ?? doc._id;

  if (doc.vex_publishedId !== undefined) {
    // Removing via the draft row: its published parent goes too.
    await args.ctx.db.delete(doc.vex_publishedId as never);
  } else {
    // Removing via the published row (or a draft-only row, which no draft
    // points at): its draft goes too, if one exists.
    const draft = await findDraftRow({
      ctx: args.ctx,
      collection: args.collection,
      publishedId,
    });
    if (draft) await args.ctx.db.delete(draft._id as never);
  }

  const history = await listVersions({
    ctx: args.ctx,
    collection: args.collection,
    documentId: publishedId,
  });
  for (const version of history) {
    await args.ctx.db.delete(version._id as never);
  }
}
