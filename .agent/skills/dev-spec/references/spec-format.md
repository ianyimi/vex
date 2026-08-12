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
   - code blocks: full code for boilerplate/types/tests, guided stubs where the developer
     implements (see code-rules.md)
   - `Verify:` — the command that proves the group works
6. `## Verification` — run the project's build + test; fix failures before done.

## Rules

- Tests are colocated in the same task group as the code they test — never pooled at the end.
- Every step leaves build + test green (see build-order.md).
- The spec is a living document: sync-spec aligns it with reality after implementation.
