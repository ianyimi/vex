import {
  defineCollection,
  text,
  number,
  checkbox,
  select,
  date,
  json,
  array,
  relationship,
  VexAuthConfigError,
} from "@vexcms/core";
import type {
  VexCollection,
  VexField,
  FieldAdminConfig,
} from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";

/** Fields that are editable per auth table. Everything else is read-only. */
const EDITABLE_FIELDS: Record<string, Set<string>> = {
  user: new Set(["name", "image"]),
};

/** Fields that should be hidden from the admin panel (sensitive data). */
const HIDDEN_FIELDS: Record<string, Set<string>> = {
  session: new Set(["token"]),
  account: new Set(["accessToken", "refreshToken", "idToken"]),
  verification: new Set(["value"]),
};

/** Labels for auth collections. */
const COLLECTION_LABELS: Record<string, { singular: string; plural: string }> = {
  user: { singular: "User", plural: "Users" },
  session: { singular: "Session", plural: "Sessions" },
  account: { singular: "Account", plural: "Accounts" },
  verification: { singular: "Verification", plural: "Verifications" },
};

/** Default columns to show in the list view per auth table. */
const DEFAULT_COLUMNS: Record<string, string[]> = {
  user: ["_id", "name", "email", "createdAt"],
  session: ["_id", "userId", "expiresAt", "createdAt"],
  account: ["_id", "providerId", "accountId", "userId"],
  verification: ["_id", "identifier", "expiresAt", "createdAt"],
};

/**
 * Resolves the admin config for an auth field based on the table and field name.
 * - Fields in EDITABLE_FIELDS are editable (no readOnly)
 * - Fields in HIDDEN_FIELDS are hidden from the admin panel
 * - All other fields are read-only
 */
function resolveFieldAdminConfig(
  tableSlug: string,
  fieldName: string,
): FieldAdminConfig | undefined {
  const hidden = HIDDEN_FIELDS[tableSlug]?.has(fieldName);
  if (hidden) return { hidden: true };

  const editable = EDITABLE_FIELDS[tableSlug]?.has(fieldName);
  if (!editable) return { readOnly: true };

  return undefined;
}

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
  tableSlug: string,
  fields: Record<string, DBFieldAttribute>,
): Record<string, VexField> {
  const vexFields: Record<string, VexField> = {};

  for (const [fieldName, attribute] of Object.entries(fields)) {
    if (fieldName === "id") continue;

    const required = attribute.required ?? false;
    const admin = resolveFieldAdminConfig(tableSlug, fieldName);

    if (attribute.references) {
      // Relationship field — references another table
      vexFields[fieldName] = relationship({
        to: attribute.references.model,
        required,
        admin,
      });
      continue;
    }

    if (Array.isArray(attribute.type)) {
      // Enum array → select field with the enum values as options
      vexFields[fieldName] = select({
        options: attribute.type.map((val: string) => ({
          label: val.charAt(0).toUpperCase() + val.slice(1),
          value: val,
        })),
        required,
        ...(required && { defaultValue: attribute.type[0] }),
        admin,
      });
      continue;
    }

    switch (attribute.type) {
      case "string":
        vexFields[fieldName] = text({
          required,
          ...(required && { defaultValue: "" }),
          admin,
        });
        break;
      case "number":
        vexFields[fieldName] = number({
          required,
          ...(required && { defaultValue: 0 }),
          admin,
        });
        break;
      case "boolean":
        vexFields[fieldName] = checkbox({
          required,
          ...(required && { defaultValue: false }),
          admin,
        });
        break;
      case "date":
        vexFields[fieldName] = date({
          required,
          ...(required && { defaultValue: 0 }),
          admin,
        });
        break;
      case "json":
        vexFields[fieldName] = json({ required, admin });
        break;
      case "string[]":
        vexFields[fieldName] = array({
          field: text(),
          required,
          admin,
        });
        break;
      case "number[]":
        vexFields[fieldName] = array({
          field: number(),
          required,
          admin,
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
 * Each collection is configured with:
 * - Appropriate read-only / hidden / editable admin config per field
 * - Default "Auth" sidebar group
 * - Human-readable labels
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
    const fields = convertToVexFields(slug, tableDef.fields);
    const indexes = extractIndexes(tableDef.fields);
    const labels = COLLECTION_LABELS[slug];

    const defaultColumns = DEFAULT_COLUMNS[slug];

    collections.push(
      defineCollection(slug, {
        fields,
        ...(labels ? { labels } : {}),
        ...(indexes.length > 0 ? { indexes } : {}),
        admin: {
          group: "Auth",
          useAsTitle: "_id",
          ...(defaultColumns ? { defaultColumns } : {}),
        },
      }),
    );
  }

  return collections;
}
