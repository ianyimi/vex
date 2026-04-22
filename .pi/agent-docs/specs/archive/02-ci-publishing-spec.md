# CI/Publishing Spec

This document defines the CI/CD setup for Vex CMS, including automated testing, versioning, and npm publishing.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 0.3

**Depends on**:
- [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) - Package structure
- [01-testing-infrastructure-spec.md](./01-testing-infrastructure-spec.md) - Test configuration

---

## Design Goals

1. **GitHub Actions** for CI/CD
2. **multi-semantic-release** for atomic versioning across all packages
3. **Conventional commits** for automated changelog and version bumps
4. **Same version** across all packages (synchronized releases)
5. **Automated npm publishing** on merge to main

---

## Versioning Strategy

All `@vexcms/*` packages share the same version number:
- `@vexcms/core@1.2.3`
- `@vexcms/convex@1.2.3`
- `@vexcms/admin@1.2.3`
- etc.

This simplifies dependency management and ensures compatibility.

---

## Conventional Commits

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types and Version Bumps

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | Minor (0.x.0) |
| `fix` | Bug fix | Patch (0.0.x) |
| `docs` | Documentation only | No release |
| `style` | Code style (formatting) | No release |
| `refactor` | Code change (no feature/fix) | No release |
| `perf` | Performance improvement | Patch |
| `test` | Adding/updating tests | No release |
| `chore` | Maintenance tasks | No release |
| `BREAKING CHANGE` | Breaking change (in footer) | Major (x.0.0) |

### Examples

```bash
# Patch release
git commit -m "fix(admin): correct field validation error display"

# Minor release
git commit -m "feat(core): add richText field type"

# Major release
git commit -m "feat(convex)!: redesign handler API

BREAKING CHANGE: adminCreate now requires explicit collection parameter"

# No release
git commit -m "docs: update README with examples"
git commit -m "test(core): add tests for select field"
```

### Scopes

Use package names as scopes:
- `core`, `convex`, `client`, `admin`, `live-preview-react`
- Or use feature names: `fields`, `handlers`, `auth`, `upload`

---

## multi-semantic-release Setup

### Installation

```bash
pnpm add -D multi-semantic-release semantic-release @semantic-release/changelog @semantic-release/git -w
```

### Root package.json

```json
{
  "scripts": {
    "release": "multi-semantic-release"
  },
  "release": {
    "branches": ["main"],
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/changelog",
      "@semantic-release/npm",
      "@semantic-release/git"
    ]
  }
}
```

### Package-level Configuration

Each publishable package needs a `release` config in its `package.json`:

```json
{
  "name": "@vexcms/core",
  "version": "0.0.0",
  "release": {
    "tagFormat": "v${version}",
    "plugins": [
      "@semantic-release/commit-analyzer",
      "@semantic-release/release-notes-generator",
      "@semantic-release/npm",
      [
        "@semantic-release/git",
        {
          "assets": ["package.json", "CHANGELOG.md"],
          "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ]
    ]
  }
}
```

### Synchronized Versions

To keep all packages on the same version, use `multi-semantic-release` with shared versioning:

```javascript
// release.config.js (root)
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'packages/*/package.json'],
        message: 'chore(release): v${nextRelease.version} [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [],
      },
    ],
  ],
};
```

---

## GitHub Actions Workflows

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Run tests
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./packages/*/coverage/coverage-final.json

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Build packages
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/*/playwright-report/
          retention-days: 7

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm build

      - name: Check package sizes
        run: |
          echo "Package sizes:"
          du -sh packages/*/dist/
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release
  cancel-in-progress: false

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    # Only run if CI passed and commit is not from release
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    permissions:
      contents: write
      packages: write
      issues: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Run tests
        run: pnpm test

      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: pnpm release
```

---

## NPM Configuration

### .npmrc (root)

```ini
# Auth token from environment
//registry.npmjs.org/:_authToken=${NPM_TOKEN}

# Package settings
access=public
```

### Package publishConfig

Each package needs:

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org"
  }
}
```

---

## GitHub Repository Setup

### Required Secrets

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm automation token with publish access |
| `CODECOV_TOKEN` | (optional) Codecov upload token |

### Branch Protection

Configure branch protection for `main`:
- Require status checks: `lint`, `test`, `test-e2e`, `build`
- Require branches to be up to date
- Require linear history (optional, helps commit parsing)

---

## Local Development Commands

### Check What Would Release

```bash
# Dry run to see what would be published
pnpm release --dry-run
```

### Manual Version Bump (Not Recommended)

If needed, manually bump all packages:

```bash
# Bump all packages to specific version
pnpm -r exec -- npm version 1.2.3 --no-git-tag-version
```

---

## Commit Message Agent Command

For your agent-os integration, the commit message generator should:

1. Run `git diff --cached` to get staged changes
2. Analyze the changes to determine:
   - Type (feat, fix, refactor, etc.)
   - Scope (which package/feature)
   - Description
   - Breaking changes
3. Generate conventional commit message
4. Copy to clipboard

Example output format:

```
feat(admin): add media library picker component

- Add MediaLibraryPicker component with grid view
- Add upload modal with drag-drop support
- Integrate with useField hook for upload fields
```

---

## Release Process Flow

```
1. Developer commits with conventional commit message
   └── git commit -m "feat(core): add email field type"

2. PR opened against main
   └── CI runs: lint, test, test:e2e, build

3. PR merged to main
   └── Release workflow triggered

4. multi-semantic-release analyzes commits
   ├── Determines version bump (patch/minor/major)
   ├── Updates all package.json versions
   ├── Generates CHANGELOG.md
   └── Creates git tag

5. Packages published to npm
   ├── @vexcms/core@x.y.z
   ├── @vexcms/convex@x.y.z
   ├── @vexcms/client@x.y.z
   ├── @vexcms/admin@x.y.z
   └── @vexcms/live-preview-react@x.y.z

6. GitHub release created with changelog
```

---

## Checklist

- [ ] Install multi-semantic-release and plugins
- [ ] Configure release.config.js
- [ ] Add release config to each package.json
- [ ] Create .github/workflows/ci.yml
- [ ] Create .github/workflows/release.yml
- [ ] Set up NPM_TOKEN secret in GitHub
- [ ] Configure branch protection rules
- [ ] Test release with dry-run
- [ ] Verify first release publishes correctly
- [ ] Document commit message conventions
