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
  - packages/react/src/hooks/usePermission.ts
  - apps/docs/src/content/docs/guides/access-control.mdx
prompt_version: 1
---

# 2026-09-07-field-level-rbac-permissions — Tasks

## Step 1 — Field-permission types and `defineAccess()` config `[dev]`
Why: Every later step reads or writes this shape; it has to exist and validate before the
resolver, write path, read path, or client hook can compile against it. This is the
"runtime only" boundary declaration — the JSDoc here is where we say it plainly, matching
kitcn's ORM-RLS docs framing.
Verify: `pnpm --filter @vexcms/core test access/config.test.ts access/types.test.ts`
- [ ] `packages/core/src/access/types.ts` — add `FieldPermissionCheck<TData, TUser, TOrg>`
      (`boolean | (props: PermissionCallbackProps<TData, TUser, TOrg>) => boolean`, reusing
      the existing `PermissionCallbackProps` so field checks take the same `{user, data,
      organization}` shape as resource-level checks) and `FieldPermissionMap<TFields extends
      string>` (`Partial<Record<TFields, FieldPermissionCheck>>`). Extend the per-role
      resource entry type with an optional `fields?: FieldPermissionMap` sibling to the
      existing boolean/callback/constraint check — additive, does not change the existing
      union's discriminant.
