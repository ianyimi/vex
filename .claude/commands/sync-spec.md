# Sync Spec — Post-Implementation Spec Alignment

Run this command after you have finished implementing a spec. It compares the actual code against the spec document, updates the spec to match any renames, restructures, or design changes made during implementation, marks all tasks as complete, and updates any dependent future specs to stay aligned with the current implementation.

## When to Use

Run `/sync-spec <spec-number>` after completing the build for a spec. For example: `/sync-spec 12` or `/sync-spec 13`.

## Mandatory: Use AskUserQuestion Tool

**Always use the `AskUserQuestion` tool when asking the developer anything during this process.** Never ask questions via plain text output.

## Process

### Phase 1: Identify the Spec and Its Dependencies

1. Find the spec file: `agent-os/product/<spec-number>-*.md`
2. Read the spec's header for `**Referenced by**`, `**Depends on**`, and `**Supersedes**` links
3. Scan all other spec files in `agent-os/product/` for references to this spec number
4. Build a list of **downstream specs** (specs that reference or depend on this one)

### Phase 2: Compare Code Against Spec

For each file mentioned in the spec:

1. **Check if the file exists** at the spec's stated path
   - If moved/renamed: note the new path
   - If deleted: note it was removed

2. **Compare function signatures** — for each function stub in the spec:
   - Does the function still exist? Same name?
   - Has the signature changed (params, return type)?
   - Were params added, removed, or renamed?
   - **Check parameter style:** Does the function use a single `props` object parameter? If the spec has positional params but the code uses `props: { ... }`, flag this as a signature change and update all call sites in the spec and tests.

3. **Compare types and interfaces** — for each type in the spec:
   - Does the type still exist? Same name?
   - Were fields added, removed, or renamed?
   - Were field types changed?
   - Were any interfaces removed entirely? (e.g., intermediate result types that got inlined)

4. **Compare file structure** — does the actual directory structure match the spec's "Target Directory Structure"?
   - New files that weren't in the spec
   - Files from the spec that don't exist
   - Files that were moved to different directories
   - **Check for empty stubs:** Does the spec reference files that were never created because they'd only contain placeholder content? Flag these for removal from the spec.

5. **Check test colocation** — are test code blocks placed immediately after their implementation code blocks, or are they in a separate section?
   - If tests are in a separate "Tests" or "Phase B" section: flag for restructuring

6. **Compare test assertions** — for each test file in the spec:
   - Do the test descriptions match?
   - Have expected values changed?
   - Were tests added or removed?
   - **Check call patterns in tests:** Do test function calls match the actual function signatures? If a function was changed from positional params to `props` object, all test calls must be updated too.

### Phase 2B: Extract Developer Patterns

**Before presenting the diff to the developer**, synthesize each deviation into a pattern category. Every deviation the developer made to the code is treated as intentional — it represents how they want things done. The goal is to feed these back into the dev-spec process so future specs get them right the first time and the developer can spend less time fixing AI-generated code.

For each deviation identified in Phase 2, classify it as one of:

**Preference Pattern** — a consistent stylistic or structural choice the developer applies regardless of context. These should be encoded in the dev-spec skill so all future specs generate code this way by default.
- Example: using `data: v.any()` instead of `fields: Record<string, unknown>` for Convex mutation args
- Example: naming a Next.js adapter component `NextAdminPage` instead of `VexAdminPage`
- Example: splitting a package's exports into sub-path entries (`./server`, `./client`) instead of one barrel

**Implementation Improvement** — the spec generated a stub or placeholder; the developer fleshed it out with a real implementation (or the spec was underbaked and left out features that should have been there from the start). These define what "complete" means for a feature type and should be included as defaults in the relevant section of the dev-spec skill.
- Example: adding pagination args to a list query instead of a hardcoded limit
- Example: adding a real TanStack Table to `CollectionListView` instead of a `<p>` placeholder
- Example: including all CRUD functions fully implemented instead of leaving them as stubs

**Architecture Decision** — a fundamental design choice driven by an external constraint (build tool behavior, framework limitation, etc.). These are one-time decisions; document them in the ideaLog but don't encode them as blanket preferences.
- Example: removing the `"source"` export condition because Turbopack couldn't handle it

