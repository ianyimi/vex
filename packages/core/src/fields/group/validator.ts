import { adminFieldToValidator } from "../validators";
import { applyBaseValidators } from "../validators/utils";
import type { GroupField } from "./types";

/**
 * Converts a group field definition to a Convex schema validator string.
 *
 * Generates `v.object({ key: validator, ... })` where each sub-field's
 * validator is built by the existing `adminFieldToValidator` dispatch.
 * Sub-fields respect their own `required` setting — required sub-fields
 * emit bare validators; optional ones emit `v.optional(...)`.
 *
 * The outer object is wrapped in `v.optional(...)` when `field.required`
 * is `false`.
 *
 * @param props - Input props.
 * @param props.field - The resolved group field definition.
 * @returns A Convex validator string.
 *
 * @example
 * ```ts
 * const field = group({
 *   fields: { title: text({ required: true }), body: text() },
 * })
 * groupFieldToValidator({ field })
 * // → 'v.optional(v.object({ title: v.string(), body: v.optional(v.string()) }))'
 * ```
 *
 * @example
 * ```ts
 * const field = group({
 *   required: true,
 *   fields: { score: number({ required: true }) },
 * })
 * groupFieldToValidator({ field })
 * // → 'v.object({ score: v.number() })'
 * ```
 *
 * @internal — Used by CLI schema generation via `adminFieldToValidator`.
 */
export function groupFieldToValidator<TFieldMeta extends {} = {}>(props: {
  field: GroupField<TFieldMeta>;
}): string {
  const { field } = props;

  const subValidators = Object.entries(field.fields)
    .map(
      ([key, subField]) =>
        `${key}: ${adminFieldToValidator({ field: subField })}`,
    )
    .join(", ");

  return applyBaseValidators({
    field,
    validator: `v.object({ ${subValidators} })`,
  });
}
