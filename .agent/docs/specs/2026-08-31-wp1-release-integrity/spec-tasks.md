---
status: draft
spec_id: 2026-08-31-wp1-release-integrity
touches: []
prompt_version: 1
---

# 2026-08-31-wp1-release-integrity — Tasks

Parent: `.agent/docs/specs/2026-08-30-launch-readiness/spec.md` § WP-1.
Blocks WP-5 (publish alphas) and WP-B (promote `rebuild` → `master`, because
`release.yml` fires on push to `master`).

## Step 1 — Changesets prerelease mode + stop `docs` publishing
Why: without `pre.json` the pending changesets resolve to a stable version and
clobber the `latest` dist-tag; `apps/docs` is currently publishable and would
ship to npm as `docs`.
Verify: test "$(jq -r .mode .changeset/pre.json)" = pre && jq -e '.private == true' apps/docs/package.json >/dev/null && jq -e '.ignore | index("docs")' .changeset/config.json >/dev/null
- [x] `apps/docs/package.json` — add `"private": true`
- [x] `.changeset/config.json` — add `"docs"` to `ignore`
- [x] `pnpm changeset pre enter alpha` — commit `.changeset/pre.json`
- [x] Scratch-branch version rehearsal (see spec) — confirm 0.x-alpha, then discard

## Step 2 — Publish pipeline through pnpm + CI manifest gate
Why: `changeset publish` shells out to npm and does not resolve `catalog:`;
a leaked `catalog:` manifest is uninstallable. `pnpm publish -r` resolves it
(pnpm's documented pattern); `changeset tag` restores the git tags
changesets/action needs for GitHub releases. `publishConfig.tag: "alpha"`
keeps `latest` pointing at 0.0.19.
Verify: node scripts/check-packed-manifests.mjs && pnpm publish -r --dry-run --no-git-checks
- [x] 8 publishable manifests — `publishConfig.tag: "alpha"`
- [x] root `package.json` — `release` script: `pnpm publish -r` + `changeset tag`
- [x] `.github/workflows/release.yml` — `node scripts/check-packed-manifests.mjs` step before the changesets action
- [x] `pnpm publish -r --dry-run` rehearsal + negative gate test

## Step 3 — LICENSE, NOTICE, manifest metadata, stale licence claims
Why: README claims Apache-2.0 but no LICENSE file exists; npm pages need
`license`/`repository`/`description` to render trustworthy package pages, and
`roadmap.md` still contradicts D9 with "MIT core forever".
Verify: node scripts/check-packed-manifests.mjs --packed && test -f LICENSE && test -f NOTICE && ! grep -qiE "MIT Licensed|MIT core" README.md .agent/docs/product/roadmap.md && for d in core react next cli better-auth file-storage-convex richtext-plate create-vexcms; do jq -e '.license == "Apache-2.0"' packages/$d/package.json >/dev/null || exit 1; done
- [x] `LICENSE` — full Apache-2.0 text (new)
- [x] `NOTICE` — VexCMS / Copyright 2026 Isaiah Anyimi (new)
- [x] 8 publishable manifests — `license`, `repository` (+ `directory`), `homepage`, `description`, `keywords`, `author`; `sideEffects: false` only where verified side-effect-free
- [x] `.agent/docs/product/roadmap.md` — replace "MIT core forever" with Apache-2.0 wording
- [x] Confirm WP-0/WP-A/WP-C changesets present (already verified: `ship-type-declarations.md`, `bound-published-peer-ranges.md`, `color-field.md`) — no new changeset needed
