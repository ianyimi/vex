import { ADMIN_FIELDS, getDataFields } from "../fields";
import type { AdminDataField, AdminField } from "../fields";
import type { VexConfig } from "../config";
import { PopulateShape } from "./types";

/**
 * Builds a `PopulateShape`-compatible object covering every relationship AND
 * upload field on `slug`'s collection down to `depth` levels — including one
 * nested inside a `group()`, an `array()` item, or a `blocks()` block (keyed
 * by `blockType`). `tabs()`/`row()`/`collapsible()` need no special handling:
 * `getDataFields` already hoists their fields to the containing level before
 * this function ever walks them.
 *
 * This is the runtime counterpart of the compile-time `DepthPopulate<TCollectionSlug, D>`
 * type. The returned object can be passed directly to `populateDocs` because it
 * matches the `PopulateShape` structure:
 * - Leaf fields (at the requested depth, targets with no relationships, or any
 *   upload field — media collections never carry further relationship/upload
 *   fields of their own) → `true`
 * - Intermediate relationship fields → `{ populate: <nested result> }`
 * - `group()` → the group's own nested result, applied directly (no cost —
 *   it is part of THIS collection, not a hop into another one)
 * - `blocks()` → an object keyed by each block's `blockType`, each value
 *   that block's own nested result (also no depth cost)
 * - `array()` → transparent: its own result IS whatever its `items` field's
 *   result would be
 *
 * The function relies on the live `VexConfig` available in the `queryApi`
 * closure. It never touches the database — it only walks the in-memory config.
 *
 * **Circular schema guard:** the `visited` set prevents infinite recursion when
 * two collections point to each other. A circular edge is treated as a leaf
 * (`true`) — the field is populated one level, but the cycle is cut. Crossing
 * into a new target collection is the ONLY thing that adds to `visited` or
 * costs a depth level — descending through a `group()`/`array()`/`blocks()`
 * boundary within the SAME collection costs nothing.
 *
 * @param config - The user's resolved `VexConfig`.
 * @param slug - The collection or global slug to start from.
 * @param depth - Levels to descend. `0` returns `{}` (no population).
 * @param visited - Internal cycle guard — callers must not supply this.
 * @returns A plain object usable as the `populate` arg to `populateDocs`.
 *
 * @example depth 1 — all direct relationships populated
 * ```ts
 * buildDepthPopulate(config, "posts", 1)
 * // → { author: true, category: true }
 * ```
 * @example depth 2 — relationships of relationships also populated
 * ```ts
 * buildDepthPopulate(config, "posts", 2)
 * // → { author: { populate: { team: true } }, category: true }
 * //   (category has no relationships → collapses to `true`)
 * ```
 * @example a relationship nested inside a `blocks()` field
 * ```ts
 * buildDepthPopulate(config, "pages", 1)
 * // → { content: { hero: { image: true } } }
 * ```
 */
export function buildDepthPopulate<TPopulate extends PopulateShape = PopulateShape>(
  config: VexConfig,
  slug: string,
  depth: number,
  visited: ReadonlySet<string> = new Set(),
): TPopulate {
  if (depth <= 0) return {} as TPopulate;

  const source =
    config.collections.find((c) => c.slug === slug) ?? config.globals?.find((g) => g.slug === slug);
  if (!source) return {} as TPopulate;

  const nextVisited = new Set(visited).add(slug);
  return buildContainerDepthPopulate({
    config,
    fields: source.fields as Record<string, AdminField>,
    depth,
    visited: nextVisited,
  }) as TPopulate;
}

/**
 * Builds one container level's (a collection's top-level fields, a
 * `group()`'s own fields, or one `blocks()` block's own fields) depth-populate
 * object. @see {@link buildDepthPopulate}
 *
 * @returns The container's own depth-populate object (never nested under a
 *   `{ populate }` wrapper — a container is part of THIS collection).
 */
function buildContainerDepthPopulate(props: {
  config: VexConfig;
  fields: Record<string, AdminField>;
  depth: number;
  visited: ReadonlySet<string>;
}): Record<string, unknown> {
  const { config, fields, depth, visited } = props;
  const result: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(getDataFields({ fields }))) {
    const value = buildFieldDepthPopulate({ config, field, depth, visited });
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/**
 * Builds one field's depth-populate value, or `undefined` when nothing on
 * `field` (at any depth) is populatable. @see {@link buildDepthPopulate}
 *
 * @returns `true` for a leaf, `{ populate: ... }` for an intermediate
 *   relationship, a container object for a `group()`/`blocks()`/`array()`
 *   with something populatable inside it, or `undefined` otherwise.
 */
function buildFieldDepthPopulate(props: {
  config: VexConfig;
  field: AdminDataField;
  depth: number;
  visited: ReadonlySet<string>;
}): unknown {
  const { config, field, depth, visited } = props;

  if (field.type === ADMIN_FIELDS.upload.type) {
    // Media collections (the only valid `to` target) carry no
    // relationship/upload fields of their own to recurse into, so an
    // upload field is always a leaf — same `true` shape a leaf
    // relationship field collapses to below.
    return true;
  }

  if (field.type === ADMIN_FIELDS.relationship.type) {
    const targetSlug = field.collection.slug;

    // Leaf level OR circular edge → `true` (populate this field, no further recursion)
    if (depth === 1 || visited.has(targetSlug)) return true;

    const nested = buildDepthPopulate(config, targetSlug, depth - 1, visited);
    // Target has no relationship fields → collapse to `true`
    return Object.keys(nested).length > 0 ? { populate: nested } : true;
  }

  if (field.type === ADMIN_FIELDS.array.type) {
    // Transparent: an array's own result IS whatever its `items` field's
    // result would be.
    return buildFieldDepthPopulate({ config, field: field.items, depth, visited });
  }

  if (field.type === ADMIN_FIELDS.group.type) {
    const nested = buildContainerDepthPopulate({ config, fields: field.fields, depth, visited });
    return Object.keys(nested).length > 0 ? nested : undefined;
  }

  if (field.type === ADMIN_FIELDS.blocks.type) {
    const blocksResult: Record<string, unknown> = {};
    for (const block of field.blocks) {
      const nested = buildContainerDepthPopulate({ config, fields: block.fields, depth, visited });
      if (Object.keys(nested).length > 0) blocksResult[block.blockType] = nested;
    }
    return Object.keys(blocksResult).length > 0 ? blocksResult : undefined;
  }

  return undefined;
}
