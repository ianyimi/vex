---
status: draft
spec_id: 2026-09-07-field-level-rbac-permissions
touches:
  - packages/core/src/access/**
  - packages/core/src/api/create/server.ts
  - packages/core/src/api/update/server.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/react/src/hooks/useFieldPermissions.ts
  - packages/react/src/hooks/index.ts
  - packages/react/src/components/views/CollectionEditView.tsx
  - apps/docs/src/content/docs/guides/access-control.mdx
  - packages/core/README.md
  - .agent/docs/product/backlog.md
prompt_version: 1
---

# 2026-09-07-field-level-rbac-permissions — Spec

## Overview

RBAC (`defineAccess()`/`hasPermission()`, spec 2026-08-12) resolves per document, not per
field: a role either can or cannot read/write a resource, with no way to say "editor may
change `title` but not `price`". The 2026-08-25 access-constraint-builder spec removed the
old `{ mode, fields }` shape as part of its rewrite and explicitly deferred bringing it back
("not abandoned") once a shape existed that didn't try to make Convex do per-field query
filtering. This spec adds that shape: a `fields` permission map on the existing per-role
resource entry, resolved by one new function (`resolveFieldPermissions`) that the write path
(`create`/`update`) uses to reject a payload touching a denied field, the read path
(`find`/`get`/`search`) uses to strip denied fields from returned documents, and the admin
panel uses (client-side, advisory) to disable denied fields in the edit form. It is
explicitly documented as runtime-only — enforced in the generated Convex functions and the
admin-panel bundle, the same boundary `hasPermission()` already has, and the same boundary
kitcn's Convex ORM RLS docs state for the same reason: Convex has no engine-level policy
hook, so anything bypassing these entry points (a hand-rolled function calling `ctx.db`
directly) bypasses this the same way it already bypasses `hasPermission()`.

## Design Decisions

1. **One config surface.** Field grants are a `fields` sibling on the existing per-role
   resource entry inside `RolePermissions` — not a parallel `defineFieldAccess()`. Reuses the
   subject/action typing `defineAccess()` already generates; no second wiring point into
   `vex.config.ts`.
2. **Callback shape, not the removed array shape.** `FieldPermissionCheck` is
   `boolean | (props) => boolean`, taking the same `{ user, data, organization }` shape as a
   resource-level `PermissionCheck`. The removed `{ mode, fields }` shape existed to drive
   query-time filtering through the constraint builder, which Convex cannot express
   per-field on an index; this check never touches a query — it runs in plain JS, once per
   field, against an already-fetched document or an already-validated payload.
3. **Unlisted field defaults to allowed.** `fields` narrows an already-granted
   resource/action; it does not independently gate the resource (that stays
   `hasPermission()`'s job). Fail-closed-by-default here would silently deny every other
   field on a resource the moment one role gets one field rule.
4. **Read shaping runs after the existing document-level check**, in `find`, `get`, and
   `search`: a document invisible to `hasPermission()` is dropped entirely (unchanged); a
   visible document has denied keys stripped. Matches kitcn's documented ORM-RLS ordering
   ("policies are evaluated post-fetch").
5. **Write denial rejects the whole write.** `create()`/`update()` throw `VexAccessError` on
   the first payload key the caller's role can't set — no partial patch, no silent drop.
   Matches the existing `throwOnDenied: true` posture at every other `hasPermission()` call
   site. A legitimate client never hits this path (the admin form disables denied fields via
   Decision 8); it only fires for a caller that bypasses the UI gate, which should be loud.
6. **`VexAccessError` gains an optional `field`.** Included in the wire payload only when
   the denial is field-scoped — every `ConvexError.data` key must be present-and-defined or
   absent, never `undefined` (`convexToJson` rejects `undefined`; see the serializability
   tests in `hasPermission.test.ts`).
7. **Both `create` and `update` are covered**, authorized the way each operation's existing
   document-level check already is: `create` evaluates callbacks against the payload itself
   (nothing stored yet); `update` evaluates against the STORED document (ADR-002's
   precedent — checking the patch lets a rule be satisfied by whatever the caller chose to
   send). `remove()` is untouched: a delete has no fields to authorize.
8. **Type narrowing is deferred, not attempted.** `find`/`get`/`create`/`update` return/arg
   types keep describing the full document. A caller may receive or be allowed fewer keys
   than the type promises for their current role. Tracked in `backlog.md`, mirroring the
   2026-08-25 spec's own "explicitly deferred, not abandoned" posture for this exact gap.
9. **Admin gating is advisory, client-side, no round trip.** `useFieldPermissions()` calls
   `resolveFieldPermissions()` directly against the bundle-imported `access` config (P-004) —
   the same pattern `usePermission` already uses for resource-level checks.

## Out of Scope

- Generic type-parameter narrowing on server API signatures (Decision 8) — backlog item, not
  this spec.
- `resolveAccessConstraint`/`resolveAccessIndex` and index pushdown — untouched. Field grants
  never influence query-time index selection; they only shape what a query's *results* look
  like after the existing document-level filtering.
- Field grants on populated relations — a populated related document's own field grants are
  not recursively evaluated by `populateDocs`.
- `remove()` — no payload to authorize on a delete.
- Reintroducing the removed `{ mode, fields }` array shape or its old tests.

## Implementation

### Step 1 — Field-permission types and `defineAccess()` config `[dev]`

Every later step reads or writes this shape.

#### packages/core/src/access/types.ts

3 edits. Everything else in the file is unchanged.

**1 — add `FieldPermissionCheck` and `FieldPermissionMap`.** Add immediately after the
existing `PermissionCheck` type (the one ending around the `SubjectEntry` interface, i.e.
right before `export interface SubjectEntry`):

```ts
/**
 * Single field-level permission check — boolean shorthand, or a callback
 * evaluated against the same {@link PermissionCallbackProps} shape as a
 * resource-level {@link PermissionCheck}.
 *
 * Deliberately NOT the `{ mode, fields }` array shape the 2026-08-25
 * access-constraint-builder spec removed (see that spec's Out of Scope —
 * "Reinstating field-level permissions"). That shape existed to drive QUERY
 * FILTERING through the constraint builder, which Convex cannot express
 * per-field on an index. This check never touches a query: it runs in plain
 * JS, once per field, against an already-fetched document (read path) or an
 * already-validated payload (write path) — an ordinary callback is enough.
 *
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` when not configured.
 */
