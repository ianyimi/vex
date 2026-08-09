---
name: debug
description: Investigate a bug with a git-history-first protocol before reading any source.
  Triggers on "debug", "/debug", "why is this broken", "this worked before", "find the
  regression". Checks recent commits, the session log, and the directory structure map before
  forming any hypothesis.
---

# Debug

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Protocol — first steps, always

Most bugs are introduced by a recent commit. Run these BEFORE reading source:

    git log --oneline -20                        # what changed recently
    git diff HEAD~3..HEAD                        # what those commits actually changed
    git log --oneline origin/dev..HEAD           # changes since last known-good dev branch
    git log --oneline origin/master..HEAD        # changes since master
    git stash list                               # any stashed work that might interact

If the user says "it worked before X":

    git log --oneline <branch>..HEAD             # all commits since it worked
    git diff <branch>..HEAD -- <affected file>   # targeted diff on the specific file

## Steps

1. **Run the protocol above.** Note every commit plausibly related to the symptom.
2. **Check the session log.** Read the latest entries under `.agent/docs/session-log/` (newest
   first). The entry for the day the bug likely appeared often records the decision that caused
   it — read "Decisions made" and "Problems hit".
3. **Check the structure map.** For missing-import / wrong-path symptoms, read
   `.agent/docs/standards/directory-structure.md` — it shows where things actually live; run
   `harness struct --check` if it looks stale.
4. **Load `references/debug-hierarchy.md`** — this project's known fragile areas, most-likely
   first. Check any area intersecting the symptom before generic exploration.
5. **Form ONE hypothesis** naming the introducing commit or decision. Verify it (targeted diff,
   reproduction, or a focused test) before writing any fix.
6. **Propose the minimal fix.** Prefer adjusting the introducing change over patching symptoms
   downstream. State the root cause in one sentence.
7. **Verify** with the project's check commands (`.agent/docs/product/dev-processes.md`).
8. **Record it.** Append root cause + fix to today's log entry ("Problems hit"). If the bug
   revealed a lasting anti-pattern, suggest adding it to `docs/standards/anti-patterns.md`
   (mind its 40-line budget).
