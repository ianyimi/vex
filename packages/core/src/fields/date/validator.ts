import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import type { DateField } from "./types";

/**
 * Converts a date field definition to a Convex schema validator.
 *
 * Generates the appropriate `v.number()` or `v.optional(v.number())` code
 * for the Convex schema based on the field's required property.
 * Date values are stored as Unix timestamps in milliseconds.
 *
 * **Important notes:**
 * - The `time` property is a UI concern only — it does NOT affect the schema type
 * - The index property is handled separately by index collection logic
 *
 * This function is used by the CLI during schema generation to build
 * the Convex schema file.
 *
 * @param props - dateFieldToValidator() input props
 * @param props.field - The date field definition
 * @returns Convex value type string: `"v.number()"` or `"v.optional(v.number())"`
 *
 * @example
 * ```ts
 * const field1 = date({ required: true })
 * dateFieldToValidator({ field: field1 })  // "v.number()"
 *
 * const field2 = date({ required: false })
 * dateFieldToValidator({ field: field2 })  // "v.optional(v.number())"
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function dateFieldToValidator(props: { field: DateField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.date.validator,
  });
}
