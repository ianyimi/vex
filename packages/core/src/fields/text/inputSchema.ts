import { z, ZodType } from "zod";
import { TextField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a text field value in the admin form.
 *
 * Applies `min`/`max` character-length constraints when configured, then
 * wraps in `.optional()` for non-required fields via `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved text field definition
 * @returns A Zod string schema with length constraints, a baked-in `.default(field.defaultValue)`, and optionality applied
 *
 * @example
 * ```ts
 * const field = text({ required: true, min: { value: 3 }, max: { value: 100 } })
 * textFieldToInputSchema({ field })
 * // → z.string().min(3).max(100).default("")
 * // (a configured `min` supersedes the bare `.min(1)` required check)
 * ```
 */
export function textFieldToInputSchema(props: { field: TextField }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";

  let inputSchema = z.string().default(field.defaultValue);
  if (field.required) {
    inputSchema = z
      .string()
      .min(1, "This field is required.")
      .default(field.defaultValue);
  }
  if (field.min) {
    if (field.max) {
      inputSchema = z
        .string()
        .min(field.min.value, fieldMinError)
        .max(field.max.value, fieldMaxError)
        .default(field.defaultValue);
    } else {
      inputSchema = z
        .string()
        .min(field.min.value, fieldMinError)
        .default(field.defaultValue);
    }
  } else if (field.max) {
    inputSchema = z
      .string()
      .max(field.max.value, fieldMaxError)
      .default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
