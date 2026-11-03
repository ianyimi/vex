/**
 * Structural equality over Convex values.
 *
 * Convex compares values by CONTENT, both in an index range and in a `.filter()`
 * expression. JS `===` compares arrays and objects by REFERENCE, so using it for the
 * predicate made the two compile targets disagree for every array-valued field —
 * which is every `relationship` and `select` field, since both store `v.array(...)`.
 *
 * The divergence was not symmetric, and one direction was unsafe: `eq` produced a
 * false NEGATIVE (the query returned a row the predicate then rejected, so a client
 * denied access the server had granted), while `neq` produced a false POSITIVE (the
 * predicate admitted a row the query had excluded). The second is the dangerous one,
 * and it is why this is content equality rather than a special case for `eq`.
 *
 * `undefined` equals `undefined`, which keeps "field missing" and "field explicitly
 * undefined" indistinguishable — matching how a document read through bracket access
 * behaves, and matching Convex, which stores neither.
 *
 * Also the general-purpose deep-equality helper for plain JSON-shaped values
 * (Convex documents contain only these), used anywhere two values need to be
 * compared by content rather than by reference.
 *
 * @param a - Left value.
 * @param b - Right value.
 * @returns `true` when the two values are structurally equal.
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  // `typeof null === "object"`, and `null` is a distinct Convex value from both
  // `undefined` and `{}` — bail before either composite branch can treat it as one.
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;

  if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) {
    if (!(a instanceof ArrayBuffer) || !(b instanceof ArrayBuffer)) return false;
    if (a.byteLength !== b.byteLength) return false;
    const left = new Uint8Array(a);
    const right = new Uint8Array(b);
    return left.every((byte, i) => byte === right[i]);
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => valuesEqual(item, b[i]));
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  return leftKeys.every((key) => key in right && valuesEqual(left[key], right[key]));
}
