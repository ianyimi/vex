import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";

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
  if (args.softDelete) {
    await Promise.all(
      args.ids.map((id) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args.ctx.db.patch(id, { [args.softDelete as string]: true } as any),
      ),
    );
    return;
  }

  await Promise.all(args.ids.map((id) => args.ctx.db.delete(id)));
}
