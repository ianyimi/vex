---
name: document
description: Use this skill when the user wants to add or update JSDoc comments and inline documentation on TypeScript code. Triggers on "document this", "add JSDoc", "document the public API", "improve documentation", "add docs to", "/document". Also fires automatically when sync-spec's upkeep step asks "should I run /document over the uncommitted changes?" and the user says yes. Follows the JSDoc patterns in `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md` — input types get full treatment (defaults block, examples, @see), resolved types get short summaries.
---

# document

**Single source of truth:** `.pi/prompts/document.md`.

**Read that file in full before doing anything**, then follow its protocol exactly. JSDoc style rules, the input-vs-resolved-type distinction, defaults-block format, and `@example` requirements all live in the prompt (which itself defers to `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md`). This skill is purely the intent-matched entry point.

Don't act on memory of past invocations; protocols change and the prompt is canonical. If anything you remember about the document protocol conflicts with the current prompt, **the prompt wins**.
