---
applies_to: [".changeset/**", ".github/workflows/**", "scripts/sync-template-versions.mjs"]
---
# Release & Versioning

- All published packages (`@vexcms/*` + `create-vexcms`) version together as a FIXED
  changesets group (`.changeset/config.json`); `@vexcms/tsconfig` and `www` are ignored.
  `baseBranch: master`, `updateInternalDependencies: patch`.
- Every change to a published package needs a changeset (`pnpm changeset`) — enforced by
  the commit checklist.
- Release flow: push to master → `.github/workflows/release.yml` (pnpm + Node 20, frozen
  lockfile, build/typecheck/test) → changesets action runs
  `pnpm version:packages` (= `changeset version && node scripts/sync-template-versions.mjs`)
  and `pnpm release` (= filtered build + `changeset publish`, needs NPM_TOKEN).
- `scripts/sync-template-versions.mjs` reads `packages/core/package.json` version and
  rewrites every create-vexcms template's `@vexcms/*` deps to `~<version>` — templates
  always pull compatible versions post-release. NOTE: its internal package list contains
  stale names (`@vexcms/admin-next`, `@vexcms/ui`, `@vexcms/richtext`) — verify/refresh the
  list when touching this script.