For each Preference Pattern and Implementation Improvement, note:
- **What the spec generated** — what was in the spec code block
- **What the developer wrote** — what's actually in the code  
- **The rule** — a one-sentence description of what the dev-spec skill should do instead
- **Which dev-spec section** — which part of the dev-spec skill needs to be updated to encode this rule

After Phase 4 (spec update), run Phase 4B to apply these patterns.

### Phase 3: Present Diff Summary

Use AskUserQuestion to present findings — include both the diff AND the pattern summary:

```
Here's what changed during implementation of spec {number}:

**Renames:**
- `oldFunctionName()` → `newFunctionName()`
- `OldType` → `NewType`
- `old/path/file.ts` → `new/path/file.ts`

**Signature changes:**
- `function foo(a: string)` → `function foo(a: string, b?: number)`
- `interface Bar { x: string }` → `interface Bar { x: string; y: number }`

**Structural changes:**
- Added file: `path/to/new-file.ts`
- Removed file: `path/to/old-file.ts`
- Moved: `old/path` → `new/path`

**Design changes:**
- [Any fundamental approach changes noticed]

**Downstream specs that reference changed names:**
- Spec {N}: references `oldFunctionName` on lines X, Y, Z
- Spec {M}: references `OldType` on lines A, B

---

**Patterns extracted (will update dev-spec after approval):**

Preference Patterns — will be encoded as default behavior in dev-spec:
- [Rule]: spec generated X, developer changed to Y → "always generate Y"

Implementation Improvements — spec was underbaked; will be added as defaults:
- [Feature]: spec had placeholder/stub, developer added [real implementation]

Architecture Decisions — one-time; will be documented in ideaLog only:
- [Decision]: [constraint that drove it]

Should I update the spec, all downstream specs, and encode these patterns in dev-spec?
```

### Phase 4: Update the Completed Spec

After developer approval:

1. **Update all code blocks** to match the actual implementation:
   - Fix function signatures, types, interfaces
   - Fix file paths in `**File: path/to/file.ts**` headers
   - Update the "Target Directory Structure" tree
   - Update test code blocks to match actual test files

2. **Mark all task checkboxes as complete** (`- [ ]` → `- [x]`)

3. **Update design decisions** if the approach changed during implementation

4. **Write two files to `agent-os/implementation-log/YYYY/MM/`** for today's date:

   **`YYYY-MM-DD.ideaLog.md`** — the detailed record agents use for debugging and understanding why code looks the way it does:
   ```markdown
   # YYYY-MM-DD — Spec NN Step N: <Step Title>

   **Spec:** `.rebuild/specs/NN-<name>.md` — Step N
   **Commit:** *(leave blank — filled in after `git commit`)*
   **Packages affected:** `@vexcms/core`, `@vexcms/react`

   ## What was built

   - `path/to/file.ts` — what it does and why it exists
   - `path/to/file.test.ts` — what's covered

   ## Deviations from spec

   - Removed `registry.ts` — the HKT `FieldComponentMap` replaces it; no runtime registration needed
   - Renamed `oldName` → `newName` because [reason]

   If none: "No deviations — implemented as specced."

   ## Decisions made

   - Chose X over Y because [reason]
   - Deferred Z to a future spec: [brief reason]

   ## Known issues / follow-ups

   - [anything to watch for, or deferred bugs]
   ```

   **`YYYY-MM-DD.commit.md`** — a ready-to-copy git commit message in standard format.
   Line 1 is the title. Line 2 is always blank. Lines 3+ are the body.
   `/copy-commit` copies line 1; `/copy-commit-body` copies lines 3+.

   **Title rules:**
   - Conventional commit format: `type(scope): description`
   - Under 72 characters
   - Use conventional commit prefixes: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
   - The scope is the primary package changed: `core`, `react`, `cli`, `docs`. If multiple packages changed equally, use a broader label: `adapters`, `fields`, `packages`
   - The description should cover everything changed in this step — be specific and complete, not generic. "add HKT adapter types and ReactHKT" not "update framework"

   **Body rules:**
   - Verbose — explain what was built and why, not just what files changed
   - Group related changes into paragraphs rather than one long bullet list
   - Include deviations from the spec and the reason
   - End with the spec and log references

   ```markdown
   feat(react): add ReactHKT adapter with typed TextInput and TextCell components

   Implements the HKT framework adapter for React using defineFrameworkAdapter<ReactHKT>
   from @vexcms/core. ReactHKT extends ComponentHKT and maps any props type P to
   ComponentType<P>, so each slot in fields/cells resolves to the correct React
   component type with full prop autocomplete.

   TextInput receives InputComponentProps<TextField> and renders label + input with
   placeholder and readOnly support. TextCell receives CellComponentProps<TextField>
   and handles null values and 80-char truncation.

   Removed registry.ts from the spec — the FieldComponentMap IS the registry.
   TypeScript enforces completeness at build time; no runtime registration needed.
   Admin components look up by reactAdapter.fields[field.type] directly.

   Spec: .rebuild/specs/01-CORE-REACT-INTEGRATION.md (Step 3)
   Log: agent-os/implementation-log/2026/04/2026-04-06.ideaLog.md
   ```

   If a `.ideaLog.md` already exists for today (multiple sync runs in one day), append a new `---` separated section to the existing file rather than overwriting it. Create a new `.commit.md` with a numeric suffix: `YYYY-MM-DD.2.commit.md`.

