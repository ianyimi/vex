import type { VexField, VexCollection } from "../types";
import type { VexAuthAdapter, AuthCollectionFieldKeys } from "../types/auth";
import type { CollectionAdminConfig, IndexConfig, SearchIndexConfig } from "../types/collections";
import type { VexMediaCollection, DefaultMediaFieldKeys } from "../types/media";

/**
 * Creates a VexCollection with full LSP autocomplete on field names,
 * `admin.useAsTitle`, `admin.defaultColumns`, index fields, etc.
 *
 * When `auth` is provided, auth field keys (e.g. "email", "createdAt") are
 * also included in autocomplete for admin config and indexes.
 *
 * @example
 * ```ts
 * // Without auth — autocomplete for own fields
 * export const posts = defineCollection({
 *   slug: "posts",
 *   fields: {
 *     title: { type: "text", required: true },
 *     status: { type: "select", options: [...] },
 *   },
 *   admin: { useAsTitle: "title" }, // autocomplete: "title" | "status"
 * });
 *
 * // With auth — autocomplete for own fields + auth fields
 * export const users = defineCollection({
 *   slug: "users",
 *   auth,
 *   fields: {
 *     name: { type: "text", required: true },
 *     role: { type: "select", options: [...] },
 *   },
 *   admin: {
 *     useAsTitle: "name",                    // autocomplete: "name" | "role" | "email" | "createdAt" | ...
 *     defaultColumns: ["name", "email"],     // same autocomplete
 *   },
 * });
 * ```
 */
export function defineCollection<
  TFields extends Record<string, VexField>,
  TAuth extends VexAuthAdapter<any> | undefined = undefined,
  TSlug extends string = string,
>(props: {
  readonly slug: TSlug;
  fields: TFields;
  auth?: TAuth;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<
    TFields,
    TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never
  >;
  indexes?: IndexConfig<
    TFields,
    TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never
  >[];
  searchIndexes?: SearchIndexConfig<
    TFields,
    TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never
  >[];
}): VexCollection<
  TFields,
  TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never,
  TSlug
> {
  const { auth: _auth, ...rest } = props;
  return rest as VexCollection<
    TFields,
    TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never,
    TSlug
  >;
}

/**
 * Creates a VexMediaCollection with full LSP autocomplete on field names
 * and `admin.useAsTitle`, `admin.defaultColumns`, etc.
 *
 * Default media fields (storageId, filename, mimeType, size, url, alt, width, height)
 * are injected automatically by `defineConfig()` — only define additional or
 * overridden fields here.
 *
 * @example
 * ```ts
 * export const media = defineMediaCollection({
 *   slug: "media",
 *   fields: {
 *     caption: { type: "text" },
 *   },
 *   admin: { useAsTitle: "filename" }, // autocomplete: "caption" | default media field keys
 * });
 * ```
 */
export function defineMediaCollection<
  TFields extends Record<string, VexField> = Record<never, VexField>,
  TSlug extends string = string,
>(props: {
  readonly slug: TSlug;
  fields?: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, DefaultMediaFieldKeys>;
}): VexMediaCollection<TFields, TSlug> {
  return props as VexMediaCollection<TFields, TSlug>;
}
