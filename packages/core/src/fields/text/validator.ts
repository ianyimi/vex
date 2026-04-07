import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import type { TextField } from "./types";

/**
 * Converts a text field definition to a Convex schema validator.
 *
 * Generates the appropriate v.string() or v.optional(v.string()) code
 * for the Convex schema based on the field's required property.
 *
 * **Important notes:**
 * - minLength/maxLength are runtime validation constraints, NOT schema constraints
 * - They don't affect the generated Convex value type
 * - Validation happens in the admin panel and mutation handlers
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
 * const field3 = text({ minLength: 3, maxLength: 100 })
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
