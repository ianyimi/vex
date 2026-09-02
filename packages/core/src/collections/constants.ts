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
