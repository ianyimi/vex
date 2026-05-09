---
name: Implementation spec structure
description: Layout, ordering, and content rules for `.pi/agent-docs/specs/*.md` (and `specs/NN-foo/spec.md` directory specs). Test colocation, file dependency order, decisions discipline, code effect previews.
type: standard
applies_to: [".pi/agent-docs/specs/**/*.md"]
---

# Implementation spec structure

Detailed rules for how a spec is laid out — separate from the higher-level
`/dev-spec` prompt so the prompt stays a tight checklist. Read this when
authoring a spec, when reviewing one, or when an existing spec is feeling
"all out of order" and you need to remember why.

## Required top-level sections

Every spec includes these sections, in this order:

1. **Status** — `Draft (not started)`, `In progress`, `✅ Complete YYYY-MM-DD`.
2. **Overview** — one paragraph: what's being built, why now, what it unblocks.
3. **Code Effect Preview** — see § *Code Effect Preview* below.
4. **API Surface** (only if the spec adds public API) — table of new exports.
5. **Status / progress checklist** — one-line per major sub-task, status emoji.
6. **Design Decisions** — terse one-line table; full rationale lives in the
   companion `design-walkthrough.md`. See § *Decisions discipline* below.
7. **Out of Scope** — explicit list with cross-references to follow-up specs.
8. **Target Directory Structure** — every file created/modified/deleted with
   status markers (`✅ done`, `🟡 partial`, `⏳ pending`).
9. **Implementation Order** — numbered steps. Each step must leave the repo
   runnable (`pnpm typecheck` clean). Tag each step `[dev]` (high-care
   implementation) or `[agent]` (mechanical / wiring).
10. **Per-step content** — see § *Per-step content* below.
11. **Verification (mandatory)** — exact command list that proves done.
12. **Success Criteria** — user-observable outcomes, written as
    compile-error / runtime / type-narrowing assertions.
13. **References** — cross-links to related specs, design docs, standards,
    prior-art legacy specs.

## Spec format: single file vs directory

| Format | Path                                      | When to use                                                                                                                                        |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flat   | `.pi/agent-docs/specs/NN-feature.md`      | Single deliverable, no design walkthrough needed. Most specs.                                                                                      |
| Dir    | `.pi/agent-docs/specs/NN-feature/spec.md` | Spec touches public API surface OR has any companion file (design walkthrough, ADR, sketches). Spec 22 and 23 both follow this format.             |

Match the existing numbering convention (`NN-` prefix, kebab-case slug).
Don't introduce date prefixes or new numbering schemes unless explicitly asked.

## Design walkthrough companion (when required)

Required when the spec touches **public API surface** that downstream users
will write against. The walkthrough lives at
`.pi/agent-docs/specs/NN-feature/design-walkthrough.md` and contains:

1. End-to-end "what code does the user write" walkthrough — real `apps/www`
   examples showing the public API in use.
2. Layering diagram — what calls what, where the new code sits.
3. Type narrowing examples — wrong-key-as-compile-error demonstrations.
4. **Decisions Reference** — full prose for every decision in the spec's
   one-line table (see § *Decisions discipline*).

Specs that introduce internal-only refactors don't need a walkthrough — their
design rationale lives inline in the spec's Decisions section.

## Per-step content (the layout that matters)

Each `## Step N` section follows this structure, in this order:

```
## Step N — <short title> [dev|agent]

(optional) preamble paragraph: what this step accomplishes, why it's grouped this way

### Files to create / modify / delete
- [ ] `path/to/file.ts` (NEW) — one-line purpose
- [ ] `path/to/other.ts` — modify: <what changes>
- [ ] `path/to/dead.ts` — delete: <why>

### `path/to/file-1.ts` (NEW)
<optional preamble>
```ts
// Full copy-paste-ready code sample
```

### `path/to/file-1.test.ts` (NEW)        ← COLOCATED — see below
<test code>

### `path/to/file-2.ts` (NEW)              ← imports from file-1
<code>

### `path/to/file-2.test.ts` (NEW)
<test code>

### Edge-case notes
> **Edge: <name>.** Description.

### Run tests
\`\`\`bash
pnpm --filter <pkg> test
\`\`\`
```

### Test colocation (not pooling)

