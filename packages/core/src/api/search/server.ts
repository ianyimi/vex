import type { GenericDataModel } from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../../types/generated";
import { buildDepthPopulate } from "../depth";
import { populateDocs } from "../populate";
import type {
  DepthPopulated,
  GenericQueryServerParams,
  Populated,
  PopulateShape,
  Prettify,
} from "../types";

/**
 * Server-side args for `search`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The collection to search — must match a registered collection slug. */
  collection: TCollectionSlug;
  /** The search text. Pass `""` to list recent documents (falls back to `.take()`). */
  query: string;
  /** The `.searchIndex()` name declared in the Convex schema (e.g. `"search_name"`). */
  searchIndexName: string;
  /** The field the search index is built on. Must match `searchField` in the index declaration. */
  searchField: string;
  /** Maximum number of results. Defaults to 20. */
  limit?: number;
}

/**
 * Resolves the return element type of `search`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TCollectionSlug]`.
 * - No populate + `D > 0` → `DepthPopulated<TCollectionSlug, D>`.
 * - With populate → `Prettify<Populated<TCollectionSlug, TPopulate>>`.
 */
type SearchReturnItem<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TCollectionSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TCollectionSlug]
      : never
    : DepthPopulated<TCollectionSlug, D>
  : TCollectionSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TCollectionSlug, TPopulate>>
    : never;

/**
 * Text search via a Convex search index. Server-side only.
 * Empty `query` string falls back to `.take()` (returns recent docs).
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `search` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ ctx, collection, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Promise resolving to matching docs.
 * @example
 * ```ts
 * import { search } from "@vexcms/core/server";
 *
 * export const authorSearch = query({
 *   args: { q: v.string() },
 *   handler: (ctx, args) =>
 *     search({ ctx, collection: "authors", query: args.q,
 *               searchIndexName: "search_name", searchField: "name",
 *               populate: { team: true } }),
 * });
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<SearchReturnItem<TCollectionSlug, TPopulate, D>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableName = args.collection as any;
  const limit = args.limit ?? 20;

  let docs: Record<string, unknown>[];
  if (!args.query) {
    docs = await args.ctx.db.query(tableName).take(limit);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docs = await (args.ctx.db.query(tableName) as any)
      .withSearchIndex(args.searchIndexName, (q: any) =>
        (q as any).search(args.searchField, args.query),
      )
      .take(limit);
  }

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(args.config, args.collection, args.depth)
      : undefined);

  if (!effectivePopulate || Object.keys(effectivePopulate).length === 0) {
    return docs as unknown as SearchReturnItem<TCollectionSlug, TPopulate, D>[];
  }
  return populateDocs(
    args.ctx,
    docs as ReadonlyArray<Record<string, unknown>>,
    effectivePopulate,
  ) as unknown as SearchReturnItem<TCollectionSlug, TPopulate, D>[];
}
