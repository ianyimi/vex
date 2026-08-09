import { z, ZodType } from "zod";
import { ArrayField, ArrayType } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { adminFieldToInputSchema } from "../inputSchemas";

/**
 * Builds a Zod schema for validating an array field value in the admin form.
 *
 * Wraps the nested item schema in `z.array(…)`, applies `min`/`max` item count
 * constraints when configured, then wraps in `.optional()` for non-required
 * fields via `applyBaseInputSchemaMeta`. The item schema is built
 * recursively by delegating to `adminFieldToInputSchema` for the nested field.
 *
 * @param props - Input props.
 * @param props.field - The resolved array field definition
 * @returns A Zod array schema with item count constraints, a baked-in `.default(field.defaultValue)`, and optionality applied
 *
 * @example
 * ```ts
 * const field = array({ items: text(), required: true })
 * arrayFieldToInputSchema({ field })
 * // → z.array(z.string()).superRefine(...).default([])
 * ```
 *
 * @example
 * ```ts
 * const field = array({ items: number(), min: { value: 1 }, max: { value: 5 } })
 * arrayFieldToInputSchema({ field })
 * // → z.array(z.number()).min(1).max(5).default([])
 * ```
 */
export function arrayFieldToInputSchema<
  TArrayType extends ArrayType = string,
  TFieldMeta extends {} = {},
>(props: { field: ArrayField<TArrayType, TFieldMeta> }): ZodType {
  const { field } = props;

  const fieldMinError = field.min?.error ?? "This field is too short.";
  const fieldMaxError = field.max?.error ?? "This field is too long.";

  const itemsInputSchema = adminFieldToInputSchema({ field: field.items });
  let inputSchema = z.array(itemsInputSchema).default(field.defaultValue ?? []);
  if (field.required) {
    // Use superRefine which has more control over issues
    inputSchema = z
      .array(itemsInputSchema)
      .superRefine((val, ctx) => {
        if (val === undefined || val === null) {
          ctx.addIssue({
            code: "custom",
            message: "This field is required.",
          });
        }
      })
      .default(field.defaultValue ?? []);
  }
  if (field.min) {
    if (field.max) {
      inputSchema = z
        .array(itemsInputSchema)
        .min(field.min.value, fieldMinError)
        .max(field.max.value, fieldMaxError)
        .default(field.defaultValue ?? []);
    } else {
      inputSchema = z
        .array(itemsInputSchema)
        .min(field.min.value, fieldMinError)
        .default(field.defaultValue ?? []);
    }
  } else if (field.max) {
    inputSchema = z
      .array(itemsInputSchema)
      .max(field.max.value, fieldMaxError)
      .default(field.defaultValue ?? []);
  }

  let finalSchema = inputSchema;

  // Apply default value for non-required fields
  if (!field.required && field.defaultValue !== undefined) {
    // @ts-expect-error matching default types here
    finalSchema = inputSchema.default(field.defaultValue);
  }

  // @ts-expect-error matching inputSchema types
  finalSchema = applyBaseInputSchemaMeta({
    field,
    inputSchema: finalSchema,
  });

  return finalSchema;
}
