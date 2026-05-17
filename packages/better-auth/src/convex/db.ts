/* eslint-disable jsdoc/require-jsdoc */
import type { BetterAuthDBSchema } from "better-auth/db";
import type {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericDataModel,
  SchemaDefinition,
} from "convex/server";
import type { GenericId } from "convex/values";

import { v } from "convex/values";

import {
  checkUniqueFields,
  listOne,
  paginate,
  selectFields,
  type WhereClause,
} from "./utils";

// Helper to get Better Auth schema - we'll pass it from the adapter
const getBetterAuthSchema = (schemaJson: string): BetterAuthDBSchema => {
  return JSON.parse(schemaJson);
};

interface CreateArgs {
  betterAuthSchema: string;
  data: any;
  model: string;
  select?: string[];
}

export const create = {
  args: {
    betterAuthSchema: v.string(),
    data: v.any(),
    model: v.string(),
    select: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx: GenericMutationCtx<GenericDataModel>,
    { betterAuthSchema, data, model, select }: CreateArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);

    await checkUniqueFields(ctx, schema, authSchema, model, data as any);

    const id = await ctx.db.insert(model as any, data as any);
    const doc = await ctx.db.get(id);
    if (!doc) {
      throw new Error(`Failed to create ${model}`);
    }

    return selectFields(doc, select);
  },
};

interface FindOneArgs {
  betterAuthSchema: string;
  model: string;
  select?: string[];
  where: unknown[];
}

export const findOne = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    select: v.optional(v.array(v.string())),
    where: v.array(v.any()),
  },
  handler: async (
    ctx: GenericQueryCtx<GenericDataModel>,
    { betterAuthSchema, model, select, where }: FindOneArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const result = await listOne(ctx, schema, authSchema, {
      model,
      select,
      where: where as WhereClause[],
    });

    return result;
  },
};

interface FindManyArgs {
  betterAuthSchema: string;
  limit?: number;
  model: string;
  sortBy?: { direction: "asc" | "desc"; field: string };
  where?: unknown[];
}

export const findMany = {
  args: {
    betterAuthSchema: v.string(),
    limit: v.optional(v.number()),
    model: v.string(),
    sortBy: v.optional(
      v.object({
        direction: v.union(v.literal("asc"), v.literal("desc")),
        field: v.string(),
      }),
    ),
    where: v.optional(v.array(v.any())),
  },
  handler: async (
    ctx: GenericQueryCtx<GenericDataModel>,
    { betterAuthSchema, limit, model, sortBy, where }: FindManyArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = (where ?? []) as WhereClause[];

    // Handle OR connector by running parallel queries
    if (parsedWhere.some((w) => w.connector === "OR")) {
      const results = await Promise.all(
        parsedWhere.map(async (w) => {
          const result = await paginate(ctx, schema, authSchema, {
            model,
            paginationOpts: { cursor: null, numItems: limit ?? 200 },
            sortBy,
            where: [w],
          });
          return result.page;
        }),
      );

      // De-duplicate and flatten
      const seen = new Set<string>();
      const uniqueDocs: any[] = [];
      for (const docs of results) {
        for (const doc of docs) {
          const docId = doc._id as string;
          if (!seen.has(docId)) {
            seen.add(docId);
            uniqueDocs.push(doc);
          }
        }
      }

      // Apply sorting if needed
      if (sortBy) {
        uniqueDocs.sort((a, b) => {
          const aVal = a[sortBy.field];
          const bVal = b[sortBy.field];
          if (aVal === bVal) {
            return 0;
          }
          const comparison = aVal > bVal ? 1 : -1;
          return sortBy.direction === "desc" ? -comparison : comparison;
        });
      }

      return uniqueDocs.slice(0, limit);
    }

    // Normal case without OR
    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: limit ?? 200 },
      sortBy,
      where: parsedWhere,
    });

    return result.page;
  },
};

interface CountArgs {
  betterAuthSchema: string;
  model: string;
  where?: unknown[];
}

