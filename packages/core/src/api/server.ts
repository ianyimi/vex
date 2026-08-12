import {
  internalMutationGeneric,
  internalQueryGeneric,
  paginationOptsValidator,
  type MutationBuilder,
  type RegisteredMutation,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  type RegisteredQuery,
} from "convex/server";
import { ConvexError, GenericId, v } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug, GlobalSlug, VexDocumentGlobal } from "../types/generated";
import { find } from "./find/server";
import { get } from "./get/server";
import { search } from "./search/server";
import { create } from "./create/server";
import { update } from "./update/server";
import { remove } from "./remove/server";
import { getGlobal } from "./globals/get.server";
import { findGlobals } from "./globals/find.server";
import { upsertGlobal } from "./globals/update.server";
import {
  VexDocument,
  VexFindArgs,
  VexGetArgs,
  VexGlobalsFindArgs,
  VexGlobalsGetArgs,
  VexGlobalsUpdateArgs,
  VexSearchArgs,
} from "./convex";

export { buildDepthPopulate } from "./depth";

export { find } from "./find/server";
export type { FindServerArgs } from "./find/server";

export { get } from "./get/server";
export type { GetServerArgs } from "./get/server";

export { search } from "./search/server";
export type { SearchServerArgs } from "./search/server";

export { create } from "./create/server";
export type { CreateServerArgs } from "./create/server";

export { update } from "./update/server";
export type { UpdateServerArgs } from "./update/server";

export { remove } from "./remove/server";
export type { RemoveServerArgs } from "./remove/server";

export { getGlobal } from "./globals/get.server";
export type { GetGlobalServerArgs } from "./globals/get.server";
export { findGlobals } from "./globals/find.server";
export type { FindGlobalsServerArgs } from "./globals/find.server";
export { upsertGlobal } from "./globals/update.server";
export type { UpdateGlobalServerArgs } from "./globals/update.server";

/**
 * Registers `find`, `get`, and `search` as Convex query endpoints.
 *
 * All logic lives in the server functions imported above — this file only
 * provides the `v.args()` schema and the `query()` wrapper that Convex needs
 * to expose them at the network boundary.
 *
 * Users call this once in their `convex/vex.ts` and get registered endpoints
 * they can subscribe to from React via tanstack-query. They can also call the
 * server functions directly from their own Convex handlers without this factory.
 *
 * @param config - The user's `VexConfig`. Reserved for future metadata.
 * @param query - The user's `query` builder. Defaults to `internalQueryGeneric`.
 * @returns Registered `find` / `get` / `search` Convex queries.
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi } from "@vexcms/core/convex";
 * import { query } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * ```
 */
export function queryApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(config: VexConfig, query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: (ctx, args) =>
        find({
          ctx,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          paginationOpts: args.paginationOpts,
        } as any),
    }) as RegisteredQuery<Visibility, VexFindArgs, VexDocument[]>,

    get: query({
      args: {
        id: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
      },
      handler: (ctx, args) =>
        get({
          ctx,
          id: args.id as GenericId<CollectionSlug>,
          populate: args.populate,
          depth: args.depth,
          config,
        }),
    }) as RegisteredQuery<Visibility, VexGetArgs, VexDocument[]>,

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: (ctx, args) =>
        search({
          ctx,
          collection: args.collection as CollectionSlug,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
          paginationOpts: args.paginationOpts,
          config,
        } as any),
    }) as RegisteredQuery<Visibility, VexSearchArgs, VexDocument[]>,
  };
}

