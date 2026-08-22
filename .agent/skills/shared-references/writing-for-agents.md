# Writing for Agents — Skill & Pointer Authoring Rules

Load this before writing or editing any SKILL.md, reference doc, AGENTS.md directive, or
context pointer in this harness. The goal: predictable agent behavior comes from document
structure, not from hoping the model reads carefully.

## Context pointers

- One pointer per distinct branch of behavior. Synonyms of the same branch are ONE
  branch, written once.
- The pointer's WORDING decides how often it triggers, not the file it points to.
  Front-load the leading word ("Renaming anything? Load cascade-checks.md" beats
  "cascade-checks.md contains guidance about renames").
- A weak pointer is a variance bug: sharpen the wording first; inline the content only
  if sharpening fails.

## Information hierarchy

Three tiers, cheapest first:
1. In-file step — every branch needs it; it lives in the skill body.
2. In-file reference — consulted on demand; a section further down.
3. Disclosed reference — separate file behind a pointer; only some branches reach it.
Inline what every branch needs; push behind a pointer what only some branches reach.
Progressive disclosure protects the hierarchy — it is not just token savings.

## Co-location

Keep a concept's definition, rules, and caveats under one heading, so reading any part
brings the neighbours. Scattered rules get half-read.

## Wording

- Prompt the positive: state the target behavior, not its negation ("ask the developer"
  beats "don't guess"). A negation is a weak modifier the activated concept overruns.
- A word too weak to beat the default is a no-op ("be thorough" → "relentless"). Fix the
  word, not the sentence count.
- Completion criteria must be checkable and exhaustive — the agent can tell from its own
  trace whether it is done ("frontier is empty", not "when sufficiently explored").

## Pruning

- Single source of truth: meaning lives in one place; everything else points at it.
- The environment (config files, generated maps, `harness state`) is a source of truth
  too — cache it in prose only when the lookup is expensive.
- Hunt no-ops sentence by sentence: any line that changes no behavior is context load
  with no return. Mind the doctor budgets (`manifest.json#doctor.budgets`).
