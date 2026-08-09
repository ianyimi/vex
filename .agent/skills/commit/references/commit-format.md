# Commit Message Format

The authoritative guide for writing commit messages in this project. `harness log commit-msg`
emits a terse first draft; ALWAYS rewrite it into this format before finishing.

## Title

`type(scope): description` — ≤ 72 chars, lowercase description, no trailing period.

- **scope** = the affected area or workspace package (`admin`, `api`, `pagination`, `core`,
  `react`, `docs`, `theme`, …). Omit only when nothing fits.

### Types — pick the one matching the PRIMARY change

| Type | Use when |
|------|----------|
| `feat` | Ships a new capability or new public API surface (a new export, option, component, or user-visible feature). New exports that bump a package minor are `feat`. |
| `fix` | Corrects a bug or wrong behavior/type (e.g. a type that was wrongly optional). |
| `refactor` | Restructures code without changing behavior or public API. |
| `perf` | A change made specifically to improve performance. |
| `docs` | **Documentation ONLY — no source code changes.** If any package `src/**` changed, it is NOT `docs:`. |
| `test` | Adds or changes tests only. |
| `chore` | Tooling, config, scaffolding, deps, harness/CI — no product code behavior change. |

### Choosing the type for a mixed change

- **Prefer splitting** into separate commits, one type each (e.g. `chore:` harness setup,
  `feat(docs):` the API reference, `fix(core):` the type bug). This is the cleanest option.
- If committing as one, title with the type of the **primary/headline** change and cover the
  rest as body groups. A commit that ships code is never `docs:` even if docs are the theme —
  use `feat`/`fix`/`chore` as appropriate.

## Body — rich prose, never a file list

Explain what changed AND why, naming the concrete symbols/APIs/files and the mechanism. The
diff already lists files; the message says why. Two shapes:

- **Multi-concern commit → bold-headed paragraphs**, one per concern, each with a short bold
  lead-in and a full explanatory paragraph:

      **Media admin parity.** MediaCollectionListView was rewritten to use usePaginatedQuery
      and the shared DataTable, giving it cursor pagination and bulk delete …

- **Single-concern commit → explanatory paragraphs or full-sentence bullets**, each a complete
  thought stating the change and its rationale (not a fragment).

## Breaking changes

When callers must migrate, add a `Breaking changes:` section with one bullet per break, showing
old → new call shape.

## Footer — ALWAYS both lines, trailing the body

    Spec: <path to the driving spec, or: none>
    Log: <path to today's session-log entry, or the ideaLog; or: none>

`Spec: none` for ad-hoc work with no spec. `Log:` points to
`.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.log.md`.

## Where the message is stored (and its shape)

- **`.agent/docs/commits/MM-DD-YYYY.md` — the day's ledger — holds the FULL message** the
  developer copies from. One `## HH:MM` section per commit. **Write it as plain Markdown — do
  NOT wrap the message in a ``` code block.** (`harness log commit-msg` fences it by default;
  remove the fence.)
- **`.agent/docs/session-log/.../YYYY-MM-DD.commit.md`** — the raw machine source fed to
  `git commit -F` in agent-commits mode. Plain text, same content, no fence.
- **The session log entry does NOT duplicate the message.** The log already carries the
  session's ideas/decisions (write them there if missing). After the decisions, leave a single
  link to the commit ledger — it marks "everything up to this point was committed to source":

      _Committed → [feat(docs): generate multi-package TypeDoc API reference](../../commits/MM-DD-YYYY.md)_

## Example

    feat(api): add pagination and bulk operations to find, search, and remove

    Adds native Convex pagination to `find` and `search` via an optional `paginationOpts`
    argument. When provided they return `{ page, continueCursor, isDone }` instead of a plain
    array, enabling cursor-based navigation over large datasets without loading everything.

    Refactors `remove` to support bulk + soft delete: `id` becomes an `ids` array, and an
    optional `softDelete` field name sets that field to `true` instead of deleting.

    Breaking changes:
    - `remove({ ctx, id })` → `remove({ ctx, ids: [id] })`

    Spec: .agent/docs/specs/2026-07-12-pagination/spec.md
    Log: .agent/docs/session-log/2026/07/2026-07-21.log.md
