import * as z from "zod";
import type { ZodType } from "zod";
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
 * const field = number({ required: true, min: 0, max: [100, "Too large."] })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0, "...").max(100, "Too large.")
 * ```
 */
export function numberFieldToInputSchema(props: { field: NumberField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required ? z.number({ error: requiredError }) : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min[0]) {
    defaultValue = field.min[0];
  }
  if (field.max && defaultValue > field.max[0]) {
    defaultValue = field.max[0];
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
