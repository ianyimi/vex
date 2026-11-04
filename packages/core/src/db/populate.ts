import { asyncMap } from "convex-helpers";
import { getAll } from "convex-helpers/server/relationships";
import type { GenericDataModel, GenericQueryCtx, TableNamesInDataModel } from "convex/server";
import type { GenericId } from "convex/values";
import type { CollectionSlug } from "../types/generated";
import type { Populated, PopulateShape } from "./types";
import { VERSION_STATUSES, VERSION_SYSTEM_FIELDS } from "../versions/constants";
import type { VexConfig } from "../config";
import { convertCommitTsFieldsToMs, resolveCollectionSlug } from "./documents";
import { ADMIN_FIELDS } from "../fields";

/**
 * Resolves the collection a populated relationship target's `id` belongs
 * to, for the sole purpose of looking up that collection's `commitTs`
 * field keys below — a non-throwing wrapper over `resolveCollectionSlug`
 * (which hard-errors on an unresolvable id, a stronger guarantee than
 * populate needs: a target id this function can't place just skips
 * ms-conversion, the same graceful degrade `config` being entirely
 * omitted already has).
 *
 * @returns The resolved `CollectionSlug`, or `undefined` when `id` can't be
 *   placed on any collection declared in `config`.
 */
function tryResolveTargetCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug | undefined {
  try {
    return resolveCollectionSlug(props);
  } catch {
    return undefined;
  }
}

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
 * @param config - The resolved `VexConfig`, used only to look up a populated
 *   relationship target's `commitTs`-typed fields so their resolved
 *   `bigint` is converted to a plain ms `number` before the target doc is
 *   attached. Omitted (no conversion attempted) when the caller has no
 *   `config` to resolve field types from.
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
   * `drafts` arg — a nested `populate` inherits its caller's intent
   * rather than resolving a second RBAC decision per target collection. When
   * falsy, a resolved target carrying `vex_status !== "published"` is dropped,
   * same as a missing/deleted id — this drops a draft-only row (never
   * published, no `vex_publishedId`) exactly like an ordinary draft, since
   * both share the same `vex_status: "draft"` value this check reads. Checked
   * by field presence, not by looking `collection.versions.drafts` up in
   * `VexConfig`: unlike `find`'s structural filter, `populateDocs` fetches
   * arbitrary ids across possibly many target collections it has no static
   * knowledge of (the populate shape names field keys, not collections) —
   * but `vex_status` is schema-generated ONLY onto a versioned
   * collection's table, so its mere presence on a fetched document already
   * means "this row belongs to a versioned collection," making the
   * field-presence check equivalent to the config lookup in every real case,
   * without requiring one.
   */
  drafts?: boolean,
  /**
   * The resolved `VexConfig`, used only to look up a populated relationship
   * TARGET's own collection field map — specifically, which of its fields
   * are `commitTs`-typed, so their resolved `bigint` is converted to a
   * plain ms `number` before the target doc is attached (a
   * populated target is still a document crossing the same API boundary,
   * just nested — the SAME contract `find`/`get`/`search` already apply to
   * a resource's own fields). Omitted (no conversion attempted) when the
   * caller has no `config` to resolve field types from.
   */
  config?: VexConfig,
): Promise<Populated<TCollectionSlug, TPopulate>[]> {
  const result = await asyncMap(docs, async (doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const [fieldKey, opts] of Object.entries(populate)) {
      const ids = doc[fieldKey];
      if (!Array.isArray(ids)) continue;

      const targets = await getAll(ctx.db, ids as GenericId<TableNamesInDataModel<DataModel>>[]);
      let filtered = targets.filter((t): t is NonNullable<typeof t> => {
        if (t === null) return false;
        if (drafts) return true;
        const status = t[VERSION_SYSTEM_FIELDS.status.slug];
        return status === undefined || status === VERSION_STATUSES.published.key;
      });

      // A relationship field always targets ONE declared collection, so
      // every id in `ids` shares it — resolving from `ids[0]` is enough.
      if (config && filtered.length > 0) {
        const targetSlug = tryResolveTargetCollectionSlug({
          ctx,
          config,
          id: ids[0] as GenericId<CollectionSlug>,
        });
        const targetCollection = targetSlug
          ? config.collections.find((c) => c.slug === targetSlug)
          : undefined;
        if (targetCollection) {
          const commitTsKeys = Object.entries(targetCollection.fields)
            .filter(([, f]) => f.type === ADMIN_FIELDS.commitTs.type)
            .map(([key]) => key);
          if (commitTsKeys.length > 0) {
            filtered = filtered.map((t) => convertCommitTsFieldsToMs({ doc: t, keys: commitTsKeys }));
          }
        }
      }

      if (
        typeof opts === "object" &&
        opts !== null &&
        "populate" in opts &&
        opts.populate &&
        filtered.length > 0
      ) {
        out[fieldKey] = await populateDocs(ctx, filtered, opts.populate, drafts, config);
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
