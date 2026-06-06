import type { CollectionConfig } from "../collections";
import {
  VexAuthConfigError,
  type AuthCollectionConfig,
  AuthFieldMeta,
} from "./types";
import type { AdminField } from "../fields";

/**
 * Merges auth collections with user-defined collections, respecting
 * `protected` at the collection level and `meta.locked` on individual fields.
 *
 * Merge rules:
 * 1. User collections that match a `protected` auth slug throw an error.
 * 2. Iterate remaining user collections in their declared order.
 * 3. If a user collection's slug matches an auth collection:
 *    - Auth fields with `meta.locked === true` are preserved.
 *    - All other fields: user field wins (override or extend).
 *    - Admin config: user collection wins.
 *    - The merged collection appears at the user's declared position.
 * 4. Auth collections with no matching user collection are appended at the end.
 * 5. User collections with no matching auth collection are added as-is.
 *
 * @param props — authCollections, userCollections
 * @param props.authCollections — Collections from the auth adapter.
 * @param props.userCollections — Collections defined by the user.
 * @throws VexAuthConfigError when users pass a protected collection slug.
 * @returns Merged collections array for `VexConfig`.
 */
export function mergeAuthCollections(props: {
  authCollections: AuthCollectionConfig[];
  userCollections: CollectionConfig[];
}): CollectionConfig[] {
  const { authCollections, userCollections } = props;
  const protectedSlugs = new Set(
    authCollections.filter((c) => c.meta?.protected).map((c) => c.slug),
  );
  for (const userCol of userCollections) {
    if (protectedSlugs.has(userCol.slug)) {
      throw new VexAuthConfigError(
        `Collection slug "${userCol.slug}" is protected by the auth adapter and cannot be overridden.`,
      );
    }
  }

  const authBySlug = new Map(authCollections.map((c) => [c.slug, c]));
  const merged: CollectionConfig[] = [];
  const consumedAuthSlugs = new Set<string>();

  for (const userCol of userCollections) {
    const authCol = authBySlug.get(userCol.slug);
    if (authCol) {
      merged.push(mergeSingleCollection(authCol, userCol));
      consumedAuthSlugs.add(userCol.slug);
    } else {
      merged.push(userCol);
    }
  }

  for (const authCol of authCollections) {
    if (!consumedAuthSlugs.has(authCol.slug)) {
      // Strip AuthCollectionConfig-only properties before exposing
      const { protected: _, ...clean } = authCol as AuthCollectionConfig & {
        protected?: boolean;
      };
      merged.push(clean as CollectionConfig);
    }
  }

  return merged;
}

function isFieldLocked(field: AdminField<AuthFieldMeta>): boolean {
  return field?.meta?.locked === true;
}

function mergeSingleCollection(
  authCol: AuthCollectionConfig,
  userCol: CollectionConfig,
): CollectionConfig {
  // Start with all auth fields
  const fields: (CollectionConfig | AuthCollectionConfig)["fields"] = {
    ...authCol.fields,
  };

  // User fields override unless the auth field is meta-locked
  for (const [fieldName, userField] of Object.entries(userCol.fields)) {
    const authField = authCol.fields[fieldName];
    if (!authField || !isFieldLocked(authField)) {
      fields[fieldName] = userField;
    }
  }

  // TODO fix: currently stripping all collection metadata which may post a problem later
  // Strip AuthCollectionConfig-only properties from the returned object
  const { meta: _, ...authBase } = authCol;

  return {
    ...authBase,
    ...userCol,
    fields,
  };
}
