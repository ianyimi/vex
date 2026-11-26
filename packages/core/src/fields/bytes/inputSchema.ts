import * as z from "zod";
import type { ZodType } from "zod";
import { BytesField } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { formatBytes } from "../../media/utils";

/**
 * Builds a Zod schema for validating a bytes field value in the admin form.
 *
 * `z.instanceof(ArrayBuffer)` plus a size `.refine()` against `field.maxSize` —
 * the same limit the admin form's File/Hex control enforces client-side. A
 * required field rejects `undefined` with "This field is required."; a
 * non-required field accepts a missing value.
 *
 * @param props - Input props.
 * @param props.field - The resolved bytes field definition
 * @returns A Zod schema accepting an `ArrayBuffer` no larger than `field.maxSize`
 *
 * @example
 * ```ts
 * const field = bytes({ required: true, maxSize: 4 })
 * bytesFieldToInputSchema({ field })
 * // → z.instanceof(ArrayBuffer).refine(...) — rejects undefined and >4-byte buffers
 * ```
 */
export function bytesFieldToInputSchema(props: { field: BytesField }): ZodType {
  const { field } = props;
  const requiredError = "This field is required.";
  const sizeMessage = `Must be ${formatBytes(field.maxSize)} or smaller.`;

  const inputSchema: ZodType = field.required
    ? z
        .instanceof(ArrayBuffer, { error: requiredError })
        .refine((value) => value.byteLength <= field.maxSize, sizeMessage)
    : z.instanceof(ArrayBuffer).refine((value) => value.byteLength <= field.maxSize, sizeMessage);

  return applyBaseInputSchemaMeta({ field, inputSchema });
}
