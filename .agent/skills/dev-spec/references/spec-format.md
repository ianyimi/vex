# Spec Format — spec.md Layout

Frontmatter (written by `harness spec new`, keep all four keys):
`status` (draft → in-progress → done via sync-spec), `spec_id` (= directory name, never edit),
`touches` (globs of paths this spec changes — fill during step 9), `prompt_version`.

## Required sections, in order

1. `# <spec_id> — Spec` — title line.
2. `## Overview` — 3–6 lines: what this spec covers and why now.
3. `## Design Decisions` — numbered; every decision carries a one-line why. Decisions made in
   the interview land here, not in prose scattered through the spec.
4. `## Out of Scope` — the explicit exclusion list from the interview. Binding.
5. `## Implementation` — one `### Step <n> — <title>` per task group, mirroring spec-tasks.md
   exactly (same ids, same titles). Each group contains:
   - `- [ ]` checkboxes for every file created/modified and every command run
   - a `[dev]` or `[agent]` tag ([dev] = developer implements, [agent] = boilerplate)
   - **one `#### <path>` heading per file, immediately above that file's code block** —
     never a bolded path (`**path**`). Headings are navigable, appear in outlines/TOCs,
     and are anchor-linkable; bold is invisible to every one of those. Any prose about
     the file goes in a paragraph *under* the heading, not appended to it.
   - code blocks: new files complete; **existing files show only new/changed code**, as
     numbered anchored edits (see code-rules.md). Full code for boilerplate/types/tests,
     guided stubs where the developer implements.
   - `Verify:` — the command that proves the group works
6. `## Verification` — run the project's build + test; fix failures before done.

## Rules

- Tests are colocated in the same task group as the code they test — never pooled at the end.
- Every step leaves build + test green (see build-order.md).
- Heading hierarchy is fixed: `#` spec title → `##` section → `###` step → `#### ` file path.
  Nothing else earns a heading level; a file path NEVER appears as bold body text.
- The spec is a living document: sync-spec aligns it with reality after implementation.
