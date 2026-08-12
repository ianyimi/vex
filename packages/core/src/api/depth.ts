import type { AdminField } from "../fields";
import type { VexConfig } from "../config";

/**
 * Builds a `PopulateShape`-compatible object covering every relationship field
 * on `slug`'s collection down to `depth` levels.
 *
 * This is the runtime counterpart of the compile-time `DepthPopulate<TCollectionSlug, D>`
 * type. The returned object can be passed directly to `populateDocs` because it
 * matches the `PopulateShape` structure:
 * - Leaf fields (at the requested depth, or targets with no relationships) → `true`
 * - Intermediate fields → `{ populate: <nested result> }`
 *
 * The function relies on the live `VexConfig` available in the `queryApi`
 * closure. It never touches the database — it only walks the in-memory config.
 *
 * **Circular schema guard:** the `visited` set prevents infinite recursion when
 * two collections point to each other. A circular edge is treated as a leaf
 * (`true`) — the field is populated one level, but the cycle is cut.
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
 */
export function buildDepthPopulate(
  config: VexConfig,
  slug: string,
  depth: number,
  visited: ReadonlySet<string> = new Set(),
): Record<string, unknown> {
  if (depth <= 0) return {};

  const source =
    config.collections.find((c) => c.slug === slug) ??
    config.globals?.find((g) => g.slug === slug);
  if (!source) return {};

  const nextVisited = new Set(visited).add(slug);
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(
    source.fields as Record<string, AdminField>,
  )) {
    if (field.type !== "relationship") continue;

    const targetSlug = (field as Extract<AdminField, { type: "relationship" }>)
      .collection.slug;

    // Leaf level OR circular edge → `true` (populate this field, no further recursion)
    if (depth === 1 || nextVisited.has(targetSlug)) {
      result[key] = true;
      continue;
    }

    const nested = buildDepthPopulate(
      config,
      targetSlug,
      depth - 1,
      nextVisited,
    );
    // Target has no relationship fields → collapse to `true`
    result[key] = Object.keys(nested).length > 0 ? { populate: nested } : true;
  }

  return result;
}
