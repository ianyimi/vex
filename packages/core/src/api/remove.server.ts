import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import type { GenericMutationServerParams } from "./types";

/**
 * Server-side args for `remove`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 */
export interface RemoveServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  id: GenericId<TSlug>;
}

/**
 * Permanently deletes a document by its `Id<TSlug>`. Server-side only.
 * Named `remove` to avoid collision with the JavaScript `delete` keyword.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @param args - `{ ctx, id }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example
 * ```ts
 * import { remove } from "@vexcms/core/server";
 *
 * export const deletePost = mutation({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => remove({ ctx, id: args.id }),
 * });
 * ```
 */
export async function remove<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
>(args: RemoveServerArgs<DataModel, TSlug>): Promise<void> {
  await args.ctx.db.delete(args.id);
}
