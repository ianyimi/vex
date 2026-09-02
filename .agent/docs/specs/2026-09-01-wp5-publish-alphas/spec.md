---
status: draft
spec_id: 2026-09-01-wp5-publish-alphas
touches:
  - ".github/workflows/release.yml"
  - ".github/workflows/ci.yml"
  - "packages/create-vexcms/src/helpers/monorepo.ts"
  - "packages/react/src/components/RenderBlocks.tsx"
  - "packages/core/src/api/populate.test.ts"
  - "packages/*/package.json"
  - "packages/*/CHANGELOG.md"
  - ".changeset/*"
prompt_version: 1
---

# 2026-09-01-wp5-publish-alphas — Spec

## Overview

WP-5 of the launch-readiness plan: publish the first `0.1.0-alpha.x` packages
to npm. WP-1 already delivered the release-integrity substrate (prerelease
mode, `publishConfig.tag: "alpha"`, `pnpm publish -r` pipeline, the
`check-packed-manifests.mjs` gate in `release.yml`), so this spec covers the
parent plan's steps 2–4: harden `release.yml`, add the missing PR CI gate
(required for WP-B branch protection), then version, publish, and prove the
registry copies work from a clean directory — Objective #1 of the meetup plan.

## Design Decisions

1. **First alpha publishes locally via `pnpm release`; CI publishes later.**
   Fastest and fully controlled before the meetup. Consequence: the first alpha
   carries no provenance badge — `--provenance` requires GitHub Actions OIDC.
   Subsequent publishes fire from `release.yml` (WP-B master push) and get it.
2. **Provenance is workflow-only config** — `NPM_CONFIG_PROVENANCE: "true"` as
   env on the changesets publish step, never in the shared `release` script,
   which must keep working from a laptop.
3. **Actions pinned to full commit SHAs** with `# vX.Y.Z` comments — consistent
   with WP-A's supply-chain posture; mutable tags can be repointed silently.
4. **PR CI targets `master` only.** `rebuild` promotes to `master` in WP-B, so
   one target branch covers the future; no gate wasted on the dying branch name.
5. **Node 22 in both workflows** (TS 6 / Next 16 / Astro 6 per parent plan);
   pnpm version comes from `package.json#packageManager` — never hardcoded in
   a workflow (P-015: one source of version truth).
6. **`release.yml` builds `apps/test`, not `apps/www`** — `www` is WP-3's
   deliverable; coupling the release gate to in-flight work breaks the
   pipeline for no signal.
7. **Fix the 10 lint errors instead of weakening the gate.** A lint step that
   ships red on day one, or runs `--quiet`, is a fake gate (AP-013 spirit).
8. **Developer runs the publish; agent verifies.** The registry write is
   irreversible and needs `NPM_TOKEN` (absent from the session env, verified
   `npm whoami` → 401); matches `commit_mode: message-only`.

## Out of Scope

- `apps/www` in any CI build filter (WP-3).
- WP-B branch promotion and branch-protection settings themselves — this spec
  only creates the required status checks.
- Provenance for the *first* alpha (decision 1).
- Any auth version change (D1), any new changesets — WP-0/WP-A/WP-C changesets
  exist and were verified in WP-1.
- Flipping `apps/www` to `@alpha` dependencies (WP-6, D4).
- Fixing the 106 lint *warnings* (`no-explicit-any` etc.) — errors only.

## Implementation

### Step 1 — Fix the 10 lint errors so a lint gate can exist [agent]

`pnpm lint` currently exits 1. Three exported functions in
`packages/create-vexcms/src/helpers/monorepo.ts` already carry a JSDoc
description but take their single `props: XxxProps` parameter as a plain
(non-destructured) identifier, so `jsdoc/require-param` (`"error"` in
`eslint.config.mjs`) unconditionally demands a `@param props` tag regardless
of the `checkDestructuredRoots: false` setting — that option only exempts
actual destructuring syntax (`function f({ a, b })`), which none of these
functions use. Two of the three are also missing `@returns`
(`jsdoc/require-returns`, `"error"`). `RenderBlocks` in
`packages/react/src/components/RenderBlocks.tsx` has the same gap: its doc
comment documents `@param props.blocks` / `.components` / `.fallback` but
never declares the root `@param props` those hang off. Separately,
`packages/core/src/api/populate.test.ts` carries five
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments;
`eslint.config.mjs`'s main rules block sets `@typescript-eslint/no-explicit-any`
but `ignores: ["**/*.test.ts", "**/*.test.tsx", ...]`, and the `**/*.test.ts`
override block that follows never re-enables that rule — it never fires in
this file, so every one of these five directives is reported as an unused
`eslint-disable` (auto-fixable). Wiring a red `pnpm lint` into CI (Step 2/3)
would block the release workflow on day one.

