import { VexFieldValidationError } from "../errors";
import { checkboxToValueTypeString } from "../fields/checkbox";
import { numberToValueTypeString } from "../fields/number";
import { selectToValueTypeString } from "../fields/select";
import { textToValueTypeString } from "../fields/text";
import { dateToValueTypeString } from "../fields/date";
import { imageUrlToValueTypeString } from "../fields/imageUrl";
import { relationshipToValueTypeString } from "../fields/relationship";
import { jsonToValueTypeString } from "../fields/json";
import { richtextToValueTypeString } from "../fields/richtext";
import { uploadToValueTypeString } from "../fields/media";
import { arrayToValueTypeString } from "../fields/array";
import type { VexField } from "../types";

/**
 * Converts a VexField to its Convex value type string representation.
 * Dispatches to the appropriate per-field function based on `type`.
 *
 * Each per-field function handles its own validation (via processFieldValueTypeOptions())
 * and its own v.optional() wrapping. This dispatcher just routes by type.
 */
export function fieldToValueType(props: {
  field: VexField;
  collectionSlug: string;
  fieldName: string;
}): string {
  const { field, collectionSlug, fieldName } = props;
  switch (field.type) {
    case "text":
      return textToValueTypeString({ field, collectionSlug, fieldName });
    case "number":
      return numberToValueTypeString({ field, collectionSlug, fieldName });
    case "checkbox":
      return checkboxToValueTypeString({ field, collectionSlug, fieldName });
    case "select":
      return selectToValueTypeString({ field, collectionSlug, fieldName });
    case "date":
      return dateToValueTypeString({ field, collectionSlug, fieldName });
    case "imageUrl":
      return imageUrlToValueTypeString({ field, collectionSlug, fieldName });
    case "relationship":
      return relationshipToValueTypeString({ field, collectionSlug, fieldName });
    case "upload":
      return uploadToValueTypeString({ field, collectionSlug, fieldName });
    case "json":
      return jsonToValueTypeString({ field, collectionSlug, fieldName });
    case "richtext":
      return richtextToValueTypeString({ field, collectionSlug, fieldName });
    case "array":
      return arrayToValueTypeString({
        field,
        collectionSlug,
        fieldName,
        resolveInnerField: fieldToValueType,
      });
    default:
      throw new VexFieldValidationError(
        collectionSlug,
        fieldName,
        `Unknown Field Type: ${(field as any).type}`,
      );
  }
}