export type FieldPermissionCheck<
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = boolean | ((props: PermissionCallbackProps<TData, TUser, TOrg>) => boolean);

/**
 * Per-field permission map for one role/resource entry.
 *
 * A field ABSENT from the map is ALLOWED — the map narrows an already-granted
 * resource/action, it does not independently gate the resource (see DD 3).
 * Denying every field here does not deny the resource itself; deny the
 * resource/action check for that.
 *
 * Not a generic-bound inference site (`TFields` is already resolved from
 * `TSubjects[S]["data"]` by the time this is used inside {@link
 * RolePermissions}), so ordinary excess-property checking rejects a typo'd
 * key on an object literal — AP-005's `Partial<Record<union, V>>`
 * weak-typo-checking gap is specific to a generic bound being INFERRED from
 * the literal, which does not apply to this concrete mapped-type property.
 *
 * @typeParam TFields - Field-name union for the subject's document type.
 * @typeParam TData - Document type for the subject.
 * @typeParam TUser - User document shape.
 * @typeParam TOrg - Organization document shape; `never` when not configured.
 */
export type FieldPermissionMap<
  TFields extends string = string,
  TData = unknown,
  TUser = Record<string, unknown>,
  TOrg = Record<string, unknown>,
> = Partial<Record<TFields, FieldPermissionCheck<TData, TUser, TOrg>>>;
```

**2 — add `fields` to `RolePermissions`'s per-subject object branch.** In the existing
`RolePermissions` type, the per-subject value is `boolean | ({ [A in action]?: ... } & {
[wildcard]?: ... })`. Add a third intersected member so the object form becomes:

```ts
  [S in keyof TSubjects | TUserSlug | (TOrgSlug extends string ? TOrgSlug : never)]?:
    | boolean
    | ({
        [A in TSubjects[S]["action"]]?: A extends QueryAction
          ? PermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["indexFields"]>
          : A extends Exclude<CrudAction | DraftAction, QueryAction> | typeof WILDCARD_KEY
            ? AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>
            : A extends TSubjects[S]["queryAction"]
              ? PermissionCheck<TSubjects[S]["data"], TUser, TOrg, TSubjects[S]["indexFields"]>
              : AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>;
      } & {
        [W in typeof WILDCARD_KEY]?: AnyActionPermissionCheck<TSubjects[S]["data"], TUser, TOrg>;
      } & {
        /**
         * Per-field grants, narrowing already-granted actions on this
         * subject for this role. See {@link FieldPermissionMap}.
         */
        fields?: FieldPermissionMap<
          Extract<keyof TSubjects[S]["data"], string>,
          TSubjects[S]["data"],
          TUser,
          TOrg
        >;
      });
