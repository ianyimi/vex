# rbac-access-control — Tasks

Ordered task groups. Each leaves build + test green.

## 1. Access module constants + types + errors `[agent]` — [x] DONE

`packages/core/src/access/constants.ts` (`CRUD_ACTIONS`, `DRAFT_ACTIONS`, `PERMISSION_MODES`,
`WILDCARD_KEY`, `ADMIN_CUSTOM_SUBJECTS`) + `types.ts` (`SubjectMap`, `PermissionCheck`,
`VexAccessConfig<TSubjects>` erased, `VexAccessConfigInput`, `dataType()`, errors).

- Verify: `pnpm --filter @vexcms/core build` ✓

## 2. defineAccess builder + tests `[dev]` — [x] DONE

`access/config.ts` + `config.test.ts`. Hard errors + dev warnings; frozen erased config.

- Verify: `pnpm --filter @vexcms/core test -- access/config` ✓

## 3. hasPermission resolver + tests `[dev]` — [x] DONE

`access/hasPermission.ts` + tests + `index.ts`. Boolean-only; roles from
`user[userRolesField]`; wildcard precedence; OR merge; single throw site.

- Verify: `pnpm --filter @vexcms/core test -- access` ✓

## 4. Config integration + public exports `[agent]` — [x] DONE (one open item → Step 10)

`access` on `VexConfigInput`/`VexConfig`; `defineConfig` passthrough; `sanitizeConfigForClient`
strips `access`; core exports.

- [ ] OPEN (→ Step 10): `defineConfig`-time validation of `userCollectionSlug`/`userRolesField`.
- Verify: `pnpm --filter @vexcms/core test -- sanitizeConfig && build` ✓

## 5. Server API enforcement `[dev]` — [x] DONE

`collectionsApi` + `globalsApi` + media factories; `resolveGetAuth`; `me`; nullable-`user`
fail-closed guards; reads filter / single-doc null; writes throw.

- Verify: `pnpm --filter @vexcms/core test -- api` ✓

## 6. www wiring `[dev]` — [x] DONE

`@vexcms/better-auth` `createGetAuth`; `convex/vex.ts` + `vex/globals.ts` wiring; token threaded
through `NextAdminPage` + admin `page.tsx`.

- Verify: `pnpm --filter www typecheck && pnpm --filter www build` ✓

## 7. Capability mode in hasPermission `[dev]` — [ ] NEXT

Add `mode?: "action" | "capability"` (default `"action"`). Action + callback + no `data` →
throw; capability + callback → `true`; static concrete in both. + tests.

- Verify: `pnpm --filter @vexcms/core test -- access`

## 8. Client permission context (sidebar/nav visibility) `[dev]` — [ ]

`VexAccessProvider`/`useVexAccess` (client-bundle import of `access`) + `VexAuthContext`
(server-passed `user`/`organization`) + `usePermission()` hook. `AdminSidebar`/`AdminTopNav`
filter links via `usePermission({ resource, action: "read", mode: "capability" })`. App wires
`<VexAccessProvider access={access}>` in `clientProviders.tsx`. No snapshot. + tests.

- Verify: `pnpm --filter @vexcms/react build && pnpm --filter www typecheck`

## 9. View-level action enforcement `[dev]` — [ ]

Gate affordances via `usePermission()` (direct client `hasPermission`): `CollectionListView`
create/bulk-delete (capability); `CollectionEditView`/`MediaCollectionEditView` save + readonly
inputs (exact per-doc `action` mode with the live `currentDocument`); `GlobalEditView` save;
`CreateDocumentModal` submit. No `canUpdate` prop forwarding. + tests.

- Verify: `pnpm --filter @vexcms/react build && pnpm --filter www typecheck && build`

## 10. Cleanup `[dev]` — [ ]

- [x] Drop field-mode `{ mode, fields }` from `PermissionCheck`/`FieldPermissionResult`/`mergeRolePermissions`.
- [ ] `get`/`getGlobal` return `null` on read-deny (not throw).
- [ ] `defineConfig`-time access validation (the open Step 4 item).
- [ ] Doc: `me` as client-UI convenience; confirm `resolveCollectionSlug` JSDoc matches throw.
- [ ] **Cross-spec:** `2026-08-23-access-index-resolution` adds the
      `{ filter, withIndex }` object form to `PermissionCheck`. Land the field-mode
      removal above **in the same pass** as that addition so the union is rewritten
      once, not twice. Whichever spec reaches this union first owns the migration.
- Verify: `pnpm --filter @vexcms/core test && pnpm --filter www typecheck`

## 11. Comprehensive test plan `[dev]` — [ ]

All code paths per the spec's `## Test Plan` — hasPermission (incl. capability), collections /
globals / media guards, `resolveGetAuth`, `createGetAuth`, `me`, snapshot, defineConfig
validation, denied-write-does-not-mutate regression.

- Verify: `pnpm --filter @vexcms/core test && pnpm --filter @vexcms/better-auth test`
