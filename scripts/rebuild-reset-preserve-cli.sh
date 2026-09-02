#!/bin/bash
set -e

echo "🚀 VexCMS v1 Rebuild - Reset Script (Preserve CLI)"
echo "===================================================="
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

# Archive all test files
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

# CLI is preserved, so just note it
echo "   ℹ️  CLI implementation will be preserved (not archived)"

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

# Step 5: Clear implementation code (EXCEPT CLI)
echo ""
echo "🧹 Step 5: Clearing implementation code (preserving CLI)..."

for pkg in core react next better-auth storage-convex richtext-plate create-vexcms; do
  pkg_dir="packages/$pkg"

  if [ ! -d "$pkg_dir" ]; then
    echo "   ⚠️  $pkg not found, skipping"
    continue
  fi

  # Remove dist and node_modules
  rm -rf "$pkg_dir/dist"
  rm -rf "$pkg_dir/node_modules"

  # Clear src but keep structure
  if [ -d "$pkg_dir/src" ]; then
    rm -rf "$pkg_dir/src"
    mkdir -p "$pkg_dir/src"
    echo "// @vexcms/$pkg v0.1.0-alpha.1 - To be implemented" > "$pkg_dir/src/index.ts"
  fi

  echo "   ✓ Cleared $pkg (kept package structure)"
done

# Special handling for CLI - only clean build artifacts
echo ""
echo "🔧 Preserving CLI implementation..."
if [ -d "packages/cli" ]; then
  rm -rf packages/cli/dist
  rm -rf packages/cli/node_modules
  echo "   ✓ Preserved CLI source code (only cleaned build artifacts)"
else
  echo "   ⚠️  CLI package not found"
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
echo "   ✓ CLI implementation preserved in packages/cli/src/"
echo "   ✓ Other packages cleared for rebuild"
echo ""
echo "Next steps:"
echo "  1. Run: node scripts/reset-packages.mjs"
echo "  2. Run: node scripts/setup-alpha-changesets.mjs"
echo "  3. Run: pnpm install"
echo "  4. Fix CLI imports (old package names → new names)"
echo "  5. Run: git add -A && git commit -m 'Reset for v1 rebuild (preserve CLI)'"
