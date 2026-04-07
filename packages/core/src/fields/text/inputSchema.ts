import { z, ZodSchema } from "zod";
import { TextField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a text field value in the admin form.
 *
 * Applies `minLength` and `maxLength` constraints when configured, then
 * wraps in `.optional()` for non-required fields via {@link applyBaseInputSchemaMeta}.
 *
 * @param props - Input props.
 * @param props.field - The resolved text field definition
 * @returns A Zod string schema with length constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = text({ required: true, minLength: 3, maxLength: 100 })
 * textFieldtoInputSchema({ field })
 * // → z.string().min(3).max(100)
 * ```
 */
export function textFieldToInputSchema(props: { field: TextField }): ZodSchema {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";

  let inputSchema = z.string();
  if (field.min) {
    if (field.max) {
      inputSchema = z
        .string()
        .min(field.min.value, fieldMinError)
        .max(field.max.value, fieldMaxError);
    } else {
      inputSchema = z.string().min(field.min.value, fieldMinError);
    }
  } else if (field.max) {
    inputSchema = z.string().max(field.max.value, fieldMaxError);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
