import { ConvexError } from "convex/values";
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Shape of the structured payload this framework's own server-side
 * `ConvexError`s carry — field validation failures (`fields/utils.ts`'s `validateFields`),
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

/**
 * Applies a caught write-mutation error's field-specific detail onto a
 * TanStack Form instance, so the SAME `FormError` display every field input
 * already renders through (`components/form/FormError.tsx`, which reads
 * `field.state.meta.errors[0]`) shows it — no separate error UI. Setting
 * `errorMap.onSubmit` is what TanStack Form's own `errors` derivation reads
 * from (`field.state.meta.errors` is recomputed from `errorMap`'s values on
 * every store update, confirmed against the installed `@tanstack/form-core`
 * version), so this is the supported way to inject a server-side error
 * outside the library's own `validate()` lifecycle.
 *
 * Recognizes exactly the two `ConvexError` shapes `prepareEdit`'s strict
 * pass (`publishShared`, matching `create`'s own strict path) can throw:
 * - `{ message, field }` (`validateFields.ts`'s normalized shape, also what
 *   `assertNoDraftRelationships` throws) — one named field. A project's own
 *   extra `ConvexError` data keys ride alongside and are ignored here.
 * - `{ message, errors }` (a Zod schema failure) — `errors` is
 *   `ZodError.message`, which is `JSON.stringify(issues, null, 2)` by
 *   default (confirmed against the installed `zod` version), so it parses
 *   back into `{ path, message }[]`; every issue's `path[0]` names a
 *   top-level field.
 *
 * Never throws — an error that matches neither shape (or a Zod `errors`
 * string that fails to parse) is a silent no-op; `useVexMutation`'s own
 * generic `"Publish failed"` toast (via its `errorToast` option) already
 * covers that case.
 *
 * @param form - The edit view's form instance.
 * @param error - The value caught from the failed mutation call.
 * @returns Nothing. Field-level errors, if any were found, are already
 *   applied to `form`'s meta by the time this returns.
 *
 * @example
 * ```ts
 * try {
 *   await publishMutation({ collection, id });
 * } catch (error) {
 *   applyVexFieldErrors(form, error);
 * }
 * ```
 */
export function applyVexFieldErrors(form: AnyFormApi, error: unknown): void {
  if (!(error instanceof ConvexError)) return;
  const data = error.data;
  if (data === null || typeof data !== "object") return;
  const { field, errors, message } = data as {
    field?: unknown;
    errors?: unknown;
    message?: unknown;
  };

  if (typeof field === "string") {
    form.setFieldMeta(field, (prev) => ({
      ...prev,
      errorMap: {
        ...prev.errorMap,
        onSubmit: typeof message === "string" ? message : "Invalid value",
      },
    }));
    return;
  }

  if (typeof errors === "string") {
    let issues: unknown;
    try {
      issues = JSON.parse(errors);
    } catch {
      return;
    }
    if (!Array.isArray(issues)) return;
    for (const issue of issues) {
      if (
        issue === null ||
        typeof issue !== "object" ||
        !Array.isArray((issue as { path?: unknown }).path) ||
        (issue as { path: unknown[] }).path.length === 0 ||
        typeof (issue as { message?: unknown }).message !== "string"
      ) {
        continue;
      }
      const fieldName = String((issue as { path: unknown[] }).path[0]);
      const issueMessage = (issue as { message: string }).message;
      form.setFieldMeta(fieldName, (prev) => ({
        ...prev,
        errorMap: { ...prev.errorMap, onSubmit: issueMessage },
      }));
    }
  }
}
