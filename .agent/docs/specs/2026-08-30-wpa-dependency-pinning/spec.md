---
status: done
spec_id: 2026-08-30-wpa-dependency-pinning
touches:
  - "pnpm-workspace.yaml"
  - ".npmrc"
  - "package.json"
  - "packages/*/package.json"
  - "apps/*/package.json"
  - "scripts/check-packed-manifests.mjs"
  - ".changeset/*.md"
prompt_version: 1
---

# 2026-08-30-wpa-dependency-pinning — Spec

Parent: `2026-08-30-launch-readiness` **WP-A — Dependency pinning &
supply-chain hardening**.

## Overview

Every version change in this repo should be a deliberate, reviewable diff.
Today 69 of 88 catalog entries are ranges, four more version specs bypass the
catalog entirely, and only `pnpm-lock.yaml` holds anything in place — so a
deleted lockfile, a `pnpm update`, or adding any package silently moves
`better-auth` from 1.6.23 to 1.7.2 and breaks auth at runtime. Meanwhile the
*published* manifests have the opposite defect: `@vexcms/core` ships
`"convex": "1.44.0"` as an exact peer, so a consumer on convex 1.45.0 gets a
peer conflict on install. This spec fixes both directions — exact inward,
ranged outward — and adds `minimumReleaseAge`, the only control here that
covers transitive dependencies.

Must land **before WP-5**: published manifests inherit these values and
consumers cannot be un-shipped. No source files change.

## Design Decisions

1. **Exact inward, ranged outward.** `dependencies` and `devDependencies` are
   pinned exact via the default catalog; `peerDependencies` stay ranges via a
   named `peers` catalog. Pinning peers buys **no** security — peer deps are
   resolved in the *consumer's* tree, never from this repo's lockfile — and
   costs every consumer a conflict on the next convex release.
2. **Named catalogs, because one entry cannot serve two roles.** Verified in a
   scratch workspace on pnpm 10.30.2: `peerDependencies: "catalog:peers"` packs
   to `">=1.44.0 <2"` while `dependencies: "catalog:"` packs to `1.44.0`, with
   no install required. This is what makes decision 1 expressible at all.
3. **Every peer floor is justified individually, not by a blanket rule.** A
   peer range is a permanent published promise. Floors are set from what the
   code actually uses (see the table in step 4): `>=18.0.0` for react because
   no React-19-only API appears anywhere in `packages/*/src`; `>=15.0.0` for
   next because `NextAdminPage.tsx` awaits `props.params`; a tested floor for
   anything that churns weekly (convex, better-auth, `@tanstack/react-form`,
   lucide-react).
4. **`@vexcms/core` peers become `workspace:^`.** Verified by packing
   `@vexcms/better-auth`: `"@vexcms/core": "workspace:*"` in
   `peerDependencies` publishes as the **exact** `0.1.0-alpha.1`, so any
   version skew in a consumer's tree is a hard peer error. Not covered by the
   parent spec. `workspace:^` publishes `^0.1.0-alpha.1`, which tolerates the
   alpha bumps changesets will produce.
5. **`minimumReleaseAge: 4320` (72h), excluding `@vexcms/*`.** Covers the
   blast radius that pinning cannot: pinning `nanoid: 5.1.16` says nothing
   about nanoid's own dependency tree. The 2025 npm compromises (chalk/debug,
   the shai-hulud worm) were detected within hours, so 72h means a
   freshly-compromised release is never resolved in the first place. Our own
   packages publish and get consumed the same day, hence the exclude.
6. **The catalog becomes the only place a version can live.** All four
   stragglers move in and the sweep is enforced by script, not by review.
   `turbo: ^2.8.10` — already drifted to **2.10.4** — is the standing proof
   that an uncatalogued range is an unmonitored one.
7. **Dead entries are deleted, not pinned.** Six catalog entries and one
   declared dependency are referenced by nothing. A pinned entry nothing
   consumes is noise in the file that is supposed to be the single reviewable
   record of what this repo trusts.
8. **Sorting lands in step 1, pinning in step 3.** The catalog is currently
   unsorted (`@edge-runtime/vm` sits between `convex-test` and `date-fns`).
   Sorting while values are untouched keeps step 1's diff pure moves and
   step 3's diff pure values; combined, they would be unreviewable — which
   defeats the entire point of the work package.
9. **`scripts/check-packed-manifests.mjs` is shared with WP-1.** WP-1 step 4
   calls for "a CI assertion that greps a packed tarball's manifest for
   `catalog:` and fails if found." That is a subset of the assertion step 4
   needs here, so WP-A owns the script and WP-1 wires it into CI. Two scripts
   for one invariant would drift.
  10. **The clean re-resolve proves less than the first draft of this spec
    claimed — and the corrected version is still the best gate here.** Pinning
    the catalog pins DIRECT dependencies only; the transitive closure resolves
    from parents' own ranges and floated ~250 packages in a measured
    lockfile-less resolve. So "nothing in this repo can silently move" is false
    as stated: the committed lockfile is the only pin on transitives, which is
    precisely why it is committed and why CI runs `--frozen-lockfile`. What the
    re-resolve *does* prove, and what step 5 now asserts: no direct/catalog
    resolution moves, and a from-scratch tree still builds — the latter being
    what caught step 4's duplicate-library regression.

## Out of Scope

- **`@convex-dev/better-auth` → 0.12.5 and any auth version bump** (parent D1).
  Re-verified 2026-08-30: 0.12.5 is still latest (published 64 days ago; nothing
  has shipped since the incident), and the `#422` defect is still present in
  **both** halves — `dist/nextjs/index.js:36` sets `x-forwarded-host`, and
  `getToken` in `dist/utils/index.js:42` sets `host` without deleting it while
  `cachedGetToken` copies inbound headers verbatim. Upstream PR #423 is still
  **open and unmerged**. Correcting the parent spec: our patch is *not*
  wholly unrebasable — `git apply --check` shows hunk 1 fails (0.12.5 renamed
  `newRequest.headers` to `headers`) while **hunk 2 applies cleanly at offset
  +15**. Re-authoring is a two-line job, not a rewrite. It stays out of scope
  only because the upgrade buys nothing this weekend: strict peers is reachable
  without it (step 7).
- **Upgrading `@daveyplate/better-auth-ui`** or trimming its 34-peer surface.
  It is the real obstacle to strict peers (step 7) and 3.4.0 is already latest.
- **Dependabot/Renovate configuration.** `minimumReleaseAge` plus exact pins is
  the control this weekend needs; an update bot is a follow-up.
- **Upgrading anything.** Every pinned value is the version already resolved in
  `pnpm-lock.yaml`. This spec must not move a single dependency.
- Everything downstream of WP-5 (publishing, dist-tags, LICENSE) — WP-1's.

## Implementation

### Step 1 — Prune dead catalog entries and the unused dep, then sort [agent]

- [x] `pnpm-workspace.yaml` — delete 6 entries, sort the rest
- [x] `packages/react/package.json` — delete 1 dependency
- [x] `pnpm install && pnpm build && pnpm test`

Six catalog entries are referenced by **no** workspace manifest, including the
root one. Confirmed two ways: no `package.json` in the repo names them, and the
lockfile's `catalogs.default` has no resolution for any of them.

