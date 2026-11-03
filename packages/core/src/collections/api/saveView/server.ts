import { ConvexError } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { VexViewConfig } from "../../types";
import { VIEW_ACTIONS, CRUD_ACTIONS, PERMISSION_SCOPES, VexAccessError, hasPermission, isViewOrganizationScopingEnabled, resolveViewOrganizationId } from "../../../access";
import type { ViewAction } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { resolveFieldPermissions, isFieldAllowed, SYSTEM_FIELD_KEYS } from "../../../access/resolveFieldPermissions";
import { referencedWhereFields } from "../../../db/queryArgs";
import { isPlainObject } from "../../../utils/isPlainObject";
import { VexError } from "../../../errors";

/**
 * Runs the RBAC gate shared by `listViews`'s mutation-shaped siblings —
 * `saveView` (`createView`/`updateView`) and `removeView` (`deleteView`),
 * fail-closed per decision 13. A no-op when `config.access` is unset,
 * matching `assertVersionsAccess`'s (`versions/api/history/server.ts`)
 * convention: RBAC only applies when the project has configured `access` at
 * all.
 *
 * @param props.resource - The collection slug the view belongs to.
 * @param props.action - Which `VIEW_ACTIONS` member gates this call.
 * @throws {VexAccessError} When the caller's roles lack `props.action` on `resource`.
 */
export function assertViewAction(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  access?: AccessCallOptions<string>;
  resource: string;
  action: ViewAction;
}): void {
  if (props.config.access === undefined) return;

  const { access, action, resource } = resolveAccessCall({
    config: props.config,
    access: props.access,
    defaultAction: props.action,
    resource: props.resource,
  });

  hasPermission({
    throwOnDenied: true,
    access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource,
    action,
  });
}

/**
 * Rejects a `viewId` that collides with the collection's reserved default
 * view id (`admin.view.viewId`, always `"default"`) or one of its preset
 * `admin.views[].viewId` entries — neither is ever a real `vex_views` row;
 * both are declared in code, bundled to the client (P-004), and already
 * enforced unique against each other at config time
 * (`validateSavedListViewConfig`). Without this, a client could `saveView` a
 * shared row under `"default"` (or a preset's own id) that would never
 * surface correctly in the merged tab list, or `removeView` a `viewId`
 * that was never actually a `vex_views` row to begin with, masking the
 * real (declared, undeletable) view behind a misleading "not found".
 *
 * @param props.config - The resolved `VexConfig`.
 * @param props.collection - The collection slug `viewId` belongs to.
 * @param props.viewId - The `viewId` being saved or removed.
 * @throws {VexError} (`code: "RESERVED_VIEW_ID"`) When `viewId` matches the
 *   collection's `admin.view.viewId` or any `admin.views[].viewId`.
 */
export function assertViewIdNotReserved(props: {
  config: VexConfig;
  collection: CollectionSlug;
  viewId: string;
}): void {
  const collectionConfig = props.config.collections.find((c) => c.slug === props.collection);
  if (collectionConfig === undefined) return;
  const isReserved =
    collectionConfig.admin.view.viewId === props.viewId ||
    collectionConfig.admin.views.some((view) => view.viewId === props.viewId);
  if (!isReserved) return;
  throw new VexError({
    code: "RESERVED_VIEW_ID",
    collection: props.collection,
    viewId: props.viewId,
    message: `collection "${props.collection}": "${props.viewId}" is the collection's default ("admin.view") or a preset ("admin.views") view id, declared in code — it can never be saved, renamed, or deleted as a shared view.`,
  });
}

/**
 * Validates a client-supplied `view` payload's SHAPE before any further processing
 * (polish fix, Decision 2). `saveView`'s `view` argument arrives on the wire as
 * `v.any()` (see the `mutation({ args: { view: v.any() } })` pattern in `saveView`'s
 * own example), so a client can send `{}`, `null`, or `{ viewId: "x" }` — without this
 * check, `saveView` dereferences `args.view.viewId`/`.name` with no guard (an
 * uncaught `TypeError`), and a syntactically-valid call with `state: null` would be
 * stored VERBATIM, poisoning every subsequent `listViews`/`loadSharedSavedListViewWheres`
 * read of the collection (both now guard against this too, via `skipInvalidStateRows`
 * — this check exists to stop a bad row from ever being WRITTEN in the first place).
 *
 * Runs FIRST in `saveView`, before `assertViewIdNotReserved` — a payload whose shape
 * is wrong is a caller bug regardless of `viewId`.
 *
 * @param props.view - The caller-supplied view payload, still unknown-shaped at this point.
 * @throws {VexError} (`code: "INVALID_VIEW"`) When `viewId`/`name` aren't strings, or
 *   `state` isn't a plain object.
 */
export function assertViewPayloadValid(props: { view: unknown }): void {
  if (
    !isPlainObject(props.view) ||
    typeof props.view.viewId !== "string" ||
    typeof props.view.name !== "string" ||
    !isPlainObject(props.view.state)
  ) {
    throw new VexError({
      code: "INVALID_VIEW",
      message: "A saved view must have a string viewId, a string name, and a state object.",
    });
  }
}