- [ ] `packages/create-vexcms/src/helpers/monorepo.ts` — JSDoc on the 3 undocumented exports (with `@param props` / `@returns` as flagged)
- [ ] `packages/react/src/components/RenderBlocks.tsx` — JSDoc on the flagged export (+ `@param props`)
- [ ] Sweep the 5 unused `eslint-disable` directives in `packages/core/src/api/populate.test.ts` (auto-fixable; keeps `--max-warnings` viable later)

#### packages/create-vexcms/src/helpers/monorepo.ts

Three edits; everything not shown is unchanged. Each function's `props`
object is a separately-declared, already-documented interface
(`FindWorkspaceRootProps`, `ReadWorkspaceCatalogProps`,
`RewriteManifestForMonorepoProps` — every property already has its own
`/** ... */`), so each fix adds only the bare `@param props` line, never a
duplicate nested `@param props.x` per property.

**1 — `findWorkspaceRoot`.** Insert directly before the existing `@returns`
line:

```ts
 * @param props - Input props.
```

**2 — `readWorkspaceCatalog`.** Insert before the closing `*/` (no `@returns`
currently exists):

```ts
 * @param props - Input props.
 * @returns The workspace's default `catalog:` map as package name → pinned
 *   version; `{}` when the block is missing or empty.
```

**3 — `rewriteManifestForMonorepo`.** Insert before the closing `*/`, after
the existing "Pure — takes and returns plain objects, performs no I/O." line:

