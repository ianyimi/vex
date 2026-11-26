import { AdminDataField } from "../types";

/**
 * Wraps a Convex validator string in `v.nullable(...)` when the field is
 * nullable, then in `v.optional(...)` when the field is not required —
 * `v.optional(v.nullable(X))`, nullable innermost, never the reverse.
 *
 * @param props - handleOptionalValidators() input props
 * @param props.field - The resolved field definition, used to check `required`/`nullable`
 * @param props.validator - A Convex validator expression string (e.g. `"v.string()"`)
 * @returns The validator string, wrapped in `v.nullable(...)`/`v.optional(...)` as applicable
 *
 * @example
 * ```ts
 * applyBaseValidators({ field: requiredNullableField, validator: "v.string()" })
 * // → "v.nullable(v.string())"
 * applyBaseValidators({ field: optionalNullableField, validator: "v.string()" })
 * // → "v.optional(v.nullable(v.string()))"
 * ```
 */
export function applyBaseValidators(props: {
  field: AdminDataField;
  validator: string;
}): string {
  const nullableValidator = props.field.nullable ? `v.nullable(${props.validator})` : props.validator;
  if (props.field.required) {
    return nullableValidator;
  }
  return `v.optional(${nullableValidator})`;
}