```

Only the added `& { fields?: ... }` member is new; the two existing members are unchanged —
reproduced above for anchor clarity, not for retyping.

**3 — extend `VexAccessError`.** Add an optional `field` to the class, the `ConvexError`
data shape, and the constructor:

```ts
export class VexAccessError extends ConvexError<{
  code: "ACCESS_DENIED";
  resource: string;
  action: string;
  message: string;
  field?: string;
}> {
  /** The subject on which access was denied. */
  resource: string;

  /** The denied action. */
  action: string;

  /** The denied field, when the denial is field-scoped. */
  field?: string;

  /**
   * @param options — Structured denial context.
   * @param options.message — Human-readable error message.
   * @param options.resource — Subject name.
   * @param options.action — Action name.
   * @param options.field — Denied field name, when the denial is field-scoped.
   */
  constructor(options: { message?: string; resource: string; action: string; field?: string }) {
    // Same wire-serializability rule as before: every `data` key is always
    // present-and-defined or absent — never `undefined`. `field` is spread in
    // conditionally rather than assigned `options.field` directly.
    super({
      code: "ACCESS_DENIED",
      resource: options.resource,
      action: options.action,
      message:
        options.message ??
        (options.field
          ? `Access Denied: ${options.resource}/${options.action} (field: ${options.field})`
          : `Access Denied: ${options.resource}/${options.action}`),
      ...(options.field !== undefined ? { field: options.field } : {}),
    });
    this.name = "VexAccessError";
    this.resource = options.resource;
    this.action = options.action;
    this.field = options.field;
  }
}
```

#### packages/core/src/access/config.ts

1 edit. Add a dev-mode-only validation pass inside the existing `defineAccess()` body,
alongside its existing per-role/per-resource validation loop (the one that already warns on
undeclared subjects/customResources — anchor beside that loop, not a new top-level pass).

```ts
export function defineAccess<...>(
  props: VexAccessConfigInput<...>,
): VexAccessConfig<...> {
  // TODO: implement, alongside the existing validation loop
  // 1. For each role in `props.permissions`, for each resource entry that is an
  //    object (not a plain boolean) and declares `fields`:
  //    a. For each key in that `fields` object: if the key is an empty string,
  //       emit the same dev-only warning posture as the existing
  //       undeclared-subject warning (`console.warn` gated behind the existing
  //       dev-mode check in this function — do not add a new gate).
  //    b. Do NOT hard-fail on a field name absent from the resource's generated
  //       document type — Convex documents can carry fields the collection
  //       schema doesn't declare (dynamic/legacy fields), and `defineAccess`
  //       has no reliable static registry of "every field that could ever
  //       appear on this slug's documents" to validate against.
  // (existing validation body continues unchanged below)
  ...
}
```

#### packages/core/src/access/config.test.ts

New test cases in the existing file (uses its existing `defineAccess`/fixture imports —
extend the existing describe blocks, do not add new imports beyond what the file already
has):

```ts
describe("defineAccess — field permissions", () => {
  it("accepts a fields map alongside an action check without throwing", () => {
    expect(() =>
      defineAccess({
        roles: ["editor"],
        resources: [postsCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          editor: {
            posts: {
              update: true,
              fields: { price: false, title: true },
            },
          },
        },
      }),
    ).not.toThrow();
  });

  it("warns in dev mode on an empty-string field key", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineAccess({
      roles: ["editor"],
      resources: [postsCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            update: true,
            fields: { "": true },
          },
        },
      },
    });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
```

The developer implementing this step should match `postsCollection`'s exact shape and the
dev-mode warning helper to whatever this file's existing tests already use — read the file
before writing these in; do not introduce a second fixture pattern.

Verify: `pnpm --filter @vexcms/core test access/config.test.ts`

### Step 2 — `resolveFieldPermissions()` resolver `[dev]`

One evaluator, reused by the write path, the read path, and the client hook — mirrors
`hasPermission()` being the single evaluator for document-level checks.

#### packages/core/src/access/resolveFieldPermissions.ts

New file.

```ts
import { PERMISSION_SCOPES } from "./constants";
import { VexAccessError } from "./types";
import type { FieldPermissionCheck, PermissionCallbackProps, VexAccessConfig } from "./types";

/**
 * Props for {@link resolveFieldPermissions}.
 *
 * @typeParam TData - Document/context type forwarded to field callbacks.
 */
export interface ResolveFieldPermissionsProps<TData = unknown> {
  /** The resolved config from `defineAccess()`. `undefined` disables field restriction. */
  access?: VexAccessConfig;
  /** The authenticated user document. Roles resolve exactly as in `hasPermission`. */
  user: Record<string, unknown> | null;
  /** Organization document; only meaningful when `access.orgCollectionSlug` is configured. */
  organization?: Record<string, unknown>;
  /** Subject name — a resource slug. */
  resource: string;
  /** Action on `resource`. */
  action: string;
  /** Document (read) or payload/stored-doc context (write) forwarded to field callbacks. */
  data?: TData;
}

/**
 * Resolves per-field permission for one resource + action, merging every role
 * the caller holds — the field-level counterpart to `hasPermission`.
 *
 * @param props @see {@link ResolveFieldPermissionsProps}
 * @returns A field-name → allowed map covering only fields with a declared
 *   rule for at least one of the caller's roles. A field absent from the
 *   result is allowed — callers read it as `result[field] ?? true`, never as
 *   `result[field] === true`.
 */
export function resolveFieldPermissions<TData = unknown>(
  props: ResolveFieldPermissionsProps<TData>,
): Record<string, boolean> {
  // TODO: implement
  // 1. `!props.access || props.access.enabled === false` → return `{}` (RBAC
  //    off entirely — matches `hasPermission`'s same short-circuit).
  // 2. Resolve the caller's known roles exactly like `hasPermission` does
  //    (`hasPermission.ts` lines ~91-100): read
  //    `props.user?.[props.access.userRolesField]`, normalize `string |
  //    string[]` → `string[]`, fall back to `[props.access.anonRole]` when
  //    empty (skip the fallback entirely when `anonRole` is undefined), then
  //    filter to `props.access.roles` (known roles only).
  //    → zero known roles: return `{}` — an unknown-role caller is denied the
  //    whole resource by `hasPermission`, not by this resolver.
  // 3. For each known role, read `props.access.permissions[role]?.[props.resource]`:
  //    a. Not a plain object (boolean, undefined) → that role declares no
  //       field map for this resource; contributes nothing.
  //    b. A plain object → read its `fields` property (may be `undefined` →
  //       contributes nothing).
  // 4. Merge every role's `fields` map into one result: for each field key
  //    present in ANY contributing role's map, evaluate that role's check —
  //    `boolean` as-is, or invoke the callback with `{ user: props.user, data:
  //    props.data, organization: props.access.orgCollectionSlug !== undefined
  //    ? props.organization : undefined } satisfies PermissionCallbackProps`
  //    (mirrors how `hasPermission`'s `resolvePermissionCheck` builds callback
  //    props). OR-merge across roles that declare the SAME key: any role
  //    allowing → the field is allowed in the result (same merge posture as
  //    `hasPermission`'s role OR-merge).
  // 5. Fields with no entry in ANY role's map are NOT included in the result
  //    (see the `@returns` doc above — absence means allowed).
  // Edge cases:
  // - A field callback throws → let it propagate; resource-level callbacks in
  //   `hasPermission` are not caught either, and neither should these be.
  // - `props.data` is `undefined` and a field's check is a callback — invoke
  //   it anyway with `data: undefined`, same as `PERMISSION_SCOPES.all`'s
  //   posture for a resource-level callback with no data would NOT apply here
  //   (there is no `scope` parameter on this resolver — a per-field rule is
  //   always evaluated against whatever `data` was passed, never asked "for
  //   every document" the way `hasPermission`'s `scope` is; callers that need
  //   an exact per-document answer simply always pass `data`, which every
  //   call site in this spec does).
  throw new Error("Not implemented");
}

/**
 * Shallow-copies `doc` and deletes every key resolved `false` in
 * `fieldPermissions`. Used by `find`/`get`/`search` to shape read responses.
 * Never mutates the document Convex returned.
 *
 * @param doc - The document to shape.
 * @param fieldPermissions - Result of {@link resolveFieldPermissions}.
 * @returns `doc` itself (same reference) when `fieldPermissions` is empty —
 *   no allocation on the common "no field map declared" path; otherwise a
 *   shallow copy with denied keys removed.
 */
export function stripDeniedFields<TDoc extends Record<string, unknown>>(
  doc: TDoc,
  fieldPermissions: Record<string, boolean>,
): TDoc {
  // TODO: implement
  // 1. `Object.keys(fieldPermissions).length === 0` → return `doc` unchanged.
  // 2. Otherwise: `const copy = { ...doc }`, `delete copy[key]` for every key
  //    whose `fieldPermissions[key] === false`, return `copy`.
  throw new Error("Not implemented");
}

/**
 * Checks every key in `payload` against `fieldPermissions` and throws on the
 * first denied field. Used by `create`/`update` before the write executes —
 * the whole write is rejected, never a partial patch (DD 5).
 *
 * @param props.payload - Incoming `data` (create) or patch (update).
 * @param props.fieldPermissions - Result of {@link resolveFieldPermissions}.
 * @param props.resource - Subject name, forwarded to the thrown error.
 * @param props.action - Action name, forwarded to the thrown error.
 * @throws {VexAccessError} On the first payload key resolved `false`,
 *   carrying that key as `field`.
 */
export function assertFieldsWritable(props: {
  payload: Record<string, unknown>;
  fieldPermissions: Record<string, boolean>;
  resource: string;
  action: string;
}): void {
  // TODO: implement
  // 1. `Object.keys(props.fieldPermissions).length === 0` → return (nothing
  //    restricted, matches the "no field map declared" fast path elsewhere).
  // 2. For each key in `Object.keys(props.payload)`: if
  //    `props.fieldPermissions[key] === false`, throw `new VexAccessError({
  //    resource: props.resource, action: props.action, field: key })` and
  //    stop — first denied field wins, no need to collect every offending key.
  throw new Error("Not implemented");
}
```

#### packages/core/src/access/index.ts

1 edit — add one export line beside the existing barrel exports:

```ts
export * from "./resolveFieldPermissions";
```

#### packages/core/src/access/resolveFieldPermissions.test.ts

New file. Complete, real tests — no placeholder fixtures (AP-009). Mirror the fixture style
already used in `hasPermission.test.ts` (read that file's imports/fixtures before writing
this one so both files share one fixture convention).

```ts
import { describe, expect, it } from "vitest";
import { resolveFieldPermissions, stripDeniedFields, assertFieldsWritable } from "./resolveFieldPermissions";
import { VexAccessError } from "./types";
import type { VexAccessConfig } from "./types";

function buildAccess(permissions: VexAccessConfig["permissions"]): VexAccessConfig {
  return {
    roles: Object.keys(permissions),
    userCollectionSlug: "users",
    userRolesField: "roles",
    enabled: true,
    defaultPermissionMode: "deny",
    permissions,
  } as VexAccessConfig;
}

describe("resolveFieldPermissions", () => {
  it("returns {} when access is undefined (RBAC off)", () => {
    expect(
      resolveFieldPermissions({ access: undefined, user: null, resource: "posts", action: "update" }),
    ).toEqual({});
  });

  it("returns {} when the resource declares no fields map", () => {
    const access = buildAccess({ editor: { posts: { update: true } } });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        resource: "posts",
        action: "update",
      }),
    ).toEqual({});
  });

  it("resolves a static boolean field grant", () => {
    const access = buildAccess({
      editor: { posts: { update: true, fields: { price: false, title: true } } },
    });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        resource: "posts",
        action: "update",
      }),
    ).toEqual({ price: false, title: true });
  });

  it("evaluates a field callback against data", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: true,
          fields: { price: ({ data }: { data?: { status?: string } }) => data?.status === "draft" },
        },
      },
    });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        resource: "posts",
        action: "update",
        data: { status: "published" },
      }),
    ).toEqual({ price: false });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        resource: "posts",
        action: "update",
        data: { status: "draft" },
      }),
    ).toEqual({ price: true });
  });

  it("OR-merges across roles: any role allowing the field allows it", () => {
    const access = buildAccess({
      viewer: { posts: { update: true, fields: { price: false } } },
      finance: { posts: { update: true, fields: { price: true } } },
    });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["viewer", "finance"] },
        resource: "posts",
        action: "update",
      }),
    ).toEqual({ price: true });
  });

  it("falls back to anonRole when the caller has no roles", () => {
    const access = {
      ...buildAccess({ anon: { posts: { read: true, fields: { price: false } } } }),
      anonRole: "anon",
    };
    expect(
      resolveFieldPermissions({ access, user: null, resource: "posts", action: "read" }),
    ).toEqual({ price: false });
  });
});

