import {
  type MutationBuilder,
  type QueryBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  // type GenericMutationCtx,
  RegisteredMutation,
  RegisteredQuery,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../../config";
import {
  generateUploadUrl,
  createMediaDocument,
  deleteMedia,
  getUrl,
  listMedia,
  searchMedia,
} from "./index";
import type {
  VexMediaGenerateUploadUrlArgs,
  VexMediaCreateMediaDocumentArgs,
  VexMediaDeleteMediaArgs,
  VexMediaGetUrlArgs,
  VexMediaListMediaArgs,
  VexMediaSearchMediaArgs,
} from "../../api/convex";

/**
 * Registers `generateUploadUrl`, `createMediaDocument`, and `deleteMedia` as Convex mutation endpoints.
 *
 * Call alongside `mediaQueryApi` in the user's `convex/vex/media.ts`. The factory wraps
 * the server functions in `mutation()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.media.generateUploadUrl`, `api.vex.media.createMediaDocument`, etc.
 *
 * `vexConvexApi.media.generateUploadUrl`, `vexConvexApi.media.createMediaDocument`, etc. in
 * `@vexcms/core/src/convex/index.ts` point at these paths.
 *
 * @param config - The user's `VexConfig`.
 * @param mutation - The user's `mutation` builder from `convex/_generated/server`.
 *   Defaults to `internalMutationGeneric`.
 * @returns Registered `generateUploadUrl` / `createMediaDocument` / `deleteMedia` Convex mutations.
 * @example
 * ```ts
 * // apps/www/convex/vex/media.ts
 * import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { generateUploadUrl, createMediaDocument, deleteMedia } = mediaMutationApi(config, mutation);
 * export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
 * ```
 */
export function mediaMutationApi<
  TDataModel extends GenericDataModel = GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(config: VexConfig, mutation: MutationBuilder<TDataModel, Visibility>) {
  return {
    generateUploadUrl: mutation({
      args: {
        adapter: v.string(),
      },
      returns: v.object({ url: v.string() }),
      handler: (ctx, args) =>
        generateUploadUrl({
          ctx: ctx,
          config,
          adapter: args.adapter,
        }),
    }) as RegisteredMutation<Visibility, VexMediaGenerateUploadUrlArgs, { url: string }>,

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
      handler: (ctx, args) =>
        createMediaDocument({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          storageId: args.storageId,
          filename: args.filename,
          mimeType: args.mimeType,
          size: args.size,
          alt: args.alt,
          adapterFields: args.adapterFields,
        }),
    }) as RegisteredMutation<Visibility, VexMediaCreateMediaDocumentArgs, string>,

    deleteMedia: mutation({
      args: {
        adapter: v.string(),
        mediaId: v.string(),
        softDelete: v.optional(v.boolean()),
      },
      returns: v.boolean(),
      handler: (ctx, args) =>
        deleteMedia({
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
          softDelete: args.softDelete,
        }),
    }) as RegisteredMutation<Visibility, VexMediaDeleteMediaArgs, boolean>,
  };
}

/**
 * Registers `getUrl`, `listMedia`, and `searchMedia` as Convex query endpoints.
 *
 * Call alongside `mediaMutationApi` in the user's `convex/vex/media.ts`. The factory wraps
 * the server functions in `query()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.media.getUrl`, `api.vex.media.listMedia`, etc.
 *
 * @param config - The user's `VexConfig`.
 * @param query - The user's `query` builder from `convex/_generated/server`.
 *   Defaults to `internalQueryGeneric`.
 * @returns Registered `getUrl` / `listMedia` / `searchMedia` Convex queries.
 * @example
 * ```ts
 * // apps/www/convex/vex/media.ts
 * import { mediaMutationApi, mediaQueryApi } from "@vexcms/core/convex";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { generateUploadUrl, createMediaDocument, deleteMedia } = mediaMutationApi(config, mutation);
 * export const { getUrl, listMedia, searchMedia } = mediaQueryApi(config, query);
 * ```
 */
export function mediaQueryApi<
  TDataModel extends GenericDataModel = GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(config: VexConfig, query: QueryBuilder<TDataModel, Visibility>) {
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
      handler: (ctx, args) =>
        getUrl({
          ctx,
          config,
          adapter: args.adapter,
          mediaId: args.mediaId,
        }),
    }) as RegisteredQuery<
      Visibility,
      VexMediaGetUrlArgs,
      { url: string; error: never } | { url: never; error: string }
    >,

    listMedia: query({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        limit: v.optional(v.number()),
        offset: v.optional(v.number()),
      },
      returns: v.array(v.any()),
      handler: (ctx, args) =>
        listMedia({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          limit: args.limit,
          offset: args.offset,
        }),
    }) as RegisteredQuery<Visibility, VexMediaListMediaArgs, any[]>,

    searchMedia: query({
      args: {
        adapter: v.string(),
        collectionSlug: v.string(),
        query: v.string(),
      },
      returns: v.array(v.any()),
      handler: (ctx, args) =>
        searchMedia({
          ctx,
          config,
          adapter: args.adapter,
          collectionSlug: args.collectionSlug,
          query: args.query,
        }),
    }) as RegisteredQuery<Visibility, VexMediaSearchMediaArgs, any[]>,
  };
}
