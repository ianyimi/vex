import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { TextField } from "./types";

/**
 * Converts a text field definition to a Convex schema validator.
 *
 * Generates the appropriate v.string() or v.optional(v.string()) code
 * for the Convex schema based on the field's required property.
 *
 * **Important notes:**
 * - `min`/`max` are runtime validation constraints, NOT schema constraints
 * - They don't affect the generated Convex value type
 * - Validation happens in the admin panel (client Zod) and in every mutation
 *   built through `create`/`update` (server Zod, run via the shared write pipeline)
 * - The index property is handled separately by index collection logic
 *
 * This function is used by the CLI during schema generation to build
 * the Convex schema file.
 *
 * @param props - textFieldToValidator() input props
 * @param props.field - The text field definition
 * @returns Convex value type string: "v.string()" or "v.optional(v.string())"
 *
 * @example
 * ```ts
 * const field1 = text({ required: true })
 * textToValidatorString({ field: field1 })  // "v.string()"
 *
 * const field2 = text({ required: false })
 * textToValidatorString({ field: field2 })  // "v.optional(v.string())"
 *
 * const field3 = text({ min: { value: 3 }, max: { value: 100 } })
 * textToValidatorString({ field: field3 })  // "v.optional(v.string())"
 * // Note: Length constraints don't affect schema, handled at validation layer
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function textFieldToValidator(props: { field: TextField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.text.validator,
  });
}

/**
 * Types a `text()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `string` — the wrapper `fieldValidator`
 * for this field type. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function textValidator<
  TCollectionSlug extends CollectionSlug,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, string, TextField>,
): FieldValidate<TCollectionSlug, string> {
  return fieldValidator<TCollectionSlug, string, TextField>(slug, fn);
}