describe("stripDeniedFields", () => {
  it("returns the same reference when fieldPermissions is empty", () => {
    const doc = { title: "a", price: 10 };
    expect(stripDeniedFields(doc, {})).toBe(doc);
  });

  it("removes only denied keys, never mutating the input", () => {
    const doc = { title: "a", price: 10 };
    const result = stripDeniedFields(doc, { price: false, title: true });
    expect(result).toEqual({ title: "a" });
    expect(doc).toEqual({ title: "a", price: 10 });
  });
});

describe("assertFieldsWritable", () => {
  it("does not throw when fieldPermissions is empty", () => {
    expect(() =>
      assertFieldsWritable({ payload: { price: 1 }, fieldPermissions: {}, resource: "posts", action: "update" }),
    ).not.toThrow();
  });

  it("throws VexAccessError naming the denied field", () => {
    let caught: unknown;
    try {
      assertFieldsWritable({
        payload: { title: "a", price: 1 },
        fieldPermissions: { price: false },
        resource: "posts",
        action: "update",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("price");
  });
});
```

Verify: `pnpm --filter @vexcms/core test access/resolveFieldPermissions.test.ts`

### Step 3 — Write-path field enforcement: `create()` / `update()` `[dev]`

Depends on Step 2. This is the actual enforcement boundary — a denied field throws and
rejects the whole write.

#### packages/core/src/api/create/server.ts

1 edit.

**1 — import + enforcement call.** Add `resolveFieldPermissions, assertFieldsWritable` to
the existing `import { CRUD_ACTIONS, hasPermission } from "../../access";` line, then insert
immediately after the existing `hasPermission({ ..., throwOnDenied: true })` call, still
inside the `if (args.config.access !== undefined)` block:

```ts
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      throwOnDenied: true,
    });
    const fieldPermissions = resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
    });
    assertFieldsWritable({
      payload: args.data,
      fieldPermissions,
      resource,
      action,
    });
