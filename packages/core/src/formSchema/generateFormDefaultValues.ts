import type { VexField, FieldMeta } from "../types";

/**
 * Generate default values for a create form from a collection's field definitions.
 * Uses `formDefaultValue` from each field's metadata as the zero-value.
 * Skips hidden fields (they won't appear in the form).
 *
 * @param props.fields - Record of field name -> VexField from the collection config
 * @returns Record of field name -> default value for the create form
 */
export function generateFormDefaultValues(props: {
  fields: Record<string, VexField>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, field] of Object.entries(props.fields)) {
    if (field._meta.admin?.hidden) continue;

    const meta = field._meta as FieldMeta;
    result[fieldName] = (meta as any).formDefaultValue;
  }

  return result;
}
