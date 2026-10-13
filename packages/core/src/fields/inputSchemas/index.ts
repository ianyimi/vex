import { ADMIN_FIELDS, type AdminFieldType } from "../constants";
import { AdminField } from "../types";
import { textFieldToInputSchema } from "../text";
import { numberFieldToInputSchema } from "../number";
import { checkboxFieldToInputSchema } from "../checkbox";
import { dateFieldToInputSchema } from "../date";
import { selectFieldToInputSchema } from "../select";
import { urlFieldToInputSchema } from "../url";
import { colorFieldToInputSchema } from "../color";
import { relationshipFieldToInputSchema } from "../relationship";
import { arrayFieldToInputSchema } from "../array";
import { groupFieldToInputSchema } from "../group";
import { blocksFieldToInputSchema } from "../blocks";
import { uploadFieldToInputSchema } from "../upload";

/**
 * Converts any field definition to its form input schema using zod.
 *
 * Dispatches to the field-type-specific input schema function based on `field.type`.
 * Used by the admin panel while form rendering to build the form input for individual fields, collections, blocks, and globals.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @param props.ignoreRequired - When true, this field — and, recursively,
 *   every sub-field a container type (`group`/`array`/`blocks`) dispatches
 *   back through this function — is built as if `required: false`, by
 *   overriding `field.required` before dispatch rather than duplicating
 *   per-type builder logic. A configured `min`/`max` still applies to a
 *   non-empty value exactly as it does for an optional field today; only the
 *   "must be present/non-empty" check `required` itself adds is skipped.
 *   Used by `getFieldsInputSchema`'s own `ignoreRequired` for draft saves
 *   (`prepareEdit`, `saveDraft` — a draft may omit required fields at any
 *   depth).
 * @returns A ZodType (e.g. `z.string()`, `z.boolean().optional().default(false)`)
 * @throws An Error if an unrecognized field type is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`, so a new
 * member of `AdminField` fails typecheck here until a case is added
 *
 * @see {@link textFieldToInputSchema} for the text field implementation
 * @see {@link numberFieldToInputSchema} for the number field implementation
 * @see {@link checkboxFieldToInputSchema} for the checkbox field implementation
 * @internal
 */
export function adminFieldToInputSchema(props: {
  field: AdminField;
  ignoreRequired?: boolean;
}) {
  const effectiveField: AdminField = props.ignoreRequired
    ? { ...props.field, required: false }
    : props.field;
  // Captured before the switch narrows `effectiveField`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = effectiveField.type;

  switch (effectiveField.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.number.type:
      return numberFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.checkbox.type:
      return checkboxFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.date.type:
      return dateFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.select.type:
      return selectFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.url.type:
      return urlFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.color.type:
      return colorFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToInputSchema({ field: effectiveField });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
      });
    case ADMIN_FIELDS.group.type:
      return groupFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
      });
    case ADMIN_FIELDS.blocks.type:
      return blocksFieldToInputSchema({
        field: effectiveField,
        ignoreRequired: props.ignoreRequired,
      });
    case ADMIN_FIELDS.upload.type:
      return uploadFieldToInputSchema({ field: effectiveField });
    default: {
      const unhandled: never = effectiveField;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
  }
}
