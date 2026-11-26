/** Convex `v.record()` keys: non-empty ASCII, never starting with `"$"` or `"_"`. */
const RESERVED_RECORD_KEY_PREFIXES = ["$", "_"] as const;

/**
 * Whether `key` is a legal Convex record key: non-empty, ASCII-only, and not
 * starting with `"$"` (Convex-internal) or `"_"` (reserved for system fields).
 * Applies to both default `v.string()` keys and the entered side of a
 * `v.id(collection)` key — a real id never collides with either prefix.
 *
 * @param key - The candidate record key.
 * @returns `true` if `key` is a legal Convex record key.
 */
export function isValidRecordKey(key: string): boolean {
  return (
    key.length > 0 &&
    isAsciiOnly(key) &&
    !RESERVED_RECORD_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

/**
 * Whether every character in `value` is an ASCII code point (`0x00`–`0x7F`).
 * A plain code-unit scan rather than a `/^[\x00-\x7F]+$/` regex — ESLint's
 * `no-control-regex` flags the `\x00` lower bound as an unexpected control
 * character in a regex literal, and NUL is a legal (if unusual) leading
 * byte of a Convex record key, so the range can't be narrowed to dodge it.
 *
 * @param value - The string to check.
 * @returns `true` if every character code is in `0x00`–`0x7F`.
 */
function isAsciiOnly(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    if (value.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}