```

The rest of `create()` — the `stampUpdatedAt` call and the insert — is unchanged.

#### packages/core/src/api/update/server.ts

1 edit — same pattern, but `resolveFieldPermissions`'s `data` is the STORED document (DD 7),
while `assertFieldsWritable`'s `payload` is the incoming patch:

```ts
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
    });
    const fieldPermissions = resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
    });
    assertFieldsWritable({
      payload: args.data,
      fieldPermissions,
      resource,
      action,
    });
```

Add `resolveFieldPermissions, assertFieldsWritable` to this file's existing
`import { CRUD_ACTIONS, hasPermission } from "../../access";` line. The rest of `update()` is
unchanged.

#### packages/core/src/api/create/server.test.ts

Add to the existing describe blocks (reuse the file's existing minimal fixture config —
extend it with one role carrying a `fields` map rather than introducing a second fixture):

```ts
test("throws VexAccessError naming the denied field when the payload includes one", async () => {
  await expect(
    create({
      ctx,
      collection: "posts",
      data: { title: "ok", price: 5 },
      config: {
        ...config,
        access: {
          ...config.access,
          permissions: {
            ...config.access.permissions,
            editor: {
              create: true,
              fields: { price: false },
            },
          },
        },
      },
      auth: { user: { roles: ["editor"] } },
    }),
  ).rejects.toThrow(VexAccessError);
});

