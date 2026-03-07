import { VexFieldValidationError } from "../errors";
import { checkboxToValueTypeString } from "../fields/checkbox";
import { numberToValueTypeString } from "../fields/number";
import { selectToValueTypeString } from "../fields/select";
import { textToValueTypeString } from "../fields/text";
import { dateToValueTypeString } from "../fields/date";
import { imageUrlToValueTypeString } from "../fields/imageUrl";
import { relationshipToValueTypeString } from "../fields/relationship";
import { jsonToValueTypeString } from "../fields/json";
import { arrayToValueTypeString } from "../fields/array";
import type { VexField } from "../types";

/**
 * Converts a VexField to its Convex value type string representation.
 * Dispatches to the appropriate per-field function based on `_meta.type`.
 *
 * Each per-field function handles its own validation (via processFieldValueTypeOptions())
 * and its own v.optional() wrapping. This dispatcher just routes by type.
 *
 * Edge cases:
 * - Unknown field type: throw with descriptive error including the type string
 * - index property on _meta: ignored here — handled by collectIndexes()
 */
export function fieldToValueType(props: {
  field: VexField;
  collectionSlug: string;
  fieldName: string;
}): string {
  const { field, collectionSlug, fieldName } = props;
  switch (field._meta.type) {
    case "text":
      return textToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "number":
      return numberToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "checkbox":
      return checkboxToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "select":
      return selectToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "date":
      return dateToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "imageUrl":
      return imageUrlToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "relationship":
      return relationshipToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "json":
      return jsonToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
    case "array":
      return arrayToValueTypeString({
        meta: field._meta,
        collectionSlug,
        fieldName,
        resolveInnerField: fieldToValueType,
      });
    default:
      throw new VexFieldValidationError(
        collectionSlug,
        fieldName,
        `Unknown Field Type: ${(field._meta as any).type}`,
      );
  }
}
