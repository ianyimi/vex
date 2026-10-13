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
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../../access";
import { stampUpdatedAt } from "../utils";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../versions";
import { prepareEdit } from "../prepareEdit";

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

  const { patch } = await prepareEdit<DataModel>({
    ctx: args.ctx,
    target: { kind: "collection", config: collection },
    config: args.config,
    access: args.access,
    auth: args.auth,
    action: CRUD_ACTIONS.create,
    changes: args.data,
  });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });

  if (collection.versions.drafts) {
    const status = collection.versions.defaultStatus;
    const insertData = {
      ...data,
      vex_status: status,
      ...(status === VERSION_STATUSES.published.key ? { vex_publishedAt: Date.now() } : {}),
    };
    if (status === VERSION_STATUSES.draft.key && args.config.access) {
      hasPermission({
        access: args.config.access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource: collection.slug,
        action: DRAFT_ACTIONS.saveDraft,
        data: insertData,
        changes: args.data,
        throwOnDenied: true,
      });
    }
    const id = await args.ctx.db.insert(args.collection, insertData as never);
    await createVersion({
      ctx: args.ctx,
      collection: args.collection,
      documentId: id,
      status,
      snapshot: removeVexFields({ doc: data }),
      publishedAt: insertData.vex_publishedAt,
    });
    return id;
  }

  const id = await args.ctx.db.insert(args.collection, data as never);
  return id;
}
