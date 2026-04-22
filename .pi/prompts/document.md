---
description: Write or update JSDoc for exported symbols in vexcms packages. Follows the Input-vs-resolved type pattern and runs typecheck+test after editing.
---

# Document — vexcms

Write or update inline JSDoc for a target in the vexcms codebase. If no target is given, ask for one.

> **Questions:** Use `ask_user_question` for every question. Never write question lists as plain text.

---

## Project Context

**Project:** vexcms
**Language:** TypeScript
**Doc format:** JSDoc (rendered in-IDE and by `starlight-typedoc` into `apps/docs`)

<!-- sync-spec:check-commands -->
**Verify commands after editing:**

- After editing one package: `pnpm --filter <pkg> typecheck && pnpm --filter <pkg> test`
- After editing multiple packages: `pnpm typecheck && pnpm test`
- Quick subset: `pnpm --filter <pkg> typecheck` only (if package has no tests or only types changed)
<!-- /sync-spec:check-commands -->

---

## Usage

```
/document [<target>] [in <file>]
```

**Examples:**
- `/document` — documents all uncommitted changes (staged + unstaged)
- `/document TextFieldInput`
- `/document all exported functions in packages/core/src/fields/text/config.ts`
- `/document createCollection and Collection`

---

## Step 1 — Locate and read the target

**If no target specified:** run `git diff --name-only && git diff --cached --name-only`. Include all uncommitted `.ts` / `.tsx` source files in `packages/*/src/` or `apps/www/`. Skip config files, `.md`, lock files.

**Test files must be included** — flag stale test descriptions, wrong type assertions, expected values that no longer match implementation.

**If a target is specified:**
- Search `packages/*/src/` first (most exported API lives there), then `apps/www/`
- Read the full file the target lives in
- Follow imports needed to understand shape/behavior

---

## Step 2 — Gather context

Before writing a single word:

- **What the thing is** — its purpose in vexcms, not just fields
- **Input vs resolved form** — does it have an `*Input` version? They're documented differently (see below)
- **How it is used** — grep for usages in the same package and in downstream packages
- **Defaults** — read the `defineX` / `createX` / `resolveX` function that applies defaults
- **Parent type** — when documenting individual fields, read the full interface first

---

## Step 3 — Write the docs

### JSDoc syntax reference

```typescript
/**
 * One-sentence summary of what this represents.
 *
 * Additional paragraphs only when needed.
 *
 * @defaultValue (on individual optional properties, when the resolved value is non-obvious)
 *
 * @example
 * ```ts
 * // label the example
 * const foo = bar({ ... })
 * ```
 *
 * @see {@link ResolvedType}
 * @see {@link relatedFunction}
 */
```

Use `@param`, `@returns`, `@throws` (only when the impl actually throws).

<!-- sync-spec:type-conventions -->
### vexcms-specific rules

Mirrored from `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md` — read that file for full detail.

**Input types vs resolved types — document differently:**

- **`*Input` types** (user-facing — what developers write in `vex.config.ts`):
  - Detailed one-paragraph summary
  - **Defaults block** — show the full resolved default object in a code fence, every property gets an inline `//` comment explaining what *that value* means (not just restating the name)
  - `@example` — 1–2 realistic examples (more for complex features). Use correct field types (status → `select()`, count → `number()`, URL → `text()`)
  - `@see` pointing to the resolved type, config function, related field types

- **Resolved types** (internal, after defaults applied):
  - One-sentence summary
  - One-line property docs
  - `@see` pointing back to the `*Input` type
  - No examples, no defaults block

**Field-level docs (inside interfaces):**

- One sentence max for simple fields
- For union types — explain what *each value* does in plain English, never just list them
- Always informed by parent-interface context (what does this field control *in practice*)
- Never nest into sub-type explanations — trust the sub-type's own docs
- Skip docs that restate the type signature (`label is a string`)
- Skip docs for properties obvious from name alone

**Function / hook docs:**

- Summary sentence
- `@param` for every non-obvious parameter
- `@returns` describing the shape + when it can be null/empty
- `@example` with at least one realistic call

**Convex function docs (mutations / queries in `@vexcms/*` packages):**

- Document the payload as `data: <shape>` — not "fields"
- Note the `v.any()` boundary if present, with a comment explaining that CLI codegen validates shape
- Link to the resolved collection type when relevant

**Adapter component docs (`@vexcms/next`, future framework adapters):**

- Note the framework prefix (`Next*`) and that `Vex*` is the framework-agnostic counterpart in `@vexcms/react`
<!-- /sync-spec:type-conventions -->

### Universal rules

**Types / interfaces / classes:**
1. One-sentence summary
2. Defaults block (for `*Input` types)
3. One example of typical usage
4. `@see` references

**Functions:**
1. Summary + return description
2. Each non-obvious param
3. When return is null/empty/error
4. One realistic example

**Individual fields:**
- One sentence max
- Concrete about union values
- Explain what *setting* it does, not the type

### Do not

- Restate the type signature in prose
- Use filler (`This function handles...`)
- Document what's obvious from the name
- Invent behavior not in the implementation
- Add `@throws` unless an actual `throw` exists

---

## Step 4 — Apply the docs

Edit in place. Do not reformat surrounding code, rename anything, or change logic. Only add/replace doc comment blocks for requested targets.

After editing, verify comments render correctly (no broken delimiters, no stray `*/`).

---

## Step 5 — Verify

Run the check commands from Project Context.

- If you caused a failure → fix it, re-run.
- If pre-existing → do not fix. Report it at the end with the exact error.

**Report:**
- Files documented
- Any pre-existing failures

---

## Project-specific conventions

<!-- sync-spec:doc-conventions -->
- `starlight-typedoc` generates docs from `@vexcms/*` public exports — JSDoc must render cleanly, no raw `@internal` API in examples.
- Field config JSDoc is the primary reference for end users — assume someone reads these in their IDE and never visits the docs site. They must be complete enough to use without external lookup.
- When adding a new field type: every exported symbol (Input type, resolved type, config function, renderer component) gets JSDoc per the Input-vs-resolved rule above.
- Examples in field-config JSDoc must use realistic values — a `text()` field for a slug, not for a status.
<!-- /sync-spec:doc-conventions -->

→ see `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md` (authoritative JSDoc rules)
→ see `.pi/agent-docs/standards/adding-a-field-type.md` (field-type documentation requirements)
