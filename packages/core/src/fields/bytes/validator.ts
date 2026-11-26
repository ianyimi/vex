import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { BytesField } from "./types";

/**
 * Converts a bytes field definition to a Convex schema validator.
 *
 * Generates `v.bytes()` or `v.optional(v.bytes())` based on the field's
 * `required` property.
 *
 * @param props - bytesFieldToValidator() input props
 * @param props.field - The bytes field definition
 * @returns Convex value type string: "v.bytes()" or "v.optional(v.bytes())"
 *
 * @example
 * ```ts
 * const field1 = bytes({ required: true })
 * bytesFieldToValidator({ field: field1 })  // "v.bytes()"
 *
 * const field2 = bytes({ required: false })
 * bytesFieldToValidator({ field: field2 })  // "v.optional(v.bytes())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function bytesFieldToValidator(props: { field: BytesField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.bytes.validator,
  });
}

/**
 * Types a `bytes()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `ArrayBuffer` — the wrapper
 * `fieldValidator` for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function bytesValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, ArrayBuffer, BytesField>,
): FieldValidate<TCollectionSlug, ArrayBuffer> {
  return fieldValidator<TCollectionSlug, ArrayBuffer, BytesField>(slug, fn);
}
