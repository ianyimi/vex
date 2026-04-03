# CLI Package Decision Guide

## The Question

Should you **preserve the old CLI** or **rebuild it from scratch**?

This is a critical decision that affects your entire rebuild workflow.

## TL;DR Recommendation

**✅ PRESERVE THE CLI** - Use the working CLI during rebuild, refactor later.

**Why:** The CLI is your development tooling. Without it, you can't test anything you build. Rebuilding it first means ~1 week of work before you can develop any other packages.

---

## Option 1: Preserve CLI ✅ RECOMMENDED

### What This Means

Keep the ~2,100 lines of working CLI code from the old version:
- `packages/cli/src/` stays intact
- Imports updated to match new package names
- Ready to use immediately

### Workflow

```bash
# Day 1: Reset complete, CLI works
./scripts/rebuild-reset-preserve-cli-clear-templates.sh

cd apps/www
pnpm vex dev
# ✅ Works! Schema generation, file watching, everything

# Day 2-30: Build other packages while using CLI
cd packages/core
# Implement text() field
# Run vex dev → generates schema → test in www app

# After 0.1.0 ships: Refactor CLI
# Now you understand the system deeply
# Can improve the CLI with full context
```

### Pros

✅ **Use vex dev immediately** - Critical for development
✅ **Test as you build** - Generate schema for field types you implement
✅ **Focus on core first** - Field types and config are more foundational
✅ **Working reference** - Can study CLI code while building other packages
✅ **Lower risk** - Battle-tested code vs new implementation
✅ **Time savings** - ~1 week saved vs rebuilding

### Cons

