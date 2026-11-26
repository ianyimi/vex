import * as z from "zod";
import type { ZodType } from "zod";
import { NumberField } from "./types";
import { isInt64NumberField } from "./utils";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a number field value in the admin form.
 *
 * Applies `min`/`max` constraints by composing them onto the same schema
 * chain built for `required`, rather than reassigning over it — a required
 * field with `min`/`max` configured keeps every check (CORE-1). Required
 * fields attach `{ error: "This field is required." }` to the base
 * `z.number()`/`z.bigint()` call and never receive `.default()`, matching
 * `applyBaseInputSchemaMeta`'s `.optional()` gate — a number has no "empty"
 * state distinct from "missing", so no `.min(1)` is added (unlike `text`).
 * A non-required field only receives `.default()` when the author set an
 * explicit `defaultValue` (`number()`'s own default is `undefined` — no
 * silent `0`/`BigInt(0)` pre-fill, matching `date()`'s `undefined`): an
 * empty optional number stays `undefined` through the schema the same way
 * it arrived. An `int64` field (`isInt64NumberField`) runs the same shape
 * through `z.bigint()` instead, with `bigint` limits and default.
 *
 * @param props - Input props.
 * @param props.field - The resolved number field definition
 * @returns A Zod number or bigint schema with range constraints and optionality applied
 *
 * @example
 * ```ts
 * const field = number({ required: true, min: 0, max: [100, "Too large."] })
 * numberFieldToInputSchema({ field })
 * // → z.number({ error: "This field is required." }).min(0).max(100, "Too large.")
 *
 * const int64Field = number({ schema: { validator: "int64" }, defaultValue: 0n, min: 0n })
 * numberFieldToInputSchema({ field: int64Field })
 * // → z.bigint().min(0n).default(0n)
 * ```
 */
export function numberFieldToInputSchema(props: { field: NumberField }): ZodType {
  const { field } = props;

  const requiredError = "This field is required.";

  if (isInt64NumberField(field)) {
    let int64InputSchema = field.required ? z.bigint({ error: requiredError }) : z.bigint();

    if (field.min) {
      int64InputSchema = int64InputSchema.min(field.min[0], field.min[1]);
    }
    if (field.max) {
      int64InputSchema = int64InputSchema.max(field.max[0], field.max[1]);
    }

    if (field.required || field.defaultValue === undefined) {
      return applyBaseInputSchemaMeta({ field, inputSchema: int64InputSchema });
    }

    let int64DefaultValue = field.defaultValue;
    if (field.min && int64DefaultValue < field.min[0]) {
      int64DefaultValue = field.min[0];
    }
    if (field.max && int64DefaultValue > field.max[0]) {
      int64DefaultValue = field.max[0];
    }

    return applyBaseInputSchemaMeta({
      field,
      inputSchema: int64InputSchema.default(int64DefaultValue),
    });
  }

  let inputSchema = field.required ? z.number({ error: requiredError }) : z.number();

  if (field.min) {
    inputSchema = inputSchema.min(field.min[0], field.min[1]);
  }
  if (field.max) {
    inputSchema = inputSchema.max(field.max[0], field.max[1]);
  }

  if (field.required || field.defaultValue === undefined) {
    return applyBaseInputSchemaMeta({ field, inputSchema });
  }

  let defaultValue = field.defaultValue;
  if (field.min && defaultValue < field.min[0]) {
    defaultValue = field.min[0];
  }
  if (field.max && defaultValue > field.max[0]) {
    defaultValue = field.max[0];
  }

  return applyBaseInputSchemaMeta({
    field,
    inputSchema: inputSchema.default(defaultValue),
  });
}
