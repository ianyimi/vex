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
echo "STEP 1/6: Reset repository structure"
echo "────────────────────────────────────────────────────────────"
chmod +x scripts/rebuild-reset.sh
./scripts/rebuild-reset.sh

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 2: Reset package versions
echo "STEP 2/6: Reset package versions to 0.1.0-alpha.1"
echo "────────────────────────────────────────────────────────────"
node scripts/reset-packages.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 3: Configure changesets
echo "STEP 3/6: Configure changesets for alpha versioning"
echo "────────────────────────────────────────────────────────────"
node scripts/setup-alpha-changesets.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 4: Update www deps
echo "STEP 4/6: Update www app dependencies"
echo "────────────────────────────────────────────────────────────"
node scripts/update-www-deps.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 5: Add ESLint
echo "STEP 5/6: Add ESLint + JSDoc dependencies"
echo "────────────────────────────────────────────────────────────"
node scripts/add-eslint-deps.mjs

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Step 6: Install dependencies
echo "STEP 6/6: Installing dependencies"
echo "────────────────────────────────────────────────────────────"
pnpm install

echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
echo "✨ Reset complete!"
echo ""
echo "Repository reset to v1 rebuild starting point:"
echo "  • All packages reset to 0.1.0-alpha.1"
echo "  • Tests archived to .rebuild/archived-tests/"
echo "  • Reference code archived to .rebuild/reference/"
echo "  • ESLint + JSDoc enforcement configured"
echo "  • Changesets configured for alpha releases"
echo ""
echo "Next steps:"
echo "  1. Review: cat scripts/REBUILD-RESET-INSTRUCTIONS.md"
echo "  2. Commit: git add -A && git commit -m 'chore: reset for v1 rebuild'"
echo "  3. Start building: Follow rebuild-scope-v1.md"
echo ""
echo "Good luck! 🚀"
echo ""
