import type { VexConfig } from "./types";

/**
 * A version of `VexConfig` safe to pass across RSC / JSON serialization
 * boundaries. All non-serializable values (functions, React components, class
 * instances, symbols) are replaced with `null`. The shape is otherwise
 * identical to `VexConfig` — serializable fields retain their types.
 *
 * Produced by {@link sanitizeConfigForClient}.
 *
 * @see {@link VexConfig} for the full server-side config
 * @see {@link sanitizeConfigForClient} for the sanitization function
 */
export type ClientVexConfig = Sanitized<Omit<VexConfig, "access">>;

/**
 * Recursively replaces all non-serializable values in a type with `null`.
 *
 * - Functions → `null`
 * - Symbols → `null`
 * - Class instances → `null`
 * - Arrays → element type recursively sanitized
 * - Plain objects → property types recursively sanitized
 * - Primitives (string, number, boolean, null, undefined) → unchanged
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sanitized<T> = T extends (...args: any[]) => any
  ? null
  : T extends symbol
    ? null
    : T extends Array<infer U>
      ? Sanitized<U>[]
      : T extends object
        ? { [K in keyof T]: Sanitized<T[K]> }
        : T;

// ─── Runtime helpers ─────────────────────────────────────────────────────────

/**
 * Returns `true` if `value` is a plain object (created via `{}` or
 * `Object.create(null)`). Class instances, arrays, null, and functions all
 * return `false`.
 *
 * @internal
 * @param value - object to check
 * @returns boolean
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursively strips all non-serializable values from an arbitrary value tree.
 *
 * Rules:
 * - `null` / `undefined` → `null`
 * - `function` → `null` (covers React components and callbacks)
 * - `symbol` → `null`
 * - Primitive (string, number, boolean) → returned as-is
 * - Array → each element recursively processed
 * - Plain object (`{}`) → each property recursively processed
 * - Class instance (non-plain object) → `null`
 *
 * This function is intentionally exhaustive so that new non-serializable
 * properties added anywhere in `VexConfig` are stripped automatically without
 * requiring manual additions to `sanitizeConfigForClient`.
 *
 * @param value - Any value to sanitize.
 * @returns A JSON-serializable version of `value`, with non-serializable
 *   leaves replaced by `null`.
 *
 * @internal
 */
export function stripNonSerializable(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "function") return null;
  if (typeof value === "symbol") return null;
  if (typeof value === "bigint") return null;

  // Primitives are already serializable
  if (typeof value !== "object") return value;

  if (Array.isArray(value)) {
    // Recurse into every element — primitives pass through unchanged,
    // class instances become null, nested objects/arrays are processed recursively.
    return value.map((item) => stripNonSerializable(item));
  }

  // Only recurse into plain objects — class instances (React elements, Zod
  // schemas, etc.) are treated as opaque and replaced with null.
  if (!isPlainObject(value)) return null;

  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    result[k] = stripNonSerializable(v);
  }
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Strips all non-serializable values from a `VexConfig` for safe passage
 * across RSC / JSON serialization boundaries (e.g. server layout →
 * client component).
 *
 * Uses {@link stripNonSerializable} to recursively walk the entire config
 * tree, replacing functions, React components, class instances, and symbols
 * with `null`. Adding a new non-serializable property anywhere in the config
 * is handled automatically — no manual additions needed here.
 *
 * The `access` config is always omitted from the client version — it is
 * never needed client-side and contains permission functions that cannot
 * be serialized.
 *
 * @param config - The fully resolved server-side VexCMS config.
 * @returns A deeply sanitized copy safe to pass to client components.
 *
 * @example
 * ```ts
 * // In a Next.js server component (e.g. AdminLayout):
 * import vexConfig from "~/convex/vex.config";
 * import { sanitizeConfigForClient } from "@vexcms/core";
 *
 * const clientConfig = sanitizeConfigForClient(vexConfig);
 * return <AdminShell config={clientConfig} />;
 * ```
 *
 * @see {@link ClientVexConfig} for the sanitized type
 * @see {@link stripNonSerializable} for the recursive sanitizer
 */
export function sanitizeConfigForClient(config: VexConfig): ClientVexConfig {
  // Drop storage adapters (class instances) and the access config up front.
  // Access is deliberately server-only: its callbacks cannot serialize (a
  // nulled matrix would misresolve in hasPermission), client checks are
  // advisory at best, and permission policy should not ship to the browser.
  const { storage, access, ...rest } = config;
  return stripNonSerializable(rest) as ClientVexConfig;
}
