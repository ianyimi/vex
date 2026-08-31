import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import type { ColorField } from "./types";

/**
 * Converts a colour field definition to a Convex schema validator string.
 *
 * Colour fields are stored as plain strings in Convex — the notation (and the
 * `var(--token)` alternative allowed by `themeColors`) is enforced at the admin
 * form layer, not in the database schema. This function generates only the type
 * constraint, so changing `format` never triggers a schema migration.
 *
 * @param props - Input props.
 * @param props.field - The resolved colour field definition.
 * @returns Convex validator string: `"v.string()"` for required fields,
 * `"v.optional(v.string())"` for optional fields.
 *
 * @example
 * ```ts
 * colorFieldToValidator({ field: color({ required: true }) })   // "v.string()"
 * colorFieldToValidator({ field: color({ required: false }) })  // "v.optional(v.string())"
 * ```
 *
 * @see {@link colorFieldToInputSchema} for the admin-form Zod schema that enforces the notation
 * @internal Used by schema generation, not typically called directly.
 */
export function colorFieldToValidator(props: { field: ColorField }): string {
  return applyBaseValidators({
    field: props.field,
    validator: ADMIN_FIELDS.color.validator,
  });
}
