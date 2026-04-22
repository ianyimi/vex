---
name: Types are colocated with their implementation
description: Each field's types.ts lives next to its config.ts — do not consolidate into one file
type: feedback
---

Keep types colocated with their implementation. Each field has its own folder (e.g. `fields/text/`) containing `types.ts` and `config.ts` side by side.

**Why:** The user explicitly prefers this — editing one file per field rather than navigating a single large types file.

**How to apply:** When creating new field types or config functions, always place them in their own `fields/<name>/` folder. Never consolidate field types into a shared types file.
