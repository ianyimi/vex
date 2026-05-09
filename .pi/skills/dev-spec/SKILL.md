---
name: dev-spec
description: Use this skill BEFORE writing any non-trivial code change in this repo — new features, new field types, new adapters, API changes, migrations, anything touching multiple files or packages. Triggers when the user says "write a spec", "draft a spec", "spec out the X feature", "this needs a spec", "this needs a dev-spec", "/dev-spec", "1-dev-spec", or any equivalent phrasing. Also fires when you (the agent) recognize that the user is describing work substantial enough to warrant a spec, even if they haven't asked for one explicitly — in that case, propose running this skill before starting. Skip only for typo fixes, single-line config tweaks, or obvious one-liners.
---

# dev-spec

**Single source of truth:** `.pi/prompts/1-dev-spec.md`.

**Read that file in full before doing anything**, then follow its protocol exactly. All rules, interview phases, output formats, design-walkthrough requirements, and edge cases live in the prompt. This skill is purely the intent-matched entry point — its only job is to make you load the prompt without the user typing `/dev-spec`.

Don't act on memory of past invocations; protocols change and the prompt is canonical. If anything you remember about dev-spec conflicts with the current prompt, **the prompt wins**.
