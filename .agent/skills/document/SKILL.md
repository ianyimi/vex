---
name: document
description: Write or update inline documentation (JSDoc/docstrings/rustdoc — whatever the
  project uses) for a target in the codebase. Triggers on "document", "/document", "add docs
  for", "write JSDoc". Reads the implementation first; docs must match observed behavior.
harness_model_role: smol
---

# Document

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. **Resolve the target.** Given none, default to all uncommitted source changes
   (`git status --porcelain`), skipping config/lock/markdown files. Include changed TEST
   files — check for stale descriptions and assertions that no longer match the implementation.
2. **Load conventions.** `.agent/docs/product/tech-stack.md` (language, doc format),
   `harness context --for "documentation"`, and any doc-comment rules in `docs/standards/`.
3. **Read before writing.** Per target: the full file, nearby usages, the parent type, applied
   defaults. Never document behavior you haven't seen in the implementation.
4. **Write the docs.** Purpose summary (not a type restatement) · each param with valid values ·
   return + null/error cases · one realistic example where non-obvious. Never: filler
   ("Handles…"), restating signatures, invented error annotations.
5. **Edit in place** — only doc comments change; no reformatting, renaming, or logic edits.
6. **Verify** with the check commands in `.agent/docs/product/dev-processes.md`. Fix breakage
   you caused; report (don't fix) pre-existing failures.
7. **Report** documented files + any pre-existing failures.
