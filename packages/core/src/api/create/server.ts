import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";

/**
 * Server-side args for `create`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 */
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  collection: TSlug;
  data: Expand<
    BetterOmit<
      DocumentByName<DataModel, TableNamesInDataModel<DataModel>>,
      "_creationTime" | "_id"
    >
  >;
}

/**
 * Inserts a document into a VexCMS collection and returns its ID.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @param args - `{ ctx, collection, data }`. `ctx` must be a mutation context.
 * @returns Promise resolving to the new document's ID as a string.
 * @example
 * ```ts
 * import { create } from "@vexcms/core/server";
 *
 * export const createPost = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) => create({ ctx, collection: "posts", data: args.data }),
 * });
 * ```
 */
export async function create<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TSlug>): Promise<string> {
  const id = await args.ctx.db.insert(
    args.collection as TableNamesInDataModel<DataModel>,
    args.data,
  );
  return id as string;
}
