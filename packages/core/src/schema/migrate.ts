import type { VexConfig } from "../config/types";

/** A field that needs migration when its schema changes. */
export interface NeedsMigrationField {
  table: string;
  field: string;
  isOptional: boolean;
}

/** Metadata about a field that was removed from the config. */
export interface RemovedFieldInfo {
  table: string;
  field: string;
}

/** Diff result between two schema strings. */
export interface SchemaDiff {
  needsMigration: NeedsMigrationField[];
  removedFields: RemovedFieldInfo[];
}

/** A single field backfill operation produced by `planMigration`. */
export type MigrationOp = {
  table: string;
  field: string;
  defaultValue: unknown;
};

/** Returns a diff between two schema strings. Stub — not yet implemented. */
export function diffSchema(_previous: string, _next: string): SchemaDiff {
  return { needsMigration: [], removedFields: [] };
}

/** Returns a copy of the schema string with the given fields made optional. Stub — not yet implemented. */
export function makeFieldsOptional(
  schema: string,
  _fields: NeedsMigrationField[],
): string {
  return schema;
}

/** Returns a copy of the schema string with removed fields re-added as optional. Stub — not yet implemented. */
export function addRemovedFieldsAsOptional(
  schema: string,
  _removedFields: RemovedFieldInfo[],
): string {
  return schema;
}

/** Plans backfill operations from a schema diff. Stub — not yet implemented. */
export function planMigration(_props: {
  diff: SchemaDiff;
  config: VexConfig;
}): MigrationOp[] {
  return [];
}
