import { ADMIN_FIELDS, type AdminFieldType } from "../constants";
import { AdminField } from "../types";
import { textFieldToValidator } from "../text";
import { numberFieldToValidator } from "../number";
import { checkboxFieldToValidator } from "../checkbox";
import { dateFieldToValidator } from "../date";
import { selectFieldToValidator } from "../select";
import { urlFieldToValidator } from "../url";
import { colorFieldToValidator } from "../color";
import { relationshipFieldToValidator } from "../relationship";
import { arrayFieldToValidator } from "../array";
import { groupFieldToValidator } from "../group";
import { blocksFieldToValidator } from "../blocks";
import { uploadFieldToValidator } from "../upload";

/**
 * Converts any field definition to its Convex schema validator string.
 *
 * Dispatches to the field-type-specific validator function based on `field.type`.
 * Used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @returns A Convex validator string (e.g. `"v.string()"`, `"v.optional(v.boolean())"`)
 * @throws An Error if an unrecognized field type is given. Reaching this is a
 * compile error: the default arm binds the exhausted union to `never`, so a new
 * member of `AdminField` fails typecheck here until a case is added
 *
 * @see {@link textFieldToValidator} for the text field implementation
 * @see {@link numberFieldToValidator} for the number field implementation
 * @see {@link checkboxFieldToValidator} for the checkbox field implementation
 * @internal
 */
export function adminFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: AdminField<TFieldMeta>;
}) {
  // Captured before the switch narrows `props.field`: inside the default arm the
  // union is exhausted to `never`, and `never.type` is not a usable string.
  const fieldType: AdminFieldType = props.field.type;

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
    case ADMIN_FIELDS.color.type:
      return colorFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.relationship.type:
      return relationshipFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.array.type:
      return arrayFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.group.type:
      return groupFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.blocks.type:
      return blocksFieldToValidator({ field: props.field });
    case ADMIN_FIELDS.upload.type:
      return uploadFieldToValidator({ field: props.field });
    default: {
      const unhandled: never = props.field;
      throw new Error(
        `unrecognized field type: ${fieldType} — ${JSON.stringify(unhandled)}`,
      );
    }
  }
}
