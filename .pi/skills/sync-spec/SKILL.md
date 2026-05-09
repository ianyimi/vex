---
name: sync-spec
description: Use this skill at natural stopping points after implementation work — end of session, after a PR is merged, after a feature lands. Extracts repeatable patterns into developer-preferences.md, mirrors them into the dev-spec prompt, runs typecheck/tests on affected packages, optionally updates the roadmap, and writes a session ideaLog entry. Triggers when the user says "wrap this up", "let's sync", "sync the spec", "extract patterns", "extract standards", "/sync-spec", "2-sync-spec", or "sync-spec". Also fires automatically at end-of-session if a substantial chunk of work just landed and the user is closing out. Never run during active implementation — only after.
---

# sync-spec

**Single source of truth:** `.pi/prompts/2-sync-spec.md`.

**Read that file in full before doing anything**, then follow its protocol exactly. Phase steps, pattern categories, upkeep tasks, and ideaLog format all live in the prompt. This skill is purely the intent-matched entry point.

Don't act on memory of past invocations; protocols change and the prompt is canonical. If anything you remember about sync-spec conflicts with the current prompt, **the prompt wins**.
