import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionConfig } from "../types";
import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../../db/types";
import { normalizeArrayStoredWhere, type VexWhereNode } from "../../db/queryArgs";
import { isPlainObject } from "../../utils/isPlainObject";
import { valuesEqual } from "../../utils/valuesEqual";
import {
  PERMISSION_SCOPES,
  VIEW_ACTIONS,
  hasPermission,
  isViewOrganizationScopingEnabled,
  resolveViewOrganizationId,
} from "../../access";
import { resolveAccessCall } from "../../access/resolveAccessCall";

/**
 * Dev-only, one-time-per-row warning keyed by `${collection}\u0000${viewId}` — same
 * pattern as `pickConvexQueryIndex.ts`'s `warnDisplacedAccessIndex`/`statusQueryConstraint.ts`'s
 * `warnMissingDraftStatusIndex`. `@internal` — not part of the public API surface.
 */
const warnedBadStateRows = new Set<string>();

/**
 * Narrows a raw `vex_views` row's `state` field (stored as `v.any()` on the wire) to a
 * plain object, skipping — not throwing on — a malformed or legacy row (`null`, a bare
 * string, an array). Every reader of `vex_views.state` (`listViews`, {@link
 * loadSharedSavedListViewWheres}) runs rows through this filter rather than assuming the shape —
 * `saveView`'s own input validation prevents NEW bad rows, but a row
 * written before that validation landed, or inserted directly against the
 * Convex dashboard, must never crash a reader that dereferences
 * `.state.where`.
 *
 * @param rows - Raw `vex_views` rows, as read off `ctx.db`.
 * @returns Only the rows whose `state` is a plain object — unchanged rows, nothing coerced.
 * @internal
 */
export function skipInvalidStateRows<TRow extends { collection: string; viewId: string; state: unknown }>(
  rows: TRow[],
): TRow[] {
  return rows.filter((row) => {
    if (isPlainObject(row.state)) return true;
    if (process.env.NODE_ENV !== "production") {
      const key = `${row.collection}\u0000${row.viewId}`;
      if (!warnedBadStateRows.has(key)) {
        warnedBadStateRows.add(key);
        console.warn(
          `[vexcms] vex_views row "${row.viewId}" (collection "${row.collection}") has a malformed ` +
            `"state" field (not a plain object) and was skipped. This row predates saveView's input ` +
            `validation, or was written directly against the database — it is otherwise invisible ` +
            `to the admin panel until repaired or removed.`,
        );
      }
    }
    return false;
  });
}

/** {@link matchDeclaredSavedListViewFilter}'s result. */
export interface MatchedDeclaredSavedListViewFilter<S extends string = string> {
  /**
   * The top-level `where` part that deep-equals one of `collection`'s
   * declared `admin.view`/`admin.views[].where` values, verbatim — the
   * trusted, server-declared half. `undefined` when no part matched.
   */
  declared?: VexWhereNode<S>;
  /**
   * `where` with `declared` removed, if matched — otherwise `where`
   * unchanged. The caller runs the field-read check against THIS, never
   * against the original `where` — `declared`, when present, is exempt.
   */
  remainder?: VexWhereNode<S>;
}

/**
 * Splits a caller's `where` into the part that exactly reproduces one of
 * `collection`'s declared config-view filters (if any) and the remainder
 * that still needs the ordinary field-read check.
 *
 * A config view's `where` ships in the client bundle — `composeSavedListViewWhere`
 * sends it back as `{ and: [viewWhere, filter] }`, keeping `viewWhere` as
 * ONE opaque node rather than flattening it. Matching therefore only ever
 * needs to compare TOP-LEVEL `and` PARTS against each declared `where` by
 * deep structural equality (`valuesEqual`, which already treats two
 * values as equal purely by content) — never a partial, reordered, or
 * OR-nested recovery of a declared filter. That is deliberate: dropping a
 * condition, changing a value, or putting it in an OR group must NOT
 * exempt the request, and comparing only whole top-level parts rejects
 * all three automatically — a narrowed or altered copy of a
 * multi-condition declared filter is a DIFFERENT node than the declared
 * one, and a part nested inside `{ or: [...] }` is never a top-level part
 * at all.
 *
 * `find` / `search` use `remainder` to compute `whereFields` (the set of
 * referenced fields checked for read access) instead of the full `where` —
 * `declared`'s own fields, if matched, are never checked. This function
 * does NOT itself check field access; separating the two means a
 * `remainder` that still references an unreadable field is simply returned
 * as such, for the caller's existing `readableDocuments` machinery to
 * drop.
 *
 * @param props - Input props.
 * @param props.collection - The resolved `CollectionConfig` whose
 *   `admin.view`/`admin.views` are searched. `undefined` (an unknown
 *   collection or no config) resolves permissively: `{ remainder:
 *   props.where }`, the same fallback `whereFieldNames` takes.
 * @param props.where - The caller's plain `where`, verbatim.
 * @param props.sharedWheres - `vex_views[].state.where` values the caller
 *   may read (the shared-views exemption), loaded by
 *   {@link loadSharedSavedListViewWheres}. Compared with the SAME deep-equality rule
 *   as a config view's `where` — omit (or pass `[]`) when the config-view
 *   pass alone leaves nothing unreadable, so the caller never pays for the
 *   `vex_views` read on an ordinary query.
 * @returns See {@link MatchedDeclaredSavedListViewFilter}.
 */