Every test file goes in its own `###` subsection IMMEDIATELY AFTER the
implementation file it tests. Never pool tests at the end of a step.

```
✅ Right
### packages/core/src/api/populate.ts (NEW)
### packages/core/src/api/populate.test.ts (NEW)    ← right after
### packages/core/src/api/find.ts (NEW)
### packages/core/src/api/find.test.ts (NEW)        ← right after
```

```
❌ Wrong
### packages/core/src/api/populate.ts (NEW)
### packages/core/src/api/find.ts (NEW)
### packages/core/src/api/get.ts (NEW)
### packages/core/src/api/search.ts (NEW)
### Tests                                            ← all pooled here, far from the code they test
  - populate.test.ts
  - find.test.ts
  - ...
```

The implementer reads top-to-bottom, building each file as they go.
Backtracking 400 lines to grab the test for a file they just wrote is
friction the spec should remove, not impose.

### File ordering within a step (declarations before consumers)

Files in a step appear in **dependency order** — a file that imports from
another appears AFTER its imports. The reader should never encounter
`import { X } from "./foo"` before they've seen `./foo`'s section.

```
✅ Right (dependency-respecting order)
types.ts            ← base types, no internal imports
populate.ts         ← imports types
convex/index.ts     ← typed API surface used by find/get/search
find.ts             ← imports populate + convex
get.ts              ← imports populate + convex
search.ts           ← imports populate + convex
factory.ts          ← imports find/get/search
user-side.ts        ← consumes factory
```

```
❌ Wrong
find.ts             ← imports vexConvexApi but…
factory.ts          ← uses find but vexConvexApi hasn't been shown yet
convex/index.ts     ← finally, vexConvexApi appears way down here
```

### File ordering INSIDE a single source file's code sample

In a single source file's code block, declare in this order:

1. Imports
2. **Foundational/base types** that every other thing in the file extends or
   uses (most prominent, listed first; not buried below per-feature helpers)
3. Per-feature helpers, narrowing types, utility types
4. Result-shape types
5. Implementation functions

Don't sort alphabetically. Don't sort by "when I happened to write it".
Lead with the foundation a reader needs to understand the rest of the file.

### Tests are copy-paste, not descriptions

Every test file in the spec is a complete, runnable file — imports,
describe/test blocks, fixture setup, assertions, all of it. The implementer
copies, drops into the file path the spec specifies, runs `pnpm test`. No
pseudocode, no "add tests for X" descriptions, no `// TODO`s.

### Real runtimes over mocks for runtime-coupled code

When code under test is tightly coupled to a runtime, use the official test
harness, not a hand-rolled mock:

