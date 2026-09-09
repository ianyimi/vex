import { z, ZodType } from "zod";
import { TextField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a text field value in the admin form.
 *
 * Applies `min`/`max` character-length constraints by composing them onto
 * the same schema chain built for `required`, rather than reassigning over
 * it — a required field with `min`/`max` configured keeps every check
 * (CORE-1). Required fields attach `{ error: "This field is required." }` to
 * the base `z.string()` call and add `.min(1, "This field is required.")` so
 * a missing value and an explicit empty string report the same message; they
 * never receive `.default()`, matching `applyBaseInputSchemaMeta`'s
 * `.optional()` gate. Non-required fields keep `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved text field definition
 * @returns A Zod string schema with length constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = text({ required: true, min: { value: 3 }, max: { value: 100 } })
 * textFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3).max(100)
 * ```
 */
export function textFieldToInputSchema(props: { field: TextField }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";
  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    inputSchema = inputSchema.min(field.min.value, fieldMinError);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max.value, fieldMaxError);
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
