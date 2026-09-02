import type { Where } from "better-auth/types";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import { anyApi } from "convex/server";
import {
  createAdapterFactory,
  type DBAdapterDebugLogOption,
} from "better-auth/adapters";
import { getAuthTables } from "better-auth/db";

type ConvexCleanedWhere = Where & {
  value: boolean | null | number | number[] | string | string[];
};

const parseWhere = (where?: Where[]): ConvexCleanedWhere[] => {
  return (where?.map((where) => {
    if (where.value instanceof Date) {
      return { ...where, value: where.value.getTime() };
    }
    return where;
  }) ?? []) as ConvexCleanedWhere[];
};

/**
 * Creates the Convex database adapter for Better Auth.
 *
 * @param ctx - The Convex action context
 * @param config - Optional debug log configuration
 * @returns AdapterFactory<BetterAuthOptions>
 */
export function convexAdapter<DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
  config: { debugLogs?: DBAdapterDebugLogOption } = {},
) {
  return createAdapterFactory({
    adapter: ({ options }) => {
      options.telemetry = { enabled: false };
      const betterAuthSchema = getAuthTables(options);
      const betterAuthSchemaJson = JSON.stringify(betterAuthSchema);

      return {
        id: "convex",
        options: { isRunMutationCtx: "runMutation" in ctx },

        // Use anyApi to reference db operations, call via ctx.runMutation/ctx.runQuery
        create: async ({ data, model, select }) => {
          return await ctx.runMutation(anyApi.auth.db.dbCreate, {
            betterAuthSchema: betterAuthSchemaJson,
            data,
            model,
            select,
          });
        },

        findOne: async ({ model, select, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbFindOne, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            select,
            where: parseWhere(where),
          });
        },

        findMany: async ({ limit, model, sortBy, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbFindMany, {
            betterAuthSchema: betterAuthSchemaJson,
            limit,
            model,
            sortBy,
            where: parseWhere(where),
          });
        },

        count: async ({ model, where }) => {
          return await ctx.runQuery(anyApi.auth.db.dbCount, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        update: async ({ model, update, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbUpdate, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parseWhere(where),
          });
        },

        updateMany: async ({ model, update, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbUpdateMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parseWhere(where),
          });
        },

        delete: async ({ model, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbDelete, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        deleteMany: async ({ model, where }) => {
          return await ctx.runMutation(anyApi.auth.db.dbDeleteMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parseWhere(where),
          });
        },

        transaction: async () => {
          throw new Error("Transactions not supported");
        },
      };
    },
    config: {
      adapterId: "convex",
      adapterName: "Convex Adapter",
      customTransformInput: ({ data, fieldAttributes }) =>
        data && fieldAttributes.type === "date"
          ? new Date(data).getTime()
          : data,
      customTransformOutput: ({ data, fieldAttributes }) =>
        data && fieldAttributes.type === "date"
          ? new Date(data).getTime()
          : data,
      debugLogs: config.debugLogs ?? false,
      disableIdGeneration: true,
      mapKeysTransformInput: { id: "_id" },
      mapKeysTransformOutput: { _id: "id" },
      supportsArrays: true,
      supportsDates: false,
      supportsJSON: true,
      supportsNumericIds: false,
      transaction: false,
      usePlural: false,
    },
  });
}
