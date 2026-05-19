import { ADMIN_FIELDS } from "../constants";
import { AdminField } from "../types";
import { textFieldToInputSchema } from "../text";
import { numberFieldToInputSchema } from "../number";
import { checkboxFieldToInputSchema } from "../checkbox";
import { dateFieldToInputSchema } from "../date";
import { selectFieldToInputSchema } from "../select";
import { urlFieldToInputSchema } from "../url";
import { relationshipFieldToInputSchema } from "../relationship";
import { arrayFieldToInputSchema } from "../array";

/**
 * Converts any field definition to its form input schema using zod.
 *
 * Dispatches to the field-type-specific input schema function based on `field.type`.
 * Used by the admin panel while form rendering to build the form input for individual fields, collections, blocks, and globals.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @returns A ZodType (e.g. `z.string()`, `z.boolean().optional().default(false)`)
 * @throws An Error if an unrecognized field type is given
 *
 * @see {@link textFieldToInputSchema} for the text field implementation
 * @see {@link numberFieldToInputSchema} for the number field implementation
 * @see {@link checkboxFieldToInputSchema} for the checkbox field implementation
 * @internal
 */
export function adminFieldToInputSchema(props: { field: AdminField }) {
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
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToInputSchema({ field: props.field });
    default:
      throw new Error("unrecognized field type");
  }
}
