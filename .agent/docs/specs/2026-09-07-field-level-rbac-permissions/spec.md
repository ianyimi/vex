---
status: complete
spec_id: 2026-09-07-field-level-rbac-permissions
touches:
  - packages/core/src/access/types.ts
  - packages/core/src/access/hasPermission.ts
  - packages/core/src/access/resolveFieldPermissions.ts
  - packages/core/src/access/index.ts
  - packages/core/src/api/create/server.ts
  - packages/core/src/api/update/server.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/globals/upsert.server.ts
  - packages/core/src/api/globals/get.server.ts
  - packages/core/src/api/globals/find.server.ts
  - packages/core/src/media/api/mutations.ts
  - packages/next/src/cache/createVexRevalidateRoute.ts
  - packages/react/src/hooks/useFieldPermissions.ts
  - packages/react/src/hooks/useLiveFieldMerge.ts
  - packages/react/src/hooks/changedValues.ts
  - packages/react/src/hooks/index.ts
  - packages/react/src/components/views/CollectionEditView.tsx
  - packages/react/src/components/views/GlobalEditView.tsx
  - packages/react/src/components/views/MediaCollectionEditView.tsx
  - packages/react/src/components/views/CollectionListView.tsx
  - packages/react/src/components/views/MediaCollectionListView.tsx
  - packages/react/src/components/RevalidateButton.tsx
  - apps/www/src/auth/access.ts
  - apps/www/src/auth/hasPermission.ts
  - apps/test/src/auth/hasPermission.ts
  - apps/docs/src/content/docs/guides/access-control.mdx
  - packages/core/README.md
  - .agent/docs/product/backlog.md
prompt_version: 4
---

# 2026-09-07-field-level-rbac-permissions — Spec

## Preview — `apps/www`: anonymous users may change only the admin theme

The concrete thing this feature buys, and the acceptance test for the whole spec.

### The scenario

An anonymous demo session (`AdminDemoButton` mints a caller with no `roles`, so
`anonRole: USER_ROLES.user` resolves it to `user`) opens the admin panel, goes to **Site
Settings**, picks a different **Admin Theme**, and saves. Every other field on that screen —
Site Name, Description, Active Theme, Favicon, and the five SEO fields — shows its current
value and refuses input. Reads are untouched: the public site still renders its title,
description, and SEO tags for the same anonymous caller.

`adminTheme` is a `relationship` to the `themes` collection
(`apps/www/src/vexcms/globals/siteSettings.ts:35-40`), so "select a new theme" means picking
an existing `themes` document. The `user` role already holds `themes: { read: true }`, which
is all the picker needs — no write grant on `themes` itself.

### The whole change to `apps/www/src/auth/access.ts`

One action value, inside the existing `user` role block:

```ts
      siteSettings: {
        "*": false,
        read: true,
        update: () => ({ "*": false, adminTheme: true }),
      },
```

`update`'s filter callback returns a **field map** instead of a boolean. `"*": false` denies
every field; `adminTheme: true` re-allows one. `read: true` is untouched, so nothing about the
public site's reads changes — maps are per action, and this one is only on `update`.

Nothing is added to the resource entry. There is no `fields` sibling, no second wiring point,
no new `defineAccess` option, and no second permission function: `hasPermission` answers as it
always has.

### The three forms an action check can take

```ts
// 1. A boolean — unchanged.
update: true,

// 2. A filter callback. Returns a boolean, or a field map when the answer is per field.
//    The www case; its map is constant, so the callback ignores its props.
update: () => ({ "*": false, adminTheme: true }),
update: ({ user, data }) =>
  user.roles.includes("editor") ? { "*": true, activeTheme: false } : { "*": false },

// 3. `{ constraints, filter }` — when the action must also narrow WHICH documents are
//    reachable. `filter` is the same callback as form 2, so it can return a map too.
read: {
  constraints: ({ q, user }) => q.eq("organization", user.organization),
  filter: ({ data }) => ({ "*": true, internalNotes: data.status === "draft" }),
},
```

A map is **only ever a callback's return value**, never a value written directly on an action.
That is what keeps it unambiguous: a document is free to have fields named `constraints` or
`filter`, because a returned object is always a field map and never a check descriptor. It is
also why a map's values are plain booleans — the map is built inside a callback that already
has `{ user, data, organization }` in scope, so per-field logic is an ordinary boolean
expression:

```ts
update: ({ user, data }) => ({
  "*": false,
  adminTheme: true,
  activeTheme: user._id === data.ownerId && data.status === "draft",
}),
```

