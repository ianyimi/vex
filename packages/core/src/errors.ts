import { ConvexError } from "convex/values";

/**
 * A value `VexError` can carry: JSON-shaped and never `undefined`, so it
 * serializes on every backend (Convex rejects `undefined` in error data,
 * and an unserializable payload never reaches the client).
 */
export type VexErrorValue = string | number | boolean | null | VexErrorValue[] | { [key: string]: VexErrorValue };

/**
 * Thrown by `validateSavedListViewConfig` (and other config-time collection checks)
 * when `admin.view`/`admin.views` names a field or index that
 * `defineCollection` cannot satisfy. Mirrors the domain-scoped config error
 * pattern used by `VexAccessConfigError` / `VexComponentConfigError` /
 * `VexAuthConfigError` / `VexStorageConfigError` — this is collections'
 * member of that family.
 */
export class VexConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexConfigError";
  }
}

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

/** The structured `{ code?, message? }` shape a {@link VexError}'s `.data` resolves to once recovered, regardless of which form it crossed the wire in (see {@link extractVexErrorData}). */
export interface VexErrorStructuredData {
  code?: string;
  message?: string;
}

/**
 * Recovers a `VexError`'s structured `{ code?, message? }` payload from a caught error,
 * regardless of which side of the Convex wire it crossed on.
 *
 * `instanceof VexError` only holds for an error constructed directly in-process (e.g. a
 * unit test, or code that never crosses Convex's client/server boundary) — a `VexError`
 * thrown from a Convex function and caught by ANY Convex client (`convex/react`'s
 * `useQuery`, `convex/nextjs`'s `fetchQuery`) always arrives back as a plain `ConvexError`
 * (the base class), never the subclass, so this checks `instanceof ConvexError` instead.
 *
 * A LOCAL Convex dev server additionally wraps the thrown error's own `.data` inside a
 * multi-line diagnostic STRING (a class name, a request id, `"Uncaught VexError: {json}"`,
 * then a stack trace with internal file paths) rather than forwarding the structured
 * `.data` object directly — confirmed live (a stale `?sort=` link hitting
 * `UNINDEXED_SORT`). This finds the line naming `VexError:` and parses only the JSON on
 * that one line; the class name, request id, and especially the stack trace's file paths
 * are NEVER part of the returned payload — callers that forward this to the browser (a
 * server-rendered `initialQueryError`) never leak them.
 *
 * @param error - The caught error.
 * @returns The structured payload, or `undefined` when `error` isn't a `ConvexError` at
 *   all, or its data doesn't match either recognized shape.
 */
export function extractVexErrorData(error: unknown): VexErrorStructuredData | undefined {
  if (!(error instanceof ConvexError)) return undefined;
  const data: unknown = error.data;
  if (typeof data === "object" && data !== null) {
    return data as VexErrorStructuredData;
  }
  if (typeof data !== "string") return undefined;
  const line = data.split("\n").find((entry) => entry.includes("VexError:"));
  if (line === undefined) return undefined;
  const start = line.indexOf("{");
  const end = line.lastIndexOf("}");
  if (start === -1 || end <= start) return undefined;
  try {
    const parsed: unknown = JSON.parse(line.slice(start, end + 1));
    return typeof parsed === "object" && parsed !== null ? (parsed as VexErrorStructuredData) : undefined;
  } catch {
    return undefined;
  }
}
