# vexcms — Agent Context

## Agent Directives

These apply to all agents, all platforms, always.

**Route by intent.** Classify what the user needs (debug / spec / implement /
commit / general) and load the appropriate skill from `.agent/skills/`.
**Ask before large actions.** Ambiguous multi-file requests get one clarifying
question first.
**Surface cascade impacts before writing.** Show the complete downstream change
set for approval before applying any of it.
**Doctor first.** On session start, run `harness doctor`. Fix errors before work.
**Write knowledge to the graph.** Corrections → anti-patterns.md. Patterns →
preferences.md. Naming → naming-conventions.md. Decisions → decisions/.
Sessions → session-log/.
**Advisor active?** (OMP harness-keeper) Focus on the developer's problem; act on the
advisor's harness change-sets instead of self-tracking requirement shifts mid-task.
**Subagents:** honor `manifest.json#models` — dynamic selection = cheapest adequate tier.

## Pointers

- Harness guide (read before editing `.agent/`): `.agent/docs/harness-guide.md`
- Mission: `.agent/docs/product/mission.md`
- Tech stack: `.agent/docs/product/tech-stack.md`
- Dev processes: `.agent/docs/product/dev-processes.md`
- Standards: `.agent/docs/standards/`
- Current state: run `harness state`
