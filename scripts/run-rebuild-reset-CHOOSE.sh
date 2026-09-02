#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║          VexCMS v1 Rebuild - Complete Reset               ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "master" ]; then
  echo "❌ ERROR: You're on master branch!"
  echo ""
  echo "Please create a new branch first:"
  echo "  git checkout -b v1-rebuild"
  echo ""
  exit 1
fi

echo "✅ Current branch: $BRANCH"
echo ""

# Choose CLI strategy
echo "════════════════════════════════════════════════════════════"
echo ""
echo "CLI Package Strategy:"
echo ""
echo "  [1] PRESERVE CLI (Recommended)"
echo "      • Keep working CLI from old version"
echo "      • Use 'vex dev' immediately during rebuild"
echo "      • ~2,100 LOC, minimal dependencies"
echo "      • Can refactor later after 0.1.0"
echo ""
echo "  [2] REBUILD CLI"
echo "      • Start from scratch"
echo "      • Deep understanding of every line"
echo "      • ~1 week of work before using 'vex dev'"
echo "      • Blocks other package development"
echo ""
read -p "Choose strategy (1 or 2): " cli_strategy

if [ "$cli_strategy" != "1" ] && [ "$cli_strategy" != "2" ]; then
  echo "❌ Invalid choice. Exiting."
  exit 1
fi

echo ""

# Confirm
read -p "⚠️  This will DESTRUCTIVELY reset the repository. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Aborted."
  exit 0
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 1: Reset structure
echo "STEP 1/7: Reset repository structure"
echo "────────────────────────────────────────────────────────────"
if [ "$cli_strategy" = "1" ]; then
  echo "Using: preserve CLI strategy"
  chmod +x scripts/rebuild-reset-preserve-cli.sh
  ./scripts/rebuild-reset-preserve-cli.sh
else
  echo "Using: rebuild CLI strategy"
  chmod +x scripts/rebuild-reset.sh
  ./scripts/rebuild-reset.sh
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 2: Reset package versions
echo "STEP 2/7: Reset package versions to 0.1.0-alpha.1"
echo "────────────────────────────────────────────────────────────"
node scripts/reset-packages.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 3: Configure changesets
echo "STEP 3/7: Configure changesets for alpha versioning"
echo "────────────────────────────────────────────────────────────"
node scripts/setup-alpha-changesets.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 4: Update www deps
echo "STEP 4/7: Update www app dependencies"
echo "────────────────────────────────────────────────────────────"
node scripts/update-www-deps.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 5: Add ESLint
echo "STEP 5/7: Add ESLint + JSDoc dependencies"
echo "────────────────────────────────────────────────────────────"
node scripts/add-eslint-deps.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 6: Fix CLI imports (only if preserving)
if [ "$cli_strategy" = "1" ]; then
  echo "STEP 6/7: Fix CLI imports for renamed packages"
  echo "────────────────────────────────────────────────────────────"
  node scripts/fix-cli-imports.mjs
else
  echo "STEP 6/7: (Skipped - CLI will be rebuilt)"
  echo "────────────────────────────────────────────────────────────"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 7: Install dependencies
echo "STEP 7/7: Installing dependencies"
echo "────────────────────────────────────────────────────────────"
pnpm install

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✨ Reset complete!"
echo ""

if [ "$cli_strategy" = "1" ]; then
  echo "✅ CLI PRESERVED"
  echo ""
  echo "The CLI implementation has been kept from the old version:"
  echo "  • packages/cli/src/ contains working implementation"
  echo "  • Imports updated to match new package names"
  echo "  • Ready to use 'vex dev' immediately"
  echo ""
  echo "You can:"
  echo "  1. Test it: cd apps/www && pnpm vex dev"
  echo "  2. Study it while building other packages"
  echo "  3. Refactor it later after 0.1.0 ships"
else
  echo "✅ CLI CLEARED FOR REBUILD"
  echo ""
  echo "The CLI will need to be rebuilt before you can:"
  echo "  • Use 'vex dev' for auto schema generation"
  echo "  • Test schema generation for field types"
  echo ""
  echo "Estimated effort: ~1 week"
  echo "Reference: .rebuild/reference/cli/ (archived implementation)"
fi

echo ""
echo "Next steps:"
echo "  1. Commit: git add -A && git commit -m 'chore: reset for v1 rebuild'"
echo "  2. Review: cat .rebuild/RESET-SUMMARY.md"
echo "  3. Start building: Follow rebuild-scope-v1.md"
echo ""
echo "Good luck! 🚀"
echo ""
