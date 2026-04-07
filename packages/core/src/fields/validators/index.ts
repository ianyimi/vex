import { ADMIN_FIELDS } from "../constants";
import { AdminField } from "../types";
import { textFieldToValidator } from "../text/validator";

/**
 * Converts any field definition to its Convex schema validator string.
 *
 * Dispatches to the field-type-specific validator function based on `field.type`.
 * Used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @returns A Convex validator string (e.g. `"v.string()"`, `"v.optional(v.number())"`)
 *
 * @see {@link textFieldToValidator} for the text field implementation
 * @internal
 */
export function adminFieldToValidator(props: { field: AdminField }) {
  switch (props.field.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToValidator({ field: props.field });
  }
}
