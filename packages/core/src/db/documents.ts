import type { GenericDataModel, GenericDocument, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug } from "../types";
import {
  hasPermission,
  isFieldAllowed,
  resolveFieldPermissions,
  stripDeniedFields,
  VexAccessConfig,
} from "../access";
import type { VexApiAuth } from "./types";

/**
 * Adds the auto-maintained `updatedAt` timestamp to a write payload, when the
 * target collection carries the field `defineCollection` injects.
 *
 * Shared by `create` and `update` so the two write paths cannot drift on when
 * a document gets stamped.
 *
 * Skipped in three cases, all deliberate:
 * - The slug matches no registered collection — nothing declares the column,
 *   and Convex's schema validation would reject the write.
 * - The collection opted out with `{ timestamps: false }`, so `fields` has no
 *   `updatedAt` entry.
 * - The field is `meta.locked` — that is better-auth's OWN `updatedAt`,
 *   populated from the auth table's real schema attribute. Its adapter owns
 *   that value, so vexcms must never write it.
 *
 * @param props - The resolved config, target collection slug, and the payload
 *   exactly as the caller sent it.
 * @returns The payload, with `updatedAt` set to now when the collection
 *   carries an unlocked `updatedAt` field; otherwise the payload unchanged.
 */
export function stampUpdatedAt<TData>(props: {
  collection: CollectionSlug;
  config: VexConfig;
  data: TData;
}): TData {
  const collection = props.config.collections.find((c) => c.slug === props.collection);
  const field = collection?.fields.updatedAt;
  if (field === undefined) {
    return props.data;
  }
  // `meta` is generic over `TFieldMeta`, so `locked` is not on its static
  // shape. Read it through a validated boundary rather than asserting: only a
  // literal `true` counts, anything else stamps.
  const meta: Record<string, unknown> = field.meta;
  if (meta.locked === true) {
    return props.data;
  }
  return { ...props.data, updatedAt: Date.now() };
}

/**
 * Resolves the collection slug that owns a document `id` by probing
 * `ctx.db.normalizeId` against every registered collection, media collections
 * included.
 *
 * A Convex `Id` does not expose its table name at runtime. `get/server.ts`'s
 * D12 comment documents the same constraint for depth-populate, where
 * degrading to "unresolvable" is safe (populate is simply skipped). It is
 * NOT safe here — both callers gate a real permission check on the result —
 * so this resolves the slug via the `ctx.db.normalizeId(tableName, id)`
 * syscall instead of string-parsing the id. Unlike the D12 trick, this works
 * identically in `convex-test` and production Convex.
 *
 * **Media collections must be probed, not just `config.collections`.** Both
 * callers — `getUrl` and `deleteMedia` — pass a MEDIA document id by
 * definition, and `defineConfig` keeps `collections` and `mediaCollections` as
 * separate arrays (`config/config.ts`). Probing only the former made every
 * media id unresolvable, so `getUrl` threw for any project that configured
 * `access` at all: uploaded images silently vanished from public pages
 * (`MediaImage` renders `null` when the query errors) and no `og:image` was
 * ever emitted. `validateAccessConfig` already concatenates both arrays when
 * validating resources, so a media slug is a legitimate permission subject —
 * this makes the runtime lookup agree with that.
 *
 * @param props.ctx - Query or mutation context — only `ctx.db.normalizeId` is used.
 * @param props.config - The resolved `VexConfig`, to enumerate candidate collections.
 * @param props.id - The document id to resolve.
 * @returns The owning collection's slug.
 * @throws {Error} When no registered collection claims the id (e.g. an id for a
 *   non-collection table like `vex_globals`, or a stale id from a deleted collection).
 *   Callers gate the permission check behind this, so an unresolvable id is a hard error,
 *   not a silent skip.
 */
export function resolveCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config?: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug {
  const candidates = [
    ...(props.config?.collections ?? []),
    ...(props.config?.mediaCollections ?? []),
  ];
  for (const c of candidates) {
    if (props.ctx.db.normalizeId(c.slug, props.id) !== null) {
      return c.slug;
    }
  }
  throw new Error("[resolveCollectionSlug]: document id does not match a collection slug");
  // Note: both arrays are small and `normalizeId` is a local syscall (no DB round trip),
  // so looping them once per `getUrl`/`deleteMedia` request is cheap.
}

/**
 * The per-document read pass `find` and `search` share: `hasPermission`, then the
 * caller's field permissions, then stripping denied fields.
 *
 * A document is dropped, not stripped, when the caller's `where` referenced a field
 * this caller may not read on it: a match on a hidden field would reveal the
 * field's value through which rows came back (for example, "which posts have
 * `salary > 100000`").
 *
 * @param props - Input props.
 * @param props.docs - Documents as fetched.
 * @param props.access - From `resolveReadCall` / `resolveAccessCall`; `undefined` when
 *   access is bypassed or unconfigured, which allows everything.
 * @param props.auth - The caller.
 * @param props.resource - Subject slug.
 * @param props.action - Read action being checked.
 * @param props.whereFields - Field names the caller's `where` referenced, system fields
 *   excluded; `[]` when there is no caller `where` or access is not enforced.
 * @returns The readable documents, with denied fields removed.
 */
export function readableDocuments<TDoc extends GenericDocument>(props: {
  docs: readonly TDoc[];
  access: VexAccessConfig | undefined;
  auth: VexApiAuth | undefined;
  resource: string;
  action: string;
  whereFields: readonly string[];
}): TDoc[] {
  const user = props.auth?.user ?? null;
  const organization = props.auth?.organization;
  const readable: TDoc[] = [];
  for (const doc of props.docs) {
    if (!hasPermission({ access: props.access, resource: props.resource, action: props.action, data: doc, user, organization })) {
      continue;
    }
    const fieldPermissions = resolveFieldPermissions({
      access: props.access,
      user,
      organization,
      resource: props.resource,
      action: props.action,
      data: doc,
    });
    if (props.whereFields.some((field) => !isFieldAllowed(fieldPermissions, field))) continue;
    readable.push(stripDeniedFields(doc, fieldPermissions));
  }
  return readable;
}
