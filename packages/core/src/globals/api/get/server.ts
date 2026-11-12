import type { GenericDataModel, GenericDocument } from "convex/server";

import type {
  GlobalSlug,
  GlobalDocumentBySlug,
  GlobalRelationshipKeysOf,
  GlobalRelationshipTargetOf,
  VexDocumentGlobal,
} from "../../../types/generated";
import { populateDocs } from "../../../db/populate";
import { buildDepthPopulate } from "../../../db/depth";
import { convertCommitTsFieldsToMs } from "../../../db/documents";
import { ADMIN_FIELDS } from "../../../fields";
import type { Prettify, PopulateShape, GlobalPopulateShape, GlobalPopulated, ApplyGlobalDepthPopulate } from "../../../db/types";
import type { DepthPopulate } from "../../../collections/api/types";
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../../access";
import { GenericGlobalsQueryServerArgs } from "../types";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { flattenGlobalRow } from "../../utils";
import { VERSION_STATUSES } from "../../../versions";

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
   * active draft row over the published row — the same knob `find`/`get`/`search`
   * use for collections. Ignored for a non-versioned
   * global. Defaults to `false`: the public/default read path never sees
   * draft content, matching design-review §3.1 — this is data integrity,
   * not a permission decision, so the default without the flag is "no
   * drafts" regardless of the caller's grants.
   */
  drafts?: boolean;
}

/**
 * Computes the equivalent `GlobalPopulateShape` for auto-populating every
 * relationship field on `TGlobalSlug` to `D` levels deep — the global
 * counterpart of `DepthPopulate`. The first level (the global's own direct
 * relationships) is walked here; crossing into each relationship's target
 * COLLECTION hands off to `DepthPopulate` (starting its counter at `[0]`,
 * since one level was already spent crossing from the global), so depth
 * reaches a target's own nested `blocks()`/`array()`/`group()` fields
 * exactly as a direct collection-to-collection `depth` would.
 *
 * @typeParam TGlobalSlug - The global slug to start from.
 * @typeParam D - The depth as a literal number.
 */
export type GlobalDepthPopulate<TGlobalSlug extends GlobalSlug, D extends number> = {
  [K in GlobalRelationshipKeysOf<TGlobalSlug>]?: D extends 1
    ? true
    : { populate: DepthPopulate<GlobalRelationshipTargetOf<TGlobalSlug, K & string>, D, [0]> };
};

/**
 * Return type of `getGlobal` — narrows by populate/depth presence.
 *
 * **Non-literal fallback:** `number extends D` short-circuits to the wide
 * `VexDocumentGlobal & Record<string, unknown>` fallback, mirroring
 * `DepthPopulated`'s own guard — `depth` is only called internally with
 * literal values, so this only fires for a non-literal `number` variable.
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
    : number extends D
      ? (VexDocumentGlobal<TSlug> & Record<string, unknown>) | null
      : TSlug extends keyof GlobalDocumentBySlug
        ? // Not `GlobalPopulated<TSlug, GlobalDepthPopulate<...>>`: see
          // `ApplyGlobalDepthPopulate`'s own doc comment — an
          // `& GlobalPopulateShape<TSlug>` bridge would otherwise be needed to
          // satisfy `GlobalPopulated`'s constrained second parameter, which
          // multiplies two recursive container walks together and overflows
          // TypeScript's instantiation depth limit on a real project.
          Prettify<ApplyGlobalDepthPopulate<TSlug, GlobalDepthPopulate<TSlug, D>>> | null
        : (VexDocumentGlobal<TSlug> & Record<string, unknown>) | null
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

  const { access, action, resource } = resolveAccessCall({
    config: props.config,
    access: props.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: props.slug,
  });
  if (access !== undefined) {
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

  if (globalConfig) {
    const commitTsKeys = Object.entries(globalConfig.fields)
      .filter(([, f]) => f.type === ADMIN_FIELDS.commitTs.type)
      .map(([key]) => key);
    if (commitTsKeys.length > 0) {
      // `flat` is `Record<string, unknown>` (`flattenGlobalRow`'s return
      // type); `GenericDocument` requires a `Value`-typed index signature.
      // A flattened global row IS a real Convex document structurally —
      // this bridges the variance gap `unknown` vs `Value` introduces, not
      // a real type mismatch.
      const flatAsDoc = flat as GenericDocument;
      flat = convertCommitTsFieldsToMs({ doc: flatAsDoc, keys: commitTsKeys });
    }
  }

  // Depth: auto-populate all relationship fields to N levels
  if (props.depth && props.depth > 0 && props.config) {
    const globalConfig = props.config.globals.find((g) => g.slug === props.slug);
    if (globalConfig) {
      // Not `buildDepthPopulate<TPopulate>`: `TPopulate` here is
      // `GlobalPopulateShape<TGlobalSlug>` (a global's own populate shape),
      // never a collection's `PopulateShape` — `buildDepthPopulate`'s
      // generic is the latter. The walked RESULT is passed to
      // `populateDocs` as a plain runtime object below (cast, same as the
      // explicit-populate branch just under this one); nothing here needs
      // `TPopulate`'s own type.
      const depthPopulate = buildDepthPopulate(props.config, props.slug, props.depth);
      if (depthPopulate && Object.keys(depthPopulate).length > 0) {
        const [populated] = await populateDocs(
          props.ctx,
          [flat],
          // Globals aren't `CollectionSlug`-keyed, so `depthPopulate`'s real
          // shape is never exactly `PopulateShape` — bridged the same way
          // the explicit-populate branch below does.
          depthPopulate as unknown as PopulateShape,
          undefined,
          props.config,
          access,
          props.auth,
        );
        flat = populated as Record<string, unknown>;
      }
    }
  }

  // Explicit populate
  if (props.populate && Object.keys(props.populate).length > 0) {
    const [populated] = await populateDocs(
      props.ctx,
      [flat],
      // `props.populate` is `GlobalPopulateShape<TGlobalSlug>` — structurally
      // close to (but never exactly) a collection's `PopulateShape`, which is
      // all `populateDocs`'s OWN generic can be instantiated with. The
      // runtime walk (`populateDocs`/`populateContainers`) is generic over
      // plain `Record<string, unknown>` keys regardless of which registry
      // produced them, so this bridge is safe — only the TYPE PARAMETER,
      // never the runtime behavior, is collection-specific.
      props.populate as unknown as PopulateShape,
      undefined,
      props.config,
      access,
      props.auth,
    );
    flat = populated as Record<string, unknown>;
  }

  return flat as unknown as GetGlobalReturn<TGlobalSlug, TPopulate, D>;
}
