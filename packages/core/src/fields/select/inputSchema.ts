import { z, ZodType } from "zod";
import { SelectField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a select field value in the admin form.
 *
 * Validates that submitted values are arrays containing only defined option values.
 * When `hasMany` is false, limits the array to a maximum of one item.
 * Wraps in `.optional()` for non-required fields via `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved select field definition
 * @returns A Zod array schema constrained to valid option values, with a baked-in `.default(field.defaultValue)` and optionality applied
 *
 * @example
 * ```ts
 * const field = select({ required: true, options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }] })
 * selectFieldToInputSchema({ field })
 * // → z.array(z.enum(["draft", "published"])).default([])
 *
 * const singleField = select({ hasMany: false, options: [{ label: "Draft", value: "draft" }] })
 * selectFieldToInputSchema({ field: singleField })
 * // → z.array(z.enum(["draft"])).max(1, "Only one value may be selected.").default([])
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

  let inputSchema = z.array(itemSchema).default(field.defaultValue);

  if (!field.hasMany) {
    inputSchema = z
      .array(itemSchema)
      .max(1, "Only one value may be selected.")
      .default(field.defaultValue);
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
