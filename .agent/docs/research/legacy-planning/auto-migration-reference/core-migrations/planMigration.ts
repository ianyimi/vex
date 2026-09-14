// =============================================================================
// MIGRATION PLAN — maps schema diff to concrete backfill operations
// =============================================================================

import type { SchemaDiff } from "./diffSchema";
import type { VexConfig } from "../types";
import type { VexField } from "../types/fields";

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
 * `defaultValue`.
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
  const tableFieldsMap = new Map<
    string,
    Record<string, VexField>
  >();

  for (const collection of config.collections) {
    tableFieldsMap.set(collection.slug, collection.fields);
  }

  for (const global of config.globals) {
    tableFieldsMap.set(global.slug, global.fields);
  }

  const ops: MigrationOp[] = [];

  for (const fieldInfo of diff.needsMigration) {
    const collectionFields = tableFieldsMap.get(fieldInfo.table);

    if (!collectionFields) {
      // Table not found in user collections — likely an auth-only table
      continue;
    }

    const field = collectionFields[fieldInfo.field] as VexField | undefined;
    if (!field) {
      // Field not found in collection config — likely an auth-managed field
      continue;
    }

    if (!field.required) {
      // Only migrate required fields — optional fields don't need backfill
      continue;
    }
    const defaultValue = (field as any).defaultValue;
    if (defaultValue === undefined) {
      // No defaultValue — skip (required fields enforce defaultValue at config time)
      continue;
    }

    ops.push({
      table: fieldInfo.table,
      field: fieldInfo.field,
      defaultValue,
    });
  }

  return ops;
}
