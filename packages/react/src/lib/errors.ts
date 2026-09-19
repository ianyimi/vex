import { ConvexError } from "convex/values";

/**
 * Shape of the structured payload this framework's own server-side
 * `ConvexError`s carry — field validation failures (`collections/validateFields.ts`),
 * schema failures (`api/create|update/server.ts`), and RBAC denials
 * (`VexAccessError`) all pass an object with some combination of these keys.
 */
interface StructuredErrorData {
  error?: unknown;
  errors?: unknown;
  message?: unknown;
}

/**
 * Extracts the most specific human-readable message from anything a Convex
 * mutation or query can throw or reject with. Never throws.
 *
 * Checks, in order: a `ConvexError` whose `data` is a plain string; a
 * `ConvexError` whose `data` is an object, preferring `data.error` (a single
 * field's validation reason, e.g. `validateFields`'s `{ message, field, error }`)
 * over `data.errors` (a Zod schema failure's formatted message) over
 * `data.message` (a generic fallback, e.g. `VexAccessError`'s denial reason);
 * any other `Error`'s `.message`; otherwise a generic string.
 *
 * @param error - The error caught from a Convex mutation/query call, or any thrown value.
 * @returns The most specific message available for display to a user.
 *
 * @example
 * ```ts
 * try {
 *   await mutateAsync({ collection: "pages", data });
 * } catch (error) {
 *   toastManager.add({ title: "Save failed", description: getVexErrorMessage(error), type: "error" });
 * }
 * ```
 */
export function getVexErrorMessage(error: unknown): string {
  if (error instanceof ConvexError) {
    const data: unknown = error.data;
    if (typeof data === "string") return data;
    if (data !== null && typeof data === "object") {
      const structured = data as StructuredErrorData;
      if (typeof structured.error === "string") return structured.error;
      if (typeof structured.errors === "string") return structured.errors;
      if (typeof structured.message === "string") return structured.message;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}