export function matchDeclaredSavedListViewFilter<S extends string = string>(props: {
  collection?: CollectionConfig;
  where?: VexWhereNode<S>;
  sharedWheres?: VexWhereNode<S>[];
}): MatchedDeclaredSavedListViewFilter<S> {
  if (props.where === undefined) {
    return { remainder: undefined };
  }

  const declaredWheres = [
    props.collection?.admin.view?.state.where,
    ...(props.collection?.admin.views ?? []).map((v) => v.state.where),
    ...(props.sharedWheres ?? []),
  ]
    .filter((w): w is VexWhereNode<S> => w !== undefined)
    // `props.where` arrives already normalized (`find`/`search` run
    // `normalizeArrayStoredWhere` before this function ever sees it) — an
    // array-stored field's declared `where` (e.g. `leads.ts`'s "From
    // Contributors" `{ field: "contributorId", op: "neq", value: null }`)
    // must be normalized identically here, or a config view's own filter
    // would stop deep-equaling the caller's copy of itself and lose
    // the trusted-declared-filter exemption.
    .map((dw) => normalizeArrayStoredWhere({ where: dw, fields: props.collection?.fields ?? {} }) as VexWhereNode<S>);
  if (declaredWheres.length === 0) {
    return { remainder: props.where };
  }

  const parts: VexWhereNode<S>[] = "and" in props.where ? [...props.where.and] : [props.where];
  const matchedIndex = parts.findIndex((part) => declaredWheres.some((dw) => valuesEqual(part, dw)));
  if (matchedIndex === -1) {
    return { remainder: props.where };
  }

  const declared = parts[matchedIndex];
  const remaining = parts.filter((_, i) => i !== matchedIndex);
  const remainder: VexWhereNode<S> | undefined =
    remaining.length === 0 ? undefined : remaining.length === 1 ? remaining[0] : { and: remaining };

  return { declared, remainder };
}

/**
 * Loads the `where` of every `shared` (`vex_views`) view on `collection`
 * the caller may read, for {@link matchDeclaredSavedListViewFilter}'s `sharedWheres`
 * (the shared-views exemption). Gated on `readViews` with `scope:
 * PERMISSION_SCOPES.any` — the same "may they ever see this list?" gate
 * `listViews` (`collections/api/listViews/server.ts`) uses. Resolves to
 * `[]`, not a thrown error, when the caller lacks `readViews` — nothing
 * becomes trusted, which drops the row exactly like any other unreadable
 * condition.
 *
 * Callers (`find`/`search`) only invoke this AFTER the config-view match
 * still leaves an unreadable field in the remainder — the read costs
 * nothing on an ordinary query.
 *
 * Scoped to the caller's organization via `by_collection_org` when
 * `config.access.organizations` is `true` (NOT `orgCollectionSlug` alone —
 * `isViewOrganizationScopingEnabled`) — reads the full collection-wide
 * set via `by_collection` otherwise, mirroring `listViews`'s own scoping.
 * When scoping IS enabled but `auth.organization` doesn't resolve an id,
 * resolves to `[]` instead of ever falling through to the unscoped read —
 * no declared-filter exemption is granted through a shared view such a
 * caller can't even see. An org-less stored row is never read under
 * scoping either, for anyone.
 *
 * @param props.ctx - Convex query context.
 * @param props.config - The resolved `VexConfig`.
 * @param props.collection - The collection slug to load shared views for.
 * @param props.auth - Resolved caller identity, checked against `readViews`.
 * @returns Every readable shared view's `state.where`, skipping views with
 *   no `where` (search- or sort-only views carry nothing to match against)
 *   AND any row whose `state` isn't a plain object ({@link skipInvalidStateRows}).
 */
export async function loadSharedSavedListViewWheres<DataModel extends GenericDataModel, S extends string = string>(
  props: {
    ctx: GenericQueryCtx<DataModel>;
    config: VexConfig;
    access?: AccessCallOptions<string>;
    collection: CollectionSlug;
    auth?: VexApiAuth;
  },
): Promise<VexWhereNode<S>[]> {
  if (props.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: VIEW_ACTIONS.readViews,
      resource: props.collection,
    });
    const allowed =
      access === undefined ||
      hasPermission({
        access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource,
        action,
        scope: PERMISSION_SCOPES.any,
      });
    if (!allowed) return [];
  }

  const orgScoped = isViewOrganizationScopingEnabled(props.config.access);
  const organizationId = resolveViewOrganizationId({ access: props.config.access, organization: props.auth?.organization });

  // Developer-approved (binding correction): mirrors `listViews` — never
  // falls through to the unscoped `by_collection` branch below for a
  // caller whose own org doesn't resolve while scoping is actually enabled.
  if (orgScoped && organizationId === undefined) return [];

  const rows =
    organizationId !== undefined
      ? await props.ctx.db
          .query("vex_views")
          // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
          .withIndex("by_collection_org", (q) => q.eq("collection", props.collection).eq("organizationId", organizationId))
          .collect()
      : await props.ctx.db
          .query("vex_views")
          // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
          .withIndex("by_collection", (q) => q.eq("collection", props.collection))
          .collect();

  return skipInvalidStateRows(rows as unknown as { collection: string; viewId: string; state: unknown }[])
    .map((row) => (row.state as { where?: VexWhereNode<S> }).where)
    .filter((where): where is VexWhereNode<S> => where !== undefined);
}
