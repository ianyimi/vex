# Review — Code Review Against VexCMS Conventions

Review a file, function, or set of changes against the established patterns and conventions in this codebase. Produces a structured list of issues with specific locations and what to fix.

## Usage

```
/review <file-or-target>
```

**Examples:**
- `/review packages/core/src/fields/text/config.ts`
- `/review the text() function`
- `/review packages/react/src/adapter.ts`

---

## Instructions

You are reviewing code against the conventions established in this codebase. Read the target, then check it against each category below. Report issues with file path and line reference. Do not fix anything — your job is to surface problems the developer should address.

### Step 1 — Read the target

Read the file or locate the function the user named. Also read any files it imports from to understand types and contracts.

### Step 2 — Check each category

#### Function signatures
- Every exported function and class method takes a single `props: { ... }` object parameter. Zero-param and single primitive param functions are exempt (e.g., `getAll()`, `has(key)`). Callbacks passed to `.map()`/`.filter()` are exempt.
- The parameter is always named `props` — not `opts`, `args`, `options`, `config`, etc.
- Inline type on the parameter (not a named type alias) unless the same shape is used by 3+ functions.
- If the function body also defines local variables, fields are accessed as `props.fieldName` (not destructured). Destructuring `const { ... } = props` is only acceptable when the function body defines no local variables.

#### JSDoc
- Every exported function has: summary line, `@param props.fieldName` for each field, `@returns`, at least one `@example`.
- Input types (ending in `Input`) have: summary, defaults block with inline `//` comments, multiple `@example` blocks, `@see` to resolved type.
- Resolved types have: one-sentence summary, `@see` back to the Input type. No examples or defaults block needed.
- Interface properties have a one-sentence description.
- Stub functions (`throw new Error("Not implemented")`) do not need examples yet.

#### Input vs resolved type pattern
- User-facing config types end in `Input` and have all properties optional.
- Resolved types (after defaults applied) use explicit interfaces — not `Required<InputType>` or mapped types — so JSDoc is preserved.
- Properties that have defaults are required in the resolved type. Properties that are meaningless when absent (`placeholder`, `description`, `components`) remain optional in both.

#### No speculative code
- No types, fields, or functions that aren't used by something in this file or its direct consumers.
- No placeholder files with only comments or `// TODO: add later` bodies.
- No optional config properties that nothing reads.

#### Exports
- Only export what a consumer of this module actually needs. Internal helpers are not exported.
- Re-export index files don't re-export things that don't exist yet.

#### Security
- No command injection, XSS, SQL injection, or other OWASP top-10 issues.
- No secrets or credentials in source.

### Step 3 — Report findings

Format:

```
**[Category] file.ts:line** — description of the issue and what to change
```

Group by file if reviewing multiple files. If there are no issues in a category, omit it. If there are no issues at all, say so.

**Example output:**

```
**[Signature] config.ts:27** — `text(options, slug)` uses positional params. Change to `text(props: { options?: ...; slug: string })`.

**[JSDoc] types.ts:45** — `FieldAdminConfig` is missing `@see FieldAdminConfigInput`. Add it.

**[Resolved type] text/types.ts:12** — `TextField` uses `Required<TextFieldInput>` which loses JSDoc on each property. Replace with an explicit interface.

**[Speculative] adapter.ts:58** — `fieldRenderers` property is typed but never read anywhere. Remove it.
```

## Key Principles

- **Don't fix, just flag.** The developer makes all code changes. Report what's wrong and what the fix should be, but don't write the corrected code unless the issue is trivial (e.g., a missing `@see` tag).
- **Be specific.** "This could be better" is useless. "Line 27: the parameter is named `opts`, change to `props`" is actionable.
- **Only check what's there.** Don't flag missing features or suggest additions beyond what the conventions require.
- **Skip implementation stubs.** Functions with `throw new Error("Not implemented")` bodies are in-progress — skip JSDoc example requirements for them.
