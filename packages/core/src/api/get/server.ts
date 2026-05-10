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

  // Resolve slug for buildDepthPopulate from the Id brand (D12).
  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config
      ? buildDepthPopulate(
          args.config,
          // GenericId is branded with __tableName — cast is safe here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (args.id as any).__tableName as string,
          args.depth,
        )
      : undefined);

  if (!effectivePopulate || !doc)
    return doc as unknown as GetReturnItem<TSlug, TPopulate, D>;

  const [populated] = await populateDocs(args.ctx, [doc], effectivePopulate);
  return (populated ?? null) as unknown as GetReturnItem<TSlug, TPopulate, D>;
}
