import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { assertViewAction, assertViewIdNotReserved } from "../saveView/server";
import { VIEW_ACTIONS, isViewOrganizationScopingEnabled, resolveViewOrganizationId } from "../../../access";

/**
 * Server-side args for `removeView`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface RemoveViewServerArgs<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /** Resolved caller identity, forwarded to `hasPermission`. */
  auth?: VexApiAuth;
  /** The collection slug the view belongs to. */
  collection: CollectionSlug;
  /** The `viewId` of the `vex_views` row to delete. */
  viewId: string;
}

/**
 * Permanently deletes one `vex_views` row, gated on `deleteView`.
 * Resolves the row via the `by_view_id` index and confirms
 * it belongs to `collection` before deleting — the same check `saveView`
 * runs on write, so a `viewId` cannot be used to touch another
 * collection's row. Also confirms the row belongs to the caller's own
 * organization when `config.access.organizations` is `true` (NOT
 * `orgCollectionSlug` alone) — a cross-org row, an org-less row (now
 * inert under scoping, same as cross-org), or a caller whose own org
 * doesn't resolve all resolve to the exact same "not found" error (no
 * existence leak), same as `saveView`'s equivalent check.
 *
 * `assertViewIdNotReserved` runs FIRST, before any DB read or the access
 * gate — the collection's default (`admin.view`) and preset (`admin.views`)
 * view ids are never real `vex_views` rows, so a delete request naming one
 * is always a caller bug, not a permissions question.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, viewId, access?, auth? }`.
 * @returns Nothing — resolves once the row is deleted.
 * @throws {VexError} (`code: "RESERVED_VIEW_ID"`) When `viewId` matches the
 *   collection's declared `admin.view.viewId` or an `admin.views[].viewId`.
 * @throws {ConvexError} When no `vex_views` row with `viewId` exists for
 *   `collection`; OR, when org scoping is configured, the caller's own org
 *   doesn't resolve, OR the row's `organizationId` (including an org-less
 *   row) isn't exactly the caller's own.
 * @throws {VexAccessError} When the caller's roles lack `deleteView` on `collection`.
 * @example
 * ```ts
 * import { removeView } from "@vexcms/core/server";
 *
 * export const postsRemoveView = mutation({
 *   args: { viewId: v.string() },
 *   handler: (ctx, args) =>
 *     removeView({ ctx, config, collection: "posts", viewId: args.viewId }),
 * });
 * ```
 */
export async function removeView<DataModel extends GenericDataModel>(
  args: RemoveViewServerArgs<DataModel>,
): Promise<void> {
  assertViewIdNotReserved({ config: args.config, collection: args.collection, viewId: args.viewId });

  assertViewAction({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource: args.collection,
    action: VIEW_ACTIONS.deleteView,
  });

  const row = await args.ctx.db
    .query("vex_views")
    // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
    .withIndex("by_view_id", (q) => q.eq("viewId", args.viewId))
    .unique();

  const orgScoped = isViewOrganizationScopingEnabled(args.config.access);
  const organizationId = resolveViewOrganizationId({ access: args.config.access, organization: args.auth?.organization });

  // Org scoping, extended: a caller whose own org doesn't
  // resolve is denied outright, same as `saveView`. Once `organizationId` is
  // confirmed defined, a row whose own `organizationId` isn't EXACTLY the
  // caller's own is rejected the same way — this single `!==` naturally also
  // covers an org-less row (`undefined !== organizationId` is true): it is
  // invisible and inert under scoping, same as a genuinely cross-org row.
  if (
    !row ||
    row.collection !== args.collection ||
    (orgScoped && (organizationId === undefined || row.organizationId !== organizationId))
  ) {
    throw new ConvexError(`No view "${args.viewId}" found for collection "${args.collection}"`);
  }

  // @ts-expect-error deleting from a generic DataModel's table by a runtime-resolved row id
  await args.ctx.db.delete(row._id);
}
