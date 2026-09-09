---
applies_to: ["packages/*/vitest.config.ts"]
---
# Coverage Policy

## The exclusion criterion

`coverage.exclude` in a package's `vitest.config.ts` MAY list a file only when **all three**
hold:

1. **Vendored verbatim.** The file was installed from a named upstream (a shadcn registry
   component, a copy-pasted third-party file, etc.) and its logic is unchanged since install —
   not a fork, not a rewrite, not extended with new props/behavior.
2. **Upstream URL cited.** The `exclude` entry carries a comment with the exact upstream URL
   (a registry endpoint, a GitHub file URL) a reviewer can open to diff against. "It looks like
   shadcn" is not a citation. If the file itself carries no header comment naming its source
   (most shadcn CLI-installed primitives don't), the citation may instead point at the
   project's own registry declaration (e.g. `components.json`'s `registries` map) plus
   `git log --follow -p` confirming no post-install logic commit — that combination is
   accepted evidence of provenance, not just a header grep.
3. **No hand-modification.** The moment anyone edits the file's behavior — adds a prop, changes
   a class, fixes a bug locally instead of upstream — it returns to the coverage denominator on
   that same commit. A vendored file earns untested-by-default status only as long as it stays
   byte-for-byte swappable with its upstream source; once it diverges, its now-local logic is
   this codebase's responsibility to test like anything else. This applies even when the
   diverged file is fully covered already — cheap coverage is not a reason to keep a
   hand-modified file off the denominator.

This is deliberately narrow. It exists to stop `pnpm coverage` from grading this package on
code nobody here wrote or can meaningfully unit-test in isolation (a vendored dropdown's
internal keyboard-nav state machine, a third-party date picker's timezone math) — not to give
any file with an external-sounding origin a free pass.

## Why this exists

`packages/react` ships two kinds of files that pull the statement-coverage percentage down
without anyone here being able to raise it responsibly:

- **shadcn CLI registry primitives** (`src/components/ui/*.tsx`) installed from this repo's
  private registry, declared in `components.json` (`registries.@wds`:
  `https://wds-shadcn-registry.netlify.app/r/{name}.json`) — thin styling wrappers around
  `@base-ui/react` primitives. Testing them re-tests Base UI's own interaction/accessibility
  logic, not anything this package authored.
- **`src/components/ui/datetime/**`**, vendored from
  `https://github.com/huybuidac/shadcn-datetime-picker` (cited in each file's own header
  comment) — a large (585-statement) third-party date/time picker copied in wholesale.

Excluding them is not "coverage theater": it moves the 80% statements gate onto code this team
actually owns and can be asked to test, and it keeps the gate from silently loosening every
time someone vendors another large dependency.

## What is explicitly NOT covered by this exclusion

- `src/components/ui/data-table/**` and `src/components/ui/dnd/**` — in-house code built on top
  of vendored primitives, not vendored themselves.
- `ThemeProvider.tsx`, `ThemeToggle.tsx`, `ThemeScript.tsx`, `VexLink.tsx`, `VexImage.tsx`,
  `multi-select.tsx`, `accordion.tsx` — hand-written from scratch in this repo.
- `button.tsx` and `input.tsx` — both are `@wds`-registry primitives structurally, but each
  received a post-vendor feature commit (`isPending`/icon-slot props, a `Loader2` spinner wired
  to this package's `Icon` component). They stay in the coverage denominator. Any other
  `ui/*.tsx` primitive that receives similar local feature work MUST be removed from
  `coverage.exclude` in the same commit.

## Measured baseline

Before this policy's exclusions, `packages/react` measured **50.13% statements, 2679 total
statements, 917/918 tests passing**. Excluding the 21 verbatim shadcn/Base UI primitive files
(205 statements) and `ui/datetime/**` (585 statements) removes 790 statements nobody here can
meaningfully raise coverage on. The measured post-exclusion denominator at the commit that
introduced this policy is **1891 statements, 1102 covered — 58.27%** (the spec authored against
1889/1101/58.28%; the two-statement drift is the field required/a11y commit that landed
between authoring and implementation). The package's 80% statements gate is measured against
this post-exclusion denominator; it needs +411 of the 789 statements still uncovered in
first-party code, not +1583 of the unfiltered 2679.

## Adding a new exclusion

1. Confirm the file is untouched since vendoring (`git log --follow -p -- <file>` shows only
   the initial vendor commit, or every subsequent commit is a repo-wide mechanical change —
   formatting, a dependency bump — not new props or logic).
2. Add the file to `coverage.exclude` in the package's `vitest.config.ts`, with a trailing
   comment citing the upstream URL (or the registry-declaration + commit-history evidence
   described above, if the file itself carries no header citation).
3. Update this file's "Measured baseline" section with the new statement counts (`pnpm --filter
   <pkg> exec vitest run --coverage --coverage.reporter=json-summary` then read
   `coverage/coverage-summary.json`'s `total.statements`).

## Removing an exclusion

The moment a listed file is edited for anything beyond a mechanical/formatting change, delete
its line from `coverage.exclude` in the same commit and update the baseline here — regardless
of how well-covered the diverged file already is. Do not wait for a coverage-policy review to
catch it.

## `scripts/record-test-findings.mjs`'s spec default

That script's `FINDINGS_PATH` resolves against `--spec <slug>` / `VEX_FINDINGS_SPEC`,
defaulting to the spec that most recently bumped the default constant
(`DEFAULT_FINDINGS_SPEC` in the script). It refuses to run — non-zero exit, no directory
created — if the resolved spec's directory doesn't already exist under
`.agent/docs/specs/`, so a stale default after a new spec ships fails loudly instead of
silently writing findings into the wrong spec's `findings.md`. When starting a new spec that
uses this script: bump `DEFAULT_FINDINGS_SPEC` to the new slug in the same commit that adds
the new spec's directory, and every bare invocation keeps working; anything targeting a
different spec passes `--spec <slug>` explicitly.
