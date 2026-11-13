import type { HiddenDocument } from "./types";

/**
 * True when a populated field's value is a `populateDocs`-produced
 * {@link HiddenDocument} placeholder rather than a real target doc.
 *
 * Generic over the real doc type `T` so the type predicate narrows a
 * `T | HiddenDocument` union BOTH ways: the `true` branch narrows to
 * `HiddenDocument`, the `false` branch narrows to `T` — no manual cast
 * needed on either side, unlike an `unknown`-typed guard.
 *
 * @param value - The populated field's resolved value to check.
 * @returns Whether `value` is a {@link HiddenDocument}.
 */
export function isHiddenDocument<T>(value: T | HiddenDocument): value is HiddenDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).code === "ACCESS_DENIED"
  );
}
