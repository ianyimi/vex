import type {
  AuthFieldDefinition,
  AuthIndexDefinition,
  AuthTableDefinition,
} from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";
import { betterAuthTypeToValueType } from "../valueTypes";

/**
 * Converts a Record of better-auth DBFieldAttributes into Convex AuthFieldDefinitions.
 * Skips the "id" field since Convex auto-generates _id.
 */
function convertFields(
  fields: Record<string, DBFieldAttribute>,
): Record<string, AuthFieldDefinition> {
  const validators: Record<string, AuthFieldDefinition> = {};
  for (const [fieldName, attribute] of Object.entries(fields)) {
    if (fieldName === "id") continue;
    const validator = betterAuthTypeToValueType({
      type: attribute.type,
      required: attribute.required ?? false,
      references: attribute.references,
    });
    validators[fieldName] = { validator };
  }
  return validators;
}

/**
 * Extracts indexes from better-auth field attributes.
 * Fields with `index: true` or `unique: true` get a `by_<fieldName>` index.
 */
function extractIndexes(
  fields: Record<string, DBFieldAttribute>,
): AuthIndexDefinition[] {
  const indexes = [];
  for (const [fieldName, attribute] of Object.entries(fields)) {
    if (fieldName === "id") continue;
    if (attribute.index || attribute.unique) {
      indexes.push({ name: `by_${fieldName}`, fields: [fieldName] });
    }
  }
  return indexes;
}

/**
 * Extracts all auth tables from a BetterAuthOptions config using
 * better-auth's own `getAuthTables()` to get the full merged schema
 * (base fields + plugin fields + additionalFields for all tables).
 *
 * Returns a flat array of AuthTableDefinitions — all tables are treated
 * uniformly, including the user table. Core's schema generator merges
 * any user-defined collection configs on top of these.
 */
export function extractAuthTables(
  config: BetterAuthOptions,
): AuthTableDefinition[] {
  const authDBSchema = getAuthTables(config);
  const tables: AuthTableDefinition[] = [];

  for (const [tableSlug, tableDef] of Object.entries(authDBSchema)) {
    const slug = tableDef.modelName ?? tableSlug;
    const fields = convertFields(tableDef.fields);
    const indexes = extractIndexes(tableDef.fields);
    tables.push({
      slug,
      fields,
      ...(indexes.length > 0 ? { indexes } : {}),
    });
  }

  return tables;
}
