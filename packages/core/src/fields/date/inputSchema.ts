import { z, ZodType, ZodNumber, ZodDefault } from "zod";
import { DateField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";

/**
 * Builds a Zod schema for validating a date field value in the admin form.
 *
 * Date values are Unix timestamps in milliseconds, so the base schema is
 * `z.number()`. For required fields a `.default(Date.now())` is applied so
 * the picker always has an initial value. Non-required fields are wrapped
 * in `.optional()` via `applyBaseInputSchemaMeta`.
 *
 * @param props - Input props.
 * @param props.field - The resolved date field definition
 * @returns A Zod number schema with optionality applied
 *
 * @example
 * ```ts
 * const field = date({ required: true })
 * dateFieldToInputSchema({ field })
 * // → z.number().default(<now>)
 *
 * const optField = date({ required: false })
 * dateFieldToInputSchema({ field: optField })
 * // → z.number().optional()
 * ```
 */
export function dateFieldToInputSchema(props: { field: DateField }): ZodType {
  const { field } = props;

  let inputSchema: ZodNumber | ZodDefault<ZodNumber> = z.number();
  if (field.required) {
    inputSchema = z.number().default(new Date().getTime());
  }

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
