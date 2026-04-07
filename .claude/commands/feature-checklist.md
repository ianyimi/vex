# Feature Checklist — Verify a Feature is Complete

Check whether a named feature is complete across all required dimensions: implementation, types, JSDoc, exports, docs guide, and roadmap status. Outputs a checklist of what's done and what's missing.

## Usage

```
/feature-checklist <feature or package>
```

**Examples:**
- `/feature-checklist text field`
- `/feature-checklist defineFrameworkAdapter`
- `/feature-checklist React adapter`
- `/feature-checklist @vexcms/core`

---

## Instructions

### Phase 1: Locate the feature

Find the relevant source files in `packages/` for the named feature. If a package name is given, check all exported items in that package.

### Phase 2: Check each dimension

For each exported function, type, and interface in scope:

#### 1. Implementation
- [ ] File exists at the expected path
- [ ] No `throw new Error("Not implemented")` in the body
- [ ] No `// TODO: implement` comments remaining
- [ ] No `as any` casts that are clearly placeholders

#### 2. Types
- [ ] Input types (ending in `Input`) have all properties optional
- [ ] Resolved types are explicit interfaces, not `Required<InputType>` or mapped types
- [ ] No properties typed `any` without a comment explaining why
- [ ] Props that have defaults are required in the resolved type
- [ ] Props that are meaningless when absent remain optional in both types

#### 3. JSDoc
- [ ] Every exported function has: summary, `@param props.fieldName` for each field, `@returns`, at least one `@example`
- [ ] Every Input type has: summary, defaults block with `//` comments, `@example` blocks, `@see` to resolved type
- [ ] Every resolved type has: one-sentence summary, `@see` back to Input type
- [ ] Every interface property has a one-sentence description
- [ ] No empty JSDoc blocks (`/** */`)

#### 4. Exports
- [ ] Exported from the package's `src/index.ts`
- [ ] If it's a type used by framework packages, exported from `@vexcms/core`
- [ ] No internal helpers accidentally exported

#### 5. Docs guide
- [ ] A guide exists in `apps/docs/src/content/docs/guides/` for this feature (if user-facing)
- [ ] The guide has a complete working example
- [ ] API reference will be auto-generated via TypeDoc (no manual check needed)

#### 6. Roadmap
- [ ] Feature appears in `apps/docs/src/data/roadmap.json`
- [ ] Status is `"done"` if fully complete, `"in_progress"` if partially done

### Phase 3: Report findings

Format the output as a checklist grouped by dimension. Use `✅` for passing, `❌` for failing, `⚠️` for partial.

**Example output:**

```
Feature: Text field (packages/core/src/fields/text/)

Implementation  ✅ all functions implemented, no stubs
Types           ✅ TextField and TextFieldInput follow input/resolved pattern
JSDoc           ⚠️  text() function missing @example for minLength/maxLength usage
                ❌  TextFieldInput missing defaults block
Exports         ✅ exported from @vexcms/core index
Docs guide      ❌ no guide at apps/docs/src/content/docs/guides/text-field.mdx
Roadmap         ✅ marked "done" in roadmap.json

Next: Run /document TextFieldInput to fix JSDoc, then /guide text field
```

Always end with a "Next:" line naming the most important missing item and the command to fix it.

## Key Principles

- **Check the actual files.** Don't assume something is done because it's in the spec. Read the source.
- **One feature at a time.** If a package is named, check each exported item individually — don't give a single pass/fail for the whole package.
- **Suggest the fix command.** Every `❌` should have a clear next action. Use the existing skills: `/document` for JSDoc, `/guide` for docs, `/review` for type issues.
- **Roadmap status reflects reality.** If the feature is complete in code but marked `"planned"` in roadmap.json, flag it. Offer to update the roadmap.
