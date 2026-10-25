/**
 * Result of {@link parseJsonFieldText}: either a successful parse (`ok:
 * true`, carrying the parsed `value`) or a failure (`ok: false`, carrying a
 * human-readable `error` message).
 */
export type JsonFieldParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Serializes a JSON field's stored value into editor-displayable text.
 *
 * @param value - The field's current (or stored) value.
 * @returns Two-space-indented JSON text, or `""` for `undefined`.
 */
export function stringifyJsonFieldValue(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value, null, 2);
}

/**
 * Parses a JSON field's editor text into a committable value.
 *
 * Blank (or whitespace-only) text parses successfully to `undefined`,
 * clearing the field. Anything else is parsed with `JSON.parse`; a failure
 * returns the parser's own message, or `"Invalid JSON."` when the thrown
 * value isn't an `Error`.
 *
 * @param args - The editor text to parse.
 * @returns A discriminated success/failure result.
 */
export function parseJsonFieldText({ text }: { text: string }): JsonFieldParseResult {
  if (text.trim() === "") {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}