5. **Remove any "TODO" comments** from code blocks that are now implemented — replace with the actual implementation or remove the code block if it was just a stub reference

### Phase 4B: Encode Patterns into Dev-Spec

After the spec update is complete, apply the patterns extracted in Phase 2B.

**For each Preference Pattern:**

1. Find the relevant section in `.claude/commands/dev-spec.md` — look for the section that generates the type of code that was changed
2. Update the example code, stub template, or guidance text in that section to use the pattern the developer prefers
3. If there is no section covering the relevant code type, add a bullet point to the **CRITICAL** section or the **Build Order** section describing the rule

**For each Implementation Improvement:**

1. Find the dev-spec section that describes the stub type being improved (e.g., "Convex collection functions", "collection list view components")
2. Update the stub code to be the complete implementation — replace the placeholder/minimal version with the developer's real implementation
3. If the feature type has a recurring "minimum viable" level (e.g., every list view needs a data table), add it to the spec's success criteria checklist template

**Write a patterns summary to `agent-os/standards/developer-preferences.md`:**

This file is a running log of encoded preferences, organized by feature area. If it doesn't exist, create it. If it does, append new patterns under the appropriate heading. Format:

```markdown
# Developer Preferences

> Patterns extracted from sync-spec runs. Each entry represents a deviation from
> AI-generated spec code that the developer consistently prefers. These are encoded
> in `.claude/commands/dev-spec.md` — this file is the audit trail.

## Convex Functions
- **Mutation args use `v.any()` not typed records**: `create` and `update` mutations
  accept `data: v.any()` for flexibility. Typed `fields: Record<string, unknown>` is
  too rigid at this stage of the rebuild. *(Encoded: sync-spec 01, 2026-04-07)*

## Next.js Adapter Naming
- **Components are named `Next*` not `Vex*`**: Framework adapter components exported
  from `@vexcms/next` are prefixed `Next` (e.g. `NextAdminPage`) not `Vex`. *(Encoded: sync-spec 01, 2026-04-07)*

## [Category]
- **[Rule]**: [Explanation]. *(Encoded: sync-spec {number}, {date})*
```

**After writing patterns:**

1. Confirm in your response which sections of dev-spec.md were updated and which patterns were written to `developer-preferences.md`
2. Do NOT ask the developer to review these updates — just apply them and report what changed

### Phase 5: Update Downstream Specs

For each downstream spec identified in Phase 1:

1. **Search and replace** all references to renamed functions, types, interfaces, file paths
2. **Update code blocks** that import or reference changed APIs
3. **Update design decisions** that referenced the old approach
4. **Flag any downstream spec where a code block's logic may need rethinking** — present these to the developer via AskUserQuestion rather than silently changing logic

### Phase 6: Verify Consistency

1. Grep across all specs in `.rebuild/specs/` for any remaining references to old names
2. Verify no spec references a function, type, or file that no longer exists
3. Update `apps/docs/src/data/roadmap.json` — set any features that are now fully implemented to `"done"`

### Phase 7: Run Sub-Agent Pipeline

After all spec and log updates are complete, run the following sub-agents in order.
**Each must complete without errors before the next starts.** If one fails, stop and report
to the developer — do not continue to the next agent.

Determine which packages were changed in this sync (from the ideaLog "Packages affected" field),
then run each agent scoped to those packages only.

