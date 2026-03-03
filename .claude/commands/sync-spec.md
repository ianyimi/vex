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

### Phase 3: Present Diff Summary

Use AskUserQuestion to present findings:

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

Should I update the spec and all downstream specs to match these changes?
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

4. **Add an "Implementation Notes" section** at the bottom if there were significant deviations:
   ```markdown
   ## Implementation Notes

   Changes made during implementation:
   - Renamed `mergeAuthFields` → `mergeAuthTableWithCollection` because [reason]
   - Moved `types.ts` into `auth/types.ts` for better organization
   - Added `wrapOptional()` helper that wasn't in the original spec
   ```

5. **Remove any "TODO" comments** from code blocks that are now implemented — replace with the actual implementation or remove the code block if it was just a stub reference

### Phase 5: Update Downstream Specs

For each downstream spec identified in Phase 1:

1. **Search and replace** all references to renamed functions, types, interfaces, file paths
2. **Update code blocks** that import or reference changed APIs
3. **Update design decisions** that referenced the old approach
4. **Flag any downstream spec where a code block's logic may need rethinking** — present these to the developer via AskUserQuestion rather than silently changing logic

### Phase 6: Verify Consistency

1. Grep across all specs in `agent-os/product/` for any remaining references to old names
2. Verify no spec references a function, type, or file that no longer exists
3. Present a final summary:

```
Sync complete for spec {number}.

**Updated files:**
- `agent-os/product/{number}-{name}.md` — spec aligned with implementation
- `agent-os/product/{downstream1}.md` — updated references
- `agent-os/product/{downstream2}.md` — updated references

**All tasks marked complete:** {count} checkboxes updated

**Remaining references to verify:** (if any stale references found)
- [list]
```

## Key Principles

- **Code is the source of truth.** After implementation, the code wins. The spec gets updated to match the code, never the other way around.
- **Don't silently change logic in downstream specs.** If a downstream spec's code block needs more than a name swap, flag it for the developer. The downstream spec may need a design rethink, not just a find-and-replace.
- **Preserve the spec's educational value.** Even when updating, keep the design decisions, edge case documentation, and implementation guidance. These are valuable for future developers reading the spec.
- **Mark everything complete.** Every `- [ ]` checkbox in the completed spec becomes `- [x]`. This gives an at-a-glance view of spec completion status.
- **Document deviations.** If the implementation differs significantly from the spec's original approach, add an "Implementation Notes" section explaining what changed and why. This prevents confusion when someone reads the spec later.
- **Atomic updates.** Update the completed spec and all downstream specs in one pass. Don't leave the codebase in a state where some specs reference old names and others reference new ones.
- **Single object parameters.** All functions must use `props: { ... }` as a single typed object parameter. If any function in the spec uses positional params but the code uses a `props` object, update the spec's function signature, inline pseudocode, AND all test call sites. The parameter name is always `props`, destructured as the first line of the function body.
- **No empty stub files.** If the spec references files that were never created because they'd only contain placeholder content (e.g., `admin/` subfolders with only comments), remove those files from the spec entirely. The spec should only reference files that contain real, functioning code.
- **Update test call sites.** When function signatures change from positional params to `props` objects, every test call in the spec must be updated. Missing this causes the spec tests to not match the actual API, making them useless as a guide.
