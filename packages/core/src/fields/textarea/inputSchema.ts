import * as z from "zod";
import type { ZodType } from "zod";
import { TextareaField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a textarea field value in the admin form.
 *
 * Applies `min`/`max` character-length constraints by composing them onto
 * the same schema chain built for `required`, rather than reassigning over
 * it — a required field with `min`/`max` configured keeps every check
 * (CORE-1, mirrored from `text`). Required fields attach
 * `{ error: "This field is required." }` to the base `z.string()` call and
 * add `.min(1, "This field is required.")` so a missing value and an
 * explicit empty string report the same message; they never receive
 * `.default()`, matching `applyBaseInputSchemaMeta`'s `.optional()` gate.
 * Non-required fields keep `.default(field.defaultValue)`. `field.min`/
 * `field.max` are already-resolved `FieldLimit` tuples (`[value, error]`) —
 * `resolveFieldLimit` (step 1) guarantees an error message, so neither
 * branch needs a fallback.
 *
 * @param props - Input props.
 * @param props.field - The resolved textarea field definition
 * @returns A Zod string schema with length constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = textarea({ required: true, min: 3, max: 100 })
 * textareaFieldToInputSchema({ field })
 * // → z.string({ error: "This field is required." }).min(1, "...").min(3).max(100)
 * ```
 */
export function textareaFieldToInputSchema(props: { field: TextareaField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.string({ error: requiredError }).min(1, requiredError)
    : z.string();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  const finalSchema: ZodType = field.required
    ? inputSchema
    : inputSchema.default(field.defaultValue);

  return applyBaseInputSchemaMeta({ field, inputSchema: finalSchema });
}
