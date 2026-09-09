import { z, ZodType } from "zod";
import { SelectField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a select field value in the admin form.
 *
 * Validates that submitted values are arrays containing only defined option
 * values. When `hasMany` is false, limits the array to a maximum of one
 * item. Required fields attach `{ error: "This field is required." }` to the
 * base `z.array()` call and add `.min(1, "This field is required.")`, so a
 * missing value *and* an explicitly-submitted empty array are both rejected —
 * select previously had zero length enforcement for required fields
 * (CORE-1). Required fields never receive `.default()`; non-required fields
 * keep `.default(field.defaultValue)`.
 *
 * @param props - Input props.
 * @param props.field - The resolved select field definition
 * @returns A Zod array schema constrained to valid option values, with optionality applied
 *
 * @example
 * ```ts
 * const field = select({ required: true, options: [{ label: "Free", value: "free" }, { label: "Pro", value: "pro" }] })
 * selectFieldToInputSchema({ field })
 * // → z.array(z.enum(["free", "pro"]), { error: "This field is required." }).min(1, "This field is required.")
 *
 * const singleField = select({ hasMany: false, options: [{ label: "Free", value: "free" }] })
 * selectFieldToInputSchema({ field: singleField })
 * // → z.array(z.enum(["free"])).max(1, "Only one value may be selected.").default([])
 * ```
 */
export function selectFieldToInputSchema(props: {
  field: SelectField;
}): ZodType {
  const { field } = props;

  const optionValues = field.options.map((o) => o.value);
  // z.enum requires at least one element; fall back to z.string() when no options are configured yet
  const itemSchema =
    optionValues.length > 0
      ? z.enum(optionValues as [string, ...string[]])
      : z.string();

  const requiredError = "This field is required.";
  let inputSchema = field.required
    ? z.array(itemSchema, { error: requiredError }).min(1, requiredError)
    : z.array(itemSchema);

  if (!field.hasMany) {
    inputSchema = inputSchema.max(1, "Only one value may be selected.");
  }

  if (field.required) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(field.defaultValue),
  });
}
