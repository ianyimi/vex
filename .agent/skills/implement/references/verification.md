# Verification Protocol

## On `verify <Tn>` failure
1. Read the failure tail the CLI printed (also stored in
   `.agent/docs/specs/<slug>/.implement-state.json` → `groups.<Tn>.last_output_tail`).
2. Form a single hypothesis before editing anything. Fix, then re-run `verify <Tn>`.
3. **Maximum 2 fix attempts.** After the second failed retry, stop and report to the
   developer: the verify command, exit code, last output tail, what you tried, and your
   current hypothesis. Wait for direction. Do not touch other task groups meanwhile.

## What never happens
- `done <Tn>` after a failed verify. The CLI blocks it; do not reach for `--force` yourself.
  `--force --reason "…"` is typed only when the developer explicitly says to skip, and the
  reason is their words, recorded in the state file and session log.
- Weakening a Verify command (or a test it runs) to make it pass. That is deviation from the
  spec — ask first.

## Timeouts
Verify commands are killed after 300s and recorded as failures. If the command is genuinely
long-running, tell the developer; they may split the group or mark it `Verify: manual`.

## `Verify: manual`
Present the group's steps and what "verified" means for them. After the developer confirms,
run `verify <Tn> --confirmed` — never before.
