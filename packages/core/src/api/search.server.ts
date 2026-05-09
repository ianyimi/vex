import type { GenericDataModel } from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../types/generated";
import { populateDocs } from "./populate";
import type {
  GenericQueryServerParams,
  Populated,
  PopulateShape,
} from "./types";

/**
 * Server-side args for `search`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface SearchServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  collection: TSlug;
  query: string;
  searchIndexName: string;
  searchField: string;
  limit?: number;
}

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape for IDE display. @see `find.server.ts` for the
 * canonical explanation.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Resolves the return type of `search` based on whether populate is given.
 * No populate → raw `DocumentBySlug[TSlug][]` (concrete named type in IDE).
 * With populate → `Prettify<Populated<TSlug, TPopulate>>[]` (expanded shape).
 */
type SearchReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = [TPopulate] extends [Record<string, never>]
  ? TSlug extends keyof DocumentBySlug
    ? DocumentBySlug[TSlug]
    : never
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>>
    : never;

/**
 * Text search via a Convex search index. Server-side only.
 * Empty `query` string falls back to `.take()` (returns recent docs).
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `search` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ ctx, collection, query, searchIndexName, searchField, limit?, populate? }`.
 * @returns Promise resolving to matching docs. Relationship fields listed in
 *   `populate` are replaced with full documents.
 * @example
 * ```ts
 * import { search } from "@vexcms/core/server";
 *
 * export const authorSearch = query({
 *   args: { q: v.string() },
 *   handler: (ctx, args) =>
 *     search({ ctx, collection: "authors", query: args.q, searchIndexName: "search_name", searchField: "name" }),
 * });
 * ```
 */
export async function search<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: SearchServerArgs<DataModel, TSlug, TPopulate>,
): Promise<SearchReturnItem<TSlug, TPopulate>[]> {
  let docs;
  if (!args.query) {
    docs = await args.ctx.db.query(args.collection).take(args.limit ?? 20);
  } else {
    docs = await args.ctx.db
      .query(args.collection)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .withSearchIndex(args.searchIndexName, (q: any) =>
        q.search(args.searchField, args.query),
      )
      .take(args.limit ?? 20);
  }
  if (!args.populate)
    return docs as unknown as SearchReturnItem<TSlug, TPopulate>[];
  return populateDocs(
    args.ctx,
    docs,
    args.populate,
  ) as unknown as SearchReturnItem<TSlug, TPopulate>[];
}
