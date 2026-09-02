---
name: commit
description: Generate commit messages from the full set of outstanding changes and update
  project documents at the end of a work session. Reviews every uncommitted change — not just
  the current session's — clusters them into commits, reconstructs log entries for sessions
  that never logged, and renames all affected sessions. Runnable from any agent session.
  Triggers on "commit", "/commit", "generate commit message", "wrap up this session". Honors
  manifest.json#workflow.commit_mode — "message-only" presents messages for lazygit;
  "agent-commits" stages and commits after confirmation.
harness_model_role: default
---

# Commit

**Fully autonomous — ask the developer NOTHING.** The whole point of this command is that the
developer runs it, walks away, and comes back to finished commit messages. Every answer you
need is in `git status`/`git diff`, the session log, the specs, and your own conversation
context. Never use a question tool here; if something is genuinely unknowable (e.g. why an
unrelated file is dirty), note it in the final summary instead of blocking on it.

**Scope is the working tree, not your session.** This command is run from whichever agent
session happens to be open. Other sessions — other agents, earlier today, a developer working
by hand — leave changes behind, often without a log entry. You own ALL of them: every
uncommitted change gets reviewed, attributed, logged, messaged, and named. Never commit only
the slice you personally touched and leave the rest dirty.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.
4. Run `git status --porcelain` and `git diff` (staged + unstaged, plus untracked files).
   This is the authoritative work list for the whole run.

## Steps

1. **Read the mode.** `workflow.commit_mode` in `.agent/manifest.json`: `"message-only"`
   (default) or `"agent-commits"`.
2. **Cluster the working tree into commits.** **Project override (P-016): this project
   commits ONE commit per run covering the entire working tree — do NOT split by concern;
   write a multi-concern body with bold-headed paragraphs instead. Splitting returns only
   after the first official release.** The generic guidance below then applies to body
   structure, not commit count. Group every changed and untracked path into
   the smallest set of coherent commits. One cluster = one concern that a reviewer would
   want to read, revert, or bisect on its own. Signals: the driving spec or work package,
   the type from `references/commit-format.md` (never mix `fix` with `build` when they are
   independent), and whether one cluster compiles without the other. Prefer splitting —
   `references/commit-format.md` says so — but never split a change from the callers it
   breaks. Record the file list per cluster; the lists MUST be disjoint and MUST cover
   every path in `git status`.
3. **Attribute each cluster to a session.** For each cluster ask which work block produced
   it. Evidence, in order: your own conversation; today's log entries; file mtimes;
   `git log -S "<distinctive string>"` for when a line was introduced; any spec written or
   ticked alongside it. A cluster you did not produce still belongs to this run.
4. **Ensure a log entry per cluster.** Run `harness log session-end` — it creates today's
   entry if missing and prints four questions. Answer them YOURSELF from the diff and
   context; never ask the developer. Then:
   - One entry per cluster. `harness log append` creates additional entries; it takes no
     title or timestamp flags, so entries land at the current time and get their titles in
     step 7.
   - **A cluster whose session never logged still gets a full entry**, reconstructed from
     the diff, the spec, and `git log`. Open it with a one-line blockquote saying it was
     logged retroactively and that the body is reconstructed rather than transcribed — a
     cold-start reader must be able to tell recollection from evidence.
   - Only sections you truly cannot reconstruct get a one-line `(not captured this
     session)`. Append into today's file only — never rewrite an earlier day's entry body.
   - Load `references/session-log-format.md` for the entry format.
5. **High-care projects:** if `workflow.default_tier` is "high-care" and code changed since
   the last sync-spec run, add a "consider running sync-spec" line to the final summary. Do
   not pause to ask — continue immediately.
