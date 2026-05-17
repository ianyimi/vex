import type {
  AuthCollectionConfig,
  BaseFieldInput,
  CollectionSlug,
  FieldAdminConfigInput,
  VexAuthAdapter,
} from "@vexcms/core";
import {
  AuthCollectionMeta,
  checkbox,
  date,
  defineCollection,
  number,
  select,
  text,
} from "@vexcms/core";
import type { BetterAuthOptions, DBFieldAttribute } from "better-auth";
import { getAuthTables } from "better-auth/db";
import { AuthFieldMeta } from "../../core/src/auth/mergeCollections";

/**
 * Options for `betterAuthAdapter()`.
 *
 * Accepts the same `BetterAuthOptions` object you pass to `betterAuth()`
 * on the server. Only schema-affecting properties (modelNames,
 * additionalFields, plugins) are read. Runtime options (database, secret,
 * baseURL) are ignored.
 */
export interface BetterAuthAdapterOptions {
  config: BetterAuthOptions;
}

const AUTH_COLLECTION_TYPES = {
  user: "user",
  session: "session",
  account: "account",
  verification: "verification",
} as const;

/** Fields on the user table that end-users are allowed to edit. */
const EDITABLE_FIELDS = new Set([
  "name",
  "email",
  "image",
  "role",
  "banned",
  "banReason",
  "banExpires",
]);

/** Fields that should be hidden in the admin UI for security. */
const HIDDEN_FIELDS = new Set([
  "hashedPassword",
  "password",
  "twoFactorSecret",
  "twoFactorBackupCodes",
  "token",
  "secret",
  "code",
]);

/**
 * Creates a Vex auth adapter from a Better Auth configuration.
 *
 * Introspects Better Auth's full merged schema (base fields + plugin fields
 * + additionalFields) via `getAuthTables()` and converts each table into a
 * standard Vex `CollectionConfig` using Vex field builders.
 *
 * Mappings from Better Auth `DBFieldAttribute` to Vex fields:
 * - `type` → Vex field type (`string`→text, `boolean`→checkbox, `number`→number,
 *   `date`/`timestamp`→date, `json`→text fallback, array→select)
 * - `required` → field `required`
 * - `defaultValue` → field `defaultValue`
 * - `unique`/`index` → field `index` (index name: `by_<field>_unique` or `by_<field>`)
 * - `references` → `relationship` field
 * - System fields get `admin.readOnly: true` and `meta.locked: true`
 * - Sensitive fields get `admin.hidden: true`
 *
 * @param props — Adapter options; pass your Better Auth config object wrapped
 *   in `{ config: authOptions }`. Optional — when omitted, uses default
 *   Better Auth tables with no plugins or additional fields.
 * @returns A `VexAuthAdapter` ready for `defineConfig({ auth: … })`.
 *
 * @example
 * ```ts
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 * import { authOptions } from "~/auth/server";
 *
 * export default defineConfig({
 *   auth: betterAuthAdapter({ config: authOptions }),
 *   collections: [posts],
 * });
 * ```
 */
