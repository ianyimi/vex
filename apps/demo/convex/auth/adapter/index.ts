/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Where } from "better-auth/types"
import type { GenericActionCtx, GenericDataModel, SchemaDefinition } from "convex/server"

import { createAdapterFactory, type DBAdapterDebugLogOption } from "better-auth/adapters"
import { getAuthTables } from "better-auth/db"

import { internal } from "../../_generated/api"

type ConvexCleanedWhere = Where & {
  value: boolean | null | number | number[] | string | string[]
}

const parseWhere = (where?: Where[]): ConvexCleanedWhere[] => {
  return (where?.map((where) => {
    if (where.value instanceof Date) {
      return {
        ...where,
        value: where.value.getTime(),
      }
    }
    return where
  }) ?? []) as ConvexCleanedWhere[]
}

export const convexAdapter = <DataModel extends GenericDataModel>(
  ctx: GenericActionCtx<DataModel>,
  _schema: SchemaDefinition<any, any>,
  config: {
    debugLogs?: DBAdapterDebugLogOption
  } = {}
) => {
  return createAdapterFactory({
    adapter: ({ options }) => {
      options.telemetry = { enabled: false }

      // Extract Better Auth schema from the options passed by Better Auth
      const betterAuthSchema = getAuthTables(options)
      const betterAuthSchemaJson = JSON.stringify(betterAuthSchema)

      return {
        id: "convex",

        create: async ({ data, model, select }): Promise<any> => {
          return await ctx.runMutation(internal.auth.db.dbCreate, {
            betterAuthSchema: betterAuthSchemaJson,
            data,
            model,
            select,
          })
        },

        findOne: async ({ model, select, where }): Promise<any> => {
          const parsedWhere = parseWhere(where)

          return await ctx.runQuery(internal.auth.db.dbFindOne, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            select,
            where: parsedWhere,
          })
        },

        findMany: async ({ limit, model, offset, sortBy, where }): Promise<any[]> => {
          if (offset) {
            throw new Error("offset not supported")
          }

          const parsedWhere = parseWhere(where)

          return await ctx.runQuery(internal.auth.db.dbFindMany, {
            betterAuthSchema: betterAuthSchemaJson,
            limit,
            model,
            sortBy,
            where: parsedWhere,
          })
        },

        count: async ({ model, where }): Promise<number> => {
          const parsedWhere = parseWhere(where)

          return await ctx.runQuery(internal.auth.db.dbCount, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parsedWhere,
          })
        },

        update: async ({ model, update, where }): Promise<any> => {
          const parsedWhere = parseWhere(where)

          return await ctx.runMutation(internal.auth.db.dbUpdate, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parsedWhere,
          })
        },

        updateMany: async ({ model, update, where }): Promise<number> => {
          const parsedWhere = parseWhere(where)

          return await ctx.runMutation(internal.auth.db.dbUpdateMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            update,
            where: parsedWhere,
          })
        },

        delete: async ({ model, where }): Promise<void> => {
          const parsedWhere = parseWhere(where)

          await ctx.runMutation(internal.auth.db.dbDelete, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parsedWhere,
          })
        },

        deleteMany: async ({ model, where }): Promise<number> => {
          const parsedWhere = parseWhere(where)

          return await ctx.runMutation(internal.auth.db.dbDeleteMany, {
            betterAuthSchema: betterAuthSchemaJson,
            model,
            where: parsedWhere,
          })
        },

        // @ts-expect-error - Better Auth adapter interface doesn't export transaction callback type
        transaction: async (callback) => {
          // Convex doesn't support traditional transactions
          // All operations in a single mutation are atomic

          return callback({
            id: "convex",
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            count: async (_args) => {
              throw new Error("Cannot query within transaction")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            create: async (_args) => {
              throw new Error("Nested transactions not supported")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            delete: async (_args) => {
              throw new Error("Deletes within transactions not supported")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            deleteMany: async (_args) => {
              throw new Error("Deletes within transactions not supported")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            findMany: async (_args) => {
              throw new Error("Cannot query within transaction")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            findOne: async (_args) => {
              throw new Error("Cannot query within transaction")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            update: async (_args) => {
              throw new Error("Updates within transactions not supported")
            },
            // @ts-expect-error - Transaction method args type not exported, unused in stub implementation
            updateMany: async (_args) => {
              throw new Error("Updates within transactions not supported")
            },
          })
        },
      }
    },
    config: {
      adapterId: "convex",
      adapterName: "Convex Adapter (Action-based - Full Featured)",
      customTransformInput: ({ data, fieldAttributes }) => {
        if (data && fieldAttributes.type === "date") {
          return new Date(data).getTime()
        }
        // Handle array fields - Better Auth may send single values or arrays
        if ((fieldAttributes.type as string)?.endsWith("[]")) {
          // If already an array, return as-is
          if (Array.isArray(data)) {
            return data
          }
          // If it's a string that looks like JSON array, parse it
          if (typeof data === "string") {
            try {
              const parsed = JSON.parse(data)
              return Array.isArray(parsed) ? parsed : [data]
            } catch {
              // If parsing fails, wrap the string in an array
              return [data]
            }
          }
          // For any other value type, wrap in array
          if (data !== null && data !== undefined) {
            return [data]
          }
        }
        return data
      },
      customTransformOutput: ({ data, fieldAttributes }) => {
        if (data && fieldAttributes.type === "date") {
          return new Date(data).getTime()
        }
        // Arrays are stored natively in Convex, no transformation needed for output
        return data
      },
      debugLogs: config.debugLogs ?? false,
      disableIdGeneration: true,
      mapKeysTransformInput: {
        id: "_id",
      },
      mapKeysTransformOutput: {
        _id: "id",
      },
      supportsDates: false,
      supportsJSON: true,
      supportsNumericIds: false,
      transaction: false,
      usePlural: false,
    },
  })
}
