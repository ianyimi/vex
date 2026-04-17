import { applyBaseValidators } from "../validators/utils";
import type { SelectField } from "./types";

/**
 * Converts a select field definition to a Convex schema validator string.
 *
 * Generates a `v.array(v.union(...))` validator where each union member is a
 * `v.literal("value")` for each configured option. Wraps in `v.optional()`
 * when the field is not required.
 *
 * This function is used by the CLI during schema generation to build the Convex schema file.
 *
 * @param props - selectFieldToValidator() input props
 * @param props.field - The resolved select field definition
 * @returns Convex value type string, e.g. `v.array(v.union(v.literal("draft"), v.literal("published")))`
 *
 * @example
 * ```ts
 * const field1 = select({ required: true, options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }] })
 * selectFieldToValidator({ field: field1 })
 * // → 'v.array(v.union(v.literal("draft"), v.literal("published")))'
 *
 * const field2 = select({ required: false, options: [{ label: "Active", value: "active" }] })
 * selectFieldToValidator({ field: field2 })
 * // → 'v.optional(v.array(v.union(v.literal("active"))))'
 * ```
 *
 * @internal - Used by schema generation, not typically called by users
 */
export function selectFieldToValidator(props: { field: SelectField }): string {
  const { field } = props;
  const optionLiterals = field.options
    .map((o) => `v.literal("${o.value}")`)
    .join(", ");
  const validator = `v.array(v.union(${optionLiterals}))`;
  return applyBaseValidators({ field, validator });
}
