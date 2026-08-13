# rbac-access-control — Tasks

Ordered task groups. Each leaves build + test green.

## 1. Access module types + errors `[agent]`

Create `packages/core/src/access/types.ts`: subject registry machinery
(`SubjectMap` over resources + `customResources` + core built-in `adminPanel`),
`PermissionCheck` union (boolean | field-mode object | callback), `CrudAction`,
`DraftAction`, `VexAccessConfig` (type-erased runtime shape), `VexAccessInput`
(single input type, optional `organizationCollection`, `defaults: "allow" | "deny"`),
`customResource()` data-type carrier, `VexAccessError` + `VexAccessConfigError`
(module-local `types.ts`, extending `Error` — mirrors `VexAuthConfigError`,
`VexStorageConfigError`).

- Why: every other file imports these contracts; LSP-clean ordering demands they land first.
- Verify: `pnpm --filter @vexcms/core build` (types-only step, zero new tests).

## 2. defineAccess builder + tests `[dev]`

Create `packages/core/src/access/config.ts` (`defineAccess`) +
`config.test.ts`. Type inference from `roles`/`resources`/`customResources`/
`userCollection`/`organizationCollection`; dev-time validation warnings (role keys
⊆ roles, resource slugs known, wildcard `"*"` handling); returns type-erased
`VexAccessConfig` carrying a phantom type parameter for `hasPermission` inference.

- Why: the authored config is the system's source of truth; hasPermission consumes its output.
- Verify: `pnpm --filter @vexcms/core test -- access/config`

## 3. hasPermission resolver + tests `[dev]`

Create `packages/core/src/access/hasPermission.ts` + `hasPermission.test.ts` +
`access/index.ts` barrel. Boolean and field-map overloads, multi-role OR merge
(allow wins over deny), `defaults` posture for undeclared subjects/actions,
callback resolution (`{ user, data?, organization? }`), `throwOnDenied` →
`VexAccessError`. Port master's edge-case suite (permissive defaults, empty/unknown
roles, mode objects with/without `fields` param, boolean shorthand, merge cases,
callback returning undefined).

- Why: the single runtime entry point; everything downstream (factories, www) calls it.
- Verify: `pnpm --filter @vexcms/core test -- access`

## 4. Config integration + public exports `[agent]`

Add `access?` to `VexConfigInput`/`VexConfig` (`config/types.ts`), pass through in
`defineConfig` (`config/config.ts`), strip `access` in `sanitizeConfigForClient`
(+ test), export access module from `packages/core/src/index.ts`.

- Why: config is how access reaches server factories and www; sanitization keeps it server-only.
- Verify: `pnpm --filter @vexcms/core test -- sanitizeConfig && pnpm --filter @vexcms/core build`

## 5. Server API enforcement seam `[dev]`

Extend `queryApi`/`mutationApi`/`globalsApi` in `packages/core/src/api/server.ts`
with optional `options?: { getAuth }` param; guards call `hasPermission` with
`throwOnDenied: true` on create/update/remove/upsert, doc-read filtering on
get/find/search results. No `getAuth` ⇒ unchanged behavior (all-allow). Tests in
`api/server.test.ts` style with a fixture access config.

- Why: one seam enforces all collections + globals; avoids master's per-generated-file guards.
- Verify: `pnpm --filter @vexcms/core test -- api`

## 6. www wiring + stub removal `[dev]`

Create `apps/www/src/vexcms/access.ts` (roles, resources, customResources,
organizationCollection omitted for now); pass `access` in `apps/www/src/vex.config.ts`;
create `apps/www/convex/vex/auth.ts` (`getAuth` via better-auth session); pass
`{ getAuth }` to the factories in `apps/www/convex/vex/globals.ts` (and collection
factories where registered); delete `apps/www/src/auth/permissions.ts` (zero callsites).

- Why: proves the DX end-to-end in the real app; removes the dead app-level stub.
- Verify: `pnpm --filter www typecheck && pnpm --filter www build`
