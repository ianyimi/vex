/**
 * Extends a vex-generated table definition with additional fields,
 * preserving all indexes from the original table.
 *
 * Use this in your `convex/schema.ts` when you need to add custom
 * fields to a vex-managed table (e.g., adding a `body` field to posts).
 *
 * @param props.table - The table definition from vex.schema.ts
 * @param props.additionalFields - Additional Convex validator fields to add
 * @param props.defineTable - The `defineTable` function from "convex/server"
 * @returns A new TableDefinition with merged fields and original indexes.
 *          You can chain additional `.index()` calls on the result.
 *
 * @example
 * ```ts
 * import { posts } from "./vex.schema";
 * import { extendTable } from "@vexcms/core";
 * import { defineTable } from "convex/server";
 * import { v } from "convex/values";
 *
 * export default defineSchema({
 *   posts: extendTable({
 *     table: posts,
 *     additionalFields: { body: v.optional(v.string()) },
 *     defineTable,
 *   }).index("by_status", ["status"]),
 * });
 * ```
 */
export function extendTable(props: {
  table: any;
  additionalFields?: Record<string, any>;
  defineTable: (...args: any[]) => any;
}): any {
  // Access internal index arrays via any cast — these properties are
  // accessible at runtime but typed as private in Convex's declarations.
  const source = props.table as any;

  let extended = props.defineTable({
    ...source.validator.fields,
    ...props.additionalFields,
  });

  for (const idx of source.indexes ?? []) {
    extended = extended.index(idx.indexDescriptor, idx.fields);
  }

  for (const idx of source.searchIndexes ?? []) {
    extended = extended.searchIndex(idx.indexDescriptor, {
      searchField: idx.searchField,
      filterFields: idx.filterFields,
    } as any);
  }

  for (const idx of source.vectorIndexes ?? []) {
    extended = extended.vectorIndex(idx.indexDescriptor, {
      vectorField: idx.vectorField,
      dimensions: idx.dimensions,
      filterFields: idx.filterFields,
    } as any);
  }

  return extended;
}
