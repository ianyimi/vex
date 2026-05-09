---
name: changeset
description: Use this skill when the user wants to create a changeset for a published-package change. Triggers on "make a changeset", "create a changeset", "release notes for this", "/changeset", "draft a changeset". Also fires automatically when sync-spec's upkeep step asks "did this change a published package's public API?" and the user says yes. Generates the changeset description, picks the right semver bump (patch/minor/major), and runs `pnpm changeset` with the prepared body — never silently bumps versions.
---

# changeset

**Single source of truth:** `.pi/prompts/changeset.md`.

**Read that file in full before doing anything**, then follow its protocol exactly. Semver-bump heuristics, changeset body format, and locked-dep flagging rules all live in the prompt. This skill is purely the intent-matched entry point.

Don't act on memory of past invocations; protocols change and the prompt is canonical. If anything you remember about the changeset protocol conflicts with the current prompt, **the prompt wins**.
