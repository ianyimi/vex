# Code Rules — for All Spec Code Blocks

## Naming

- Every file, folder, function, type, and variable name satisfies the machine-readable rules
  block AND the identifier conventions in `docs/standards/naming-conventions.md`.
- Run the naming pass (skill step 7) before presenting — mismatches are spec bugs.

## Standards

- Follow every entry in `docs/standards/preferences.md`.
- Never contradict `docs/standards/anti-patterns.md` — those are paid-for lessons.

## Guided stubs (high-care / [dev] steps)

- Signature + complete JSDoc (`@param props.x` with description, `@returns`, `@throws`).
- Numbered `// TODO: implement` pseudo-code inside the body: steps 1, 2, 3…, lettered
  sub-steps for branches, `→` for what each step produces or throws.
- An `// Edge cases:` list when there are non-obvious cases.
- End with `throw new Error("Not implemented")` so the code compiles but fails at runtime.

## New file vs. existing file

- **New file → show it complete.** There is no existing code to wade through.
- **Existing file → show ONLY new or changed code.** Never reproduce a file the developer
  already has. A 500-line block for four added types is unreadable, and the developer
  cannot tell what to copy.
- Structure an existing-file edit as: a line stating the edit count and that everything
  not shown is unchanged, then numbered bold edits (`**1 — imports.**`, `**2 — …**`), each
  naming its anchor in prose then showing only the new lines.
- **Anchor by stable identifier, never by line number.** "Beside the existing
  `ExtractFieldKeys` helper", "add to `FindServerArgs` alongside `withIndex`", "replace the
  body of `buildQuery`". Line numbers drift the moment an earlier step lands.
- A function whose body genuinely changes throughout: show that ONE function complete, not
  its file.
- Deletions: name the block being removed by its identifier or condition; show only what
  replaces it, if anything.

## General

- Every code block is labeled by a `#### <path>` heading directly above it — never a
  bolded path. One heading per file; prose about the file goes under the heading.
- Single `props` object parameter on exported functions and class methods.
- Tests carry exact expected values — the test IS the spec of correct behavior.
- No speculative code: if nothing in this spec calls it, it doesn't go in.
- Every step leaves the LSP clean: no imports of files that don't exist yet.
