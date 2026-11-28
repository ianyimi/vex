---
status: in-progress
spec_id: 2026-11-27-package-manager-support
touches:
  - packages/create-vexcms/src/**
  - packages/create-vexcms/templates/base-nextjs/package.json
  - packages/create-vexcms/templates/base-nextjs/README.md
  - packages/create-vexcms/templates/marketing-site/src/components/InstallCommand.tsx
  - packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts
  - packages/create-vexcms/README.md
  - packages/*/README.md
  - packages/cli/src/lib/convexProcess.ts
  - apps/www/src/components/InstallCommand.tsx
  - apps/www/src/components/InstallCommand.test.tsx
  - apps/test/src/components/InstallCommand.tsx
  - apps/docs/package.json
  - apps/docs/src/components/PmCommand.astro
  - apps/docs/src/components/PmTabs.astro
  - apps/docs/src/content/docs/guides/**
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - README.md
  - scripts/verify-scaffold.mjs
  - .github/workflows/scaffold-package-managers.yml
  - .github/workflows/release.yml
  - .changeset/create-vexcms-package-managers.md
  - .changeset/cli-deno-convex-runner.md
prompt_version: 1
---

# 2026-11-27-package-manager-support — Spec

## Overview

Clean `create-vexcms` installs work with npm, pnpm, yarn and bun, and with Deno and yarn 1 on a
best-effort basis; every public install/run command is shown per package manager. On the
published alpha.41 only pnpm 10 and bun produced a working project (`matrix.md`). Sources and
fetch dates: `.agent/docs/research/package-manager-support.md`. Agent-implemented (developer,
2026-11-27); the spec records what was built rather than guided stubs.

## Design Decisions

1. **Support tiers** (developer): official npm, pnpm, yarn 4, bun; best-effort Deno and yarn 1
   (tested and documented, never release-blocking). Why: Deno's Next.js/Convex CLI support is
   qualified upstream; yarn 1 can't run a dist-tagged `create` package.
2. **Minimum versions** (developer): Node 22, npm 10, pnpm 10, yarn 4 (1.22 best-effort), bun 1.2,
   Deno 2.6 (`deno x`). The matrix ran the current latest of each (npm 11.6 — npm 12 drops Node
   24.9 —, pnpm 12.23 and 10.30, yarn 4.19 and 1.22.22, bun 1.4.5, Deno 2.9.6).
3. **Detection** (developer): from the invoking command — `npm_config_user_agent`'s first
   `name/version` token, Deno from `process.versions.deno` (it wins over the user agent) — with a
   `--use-<manager>` override and no prompt. Mirrors create-next-app's `--use-*` flags.
4. **One module** `src/helpers/packageManager.ts` owns every per-manager spelling (install, run,
   exec, add, README rewrite); `base.ts` no longer detects anything. `ProjectOptions.packageManager`
   carries the resolved `{ name, version }`, resolved once in `index.ts`.
5. **`packageManager` field** only with an exact semver from the user agent and never for Deno —
   the old detector wrote `npm@?` under Deno.
6. **Pins live once** in the template's `overrides`; the scaffolder moves them where each manager
   reads them: `pnpm-workspace.yaml` (with `package.json#pnpm`'s build allowlist and peer rules —
   pnpm 11+ ignores the field) for pnpm, `resolutions` for yarn, `overrides` for npm/bun/Deno.
   `--monorepo` leaves all of it to the host workspace.
7. **yarn linker** (developer): `.yarnrc.yml` with `nodeLinker: node-modules`; plus
   `npmPreapprovedPackages: ["@vexcms/*"]` because yarn 4.19's default `npmMinimalAgeGate` (1 day)
   rejects a scaffold created on release day. Deno 2.9 has the same gate → `deno.json`
   `minimumDependencyAge.exclude` for the scaffold's `@vexcms/*` packages.
8. **Explicit peers in the base template**: `@daveyplate/better-auth-ui`'s statically imported
   peers, `@better-auth/core`, `@better-auth/passkey`, `better-call` 1.4.5, and the
   `@typescript-eslint/*` family pinned to 8.72.1. Why: npm/pnpm/bun auto-install peers, yarn
   doesn't; yarn hoisted `better-call` 2.0.2 and Deno duplicated `@better-auth/core`, both of which
   turn `createAuthClient` into an unresolved type under typed lint. Deviation from "templates
   mirror apps/test": the apps are pnpm-only, so they don't need these lines.
9. **Scaffold README** (developer): commands rewritten to the detected manager; the CLI prints the
   same next steps. pnpm keeps short forms (`pnpm dev`), npm gets `npm run x -- <args>`.
10. **Docs component** (developer: plugin): `starlight-package-managers` 0.13.1 behind a local
    `PmCommand.astro` (fixed order npm, pnpm, yarn, bun, deno). Deviation: the plugin has no Deno
    `create`, strips the tag from `yarn create` (would install the unrelated `latest` 0.0.20 during
    the alpha), can't vary an argument per manager (`--cmd '<build>'`) and has no `npm:` prefix for
    `deno add`; those blocks use `PmTabs.astro`, Starlight `<Tabs>` on the plugin's own `syncKey`
    so every block on a page switches together. Docs exec form follows the plugin
    (`pnpm convex`, `deno x convex`); the scaffolder uses the same forms.
11. **GitHub READMEs** (developer): one `<details>` per manager. Contributor docs (`/dev/*`,
    CONTRIBUTING) stay pnpm-only (developer).
12. **Hero install command** (developer, revised mid-run): a fixed-width (`w-24`) select joined to
    the command strip, sharing its border; the command and copy value follow it. Every manager's
    command is reserved in one grid cell, so nothing resizes; no persistence (a cookie would make
    the prerendered home page dynamic). Derived from the seeded `pnpm create …` string, so no seed
    change. Uses the existing `ui/select` (Base UI).
13. **CI** (developer): `scaffold-package-managers.yml` (matrix over `verify-scaffold.mjs --pm`),
    called by `release.yml` before the release job and runnable by `workflow_dispatch`; Deno and
    yarn 1 jobs `continue-on-error`. The Convex run-through stays a release-time manual check.
14. **`vex` CLI**: `deno.lock` → `deno x convex` (before: `npx`, which needs Node + npm).

## Out of Scope

- The `vexcms-project-init` agent skill and its guide section (pnpm-only; backlog).
- Telemetry's `packageManager` enum (`"deno"` reports as `unknown`; schema change, backlog).
- `vex:update` installing `@latest` (resolves to the unrelated 0.0.20 until 0.1.0 ships).
- The marketing first sign-up landing on `/` instead of `/admin` (promotion works; same on every
  manager — reported).
- Versioned pages listing a draft row id whose URL 404s after Publish (core; reported).
- Contributor docs and `apps/docs` `dev/*` pages.

## Implementation

### Step 1 — Scaffolder: one package-manager module [agent]
- [x] `packages/create-vexcms/src/helpers/packageManager.ts` + `src/__tests__/packageManager.test.ts`
- [x] `src/installers/types.ts` (`"deno"`, `ResolvedPackageManager`, `ProjectOptions.packageManager`)
- [x] `src/index.ts` (`--use-*`, resolution, `displayNextSteps`), `src/utils/messages.ts`
- [x] `src/installers/base.ts` (`configurePackageManager`), integration tests (yarn/deno fixtures)
Verify: `pnpm --filter create-vexcms test` → 57/57.

### Step 2 — Templates: one package.json for every manager [agent]
- [x] `templates/base-nextjs/package.json`, `README.md` (scripts table), marketing `src/lib/metadata.ts`
Verify: `matrix.md` static columns.

### Step 3 — `vex` CLI spawns Convex through Deno [agent]
- [x] `packages/cli/src/lib/convexProcess.ts`
Verify: `pnpm --filter @vexcms/cli test` 45/45; Deno scaffold `vex dev` logs `Starting convex dev (deno)` → functions ready.

### Step 4 — Matrix run [agent]
- [x] `matrix.md`

### Step 5 — Docs [agent]
- [x] `apps/docs/package.json`, catalog, `PmCommand.astro`, `PmTabs.astro`; guides quickstart,
  deployment, caching-and-seo, versioning-and-drafts, lifecycle-hooks, adopt-existing-tables
Verify: `pnpm --filter docs build` (1087 pages), rendered tabs checked in `dist/`.

### Step 6 — READMEs [agent]
- [x] root, create-vexcms, core, better-auth, cli, file-storage-convex, next, react, richtext-plate

### Step 7 — Install command select [agent]
- [x] `apps/www/src/components/InstallCommand.tsx` (+ test), copies in `apps/test` and the marketing template
Verify: www vitest 5/5 (hydration, select switching); :3030 at 1280/375: width constant across all five.

### Step 8 — CI [agent]
- [x] `scripts/verify-scaffold.mjs --pm`, `.github/workflows/scaffold-package-managers.yml`, `release.yml`
Verify: `actionlint`; `verify-scaffold.mjs --pm` npm/pnpm/yarn@4.19.0/bun/deno all green locally.

### Step 9 — Changesets, backlog, bookkeeping [agent]
- [x] `.changeset/create-vexcms-package-managers.md`, `.changeset/cli-deno-convex-runner.md` (patch)

## Verification

`pnpm --filter create-vexcms test`, `pnpm --filter @vexcms/cli test`, www `InstallCommand` tests,
`pnpm --filter docs build`, `actionlint`, `verify-scaffold.mjs --pm <each>`, and `matrix.md`.
