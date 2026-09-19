import type { GenericDataModel } from "convex/server";
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { NumberField } from "./types";

/**
 * Converts a number field definition to a Convex schema validator.
 *
 * Generates the appropriate v.number() or v.optional(v.number()) code
 * for the Convex schema based on the field's required property.
 *
 * **Important notes:**
 * - min/max are runtime validation constraints, NOT schema constraints
 * - They don't affect the generated Convex value type
 * - Validation happens in the admin panel (client Zod) and in every mutation
 *   built through `create`/`update` (server Zod, run via the shared write pipeline)
 * - The index property is handled separately by index collection logic
 *
 * This function is used by the CLI during schema generation to build
 * the Convex schema file.
 *
 * @param props - numberFieldToValidator() input props
 * @param props.field - The number field definition
 * @returns Convex value type string: "v.number()" or "v.optional(v.number())"
 *
 * @example
 * ```ts
 * const field1 = number({ required: true })
 * numberFieldToValidator({ field: field1 })  // "v.number()"
 *
 * const field2 = number({ required: false })
 * numberFieldToValidator({ field: field2 })  // "v.optional(v.number())"
 *
 * const field3 = number({ min: { value: 0 }, max: { value: 100 } })
 * numberFieldToValidator({ field: field3 })  // "v.optional(v.number())"
 * // Note: Range constraints don't affect schema, handled at validation layer
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function numberFieldToValidator(props: { field: NumberField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.number.validator
  });
}

/**
 * Types a `number()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `number`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function numberValidator<
  TCollectionSlug extends CollectionSlug,
  TDataModel extends GenericDataModel = GenericDataModel,
>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, number, TDataModel, NumberField>,
): FieldValidate<TCollectionSlug, number> {
  return fieldValidator<TCollectionSlug, number, TDataModel, NumberField>(slug, fn);
}
