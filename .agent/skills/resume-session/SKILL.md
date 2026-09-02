---
name: resume-session
description: Resume work on a feature by its commit title. Triggers on "/resume-session
  <commit title>", "resume session <name>", "pick up <commit title> again". Compacts the
  important parts of every relevant (similarly named) past session into a resume brief and
  starts a new session entry under the same name — bumping to v2/v3 only when the developer
  asks for a new version.
harness_model_role: default
---

# Resume Session

Input: a commit title (or a distinctive fragment of one), optionally with a version request
("as v2", "new version"). The commit skill names session-log entries after commit titles;
this skill is the return path — find those sessions, compact them, continue under the name.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness state` and read the output.

## Steps

1. **Find the sessions.** Search `.agent/docs/session-log/**/*.log.md` entry titles
   (`## … — <title>` lines) for the given name — exact first, then similar (same feature
   words, comma-joined names containing it, `vN`-suffixed variants). Also search the
   commits ledger (`.agent/docs/commits/`) for the title, and pull the matching-day
   `.commit.md` / `.handoff.md` files. Nothing found → say so, list the nearest titles,
   stop.
2. **Read newest-first and compact.** From every matching entry keep only what the next
   session needs: decisions made (with their why), problems hit + resolutions, "Where I
   left off", the driving spec path, and files touched. Reference, never copy — cite
   specs, ADRs, commits, and diffs by path or hash. Drop narration and anything a fresher
   entry supersedes.
3. **Version the name.** Default: SAME name, no suffix — resuming is a continuation, not a
   new version. Only when the developer asked for a new version in the command (or states
   the feature is being significantly redone): take the highest existing version of the
   name (bare = v1) and bump it — first bump is ` v2`, then ` v3`. Confirm the bump in the
   brief's first line.
4. **Open the new entry.** Run `harness log append`, then retitle the fresh entry to the
   resolved name (title only — bodies stay untouched). Set its `**Spec:**` line to the
   driving spec if one is still open.
5. **Present the resume brief**, in order:
   - `# Resume — <name>` (with ` v<N>` when bumped)
   - `## Sessions compacted` — each source entry as `date — title` (one line each)
   - `## Decisions + constraints` — every ruling still binding, one line each
   - `## Current state` — what works, what was broken, spec/task-group progress
     (`harness implement <slug> status` when a spec is open)
   - `## Next steps` — ordered, imperative, starting from the newest "Where I left off"
   - `## Watch-outs` — problems hit before that could recur
   Then continue working from the first next step — the brief is the session's opening
   state, not a handoff to someone else.

## Rules
- Similar-but-unrelated titles never get pulled in: a source entry must share the feature,
  spec, or files — when in doubt, list it under "Sessions considered, excluded" instead.
- Version bumps are developer-initiated only. Never bump because time passed or the diff
  is large.
- This skill never edits past entry bodies and never renames past entries — the commit
  skill owns renaming.