```ts
 * @param props - Input props.
 * @returns The rewritten manifest — `@vexcms/*` deps as `workspace:*`,
 *   catalog-matched deps as `catalog:`, everything else untouched — sorted
 *   via `sort-package-json`.
```

#### packages/react/src/components/RenderBlocks.tsx

One edit; everything not shown is unchanged. The doc comment above
`RenderBlocks` already has `@param props.blocks`, `@param props.components`,
and `@param props.fallback`, but never declares the `props` parameter itself.

**1 — `RenderBlocks`.** Insert directly before the existing `@param
props.blocks` line:

```tsx
 * @param props - Blocks value, per-type renderer map, and optional fallback.
```

#### packages/core/src/api/populate.test.ts

Five deletions; everything else unchanged. Each removes only the
`// eslint-disable-next-line @typescript-eslint/no-explicit-any` comment line;
the code line beneath it is untouched.

**1 — `"populates a single relationship field"`.** Remove the directive
directly above `const populated = (result as any[])[0].author as
DocumentBySlug["authors"][];` (line 40).

**2 — `"recurses into nested populate (2 levels)"`.** Remove the directive
directly above `const author = ((result as any[])[0].author as
DocumentBySlug["authors"][])[0];` (line 63).

**3 — `"recurses 5 levels deep using self-referencing parent (D12)"`.** Remove
the directive directly above `let cursor: any = result[0];` (line 107).

**4 — `"skips fields that are missing or not arrays"`.** Remove the directive
directly above `expect((result as any[])[0].author).toBeUndefined();`
(line 127).

**5 — `"filters out missing target docs (deleted ids)"`.** Remove the
directive directly above `expect(((result as any[])[0].author as
DocumentBySlug["authors"][]).length).toBe(0);` (line 145).

All five are also reachable in one shot via `pnpm --filter @vexcms/core exec eslint src/api/populate.test.ts --fix` (unused-disable-directive removal is one of eslint's auto-fixes), but the developer may prefer the explicit five-line diff above for review.

Verify: pnpm lint

### Step 2 — Harden `.github/workflows/release.yml` [agent]

Why: the workflow that performs the real publish (fires on the WP-B push to
master) runs Node 20, mutable action tags, no provenance, no lint, and never
builds an app — app-level breakage ships silently.

- [ ] Pin `actions/checkout`, `pnpm/action-setup`, `actions/setup-node`, `changesets/action` to full commit SHAs with `# vX.Y.Z` comments
- [ ] `node-version: 20` → `22`
- [ ] `permissions: id-token: write`; `NPM_CONFIG_PROVENANCE: true` as env on the changesets publish step ONLY (not in the shared `release` script — `--provenance` fails outside CI)
- [ ] Add `pnpm lint` step after install
- [ ] Add `--filter "test"` to the Build + Typecheck steps (apps/test; NOT www — WP-3's deliverable)
- [ ] Negative check (AP-013): confirm a deliberately broken copy of the workflow fails the grep verify, i.e. the verify actually discriminates

The edits touch every step in this 55-line file (action pins, permissions, a
new step, two filter changes), so the block below is the **complete
replacement file** rather than numbered anchored edits.

#### .github/workflows/release.yml

_Replaces the file in full._

```yaml
name: Release

on:
  push:
    branches:
      - master

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Build Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" --filter "docs" --filter "test" build

      - name: Typecheck Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" --filter "docs" --filter "test" typecheck

      - name: Test Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" test

      - name: Check Packed Manifests
        run: node scripts/check-packed-manifests.mjs

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0
        with:
          version: pnpm version:packages
          publish: pnpm release
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: "true"
```

What changed vs. the original 55-line file: all four `uses:` tags became
full-SHA pins (with the original `@vX` tag preserved as a trailing comment);
`node-version` moved from `20` to `22`; `id-token: write` was added to the
job's `permissions` block; a `Lint` step (`pnpm lint`) was inserted between
`Install dependencies` and `Build Packages`; `--filter "test"` was appended to
the `Build Packages` and `Typecheck Packages` `run:` lines (apps/test only —
`www` is WP-3's deliverable and stays out); `NPM_CONFIG_PROVENANCE: "true"`
was added to the `env:` block of the `Create Release PR or Publish` step only
(never into the shared `release` script, which also runs locally without CI
OIDC). The `Test Packages` step and `Check Packed Manifests` step are
unchanged from the original.

Verify:

```sh
# Positive: every uses: line is SHA-pinned, and every other flag is present.
grep -E "uses: .+@[a-f0-9]{40}" .github/workflows/release.yml | wc -l | \
  grep -qx "$(grep -c 'uses:' .github/workflows/release.yml)" && echo "PIN COUNT OK"
grep -q "node-version: 22" .github/workflows/release.yml && echo "NODE22 OK"
grep -q "id-token: write" .github/workflows/release.yml && echo "IDTOKEN OK"
grep -q "NPM_CONFIG_PROVENANCE" .github/workflows/release.yml && echo "PROVENANCE OK"
grep -q "pnpm lint" .github/workflows/release.yml && echo "LINT OK"
grep -qE 'filter .?test' .github/workflows/release.yml && echo "FILTER TEST OK"

# Negative (AP-013): a deliberately broken copy (one action reverted to a
# mutable tag) MUST fail the pin-count check, proving the positive check
# above actually discriminates rather than trivially passing.
sed 's|actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0|actions/checkout@v4|' \
  .github/workflows/release.yml > /tmp/release-broken.yml
COUNT=$(grep -E "uses: .+@[a-f0-9]{40}" /tmp/release-broken.yml | wc -l | tr -d ' ')
TOTAL=$(grep -c "uses:" /tmp/release-broken.yml | tr -d ' ')
[ "$COUNT" != "$TOTAL" ] && echo "NEGATIVE CHECK OK (broken copy correctly fails: $COUNT != $TOTAL)" || { echo "NEGATIVE CHECK FAILED — verify does not discriminate"; exit 1; }
rm -f /tmp/release-broken.yml
```

Both branches were executed against the workflow content above: the positive
block printed all six `OK` lines (4 SHA-pinned `uses:` lines out of 4 total),
and the negative block confirmed the tag-pinned copy drops to 3/4 and
correctly fails the equality check. YAML validity was confirmed with
`js-yaml` (`yaml.load` parses cleanly, top-level keys `name`, `on`,
`concurrency`, `jobs`).

### Step 3 — Add PR CI workflow `.github/workflows/ci.yml` [agent]
- [ ] New `ci.yml`: `on: pull_request` → `master`; concurrency-cancel per ref
- [ ] Steps: checkout → pnpm → Node 22 (SHA-pinned, same pins as release.yml) → `pnpm install --frozen-lockfile` → build (packages + create-vexcms + docs + test) → typecheck → test → `pnpm lint` → `node scripts/check-packed-manifests.mjs` → `node scripts/check-packed-manifests.mjs --packed`
- [ ] No `NPM_TOKEN`/publish/id-token anywhere in ci.yml

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  pull_request:
    branches:
      - master

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  ci:
    name: CI
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" --filter "docs" --filter "test" build

      - name: Typecheck Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" --filter "docs" --filter "test" typecheck

      - name: Test Packages
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" test

      - name: Lint
        run: pnpm lint

      - name: Check Packed Manifests
        run: node scripts/check-packed-manifests.mjs

      - name: Check Packed Manifests (packed)
        run: node scripts/check-packed-manifests.mjs --packed
```

Verify: `grep -q "pull_request" .github/workflows/ci.yml && grep -qE "branches:.*master|- master" .github/workflows/ci.yml && grep -c "check-packed-manifests" .github/workflows/ci.yml | grep -q 2 && grep -E "uses: .+@[a-f0-9]{40}" .github/workflows/ci.yml | wc -l` equals the file's `uses:` line count (3, all SHA-pinned) `&& ! grep -qE "NPM_TOKEN|id-token|pnpm release|pnpm publish" .github/workflows/ci.yml` (confirms no publish/token surface leaked in — this is the negative check that the gate actually discriminates release.yml from ci.yml). All greps executed against the drafted file and confirmed passing; `actionlint` was checked via `which actionlint` and is not installed in this environment, so it is omitted from the gate rather than assumed.

### Step 4 — Version + publish the first alphas [dev]

Why: many pending changesets (`wp1-release-integrity`, `render-blocks`, `color-field`, …) must resolve to ONE `0.1.0-alpha.x` version set; the publish itself is an irreversible registry write and needs `NPM_TOKEN` (verified absent from the session env — `npm whoami` → 401).

This step is a developer-run command sequence against the working tree — no application code changes. `commit_mode` is `message-only`: the developer reviews and commits the version-bump diff produced by stage 1 themselves; nothing here auto-commits.

- [ ] `pnpm version:packages` — review the version diff (expect `0.1.0-alpha.x` across the fixed group, changesets consumed into `pre.json`), commit
- [ ] `pnpm publish -r --dry-run --no-git-checks` — banner shows `tag alpha`; no `catalog:`/`workspace:` leaks (gate: `node scripts/check-packed-manifests.mjs --packed`)
- [ ] `NPM_TOKEN=… pnpm release` — publishes all 8, then `changeset tag`; push tags

**Stage 1 — bump the fixed group and consume changesets.**

```bash
pnpm version:packages
```

Runs `changeset version && node scripts/sync-template-versions.mjs` (root `package.json#scripts.version:packages`). Expected output/effects:

- Changesets CLI prints one bump line per package in the `fixed` group from `.changeset/config.json` (`@vexcms/core`, `@vexcms/react`, `@vexcms/next`, `@vexcms/cli`, `@vexcms/better-auth`, `@vexcms/file-storage-convex`, `@vexcms/richtext-plate`, `create-vexcms`) — all landing on the SAME next `0.1.0-alpha.x` (fixed-group packages always move together).
- Every pending changeset `.md` file under `.changeset/` (`wp1-release-integrity.md`, `render-blocks.md`, `color-field.md`, `create-vexcms-templates.md`, `drop-collection-generation.md`, `drop-collection-query-stub.md`, `mediaapi-props-jsdoc.md`, `bound-published-peer-ranges.md`, `ship-type-declarations.md`, `lucide-icon-name-exact.md`, `server-api-access-options.md`, `anon-role-fallback.md`, `rbac-admin-gate.md`, `rbac-access-control.md`, `globals-system.md`, `typedoc-multipackage-docs.md`) is deleted — consumed into a single changelog entry per package.
- `.changeset/pre.json` is rewritten: `changesets: []` (drained) — `initialVersions` stays fixed at the pre-mode entry point, unaffected.
- Each bumped package's `CHANGELOG.md` gains one new `## 0.1.0-alpha.x` heading; `package.json#version` updates in each of the 8 manifests.
- `scripts/sync-template-versions.mjs` then rewrites the `create-vexcms` scaffold templates' pinned `@vexcms/*` versions to match.
- `.changeset/tsconfig`/`docs`/`test` packages do NOT move (`ignore` list in `.changeset/config.json`).

Review `git diff` before committing: expect changes confined to `**/package.json` (version bump + any `updateInternalDependencies: patch` cross-bumps), `**/CHANGELOG.md`, the deleted changeset `.md` files, `.changeset/pre.json`, and the synced template files — nothing under `src/`. Commit with a message like `chore: version packages` (developer commits directly; no agent-generated commit here).

**Stage 2 — dry-run pack and publish gate.**

```bash
node scripts/check-packed-manifests.mjs --packed
pnpm publish -r --dry-run --no-git-checks
```

`check-packed-manifests.mjs --packed` selects only the `checkPacked` check (id `packed`): it `pnpm pack`s each of the 8 publishable packages into an isolated temp dir, extracts `package/package.json` from the tarball, and asserts none of `dependencies`/`peerDependencies` still reads `catalog:`/`workspace:` and no `dependencies` entry is a semver range. Expected: exit 0, no violation lines printed.

`pnpm publish -r --dry-run --no-git-checks` then simulates the real publish. Expected output per package: a `Tarball Contents` / `Package size` banner containing `tag alpha` (from each package's `publishConfig.tag: "alpha"`, already set on all 8 — WP-1), all 8 package names listed (`@vexcms/core`, `@vexcms/react`, `@vexcms/next`, `@vexcms/cli`, `@vexcms/better-auth`, `@vexcms/file-storage-convex`, `@vexcms/richtext-plate`, `create-vexcms`), and no `catalog:`/`workspace:` strings anywhere in the printed manifest contents. `--dry-run` performs no network write. `--no-git-checks` is required here only because the working tree still carries the stage-1 commit ahead of the last published tag — it does not disable any of the checks above.

If either command fails, stop — do not proceed to stage 3. A `--packed` violation means a dependency spec did not resolve during packing (fix the offending package's `dependencies`/`peerDependencies` declaration, re-run stage 1 is NOT needed, just re-run this gate after the fix and a fresh commit).

**Stage 3 — publish and tag.**

```bash
NPM_TOKEN=<token> pnpm release
git push --tags
```

`pnpm release` runs (root `package.json#scripts.release`): `pnpm --filter "@vexcms/*" --filter "create-vexcms" build && pnpm publish -r --no-git-checks --tag alpha && changeset tag`. Expected:

