---
name: learn
description: Deep-read a dependency or library to build a working understanding before changing
  code that uses it, and leave a reusable reference note. Triggers on "learn", "/learn",
  "how does <library> work", "read up on".
---

# Learn

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. **Scope the topic.** If vague ("learn the ORM"), ask once for the specific surface (API,
   config, lifecycle, extension point).
2. **Read source-of-truth first:** `.agent/dependencies/<package>/` clone if present (pinned to
   the project's version — prefer it) → the package's installed types + bundled docs/examples →
   `.agent/docs/research/` prior notes → official web docs, last.
3. **Build the understanding:** the mental model (what owns what, lifecycle), the 3–5 API
   shapes the project actually touches (copied verbatim from source), the smallest working
   example.
4. **Write `.agent/docs/research/learn-<slug>.md`** (create the dir if missing): **Mental
   model** · **Key API shapes** (verbatim signatures + source paths) · **Minimal example** ·
   **Gotchas** (version quirks seen in source, load order, footguns).
5. **Report the path** + the one-paragraph mental model inline.
