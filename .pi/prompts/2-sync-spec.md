---
name: 2-sync-spec
description: Post-implementation upkeep for vexcms. Extracts developer patterns, updates developer-preferences.md and dev-spec, runs typecheck/test/document, and logs decisions.
invoke: "sync-spec"
---

# Sync Spec — vexcms

Run at natural stopping points: end of session, after a PR, after implementing a feature.

**Project:** vexcms
**Language:** TypeScript

---

> **Questions:** Use the `ask_user_question` tool for every question. Never write question lists as plain text.

---

## Part 1 — Pattern Extraction

### Step 1 — Read project context

- `.pi/agent-docs/product/tech-stack.md`
- `.pi/agent-docs/standards/developer-preferences.md`
- `.pi/agent-docs/standards/memory/` (JSDoc + type-colocation rules)

### Step 2 — Gather deviations

Ask:
> What changed during implementation compared to the spec? List any:
> - Files modified that weren't in the spec
> - Patterns used that differ from the spec
> - Libraries or APIs chosen differently
> - Naming / structural decisions made on the fly
> - Export / `package.json#exports` changes

If no active spec, ask: "What did you just build? Walk me through non-obvious decisions."

### Step 3 — Pattern categories (TypeScript / vexcms)

<!-- sync-spec:pattern-categories -->
Look for extractable patterns in these categories:

1. **Naming** — package prefixes (`Vex*` vs `Next*`), component names, hook names, Convex function names, file names
2. **File organization** — colocation rules (types next to config, hooks+context together), barrel structure, `package.json#exports` shape
3. **Type patterns** — generic bounds, `Input` vs resolved types, discriminated unions for field types, `v.any()` boundaries
4. **Error handling** — throwing vs returning, access-check failure shape, Convex error propagation
5. **Library usage** — Convex validators, TanStack Form field wiring, TanStack Query patterns, Better Auth adapter calls, Plate plugin config
6. **React / component patterns** — shadcn composition, `useField` / `useForm` usage, SSR vs client boundaries, default-value handling for array/blocks fields
7. **Convex patterns** — mutation payload shape, query argument style, schema codegen expectations
8. **Testing** — `convex-test` setup, Vitest structure, fixture placement
9. **JSDoc** — new documentation idioms beyond what's already in `standards/memory/`

Only extract **repeatable** patterns that are **non-obvious from the code**. Skip one-offs.
<!-- /sync-spec:pattern-categories -->

### Step 4 — Confirm each pattern

For each extracted pattern, ask:
> I noticed you <pattern>. Should this become a standing rule for future specs?
> A) Yes — add to dev-spec + developer-preferences
> B) Yes but narrow — only applies when <condition>
> C) No — one-off, skip it

### Step 5 — Update `developer-preferences.md`

Append to `.pi/agent-docs/standards/developer-preferences.md` under the appropriate section (or create a new ## heading matching the pattern category):

```
## <Category>

- **<pattern name>**: <description>. <reason>. *(Encoded: sync-spec <N>, YYYY-MM-DD)*
```

### Step 6 — Update skills with extracted patterns

| Pattern type | Update target |
|-------------|--------------|
| Implementation / naming / Convex / type convention | `.pi/prompts/1-dev-spec.md` → `<!-- sync-spec:developer-preferences -->` |
| Documentation style / JSDoc rule | `.pi/prompts/document.md` → `<!-- sync-spec:doc-conventions -->` (if present) or `standards/memory/feedback_jsdoc_patterns.md` |
| Commit scope / message rule | `.pi/prompts/3-commit.md` → `<!-- sync-spec:commit-conventions -->` |
| Known fragile area discovered during debugging | `.pi/agent-docs/standards/debug-hierarchy.md` → "Known Fragile Areas" table |

---

## Part 2 — Upkeep Tasks

Run in order. Each task is mandatory unless marked optional.

<!-- sync-spec:upkeep-tasks -->
1. **Update developer-preferences + prompts** *(always)* — per Part 1 steps 5–6.

2. **Typecheck the affected packages** *(always)*
   - Run: `pnpm --filter <pkg> typecheck` for each package touched this session.
   - If 3+ packages touched: `pnpm typecheck` at root.
   - Report errors; do not proceed to next task until clean.

3. **Run tests for affected packages** *(always, when the package has tests)*
   - Run: `pnpm --filter <pkg> test` for each touched package in `@vexcms/core`, `@vexcms/react`, `@vexcms/cli`, `@vexcms/better-auth`, `@vexcms/file-storage-convex`, `create-vexcms`.
   - Skip silently for packages without a `test` script.

4. **Update roadmap** *(optional — ask)*
   - Ask: "Did this session complete a roadmap item in `.pi/agent-docs/product/roadmap.md`?"
   - If yes, move the item out of "Now" and into a "Shipped" section (create it if missing).

5. **Run `/document` on changed public APIs** *(optional — ask)*
   - Ask: "Should I run `/document` over the uncommitted changes to refresh JSDoc?"
   - If yes, invoke the `document` prompt with the list of changed `.ts`/`.tsx` files in `packages/*/src/`.

6. **Close completed specs** *(always, when applicable)*
   - If the active spec's "Build Order" items are all checked, prepend `# ✅ COMPLETED YYYY-MM-DD` to its `plan.md` and note in the ideaLog.

7. **Consider a changeset** *(ask when public package code changed)*
   - Ask: "Did this change affect a published package's public API? If yes, run `pnpm changeset` — or run `/changeset` to have me draft the description."
<!-- /sync-spec:upkeep-tasks -->

---

## Part 3 — IdeaLog Entry

Append to `.pi/agent-docs/implementation-log/YYYY/MM/YYYY-MM-DD.ideaLog.md` (create dir + file if missing):

```markdown
## Sync Spec — <HH:MM>

Spec: <path to spec dir or "ad-hoc">
Packages touched: <list>

Patterns extracted:
- <pattern> → <skill / file updated>

Patterns rejected:
- <pattern> — one-off

Upkeep tasks:
- typecheck: <pass/fail per package>
- tests: <pass/fail per package>
- document: <ran / skipped>
- changeset: <created / skipped>
```

---

## What NOT to extract

- Patterns already in `developer-preferences.md` or `standards/memory/`
- IDE / Prettier / ESLint config — those live in their config files
- Debug steps, investigation notes — those go in the ideaLog, not preferences
- Anything the developer flagged as a mistake
- Library internals that only applied to one call site