test("writes normally when no fields map is declared (regression)", async () => {
  const id = await create({
    ctx,
    collection: "posts",
    data: { title: "ok", price: 5 },
    config,
    auth: { user: { roles: ["editor"] } },
  });
  expect(id).toBeTruthy();
});
```

The developer implementing this step must adapt these two cases to this test file's ACTUAL
fixture shape (`config`, `ctx` construction) — read the file first; do not guess field
names from this snippet.

#### packages/core/src/api/update/server.test.ts

Same two cases, adapted to `update()`'s signature (`id`, patch `data`) and this file's actual
fixture — plus one case specific to update:

```ts
test("denies via the stored document, not the patch, when a field callback reads status", async () => {
  // Fixture: a role whose `fields.price` callback is `({ data }) => data?.status === "draft"`,
  // and a stored document with `status: "published"`. Patching `price` must throw even
  // though the patch itself carries no `status` key — the callback reads the STORED doc.
});
```

Verify: `pnpm --filter @vexcms/core test api/create/server.test.ts api/update/server.test.ts`

### Step 4 — Read-path field stripping: `find()` / `get()` / `search()` `[dev]`

Depends on Step 2. Same resolver, opposite direction: after the existing per-document
`hasPermission()` filter decides a document is readable at all, strip fields the caller's
roles can't see.

#### packages/core/src/api/find/server.ts

2 edits.

**1 — import.** Add `resolveFieldPermissions, stripDeniedFields` to this file's existing
`../../access` import.

**2 — strip after the existing filter branches, before populate.** The function currently
sets `docs` via one of three branches (`paginate`/`take`/`collect`, each `.filter((d) =>
hasPermission(...))`), then computes `effectivePopulate`. Insert a single mapping step
between them:

```ts
  // (existing docs = ...filter(hasPermission...) branches, unchanged)

  docs = docs.map((d) =>
    stripDeniedFields(
      d,
      resolveFieldPermissions({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    ),
  );

  // Explicit populate takes precedence over depth (D11).
  const effectivePopulate = ...
```

`access`, `resource`, and `action` are already in scope from the existing `resolveAccessCall`
call earlier in the function — no new resolution needed. The `totalDocs`-counting branch
further down (`countQuery.collect()`) counts documents, not shaped content — it is NOT
stripped; only the returned `page`/array is.

#### packages/core/src/api/get/server.ts

1 edit. Change `const doc = await args.ctx.db.get(args.id);` to `let doc = ...` (same line,
`let` instead of `const` — reassigned below), then insert after the existing
`hasPermission({ throwOnDenied: true, ... })` call, still inside the `if (doc &&
args.config?.access !== undefined)` block:

```ts
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc,
    });
    doc = stripDeniedFields(doc, resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc,
    }));
