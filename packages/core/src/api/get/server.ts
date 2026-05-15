import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

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
 * Server-side args for `get`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface GetServerArgs<
  DataModel extends GenericDataModel,
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TSlug, TPopulate, D> {
  /** The document ID to fetch. */
  id: GenericId<TSlug>;
}

/**
 * Resolves the return type of `get`:
 *
 * - No populate + `D = 0` → `DocumentBySlug[TSlug] | null`.
 * - No populate + `D > 0` → `DepthPopulated<TSlug, D> | null`.
 * - With populate → `Prettify<Populated<TSlug, TPopulate>> | null`.
 */
type GetReturnItem<
  TSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TSlug extends keyof DocumentBySlug
      ? DocumentBySlug[TSlug] | null
      : never
    : DepthPopulated<TSlug, D> | null
  : TSlug extends keyof DocumentBySlug
    ? Prettify<Populated<TSlug, TPopulate>> | null
    : never;

/**
 * Fetches a single document by its `Id<TSlug>`. Server-side only.
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `get` from `@vexcms/core/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TSlug - Collection slug, recovered from the `Id` brand.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = none).
 * @param args - `{ ctx, id, populate? }` or `{ ctx, id, depth, config }`.
 * @returns Promise resolving to the doc or `null` if not found.
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
  const D extends number = 0,
>(
  args: GetServerArgs<DataModel, TSlug, TPopulate, D>,
): Promise<GetReturnItem<TSlug, TPopulate, D>> {
  const doc = await args.ctx.db.get(args.id);

  // Resolve slug for buildDepthPopulate from the Id (D12).
  //
  // `Id<TableName>` is a TypeScript phantom type — `__tableName` is purely
  // compile-time and is NOT a runtime property on the string. To extract the
  // table name at runtime we use two strategies in priority order:
  //
  // 1. TypeScript ecosystem environments that DO materialise `__tableName`
  //    as a runtime property (e.g. custom serialisers, some DX tooling).
  // 2. The `"{random};{tableName}"` format used by `convex-test`, which
  //    mirrors the extraction in `convex-test`'s own `tableNameFromId`.
  //
  // In production Convex, IDs are opaque base32 strings without a semicolon,
  // so the split returns a single element and `tableSlug` falls back to
  // `undefined` — depth silently degrades to no-populate, which is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableSlug: string | undefined = (args.id as any).__tableName ?? (() => {
    const parts = (args.id as string).split(";");
    return parts.length === 2 ? parts[1] : undefined;
  })();

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config && tableSlug
      ? buildDepthPopulate(args.config, tableSlug, args.depth)
      : undefined);

  if (!effectivePopulate || !doc)
    return doc as unknown as GetReturnItem<TSlug, TPopulate, D>;

  const [populated] = await populateDocs(args.ctx, [doc], effectivePopulate);
  return (populated ?? null) as unknown as GetReturnItem<TSlug, TPopulate, D>;
}
