import type {
  GenericDatabaseWriter,
  GenericDataModel,
  GenericMutationCtx,
  PaginationOptions,
} from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { VexVersionStatus } from "../../versions";

/**
 * Server-side args for `backfillStatus`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug being backfilled.
 */
export interface BackfillStatusServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  /** Convex mutation context — this function writes, so a query context is rejected at the type level. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`, used to confirm `collection` has `versions.drafts` enabled. */
  config: VexConfig;
  /** The collection slug to backfill. Must be registered with `versions.drafts: true`. */
  collection: TCollectionSlug;
  /**
   * Convex's native pagination options — deliberately NOT the core-wrapped
   * `PaginationOptions` from `../types` (which adds `totalDocs`; irrelevant
   * to a one-shot migration). Pass `{ numItems, cursor: null }` on the first
   * call, then feed the previous response's `continueCursor` back in until
   * `isDone` is `true`.
   */
  paginationOpts: PaginationOptions;
}

/** One page's result from a `backfillStatus` call. */
export interface BackfillStatusResult {
  /** Documents patched in this page — rows that were missing `vex_status`. */
  patched: number;
  /** `true` once every document matching the missing-`vex_status` condition has been visited. */
  isDone: boolean;
  /** Cursor to pass as `paginationOpts.cursor` on the next call. */
  continueCursor: string;
}

/**
 * Stamps `vex_status: "published"` on documents in `collection` that predate
 * a `versions.drafts` toggle and therefore have no `vex_status` value at all.
 *
 * This is a one-shot, developer-invoked migration action. Nothing in the
 * `vex` CLI or the `versionsApi` factory (Step 7) calls it automatically, and
 * it is not a `DRAFT_ACTIONS` member (Step 3) — it carries no `hasPermission`
 * check, so it must be wired into a Convex `internalMutation` (server-only,
 * never client-callable) in your own project, run once via `npx convex run`
 * or the dashboard until it reports `isDone: true`, and then deleted:
 *
 * @example
 * ```ts
 * // convex/backfillPagesStatus.ts — delete this file once the backfill is done.
 * import { internalMutation } from "./_generated/server";
 * import { paginationOptsValidator } from "convex/server";
 * import { backfillStatus } from "@vexcms/core/server";
 * import { config } from "../vex.config";
 *
 * export const run = internalMutation({
 *   args: { paginationOpts: paginationOptsValidator },
 *   handler: (ctx, args) =>
 *     backfillStatus({ ctx, config, collection: "pages", paginationOpts: args.paginationOpts }),
 * });
 * ```
 * ```sh
 * npx convex run backfillPagesStatus:run '{"paginationOpts":{"numItems":200,"cursor":null}}'
 * # repeat, feeding the previous call's continueCursor, until isDone: true
 * ```
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, config, collection, paginationOpts }`.
 * @returns One page's `{ patched, isDone, continueCursor }`.
 * @throws {ConvexError} When `collection` is not registered, or is registered
 * without `versions.drafts: true` (there is no `vex_status` column to backfill).
 */
export async function backfillStatus<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: BackfillStatusServerArgs<DataModel, TCollectionSlug>): Promise<BackfillStatusResult> {
  const collection = args.config.collections.find((c) => c.slug === args.collection);
  if (!collection) {
    throw new ConvexError(`No collection registered with slug "${args.collection}"`);
  }
  // Guards against querying `by_status` on a table that was never given it.
  if (collection.versions.drafts !== true) {
    throw new ConvexError(
      `"${args.collection}" does not have versions.drafts enabled — there is no vex_status field to backfill`,
    );
  }

  // Convex orders a missing optional field as `undefined`, so this index range
  // is exactly the rows never stamped — not drafts, not published — with no
  // table scan. Re-running after `isDone` simply matches nothing.
  // The table is named at runtime, so it can't be checked against `DataModel`.
  // Every `versions.drafts` table shares the shape `VersionedTableDataModel`
  // describes (Step 2 schema generation), so write through that view of `db`.
  const db = args.ctx.db as unknown as GenericDatabaseWriter<VersionedTableDataModel>;
  const page = await db
    .query(args.collection)
    .withIndex("by_status", (q) => q.eq("vex_status", undefined))
    .paginate(args.paginationOpts);

  for (const doc of page.page) {
    // `vex_status` only: these rows were live before versioning existed, so
    // there is no real publish time or draft counterpart to record, and a
    // schema-gap stamp is not a publish event to audit into `vex_versions`.
    await db.patch(doc._id, { vex_status: "published" });
  }

  return {
    patched: page.page.length,
    isDone: page.isDone,
    continueCursor: page.continueCursor,
  };
}

/**
 * The slice of any `versions.drafts` table this function touches: the
 * optional `vex_status` column and the `by_status` index Step 2 generates on
 * every versioned collection. Lets the runtime-named table read and patch with
 * real types — including `vex_status` being absent (`undefined`).
 */
type VersionedTableDataModel = Record<
  string,
  {
    document: { _id: GenericId<string>; _creationTime: number; vex_status?: VexVersionStatus };
    fieldPaths: "_id" | "_creationTime" | "vex_status";
    indexes: { by_status: ["vex_status", "_creationTime"] };
    searchIndexes: {};
    vectorIndexes: {};
  }
>;
