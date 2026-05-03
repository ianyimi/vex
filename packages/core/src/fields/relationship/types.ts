import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput } from "../baseTypes";
import { CollectionSlug } from "../../types/generated";

/**
 * Configuration input for a `relationship()` field.
 *
 * Stores a Convex `Id` (or array of `Id`s) pointing to documents in another
 * registered collection. `TSlug` is inferred from the `collection` option —
 * after running `vex generate`, invalid slugs are a compile-time error.
 *
 * **Defaults applied by `relationship()`:**
 * ```ts
 * {
 *   type:     "relationship",
 *   label:    "",    // inferred from the field key by defineCollection
 *   required: false,
 *   hasMany:  false, // single Id reference by default
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "full",
 *     cellAlignment: "left",
 *   }
 * }
 *
 * @typeParam TSlug - The target collection slug. Inferred from `collection`.
 *   Defaults to `CollectionSlug` (the full union after `vex generate`).
 *
 * @example
 * ```ts
 * // Single reference
 * author: relationship({ collection: { slug: "authors" } })
 *
 * // Multi-reference
 * tags: relationship({ collection: { slug: "tags" }, hasMany: true })
 * ```
 *
 * @see {@link RelationshipField} for the resolved output type
 * @see {@link relationship} for the config function
 * @see {@link CollectionSlug} for the valid slug union
 */
export interface RelationshipFieldInput<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput {
  /** Target collection reference. The slug must match a registered collection in `defineConfig`. */
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` stores a single `Id`, `true` stores `Id[]`.
   * @defaultValue false
   */
  hasMany?: boolean;
}

/**
 * Resolved configuration for a `relationship()` field, after all defaults are applied.
 *
 * `TCollection` is the string-literal type of the target collection's slug,
 * inferred from `RelationshipFieldInput.collection`.
 *
 * @typeParam TCollection - The target collection slug (inferred from input).
 * @see {@link RelationshipFieldInput} for the user-facing input type
 * @see {@link relationship} for the config function
 */
export interface RelationshipField<
  TSlug extends CollectionSlug = CollectionSlug,
> extends BaseField {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  /** Target collection reference. */
  collection: {
    /** The slug of the collection this field links to. */
    slug: TSlug;
  };
  /** Whether this field stores multiple document references. */
  hasMany: boolean;
}
