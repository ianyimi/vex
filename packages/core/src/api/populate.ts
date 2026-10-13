import { asyncMap } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";
import type { GenericDataModel, GenericQueryCtx, TableNamesInDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug } from "../types/generated";
import type { Populated, PopulateShape } from "./types";
import { VERSION_STATUSES, VERSION_SYSTEM_FIELDS } from "../versions";

/**
 * Walks `docs` and replaces each relationship field listed in `populate` with
 * the resolved target doc(s). Returns a shallow-copied array; original docs
 * are not mutated.
 *
 * The `TPopulate` generic is the caller-supplied populate shape. The return
 * type `Populated<TCollectionSlug, TPopulate>[]` is what TypeScript sees at call sites
 * — the `as unknown as` cast at the bottom bridges runtime
 * `Record<string, unknown>[]` to the compile-time `Populated` shape. All
 * callers (`find`, `get`, `search` server functions) benefit without writing
 * their own casts.
 *
 * @param ctx - The Convex query context (any DataModel).
 * @param docs - Documents to populate.
 * @param populate - Relationship fields to resolve, optionally nested.
 * @param drafts - Is this request want to read drafts? default `false`
 * @returns Same docs with relationship Id arrays replaced by Doc arrays,
 *   typed as `Populated<TCollectionSlug, TPopulate>[]`.
 */
export async function populateDocs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
>(
  ctx: GenericQueryCtx<DataModel>,
  docs: Record<string, unknown>[],
  populate: TPopulate,
  /**
   * Forwarded from the top-level `find`/`get`/`search`/`getGlobal` call's own
   * `drafts` arg (Step 13) — a nested `populate` inherits its caller's intent
   * rather than resolving a second RBAC decision per target collection. When
   * falsy, a resolved target carrying `vex_status !== "published"` is dropped,
   * same as a missing/deleted id — this drops a draft-only row (never
   * published, no `vex_publishedId`) exactly like an ordinary draft, since
   * both share the same `vex_status: "draft"` value this check reads. Checked
   * by field presence, not by looking `collection.versions.drafts` up in
   * `VexConfig`: unlike `find`'s structural filter, `populateDocs` fetches
   * arbitrary ids across possibly many target collections it has no static
   * knowledge of (the populate shape names field keys, not collections) —
   * but `vex_status` is schema-generated (Step 2) ONLY onto a versioned
   * collection's table, so its mere presence on a fetched document already
   * means "this row belongs to a versioned collection," making the
   * field-presence check equivalent to the config lookup in every real case,
   * without requiring one.
   */
  drafts?: boolean,
): Promise<Populated<TCollectionSlug, TPopulate>[]> {
  const result = await asyncMap(docs, async (doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const [fieldKey, opts] of Object.entries(populate)) {
      const ids = doc[fieldKey];
      if (!Array.isArray(ids)) continue;

      const targets = await getAll(ctx.db, ids as GenericId<TableNamesInDataModel<DataModel>>[]);
      const filtered = targets.filter((t): t is NonNullable<typeof t> => {
        if (t === null) return false;
        if (drafts) return true;
        const status = t[VERSION_SYSTEM_FIELDS.status.slug];
        return status === undefined || status === VERSION_STATUSES.published.key;
      });

      if (
        typeof opts === "object" &&
        opts !== null &&
        "populate" in opts &&
        opts.populate &&
        filtered.length > 0
      ) {
        out[fieldKey] = await populateDocs(ctx, filtered, opts.populate, drafts);
      } else {
        out[fieldKey] = filtered;
      }
    }
    return out;
  });
  // Single cast: the runtime walk produces the correct shape that
  // Populated<TCollectionSlug, TPopulate>[] describes, but TypeScript can't verify
  // a mapped type transformation from a runtime Object.entries loop.
  return result as unknown as Populated<TCollectionSlug, TPopulate>[];
}
