import {
  defineCollection,
  text,
  number,
  checkbox,
  date,
  json,
  array,
  relationship,
  VexAuthConfigError,
} from "@vexcms/core";
import type { VexCollection, VexField, ResolvedIndex } from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";

/**
 * Converts a Record of better-auth DBFieldAttributes into VexField records.
 * Skips the "id" field since Convex auto-generates _id.
 *
 * Required fields get appropriate defaultValues for processFieldValueTypeOptions:
 * - text/string → ""
 * - number → 0
 * - boolean → false
 * - date → 0 (epoch ms)
 */
function convertToVexFields(
  fields: Record<string, DBFieldAttribute>,
): Record<string, VexField> {
  const vexFields: Record<string, VexField> = {};

  for (const [fieldName, attribute] of Object.entries(fields)) {
    if (fieldName === "id") continue;

    const required = attribute.required ?? false;

    if (attribute.references) {
      // Relationship field — references another table
      vexFields[fieldName] = relationship({
        to: attribute.references.model,
        required,
      });
      continue;
    }

    if (Array.isArray(attribute.type)) {
      // Enum array → collapse to text (stored as string)
      vexFields[fieldName] = text({
        required,
        ...(required && { defaultValue: "" }),
      });
      continue;
    }

    switch (attribute.type) {
      case "string":
        vexFields[fieldName] = text({
          required,
          ...(required && { defaultValue: "" }),
        });
        break;
      case "number":
        vexFields[fieldName] = number({
          required,
          ...(required && { defaultValue: 0 }),
        });
        break;
      case "boolean":
        vexFields[fieldName] = checkbox({
          required,
          ...(required && { defaultValue: false }),
        });
        break;
      case "date":
        vexFields[fieldName] = date({
          required,
          ...(required && { defaultValue: 0 }),
        });
        break;
      case "json":
        vexFields[fieldName] = json({ required });
        break;
      case "string[]":
        vexFields[fieldName] = array({
          field: text(),
          required,
        });
        break;
      case "number[]":
        vexFields[fieldName] = array({
          field: number(),
          required,
        });
        break;
      default:
        throw new VexAuthConfigError(
          `Unknown better-auth field type: ${attribute.type}`,
        );
    }
  }

  return vexFields;
}

/**
 * Extracts indexes from better-auth field attributes.
 * Fields with `index: true` or `unique: true` get a `by_<fieldName>` index.
 */
function extractIndexes(
  fields: Record<string, DBFieldAttribute>,
): { name: string; fields: string[] }[] {
  const indexes: { name: string; fields: string[] }[] = [];
  for (const [fieldName, attribute] of Object.entries(fields)) {
    if (fieldName === "id") continue;
    if (attribute.index || attribute.unique) {
      indexes.push({ name: `by_${fieldName}`, fields: [fieldName] });
    }
  }
  return indexes;
}

/**
 * Extracts all auth collections from a BetterAuthOptions config using
 * better-auth's own `getAuthTables()` to get the full merged schema
 * (base fields + plugin fields + additionalFields for all tables).
 *
 * Returns a flat array of VexCollections — all tables are treated
 * uniformly, including the user table. Core's schema generator merges
 * any user-defined collection configs on top of these.
 */
export function extractAuthCollections(
  config: BetterAuthOptions,
): VexCollection[] {
  const authDBSchema = getAuthTables(config);
  const collections: VexCollection[] = [];

  for (const [tableSlug, tableDef] of Object.entries(authDBSchema)) {
    const slug = tableDef.modelName ?? tableSlug;
    const fields = convertToVexFields(tableDef.fields);
    const indexes = extractIndexes(tableDef.fields);

    collections.push(
      defineCollection(slug, {
        fields,
        ...(indexes.length > 0 ? { indexes } : {}),
      }),
    );
  }

  return collections;
}
