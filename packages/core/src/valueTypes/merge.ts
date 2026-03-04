import type { VexField } from "../types";
import type { AuthTableDefinition } from "../types";
import type { VexCollection } from "../types";
import { fieldToValueType } from "./extract";

/**
 * Result of merging auth table fields with a user collection.
 * Contains both the merged valueType strings for schema generation
 * and metadata about which fields came from where.
 */
export interface MergedFieldsResult {
  /**
   * The final field map for schema generation.
   * Key is field name, value is valueType string (e.g., "v.string()").
   * Includes auth-provided fields + user-defined fields.
   */
  fields: Record<string, string>;

  /**
   * Fields that exist in both auth table and user config.
   * The auth valueType wins for schema gen; user admin config wins for UI.
   */
  overlapping: string[];

  /**
   * Fields that only exist in the auth table (not in user's collection).
   */
  authOnly: string[];

  /**
   * Fields that only exist in the user's collection (not from auth).
   */
  userOnly: string[];
}

/**
 * Merges an auth table's fields with a user-defined collection's fields.
 *
 * This works for ANY auth table that has a matching user-defined collection
 * (matched by slug). The auth table's fields are already fully resolved
 * (all plugin contributions applied by vexBetterAuth() before this is called).
 *
 * Goal: Combine the auth table's fields (which define the database schema)
 * with the user's collection fields (which define admin UI behavior).
 * For schema generation, auth valueTypes take precedence on overlapping fields.
 * For admin UI, the user's field metadata takes precedence.
 *
 * @param authTable - The auth table definition with fully resolved fields
 * @param collection - The user's collection that matches this auth table by slug
 * @returns Merged fields result with source tracking
 *
 * Edge cases:
 * - Auth field conflicts with user field: auth valueType wins (it controls the DB shape)
 * - User defines field auth doesn't know about (e.g., "postCount"): added as user-only
 */
export function mergeAuthTableWithCollection(props: {
  authTable: AuthTableDefinition;
  collection: VexCollection<any>;
}): MergedFieldsResult {
  const { authTable, collection } = props;
  const fields: Record<string, string> = {};
  const overlapping: string[] = [];
  const authOnly: string[] = [];
  const userOnly: string[] = [];

  const authFieldSlugs = Object.keys(authTable.fields);
  const userFields: [string, VexField][] = Object.entries(
    collection.config.fields,
  );

  for (const fieldSlug of authFieldSlugs) {
    fields[fieldSlug] = authTable.fields[fieldSlug].valueType;
    if (userFields.find((field) => field[0] === fieldSlug)) {
      overlapping.push(fieldSlug);
    } else {
      authOnly.push(fieldSlug);
    }
  }

  for (const [fieldSlug, field] of userFields) {
    if (authFieldSlugs.includes(fieldSlug)) continue;
    userOnly.push(fieldSlug);
    fields[fieldSlug] = fieldToValueType({
      field,
      collectionSlug: collection.slug,
      fieldName: fieldSlug,
    });
  }

  return { fields, overlapping, authOnly, userOnly };
}
