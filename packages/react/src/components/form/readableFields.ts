import type { ZodObject } from "zod";

/**
 * Removes read-denied fields from a form's default values.
 *
 * A field the caller may not read is absent from the server's response and is
 * never rendered, so it must not exist in form state either. Leaving it there
 * would seed a value the caller cannot see, let `changedValues` submit it, and
 * — when the field is required — fail client validation on something the
 * caller can neither view nor fill.
 *
 * @param values - Default values built from the resource's full field list.
 * @param readableFieldKeys - Keys the caller may read; `undefined` means
 *   unrestricted, and `values` is returned untouched.
 * @returns `values` itself when unrestricted, else a copy without denied keys.
 */
export function pickReadableValues(
  values: Record<string, unknown>,
  readableFieldKeys: readonly string[] | undefined,
): Record<string, unknown> {
  if (readableFieldKeys === undefined) return values;

  const readable = new Set(readableFieldKeys);
  const picked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (readable.has(key)) picked[key] = value;
  }
  return picked;
}

/**
 * Restricts a resource's input schema to the fields the caller may read.
 *
 * The companion to {@link pickReadableValues}: a field absent from form state
 * must also be absent from the schema validating that state, or a required
 * read-denied field blocks submission with an error that has nowhere to render
 * (its input was never mounted, so the form silently refuses to submit).
 *
 * This narrows client-side validation only. Every write is still validated
 * server-side against the MERGED stored document, so a field omitted here
 * remains required to be valid in the database.
 *
 * @param schema - The resource's full input schema.
 * @param readableFieldKeys - Keys the caller may read; `undefined` means
 *   unrestricted, and `schema` is returned untouched.
 * @returns `schema` itself when unrestricted or already narrow enough, else the
 *   schema picked down to its readable keys.
 */
export function pickReadableSchema(
  schema: ZodObject,
  readableFieldKeys: readonly string[] | undefined,
): ZodObject {
  if (readableFieldKeys === undefined) return schema;

  const declared = Object.keys(schema.shape);
  const readable = new Set(readableFieldKeys);
  if (declared.every((key) => readable.has(key))) return schema;

  const mask: Record<string, true> = {};
  for (const key of declared) {
    if (readable.has(key)) mask[key] = true;
  }
  return schema.pick(mask);
}
