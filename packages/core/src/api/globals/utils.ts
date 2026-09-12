/**
 * Shared helpers for the globals API surface (`get`, `find`, `upsert`).
 *
 * Distinct from `../../globals/utils`, which serves the globals *config*
 * module (Zod input schemas built from `GlobalConfig.fields`). This file holds
 * the storage-shape translation the API functions share.
 */

/**
 * Flattens a raw `vex_globals` DB row into the API-facing flat document.
 * Lifts `data` fields to root, renames `slug` → `_slug`.
 *
 * Shared rather than inlined per call site because it is also the shape a
 * permission callback must receive as its `data`: every global rule is written
 * against the flat document (`_slug` and user fields at root), so
 * `({ data }) => data.name === "x"` must see `data.name`, never
 * `data.data.name`. `getGlobal`, `findGlobals`, and `upsertGlobal` all
 * authorize and return through this one translation.
 *
 * @param row the global document as returned from convex usign a single collection for globals
 * @returns the flattened global object data type including its metadata fields
 */
export function flattenGlobalRow(row: Record<string, unknown>): Record<string, unknown> {
  const { slug, data, _id, _creationTime } = row as {
    slug: string;
    data: Record<string, unknown>;
    _id: string;
    _creationTime: number;
  };
  return { _id, _creationTime, _slug: slug, ...(data ?? {}) };
}
