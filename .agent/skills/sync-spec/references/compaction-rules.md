# Compaction Rules — preferences.md Lifecycle

## Entry grammar (D02-3)

`- P-NNN (YYYY-MM-DD) <text>` with optional ` [supersedes P-MMM]`.
Ids are monotonic (highest + 1), never reused, never renumbered.

## What `harness pref compact` does, in order

1. **Supersedes** — drops every entry another entry supersedes; strips the applied
   `[supersedes …]` tag from the survivor.
2. **Duplicates** — merges exact-duplicate text, keeping the lowest id.
3. **Budget** — drops the oldest-dated entries (tie → lowest id) until the file is within
   the manifest budget. Newest rules survive.

Never hand-compact — run the command. Removals are recoverable via git history; that plus
`harness pref remove <id>` is the rollback story.

## Anti-patterns are exempt

`anti-patterns.md` is append-only and NEVER compacted — over-budget there is a signal for
human review, not a compaction target. Real corrections must not silently decay.
