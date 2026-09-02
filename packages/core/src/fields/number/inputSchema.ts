import { z, ZodType } from "zod";
import { NumberField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min` and `max` constraints when configured, then wraps in
 * `.optional()` for non-required fields via `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number schema with range constraints, a baked-in `.default(field.defaultValue)`, and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: { value: 0 }, max: { value: 100 } })
 * numberFieldToInputSchema({ field })
 * // → z.number().min(0).max(100).default(0)
 * ```
 */
export function numberFieldToInputSchema(props: {
  field: NumberField;
}): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too small.";
  const fieldMaxError = field.max?.error ?? "This field is too large.";

  let inputSchema = z.number().default(field.defaultValue);
  if (field.min) {
    let defaultValue =
      field.defaultValue < field.min.value
        ? field.min.value
        : field.defaultValue;
    if (field.max) {
      if (field.defaultValue > field.max.value) {
        defaultValue = field.min.value;
      }
      inputSchema = z
        .number()
        .min(field.min.value, fieldMinError)
        .max(field.max.value, fieldMaxError)
        .default(defaultValue);
    } else {
      inputSchema = z
        .number()
        .min(field.min.value, fieldMinError)
        .default(defaultValue);
    }
  } else if (field.max) {
    let defaultValue =
      field.defaultValue > field.max.value
        ? field.max.value
        : field.defaultValue;
    inputSchema = z
      .number()
      .max(field.max.value, fieldMaxError)
      .default(defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
