import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, DocumentBySlug } from "../types/generated";
import { populateDocs } from "./populate";
import type { GenericQueryServerParams, Populated, PopulateShape } from "./types";

/**
 * Server-side args for `get`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 */
export interface GetServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate> {
  id: GenericId<TSlug>;
}

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape for IDE display. @see `find.server.ts` for the
 * canonical explanation.
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Resolves the return type of `get` based on whether populate is given.
 * No populate → raw `DocumentBySlug[TSlug] | null` (concrete named type in IDE).
 * With populate → `Prettify<Populated<TSlug, TPopulate>> | null` (expanded shape).
 */
type GetReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
> = [TPopulate] extends [Record<string, never>]
  ? TSlug extends keyof DocumentBySlug
    ? DocumentBySlug[TSlug] | null
    : never
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>> | null
    : never;

/**
 * Fetches a single document by its `Id<TSlug>`. Server-side only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `get` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @param args - `{ ctx, id, populate? }`.
 * @returns Promise resolving to the doc or `null` if not found. Relationship
 *   fields listed in `populate` are replaced with full documents; unpopulated
 *   fields remain as `Id` arrays.
 * @example
 * ```ts
 * import { get } from "@vexcms/core/server";
 *
 * export const post = query({
 *   args: { id: v.id("posts") },
 *   handler: (ctx, args) => get({ ctx, id: args.id, populate: { author: true } }),
 * });
 * ```
 */
export async function get<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  args: GetServerArgs<DataModel, TSlug, TPopulate>,
): Promise<GetReturnItem<TSlug, TPopulate>> {
  const doc = await args.ctx.db.get(args.id);
  if (!args.populate || !doc) return doc as unknown as GetReturnItem<TSlug, TPopulate>;
  const [populated] = await populateDocs(args.ctx, [doc], args.populate);
  return (populated ?? null) as unknown as GetReturnItem<TSlug, TPopulate>;
}
