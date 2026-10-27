import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type { GenericQueryServerParams, GetReturn } from "../types";
import type { PopulateShape } from "../../../db/types";
import { hasPermission, resolveFieldPermissions, stripDeniedFields } from "../../../access";
import { resolveReadCall } from "../../../access/resolveReadCall";
import { requiresPublishedOnly, VERSION_STATUSES } from "../../../versions";

/**
 * Server-side args for `get`.
 *
 * Inherits `ctx`, `populate`, `depth`, and `config` (with mutual-exclusion
 * constraints) from {@link GenericQueryServerParams}.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @typeParam TPopulate - Populate object.
 * @typeParam D - Depth literal (0 = no depth, default).
 */
export interface GetServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
  D extends number = 0,
> extends GenericQueryServerParams<DataModel, TCollectionSlug, TPopulate, D> {
  /** The document ID to fetch. */
  id: GenericId<TCollectionSlug>;
  /** The collection slug to patch this document. */
  collection: TCollectionSlug;
  /** Same contract as `FindServerArgs.drafts` — see `find/server.ts`. */
  drafts?: boolean;
}

/**
 * Fetches a single document by its `Id<TCollectionSlug>`. Server-side only.
 *
 * Pass `populate` to explicitly name the relationship fields to resolve
 * (documented, recommended). Pass `depth` (with `config`) to automatically
 * populate all relationship fields to N levels — internal use only.
 *
 * Import from `@vexcms/core/server`. For the client-side version, import
 * `get` from `@vexcms/react/client`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug, recovered from the `Id` brand.
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
  TCollectionSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
  const D extends number = 0,
>(
  args: GetServerArgs<DataModel, TCollectionSlug, TPopulate, D>,
): Promise<GetReturn<TCollectionSlug, TPopulate, D>> {
  // Effective drafts flag + the action it resolves under — a caller without
  // `readDrafts` falls back to the published-only read instead of being
  // rejected (see `resolveReadCall`), so the edit view can always send
  // `drafts: true` for a versioned collection.
  const { access, action, resource, wantsDrafts } = resolveReadCall({
    config: args.config,
    access: args.access,
    auth: args.auth,
    collection: args.collection,
    drafts: args.drafts,
  });

  let doc = await args.ctx.db.get(args.id);

  // Checked BEFORE permissions: a draft row a caller isn't reading drafts for
  // does not exist for them — "not found", never a permission error about a
  // row they were never going to see.
  if (
    doc &&
    requiresPublishedOnly({
      config: args.config,
      collection: args.collection,
      drafts: wantsDrafts,
    }) &&
    (doc as Record<string, unknown>).vex_status !== VERSION_STATUSES.published.key
  ) {
    doc = null;
  }

  if (doc && access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc,
    });
    doc = stripDeniedFields(
      doc,
      resolveFieldPermissions({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: doc,
      }),
    );
  }

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

  const effectivePopulate =
    args.populate ??
    (args.depth !== undefined && args.depth > 0 && args.config && args.collection
      ? buildDepthPopulate<TPopulate>(args.config, args.collection, args.depth)
      : undefined);

  if (!effectivePopulate || !doc) {
    return doc as unknown as GetReturn<TCollectionSlug, TPopulate, D>;
  }

  const [populated] = await populateDocs<DataModel, TCollectionSlug, TPopulate>(
    args.ctx,
    [doc],
    effectivePopulate,
    wantsDrafts,
  );

  return (populated ?? null) as unknown as GetReturn<TCollectionSlug, TPopulate, D>;
}