/**
 * Rejects a view whose `state.where` references a field the saving user
 * cannot read (decision 26, architecture review 2026-10-27). A saved filter
 * on an unreadable field would let anyone who opens the view infer a
 * yes/no condition on every row, which is exactly what field-read access
 * is meant to prevent — the same reasoning `find`/`search` apply to a
 * caller's own `where` (`readableDocuments`), extended to the filter
 * stored inside a shared view.
 *
 * A no-op when `config.access` is unset (RBAC off project-wide) or
 * `where` is undefined (the view has no filter, e.g. search- or
 * sort-only). System fields (`_id`, `_creationTime`, `_slug`) are never
 * checked — they are always retained per `SYSTEM_FIELD_KEYS`.
 *
 * Checked with `scope: PERMISSION_SCOPES.any` — there is no document to
 * evaluate a per-row filter callback against, so the question is "ever
 * readable?", the same scope the list view's `useFieldPermissions` call
 * uses to show or hide a whole column.
 *
 * @param props.resource - The collection slug the view belongs to.
 * @param props.where - The view's `state.where`, or `undefined`.
 * @throws {VexAccessError} Naming the first unreadable field found.
 */
export function assertViewWhereReadable(props: {
  config: VexConfig;
  auth?: VexApiAuth;
  resource: string;
  where: unknown;
}): void {
  if (props.config.access === undefined || props.where === undefined) return;

  const fields = referencedWhereFields({ where: props.where as never }).filter(
    (field) => !SYSTEM_FIELD_KEYS.has(field),
  );
  if (fields.length === 0) return;

  const fieldPermissions = resolveFieldPermissions({
    access: props.config.access,
    user: props.auth?.user ?? null,
    organization: props.auth?.organization,
    resource: props.resource,
    action: CRUD_ACTIONS.read,
    scope: PERMISSION_SCOPES.any,
  });

  const unreadable = fields.find((field) => !isFieldAllowed(fieldPermissions, field));
  if (unreadable !== undefined) {
    throw new VexAccessError({
      resource: props.resource,
      action: CRUD_ACTIONS.read,
      field: unreadable,
      message: `Can't save this view — filter field "${unreadable}" is not readable.`,
    });
  }
}

/**
 * Server-side args for `saveView`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 */
export interface SaveViewServerArgs<DataModel extends GenericDataModel> {
  /** Convex mutation context. */
  ctx: GenericMutationCtx<DataModel>;
  /** The resolved `VexConfig`. */
  config: VexConfig;
  /** Per-call access overrides, forwarded to `resolveAccessCall`. */
  access?: AccessCallOptions<string>;
  /**
   * Resolved caller identity. `auth.user` records `createdBy`; `auth.organization`
   * stamps `organizationId` when `config.access.orgCollectionSlug` is configured —
   * never a client-supplied organization id. Also the identity checked against
   * `view.state.where` by `assertViewWhereReadable`.
   */
  auth?: VexApiAuth;
  /** The collection slug the view belongs to. */
  collection: CollectionSlug;
  /**
   * The view to save. `viewId` is client-generated (decision 14) and is
   * the idempotency key: a second call with the same `viewId` patches the
   * existing row in place instead of inserting a duplicate — this is what
   * makes promotion (local → shared) safe against another tab racing the
   * same save. `view.description` is optional free text, stored verbatim
   * and shown under the view's name (Step 12). `view.state.where` is the
   * saver's own filter only — never a config view's hidden `where`
   * (decision 25); "Save as new view" from a config view never carries
   * the hidden filter into `state`.
   */
  view: VexViewConfig;
}

