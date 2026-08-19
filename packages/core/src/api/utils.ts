import { type GenericDataModel, GenericQueryCtx } from "convex/server";
import { type GenericId } from "convex/values";
import { type VexConfig } from "../config";
import { type CollectionSlug } from "../types";

/**
 * Resolves the collection slug that owns a document `id` by probing
 * `ctx.db.normalizeId` against every registered collection.
 *
 * A Convex `Id` does not expose its table name at runtime. `get/server.ts`'s
 * D12 comment documents the same constraint for depth-populate, where
 * degrading to "unresolvable" is safe (populate is simply skipped). It is
 * NOT safe here — `get`, `update`, and `remove` gate a real permission
 * check — so this resolves the slug via the `ctx.db.normalizeId(tableName, id)`
 * syscall instead of string-parsing the id. Unlike the D12 trick, this works
 * identically in `convex-test` and production Convex.
 *
 * @param props.ctx - Query or mutation context — only `ctx.db.normalizeId` is used.
 * @param props.config - The resolved `VexConfig`, to enumerate candidate collections.
 * @param props.id - The document id to resolve.
 * @returns The owning collection's slug.
 * @throws {Error} When no registered collection claims the id (e.g. an id for a
 *   non-collection table like `vex_globals`, or a stale id from a deleted collection).
 *   Callers gate the permission check behind this, so an unresolvable id is a hard error,
 *   not a silent skip.
 */
export function resolveCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config?: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug {
  for (const c of props.config?.collections ?? []) {
    if (props.ctx.db.normalizeId(c.slug, props.id) !== null) {
      return c.slug;
    }
  }
  throw new Error("[resolveCollectionSlug]: document id does not match a collection slug");
  // Note: `config.collections` is small and `normalizeId` is a local syscall (no DB round
  // trip), so looping it once per `get`/`update`/`remove` request is cheap.
}
