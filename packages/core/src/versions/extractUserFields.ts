import { CONVEX_SYSTEM_FIELDS } from "../collections/constants";
import { VERSION_SYSTEM_FIELDS } from "./constants";

/**
 * Strips every key a `vex_versions` snapshot must never carry from a stored
 * document before it is written into a version's `snapshot` field.
 *
 * Removes `_id` and `_creationTime` (Convex system fields — meaningless once
 * copied into an immutable history row; restoring a version never restores
 * an `_id`) and every member of {@link VERSION_SYSTEM_FIELDS} (`vex_status`,
 * `vex_publishedAt`, `vex_publishedId` — these describe the LIVE row's
 * current publish state, not the content being snapshotted; re-publishing
 * an old snapshot must not resurrect its stale status).
 *
 * @param props - Input props.
 * @param props.doc - The stored document (draft or published row) to derive
 *   a snapshot from.
 * @returns A new object containing only the document's user-defined fields.
 *   `props.doc` is never mutated. A doc missing some of the stripped keys (a
 *   never-published draft has no `vex_publishedId` yet) is not an error —
 *   filtering an absent key is a no-op.
 *
 * @example
 * ```ts
 * extractUserFields({
 *   doc: { _id: "abc", _creationTime: 1, title: "Hi", vex_status: "draft" },
 * });
 * // → { title: "Hi" }
 * ```
 */
export function extractUserFields(props: {
  doc: Record<string, unknown>;
}): Record<string, unknown> {
  const stripKeys = new Set<string>([
    ...Object.values(CONVEX_SYSTEM_FIELDS).map((v) => v.slug),
    ...Object.values(VERSION_SYSTEM_FIELDS).map((v) => v.slug),
  ]);
  return Object.fromEntries(Object.entries(props.doc).filter(([key]) => !stripKeys.has(key)));
}