- **Convex code** — use [`convex-test`](https://docs.convex.dev/testing/convex-test)
  against a fixture schema **inside the package being tested**, not in
  `apps/www`. Library packages own their fixtures; tests must run with
  `pnpm --filter <pkg> test` and not depend on application data.
- **React UI** — use `@testing-library/react`.
- **Pure logic** — plain `vitest`, no harness needed.

Rare exception: when a function uses one or two trivial methods of a larger
interface (e.g., a function that only calls `ctx.db.get`), a 5-line inline
mock is fine. The moment behavior depends on schema validation, indexes,
transactions, or runtime semantics, use the real harness.

### Library packages own their test fixtures

A package shouldn't need `apps/www`'s data to verify its own correctness. If
a library uses Convex, it has a `test/convex/schema.ts` fixture (or
`src/api/test/convex/schema.ts` if you prefer in-`src` colocation with build
exclusion via `tsconfig.build.json`) and runs `convex-test` against it.
Tests run with `pnpm --filter <pkg> test`, in CI, in isolation. **This is
non-negotiable for shippable packages** — if the package can't be tested
without standing up the whole monorepo, that's a packaging bug.

## Code Effect Preview (REQUIRED for any spec that modifies existing files)

A `## Code Effect Preview` section sits high in the spec — right after
Overview, before API Surface — and shows **before/after diffs of the most
consequential changes**. Each diff is a `### Subsection title — what's
changing`, with a fenced `diff` block.

Why required: specs that only describe types and Decisions in prose are hard
to grok at scan-speed. A reader who sees "this 30-line handler becomes a
3-line wrapper" understands the spec's effect on the codebase before
reading anything else.

Pick 3–5 most consequential changes:
- The thing that shrinks the most (large simplification)
- The thing that changes the user's call-site (public-API shift)
- The thing that becomes simpler / unblocks a follow-up

Skip diffs for trivial changes (renames, single-line edits) — they don't
add scan-value.

Canonical example: `.pi/agent-docs/specs/23-vex-api/spec.md` § *Code Effect
Preview* (5 diffs spanning Convex handler shrink, user-facing call shape
change, new file pattern, cell rendering fix).

## Decisions discipline (terse in spec, full rationale in walkthrough)

`## Design Decisions` in spec.md is reference material, not a story. Keep
it tight: a one-line summary of every decision, in a numbered table. Full
detail goes in `design-walkthrough.md` § *Decisions Reference*.

```markdown
## Design Decisions

A one-line summary of every decision. Full rationale, alternatives, and
trade-offs live in `design-walkthrough.md` § *Decisions Reference*.

| #   | Decision (one line)                                                    |
| --- | ---------------------------------------------------------------------- |
| D1  | `vex.find` is a typed query factory, not a hook.                       |
| D2  | ~~Literal-array populate via codegen~~ — superseded by D11.            |
| D3  | Server-side join via `convex-helpers/server/relationships`.            |
| …   | …                                                                      |
```

Why split: implementers re-skim spec.md repeatedly during implementation
but only once or twice for full context. If Decisions is 250 lines they
have to scroll past it every time. The walkthrough is read once before
starting, when full rationale is the most useful framing.

**Superseded decisions are kept** (with `~~strikethrough~~`) so cross-
references from older specs still resolve. Removing entries breaks history.

Canonical example: `.pi/agent-docs/specs/23-vex-api/spec.md` § *Design
Decisions* (17 rows, ~25 lines) + `design-walkthrough.md` § *Decisions
Reference* (full prose).

## TypeScript rules in code samples

- Full types, no `any`, no `as` casts (except documented narrow boundaries
  e.g. Convex `v.any()` payload — see `developer-preferences.md`).
- Field `types.ts` lives **colocated** with its `config.ts` — never
  consolidate field types into one file.
- JSDoc on every exported interface/type/function per
  [`jsdoc-conventions.md`](./jsdoc-conventions.md).
- Framework adapter components use the **framework prefix**, not `Vex`:
  `NextAdminPage` in `@vexcms/next`, not `VexAdminPage`.
- Workspace deps use `catalog:` per `developer-preferences.md` § *Catalog
  policy*.

## Common spec-structure failure modes

### "Where did decision Dn go?" (renumbering)

Don't renumber decisions when one is added or superseded. Append (D11, D12,
…) and mark old ones `~~strikethrough~~ — superseded by D11`. External
references like "Decision 13" in code comments stay valid.

### "Why is this section 250 lines?"

A spec section that's grown past ~50 lines either contains rationale that
belongs in the walkthrough, or has multiple sub-topics that should be
sub-sections (`###`). Break it up.

### "I can't tell what to do next"

Implementation Order steps should be small enough that each one fits in a
single PR / commit. If a step has 12 sub-checkboxes spanning 3 unrelated
files, split it into multiple steps.

### "The decisions section disagrees with the code samples"

The code samples win. They're the canonical implementation. When you
discover the disagreement during implementation, update the Decisions table
to match the code (and add a brief revision note: "(rev 2, YYYY-MM-DD)").

### "The walkthrough is stale"

The walkthrough has examples that no longer compile because the public API
shape changed (e.g., positional args → discriminated-union args). Audit the
walkthrough whenever the spec's public surface changes — a stale walkthrough
is worse than no walkthrough.

## Cross-references

- `.pi/prompts/1-dev-spec.md` — the slim prompt that drives spec creation.
- [`jsdoc-conventions.md`](./jsdoc-conventions.md) — JSDoc rules enforced
  in code samples.
- [`developer-preferences.md`](./developer-preferences.md) — catalog policy,
  framework architecture, workspace packaging.
- [`debug-hierarchy.md`](./debug-hierarchy.md) — known fragile areas to
  call out in specs.
- [`testing/test-writing.md`](./testing/test-writing.md) — test code
  conventions.
