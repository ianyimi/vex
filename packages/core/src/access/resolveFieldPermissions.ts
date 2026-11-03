import { PERMISSION_SCOPES, WILDCARD_KEY } from "./constants";
import type { PermissionScope } from "./constants";
import { resolveRolePermissions } from "./hasPermission";
import type { FieldPermissionMap, VexAccessConfig } from "./types";

/**
 * Document keys Convex owns that a caller can never WRITE (never present in
 * an insert/patch payload, so the write-path field-permission diff skips
 * them unconditionally — `hasPermission.ts`), and that a declared `where`
 * clause referencing them never needs a read-permission check for
 * (`matchDeclaredSavedListViewFilter.ts`/`saveView/server.ts`) — same reasoning
 * `resolveQueryIndex.ts`'s own `_creationTime` SORT carve-out already
 * establishes: a comparison against one of these doesn't reveal the stored
 * value the way returning it in a document would.
 *
 * Deliberately NOT the same set {@link stripDeniedFields}/
 * `warnOnUndeclaredFields` use for READ gating — see
 * {@link ALWAYS_READABLE_FIELD_KEYS} for that narrower set. `_creationTime`
 * is a REAL gateable field-permission key for READS (developer decision,
 * binding, "access-system-fields") but stays write-immutable and
 * where-clause-exempt here; the two concerns are independent axes.
 */
export const SYSTEM_FIELD_KEYS = new Set(["_id", "_creationTime", "_slug"]);

/**
 * Document keys a field map can neither gate nor strip for READS — always
 * readable, regardless of any permission rule. Used by {@link stripDeniedFields}
 * (never deletes these) and `warnOnUndeclaredFields` (warns rather than
 * silently accepting one as a real per-field decision). Narrower than
 * {@link SYSTEM_FIELD_KEYS} — `_creationTime` is excluded (it IS gateable for
 * reads now); `_id`/`_slug` stay excluded from field-level gating entirely,
 * the same set `access/types.ts`'s `SystemFieldKey` type enforces at compile
 * time.
 */
export const ALWAYS_READABLE_FIELD_KEYS = new Set(["_id", "_slug"]);

/**
 * A caller's merged per-field decision for one resource + action.
 *
 * `wildcard` answers every field with no entry in `fields`, so this shape
 * describes a decision for fields it has never heard of — which is what lets
 * the read path shape a document without enumerating its schema.
 */
export interface ResolvedFieldPermissions {
  /** Decision for any field absent from `fields`. */
  wildcard: boolean;
  /** Explicit per-field decisions, OR-merged across the caller's roles. */
  fields: Record<string, boolean>;
}

/** Unrestricted: every field permitted. The RBAC-off and no-map-declared result. */
export const UNRESTRICTED_FIELDS: ResolvedFieldPermissions = { wildcard: true, fields: {} };

/**
 * True when a callback's return value is a field map rather than a boolean.
 *
 * One line, because a map only ever arrives as a callback's return: there is no
 * descriptor to tell it apart from, and no key whose name could collide with
 * the API's own.
 *
 * @param value - A resolved check's result.
 * @returns `true` when `value` is a field map.
 */
export function isFieldPermissionMap(value: unknown): value is FieldPermissionMap {
  return typeof value === "object" && value !== null;
}

/**
 * Dev-only warning for a returned map naming a field the resource does not
 * declare — a misspelling, or a system key the runtime ignores.
 *
 * A BACKSTOP, not the primary mechanism: `ValidateFieldMaps` rejects these at
 * compile time, so a TypeScript consumer never sees this warning. It earns its
 * keep for the cases the compiler cannot reach — a plain-JS `vex.config.js`, a
 * `permissions` matrix assembled at runtime, or a config cast through `as`.
 *
 * Warns, never throws: a Convex document can carry fields the schema does not
 * declare.
 *
 * @internal
 */
function warnOnUndeclaredFields(props: {
  map: FieldPermissionMap;
  access: VexAccessConfig;
  resource: string;
  action: string;
}): void {
  if (process.env.NODE_ENV === "production") return;

  const resourceEntry = props.access.resources.find((entry) => entry.slug === props.resource);
  if (resourceEntry === undefined) return;

  const declaredFields = resourceEntry.fields;
  if (declaredFields === undefined) return;

  for (const key of Object.keys(props.map)) {
    if (key === WILDCARD_KEY) continue;
    if (key in declaredFields) continue;

    if (ALWAYS_READABLE_FIELD_KEYS.has(key)) {
      console.warn(
        `[vexcms] Field map for "${props.resource}.${props.action}" names system field ` +
          `"${key}", which is never gateable and is always retained — the entry is ignored.`,
      );
      continue;
    }

    // `vex_status` is a real, gateable field-permission key on a VERSIONED
    // resource (developer decision, binding, "access-system-fields") — it is
    // never a `declaredFields` entry (Convex column injected by the versioning
    // system, not a `CollectionConfig.fields` entry), so without this check a
    // legitimate `vex_status` map entry would misfire the generic "undeclared
    // field" warning below on every versioned collection.
    const isVersioned =
      key === "vex_status" &&
      typeof resourceEntry === "object" &&
      resourceEntry !== null &&
      "versions" in resourceEntry &&
      (resourceEntry as { versions?: { drafts?: boolean } }).versions?.drafts === true;
    if (isVersioned) continue;

    console.warn(
      `[vexcms] Field map for "${props.resource}.${props.action}" returns a field not ` +
        `declared on "${props.resource}": "${key}". Check for a typo — until fixed the field ` +
        `stays on the wildcard's decision, which is the fail-open direction under "*": true.`,
    );
  }
}