| Delete | Why it is dead |
| --- | --- |
| `@playwright/test`, `playwright` | `test:e2e` is a turbo target with no package implementing it |
| `@testing-library/dom` | only `@testing-library/react` is depended on (it brings its own `dom`) |
| `eslint-plugin-react`, `eslint-plugin-react-refresh` | root eslint config uses `typescript-eslint` + `eslint-plugin-react-hooks` |
| `globals` | never imported by the flat config |

`@tanstack/zod-form-adapter@^0.42.1` in `packages/react` is also dead — a
repo-wide grep for `zod-form-adapter` across `.ts`/`.tsx` returns nothing. It
is a TanStack Form **v0** artifact; v1 folded adapters into the core package,
so it could never have worked alongside `@tanstack/react-form@1.33.1`.

#### pnpm-workspace.yaml

Replace the entire `catalog:` block with the sorted 82-entry version below.
Values are **byte-identical** to the current ones — this step only deletes and
reorders. `packages:` at the top of the file is unchanged.

```yaml
catalog:
  "@astrojs/starlight": ^0.38.2
  "@base-ui/react": 1.2.0
  "@better-auth/api-key": ^1.0.0
  "@convex-dev/better-auth": ^0.11.0
  "@convex-dev/eslint-plugin": ^1.1.1
  "@convex-dev/react-query": ^0.1.0
  "@daveyplate/better-auth-ui": ^3.3.15
  "@edge-runtime/vm": ^5.0.0
  "@eslint/eslintrc": ^3.3.3
  "@eslint/js": ^9.0.0
  "@hello-pangea/dnd": 18.0.1
  "@inquirer/prompts": ^7.2.0
  "@next/eslint-plugin-next": ^15.4.3
  "@platejs/basic-nodes": ^52.0.11
  "@platejs/code-block": ^52.0.11
  "@platejs/link": ^52.0.11
  "@platejs/list": ^52.0.11
  "@platejs/media": ^52.0.11
  "@platejs/table": ^52.0.11
  "@t3-oss/env-nextjs": ^0.13.10
  "@tailwindcss/postcss": ^4
  "@tanstack/react-form": ^1.33.0
  "@tanstack/react-query": ^5.90.17
  "@tanstack/react-table": 8.21.3
  "@testing-library/react": ^16.3.0
  "@ts-hooks-kit/core": 0.2.0
  "@types/fs-extra": ^11.0.4
  "@types/node": ^20
  "@types/react": ^19.2.14
  "@types/react-dom": ^19.2.0
  "@types/validate-npm-package-name": ^4.0.2
  "@typescript-eslint/eslint-plugin": ^8.0.0
  "@typescript-eslint/parser": ^8.0.0
  "@uiw/react-color-sketch": 2.9.6
  "@vitest/coverage-v8": ^4.0.18
  astro: ^6.0.1
  babel-plugin-react-compiler: ^1.0.0
  better-auth: ^1.5.0
  chalk: 5.3.0
  chokidar: ^4.0.0
  class-variance-authority: 0.7.1
  clsx: 2.1.1
  cmdk: 1.1.1
  commander: ^12.0.0
  convex: 1.44.0
  convex-helpers: ^0.1.113
  convex-test: ^0.0.38
  date-fns: ^4.1.0
  eslint: ^9.0.0
  eslint-config-next: 15.5.9
  eslint-plugin-import-x: ^4.16.1
  eslint-plugin-jsdoc: ^50.0.0
  eslint-plugin-perfectionist: ^5.3.1
  eslint-plugin-react-hooks: ^7.0.1
  execa: ^9.5.2
  fs-extra: ^11.2.0
  jiti: ^2.4.0
  jsdom: ^26.1.0
  lucide-react: 0.577.0
  nanoid: ^5.1.11
  next: ^16.2.1
  nuqs: ^2.8.8
  ora: 8.1.0
  platejs: ^52.3.4
  prettier: ^3.8.1
  react: ^19.2.4
  react-day-picker: 9.6.0
  react-dom: ^19.2.4
  shadcn: 3.6.3
  sharp: ^0.34.2
  sort-package-json: 2.10.0
  starlight-typedoc: ^0.21.5
  tailwind-merge: 3.5.0
  tailwindcss: ^4.2.1
  tsup: ^8.5.1
  tw-animate-css: 1.4.0
  typedoc: ^0.28.18
  typescript: ^6.0.0
  typescript-eslint: ^8.53.0
  validate-npm-package-name: 5.0.0
  vitest: ^4.0.18
  zod: ^4.3.6
```

#### packages/react/package.json

1 edit; everything not shown is unchanged.

**1 — remove the dead adapter dependency.** Delete the
`"@tanstack/zod-form-adapter"` line from `dependencies`, leaving
`"@tanstack/react-table": "catalog:"` followed directly by
`"@ts-hooks-kit/core": "catalog:"`.

Verify:

```bash
# Removing a declared dependency DOES change the lockfile — an earlier draft of
# this spec wrongly demanded `git diff --exit-code pnpm-lock.yaml` here. The
# real invariant is that the lockfile only ever SHRINKS: zero insertions, and
# no surviving entry's resolution moves. `--no-frozen-lockfile` is required
# because the manifest legitimately no longer matches the lockfile.
pnpm install --no-frozen-lockfile

git diff --numstat pnpm-lock.yaml
# expect: "0<TAB>25" — 0 insertions. Measured: the removal of
# @tanstack/zod-form-adapter plus its two orphaned transitives
# (@tanstack/form-core, @tanstack/store). Any insertion means something moved.

git diff -U0 pnpm-lock.yaml | grep -E '^\+ *version:'
# expect: no output — no resolution changed

git diff --numstat pnpm-workspace.yaml   # expect: "1<TAB>7" — deletions + moves only
pnpm build && pnpm test                  # expect: 10/10 tasks, 933 tests pass
```

### Step 2 — Sweep every straggler version spec into the catalog [agent]

- [x] `pnpm-workspace.yaml` — add 3 entries
- [x] `packages/react/package.json` — 1 dependency → `catalog:`
- [x] `apps/www/package.json` — 1 dependency → `catalog:`
- [x] `package.json` (root) — 2 devDependencies → `catalog:`
- [x] `scripts/check-packed-manifests.mjs` — new file (catalog-sweep check only)
- [x] `pnpm install && pnpm build && pnpm test`

| Straggler | Where | Current | Resolves to |
| --- | --- | --- | --- |
| `react-dropzone` | `packages/react` deps | `^15.0.0` | 15.0.0 |
| `convex` | `apps/www` deps | `^1.44.0` | 1.44.0 |
| `turbo` | root devDeps | `^2.8.10` | **2.10.4** — already drifted |
| `@changesets/cli` | root devDeps | `2.30.0` | 2.30.0 |

`react-dropzone` is genuinely used (`packages/react/src/components/media/MediaUploadDropzone.tsx`).

**`convex: ^1.44.0` in `apps/www` is not hygiene — it is a live, build-breaking
bug.** Measured 2026-08-30 in a scratch clone with the lockfile deleted:

```
convex@1.44.0   ← every package using `catalog:`
convex@1.45.0   ← apps/www, from `^1.44.0` (1.45.0 shipped 2026-08-21)
```

