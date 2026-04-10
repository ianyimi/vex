import { z, ZodSchema } from "zod";
import { NumberField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min` and `max` constraints when configured, then wraps in
 * `.optional()` for non-required fields via {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: { value: 0 }, max: { value: 100 } })
 * numberFieldToInputSchema({ field })
 * // → z.number().min(0).max(100)
 * ```
 */
export function numberFieldToInputSchema(props: {
  field: NumberField;
}): ZodSchema {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too small.";
  const fieldMaxError = field.max?.error ?? "This field is too large.";

  let inputSchema = z.number();
  if (field.min) {
    if (field.max) {
      inputSchema = z
        .number()
        .min(field.min.value, fieldMinError)
        .max(field.max.value, fieldMaxError);
    } else {
      inputSchema = z.number().min(field.min.value, fieldMinError);
    }
  } else if (field.max) {
    inputSchema = z.number().max(field.max.value, fieldMaxError);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
