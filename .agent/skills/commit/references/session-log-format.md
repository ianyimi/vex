# Session Log Format

## The file
`.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.log.md` — an append-only diary. One file per day,
one `##` entry per work block. Created/extended only via `harness log append`. The single
permitted in-place edit is `harness log backfill-sha` filling `**Commit:** (pending)`.

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

## Commit message + where it lands

The full commit-message format (title types, body shapes, footer, storage) lives in
`references/commit-format.md` — follow it. In short:

- The FULL message goes in the day's ledger `.agent/docs/commits/MM-DD-YYYY.md` as plain
  Markdown (no ``` code fence), plus the raw `.commit.md` for `git commit -F`.
- The session-log entry is NOT a copy of the message. It holds the session's decisions; after
  them, leave one link to the ledger as the "committed up to here" marker:
  `_Committed → [<commit title>](../../commits/MM-DD-YYYY.md)_`.
