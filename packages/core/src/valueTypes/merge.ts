import type { VexField } from "../types";
import type { VexCollection } from "../types";
import type { ResolvedIndex, ResolvedSearchIndex } from "../types";

/**
 * Result of merging an auth collection with a user collection.
 * Contains merged VexFields and metadata about field sources.
 */
export interface MergedCollectionResult {
  /**
   * The final merged field map.
   * Key is field name, value is the VexField object.
   * Auth fields win for schema generation; user admin config is preserved.
   */
  fields: Record<string, VexField>;

  /** Indexes from both auth and user collections (deduplicated by name). */
  indexes: ResolvedIndex[];

  /** Search indexes from the user collection. */
  searchIndexes: ResolvedSearchIndex[];

  /**
   * Fields that exist in both auth collection and user config.
   * The auth VexField wins for schema gen; user admin config wins for UI.
   */
  overlapping: string[];

  /** Fields that only exist in the auth collection (not in user's collection). */
  authOnly: string[];

  /** Fields that only exist in the user's collection (not from auth). */
  userOnly: string[];
}

/**
 * Merges an auth collection's fields with a user-defined collection's fields.
 *
 * Both sides are now VexField records. For overlapping fields, the auth
 * VexField's schema properties are used (it controls the DB shape), but
 * the user's admin config (label, hidden, etc.) is preserved by copying
 * admin-related metadata from the user's field onto the auth field.
 *
 * @param authCollection - The auth collection with fully resolved fields
 * @param userCollection - The user's collection that matches this auth table by slug
 * @returns Merged collection result with combined fields and source tracking
 */
export function mergeAuthCollectionWithUserCollection(props: {
  authCollection: VexCollection<any>;
  userCollection: VexCollection<any>;
}): MergedCollectionResult {
  const { authCollection, userCollection } = props;
  const fields: Record<string, VexField> = {};
  const overlapping: string[] = [];
  const authOnly: string[] = [];
  const userOnly: string[] = [];

  const authFields = authCollection.config.fields;
  const userFields = userCollection.config.fields;
  const authFieldKeys = Object.keys(authFields);
  const userFieldKeys = Object.keys(userFields);

  // Process auth fields
  for (const fieldKey of authFieldKeys) {
    if (userFieldKeys.includes(fieldKey)) {
      overlapping.push(fieldKey);
      // Auth field wins for schema, but preserve user's admin config
      const authField = authFields[fieldKey];
      const userField = userFields[fieldKey];
      fields[fieldKey] = {
        ...authField,
        _meta: {
          ...authField._meta,
          // Preserve user's admin-facing metadata
          ...(userField._meta.label !== undefined && { label: userField._meta.label }),
          ...(userField._meta.description !== undefined && { description: userField._meta.description }),
          ...(userField._meta.admin !== undefined && { admin: userField._meta.admin }),
        },
      };
    } else {
      authOnly.push(fieldKey);
      fields[fieldKey] = authFields[fieldKey];
    }
  }

  // Process user-only fields
  for (const fieldKey of userFieldKeys) {
    if (authFieldKeys.includes(fieldKey)) continue;
    userOnly.push(fieldKey);
    fields[fieldKey] = userFields[fieldKey];
  }

  // Merge indexes (auth indexes first, user indexes added if name doesn't conflict)
  const indexes: ResolvedIndex[] = [];
  const indexNames = new Set<string>();

  // Auth collection indexes (from collection-level)
  for (const idx of authCollection.config.indexes ?? []) {
    indexes.push({ name: idx.name, fields: idx.fields as string[] });
    indexNames.add(idx.name);
  }

  // User collection indexes
  for (const idx of userCollection.config.indexes ?? []) {
    if (!indexNames.has(idx.name)) {
      indexes.push({ name: idx.name, fields: idx.fields as string[] });
      indexNames.add(idx.name);
    }
  }

  // Search indexes from user collection
  const searchIndexes: ResolvedSearchIndex[] = (
    userCollection.config.searchIndexes ?? []
  ).map((si) => ({
    name: si.name,
    searchField: si.searchField as string,
    filterFields: (si.filterFields ?? []) as string[],
  }));

  return { fields, indexes, searchIndexes, overlapping, authOnly, userOnly };
}
