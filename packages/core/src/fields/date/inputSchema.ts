import * as z from "zod";
import type { ZodType } from "zod";
import { DateField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a date field value in the admin form.
 *
 * Date values are Unix timestamps in milliseconds, so the base schema is
 * `z.number()`. Required fields attach `{ error: "This field is required." }`
 * to the base call so a missing value is rejected with a "required" message
 * instead of Zod's generic type-mismatch text, and never receive a
 * `.default()` — matching `applyBaseInputSchemaMeta`'s `.optional()` gate,
 * and unlike the previous `.default(Date.now())` that made a missing value
 * indistinguishable from "now" (CORE-1). `field.min`/`field.max` — Unix
 * millisecond timestamps — are enforced via `.min()`/`.max()` when set
 * (CORE-3); previously they were read nowhere in the schema.
 *
 * @param props - Input props.
 * @param props.field - The resolved date field definition
 * @returns A Zod number schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = date({ required: true, min: 1700000000000 })
 * dateFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(1700000000000, "...")
 * ```
 */
export function dateFieldToInputSchema(props: { field: DateField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  let inputSchema = field.required
    ? z.number({ error: requiredError })
    : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