/** Props for {@link resolveFieldPermissions}. */
export interface ResolveFieldPermissionsProps<TData = unknown> {
  /** Resolved config from `defineAccess()`. `undefined` disables restriction. */
  access?: VexAccessConfig;
  /** The authenticated user document. Roles resolve exactly as in `hasPermission`. */
  user: Record<string, unknown> | null;
  /** Organization document; only meaningful when `access.orgCollectionSlug` is set. */
  organization?: Record<string, unknown>;
  /** Subject name — a resource slug. */
  resource: string;
  /** Action on `resource`. */
  action: string;
  /**
   * The document the filter callback receives. Pass it whenever available: a
   * map's per-field booleans are usually expressions over it, and a callback
   * that reads `data` without it resolves per `scope` instead.
   */
  data?: TData;
  /**
   * How to answer when a filter callback needs the document and `data` was not
   * supplied. Defaults to `PERMISSION_SCOPES.all`, matching `hasPermission`.
   *
   * The list views pass `"any"`: a column is shown or hidden for the whole
   * table, so "denied for EVERY document" is the right question, and `all`
   * would hide columns whose denial is only per document.
   */
  scope?: PermissionScope;
}

/**
 * Which fields the caller may touch on one resource + action — the read-only
 * counterpart to `hasPermission`, sharing its role walk.
 *
 * This answers "which fields?"; `hasPermission` answers "may they?". It never
 * denies an operation and never throws on a denial: use it to shape a read
 * response ({@link stripDeniedFields}) or to gate admin inputs
 * (`useFieldPermissions`), and `hasPermission` to authorize.
 *
 * @param props @see {@link ResolveFieldPermissionsProps}
 * @returns The merged decision. {@link UNRESTRICTED_FIELDS} when RBAC is off,
 *   when any of the caller's roles permits the action outright, or when no role
 *   declared a map for this action.
 */
export function resolveFieldPermissions<TData = unknown>(
  props: ResolveFieldPermissionsProps<TData>,
): ResolvedFieldPermissions {
  const { access } = props;

  if (!access || access.enabled === false) {
    return UNRESTRICTED_FIELDS;
  }

  const fieldPermissionsPerRole = resolveRolePermissions({
    access,
    user: props.user,
    data: props.data,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
    scope: props.scope ?? PERMISSION_SCOPES.all,
  });

  if (fieldPermissionsPerRole.length === 0) {
    return { wildcard: false, fields: {} };
  }
  if (fieldPermissionsPerRole.some((result) => result === true)) {
    return UNRESTRICTED_FIELDS;
  }

  const fieldPermissionMapsPerRole = fieldPermissionsPerRole.filter(isFieldPermissionMap);
  for (const map of fieldPermissionMapsPerRole) {
    warnOnUndeclaredFields({ map, access, resource: props.resource, action: props.action });
  }

  let wildcard = false;
  for (const map of fieldPermissionMapsPerRole) {
    if (map[WILDCARD_KEY] === true) {
      wildcard = true;
      break;
    }
  }

  const fieldKeys = new Set<string>();
  for (const map of fieldPermissionMapsPerRole) {
    for (const key of Object.keys(map)) {
      if (key !== WILDCARD_KEY) fieldKeys.add(key);
    }
  }

  const fields: Record<string, boolean> = {};
  for (const key of fieldKeys) {
    let permitted = false;
    for (const map of fieldPermissionMapsPerRole) {
      const ownAnswer = Object.hasOwn(map, key) ? map[key] : (map[WILDCARD_KEY] ?? false);
      if (ownAnswer) {
        permitted = true;
        break;
      }
    }
    if (permitted !== wildcard) {
      fields[key] = permitted;
    }
  }

  return { wildcard, fields };
}

/**
 * Whether one field is permitted under a resolved decision.
 *
 * @param resolved - Result of {@link resolveFieldPermissions}.
 * @param field - Field name.
 * @returns The explicit decision when present, else the wildcard.
 */
export function isFieldAllowed(resolved: ResolvedFieldPermissions, field: string): boolean {
  return resolved.fields[field] ?? resolved.wildcard;
}

/**
 * Shallow-copies `doc` and deletes every key the caller may not read. Used by
 * the read paths to shape responses; never mutates what Convex returned.
 *
 * `_id`/`_slug` are always retained — stripping `_id` would break
 * `populateDocs`, admin row keys, and every `update({ id })` round trip.
 * `_creationTime` is NOT exempted here (developer decision, binding,
 * "access-system-fields") — it is a real gateable field-permission key for
 * reads now, stripped like any other field a resolved map denies.
 *
 * @param doc - The document Convex returned.
 * @param resolved - Result of {@link resolveFieldPermissions}.
 * @returns `doc` itself (same reference) when nothing is restricted — no
 *   allocation on the common path; otherwise a shallow copy minus denied keys.
 */
export function stripDeniedFields<TDoc extends Record<string, unknown>>(
  doc: TDoc,
  resolved: ResolvedFieldPermissions,
): TDoc {
  if (resolved.wildcard === true && Object.keys(resolved.fields).length === 0) {
    return doc;
  }

  const stripped = { ...doc };
  for (const key of Object.keys(stripped)) {
    if (ALWAYS_READABLE_FIELD_KEYS.has(key)) continue;
    if (!isFieldAllowed(resolved, key)) {
      delete stripped[key];
    }
  }
  return stripped;
}
