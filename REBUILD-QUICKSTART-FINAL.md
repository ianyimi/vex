# VexCMS v1 Rebuild - Quickstart

## 📖 READ THIS FIRST

**For complete rebuild instructions, read: `REBUILD-MASTER-GUIDE.md`**

This quickstart is a condensed reference. The master guide includes:
- Complete architecture explanation
- Package responsibilities
- Convex query architecture (core owns queries, frameworks call them)
- Development workflow
- Critical considerations
- Type flow examples

## ✅ Recommended Approach

**Preserve CLI + create-vexcms scaffolder + stable adapters, clear/rebuild rest**

This gives you:
- ✅ Working `vex dev` from day 1
- ✅ Test packages as you build them
- ✅ Focus on core CMS logic first
- ✅ Update templates incrementally
- ✅ Centralized Convex queries in core
- ✅ Framework-agnostic foundation

## 🚀 Execute the Reset (Single Command)

```bash
# 1. Make sure you're on a branch
git checkout -b v1-rebuild

# 2. Run the reset
chmod +x scripts/rebuild-reset-preserve-cli-clear-templates.sh
./scripts/rebuild-reset-preserve-cli-clear-templates.sh

# 3. Update package versions
node scripts/reset-packages.mjs

# 4. Configure changesets for alpha
node scripts/setup-alpha-changesets.mjs

# 5. Update www app dependencies
node scripts/update-www-deps.mjs

# 6. Add ESLint + JSDoc enforcement
node scripts/add-eslint-deps.mjs

# 7. Fix CLI imports (package renames)
node scripts/fix-cli-imports.mjs

# 8. Install dependencies
pnpm install

# 9. Verify CLI works
cd apps/www
pnpm vex dev
# ✅ Should work! (might error on missing @vexcms/core exports, but that's expected)

# 10. Commit
git add -A
git commit -m "chore: reset for v1 rebuild (preserve CLI + scaffolder)"
git push origin v1-rebuild
```

**Time:** ~5 minutes

## ✅ What You'll Have

### Working Immediately
- ✅ `vex dev` command works
- ✅ CLI watches `vex.config.ts` and regenerates schema
- ✅ Turbo commands work (`pnpm dev`, `pnpm build`, `pnpm test`)
- ✅ TSConfig properly configured
- ✅ ESLint + JSDoc enforcement ready

### Ready to Build
- ✅ Empty `packages/core/src/` - Start with field types (NO React dependencies)
- ✅ Empty `packages/react/src/` - Build UI components (move columnDefs here)
- ✅ Empty `packages/next/src/` - Build Next.js integration (wire framework components)
- ✅ Empty `packages/better-auth/src/` - Rebuild with new field types
- ✅ Preserved `packages/storage-convex/src/` - Test later, likely works as-is
- ✅ Preserved `packages/richtext-plate/src/` - Test in Week 5
- ✅ Tests archived to `.rebuild/archived-tests/`
- ✅ Reference code in `.rebuild/reference/`

### To Build Later
- ⏳ `create-vexcms` templates - Rebuild as packages are done (week 5+)
- ⏳ CLI refactor - After 0.1.0 ships (optional)

## 📋 Post-Reset Checklist

```bash
# Verify packages renamed correctly
ls packages/
# Should see: core, react, next, cli, better-auth, storage-convex, richtext-plate, create-vexcms

# Verify CLI source preserved
ls packages/cli/src/
# Should see: index.ts, commands/, lib/

# Verify tests archived
ls .rebuild/archived-tests/core/
# Should see ~57 .test.ts files

# Verify turbo config intact
cat turbo.json
# Should see build, dev, test tasks

# Test CLI (expected to have errors, but should run)
cd apps/www
pnpm vex dev
# Expected: "Cannot find module '@vexcms/core'" - GOOD! This means CLI runs
# You'll implement @vexcms/core next
```

## ⚠️ Critical Architecture Change

**Core package main export must have ZERO React imports** (so CLI works in Node.js).

**Solution:** Optional peer dependencies + multi-entry exports + colocated code

**What's changing:**
- ✅ **ColumnDefs STAY in core** (colocated with field types)
- ✅ **React Table stays as dependency** (but optional peer dep)
- ➕ **Multi-entry exports:**
  - `@vexcms/core` - Main export (NO React imports) - CLI uses this
  - `@vexcms/core/columns` - Column generation (React imports) - Admin UI uses this
  - `@vexcms/core/components` - Component types (React imports)

