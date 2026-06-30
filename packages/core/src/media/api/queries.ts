import type { GenericDataModel } from "convex/server";

import { GetUrlReturn, VexStorageConfigError } from "../types";
import type { GetUrlServerArgs, ListMediaServerArgs, SearchMediaServerArgs } from "./types";

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

/**
 * Lists media documents from a collection.
 * Server-side only — call inside a Convex query handler.
 *
 * **Not yet implemented** — currently returns an empty array.
 * Will query the media collection table directly via `ctx.db` once implemented.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, limit?, offset? }`.
 * @returns Promise resolving to an empty array until implemented.
 */
export async function listMedia<TDataModel extends GenericDataModel>(
  args: ListMediaServerArgs<TDataModel>,
): Promise<Array<Record<string, unknown>>> {
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  // Note: listMedia is implemented by core, not adapter-specific
  // This will query the media collection table directly
  return [];
}

/**
 * Searches media documents in a collection by filename or alt text.
 * Server-side only — call inside a Convex query handler.
 *
 * **Not yet implemented** — currently returns an empty array.
 * Will query the media collection table directly via `ctx.db` once implemented.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, query }`.
 * @returns Promise resolving to an empty array until implemented.
 */
export async function searchMedia<TDataModel extends GenericDataModel>(
  args: SearchMediaServerArgs<TDataModel>,
): Promise<Array<Record<string, unknown>>> {
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  // Note: searchMedia is implemented by core, not adapter-specific
  // This will query the media collection table directly
  return [];
}
