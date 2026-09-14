// =============================================================================
// SCHEMA DIFF — compares old vs new generated schema to detect migration needs
// =============================================================================

export interface SchemaFieldInfo {
  /** Table name (export const name). */
  table: string;
  /** Field name within the table. */
  field: string;
  /** Full value type string, e.g. "v.string()" or "v.optional(v.string())". */
  valueType: string;
  /** Whether the field is wrapped in v.optional(...). */
  isOptional: boolean;
}

export interface RemovedFieldInfo {
  /** Table name (export const name). */
  table: string;
  /** Field name that was removed. */
  field: string;
  /** The old value type string, e.g. "v.string()". */
  valueType: string;
  /** Whether the field was optional in the old schema. */
  wasOptional: boolean;
}

export interface SchemaDiff {
  /** Fields that changed from optional → required (need backfill). */
  newRequired: SchemaFieldInfo[];
  /** Fields that are entirely new and required (need backfill). */
  addedRequired: SchemaFieldInfo[];
  /** Fields that are entirely new and optional (may need backfill if they have a defaultValue). */
  addedOptional: SchemaFieldInfo[];
  /** Fields that existed in old schema but are absent in new schema. */
  removedFields: RemovedFieldInfo[];
  /** All fields that need migration. */
  needsMigration: SchemaFieldInfo[];
}

interface ParsedTable {
  name: string;
  fields: Map<string, { valueType: string; isOptional: boolean }>;
}

/**
 * Parse a generated vex schema string into a map of table → fields.
 *
 * Relies on the known output format of `generateVexSchema()`:
 * ```
 * export const <name> = defineTable({
 *   field1: v.string(),
 *   field2: v.optional(v.string()),
 * })
 * ```
 */
function parseTables(schema: string): Map<string, ParsedTable> {
  const tables = new Map<string, ParsedTable>();
  if (!schema.trim()) return tables;

  // Match each `export const <name> = defineTable({ ... })`
  const tableRegex =
    /export\s+const\s+(\w+)\s*=\s*defineTable\(\{([\s\S]*?)\}\)/g;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(schema)) !== null) {
    const name = match[1]!;
    const body = match[2]!;
    const fields = new Map<string, { valueType: string; isOptional: boolean }>();

    // Match field entries like `  fieldName: v.string(),` or `  fieldName: v.optional(v.string()),`
    // The value type can contain nested parens, so we use a greedy match up to the trailing comma
    const fieldRegex = /^\s+(\w+):\s+(v\..+?),?\s*$/gm;
    let fieldMatch: RegExpExecArray | null;
    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      const fieldName = fieldMatch[1]!;
      const valueType = fieldMatch[2]!.replace(/,\s*$/, "");
      const isOptional = valueType.startsWith("v.optional(");
      fields.set(fieldName, { valueType, isOptional });
    }

    tables.set(name, { name, fields });
  }

  return tables;
}

/**
 * Compare two generated schema strings and return fields that need migration.
 *
 * A field needs migration when:
 * 1. It exists in the new schema but not the old, and is NOT optional → `addedRequired`
 * 2. It exists in the new schema but not the old, and IS optional → `addedOptional`
 *    (planMigration decides whether to backfill based on defaultValue)
 * 3. It exists in both, was optional in old but is NOT optional in new → `newRequired`
 */
export function diffSchema(oldSchema: string, newSchema: string): SchemaDiff {
  const oldTables = parseTables(oldSchema);
  const newTables = parseTables(newSchema);

  const addedRequired: SchemaFieldInfo[] = [];
  const addedOptional: SchemaFieldInfo[] = [];
  const newRequired: SchemaFieldInfo[] = [];
  const removedFields: RemovedFieldInfo[] = [];

  for (const [tableName, newTable] of newTables) {
    const oldTable = oldTables.get(tableName);

    for (const [fieldName, newField] of newTable.fields) {
      const info: SchemaFieldInfo = {
        table: tableName,
        field: fieldName,
        valueType: newField.valueType,
        isOptional: newField.isOptional,
      };

      if (!oldTable) {
        // Entire table is new
        if (newField.isOptional) {
          addedOptional.push(info);
        } else {
          addedRequired.push(info);
        }
      } else {
        const oldField = oldTable.fields.get(fieldName);
        if (!oldField) {
          // Field is new
          if (newField.isOptional) {
            addedOptional.push(info);
          } else {
            addedRequired.push(info);
          }
        } else if (oldField.isOptional && !newField.isOptional) {
          // Field changed from optional → required
          newRequired.push(info);
        }
      }
    }
  }

  // Detect removed fields: fields that exist in old but not in new
  for (const [tableName, oldTable] of oldTables) {
    const newTable = newTables.get(tableName);
    if (!newTable) continue; // Entire table removed — not our concern here

    for (const [fieldName, oldField] of oldTable.fields) {
      if (!newTable.fields.has(fieldName)) {
        removedFields.push({
          table: tableName,
          field: fieldName,
          valueType: oldField.valueType,
          wasOptional: oldField.isOptional,
        });
      }
    }
  }

  return {
    addedRequired,
    addedOptional,
    newRequired,
    removedFields,
    needsMigration: [...addedRequired, ...addedOptional, ...newRequired],
  };
}

/**
 * Rewrite specific fields in a schema string to be `v.optional(...)`.
 *
 * Used to produce an interim schema where new required fields are temporarily
 * optional, allowing Convex to accept the schema before documents are backfilled.
 */
export function makeFieldsOptional(
  schema: string,
  fields: SchemaFieldInfo[],
): string {
  let result = schema;

  for (const field of fields) {
    if (field.isOptional) continue; // Already optional

    // Match `  <fieldName>: <valueType>,` within the schema and wrap in v.optional(...)
    // The field line looks like: `  fieldName: v.string(),`
    const escaped = field.field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(\\s+${escaped}:\\s+)(${field.valueType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(,?)`,
    );
    result = result.replace(pattern, `$1v.optional($2)$3`);
  }

  return result;
}

/**
 * Re-insert removed fields into a schema string as `v.optional(...)`.
 *
 * Used to produce an interim schema that still accepts documents with the
 * removed field, so we can strip the field from documents before deploying
 * the final schema without the field.
 */
export function addRemovedFieldsAsOptional(
  schema: string,
  fields: RemovedFieldInfo[],
): string {
  let result = schema;

  // Group removed fields by table for efficient insertion
  const byTable = new Map<string, RemovedFieldInfo[]>();
  for (const f of fields) {
    const list = byTable.get(f.table) ?? [];
    list.push(f);
    byTable.set(f.table, list);
  }

  for (const [tableName, tableFields] of byTable) {
    // Find the closing `})` of the defineTable for this table
    const tablePattern = new RegExp(
      `(export\\s+const\\s+${tableName}\\s*=\\s*defineTable\\(\\{[\\s\\S]*?)(\\}\\))`,
    );
    const tableMatch = result.match(tablePattern);
    if (!tableMatch) continue;

    // Build the extra field lines
    const extraLines = tableFields.map((f) => {
      const optionalType = f.wasOptional
        ? f.valueType
        : `v.optional(${f.valueType})`;
      return `  ${f.field}: ${optionalType},`;
    });

    // Insert the extra fields before the closing `})`
    result = result.replace(
      tablePattern,
      `$1${extraLines.join("\n")}\n$2`,
    );
  }

  return result;
}
