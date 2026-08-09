---
name: research
description: Investigate a technical question (library choice, API behavior, tooling
  comparison) and write a concise findings doc to .agent/docs/research/. Triggers on
  "research", "/research", "compare X and Y", "investigate whether".
---

# Research

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.
4. If `modules.research` is false in `.agent/manifest.json` → stop; tell the user to enable it
   (or answer inline without writing a doc, if they prefer).

## Steps
1. **Check prior work.** List `.agent/docs/research/` — if a doc on this topic exists,
   summarize it and ask whether to update or write anew.
2. **Walk sources nearest-first:** project code/docs → dependency source clones under
   `.agent/dependencies/<package>/` (if present) → installed types/docs in `node_modules` (or
   the language's equivalent) → official docs/repos on the web, last. Stop once answered; copy
   API shapes from source, never from memory.
3. **Write `.agent/docs/research/<slug>.md`** (create the dir if missing): **Question** ·
   **Answer** (concise, decision-ready) · **Sources** (full paths/URLs) · **Code references**
   (file:line or snippets ≤ 20 lines) · **Open questions**.
4. **Report the path.** Don't paste the whole doc into chat unless asked.
