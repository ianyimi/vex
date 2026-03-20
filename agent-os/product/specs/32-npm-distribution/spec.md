# 32 — npm Distribution & Changesets

## Overview

Set up npm publishing infrastructure for all `@vexcms/*` packages using changesets for synchronized versioning. All publishable packages share the same version (fixed mode), starting at `0.0.1`. Includes a GitHub Actions CI/CD pipeline that automates versioning PRs and npm publishing on merge to `main`.

## Design Decisions

- **Fixed versioning via changesets:** All publishable packages (`@vexcms/core`, `@vexcms/cli`, `@vexcms/better-auth`, `@vexcms/admin-next`, `@vexcms/ui`, `@vexcms/richtext`, `@vexcms/file-storage-convex`, and future `create-vexcms`) always share the same version number. A change to any package bumps all of them.
- **`workspace:*` → real versions at publish time:** Changesets automatically converts `workspace:*` references (in both `dependencies` and `peerDependencies`) to the actual published version during `changeset publish`. No manual version pinning needed.
- **`catalog:` references are fine:** pnpm resolves `catalog:` to real versions during `pnpm pack`/`pnpm publish`, so external peer deps like `convex` and `react` get correct version ranges in the published tarball.
- **NPM_TOKEN secret for publishing:** The GitHub Action uses an `NPM_TOKEN` repository secret (automation token from npmjs.com). Simpler than OIDC provenance for a first setup.
- **`@vexcms/tsconfig` stays private:** It's a workspace-only shared config. Not published to npm.
- **Initial version `0.0.1`:** All packages start at `0.0.1`. The first changeset bump will take them to the next version.

## Out of Scope

- Building the `create-vexcms` CLI (spec 30.5) — just pre-register it in the changeset fixed group
- Template `package.json` version pinning (handled when create-cli is built)
- Custom changelog formatting
- Branch protection rules or required CI checks
- npm 2FA/automation token setup guide (ops, not code)
- `@vexcms/tsconfig` — private, not published

## Target Directory Structure

```
dev/
├── .changeset/
│   └── config.json                # Changesets config (fixed versioning)
├── .github/
│   └── workflows/
│       └── release.yml            # CI: version PRs + npm publish
├── package.json                   # (modified: add changeset scripts)
├── packages/
│   ├── core/package.json          # (modified: version 0.0.1)
│   ├── cli/package.json           # (modified: version 0.0.1)
│   ├── better-auth/package.json   # (modified: version 0.0.1)
│   ├── admin-next/package.json    # (modified: version 0.0.1)
│   ├── ui/package.json            # (modified: version 0.0.1)
│   ├── richtext/package.json      # (modified: version 0.0.1)
│   └── file-storage-convex/package.json  # (modified: version 0.0.1)
```

## Implementation Order

1. **Step 1: Install changesets + config** — Install `@changesets/cli`, create `.changeset/config.json` with fixed versioning. After this step, `pnpm changeset` works.
2. **Step 2: Update all package.json files** — Set version to `0.0.1`, verify `publishConfig`, `files`, `exports`, `main`, `types` fields are correct for npm. After this step, `pnpm build` still works and packages are publish-ready.
3. **Step 3: Add release scripts to root** — Add `changeset`, `version`, and `release` scripts to root `package.json`. After this step, `pnpm changeset version` and `pnpm release` work locally.
4. **Step 4: GitHub Actions release workflow** — Create `.github/workflows/release.yml` that opens version PRs and publishes to npm on merge to `main`. After this step, the full CI/CD pipeline is configured.
5. **Step 5: Verify publish readiness** — Dry-run publish all packages, verify `workspace:*` resolution, verify `catalog:` resolution, verify no missing files in tarball.

---

## Step 1: Install changesets + config

- [ ] Install `@changesets/cli` as a root devDependency
- [ ] Create `.changeset/config.json` with fixed versioning for all `@vexcms/*` packages + `create-vexcms`
- [ ] Run `pnpm changeset` — verify it prompts for a changeset

### `File: .changeset/config.json`

