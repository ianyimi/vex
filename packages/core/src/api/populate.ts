import { asyncMap } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";
import type {
  GenericDataModel,
  GenericQueryCtx,
  TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug } from "../types/generated";
import type { Populated, PopulateShape } from "./types";

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
 * @returns Same docs with relationship Id arrays replaced by Doc arrays,
 *   typed as `Populated<TCollectionSlug, TPopulate>[]`.
 */
export async function populateDocs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = PopulateShape<TCollectionSlug>,
>(
  ctx: GenericQueryCtx<DataModel>,
  docs: ReadonlyArray<Record<string, unknown>>,
  populate: TPopulate,
): Promise<Populated<TCollectionSlug, TPopulate>[]> {
  const result = await asyncMap(docs, async (doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const [fieldKey, opts] of Object.entries(populate)) {
      const ids = doc[fieldKey];
      if (!Array.isArray(ids)) continue;

      const targets = await getAll(
        ctx.db,
        ids as GenericId<TableNamesInDataModel<DataModel>>[],
      );
      const filtered = targets.filter(
        (t): t is NonNullable<typeof t> => t !== null,
      );

      if (
        typeof opts === "object" &&
        opts !== null &&
        "populate" in opts &&
        opts.populate &&
        filtered.length > 0
      ) {
        out[fieldKey] = await populateDocs(
          ctx,
          filtered as ReadonlyArray<Record<string, unknown>>,
          opts.populate,
        );
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
