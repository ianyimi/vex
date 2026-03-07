// =============================================================================
// COLLECTION TYPES
// =============================================================================

import type { VexField, InferFieldsType } from "..";
import type { VexAuthAdapter } from "./auth";

/**
 * Admin UI configuration for a collection.
 * Controls how the collection appears and behaves in the admin panel.
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField>,
  TAuthFieldKeys extends string = never,
> {
  /**
   * Group this collection under a heading in the sidebar.
   * Collections with the same group string are grouped together.
   */
  group?: string;
  /**
   * Icon name for the collection in the sidebar.
   * Uses Lucide icon names (e.g. `"file-text"`, `"users"`, `"settings"`).
   */
  icon?: string;
  /**
   * Field key to use as the document title in list views.
   * Should reference a text-like field from the collection's fields,
   * or an auth field key when `auth` is provided.
   */
  useAsTitle?: keyof TFields | TAuthFieldKeys;
  /**
   * Field keys to show as default columns in the list view.
   * If not set, all fields are shown (with `_id` first).
   * When set, only the specified fields are shown — `_id` is only
   * included if explicitly listed.
   * When `auth` is provided, auth field keys (e.g. `"email"`) are also accepted.
   */
  defaultColumns?: ("_id" | keyof TFields | TAuthFieldKeys)[];
  /**
   * Disable the "Create New" button in the admin list view.
   *
   * Default: `false`
   */
  disableCreate?: boolean;
  /**
   * Disable the delete action in the admin panel.
   *
   * Default: `false`
   */
  disableDelete?: boolean;
}

/**
 * Index definition for a collection.
 * Compound indexes include multiple fields — order matters.
 *
 * Generic over `TFields` so that the `fields` array is type-checked
 * against actual field names in the collection. The default generic
 * parameter allows standalone usage (e.g., in `collectIndexes` internals)
 * without requiring a type argument.
 */
export interface IndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /**
   * Index name (must be unique within the collection).
   * Convention: `"by_<field>"` for single-field, `"by_<field1>_<field2>"` for compound.
   */
  name: string;
  /**
   * Field names to include in the index. Order matters for compound indexes.
   * Each field name must be a key in the collection's `fields` record.
   * Type-checked at compile time — invalid field names produce a type error.
   */
  fields: (keyof TFields & string)[];
}

/**
 * Search index definition for a collection.
 * Enables full-text search on a field with optional filter fields.
 *
 * Generic over `TFields` so that `searchField` and `filterFields` are type-checked
 * against actual field names in the collection.
 *
 * @example
 * defineCollection("posts", {
 *   fields: {
 *     title: text(),
 *     author: text(),
 *     status: select({ options: [...] }),
 *   },
 *   searchIndexes: [
 *     { name: "search_title", searchField: "title", filterFields: ["author", "status"] },
 *   ],
 * })
 *
 */
export interface SearchIndexConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /**
   * Search index name (must be unique within the collection).
   * Convention: `"search_<field>"`.
   */
  name: string;
  /**
   * The field to perform full-text search on.
   * Must be a text (string) field in the collection.
   */
  searchField: keyof TFields & string;
  /**
   * Optional fields to filter search results by.
   * Each field name must be a key in the collection's `fields` record.
   */
  filterFields?: (keyof TFields & string)[];
}

/**
 * Configuration passed to `defineCollection`.
 * Defines the fields, labels, and admin behavior for a collection.
 */
export interface CollectionConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TAuthFieldKeys extends string = never,
> {
  /**
   * The fields that make up documents in this collection.
   * Each key becomes a field name, and the value defines
   * its type and validation (e.g. `text()`, `number()`, `select()`).
   */
  fields: TFields;
  /**
   * The name of the table generated for this collection in the
   * generated vex schema file. Defaults to the collection slug
   */
  tableName?: string;
  /**
   * Display labels for the collection in the admin UI.
   * If not provided, labels are derived from the collection slug.
   */
  labels?: {
    /** Singular label (e.g. `"Post"`). */
    singular?: string;
    /** Plural label (e.g. `"Posts"`). */
    plural?: string;
  };
  /**
   * Auth adapter instance — pass the same object used in `defineConfig`.
   * When provided, auth field keys (e.g. `"email"`) become available
   * for `defaultColumns` and `useAsTitle` autocomplete.
   */
  auth?: VexAuthAdapter<any>;
  /**
   * Admin UI configuration for this collection.
   * Controls sidebar grouping, icons, list columns, and permissions.
   */
  admin?: CollectionAdminConfig<TFields, TAuthFieldKeys>;
  /**
   * Database indexes for this collection.
   * Use this for compound indexes that span multiple fields.
   * For single-field indexes, prefer using `index` on the field directly.
   *
   * The `fields` array is type-checked: only field names defined in this
   * collection's `fields` record are accepted.
   *
   * @example
   * ```ts
   * defineCollection("posts", {
   *   fields: {
   *     title: text(),
   *     author: text(),
   *     createdAt: number(),
   *   },
   *   indexes: [
   *     { name: "by_author_date", fields: ["author", "createdAt"] },  // OK
   *     { name: "bad", fields: ["nonexistent"] },                      // Type error!
   *   ],
   * })
   *
   */
  indexes?: IndexConfig<TFields>[];
  /**
   * Search indexes for full-text search on this collection.
   * Each search index targets a single text field with optional filter fields.
   *
   * @example
   * searchIndexes: [
   *   { name: "search_title", searchField: "title", filterFields: ["status"] },
   * ]
   */
  searchIndexes?: SearchIndexConfig<TFields>[];
}

/**
 * A defined collection with inferred document type.
 * Created by `defineCollection()`.
 */
export interface VexCollection<
  TFields extends Record<string, VexField> = Record<string, VexField>,
  TAuthFieldKeys extends string = never,
> {
  /** The collection identifier, used in URLs and the database. */
  readonly slug: string;
  /** The full collection configuration. */
  readonly config: CollectionConfig<TFields, TAuthFieldKeys>;
  /**
   * Type helper — use `typeof collection._docType` to get the
   * inferred document shape for this collection.
   */
  readonly _docType: InferFieldsType<TFields>;
}
