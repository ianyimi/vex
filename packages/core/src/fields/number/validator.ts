import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
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
 * - Validation happens in the admin panel and mutation handlers
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
    validator: ADMIN_FIELDS.number.validator,
  });
}
