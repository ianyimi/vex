import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { DeleteMediaServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { resolveCollectionSlug } from "../../../db/documents";
import { type GenericId } from "convex/values";
import { CollectionSlug } from "../../../types";

/**
 * Deletes a media document and its file from storage.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.deleteMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId, softDelete? }`.
 * @returns Promise resolving to `true` if the document was deleted.
 * @example
 * ```ts
 * import { deleteMedia } from "@vexcms/core/server";
 *
 * export const removeMedia = mutation({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     deleteMedia({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
  args: DeleteMediaServerArgs<TDataModel>,
): Promise<boolean> {
  if (args.config.access !== undefined) {
    const resource = resolveCollectionSlug({
      ctx: args.ctx,
      config: args.config,
      id: args.mediaId as GenericId<CollectionSlug>,
    });
    const { access, action } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.delete,
      resource,
    });
    // Pass the stored media document: a per-document delete rule cannot be
    // evaluated without it, and omitting it makes such a rule unsatisfiable
    // (the capability probe trips and the default `all` scope resolves `false`).
    const doc = await args.ctx.db.get(args.mediaId as GenericId<CollectionSlug>);
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
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.deleteMedia(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
    softDelete: args.softDelete,
  });
}