Two nominally distinct copies of the Convex type definitions, so
`apps/www/convex/vex/*.ts` fails with `TS2322: GenericQueryCtx<{ user: … }> is
not assignable to GenericQueryCtx<GenericDataModel>` and `www#build` dies.
A baseline clone installed with `--frozen-lockfile` builds 10/10; the
re-resolved one fails. Switching this single value to `catalog:` and
reinstalling restored `Tasks: 10 successful, 10 total`.

The lockfile is the only thing standing between this repo and a broken build on
the next machine that installs it. That is the entire argument for WP-A in one
measurement.

#### pnpm-workspace.yaml

3 edits; everything not shown is unchanged. Insert each in the sorted position
established by step 1, carrying the version currently resolved so the lockfile
does not move.

**1 — `@changesets/cli`.** Between `"@better-auth/api-key"` and
`"@convex-dev/better-auth"`:

```yaml
  "@changesets/cli": 2.30.0
```

**2 — `react-dropzone`.** Immediately after `react-dom`:

```yaml
  react-dropzone: 15.0.0
```

**3 — `turbo`.** Immediately after `tsup`:

```yaml
  turbo: 2.10.4
```

#### packages/react/package.json

1 edit. In `dependencies`, replace `"react-dropzone": "^15.0.0"` with
`"react-dropzone": "catalog:"`.

#### apps/www/package.json

1 edit. In `dependencies`, replace `"convex": "^1.44.0"` with
`"convex": "catalog:"`. This is the app that WP-3 flips to `@alpha`; leaving a
range here would mean the deploy commit resolves convex independently of the
catalog.

#### package.json

1 edit; everything not shown is unchanged.

**1 — route the two uncatalogued devDependencies through the catalog.** In
`devDependencies`, replace the `"@changesets/cli": "2.30.0"` and
`"turbo": "^2.8.10"` values:

```json
    "@changesets/cli": "catalog:",
    "turbo": "catalog:",
```

#### scripts/check-packed-manifests.mjs

New file. This step needs only the **sweep** assertion; step 4 extends the same
script with the packed-manifest assertions rather than adding a second script
(decision 9). The workspace package list is derived from the filesystem, never
hardcoded — a hardcoded list is exactly what rotted in
`sync-template-versions.mjs` through the rebuild renames.

```js
/**
 * Verifies the repo's dependency-declaration invariants.
 *
 * Checks are registered in `allChecks` and selected by `--<id>` flags; no flags
 * runs all of them. An unmatched flag is a hard error rather than a silent
 * empty run — a gate that reports success while checking nothing is worse than
 * no gate at all.
 *
 * - `sweep`: every dependencies/devDependencies value in every workspace
 *   manifest is `catalog:`, `catalog:<name>`, or a `workspace:` specifier.
 *   This is what makes pnpm-workspace.yaml the single place a version can move.
 * - `packed`: added in step 4.
 *
 * Exits non-zero with a per-violation report. Wired into CI by WP-1 step 4.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Collects every workspace manifest, root included.
 *
 * @returns {Array<{ relPath: string, pkg: Record<string, unknown> }>} one entry
 *   per `package.json`, in a stable order (root first, then `packages/*`, then
 *   `apps/*`).
 */
function readWorkspaceManifests() {
  const dirs = ["packages", "apps"].flatMap((group) => {
    const groupDir = path.join(root, group);
    if (!fs.existsSync(groupDir)) return [];
    return fs
      .readdirSync(groupDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(group, entry.name));
  });

  return ["", ...dirs]
    .map((dir) => path.join(dir, "package.json"))
    .filter((relPath) => fs.existsSync(path.join(root, relPath)))
    .map((relPath) => ({
      relPath,
      pkg: JSON.parse(fs.readFileSync(path.join(root, relPath), "utf-8")),
    }));
}

const allowedSpec = /^(catalog:[a-z]*|workspace:[*^~].*)$/;

/**
 * Asserts that no runtime or dev dependency declares a literal version.
 *
 * @returns {string[]} human-readable violations; empty means the check passed.
 */
function checkSweep() {
  const violations = [];

  for (const { relPath, pkg } of readWorkspaceManifests()) {
    for (const field of ["dependencies", "devDependencies"]) {
      for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
        if (allowedSpec.test(spec)) continue;
        violations.push(
          `${relPath} → ${field}.${name} = "${spec}" (expected "catalog:" or a workspace: specifier)`
        );
      }
    }
  }

  return violations;
}

/** @type {Array<{ id: string, label: string, run: () => string[] }>} */
const allChecks = [{ id: "sweep", label: "catalog sweep", run: checkSweep }];

const selected = process.argv
  .slice(2)
  .filter((arg) => arg.startsWith("--"))
  .map((arg) => arg.slice(2));

const checks =
  selected.length === 0
    ? allChecks
    : allChecks.filter((check) => selected.includes(check.id));

if (checks.length === 0) {
  console.error(
    `no check matches ${selected.join(", ")}; known ids: ${allChecks.map((c) => c.id).join(", ")}`
  );
  process.exit(2);
}

