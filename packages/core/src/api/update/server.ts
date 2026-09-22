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
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { getCollectionInputSchema, validateFields } from "../../collections";
import { deepEqual, resolveAccessCall, stampUpdatedAt, toVexMutationCtx } from "../utils";
import { TDocument } from "../convex";

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
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.update,
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
      changes: args.data,
    });
  }

  const { _id, _creationTime, ...fields } = (doc ?? {}) as Record<string, unknown>;
  const mergedFields = { ...fields, ...args.data } as unknown as TDocument;

  let transformedFields: TDocument = mergedFields;
  if (collection.hooks?.beforeChange) {
    transformedFields = await collection.hooks.beforeChange({
      operation: "update",
      doc: mergedFields as never,
      ctx: args.ctx,
      collection,
    });
  }

  const changedKeys = new Set(Object.keys(args.data));
  for (const key of Object.keys(transformedFields)) {
    if (!deepEqual(transformedFields[key], mergedFields[key])) changedKeys.add(key);
  }

  const parsed = getCollectionInputSchema({ collection, partial: true }).safeParse(
    transformedFields,
  );
  if (!parsed.success) {
    throw new ConvexError({ message: "Validation failed", errors: parsed.error.message });
  }
  await validateFields({
    collection,
    doc: transformedFields,
    keys: changedKeys,
    ctx: toVexMutationCtx(args.ctx),
    config: args.config,
  });

  const patch: Record<string, unknown> = {};
  for (const key of changedKeys) patch[key] = transformedFields[key];

  const data = stampUpdatedAt({ collection: args.collection, config: args.config, data: patch });
  await args.ctx.db.patch(args.id, data as never);
}
