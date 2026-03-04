# Dev Spec — Developer-Led Implementation Spec

Create a detailed specification document designed for a developer to follow manually — providing full code for boilerplate (types, interfaces, utils, re-exports) while leaving core logic as guided function stubs with edge cases, constraints, and implementation notes.

## Philosophy

This spec format bridges AI assistance and developer ownership:
- **AI handles the tedious parts**: type definitions, interfaces, test boilerplate, file structure, re-exports
- **Developer writes the important parts**: core logic, algorithms, integration code
- **Developer maintains full context**: understands where everything lives, why decisions were made
- **Spec is a living guide**: developer changes and renames freely during implementation

## CRITICAL: No Speculative Code

**Every line of code in a spec must serve an explicit purpose within that spec's scope.**

- Do NOT include types, interfaces, fields, or functions for "future" features
- Do NOT add placeholder fields on interfaces that no function in the spec reads or writes
- Do NOT stub out functions that won't be implemented or tested in this spec
- Do NOT add optional config properties that nothing in the spec uses
- If a type has 10 fields but only 4 are used by this spec's functions and tests, only include the 4

This is the primary source of tech debt in specs — code gets written "for later" and never cleaned up. The scoping questions in Phase 1 and Phase 3 exist specifically to draw a hard boundary around what's in vs out. When in doubt, leave it out. A future spec can add it with full context.

## CRITICAL: No Empty Stub Files

**Never scaffold directories or files that contain only placeholder content, stubs for future specs, or no meaningful code.** If a file won't have real, functioning code by the end of this spec, don't create it.

- Do NOT create `admin/` folders with stub components for a future spec
- Do NOT create `input.ts` files that just say `// Implementation in next spec`
- Do NOT create re-export index files for modules that don't exist yet
- Do NOT add directories to the "Target Directory Structure" if their contents are all stubs

Every file in the spec must either (a) contain working code that's used by this spec or (b) contain a guided function stub with `throw new Error("Not implemented")` that WILL be implemented in this spec. Files that exist solely to "reserve" a spot for future work create file bloat and confuse the developer about what's actually functional.

## CRITICAL: Tests in Same Step as Implementation

**Never create a separate "Tests" phase or section. Every test file appears in the same step as the implementation it tests.** The developer should never have to implement a function in one section and then scroll to a different section to find its tests.

- Step N implements `foo.ts` → Step N also includes `foo.test.ts`
- The test code block appears immediately after the implementation code block
- The step's checkbox list includes both: `- [ ] Create foo.ts` and `- [ ] Create foo.test.ts`
- Never group all tests at the end of the spec in a "Phase B: Tests" or "Testing" section

## CRITICAL: Single Object Parameters

**All functions AND class methods take a single typed `props` object instead of multiple positional parameters.** This gives the developer named parameters with full LSP autocomplete, eliminates parameter ordering issues, and makes call sites self-documenting.

```typescript
// ❌ WRONG — positional params on a function
export function mergeFields(
  authTable: AuthTableDefinition,
  collection: VexCollection<any>,
  slug: string,
): MergedResult { ... }

// ✅ RIGHT — single props object on a function
export function mergeFields(props: {
  authTable: AuthTableDefinition;
  collection: VexCollection<any>;
  slug: string;
}): MergedResult {
  // Access via props.authTable, props.collection, props.slug
  // Do NOT destructure — keeps it clear which values came from props
  // vs which were defined locally in the function body
  ...
}

// ❌ WRONG — positional params on a class method
class Registry {
  register(slug: string, source: SlugSource, location: string): void { ... }
}

// ✅ RIGHT — single props object on a class method
class Registry {
  register(props: { slug: string; source: SlugSource; location: string }): void {
    // Access via props.slug, props.source, props.location
    ...
  }
}
```

