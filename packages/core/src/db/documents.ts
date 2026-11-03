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
import { ADMIN_FIELDS, type AdminField } from "../fields";
import type { VexApiAuth } from "./types";

/** The semantic write events a `commitTs()` field's `on` option can be stamped by. */
export type CommitTsWriteEvent = "create" | "update" | "publish" | "unpublish" | "draftSave";

/** Which {@link CommitTsWriteEvent}s each `CommitTsFieldOn` policy stamps on. */
const COMMIT_TS_EVENTS_BY_ON: Record<string, ReadonlySet<CommitTsWriteEvent>> = {
  save: new Set(["create", "update", "publish", "unpublish"]),
  publish: new Set(["publish"]),
  all: new Set(["create", "update", "publish", "unpublish", "draftSave"]),
};

/**
 * Stamps every `commitTs()` field on `fields` whose `on` policy matches one
 * of `events` with `ctx.db.vars.commitTs` — the unresolved placeholder
 * Convex resolves to the real commit nanosecond timestamp once this
 * mutation commits (per the Convex commit-timestamp docs).
 *
 * Replaces `stampUpdatedAt`: unlike `Date.now()`, a `commitTs` value is
 * never computed by app code — the app must explicitly write the
 * placeholder into the field for Convex to resolve it at commit, so every
 * write path that wants a `commitTs` field to advance must call this.
 *
 * @param props - Input props.
 * @param props.ctx - The active mutation context — `ctx.db.vars.commitTs` is
 *   mutation-ctx-only (not present on a query ctx).
 * @param props.fields - The resource's resolved field map (`collection.fields`
 *   or `target.config.fields` — works for both collections and globals).
 * @param props.data - The write payload to stamp fields onto.
 * @param props.events - Every semantic event this one write satisfies (e.g.
 *   `["create", "publish"]` for creating a non-versioned document, since a
 *   non-versioned create has no separate publish step and is live immediately).
 * @returns `props.data`, with every matching `commitTs` field set to the
 *   placeholder; fields whose `on` policy doesn't match any of `events` are
 *   left untouched (absent on a true first write, or carrying their
 *   previously-resolved value on a write that doesn't advance them).
 */
export function stampCommitTsFields<TData extends Record<string, unknown>>(props: {
  ctx: { db: { vars: { commitTs: unknown } } };
  fields: Record<string, AdminField>;
  data: TData;
  events: readonly CommitTsWriteEvent[];
}): TData {
  let data = props.data;
  for (const [fieldKey, field] of Object.entries(props.fields)) {
    if (field.type !== ADMIN_FIELDS.commitTs.type) continue;
    const allowedEvents = COMMIT_TS_EVENTS_BY_ON[field.on] ?? COMMIT_TS_EVENTS_BY_ON.save;
    if (props.events.some((event) => allowedEvents.has(event))) {
      data = { ...data, [fieldKey]: props.ctx.db.vars.commitTs };
    }
  }
  return data;
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
  fields?: Record<string, AdminField>;
}): TDoc[] {
  const user = props.auth?.user ?? null;
  const organization = props.auth?.organization;
  const commitTsKeys = props.fields
    ? Object.entries(props.fields)
        .filter(([, field]) => field.type === ADMIN_FIELDS.commitTs.type)
        .map(([key]) => key)
    : [];
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
    const stripped = stripDeniedFields(doc, fieldPermissions);
    readable.push(commitTsKeys.length === 0 ? stripped : convertCommitTsFieldsToMs({ doc: stripped, keys: commitTsKeys }));
  }
  return readable;
}

/**
 * Converts every `commitTs`-typed field named in `keys` from Convex's
 * resolved nanosecond `bigint` to a plain Unix-ms `number`
 * (`Number(ns / BigInt(1_000_000))` — lossless for any realistic wall-clock epoch,
 * per probe §5). Fields that are `undefined` (never stamped yet) or not a
 * `bigint` (should not happen past schema validation, but defensive against
 * an un-migrated row) are left untouched.
 *
 * @returns `doc`, shallow-copied once per converted field (unmodified when
 *   no field in `keys` holds a `bigint`).
 */
export function convertCommitTsFieldsToMs<TDoc extends GenericDocument>(props: {
  doc: TDoc;
  keys: readonly string[];
}): TDoc {
  let doc = props.doc;
  for (const key of props.keys) {
    const value = doc[key];
    if (typeof value === "bigint") {
      doc = { ...doc, [key]: Number(value / BigInt(1_000_000)) };
    }
  }
  return doc;
}
