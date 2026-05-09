---
name: commit
description: Use this skill when the user wants to stage and commit changes. Triggers on "commit this", "make a commit", "stage and commit", "let's commit", "commit the changes", "/commit", "3-commit". Produces a conventional commit message (type(scope): description format), with the body explaining WHY not what changed. Never auto-commits without showing the user the message and getting confirmation in the same turn.
---

# commit

**Single source of truth:** `.pi/prompts/3-commit.md`.

**Read that file in full before doing anything**, then follow its protocol exactly. Commit-message format, scope rules, staging behavior, and confirmation requirements all live in the prompt. This skill is purely the intent-matched entry point.

Don't act on memory of past invocations; protocols change and the prompt is canonical. If anything you remember about the commit protocol conflicts with the current prompt, **the prompt wins**.
