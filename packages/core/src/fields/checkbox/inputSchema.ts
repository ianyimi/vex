import { z, ZodType } from "zod";
import { CheckboxField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a checkbox field value in the admin form.
 *
 * Checkbox fields are always boolean. Required fields attach
 * `{ error: "This field is required." }` to the base `z.boolean()` call and
 * never receive `.default()` — previously an unconditional
 * `.default(field.defaultValue)` meant `true`, `false`, *and* a missing value
 * all passed a "required" checkbox (CORE-1). Optional fields keep
 * `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved checkbox field definition
 * @returns A Zod boolean schema with optionality and default applied
 *
 * @example
 * ```ts
 * const field = checkbox({ required: true })
 * checkboxFieldToInputSchema({ field })
 * // → z.boolean({ error: "This field is required." })
 *
 * const optionalField = checkbox()
 * checkboxFieldToInputSchema({ field: optionalField })
 * // → z.boolean().default(false)
 * ```
 */
export function checkboxFieldToInputSchema(props: {
  field: CheckboxField;
}): ZodType {
  const { field } = props;

  const inputSchema = field.required
    ? z.boolean({ error: "This field is required." })
    : z.boolean().default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
