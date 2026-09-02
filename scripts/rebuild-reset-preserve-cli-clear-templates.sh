#!/bin/bash
set -e

echo "🚀 VexCMS v1 Rebuild - Reset Script"
echo "===================================="
echo "   Preserve: CLI + create-vexcms scaffolder"
echo "   Clear: create-vexcms templates"
echo ""

# Confirm we're on a branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "master" ]; then
  echo "❌ ERROR: You're on master branch. Create a new branch first:"
  echo "   git checkout -b v1-rebuild"
  exit 1
fi

echo "✅ Current branch: $BRANCH"
echo ""

# Step 1: Archive tests
echo "📦 Step 1: Archiving tests..."
mkdir -p .rebuild/archived-tests
mkdir -p .rebuild/reference

find packages -name "*.test.ts" -type f | while read file; do
  rel_path="${file#packages/}"
  pkg_name=$(echo "$rel_path" | cut -d'/' -f1)
  target_dir=".rebuild/archived-tests/$pkg_name"
  mkdir -p "$target_dir"
  cp "$file" "$target_dir/"
done

echo "   ✓ Archived $(find .rebuild/archived-tests -name "*.test.ts" | wc -l) test files"

# Step 2: Archive key implementation for reference
echo ""
echo "📚 Step 2: Archiving reference implementation..."

# Core
if [ -d "packages/core/src/valueTypes" ]; then
  cp -r packages/core/src/valueTypes .rebuild/reference/core-valueTypes
  echo "   ✓ Archived core/valueTypes"
fi

if [ -d "packages/core/src/permissions" ]; then
  cp -r packages/core/src/permissions .rebuild/reference/core-permissions
  echo "   ✓ Archived core/permissions"
fi

if [ -d "packages/core/src/migrations" ]; then
  cp -r packages/core/src/migrations .rebuild/reference/core-migrations
  echo "   ✓ Archived core/migrations"
fi

if [ -d "packages/core/src/convex" ]; then
  cp -r packages/core/src/convex .rebuild/reference/core-convex
  echo "   ✓ Archived core/convex"
fi

# Archive create-vexcms templates for reference
if [ -d "packages/create-cli/templates" ]; then
  cp -r packages/create-cli/templates .rebuild/reference/create-vexcms-templates
  echo "   ✓ Archived create-cli/templates (for reference)"
fi

echo "   ℹ️  CLI and create-vexcms scaffolder preserved"

# Step 3: Delete demo app
echo ""
echo "🗑️  Step 3: Deleting demo app..."
if [ -d "apps/demo" ]; then
  rm -rf apps/demo
  echo "   ✓ Deleted apps/demo"
else
  echo "   ⚠️  apps/demo not found (already deleted?)"
fi

# Step 4: Rename packages
echo ""
echo "📝 Step 4: Renaming packages..."

rename_if_exists() {
  local from=$1
  local to=$2
  if [ -d "packages/$from" ] && [ ! -d "packages/$to" ]; then
    mv "packages/$from" "packages/$to"
    echo "   ✓ Renamed $from → $to"
  elif [ ! -d "packages/$from" ]; then
    echo "   ⚠️  $from not found (already renamed?)"
  else
    echo "   ⚠️  $to already exists, skipping"
  fi
}

rename_if_exists "ui" "react"
rename_if_exists "admin-next" "next"
rename_if_exists "file-storage-convex" "storage-convex"
rename_if_exists "richtext" "richtext-plate"
rename_if_exists "create-cli" "create-vexcms"

# Step 5: Clear implementation code (EXCEPT CLI, create-vexcms scaffolder, storage-convex, richtext-plate)
echo ""
echo "🧹 Step 5: Clearing implementation..."
echo "   Rebuilding: core, react, next, better-auth"
echo "   Preserving: CLI, create-vexcms, storage-convex, richtext-plate"
echo ""

for pkg in core react next better-auth; do
  pkg_dir="packages/$pkg"

  if [ ! -d "$pkg_dir" ]; then
    echo "   ⚠️  $pkg not found, skipping"
    continue
  fi

  rm -rf "$pkg_dir/dist"
  rm -rf "$pkg_dir/node_modules"

  if [ -d "$pkg_dir/src" ]; then
    rm -rf "$pkg_dir/src"
    mkdir -p "$pkg_dir/src"
    echo "// @vexcms/$pkg v0.1.0-alpha.1 - To be implemented" > "$pkg_dir/src/index.ts"
  fi

  echo "   ✓ Cleared $pkg"
