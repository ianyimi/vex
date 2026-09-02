---
status: done
spec_id: 2026-08-29-server-api-access-options
touches:
  - packages/core/src/api/types.ts
  - packages/core/src/api/utils.ts
  - packages/core/src/api/*/server.ts
  - packages/core/src/api/globals/*.server.ts
  - packages/core/src/media/api/*.ts
  - packages/core/src/access/types.ts
  - packages/core/src/access/config.ts
prompt_version: 1
---

# 2026-08-29-server-api-access-options — Tasks

## Step 1 — Access call options, resolver, and runtime custom-action record
Why: Every later step reads one resolved `{ access, action }` pair. Storing `customActions`
on the resolved config is what lets the dev guard tell a real verb from a typo at runtime.
Verify: `cd packages/core && pnpm vitest run src/api/utils.test.ts src/access`
- [x] `packages/core/src/access/types.ts` — `customActions` on the resolved `VexAccessConfig`
- [x] `packages/core/src/access/config.ts` — carry `customActions` through `defineAccess`
- [x] `packages/core/src/api/types.ts` — `AccessCallOptions`, `access?` on both param bases
- [x] `packages/core/src/api/utils.ts` — `resolveAccessCall` + both dev guards
- [x] `packages/core/src/api/utils.test.ts` — resolver + guard tests

## Step 2 — Thread the resolved pair through every raw server function
Why: 22 sites currently hardcode both the action and `args.config?.access`. Until they read
the resolver, neither `action` nor `bypass` has any effect.
Verify: `cd packages/core && pnpm vitest run && npx tsc --noEmit -p tsconfig.json`
- [x] `packages/core/src/api/find/server.ts` — 6 sites
- [x] `packages/core/src/api/search/server.ts` — 5 sites
- [x] `packages/core/src/api/get/server.ts` — 1 site
- [x] `packages/core/src/api/create/server.ts` — 1 site
- [x] `packages/core/src/api/update/server.ts` — 1 site
- [x] `packages/core/src/api/remove/server.ts` — 1 site
- [x] `packages/core/src/api/globals/types.ts` + `{get,find,upsert}.server.ts` — 3 sites
- [x] `packages/core/src/media/api/{queries,mutations}.ts` — 4 sites
- [x] `packages/core/src/api/find/server.test.ts` — action selection + bypass on a real query

## Step 3 — vexServerApi surface: `skipAccess` → `access.bypass`, add `access.action`
Why: This is the only public surface that may carry per-call access options — its caller is
your own server code. Clean cutover: `skipAccess` has zero call sites in the repo.
Verify: `cd packages/core && pnpm vitest run src/api && npx tsc --noEmit -p tsconfig.json`
- [x] `packages/core/src/api/server.ts` — rename on `BoundArgs`/`BoundPassthroughArgs`, thread `action`
- [x] `packages/core/src/api/server.ts` — JSDoc example at `vexServerApi`
- [x] `packages/core/src/api/server.test.ts` — NEW file: bypass skips `getAuth`; action reaches
      the check; no-warning regression pin; mutation-wrapper bypass (7 tests)

## Step 4 — Emit CustomActionsBySlug into the generated registry
Why: The registry is the only type-level path from a collection slug to its declared custom
actions — server args only see the wide `VexConfig`. Follows the IndexFieldsBySlug pattern.
Verify: `cd packages/core && pnpm vitest run src/types/generateVexTypes.test.ts`
- [x] `packages/core/src/types/generateVexTypes.ts` — build block + add to declare-module
- [x] `packages/core/src/types/generated.ts` — `CustomActionsBySlug` infer-with-fallback
- [x] `packages/core/src/types/generateVexTypes.test.ts` — declared / omitted-list / empty cases

## Step 5 — Slug-aware access.action on every slug-taking function
Why: One lookup type; every `access?:` beside a slug parameter swaps to it. Pre-generation
stays permissive (core tests run unaugmented); post-generation a custom verb completes exactly
where declared and errors everywhere else. Media stays wide — its subject resolves at runtime.
Verify: `cd packages/core && pnpm vitest run && npx tsc --noEmit -p tsconfig.json`; then
`cd apps/www && pnpm vex generate && pnpm typecheck` + editor completion check on `find`.
- [x] `packages/core/src/api/types.ts` — `QueryCallActionFor`/`MutationCallActionFor` + query-base swap
- [x] `packages/core/src/api/{create,update,remove}/server.ts` — mutation interfaces swap
- [x] `packages/core/src/api/globals/{get,upsert}.server.ts` — `TSlug`-keyed swap
- [x] `packages/core/src/api/server.ts` — delete `BoundServerArgs`'s redundant wide `access`
- [x] `packages/core/src/access/types.test.ts` — pre-generation permissiveness pin
