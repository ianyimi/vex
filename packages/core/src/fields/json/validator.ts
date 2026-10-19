import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { JsonField } from "./types";

/**
 * Converts a json field definition to a Convex schema validator.
 *
 * Generates `v.any()` or `v.optional(v.any())` based on the field's
 * `required` property — json stores arbitrary JSON-serializable values with
 * no shape constraint at the schema level.
 *
 * @param props - jsonFieldToValidator() input props
 * @param props.field - The json field definition
 * @returns Convex value type string: "v.any()" or "v.optional(v.any())"
 *
 * @example
 * ```ts
 * const field1 = json({ required: true })
 * jsonFieldToValidator({ field: field1 })  // "v.any()"
 *
 * const field2 = json({ required: false })
 * jsonFieldToValidator({ field: field2 })  // "v.optional(v.any())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function jsonFieldToValidator(props: { field: JsonField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.json.validator,
  });
}

/**
 * Types a `json()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `unknown` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function jsonValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, unknown, JsonField>,
): FieldValidate<TCollectionSlug, unknown> {
  return fieldValidator<TCollectionSlug, unknown, JsonField>(slug, fn);
}
