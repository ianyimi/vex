import { ZodSchema } from "zod";
import { AdminField } from "../types";

/**
 * Wraps a Zod schema in `.optional()` and applies `defaultValue` when the field is not required.
 *
 * Used during form schema generation to apply the correct Zod validator based on
 * whether the field is marked as required in its config.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition, used to check `required` and `defaultValue`
 * @param props.inputSchema - The base Zod schema for the field (e.g. `z.string()`)
 * @returns The schema unchanged for required fields, or wrapped in `.optional().default(...)` for optional fields
 *
 * @example
 * ```ts
 * handleOptionalInputSchemas({ field: textField, inputSchema: z.string() })
 * // required field  → z.string()
 * // optional field  → z.string().optional().default("")
 * ```
 */
export function applyBaseInputSchemaMeta(props: {
  field: AdminField;
  inputSchema: ZodSchema;
}): ZodSchema {
  const { field, inputSchema } = props;
  const fieldMeta = {
    label: field.label,
    description: field.description ?? "",
  };
  if (!field.required) {
    return inputSchema.meta(fieldMeta).optional().default(field.defaultValue);
  }
  return inputSchema.meta(fieldMeta).default(field.defaultValue);
}
