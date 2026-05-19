import { ADMIN_FIELDS } from "../constants";
import { AdminField } from "../types";
import { textFieldToValidator } from "../text";
import { numberFieldToValidator } from "../number";
import { checkboxFieldToValidator } from "../checkbox";
import { dateFieldToValidator } from "../date";
import { selectFieldToValidator } from "../select";
import { urlFieldToValidator } from "../url";
import { relationshipFieldToValidator } from "../relationship";
import { arrayFieldToValidator } from "../array";

/**
 * Converts any field definition to its Convex schema validator string.
 *
 * Dispatches to the field-type-specific validator function based on `field.type`.
 * Used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @returns A Convex validator string (e.g. `"v.string()"`, `"v.optional(v.boolean())"`)
 * @throws An Error if an unrecognized field type is given
 *
 * @see {@link textFieldToValidator} for the text field implementation
 * @see {@link numberFieldToValidator} for the number field implementation
 * @see {@link checkboxFieldToValidator} for the checkbox field implementation
 * @internal
 */
export function adminFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: AdminField<TFieldMeta>;
}) {
  switch (props.field.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.number.type:
      return numberFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.checkbox.type:
      return checkboxFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.date.type:
      return dateFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.select.type:
      return selectFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.url.type:
      return urlFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToValidator({ field: props.field });
    default:
      throw new Error("unrecognized field type");
  }
}
