# Dev-Spec Interview — Question Phases

Run the phases in order. Within each phase, batch questions with the frontier protocol.
Close each phase by restating the answers; close the interview with a confirmed summary.

## Frontier protocol

The phase's open points form a tree of decisions; some depend on others. Each round:

1. **Split every open point: fact or decision.**
   - *Fact* — a tool call could settle it with certainty (does a helper already exist?
     what does `harness state` say? which plugin manager is configured?). Facts are YOUR
     job: look them up, or dispatch a subagent while the developer answers decisions.
     Never ask the developer for anything you could look up yourself.
   - *Decision* — two reasonable developers would answer differently (preference,
     tradeoff, intent). Decisions ALWAYS go to the developer, never inferred.
   - Unsure which side? It's a decision — ask. A wasted question costs seconds; a
     wrongly inferred decision costs a rebuilt spec.
2. **Ask the whole frontier at once** — every decision whose prerequisites are settled
   goes in one numbered batch (structured question tool if available, else a numbered
   list), each question carrying a recommended answer the developer can veto in a word.
   A question whose answer depends on another question still open in this round belongs
   to a later round, not this one.
3. **Report the facts that shaped the batch** as statements above it ("Found: chezmoi
   templates already gate on `.chezmoidata`, so Q2 assumes that mechanism") so a wrong
   fact can be corrected before it warps a decision.

A phase is done when its frontier is empty — nothing left silently assumed.

## Phase 1 — Intent

- What is being built, in one sentence?
- Who or what consumes it (user-facing UI, another package, a CLI, an agent)?
- What breaks or is missing today that this fixes?

## Phase 2 — Shape

- New module, or extension of existing code? Which paths?
- Inputs and outputs (function signatures, API routes, UI surface)?
- Any data/schema changes (tables, fields, migrations)?
- Candidate `touches` globs for the spec frontmatter.

## Phase 3 — Constraints + Scope

- Hard requirements: performance, compatibility, platform, security?
- What is explicitly OUT of scope (name the adjacent features that could creep in)?
- How does the developer verify done (commands, visible behavior)?
- Tier check: high-care (developer implements — spec is guided stubs) or low-care
  (agent implements — spec is full code)? Confirm against manifest workflow.default_tier.

## Closing

Restate: intent, shape, in-scope list, out-of-scope list, verification, tier.
Get an explicit confirmation before writing anything.
