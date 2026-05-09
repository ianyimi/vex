import {
  internalMutationGeneric,
  internalQueryGeneric,
  type MutationBuilder,
  type RegisteredMutation,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  type RegisteredQuery,
} from "convex/server";
import { GenericId, v } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug } from "../types/generated";
import { find } from "./find.server";
import { get } from "./get.server";
import { search } from "./search.server";
import { create } from "./create/server";
import { update } from "./update.server";
import { remove } from "./remove.server";

export { find } from "./find.server";
export type { FindServerArgs } from "./find.server";

export { get } from "./get.server";
export type { GetServerArgs } from "./get.server";

export { search } from "./search.server";
export type { SearchServerArgs } from "./search.server";

export { create } from "./create/server";
export type { CreateServerArgs } from "./create/server";

export { update } from "./update.server";
export type { UpdateServerArgs } from "./update.server";

export { remove } from "./remove.server";
export type { RemoveServerArgs } from "./remove.server";

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
 * @param _config - The user's `VexConfig`. Reserved for future metadata.
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
>(
  _config: VexConfig,
  query: QueryBuilder<DataModel, Visibility> = internalQueryGeneric as never,
) {
  return {
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        limit: v.optional(v.number()),
      },
      handler: (ctx, args) =>
        find({
          ctx,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          limit: args.limit,
        }),
    }) as RegisteredQuery<Visibility, never, never>,

    get: query({
      args: {
        id: v.string(),
        populate: v.optional(v.any()),
      },
      handler: (ctx, args) =>
        get({ ctx, id: args.id as GenericId<CollectionSlug>, populate: args.populate }),
    }) as RegisteredQuery<Visibility, never, never>,

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
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
        }),
    }) as RegisteredQuery<Visibility, never, never>,
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
  mutation: MutationBuilder<
    DataModel,
    Visibility
  > = internalMutationGeneric as never,
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
        update({ ctx, id: args.id as GenericId<CollectionSlug>, data: args.data }),
    }) as RegisteredMutation<Visibility, never, never>,

    remove: mutation({
      args: {
        id: v.string(),
      },
      handler: (ctx, args) => remove({ ctx, id: args.id as GenericId<CollectionSlug> }),
    }) as RegisteredMutation<Visibility, never, never>,
  };
}