1. **JSDoc** — for each source file created or modified in this sync:
   Spawn a sub-agent using the `jsdoc-agent` skill: `/jsdoc-agent <file-path>`
   Run one agent per file. Wait for all to complete before proceeding.

2. **Guides** — for each developer-facing feature touched in this sync:
   Check `agent-os/standards/feature-checklist.md` section 5/6 to determine which
   guide types are needed (end-user, adapter-author, or both).
   Spawn a sub-agent using the `guide-agent` skill for each needed guide.
   Skip if a guide for this feature already exists and was not changed by this sync.

3. **Typecheck** — for each affected package:
   Spawn a sub-agent using the `typecheck-agent` skill: `/typecheck-agent <package>`
   If typecheck fails, stop and report. Do not run tests until typecheck passes.

4. **Tests** — for each affected package:
   Spawn a sub-agent using the `test-agent` skill: `/test-agent <package>`
   If tests fail, stop and report.

5. Present a final summary:

```
Sync complete for spec {number}.

**Spec updated:** {count} checkboxes marked complete
**Log written:** agent-os/implementation-log/YYYY/MM/YYYY-MM-DD.ideaLog.md
**Commit message ready:** agent-os/implementation-log/YYYY/MM/YYYY-MM-DD.commit.md

**Pipeline results:**
- JSDoc: {N} files updated / already complete
- Guides: {N} guides written / already exist
- Typecheck: passed / FAILED (see above)
- Tests: passed / FAILED (see above)

Run /copy-commit to copy the commit title, /copy-commit-body for the description.
```

## Key Principles

- **Every deviation is a preference.** All changes the developer made to code that differ from the spec are improvements — not bugs or mistakes. Treat them as authoritative statements about how the developer wants things done. Never frame a deviation as the developer "getting it wrong". The goal of pattern extraction is to make AI-generated specs converge on what the developer will actually ship, reducing the gap between spec template code and final code with each cycle.
- **Patterns flow upward.** Preferences extracted from a sync-spec run must be written back into the dev-spec skill so future specs don't regenerate the same code the developer will have to change. The sync-spec → dev-spec feedback loop is the primary mechanism for making AI tooling progressively more useful over time.
- **The spec is the state.** Checkbox state (`- [x]` vs `- [ ]`) is how the agent knows where you are. Mark steps complete as you finish them. When starting a session, read the spec checkboxes to know what's done and what's next — never ask the developer to re-explain their progress.
- **The ideaLog is append-only.** Never edit or remove past entries in `agent-os/implementation-log/`. They are the history of decisions made during the build. The `/debug` skill reads these logs to understand why code looks the way it does before searching for bugs.
- **Code is the source of truth.** After implementation, the code wins. The spec gets updated to match the code, never the other way around.
- **Don't silently change logic in downstream specs.** If a downstream spec's code block needs more than a name swap, flag it for the developer. The downstream spec may need a design rethink, not just a find-and-replace.
- **Preserve the spec's educational value.** Even when updating, keep the design decisions, edge case documentation, and implementation guidance. These are valuable for future developers reading the spec.
- **Mark everything complete.** Every `- [ ]` checkbox in the completed spec becomes `- [x]`. This gives an at-a-glance view of spec completion status.
- **Document deviations.** If the implementation differs significantly from the spec's original approach, add an "Implementation Notes" section explaining what changed and why. This prevents confusion when someone reads the spec later.
- **Atomic updates.** Update the completed spec and all downstream specs in one pass. Don't leave the codebase in a state where some specs reference old names and others reference new ones.
- **Single object parameters.** All functions AND class methods must use `props: { ... }` as a single typed object parameter. If any function or class method in the spec uses positional params but the code uses a `props` object, update the spec's function signature, inline pseudocode, AND all test call sites. The parameter name is always `props`. Prefer `props.fieldName` access when the function body also defines local variables. Destructuring is allowed when the function has no local variable definitions. Class constructors, error constructors, and zero/single-param methods are exempt. JSDoc must document each props field using `@param props.fieldName` notation.
- **No empty stub files.** If the spec references files that were never created because they'd only contain placeholder content (e.g., `admin/` subfolders with only comments), remove those files from the spec entirely. The spec should only reference files that contain real, functioning code.
- **Update test call sites.** When function signatures change from positional params to `props` objects, every test call in the spec must be updated. Missing this causes the spec tests to not match the actual API, making them useless as a guide.
