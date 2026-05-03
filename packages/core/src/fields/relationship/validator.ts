import { applyBaseValidators } from "../validators/utils";
import type { RelationshipField } from "./types";

/**
 * Converts a relationship field definition to a Convex schema validator string.
 *
 * Emits `v.id("collection")` for single references and
 * `v.array(v.id("collection"))` for multi-references. Wraps in `v.optional()`
 * when `field.required` is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved relationship field definition.
 * @returns Convex validator string.
 *
 * @example
 * ```ts
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "authors" }, required: true }) })
 * // → 'v.array(v.id("authors"))'
 *
 * relationshipFieldToValidator({ field: relationship({ collection: { slug: "tags" }, hasMany: true }) })
 * // → 'v.optional(v.array(v.id("tags")))'
 * ```
 *
 * @internal
 */
export function relationshipFieldToValidator(props: {
  field: RelationshipField;
}): string {
  const { field } = props;
  const validator = `v.array(v.id("${field.collection.slug}"))`;
  return applyBaseValidators({ field, validator });
}
