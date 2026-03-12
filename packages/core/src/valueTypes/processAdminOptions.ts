import { VexFieldValidationError } from "../errors";

/**
 * Validates a field's configuration and determines if it should be optional.
 * Called by each per-field valueType function before generating the valueType string.
 *
 * Checks:
 * 1. If required=true and defaultValue is undefined → throw VexFieldValidationError
 * 2. If defaultValue is provided, verify it matches the expected type → throw VexFieldValidationError
 *
 * @param props.field - The field to validate (only needs required and defaultValue)
 * @param props.collectionSlug - The collection slug (for error messages)
 * @param props.fieldName - The field name (for error messages)
 * @param props.expectedType - The expected typeof for defaultValue (e.g., "string", "number", "boolean")
 * @param props.valueType - The Convex value type string (e.g., "v.string()")
 * @param props.skipDefaultValidation - Skip defaultValue presence and type checks.
 */
export function processFieldValueTypeOptions(props: {
  field: { required?: boolean; defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
  skipDefaultValidation?: boolean;
}): string {
  if (!props.field.required) {
    return `v.optional(${props.valueType})`;
  }

  if (!props.skipDefaultValidation) {
    if (props.field.defaultValue === undefined) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        "No defaultValue Provided",
      );
    }
    if (!(typeof props.field.defaultValue === props.expectedType)) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        `Invalid defaultValue Provided. Expected: ${props.expectedType}, Received: ${typeof props.field.defaultValue}`,
      );
    }
  }

  return props.valueType;
}