export function betterAuthAdapter(
  props?: BetterAuthAdapterOptions,
): VexAuthAdapter {
  const tables = getAuthTables(props?.config ?? {});
  const collections: AuthCollectionConfig[] = [];
  const authCollections = [
    { type: AUTH_COLLECTION_TYPES.user, slug: props?.config?.user?.modelName },
    {
      type: AUTH_COLLECTION_TYPES.session,
      slug: props?.config?.session?.modelName,
    },
    {
      type: AUTH_COLLECTION_TYPES.account,
      slug: props?.config?.account?.modelName,
    },
    {
      type: AUTH_COLLECTION_TYPES.verification,
      slug: props?.config?.verification?.modelName,
    },
  ] as const;

  for (const [tableKey, tableDef] of Object.entries(tables)) {
    const slug = tableDef.modelName ?? tableKey;
    const fields: AuthCollectionConfig["fields"] = {};

    addAuthCollectionFields({
      attributes: tableDef.fields,
      slug,
      fields,
      config: props?.config,
      extractId: true,
    });

    const authCollectionType = authCollections.find(
      (ac) => ac.slug === slug,
    )?.type;
    if (authCollectionType) {
      switch (authCollectionType) {
        case "user": {
          const additionalFields = props?.config?.user?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "session": {
          const additionalFields = props?.config?.session?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "account": {
          const additionalFields = props?.config?.account?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        case "verification": {
          const additionalFields =
            props?.config?.verification?.additionalFields;
          addAuthCollectionFields({
            attributes: additionalFields,
            slug,
            fields,
            config: props?.config,
          });
          break;
        }
        default:
          break;
      }
    }

    const isProtected = slug !== "user" && slug !== "users";

    collections.push(
      defineCollection<AuthFieldMeta, AuthCollectionMeta>({
        slug: slug as CollectionSlug,
        fields,
        meta: isProtected ? { protected: true } : undefined,
      }),
    );
  }

  const userSlug = tables.user?.modelName ?? "user";
  return {
    name: "better-auth",
    collections,
    userCollection: userSlug as CollectionSlug,
  };
}

/**
 * Converts a set of Better Auth field attributes into Vex field definitions
 * and appends them to the given collection `fields` map.
 *
 * Iterates over `attributes`, calls {@link betterAuthAttrToVexField} for each
 * entry, and mutates `props.fields` in place. When `extractId` is `true`,
 * the `id` field is skipped because Convex auto-generates `_id`.
 *
 * @param props — Field extraction options.
 * @param props.attributes — Better Auth `DBFieldAttribute` map to convert.
 * @param props.slug — Collection slug (used for relationship target resolution).
 * @param props.fields — Mutable Vex collection fields object to populate.
 * @param props.config — Better Auth options (for model name / additional fields lookups).
 * @param props.extractId — When `true`, skips the `id` field.
 *
 * @internal
 */
export function addAuthCollectionFields(props: {
  attributes?: Record<string, DBFieldAttribute>;
  slug: string;
  fields: AuthCollectionConfig["fields"];
  config?: BetterAuthOptions;
  extractId?: boolean;
}) {
  if (!props.attributes) return;
  for (const [fieldName, attr] of Object.entries(props.attributes)) {
    if (props.extractId === true && fieldName === "id") continue;
    const field = betterAuthAttrToVexField(
      fieldName,
      attr,
      props.slug,
      props?.config,
    );
    if (field) props.fields[fieldName] = field;
  }
}

/**
 * Maps a single Better Auth `DBFieldAttribute` to a Vex field builder call.
 *
 * Handles all Better Auth scalar types: `string`, `boolean`, `number`, `date`,
 * `timestamp`, `json`, and enum arrays. Maps overlapping properties
 * (`required`, `defaultValue`, `unique`/`index`, `references`) to their
 * Vex equivalents. Sets `admin.readOnly` and `meta.locked` on system
 * fields, and `admin.hidden` on sensitive fields.
 *
 * @param fieldName — The field name from Better Auth.
 * @param attr — The Better Auth field attribute.
 * @param tableSlug — The collection slug (for relationship targets).
 * @param authOptions -- The betterAuth options
 * @returns A Vex field instance, or `null` if the type is unsupported.
 *
 * @internal
 */
function betterAuthAttrToVexField(
  fieldName: string,
  attr: DBFieldAttribute,
  tableSlug: string,
  authOptions?: BetterAuthOptions,
) {
  // Skip id — Convex auto-generates _id
  if (fieldName === "id") return null;

  const isUserTable =
    tableSlug === authOptions?.user?.modelName ||
    tableSlug === "user" ||
    tableSlug === "users";
  const isEditable = isUserTable && EDITABLE_FIELDS.has(fieldName);
  const isHidden = HIDDEN_FIELDS.has(fieldName);

  const admin: FieldAdminConfigInput = {};
  if (!isEditable) admin.readOnly = true;
  if (isHidden) admin.hidden = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseOptions: { defaultValue: any } & BaseFieldInput<AuthFieldMeta> = {
    defaultValue: undefined,
  };
  if (Object.keys(admin).length > 0) baseOptions.admin = admin;
  if (!isEditable) baseOptions.meta = { locked: true };
  if (attr.required) baseOptions.required = attr.required;
  if (
    attr.defaultValue !== undefined &&
    typeof attr.defaultValue !== "function"
  ) {
    baseOptions.defaultValue = attr.defaultValue;
  }
  if (attr.unique || attr.index) {
    baseOptions.index = `by_${fieldName}`;
  }

  if (attr.references) {
    return text(baseOptions);
  }

  if (Array.isArray(attr.type)) {
    return select({
      options: attr.type.map((v: string) => ({ value: v, label: v })),
      ...baseOptions,
    });
  }

  switch (attr.type) {
    case "string":
      return text(baseOptions);
    case "boolean":
      return checkbox(baseOptions);
    case "number":
      return number(baseOptions);
    case "date":
      return date(baseOptions);
    case "json":
      // Fall back to text until a dedicated json field type is wired
      // TODO: create json field
      return text(baseOptions);
    default:
      // Unknown type — skip rather than crash
      return null;
  }
}
