# What's Being Preserved in the Reset

## ✅ Complete List of Preserved Files/Directories

### Root Infrastructure (Untouched)
```
✅ turbo.json                    - Turbo build config (perfect as-is)
✅ pnpm-workspace.yaml          - Workspace definition
✅ package.json                  - Root package (deps will be updated)
✅ pnpm-lock.yaml               - Will regenerate after install
✅ .gitignore                   - Git configuration
✅ tsconfig.json                - Root TypeScript config
✅ README.md                     - Project README
✅ .changeset/                   - Changesets (config will update)
✅ catalog/                      - pnpm catalog for shared deps
✅ agent-os/                     - Your planning documents
✅ .claude/skills/               - Excalidraw diagram skill
```

### Package Infrastructure (In Each Package)
```
✅ packages/*/package.json       - Updated to 0.1.0-alpha.1
✅ packages/*/tsconfig.json      - Preserved
✅ packages/*/tsconfig.check.json - Preserved (if exists)
✅ packages/*/tsup.config.ts     - Build config preserved
✅ packages/*/vitest.config.ts   - Test config preserved (if exists)
✅ packages/*/.gitignore         - Preserved (if exists)
```

### TSConfig Shared Configs
```
✅ packages/tsconfig/base.json          - Core TypeScript config
✅ packages/tsconfig/react-library.json - For React packages (DOM, JSX)
✅ packages/tsconfig/nextjs.json        - For Next.js packages
✅ packages/tsconfig/package.json       - Package metadata
```

### CLI Package (PRESERVED - Recommended)
```
✅ packages/cli/src/**/*.ts      - All CLI implementation
✅ packages/cli/package.json     - Updated to 0.1.0-alpha.1
✅ packages/cli/tsconfig.json    - Preserved
✅ packages/cli/tsup.config.ts   - Build config

Files:
  ✅ src/index.ts (56 LOC) - CLI entry point
  ✅ src/commands/dev.ts (155 LOC) - vex dev command
  ✅ src/commands/generate.ts (53 LOC) - vex generate
  ✅ src/commands/deploy.ts (35 LOC) - vex deploy
  ✅ src/lib/generateSchema.ts (436 LOC) - Schema generation
  ✅ src/lib/loadConfig.ts (252 LOC) - Config loader
  ✅ src/lib/migrate.ts (261 LOC) - Migration system
  ✅ src/lib/watcher.ts (58 LOC) - File watcher
  ✅ src/lib/convexProcess.ts (197 LOC) - Convex process manager
  ✅ src/lib/generateCollectionFiles.ts (223 LOC) - Query file generator
  ✅ src/lib/traceImports.ts (86 LOC) - Import resolver
  ✅ src/lib/resolveConfigPath.ts (22 LOC) - Path resolver
  ✅ src/lib/resolveConvexUrl.ts (45 LOC) - URL resolver
  ✅ src/lib/logger.ts (30 LOC) - Logging utility

Total: ~2,100 LOC of working CLI code
```

### create-vexcms Package (SCAFFOLDER PRESERVED, TEMPLATES CLEARED)
```
✅ packages/create-vexcms/src/**/*.ts    - Scaffolder logic preserved
✅ packages/create-vexcms/package.json   - Updated to 0.1.0-alpha.1
✅ packages/create-vexcms/tsconfig.json  - Preserved

Files Preserved:
  ✅ src/index.ts - CLI entry point
  ✅ src/installers/ - Installation logic (base, nextjs, providers)
  ✅ src/helpers/ - File operations
  ✅ src/utils/ - Validation, messages
  ✅ src/__tests__/ - Tests

Files Cleared (but archived):
  ❌ templates/base-nextjs/ → .rebuild/reference/create-vexcms-templates/
  ❌ templates/marketing-site/ → .rebuild/reference/create-vexcms-templates/

Why cleared:
  - Templates reference old package names (@vexcms/admin-next, etc.)
  - Better to rebuild templates with new structure as you build packages
  - Templates dogfood your packages - forces them to work correctly
```

### Apps
```
✅ apps/www/                     - Marketing site (deps updated to workspace:*)
❌ apps/demo/                    - DELETED
```

## 📦 What's Archived (For Reference)

### Tests (To Be Ported)
```
.rebuild/archived-tests/
├── core/          (~57 test files)
├── cli/           (test files)
├── ui/            (test files - package now called 'react')
├── admin-next/    (test files - package now called 'next')
└── ...
```

### Reference Implementation (To Study While Rebuilding)
```
.rebuild/reference/
├── core-valueTypes/              Field type system
├── core-permissions/             Permission system
├── core-migrations/              Schema diffing & migration
├── core-convex/                  Convex runtime helpers
└── create-vexcms-templates/      Old templates for reference
    ├── base-nextjs/
    └── marketing-site/
```

## ❌ What's Being Deleted

### Cleared for Rebuild
```
❌ packages/core/src/            (except index.ts stub) - Remove columnDef files
❌ packages/react/src/           (except index.ts stub - was 'ui') - Add column registry
❌ packages/next/src/            (except index.ts stub - was 'admin-next') - Wire framework components
❌ packages/better-auth/src/     (except index.ts stub) - Rebuild with new field types
```

