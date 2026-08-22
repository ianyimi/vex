# Session Log Format

## The file
`.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.log.md` — an append-only diary. One file per day,
one `##` entry per work block. Created/extended only via `harness log append`. Three permitted
in-place edits, nothing else:
- `harness log backfill-sha` filling `**Commit:** (pending)`.
- The ledger link `harness log commit-msg` appends as the "committed up to here" marker.
- Entry-title renames by the commit skill (its "Name sessions after the commit" step):
  titles only, bodies never.

## Entry structure (`harness log append` emits this skeleton)

    ## 2026-08-02 — 14:23 — filter panel wiring

    **Spec:** docs/specs/2026-07-12-collections-ui/spec.md (Step 4)
    **Commit:** (pending)

    ### What was built
    - `FilterPanel.tsx` — filter panel wired to TanStack Table

    ### Decisions made
    - Used nuqs instead of useState — URL-shareable filters matter here. Not in the spec;
      low-risk addition.

    ### Problems hit
    - nuqs `parseAsArrayOf` not exported in v2 — used `parseAsJson`. Library quirk, not our bug.

    ### Where I left off
    Empty state test failing: fix the test selector, not the component. Resume there.

## Field rules
- **Spec:** path (+ step) of the driving spec, or `(none)` for ad-hoc work.
- **Commit:** stays `(pending)` until the commit exists; `backfill-sha` fills it
  (automatic in agent-commits mode; message-only leaves it for the next session).
- Bullets state *why*, not just what. Problems record the resolution, not only the pain.
- "Where I left off" is for a cold-start reader: current state, next step, watch-outs.
- **Entry title:** starts as a short work-block description ("session" when auto-created).
  At commit time the commit skill renames it to the commit title; a session serving several
  specs accumulates comma-separated commit titles. This maps sessions to commits, so work
  can be resumed by name (`/resume-session <commit title>`). Never shorten or remove an
  existing name. A bare name is version 1; only a developer-requested rework appends
  ` v2`, ` v3`, … (resume-session handles the bump).

## Commit message + where it lands

The full commit-message format (title types, body shapes, footer, storage) lives in
`references/commit-format.md` — follow it. In short:

- The FULL message goes in the day's ledger `.agent/docs/commits/MM-DD-YYYY.md` as plain
  Markdown (no ``` code fence), plus the raw `.commit.md` for `git commit -F`.
- The session-log entry is NOT a copy of the message. It holds the session's decisions; after
  them, leave one link to the ledger as the "committed up to here" marker:
  `_Committed → [<commit title>](../../commits/MM-DD-YYYY.md)_`.
