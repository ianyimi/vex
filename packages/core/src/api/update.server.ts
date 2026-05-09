import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../types/generated";
import type { GenericMutationServerParams } from "./types";

/**
 * Server-side args for `update`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 */
export interface UpdateServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  id: GenericId<TSlug>;
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
 * Patches a document by its `Id<TSlug>`. Only specified fields are updated;
 * unspecified fields are left unchanged. Server-side only.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
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
  TSlug extends CollectionSlug,
>(args: UpdateServerArgs<DataModel, TSlug>): Promise<void> {
  await args.ctx.db.patch(args.id, args.data);
}
