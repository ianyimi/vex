---
status: in-progress
spec_id: 2026-09-07-field-level-rbac-permissions
touches:
  - packages/core/src/access/**
  - packages/core/src/api/create/server.ts
  - packages/core/src/api/update/server.ts
  - packages/core/src/api/find/server.ts
  - packages/core/src/api/get/server.ts
  - packages/core/src/api/search/server.ts
  - packages/core/src/api/globals/**
  - packages/core/src/media/api/mutations.ts
  - packages/next/src/cache/createVexRevalidateRoute.ts
  - packages/react/src/hooks/**
  - packages/react/src/components/views/**
  - apps/www/src/auth/**
  - apps/test/src/auth/hasPermission.ts
  - apps/docs/src/content/docs/guides/access-control.mdx
prompt_version: 2
---

# 2026-09-07-field-level-rbac-permissions — Tasks

Regenerated from `spec.md` (prompt_version 4). The previous version of this file
described the abandoned `fields?: FieldPermissionMap` sibling on the resource entry,
which `spec.md`'s Design Decisions 1 and 2 explicitly reject: a field map is only ever a
filter callback's RETURN value. Step numbering now matches `spec.md`'s Implementation
section one-to-one.

## Step 1 — Field-permission types
Why: Every later step reads or writes this shape.
Verify: `pnpm --filter @vexcms/core exec tsc --noEmit`
- [x] `access/types.ts` — `FieldPermissionKey`, `FieldPermissionMap`, `FieldMapReturnOf`,
      `ExcessFieldKeys`, `FieldMapError`, `ValidateFieldMaps`; widen only
      `BasePermissionCheck`'s CALLBACK return; `VexAccessConfigInput` gains a trailing
      `TPermissions` inference parameter applied to `permissions`.
- [x] `access/types.ts` — `VexAccessError` gains an optional `field`, spread in
      conditionally so the wire payload never carries `undefined`.
- [x] `access/config.ts` — `defineAccess` gains the matching `TPermissions` parameter.
      No `const` modifier, and the constraint stays the full `Record<…, RolePermissions<…>>`
      or every callback prop silently becomes `any`.

## Step 2 — Shared resolution, the `hasPermission` fold, `resolveFieldPermissions()`
Why: The core of the spec. One role walk, two entry points.
Verify: `pnpm --filter @vexcms/core test src/access`
- [x] `access/hasPermission.ts` — `HasPermissionProps.changes`; extract the per-role walk
      into exported `resolveRoleResults`; widen `resolvePermissionCheck` and
      `resolveConstrainedCheck` to return `boolean | FieldPermissionMap`; fold maps into
      the boolean answer; add `isPayloadBearingWrite` and `deniedFieldIn`.
- [x] `access/resolveFieldPermissions.ts` — NEW. `SYSTEM_FIELD_KEYS`,
      `ResolvedFieldPermissions`, `UNRESTRICTED_FIELDS`, `isFieldPermissionMap`,
      `resolveFieldPermissions`, `isFieldAllowed`, `stripDeniedFields`.
- [x] `access/index.ts` — re-export the new module (and `compileConstraints`, which the
      admin panel's live-merge hook needs for `CONSTRAINT_COMPARATORS`).
- [x] `access/hasPermission.test.ts`, `access/resolveFieldPermissions.test.ts`,
      `access/fieldPermissions.types.test.ts`.

## Step 3 — Write-path call sites: collections
Why: The enforcement boundary for `create()`/`update()`. One added argument each.
Verify: `pnpm --filter @vexcms/core test src/api/create/server.test.ts src/api/update/server.test.ts`
- [x] `api/create/server.ts` — `changes: args.data`.
- [x] `api/update/server.ts` — `changes: args.data`, `data` stays the STORED document.
- [x] Tests in both `server.test.ts` files.

## Step 4 — Write-path call site: globals
Why: A separate enforcement site, and the one the acceptance scenario runs through.
Verify: `pnpm --filter @vexcms/core test src/api/globals/upsert.server.test.ts`
- [x] `api/globals/upsert.server.ts` — `changes: userFields`; patch MERGES instead of
      replacing the `data` blob; validation runs on the merged document.
- [x] Tests in `upsert.server.test.ts`.

## Step 5 — Read-path shaping
Why: Same resolver, opposite direction — strip rather than deny.
Verify: `pnpm --filter @vexcms/core test src/api`
- [x] `api/find/server.ts`, `api/search/server.ts` — strip the returned page only, never
      the counting branches.
- [x] `api/get/server.ts` — strip the single fetched document.
- [x] `api/globals/get.server.ts`, `api/globals/find.server.ts` — strip the flat document.
- [x] Tests in each `server.test.ts`.

## Step 6 — Quantified call sites
Why: Calls passing neither `data` nor `changes` silently flip to DENIED the first time
anyone declares a field map. All fail closed, so none is a hole — but the symptom is a
long way from the cause.
Verify: `pnpm --filter @vexcms/core test src/media` and `pnpm --filter @vexcms/next test src/cache`
- [x] `media/api/mutations.ts` — `generateUploadUrl` takes `scope: any`;
      `createMediaDocument` takes real `changes`.
- [x] `next/src/cache/createVexRevalidateRoute.ts` — `scope: any`.
- [x] Tests beside the existing media and revalidate-route tests.

## Step 7 — Admin panel: field gating and diff submit
Why: Advisory client-side gating, plus the diff submit the merge in Step 4 makes safe.
Verify: `pnpm --filter @vexcms/react test`
- [x] `hooks/useFieldPermissions.ts`, `hooks/changedValues.ts`, `hooks/useLiveFieldMerge.ts`
      — NEW; exported from `hooks/index.ts`. `changedValues` MUST read `isDirty`, never
      `isDefaultValue`.
- [x] `CollectionEditView`, `GlobalEditView`, `MediaCollectionEditView` — fold
      `isFieldAllowed` into each input's existing `readOnly`; diff submit in edit mode
      only; wire `useLiveFieldMerge`.
- [x] `CollectionListView`, `MediaCollectionListView` — filter column defs by read field
      permissions resolved with `scope: any`; fix `canCreate` and `RevalidateButton` to
      pass `scope: any`.
- [x] Tests: new hook tests plus cases in the existing view tests.

## Step 8 — `apps/www`: anonymous theme selection
Why: The acceptance scenario the whole spec exists for.
Verify: manual — see spec.md Step 8's five-point walkthrough.
- [x] `apps/www/src/auth/access.ts` — `siteSettings.update: () => ({ "*": false, adminTheme: true })`.
- [x] `apps/www/src/auth/hasPermission.ts`, `apps/test/src/auth/hasPermission.ts` — add
      `"changes"` to the existing `Omit`.

## Step 9 — Documentation
Why: The runtime-only boundary is correctness-relevant for anyone integrating this.
Verify: manual read-through; no build/test gate.
- [x] `apps/docs/src/content/docs/guides/access-control.mdx` — "Field-level permissions".
- [x] `packages/core/README.md` — replace the stale `{ mode, fields }` example.
- [x] `.agent/docs/product/backlog.md` — the four deferred entries.
