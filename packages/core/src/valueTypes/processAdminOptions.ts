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
 * @param meta - The field metadata to validate
 * @param collectionSlug - The collection slug (for error messages)
 * @param fieldName - The field name (for error messages)
 * @param expectedType - The expected typeof for defaultValue (e.g., "string", "number", "boolean")
 * @returns FieldValidationResult with isOptional flag
 *
 * Edge cases:
 * - required=true, no defaultValue: throw
 * - required=true, defaultValue present and correct type: isOptional=false
 * - required=false or undefined: isOptional=true
 * - defaultValue wrong type: throw regardless of required
 * - Select fields: expectedType validation is handled differently (checked against option values)
 */
export function processFieldValueTypeOptions({
  meta,
  collectionSlug,
  fieldName,
  expectedType,
  valueType,
}: {
  meta: BaseFieldMeta & { defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
}): string {
  if (!meta.required) {
    return `v.optional(${valueType})`;
  } else {
    if (meta.defaultValue === undefined) {
      throw new VexFieldValidationError(
        collectionSlug,
        fieldName,
        "No defaultValue Provided",
      );
    }
    if (!(typeof meta.defaultValue === expectedType)) {
      throw new VexFieldValidationError(
        collectionSlug,
        fieldName,
        `Invalid defaultValue Provided. Expected: ${expectedType}, Received: ${typeof meta.defaultValue}`,
      );
    }
    return valueType;
  }
}
