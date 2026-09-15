# Commit Message Format

Convention: [Conventional Commits](https://www.conventionalcommits.org/) (qoomon cheatsheet).
`harness log commit-msg` emits a terse first draft; ALWAYS rewrite it into this format.

    type(scope): description      ← subject
    <blank line>
    body                          ← optional, why + contrast with previous behavior
    <blank line>
    footer                        ← Spec/Log always; issues + BREAKING CHANGE when relevant

## Type — everyday set (keep it small)

Reach for these four first:

- **feat** — adds/adjusts/removes a feature or public API surface (new export, option,
  component, user-visible behavior). New API → bumps a package minor.
- **fix** — corrects a bug or wrong behavior/type.
- **refactor** — restructures code without changing behavior or public API.
- **chore** — tooling, config, deps, scaffolding, harness/CI — no product behavior change.

Also valid when they fit precisely (from the cheatsheet): `docs` (documentation **only** — no
`src/**` change), `test` (tests only), `perf` (a refactor specifically for performance),
`style` (formatting/whitespace), `build` (build tooling/deps/version), `ops` (infra/CI/CD).

Mixed change? Prefer **splitting** into one commit per type. If shipping as one, title with the
**primary** change's type and cover the rest as body groups. A commit that changes `src/**` is
never `docs`.

## Subject rules

- `scope` is optional, project-defined (`api`, `core`, `react`, `admin`, `docs`, …); no issue ids.
- description: **imperative present** ("add", not "added"/"adds"), **no capital first letter**,
  **no trailing period**, ≤ 72 chars total.
- Breaking change → put `!` before the colon: `feat(api)!: remove status endpoint`.

## Body — rich prose, never a file list

Explain the motivation and contrast with previous behavior, naming concrete symbols/APIs. The
diff already lists files. Two shapes:
- **Multi-concern → bold-headed paragraphs**, one per concern (`**Media admin parity.** …`).
- **Single-concern → paragraphs or full-sentence bullets**, each a complete thought.

## Footer

- **Breaking changes** (if any): a line starting exactly `BREAKING CHANGE: <what + migration>`
  (or two newlines after `BREAKING CHANGE:` for a multi-line description). Pair with the `!`
  subject indicator.
- Issue refs when relevant: `Closes #123`, `Fixes JIRA-456`.
- **Project overlay — ALWAYS these two lines, last:**

      Spec: <path to driving spec, or: none>
      Log: <path to today's session-log entry, or: none>

## Versioning tie-in (changesets)

**While `.changeset/pre.json` is in `pre` mode (the current `alpha` track): every changeset is
`patch`, including breaking ones.** Changesets does NOT apply the "0.x major means minor"
convention — a `major` on `0.1.0-alpha.17` resolves the base to `1.0.0` and ships
`1.0.0-alpha.18`, and it propagates through dependency bumps to packages the commit never
touched. `minor` gives `0.2.0-alpha.18`. Only `patch` keeps the base at `0.1.0`, so the alpha
counter advances and `changeset pre exit` still lands on `0.1.0`. Verify with
`pnpm changeset status --verbose`, which prints the resulting version per package — run it
whenever a changeset is added instead of inferring the bump from the commit type. The `!` in
the subject and the `BREAKING CHANGE:` footer still describe the change honestly; the bump is
a release-track mechanic, not a statement of severity.

**After 0.1.0 the shift stays** (P-025): `patch` carries what semver calls a minor, `minor`
carries what semver calls a major (breaking), and `major` is NEVER used without an explicit
developer decision — the project intends to stay on `v0.x` as long as possible. So the bump
never follows from the `!` in the subject; pick `patch` unless the change is breaking, and
`minor` when it is.

## Storage & where it lands

- **`.agent/docs/commits/MM-DD-YYYY.md` (ledger) holds the FULL message(s)** to copy from —
  plain Markdown, **no ``` code fence** (strip the one `harness log commit-msg` adds). One
  `## HH:MM — <commit title>` section per commit, in commit order, each with its raw-file
  path and a copy-pasteable `git add … && git commit -F …` block naming that commit's exact
  files.
- **`.agent/docs/session-log/.../YYYY-MM-DD.commit.md`** — raw source for `git commit -F`.
  A day with several commits numbers the rest `YYYY-MM-DD.commit.2.md`, `.commit.3.md`, …
  in commit order. `harness log commit-msg` only ever writes the first; the others are
  written by hand.
- **One day, several commits.** Split when concerns are independent (see "Mixed change?"
  above). File lists across commits MUST be disjoint and MUST cover every path in
  `git status`. Harness bookkeeping — session log, ledger, standards, `state.md`,
  `tasks.md`, `.sync-manifest.json` — rides the LAST commit; it spans the whole run.
- **The session-log entry never duplicates the message.** It carries that session's
  decisions (add them if missing); after them, leave one link to the ledger as the
  "committed up to here" marker: `_Committed → [<subject>](../../../commits/MM-DD-YYYY.md)_`.

## Examples

    feat(api): add pagination and bulk operations to find and remove

    Add optional `paginationOpts` to `find`/`search`; when present they return
    `{ page, continueCursor, isDone }` instead of a plain array. Refactor `remove` to take an
    `ids` array with an optional `softDelete` field name.

    BREAKING CHANGE: remove({ ctx, id }) becomes remove({ ctx, ids: [id] }).

    Spec: .agent/docs/specs/2026-07-12-pagination/spec.md
    Log: .agent/docs/session-log/2026/07/2026-07-21.log.md

    ---

    fix(core): make resolved relationship admin config extend the resolved base

    RelationshipFieldAdminConfig extended the input base, so resolved admin props were wrongly
    optional and TypeDoc saw duplicate declarations. Extend FieldAdminConfig instead.

    Spec: none
    Log: .agent/docs/session-log/2026/08/2026-08-04.log.md
