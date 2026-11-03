/**
 * Narrows `value` to a plain object — not `null`, not an array, and not any
 * other non-object primitive. The shared guard every `vex_views.state`
 * reader/writer uses (`saveView`'s input validation, `listViews`'/
 * `loadSharedSavedListViewWheres`' bad-row skip — polish fix, Decision 2): a saved
 * view's `state` is stored as `v.any()` on the wire, so a malformed or
 * legacy row (`null`, a bare string, an array) must never reach code that
 * assumes it can be indexed like `{ where?, sort?, ... }`.
 *
 * @param value - The value to check.
 * @returns Whether `value` is a non-null, non-array object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
