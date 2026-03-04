// =============================================================================
// MIGRATION PLAN — maps schema diff to concrete backfill operations
// =============================================================================

import type { SchemaDiff } from "./diffSchema";
import type { VexConfig } from "../types";
import type { BaseFieldMeta } from "../types/fields";

export interface MigrationOp {
  /** The table name (as exported in the schema). */
  table: string;
  /** The field name to backfill. */
  field: string;
  /** The default value to set on existing documents. */
  defaultValue: unknown;
}

/**
 * Given a schema diff and the full Vex config, produce a list of
 * migration operations — one per field that needs backfilling.
 *
 * Fields are matched by looking up the collection whose table name
 * (or slug) matches the diff's table, then finding the field's
 * `_meta.defaultValue`.
 *
 * Auth-only fields (fields that come from the auth adapter, not from
 * user-defined collections) are skipped — auth manages its own data.
 */
export function planMigration(props: {
  diff: SchemaDiff;
  config: VexConfig;
}): MigrationOp[] {
  const { diff, config } = props;

  if (diff.needsMigration.length === 0) return [];

  // Build a lookup: table export name → collection fields
  // The schema generator uses `collection.slug` as the table export name
  const tableFieldsMap = new Map<
    string,
    Record<string, { _meta: BaseFieldMeta }>
  >();

  for (const collection of config.collections) {
    tableFieldsMap.set(collection.slug, collection.config.fields);
  }

  for (const global of config.globals) {
    tableFieldsMap.set(global.slug, global.config.fields);
  }

  const ops: MigrationOp[] = [];

  for (const fieldInfo of diff.needsMigration) {
    const collectionFields = tableFieldsMap.get(fieldInfo.table);

    if (!collectionFields) {
      // Table not found in user collections — likely an auth-only table
      continue;
    }

    const field = collectionFields[fieldInfo.field];
    if (!field) {
      // Field not found in collection config — likely an auth-managed field
      continue;
    }

    const meta = field._meta as BaseFieldMeta & { defaultValue?: unknown };
    if (!meta.required) {
      // Only migrate required fields — optional fields don't need backfill
      continue;
    }
    if (meta.defaultValue === undefined) {
      // No defaultValue — skip (required fields enforce defaultValue at config time)
      continue;
    }

    ops.push({
      table: fieldInfo.table,
      field: fieldInfo.field,
      defaultValue: meta.defaultValue,
    });
  }

  return ops;
}
