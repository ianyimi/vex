import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";
import { getDataFields } from "../../fields/utils";
import type { CollectionConfig } from "../types";

/**
 * One `relationship`/`upload` filter value found while walking a `where`
 * tree — the id to resolve a title for, tagged with which field and
 * target collection it came from.
 */
export interface ListViewFilterRelationshipValue {
  /** The field key on the walked collection this value came from. */
  fieldKey: string;
  /** The target collection (or media collection) slug this id resolves against. */
  targetCollection: string;
  /** The raw stored id. */
  id: string;
}

/**
 * Walks a `where` tree's `and`/`or`/`not` structure (any shape, not just
 * the filter builder's own DNF form — a hand-authored config view's
 * `where` can nest arbitrarily), collecting every LEAF whose field is a
 * `relationship`/`upload` type on `collection` and whose op carries a
 * concrete single id (`eq`/`neq` with a plain string value — never
 * `isEmpty`/`isNotEmpty`, which compiles to `value: undefined` and has no
 * id to resolve, and never an array, since a filter leaf always compares
 * ONE value regardless of the field's own `hasMany`).
 *
 * Used by `NextAdminPage` to prefetch each distinct target document's
 * title server-side (`initialFilterValueTitles`), so a relationship/
 * upload filter chip shows the title, not the raw id, on first paint.
 *
 * @param props - Input props.
 * @param props.where - The resolved `where` to walk, or `undefined`.
 * @param props.collection - Resolves each leaf's field type and target
 *   collection — an unrecognized field key (shouldn't happen for a
 *   `where` the server itself already validated, but harmless either way)
 *   is silently skipped.
 * @returns Every relationship/upload id found, one entry per LEAF — a
 *   field filtered more than once (e.g. an `or` across two rows) produces
 *   one entry per occurrence, possibly repeating the same `id`; the
 *   caller dedupes before fetching.
 */
export function collectListViewFilterRelationshipValues(props: {
  where: VexWhereNodeOf<unknown> | undefined;
  collection: CollectionConfig;
}): ListViewFilterRelationshipValue[] {
  if (props.where === undefined) return [];
  const dataFields = getDataFields({ fields: props.collection.fields });
  const results: ListViewFilterRelationshipValue[] = [];

  function walk(node: VexWhereNodeOf<unknown>): void {
    if ("and" in node) {
      node.and.forEach(walk);
      return;
    }
    if ("or" in node) {
      node.or.forEach(walk);
      return;
    }
    if ("not" in node) {
      walk(node.not);
      return;
    }
    if (node.op !== "eq" && node.op !== "neq") return;
    if (typeof node.value !== "string") return;
    const field = dataFields[node.field];
    if (field === undefined) return;
    if (field.type === "relationship") {
      results.push({ fieldKey: node.field, targetCollection: field.collection.slug, id: node.value });
    } else if (field.type === "upload") {
      results.push({ fieldKey: node.field, targetCollection: field.to, id: node.value });
    }
  }

  walk(props.where);
  return results;
}
