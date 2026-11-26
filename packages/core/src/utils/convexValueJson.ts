import { convexToJson, jsonToConvex, type Value } from "convex/values";

function stringifyConvexValueReplacer(nonce: string): (key: string, value: unknown) => unknown {
  return (_key: string, value: unknown): unknown => {
    if (typeof value === "bigint") return `\u0000vex:bigint:${nonce}:${value.toString()}`;
    if (value instanceof ArrayBuffer) return `<${value.byteLength} bytes>`;
    return value;
  };
}

/**
 * Display-only JSON serialization of a Convex value — never throws on a
 * `bigint` (int64) or an `ArrayBuffer` (bytes), both of which make the
 * native `JSON.stringify` throw.
 *
 * `bigint` renders as bare decimal digits, unquoted (`{"count":
 * 9007199254740993}`), so a reader sees the real integer rather than a
 * string. `ArrayBuffer` renders as `"<N bytes>"` — the byte count, not the
 * bytes themselves, matching the `bytes()` field's own cell convention.
 * Lossy and one-way: use {@link serializeConvexValue}/
 * {@link parseConvexValue} where a round trip is required.
 *
 * The bigint marker embeds a fresh `crypto.randomUUID()` nonce on every
 * call, so a string VALUE that happens to look like the marker (e.g. a
 * `text()` field someone filled with `"\u0000vex:bigint:5"`) can never
 * collide with it and render unquoted — only a value this same call
 * itself replaced can match the nonce it generated.
 *
 * @param props.value - The value to serialize.
 * @param props.space - Passed through to `JSON.stringify`'s own `space` argument.
 * @returns The serialized string.
 */
export function stringifyConvexValue(props: { value: unknown; space?: number }): string {
  const nonce = crypto.randomUUID();
  const json = JSON.stringify(props.value, stringifyConvexValueReplacer(nonce), props.space);
  if (json === undefined) return "undefined";
  const escapedNul = JSON.stringify("\u0000").slice(1, -1).replace(/\\/g, "\\\\");
  return json.replace(new RegExp(`"${escapedNul}vex:bigint:${nonce}:(-?\\d+)"`, "g"), "$1");
}

/**
 * Lossless JSON serialization of a Convex value, via `convexToJson` — a
 * `bigint`/`ArrayBuffer`-safe round trip with {@link parseConvexValue},
 * unlike {@link stringifyConvexValue}'s display-only, one-way rendering.
 *
 * @param props.value - The Convex value to serialize.
 * @returns The serialized string.
 */
export function serializeConvexValue(props: { value: unknown }): string {
  return JSON.stringify(convexToJson(props.value as Value));
}

/**
 * Reverses {@link serializeConvexValue}, via `jsonToConvex`.
 *
 * @param props.text - The serialized string.
 * @returns The original Convex value.
 */
export function parseConvexValue(props: { text: string }): unknown {
  return jsonToConvex(JSON.parse(props.text));
}
