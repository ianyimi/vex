import type {
  AuthCollectionConfig,
  AuthFieldMeta,
  BaseFieldInput,
  CollectionSlug,
  FieldAdminConfigInput,
  VexAuthAdapter,
} from "@vexcms/core";
import {
  array,
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
import type { VexResourceSlug } from "@vexcms/core";

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
 * Candidate columns for the user collection's default admin list view, in
 * display order — filtered down to whichever actually exist on the merged
 * field set (`fields`) before use, so a custom `modelName`/plugin set with
 * no `role`/`banned` field doesn't request a column nothing populates.
 * `role` covers Better Auth's own built-in field name; `roles` covers the
 * `admin` plugin's additional field of the same purpose — at most one of
 * the two exists on any given schema.
 */
const USER_COLUMN_CANDIDATES = ["name", "email", "roles", "role", "banned", "createdAt"];

/**
 * Lists the user table's field names an end user can set directly through
 * Better Auth's public endpoints (sign-up, update-user).
 *
 * @param props.fields - The merged `DBFieldAttribute` map for the user
 *   table (`tables.user.fields`). `getAuthTables` already spreads
 *   `config.user.additionalFields` into this map, so no separate merge is
 *   needed here.
 * @returns Field names whose `input` is not explicitly `false`.
 */
function getClientWritableUserFields(props: {
  fields: Record<string, DBFieldAttribute>;
}): readonly string[] {
  return Object.entries(props.fields)
    .filter(([, attr]) => attr.input !== false)
    .map(([name]) => name);
}

/**
 * Indexes `@convex-dev/better-auth`'s own schema generator adds by hand on
 * top of what a table's `unique`/`index` field attributes already produce,
 * keyed by Better Auth table key — the set from its
 * `dist/client/create-schema.js:13-27` (`indexFields`, not public API).
 *
 * Each entry lists its equality fields first, alphabetically, then at most
 * one range or sort field — the order `convex/utils.ts`'s `findIndex` builds
 * its prefix in. `session` is `[userId, expiresAt]` (not upstream's sorted
 * `[expiresAt, userId]`) because Better Auth queries sessions by `userId`
 * equality plus an `expiresAt` range.
 */
const BETTER_AUTH_CORE_TABLE_INDEXES: Readonly<Record<string, readonly (string | readonly string[])[]>> = {
  account: [
    "accountId",
    ["accountId", "providerId"],
    ["accountId", "providerId", "userId"],
    ["providerId", "userId"],
  ],
  rateLimit: ["key", "lastRequest"],
  session: ["expiresAt", ["userId", "expiresAt"]],
  verification: ["expiresAt", "identifier"],
  user: [["email", "name"], "name", "userId"],
};

/**
 * Builds the `indexes` a Better Auth table needs beyond what its fields'
 * own `index`/`unique` attributes already produce as field-level indexes
 * (`by_<field>`, set in {@link betterAuthAttrToVexField}).
 *
 * Combines {@link BETTER_AUTH_CORE_TABLE_INDEXES}'s entry for `tableKey`
 * (core tables, kept in their declared equality-then-range order) with
 * `tableDef.indexes` (plugin-declared uniqueness indexes, e.g.
 * `deviceAuthorization`'s `deviceCode`/`userCode` and `oauthProvider`'s
 * `oauthClientResource` pair — equality-only, so their fields are sorted
 * alphabetically, the order `findIndex` sorts equality fields in). A
 * single-field candidate is dropped when that field already has a
 * field-level index of its own, and any candidate naming a field absent from
 * `fields` (a plugin option that drops the field, or a custom
 * `fieldName`/schema override) is dropped entirely.
 *
 * @param props - Input props.
 * @param props.tableKey - The table's key in `getAuthTables()`'s result
 *   (not necessarily its `modelName`).
 * @param props.tableDef - The table's resolved schema.
 * @param props.fields - The Vex fields already built for this table, used
 *   to drop both unknown-field candidates and field-level duplicates.
 * @returns Deduplicated `indexes` entries for `defineCollection`
 *   (`by_<f1>_<f2>...`, named in field order).
 */
function buildAdapterTableIndexes(props: {
  tableKey: string;
  tableDef: { fields: Record<string, DBFieldAttribute>; indexes?: readonly { fields: readonly string[] }[] };
  fields: AuthCollectionConfig["fields"];
}): { name: string; fields: string[] }[] {
  const { tableKey, tableDef, fields } = props;
  const candidates: string[][] = [
    ...(BETTER_AUTH_CORE_TABLE_INDEXES[tableKey] ?? []).map((entry) =>
      typeof entry === "string"
        ? [tableDef.fields[entry]?.fieldName ?? entry]
        : entry.map((f) => tableDef.fields[f]?.fieldName ?? f),
    ),
    ...(tableDef.indexes ?? []).map((index) =>
      index.fields.map((f) => tableDef.fields[f]?.fieldName ?? f).sort(),
    ),
  ];

  const resolved = new Map<string, { name: string; fields: string[] }>();
  for (const candidate of candidates) {
    if (!candidate.every((field) => field in fields)) continue;
    const singleField = candidate.length === 1 ? fields[candidate[0]!] : undefined;
    if (singleField !== undefined && "index" in singleField && singleField.index !== undefined) continue;
    const name = `by_${candidate.join("_")}`;
    if (!resolved.has(name)) resolved.set(name, { name, fields: candidate });
  }
  return [...resolved.values()];
}

/**
 * Creates a Vex auth adapter from a Better Auth configuration.
 *
 * Introspects Better Auth's full merged schema (base fields + plugin fields
 * + additionalFields) via `getAuthTables()` and converts each table into a
 * standard Vex `CollectionConfig` using Vex field builders. Server-only: pass
 * the resulting `VexAuthAdapter` to `defineServerConfig({ server: { auth: { adapter } } })`,
 * which also uses its `collections` as the source of truth to verify that the client config's
 * `authCollections` — built by {@link better-auth/src!betterAuthCollections} from
 * `@vexcms/better-auth/client` — have not drifted, throwing `VexAuthConfigError` naming the
 * first divergence.
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
 * @returns A `VexAuthAdapter` ready for `defineServerConfig({ server: { auth: { adapter } } })`.
 *
 * @example
 * ```ts
 * // vex.config.server.ts
 * import { betterAuthAdapter } from "@vexcms/better-auth";
 * import { defineServerConfig } from "@vexcms/core";
 *
 * import { authOptions } from "~/auth/server";
 *
 * import vexConfig from "./vex.config";
 *
 * export default defineServerConfig({
 *   config: vexConfig,
 *   server: {
 *     auth: { adapter: betterAuthAdapter({ config: authOptions }) },
 *   },
 * });
 * ```
 */
export function betterAuthAdapter(props?: BetterAuthAdapterOptions): VexAuthAdapter {
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

    const authCollectionType = authCollections.find((ac) => ac.slug === slug)?.type;
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
          const additionalFields = props?.config?.verification?.additionalFields;
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
    // Same heuristic as `betterAuthAttrToVexField`'s own `isUserTable`: the
    // user collection is identified by its real (possibly custom) model
    // name, not just the literal "user"/"users" slugs `isProtected` checks.
    const isUserCollection =
      slug === props?.config?.user?.modelName || slug === "user" || slug === "users";

    // A short, stable admin list for the user collection only — every other
    // auth table (session/account/verification) keeps `defineCollection`'s
    // own default (every non-hidden field). Filtered to fields that actually
    // exist so a custom `modelName`/schema with no `role`/`banned` plugin
    // fields doesn't request a column nothing populates.
    const userColumns = USER_COLUMN_CANDIDATES.filter((candidate) => candidate in fields);

    const indexes = buildAdapterTableIndexes({ tableKey, tableDef, fields });

    collections.push(
      defineCollection<AuthFieldMeta, AuthCollectionMeta>({
        slug: slug as CollectionSlug,
        fields,
        // Every auth collection's rows arrive from Better Auth's own
        // endpoints (sign-up, session creation, OAuth linking, email
        // verification) — never an admin-authored create form — so every
        // one of them hides "+ New"/`?createNew=true` and rejects
        // `vex:create`, not just the user collection (the admin DOES render
        // `protected` collections; `protected` only blocks a PROJECT'S OWN
        // collection from reusing the slug, see `mergeAuthCollections`).
        disableCreate: true,
        admin: {
          icon: "Lock",
          ...(isUserCollection && userColumns.length > 0 ? { view: { columns: userColumns } } : {}),
        },
        meta: isProtected ? { protected: true } : undefined,
        ...(indexes.length > 0 ? { indexes } : {}),
      }),
    );
  }

  const userSlug = tables.user?.modelName ?? "user";
  return {
    name: "better-auth",
    collections,
    userCollection: userSlug as CollectionSlug,
    clientWritableUserFields: tables.user
      ? getClientWritableUserFields({ fields: tables.user.fields })
      : undefined,
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
    const field = betterAuthAttrToVexField(fieldName, attr, props.slug, props?.config);
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
    tableSlug === authOptions?.user?.modelName || tableSlug === "user" || tableSlug === "users";
  const isEditable = isUserTable && EDITABLE_FIELDS.has(fieldName);
  const isHidden = HIDDEN_FIELDS.has(fieldName);

  const admin: FieldAdminConfigInput = {};
  if (!isEditable) admin.readOnly = true;
  if (isHidden) admin.hidden = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseOptions: { defaultValue: any } & BaseFieldInput<VexResourceSlug, never, AuthFieldMeta> = {
    defaultValue: undefined,
  };
  if (Object.keys(admin).length > 0) baseOptions.admin = admin;
  if (!isEditable) baseOptions.meta = { locked: true };
  if (attr.required) baseOptions.required = attr.required;
  if (attr.defaultValue !== undefined && typeof attr.defaultValue !== "function") {
    baseOptions.defaultValue = attr.defaultValue;
  }
  if (attr.unique || attr.index) {
    baseOptions.index = `by_${fieldName}`;
  }

  if (attr.references) {
    return text<VexResourceSlug, never, AuthFieldMeta>(baseOptions);
  }

  if (Array.isArray(attr.type)) {
    return select({
      options: attr.type.map((v: string) => ({ value: v, label: v })),
      ...baseOptions,
    });
  }

  switch (attr.type) {
    case "string":
      return text<VexResourceSlug, never, AuthFieldMeta>(baseOptions);
    case "string[]":
      return array({
        ...baseOptions,
        items: text<VexResourceSlug, never, AuthFieldMeta>(baseOptions),
      });
    case "boolean":
      return checkbox(baseOptions);
    case "number":
      return number<VexResourceSlug, never, AuthFieldMeta>(baseOptions);
    case "number[]":
      return array({
        ...baseOptions,
        items: number<VexResourceSlug, never, AuthFieldMeta>(baseOptions),
      });
    case "date":
      return date(baseOptions);
    case "json":
      // Fall back to text until a dedicated json field type is wired
      // TODO: create json field
      return text<VexResourceSlug, never, AuthFieldMeta>(baseOptions);
    default:
      // Unknown type — skip rather than crash
      return null;
  }
}
