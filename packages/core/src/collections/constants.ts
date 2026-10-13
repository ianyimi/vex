/**
 * Built-in Convex system fields that are present on every document.
 *
 * Maps logical names to their Convex database field slugs. These slugs are
 * always valid values for `useAsTitle` in a collection's admin config,
 * regardless of the collection's own field definitions.
 */
export const CONVEX_SYSTEM_FIELDS = {
  /** The document's unique identifier, stored as `_id` in Convex. */
  id: {
    slug: "_id",
  },
  /** The document's creation timestamp, stored as `_creationTime` in Convex. */
  createdAt: {
    slug: "_creationTime",
  },
  updatedAt: {
    slug: "_updatedAt",
  },
} as const;

/**
 * Union of the field slugs for all built-in Convex system fields.
 *
 * Resolves to `"_id" | "_creationTime"`. Use this type wherever a value must
 * refer to a core system field rather than a user-defined collection field.
 *
 * @see {@link CONVEX_SYSTEM_FIELDS} for the full map of logical names to slugs
 */
export type ConvexSystemField =
  (typeof CONVEX_SYSTEM_FIELDS)[keyof typeof CONVEX_SYSTEM_FIELDS]["slug"];

/**
 * Field keys that {@link defineCollection} injects onto every collection's
 * `fields` map and that therefore cannot be used as user-defined field names.
 *
 * Unlike {@link CONVEX_SYSTEM_FIELDS} — native Convex system columns present on
 * every document regardless of any field declaration — these are ordinary
 * `fields` entries `defineCollection` adds itself, and so ARE subject to
 * Convex schema validation. Conflating the two would put `updatedAt` in the
 * same union as `_id`/`_creationTime`, which is wrong on both counts.
 */
export const COLLECTION_SYSTEM_FIELDS = {
  /** Auto-maintained last-write timestamp, stamped by `create`/`update` on every write. */
  updatedAt: {
    slug: "updatedAt",
  },
} as const;

/**
 * Union of the field slugs {@link defineCollection} injects into `fields`.
 * Resolves to `"updatedAt"`.
 *
 * Deliberately NOT widened with the versioning system fields: this type also
 * keys `CollectionConfig.fields`, and `vex_status`/`vex_publishedAt`/
 * `vex_publishedId` are table columns emitted by `versionFieldsToVexSchema`,
 * never `fields` entries. The reserved-name guard in `defineCollection` unions
 * `VersionSystemField` (`versions/constants.ts`) in at its own call site instead.
 *
 * @see {@link COLLECTION_SYSTEM_FIELDS} for the full map of reserved keys
 */
export type CollectionSystemField =
  (typeof COLLECTION_SYSTEM_FIELDS)[keyof typeof COLLECTION_SYSTEM_FIELDS]["slug"];
