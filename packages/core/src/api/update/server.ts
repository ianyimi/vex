import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS } from "../../access";
import { prepareEdit } from "../prepareEdit";
import { stampUpdatedAt } from "../utils";
import { TDocument } from "../convex";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../versions";

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
  /** The collection slug to patch this document. */
  collection: TCollectionSlug;
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
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }

  const doc = await args.ctx.db.get(args.id);
  if (
    collection.versions.drafts &&
    (doc as TDocument | null)?.vex_status === VERSION_STATUSES.draft.key
  ) {
    throw new ConvexError(
      `Document "${args.id}" in collection "${args.collection}" is a draft row — use versions.saveDraft to edit it`,
    );
  }

  const { patch, transformedFields } = await prepareEdit({
    ctx: args.ctx,
    config: args.config,
    target: { kind: "collection", config: collection },
    action: CRUD_ACTIONS.update,
    access: args.access,
    auth: args.auth,
    storedDoc: (doc ?? undefined) as TDocument | undefined,
    changes: args.data as Partial<TDocument>,
    partial: true,
    validateKeys: "changed",
  });

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });
  await args.ctx.db.patch(args.id, data as never);

  if (collection.versions.drafts) {
    await createVersion({
      ctx: args.ctx,
      collection: args.collection,
      documentId: String(args.id),
      status: VERSION_STATUSES.published.key,
      snapshot: removeVexFields({ doc: transformedFields }),
      publishedAt: (doc as TDocument | null)?.vex_publishedAt as number | undefined,
    });
  }
}
