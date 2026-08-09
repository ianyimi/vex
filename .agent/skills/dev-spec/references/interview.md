# Dev-Spec Interview — Question Phases

Run the phases in order. Ask only what exploration could not answer. Close each phase by
restating the answers; close the interview with a confirmed summary.

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