Changesets configuration with fixed versioning mode. The `fixed` array groups all publishable packages so they always share the same version number.

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [
    [
      "@vexcms/core",
      "@vexcms/cli",
      "@vexcms/better-auth",
      "@vexcms/admin-next",
      "@vexcms/ui",
      "@vexcms/richtext",
      "@vexcms/file-storage-convex",
      "create-vexcms"
    ]
  ],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@vexcms/tsconfig"]
}
```

**Key fields:**
- `fixed` — all packages in this array get the same version on every release
- `access: "public"` — scoped packages default to restricted on npm; this overrides to public
- `baseBranch: "main"` — changesets compares against `main` to determine what changed
- `updateInternalDependencies: "patch"` — when a package is bumped, internal dependents update their version range
- `ignore` — `@vexcms/tsconfig` is private and should not be versioned or published
- `create-vexcms` is included in the fixed group even though the package doesn't exist yet — changesets silently ignores missing packages

### Install command

```bash
pnpm add -Dw @changesets/cli
```

---

## Step 2: Update all package.json files

- [ ] Set `version` to `"0.0.1"` in all 7 publishable packages
- [ ] Verify each package has `publishConfig.access: "public"`
- [ ] Verify each package has `files: ["dist"]`
- [ ] Verify each package has correct `exports`, `main`, `types` fields
- [ ] Verify `@vexcms/richtext` exports include `./editor` and `./render` subpaths
- [ ] Confirm `@vexcms/tsconfig` has `"private": true`
- [ ] Run `pnpm build` — verify everything still compiles

The packages are already well-configured for publishing. The only change needed is setting the version from `"0.0.0"` to `"0.0.1"`.

**Packages to update** (version `"0.0.0"` → `"0.0.1"`):

| Package | File |
|---------|------|
| `@vexcms/core` | `packages/core/package.json` |
| `@vexcms/cli` | `packages/cli/package.json` |
| `@vexcms/better-auth` | `packages/better-auth/package.json` |
| `@vexcms/admin-next` | `packages/admin-next/package.json` |
| `@vexcms/ui` | `packages/ui/package.json` |
| `@vexcms/richtext` | `packages/richtext/package.json` |
| `@vexcms/file-storage-convex` | `packages/file-storage-convex/package.json` |

**No other changes needed** — all packages already have:
- `publishConfig: { "access": "public" }`
- `files: ["dist"]`
- Correct `exports`, `main`, `types` fields
- `type: "module"`

**`workspace:*` references stay as-is.** Changesets converts them to real versions during `changeset publish`. For example, `@vexcms/admin-next`'s `dependencies` entry `"@vexcms/core": "workspace:*"` becomes `"@vexcms/core": "0.0.1"` in the published tarball.

**`catalog:` references stay as-is.** pnpm resolves these to the real version (from `pnpm-workspace.yaml` catalog) during `pnpm publish`. For example, `"convex": "catalog:"` becomes `"convex": "^1.31.5"` in the published tarball.

---

## Step 3: Add release scripts to root

- [ ] Add `changeset`, `version:packages`, and `release` scripts to root `package.json`
- [ ] Run `pnpm changeset` — verify it creates a changeset file in `.changeset/`
- [ ] Run `pnpm version:packages` — verify it updates all package versions (then `git checkout` to undo)

### Root `package.json` changes

Add these scripts to the existing `scripts` block:

```json
{
  "scripts": {
    "changeset": "changeset",
    "version:packages": "changeset version",
    "release": "pnpm build && changeset publish"
  }
}
```

**What each script does:**
- `pnpm changeset` — interactive CLI to create a new changeset (describes what changed and the bump type)
- `pnpm version:packages` — consumes pending changesets, bumps versions in all fixed-group packages, updates CHANGELOGs
- `pnpm release` — builds all packages then publishes to npm (run by CI, not manually)

---

## Step 4: GitHub Actions release workflow

- [ ] Create `.github/workflows/release.yml`
- [ ] Workflow triggers on push to `main`
- [ ] Uses `changesets/action` to either (a) open a "Version Packages" PR or (b) publish to npm
- [ ] Requires `NPM_TOKEN` repository secret (to be set in GitHub repo settings)

### `File: .github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          version: pnpm version:packages
          publish: pnpm release
          title: "chore: version packages"
          commit: "chore: version packages"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**How this works:**

