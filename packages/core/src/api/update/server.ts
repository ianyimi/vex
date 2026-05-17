import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";

/**
 * Server-side args for `update`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
 */
export interface UpdateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The document ID to patch. */
  id: GenericId<TCollectionSlug>;
  /**
   * Partial field values to merge into the document. Only the keys present
   * here are written; unspecified fields are left unchanged. `_id` and
   * `_creationTime` are excluded — Convex manages them.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Partial<
    Expand<
      BetterOmit<
        DocumentByName<DataModel, TableNamesInDataModel<DataModel>>,
        "_creationTime" | "_id"
      >
    >
  >;
}

/**
 * Patches a document by its `Id<TCollectionSlug>`. Only specified fields are updated;
 * unspecified fields are left unchanged. Server-side only.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, id, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to void.
 * @example
 * ```ts
 * import { update } from "@vexcms/core/server";
 *
 * export const updatePost = mutation({
 *   args: { id: v.id("posts"), data: v.any() },
 *   handler: (ctx, args) => update({ ctx, id: args.id, data: args.data }),
 * });
 * ```
 */
export async function update<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TCollectionSlug>): Promise<void> {
  await args.ctx.db.patch(args.id, args.data);
}
