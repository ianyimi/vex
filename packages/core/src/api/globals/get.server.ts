import type { GenericDataModel } from "convex/server";

import type {
  GlobalSlug,
  GlobalDocumentBySlug,
  GlobalPopulateShape,
  GlobalPopulated,
  VexDocumentGlobal,
} from "../../types/generated";
import { populateDocs } from "../populate";
import { buildDepthPopulate } from "../depth";
import type { Prettify } from "../types";
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../access";
import { GenericGlobalsQueryServerArgs } from "./types";
import { resolveAccessCall } from "../utils";
import { flattenGlobalRow } from "./utils";
import { VERSION_STATUSES } from "../../versions";

/**
 * Server-side args for `getGlobal`. Populate and depth are mutually exclusive.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @typeParam TPopulate - Populate shape.
 * @typeParam D - Depth literal.
 */
export interface GetGlobalServerArgs<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
  D extends number = 0,
> extends GenericGlobalsQueryServerArgs<DataModel, TGlobalSlug> {
  /** Global slug to fetch. Narrowed to `GlobalSlug` after `vex generate`. */
  slug: TGlobalSlug;
  /** Relationship fields to populate. Mutually exclusive with `depth`. */
  populate?: [D] extends [0] ? TPopulate : never;
  /** Auto-populate all relationship fields to N levels. Mutually exclusive with `populate`. */
  depth?: [TPopulate] extends [Record<string, never>] ? D : never;
  /**
   * When the resolved global declares `versions.drafts: true`, prefer the
   * active draft row over the published row — the same knob Step 13 adds to
   * `find`/`get`/`search` for collections. Ignored for a non-versioned
   * global. Defaults to `false`: the public/default read path never sees
   * draft content, matching design-review §3.1 — this is data integrity,
   * not a permission decision, so the default without the flag is "no
   * drafts" regardless of the caller's grants.
   */
  drafts?: boolean;
}

/**
 * Return type of `getGlobal` — narrows by populate/depth presence.
 */
export type GetGlobalReturn<
  TSlug extends GlobalSlug,
  TPopulate extends GlobalPopulateShape<TSlug>,
  D extends number,
> = [TPopulate] extends [Record<string, never>]
  ? [D] extends [0]
    ? TSlug extends keyof GlobalDocumentBySlug
      ? GlobalDocumentBySlug[TSlug] | null
      : VexDocumentGlobal<TSlug> | null
    : (VexDocumentGlobal<TSlug> & Record<string, unknown>) | null // depth — widened, see Out of Scope
  : TSlug extends keyof GlobalDocumentBySlug
    ? Prettify<GlobalPopulated<TSlug, TPopulate>> | null
    : never;

/**
 * Fetches a single global by slug and returns it as a flat document.
 * User fields (`siteName`, `activeTheme`, …) are at root level alongside
 * `_id`, `_creationTime`, and `_slug`. Server-side only.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model.
 * @typeParam TSlug - Global slug.
 * @typeParam TPopulate - Populate shape.
 * @typeParam D - Depth literal.
 * @param props - `{ ctx, slug, populate? }` or `{ ctx, slug, depth, config }`.
 * @returns Flat global document or `null` if not yet saved.
 *
 * @example
 * ```ts
 * import { getGlobal } from "@vexcms/core/server";
 *
 * const settings = await getGlobal({ ctx, slug: "siteSettings" });
 * settings?.siteName; // string | undefined
 *
 * const populated = await getGlobal({
 *   ctx,
 *   slug: "siteSettings",
 *   populate: { activeTheme: true },
 * });
 * populated?.activeTheme; // Doc<"themes">[] | undefined (runtime correct, type widened)
 * ```
 */
export async function getGlobal<
  DataModel extends GenericDataModel,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
  D extends number = 0,
>(
  props: GetGlobalServerArgs<DataModel, TGlobalSlug, TPopulate, D>,
): Promise<GetGlobalReturn<TGlobalSlug, TPopulate, D>> {
  let row: Record<string, unknown> | null = null;
  const globalConfig = props.config?.globals.find((g) => g.slug === props.slug);
  if (!globalConfig?.versions.drafts) {
    row = await props.ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
      .first();
  } else {
    const rows = await props.ctx.db
      .query("vex_globals")
      .withIndex("by_slug", (q) => q.eq("slug", props.slug as never))
      .collect();

    const publishedRow = rows.find((r) => r.vex_status !== VERSION_STATUSES.draft.key);
    const draftRow = rows.find((r) => r.vex_status === VERSION_STATUSES.draft.key);
    const wantsDrafts =
      props.config?.access === undefined
        ? Boolean(props.drafts)
        : Boolean(props.drafts) &&
          hasPermission({
            access: props.config.access,
            user: props.auth?.user ?? null,
            organization: props.auth?.organization,
            resource: props.slug,
            action: DRAFT_ACTIONS.readDrafts,
            throwOnDenied: false,
          });
    row = (wantsDrafts && draftRow ? draftRow : publishedRow) ?? null;
  }

  if (!row) return null as GetGlobalReturn<TGlobalSlug, TPopulate, D>;

  let flat = flattenGlobalRow(row as Record<string, unknown>);

  if (props.config?.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: CRUD_ACTIONS.read,
      resource: props.slug,
    });
    hasPermission({
      throwOnDenied: true,
      user: props.auth?.user ?? null,
      organization: props.auth?.organization,
      access,
      resource,
      action,
      data: flat,
    });
    flat = stripDeniedFields(
      flat,
      resolveFieldPermissions({
        access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource,
        action,
        data: flat,
      }),
    );
  }

  // Depth: auto-populate all relationship fields to N levels
  if (props.depth && props.depth > 0 && props.config) {
    const globalConfig = props.config.globals.find((g) => g.slug === props.slug);
    if (globalConfig) {
      const depthPopulate = buildDepthPopulate<TPopulate>(props.config, props.slug, props.depth);
      if (depthPopulate && Object.keys(depthPopulate).length > 0) {
        const [populated] = await populateDocs(props.ctx, [flat], depthPopulate);
        flat = populated as Record<string, unknown>;
      }
    }
  }

  // Explicit populate
  if (props.populate && Object.keys(props.populate).length > 0) {
    const [populated] = await populateDocs(
      props.ctx,
      [flat],
      props.populate as Record<string, unknown>,
    );
    flat = populated as Record<string, unknown>;
  }

  return flat as unknown as GetGlobalReturn<TGlobalSlug, TPopulate, D>;
}
