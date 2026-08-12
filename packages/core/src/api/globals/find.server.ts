import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { VexDocumentGlobal } from "../../types/generated";

/**
 * Server-side args for `findGlobals`.
 *
 * @typeParam DataModel - Convex data model.
 */
export interface FindGlobalsServerArgs<DataModel extends GenericDataModel> {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
}

/**
 * Returns all rows from `vex_globals` as flat documents, ordered by
 * `_creationTime` ascending. Only includes globals that have been saved at
 * least once — globals registered in config but never saved are absent.
 *
 * The return type is `VexDocumentGlobal[]` (unnarrowed) because each element
 * may be a different slug with different user fields. Access specific fields
 * via the index signature: `doc["siteName"]`. For typed single-global access,
 * use `getGlobal` instead.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @param args - `{ ctx }`.
 * @returns Flat global documents, unnarrowed.
 *
 * @example
 * ```ts
 * import { findGlobals } from "@vexcms/core/server";
 *
 * const all = await findGlobals({ ctx });
 * all.map((g) => g._slug); // ["siteSettings", "nav"]
 * ```
 */
export async function findGlobals<DataModel extends GenericDataModel>(
  args: FindGlobalsServerArgs<DataModel>,
): Promise<VexDocumentGlobal[]> {
  const { ctx } = args;
  const rows = await ctx.db.query("vex_globals").collect();
  return rows.map((row: Record<string, unknown>) => {
    const { slug, data, _id, _creationTime } = row;
    return { _id, _creationTime, _slug: slug, ...(data ?? {}) };
  }) as VexDocumentGlobal[];
}
