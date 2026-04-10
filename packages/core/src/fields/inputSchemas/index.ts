import { ADMIN_FIELDS } from "../constants";
import { AdminField } from "../types";
import { textFieldToInputSchema } from "../text/inputSchema";
import { numberFieldToInputSchema } from "../number";

/**
 * Converts any field definition to its form input schema using zod.
 *
 * Dispatches to the field-type-specific input schema function based on `field.type`.
 * Used by the admin panel while form rendering to build the form input for individual fields, collections, blocks, and globals.
 *
 * @param props Input props
 * @param props.field - The resolved field definition to convert
 * @returns A ZodSchema (e.g. `"z.string()"`, `"z.number().optional().default(0)"`)
 * @throws An Error if an unresolved field type is given
 *
 * @see {@link textFieldToInputSchema} for the text field implementation
 * @internal
 */
export function adminFieldToInputSchema(props: { field: AdminField }) {
  switch (props.field.type) {
    case ADMIN_FIELDS.text.type:
      return textFieldToInputSchema({ field: props.field });
    case ADMIN_FIELDS.number.type:
      return numberFieldToInputSchema({ field: props.field });
    default:
      throw new Error("unrecognized field type");
  }
}
