import { defineTable, type TableDefinition } from "convex/server";
import type { GenericValidator, VObject } from "convex/values";

type ExtractFields<T> =
  T extends TableDefinition<VObject<any, infer F>> ? F : never;

type ForbidExistingKeys<Existing, New> = {
  [K in keyof New]: K extends keyof Existing ? never : New[K];
};

/**
 * Extends a vex-generated table definition with additional fields,
 * preserving all indexes from the original table.
 *
 * Use this in your `convex/schema.ts` when you need to add custom
 * fields to a vex-managed table (e.g., adding a `body` field to posts).
 *
 * @param props.table - The table definition from vex.schema.ts
 * @param props.additionalFields - Additional Convex validator fields to add.
 *   Keys that already exist on the table will cause a type error.
 * @returns A new TableDefinition with merged fields and original indexes.
 *          You can chain additional `.index()` calls on the result.
 *
 * @example
 * ```ts
 * import { posts } from "./vex.schema";
 * import { extendTable } from "@vexcms/core";
 * import { v } from "convex/values";
 *
 * export default defineSchema({
 *   posts: extendTable({
 *     table: posts,
 *     additionalFields: { body: v.optional(v.string()) },
 *   }).index("by_status", ["status"]),
 * });
 * ```
 */
export function extendTable<
  T extends TableDefinition<VObject<any, any>>,
  A extends Record<string, GenericValidator> = {},
>(props: {
  table: T;
  additionalFields?: A & ForbidExistingKeys<ExtractFields<T>, A>;
}): TableDefinition {
  const { validator } = props.table;

  let extended = defineTable({
    ...validator.fields,
    ...props.additionalFields,
  });

  // Use the public " indexes"() method (note: the method name has a leading space)
  for (const idx of props.table[" indexes"]()) {
    extended = extended.index(
      idx.indexDescriptor,
      idx.fields as [string, ...string[]],
    );
  }

  // searchIndexes and vectorIndexes are private — access via any cast
  const source = props.table as any;

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
