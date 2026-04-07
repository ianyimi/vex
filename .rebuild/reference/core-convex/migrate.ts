import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Generic backfill mutation called by the Vex CLI during auto-migration.
 * Patches existing documents that are missing a field with a default value.
 *
 * The CLI calls this in a loop with cursor pagination until `isDone` is true.
 */
export const backfillField = mutation({
  args: {
    table: v.string(),
    field: v.string(),
    value: v.any(),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { table, field, value, cursor, batchSize = 100 }) => {
    const results = await ctx.db
      .query(table as any)
      .paginate({ cursor: cursor ?? null, numItems: batchSize });

    let patched = 0;
    for (const doc of results.page) {
      if ((doc as any)[field] === undefined) {
        await ctx.db.patch(doc._id, { [field]: value } as any);
        patched++;
      }
    }

    return {
      patched,
      isDone: results.isDone,
      cursor: results.continueCursor,
    };
  },
});

/**
 * Generic field removal mutation called by the Vex CLI during auto-migration.
 * Unsets a field from existing documents so the new schema (without the field)
 * can be deployed without validation errors.
 *
 * The CLI calls this in a loop with cursor pagination until `isDone` is true.
 */
export const removeField = mutation({
  args: {
    table: v.string(),
    field: v.string(),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { table, field, cursor, batchSize = 100 }) => {
    const results = await ctx.db
      .query(table as any)
      .paginate({ cursor: cursor ?? null, numItems: batchSize });

    let patched = 0;
    for (const doc of results.page) {
      if ((doc as any)[field] !== undefined) {
        // Replace the entire document without the removed field
        const { _id, _creationTime, [field]: _removed, ...rest } = doc as any;
        await ctx.db.replace(_id, rest);
        patched++;
      }
    }

    return {
      patched,
      isDone: results.isDone,
      cursor: results.continueCursor,
    };
  },
});
