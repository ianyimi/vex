# Pattern Extraction — Classifying Spec-vs-Reality Deviations

Diff each spec code block against the merged file it targeted. Classify every deviation:

| Class | Example | Lands in |
|---|---|---|
| Naming | spec `useTextfield` → dev `useTextField` | naming-conventions.md |
| Structure | helper moved from component file into `lib/` | preferences.md |
| API shape | single object param over positional args | preferences.md |
| Style | early-return over nested conditionals | preferences.md |
| Scope | functionality added or dropped | spec.md only — NEVER preferences |
| Agent mistake (corrected) | agent used Date.now() in generated output | anti-patterns.md |

## The write threshold

Record a preference only when the pattern is seen **≥2 times** or the developer states it
explicitly ("always do X"). One-off deviations are noise — skip them.

## Discipline

- One line per rule. A preference is a rule, not an essay.
- Non-obvious only: "fix typos" is not a preference; "commit scope comes from turbo.json
  package names" is.
- Scope changes update the spec so it matches reality — they are never harvested as rules.
- When unsure which file a lesson belongs in: was the agent *corrected*? → anti-patterns.
  Is it *how the developer writes code*? → preferences. Is it *what things are called*? →
  naming-conventions.
