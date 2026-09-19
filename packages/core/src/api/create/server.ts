import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { getCollectionInputSchema, validateFields } from "../../collections";
import { resolveAccessCall, stampUpdatedAt } from "../utils";
import { TDocument } from "../convex";

/**
 * Server-side args for `create`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Field values for the new document. `_id` and `_creationTime` are
   * excluded — Convex assigns these automatically.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Expand<
    BetterOmit<DocumentByName<DataModel, TableNamesInDataModel<DataModel>>, "_creationTime" | "_id">
  >;
}

/**
 * Inserts a document into a VexCMS collection and returns its ID.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
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
  TCollectionSlug extends CollectionSlug,
>(args: CreateServerArgs<DataModel, TCollectionSlug>): Promise<string> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      changes: args.data,
      throwOnDenied: true,
    });
  }

  let doc = { ...args.data } as unknown as TDocument;
  if (collection.hooks?.beforeChange) {
    doc = await collection.hooks.beforeChange({
      operation: "create",
      doc: doc as never,
      ctx: args.ctx,
      collection,
    });
  }

  const parsed = getCollectionInputSchema({ collection }).safeParse(doc);
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }

  await validateFields({ collection, doc, keys: Object.keys(doc), ctx: args.ctx });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: doc });
  const id = await args.ctx.db.insert(args.collection, data as never);
  return id;
}