**File structure:**
```
packages/core/src/fields/
  text.ts              ✅ Field factory (no React)
  text/columnDef.tsx   ✅ Column def (React) - COLOCATED!
```

**Usage:**
```typescript
// CLI (Node.js) - NO React installed
import { text, generateVexSchema } from '@vexcms/core'

// Admin UI (React) - React installed
import { generateColumns } from '@vexcms/core/columns'
import { VexLink } from '@vexcms/core/components'
```

**Framework adapters:**
```typescript
// packages/next/src/components/VexLink.tsx
import NextLink from 'next/link'
import type { VexLinkProps } from '@vexcms/core/components'

export function VexLink({ href, children }: VexLinkProps) {
  return <NextLink href={href}>{children}</NextLink>
}
```

**See `.rebuild/GENERIC-HELPERS-AND-TYPES.md` for the complete recommended approach.**

This approach gives you:
1. **Generic helpers** - Framework packages avoid repetitive switch statements
2. **Type-safe components** - Field defs accept TComponent generic, framework packages provide concrete types
3. **Complete validation** - `defineFrameworkPackage` validates both views and components

## 🛠️ Development Workflow

### Week 1: Field Types (packages/core)

```bash
cd packages/core

# 1. Create field folder
mkdir -p src/fields/text

# 2. Create config.ts (type definition + factory)
cat > src/fields/text/config.ts << 'EOF'
/**
 * Text field type definition.
 */
export interface TextFieldDef<TComponent = unknown> {
  type: 'text'
  label?: string
  required?: boolean
  defaultValue?: string
  admin?: {
    cellAlignment?: 'left' | 'center' | 'right'
    hidden?: boolean
    components?: { Cell?: TComponent; Edit?: TComponent }
  }
}

/**
 * Creates a text field definition.
 */
export function text<TComponent = unknown>(
  options?: Omit<TextFieldDef<TComponent>, 'type'>
): TextFieldDef<TComponent> {
  return { type: 'text', ...options }
}
EOF

# 3. Create helpers.ts (field-specific helpers)
cat > src/fields/text/helpers.ts << 'EOF'
export function getTextFieldLabel(field, fieldKey) { /* ... */ }
export function formatTextCellValue(value) { /* ... */ }
EOF

# 4. Create schemaValueType.ts (Convex schema converter)
cat > src/fields/text/schemaValueType.ts << 'EOF'
export function textToValueType(field) { /* ... */ }
EOF

# 5. Create index.ts (re-exports)
cat > src/fields/text/index.ts << 'EOF'
export * from './config'
export * from './helpers'
export * from './schemaValueType'
EOF

# 6. Port test
cp ../../.rebuild/archived-tests/core/text.test.ts src/fields/text/config.test.ts

# 7. Run test
pnpm test

# 8. Lint
pnpm lint

# 9. Commit
git add .
git commit -m "feat(core): implement text field type"
pnpm changeset
```

**Each field gets its own folder with:**
- `config.ts` - Type definition + factory
- `helpers.ts` - Field-specific helpers
- `schemaValueType.ts` - Convex schema converter
- `index.ts` - Re-exports
- `*.test.ts` - Tests

### Week 2-4: Complete Core + Better Auth

**Core:**
- Config builders (defineConfig, defineCollection, etc.)
- Schema generation (generateVexSchema, generateVexTypes)
- Permissions (hasPermission, checkAdminAccess)
- Convex runtime (getDocument, listDocuments, etc.)
- **IMPORTANT:** No columnDef files, no React dependencies

**Better Auth (Week 3):**
- Rebuild `extractAuthCollections()` with new field type system
- Port tests from `.rebuild/archived-tests/better-auth/`
- ~1-2 days of work

### Week 5-6: React UI

**Column System (NEW architecture):**
- Create column registry (`packages/react/src/admin/columns/registry.ts`)
- Implement `VexColumnContext` for framework components
- Move all columnDef logic from old core package
- Create column factories for all 19 field types

**Admin Components:**
- DashboardView, ListView, EditView, etc.
- Form components (TextField, SelectField, BlockEditor, etc.)
- Data hooks (useCollectionDocuments, etc.)

**Validation:**
- Implement `validateCompleteness()` function
- Wire into CLI `vex dev` command

**Testing (Week 5 - CRITICAL):**
- Test richtext-plate integration with new react package
- If works → keep for 0.1.0
- If broken → defer to 0.2.0

