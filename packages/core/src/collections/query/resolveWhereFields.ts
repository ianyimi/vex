import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionConfig } from "../types";
import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, VexApiAuth } from "../../db/types";
import { referencedWhereFields, type VexWhere, type VexWhereNode } from "../../db/queryArgs";
import { CRUD_ACTIONS, PERMISSION_SCOPES, SYSTEM_FIELD_KEYS, type VexAccessConfig } from "../../access";
import { isFieldAllowed, resolveFieldPermissions } from "../../access/resolveFieldPermissions";
import { loadSharedSavedListViewWheres, matchDeclaredSavedListViewFilter } from "../savedListViews/matchDeclaredSavedListViewFilter";

/**
 * Resolves which fields of `where` must still pass the caller's field-read
 * check (Design Decision 26) — every referenced field EXCEPT one that
 * exactly matches a declared config-view filter or (lazily, only when the
 * config-view pass alone still leaves an unreadable field) a readable
 * shared view's declared filter. `find` and `search` both run this exact
 * ~55-line pipeline (`configMatch` → `configWhereFields` →
 * `configFieldPermissions` → `hasUnreadableConfigField` → `sharedWheres` →
 * `declaredFilterRemainder` → `whereFields`) against their own `where`;
 * extracted here (polish fix) so the two copies can't drift.
 *
 * @param props - Input props.
 * @param props.ctx - Convex query context, for `loadSharedSavedListViewWheres`'s
 *   lazy `vex_views` read.
 * @param props.config - The resolved `VexConfig`, forwarded to
 *   `loadSharedSavedListViewWheres`.
 * @param props.collection - The collection slug being queried.
 * @param props.collectionConfig - The resolved `CollectionConfig`, or
 *   `undefined` for an unknown collection — passed straight through to
 *   `matchDeclaredSavedListViewFilter`'s own permissive fallback.
 * @param props.where - The caller's `where`, already converted to the
 *   server's own representation (e.g. `find`'s commitTs ms→ns pass).
 * @param props.access - The resolved access config (from
 *   `resolveAccessCall`/`resolveReadCall`); `undefined` means access is
 *   bypassed or unconfigured — nothing is enforced, so this returns `[]`
 *   without reading anything.
 * @param props.callerAccess - The caller's own raw `access` override
 *   (`args.access`), forwarded verbatim to `loadSharedSavedListViewWheres`.
 * @param props.auth - The caller's resolved identity.
 * @param props.resource - The permission resource (usually the collection slug).
 * @returns The field names `readableDocuments`'s `whereFields` arg
 *   expects — `[]` when access is bypassed/unconfigured, or nothing is
 *   left in `where` to check.
 */
export async function resolveWhereFields<DataModel extends GenericDataModel, S extends string = string>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config?: VexConfig;
  collection: CollectionSlug;
  collectionConfig: CollectionConfig | undefined;
  where: VexWhereNode<S> | undefined;
  access: VexAccessConfig | undefined;
  callerAccess?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  resource: string;
}): Promise<string[]> {
  // A request `where` part that deep-equals a config view's own `where` is
  // trusted server config, exempt from the field-read check below (Design
  // Decision 26's one exception).
  const configMatch = matchDeclaredSavedListViewFilter({ collection: props.collectionConfig, where: props.where });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  const configWhereFields =
    props.access !== undefined && configMatch.remainder !== undefined
      ? referencedWhereFields({ where: configMatch.remainder as VexWhere<string> }).filter(
          (field) => !SYSTEM_FIELD_KEYS.has(field),
        )
      : [];
  // Decision 26's "Shared views" bullet: only when the config-view match
  // above still leaves an unreadable field does this pay for a
  // `vex_views` read — an ordinary query never touches the table.
  const configFieldPermissions =
    props.access !== undefined && configWhereFields.length > 0
      ? resolveFieldPermissions({
          access: props.access,
          user: props.auth?.user ?? null,
          organization: props.auth?.organization,
          resource: props.resource,
          action: CRUD_ACTIONS.read,
          scope: PERMISSION_SCOPES.any,
        })
      : undefined;
  const hasUnreadableConfigField =
    configFieldPermissions !== undefined &&
    configWhereFields.some((field) => !isFieldAllowed(configFieldPermissions, field));
  const sharedWheres = hasUnreadableConfigField
    ? await loadSharedSavedListViewWheres<DataModel, S>({
        ctx: props.ctx,
        config: props.config as VexConfig,
        access: props.callerAccess,
        collection: props.collection,
        auth: props.auth,
      })
    : [];
  const { remainder: declaredFilterRemainder } =
    sharedWheres.length === 0
      ? configMatch
      : matchDeclaredSavedListViewFilter({
          collection: props.collectionConfig,
          where: props.where,
          sharedWheres,
        });
  // Only enforced reads are guarded; a bypassed read may filter on anything.
  return props.access !== undefined && declaredFilterRemainder !== undefined
    ? referencedWhereFields({ where: declaredFilterRemainder as VexWhere<string> }).filter(
        (field) => !SYSTEM_FIELD_KEYS.has(field),
      )
    : [];
}
