import { AdminField } from "../types";

/**
 * Wraps a Convex validator string in `v.optional()` when the field is not required.
 *
 * Used during schema generation to apply the correct Convex validator based on
 * whether the field is marked as required in its config.
 *
 * @param props - handleOptionalValidators() input props
 * @param props.field - The resolved field definition, used to check `required`
 * @param props.validator - A Convex validator expression string (e.g. `"v.string()"`)
 * @returns The validator string, wrapped in `v.optional(...)` if the field is optional
 *
 * @example
 * ```ts
 * handleOptionalValidators({ field: textField, validator: "v.string()" })
 * // required field  → "v.string()"
 * // optional field  → "v.optional(v.string())"
 * ```
 */
export function applyBaseValidators(props: {
  field: AdminField;
  validator: string;
}): string {
  if (props.field.required) {
    return props.validator;
  }
  return `v.optional(${props.validator})`;
}