### Week 7-8: Next.js Integration

**Framework Integration:**
- AdminLayout - Navigation wrapper component (users import in layout.tsx)
- AdminPage - Smart routing + preloading component (users import in [...slug]/page.tsx)
- Component adapters (VexLink, VexImage)
- All preloading handled internally

**User's admin routes (zero boilerplate):**
```typescript
// app/admin/layout.tsx
import { AdminLayout } from '@vexcms/next'
export default ({ children }) => <AdminLayout>{children}</AdminLayout>

// app/admin/[...slug]/page.tsx
import { AdminPage } from '@vexcms/next'
export default ({ params }) => <AdminPage slug={params.slug} />
```

**Testing:**
- Navigate to /admin (dashboard)
- Navigate to /admin/posts (list view)
- Navigate to /admin/posts/123 (edit view)
- Test storage-convex adapter

### Week 9: Final Testing & Polish

- Test storage-convex (should work as-is)
- Test all field types in admin panel
- Verify CLI validation warnings work
- Fix any remaining bugs

### Week 10: Scaffold Templates

Now that packages work, rebuild templates:

```bash
cd packages/create-vexcms/templates/base-nextjs

# Create fresh template that uses new packages
# Reference old template: ../../.rebuild/reference/create-vexcms-templates/base-nextjs/

# Create vex.config.ts
cat > vex.config.ts << 'EOF'
import { defineConfig } from '@vexcms/next'  // ← New name!
import { betterAuth } from '@vexcms/better-auth'
import { convexStorage } from '@vexcms/storage-convex'
// ...
EOF

# Test scaffolding
cd ../../../..
npx create-vexcms test-app
cd test-app
pnpm install
pnpm vex dev
pnpm dev
# ✅ Should work!
```

## 📚 Key Documents

Read in this order:

1. **`.rebuild/WHATS-PRESERVED.md`** - What's kept vs cleared (5 min)
2. **`.rebuild/ARCHITECTURE-SEPARATION.md`** - Package responsibilities & separation (15 min)
3. **`.rebuild/CLI-DECISION-GUIDE.md`** - Why preserve CLI (10 min)
4. **`.rebuild/RESET-SUMMARY.md`** - Complete overview (10 min)
5. **`agent-os/product/architecture/rebuild-scope-v1.md`** - What ships in 0.1.0 (15 min)

## 🎯 Success Criteria (0.1.0 Release)

From rebuild-scope-v1.md:

- [ ] Marketing site (www) runs on rebuild
- [ ] All 560+ ported tests pass
- [ ] All 19 field types implemented with React components
- [ ] All admin views functional (dashboard, list, edit, media-list, media-edit, global-edit)
- [ ] CLI auto-migration works for add/remove fields
- [ ] Better Auth integration works with user sign-in + role assignment
- [ ] Convex storage integration works for upload/display/delete
- [ ] JSDoc on all exported symbols
- [ ] create-vexcms scaffolds working apps

Then: Drop `-alpha` tag → Release `0.1.0` → 🎉

## 🆘 Troubleshooting

### "Cannot find module '@vexcms/core'"
✅ **Expected during early rebuild.** Implement @vexcms/core exports as you go.

### CLI doesn't run
```bash
# Check imports were fixed
grep -r "admin-next" packages/cli/src/
# Should return nothing

# Manually fix if needed
node scripts/fix-cli-imports.mjs
```

### pnpm install fails
```bash
# Clear lock file and retry
rm pnpm-lock.yaml
pnpm install
```

### Turbo commands don't work
```bash
# Verify turbo.json wasn't deleted
cat turbo.json

# Should show build, dev, test tasks
```

## 📝 Commit Message Template

```
chore: reset repository for v1 rebuild

Preserved:
- CLI implementation (~2,100 LOC) for immediate use
- create-vexcms scaffolder (~800 LOC)
- Infrastructure (turbo, tsconfig, pnpm workspace)

Cleared:
- Package implementations (core, react, next, adapters)
- create-vexcms templates (archived to .rebuild/reference/)
- apps/demo

Archived:
- All tests to .rebuild/archived-tests/ (for porting)
- Reference implementation to .rebuild/reference/ (for study)

All packages reset to 0.1.0-alpha.1
Changesets configured for alpha versioning
ESLint + JSDoc enforcement enabled
```

---

**Ready to start?** Run the reset and begin with field types! 🚀
