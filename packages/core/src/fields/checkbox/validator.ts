import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { CheckboxField } from "./types";

/**
 * Converts a checkbox field definition to a Convex schema validator.
 *
 * Generates the appropriate `v.boolean()` or `v.optional(v.boolean())` code
 * for the Convex schema based on the field's `required` property.
 *
 * **Important notes:**
 * - The `required` flag is the only property that affects the generated validator.
 * - `index` is handled separately by collection index logic.
 * - This function is used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props - checkboxFieldToValidator() input props
 * @param props.field - The checkbox field definition
 * @returns Convex value type string: `"v.boolean()"` or `"v.optional(v.boolean())"`
 *
 * @example
 * ```ts
 * const field1 = checkbox({ required: true })
 * checkboxFieldToValidator({ field: field1 })  // "v.boolean()"
 *
 * const field2 = checkbox({ required: false })
 * checkboxFieldToValidator({ field: field2 })  // "v.optional(v.boolean())"
 *
 * const field3 = checkbox()
 * checkboxFieldToValidator({ field: field3 })  // "v.optional(v.boolean())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function checkboxFieldToValidator(props: {
  field: CheckboxField;
}): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.checkbox.validator,
  });
}

/**
 * Types a `checkbox()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `boolean`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function checkboxValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, boolean, CheckboxField>,
): FieldValidate<TCollectionSlug, boolean> {
  return fieldValidator<TCollectionSlug, boolean, CheckboxField>(slug, fn);
}
