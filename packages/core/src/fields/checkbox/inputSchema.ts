import { z, ZodSchema } from "zod";
import { CheckboxField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a checkbox field value in the admin form.
 *
 * Checkbox fields are always boolean — there are no required/optional semantics
 * beyond wrapping in `.optional()` for non-required fields. No min/max constraints.
 *
 * @param props - Input props.
 * @param props.field - The resolved checkbox field definition
 * @returns A Zod boolean schema with optionality and default applied
 *
 * @example
 * ```ts
 * const field = checkbox({ required: true })
 * checkboxFieldToInputSchema({ field })
 * // → z.boolean()
 *
 * const optionalField = checkbox()
 * checkboxFieldToInputSchema({ field: optionalField })
 * // → z.boolean().optional().default(false)
 * ```
 */
export function checkboxFieldToInputSchema(props: {
  field: CheckboxField;
}): ZodSchema {
  const { field } = props;

  const inputSchema = z.boolean().default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
