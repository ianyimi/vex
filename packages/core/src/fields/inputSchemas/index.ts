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
export function adminFieldToInputSchema(props: { field: AdminField }) {
  // Captured before the switch narrows `props.field`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = props.field.type;

  switch (props.field.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.number.type:
      return numberFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.checkbox.type:
      return checkboxFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.date.type:
      return dateFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.select.type:
      return selectFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.url.type:
      return urlFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.color.type:
      return colorFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.group.type:
      return groupFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.blocks.type:
      return blocksFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.upload.type:
      return uploadFieldToInputSchema({ field: props.field });
    default: {
      const unhandled: never = props.field;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
  }
}
