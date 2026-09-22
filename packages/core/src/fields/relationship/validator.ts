import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
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

/**
 * Types a `relationship()` field's `validate()` against a real collection
 * and `DataModel`, with `value` fixed to `string[]` (serialized `Id[]`).
 * @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function relationshipValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string[], RelationshipField>,
): FieldValidate<TCollectionSlug, string[]> {
  return fieldValidator<TCollectionSlug, string[], RelationshipField>(slug, fn);
}