done

# Clean build artifacts from preserved packages but keep source
for pkg in storage-convex richtext-plate; do
  pkg_dir="packages/$pkg"

  if [ ! -d "$pkg_dir" ]; then
    echo "   ⚠️  $pkg not found, skipping"
    continue
  fi

  rm -rf "$pkg_dir/dist"
  rm -rf "$pkg_dir/node_modules"
  echo "   ✓ Preserved $pkg source, cleaned build artifacts"
done

# Special handling for CLI
echo ""
echo "🔧 Preserving CLI implementation..."
if [ -d "packages/cli" ]; then
  rm -rf packages/cli/dist
  rm -rf packages/cli/node_modules
  echo "   ✓ CLI source preserved, cleaned build artifacts"
else
  echo "   ⚠️  CLI package not found"
fi

# Special handling for create-vexcms
echo ""
echo "📦 Handling create-vexcms..."
if [ -d "packages/create-vexcms" ]; then
  rm -rf packages/create-vexcms/dist
  rm -rf packages/create-vexcms/node_modules

  # Clear templates but keep scaffolder
  if [ -d "packages/create-vexcms/templates" ]; then
    echo "   ℹ️  Clearing templates (archived to .rebuild/reference/)"
    rm -rf packages/create-vexcms/templates/*

    # Create placeholder READMEs
    mkdir -p packages/create-vexcms/templates/base-nextjs
    mkdir -p packages/create-vexcms/templates/marketing-site

    echo "# Base Next.js Template

To be rebuilt with v1 package structure.

See archived template at: .rebuild/reference/create-vexcms-templates/base-nextjs/" > packages/create-vexcms/templates/base-nextjs/README.md

    echo "# Marketing Site Template

To be rebuilt with v1 package structure.

See archived template at: .rebuild/reference/create-vexcms-templates/marketing-site/" > packages/create-vexcms/templates/marketing-site/README.md

    echo "   ✓ Templates cleared (scaffolder preserved)"
  fi

  echo "   ✓ create-vexcms scaffolder preserved"
else
  echo "   ⚠️  create-vexcms package not found"
fi

# Step 6: Clean build artifacts
echo ""
echo "🧼 Step 6: Cleaning build artifacts..."
rm -rf .turbo
rm -rf node_modules
echo "   ✓ Cleaned .turbo and root node_modules"

echo ""
echo "✅ Reset complete!"
echo ""
echo "Preserved:"
echo "  ✓ CLI implementation (packages/cli/src/) - ~2,100 LOC"
echo "  ✓ create-vexcms scaffolder (packages/create-vexcms/src/) - ~800 LOC"
echo "  ✓ storage-convex (packages/storage-convex/src/) - ~95 LOC, stable interface"
echo "  ✓ richtext-plate (packages/richtext-plate/src/) - ~2,936 LOC, test later"
echo "  ✓ Turbo config (turbo.json, pnpm-workspace.yaml)"
echo "  ✓ TSConfig files (packages/tsconfig/)"
echo ""
echo "Cleared for Rebuild:"
echo "  ✗ core - Remove columnDef files, rebuild field types"
echo "  ✗ react (was ui) - Move columnDef logic here, add registry"
echo "  ✗ next (was admin-next) - Provide framework components"
echo "  ✗ better-auth - Rebuild with new field type system"
echo "  ✗ create-vexcms templates (archived to .rebuild/reference/)"
echo ""
echo "Next steps:"
echo "  1. Run: node scripts/reset-packages.mjs"
echo "  2. Run: node scripts/setup-alpha-changesets.mjs"
echo "  3. Run: pnpm install"
echo "  4. Fix CLI imports: node scripts/fix-cli-imports.mjs"
echo "  5. Start with core field types (Week 1-2)"
echo "  6. Move to react package (Week 3-6)"
echo "  7. Test richtext-plate integration (Week 5)"
echo "  8. Rebuild better-auth (Week 3)"
echo "  9. Commit: git add -A && git commit -m 'Reset for v1 rebuild'"
