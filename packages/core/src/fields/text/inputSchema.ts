import * as z from "zod";
import type { ZodType } from "zod";
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
 * const field = text({ required: true, min: 3, max: [100, "Too long."] })
 * textFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3, "...").max(100, "Too long.")
 * ```
 */
export function textFieldToInputSchema(props: { field: TextField }): ZodType {
  const requiredError = "This field is required.";

  let inputSchema = props.field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (props.field.min) {
    inputSchema = inputSchema.min(props.field.min[0], props.field.min[1]);
  }
  if (props.field.max) {
    inputSchema = inputSchema.max(props.field.max[0], props.field.max[1]);
  }

  const finalSchema: ZodType = props.field.required
    ? inputSchema
    : inputSchema.default(props.field.defaultValue);

  return applyBaseInputSchemaMeta({ field: props.field, inputSchema: finalSchema });
}
