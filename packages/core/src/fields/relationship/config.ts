import { ADMIN_FIELDS } from "../constants";
import type { RelationshipFieldInput, RelationshipField } from "./types";
import type { CollectionSlug } from "../../types/generated";
import { ComponentHKT } from "../baseTypes";

/**
 * Creates a relationship field with all defaults applied.
 *
 * Stores Convex `Id` references pointing to documents in another registered collection.
 * The generated Convex schema **always** emits `v.array(v.id("collection"))` regardless
 * of `hasMany` — `hasMany` is a UI-only hint that controls whether the admin picker allows
 * one or multiple selections; it does not change the stored Convex type.
 * A `.index("by_<fieldKey>", ["<fieldKey>"])` is auto-generated for every relationship
 * field — no explicit `index` property needed.
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
export function relationship<
  TMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  options: RelationshipFieldInput<TMeta, TSlug, TComponent>,
): RelationshipField<TMeta, TSlug, TComponent> {
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
      components: {},
      ...options?.admin,
    },
  };
}