/**
 * Registers `create`, `update`, and `remove` as Convex mutation endpoints.
 *
 * Call alongside `queryApi` in the user's `convex/vex.ts`. The factory wraps
 * the server functions in `mutation()` with `v.args()` schemas so Convex
 * exposes them at `api.vex.create`, `api.vex.update`, `api.vex.remove`.
 *
 * `vexConvexApi.create`, `vexConvexApi.update`, `vexConvexApi.remove` in
 * `@vexcms/core/src/convex/index.ts` point at these paths.
 *
 * @param _config - The user's `VexConfig`. Reserved for future metadata.
 * @param mutation - The user's `mutation` builder from `convex/_generated/server`.
 *   Defaults to `internalMutationGeneric`.
 * @returns Registered `create` / `update` / `remove` Convex mutations.
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi, mutationApi } from "@vexcms/core/convex";
 * import { query, mutation } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * export const { create, update, remove } = mutationApi(config, mutation);
 * ```
 */
export function mutationApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  _config: VexConfig,
  mutation: MutationBuilder<DataModel, Visibility> = internalMutationGeneric as never,
) {
  return {
    create: mutation({
      args: {
        collection: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: (ctx, args) =>
        create({
          ctx,
          collection: args.collection as CollectionSlug,
          data: args.data,
        }),
    }) as RegisteredMutation<Visibility, never, never>,

    update: mutation({
      args: {
        id: v.string(),
        data: v.any(),
      },
      handler: (ctx, args) =>
        update({
          ctx,
          id: args.id as GenericId<CollectionSlug>,
          data: args.data,
        }),
    }) as RegisteredMutation<Visibility, never, never>,

    remove: mutation({
      args: {
        ids: v.array(v.string()),
        softDelete: v.optional(v.string()),
      },
      handler: (ctx, args) =>
        remove({
          ctx,
          ids: args.ids as GenericId<CollectionSlug>[],
          softDelete: args.softDelete,
        }),
    }) as RegisteredMutation<Visibility, never, never>,
  };
}

/**
 * Registers `globals.get`, `globals.find`, and `globals.update` as Convex
 * query and mutation endpoints under `api.vex.globals.*`.
 *
 * Call once in `convex/vex.ts` alongside `queryApi` and `mutationApi`.
 *
 * @param config - The resolved `VexConfig`.
 * @param query - Convex `query` builder. Defaults to `internalQueryGeneric`.
 * @param mutation - Convex `mutation` builder. Defaults to `internalMutationGeneric`.
 * @returns `{ globals }` with `.get`, `.find`, `.update` registered handlers.
 *
 * @example
 * ```ts
 * // apps/www/convex/vex.ts
 * import { queryApi, mutationApi, globalsApi } from "@vexcms/core/server";
 * import { query, mutation } from "./_generated/server";
 * import config from "../src/vex.config";
 *
 * export const { find, get, search } = queryApi(config, query);
 * export const { create, update, remove } = mutationApi(config, mutation);
 * export const { globals } = globalsApi(config, query, mutation);
 * // → api.vex.globals.get, api.vex.globals.find, api.vex.globals.update
 * ```
 */
export function globalsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>(
  config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
  mutation: MutationBuilder<DataModel, Visibility> = internalMutationGeneric as never,
) {
  return {
    get: query({
      args: {
        slug: v.string(),
        populate: v.optional(v.any()),
      },
      handler: (ctx, args) =>
        getGlobal({
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
          config,
        }),
    }) as RegisteredQuery<Visibility, VexGlobalsGetArgs, VexDocumentGlobal | null>,

    find: query({
      args: {},
      handler: (ctx) => findGlobals({ ctx }),
    }) as RegisteredQuery<Visibility, VexGlobalsFindArgs, VexDocumentGlobal[]>,

    upsert: mutation({
      args: {
        slug: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: (ctx, args) => {
        const globalConfig = config.globals.find((g) => g.slug === args.slug);
        if (!globalConfig) {
          throw new ConvexError(`No global registered with slug "${args.slug}"`);
        }
        return upsertGlobal({
          ctx,
          slug: args.slug as GlobalSlug,
          data: args.data as Record<string, unknown>,
          globalConfig,
        });
      },
    }) as RegisteredMutation<Visibility, VexGlobalsUpdateArgs, string>,
  };
}
