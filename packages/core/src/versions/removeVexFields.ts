import { ADMIN_FIELDS, type AdminField } from "../fields";
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
 * @param props.fields - The resource's resolved field map, when known. When
 *   given, every `commitTs`-typed field is stripped by TYPE (not by a fixed
 *   key set — a collection may declare any number of `commitTs` fields
 *   under any name). A raw unresolved placeholder embedded in a snapshot's
 *   `v.any()` value would, per Convex's own docs, resolve to the SNAPSHOT
 *   ROW's own insert commit — meaningless, and different every time the
 *   snapshot is rewritten — so it must never be written there at all.
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
export function removeVexFields(props: {
  doc: Record<string, unknown>;
  fields?: Record<string, AdminField>;
}): Record<string, unknown> {
  const stripKeys = new Set<string>([
    ...Object.values(CONVEX_SYSTEM_FIELDS).map((v) => v.slug),
    ...Object.values(VERSION_SYSTEM_FIELDS).map((v) => v.slug),
    ...(props.fields
      ? Object.entries(props.fields)
          .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
          .map(([key]) => key)
      : []),
  ]);
  return Object.fromEntries(Object.entries(props.doc).filter(([key]) => !stripKeys.has(key)));
}
