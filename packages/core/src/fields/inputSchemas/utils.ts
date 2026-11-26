import type { ZodType } from "zod";
import type { AdminDataField } from "../types";

/**
 * Attaches field metadata, wraps in `.nullable()` for a nullable field, then
 * in `.optional()` for non-required fields — `.nullable()` applied before
 * `.optional()`, matching `applyBaseValidators`'s wrap order.
 *
 * @param props - Input props.
 * @param props.field - The resolved field definition, used to check `required`/`nullable` and `defaultValue`
 * @param props.inputSchema - The base Zod schema for the field (e.g. `z.string()`)
 * @returns The schema with `.meta(fieldMeta)`, `.nullable()` when `field.nullable`, and
 *   `.optional()` for non-required fields. No `.default()` is applied — each field's own schema
 *   is responsible for baking in a default value.
 *
 * @example
 * ```ts
 * applyBaseInputSchemaMeta({ field: textField, inputSchema: z.string() })
 * // required, non-nullable field  → z.string().meta({ label, description })
 * // optional, non-nullable field  → z.string().meta({ label, description }).optional()
 * // required, nullable field      → z.string().meta({ label, description }).nullable()
 * // optional, nullable field      → z.string().meta({ label, description }).nullable().optional()
 * ```
 */
export function applyBaseInputSchemaMeta(props: {
  field: AdminDataField;
  inputSchema: ZodType;
}): ZodType {
  const { field, inputSchema } = props;
  const fieldMeta = {
    fieldType: field.type,
    label: field.label,
    description: field.description ?? "",
  };
  const metaSchema = inputSchema.meta(fieldMeta);
  const nullableSchema = field.nullable ? metaSchema.nullable() : metaSchema;
  if (!field.required) {
    return nullableSchema.optional();
  }
  return nullableSchema;
}
