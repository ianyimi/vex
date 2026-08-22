---
name: commit
description: Generate a commit message from today's session log and update project documents at
  the end of a work session. Triggers on "commit", "/commit", "generate commit message", "wrap
  up this session". Honors manifest.json#workflow.commit_mode — "message-only" presents the
  message for lazygit; "agent-commits" stages and commits after confirmation.
harness_model_role: smol
---

# Commit

**Fully autonomous — ask the developer NOTHING.** The whole point of this command is that the
developer runs it, walks away, and comes back to a finished commit message file. Every answer
you need is in `git status`/`git diff`, the session log, and your own conversation context.
Never use a question tool here; if something is genuinely unknowable (e.g. why an unrelated
file is dirty), note it in the final summary instead of blocking on it.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps

1. **Read the mode.** `workflow.commit_mode` in `.agent/manifest.json`: `"message-only"`
   (default) or `"agent-commits"`.
2. **Ensure today's log entry.** Run `harness log session-end`. It creates today's entry if
   missing and prints four questions. Answer them YOURSELF: run `git status --porcelain` and
   `git diff` (staged + unstaged), combine with what you did this session, and write the
   answers into the printed path. Only sections you truly cannot reconstruct get a one-line
   `(not captured this session)`. Append into today's entry only — never rewrite earlier
   entries. Load `references/session-log-format.md` for the entry format.
3. **High-care projects:** if `workflow.default_tier` is "high-care" and code changed since the
   last sync-spec run, add a "consider running sync-spec" line to the final summary. Do not
   pause to ask — continue immediately.
4. **Generate + format the message.** Run `harness log commit-msg`. It writes two files: the
   raw `.commit.md` (machine source for `git commit -F`) and the day's ledger
   `.agent/docs/commits/MM-DD-YYYY.md`. Its output is a terse first draft — ALWAYS rewrite
   both files to match `references/commit-format.md` (correct `type(scope)` title, rich prose
   body naming symbols/why, a `!`/`BREAKING CHANGE:` indicator if any, and the always-present `Spec:`/`Log:`
   footer). **Write the ledger as plain Markdown — strip the ``` code fence** `harness log
   commit-msg` adds; the message is not a code block. Then make sure today's session-log entry
   already contains the session's decisions (add them if missing) and, AFTER those decisions,
   leave a single link to the ledger as the "committed up to here" marker — never paste the
   full message into the log.
5. **Name sessions after the commit.** The commit title (the `type(scope): description`
   line) becomes the session's name, so a session can be resumed later by the commit it
   produced:
   - Retitle every `## … — <title>` entry today's commit covers: a placeholder title
     ("session") is replaced with the commit title; an entry already named for another
     commit gains `, <commit title>` appended instead — comma-joined names mark sessions
     that cross multiple specs, growing with each feature they touch.
   - Skim earlier entries (last ~30 days of log files) by TITLE only. Where a title
     plausibly relates to this spec or commit, read that entry's body; append
     `, <commit title>` ONLY when it meaningfully relates — same spec, same files, or a
     decision this commit builds on. No meaningful relation → title stays untouched.
   - Rename titles only — never edit entry bodies, never remove a name already present.
6. **The gate.** Load `references/commit-checklist.md` (customized for this project at init).
   Run every "Must pass" item — report each ✅/🔴 — and PERFORM every "Must be current" update.
   Failures do NOT stop the run or trigger questions: fix what is mechanically fixable, finish
   the commit message file regardless, and lead the step-8 summary with the remaining 🔴 items
   so the developer decides whether to fix or commit anyway. (In agent-commits mode a 🔴 DOES
   block the actual `git commit` — record any waiver the developer gives in today's entry.)
   Nothing is silently changed; collect every update for the step-8 summary.
7. **Commit — by mode.**
   - `message-only`: the message is in the day's ledger (and `.commit.md`) — done. Do NOT run
     `git commit`.
   - `agent-commits` (the ONE permitted question in this skill — it runs git): show
     `git status --porcelain`; confirm the exact file list with the developer (structured
     question tool). On confirmation:
     `git add <files> && git commit -F .agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.md`,
     then `harness log backfill-sha --sha "$(git rev-parse HEAD)"`.
8. **Summary.** FIRST line, message-only mode: the ledger path —
   `.agent/docs/commits/MM-DD-YYYY.md` — so the developer returning to the session sees
   immediately where to copy from; then the full message itself. Agent-commits: the new SHA.
   Then the rename receipt from step 5 — every retitled entry as `<old title> → <new title>`
   (or "no earlier sessions related") — closing with the line "Session names updated — safe
   to close this session." The developer waits for that line before closing; resume later
   with `/resume-session <commit title>`.
   Then "Updated: [files]. Needs your attention: [list]."