### Preserved for Later Testing
```
✅ packages/storage-convex/src/  (was 'file-storage-convex') - Only 95 LOC, stable interface
✅ packages/richtext-plate/src/  (was 'richtext') - 2,936 LOC, test in Week 5
```

### Completely Deleted
```
❌ apps/demo/                    - Demo app
❌ packages/*/dist/              - All build outputs
❌ packages/*/node_modules/      - All package node_modules
❌ node_modules/                 - Root node_modules
❌ .turbo/                       - Turbo cache
```

### Cleared But Scaffolder Kept
```
❌ packages/create-vexcms/templates/base-nextjs/
❌ packages/create-vexcms/templates/marketing-site/
✅ packages/create-vexcms/src/   (scaffolder logic KEPT)
```

## 🔄 What's Being Renamed

```
packages/ui/                     → packages/react/
packages/admin-next/             → packages/next/
packages/file-storage-convex/    → packages/storage-convex/
packages/richtext/               → packages/richtext-plate/
packages/create-cli/             → packages/create-vexcms/
```

## 📊 Size Comparison

### Before Reset
```
Total LOC (all packages): ~50,000+
  - core: ~15,000
  - ui (react): ~8,000
  - admin-next (next): ~6,000
  - cli: ~2,100
  - create-cli: ~15,000 (mostly templates)
  - others: ~4,000
```

### After Reset (Preserved Code)
```
Total LOC preserved: ~2,100 (CLI only)
  - cli: ~2,100 ✅ (working, can use immediately)
  - create-vexcms scaffolder: ~800 ✅ (logic only, templates cleared)
  - Other packages: 0 (to be rebuilt)
```

### In Archive (For Reference)
```
Total LOC archived:
  - Tests: ~5,000+ (to be ported)
  - Reference implementation: ~25,000+ (for study)
  - Templates: ~10,000 (create-vexcms)
```

## 🎯 Why This Strategy?

### CLI Preserved Because:
1. ✅ **Need it immediately** - Can't develop without schema generation
2. ✅ **Well-tested** - 2,100 LOC of working code
3. ✅ **Minimal deps** - Only chokidar + jiti
4. ✅ **Test as you build** - Generate schema for field types you implement
5. ✅ **Can refactor later** - After 0.1.0 with full context

### create-vexcms Scaffolder Preserved Because:
1. ✅ **Complex logic** - File operations, installers, validation (~800 LOC)
2. ✅ **Not critical for development** - Don't need it to build core packages
3. ✅ **Can update incrementally** - Add templates as packages are built

### create-vexcms Templates Cleared Because:
1. ❌ **Reference old packages** - Would need total rewrite anyway
2. ✅ **Dogfooding mechanism** - Forces new packages to actually work
3. ✅ **Clean slate** - Build templates that match new architecture
4. ✅ **Archived for reference** - Can see old structure in .rebuild/reference/

## 🚀 Development Flow After Reset

### Week 1: Field Types
```bash
cd packages/core
# CLI works → can test schema generation
pnpm ../cli/src/index.ts dev
# As you implement text(), number(), etc.
```

### Week 2-4: Core Packages
```bash
# Build defineConfig, permissions, etc.
# Use CLI to test
# www app can dogfood your work
```

### Week 5: Create Base Template
```bash
cd packages/create-vexcms/templates/base-nextjs
# Build fresh template with:
# - vex.config.ts using new @vexcms/next
# - Admin route
# - Proper imports

# Test
npx create-vexcms test-app
cd test-app
pnpm vex dev
# ✅ Works!
```

### Week 6+: Complete Rebuild
```bash
# All packages working
# Templates working
# Ready for 0.1.0
```

## ✅ Summary

**Preserved for immediate use:**
- ✅ CLI (~2,100 LOC) - **Use from day 1**
- ✅ create-vexcms scaffolder (~800 LOC) - **Update templates as you build**
- ✅ storage-convex (~95 LOC) - **Stable interface, likely works as-is**
- ✅ richtext-plate (~2,936 LOC) - **Test in Week 5, rebuild only if needed**
- ✅ Infrastructure (turbo, tsconfig, build configs) - **Works perfectly**

**Archived for reference:**
- 📦 All tests (~5,000+ LOC) - **Port as you rebuild**
- 📦 Reference implementation (~25,000+ LOC) - **Study while building**
- 📦 Old templates (~10,000 LOC) - **Reference for new templates**

**Cleared for rebuild:**
- ❌ core - **Rebuild field types with new folder structure (~15,000 LOC)**
- ❌ react (was ui) - **Build column factories using core helpers (~8,000 LOC)**
- ❌ next (was admin-next) - **Wire framework components (~6,000 LOC)**
- ❌ better-auth - **Tightly coupled to core field types (~635 LOC)**
- ❌ demo app - **Not needed**
- ❌ Templates - **Rebuild with new structure**

This gives you:
1. **Working CLI immediately** → Can develop and test
2. **Tests to port** → Clear implementation spec
3. **Reference code** → Don't have to guess
4. **Clean core packages** → Fresh start for foundational logic
5. **Infrastructure intact** → pnpm, turbo, tsconfig all work
