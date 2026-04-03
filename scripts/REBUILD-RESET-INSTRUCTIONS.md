# VexCMS v1 Rebuild - Reset Instructions

This document outlines the complete reset process for the v1 rebuild.

## Pre-Reset Checklist

- [ ] **Create backup branch** (optional but recommended)
  ```bash
  git checkout -b pre-rebuild-backup
  git push origin pre-rebuild-backup
  git checkout master
  ```

- [ ] **Create rebuild branch**
  ```bash
  git checkout -b v1-rebuild
  ```

- [ ] **Verify you're NOT on master**
  ```bash
  git branch --show-current
  # Should output: v1-rebuild (or whatever branch name you chose)
  ```

## Reset Process

Run these scripts **in order**:

### 1. Reset Repository Structure

Archives tests, deletes demo app, renames packages, clears implementation code.

```bash
chmod +x scripts/rebuild-reset.sh
./scripts/rebuild-reset.sh
```

**What this does:**
- ✅ Archives all test files to `.rebuild/archived-tests/`
- ✅ Archives reference implementation to `.rebuild/reference/`
- ✅ Deletes `apps/demo/`
- ✅ Renames packages to v1 naming:
  - `ui` → `react`
  - `admin-next` → `next`
  - `file-storage-convex` → `storage-convex`
  - `richtext` → `richtext-plate`
  - `create-cli` → `create-vexcms`
- ✅ Clears all `src/` directories (keeps package structure)
- ✅ Removes `dist/`, `node_modules/`, `.turbo/`

### 2. Reset Package Versions to 0.1.0-alpha.1

```bash
node scripts/reset-packages.mjs
```

**What this does:**
- ✅ Updates all package.json files to version `0.1.0-alpha.1`
- ✅ Updates package names to match v1 naming
- ✅ Preserves workspace:* dependencies

### 3. Configure Changesets for Alpha Versioning

```bash
node scripts/setup-alpha-changesets.mjs
```

**What this does:**
- ✅ Configures changesets for alpha prerelease mode
- ✅ Sets up fixed versioning for all @vexcms/* packages
- ✅ Updates ignored packages (tsconfig, www)

### 4. Update www App Dependencies

```bash
node scripts/update-www-deps.mjs
```

**What this does:**
- ✅ Updates `apps/www/package.json` to use `workspace:*` for all @vexcms/* deps
- ✅ Ensures www app will use the new alpha versions

### 5. Add ESLint + JSDoc Dependencies

```bash
node scripts/add-eslint-deps.mjs
```

**What this does:**
- ✅ Adds ESLint + TypeScript ESLint plugin
- ✅ Adds eslint-plugin-jsdoc for JSDoc enforcement
- ✅ Adds lint scripts to root package.json

### 6. Install Dependencies

```bash
pnpm install
```

### 7. Verify ESLint Configuration

```bash
pnpm lint
```

**Expected:** Should run without errors (since all src/ directories are empty)

## Post-Reset State

After running all scripts, you should have:

### Package Structure
```
packages/
├── core/                    # @vexcms/core@0.1.0-alpha.1
│   ├── src/index.ts        # Empty placeholder
│   └── package.json        # Updated version
├── react/                   # @vexcms/react@0.1.0-alpha.1 (renamed from ui)
├── next/                    # @vexcms/next@0.1.0-alpha.1 (renamed from admin-next)
├── cli/                     # @vexcms/cli@0.1.0-alpha.1
├── better-auth/             # @vexcms/better-auth@0.1.0-alpha.1
├── storage-convex/          # @vexcms/storage-convex@0.1.0-alpha.1
├── richtext-plate/          # @vexcms/richtext-plate@0.1.0-alpha.1
├── create-vexcms/           # create-vexcms@0.1.0-alpha.1 (renamed from create-cli)
└── tsconfig/                # @vexcms/tsconfig (private, no version)

apps/
└── www/                     # Marketing site (using workspace:* for @vexcms/*)

.rebuild/
├── archived-tests/          # All test files for porting
│   ├── core/
│   ├── cli/
│   └── ...
└── reference/               # Reference implementation
    ├── core-valueTypes/
    ├── core-permissions/
    ├── core-migrations/
    ├── core-convex/
    └── cli/
```

### Versions
- All @vexcms/* packages: `0.1.0-alpha.1`
- create-vexcms: `0.1.0-alpha.1`

### ESLint
- ✅ Configured with JSDoc enforcement
- ✅ Only enforces on exported functions/types
- ✅ Requires:
  - Description
  - @param for each parameter
  - @returns with description
  - @throws (warning)

## Commit the Reset

```bash
git add -A
git commit -m "chore: reset repository for v1 rebuild

- Archived all tests to .rebuild/archived-tests/
- Archived reference implementation to .rebuild/reference/
- Deleted apps/demo
- Renamed packages to v1 naming (ui→react, admin-next→next, etc.)
- Reset all packages to 0.1.0-alpha.1
- Configured changesets for alpha versioning
- Added ESLint + JSDoc enforcement
- Updated www app to use workspace:* dependencies"
```

## Next Steps

1. **Start with field type system** (rebuild-planning.md recommends this)
   - Port field type tests from `.rebuild/archived-tests/core/`
   - Implement `text()`, `number()`, etc. in `packages/core/src/fields/`
   - Make tests pass

2. **Follow the rebuild plan**
   - Reference: `agent-os/product/architecture/rebuild-scope-v1.md`
   - Build in order: field types → config builders → schema generation → etc.

3. **Use JSDoc from day one**
   - ESLint will enforce JSDoc on all exported symbols
   - Write docs as you write code
   - Run `pnpm lint` before committing

4. **Version incrementally**
   ```bash
   # After completing a feature:
   pnpm changeset
   # Select the appropriate bump (patch/minor/major)
   # This creates a changeset file

   # When ready to release:
   pnpm changeset version  # Updates versions to 0.1.0-alpha.2, etc.
   git commit -am "chore: version alpha.X"
   pnpm release            # Builds and publishes
   ```

5. **Graduate to 0.1.0 when ready**
   - When all features from rebuild-scope-v1.md are complete
   - When marketing site runs on the rebuild
   - When demo app works end-to-end
   - Remove the "-alpha" tag and release 0.1.0

## Reverting (If Needed)

If you need to go back to the old code:

```bash
# Switch to backup branch (if you created it)
git checkout pre-rebuild-backup

# Or reset to before the rebuild
git log --oneline  # Find the commit before "reset repository for v1 rebuild"
git reset --hard <commit-hash>
```

## Reference Documents

- **Rebuild Architecture**: `agent-os/product/architecture/rebuild-scope-v1.md`
- **Planning & Decisions**: `agent-os/product/architecture/rebuild-planning.md`
- **CLI Diagram**: `CLI Watch & Regenerate System.excalidraw` (in Obsidian vault)

## Support

Questions? Reference:
1. Rebuild planning docs (architecture/)
2. Archived implementation (.rebuild/reference/)
3. Archived tests (.rebuild/archived-tests/)
4. Conversation history with Claude Code
