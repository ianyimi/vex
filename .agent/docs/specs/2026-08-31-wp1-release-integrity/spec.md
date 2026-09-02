---
status: draft
spec_id: 2026-08-31-wp1-release-integrity
touches:
  - LICENSE
  - NOTICE
  - package.json
  - apps/docs/package.json
  - packages/*/package.json
  - .changeset/config.json
  - .changeset/pre.json
  - .github/workflows/release.yml
  - .agent/docs/product/roadmap.md
prompt_version: 1
---

# 2026-08-31-wp1-release-integrity — Spec

## Overview

WP-1 of the launch-readiness plan (`.agent/docs/specs/2026-08-30-launch-readiness/spec.md`).
Makes the release pipeline safe to fire: `docs` can no longer publish, changesets
run in alpha prerelease mode, the `latest` dist-tag stays on 0.0.19, publishing
goes through pnpm (the only tool that resolves `catalog:`), and the repo finally
carries the Apache-2.0 LICENSE its README already claims. Blocks WP-5 (publish)
and WP-B (branch promotion — `release.yml` triggers on push to `master`).

## Design Decisions

1. **Target version line is `0.x.y-alpha.n`, never `1.0.0` (developer-confirmed).**
   All pending changesets are `minor`/`patch` (verified: no `major` changeset file
   exists), and package.json versions already sit at `0.1.0-alpha.1`. Yet
   `changeset status` reports "bumped at major" — Step 1 therefore rehearses
   `changeset version` on a throwaway branch and **aborts if any package would
   reach 1.0.0** before anything is committed. Do not trust the status label;
   trust the rehearsal diff.
2. **Publish via `pnpm publish -r` + `changeset tag`, not `changeset publish`
   (developer-confirmed).** `changeset publish` shells out to npm, which cannot
   resolve `catalog:` — the published manifest would be uninstallable
   (`Unsupported URL Type "catalog:"`). `pnpm publish -r` resolves `catalog:`
   and `workspace:` and is pnpm's documented changesets pattern; `changeset tag`
   afterwards creates the git tags `changesets/action` needs for GitHub releases.
3. **`publishConfig.tag: "alpha"` in every publishable manifest**, so no publish
   path (CI or a stray manual `pnpm publish`) can move `latest` off 0.0.19.
   `pnpm publish -r` honors `publishConfig.tag`.
4. **Licence is Apache-2.0** (parent D9, decided). Copyright holder: **Isaiah
   Anyimi** (developer-confirmed). NOTICE file per Apache-2.0 redistribution
   convention.
5. **Reuse `scripts/check-packed-manifests.mjs` as the CI gate** (parent WP-A
   directive: "do not write a second one"). Wiring it into `release.yml` before
   the changesets action is the entire CI change.
6. **`sideEffects: false` only where verified.** No `.css` files exist in any
   package `src/` (globbed), but each package must also be checked for bare
   side-effect imports (`import "x"`) before the flag is set — a wrong
   `sideEffects: false` lets bundlers tree-shake live code.
7. **README is already Apache-2.0** (WP-4 fixed it — verified lines 7, 327).
   Only `.agent/docs/product/roadmap.md:40` still claims MIT.
8. **WP-0/WP-A/WP-C changesets already exist** (`ship-type-declarations.md`,
   `bound-published-peer-ranges.md`, `color-field.md`) — parent step 6 is a
   verification, not new work.

## Out of Scope

- Actually publishing (WP-5) and promoting `rebuild` → `master` (WP-B).
- Any auth version change (parent D1).
- PR CI workflow / branch protection (WP-5 / WP-B).
- Relicensing anything already on npm — 0.0.x stays as published.
- The roadmap's BSL enterprise tier question (parent: off the site, out of scope).

## Implementation

All steps `[agent]` — mechanical config edits; developer reviews the diff.
Build/test are untouched by every step (config + metadata only), so the tree
stays green throughout.

### Step 1 — Changesets prerelease mode + stop `docs` publishing

`[agent]`

- [ ] `apps/docs/package.json` — add `"private": true`
- [ ] `.changeset/config.json` — add `"docs"` to `ignore`
- [ ] Run `pnpm changeset pre enter alpha`; commit `.changeset/pre.json`
- [ ] Version rehearsal on a scratch branch; abort on any 1.0.0

#### apps/docs/package.json

One edit; everything not shown is unchanged.

**1 — privatize.** Beside the existing `"name": "docs"` field:

```json
"private": true,
```

#### .changeset/config.json

One edit; everything not shown is unchanged.

**1 — ignore docs.** Extend the existing `ignore` array:

```json
"ignore": ["@vexcms/tsconfig", "www", "docs"]
```

#### .changeset/pre.json

Generated — never hand-written. Produced by:

```sh
pnpm changeset pre enter alpha
```

**Version rehearsal** (proves Decision 1 before anything can publish):

```sh
git checkout -b scratch/version-rehearsal
pnpm changeset version   # runs sync-template-versions.mjs too — fine, discarded
git diff --stat           # inspect: every version 0.x.y-alpha.n, no 1.0.0, no docs
git checkout - && git branch -D scratch/version-rehearsal && git checkout -- .
```

If any package would reach `1.0.0-alpha.x`, stop and find the changeset (or
`fixed`-group interaction) responsible before proceeding.

Verify:

```sh
pnpm changeset status   # docs absent; pre mode active
```

plus the rehearsal diff above showing only `0.x.y-alpha.n` versions.

### Step 2 — Publish pipeline through pnpm + CI manifest gate

`[agent]`

- [ ] All 8 publishable manifests — `publishConfig.tag: "alpha"`
- [ ] Root `package.json` — rewrite `release` script
- [ ] `.github/workflows/release.yml` — add the packed-manifest gate step
- [ ] Dry-run rehearsal + negative gate test (AP-013)

#### packages/core/package.json

One edit, repeated identically in all 8 publishable manifests (`core`, `react`,
`next`, `cli`, `better-auth`, `file-storage-convex`, `richtext-plate`,
`create-vexcms`). Everything not shown is unchanged.

**1 — dist-tag.** Extend the existing `publishConfig` object:

```json
"publishConfig": {
  "access": "public",
  "tag": "alpha"
}
```

#### package.json

One edit; everything not shown is unchanged.

**1 — release script.** Replace the existing `release` script value
(`… && changeset publish`):

```json
"release": "pnpm --filter \"@vexcms/*\" --filter \"create-vexcms\" build && pnpm publish -r --no-git-checks && changeset tag"
```

`--no-git-checks` because `changesets/action` runs on a detached-HEAD-adjacent
CI checkout where pnpm's clean-branch check false-positives; the workflow itself
only runs on push to `master`.

#### .github/workflows/release.yml

One edit; everything not shown is unchanged.

**1 — packed-manifest gate.** Between the `Test Packages` step and the
`Create Release PR or Publish` step:

```yaml
- name: Check Packed Manifests
  run: node scripts/check-packed-manifests.mjs
```

(Runs both its checks — catalog sweep and `--packed` pack-shape — failing on any
unresolved `catalog:`/`workspace:`, exact peer, or ranged dependency.)

Verify:

```sh
node scripts/check-packed-manifests.mjs        # green
pnpm publish -r --dry-run --no-git-checks      # all 8 resolve; tag alpha; no catalog:
```

Negative test (AP-013 — a gate is proven by making it fail): temporarily change
one `dependencies` entry in `packages/core/package.json` from `catalog:` to a
range like `^5.0.0`, rerun `node scripts/check-packed-manifests.mjs`, require
exit 1, then revert.

### Step 3 — LICENSE, NOTICE, manifest metadata, stale licence claims

`[agent]`

- [ ] `LICENSE` (new) — full Apache-2.0 text
- [ ] `NOTICE` (new)
- [ ] All 8 publishable manifests — metadata fields
- [ ] `.agent/docs/product/roadmap.md` — fix "MIT core forever"
- [ ] Confirm WP-0/WP-A/WP-C changesets present (no new work — Decision 8)

#### LICENSE

The verbatim Apache License 2.0 text from <https://www.apache.org/licenses/LICENSE-2.0.txt>
(do not retype; fetch and commit unmodified, including the appendix).

#### NOTICE

```text
VexCMS
Copyright 2026 Isaiah Anyimi

This product includes software developed as part of the VexCMS project
(https://github.com/ianyimi/vex).
```

#### packages/core/package.json

One edit per manifest; everything not shown is unchanged. Field values below are
for `core`; the table that follows gives the per-package `description`,
`keywords`, and `repository.directory`. `homepage` is
`https://docs.vexcms.dev` and `author` is `"Isaiah Anyimi"` everywhere.

**1 — metadata.** Beside the existing `version` field:

```json
"description": "Convex-native headless CMS core: field factories, schema generation, and typed collection APIs",
"keywords": ["cms", "headless-cms", "convex", "typescript"],
"license": "Apache-2.0",
"author": "Isaiah Anyimi",
"homepage": "https://docs.vexcms.dev",
"repository": {
  "type": "git",
  "url": "git+https://github.com/ianyimi/vex.git",
  "directory": "packages/core"
},
"sideEffects": false,
```

Set `sideEffects: false` **only after** confirming the package has no bare
side-effect imports:

```sh
grep -rn 'import "' packages/<pkg>/src packages/<pkg>/dist --include="*.ts" --include="*.tsx" --include="*.js"
```

Any hit (CSS, polyfill, global registration) → omit the flag for that package.

| package | directory | description | extra keywords |
| --- | --- | --- | --- |
| `@vexcms/core` | `packages/core` | (above) | — |
| `@vexcms/react` | `packages/react` | React admin components and hooks for VexCMS | `react`, `admin` |
| `@vexcms/next` | `packages/next` | Next.js adapter and admin routes for VexCMS | `nextjs` |
| `@vexcms/cli` | `packages/cli` | VexCMS CLI: dev server orchestration and type generation | `cli` |
| `@vexcms/better-auth` | `packages/better-auth` | better-auth adapter for VexCMS on Convex | `auth`, `better-auth` |
| `@vexcms/file-storage-convex` | `packages/file-storage-convex` | Convex file-storage adapter for VexCMS uploads | `storage` |
| `@vexcms/richtext-plate` | `packages/richtext-plate` | Plate rich-text editor integration for VexCMS | `richtext`, `plate` |
| `create-vexcms` | `packages/create-vexcms` | Scaffold a new VexCMS project | `create`, `scaffold` |

Note `.npmrc` sets `save-exact=true` — irrelevant here (no installs), listed for
completeness per the parent spec.

#### .agent/docs/product/roadmap.md

One edit; everything not shown is unchanged.

**1 — licence claim.** In the `**License / monetization:**` line, replace
`MIT core forever` with `Apache-2.0 core forever` (rest of the sentence — all
fields, admin panel, CLI, drafts, RBAC — unchanged).

Verify:

```sh
for d in core react next cli better-auth file-storage-convex richtext-plate create-vexcms; do
  (cd packages/$d && pnpm pack --out /tmp/wp1-$d.tgz >/dev/null && tar -xOzf /tmp/wp1-$d.tgz package/package.json | jq -r '.name + " " + .license')
done                                             # all "Apache-2.0"
test -f LICENSE && test -f NOTICE
grep -rin "MIT" README.md .agent/docs/product/roadmap.md   # no licence claim remains
node scripts/check-packed-manifests.mjs                     # still green
```

## Verification

```sh
pnpm build && pnpm typecheck && pnpm test   # unchanged — 933 tests stay green
pnpm changeset status                        # pre mode, docs absent
pnpm publish -r --dry-run --no-git-checks    # resolved manifests, tag alpha
node scripts/check-packed-manifests.mjs      # both gates green
```

Parent accept criteria covered: `docs` never publishes (Step 1), prerelease mode
on (Step 1), `latest` protected by `tag: alpha` (Step 2), pnpm-only publish +
CI gate (Step 2), LICENSE/NOTICE/metadata + no MIT claims (Step 3).
