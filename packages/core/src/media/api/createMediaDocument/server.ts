import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { CreateMediaDocumentServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Creates a media document in the storage adapter after the file is uploaded.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.createMediaDocument(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, storageId, filename, mimeType, size, alt?, adapterFields? }`.
 * @returns Promise resolving to the new media document's ID as a string.
 * @example
 * ```ts
 * import { createMediaDocument } from "@vexcms/core/server";
 *
 * export const saveMedia = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) =>
 *     createMediaDocument({ ctx, config: myConfig, ...args.data }),
 * });
 * ```
 */
export async function createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
  args: CreateMediaDocumentServerArgs<TDataModel>,
): Promise<string> {
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      changes: {
        alt: args.alt,
        filename: args.filename,
        mimeType: args.mimeType,
        size: args.size,
        adapterFields: args.adapterFields,
      },
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.createMediaDocument(args.ctx, {
    collectionSlug: args.collection,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt,
    adapterFields: args.adapterFields,
  });
}
