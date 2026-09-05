import type { GenericDataModel } from "convex/server";

import { GetUrlReturn } from "../types";
import type { GetUrlServerArgs } from "./types";
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { resolveAccessCall, resolveCollectionSlug } from "../../api/utils";
import { GenericId } from "convex/values";
import { CollectionSlug } from "../../types";

/**
 * Returns a URL for a media file.
 * Server-side only — call inside a Convex query handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.getUrl(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId }`.
 * @returns Promise resolving to `{ url: string }` or `{ url: null, error: string }`.
 * @example
 * ```ts
 * import { getUrl } from "@vexcms/core/server";
 *
 * export const getMediaUrl = query({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     getUrl({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function getUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  args: GetUrlServerArgs<TDataModel>,
): Promise<GetUrlReturn> {
  if (args.config.access !== undefined) {
    const resource = resolveCollectionSlug({
      ctx: args.ctx,
      config: args.config,
      id: args.mediaId as GenericId<CollectionSlug>,
    });
    const { access, action } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.read,
      resource,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization ?? {},
      resource: resource,
      action,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    return {
      error: `Adapter "${args.adapter}" not found`,
    };
  }
  return await adapter.getUrl(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
  });
}
