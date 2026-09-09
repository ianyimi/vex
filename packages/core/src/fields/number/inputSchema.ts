import { z, ZodType } from "zod";
import { NumberField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min`/`max` constraints by composing them onto the same schema
 * chain built for `required`, rather than reassigning over it — a required
 * field with `min`/`max` configured keeps every check (CORE-1). Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.number()` call and never receive `.default()`, matching
 * `applyBaseInputSchemaMeta`'s `.optional()` gate — a number has no "empty"
 * state distinct from "missing", so no `.min(1)` is added (unlike `text`).
 * Only non-required fields get a `.default()`, clamped into the configured
 * `min`/`max` range.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: { value: 0 }, max: { value: 100 } })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0).max(100)
 * ```
 */
export function numberFieldToInputSchema(props: {
  field: NumberField;
}): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too small.";
  const fieldMaxError = field.max?.error ?? "This field is too large.";
  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min.value, fieldMinError);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max.value, fieldMaxError);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min.value) {
    defaultValue = field.min.value;
  }
  if (field.max && defaultValue > field.max.value) {
    defaultValue = field.max.value;
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