- [ ] `packages/core/src/access/config.ts` — `defineAccess()` validates `fields` map keys
      are non-empty strings (dev-mode warning only, matching the existing undeclared-subject
      warning posture; do not hard-fail on unknown field names since Convex documents can
      carry fields the collection schema doesn't declare).
- [ ] `packages/core/src/access/index.ts` — export `FieldPermissionCheck`,
      `FieldPermissionMap`.
- [ ] `packages/core/src/access/config.test.ts` — add cases: `fields` map accepted alongside
      a boolean/callback resource check; dev warning fires for an empty-string field key.

## Step 2 — `resolveFieldPermissions()` resolver `[dev]`
Why: One evaluator, reused by the write path, the read path, and the client hook — mirrors
how `hasPermission()` is the single evaluator for document-level checks. Building this once
here means steps 3-5 only call it, never re-implement role resolution.
Verify: `pnpm --filter @vexcms/core test access/resolveFieldPermissions.test.ts`
- [ ] `packages/core/src/access/resolveFieldPermissions.ts` — `resolveFieldPermissions(props:
      {access, user, organization?, resource, action, data?}): Record<string, boolean>`.
      Resolves the caller's roles exactly like `hasPermission()` (roles from
      `user[access.userRolesField]`, falling back to `access.anonRole` when empty), OR-merges
      each role's `fields` map (a field is allowed if ANY held role allows it — same
      merge posture as the resource-level matrix), and evaluates callback entries against
      `{user, data, organization}`. A field with no entry in any role's map for this
      resource/action is allowed by default (the field map narrows an already-granted
      resource-level action; it does not independently gate the whole resource — that stays
      `hasPermission()`'s job). Returns `{}` when `access` is `undefined` (RBAC off) or the
      resource has no `fields` map declared for the caller's roles — an empty result means
      "no restriction," matching the existing "not configured" fail-open posture for the
      document-level check when access is off.
- [ ] `packages/core/src/access/resolveFieldPermissions.test.ts` — role OR-merge, callback
      evaluation against `data`, empty-map fail-open, RBAC-off fail-open, anonRole fallback.

## Step 3 — Write-path field enforcement: `create()` / `update()` `[dev]`
Why: This is the actual enforcement boundary the developer asked to keep at "hasPermission
code directly" — a field the caller's role can't set throws `VexAccessError` and the whole
write is rejected, no partial patch. Depends on Step 2's resolver.
Verify: `pnpm --filter @vexcms/core test api/create/server.test.ts api/update/server.test.ts`
- [ ] `packages/core/src/api/create/server.ts` — after the existing document-level
      `hasPermission({..., data: args.data, throwOnDenied: true})` call passes, call
      `resolveFieldPermissions({access, user, organization, resource, action, data:
      args.data})` and check every key present in `args.data` against the result; on the
      first key resolved `false`, throw `VexAccessError` (reuse the existing error shape;
      extend its `data` payload with the denied field name so the client can render which
      field was rejected). No field map declared → skip the check entirely (Step 2's
      empty-result fail-open).
- [ ] `packages/core/src/api/update/server.ts` — same check, run against the incoming patch
      keys (`args.data`) with `data` passed as the **stored document** (matches the existing
      document-level check's `data: doc ?? undefined`, per ADR-002's "check against the
      stored doc, not the patch" precedent) so a field rule can read prior state (e.g. "owner
      may edit `price` only while `status` is `draft`").
- [ ] `packages/core/src/access/types.ts` — extend `VexAccessError`'s `data` payload with an
      optional `field?: string`, always present-but-possibly-absent per the existing
      Convex-wire-serializability rule (every key always present, never `undefined` in the
      wire payload — checked by `hasPermission.test.ts`'s serializability tests).
- [ ] `packages/core/src/api/create/server.test.ts` / `update/server.test.ts` — add cases:
      denied field in payload throws `VexAccessError` with `field` set and nothing is
      written; allowed fields alongside a denied one still reject the whole write (no partial
      patch); no field map declared → write proceeds unchanged (regression guard against
      breaking every existing test in these files).

## Step 4 — Read-path field stripping: `find()` / `get()` / `search()` `[dev]`
Why: Same resolver, opposite direction — after the existing per-document `hasPermission()`
filter decides a document is readable at all, strip the fields the caller's roles can't see.
Depends on Step 2.
Verify: `pnpm --filter @vexcms/core test api/find/server.test.ts api/get/server.test.ts api/search/server.test.ts`
- [ ] `packages/core/src/api/find/server.ts` — after the existing `.filter((d) =>
      hasPermission(...))` step, map surviving documents through `resolveFieldPermissions()`
      and delete keys resolved `false` from each returned document (never mutate the object
      returned by `ctx.db` — shallow-copy before deleting). Empty resolver result → skip the
      map entirely (no allocation when no field map is declared, keeping the common case at
      today's cost).
- [ ] `packages/core/src/api/get/server.ts` — same stripping on the single fetched document,
      after the existing `hasPermission({throwOnDenied: true, ...})` call succeeds.
- [ ] `packages/core/src/api/search/server.ts` — same stripping on search results; read this
      file first to confirm its current per-document access handling before adding the call
      (its filtering path was not audited in this spec's research and may differ from
      `find`'s).
- [ ] `packages/core/src/api/find/server.test.ts` / `get/server.test.ts` /
      `search/server.test.ts` — add cases: a denied field is absent from the returned
      document; a field with no rule declared still returns; no field map declared → returned
      documents are unchanged (regression guard).

## Step 5 — Client field-permission hook `[dev]`
Why: Admin-panel form gating, advisory only (P-004) — evaluates the same resolver in-browser
against the bundle-imported access config, no server round trip, exactly like `usePermission`
does today for resource-level checks. Depends on Step 2 (same resolver, re-exported for
client bundle use).
Verify: `pnpm --filter @vexcms/react test usePermission.test.tsx useFieldPermissions.test.tsx`
- [ ] `packages/react/src/hooks/useFieldPermissions.ts` — new hook,
      `useFieldPermissions({resource, action, data?}): Record<string, boolean>`, reading
      `user`/`organization` from `VexAuthContext` and `access` from `VexAccessContext`
      exactly like `usePermission` does, calling `resolveFieldPermissions()` directly
      (client-bundle import, not a query — same P-004 pattern as `usePermission`).
- [ ] `packages/react/src/hooks/index.ts` (or wherever `usePermission` is re-exported) — export
      `useFieldPermissions`.
- [ ] `packages/react/src/hooks/useFieldPermissions.test.tsx` — mirrors
      `usePermission.test.tsx`'s fixture setup; asserts a denied field resolves `false`, an
      undeclared field resolves `true` (default-allow), RBAC-off resolves every field `true`.
- [ ] Locate the collection/global edit-form field renderer (grep the admin form component
      tree for where individual field inputs are rendered per `CollectionConfig`/`GlobalConfig`
      field list) and gate each field's editable state on `useFieldPermissions()` for the
      `update` action — disabled, not hidden, so the developer sees the value but can't
      change it (matches "which fields can this role change" framing, not "which fields
      exist"). Read the actual component before editing; do not guess its prop shape from
      this task list.

## Step 6 — Documentation `[dev]`
Why: The runtime-only boundary is a correctness-relevant fact for anyone integrating this —
same reason kitcn calls it out. Last step: nothing downstream depends on docs text.
Verify: manual read-through; no build/test gate.
- [ ] `apps/docs/src/content/docs/guides/access-control.mdx` — add a "Field-level
      permissions" section: config shape (`fields` map on a resource/role entry), the
      runtime-only boundary stated explicitly ("enforced in the generated Convex functions
      and in the admin-panel client bundle; a caller that bypasses both — a hand-rolled
      Convex function calling `ctx.db` directly — bypasses this the same way it already
      bypasses `hasPermission()`"), write-time throw-on-denied-field behavior, read-time
      stripping behavior, and the deferred type-narrowing gap (return types still describe
      the full document; a caller may receive fewer keys than the type promises when fields
      are restricted for their role).
- [ ] `packages/core/README.md` — one-line mention of field-level permissions under the
      existing RBAC bullet, cross-referencing the docs guide.
- [ ] `.agent/docs/product/backlog.md` — add an entry for the deferred generic type-narrowing
      work (caller-asserted field-name union on `find`/`get`/`create`/`update`), so it isn't
      lost the way the original field-permission removal nearly was.