```

Add `resolveFieldPermissions, stripDeniedFields` to this file's existing `../../access`
import. The rest of `get()` (populate handling, return) reads `doc` as before and needs no
further change.

#### packages/core/src/api/search/server.ts

2 edits, same shape as `find`.

**1 — import.** Add `resolveFieldPermissions, stripDeniedFields` to this file's existing
`../../access` import.

**2 — strip after the existing filter branches, before populate.** `access`, `resource`,
`action` are already resolved once at the top of `search()` via `resolveAccessCall`:

```ts
  // (existing docs = ...filter(hasPermission...) branches, unchanged)

  docs = docs.map((d) =>
    stripDeniedFields(
      d,
      resolveFieldPermissions({
        access,
        user: args.auth?.user ?? null,
        organization: args.auth?.organization,
        resource,
        action,
        data: d,
      }),
    ),
  );

  const effectivePopulate = ...
```

Same non-stripping note for the `allDocs` count-only branch as `find`.

#### packages/core/src/api/find/server.test.ts

Add, adapted to this file's existing fixtures:

```ts
test("strips a denied field from returned documents", async () => {
  // Fixture: role with `fields: { price: false }` on `posts`, one seeded document with
  // `price` set. Assert the returned array's document has no `price` key and every other
  // field intact.
});

test("returns documents unchanged when no fields map is declared (regression)", async () => {
  // Existing default-config fixture; assert every previously-present key is still present.
});
```

#### packages/core/src/api/get/server.test.ts

Same two cases, adapted to `get()`'s single-document return shape.

#### packages/core/src/api/search/server.test.ts

Same two cases, adapted to `search()`'s fixtures.

Verify: `pnpm --filter @vexcms/core test api/find/server.test.ts api/get/server.test.ts api/search/server.test.ts`

### Step 5 — Client field-permission hook `[dev]`

Depends on Step 2 (same resolver, re-exported for client-bundle use). Admin-panel gating,
advisory only (P-004).

#### packages/react/src/hooks/useFieldPermissions.ts

New file.

```ts
"use client";

import { resolveFieldPermissions } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Client-side field-permission resolution for admin-form gating (advisory —
 * server API guards, via `assertFieldsWritable`, remain the enforcement
 * point). Calls `resolveFieldPermissions` directly against the bundle-
 * imported `access` config — no server round trip, mirroring `usePermission`.
 *
 * @param props.resource - Subject name (collection/global slug).
 * @param props.action - Action on `resource` (typically `"update"` for an
 *   edit form).
 * @param props.data - Document/context forwarded to field callbacks.
 * @returns Field-name → allowed map; a field absent from the result is
 *   allowed. Read as `result[fieldKey] ?? true`, never `=== true`.
 */