**Rules:**
- The parameter name is always `props` (not `opts`, `args`, `options`, etc.)
- Prefer accessing fields via `props.fieldName` when the function body also defines local variables — this keeps it clear which values came from the caller vs which were defined locally
- Destructuring `const { ... } = props` is allowed when the function body has no locally-defined variables (i.e., everything in scope came from props)
- When in doubt, use `props.fieldName` — it's always safe
- The type is declared inline on the parameter (not as a separate named type, unless the same shape is reused by 3+ functions)
- This applies to standalone functions, exported functions, AND class methods
- Class constructors and error class constructors may use positional params
- Zero-param or single-param methods (e.g., `getAll()`, `has(key)`) don't need a props wrapper
- Callback functions passed to `.map()`, `.filter()`, etc. use positional params (they're not standalone functions)
- JSDoc must document each field on the props object using `@param props.fieldName` notation

## Mandatory: Use AskUserQuestion Tool

**Always use the `AskUserQuestion` tool when asking the user anything during this process.** Never ask questions via plain text output. Every question in Phase 1 (scope), Phase 3 (edge cases), and Phase 5 (review) MUST go through AskUserQuestion so the user gets a structured prompt they can respond to clearly.

## Process

### Phase 1: Understand the Feature & Draw Scope Boundaries

Use AskUserQuestion to gather context:

```
What feature or system are we speccing out?

Describe:
- What it does
- What packages/areas of the codebase it touches
- Any key constraints or decisions already made
```

After the initial response, use AskUserQuestion again to explicitly define scope:

```
To keep the spec tight, I want to confirm what's IN and OUT of scope:

**I think this spec covers:**
- [Concrete deliverable 1]
- [Concrete deliverable 2]
- [Concrete deliverable 3]

**I think these are OUT of scope (future specs):**
- [Related thing that could creep in]
- [Adjacent feature that touches the same area]

Is this right? Anything to add or move between the lists?
```

This boundary is binding for the rest of the process. Every type, interface, function, and test in the spec must serve something in the "in scope" list. If it only serves an "out of scope" item, it does not go in the spec.

### Phase 2: Explore the Codebase

Before writing anything, thoroughly explore the relevant parts of the codebase:
- Read existing types, interfaces, and patterns in the affected packages
- Understand how similar features are structured
- Identify the existing conventions (naming, file organization, exports, test patterns)
- Note any existing code that will need to be modified vs created fresh

Summarize findings to the user briefly.

### Phase 3: Poke Holes & Surface Edge Cases

This is critical. Before writing the spec, challenge the design:

Use AskUserQuestion to present findings:

```
Before writing the spec, here are potential issues and edge cases I want to flag:

**Design questions:**
1. [Question about an ambiguous requirement]
2. [Question about how X interacts with Y]

**Edge cases to consider:**
- [Edge case 1 — why it matters]
- [Edge case 2 — why it matters]
- [Edge case 3 — why it matters]

**Scope check — things I will NOT include:**
- [Adjacent concern that came up during exploration but is out of scope]
- [Type field / function that only a future feature needs]

**Test coverage suggestions:**
- [Area 1] — because [reason: e.g., "this is the main integration point where bugs will surface"]
- [Area 2] — because [reason]
- [Area 3] — because [reason]

Which of these should we address in the spec vs defer?
```

Iterate on this until the developer is satisfied with the scope and edge case coverage. Use the "Scope check" section to explicitly flag things you considered including but decided are out of scope. This prevents scope creep and gives the developer a chance to pull something back in if they disagree.

### Phase 4: Write the Spec

Create the spec document at the path the user specifies (or suggest one based on existing spec numbering in `agent-os/product/`).

#### Build Order: Testable at Every Step

**This is the most important structural decision in the spec.** The implementation order must follow an outside-in approach so the developer can build, run, and test at every step:

1. **Step 1 is always setup** — config files, package scaffolding, anything needed to make `build` and `test` commands work (even if they produce empty output). After Step 1, `pnpm build` and `pnpm test` must both run without errors.
2. **Step 2 is the entry point / public API** — the main function or module that consumers will import. Start with hardcoded or minimal return values so the package can be imported and type-checked immediately. The developer should be able to wire it into the consuming code (e.g., `vex.config.ts`) right away to verify the import works.
3. **Step 3 is a test shell** — set up the test file(s) for the entry point so `pnpm test` runs from this point forward. Start with tests that pass against the hardcoded return.
4. **Remaining steps progressively replace hardcoded values with real implementations** — each step implements one internal function, adds its tests, and wires it into the entry point. After each step, run tests to verify everything still works.
5. **Last step is final integration** — expand tests, add re-exports, verify full build, update consuming code.

**The rule: after completing any step, the developer should be able to run `build` and `test` and see progress.** Never structure a spec where the developer builds 5 files in isolation and then has to wire them all together at the end hoping it works.

#### Dependency Ordering

**If function A calls function B, then B's step MUST come before A's step.** The developer should never encounter a function stub that calls another function that hasn't been introduced yet. Build from leaves to root:

- Utility/helper functions first (they have no internal dependencies)
- Functions that call those utilities next
- Orchestration/entry-point functions last (they call everything)

Example: If `textToValueTypeString()` calls `processFieldValueTypeOptions()`, then the step for `processFieldValueTypeOptions` must come BEFORE the step for `textToValueTypeString`.

#### Test File Colocation

**Test files go in the same step as the function they test, and live next to the code they test in the file system.** Do NOT collect all tests into a separate "Tests" section at the end of the spec.

- `src/valueTypes/processAdminOptions.ts` → `src/valueTypes/processAdminOptions.test.ts` (same directory)
- `src/fields/text/schemaValueType.ts` → `src/fields/text/schemaValueType.test.ts` (same subdirectory)
- Each step shows the implementation file AND its test file together
- The developer implements and tests in one pass, not in two separate phases

#### Task Checkboxes

Every step must include markdown task checkboxes (`- [ ]`) listing each concrete action in that step. This lets the developer track progress directly in the spec file. Include checkboxes for:
- Each file to create or modify
- Each command to run (install, build, test)
- Each verification step (e.g., "Verify test app compiles")

The Success Criteria section at the end should also use checkboxes.

#### Spec Document Structure

The spec is organized **by implementation step**, not by category. The developer reads top to bottom and does each step in order. Each step says which files to create or modify, with the full code or guided stub right there.

```markdown
# {Spec Number} — {Feature Name}

## Overview
[2-3 sentences: what this spec covers and why]

## Design Decisions
[Key decisions made during shaping, with brief rationale]

## Out of Scope
[What this spec explicitly does NOT cover]

## Target Directory Structure
[File tree showing what will exist after implementation, with annotations]

## Implementation Order
[Numbered list summarizing the steps — serves as a table of contents.
 Each entry should note what becomes testable after that step.]

---

## Step 1: [Setup — scaffolding, config, install]

- [ ] [Concrete action]
- [ ] [Concrete action]
- [ ] Run build/install and verify it works

[File blocks with code...]

---

## Step 2: [Entry point with hardcoded return]

- [ ] [Create/modify file]
- [ ] [Verify import works in consuming code]

[File blocks with code...]

---

## Step 3: [Test shell — initial tests against hardcoded return]

- [ ] [Create test file]
- [ ] [Run tests]

[File blocks with code...]

---

## Step 4+: [Implement function X + tests, wire into entry point]

- [ ] [Create implementation file]
- [ ] [Create test file]
- [ ] [Update entry point to use real implementation instead of hardcoded value]
- [ ] [Run tests]

[File blocks with code...]

---

## Step N: [Final integration — full tests, re-exports, build, consuming code]

- [ ] [Expand integration tests]
- [ ] [Add re-exports]
- [ ] [Run full build]
- [ ] [Update consuming code]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

**The key rule: each step contains ALL the files for that step — types, code, tests, re-exports — together.** The developer never has to jump between sections. They read Step 1, do Step 1. Read Step 2, do Step 2. Tests are colocated with the functions they test, not in a separate "Tests" section at the bottom.

Each file block follows this format:
- **`File: path/to/file.ts`** — exact path so the developer knows where to create it
- A brief description of what the file does and why (so the developer can rename or restructure)
- The code block (full code for boilerplate, guided stub for logic)
- For guided stubs: purpose, algorithm notes, and edge cases appear directly below that code block

#### What Gets Full Code vs Guided Stubs

These appear inline within each step — not in separate sections.

**Full code (copy-paste ready):**
- TypeScript types and interfaces **that are used by functions or tests in this spec**
- Utility/helper functions (pure, simple logic) **that are called by this spec's code**
- Re-export index files **for modules created in this spec**
- Package configuration files **for packages created in this spec**
- Test files (these ARE the spec — exact inputs and expected outputs)
- Error classes and constants **that are thrown/used by this spec's functions**

**Guided stubs (developer implements):**
- Core business logic functions
- Integration/orchestration functions
- Functions with complex conditional logic
- Anything where the developer's judgment and context matters

For guided stubs, the implementation guidance goes **inside the function body as numbered pseudo-code comments**, NOT below the code block. This lets the developer copy-paste the entire function and fill in the real code right where the comments are. The format is:

```typescript
export function myFunction(props: {
  input: string;
  collectionSlug: string;
}): Result {
  // TODO: implement
  //
  // 1. First step — what to do and why (access via props.input, props.collectionSlug)
  //    → what this returns or produces
  //    → conditions that cause errors (throw XError if ...)
  //
  // 2. Second step — next action
  //    a. Sub-step if branching logic
  //    b. Another sub-step
  //
  // 3. Return the result
  //
  // Edge cases:
  // - Edge case 1: what happens and how to handle it
  // - Edge case 2: what happens and how to handle it
  throw new Error("Not implemented");
}
```

**Guided stub requirements:**
- Start with `// TODO: implement` on the first comment line
- Use numbered steps (1, 2, 3...) for the algorithm
- Use lettered sub-steps (a, b, c...) for branching within a step
- Use `→` arrows to show what each step produces or throws
- Include an `// Edge cases:` section at the end when there are non-obvious cases
- End with `throw new Error("Not implemented")` so the code compiles but fails at runtime
- The JSDoc above the function covers the public contract (params, returns, purpose)
- The inline comments cover the implementation algorithm (how to build it)

**Do NOT put implementation guidance below the code block** — it must be inside the function body so the developer has everything in one copy-pasteable unit.

**Never include:**
- Interface fields that no function in this spec reads, writes, or tests
- Types imported but never referenced in any code block
- "Placeholder" stubs for functions that belong in a future spec
- Optional config properties that nothing in this spec consumes
- Re-exports of things that don't exist yet

**Self-check before finalizing:** For every type, interface field, function, and constant in the spec, ask: "What code *in this spec* uses this?" If the answer is nothing, remove it.

### Phase 4.5: Review Build Order

After writing the spec but before presenting it to the developer, review the implementation order to verify it follows the testable-at-every-step paradigm:

**Checklist (internal — do this before presenting the spec):**
1. Can the developer run `build` after Step 1? (Must be yes — scaffolding/config)
2. Can the developer import the public API after Step 2? (Must be yes — entry point exists)
3. Can the developer run `test` after Step 3? (Must be yes — test shell exists)
4. For each subsequent step: does the step end with "run tests" and do all prior tests still pass?
5. Does any step require the developer to build multiple unrelated files before they can test anything? (Must be no — split it into smaller steps)
6. Does the last step wire everything together and run the full suite?

If any answer is wrong, restructure the steps. Common fixes:
- **Move the entry point earlier** — even with hardcoded returns, having the public API exist lets the developer verify imports and types
- **Split large steps** — if a step creates 3 files that all depend on each other, it's too big
- **Add intermediate wiring** — after implementing function X, immediately show the edit to the entry point that replaces the hardcoded value with the real call

### Phase 5: Review with Developer

After writing the spec, present a summary:

```
Spec created at: [path]

**What you can copy-paste directly:**
- [List of types/interfaces/utils/tests]

**What you'll implement yourself (guided):**
- [List of function stubs with brief descriptions]

**Suggested implementation order:**
1. [Phase 1 — what and why]
2. [Phase 2 — what and why]
...

Review the spec and let me know if anything needs adjustment.
```

## Key Principles

- **Nothing speculative.** Every line of code must be used by something else in this spec. No "future-proofing" fields, no placeholder stubs for the next spec, no types that only a later feature needs. If it's not tested or called in this spec, it doesn't belong here.
- **Tests are the real spec.** Every test file should have exact expected values so the developer knows exactly what correct output looks like.
- **Types before implementation.** All interfaces and types come first — they're the contract. But only include fields that this spec's functions and tests actually use.
- **Edge cases are explicit.** Don't leave the developer guessing. List every edge case you found during Phase 3.
- **No hand-waving.** If a function needs to produce specific output, show what that output looks like in a test. If a type has constraints, document them in JSDoc.
- **Respect the codebase.** Match existing conventions for naming, file organization, and patterns. Don't introduce new conventions without flagging it.
- **Implementation order matters.** Structure the spec so each step builds on the last. The developer should never have to jump around. Dependencies come before dependents — if function A calls function B, B's step comes first.
- **Testable at every step.** After completing any step, `build` and `test` must work. Start from the entry point with hardcoded values, then progressively swap in real implementations. Never make the developer build 5 files before they can test anything.
- **Task checkboxes in every step.** Each step has `- [ ]` checkboxes for every file and verification action. The developer tracks progress directly in the spec file.
- **Scope is a feature.** A tight spec that covers its scope completely is better than a broad spec that covers everything partially. Defer aggressively to future specs.
- **Pseudo-code lives in the function body.** Implementation guidance for guided stubs goes inside the function as numbered comments, not below the code block. The developer copy-pastes the whole function and writes code where the comments are. The `throw new Error("Not implemented")` at the end ensures it compiles but fails at runtime until implemented.
- **Tests live next to code.** Test files are colocated with the source files they test, in the same directory. Each step in the spec includes both the implementation file and its test file together — the developer never has to jump to a separate "Tests" section.
