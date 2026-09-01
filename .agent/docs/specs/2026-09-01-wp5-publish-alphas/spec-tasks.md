---
status: draft
spec_id: 2026-09-01-wp5-publish-alphas
touches:
  - ".github/workflows/release.yml"
  - ".github/workflows/ci.yml"
  - "packages/create-vexcms/src/helpers/monorepo.ts"
  - "packages/react/src/components/RenderBlocks.tsx"
prompt_version: 1
---

# 2026-09-01-wp5-publish-alphas — Tasks

Parent: `.agent/docs/specs/2026-08-30-launch-readiness/spec.md` § WP-5.
Depends on WP-1 (✅ done — changesets confirmed, prerelease mode entered,
manifest gate already wired into `release.yml`). WP-5 step 1 of the parent plan
is therefore already satisfied; this spec covers steps 2–4.

Decisions (2026-09-01 interview): first alpha publishes **locally** via
`pnpm release` (no provenance on it — provenance requires CI OIDC; subsequent
CI publishes get it); actions pinned to **full commit SHAs**; PR CI targets
**master only** (rebuild promotes to master in WP-B); developer runs the
publish, agent verifies from a clean external directory.

## Step 1 — Fix the 10 lint errors so a lint gate can exist [agent]
Why: `pnpm lint` currently exits 1 (missing JSDoc in
`packages/create-vexcms/src/helpers/monorepo.ts` ×8 and
`packages/react/src/components/RenderBlocks.tsx` ×2 — WP-2 output). Wiring a
failing lint into CI would block the release workflow on day one.
Verify: pnpm lint
- [x] `packages/create-vexcms/src/helpers/monorepo.ts` — JSDoc on the 3 undocumented exports (with `@param props` / `@returns` as flagged)
- [x] `packages/react/src/components/RenderBlocks.tsx` — JSDoc on the flagged export (+ `@param props`)
- [x] Sweep the 5 unused `eslint-disable` directives in `packages/core/src/api/populate.test.ts` (auto-fixable; keeps `--max-warnings` viable later)

## Step 2 — Harden `.github/workflows/release.yml` [agent]
Why: the workflow that performs the real publish (fires on the WP-B push to
master) runs Node 20, mutable action tags, no provenance, no lint, and never
builds an app — app-level breakage ships silently.
Verify: test "$(grep -cE 'uses: .+@[a-f0-9]{40} # v' .github/workflows/release.yml)" = "$(grep -c 'uses:' .github/workflows/release.yml)" && grep -q "node-version: 22" .github/workflows/release.yml && grep -q "id-token: write" .github/workflows/release.yml && grep -q "NPM_CONFIG_PROVENANCE" .github/workflows/release.yml && grep -q "pnpm lint" .github/workflows/release.yml && grep -qE 'filter .?test' .github/workflows/release.yml
- [x] Pin `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `changesets/action` to full commit SHAs with `# vX.Y.Z` comments
- [x] `node-version: 20` → `22`
- [x] `permissions: id-token: write`; `NPM_CONFIG_PROVENANCE: true` as env on the changesets publish step ONLY (not in the shared `release` script — `--provenance` fails outside CI)
- [x] Add `pnpm lint` step after install
- [x] Add `--filter "test"` to the Build + Typecheck steps (apps/test; NOT www — WP-3's deliverable)
- [x] Negative check (AP-013): confirm a deliberately broken copy of the workflow fails `actionlint`/grep verify, i.e. the verify actually discriminates

## Step 3 — Add PR CI workflow `.github/workflows/ci.yml` [agent]
Why: there is no gate at all before master; WP-B branch protection has nothing
to require. Everything release.yml checks must pass on PRs, minus publish.
Verify: grep -q "pull_request" .github/workflows/ci.yml && grep -qE -- "- master" .github/workflows/ci.yml && test "$(grep -c 'check-packed-manifests' .github/workflows/ci.yml)" = 2 && test "$(grep -cE 'uses: .+@[a-f0-9]{40} # v' .github/workflows/ci.yml)" = "$(grep -c 'uses:' .github/workflows/ci.yml)" && ! grep -qE "NPM_TOKEN|id-token|pnpm publish" .github/workflows/ci.yml
- [x] New `ci.yml`: `on: pull_request` → `master`; concurrency-cancel per ref
- [x] Steps: checkout → pnpm → Node 22 (SHA-pinned, same pins as release.yml) → `pnpm install --frozen-lockfile` → build (packages + create-vexcms + docs + test) → typecheck → test → `pnpm lint` → `node scripts/check-packed-manifests.mjs` → `node scripts/check-packed-manifests.mjs --packed`
- [x] No `NPM_TOKEN`/publish/id-token anywhere in ci.yml

## Step 4 — Version + publish the first alphas [dev]
Why: many pending changesets (`wp1-release-integrity`, `render-blocks`,
`color-field`, …) must resolve to ONE `0.1.0-alpha.x` version set; the publish
itself is an irreversible registry write and needs `NPM_TOKEN` (verified absent
from the session env — `npm whoami` → 401).
Verify: npm view @vexcms/core dist-tags (shows `latest: 0.0.20` AND `alpha: 0.1.0-alpha.x`)
- [ ] `pnpm version:packages` — review the version diff (expect `0.1.0-alpha.x` across the fixed group, changesets consumed into `pre.json`), commit
- [ ] `pnpm publish -r --dry-run --no-git-checks` — banner shows `tag alpha`; no `catalog:`/`workspace:` leaks (gate: `node scripts/check-packed-manifests.mjs --packed`)
- [ ] `NPM_TOKEN=… pnpm release` — publishes all 8, then `changeset tag`; push tags

## Step 5 — Verify from a clean directory outside the repo [agent]
Why: the published tarballs, not the workspace, are the deliverable —
Objective #1 ("npm i @vexcms/core@alpha works, with types") must be proved
against the registry copy, repeating WP-0's negative test.
Verify: the scratch-project commands below all behave as stated
- [ ] In `$(mktemp -d)`: `npm i @vexcms/core@alpha convex typescript` exits 0 (npm, not pnpm — proves catalog resolution)
- [ ] `tsc` on a probe file importing `text` from `@vexcms/core` compiles clean; hover/autocomplete resolves real types, not `any`
- [ ] Negative test: `text({ required: "yes-please" })` fails with `TS2322` against the registry copy
- [ ] `npm view @vexcms/<each of 8> dist-tags` — `alpha` set, `latest` untouched (`@vexcms/core` latest still `0.0.20`)