let failed = false;
for (const { label, run } of checks) {
  const violations = run();
  if (violations.length === 0) {
    console.log(`✓ ${label}`);
    continue;
  }
  failed = true;
  console.error(`✗ ${label} — ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`    ${violation}`);
}

process.exit(failed ? 1 : 0);
```

Verify:

```bash
node scripts/check-packed-manifests.mjs --sweep   # expect: "✓ catalog sweep", exit 0

# Repointing a specifier to `catalog:` rewrites the importer rows and adds three
# records to the lockfile's `catalogs.default` snapshot, so the lockfile is NOT
# byte-identical here either. The invariant is that no package's RESOLUTION
# moves — the three new `version:` rows carry the values already in use.
pnpm install --no-frozen-lockfile

git diff -U0 pnpm-lock.yaml | grep -E '^- *version:'
# expect: only the step-1 removals. No `-version: X` paired with a `+version: Y`
# for the same package — that pairing is the definition of drift.

# The payoff of this step, checked directly: convex must be a SINGLE copy.
grep -cE '^  convex@1\.45\.0' pnpm-lock.yaml   # expect: 0
grep -oE '^  convex@[0-9.]+' pnpm-lock.yaml    # expect: exactly "  convex@1.44.0"

pnpm build && pnpm test                        # expect: 10/10 tasks, 933 tests pass
```

### Step 3 — Pin the default catalog exact [agent]

- [x] `pnpm-workspace.yaml` — 63 values changed, 22 untouched (85 entries total)
- [x] `pnpm install && pnpm build && pnpm test`

Every value below is the version **already resolved** in the lockfile's
`catalogs.default`, so the install is provably a no-op. The diff is therefore a
complete, reviewable record of what this repo currently trusts — which is the
deliverable, not a side effect.

Notable silent drift the ranges were hiding, all of it now visible:

| Entry | Range | Actually installed |
| --- | --- | --- |
| `better-auth` | `^1.5.0` | 1.6.23 (and `^1.5.0` would resolve **1.7.2** on any re-resolve) |
| `@better-auth/api-key` | `^1.0.0` | 1.6.23 |
| `@typescript-eslint/*` | `^8.0.0` | 8.63.0 |
| `@types/node` | `^20` | 20.19.43 |
| `@tailwindcss/postcss` | `^4` | 4.3.2 |
| `eslint-plugin-jsdoc` | `^50.0.0` | 50.8.0 |

**How much movement the ranges actually permit, measured.** A single
lockfile-less re-resolve on 2026-08-30 moved **21 of the 82 catalog entries**
without any manifest edit:

```
next:                 16.2.10 → 16.3.3      react:      19.2.7  → 19.2.8
@tanstack/react-query: 5.101.2 → 5.102.8    react-dom:  19.2.7  → 19.2.8
convex-helpers:        0.1.120 → 0.1.123    nuqs:       2.9.0   → 2.10.1
@typescript-eslint/*:  8.63.0  → 8.68.0     vitest:     4.1.10  → 4.1.11
…and 13 more
```

This is not theoretical drift on a long horizon — it is what one `pnpm install`
on a fresh checkout does today. Pinning is what converts all 21 into a diff
somebody has to approve.

#### pnpm-workspace.yaml

Replace the `catalog:` block from step 2 with the pinned 85-entry version.
No entry is added or removed here — only values change.

```yaml
catalog:
  "@astrojs/starlight": 0.38.5
  "@base-ui/react": 1.2.0
  "@better-auth/api-key": 1.6.23
  "@changesets/cli": 2.30.0
  "@convex-dev/better-auth": 0.11.5
  "@convex-dev/eslint-plugin": 1.2.2
  "@convex-dev/react-query": 0.1.0
  "@daveyplate/better-auth-ui": 3.4.0
  "@edge-runtime/vm": 5.0.0
  "@eslint/eslintrc": 3.3.6
  "@eslint/js": 9.39.5
  "@hello-pangea/dnd": 18.0.1
  "@inquirer/prompts": 7.10.1
  "@next/eslint-plugin-next": 15.5.20
  "@platejs/basic-nodes": 52.3.10
  "@platejs/code-block": 52.3.16
  "@platejs/link": 52.3.17
  "@platejs/list": 52.3.10
  "@platejs/media": 52.3.10
  "@platejs/table": 52.3.20
  "@t3-oss/env-nextjs": 0.13.11
  "@tailwindcss/postcss": 4.3.2
  "@tanstack/react-form": 1.33.1
  "@tanstack/react-query": 5.101.2
  "@tanstack/react-table": 8.21.3
  "@testing-library/react": 16.3.2
  "@ts-hooks-kit/core": 0.2.0
  "@types/fs-extra": 11.0.4
  "@types/node": 20.19.43
  "@types/react": 19.2.17
  "@types/react-dom": 19.2.3
  "@types/validate-npm-package-name": 4.0.2
  "@typescript-eslint/eslint-plugin": 8.63.0
  "@typescript-eslint/parser": 8.63.0
  "@uiw/react-color-sketch": 2.9.6
  "@vitest/coverage-v8": 4.1.10
  astro: 6.4.8
  babel-plugin-react-compiler: 1.0.0
  better-auth: 1.6.23
  chalk: 5.3.0
  chokidar: 4.0.3
  class-variance-authority: 0.7.1
  clsx: 2.1.1
  cmdk: 1.1.1
  commander: 12.1.0
  convex: 1.44.0
  convex-helpers: 0.1.120
  convex-test: 0.0.38
  date-fns: 4.4.0
  eslint: 9.39.5
  eslint-config-next: 15.5.9
  eslint-plugin-import-x: 4.17.1
  eslint-plugin-jsdoc: 50.8.0
  eslint-plugin-perfectionist: 5.10.0
  eslint-plugin-react-hooks: 7.1.1
  execa: 9.6.1
  fs-extra: 11.3.6
  jiti: 2.7.0
  jsdom: 26.1.0
  lucide-react: 0.577.0
  nanoid: 5.1.16
  next: 16.2.10
  nuqs: 2.9.0
  ora: 8.1.0
  platejs: 52.3.21
  prettier: 3.9.5
  react: 19.2.7
  react-day-picker: 9.6.0
  react-dom: 19.2.7
  react-dropzone: 15.0.0
  shadcn: 3.6.3
  sharp: 0.34.5
  sort-package-json: 2.10.0
  starlight-typedoc: 0.21.5
  tailwind-merge: 3.5.0
  tailwindcss: 4.3.2
  tsup: 8.5.1
  turbo: 2.10.4
  tw-animate-css: 1.4.0
  typedoc: 0.28.20
  typescript: 6.0.3
  typescript-eslint: 8.63.0
  validate-npm-package-name: 5.0.0
  vitest: 4.1.10
  zod: 4.4.3
```

Verify:

```bash
# no range survives in the default catalog
grep -nE '^\s+"?[^":]+"?:\s*[~^><*]|\|\|' pnpm-workspace.yaml   # expect: no output

pnpm install --no-frozen-lockfile

# THE gate for this step. Pinning rewrites 63 `specifier:` rows in the
# lockfile's catalog snapshot, so the file is not byte-identical — but not one
# RESOLUTION may move. Any `-version: X` line paired with a `+version: Y` for
# the same package means a pinned value disagreed with what was installed.
git diff -U0 pnpm-lock.yaml | grep -E '^[+-] *version:'
# expect: no NEW pairs beyond steps 1–2. Measured: step 3 adds zero.

# and the lockfile's own catalog snapshot must now be range-free
grep -cE '^      specifier: .*[~^<>]' pnpm-lock.yaml   # expect: 0

pnpm build && pnpm test                                # expect: 10/10, 933 tests
```

### Step 4 — Add `catalogs.peers` and repoint every peerDependency [agent]

- [x] `pnpm-workspace.yaml` — new `catalogs:` block, 12 entries
- [x] `packages/core/package.json` — 6 peers
- [x] `packages/react/package.json` — 7 peers + 5 devDependency pins
- [x] `packages/next/package.json` — 10 peers + 4 devDependency pins
- [x] `packages/better-auth/package.json` — 3 peers
- [x] `packages/cli/package.json` — 2 peers + 1 devDependency pin
- [x] `packages/file-storage-convex/package.json` — 2 peers
- [x] `packages/richtext-plate/package.json` — 2 peers
- [x] `scripts/check-packed-manifests.mjs` — add the `--packed` check
- [x] `pnpm install && pnpm build && pnpm test`

The published manifest of `@vexcms/core` today (read out of a real
`pnpm pack` tarball) is the bug:

```json
"peerDependencies": {
  "convex": "1.44.0",
  "lucide-react": "0.577.0",
  "@tanstack/react-table": "8.21.3",
  "react": ">=18.0.0"
}
```

Three exact pins, because the peer says `catalog:` and the catalog entry is
exact — and step 3 just made 66 more entries exact. A consumer on convex 1.45.0
gets a peer conflict on `npm i @vexcms/core@alpha`, which is objective #1 of the
parent spec.

**Peer floor rationale.** Each range is set from what the code uses, per
decision 3:

| Peer | Range | Why this floor and this ceiling |
| --- | --- | --- |
| `convex` | `>=1.44.0 <2` | Ships weekly; floor is the version we build and test against. The `<2` ceiling is what actually fixes the 1.45.0 conflict. |
| `better-auth` | `>=1.6.23 <1.7.0` | The ceiling is load-bearing, not cosmetic: 1.7.x violates `@convex-dev/better-auth@0.11.5`'s `<1.7.0` peer (parent D1). Floor is the tested version. |
| `@convex-dev/react-query` | `>=0.1.0 <0.2.0` | 0.x — no stability guarantee across minors. |
| `@tanstack/react-query` | `>=5.0.0 <6` | Only `useQuery`/`QueryClient` are used, stable across all of v5. Generous floor is honest here. |
| `@tanstack/react-table` | `>=8.0.0 <9` | v8 core API (`useReactTable`, `ColumnDef`) unchanged since 8.0. |
| `@tanstack/react-form` | `>=1.33.0 <2` | 1.x is still moving (field render props changed post-1.0); tested floor. |
| `lucide-react` | `>=0.577.0 <1` | 0.x with no majors, **and** `LucideIconName` derives from the `icons` map (P-009). Icons are only ever *added*, so an older lucide silently lacks names the type promises — this is the AP-010 defect, re-entering through a peer range. Tested floor is mandatory. |
| `zod` | `>=4.0.0 <5` | v4 is a rewrite from v3, so `<5` matters; the schema API used is stable across 4.x. |
| `nuqs` | `>=2.8.0 <3` | v2 adapter API stable; floor near tested. |
| `next` | `>=15.0.0` | **Corrects a false promise.** `packages/next/src/NextAdminPage.tsx:56` does `await props.params` against a `Promise<{ path?: string[] }>` type. Next 14 types `params` as a plain object, so a Next 14 consumer gets a type error. The current `>=14.0.0` never held. |
| `react` | `>=18.0.0` | Verified generous-safe: a repo-wide grep finds no `useActionState`, `useOptimistic`, `useFormStatus`, or `use(` in `packages/*/src`, and no `forwardRef` needing the 19 signature. Note types are only exercised at `@types/react@19.2.17`; the *runtime* floor is 18. |
| `react-dom` | `>=18.0.0` | Same surface as `react`. |

#### pnpm-workspace.yaml

1 edit; the `catalog:` block from step 3 is unchanged. Append a `catalogs:`
block after it. `catalog:` (singular, default) and `catalogs:` (plural, named)
are different keys and coexist.

```yaml
catalogs:
  # Consumed exclusively by `peerDependencies`. These are permanent published
  # promises resolved in the CONSUMER's tree, never from this repo's lockfile —
  # so they are ranges, and pinning them would buy no security while breaking
  # every consumer on the next upstream release. Floors are justified per-entry
  # in .agent/docs/specs/2026-08-30-wpa-dependency-pinning/spec.md step 4.
  peers:
    "@convex-dev/react-query": ">=0.1.0 <0.2.0"
    "@tanstack/react-form": ">=1.33.0 <2"
    "@tanstack/react-query": ">=5.0.0 <6"
    "@tanstack/react-table": ">=8.0.0 <9"
    better-auth: ">=1.6.23 <1.7.0"
    convex: ">=1.44.0 <2"
    lucide-react: ">=0.577.0 <1"
    next: ">=15.0.0"
    nuqs: ">=2.8.0 <3"
    react: ">=18.0.0"
    react-dom: ">=18.0.0"
    zod: ">=4.0.0 <5"
```

#### packages/core/package.json

1 edit; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.** Every entry routes through
the named catalog, including `react`, whose inline `>=18.0.0` is now duplicated
information:

```json
  "peerDependencies": {
    "@convex-dev/react-query": "catalog:peers",
    "@tanstack/react-query": "catalog:peers",
    "@tanstack/react-table": "catalog:peers",
    "convex": "catalog:peers",
    "lucide-react": "catalog:peers",
    "react": "catalog:peers"
  },
```

**Every peer must ALSO be a `catalog:` devDependency of the package that
declares it.** This is not optional bookkeeping — it is what keeps the peer
ranges from breaking the workspace's own build, and `packages/core` already
does it for all 6 of its peers, so this is an existing convention rather than a
new one.

Why: `pnpm` resolves a peer that nothing else supplies by auto-installing the
**maximum** version satisfying the range. Once step 4 turns peers into ranges,
any package whose peer is not pinned elsewhere gets a *second*, newer copy
installed beside the `catalog:`-pinned one — and two copies of a type-bearing
library are two nominally distinct sets of types.

Measured on a from-scratch resolve before this was fixed: `packages/react`
declared **none** of its 7 peers as devDependencies, so
`@tanstack/react-query` resolved to both 5.101.2 and 5.102.8 and
`docs#build` died on
`packages/react/src/components/fields/relationship/Input.tsx:78` with
`TS2322: … is not assignable to type 'readonly UseQueryOptionsForUseQueries<…>[]'`.
`convex` doubled to 1.44.0 + 1.45.0 the same way. After adding the pins, a
from-scratch resolve yields a single copy of each and builds 10/10.

Audit result — 10 peers were unpinned, in 3 packages:

| Package | External peers | Needed adding |
| --- | --- | --- |
| `core` | 6 | none — already correct |
| `react` | 7 | `@convex-dev/react-query`, `@tanstack/react-query`, `convex`, `next`, `nuqs` |
| `next` | 10 | `@convex-dev/react-query`, `@tanstack/react-query`, `convex`, `zod` |
| `cli` | 1 | `convex` |
| `better-auth`, `file-storage-convex`, `richtext-plate` | 2 / 1 / 2 | none — already correct |

These are `devDependencies`, so they never appear in a published manifest —
confirmed by `checkPacked` still passing afterwards.

#### packages/react/package.json

2 edits; everything not shown is unchanged. `peerDependenciesMeta.next.optional`
stays as it is.

**1 — replace the whole `peerDependencies` block.**

```json
  "peerDependencies": {
    "@convex-dev/react-query": "catalog:peers",
    "@tanstack/react-query": "catalog:peers",
    "convex": "catalog:peers",
    "next": "catalog:peers",
    "nuqs": "catalog:peers",
    "react": "catalog:peers",
    "react-dom": "catalog:peers"
  },
```

Note `convex` moves from `>=1.0.0` to `>=1.44.0 <2`. That is a deliberate
tightening: `>=1.0.0` claimed support for convex 1.0, which predates the
`defineSchema` surface this package builds on.

**2 — add the 5 unpinned peers to `devDependencies`, each `catalog:`.** Keys
stay alphabetically sorted (this repo runs `sort-package-json`). `react` and
`react-dom` are already present, so only these five are added:

```json
    "@convex-dev/react-query": "catalog:",
    "@tanstack/react-query": "catalog:",
    "convex": "catalog:",
    "next": "catalog:",
    "nuqs": "catalog:",
```

#### packages/next/package.json

2 edits; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.** This is the package where
the `next` floor correction lands.

```json
  "peerDependencies": {
    "@convex-dev/react-query": "catalog:peers",
    "@tanstack/react-form": "catalog:peers",
    "@tanstack/react-query": "catalog:peers",
    "@tanstack/react-table": "catalog:peers",
    "convex": "catalog:peers",
    "next": "catalog:peers",
    "nuqs": "catalog:peers",
    "react": "catalog:peers",
    "react-dom": "catalog:peers",
    "zod": "catalog:peers"
  },
```

**2 — add the 4 unpinned peers to `devDependencies`, each `catalog:`.**
`@tanstack/react-form`, `@tanstack/react-table` and `nuqs` are already present:

```json
    "@convex-dev/react-query": "catalog:",
    "@tanstack/react-query": "catalog:",
    "convex": "catalog:",
    "zod": "catalog:",
```

#### packages/better-auth/package.json

1 edit; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.** `@vexcms/core` becomes
`workspace:^` (decision 4) — as `workspace:*` it published as the exact
`0.1.0-alpha.1`.

```json
  "peerDependencies": {
    "@vexcms/core": "workspace:^",
    "better-auth": "catalog:peers",
    "convex": "catalog:peers"
  },
```

#### packages/cli/package.json

2 edits; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.**

```json
  "peerDependencies": {
    "@vexcms/core": "workspace:^",
    "convex": "catalog:peers"
  },
```

**2 — add `convex` to `devDependencies`.**

```json
    "convex": "catalog:",
```

#### packages/file-storage-convex/package.json

1 edit; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.**

```json
  "peerDependencies": {
    "@vexcms/core": "workspace:^",
    "convex": "catalog:peers"
  },
```

#### packages/richtext-plate/package.json

1 edit; everything not shown is unchanged.

**1 — replace the whole `peerDependencies` block.** `platejs` stays a
`dependency` (exact, via `catalog:`) — it is bundled, not peered.

```json
  "peerDependencies": {
    "react": "catalog:peers",
    "react-dom": "catalog:peers"
  },
```

#### scripts/check-packed-manifests.mjs

3 edits; everything not shown is unchanged. The `--packed` check packs each
publishable package with **pnpm** (never npm — `npm pack` leaves
`"nanoid": "catalog:"` in the manifest, which is uninstallable) and asserts the
three invariants on the real tarball.

**1 — extend the header imports.** Beside the existing `node:url` import add:

```js
import { execFileSync } from "node:child_process";
import os from "node:os";
```

**2 — add the packed check beside `checkSweep`.** Anchored after `checkSweep`,
before the `checks` array:

```js
const exactVersion = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
const unresolvedSpec = /^(catalog:|workspace:)/;
const rangeSpec = /[~^><*]|\|\|/;

/**
 * Packs every publishable package with pnpm and asserts the published
 * dependency invariants on the resulting manifest.
 *
 * Three invariants, one per failure mode this spec exists to prevent:
 * 1. No value still reads `catalog:` or `workspace:` — those are uninstallable
 *    for a consumer and mean the pack step did not resolve them.
 * 2. No `peerDependencies` value is a bare exact version — that is the convex
 *    1.45.0 conflict.
 * 3. No `dependencies` value is a range — that is the silent-drift hole.
 *
 * @returns {string[]} human-readable violations; empty means the check passed.
 */
function checkPacked() {
  const violations = [];
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-packed-"));

  const publishable = readWorkspaceManifests().filter(
    ({ relPath, pkg }) =>
      relPath.startsWith("packages/") && pkg.name && !pkg.private
  );

  for (const { relPath, pkg } of publishable) {
    const cwd = path.join(root, path.dirname(relPath));

    // One destination per package. Every package shares the same version, so a
    // shared directory makes "find the .tgz for this package" ambiguous and
    // silently attributes the first tarball's manifest to all 8.
    const outDir = path.join(outRoot, path.basename(path.dirname(relPath)));
    fs.mkdirSync(outDir);

    execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
      cwd,
      stdio: "pipe",
    });

    const tarballs = fs.readdirSync(outDir).filter((file) => file.endsWith(".tgz"));
    if (tarballs.length !== 1) {
      violations.push(
        `${pkg.name} → expected exactly 1 tarball, got ${tarballs.length}: ${tarballs.join(", ")}`
      );
      continue;
    }

    const manifest = JSON.parse(
      execFileSync("tar", ["-xzOf", path.join(outDir, tarballs[0]), "package/package.json"], {
        encoding: "utf-8",
      })
    );

    for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
      if (unresolvedSpec.test(spec)) {
        violations.push(`${pkg.name} → dependencies.${name} = "${spec}" is unresolved`);
      } else if (rangeSpec.test(spec)) {
        violations.push(`${pkg.name} → dependencies.${name} = "${spec}" is a range (must be exact)`);
      }
    }

    for (const [name, spec] of Object.entries(manifest.peerDependencies ?? {})) {
      if (unresolvedSpec.test(spec)) {
        violations.push(`${pkg.name} → peerDependencies.${name} = "${spec}" is unresolved`);
      } else if (exactVersion.test(spec)) {
        violations.push(
          `${pkg.name} → peerDependencies.${name} = "${spec}" is exact (must be a range)`
        );
      }
    }
  }

  fs.rmSync(outRoot, { force: true, recursive: true });
  return violations;
}
```

**3 — register the new check.** The selector and runner from step 2 need no
change; append one entry to `allChecks`:

```js
/** @type {Array<{ id: string, label: string, run: () => string[] }>} */
const allChecks = [
  { id: "sweep", label: "catalog sweep", run: checkSweep },
  { id: "packed", label: "packed manifests", run: checkPacked },
];
```

Verify:

```bash
node scripts/check-packed-manifests.mjs           # expect: "✓ catalog sweep", "✓ packed manifests"

# the specific regression this step fixes, checked by hand once
cd packages/core && pnpm pack --pack-destination /tmp/vexcheck && cd -
tar -xzOf /tmp/vexcheck/vexcms-core-*.tgz package/package.json | jq .peerDependencies
# expect: convex ">=1.44.0 <2", lucide-react ">=0.577.0 <1",
#         "@tanstack/react-table" ">=8.0.0 <9" — no bare versions

# THE gate for objective #1 of the parent spec: a consumer on the CURRENT convex
# must be able to install the tarball. npm has been strict about peers by default
# since v7, so this is a real check.
rm -rf /tmp/consumer && mkdir -p /tmp/consumer && cd /tmp/consumer
npm init -y >/dev/null
npm i --no-audit --no-fund convex@1.45.0 react@19.2.7 react-dom@19.2.7 \
  lucide-react@0.577.0 "@tanstack/react-query@5.102.8" \
  "@tanstack/react-table@8.21.3" "@convex-dev/react-query@0.1.0" \
  /tmp/vexcheck/vexcms-core-*.tgz
# expect: exit 0. Measured: "added 42 packages".
#
# Control — the same probe against the PRE-WP-A peers (exact, catalog-inherited)
# must FAIL, otherwise the probe proves nothing. Measured: npm ERESOLVE,
# "peer @tanstack/react-query@5.101.2 from @vexcms/core", exit 1.
cd -

pnpm install --no-frozen-lockfile
git diff -U0 pnpm-lock.yaml | grep -E '^[+-] *version:'  # expect: no new pairs
pnpm build && pnpm test                                  # expect: 10/10, 933 tests
```

### Step 5 — Enable `minimumReleaseAge` and make the lifecycle-script gate explicit [agent]

- [x] `pnpm-workspace.yaml` — 2 settings + 1 explicit gate
- [x] `pnpm install && pnpm build && pnpm test`
- [x] clean re-resolve in a scratch copy

Settings go in `pnpm-workspace.yaml`, not `.npmrc`: pnpm 10 reads its own
settings from there, and it keeps the whole dependency policy in one reviewable
file. `.npmrc` keeps only what is npm-generic (`save-exact`,
`strict-peer-dependencies`, the auth token). Verified on pnpm 10.30.2 —
`pnpm config get minimumReleaseAge` reads the value back from this file.

Verified safe against the pins from step 3: the youngest pinned version is
`convex@1.44.0` at ~397h old, well clear of the 4320-minute (72h) window. The
clean re-resolve gate below is what keeps that true.

#### pnpm-workspace.yaml

1 edit; the `catalog:` and `catalogs:` blocks are unchanged. Append after them.

```yaml
# Refuse to resolve any version published in the last 72 hours. This is the only
# control here that covers TRANSITIVE dependencies — pinning nanoid says nothing
# about nanoid's own tree. The 2025 npm compromises (chalk/debug, shai-hulud)
# were detected within hours, so a 72h window means a compromised release is
# never installed in the first place.
minimumReleaseAge: 4320
minimumReleaseAgeExclude:
  # Our own packages publish and get consumed the same day (WP-5 → WP-3).
  - "@vexcms/*"

# pnpm 10 blocks dependency lifecycle scripts by default; this states the posture
# explicitly so it is greppable and so allowing one becomes a visible diff rather
# than a silent capability grant. It is deliberately EMPTY, not vacuous: a fresh
# install blocks 7 scripts — core-js, esbuild (x2), msw (x2), sharp,
# unrs-resolver — and the tree works anyway because the ones that matter ship
# prebuilt platform binaries (@img/sharp-darwin-arm64, @esbuild/*). Adding a name
# here grants arbitrary code execution at install time; require evidence that the
# package cannot work without it.
onlyBuiltDependencies: []
```

Verify:

```bash
pnpm config get minimumReleaseAge                 # expect: 4320
pnpm config get minimumReleaseAgeExclude --json   # expect: ["@vexcms/*"]

pnpm install --no-frozen-lockfile                 # expect: "Already up to date"

# Clean re-resolve gate — corrected. An earlier draft demanded "zero `version:`
# differences" from a lockfile-less resolve. That is IMPOSSIBLE and the claim it
# rested on ("nothing in this repo can silently move") was overstated.
#
# Pinning the catalog pins DIRECT dependencies only. Every transitive dependency
# resolves from its own parent's ranges, which we do not control. Measured: a
# lockfile-less resolve floated ~250 transitive packages (@radix-ui/*, @rollup/*,
# @babel/*, hono 4.12→4.13, jose 6.2.3→6.2.10 …). The committed lockfile is, and
# remains, the only pin on the transitive closure — which is exactly why it is
# committed and why CI uses --frozen-lockfile.
#
# Two things ARE provable, and both matter more than the impossible one:
#   (a) no DIRECT/catalog resolution moves, and
#   (b) a from-scratch tree still builds — i.e. the peer ranges from step 4 do
#       not duplicate a type-bearing library.
# Use a working-tree copy, not `git clone`: the catalog changes are uncommitted
# while this spec is being implemented.
rm -rf /tmp/vex-reresolve && mkdir -p /tmp/vex-reresolve
tar -cf - --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist . \
  | (cd /tmp/vex-reresolve && tar -xf -)
cd /tmp/vex-reresolve && rm pnpm-lock.yaml && pnpm install --no-frozen-lockfile

# (a) single copy of each library the workspace type-checks against
grep -oE '^  convex@[0-9.]+' pnpm-lock.yaml | sort -u          # expect: only 1.44.0
grep -oE '@tanstack/react-query@[0-9][0-9.]*' pnpm-lock.yaml | sort -u   # expect: only 5.101.2

# (b) the tree that a fresh clone would get must build
pnpm build                                        # expect: 10/10 tasks
cd - && rm -rf /tmp/vex-reresolve

pnpm build && pnpm test                           # expect: 10/10, 933 tests pass
```

### Step 6 — Turn `strict-peer-dependencies` on [agent]

- [x] `.npmrc` — delete 1 line; `pnpm-workspace.yaml` — add `strictPeerDependencies: true`
- [x] `package.json` — add `pnpm.overrides` + `pnpm.peerDependencyRules`
- [x] `pnpm install` (no CLI flag) `&& pnpm build && pnpm test`

`strict-peer-dependencies=false` is a blanket "ignore every peer conflict,
forever." It is what let `@convex-dev/better-auth`'s violated peer install
silently, and it will hide the next one just as well. Replacing it with three
narrow, commented exceptions means any **new** mismatch fails the install
loudly — which is the same argument as pinning the catalog, applied to peers.

**This was measured, not assumed.** Four scenarios, each a scratch clone with
the lockfile deleted and `--strict-peer-dependencies`:

| Scenario | Result |
| --- | --- |
| A — today's versions, no rules | **fails**, 6 violations |
| B — upgrade to `@convex-dev/better-auth@0.12.5` + `better-auth@1.6.30` | **fails**, 5 violations |
| C — B + the rules below | passes |
| **D — today's versions + the rules below, patch intact** | **passes** |
| E — `auto-install-peers=false` instead | **fails**, 21 *missing* peers |

Three conclusions, all of which contradict the previous draft of this spec:

1. **The auth upgrade is not required.** D passes on 0.11.5 with our existing
   patch untouched, so this step is fully compatible with parent D1.
2. **The auth upgrade would not have been sufficient either.** B still fails.
   The dominant obstacle is `@daveyplate/better-auth-ui@3.4.0`, which declares
   **34 peerDependencies with no `peerDependenciesMeta`** — so none are
   optional — including `"@better-auth/passkey": ">=1.4.6"`. pnpm's default
   `auto-install-peers` resolves that to **1.7.2**, which then demands
   `better-auth@^1.7.2` and conflicts with whatever 1.6.x we run.
3. **`auto-install-peers=false` is not the answer.** E would force us to
   hand-declare 21 peers we do not use (triplit, instantdb, captcha widgets).

Scenario D verified end to end: `pnpm install --strict-peer-dependencies`
exit 0, `pnpm build` 10/10 tasks, `pnpm test` 933 passed.

#### .npmrc

1 edit; everything not shown is unchanged.

**1 — DELETE the `strict-peer-dependencies` line entirely.** Do not flip it to
`true` here. **Verified: pnpm 10 ignores this key in `.npmrc`.** With
`strict-peer-dependencies=true` set in `.npmrc` and no CLI flag, a plain
`pnpm install` *printed* `✕ unmet peer better-auth@">=1.5.0 <1.6.0"` and still
**exited 0**. Leaving it here would ship a gate that reports problems and fails
nothing — the exact failure mode this spec keeps guarding against.

```ini
shamefully-hoist=true
save-exact=true

//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

#### pnpm-workspace.yaml

1 edit; the `catalog:`, `catalogs:` and step-5 settings blocks are unchanged.

**1 — append the setting where pnpm actually reads it.** pnpm's own error hint
names this file ("add the following to pnpm-workspace.yaml … strictPeerDependencies:
false"), and the key is camelCase here, not kebab. Confirmed both directions in a
scratch copy: with a rule removed the install **exits 1**; with the rule present
it **exits 0**.

```yaml
# Fail the install on any peer conflict. MUST live here, not in .npmrc: pnpm 10
# reads `strict-peer-dependencies` from .npmrc as a no-op — verified, a plain
# `pnpm install` reported the conflict and still exited 0. The narrow exceptions
# live in package.json#pnpm.peerDependencyRules.allowedVersions.
strictPeerDependencies: true
```

#### package.json

2 edits; everything not shown is unchanged. Both go inside the existing `pnpm`
block, beside `patchedDependencies`.

**1 — hold better-auth-ui's auto-installed peers on the 1.6 line.** Without
this, `"@better-auth/passkey": ">=1.4.6"` floats to 1.7.2 and drags in a
`better-auth@^1.7.2` requirement we deliberately do not satisfy (D1). Pinning
it to our own better-auth version keeps the two in lockstep:

```json
    "overrides": {
      "@better-auth/passkey": "1.6.23"
    },
```

**2 — three scoped exceptions, each with a stated reason.** `allowedVersions`
is suppression, so every entry must name what it suppresses and why. Unlike
`strict-peer-dependencies=false` these are per-dependency and greppable:

```json
    "peerDependencyRules": {
      "allowedVersions": {
        "@convex-dev/better-auth>better-auth": "1.6.23",
        "better-call": "2",
        "typescript": "6"
      }
    },
```

- `@convex-dev/better-auth>better-auth` — 0.11.5 declares
  `better-auth >=1.5.0 <1.6.0`; we run 1.6.23. This is **stale upstream
  metadata, not a real incompatibility**, and 0.12.5 is the evidence: its peer
  range is `>=1.6.11 <1.7.0`, which our 1.6.23 satisfies. Upstream widened the
  range in a later release without ever backporting it to 0.11.x, so the code
  path we run is sanctioned — only the manifest lagged. Net effect of this line
  is a *reduction* in suppression: `strict-peer-dependencies=false` silenced
  this and every future mismatch, globally and invisibly; this silences one
  known-good pair and lets everything else fail loudly. Delete it when the
  0.12.5 upgrade lands — the step 6 gate below fails if it is still needed, and
  passes if it is not, so the expiry condition is checked rather than trusted.
- `better-call` — `@better-auth/api-key` wants 1.x; `@daveyplate/better-auth-ui`
  ships 2.0.2. Upstream's own dependency graph disagrees with itself; nothing
  we can resolve from here.
- `typescript` — `@triplit/logger` (auto-installed via better-auth-ui) wants
  `^5.0.0`; the repo is on TypeScript 6. A logger's TS peer cannot break us.

Verify:

```bash
pnpm install --no-frozen-lockfile         # NO CLI flag — the config must do the work
pnpm build                                # expect: Tasks: 10 successful, 10 total
pnpm test                                 # expect: 933 tests pass
# NB: `pnpm config get strict-peer-dependencies` returns undefined and proves
# nothing — the setting is read from pnpm-workspace.yaml. The gate below is the
# only reliable check.

# Prove BOTH that strictness is in effect and that the rules are load-bearing:
# drop one rule and a plain install MUST fail. Never pass
# --strict-peer-dependencies here — that would test the flag, not the config,
# which is precisely how the .npmrc no-op went unnoticed.
# Use a working-tree copy, not `git clone`: these changes are uncommitted.
rm -rf /tmp/vex-peercheck && mkdir -p /tmp/vex-peercheck
tar -cf - --exclude=node_modules --exclude=.git --exclude=.next --exclude=dist . \
  | (cd /tmp/vex-peercheck && tar -xf -)
cd /tmp/vex-peercheck
node -e '
  const fs = require("node:fs");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  delete pkg.pnpm.peerDependencyRules.allowedVersions["@convex-dev/better-auth>better-auth"];
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
'
rm pnpm-lock.yaml
pnpm install --lockfile-only
# expect: EXIT 1 with ERR_PNPM_PEER_DEP_ISSUES naming
#   ✕ unmet peer better-auth@">=1.5.0 <1.6.0": found 1.6.23
# Measured: exit 1 with the rule removed, exit 0 with it restored.
# If this SUCCEEDS, the rule was unnecessary — delete it from package.json.
cd - && rm -rf /tmp/vex-peercheck
```

### Step 7 — Changeset [agent]

- [x] `.changeset/<name>.md` — new file
- [x] `pnpm changeset status`

Steps 2–4 change the published manifests of all 8 publishable packages. Without
a changeset the peer-range fix never reaches npm and WP-5 publishes the old
exact peers — which would make objective #1 of the parent spec fail in front of
an audience.

#### .changeset/bound-published-peer-ranges.md

New file. `patch` for all 8: no exported symbol changes, but the install
contract does.

```md
---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/better-auth": patch
"@vexcms/cli": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext-plate": patch
"create-vexcms": patch
---

Publish `peerDependencies` as ranges instead of exact versions.

`peerDependencies` previously inherited exact versions from the pnpm catalog, so
installing alongside a newer `convex`, `lucide-react`, or `@tanstack/react-table`
produced a peer conflict. Peers now resolve from a dedicated `peers` catalog of
deliberate ranges, and `@vexcms/core` is peered as a compatible range rather
than an exact version. `dependencies` are now published as exact versions instead of ranges
(`nanoid: 5.1.16`, not `^5.1.11`), so an install cannot silently pick up a
different transitive tree than the one tested.

`@vexcms/next` now declares `next >=15.0.0`, correcting a `>=14.0.0` claim that
never held — the admin page awaits `params`, which requires Next 15 typings.
```

Verify:

```bash
pnpm changeset status
# expect: all 8 publishable packages listed; no `docs`, no `www`, no
# `@vexcms/tsconfig`. They appear under **major**, not patch — pre-existing
# changesets (server-api-access-options.md carries a BREAKING note) dominate the
# aggregate. This changeset's own level is patch; the aggregate is not a defect.
# NB: `docs` is absent only because nothing names it. Making it unpublishable is
# WP-1 step 1, still outstanding.
pnpm build && pnpm test
```

## Verification

Full gate, in order. Every step above must leave all of this green — the spec
has no step that is allowed to break the build.

**Measured baseline.** `checkPacked` was run against the repo as it stands
before any step lands: **30 violations**, every one of them mapped to a step
here — 8 exact peers and 1 exact `@vexcms/core` peer per dependent package
(step 4), 19 ranged `dependencies` inherited from the unpinned catalog
(step 3), `@tanstack/zod-form-adapter` (step 1), and `react-dropzone` (step 2).
**The acceptance number is 0.** Anything left over means a step was skipped, not
that the check is too strict.

```bash
node scripts/check-packed-manifests.mjs   # both invariants
pnpm install                              # no changes reported
git diff --exit-code pnpm-lock.yaml       # nothing moved, at any step
pnpm build
pnpm typecheck                            # 7/7
pnpm test                                 # 933 tests
pnpm changeset status
```

Plus the three gates that only pass once every step has landed:

1. **Clean re-resolve** (step 5) — copy the working tree, delete the lockfile,
   re-resolve, and confirm (a) `convex` and `@tanstack/react-query` each have
   exactly one copy and (b) the tree builds 10/10. It does **not** prove the
   transitive closure is stable — ~250 transitive packages float without the
   lockfile, and that is expected (decision 10).
2. **Published-peer spot check** (step 4) — `pnpm pack @vexcms/core` and read
   `peerDependencies` out of the tarball. No bare exact version.
3. **Consumer install probe** (step 4) — `npm i` the packed tarball beside
   `convex@1.45.0`. This is the direct test of objective #1 of the parent spec:
   "`npm i @vexcms/core@alpha` works." Measured: exit 0 / 42 packages, where the
   pre-WP-A peers produced `npm ERESOLVE`.