1. Developer creates a changeset: `pnpm changeset` → selects bump type → commits the `.changeset/*.md` file
2. On merge to `main`, the workflow detects pending changesets
3. If changesets exist: opens a "Version Packages" PR that bumps versions and updates CHANGELOGs
4. When that PR is merged: the workflow runs again, finds no pending changesets, runs `pnpm release` which publishes all packages to npm

**Required setup (manual, not in this spec):**
- Create an npm automation token at npmjs.com → Access Tokens → Generate New Token (Granular Access Token)
- Add it as `NPM_TOKEN` in GitHub repo → Settings → Secrets and variables → Actions → New repository secret

### `File: .npmrc` (root)

Required for the GitHub Actions runner to authenticate with npm:

```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

This file uses environment variable interpolation — it only takes effect when `NPM_TOKEN` is set (i.e., in CI). Locally, pnpm uses your existing npm auth.

---

## Step 5: Verify publish readiness

- [ ] Run `pnpm build` — all packages compile
- [ ] Run `pnpm --filter "@vexcms/*" exec pnpm pack --dry-run` — verify each tarball includes `dist/` files
- [ ] Verify `@vexcms/richtext` tarball includes `dist/editor/` and `dist/render/` subdirectories
- [ ] Verify no `node_modules/`, `src/`, or test files leak into tarballs
- [ ] Run `pnpm changeset status` — verify it reports the fixed group correctly
- [ ] Optionally: `pnpm changeset` → create a test changeset → `pnpm version:packages` → verify all 7 packages get bumped → `git checkout .` to undo

### Verification commands

```bash
# Build everything
pnpm build

# Check what each package would publish (dry run)
pnpm --filter "@vexcms/core" exec pnpm pack --dry-run
pnpm --filter "@vexcms/cli" exec pnpm pack --dry-run
pnpm --filter "@vexcms/better-auth" exec pnpm pack --dry-run
pnpm --filter "@vexcms/admin-next" exec pnpm pack --dry-run
pnpm --filter "@vexcms/ui" exec pnpm pack --dry-run
pnpm --filter "@vexcms/richtext" exec pnpm pack --dry-run
pnpm --filter "@vexcms/file-storage-convex" exec pnpm pack --dry-run

# Verify changeset config
pnpm changeset status

# Test the full version flow (undo after)
pnpm changeset  # create a test changeset, select "patch"
pnpm version:packages  # should bump all 7 packages to 0.0.2
git diff -- '*/package.json'  # verify all versions changed
git checkout .  # undo
rm .changeset/*.md 2>/dev/null  # clean up test changeset if not consumed
```

### What to look for in `pnpm pack --dry-run` output

Each package should list:
- `dist/` files (`.js`, `.d.ts`)
- `package.json`
- No `src/`, `tsconfig.json`, `tsup.config.ts`, `node_modules/`, or test files

For `@vexcms/richtext` specifically, verify:
- `dist/index.js` + `dist/index.d.ts`
- `dist/editor/index.js` + `dist/editor/index.d.ts`
- `dist/render/index.js` + `dist/render/index.d.ts`

## Success Criteria

- [ ] `@changesets/cli` installed and `.changeset/config.json` exists with fixed versioning
- [ ] All 7 publishable packages have `version: "0.0.1"`
- [ ] `@vexcms/tsconfig` remains `private: true` and is in the changeset `ignore` list
- [ ] `pnpm changeset` opens interactive prompt
- [ ] `pnpm version:packages` bumps all 7 packages simultaneously
- [ ] `pnpm release` builds and would publish (requires NPM_TOKEN to actually publish)
- [ ] `.github/workflows/release.yml` exists and is syntactically valid
- [ ] `.npmrc` exists with NPM_TOKEN interpolation for CI auth
- [ ] `pnpm pack --dry-run` shows only `dist/` + `package.json` in each tarball
- [ ] `create-vexcms` is pre-registered in the changeset fixed group for future use
