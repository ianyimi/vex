import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
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
