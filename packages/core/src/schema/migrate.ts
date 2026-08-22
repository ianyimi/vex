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

/**
 * Computes a diff between two schema strings, identifying fields that now
 * need migration and fields that were removed. Stub — always returns an
 * empty diff; schema-string diffing is not yet implemented.
 *
 * @param _previous - The prior schema source string. Currently unused;
 *   placeholder for the not-yet-implemented diffing logic.
 * @param _next - The new schema source string. Currently unused;
 *   placeholder for the not-yet-implemented diffing logic.
 * @returns An empty {@link SchemaDiff} until diffing is implemented.
 */
export function diffSchema(_previous: string, _next: string): SchemaDiff {
  return { needsMigration: [], removedFields: [] };
}

/**
 * Returns a copy of the schema string with the given fields made optional.
 * Stub — currently returns `schema` unchanged; the rewrite is not yet
 * implemented.
 *
 * @param schema - The schema source string to rewrite.
 * @param _fields - The fields that should be made optional. Currently
 *   unused; placeholder for the not-yet-implemented rewrite.
 * @returns The schema string, unchanged until this is implemented.
 */
export function makeFieldsOptional(
  schema: string,
  _fields: NeedsMigrationField[],
): string {
  return schema;
}

/**
 * Returns a copy of the schema string with previously removed fields
 * re-added as optional. Stub — currently returns `schema` unchanged; the
 * rewrite is not yet implemented.
 *
 * @param schema - The schema source string to rewrite.
 * @param _removedFields - The fields that were removed from the config and
 *   should be re-added as optional. Currently unused; placeholder for the
 *   not-yet-implemented rewrite.
 * @returns The schema string, unchanged until this is implemented.
 */
export function addRemovedFieldsAsOptional(
  schema: string,
  _removedFields: RemovedFieldInfo[],
): string {
  return schema;
}

/**
 * Plans backfill operations from a schema diff. Stub — always returns an
 * empty array; migration planning is not yet implemented.
 *
 * @param _props - The schema diff and resolved config to plan backfills
 *   from. Currently unused; placeholder for the not-yet-implemented
 *   planning logic.
 * @returns An empty list of {@link MigrationOp}s until planning is
 *   implemented.
 */
export function planMigration(_props: {
  diff: SchemaDiff;
  config: VexConfig;
}): MigrationOp[] {
  return [];
}
