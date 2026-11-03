import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { VexStoredView } from "../../types";
import { skipInvalidStateRows } from "../../savedListViews/matchDeclaredSavedListViewFilter";
import { VIEW_ACTIONS, PERMISSION_SCOPES, hasPermission, isViewOrganizationScopingEnabled, resolveViewOrganizationId } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Server-side args for `listViews`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface ListViewsServerArgs<DataModel extends GenericDataModel> {
  /** Convex query context. */
  ctx: GenericQueryCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /**
   * Resolved caller identity. Checked against `readViews` (decision 13)
   * before any row is read, and consulted to read `auth.organization`
   * when `config.access.orgCollectionSlug` is configured (decision 12) —
   * never a client-supplied organization id, so a caller cannot read
   * another organization's shared views by passing one in.
   */
  auth?: VexApiAuth;
  /** The collection slug to list shared views for. */
  collection: CollectionSlug;
}

/**
 * Lists every `shared` saved view stored in `vex_views` for one collection.
 *
 * Gated on `readViews` (decision 13), checked with `scope: PERMISSION_SCOPES.any`
 * — the same "may they ever see this list?" question nav/sidebar gating asks
 * (there is no per-row document to evaluate a callback against; per-view
 * access is a later `readViews` rule with a `where` over `vex_views` rows,
 * not this step). Denied resolves to `[]`, not a thrown error — shared
 * views are invisible, not broken, until a project grants `readViews`. A
 * no-op gate (every caller passes) when `config.access` is unset, matching
 * `assertVersionsAccess`'s convention.
 *
 * Scoped to the caller's own organization via the `by_collection_org` index
 * when `config.access.organizations` is `true` (NOT `orgCollectionSlug`
 * alone, developer-approved binding correction — `isViewOrganizationScopingEnabled`)
 * — reads the full collection-wide set via `by_collection` otherwise,
 * including when `orgCollectionSlug` is configured but `organizations`
 * isn't. When scoping IS enabled but `auth.organization` doesn't resolve
 * an id (the caller has no org), resolves to `[]` instead of ever falling
 * through to the unscoped read (polish fix, Decision 3) — an org-less
 * stored row is invisible to every caller under scoping, not just
 * cross-org ones; it is never read, never merged, never adopted. The
 * organization id is never taken from the client — only from the
 * server-resolved `auth`.
 *
 * Does not merge in `config` (code-defined, read through `toClientSavedListViewConfig`,
 * Step 5) or `local` (localStorage) views, and never returns a view's hidden
 * `where` for a config view — there is none here, `shared` rows carry only
 * the saver's own `where` (Decision 25). The merge across sources happens
 * client-side in `useSavedListViews` (Step 12).
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, access?, auth? }`.
 * @returns Every `vex_views` row for `collection` the caller may see, unordered,
 *   or `[]` when the caller lacks `readViews` — a row whose `state` isn't a
 *   plain object is skipped ({@link skipInvalidStateRows}, polish fix, Decision 2).
 * @example
 * ```ts
 * import { listViews } from "@vexcms/core/server";
 *
 * export const postsViews = query({
 *   args: {},
 *   handler: (ctx) => listViews({ ctx, config, collection: "posts" }),
 * });
 * ```
 */
export async function listViews<DataModel extends GenericDataModel>(
  args: ListViewsServerArgs<DataModel>,
): Promise<VexStoredView[]> {
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: VIEW_ACTIONS.readViews,
      resource: args.collection,
    });
    const allowed = hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    });
    if (!allowed) return [];
  }

  const orgScoped = isViewOrganizationScopingEnabled(args.config.access);
  const organizationId = resolveViewOrganizationId({ access: args.config.access, organization: args.auth?.organization });

  // Developer-approved (binding correction): `organizations: true` is the
  // SOLE trigger — `orgCollectionSlug` alone no longer scopes anything. A
  // caller whose own org doesn't resolve WHILE scoping is actually enabled
  // sees NO shared views at all — never falls through to the unscoped
  // `by_collection` branch below, which would otherwise leak every OTHER
  // org's (and every org-less) view to them.
  if (orgScoped && organizationId === undefined) return [];

  const rows =
    organizationId !== undefined
      ? await args.ctx.db
          .query("vex_views")
          // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
          .withIndex("by_collection_org", (q) => q.eq("collection", args.collection).eq("organizationId", organizationId))
          .collect()
      : await args.ctx.db
          .query("vex_views")
          // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
          .withIndex("by_collection", (q) => q.eq("collection", args.collection))
          .collect();

  return skipInvalidStateRows(rows as unknown as { collection: string; viewId: string; state: unknown }[]) as unknown as VexStoredView[];
}