1. Turbo builds all 8 publishable packages (no `--dry-run` this time).
2. `pnpm publish -r --no-git-checks --tag alpha` publishes all 8 to the registry with the `alpha` dist-tag (NOT `latest` — `publishConfig.tag` on each package already pins this; the `--tag alpha` CLI flag reinforces it). No `NPM_CONFIG_PROVENANCE` is set for this local run — this publish carries **no provenance** by design (provenance requires CI OIDC; see Step 2's `release.yml` env, which applies only to the CI-run changesets publish, not this command). Expected per-package output line: `+ @vexcms/<name>@0.1.0-alpha.x`.
3. `changeset tag` creates one local git tag per published package version (e.g. `@vexcms/core@0.1.0-alpha.x`).
4. `git push --tags` pushes those tags to the remote.

Failure modes:

- **Missing/invalid `NPM_TOKEN`**: `npm whoami` (or the first `pnpm publish` call) returns `401 Unauthorized` / `ENEEDAUTH`; nothing is published. Set `NPM_TOKEN` (or run `npm login` interactively) and re-run — safe, nothing partial happened yet.
- **2FA/OTP prompt**: if the npm account requires two-factor auth for publish, `pnpm publish -r` blocks waiting for an OTP on a TTY; a non-interactive `NPM_TOKEN=…` run instead fails with `EOTP`. Either run the command in an interactive shell to supply the OTP, or use an automation token with 2FA-on-publish disabled for this account.
- **Partial publish (crash/network failure mid-run)**: `pnpm publish -r` is safe to re-run as-is — it skips any package version that the registry already has published (each already-published package prints something like `"@vexcms/core@0.1.0-alpha.x" is already published` and is skipped, not re-uploaded) and publishes only the remaining ones. Re-running `pnpm release` (which rebuilds first) is likewise safe; the build step is idempotent.
- **`changeset tag` runs but `git push --tags` is forgotten**: tags exist locally only; re-run `git push --tags` — idempotent, pushes only new tags.

Verify: `npm view @vexcms/core dist-tags` (shows `latest: 0.0.20` — unchanged — AND `alpha: 0.1.0-alpha.x`)

### Step 5 — Verify from a clean directory outside the repo [agent]

Why: the published tarballs, not the workspace, are the deliverable — Objective
#1 ("npm i @vexcms/core@alpha works, with types") must be proved against the
registry copy, repeating WP-0's negative test.

- [ ] `cd $(mktemp -d)`; `npm init -y`; `npm i @vexcms/core@alpha convex typescript` — exits 0, using **npm** (not pnpm) so the installed manifest is resolved with no workspace/catalog awareness at all, proving `catalog:`/`workspace:` specifiers were rewritten to real semver before publish
- [ ] Write `probe-valid.ts` and `probe-invalid.ts` (below) into the scratch dir
- [ ] `npx tsc --strict --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --noEmit probe-valid.ts` — exits 0 (real types resolve, not `any`)
- [ ] Same `tsc` invocation on `probe-invalid.ts` — exits 1, output contains `TS2322`
- [ ] `node -e "..."` dynamic-import smoke test — logs `true function` and exits 0
- [ ] Dist-tag sweep over all 8 published package names — each reports `alpha` in `dist-tags`; `@vexcms/core`'s `latest` is still `0.0.20`

The probes run `tsc` with explicit CLI flags instead of a `tsconfig.json` —
`tsc --project` cannot be mixed with file arguments, and the two probes need
separate runs (one must fail). `--moduleResolution bundler` is required
because `@vexcms/core`'s `package.json#exports` only declares `"types"` +
`"import"` conditions (no `"require"`, `type: "module"`) — the classic
`"node"` resolver predates conditional exports and would silently fall
through to untyped resolution; `bundler` (or `node16`/`nodenext`) reads the
exports map's `types` condition correctly. `--strict` is what makes the
negative probe fail with `TS2322` instead of silently widening to `any`.

#### probe-valid.ts

Exercises `text()` from `@vexcms/core`'s real signature
(`packages/core/src/fields/text/config.ts` / `types.ts`): `required` is
`boolean`, `min`/`max` are `{ value: number; error?: string }` objects (not
bare `minLength`/`maxLength` numbers), and the return type is `TextField`
whose `required` field is a plain `boolean`. Must compile clean under `tsc
--strict`.

```ts
import { text } from "@vexcms/core";

const slug = text({
  required: true,
  min: { value: 3, error: "Slug must be at least 3 characters" },
  max: { value: 100 },
  admin: { width: "half", placeholder: "e.g. hello-world" },
});

// `text()` resolves defaults — `required` on the OUTPUT is a plain boolean.
const isRequired: boolean = slug.required;
console.log(isRequired, slug.type);
```

#### probe-invalid.ts

Negative case: `TextFieldInput.required` (via `BaseFieldInput`) is typed
`required?: boolean`, so passing a string literal must fail assignability with
`TS2322` ("Type 'string' is not assignable to type 'boolean'") — proving the
registry copy still ships real (non-`any`) types, not just that a value was
accepted.

```ts
import { text } from "@vexcms/core";

// @ts-expect-error is deliberately NOT used here — this file's whole job is
// to produce an uncaught TS2322 that the shell assertion below greps for.
text({ required: "yes-please" });
```

#### verify.sh

One copy-pasteable script covering install, both `tsc` runs, the dynamic-import
smoke test, and the dist-tag sweep. Every assertion is a hard `exit 1` on
mismatch so the step fails loudly instead of eyeballing output.

```bash
set -euo pipefail

SCRATCH="$(mktemp -d)"
cd "$SCRATCH"

# --- install (npm, deliberately not pnpm) ---------------------------------
npm init -y >/dev/null
npm i @vexcms/core@alpha convex typescript

# --- write probe files ------------------------------------------------------
TSC_FLAGS="--strict --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --noEmit"

cat > probe-valid.ts <<'EOF'
import { text } from "@vexcms/core";

const slug = text({
  required: true,
  min: { value: 3, error: "Slug must be at least 3 characters" },
  max: { value: 100 },
  admin: { width: "half", placeholder: "e.g. hello-world" },
});

const isRequired: boolean = slug.required;
console.log(isRequired, slug.type);
EOF

cat > probe-invalid.ts <<'EOF'
import { text } from "@vexcms/core";

text({ required: "yes-please" });
EOF

# --- positive compile: expect exit 0 ---------------------------------------
npx tsc $TSC_FLAGS probe-valid.ts
echo "OK: probe-valid.ts compiled clean"

# --- negative compile: expect exit 1 AND TS2322, not just any failure ------
if npx tsc $TSC_FLAGS probe-invalid.ts > invalid.log 2>&1; then
  echo "FAIL: probe-invalid.ts compiled but should have failed with TS2322" >&2
  exit 1
fi
if ! grep -q "TS2322" invalid.log; then
  echo "FAIL: probe-invalid.ts failed for the wrong reason (no TS2322):" >&2
  cat invalid.log >&2
  exit 1
fi
echo "OK: probe-invalid.ts failed with TS2322 as expected"

# --- runtime smoke test (dynamic import; package is ESM-only, no `require`) -
node -e "import('@vexcms/core').then((m) => { \
  const ok = typeof m.text === 'function'; \
  console.log(ok, typeof m.text); \
  process.exit(ok ? 0 : 1); \
});"

# --- dist-tag sweep across all 8 published packages -------------------------
PACKAGES=(
  "@vexcms/core"
  "@vexcms/react"
  "@vexcms/next"
  "@vexcms/cli"
  "@vexcms/better-auth"
  "@vexcms/file-storage-convex"
  "@vexcms/richtext-plate"
  "create-vexcms"
)

for pkg in "${PACKAGES[@]}"; do
  TAGS="$(npm view "$pkg" dist-tags --json)"
  echo "$pkg dist-tags: $TAGS"

  ALPHA="$(node -e "console.log(JSON.parse(process.argv[1]).alpha ?? '')" "$TAGS")"
  if [ -z "$ALPHA" ]; then
    echo "FAIL: $pkg has no alpha dist-tag" >&2
    exit 1
  fi

  if [ "$pkg" = "@vexcms/core" ]; then
    LATEST="$(node -e "console.log(JSON.parse(process.argv[1]).latest ?? '')" "$TAGS")"
    if [ "$LATEST" != "0.0.20" ]; then
      echo "FAIL: @vexcms/core latest dist-tag moved off 0.0.20 (got '$LATEST')" >&2
      exit 1
    fi
  fi
done

echo "ALL CHECKS PASSED"
```

Verify: `bash verify.sh` in a freshly created `$(mktemp -d)` — prints `OK: probe-valid.ts compiled clean`, `OK: probe-invalid.ts failed with TS2322 as expected`, `true function` (from the `node -e` smoke test), a `dist-tags` line per package showing `alpha` set, and ends with `ALL CHECKS PASSED`; any single mismatch (missing alpha tag, `@vexcms/core` latest moved, wrong/absent `TS2322`, valid probe failing) exits non-zero.

## Verification

1. `pnpm build && pnpm typecheck && pnpm test && pnpm lint` — all green.
2. Step 2/3 verify blocks (grep gates + negative checks) pass.
3. After the developer publishes: Step 5's clean-directory probe — `npm i
   @vexcms/core@alpha` typechecks, rejects `text({ required: "yes-please" })`
   with `TS2322`, and `npm view @vexcms/core dist-tags` shows
   `latest: 0.0.20`, `alpha: 0.1.0-alpha.x`.