6. **Generate + format one message per cluster.** Run `harness log commit-msg`. It writes
   the raw `.commit.md` (machine source for `git commit -F`) and the day's ledger
   `.agent/docs/commits/MM-DD-YYYY.md`. **It reads only the LAST log entry and emits one
   message** — a terse file-list draft. ALWAYS rewrite. For each cluster produce a message
   matching `references/commit-format.md`: correct `type(scope)` title, rich prose body
   naming symbols and why, `!`/`BREAKING CHANGE:` when warranted, and the always-present
   `Spec:`/`Log:` footer.
   - **Raw files, one per cluster.** The first keeps the harness name
     `YYYY-MM-DD.commit.md`; subsequent ones are `YYYY-MM-DD.commit.2.md`,
     `.commit.3.md`, … numbered in commit order.
   - **Ledger.** One `## HH:MM — <commit title>` section per cluster, in commit order,
     each carrying its raw-file path and a copy-pasteable `git add … && git commit -F …`
     block with that cluster's exact file list. Plain Markdown — **strip the ``` code
     fence** `harness log commit-msg` wraps the message in. Head the file with a one-line
     note that the lists are disjoint and must be committed separately.
   - **Harness bookkeeping rides the LAST cluster** — session log, ledger, standards,
     `state.md`, `tasks.md`, `.sync-manifest.json`, `directory-structure.md`. It spans the
     whole run and cannot be split cleanly by file.
   - Then make sure each entry contains its session's decisions (add them if missing) and,
     at the END of that entry, leave a single link to the ledger as the "committed up to
     here" marker — never paste a full message into the log.
7. **Name sessions after their commit.** The commit title (the `type(scope): description`
   line) becomes the session's name, so a session can be resumed later by the commit it
   produced:
   - Retitle each of today's entries with the title of the commit ITS cluster produced — a
     placeholder title ("session") is replaced; an entry already named for another commit
     gains `, <commit title>` appended instead. Comma-joined names mark sessions that cross
     multiple specs, growing with each feature they touch.
   - Skim earlier entries (last ~30 days of log files) by TITLE only. Where a title
     plausibly relates to any commit in this run, read that entry's body; append
     `, <commit title>` ONLY when it meaningfully relates — same spec, same files, or a
     decision this commit builds on. A "where I left off" that this commit finishes counts.
     `git log -S` on a line this commit removes finds the session that introduced it. No
     meaningful relation → title stays untouched.
   - Rename titles only — never edit entry bodies, never remove a name already present.
8. **The gate.** Load `references/commit-checklist.md` (customized for this project at
   init). Run every "Must pass" item ONCE for the whole working tree — report each ✅/🔴 —
   and PERFORM every "Must be current" update. Beware cached task runners: a
   restored-from-cache banner (Turborepo's `FULL TURBO`, Nx's "existing outputs match",
   `up-to-date`) is not evidence the check ran — re-run it with the runner's force flag.
   Failures do NOT stop the run or trigger questions: fix what is mechanically fixable,
   finish every message file regardless, and lead the step-10 summary with the remaining
   🔴 items so the developer decides. (In agent-commits mode a 🔴 DOES block the actual
   `git commit` — record any waiver in today's entry.) Nothing is silently changed;
   collect every update for the summary.
9. **Commit — by mode.**
   - `message-only`: the messages are in the day's ledger (and the `.commit*.md` files) —
     done. Do NOT run `git commit`.
   - `agent-commits` (the ONE permitted question in this skill — it runs git): show
     `git status --porcelain` and the per-cluster file lists; confirm them with the
     developer (structured question tool). On confirmation, commit clusters **in order**,
     each `git add <that cluster's files> && git commit -F <that cluster's raw file>`.
     After the LAST one, `harness log backfill-sha --sha "$(git rev-parse HEAD)"`.
10. **Summary.** FIRST line, message-only mode: the ledger path —
    `.agent/docs/commits/MM-DD-YYYY.md` — so the developer sees immediately where to copy
    from; then each commit title with its file count, in order, followed by the full
    messages. Agent-commits: the new SHAs in order. Say explicitly which clusters came from
    sessions other than this one, and which log entries were reconstructed retroactively.
    Then the rename receipt from step 7 — every retitled entry as `<old title> → <new
    title>` (or "no earlier sessions related") — closing with the line "Session names
    updated — safe to close this session." The developer waits for that line before
    closing; resume later with `/resume-session <commit title>`.
    Then "Updated: [files]. Needs your attention: [list]."
