---
name: summary-prompt
description: Compress the current conversation into a portable handoff prompt so the session
  can continue in ANOTHER agent with different context. Triggers on "/summary-prompt",
  "summarize this session for another agent", "hand this off". Like compaction, but the output
  is a prompt written TO the receiving agent, not a memory for this one.
harness_model_role: smol
---

# Summary Prompt

## Preflight
1. Run `harness state` and read the output (ground truth beats conversational memory).

## Steps

1. **Distill the session** into these sections, in order — ruthlessly succinct, no narration
   of the conversation's twists, only what the NEXT agent needs:
   - `# Handoff — <project>: <one-line goal>`
   - `## Context` — what this project is (2–3 lines) + pointer: "run `harness state`, read
     `.agent/docs/harness-guide.md` and `.agent/AGENTS.md` before anything else"
   - `## What was being worked on` — the task, the spec slug if any, current progress
     (which task groups done, from `harness implement <slug> status`)
   - `## Decisions + constraints from this session` — every ruling the developer made, each
     one line, quoted where the wording matters (absolutes especially)
   - `## Current state` — files touched (from `git status`), what works, what is broken/failing
   - `## Next steps` — ordered, imperative, starting with the very next action
   - `## Open questions` — anything awaiting the developer's answer
   - `## Do not` — session-specific prohibitions the receiving agent must respect
2. **Address the receiving agent directly** — imperative voice ("Read X. Then do Y."), zero
   references to "the previous conversation"; every fact must stand alone or cite a file path.
   **Reference, never copy**: specs, ADRs, commits, diffs, and log entries are cited by path
   or hash — inline content only when the receiving agent cannot reach the file (and say so).
3. **Save it** to `.agent/docs/session-log/YYYY/MM/<date>.handoff.md` (same dating as the
   session log; overwrite an earlier handoff from the same day — it is a snapshot, not a diary).
4. **Print the full prompt** in a single fenced block for copy-paste, followed by the saved
   path. Nothing else — the block IS the deliverable.
