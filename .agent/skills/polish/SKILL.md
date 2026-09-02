---
name: polish
description: Deep code review for high-importance projects after spec implementation.
  Triggers on "run polish", "polish the code", "/polish", or after harness implement completes
  on high-importance projects. Only runs when manifest.json#workflow.importance is "high".
  Checks error handling, codepath coverage, and spec edge cases. May suggest small UX
  improvements but never applies them without approval.
harness_model_role: slow
---

# Polish

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. Run `harness polish <slug>`. If it exits with `polish-disabled`, relay its message and stop.
   Its stdout is your working packet: spec edge cases, `touches[]` globs, checklist path.
2. Load `references/polish-checklist.md`.
3. Read the completed spec (spec.md + spec-tasks.md) — note every listed edge case.
4. Read all files matching the packet's `touches[]` globs.
5. Run the error-handling check against the checklist.
6. Run the codepath-coverage check.
7. Check every spec edge case is implemented; search the touched files for remaining
   `throw new Error("Not implemented")` stubs.
8. Generate lightweight suggestions only (small, low-risk, no new spec required). This is a
   review: never apply changes — suggestions are presented, nothing is edited.
9. Present findings in the exact output format at the end of the checklist.
   Ask: add warnings to tasks.md inbox?