/**
 * Creates or patches one `vex_views` row — an insert requires `createView`,
 * a patch requires `updateView` (decision 13), so the gate runs AFTER the
 * idempotency lookup decides which action applies. Idempotent on
 * `view.viewId` (decision 14). Stores `view.description` alongside `name`
 * and `state`; an undefined `description` clears any previously saved one
 * on patch.
 *
 * `assertViewPayloadValid` runs FIRST of all — before `assertViewIdNotReserved`,
 * before any DB read — a malformed payload (`view.state` not a plain object,
 * `viewId`/`name` not strings) is a caller bug regardless of everything else
 * (polish fix, Decision 2). `assertViewIdNotReserved` runs next — a `viewId`
 * colliding with the collection's declared `admin.view`/`admin.views` ids
 * is also a caller bug regardless of permissions, so it's rejected before the
 * idempotency lookup even runs. The idempotency lookup (`by_view_id`) runs
 * next — it only confirms whether a row exists and which collection/organization
 * it belongs to, leaking nothing beyond that, so running it before the access
 * gate is safe. Under org scoping (`config.access.organizations` is
 * `true` — NOT `orgCollectionSlug` alone, developer-approved binding
 * correction), a caller whose own org doesn't resolve is denied outright
 * — the same "not found" shape whether `view.viewId` already exists or
 * not, so existence is never leaked. A resolved caller may only touch an
 * EXISTING row whose own `organizationId` exactly matches theirs; an
 * org-less row (saved before org scoping was enabled) is invisible and
 * inert under scoping too, same as a genuinely cross-org row — it is
 * never adopted, read, or silently claimed (polish fix, Decision 3). A
 * patch never rewrites an existing, different `organizationId`. Access
 * and the field-read check (decision 26) both run before any row is
 * written.
 *
 * Server-side only. Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, collection, view, access?, auth? }`.
 * @returns The saved view's `viewId` (unchanged from `args.view.viewId`).
 * @throws {VexError} (`code: "INVALID_VIEW"`) When `view.viewId`/`view.name` aren't
 *   strings, or `view.state` isn't a plain object.
 * @throws {VexError} (`code: "RESERVED_VIEW_ID"`) When `view.viewId` matches
 *   the collection's declared `admin.view.viewId` or an `admin.views[].viewId`.
 * @throws {ConvexError} When an existing row for `view.viewId` belongs to a
 *   different collection; OR, when `config.access.organizations` is `true`,
 *   the caller's own org doesn't resolve, OR an existing row's
 *   `organizationId` (including an org-less row) isn't exactly the
 *   caller's own.
 * @throws {VexAccessError} When the caller's roles lack `createView` (insert) or
 *   `updateView` (patch) on `collection`, or when `view.state.where` references
 *   a field the caller can't read.
 * @example
 * ```ts
 * import { saveView } from "@vexcms/core/server";
 *
 * export const postsSaveView = mutation({
 *   args: { view: v.any() },
 *   handler: (ctx, args) =>
 *     saveView({ ctx, config, collection: "posts", view: args.view }),
 * });
 * ```
 */
export async function saveView<DataModel extends GenericDataModel>(
  args: SaveViewServerArgs<DataModel>,
): Promise<string> {
  assertViewPayloadValid({ view: args.view });
  assertViewIdNotReserved({ config: args.config, collection: args.collection, viewId: args.view.viewId });

  const existing = await args.ctx.db
    .query("vex_views")
    // @ts-expect-error querying a generic DataModel's table by a runtime-resolved index/field name
    .withIndex("by_view_id", (q) => q.eq("viewId", args.view.viewId))
    .unique();

  if (existing && existing.collection !== args.collection) {
    throw new ConvexError(
      `viewId "${args.view.viewId}" already belongs to collection "${existing.collection}"`,
    );
  }

  const orgScoped = isViewOrganizationScopingEnabled(args.config.access);
  const organizationId = resolveViewOrganizationId({ access: args.config.access, organization: args.auth?.organization });

  // Decision 3 (org scoping, extended): a caller whose own org doesn't
  // resolve is denied outright — never reaches the insert/patch below,
  // whether or not `view.viewId` already exists (no existence leak). Once
  // `organizationId` is confirmed defined, an EXISTING row whose own
  // `organizationId` isn't EXACTLY the caller's own is rejected the same
  // way — this single `!==` naturally also covers an org-less row (`undefined
  // !== organizationId` is true): it is no longer adopted, only invisible and
  // inert, same as a genuinely cross-org row.
  if (orgScoped && (organizationId === undefined || (existing && existing.organizationId !== organizationId))) {
    throw new ConvexError(`No view "${args.view.viewId}" found for collection "${args.collection}"`);
  }

  assertViewAction({
    config: args.config,
    auth: args.auth,
    access: args.access,
    resource: args.collection,
    action: existing ? VIEW_ACTIONS.updateView : VIEW_ACTIONS.createView,
  });

  assertViewWhereReadable({
    config: args.config,
    auth: args.auth,
    resource: args.collection,
    where: (args.view.state as { where?: unknown } | undefined)?.where,
  });

  if (existing) {
    // `organizationId ?? existing.organizationId` — when `orgScoped`, the check
    // above already guarantees `existing.organizationId === organizationId`
    // (both defined) by this point, so this just re-stamps the SAME value, never
    // adopts or moves a view across orgs; when NOT `orgScoped`, `organizationId`
    // is always `undefined`, so this preserves whatever the row already had.
    // @ts-expect-error patching a generic DataModel's table by a runtime-resolved row id
    await args.ctx.db.patch(existing._id, {
      name: args.view.name,
      description: args.view.description,
      state: args.view.state,
      organizationId: organizationId ?? existing.organizationId,
    });
  } else {
    // @ts-expect-error inserting into a generic DataModel's table by a runtime-resolved table name
    await args.ctx.db.insert("vex_views", {
      collection: args.collection,
      viewId: args.view.viewId,
      name: args.view.name,
      description: args.view.description,
      state: args.view.state,
      organizationId,
      createdBy: (args.auth?.user as { _id?: string } | null)?._id ?? "",
    });
  }

  return args.view.viewId;
}
