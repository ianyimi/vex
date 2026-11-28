---
status: in-progress
spec_id: 2026-11-27-package-manager-support
touches:
  - packages/create-vexcms/src/**
  - packages/create-vexcms/templates/base-nextjs/package.json
  - packages/create-vexcms/templates/base-nextjs/README.md
  - packages/create-vexcms/templates/marketing-site/src/components/InstallCommand.tsx
  - packages/create-vexcms/README.md
  - packages/cli/src/lib/convexProcess.ts
  - apps/www/src/components/InstallCommand.tsx
  - apps/test/src/components/InstallCommand.tsx
  - apps/docs/package.json
  - apps/docs/src/content/docs/guides/**
  - README.md
  - scripts/verify-scaffold.mjs
  - .github/workflows/scaffold-package-managers.yml
  - .changeset/*.md
prompt_version: 1
---

# 2026-11-27-package-manager-support — Tasks

Clean `create-vexcms` installs work with npm, pnpm, yarn, bun and deno, and every public
install/run command is shown per package manager. Agent-implemented (developer, 2026-11-27).

## Step 1 — Scaffolder: one package-manager module
Why: detection lives in 3 places (`base.ts` ×4 calls, `vex:update`, `lintCode`) and knows no deno;
deno writes `"packageManager": "npm@?"`; there is no override flag; every printed/README command is pnpm.
Verify: `pnpm --filter create-vexcms test` + `pnpm --filter create-vexcms build`; scaffold with each
`npm_config_user_agent` writes the right `packageManager`, `vex:update`, `.yarnrc.yml` (yarn ≥2) and README.
- [x] `src/helpers/packageManager.ts` (+ `packageManager.test.ts`): `detectPackageManager`, `packageManagerCommands`
- [x] `src/installers/types.ts`: `PackageManager` gains `"deno"`; `ProjectOptions.packageManager`
- [x] `src/index.ts`: `--use-npm|--use-pnpm|--use-yarn|--use-bun|--use-deno`, resolve once, next steps
- [x] `src/installers/base.ts`: every PM decision reads `options.packageManager`; `.yarnrc.yml`; README rewrite
- [x] `src/utils/messages.ts`: `displayNextSteps`

## Step 2 — Templates: one package.json for every manager
Why: overrides live only in the `pnpm` field → npm ERESOLVE on alpha.41; pnpm ≥11 ignores the field.
Verify: static matrix (Step 4 script) green for install on npm/pnpm 10+12/yarn 1+4/bun/deno.
- [x] `templates/base-nextjs/package.json`: npm `overrides`, yarn `resolutions`, keep `pnpm`, bun `trustedDependencies` (only if the matrix needs them)
- [x] scaffolder writes `pnpm-workspace.yaml` settings for pnpm ≥11 (only if the matrix needs it)

## Step 3 — `vex` CLI spawns Convex through the project's manager
Why: `convexProcess.ts` has no `deno.lock` row; falls back to `npx`.
Verify: `pnpm --filter @vexcms/cli test`; `vex dev` in the deno scaffold.
- [x] `packages/cli/src/lib/convexProcess.ts` (only if the matrix shows `npx` fails for a manager)

## Step 4 — Matrix run (published alpha.41, then the fixed scaffolder)
Why: the developer's acceptance: manager × template: scaffold, install, `vex dev` → `next dev`,
sign up → admin, save a document, `build` + `start`, lint.
Verify: `matrix.md` filled; every official manager green on the fixed scaffolder.
- [x] `matrix.md` (static half on alpha.41, Convex half on the fixed scaffolder)

## Step 5 — Docs: `starlight-package-managers`
Why: docs show only pnpm/npx.
Verify: `pnpm --filter docs build`; quickstart/deployment render tabs for 5 managers, synced.
- [x] `apps/docs/package.json` + catalog (lock: package.json)
- [x] guides: quickstart, deployment, caching-and-seo, agent-skills, adopt-existing-tables, versioning-and-drafts

## Step 6 — READMEs: `<details>` per manager
Verify: rendered on GitHub-flavored markdown preview (`gh markdown` or a throwaway render).
- [x] `README.md`, `packages/create-vexcms/README.md`, package READMEs with install commands

## Step 7 — `InstallCommand` package-manager switcher
Why: the hero install command is pnpm-only (developer: in scope).
Verify: www typecheck/test; :3030 hero switches managers, copy button copies the shown command, no layout shift.
- [x] `apps/www/src/components/InstallCommand.tsx`, `apps/test/...` (lock `apps/test/**`), marketing template

## Step 8 — CI matrix job
Why: developer: matrix on release + `workflow_dispatch`, plus a release-time manual Convex run-through.
Verify: `node scripts/verify-scaffold.mjs --pm npm` locally; workflow YAML parses (`actionlint` if present).
- [x] `scripts/verify-scaffold.mjs --pm <manager>`
- [x] `.github/workflows/scaffold-package-managers.yml` (lock: workflows)

## Step 9 — Changesets, backlog, bookkeeping, cleanup
Verify: `pnpm changeset status`; `~/tmp/vex-pm` deleted; board rows done.
- [x] patch changesets (P-025); backlog; board; session log; Convex project list for the developer