⚠️ **Code you don't fully understand** (yet - but you can read it)
⚠️ **Miss "clean slate" feeling** (but it's only ~2,100 LOC)
⚠️ **Deferred refactoring** (but with better context post-0.1.0)

### What the CLI Does (So You Know What You're Keeping)

**3 Commands:**

```bash
vex dev        # Watch config → generate schema → start Convex dev
vex generate   # One-shot schema generation
vex deploy     # Generate + migrate + deploy to prod
```

**Core Functionality:**

1. **Config Loading** (`loadConfig.ts` - 252 LOC)
   - Uses `jiti` to load TypeScript `vex.config.ts`
   - Resolves tsconfig paths
   - Executes plugins

2. **Schema Generation** (`generateSchema.ts` - 436 LOC)
   - Iterates collections → generates Convex schema
   - Handles field types → Convex validators
   - Generates indexes
   - Injects auth/storage tables

3. **File Watching** (`watcher.ts` - 58 LOC)
   - Uses `chokidar` to watch `vex.config.ts`
   - Handles nvim write pattern (unlink→add)
   - Triggers regeneration on change

4. **Convex Process** (`convexProcess.ts` - 197 LOC)
   - Spawns `convex dev` as child process
   - Manages lifecycle
   - Forwards output

5. **Migration** (`migrate.ts` - 261 LOC)
   - 3-phase migration (interim → mutations → final)
   - Handles add/remove fields
   - Safe schema updates

**Dependencies:**
- `chokidar` - File watching
- `jiti` - TypeScript loading

That's it! Very clean.

### Learning Strategy (While Using Preserved CLI)

**Week 1-2: Field Types**
- Implement text(), number(), select()
- Use vex dev to test schema generation
- **Read:** `generateSchema.ts` to understand how fields → validators

**Week 3-4: Config System**
- Implement defineConfig, defineCollection
- **Read:** `loadConfig.ts` to understand config loading

**Week 5-6: Schema Generation (in core)**
- Port schema generation to @vexcms/core
- **Read:** CLI's generateSchema.ts for reference
- Keep CLI's version working alongside

**Week 7-8: Permissions & Convex Runtime**
- Implement hasPermission, getDocument, etc.
- **Read:** How CLI orchestrates everything

**After 0.1.0: Refactor CLI**
- Now you understand the full system
- Rewrite with insights from the rebuild
- Much better than rebuilding blind

---

## Option 2: Rebuild CLI from Scratch

### What This Means

Delete CLI implementation, start fresh:
- `packages/cli/src/` cleared (except index.ts stub)
- Archive old CLI to `.rebuild/reference/cli/`
- Rebuild ~2,100 lines before using vex dev

### Workflow

```bash
# Day 1: Reset complete, CLI empty
./scripts/run-rebuild-reset-CHOOSE.sh
# → Choose option [2] REBUILD CLI

# Day 1-7: Rebuild CLI (can't develop anything else)
cd packages/cli/src

# Implement:
# - Config loader (252 LOC)
# - Schema generator (436 LOC)
# - File watcher (58 LOC)
# - Convex process manager (197 LOC)
# - Migration system (261 LOC)
# - 3 commands (dev, generate, deploy)

# Test extensively (new code = bugs)

# Day 8: CLI finally works
pnpm vex dev
# ✅ (hopefully)

# Day 9+: Now you can start building field types
cd packages/core
# ...
```

### Pros

✅ **Deep understanding** - Every line is yours
✅ **Clean architecture** - Can improve on old design
✅ **Learning opportunity** - Understand CLI internals deeply

### Cons

❌ **~1 week delay** - Can't develop other packages until CLI works
❌ **Can't test anything** - No schema generation = can't verify core code
❌ **Risk of bugs** - New code in critical dev workflow
❌ **Delays 0.1.0** - Field types are blocked on CLI
❌ **Complex logic** - Schema generation has edge cases
❌ **Wrong build order** - CLI is tooling, not foundational CMS logic

### Estimated Time

Based on file sizes and complexity:

| Component | LOC | Estimated Time | Complexity |
|-----------|-----|----------------|------------|
| Config loader | 252 | 1 day | Medium - tsconfig paths tricky |
| Schema generator | 436 | 2-3 days | High - many field type edge cases |
| File watcher | 58 | 2 hours | Low - just chokidar wrapper |
| Convex process | 197 | 4 hours | Medium - process management |
| Migration | 261 | 1-2 days | High - 3-phase logic is subtle |
| Commands | ~200 | 4 hours | Low - orchestration |
| Testing | - | 1 day | Critical - must work reliably |

**Total: 5-7 days of focused work**

And you can't work on anything else during this time because nothing works without the CLI.

---

## Comparison

| Factor | Preserve CLI | Rebuild CLI |
|--------|--------------|-------------|
| **Time to vex dev working** | Immediate | ~1 week |
| **Can test field types** | ✅ Day 1 | ❌ After CLI done |
| **Understanding of CLI** | Gradual | Deep |
| **Risk** | Low (battle-tested) | Medium (new code) |
| **Focus** | Core CMS logic | Dev tooling |
| **0.1.0 timeline** | Faster | Slower |
| **Code quality** | Good (can improve later) | Excellent (if done right) |

## Architecture Note: CLI is NOT Core Logic

The CLI is **development tooling**, not core CMS functionality:

**Core CMS logic** (foundational):
- Field type system (how text(), select() work)
- Config builders (defineConfig, defineCollection)
- Permission system (hasPermission)
- Admin UI components
- Convex runtime helpers

**CLI** (tooling that uses core logic):
- Loads config built with core
- Calls core's schema generation functions
- Watches files and triggers rebuilds
- Manages Convex process

**Implication:** The CLI depends on core, not the other way around. Build core first, CLI second.

But you **need working CLI to test core during development**. This is why preserving the CLI makes sense.

## Decision Framework

**Choose PRESERVE CLI if:**
- ✅ You want to use vex dev immediately
- ✅ You want to test features as you build them
- ✅ You want to focus on core CMS logic first
- ✅ You're okay studying code while you use it
- ✅ You want 0.1.0 to ship faster

**Choose REBUILD CLI if:**
- ✅ You insist on understanding every line before using it
- ✅ You don't mind ~1 week delay before developing other packages
- ✅ You want to improve CLI architecture from the start
- ✅ You enjoy building dev tooling
- ✅ Timeline is not a concern

## My Strong Recommendation

**PRESERVE CLI** for these reasons:

1. **The rebuild plan says:** "Start with field type system" (rebuild-planning.md)
   - You can't test field types without schema generation
   - Schema generation requires a working CLI

2. **From rebuild-scope-v1.md:** "Field types are the atoms of the CMS"
   - These are more foundational than CLI
   - CLI is just tooling that uses field types

3. **Practical workflow:**
   ```
   Day 1:  Implement text() field
   Day 1:  Run vex dev → generates schema with text field
   Day 1:  Test in www app → confirm it works
   Day 2:  Implement number() field
   Day 2:  Run vex dev → schema updates
   Day 2:  Test in www app → works
   ... repeat for all 19 field types ...
   ```

   **vs**

   ```
   Day 1-7: Build CLI (can't test anything)
   Day 8:  Finally can start on text() field
   ```

4. **You can always refactor later:**
   - After 0.1.0 ships, you'll understand the system deeply
   - Refactoring with full context > rebuilding blind

5. **The CLI is only ~2,100 LOC:**
   - Not a massive codebase to understand
   - Can read through it in a few afternoons
   - Minimal dependencies (chokidar + jiti)

---

## Conclusion

**Save yourself a week.** Preserve the CLI, use it to build everything else, refactor it later when you have full context.

The goal of the rebuild is **a production-ready CMS**, not **rewriting every line from scratch**. The CLI works and is well-designed. Use it.