export function useFieldPermissions(props: {
  resource: string;
  action: string;
  data?: Record<string, unknown>;
}): Record<string, boolean> {
  // TODO: implement
  // 1. `const access = useVexAccess();`
  // 2. `const { user, organization } = useVexAuth();`
  // 3. `return resolveFieldPermissions({ access, user, organization, ...props });`
  throw new Error("Not implemented");
}
```

#### packages/react/src/hooks/index.ts

1 edit — add `export * from "./useFieldPermissions";` beside the existing `usePermission`
export line.

#### packages/react/src/hooks/useFieldPermissions.test.tsx

New file. Mirror `usePermission.test.tsx`'s provider/fixture setup exactly (same
`VexAccessProvider`/`VexAuthContext` wrapping) — read that file before writing this one.

```tsx
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFieldPermissions } from "./useFieldPermissions";
// Import the same test-provider wrapper `usePermission.test.tsx` uses.

describe("useFieldPermissions", () => {
  it("resolves a denied field to false", () => {
    // Wrap with an access config carrying `fields: { price: false }` for the
    // active role, matching usePermission.test.tsx's wrapper pattern.
    const { result } = renderHook(() => useFieldPermissions({ resource: "posts", action: "update" }), {
      wrapper: /* same wrapper usePermission.test.tsx uses, with the fields-restricted config */,
    });
    expect(result.current.price).toBe(false);
  });

  it("leaves an undeclared field out of the result (default-allow)", () => {
    const { result } = renderHook(() => useFieldPermissions({ resource: "posts", action: "update" }), {
      wrapper: /* same wrapper, fields-restricted config */,
    });
    expect(result.current.title).toBeUndefined();
  });

  it("resolves every field as unrestricted when RBAC is off", () => {
    const { result } = renderHook(() => useFieldPermissions({ resource: "posts", action: "update" }), {
      wrapper: /* wrapper with access: undefined */,
    });
    expect(result.current).toEqual({});
  });
});
```

#### packages/react/src/components/views/CollectionEditView.tsx

1 edit. Add the hook call after the existing `canEdit` resolution, and fold its result into
the existing `readOnly` prop on the rendered input:

```ts
  const canEdit = usePermission({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument as Record<string, unknown>,
  });
```

And change the existing input's `readOnly` prop:

```tsx
            <InputComponent
              key={fieldKey}
              name={fieldKey}
              fieldDef={field}
              readOnly={!canEdit || field.admin.readOnly || fieldPermissions[fieldKey] === false}
              collection={props.collection}
            />
```

Disabled, not hidden (DD 3's framing carries through to the UI: the developer sees the
value, can't change it) — the field renders, its input is inert. Add `useFieldPermissions` to
this file's existing `import { usePermission, useVexMutation } from "../../hooks";` line.

Verify: `pnpm --filter @vexcms/react test usePermission.test.tsx useFieldPermissions.test.tsx`

### Step 6 — Documentation `[dev]`

Nothing downstream depends on docs text; last step.

#### apps/docs/src/content/docs/guides/access-control.mdx

Add a "Field-level permissions" section covering: the `fields` map's config shape (an
example role/resource entry with a boolean and a callback field grant); the explicit
runtime-only boundary statement ("enforced in the generated Convex functions
(`assertFieldsWritable` on write, `stripDeniedFields` on read) and in the admin-panel client
bundle (`useFieldPermissions`); a caller that bypasses both — a hand-rolled Convex function
calling `ctx.db` directly — bypasses this the same way it already bypasses
`hasPermission()`"); write-time throw-on-denied-field behavior with an example
`VexAccessError` shape including `field`; read-time stripping behavior; and the deferred
type-narrowing gap (return types still describe the full document — a caller may receive
fewer keys than the type promises when fields are restricted for their role).

#### packages/core/README.md

One-line addition under the existing RBAC bullet: field-level permissions exist via the
`fields` map on `defineAccess()`'s per-role resource entries, cross-referencing the docs
guide added above.

#### .agent/docs/product/backlog.md

Add an entry: generic type-narrowing on `find`/`get`/`create`/`update` server-API signatures,
so a caller who knows a field is restricted for the current role can narrow the return/arg
type themselves (caller-asserted, since the server cannot statically know per-request role) —
deferred by this spec's Design Decision 8.

Verify: manual read-through; no build/test gate.

## Verification

`pnpm build && pnpm test` across `@vexcms/core` and `@vexcms/react` — every step above stays
green individually; this is the final combined gate.
