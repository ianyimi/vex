import type { ZodType } from "zod";
import type { AdminField } from "../types";

/**
 * Attaches field metadata and wraps in `.optional()` for non-required fields.
 *
 * Used during form schema generation to apply the correct Zod validator based on
 * whether the field is marked as required in its config.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition, used to check `required` and `defaultValue`
 * @param props.inputSchema - The base Zod schema for the field (e.g. `z.string()`)
 * @returns The schema with `.meta(fieldMeta)` for required fields, or `.meta(fieldMeta).optional()` for non-required fields. No `.default()` is applied — each field's own schema is responsible for baking in a default value.
 *
 * @example
 * ```ts
 * applyBaseInputSchemaMeta({ field: textField, inputSchema: z.string() })
 * // required field  → z.string().meta({ label, description })
 * // optional field  → z.string().meta({ label, description }).optional()
 * ```
 */
export function applyBaseInputSchemaMeta(props: {
  field: AdminField;
  inputSchema: ZodType;
}): ZodType {
  const { field, inputSchema } = props;
  const fieldMeta = {
    label: field.label,
    description: field.description ?? "",
  };
  if (!field.required) {
    return inputSchema.meta(fieldMeta).optional();
  }
  return inputSchema.meta(fieldMeta);
}
