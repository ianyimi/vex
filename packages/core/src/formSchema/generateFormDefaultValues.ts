import type { VexField } from "../types";

/**
 * Compute the zero-value for a field type (used as initial form value).
 */
function getFormDefaultValue(props: { field: VexField }): unknown {
  switch (props.field.type) {
    case "text":
      return props.field.defaultValue ?? "";
    case "number":
      return props.field.defaultValue ?? 0;
    case "checkbox":
      return props.field.defaultValue ?? false;
    case "select":
      if (props.field.hasMany) {
        return props.field.defaultValue ? [props.field.defaultValue] : [];
      }
      return props.field.defaultValue ?? "";
    case "date":
      return props.field.defaultValue ?? 0;
    case "imageUrl":
      return props.field.defaultValue ?? "";
    case "relationship":
      return props.field.hasMany ? [] : "";
    case "upload":
      return props.field.hasMany ? [] : "";
    case "json":
      return {};
    case "richtext":
      return [];
    case "array":
      return [];
    default:
      return undefined;
  }
}

/**
 * Generate default values for a create form from a collection's field definitions.
 * Skips hidden fields.
 *
 * @param props.fields - Record of field name -> VexField from the collection
 * @returns Record of field name -> default value for the create form
 */
export function generateFormDefaultValues(props: {
  fields: Record<string, VexField>;
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, field] of Object.entries(props.fields)) {
    if (field.admin?.hidden) continue;
    result[fieldName] = getFormDefaultValue({ field });
  }

  return result;
}
