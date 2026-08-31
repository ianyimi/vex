import {
  type MutationBuilder,
  type QueryBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../../config";
import { generateUploadUrl, createMediaDocument, deleteMedia, getUrl } from "./index";
import { VexApiAuth } from "../../api/types";
import { resolveGetAuth } from "../../api/server";

/**
 * Registers `getUrl` as a convex query endpoint.
 * Registers `generateUploadUrl`, `createMediaDocument`, and `deleteMedia` as Convex mutation endpoints.
 *
 * Call in the user's `convex/vex/media.ts`. The factory wraps
 * the server functions in `mutation()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.media.generateUploadUrl`, `api.vex.media.createMediaDocument`, etc.
 *
 * `vexConvexApi.media.generateUploadUrl`, `vexConvexApi.media.createMediaDocument`, etc. in
 * `@vexcms/core/src/convex/index.ts` point at these paths.
 *
 * @returns Registered `getUrl` Convex query, `generateUploadUrl` / `createMediaDocument` / `deleteMedia` Convex mutations.
 * @example
 * ```ts
 * // apps/www/convex/vex/media.ts
 * import { createGetAuth } from "@vexcms/better-auth"
 * import { mediaApi } from "@vexcms/core/convex";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { getUrl, generateUploadUrl, createMediaDocument, deleteMedia } = mediaApi({ config, query, mutation, getAuth: createGetAuth({...}) });
 * ```
 */
export function mediaApi<
  TDataModel extends GenericDataModel = GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  /** The user's resolved `VexConfig`. */
  config: VexConfig;
  /** Convex `query` builder from `_generated/server` (or an internal builder to keep endpoints private). */
  query: QueryBuilder<TDataModel, Visibility>;
  /** Convex `mutation` builder from `_generated/server` (or an internal builder to keep endpoints private). */
  mutation: MutationBuilder<TDataModel, Visibility>;
  /**
   * Server-side resolver for the current caller: receives the handler's ctx and
   * returns `{ user, organization? }` (or `undefined` when unauthenticated).
   * Called once per request, and only when `config.access` is configured.
   * Never exposed to clients.
   */
  getAuth?: (
    ctx: GenericQueryCtx<TDataModel> | GenericMutationCtx<TDataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  return {
    getUrl: query({
      args: {
        adapter: v.string(),
        mediaId: v.string(),
      },
      returns: v.union(
        v.object({
          url: v.string(),
        }),
        v.object({
          error: v.string(),
        }),
      ),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await getUrl({
          auth,
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
        });
      },
    }),

    // MUTATIONS
    generateUploadUrl: mutation({
      args: {
        adapter: v.string(),
        collection: v.string(),
      },
      returns: v.object({ url: v.string() }),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await generateUploadUrl({
          auth,
          ctx: ctx,
          collection: args.collection,
          config,
          adapter: args.adapter,
        });
      },
    }),

    createMediaDocument: mutation({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        storageId: v.string(),
        filename: v.string(),
        mimeType: v.string(),
        size: v.number(),
        alt: v.optional(v.string()),
        adapterFields: v.optional(v.any()),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await createMediaDocument({
          auth,
          ctx,
          config,
          adapter: args.adapter,
          collection: args.collectionSlug,
          storageId: args.storageId,
          filename: args.filename,
          mimeType: args.mimeType,
          size: args.size,
          alt: args.alt,
          adapterFields: args.adapterFields,
        });
      },
    }),

    deleteMedia: mutation({
      args: {
        adapter: v.string(),
        mediaId: v.string(),
        softDelete: v.optional(v.boolean()),
      },
      returns: v.boolean(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await deleteMedia({
          auth,
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
          softDelete: args.softDelete,
        });
      },
    }),
  };
}
