---
applies_to: [".changeset/**", ".github/workflows/**", "scripts/sync-template-versions.mjs"]
---
# Release & Versioning

- All published packages (`@vexcms/*` + `create-vexcms`) version together as a FIXED
  changesets group (`.changeset/config.json`); `@vexcms/tsconfig` and `www` are ignored.
  `baseBranch: master`, `updateInternalDependencies: patch`.
- Every change to a published package needs a changeset (`pnpm changeset`) — enforced by
  the commit checklist.
- Release flow: push to master → `.github/workflows/release.yml` (pnpm + Node 22, frozen
  lockfile, build/typecheck/test) → changesets action. With pending changesets it runs
  `pnpm version:packages` (= `changeset version && node scripts/sync-template-versions.mjs`)
  and opens the "chore: version packages" PR; merging that PR leaves none, so the next run
  runs `pnpm release` (= filtered build + `changeset publish`, needs NPM_TOKEN).
- Default: don't run `pnpm version:packages` on `dev`; CI's version PR does it. Opt-in
  alternative (developer asks the `release`/`commit-release` skill to "version locally"): run
  it on `dev` as the release run's last step, after every changeset is written; `master` then
  gets no pending changesets and the merge publishes directly. Hazard either way: a changeset
  landing on `dev` between the bump and the merge makes CI bump a second time
  (`0.1.0-alpha.31` was skipped this way) — merge right after a local bump.
  After a release, merge `master` back into `dev` so the bumped versions and CHANGELOGs return.
- `scripts/sync-template-versions.mjs` reads `packages/core/package.json` version and
  rewrites every create-vexcms template's `@vexcms/*` deps to `~<version>` — templates
  always pull compatible versions post-release. The publishable package list is derived
  from the workspace (`packages/*` minus `private`), so renames need no script edit.
- The same script sets `apps/www/package.json#version` to the core version. `www` is
  changesets-ignored and consumes the packages via `workspace:*`, so its manifest would
  otherwise drift; it always ships against the latest packages, so it tracks the release
  train. Any non-`workspace:` `@vexcms/*` pin in `apps/www` is rewritten to `~<version>`.
