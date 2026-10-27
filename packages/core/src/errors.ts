import { ConvexError } from "convex/values";

/**
 * A value `VexError` can carry: JSON-shaped and never `undefined`, so it
 * serializes on every backend (Convex rejects `undefined` in error data,
 * and an unserializable payload never reaches the client).
 */
export type VexErrorValue = string | number | boolean | null | VexErrorValue[] | { [key: string]: VexErrorValue };

/** Structured payload for a {@link VexError}. */
export type VexErrorData = { [key: string]: VexErrorValue };

/**
 * The error to throw from project code that Vex surfaces to editors —
 * a field's `validate()` today. Carries either a message or structured data
 * (a `code`, ids, a `message`), which the admin panel receives intact with
 * the failing `field` added.
 *
 * Import this instead of a database's own error class: the payload contract
 * is Vex's, so project code stays the same if the backend changes. On Convex
 * it is a `ConvexError`, which is what lets the data cross to the client.
 *
 * @example
 * ```ts
 * validate: async ({ value, doc, vex }) => {
 *   const [existing] = await vex.find({ collection: "pages", withIndex: { name: "by_slug", range: (q) => q.eq("slug", value) }, limit: 1 })
 *   if (existing && existing._id !== doc._id) {
 *     throw new VexError({ code: "SLUG_CONFLICT", message: "This slug is already in use." })
 *   }
 * }
 * ```
 */
export class VexError<TData extends string | VexErrorData = string | VexErrorData> extends ConvexError<TData> {
  /**
   * @param data - A message, or structured data. Include `message` in structured
   *   data for the text editors see.
   */
  constructor(data: TData) {
    super(data);
    this.name = "VexError";
  }
}