export const count = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.optional(v.array(v.any())),
  },
  handler: async (
    ctx: GenericQueryCtx<GenericDataModel>,
    { betterAuthSchema, model, where }: CountArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = (where ?? []) as WhereClause[];

    // Handle OR connector
    if (parsedWhere.some((w) => w.connector === "OR")) {
      const results = await Promise.all(
        parsedWhere.map(async (w) => {
          const result = await paginate(ctx, schema, authSchema, {
            model,
            paginationOpts: { cursor: null, numItems: 200 },
            where: [w],
          });
          return result.page;
        }),
      );

      // De-duplicate and count
      const seen = new Set<string>();
      for (const docs of results) {
        for (const doc of docs) {
          const docId = doc._id as string;
          seen.add(docId);
        }
      }
      return seen.size;
    }

    // Normal case
    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    });

    return result.page.length;
  },
};

interface UpdateArgs {
  betterAuthSchema: string;
  model: string;
  update: any;
  where: unknown[];
}

export const update = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    update: v.any(),
    where: v.array(v.any()),
  },
  handler: async (
    ctx: GenericMutationCtx<GenericDataModel>,
    { betterAuthSchema, model, update, where }: UpdateArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = where as WhereClause[];

    // Find the document to update
    const doc = await listOne(ctx, schema, authSchema, {
      model,
      where: parsedWhere,
    });

    if (!doc) {
      return null;
    }

    // Check unique fields before update
    await checkUniqueFields(ctx, schema, authSchema, model, update as any, doc);

    await ctx.db.patch(doc._id as GenericId<any>, update as any);
    return await ctx.db.get(doc._id as GenericId<any>);
  },
};

// Update many operation
export const updateMany = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    update: v.any(),
    where: v.array(v.any()),
  },
  handler: async (
    ctx: GenericMutationCtx<GenericDataModel>,
    { betterAuthSchema, model, update, where }: UpdateArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = where as WhereClause[];

    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    });

    // Check unique fields if updating multiple docs
    if (result.page.length > 1) {
      const uniqueFieldKeys = Object.keys(update as any).filter(
        (key) => authSchema[model]?.fields?.[key]?.unique,
      );
      if (uniqueFieldKeys.length > 0) {
        throw new Error(
          `Attempted to set unique fields in multiple documents in ${model} with the same value. Fields: ${uniqueFieldKeys.join(", ")}`,
        );
      }
    }

    // Update each document
    for (const doc of result.page) {
      await checkUniqueFields(
        ctx,
        schema,
        authSchema,
        model,
        update as any,
        doc,
      );
      await ctx.db.patch(doc._id as GenericId<any>, update as any);
    }

    return result.page.length;
  },
};

interface DeleteArgs {
  betterAuthSchema: string;
  model: string;
  where: unknown[];
}

export const deleteOne = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.array(v.any()),
  },
  handler: async (
    ctx: GenericMutationCtx<GenericDataModel>,
    { betterAuthSchema, model, where }: DeleteArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = where as WhereClause[];

    const doc = await listOne(ctx, schema, authSchema, {
      model,
      where: parsedWhere,
    });

    if (!doc) {
      return;
    }

    await ctx.db.delete(doc._id as GenericId<any>);
  },
};

// Delete many operation
export const deleteMany = {
  args: {
    betterAuthSchema: v.string(),
    model: v.string(),
    where: v.array(v.any()),
  },
  handler: async (
    ctx: GenericMutationCtx<GenericDataModel>,
    { betterAuthSchema, model, where }: DeleteArgs,
    schema: SchemaDefinition<any, any>,
  ) => {
    const authSchema = getBetterAuthSchema(betterAuthSchema);
    const parsedWhere = where as WhereClause[];

    const result = await paginate(ctx, schema, authSchema, {
      model,
      paginationOpts: { cursor: null, numItems: 200 },
      where: parsedWhere,
    });

    // Delete each document
    for (const doc of result.page) {
      await ctx.db.delete(doc._id as GenericId<any>);
    }

    return result.page.length;
  },
};
