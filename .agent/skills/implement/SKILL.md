---
name: implement
description: Run the implementation loop for a spec — implement each task group per the spec,
  verify, record progress. Triggers on "implement the spec", "harness implement",
  "run the implementation loop", "/implement". For low-care projects or specs the developer
  delegated; drives the `harness implement` state machine.
harness_model_role: default
---

# Implement

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. Determine the spec slug (ask if ambiguous — use the structured question tool if available
   (`ask_user_question` / `AskUserQuestion`); otherwise a plain numbered list).
   Run `harness implement <slug> status`.
2. For each group that is not `done`, in order:
   a. Run `harness implement <slug> next` — its stdout is your complete working packet.
      Read every file it points to: the spec section, each context file, naming-conventions.md,
      and `dependencies/registry.md` sources when the packet lists them.
   b. Explore the current codebase state, especially files written by prior groups.
   c. Implement every step in order, following the spec exactly. All names must follow
      naming-conventions.md. Never deviate from the spec without asking.
   d. Steps tagged `[dev]` are the developer's: never write them — stop, say exactly what to
      implement, and wait for confirmation before continuing.
   e. Run `harness implement <slug> verify <Tn>`. On failure load
      `references/verification.md` and follow the retry protocol.
   f. On pass: `harness implement <slug> done <Tn>`, then continue to the next group.
3. All groups done: if `manifest.json#workflow.post_implement_polish` is true and importance is
   "high", suggest running the polish skill. Run `harness tasks move "<spec slug>" --to done`
   (modules.tasks; noop-safe). Then hand off to the commit skill.

## Platform note
Claude Code / pi: task groups run serially. Between groups, re-run `status` and read the fresh
`next` packet instead of relying on memory of earlier groups — the packet is the state.
OMP: the same serial loop applies; native per-group subagent dispatch is deferred.

## Rules
- Never proceed past a failed verify without developer approval — the CLI refuses `done`
  after a fail; `--force` requires the developer's explicit go-ahead and a `--reason`.
- `Verify: manual` groups: pause, tell the developer what to check, and only after they
  confirm run `verify <Tn> --confirmed`.
- Write a session-note if you deviated at all (the `done` log line records only completion).
