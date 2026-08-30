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
import { CRUD_ACTIONS, hasPermission } from "../../access";
import { GenericGlobalsQueryServerArgs } from "./types";
import { resolveAccessCall } from "../utils";

/**
 * Flattens a raw `vex_globals` DB row into the API-facing flat document.
 * Lifts `data` fields to root, renames `slug` → `_slug`.
 * @param row the global document as returned from convex usign a single collection for globals
 * @returns the flattened global object data type including its metadata fields
 */
function flattenGlobalRow(row: Record<string, unknown>): Record<string, unknown> {
  const { slug, data, _id, _creationTime } = row as {
    slug: string;
    data: Record<string, unknown>;
    _id: string;
    _creationTime: number;
  };
  return { _id, _creationTime, _slug: slug, ...(data ?? {}) };
}

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
 * @param args - `{ ctx, slug, populate? }` or `{ ctx, slug, depth, config }`.
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
  args: GetGlobalServerArgs<DataModel, TGlobalSlug, TPopulate, D>,
): Promise<GetGlobalReturn<TGlobalSlug, TPopulate, D>> {
  const { ctx, slug, populate, depth, config } = args;

  const row = await ctx.db
    .query("vex_globals")
    .withIndex("by_slug", (q) => q.eq("slug", slug as any))
    .first();

  if (!row) return null as GetGlobalReturn<TGlobalSlug, TPopulate, D>;

  let flat = flattenGlobalRow(row as Record<string, unknown>);

  if (args.config?.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.read,
      resource: args.slug,
    });
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      access,
      resource,
      action,
      data: flat,
    });
  }

  // Depth: auto-populate all relationship fields to N levels
  if (depth && depth > 0 && config) {
    const globalConfig = config.globals.find((g) => g.slug === slug);
    if (globalConfig) {
      const depthPopulate = buildDepthPopulate<TPopulate>(config, slug, depth);
      if (depthPopulate && Object.keys(depthPopulate).length > 0) {
        const [populated] = await populateDocs(ctx, [flat], depthPopulate);
        flat = populated as Record<string, unknown>;
      }
    }
  }

  // Explicit populate
  if (populate && Object.keys(populate).length > 0) {
    const [populated] = await populateDocs(ctx, [flat], populate as Record<string, unknown>);
    flat = populated as Record<string, unknown>;
  }

  return flat as unknown as GetGlobalReturn<TGlobalSlug, TPopulate, D>;
}
