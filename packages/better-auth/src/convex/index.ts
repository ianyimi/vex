import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  MutationBuilder,
  QueryBuilder,
  SchemaDefinition,
} from "convex/server";
import { convexAdapter } from "./adapter";
import * as DB from "./db";

/**
 * Arguments for authDbApi — same pattern as queryApi/mutationApi in @vexcms/core.
 *
 * The user imports their Convex schema from `convex/schema.ts` and passes it here.
 */
export type AuthDbApiOptions<DataModel extends GenericDataModel> = {
  /** The user's Convex schema (from `convex/schema.ts`). */
  schema: SchemaDefinition<any, any>;
  /** The user's `internalMutation` from `convex/_generated/server`. */
  internalMutation: MutationBuilder<DataModel, "internal">;
  /** The user's `internalQuery` from `convex/_generated/server`. */
  internalQuery: QueryBuilder<DataModel, "internal">;
};

/**
 * Creates the auth DB operations as proper Convex functions.
 *
 * Use this in www/convex/auth/db.ts to export the db operations:
 * ```ts
 * import { authDbApi } from "@vexcms/better-auth/convex"
 * import { internalMutation, internalQuery } from "../../_generated/server"
 * import schema from "../schema"
 *
 * export const { dbCreate, dbFindOne, dbFindMany, dbCount, dbUpdate, dbUpdateMany, dbDelete, dbDeleteMany } = authDbApi({
 *   schema,
 *   internalMutation,
 *   internalQuery,
 * })
 * ```
 *
 * This follows the exact same pattern as queryApi/mutationApi in @vexcms/core.
 * The returned functions are proper Convex FunctionReferences available as
 * internal.auth.db.dbCreate, etc. in the user's Convex API.
 * @param options
 */
export function authDbApi<DataModel extends GenericDataModel>(
  options: AuthDbApiOptions<DataModel>,
) {
  return {
    dbCreate: options.internalMutation({
      ...DB.create,
      handler: async (ctx, args) =>
        await DB.create.handler(
          ctx as unknown as GenericMutationCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbFindOne: options.internalQuery({
      ...DB.findOne,
      handler: async (ctx, args) =>
        await DB.findOne.handler(
          ctx as unknown as GenericQueryCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbFindMany: options.internalQuery({
      ...DB.findMany,
      handler: async (ctx, args) =>
        await DB.findMany.handler(
          ctx as unknown as GenericQueryCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbCount: options.internalQuery({
      ...DB.count,
      handler: async (ctx, args) =>
        await DB.count.handler(
          ctx as unknown as GenericQueryCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbUpdate: options.internalMutation({
      ...DB.update,
      handler: async (ctx, args) =>
        await DB.update.handler(
          ctx as unknown as GenericMutationCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbUpdateMany: options.internalMutation({
      ...DB.updateMany,
      handler: async (ctx, args) =>
        await DB.updateMany.handler(
          ctx as unknown as GenericMutationCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbDelete: options.internalMutation({
      ...DB.deleteOne,
      handler: async (ctx, args) =>
        await DB.deleteOne.handler(
          ctx as unknown as GenericMutationCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),

    dbDeleteMany: options.internalMutation({
      ...DB.deleteMany,
      handler: async (ctx, args) =>
        await DB.deleteMany.handler(
          ctx as unknown as GenericMutationCtx<GenericDataModel>,
          args,
          options.schema,
        ),
    }),
  };
}

/**
 * Creates the Better Auth Convex adapter.
 *
 * Use this in www/convex/auth/index.ts inside createAuth:
 * ```ts
 * import { createBetterAuthAdapter } from "@vexcms/better-auth/convex"
 * import { dbCreate, dbFindOne, ... } from "./db"
 *
 * export const createAuth = (ctx) => {
 *   return betterAuth({
 *     database: createBetterAuthAdapter(ctx, { dbCreate, dbFindOne, ... }),
 *     ...authOptions,
 *   })
 * }
 * ```
 *
 * The adapter uses anyApi to reference the db operations (anyApi.auth.db.dbCreate etc.)
 * and calls them via ctx.runMutation/ctx.runQuery.
 * @param ctx ActionCtx from better-auth convex library
 * @returns AdapterFactory
 */
export function createBetterAuthAdapter<DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
) {
  return convexAdapter(ctx);
}

export { convexAdapter } from "./adapter";
export * from "./types";
export * from "./getAuth";
