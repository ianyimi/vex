import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall } from "../utils";

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
 */
export async function remove<
  DataModel extends GenericDataModel = GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(args: RemoveServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  async function removeById(id: GenericId<TCollectionSlug>): Promise<void> {
    if (args.config.access !== undefined) {
      const doc = await args.ctx.db.get(id);
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
    return await args.ctx.db.delete(args.collection, id);
  }

  await Promise.all(args.ids.map((id) => removeById(id)));
}