Form 3 requires `constraints`; a `{ filter }` object with no descriptor stays rejected, as it
is today (`ConstrainedPermissionCheck`'s doc: "a callback with no descriptor cannot narrow a
query, so write it as a bare callback instead"). Form 2 *is* the filter-only spelling.

A map is fully checked against the resource's own fields, with no annotation, helper, or
`satisfies` at the call site (DD 5):

```ts
// Accepted: wildcard present, other fields optional.
() => ({ "*": false, adminTheme: true })
// Accepted: no wildcard, so every field of the document is named.
() => ({ name: false, description: false, activeTheme: false, adminTheme: true /* …all… */ })
// Rejected: no wildcard and `favicon`, `metaTitle`, … are missing.
() => ({ name: false, adminTheme: true })
// Rejected: ✖ field map returns a field not on this resource: "admnTheme"
() => ({ "*": false, admnTheme: true })
// Rejected: ✖ field map returns a field not on this resource: "_id"
() => ({ "*": false, _id: true })
```

Both polarities read naturally, which is the point of the wildcard:

```ts
() => ({ "*": false, adminTheme: true })   // allow-list: only this field
() => ({ "*": true, adminTheme: false })   // deny-list: everything but this field
```

The allow-list form is still the one to reach for by default, but for a design reason rather
than a safety one: a field added to the resource later arrives denied, and has to be granted
deliberately. Under `"*": true` it arrives writable.

### How `hasPermission` answers with a map in play

One function, three cases, and no new call for the common path (DD 3):

```ts
// WRITE — `changes` names the keys being written. Any changed key the map denies → false.
hasPermission({ access, user, resource: "siteSettings", action: "update",
  data: storedDoc, changes: { name: "Defaced" } });   // → false (field: "name")
hasPermission({ access, user, resource: "siteSettings", action: "update",
  data: storedDoc, changes: { adminTheme: ["t2"] } }); // → true

// READ — no `changes`, so the map projects instead of denying. Caller strips.
hasPermission({ access, user, resource: "posts", action: "read", data: doc }); // → true

// QUANTIFIED — neither, so the existing `scope` decides. A map cannot hold for EVERY
// field, so the default `all` denies; `any` allows (nav/list gating).
hasPermission({ access, user, resource: "posts", action: "update" });                 // → false
hasPermission({ access, user, resource: "posts", action: "update", scope: "any" });   // → true
```

Every existing call site is unaffected: none pass `changes`, and a role with no field map
anywhere takes byte-identical paths to today.

### What the developer then observes

- **Admin form** — `useFieldPermissions({ resource: "siteSettings", action: "update", data })`
  resolves to `{ wildcard: false, fields: { adminTheme: true } }`. `GlobalEditView` folds that
  into each input's existing `readOnly` prop, so the Admin Theme picker is the only live
  control. **Save** stays enabled: `usePermission` passes no `changes`, so the map projects
  rather than denies.
- **Save with only the theme changed** — succeeds. The form submits the whole document
  (`GlobalEditView.tsx:45-49` sends `data: value`), so `name`, `description`, and the SEO
  fields are all present; they are violations only if their value actually **changed**.
  Resending a field unchanged is not a write to it.
- **Save with anything else changed** — rejected with `VexAccessError` carrying
  `{ code: "ACCESS_DENIED", resource: "siteSettings", action: "update", field: "name" }`. No
  partial patch.
- **Public reads** — unchanged. `apps/www/convex/siteSettings.ts:21` and
  `apps/www/src/lib/metadata.ts:48` read the global as an anonymous caller and still get every
  field, because `read: true` declares no map.

### Prerequisite, already landed

`upsertGlobal` authorized writes against the caller's **`read`** grant
(`defaultAction: CRUD_ACTIONS.read`), so the `user` role's existing `siteSettings.read: true`
was enough to overwrite the entire global. A global is a singleton, so the verb now depends on
existence: first save authorizes as `create`, every later save as `update`
(`packages/core/src/api/globals/upsert.server.ts`). The check also moved ahead of Zod
validation, so a denied caller cannot probe the schema through validation errors, and it
receives the **flattened** stored document, so a rule reading `data.name` sees `data.name`
rather than `data.data.name`. Covered by `upsertGlobal (server) — access` in
`packages/core/src/api/globals/upsert.server.test.ts`; 6 of those 10 cases fail against the
old `read` default. Field grants are meaningless without it: a map returned from `update`'s
filter cannot restrict a write that never checks `update`.

## Overview

RBAC (`defineAccess()`/`hasPermission()`, spec 2026-08-12) resolves per document, not per
field: a role either can or cannot read/write a resource, with no way to say "editor may
change `title` but not `price`". The 2026-08-25 access-constraint-builder spec removed the old
`{ mode, fields }` shape and explicitly deferred bringing it back ("not abandoned") once a
shape existed that didn't try to make Convex do per-field query filtering.

This spec adds that shape as a new **return value** for the config surface that already
exists: a check's filter callback may return a field map (`{ "*": false, adminTheme: true }`)
instead of a boolean, whether written bare on the action or as the `filter` beside a
`constraints` descriptor. Nothing new may be written directly on an action, which keeps a
document free to have fields named `constraints` or `filter`.

`hasPermission` remains the single gate and still returns `boolean`. When a map resolves, it
answers by checking the keys the operation writes (`changes`) against the map; with no
`changes` it projects rather than denies; with no document at all it falls back to the
existing `scope`, whose default `all` denies — a map means not every field is permitted. One
exported resolver (`resolveFieldPermissions`) answers the separate, read-only question "which
fields may this caller touch?" for the admin panel and for read-path stripping.

It is runtime-only — enforced in the generated Convex functions and the admin-panel bundle,
the same boundary `hasPermission()` already has, and the same boundary kitcn's Convex ORM RLS
docs state for the same reason: Convex has no engine-level policy hook, so anything bypassing
these entry points (a hand-rolled function calling `ctx.db` directly) bypasses this the same
way it already bypasses `hasPermission()`.

## Design Decisions

1. **No new config surface.** Field grants are a new *result* for a check that already exists,
   not a `fields` sibling on the resource entry and not a `defineFieldAccess()`. `permissions`
   already types each action against the subject's document type, so a map keyed by that
   document's fields needs no new wiring and no second place to look when reading a role's
   rules.
2. **A map is only ever a callback RETURN, never a value on the action.** Only
   `BasePermissionCheck`'s callback return type widens; the static side of the union does not.
   So a map arrives from the filter callback (bare, or as `filter` beside `constraints`) and
   nowhere else.

   This is a correctness requirement, not a style choice. A map written directly on an action
   would sit in the same position as a `{ constraints, filter }` descriptor, so a document
   with a field named `constraints` or `filter` would be ambiguous with the API's own keys, and
   the rules needed to tell them apart would read fine in a spec and confuse everyone at the
   call site. As a return value there is nothing to disambiguate: a returned object is always a
   field map. `isFieldPermissionMap` is consequently
   `typeof value === "object" && value !== null`, with no precedence rules.
3. **`hasPermission` stays the only gate, and still returns `boolean`.** A resolved map is
   folded into a boolean by the same rules that already govern a per-document condition, in
   three cases:
   - **`changes` supplied** (a write): every key in `changes` must be permitted. A violation
     denies — and with `throwOnDenied`, throws a `VexAccessError` naming the field. This is the
     enforcement boundary; there is no second `assertFieldsWritable` to call and no way to
     perform a write without passing through it.
   - **`changes` absent, `data` supplied** (a read, or any document-level probe): the map
     *projects* rather than denies. A write cannot proceed partially, but a read can — denying
     the whole read because one field is restricted would make field-level read control
     impossible, and stripping is what kitcn's ORM RLS does for the same reason. The caller
     shapes the response with `resolveFieldPermissions` + `stripDeniedFields`.
   - **Neither supplied** (quantified: nav gating, bulk actions): the existing `scope` decides,
     unchanged in spirit. `all` (the default) denies, because a map means not every field is
     permitted, so the answer to "may they do this to EVERY field of every document" is no.
     `any` allows. `doc` throws the existing needs-a-`data`-object error.

   With one exception, which exists so the optional parameter cannot be forgotten silently:
   when a map resolves, the action is a **payload-bearing write**, and `changes` was not
   supplied, `hasPermission` throws an explicit developer error rather than answering. Without
   it, a hand-rolled mutation that authorizes with `data: doc` and forgets `changes` lands on
   the projecting case and is ALLOWED to write a denied field — the only fail-open in the
   design, and an invisible one.

   `hasPermission` can classify the action with what it already has: `CRUD_ACTIONS.create` and
   `CRUD_ACTIONS.update`, plus any action listed in
   `access.customActions[resource].mutation` — the same lookup `resolveAccessCall` already
   performs for its undeclared-action warning. `delete` is excluded: a delete has no payload,
   so a map on it is meaningless and is ignored with a dev warning (consistent with `remove()`
   being out of scope). Message follows the existing needs-a-`data`-object wording:

   ```
   hasPermission: "siteSettings.update" resolved to a field map, but no "changes" was
   supplied. Pass the payload you intend to write so the map can be applied, or use
   resolveFieldPermissions() if you only need to know which fields are writable.
   ```

   A role with no field map anywhere takes byte-identical paths to today, so all ~40 existing
   call sites keep working untouched.
4. **`data` and `changes` are two inputs, because they answer two questions.** `data` is the
   STORED document (ADR-002); `changes` is what the caller wants to write. Collapsing them
   into one parameter is not a style question — it is unsafe in both directions:
   - Make `data` the patch and a per-document rule becomes caller-satisfiable. ADR-002 already
     documents the mild version (`update: ({ data }) => !data.src.includes("example.com")`
     passes if the caller simply omits `src`). The constraint form is worse than a bypass:
     under `{ constraints: ({ q, user }) => q.eq("organization", user.organization) }`, a
     caller who sends `organization: <their own>` in the patch satisfies the condition against
     a document belonging to someone else. That is privilege escalation, not a missed check.
   - Keep `data` as the stored document and use it for the field check instead, and every
     update is denied the moment any map exists — the stored document's keys are *every*
     field, so a key-by-key walk always finds a denied one.
   - Widening `data` to `{ before, after }` would fix both and break every existing callback
     signature in every consumer's config (`data.status` → `data.after.status`).

   So the change set is a second input — but it is only visible where it can be acted on:
   - **Core's `HasPermissionProps` keeps it, `@public`.** A server-side write outside core
     legitimately needs it: `customActions[slug].mutation` is an existing feature, so a
     project authoring its own `publish` mutation calls `hasPermission` and then writes. Hiding
     the parameter would make field maps unenforceable there with no way to opt in.
   - **The app-level wrapper omits it.** `apps/www/src/auth/hasPermission.ts` (and the
     identical `apps/test` copy) is `"use client"`, reads `useAuth()`, and is documented
     "advisory — server guards enforce". A client-side check must not look like it can
     authorize a write, so `changes` is added to the `Omit` that already hides `access`,
     `organization`, and `user`. What is left is exactly the two questions a UI asks: "may
     they touch this document?" (pass `data`) and "may they do this at all?" (pass `scope`).
   - **No extra read.** `update()` already fetches the stored document for the
     document-level check (`update/server.ts:78`, inside the same `access !== undefined`
     branch), and `upsertGlobal` already reads the row for its upsert decision. Both hand a
     document they already have to a check they already make.
   - **Forgetting it is loud, not silent** — see DD 3's payload-bearing-write exception.

   Named to match the `getChanges` vocabulary `useVexMutation` already uses.
5. **The map is fully type-checked, with no ceremony at the call site.** `FieldPermissionMap`
   is a union: the branch with `"*"` makes every other field optional; the branch without it
   requires **every** gateable field. That half works by ordinary assignability, so a partial
   map with no wildcard, a non-boolean value, a per-field callback, and a map written directly
   on an action are all plain compile errors.

   *Excess* keys — a misspelling (`admnTheme`) or a system key (`_id`) — are a different
   problem, and the reason is worth recording because it dictates the fix. They are normally
   caught by excess-property checking, which applies to an object **literal** checked directly
   against a target type. It is NOT applied to a literal returned from a contextually typed
   arrow. Verified that the return position itself is the cause and not this design's union: a
   single non-union object return type behaves identically, so does splitting the union into
   two function members, and so does annotating the *variable* rather than the function.

   Asking the developer to restore it — `satisfies`, a return-type annotation, or a `fields()`
   wrapper — all work, and all were rejected: the config is the surface a developer reads most,
   and a wrapper call on every map is exactly the noise this shape exists to avoid.

   The fix belongs in `VexAccessConfigInput`, and it is to stop relying on excess-property
   checking at all. `defineAccess` gains a `TPermissions` type parameter inferred from the
   `permissions` literal, so each callback's **inferred return type** becomes part of a type
   the library can inspect. `ValidateFieldMaps<TPermissions>` then walks role → subject →
   action, extracts the returned map with `ReturnType`, and replaces any entry carrying an
   unknown key with a template-literal error type. Excess keys become a *structural*
   mismatch, which needs no freshness:

   ```
   Type '() => { "*": false; admnTheme: boolean; }' is not assignable to type
     '(() => { "*": false; admnTheme: boolean; }) &
      "✖ field map returns a field not on this resource: \"admnTheme\""'
   ```

   Verified across 13 cases against a faithful replica of `RolePermissions` — including its
   load-bearing gate order (types.ts:719-727) — that this catches a typo, a system key, several
   bad keys at once, and a bad key inside `filter` beside `constraints`; that it still accepts
   booleans, constraint descriptors, `withIndex`, `resource: false`, the role-level and
   action-level wildcards, and subjects with no `data`; and critically that **contextual typing
   of the callback props survives**, so `({ user, data }) => …` keeps `user.roles` and
   `data.status` typed rather than collapsing to implicit `any`.

   One subtlety the implementation must keep: a branching callback
   (`cond ? { "*": true, price: false } : { "*": false }`) infers a *union* of maps, and
   `keyof (A | B)` yields only the keys common to both. `ExcessFieldKeys` therefore
   distributes over the union, or a bad key present in one branch only goes unreported.
   Verified both ways.
6. **System fields are never gateable at runtime.** `_id`, `_creationTime`, and `_slug` are
   excluded from the field-name union, ignored if a map names one anyway, and never stripped
   from a read. Stripping `_id` would break `populateDocs`, the admin panel's row keys, and
   every `update({ id })` round trip; denying it on write is meaningless because system keys
   are stripped from payloads before they reach the DB.
7. **One resolution path, two entry points.** The per-role walk (roles → `anonRole` fallback →
   known-role filter → resource entry → `resolveActionCheck` → check resolution) is extracted
   from `hasPermission` into one internal function returning each role's resolved result
   (`boolean | FieldPermissionMap`). `hasPermission` folds those per DD 3;
   `resolveFieldPermissions` merges them into a field decision. Neither can drift from the
   other, and constraint/`filter`/probe/`scope` semantics are inherited rather than restated.
8. **OR across roles, wildcard included.** Roles merge the way they already do for
   document-level checks: permitted if any role permits. A role whose check resolved to plain
   `true` permits every field, so it contributes `wildcard: true` and collapses the merge to
   all-permitted — which is what keeps `admin: { "*": true }` unaffected.
9. **Write denial is judged on CHANGED values, not present keys.** Both admin edit views
   submit the entire form (`CollectionEditView.tsx:80-85`, `GlobalEditView.tsx:45-49`), so
   `changes` always carries every field. Rejecting on key presence would make every save fail
   the moment one field is denied — the `adminTheme` scenario could never work. A denied key is
   a violation only when its value differs from `data`, compared with
   `CONSTRAINT_COMPARATORS.eq` (content equality: `relationship` and `select` store arrays, so
   `===` would report a change on every save). With no `data` (a create), any denied key
   present is a violation.
10. **A denied field rejects the whole write.** `hasPermission` returns on the first offending
    key, and the write paths already pass `throwOnDenied: true` — no partial patch, no silent
    drop. Silent dropping is additionally unsafe for globals: `upsertGlobal` replaces the whole
    `data` blob, so a dropped key is a deleted field.
11. **Read shaping runs after the existing document-level check.** A document invisible to
    `hasPermission` is dropped entirely (unchanged); a visible one has denied keys stripped.
12. **Globals are covered by the same resolver.** `upsertGlobal`, `getGlobal`, and
    `findGlobals` are separate enforcement sites from the collection API and all three get the
    same treatment. The `siteSettings` scenario is a global; a spec that only covered
    collections would deliver none of it.
13. **`VexAccessError` gains an optional `field`.** Present in the wire payload only when the
    denial is field-scoped — every `ConvexError.data` key must be present-and-defined or
    absent, never `undefined` (`convexToJson` rejects `undefined`; see the serializability
    tests in `hasPermission.test.ts`).
14. **Admin gating is advisory, client-side, no round trip.** `useFieldPermissions()` calls
    `resolveFieldPermissions()` against the bundle-imported `access` config (P-004), the same
    pattern `usePermission` already uses. Denied inputs are disabled, not hidden.
15. **Type narrowing is deferred, not attempted.** `find`/`get`/`create`/`update` return and
    argument types keep describing the full document. A caller may receive or be allowed fewer
    keys than the type promises for their role. Tracked in `backlog.md`.

## Out of Scope

- Generic type-parameter narrowing on server API signatures (DD 15) — backlog item.
- `resolveAccessConstraint`/`resolveAccessIndex` and index pushdown. A field map carries no
  index information, so a check resolving to one contributes no constraint and the query runs
  as it does for a bare callback today. Field grants shape a query's *results*, never its
  index selection.
- Field grants on populated relations — a populated related document's own grants are not
  recursively evaluated by `populateDocs`.
- `remove()` — a delete has no fields to authorize.
- Nested field paths (`light.background`). A map is keyed by top-level field names; denying a
  `group` field denies the whole group.
- A field map written directly on an action, or per-field callbacks — rejected by DD 2, not
  deferred.
- Relaxing `ConstrainedPermissionCheck` to accept `{ filter }` with no `constraints`. The bare
  callback is that form's spelling.
- Any call-site ceremony to make the map type-check — no `fields()` helper, no return-type
  annotation, no `satisfies`. `ValidateFieldMaps` makes those unnecessary (DD 5).
- RUNTIME validation of map keys inside `defineAccess`. The keys are checked by the type
  system instead; see Step 1's `config.ts` note for why the runtime cannot do it.

## Implementation

### Step 1 — Field-permission types `[dev]`

Every later step reads or writes this shape.

#### packages/core/src/access/types.ts

5 edits.

**1 — add the field-permission types.** Insert immediately before `export interface
SubjectEntry` (currently line 280), after the `PermissionCheck` declaration:

```ts
/** Document keys Convex owns, which a field map can neither gate nor strip (DD 6). */
type SystemFieldKey = "_id" | "_creationTime" | "_slug";

/**
 * The gateable field names of a document type — its own keys minus the system
 * keys Convex owns.
 *
 * Degrades to `string` pre-generation (when `TData` is `unknown` or
 * `Record<string, unknown>`), which collapses both {@link FieldPermissionMap}
 * branches to "any string-keyed map" and makes the exhaustiveness requirement
 * inert until `vex generate` has run — the same pre-generation degradation
 * `AccessDocFor` already has.
 *
 * @typeParam TData - Document type for the subject.
 */
export type FieldPermissionKey<TData> = Exclude<Extract<keyof TData, string>, SystemFieldKey>;

/**
 * A per-field decision for ONE action — what a check resolves to when it
 * answers *which fields* rather than *whether* (DD 1).
 *
 * Only ever a callback's RETURN value, never a value written on an action
 * (DD 2): a document may legitimately carry fields named `constraints` or
 * `filter`, and in a return position there is nothing to disambiguate against.
 *
 * Values are plain booleans. The map is built inside a callback that already
 * holds `{ user, data, organization }`, so a per-field rule is an ordinary
 * boolean expression — `activeTheme: user._id === data.ownerId` — rather than a
 * second callback layer receiving props its enclosing callback already closed
 * over.
 *
 * Two branches, and the union is the enforcement (DD 5):
 * - `"*"` present → every other field is optional; the wildcard decides them.
 * - `"*"` absent → EVERY gateable field must be named.
 *
 * So a partial map is a compile error and no field is silently permitted
 * because it was forgotten. An EXCESS key — a misspelling, or a system key —
 * is caught too, but not by this type: excess-property checking does not
 * apply to an object literal returned from a contextually typed arrow, so
 * {@link ValidateFieldMaps} catches those structurally through
 * `defineAccess`'s inferred `permissions` literal instead. Nothing is
 * required of the developer at the call site either way.
 *
 * Deliberately NOT the `{ mode, fields }` array shape the 2026-08-25
 * access-constraint-builder spec removed. That shape existed to drive QUERY
 * FILTERING through the constraint builder, which Convex cannot express
 * per-field on an index. This map never touches a query: it is evaluated in
 * plain JS against an already-fetched document (read path) or the incoming
 * payload plus the stored document (write path).
 *
 * @typeParam TData - Document type for the subject.
 */
export type FieldPermissionMap<TData = unknown> =
  | ({ [W in typeof WILDCARD_KEY]: boolean } & Partial<
      Record<FieldPermissionKey<TData>, boolean>
    >)
  | Record<FieldPermissionKey<TData>, boolean>;

/**
 * The field map a resolved check can return, or `never` when it cannot return
 * one. Reads through both callback positions: the check itself, and the
 * `filter` inside a `{ constraints, filter }` descriptor.
 *
 * `Extract<R, object>` drops the `boolean | undefined` members of the return
 * union, leaving only the map — so a boolean-returning callback yields `never`
 * and validates trivially.
 *
 * @internal Type-level only; consumed by {@link ValidateFieldMaps}.
 */
export type FieldMapReturnOf<TCheck> = TCheck extends (...args: never[]) => infer R
  ? Extract<R, object>
  : TCheck extends { filter: infer F }
    ? F extends (...args: never[]) => infer R2
      ? Extract<R2, object>
      : never
    : never;

/**
 * Keys a returned map declares that are not gateable fields of the subject.
 *
 * DISTRIBUTES over `TMap`. A branching callback
 * (`cond ? { "*": true, price: false } : { "*": false }`) infers a UNION of
 * maps, and `keyof (A | B)` is only the keys common to both — so without
 * distribution a bad key present in one branch goes unreported.
 *
 * @internal
 */
export type ExcessFieldKeys<TMap, TAllowed extends string> = [TMap] extends [never]
  ? never
  : TMap extends unknown
    ? Exclude<keyof TMap, TAllowed | typeof WILDCARD_KEY>
    : never;

/**
 * The type an offending action entry is replaced with, so the compiler reports
 * the bad key by name at the exact property.
 *
 * A template literal rather than a tuple or object: a tuple made TypeScript
 * print `Array.prototype.filter`'s overloads whenever the offending property
 * was itself named `filter`, which is the constraint-descriptor case.
 *
 * @internal
 */
export type FieldMapError<K> = K extends string
  ? `✖ field map returns a field not on this resource: "${K}"`
  : never;
```

`WILDCARD_KEY` is already imported by this file (it types `RolePermissions`' action wildcard).
There is no `FieldPermissionCheck` type: a field value is a `boolean`, full stop. There is no
`fields()` helper and no call-site annotation — `ValidateFieldMaps` (edit 3) makes the map
checkable where it is written.

**2 — widen only the callback return.** `BasePermissionCheck` (line 72) is the single type
behind a static action value, an action callback, and the `filter` property inside
`ConstrainedPermissionCheck`. Widening its FUNCTION member's return type covers both callback
positions at once; the static `boolean` member is left alone, which is what keeps a map off
the action itself (DD 2):

```ts
type BasePermissionCheck<TData, TUser, TOrg> =
  | boolean
  | ((
      props: PermissionCallbackProps<TData, TUser, TOrg>,
    ) => boolean | undefined | FieldPermissionMap<TData>);
```

Nothing else in the file changes: `AnyActionPermissionCheck` and `PermissionCheck` both
already union `BasePermissionCheck`, `ConstrainedPermissionCheck.filter` already IS one, and
`RolePermissions` already routes every action to one of them.

**3 — add `ValidateFieldMaps` and make `permissions` an inference site.** This is the edit
that removes all call-site ceremony (DD 5). Add beside `RolePermissions` (line 709):

```ts
/**
 * Replaces every action entry whose returned field map names an unknown field
 * with a {@link FieldMapError}, leaving every valid entry as it was.
 *
 * Exists because excess-property checking does not reach an object literal
 * returned from a contextually typed arrow (DD 5). Intersecting the inferred
 * `permissions` literal with this mapped type turns a bad key into a
 * STRUCTURAL mismatch instead, which needs no freshness — and it reports the
 * key by name at the exact property, which freshness would not have.
 *
 * Walks role → subject → action and touches nothing else: a `boolean` role
 * entry, a `boolean` subject entry, a subject key that is not a declared
 * subject, and the role-level wildcard all pass through unchanged, as does any
 * check that cannot return a map.
 *
 * @typeParam TPermissions - The inferred `permissions` literal.
 * @typeParam TSubjects - The resolved {@link SubjectMap}.
 */
export type ValidateFieldMaps<TPermissions, TSubjects> = {
  [R in keyof TPermissions]: TPermissions[R] extends object
    ? {
        [S in keyof TPermissions[R]]: S extends keyof TSubjects
          ? TPermissions[R][S] extends object
            ? {
                [A in keyof TPermissions[R][S]]: ExcessFieldKeys<
                  FieldMapReturnOf<TPermissions[R][S][A]>,
                  FieldPermissionKey<TSubjects[S]["data"]>
                > extends never
                  ? TPermissions[R][S][A]
                  : FieldMapError<
                      ExcessFieldKeys<
                        FieldMapReturnOf<TPermissions[R][S][A]>,
                        FieldPermissionKey<TSubjects[S]["data"]>
                      >
                    >;
              }
            : TPermissions[R][S]
          : TPermissions[R][S]
      }
    : TPermissions[R];
};
```

Then `VexAccessConfigInput` gains a trailing type parameter and applies it to `permissions`:

```ts
export interface VexAccessConfigInput<
  TRoles extends readonly string[],
  // …existing parameters unchanged…
  TPermissions = Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustomResources, TUserSlug, TOrgSlug, TCustomActions>,
      InferDocTypeFromSlug<TUserSlug>,
      TOrgSlug extends string ? InferDocTypeFromSlug<TOrgSlug> : never,
      TUserSlug,
      TOrgSlug
    >
  >,
> {
  // …
  /**
   * Permission matrix: role → subject → check. See {@link RolePermissions}
   * for shapes and wildcard semantics.
   *
   * Intersected with {@link ValidateFieldMaps} so a returned field map naming
   * an unknown field is a compile error at that entry. The bare `TPermissions`
   * member is what makes the literal inferrable; the constraint on
   * `TPermissions` (declared on `defineAccess`) is what keeps every callback's
   * props contextually typed.
   */
  permissions: TPermissions &
    ValidateFieldMaps<
      TPermissions,
      SubjectMap<TResources, TCustomResources, TUserSlug, TOrgSlug, TCustomActions>
    >;
}
```

The parameter is trailing and defaulted, so no other reference to `VexAccessConfigInput`
changes — `defineAccess` is its only consumer today.

**5 — extend `VexAccessError`** (line 951) with an optional `field` on the class, the
`ConvexError` data shape, and the constructor:

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

Also delete the stale doc comment at lines 37-41 ("Single permission check result — boolean
shorthand or a field-mode object restricting the check to named fields"), an orphan left by
the 2026-08-25 removal that describes neither the old nor the new shape.

#### packages/core/src/access/config.ts

1 edit — `defineAccess` gains the inference site that makes DD 5's checking work. Add a
trailing type parameter and thread it into the input type:

```ts
export function defineAccess<
  const TRoles extends readonly string[],
  // …existing parameters unchanged…
  TPermissions extends Record<
    TRoles[number],
    RolePermissions<
      SubjectMap<TResources, TCustomResources, TUserSlug, TOrgSlug, TCustomActions>,
      InferDocTypeFromSlug<TUserSlug>,
      TOrgSlug extends string ? InferDocTypeFromSlug<TOrgSlug> : never,
      TUserSlug,
      TOrgSlug
    >
  > = /* the same type, as the default */,
>(
  props: VexAccessConfigInput<
    TRoles,
    TResources,
    TCustomResources,
    TUserSlug,
    TOrgSlug,
    TCustomActions,
    TPermissions
  >,
): VexAccessConfig</* unchanged */> {
```

Two things about this are load-bearing and must not be "simplified" during implementation:

1. **No `const` modifier on `TPermissions`.** The other parameters use `const` to preserve
   literal types for slugs and role names. `TPermissions` holds functions and does not need
   it, and `const` inference here interacts badly with the contextual typing below.
2. **The constraint is the full `Record<TRoles[number], RolePermissions<…>>`, not
   `unknown`.** TypeScript contextually types the `permissions` literal from a type
   parameter's CONSTRAINT during inference. That is the only thing keeping
   `({ user, data }) => …` callbacks typed — an unconstrained `TPermissions` would infer the
   literal fine and silently turn every callback parameter into an implicit `any`, which is
   the exact failure mode the gate-order comment at `types.ts:719-727` already warns about
   for a different cause. The type-level test file (below) pins this.

No runtime validation is added here, and that is not an oversight — it is impossible.
`defineAccess` has every field name it would need (the generated `vex.types.ts` interfaces
reach it through `AccessDocFor`/`DocumentBySlug` at the type level, and each `resources` /
`customResources` entry carries its runtime `fields` record), but it does not have the **map**.
A map is a filter callback's return value, and at config time that value is `[Function]` —
nothing has called it. Calling it to look would mean synthesizing a `user`, a `data` document
and an `organization`, and a callback may branch on all three
(`user.roles.includes("editor") ? A : B`), so even a successful dry run would validate one
branch and miss the others.

The type system has no such problem: it sees every branch of every callback's inferred return
type without running anything, which is why `ValidateFieldMaps` belongs there and the runtime
check does not belong here.

Verify: covered by the type-level test file in Step 2.

### Step 2 — Shared resolution, the `hasPermission` fold, and `resolveFieldPermissions()` `[dev]`

The core of the spec. `hasPermission` currently owns the whole per-role walk inline
(`hasPermission.ts:91-144`); this step extracts it so both entry points share it (DD 7), then
folds maps into `hasPermission`'s boolean answer (DD 3).

#### packages/core/src/access/hasPermission.ts

6 edits. `SYSTEM_FIELD_KEYS` (`new Set(["_id", "_creationTime", "_slug"])`) is declared once
in `resolveFieldPermissions.ts` and imported here, so the two files cannot disagree about
which keys are ungateable (DD 6).

**1 — add `changes` to `HasPermissionProps`** (line 40), beside the existing `data` (DD 4).
The interface lives in THIS file, not `types.ts`:

```ts
  /**
   * The keys this operation writes — the incoming payload on a create, the
   * patch on an update. Supplied by write call sites only.
   *
   * Distinct from `data`, which stays the STORED document so a per-document
   * rule cannot be satisfied by whatever the caller chose to send (ADR-002).
   * When a role's check resolves to a {@link FieldPermissionMap}, every key
   * here whose value differs from `data` must be permitted by that map, or
   * access is denied naming the field (DD 3, DD 9).
   *
   * Ignored entirely when no field map resolves, so omitting it never changes
   * an existing call's answer.
   */
  changes?: Record<string, unknown>;
```

**2 — extract the per-role walk** into a new exported-but-`@internal` function:

```ts
/**
 * Resolves one caller's roles to one resolved result per role — the shared
 * half of `hasPermission` and `resolveFieldPermissions` (DD 7).
 *
 * Owns role normalization (`string | string[]`), the `anonRole` fallback, the
 * known-role filter, resource-entry/wildcard precedence via
 * `resolveActionCheck`, and check resolution (booleans, callbacks, the
 * data-dependency probe, constraint descriptors, `filter`). Both entry points
 * inherit every one of those semantics rather than restating them.
 *
 * @returns One entry per known role. `boolean` is that role's flat answer; a
 *   {@link FieldPermissionMap} is its per-field answer. Empty when the caller
 *   holds no known role.
 * @internal
 */
export function resolveRoleResults<TData, TUser, TOrg>(props: {
  access: VexAccessConfig;
  user: TUser | null;
  data?: TData;
  organization?: TOrg;
  resource: string;
  action: string;
  scope: PermissionScope;
}): Array<boolean | FieldPermissionMap> {
  const { access } = props;

  const rawRoles = props.user
    ? (props.user as Record<string, unknown>)[access.userRolesField]
    : [];
  const userRoles =
    typeof rawRoles === "string"
      ? [rawRoles]
      : Array.isArray(rawRoles)
        ? rawRoles.filter((role): role is string => typeof role === "string")
        : [];
  const effectiveRoles =
    userRoles.length === 0 && access.anonRole !== undefined ? [access.anonRole] : userRoles;
  const knownRoles = effectiveRoles.filter((role) => access.roles.includes(role));

  const defaultAllowed = access.defaultPermissionMode === PERMISSION_MODES.allow;

  if (knownRoles.length === 0) {
    return [];
  }

  return knownRoles.map((userRole): boolean | FieldPermissionMap => {
    const role = access.permissions[userRole];
    const resource = role?.[props.resource];

    let check: PermissionCheck;
    if (typeof resource === "boolean") {
      // { posts: true }
      check = resource;
    } else if (resource !== null && resource !== undefined && typeof resource === "object") {
      // { posts: { "*": true, update: () => {}, delete: false } }
      check =
        resolveActionCheck({
          resource: resource as Record<string, unknown>,
          action: props.action,
        }) ?? defaultAllowed;
    } else {
      // { posts: undefined }
      const roleWildcard = role?.[WILDCARD_KEY];
      check = typeof roleWildcard === "boolean" ? roleWildcard : defaultAllowed;
    }

    return (
      resolvePermissionCheck({
        check,
        user: props.user,
        data: props.data,
        organization: access.orgCollectionSlug !== undefined ? props.organization : undefined,
        resource: props.resource,
        action: props.action,
        scope: props.scope,
      }) ?? defaultAllowed
    );
  });
}
```

**3 — `resolvePermissionCheck`'s return type** widens from `boolean` to `boolean |
FieldPermissionMap`. Only the function branch can produce a map (DD 2), so:
- `isConstrainedCheck(check)` → unchanged delegation, but `resolveConstrainedCheck`'s `filter`
  recursion now propagates a map: when the constraint condition holds and `filter` returns a
  map, that map is the result. When the condition fails, `false` — a document the caller
  cannot reach has no field decision.
- the `typeof check !== "function"` branch still returns a boolean, unchanged: the static side
  of the union was deliberately not widened.
- the callback-invoking branches return whatever the callback returned, normalizing
  `undefined` to `false` exactly as today. A returned object needs no unwrapping — it IS the
  map.
- the data-dependency probe (lines 317-359) is untouched. A callback that reads `data` with no
  `data` supplied still answers per `scope`, and a `scope`-resolved answer is a boolean.

**4 — fold maps into the boolean answer** (DD 3). `hasPermission`'s body becomes the role
resolution plus one per-role fold:

```ts
  const scope = props.scope ?? PERMISSION_SCOPES.all;
  const roleResults = resolveRoleResults({
    access,
    user: props.user,
    data: props.data,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
    scope,
  });

  // Named here, read only inside the fold below, and only when a violation is
  // found: the throw after the fold reports the field the map-resolved role
  // rejected. A role that permits the write never assigns it.
  let deniedField: string | undefined;

  // OR across roles: holding any role that permits the action is enough.
  const allPermissions = roleResults.some((result) => {
    if (typeof result === "boolean") return result;

    // A field map is a PARTIAL answer. What it resolves to depends on what the
    // caller told us about the operation — see DD 3.

    // `delete` has no payload, so a per-field answer is meaningless. Warn so a
    // rule returning a map on `delete` is visible to fix, but never let it gate
    // `remove()` — a delete keeps working exactly as before.
    if (props.action === CRUD_ACTIONS.delete) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[vexcms] "${props.resource}.delete" resolved to a field map, but delete has no ` +
            `payload to gate — the map is ignored. Return a boolean from this rule instead.`,
        );
      }
      return true;
    }

    if (props.changes !== undefined) {
      // A write: every changed key must be permitted.
      const denied = deniedFieldIn({
        map: result,
        changes: props.changes,
        stored: props.data as Record<string, unknown> | undefined,
      });
      if (denied !== undefined) deniedField = denied;
      return denied === undefined;
    }

    // A read or document-level probe: the map projects, it does not deny —
    // UNLESS this is a payload-bearing write that forgot to pass `changes`.
    // Without this branch a hand-rolled mutation authorizing with `data: doc`
    // and no `changes` would land here and be ALLOWED to write a denied field:
    // the only fail-open in the design, and an invisible one (DD 3).
    if (props.data !== undefined) {
      if (isPayloadBearingWrite({ access, resource: props.resource, action: props.action })) {
        throw new VexAccessError({
          resource: props.resource,
          action: props.action,
          message:
            `hasPermission: "${props.resource}.${props.action}" resolved to a field map, but no ` +
            `"changes" was supplied. Pass the payload you intend to write so the map can be ` +
            `applied, or use resolveFieldPermissions() if you only need to know which fields ` +
            `are writable.`,
        });
      }
      return true;
    }

    // Quantified: the existing scope semantics decide. A map means not every
    // field is permitted, so `all` (the default) denies.
    if (scope === PERMISSION_SCOPES.any) return true;
    if (scope === PERMISSION_SCOPES.all) return false;
    throw new VexAccessError({
      resource: props.resource,
      action: props.action,
      message:
        `hasPermission: "${props.resource}.${props.action}" resolved to a field map, which is ` +
        `a per-field answer. Pass "changes" to authorize a write, "data" to authorize a read, ` +
        `or use scope: "any" (nav/list gating) or scope: "all" (bulk actions).`,
    });
  });

  if (allPermissions === false) {
    if (props.throwOnDenied) {
      throw new VexAccessError({
        resource: props.resource,
        action: props.action,
        ...(deniedField !== undefined ? { field: deniedField } : {}),
      });
    }
    return false;
  }
  return true;
```

The two `VexAccessError` throws inside the fold are usage errors, not denials: they fire
regardless of `throwOnDenied`, because there is no correct boolean to return. `CRUD_ACTIONS`
joins this file's existing `./constants` import.

**5 — `isPayloadBearingWrite`**, module-private, backing the DD 3 exception above:

```ts
/**
 * True when `action` on `resource` carries a payload a resolved field map must
 * be checked against: `create`/`update`, or any action declared in
 * `access.customActions[resource].mutation` — the same lookup
 * `resolveAccessCall` (`api/utils.ts:52-54`) already performs for its
 * undeclared-action warning.
 *
 * `delete` is deliberately excluded: a delete has no payload, so a map
 * resolving on it can never be "missing changes". `hasPermission` handles that
 * case separately — warn and ignore, never throw.
 *
 * @internal
 */
function isPayloadBearingWrite(props: {
  access: VexAccessConfig;
  resource: string;
  action: string;
}): boolean {
  if (props.action === CRUD_ACTIONS.create || props.action === CRUD_ACTIONS.update) {
    return true;
  }
  const customActions = props.access.customActions as
    | Record<string, CustomActionsInput>
    | undefined;
  return customActions?.[props.resource]?.mutation?.includes(props.action) ?? false;
}
```

**6 — `deniedFieldIn`**, module-private, beside the other resolvers:

```ts
/**
 * The first key in `changes` that `map` does not permit, or `undefined` when
 * every changed key is permitted.
 *
 * A key is a violation only when its value CHANGES (DD 9). The admin forms
 * submit every field on every save, so presence-based rejection would make the
 * `{ "*": false, adminTheme: true }` scenario impossible: a save touching only
 * `adminTheme` still carries every other field. Comparison is
 * `CONSTRAINT_COMPARATORS.eq` (content equality) because `relationship` and
 * `select` store arrays, where `===` reports a change on every save.
 *
 * @param props.stored - The stored document. Omitted on a create, where any
 *   denied key present is a violation.
 * @internal
 */
function deniedFieldIn(props: {
  map: FieldPermissionMap;
  changes: Record<string, unknown>;
  stored?: Record<string, unknown>;
}): string | undefined {
  const map = props.map as Record<string, boolean | undefined>;
  const wildcard = map[WILDCARD_KEY];

  for (const key of Object.keys(props.changes)) {
    // System keys never reach the DB from a payload — nothing to gate.
    if (SYSTEM_FIELD_KEYS.has(key)) continue;

    // The map permits the key: its own entry if present, else the map's
    // wildcard, else `true` — a wildcard-less map is exhaustive, so "absent"
    // cannot happen for a declared field; an undeclared/dynamic field falls
    // through as permitted.
    const explicit = map[key];
    const permitted = explicit !== undefined ? explicit : (wildcard ?? true);
    if (permitted) continue;

    // Denied but unchanged is not a write to that field.
    if (
      props.stored !== undefined &&
      CONSTRAINT_COMPARATORS.eq(props.changes[key], props.stored[key])
    ) {
      continue;
    }

    return key;
  }

  return undefined;
}
```

#### packages/core/src/access/resolveFieldPermissions.ts

New file — the read-only introspection entry point (the "which fields?" question), plus the
read-path shaper.

```ts
import { WILDCARD_KEY, PERMISSION_SCOPES } from "./constants";
import type { PermissionScope } from "./constants";
import { resolveRoleResults } from "./hasPermission";
import type { FieldPermissionMap, VexAccessConfig } from "./types";

/**
 * Document keys Convex owns, which a field map can neither gate nor strip
 * (DD 6). Declared here and imported by `hasPermission.ts` so the write path
 * and the read path cannot disagree about which keys are ungateable.
 */
export const SYSTEM_FIELD_KEYS = new Set(["_id", "_creationTime", "_slug"]);

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
 * One line, and that is the payoff of DD 2: a map only ever arrives as a
 * callback's return, so there is no descriptor to tell it apart from and no key
 * whose name could collide with the API's own.
 */
export function isFieldPermissionMap(value: unknown): value is FieldPermissionMap {
  return typeof value === "object" && value !== null;
}

/**
 * Dev-only warning for a returned map naming a field the resource does not
 * declare — a misspelling, or a system key the runtime ignores (DD 6).
 *
 * A BACKSTOP, not the primary mechanism: `ValidateFieldMaps` rejects these at
 * compile time (DD 5), so a TypeScript consumer never sees this warning. It
 * earns its keep for the cases the compiler cannot reach — a plain-JS
 * `vex.config.js`, a `permissions` matrix assembled at runtime, or a config
 * cast through `as`.
 *
 * Gated on `process.env.NODE_ENV !== "production"`, matching the posture
 * `resolveAccessCall` already uses for an undeclared action. Warns, never
 * throws — a Convex document can carry fields the schema does not declare.
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

  // Custom resources and built-in subjects (e.g. "adminPanel") carry no
  // `fields` record — there is nothing to check a map's keys against.
  const resourceEntry = props.access.resources.find((entry) => entry.slug === props.resource);
  if (resourceEntry === undefined) return;

  const declaredFields = (resourceEntry as { fields?: Record<string, unknown> }).fields;
  if (declaredFields === undefined) return;

  for (const key of Object.keys(props.map)) {
    if (key === WILDCARD_KEY) continue;
    // An empty-string key can never match a declared field, so it falls
    // through to the generic warning below like any other bad key.
    if (key in declaredFields) continue;

    if (SYSTEM_FIELD_KEYS.has(key)) {
      console.warn(
        `[vexcms] Field map for "${props.resource}.${props.action}" names system field ` +
          `"${key}", which is never gateable and is always retained — the entry is ignored.`,
      );
      continue;
    }

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
 * counterpart to `hasPermission`, sharing its role walk (DD 7).
 *
 * This answers "which fields?"; `hasPermission` answers "may they?". It never
 * denies an operation and never throws on a denial: use it to shape a read
 * response (`stripDeniedFields`) or to gate admin inputs
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

  const results = resolveRoleResults({
    access,
    user: props.user,
    data: props.data,
    organization: props.organization,
    resource: props.resource,
    action: props.action,
    // `all` is the fail-closed answer for a data-reading callback with no
    // `data`, matching `hasPermission`'s default rather than inventing a
    // second posture — unless the caller asked for `"any"` (list gating).
    scope: props.scope ?? PERMISSION_SCOPES.all,
  });

  // No known role: the document-level check has already denied. Answering
  // consistently here (rather than falling through to UNRESTRICTED_FIELDS)
  // matters for a caller that reaches this resolver directly.
  if (results.length === 0) {
    return { wildcard: false, fields: {} };
  }

  // A role permitting the action outright permits every field — no other
  // role's map can narrow it. `admin: { "*": true }` takes this path.
  if (results.some((result) => result === true)) {
    return UNRESTRICTED_FIELDS;
  }

  const maps = results.filter(isFieldPermissionMap);

  // Reported against the role that wrote it, before the merge collapses which
  // map contributed what.
  for (const map of maps) {
    warnOnUndeclaredFields({ map, access, resource: props.resource, action: props.action });
  }

  // A role resolving to plain `false` contributes nothing to the OR-merge — it
  // is simply absent from `maps` — so the defaults below are "nothing
  // permitted" when every role answered `false` or returned a denying map.
  let wildcard = false;
  for (const map of maps) {
    if ((map as Record<string, boolean | undefined>)[WILDCARD_KEY] === true) {
      wildcard = true;
      break;
    }
  }

  const fieldKeys = new Set<string>();
  for (const map of maps) {
    for (const key of Object.keys(map)) {
      if (key !== WILDCARD_KEY) fieldKeys.add(key);
    }
  }

  const fields: Record<string, boolean> = {};
  for (const key of fieldKeys) {
    // Permitted when ANY role permits it, where one role's answer is its own
    // entry if present, else ITS OWN wildcard (not the merged one) — a role
    // returning `{ "*": true }` permits a field another role named `false`.
    let permitted = false;
    for (const map of maps) {
      const typed = map as Record<string, boolean | undefined>;
      const ownAnswer = typed[key] !== undefined ? typed[key]! : (typed[WILDCARD_KEY] ?? false);
      if (ownAnswer) {
        permitted = true;
        break;
      }
    }
    // Redundant against the merged wildcard: drop it. An empty `fields` is the
    // fast path `stripDeniedFields` checks.
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
 * System keys are always retained (DD 6) — stripping `_id` would break
 * `populateDocs`, admin row keys, and every `update({ id })` round trip.
 *
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
    if (SYSTEM_FIELD_KEYS.has(key)) continue;
    if (!isFieldAllowed(resolved, key)) {
      delete stripped[key];
    }
  }
  return stripped;
}
```

#### packages/core/src/access/index.ts

1 edit — one export line beside the existing barrel exports:

```ts
export * from "./resolveFieldPermissions";
```

`fields`, `FieldPermissionMap`, and `FieldPermissionKey` reach consumers through the existing
`./types` export.

#### packages/core/src/access/hasPermission.test.ts

Add to the existing file. These are the cases that pin DD 3, so they are the ones that matter
most in the whole spec — `hasPermission` is the only gate.

```ts
describe("hasPermission — field maps", () => {
  // Fixture: a role whose `update` is `() => ({ "*": false, adminTheme: true })`,
  // and a stored document `{ name: "Site", adminTheme: ["t1"], activeTheme: ["t9"] }`.

  it("permits a write that changes only a permitted field", () => {
    // changes: { adminTheme: ["t2"] } → true
  });

  it("permits a write that resends denied fields UNCHANGED", () => {
    // changes: { name: "Site", activeTheme: ["t9"], adminTheme: ["t2"] } → true.
    // The full-form-submit case (DD 9); presence-based rejection would fail it.
  });

  it("compares array values by content, not reference", () => {
    // changes: { activeTheme: ["t9"] } with stored ["t9"] → true.
  });

  it("denies a write that changes a denied field", () => {
    // changes: { name: "Defaced" } → false
  });

  it("throws naming the denied field under throwOnDenied", () => {
    // expect error.field === "name", and error.data.field === "name"
  });

  it("denies any denied key present when there is no stored document", () => {
    // create: no `data`, changes: { name: "New" } → false
  });

  it("permits a read — a map projects, it does not deny", () => {
    // `data` supplied, no `changes` → true, even though `name` is denied.
  });

  it("denies under the default scope when neither data nor changes is given", () => {
    // → false. A map means not every field is permitted (DD 3).
  });

  it("permits under scope 'any' when neither is given", () => {
    // → true. Nav/list gating.
  });

  it("throws the needs-context error under scope 'doc'", () => {
    // Message names both `changes` and `data` as the ways out.
  });

  it("throws when a payload-bearing write resolves a map but omits `changes`", () => {
    // action `update`, `data` supplied, no `changes` → explicit developer error,
    // NOT the projecting case. Closes the design's only fail-open (DD 3).
  });

  it("throws the same way for a custom mutation action", () => {
    // `customActions: { posts: { mutation: ["publish"] } }`, action `publish`.
    // Classification comes from the same lookup `resolveAccessCall` uses.
  });

  it("does NOT throw for a custom QUERY action that omits `changes`", () => {
    // `customActions: { posts: { query: ["listFeatured"] } }` → projects.
  });

  it("ignores a map on `delete` and warns in dev", () => {
    // A delete has no payload, so `remove()` must keep working unchanged.
  });

  it("ignores `changes` entirely when no field map resolves", () => {
    // Role with `update: true`; changes naming anything → true. Proves the
    // ~40 existing call sites are unaffected.
  });

  it("OR-merges across roles before judging the write", () => {
    // viewer: () => ({ "*": false }), finance: () => ({ "*": false, price: true });
    // changes: { price: 2 } → true.
  });

  it("keeps VexAccessError.data serializable", () => {
    // `field` absent (not undefined) on a resource-level denial; present on a
    // field-scoped one. `convexToJson` rejects `undefined`.
  });
});
```

#### packages/core/src/access/resolveFieldPermissions.test.ts

New file. Complete, real tests — no placeholder fixtures (AP-009). Mirror
`hasPermission.test.ts`'s fixture style; read it first so both files share one convention.

```ts
import { describe, expect, it, vi } from "vitest";
import {
  isFieldAllowed,
  isFieldPermissionMap,
  resolveFieldPermissions,
  stripDeniedFields,
} from "./resolveFieldPermissions";
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

const CALL = { resource: "posts", action: "update" } as const;

describe("isFieldPermissionMap", () => {
  it("reads a returned object as a field map", () => {
    expect(isFieldPermissionMap({ "*": false, title: true })).toBe(true);
  });

  it("reads an exhaustive map with a field named constraints as a field map", () => {
    // The collision DD 2 removes: as a RETURN value there is no descriptor to
    // confuse this with.
    expect(isFieldPermissionMap({ constraints: true, title: false })).toBe(true);
  });

  it("rejects booleans, null, and undefined", () => {
    expect(isFieldPermissionMap(true)).toBe(false);
    expect(isFieldPermissionMap(null)).toBe(false);
    expect(isFieldPermissionMap(undefined)).toBe(false);
  });
});

describe("resolveFieldPermissions", () => {
  it("is unrestricted when access is undefined (RBAC off)", () => {
    expect(resolveFieldPermissions({ access: undefined, user: null, ...CALL })).toEqual({
      wildcard: true,
      fields: {},
    });
  });

  it("is unrestricted when the action is a plain true", () => {
    const access = buildAccess({ editor: { posts: { update: true } } });
    expect(
      resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("is unrestricted when the callback returns a plain true", () => {
    const access = buildAccess({ editor: { posts: { update: () => true } } });
    expect(
      resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("denies every field when the callback returns false", () => {
    const access = buildAccess({ editor: { posts: { update: () => false } } });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("resolves an allow-list map", () => {
    const access = buildAccess({
      editor: { posts: { update: () => ({ "*": false, title: true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(resolved.wildcard).toBe(false);
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("resolves a deny-list map", () => {
    const access = buildAccess({
      editor: { posts: { update: () => ({ "*": true, price: false }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(false);
    expect(isFieldAllowed(resolved, "title")).toBe(true);
  });

  it("resolves a per-field boolean EXPRESSION over the document", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: ({ data }: { data?: { status?: string } }) => ({
            "*": false,
            price: data?.status === "draft",
          }),
        },
      },
    });
    const draft = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "draft" },
      ...CALL,
    });
    const published = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "published" },
      ...CALL,
    });
    expect(isFieldAllowed(draft, "price")).toBe(true);
    expect(isFieldAllowed(published, "price")).toBe(false);
  });

  it("resolves a map returned from `filter` beside `constraints`", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: {
            constraints: ({ q }: { q: { eq: (f: string, v: unknown) => unknown } }) =>
              q.eq("status", "draft"),
            filter: () => ({ "*": false, title: true }),
          },
        },
      },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "draft" },
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("denies every field when the constraint excludes the document", () => {
    const access = buildAccess({
      editor: {
        posts: {
          update: {
            constraints: ({ q }: { q: { eq: (f: string, v: unknown) => unknown } }) =>
              q.eq("status", "draft"),
            filter: () => ({ "*": true }),
          },
        },
      },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["editor"] },
      data: { status: "published" },
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("OR-merges across roles", () => {
    const access = buildAccess({
      viewer: { posts: { update: () => ({ "*": false }) } },
      finance: { posts: { update: () => ({ "*": false, price: true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["viewer", "finance"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(true);
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("lets a role's own wildcard beat another role's explicit deny", () => {
    const access = buildAccess({
      viewer: { posts: { update: () => ({ "*": false, price: false }) } },
      finance: { posts: { update: () => ({ "*": true }) } },
    });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["viewer", "finance"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "price")).toBe(true);
  });

  it("falls back to anonRole when the caller has no roles", () => {
    const access = {
      ...buildAccess({ anon: { posts: { update: () => ({ "*": false, title: true }) } } }),
      anonRole: "anon",
    };
    const resolved = resolveFieldPermissions({ access, user: null, data: {}, ...CALL });
    expect(isFieldAllowed(resolved, "title")).toBe(true);
    expect(isFieldAllowed(resolved, "price")).toBe(false);
  });

  it("denies every field for a caller with no known role", () => {
    const access = buildAccess({ editor: { posts: { update: () => ({ "*": true }) } } });
    const resolved = resolveFieldPermissions({
      access,
      user: { roles: ["ghost"] },
      data: {},
      ...CALL,
    });
    expect(isFieldAllowed(resolved, "title")).toBe(false);
  });

  it("is per action: a map on update does not restrict read", () => {
    const access = buildAccess({
      editor: { posts: { read: true, update: () => ({ "*": false, title: true }) } },
    });
    expect(
      resolveFieldPermissions({
        access,
        user: { roles: ["editor"] },
        data: {},
        resource: "posts",
        action: "read",
      }),
    ).toEqual({ wildcard: true, fields: {} });
  });

  it("warns in dev on a key the resource does not declare", () => {
    // The runtime backstop for consumers the compiler cannot reach (plain JS, a
    // matrix built at runtime, a config cast through `as`) — which is what the
    // `as VexAccessConfig` below simulates. Reuse whatever fixture collection
    // `hasPermission.test.ts` defines rather than adding a second one.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const access = {
      ...buildAccess({ editor: { posts: { update: () => ({ "*": false, tilte: true }) } } }),
      resources: [postsCollection],
    } as VexAccessConfig;
    resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns in dev on a system key", () => {
    // Same backstop; `_id` is rejected by `ValidateFieldMaps` in typed configs.
  });

  it("does not warn on the wildcard key or a declared field", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const access = {
      ...buildAccess({ editor: { posts: { update: () => ({ "*": false, title: true }) } } }),
      resources: [postsCollection],
    } as VexAccessConfig;
    resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("stripDeniedFields", () => {
  it("returns the same reference when nothing is restricted", () => {
    const doc = { _id: "1", title: "a", price: 10 };
    expect(stripDeniedFields(doc, { wildcard: true, fields: {} })).toBe(doc);
  });

  it("removes denied keys without mutating the input", () => {
    const doc = { _id: "1", title: "a", price: 10 };
    const result = stripDeniedFields(doc, { wildcard: false, fields: { title: true } });
    expect(result).toEqual({ _id: "1", title: "a" });
    expect(doc).toEqual({ _id: "1", title: "a", price: 10 });
  });

  it("always retains system keys", () => {
    const doc = { _id: "1", _creationTime: 0, _slug: "siteSettings", name: "x" };
    expect(stripDeniedFields(doc, { wildcard: false, fields: {} })).toEqual({
      _id: "1",
      _creationTime: 0,
      _slug: "siteSettings",
    });
  });
});
```

#### Type-level regression test

`packages/core/src/access/fieldPermissions.types.test.ts` — a `// @ts-expect-error`-based file
pinning DD 5. It is the most load-bearing test in the spec: every guarantee there is a
*compile-time* one, so nothing else in the suite would notice a refactor of
`BasePermissionCheck`, `ValidateFieldMaps`, or `defineAccess`'s type parameters silently
destroying it. `vitest` type-checks it through `tsc --noEmit`; no runtime assertions.

Written as real `defineAccess({ … })` calls against a real generated-style subject registry,
not against the raw types — the validator only engages through the inference site, so testing
`FieldPermissionMap` in isolation would pass while the actual config surface regressed.

Must compile: a boolean action value; a bare callback returning a wildcard map; a bare
callback returning an exhaustive map; per-field boolean *expressions* off the callback props;
a boolean-returning callback; an `undefined`-returning callback; `{ constraints, filter }`
with a map-returning filter; a `constraints` callback using `q.withIndex`; `resource: false`;
the role-level wildcard (`"*": true`); the action-level wildcard; a subject with no `data`
(`adminPanel`); and a branching callback whose every branch is valid.

Must error: a map written directly on an action; a partial map with no wildcard; a per-field
callback; a non-boolean field value; a misspelled field key; a system field key (`_id`); two
bad keys at once (the error names both); a bad key inside `filter` beside `constraints`; and a
branching callback with a bad key in only ONE branch (this is what pins `ExcessFieldKeys`'
distribution — without it, `keyof (A | B)` silently drops the bad key).

Must be pinned as still typed, NOT implicit `any` — the regression `defineAccess`'s
`TPermissions` constraint exists to prevent (Step 1, config.ts):

```ts
// A callback with implicitly typed props must still resolve `user` and `data`.
// If `TPermissions` ever loses its constraint, these become `any` and every
// other case in this file keeps passing while the config surface goes untyped.
update: ({ user, data }) => ({
  "*": false,
  // @ts-expect-error `user.roles` is string[]; comparing to a number is an error
  price: user.roles === 1,
}),
```

Verify: `pnpm --filter @vexcms/core test access/`

### Step 3 — Write-path call sites: collections `[dev]`

Depends on Step 2. Each is one added argument — the enforcement itself lives in
`hasPermission` (DD 3), so there is no second call.

#### packages/core/src/api/create/server.ts

1 edit — add `changes` to the existing `hasPermission` call:

```ts
    hasPermission({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: args.data,
      // Nothing stored yet, so any denied key present is a violation (DD 9).
      changes: args.data,
      throwOnDenied: true,
    });
```

#### packages/core/src/api/update/server.ts

1 edit — `data` stays the STORED document (ADR-002, already fetched at line 78); `changes` is
the incoming patch (DD 4):

```ts
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
      changes: args.data,
    });
```

#### packages/core/src/api/create/server.test.ts and update/server.test.ts

Five cases each, reusing the `postsResource` / `withTransaction` fixtures both files already
declare in their `— access enforcement` sections: a create rejecting a denied key (asserting
`error.field`), a create regression with no map, an update that resends a denied field
UNCHANGED (the full-form-submit case, DD 9), an update that changes one, and an update whose
per-field expression is resolved against the STORED document rather than the patch (DD 4).

Bodies: **Appendix A**, `packages/core/src/api/create/server.test.ts and
packages/core/src/api/update/server.test.ts`.

Verify: `pnpm --filter @vexcms/core test api/create/server.test.ts api/update/server.test.ts`

### Step 4 — Write-path call site: globals `[dev]`

Depends on Step 2. A separate enforcement site from Step 3 (DD 12), and the one the www
scenario runs through.

#### packages/core/src/api/globals/upsert.server.ts

2 edits.

**1 — add `changes`.** The function already resolves `existingGlobal` before authorizing and
already passes `flattenGlobalRow(existingGlobal)` as the check's `data`. Hoist that flattened
document to a local so it is built once:

```ts
    const storedDoc = existingGlobal ? flattenGlobalRow(existingGlobal) : undefined;
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: storedDoc ?? userFields,
      // `userFields`, not `args.data`: system keys are already stripped at this
      // point, and they are not gateable (DD 6).
      changes: userFields,
    });
```

**2 — merge instead of replace.** Required by Step 7's diff submit, and a bug fix in its own
right. The write is currently `ctx.db.patch(existingGlobal._id, { data: result.data })`, which
replaces the whole `data` blob — so a payload carrying only the changed fields would DELETE
every field it omitted. `apps/www/convex/seed.ts:401-403` already works around this by hand
("`upsertGlobal` replaces the whole `data` blob rather than merging field by field, so
patching with only the seeded keys would silently drop `adminTheme` and every SEO field").

```ts
  if (existingGlobal) {
    await ctx.db.patch(existingGlobal._id as never, {
      // Merge, not replace: a partial payload patches the fields it names and
      // leaves the rest alone. Replacing also made a full-document submit from a
      // client holding a stale copy silently revert a concurrent edit.
      data: { ...(existingGlobal.data as Record<string, unknown>), ...result.data },
    } as never);
    return existingGlobal._id as string;
  }
```

Validation has to move with it: `getGlobalInputSchema` currently validates the payload as a
whole document, so a partial payload fails `required` checks on fields it omits. Validate the
MERGED result instead — build `{ ...stored, ...userFields }` first, then `safeParse` that, so
a partial write is still rejected when it would leave the global invalid. The `create` branch
is unchanged: there is nothing to merge with, so the payload must already be complete.

Tests for this edit, in the existing file:

```ts
it("merges a partial payload into the stored blob", async () => {
  // Seed `{ siteName: "Site", description: "d" }`, upsert `{ siteName: "New" }`
  // → stored row keeps `description`.
});

it("still rejects a partial payload that leaves the global invalid", async () => {
  // Validation runs on the merged document, not the patch.
});
```

#### packages/core/src/api/globals/upsert.server.test.ts

Add to the existing `upsertGlobal (server) — access` describe block, which already has the
`buildConfig`/`seed`/`storedName` helpers and the `Harness` type:

```ts
it("allows a save that changes only the permitted field", async () => {
  // `update: () => ({ "*": false, adminTheme: true })`; a full-document payload
  // changing only `adminTheme` must succeed. The exact www scenario.
});

it("rejects a save that changes a denied field", async () => {
  // Same config, payload changes `siteName` → VexAccessError with field "siteName".
});

it("leaves the stored row untouched when a field denial rejects the write", async () => {
  // No partial patch (DD 10).
});

it("authorizes the first save as create, so an update-only map cannot initialize", async () => {
  // No row; `update: () => ({ "*": false, adminTheme: true })` and `create: false` → denied.
});
```

Verify: `pnpm --filter @vexcms/core test api/globals/`

### Step 5 — Read-path shaping `[dev]`

Depends on Step 2. `hasPermission` already permits these reads (DD 3, case 2); this step
applies the projection.

#### packages/core/src/api/find/server.ts and search/server.ts

2 edits each. Add `resolveFieldPermissions, stripDeniedFields` to the existing `../../access`
import, then insert one mapping step between the existing `docs = ...filter((d) =>
hasPermission(...))` branches and the `effectivePopulate` computation:

```ts
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
```

`access`, `resource`, and `action` are already in scope from each function's existing
`resolveAccessCall`. The `totalDocs`/`allDocs` counting branches count documents rather than
shaping content — they are NOT stripped; only the returned `page`/array is.

#### packages/core/src/api/get/server.ts

1 edit. Change `const doc = await args.ctx.db.get(args.id)` to `let doc` (reassigned below),
then insert after the existing `hasPermission({ throwOnDenied: true, ... })` call, still inside
`if (doc && args.config?.access !== undefined)`:

```ts
    doc = stripDeniedFields(doc, resolveFieldPermissions({
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc,
    }));
```

#### packages/core/src/api/globals/get.server.ts and find.server.ts

1 edit each, same shape. Both already build the flat document through `flattenGlobalRow`
(`./utils`), which is what gets stripped. `find.server.ts` resolves `access`/`action` per row
inside its existing filter callback (each row is a different subject), so the map step resolves
the same way rather than hoisting:

```ts
    rows = rows.map((doc) =>
      stripDeniedFields(
        doc,
        resolveFieldPermissions({
          access,
          user: args.auth?.user ?? null,
          organization: args.auth?.organization,
          resource: doc._slug as string,
          action: CRUD_ACTIONS.read,
          data: doc,
        }),
      ),
    );
```

#### Read-path tests

In `find/get/search/server.test.ts` and `globals/{get,find}.server.test.ts`, adapted to each
file's existing fixtures:

Five cases per file: strips a field denied by the read action; returns documents unchanged
when the action declares no map (regression); never strips `_id`/`_creationTime`/`_slug`;
strips per document when the map's value is an expression over the document (two seeded rows —
the draft keeps the field, the published one loses it); and does NOT deny the read, which pins
DD 3 case 2 end to end.

Bodies: **Appendix A**, one subsection per file (`find`, `get`, `search`, `globals/get`,
`globals/find`). The two globals files have no `access` fixture today, so they adopt
`upsert.server.test.ts`'s hand-rolled `buildConfig` shape rather than inventing a third.

Verify: `pnpm --filter @vexcms/core test api/` and `pnpm --filter @vexcms/react test views/`

#### packages/react/src/components/views/CollectionListView.tsx and MediaCollectionListView.tsx

1 edit each. Stripping alone leaves a denied field looking broken rather than absent.

Columns are built from the CONFIG, not from the rows: `getCollectionColumnDefs` iterates
`Object.entries(collection.fields)` (`components/fields/index.tsx:219`). Read-stripping removes
keys from the documents, so it cannot remove a column. The result is not a crash — every one
of the twelve cell components guards its value (`DateFieldCell` returns `—` on
`undefined`/`null`; `RelationshipFieldCell` returns `—` on `!rawValue`; the rest do the same) —
but the column renders as a full row of em-dashes, which advertises a field the caller may not
read and reads as a bug.

So filter the column defs by the caller's read field permissions:

```ts
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.read,
    // Deliberately no `data`: a column is shown or hidden for the whole table,
    // so the question is "is this field denied for EVERY document", not "for
    // this one". `scope: "any"` answers exactly that — see below.
    scope: PERMISSION_SCOPES.any,
  });

  const columns = useMemo(
    () =>
      getCollectionColumnDefs({ collection }).filter((column) => {
        const key = columnFieldKey(column);
        return key === undefined || isFieldAllowed(fieldPermissions, key);
      }),
    [collection, fieldPermissions],
  );
```

`scope: PERMISSION_SCOPES.any` is the load-bearing part, and it is why
`resolveFieldPermissions` takes an optional `scope` (Step 2). A static map
(`() => ({ "*": false, price: true })`) has no data dependency, so it resolves exactly either
way and the column is hidden precisely when the field is denied. A map whose values are
expressions over the document is per-row, and a column cannot be per-row: `any` keeps the
column visible and lets the already-stripped rows show `—` in the cells where the field was
denied. Under the default `all` those columns would vanish for everyone, which is the
over-hiding failure.

`columnFieldKey` is a small local helper: TanStack's `ColumnDef` carries the field name as
`accessorKey` (or `id` for the select/actions columns, which have no field and must never be
filtered). Returning `undefined` for a column with no field name is what keeps the row-select
and row-actions columns in place.

Tests, in the existing view tests:

```tsx
/**
 * `posts` declares `title` and `price`; `viewer` may read the collection but
 * its `read` filter denies `price`. `plain` declares no map at all.
 */
const access = defineAccess({
  roles: ["viewer", "plain"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    viewer: { posts: { read: () => ({ "*": true, price: false }) } },
    plain: { posts: { read: true } },
  },
});

/** Field-backed column ids, dropping the select/actions columns. */
function fieldColumnIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("thead th"))
    .map((th) => th.getAttribute("data-column-id"))
    .filter((id): id is string => id !== null);
}

it("hides a column for a field denied by the read action", () => {
  const { container } = render(<CollectionListView collection={posts} initialData={rows} />, {
    wrapper: Providers(access, { user: asUser("viewer") }),
  });

  expect(fieldColumnIds(container)).toContain("title");
  expect(fieldColumnIds(container)).not.toContain("price");
});

it("keeps every column when the read action declares no map", () => {
  const { container } = render(<CollectionListView collection={posts} initialData={rows} />, {
    wrapper: Providers(access, { user: asUser("plain") }),
  });

  expect(fieldColumnIds(container)).toEqual(expect.arrayContaining(["title", "price"]));
});

it("keeps the row-select and actions columns, which have no field key", () => {
  // `columnFieldKey` returns undefined for these, so the filter must pass them
  // through — otherwise bulk delete and row navigation disappear.
  const { container } = render(<CollectionListView collection={posts} initialData={rows} />, {
    wrapper: Providers(access, { user: asUser("viewer") }),
  });

  expect(container.querySelector('thead th[data-column-id="select"]')).not.toBeNull();
});

it("keeps a column whose denial is per document, so cells show the placeholder", () => {
  // `scope: "any"` is what makes this pass: the map's value is an expression
  // over the document, so it cannot be answered for the whole table and the
  // column must stay. Under the default `all` it would vanish for everyone.
  const perDocAccess = defineAccess({
    roles: ["viewer"] as const,
    resources: [posts],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      viewer: {
        posts: {
          read: ({ data }: { data?: { title?: string } }) => ({
            "*": true,
            price: data?.title === "Draft",
          }),
        },
      },
    },
  });

  const { container } = render(<CollectionListView collection={posts} initialData={rows} />, {
    wrapper: Providers(perDocAccess, { user: asUser("viewer") }),
  });

  expect(fieldColumnIds(container)).toContain("price");
});
```

`data-column-id` is how the existing `DataTable` header cells identify themselves; if the
component does not emit it yet, assert on header text instead rather than adding an attribute
purely for tests.

### Step 6 — Quantified call sites `[dev]`

Depends on Step 2. Found by auditing every existing `hasPermission`/`usePermission` call
against DD 3, and it is the step most likely to be skipped and then debugged as a mystery.

DD 3 case 3 makes a previously invisible distinction load-bearing: a call that supplies
neither `data` nor `changes` is asking a *quantified* question, and under the default
`scope: "all"` a field map denies it. Every call site below asks "may they do this **at
all**?" while spelling it as "may they do this to everything", so each one silently flips to
denied the first time someone adds a field map — without the map author touching any of this
code. All of them fail CLOSED, so none is a security hole; they are false negatives, and the
symptom (a button vanishing, an upload 403ing) is a long way from the cause.

Two are server-side and deny a legitimate operation outright:

- **`packages/core/src/media/api/mutations.ts`** — `generateUploadUrl` (line 45) and
  `createMediaDocument` (line 94) both authorize `create` with neither `data` nor `changes`.
  A `create` map on a media collection therefore denies every upload. `generateUploadUrl`
  writes no document at all, so it takes `scope: PERMISSION_SCOPES.any` — it is asking whether
  the caller may create here in principle. `createMediaDocument` DOES write fields (`alt`,
  `filename`, `mimeType`, `size`, `adapterFields`), so it takes `changes` built from exactly
  those, making it a real enforcement site like `create()`.
- **`packages/next/src/cache/createVexRevalidateRoute.ts`** (line 139) — authorizes the CRUD
  verb behind a cache purge, again with neither. An `update` map would 403 every revalidation.
  A purge writes no fields, so this takes `scope: PERMISSION_SCOPES.any`.

Three are admin-panel gates that hide or disable a control:

- **`CollectionListView.tsx:95`** and **`MediaCollectionListView.tsx:110`** — `canCreate`
  with no `data` and no `scope`. A `create` map hides the **New** button even though creating
  is permitted. Both take `scope: PERMISSION_SCOPES.any`.
- **`RevalidateButton.tsx:49`** — `update` with no `data` and no `scope`. An `update` map
  disables the button. Takes `scope: PERMISSION_SCOPES.any`.

Already correct, listed so the audit is reproducible rather than repeated:
`AdminSidebar.tsx:75,82,89` (`read` + `scope: any`), `CollectionListView.tsx:96` and
`MediaCollectionListView.tsx:112` (`canDelete` + `scope: any`), and the three edit views,
which all pass `data` and so take DD 3 case 2.

`remove()` (`api/remove/server.ts:85`) passes `data: doc` and no `changes`, so it lands on
case 2 and is unaffected — consistent with `remove` being out of scope, since a delete has no
fields to authorize.

Tests: one case per changed call site asserting the operation still succeeds for a role whose
relevant action returns a field map. Put the two server ones beside the existing media and
revalidate-route tests; the three UI ones in the existing view tests.

Verify: `pnpm --filter @vexcms/core test media/`, `pnpm --filter @vexcms/next test cache/`,
and `pnpm --filter @vexcms/react test`

### Step 7 — Admin panel: field gating and diff submit `[dev]`

Depends on Step 2 and on Step 4's merge change. Gating is advisory (P-004, DD 14); the diff
submit is an independent improvement that this feature makes worth doing now.

#### packages/react/src/hooks/useFieldPermissions.ts

New file.

```ts
"use client";

import { resolveFieldPermissions } from "@vexcms/core";
import type { ResolvedFieldPermissions } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Which fields the current caller may touch — client-side, advisory, no server
 * round trip (the server API remains the enforcement point). Mirrors
 * `usePermission`, which answers the document-level question against the same
 * bundle-imported config.
 *
 * @param props.resource - Subject name (collection or global slug).
 * @param props.action - Action on `resource` (`"update"` for an edit form).
 * @param props.data - The loaded document, forwarded to the filter callback.
 * @returns The merged decision. Read a single field with `isFieldAllowed`.
 */
export function useFieldPermissions(props: {
  resource: string;
  action: string;
  data?: Record<string, unknown>;
}): ResolvedFieldPermissions {
  const access = useVexAccess();
  const { user, organization } = useVexAuth();
  return resolveFieldPermissions({ access, user, organization, ...props });
}
```

#### packages/react/src/hooks/index.ts

1 edit — three export lines beside the existing `usePermission` export:

```ts
export * from "./useFieldPermissions";
export * from "./useLiveFieldMerge";
export * from "./changedValues";
```

#### CollectionEditView.tsx, GlobalEditView.tsx, MediaCollectionEditView.tsx

1 edit each, identical shape. After the existing `canEdit` resolution
(`CollectionEditView.tsx:90-94`, `GlobalEditView.tsx:59-63`,
`MediaCollectionEditView.tsx:118-121`), add the hook and fold its answer into the input's
existing `readOnly` prop (`CollectionEditView.tsx:137`-ish, `GlobalEditView.tsx:109`,
`MediaCollectionEditView.tsx`'s equivalent):

```ts
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug, // `global.slug` in GlobalEditView
    action: CRUD_ACTIONS.update,
    data: currentDocument as Record<string, unknown>, // `globalDoc` / `data` respectively
  });
```

```tsx
              readOnly={
                !canEdit || field.admin.readOnly || !isFieldAllowed(fieldPermissions, fieldKey)
              }
```

Add `useFieldPermissions` to each file's existing `../../hooks` import and `isFieldAllowed` to
its existing `@vexcms/core` import. All three, not one: `GlobalEditView` is the view the www
scenario uses, and `MediaCollectionEditView` is a third copy of the same gate — editing only
`CollectionEditView` would leave every Site Settings and media input live.

Note that **Save** stays enabled: `usePermission` passes no `changes`, so a map projects rather
than denies (DD 3, case 2). That is the intended behavior — the user can save the fields they
are allowed to change.

#### Diff submit — the three edit views' `onSubmit`

All three views currently send the entire form (`data: value`). Switch edit mode to sending
only the fields the user actually changed. This is not a security mechanism — the server never
trusts it (see below) — it is a payload and correctness improvement that the merge change in
Step 4 makes safe.

TanStack Form 1.33 tracks what is needed per field, but **which** flag matters, and the
obvious one is wrong. Two flags exist on `fieldMeta[name]`
(`@tanstack/form-core/dist/esm/types.d.ts:244-254`):

- `isDefaultValue` is DERIVED: `evaluate(currentValue, options.defaultValues[name])`
  (`FormApi.js:977-980`). And `options.defaultValues` is the loaded document, refreshed on
  every render — `FormApi.update` assigns `this.options = options` unconditionally
  (`FormApi.js:92-93`) *before* deciding whether to adopt the new values.
- `isDirty` is a STICKY base-meta flag, set only when the value is actually changed through
  `setFieldValue` without `dontUpdateMeta` (`FormApi.js:651-655`) — i.e. by a real edit.

So `isDefaultValue` must NOT drive the diff. Concretely: A loads a document, never touches
`name`; B changes `name`; the subscription moves `defaultValues.name` to B's value while the
form's value stays at A's; `isDefaultValue` for `name` flips to `false`, and a diff built from
it would send A's stale `name` back — **re-introducing exactly the clobber the diff submit
exists to prevent**. `isDirty` cannot do that: it is false until the user edits the field.

Both utilities below therefore share one primitive, and `group` fields are the reason it is
not a one-liner: a group registers nested paths (`light.background`), so `fieldMeta["light"]`
may not exist even when the user has edited inside it.

```ts
/**
 * Whether the user has edited anything under a top-level field key.
 *
 * `isDirty`, never `isDefaultValue`: the latter compares against
 * `defaultValues`, which tracks the live document, so it reports `true` for a
 * field the SERVER changed and the user never touched.
 *
 * Checks the key itself and any registered nested path beneath it, because a
 * `group` field's leaves register as `light.background` and the parent key
 * carries no meta of its own.
 */
export function isFieldKeyDirty(form: AnyFormApi, key: string): boolean {
  const fieldMeta = form.state.fieldMeta;
  if (fieldMeta[key]?.isDirty === true) return true;

  const prefix = `${key}.`;
  return Object.keys(fieldMeta).some(
    (metaKey) => metaKey.startsWith(prefix) && fieldMeta[metaKey]?.isDirty === true,
  );
}

/**
 * The subset of `form.state.values` the user actually edited.
 *
 * Never a security boundary: the server re-derives the effective change set
 * against the stored document (DD 9), so a client that sends everything, or
 * lies, is handled identically.
 *
 * @returns Only edited top-level keys. Empty when nothing was edited.
 */
export function changedValues(form: AnyFormApi): Record<string, unknown> {
  const values = form.state.values as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(values)) {
    if (isFieldKeyDirty(form, key)) {
      result[key] = values[key];
    }
  }
  return result;
}
```

Then each view's `onSubmit` sends `changedValues(form)` in place of `value`, and skips the
mutation entirely when the result is empty.

Two constraints the implementation must respect:

- **Edit mode only.** In create mode `defaultValues` are the collection's field defaults, so
  an untouched field is not dirty and would be omitted — meaning declared defaults never get
  persisted. `create()` keeps sending the full validated payload.
- **`useVexMutation`'s revalidation still needs the whole document.**
  `CollectionEditView.tsx:71-73` computes `getChanges` as
  `{ after: { ...currentDocument, ...args.data }, before: currentDocument }`, which already
  merges — so it keeps producing correct revalidation targets from a partial `args.data`. Do
  not "simplify" it to `args.data`.

Side effect worth naming, because it is a bug fix and not just a payload win. Two editors on
the same document today: A opens it, B saves a change, A saves. A's form submits every field
from the copy A loaded, and `update()` ends in `ctx.db.patch(args.id, data)` — a shallow merge
of the keys it is given — so **every** field B changed is silently reverted to A's stale
value. Globals are worse: `upsertGlobal` replaces the whole blob.

With a diff submit (plus Step 4's merge), A's save patches only the fields A actually edited,
so B's changes to other fields survive. Same-field edits remain last-write-wins with no
warning; the review-and-resolve UX for that is a separate spec (Step 9's backlog entry).

#### packages/react/src/hooks/useLiveFieldMerge.ts

New file. The other half of the same problem: the diff submit stops A's *save* from reverting
B, and this stops A's *view* from going stale.

`FormApi.update` adopts new `defaultValues` only when `!state.isTouched`
(`FormApi.js:94`), and `isTouched` aggregates across every field (`FormApi.js:1031`). So one
keystroke anywhere freezes the entire form: from then on A sees their own stale copy of every
field, including ones they never touched and B has since changed. The fix is to do per field
what TanStack declines to do form-wide.

```ts
"use client";

import { useEffect } from "react";
import { CONSTRAINT_COMPARATORS } from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { isFieldKeyDirty } from "./changedValues";

/**
 * Keeps untouched fields in sync with the live document while leaving the
 * user's unsaved edits alone.
 *
 * `FormApi.update` refuses to adopt new `defaultValues` once ANY field is
 * touched (`FormApi.js:94`, aggregated at `:1031`), which is the right default
 * — it will not clobber a form someone is typing into — but it is all-or-
 * nothing. This narrows it to per field: a field the user has not edited
 * follows the server; a field they have edited is theirs until they save or
 * reset.
 *
 * Writes through `dontUpdateMeta: true` (`FormApi.js:647-660`) so an adopted
 * value does NOT mark the field touched or dirty. That matters twice: the
 * field stays eligible for future merges, and `changedValues` keeps excluding
 * it, so adopting B's value can never cause A to write it back.
 *
 * The adopted value also BECOMES the field's new default, with no extra work,
 * and that is worth understanding rather than assuming. `useCollectionForm` /
 * `useGlobalForm` rebuild `defaultValues` from the live document on every
 * render (`useCollectionForm.ts:66`, `useGlobalForm.ts:42`), and
 * `FormApi.update` assigns `this.options = options` UNCONDITIONALLY
 * (`FormApi.js:92-93`) — before the `isTouched` gate that decides whether to
 * adopt new VALUES. So the form's defaults always track the server even when
 * its values are frozen. Once this hook adopts the incoming value, that field
 * satisfies `evaluate(value, defaultValues[key])` and reports
 * `isDefaultValue: true` (`FormApi.js:977-980`) alongside `isDirty: false`:
 * fully clean, at the live value, indistinguishable from a fresh load.
 *
 * Two consequences follow from that, both wanted:
 * - **Cancel** (`form.reset()`) returns to the live document, not to whatever
 *   was on screen when the view mounted.
 * - **Save stops enabling itself spuriously.** Both edit views gate Save on
 *   `state.isDefaultValue` (`CollectionEditView.tsx:105`,
 *   `GlobalEditView.tsx:71`). Because defaults move while values freeze, a
 *   server-side change to an untouched field currently flips that aggregate to
 *   `false` and enables Save for an editor who changed nothing — and saving
 *   then writes their stale copy back. Adopting the value restores the
 *   aggregate to `true`.
 *
 * Comparison is `CONSTRAINT_COMPARATORS.eq` — the same content equality the
 * server uses for `deniedFieldIn` (DD 9) — because `relationship` and
 * `select` store arrays, where `===` would report a change on every render.
 *
 * @param props.form - The edit view's form instance.
 * @param props.document - The live document from the Convex subscription.
 * @param props.fieldKeys - Top-level field names, from the collection/global
 *   config. Iterating the config rather than the document keeps the merge at
 *   the same granularity as the field map and the `readOnly` gate.
 */
export function useLiveFieldMerge(props: {
  form: AnyFormApi;
  document: Record<string, unknown> | null | undefined;
  fieldKeys: readonly string[];
}): void {
  const { form, document, fieldKeys } = props;

  useEffect(() => {
    if (!document) return;

    for (const key of fieldKeys) {
      // The user owns this field until they save or reset — never overwrite an
      // in-progress edit, even one that reverts to the original value.
      if (isFieldKeyDirty(form, key)) continue;

      // Nothing to adopt — never write `undefined` over a field default.
      if (!Object.prototype.hasOwnProperty.call(document, key)) continue;

      const incoming = document[key];
      if (CONSTRAINT_COMPARATORS.eq(form.getFieldValue(key), incoming)) continue;

      form.setFieldValue(key, incoming, { dontUpdateMeta: true });
    }
    // `form`/`fieldKeys` are intentionally omitted: the same form instance and
    // the same config-derived key list persist for the life of the edit view,
    // and the guard above is idempotent, so re-running only on `document`
    // never misses a merge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document]);
}
```

Wire it into all three edit views beside the existing `useFieldPermissions` call, passing
`Object.keys(props.collection.fields)` (or `global.fields`) as `fieldKeys` and the live query
result as `document`. In `CollectionEditView` and `MediaCollectionEditView` that result is
already a Convex subscription (`useQuery(convexQuery(vexConvexApi.get, …))`); confirm
`GlobalEditView`'s `globalDoc` is subscribed the same way rather than SSR-only, and make it so
if it is not — the merge is inert without a live source.

Tests: `packages/react/src/hooks/useLiveFieldMerge.test.tsx`, new file.

```tsx
import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { changedValues, isFieldKeyDirty } from "./changedValues";
import { useLiveFieldMerge } from "./useLiveFieldMerge";
import type { AnyFormApi } from "../components/form/AppFormContext";

type Doc = { name: string; price: number; tags: string[]; light: { background: string } };

const FIELD_KEYS = ["name", "price", "tags", "light"] as const;

function baseDocument(): Doc {
  return { name: "Widget", price: 10, tags: ["red", "blue"], light: { background: "white" } };
}

/**
 * Mounts a form the way an edit view does — one `form.Field` per top-level key
 * plus the nested `light.background` leaf a `group` registers — so TanStack
 * seeds real `fieldMetaBase` entries, which is the shape
 * `isFieldKeyDirty`/`changedValues` read. An untouched, UNMOUNTED field has no
 * meta entry at all, so a harness that skips this would test nothing.
 * `formRef` mirrors `nestedFieldContainer.ts`'s existing convention.
 */
function renderMergeHarness(initialDocument: Doc) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };

  function Harness({ document }: { document: Doc }) {
    const form = useForm({ defaultValues: document });
    formRef.current = form as AnyFormApi;
    useLiveFieldMerge({ form: form as AnyFormApi, document, fieldKeys: FIELD_KEYS });
    return (
      <>
        <form.Field name="name">{() => null}</form.Field>
        <form.Field name="price">{() => null}</form.Field>
        <form.Field name="tags">{() => null}</form.Field>
        <form.Field name="light.background">{() => null}</form.Field>
      </>
    );
  }

  const view = render(<Harness document={initialDocument} />);
  return {
    formRef,
    setDocument: (document: Doc) => {
      act(() => {
        view.rerender(<Harness document={document} />);
      });
    },
  };
}

/**
 * Forces the form-wide freeze a real edit anywhere produces (`state.isTouched`
 * aggregates across every registered field) WITHOUT changing a value, so each
 * test proves the per-field merge did the work. Without this, TanStack's own
 * untouched-form `defaultValues` sync would silently cover for a missing or
 * broken `useLiveFieldMerge`.
 */
function touchWithoutEditing(form: AnyFormApi, key: string): void {
  act(() => {
    form.setFieldValue(key, form.state.values[key]);
  });
}

describe("useLiveFieldMerge", () => {
  it("adopts a server change on an untouched field", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(formRef.current!.state.values.name).toBe("Renamed");
  });

  it("leaves an edited field alone when the server changes it", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 25); // a real, unsaved edit
    });

    setDocument({ ...initial, price: 999 }); // another editor's save, same field

    expect(formRef.current!.state.values.price).toBe(25);
  });

  it("adopts untouched fields while preserving an edit in another field", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 42);
    });

    setDocument({ ...initial, name: "Renamed", price: 999 });

    expect(formRef.current!.state.values.name).toBe("Renamed");
    expect(formRef.current!.state.values.price).toBe(42);
  });

  it("does not mark an adopted field dirty", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(isFieldKeyDirty(formRef.current!, "name")).toBe(false);
    expect(changedValues(formRef.current!)).not.toHaveProperty("name");
  });

  it("reports an adopted field as isDefaultValue, so it reads as a fresh load", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed" });

    expect(formRef.current!.getFieldMeta("name")?.isDefaultValue).toBe(true);
    expect(formRef.current!.getFieldMeta("name")?.isDirty).toBe(false);
  });

  it("keeps Save disabled when only untouched fields changed server-side", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");

    setDocument({ ...initial, name: "Renamed", tags: ["green"] });

    expect(formRef.current!.state.isDefaultValue).toBe(true);
  });

  it("resets to the live document, not the mount-time document", () => {
    const initial = baseDocument(); // price: 10
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("price", 42); // a real, unsaved edit
    });

    setDocument({ ...initial, name: "Renamed", price: 15 });

    act(() => {
      formRef.current!.reset();
    });

    // Not 10 (mount-time) and not 42 (the discarded edit) — the live value.
    expect(formRef.current!.state.values.price).toBe(15);
    expect(formRef.current!.state.values.name).toBe("Renamed");
  });

  it("treats a group field as edited when a nested leaf is edited", () => {
    const initial = baseDocument();
    const { formRef, setDocument } = renderMergeHarness(initial);
    act(() => {
      formRef.current!.setFieldValue("light.background", "black");
    });

    setDocument({ ...initial, light: { background: "purple" } });

    // `light` has no meta of its own; `isFieldKeyDirty` reads the registered
    // `light.background` leaf, so the merge does not clobber the edit.
    expect(isFieldKeyDirty(formRef.current!, "light")).toBe(true);
    expect(formRef.current!.state.values.light).toEqual({ background: "black" });
  });

  it("compares array-valued fields by content, not reference", () => {
    const initial = baseDocument(); // tags: ["red", "blue"]
    const { formRef, setDocument } = renderMergeHarness(initial);
    touchWithoutEditing(formRef.current!, "price");
    const before = formRef.current!.state.values.tags;

    // A new array instance with IDENTICAL content: `===` would report a change
    // every render for a `relationship`/`select` field; `eq` must not, so no
    // write happens and the reference is preserved.
    setDocument({ ...initial, tags: ["red", "blue"] });

    expect(formRef.current!.state.values.tags).toBe(before);
  });
});
```

What this does NOT change: the server. `update()` and `upsertGlobal` treat `args.data` as the
change set either way, and `deniedFieldIn` compares each key against the stored document
regardless (DD 9). So the field-permission feature behaves identically whether a project's
forms diff or send everything — which is why `changes` stays optional rather than becoming a
requirement on consumers.

Tests, in the existing view tests:

```tsx
it("submits only the changed field", async () => {
  const mutate = vi.fn().mockResolvedValue("doc1");
  const { formRef } = renderEditView({ document: { title: "a", price: 5 }, mutate });

  await act(async () => {
    formRef.current!.setFieldValue("title", "b");
    await formRef.current!.handleSubmit();
  });

  // `price` was never edited, so it is absent — this is what stops a save from
  // reverting another editor's change to it.
  expect(mutate.mock.calls[0]?.[0]?.data).toEqual({ title: "b" });
});

it("does not submit at all when nothing changed", async () => {
  const mutate = vi.fn();
  const { formRef } = renderEditView({ document: { title: "a", price: 5 }, mutate });

  await act(async () => {
    await formRef.current!.handleSubmit();
  });

  expect(mutate).not.toHaveBeenCalled();
});

it("submits the full payload in create mode, so field defaults persist", async () => {
  // `defaultValues` are the collection's field defaults here, so no field is
  // dirty — a diff would send `{}` and the declared defaults would never be
  // written. Create must keep sending everything.
  const mutate = vi.fn().mockResolvedValue("doc1");
  const { formRef } = renderEditView({ document: undefined, mutate });

  await act(async () => {
    formRef.current!.setFieldValue("title", "new");
    await formRef.current!.handleSubmit();
  });

  expect(mutate.mock.calls[0]?.[0]?.data).toMatchObject({ title: "new", price: expect.anything() });
});
```

`renderEditView` is a local harness in each view's existing test file: it renders the view with
a stubbed `useVexMutation` (`mutate`) and exposes the form through a `formRef`, the same
pattern `useLiveFieldMerge.test.tsx` uses.

#### packages/react/src/hooks/useFieldPermissions.test.tsx

New file. Mirror `usePermission.test.tsx`'s provider setup exactly (same
`VexAccessProvider`/`VexAuthContext` wrapping) — read that file first.

```tsx
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  defineAccess,
  defineCollection,
  isFieldAllowed,
  text,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { useFieldPermissions } from "./useFieldPermissions";
import { usePermission } from "./usePermission";
import { VexAccessProvider } from "../context/VexAccessContext";
import { VexAuthProvider } from "../context/VexAuthContext";

// `useFieldPermissions`'s `resource`/`action` are plain `string` (no
// subject-keyed generic to narrow), so no `as never` is needed on its calls —
// only on the `usePermission` call below, which does carry that generic
// against the unaugmented registry. Same note as `usePermission.test.tsx`.

const posts = defineCollection({
  slug: "posts",
  fields: { title: text(), price: text() },
});

/**
 * One shared config, one role per scenario. `editor` allow-lists `title` and
 * denies `price`; `wildcardTrue` resolves the action to plain `true`, which
 * must beat any per-field map (DD 8).
 */
const access = defineAccess({
  roles: ["editor", "wildcardTrue"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { update: () => ({ title: true, price: false }) } },
    wildcardTrue: { posts: { update: true } },
  },
});

const asUser = (role: string, _id = "u1"): Record<string, unknown> => ({ _id, roles: role });

/** Wraps a hook render in the real `VexAccessProvider`/`VexAuthProvider` pair. */
function Providers(accessConfig: VexAccessConfig | undefined, auth: VexApiAuth) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VexAccessProvider access={accessConfig}>
        <VexAuthProvider value={auth}>{children}</VexAuthProvider>
      </VexAccessProvider>
    );
  };
}

describe("useFieldPermissions", () => {
  it("resolves a denied field to false", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(isFieldAllowed(result.current, "price")).toBe(false);
  });

  it("resolves an allow-listed field to true", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(isFieldAllowed(result.current, "title")).toBe(true);
  });

  it("is unrestricted when RBAC is off", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(undefined, { user: null }) },
    );
    expect(result.current).toEqual({ wildcard: true, fields: {} });
  });

  it("is unrestricted for a role whose action check is a plain true", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("wildcardTrue") }) },
    );
    expect(result.current).toEqual({ wildcard: true, fields: {} });
  });
});

describe("usePermission — with a field map", () => {
  it("still answers true, so Save stays enabled", () => {
    // The edit views' own call shape: no `changes`, so a map PROJECTS rather
    // than denies (DD 3, case 2) and Save stays enabled even though `editor`
    // restricts `price`.
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", data: {} } as never),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(result.current).toBe(true);
  });
});
```

Verify: `pnpm --filter @vexcms/react test usePermission.test.tsx useFieldPermissions.test.tsx`

### Step 8 — `apps/www`: anonymous theme selection `[dev]`

Depends on Steps 2, 4, and 7. The acceptance scenario from the Preview.

#### apps/www/src/auth/access.ts

1 edit — the `user` role's `siteSettings` entry:

```ts
      siteSettings: {
        "*": false,
        read: true,
        update: () => ({ "*": false, adminTheme: true }),
      },
```

Update the file's header docstring: the `user` role is no longer read-only. It may set
`siteSettings.adminTheme` and nothing else.

`create` stays denied by `"*": false`: the `siteSettings` row is seeded
(`apps/www/convex/seed.ts:419`), so the anonymous path is always an `update`, and an anonymous
caller must not be able to initialize the global on a fresh deployment.

#### apps/www/src/auth/hasPermission.ts and apps/test/src/auth/hasPermission.ts

1 edit each, identical — add `"changes"` to the `Omit` that already hides `access`,
`organization`, and `user` (line 29 in both files):

```ts
  props: Omit<
    HasPermissionProps<Subjects, TSubject, TData>,
    "access" | "organization" | "user" | "changes"
  >,
```

These wrappers are `"use client"` and documented "advisory — server guards enforce" (DD 4).
A client-side check must not accept the parameter that authorizes a write: it cannot be
trusted, and offering it would imply otherwise. Add a line to each docstring saying field
maps are resolved for UI gating via `useFieldPermissions` and enforced on the server.

Verify manually — this is the end-to-end gate the whole spec exists for:

1. `pnpm --filter www dev`, then open `/admin` via **Try the demo** (`AdminDemoButton`) in a
   fresh incognito session, so the caller has no `roles`.
2. Site Settings → every input inert except **Admin Theme**; **Save** enabled.
3. Pick a different theme, save → succeeds, admin panel repaints, public site unchanged
   (`activeTheme` untouched).
4. Public pages still render their title and meta description — `read` is unrestricted.
5. From the browser console, call `globals.upsert` directly with a changed `name` → rejected
   with `ACCESS_DENIED` naming `field: "name"`.

### Step 9 — Documentation `[dev]`

Nothing downstream depends on docs text; last step.

#### apps/docs/src/content/docs/guides/access-control.mdx

Add a "Field-level permissions" section covering: a filter callback returning a field map
rather than a boolean, and the three forms an action check can take (boolean, bare filter
callback, `{ constraints, filter }`); why a map is never written directly on an action (field
names would collide with `constraints`/`filter`) and why its values are plain booleans; the
wildcard-or-exhaustive rule with both polarities and why the allow-list one is preferred; how
`hasPermission` answers with a map in play — the `changes`/`data`/neither table from the
Preview, including that a read is shaped rather than refused; that maps are per action, so
restricting `update` leaves `read` alone; changed-value write semantics and the
`VexAccessError` shape including `field`; `useFieldPermissions` for admin gating; the
runtime-only boundary ("enforced in
the generated Convex functions and the admin-panel bundle; a hand-rolled Convex function
calling `ctx.db` directly bypasses this the same way it already bypasses `hasPermission()`");
and the deferred type-narrowing gap. Use the `apps/www` `adminTheme` case as the worked
example.

#### packages/core/README.md

Replace the stale field-level-permissions example at lines 129-145, which still documents the
removed `{ mode, fields }` shape, with the map form, cross-referencing the guide.

#### .agent/docs/product/backlog.md

Add two entries:
- Generic type-narrowing on `find`/`get`/`create`/`update` server-API signatures, so a caller
  who knows a field is restricted for the current role can narrow the return/arg type
  themselves (caller-asserted, since the server cannot statically know per-request role) —
  deferred by DD 15.
- Field-map key checking for untyped consumers. `ValidateFieldMaps` covers every TypeScript
  config; a plain-JS `vex.config.js` or a matrix assembled at runtime only gets the dev-mode
  `console.warn`. Promoting that to a hard `VexAccessConfigError` would need a decision about
  dynamic/legacy document fields, which a warning currently sidesteps.
- When versioning/drafts lands, its write paths (`saveDraft`, `publish`, `unpublish`) must
  pass `changes` the way `create`/`update`/`upsertGlobal` do, or field maps will not be
  enforced on a draft save. Nothing to do in this spec — those actions exist in
  `DRAFT_ACTIONS` but have no write path yet.
- **Concurrent-edit conflict resolution UX.** One future spec, scoped strictly to fields with
  OUTSTANDING UNSAVED EDITS. Step 7 already handles every other field: an untouched field
  whose value changes elsewhere is adopted silently and becomes the new default, so the editor
  simply sees it update. No icon, no banner, no prompt — nothing to resolve, because there is
  no competing version. What is left is the genuinely ambiguous case, a field the editor has
  edited AND someone else has changed:
  1. **Per-field conflict affordance.** When the live document changes a field the editor has
     unsaved edits in, mark that field with an info/notice icon and let them switch between
     the two versions — keep mine, or take the live one and re-apply their edit on top. Both
     values are already available: the editor's is `form.state.values[key]`, the live one is
     `options.defaultValues[key]`, which tracks the server (`FormApi.js:92-93`). The
     detection predicate is the inverse of `useLiveFieldMerge`'s skip condition — a field
     that is dirty AND whose live value moved is exactly a conflicted field, so the two
     should share one helper rather than deriving it twice.
  2. **Review-before-save banner.** While any field is conflicted, show a document-level
     banner and block **Save** until each one is resolved. Resolution is per field, so the
     banner needs a count and ideally jump-to-field.
  3. **Optimistic-concurrency guard**, to close the window the UI cannot: two editors
     resolving simultaneously still ends in last-write-wins. A compare-and-swap is feasible
     for collections, which already carry an auto-maintained `updatedAt` (`defineCollection`
     injects it, `create`/`update` stamp it), and would need a new field for globals, which
     deliberately have none (`upsert.server.ts` docstring). Rejecting a stale write turns the
     race into a retry the banner can drive.

Verify: manual read-through; no build/test gate.

## Appendix A — Server-side test bodies

Complete bodies for every test the steps above name, kept here rather than inline so each
step stays readable as a plan. Each subsection is one file; reuse the existing fixtures it
names rather than introducing a second convention.

Each section is additive to the named file. Fixtures already in the file are reused verbatim;
where a fixture needs a small extension (an extra optional field, an extra import), that is
called out in prose immediately before the code.

### packages/core/src/access/hasPermission.test.ts

Add `vi` to the existing `vitest` import (needed for the `delete` warning spy):

```ts
import { describe, expect, it, vi } from "vitest";
```

Insert the fixture and describe block below after the existing
`describe("hasPermission — custom actions", ...)` block. It reuses `articles`, `users`,
`asUser`, `PERMISSION_SCOPES`, and `VexAccessError`, all already defined/imported in this file.
Field names (`adminTheme`, `activeTheme`, `name`, `price`) are not declared on `articles`'
`fields` object — consistent with every other fixture in this file (e.g. `ownerId` on
`capabilityAccess`), since core tests run against the wide, unaugmented registry (see the note
at the top of the file) and field maps degrade `FieldPermissionKey<TData>` to `string` the same
way.

```ts
/**
 * Field-map fixture (DD 3): the same action check now resolves either a
 * boolean or a per-field map, and `hasPermission`'s answer depends entirely
 * on what the caller tells it about the operation — `changes`, `data`, or
 * neither. Named after the spec's own `siteSettings` scenario: `adminTheme`
 * is the one permitted field, `activeTheme` a denied array-valued one (so
 * content- vs reference-equality is exercised), `name` a plain denied string
 * field, and `price` a field only the `finance` role grants.
 */
const fieldMapAccess = defineAccess({
  roles: ["editor", "viewer", "finance"] as const,
  resources: [articles, users],
  customActions: {
    articles: { query: ["listFeatured"], mutation: ["publish"] },
  },
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: {
      articles: {
        read: () => ({ "*": false, adminTheme: true }),
        update: () => ({ "*": false, adminTheme: true }),
        delete: () => ({ "*": false, adminTheme: true }),
        publish: () => ({ "*": false, adminTheme: true }),
        listFeatured: () => ({ "*": false, adminTheme: true }),
      },
    },
    viewer: {
      articles: { update: () => ({ "*": false }) },
    },
    finance: {
      articles: { update: () => ({ "*": false, price: true }) },
    },
  },
});

/** Stored document for the fixture above — mirrors the spec preview exactly. */
const storedDoc = { name: "Site", adminTheme: ["t1"], activeTheme: ["t9"] };

describe("hasPermission — field maps", () => {
  it("permits a write that changes only a permitted field", () => {
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { adminTheme: ["t2"] },
      }),
    ).toBe(true);
  });

  it("permits a write that resends denied fields UNCHANGED", () => {
    // The full-form-submit case (DD 9): every field is present in `changes`,
    // but only `adminTheme`'s value actually differs from `storedDoc`.
    // Presence-based rejection would fail this.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { name: "Site", activeTheme: ["t9"], adminTheme: ["t2"] },
      }),
    ).toBe(true);
  });

  it("compares array values by content, not reference", () => {
    // A brand-new array instance with the same content as stored
    // `activeTheme` — `===` would report a change; content equality must not.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { activeTheme: ["t9"] },
      }),
    ).toBe(true);
  });

  it("denies a write that changes a denied field", () => {
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { name: "Defaced" },
      }),
    ).toBe(false);
  });

  it("throws naming the denied field under throwOnDenied", () => {
    let caught: unknown;
    try {
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { name: "Defaced" },
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    const error = caught as VexAccessError;
    expect(error.field).toBe("name");
    expect(error.data.field).toBe("name");
  });

  it("denies any denied key present when there is no stored document", () => {
    // create: no `data`, so any denied key present is a violation (DD 9) —
    // there is nothing to diff `changes` against.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        changes: { name: "New" },
      }),
    ).toBe(false);
  });

  it("permits a read — a map projects, it does not deny", () => {
    // `data` supplied, no `changes` → true, even though `name` is denied.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "read",
        data: storedDoc,
      }),
    ).toBe(true);
  });

  it("denies under the default scope when neither data nor changes is given", () => {
    // A map means not every field is permitted (DD 3) — mirrors the spec
    // preview's own `resource: "posts", action: "update"` example exactly.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
      }),
    ).toBe(false);
  });

  it("permits under scope 'any' when neither is given", () => {
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        scope: PERMISSION_SCOPES.any,
      }),
    ).toBe(true);
  });

  it("throws the needs-context error under scope 'doc'", () => {
    let caught: unknown;
    try {
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        scope: PERMISSION_SCOPES.doc,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    const message = (caught as Error).message;
    expect(message).toMatch(/"changes"/);
    expect(message).toMatch(/"data"/);
  });

  it("throws when a payload-bearing write resolves a map but omits `changes`", () => {
    // `data` supplied (a stored doc IS available), but no `changes` — the
    // fail-open DD 3 closes: this must NOT silently resolve via the
    // projecting (read) case.
    expect(() =>
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
      }),
    ).toThrow(VexAccessError);
    expect(() =>
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
      }),
    ).toThrow(/"changes"/);
  });

  it("throws the same way for a custom mutation action", () => {
    // `publish` is declared under `customActions.articles.mutation` — the
    // same classification `resolveAccessCall` already uses.
    expect(() =>
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "publish",
        data: storedDoc,
      }),
    ).toThrow(VexAccessError);
  });

  it("does NOT throw for a custom QUERY action that omits `changes`", () => {
    // `listFeatured` is declared under `customActions.articles.query` — not a
    // payload-bearing write, so it projects like any other read.
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "listFeatured",
        data: storedDoc,
      }),
    ).toBe(true);
  });

  it("ignores a map on `delete` and warns in dev", () => {
    // A delete has no payload, so `remove()` must keep working unchanged —
    // `delete` is excluded from the payload-bearing-write set (DD 3), and a
    // map on it is meaningless rather than denying.
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "delete",
        data: storedDoc,
      }),
    ).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("ignores `changes` entirely when no field map resolves", () => {
    // Role with a plain `true` check (the file's primary `access` fixture);
    // `changes` naming anything must still resolve `true` — proves the ~40
    // existing call sites, none of which pass a field map, are unaffected.
    expect(
      hasPermission({
        access,
        user: asUser("poweruser"),
        resource: "articles",
        action: "update",
        changes: { anything: "goes", title: "whatever" },
      }),
    ).toBe(true);
  });

  it("OR-merges across roles before judging the write", () => {
    expect(
      hasPermission({
        access: fieldMapAccess,
        user: asUser(["viewer", "finance"]),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { price: 2 },
      }),
    ).toBe(true);
  });

  it("keeps VexAccessError.data serializable on a field-scoped denial", () => {
    // The resource-level ("field" absent) side of this contract is already
    // pinned by `VexAccessError — Convex wire serializability` above; this
    // covers the field-scoped ("field" present) side.
    let caught: unknown;
    try {
      hasPermission({
        access: fieldMapAccess,
        user: asUser("editor"),
        resource: "articles",
        action: "update",
        data: storedDoc,
        changes: { name: "Defaced" },
        throwOnDenied: true,
      });
    } catch (error) {
      caught = error;
    }
    const error = caught as VexAccessError;
    expect(error.data.field).toBe("name");
    expect(() => convexToJson(error.data)).not.toThrow();
  });
});
```

### packages/core/src/access/resolveFieldPermissions.test.ts

The spec's own draft of this file is otherwise complete. It references a `postsCollection`
fixture in the two `warns in dev` tests that is never defined — add it, plus the two imports it
needs, alongside `buildAccess`:

```ts
import { defineCollection, text } from "../index";

const postsCollection = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }), price: text() },
});
```

Fill in the one bodiless test, `warns in dev on a system key`, immediately after `warns in dev
on a key the resource does not declare`:

```ts
it("warns in dev on a system key", () => {
  // Same backstop as the misspelling case; `_id` is rejected by
  // `ValidateFieldMaps` in a typed config (DD 6), so this only fires for a
  // config assembled at runtime, like `buildAccess` does here.
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const access = {
    ...buildAccess({ editor: { posts: { update: () => ({ "*": false, _id: true }) } } }),
    resources: [postsCollection],
  } as VexAccessConfig;
  resolveFieldPermissions({ access, user: { roles: ["editor"] }, data: {}, ...CALL });
  expect(warnSpy).toHaveBeenCalled();
  warnSpy.mockRestore();
});
```

### packages/core/src/api/create/server.test.ts and packages/core/src/api/update/server.test.ts

Both files already declare `postsResource = defineCollection({ slug: "posts", fields: { title:
text(), slug: text(), featured: checkbox() } })` in their `— access enforcement` sections —
reused as-is below.

### create/server.test.ts — add inside `describe("create (server) — access enforcement", ...)`

```ts
test("create rejects a payload carrying a denied field", async () => {
  const t = convexTest(schema, modules);
  const config = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: { create: () => ({ "*": false, title: true }) } },
      },
    }),
  } as unknown as VexConfig;

  let caught: unknown;
  try {
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      create({
        ctx,
        collection: "posts",
        config,
        auth: { user: { roles: ["editor"] } },
        // `title` is permitted; `slug` is not — a create has no stored doc to
        // diff against, so any denied key present is a violation (DD 9).
        data: { title: "New Post", slug: "denied-slug" },
      }),
    );
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(VexAccessError);
  expect((caught as VexAccessError).field).toBe("slug");
});

test("create writes normally when the action declares no map (regression)", async () => {
  const t = convexTest(schema, modules);
  const config = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: { create: true } },
      },
    }),
  } as unknown as VexConfig;

  const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
    create({
      ctx,
      collection: "posts",
      config,
      auth: { user: { roles: ["editor"] } },
      data: { title: "New Post", slug: "any-slug" },
    }),
  );
  expect(typeof id).toBe("string");
});
```

### update/server.test.ts — add inside `describe("update (server) — access enforcement", ...)`,
using the existing `withTransaction` helper already used by the sibling constraint-form blocks
in this file

```ts
test("update allows a save that resends a denied field unchanged", async () => {
  const config = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: { update: () => ({ "*": false, title: true }) } },
      },
    }),
  } as unknown as VexConfig;

  await withTransaction(async (ctx) => {
    const id = await ctx.db.insert("posts", { title: "a", slug: "s", featured: true });
    // Full-form submit: `slug`/`featured` are present but unchanged, only
    // `title` (permitted) actually changes.
    await update({
      ctx,
      id,
      collection: "posts",
      config,
      auth: { user: { roles: ["editor"] } },
      data: { title: "b", slug: "s", featured: true },
    });
    expect((await ctx.db.get(id))?.title).toBe("b");
  });
});

test("update rejects a save that changes a denied field", async () => {
  const config = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: { posts: { update: () => ({ "*": false, title: true }) } },
      },
    }),
  } as unknown as VexConfig;

  await withTransaction(async (ctx) => {
    const id = await ctx.db.insert("posts", { title: "a", slug: "s", featured: true });
    let caught: unknown;
    try {
      await update({
        ctx,
        id,
        collection: "posts",
        config,
        auth: { user: { roles: ["editor"] } },
        data: { title: "a", slug: "s2", featured: true },
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("slug");
    expect((await ctx.db.get(id))?.slug).toBe("s");
  });
});

test("update resolves a per-field expression against the STORED document", async () => {
  const config = {
    ...fixtureConfig,
    access: defineAccess({
      roles: ["editor"] as const,
      resources: [postsResource],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        editor: {
          posts: {
            // `featured` stands in for the spec's `price`, gated on the
            // STORED `slug` standing in for `status`.
            update: ({ data }: { data?: { slug?: string } }) => ({
              "*": false,
              featured: data?.slug === "draft",
            }),
          },
        },
      },
    }),
  } as unknown as VexConfig;

  await withTransaction(async (ctx) => {
    const id = await ctx.db.insert("posts", { title: "t", slug: "published", featured: false });
    let caught: unknown;
    try {
      await update({
        ctx,
        id,
        collection: "posts",
        config,
        auth: { user: { roles: ["editor"] } },
        // The stored `slug` is still "published" at check time — if the
        // callback wrongly read the PATCH's `slug: "draft"` instead, `featured`
        // would resolve permitted and the denial would land on `slug` instead.
        data: { featured: true, slug: "draft" },
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(VexAccessError);
    expect((caught as VexAccessError).field).toBe("featured");
    expect((await ctx.db.get(id))?.featured).toBe(false);
  });
});
```

### packages/core/src/api/globals/upsert.server.test.ts

Extend the top-level `siteSettingsGlobal` fixture with two optional fields (backward
compatible — every existing test in this file submits only `siteName`):

```ts
const siteSettingsGlobal = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    siteName: text({ label: "Site Name", required: true }),
    description: text({ label: "Description" }),
    adminTheme: text({ label: "Admin Theme" }),
  },
});
```

### New top-level describe block — merge semantics (Step 4), reusing `fixtureConfig` (RBAC off)
and the existing `GlobalRow` interface

```ts
describe("upsertGlobal (server) — merge semantics", () => {
  it("merges a partial payload into the stored blob", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "siteSettings",
        data: { siteName: "Site", description: "d" },
      });
    });
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "New" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows[0].data.siteName).toBe("New");
    expect(rows[0].data.description).toBe("d");
  });

  it("still rejects a partial payload that leaves the global invalid", async () => {
    const t = convexTest(schema, modules);
    // Seed a row missing the required `siteName` — a hand-migrated row, say.
    // The merge must surface that the RESULT is invalid, not just validate
    // whatever the partial payload happens to contain on its own.
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { description: "d" } });
    });
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        upsertGlobal({
          ctx,
          slug: "siteSettings",
          data: { description: "d2" }, // never touches siteName
          config: fixtureConfig,
        }),
      ),
    ).rejects.toThrow();
  });
});
```

### Add inside the existing `describe("upsertGlobal (server) — access", ...)` block — reuses its
`buildConfig`/`seed`/`storedName` helpers and `Harness` type verbatim

```ts
it("allows a save that changes only the permitted field", async () => {
  // The exact www scenario: a full-document submit changing only `adminTheme`.
  const config = buildConfig({
    reader: {
      siteSettings: {
        "*": false,
        read: true,
        update: () => ({ "*": false, adminTheme: true }),
      },
    },
  });
  const t = convexTest(schema, modules);
  await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
    await ctx.db.insert("vex_globals", {
      slug: "siteSettings",
      data: { siteName: "Site", adminTheme: "light" },
    });
  });
  await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
    await upsertGlobal({
      ctx,
      config,
      slug: "siteSettings",
      data: { siteName: "Site", adminTheme: "dark" },
      auth: { user: { roles: ["reader"] } },
    });
  });
  const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
    ctx.db.query("vex_globals").collect(),
  )) as unknown as GlobalRow[];
  expect(rows[0].data.adminTheme).toBe("dark");
});

it("rejects a save that changes a denied field", async () => {
  const config = buildConfig({
    reader: {
      siteSettings: {
        "*": false,
        read: true,
        update: () => ({ "*": false, adminTheme: true }),
      },
    },
  });
  const t = convexTest(schema, modules);
  await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
    await ctx.db.insert("vex_globals", {
      slug: "siteSettings",
      data: { siteName: "Site", adminTheme: "light" },
    });
  });
  let caught: unknown;
  try {
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Defaced", adminTheme: "light" },
        auth: { user: { roles: ["reader"] } },
      });
    });
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(VexAccessError);
  expect((caught as VexAccessError).field).toBe("siteName");
});

it("leaves the stored row untouched when a field denial rejects the write", async () => {
  const config = buildConfig({
    reader: {
      siteSettings: {
        "*": false,
        read: true,
        update: () => ({ "*": false, adminTheme: true }),
      },
    },
  });
  const t = convexTest(schema, modules);
  await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
    await ctx.db.insert("vex_globals", {
      slug: "siteSettings",
      data: { siteName: "Site", adminTheme: "light" },
    });
  });
  await expect(
    t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Defaced", adminTheme: "light" },
        auth: { user: { roles: ["reader"] } },
      }),
    ),
  ).rejects.toThrow(VexAccessError);
  expect(await storedName(t)).toBe("Site");
});

it("authorizes the first save as create, so an update-only map cannot initialize", async () => {
  const config = buildConfig({
    reader: {
      siteSettings: {
        "*": false,
        read: true,
        create: false,
        update: () => ({ "*": false, adminTheme: true }),
      },
    },
  });
  const t = convexTest(schema, modules);
  await expect(
    t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      upsertGlobal({
        ctx,
        config,
        slug: "siteSettings",
        data: { siteName: "Site", adminTheme: "light" },
        auth: { user: { roles: ["reader"] } },
      }),
    ),
  ).rejects.toThrow(VexAccessError);
  const rows = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
    ctx.db.query("vex_globals").collect(),
  );
  expect(rows).toHaveLength(0);
});
```

### packages/core/src/api/find/server.test.ts

New scoped fixture and describe block, following this file's own convention of one small
`defineCollection`/`defineAccess` pair per section (e.g. `constrainedPostsResource`,
`filterOnlyAccess`). `slug` doubles as the fixture's status marker (`"draft"` vs anything else),
so no field needs adding to any shared resource.

```ts
// ── Field-level read shaping (Step 5) ───────────────────────────────────────
const fieldMapPostsResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
});

const fieldMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [fieldMapPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: {
          read: ({ data }: { data?: { slug?: string } }) => ({
            "*": true,
            title: data?.slug === "draft",
          }),
        },
      },
    },
  }),
} as unknown as VexConfig;

const noMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [fieldMapPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { editor: { posts: { read: true } } },
  }),
} as unknown as VexConfig;

const fieldMapAuth = { user: { _id: "u1", roles: "editor" } };

describe("find (server) — field-level read shaping", () => {
  test("strips a field denied by the read action", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any).slug).toBe("public");
    expect((docs[0] as any).title).toBeUndefined();
  });

  test("returns documents unchanged when the read action declares no map (regression)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: noMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any).title).toBe("Published");
  });

  test("never strips _id or _creationTime", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect((docs[0] as any)._id).toBeDefined();
    expect((docs[0] as any)._creationTime).toBeDefined();
  });

  test("strips per document when the map's value is an expression over the document", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft post", slug: "draft" });
      await ctx.db.insert("posts", { title: "Published post", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    const draft = (docs as any[]).find((d) => d.slug === "draft");
    const published = (docs as any[]).find((d) => d.slug === "public");
    expect(draft.title).toBe("Draft post");
    expect(published.title).toBeUndefined();
  });

  test("does not DENY a read when the read action returns a map", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return find({ ctx, collection: "posts", config: fieldMapAccess, auth: fieldMapAuth } as any);
    });
    expect(docs).toHaveLength(1);
  });
});
```

### packages/core/src/api/get/server.test.ts

Reuses the existing `postsResource` (`title`, `slug`), `fixtureConfig`, `rbacConfig`, and
`adminAuth` fixtures already in this file for the regression case; a new `fieldMapRbacConfig`
for the rest.

```ts
// ── Field-level read shaping (Step 5) ───────────────────────────────────────
const fieldMapRbacConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [postsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: {
          read: ({ data }: { data?: { slug?: string } }) => ({
            "*": true,
            title: data?.slug === "draft",
          }),
        },
      },
    },
  }),
} as unknown as VexConfig;

const editorAuth = { user: { _id: "u3", roles: ["editor"] } };

describe("get (server) — field-level read shaping", () => {
  test("strips a field denied by the read action", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: fieldMapRbacConfig, auth: editorAuth } as any);
    });
    expect((doc as any).slug).toBe("public");
    expect((doc as any).title).toBeUndefined();
  });

  test("returns documents unchanged when the read action declares no map (regression)", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: rbacConfig, auth: adminAuth } as any);
    });
    expect(doc).toMatchObject({ title: "Public", slug: "public" });
  });

  test("never strips _id or _creationTime", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: fieldMapRbacConfig, auth: editorAuth } as any);
    });
    expect((doc as any)._id).toBeDefined();
    expect((doc as any)._creationTime).toBeDefined();
  });

  test("strips per document when the map's value is an expression over the document", async () => {
    const t = convexTest(schema, modules);
    const [draft, published] = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const draftId = await ctx.db.insert("posts", { title: "Draft post", slug: "draft" });
      const publishedId = await ctx.db.insert("posts", { title: "Published post", slug: "public" });
      return [
        await get({ ctx, id: draftId, collection: "posts", config: fieldMapRbacConfig, auth: editorAuth } as any),
        await get({ ctx, id: publishedId, collection: "posts", config: fieldMapRbacConfig, auth: editorAuth } as any),
      ];
    });
    expect((draft as any).title).toBe("Draft post");
    expect((published as any).title).toBeUndefined();
  });

  test("does not DENY a read when the read action returns a map", async () => {
    const t = convexTest(schema, modules);
    const doc = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await ctx.db.insert("posts", { title: "Public", slug: "public" });
      return get({ ctx, id, collection: "posts", config: fieldMapRbacConfig, auth: editorAuth } as any);
    });
    expect(doc).not.toBeNull();
  });
});
```

### packages/core/src/api/search/server.test.ts

Mirrors the `find` block above, using the empty-query `.take()` path (`withSearchIndex` is not
implemented in this repo's `convex-test` version — see the existing "non-empty query does not
throw" test in this same file).

```ts
// ── Field-level read shaping (Step 5) ───────────────────────────────────────
const searchFieldMapResource = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text() },
});

const searchFieldMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [searchFieldMapResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      editor: {
        posts: {
          read: ({ data }: { data?: { slug?: string } }) => ({
            "*": true,
            title: data?.slug === "draft",
          }),
        },
      },
    },
  }),
} as unknown as VexConfig;

const searchNoMapAccess = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["editor"] as const,
    resources: [searchFieldMapResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { editor: { posts: { read: true } } },
  }),
} as unknown as VexConfig;

const searchFieldMapAuth = { user: { _id: "u1", roles: "editor" } };

describe("search (server) — field-level read shaping", () => {
  test("strips a field denied by the read action", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any).slug).toBe("public");
    expect((docs[0] as any).title).toBeUndefined();
  });

  test("returns documents unchanged when the read action declares no map (regression)", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchNoMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any).title).toBe("Published");
  });

  test("never strips _id or _creationTime", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect((docs[0] as any)._id).toBeDefined();
    expect((docs[0] as any)._creationTime).toBeDefined();
  });

  test("strips per document when the map's value is an expression over the document", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Draft post", slug: "draft" });
      await ctx.db.insert("posts", { title: "Published post", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    const draft = (docs as any[]).find((d) => d.slug === "draft");
    const published = (docs as any[]).find((d) => d.slug === "public");
    expect(draft.title).toBe("Draft post");
    expect(published.title).toBeUndefined();
  });

  test("does not DENY a read when the read action returns a map", async () => {
    const t = convexTest(schema, modules);
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "Published", slug: "public" });
      return search({
        ctx,
        collection: "posts",
        query: "",
        searchIndexName: "search_title",
        searchField: "title",
        config: searchFieldMapAccess,
        auth: searchFieldMapAuth,
      } as any);
    });
    expect(docs).toHaveLength(1);
  });
});
```

### packages/core/src/api/globals/get.server.test.ts

This file currently has no access-enforcement coverage at all (only the RBAC-off flattening
tests). Add the hand-rolled config shape `upsert.server.test.ts`'s `buildConfig` already uses
for the same reason (`defineAccess` types `permissions` against the generated subject registry,
which this file's fixtures do not populate) — the same pattern, not a new one. Add
`GenericMutationCtx`/`GenericDataModel` are already imported; add nothing else.

```ts
describe("getGlobal (server) — field-level read shaping", () => {
  function buildConfig(permissions: Record<string, unknown>): VexConfig {
    return {
      globals: [],
      access: {
        enabled: true,
        roles: ["editor"],
        userCollectionSlug: "users",
        userRolesField: "roles",
        defaultPermissionMode: "deny",
        resources: [],
        permissions,
      },
    } as unknown as VexConfig;
  }

  const editorAuth = { user: { roles: ["editor"] } };

  it("strips a field denied by the read action", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": true, siteName: false }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?.siteName).toBeUndefined();
  });

  it("returns documents unchanged when the read action declares no map (regression)", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: true } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?.siteName).toBe("My Site");
  });

  it("never strips _id, _creationTime, or _slug", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: () => ({ "*": false }) } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result?._id).toBeDefined();
    expect(result?._creationTime).toBeDefined();
    expect(result?._slug).toBe("siteSettings");
    expect(result?.siteName).toBeUndefined();
  });

  it("strips per document when the map's value is an expression over the document", async () => {
    const config = buildConfig({
      editor: {
        draftPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
        publishedPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "draftPage",
        data: { siteName: "Draft Site", status: "draft" },
      });
      await ctx.db.insert("vex_globals", {
        slug: "publishedPage",
        data: { siteName: "Live Site", status: "published" },
      });
    });
    const draft = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "draftPage", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    const published = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "publishedPage", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(draft?.siteName).toBe("Draft Site");
    expect(published?.siteName).toBeUndefined();
  });

  it("does not DENY a read when the read action returns a map", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": false, siteName: true }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "My Site" } });
    });
    const result = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      getGlobal({ ctx, slug: "siteSettings", config, auth: editorAuth }),
    )) as VexDocumentGlobal | null;
    expect(result).not.toBeNull();
  });
});
```

### packages/core/src/api/globals/find.server.test.ts

Same hand-rolled `buildConfig` shape as above (this file also has no `access` fixture yet).

```ts
describe("findGlobals (server) — field-level read shaping", () => {
  function buildConfig(permissions: Record<string, unknown>): VexConfig {
    return {
      globals: [],
      access: {
        enabled: true,
        roles: ["editor"],
        userCollectionSlug: "users",
        userRolesField: "roles",
        defaultPermissionMode: "deny",
        resources: [],
        permissions,
      },
    } as unknown as VexConfig;
  }

  const editorAuth = { user: { roles: ["editor"] } };

  it("strips a field denied by the read action", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": true, siteName: false }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?.siteName).toBeUndefined();
  });

  it("returns documents unchanged when the read action declares no map (regression)", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: true } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?.siteName).toBe("A");
  });

  it("never strips _id, _creationTime, or _slug", async () => {
    const config = buildConfig({ editor: { siteSettings: { read: () => ({ "*": false }) } } });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result[0]?._id).toBeDefined();
    expect(result[0]?._creationTime).toBeDefined();
    expect(result[0]?._slug).toBe("siteSettings");
  });

  it("strips per document when the map's value is an expression over the document", async () => {
    const config = buildConfig({
      editor: {
        draftPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
        publishedPage: {
          read: ({ data }: { data?: Record<string, unknown> }) => ({
            "*": true,
            siteName: data?.status === "draft",
          }),
        },
      },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", {
        slug: "draftPage",
        data: { siteName: "Draft Site", status: "draft" },
      });
      await ctx.db.insert("vex_globals", {
        slug: "publishedPage",
        data: { siteName: "Live Site", status: "published" },
      });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    const draft = result.find((r) => r._slug === "draftPage");
    const published = result.find((r) => r._slug === "publishedPage");
    expect(draft?.siteName).toBe("Draft Site");
    expect(published?.siteName).toBeUndefined();
  });

  it("does not DENY a read when the read action returns a map", async () => {
    const config = buildConfig({
      editor: { siteSettings: { read: () => ({ "*": false, siteName: true }) } },
    });
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("vex_globals", { slug: "siteSettings", data: { siteName: "A" } });
    });
    const result = await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      findGlobals({ ctx, config, auth: editorAuth }),
    );
    expect(result).toHaveLength(1);
  });
});
```

### packages/core/src/media/api/mutations.test.ts (new file)

No test file exists yet for `mutations.ts`. Mirrors `packages/core/src/config/config.test.ts`'s
inline mock-adapter convention (avoids importing `@vexcms/file-storage-convex`, a circular dev
dependency) rather than introducing a new one. Neither `generateUploadUrl` nor
`createMediaDocument` touches `ctx.db` — both only forward `ctx` to the adapter — so a bare
mutation `ctx` stub is enough; no `convexTest` harness is needed.

```ts
import { describe, expect, test } from "vitest";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { VexConfig } from "../../config";
import type { VexStorageAdapter } from "../types";
import { defineAccess } from "../../access/config";
import { defineCollection, text } from "../../index";
import { createMediaDocument, generateUploadUrl } from "./mutations";

function makeMockAdapter(): VexStorageAdapter {
  return {
    name: "convex",
    type: "presigned-url",
    mediaCollections: [],
    admin: { softDelete: false },
    generateUploadUrl: async () => ({ url: "https://example.com/upload" }),
    createMediaDocument: async () => "media1",
    deleteMedia: async () => true,
    getUrl: async () => ({ url: "" }),
    uploadFile: async () => ({ storageId: "" }),
  } satisfies VexStorageAdapter;
}

const imagesResource = defineCollection({
  slug: "images",
  fields: { alt: text(), filename: text() },
});

/**
 * A role whose `create` check returns a field map. Before Step 6's fix, both
 * mutations authorized with neither `data` nor `changes`, so under the
 * default `scope: "all"` a map like this one 403'd every upload/save
 * regardless of what it actually permitted — these pin that it no longer
 * does, without asserting anything about which fields end up permitted.
 */
const fieldMapConfig = {
  storage: { adapters: [makeMockAdapter()] },
  access: defineAccess({
    roles: ["uploader"] as const,
    resources: [imagesResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      uploader: { images: { create: () => ({ "*": true }) } },
    },
  }),
} as unknown as VexConfig;

const ctx = {} as GenericMutationCtx<GenericDataModel>;
const auth = { user: { roles: ["uploader"] } };

describe("generateUploadUrl (server) — quantified call site with a field map", () => {
  test("still succeeds for a role whose create action returns a field map", async () => {
    const result = await generateUploadUrl({
      ctx,
      config: fieldMapConfig,
      adapter: "convex",
      collection: "images",
      auth,
    });
    expect(result.url).toBe("https://example.com/upload");
  });
});

describe("createMediaDocument (server) — quantified call site with a field map", () => {
  test("still succeeds for a role whose create action returns a field map", async () => {
    const id = await createMediaDocument({
      ctx,
      config: fieldMapConfig,
      adapter: "convex",
      collection: "images",
      storageId: "s1",
      filename: "photo.png",
      mimeType: "image/png",
      size: 1024,
      auth,
    });
    expect(id).toBe("media1");
  });
});
```

### packages/next/src/cache/createVexRevalidateRoute.test.ts

Extend the existing `access` fixture with one more role, and `roles` with its name:

```ts
const access = defineAccess({
  permissions: {
    editor: { pages: { create: true, delete: true, read: true, update: true } },
    viewer: { pages: { read: true } },
    // Step 6, DD 3 case 3: before this route passed `scope: "any"`, a role
    // whose write action resolved to a field map 403'd every purge — neither
    // `data` nor `changes` is supplied here, so the map fell through to the
    // default `scope: "all"`, which a map always denies.
    mapEditor: { pages: { update: () => ({ "*": false }) } },
  },
  resources: [pages],
  roles: ["editor", "viewer", "mapEditor"] as const,
  userCollectionSlug: "users",
  userRolesField: "roles",
});
```

Add inside `describe("createVexRevalidateRoute", ...)`:

```ts
it("still succeeds for a role whose write action returns a field map", async () => {
  const route = createVexRevalidateRoute({
    config: makeConfig(),
    getAuth: async () => ({ user: { _id: "u3", roles: "mapEditor" } }),
    getToken: async () => "token",
  });

  const response = await route.POST(
    postRequest({
      changes: [{ after: page("home") }],
      collection: "pages",
      operation: "update",
    }),
  );

  expect(response.status).toBe(200);
  expect(revalidatePath).toHaveBeenCalledWith("/pages/home");
});
```

## Verification

`pnpm build && pnpm test` across `@vexcms/core`, `@vexcms/react`, and `@vexcms/next`, plus
Step 8's manual browser pass. Every step above stays green individually; this is the final
combined gate.
