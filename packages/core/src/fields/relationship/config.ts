import { ADMIN_FIELDS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug } from "../../types/generated";

/**
 * Creates a relationship field with all defaults applied.
 *
 * Stores a Convex `Id<collection>` (or `Id<collection>[]` when `hasMany: true`)
 * pointing to a document in the specified collection. The generated Convex schema
 * emits `v.id("collection")` and automatically adds a `.index("by_<fieldKey>",
 * ["<fieldKey>"])` — no explicit `index` property needed.
 *
 * `TSlug` is inferred from `options.collection`. After running `vex generate`,
 * passing an unregistered slug is a compile-time error.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from field key by `defineCollection`)
 * - `required` — `false`
 * - `hasMany` — `false`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @typeParam TSlug - Inferred from `options.collection`.
 * @param options - Relationship field config. `collection` is required.
 * @returns Resolved relationship field definition with all defaults applied.
 *
 * @example
 * ```ts
 * // Single reference — stores Id<"authors">
 * author: relationship({ collection: { slug: "authors" } })
 *
 * // Multi-reference — stores Id<"tags">[]
 * tags: relationship({ collection: { slug: "tags" }, hasMany: true, required: false })
 * ```
 *
 * @see {@link RelationshipFieldInput} for the full input type
 * @see {@link RelationshipField} for the resolved output type
 */
export function relationship<TSlug extends CollectionSlug = CollectionSlug>(
  options: RelationshipFieldInput<TSlug>,
): RelationshipField<TSlug> {
  return {
    label: "",
    required: false,
    hasMany: false,
    ...options,
    type: ADMIN_FIELDS.relationship.type,
    interfaceType: ADMIN_FIELDS.relationship.interfaceType,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      description: "",
      ...options?.admin,
    },
  };
}
