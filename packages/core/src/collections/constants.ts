/**
 * Built-in Convex system fields that are present on every document.
 *
 * Maps logical names to their Convex database field slugs. These slugs are
 * always valid values for `useAsTitle` in a collection's admin config,
 * regardless of the collection's own field definitions.
 */
export const CORE_ADMIN_FIELDS = {
  /** The document's unique identifier, stored as `_id` in Convex. */
  id: {
    slug: "_id",
  },
  /** The document's creation timestamp, stored as `_creationTime` in Convex. */
  createdAt: {
    slug: "_creationTime",
  },
} as const;

/**
 * Union of the field slugs for all built-in Convex system fields.
 *
 * Resolves to `"_id" | "_creationTime"`. Use this type wherever a value must
 * refer to a core system field rather than a user-defined collection field.
 *
 * @see {@link CORE_ADMIN_FIELDS} for the full map of logical names to slugs
 */
export type CoreAdminField =
  (typeof CORE_ADMIN_FIELDS)[keyof typeof CORE_ADMIN_FIELDS]["slug"];

/**
 * Field keys that {@link defineCollection} injects onto every collection's
 * `fields` map and that therefore cannot be used as user-defined field names.
 *
 * Unlike {@link CORE_ADMIN_FIELDS} — native Convex system columns present on
 * every document regardless of any field declaration — these are ordinary
 * `fields` entries `defineCollection` adds itself, and so ARE subject to
 * Convex schema validation. Conflating the two would put `updatedAt` in the
 * same union as `_id`/`_creationTime`, which is wrong on both counts.
 */
export const RESERVED_COLLECTION_FIELDS = {
  /** Auto-maintained last-write timestamp, stamped by `create`/`update` on every write. */
  updatedAt: {
    slug: "updatedAt",
  },
} as const;

/**
 * Union of the field slugs {@link defineCollection} injects and therefore
 * reserves. Resolves to `"updatedAt"`.
 *
 * A user-defined field using one of these keys is a compile-time error in
 * `defineCollection` and a runtime error for JS callers that bypass the type
 * system — mirroring `defineGlobal`'s `ReservedGlobalFieldKey` guard.
 *
 * @see {@link RESERVED_COLLECTION_FIELDS} for the full map of reserved keys
 */
export type ReservedCollectionFieldKey =
  (typeof RESERVED_COLLECTION_FIELDS)[keyof typeof RESERVED_COLLECTION_FIELDS]["slug"];
