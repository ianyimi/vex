---
name: JSDoc documentation patterns
description: Rules for writing JSDoc across all packages — interface docs, field docs, defaults blocks, examples
type: feedback
---

Always follow these patterns when writing JSDoc for any type, interface, function, or field in this repo.

**Why:** The user wants JSDoc to serve as the primary developer docs — readable in the IDE and rendered by starlight-typedoc into the docs site. Comments must be accurate enough to replace looking at external docs.

**How to apply:** Apply to every exported symbol. Use the /document command pattern as the canonical reference.

### Input types vs resolved types

Every config type exists in two forms — document them differently:

- **`*Input` types** (user-facing) — full treatment: detailed summary, defaults block with inline comments, `@example` with realistic usage, `@see` references. This is what developers write, so it needs the most detail.
- **Resolved types** (internal, after defaults applied) — short treatment: one-sentence summary, one-line property docs, `@see` pointing back to the input type. No examples, no defaults block.

### Interface / type JSDoc structure
1. One-sentence summary — what it is, when a dev encounters it
2. **Defaults block** (only for `*Input` types) — show the full resolved default object; every property gets an inline `//` comment explaining what *that value* means in practice, not just restating the key name
3. `@example` — 1–2 examples as a guideline; complex features may warrant more. Most fields need only a single minimal example. Skip entirely if self-evident. Use judgement — if behaviour is non-obvious, add examples until it's clear.
4. `@see` references to the resolved type, config function, related types

### Individual field JSDoc rules
- One sentence max for simple fields
- For union types, explain what each value does in plain English — never just list them
- Always informed by the parent interface context (what does this field control *in practice*)
- Never nest into sub-type explanations — trust that the sub-type has its own docs
- Skip docs that restate the type signature in prose ("label is a string")
- Skip docs for properties that are obvious from name alone

### Example quality rules
- Examples must be realistic for the field type — never use a `text()` field for something that would obviously be a `select()` or `number()` in practice
- Status fields → select, counts → number, names/titles/slugs/URLs → text
- Label each example with a short `//` comment

### Function JSDoc structure
- Summary sentence
- `@param` for every non-obvious parameter
- `@returns` describing the output
- `@example` with at least one realistic call
