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
      and `dependencies/registry.md` sources when the packet lists them. The spec has a
      `## Probe Findings` section? Read it FIRST — verdicts there are proven facts: corrected
      claims are binding design, and listed bugs are known terrain, not new discoveries.
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
OMP: subagents MAY implement groups, but STRICTLY ONE AT A TIME, in spec order — never a
parallel batch. Each group builds on the previous group's real output, so concurrent workers
produce mutually inconsistent implementations (diverging names, shapes, and error contracts
that each compile alone and fail together). Sequential-subagent protocol:
1. Spawn one subagent per group, waiting for each to complete before spawning the next.
2. Each subagent's packet includes: the `next` packet contents, AND a short ground-truth
   digest of what the PRIOR groups actually produced (final signatures, renamed symbols,
   corrected assumptions) — the prior subagent's completion summary is the source for this.
   Prior groups' outputs are FINAL for the current worker: it conforms to them, never
   re-litigates them.
3. A worker that discovers a false spec assumption reports it in its summary (P-023); fold
   the correction into every later group's digest so the divergence propagates forward
   exactly once.
4. Developer corrections route to the ORIGINAL worker. When the developer reports a bug,
   UI correction, or design change in a feature a group's subagent built (during or after
   the run, for any spec), the main agent revives THAT subagent by messaging it
   (`agent://<id>`) with the report, never spawns a fresh worker and never fixes it
   itself — the original holds the context of every decision it made. Only if that
   subagent is unrecoverable does the main agent spawn a replacement, pointed at the
   original's transcript (`history://<id>`). Fold the outcome into the digest like (3).
5. Developer-reported errors from in-progress work: when the developer pastes a build or
   runtime error, first check whether it comes from a worker's unfinished edits (a file the
   active worker is mid-way through: a missing export, half-migrated imports, a transient
   parse error). If it does, just tell the developer which in-progress work caused it and
   that the worker's own next steps resolve it. Do NOT message, interrupt, or redirect the
   worker about it, and do not restart dev servers for it. Escalate only if the error
   outlives the worker's completion, or the developer explicitly asks for a fix.
6. Workers announce live-app breakage. A worker whose edits will break the running dev app
   (a multi-file migration, export renames, a dev-server restart dependency) messages the
   main agent BEFORE starting: what will break, why, and roughly how long. It messages
   again the moment the app compiles and loads cleanly. An unexpected break gets reported
   the same way as soon as the worker notices it. The main agent relays each notice to the
   developer as a short status ("app down: <worker>, <reason>, ~<eta>" / "app back up"),
   so the developer knows when to wait and when to test, instead of pasting errors.

## Rules
- Never proceed past a failed verify without developer approval — the CLI refuses `done`
  after a fail; `--force` requires the developer's explicit go-ahead and a `--reason`.
- `Verify: manual` groups: pause, tell the developer what to check, and only after they
  confirm run `verify <Tn> --confirmed`.
- Write a session-note if you deviated at all (the `done` log line records only completion).
