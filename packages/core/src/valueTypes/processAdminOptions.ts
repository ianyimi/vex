import type { BaseFieldMeta } from "../types";
import { VexFieldValidationError } from "../errors";

/**
 * Validates a field's configuration and determines if it should be optional.
 * Called by each per-field valueType function before generating the valueType string.
 *
 * Checks:
 * 1. If required=true and defaultValue is undefined → throw VexFieldValidationError
 * 2. If defaultValue is provided, verify it matches the expected type → throw VexFieldValidationError
 *
 * @param props.meta - The field metadata to validate
 * @param props.collectionSlug - The collection slug (for error messages)
 * @param props.fieldName - The field name (for error messages)
 * @param props.expectedType - The expected typeof for defaultValue (e.g., "string", "number", "boolean")
 * @param props.valueType - The Convex value type string (e.g., "v.string()")
 * @param props.skipDefaultValidation - Skip defaultValue presence and type checks.
 *   Use for fields that have no defaultValue concept (relationship, json, array).
 *
 * Edge cases:
 * - required=true, no defaultValue: throw (unless skipDefaultValidation)
 * - required=true, defaultValue present and correct type: isOptional=false
 * - required=false or undefined: isOptional=true
 * - defaultValue wrong type: throw regardless of required (unless skipDefaultValidation)
 * - Select fields: expectedType validation is handled differently (checked against option values)
 */
export function processFieldValueTypeOptions(props: {
  meta: BaseFieldMeta & { defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
  skipDefaultValidation?: boolean;
}): string {
  if (!props.meta.required) {
    return `v.optional(${props.valueType})`;
  }

  if (!props.skipDefaultValidation) {
    if (props.meta.defaultValue === undefined) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        "No defaultValue Provided",
      );
    }
    if (!(typeof props.meta.defaultValue === props.expectedType)) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        `Invalid defaultValue Provided. Expected: ${props.expectedType}, Received: ${typeof props.meta.defaultValue}`,
      );
    }
  }

  return props.valueType;
}
