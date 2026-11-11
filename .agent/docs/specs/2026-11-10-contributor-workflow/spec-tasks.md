---
status: draft
spec_id: 2026-11-10-contributor-workflow
touches:
  - ".agent/docs/specs/2026-11-06-public-presence/public-copy.md"
  - ".agent/docs/standards/docs/voice-and-wording.md"
  - ".agent/docs/product/launch-coordination.md"
  - "scripts/check-pr-title.mjs"
  - "scripts/check-pr-title.test.mjs"
  - ".github/workflows/ci.yml"
  - ".github/workflows/pr-checks.yml"
  - ".github/workflows/labeler.yml"
  - ".github/labeler.yml"
  - ".github/labels.yml"
  - ".github/ISSUE_TEMPLATE/config.yml"
  - "apps/docs/src/content/docs/dev/*.mdx"
  - "apps/docs/src/content/docs/roadmap.md"
  - "apps/docs/src/content/docs/guides/auth.mdx"
  - "CONTRIBUTING.md"
  - ".github/PULL_REQUEST_TEMPLATE.md"
  - "SECURITY.md"
  - "CODE_OF_CONDUCT.md"
  - ".agent/skills/github-review/**"
  - ".agent/docs/github/**"
  - ".agent/docs/harness-guide.md"
  - ".agent/docs/harness-changelog.md"
  - ".agent/docs/tasks.md"
prompt_version: 1
---

# 2026-11-10-contributor-workflow — Tasks

Session **CW** on the coordination board. Every group is `[agent]` except Step 8 (repo settings,
`[dev]`). No git writes, no dev servers (board rules 6–8). Step 3 holds the `.github/workflows/*`
lock.

## Step 1 — Wording sources: public-copy, VW entries, board registration [agent]
Why: VW-001 — a public string changes in `public-copy.md` first, then on every surface. The PR
response line and the roadmap line are new/changed public strings; the voice ruling (VW-005) and
the feature-routing rule are developer rulings that become VW entries before any copy is written.
Verify:
- [ ] `public-copy.md` has § Pull request response window, the roadmap line without the 👍 clause,
      and no `planned` issues table
- [ ] VW-015 and VW-016 appended; nothing above them edited
- [ ] Board: CW in the session table, a CW section with rows CW-1…CW-9, a Log line

## Step 2 — PR title check script [agent]
Why: the title becomes the squash commit, so it must be `type(scope): description`; a small
in-repo script (no third-party action) keeps the rule testable and runnable by hand.
Verify:
- [ ] `node --test scripts/check-pr-title.test.mjs` passes
- [ ] `node scripts/check-pr-title.mjs "Show a toast when media upload fails"` exits 1 with an
      `::error` line; with `"fix(react): show a toast when a media upload fails"` exits 0

## Step 3 — Workflows: CI on dev, PR checks, labeler [agent]
Why: contributor PRs target `dev`, where `ci.yml` never runs today; fork PRs opened against
`master` need a visible "retarget to dev"; `area:`/`adapter:` labels come from paths.
Verify:
- [ ] `actionlint .github/workflows/*.yml` clean
- [ ] `ci.yml` triggers on PRs into `dev` and `master`; the fork-build comment names the
      dev → master PR as the full build
- [ ] `labeler.yml` runs on `pull_request_target` into `dev` with no checkout step
- [ ] Lock taken and released

## Step 4 — Labels and the issue chooser [agent]
Why: features move to Discussions (`accepted` label marks a takeable idea); the roadmap labels
and `type: feature` go; the chooser's Ideas line still promises "a tracked issue" and has no
link to CONTRIBUTING.
Verify:
- [ ] `labels.yml` parses; `accepted` present; `type: feature`, `planned`, `roadmap: p0–p2` gone
- [ ] `node scripts/sync-labels.mjs --check` reports exactly the expected drift (the 5 removed
      labels, `accepted` missing, Dependabot's `javascript`) — the live sync is Step 8
- [ ] `config.yml` parses; 4 contact links

## Step 5 — Docs Development pages and the roadmap [agent]
Why: with `.agent/` leaving the repo, the docs become the public source of how-to and coding
rules; `naming-conventions.mdx`, `adding-a-field-type.mdx` and `guides/auth.mdx` point at
`.agent/` files and `harness struct --check` that contributors won't have; the roadmap links
issues that are being deleted.
Verify:
- [ ] `dev/contributing.mdx` and `dev/testing-and-code-style.mdx` exist, sidebar order 1 and 2
- [ ] `rg -n "\.agent|harness " apps/docs/src/content/docs --glob '!api/**'` returns nothing
- [ ] `rg -n "planned. issue|linked issue" apps/docs/src/content/docs/roadmap.md` returns nothing
- [ ] `pnpm --filter docs build` green; both new pages in `dist/` and in `llms-full.txt`
- [ ] Every command on the new pages was run once on this tree (Verification lists them)

## Step 6 — CONTRIBUTING, PR template, SECURITY, CODE_OF_CONDUCT [agent]
Why: the GitHub-facing policy — base branch, issue/idea first, plan for big changes, title,
changeset, verification bar, AI, review times, stale handling, licensing — in first person;
SECURITY's "We'll" and the Covenant's leftover editing note fixed.
Verify:
- [ ] `pnpm exec prettier --check CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md`
- [ ] `rg -n "NOTE: The remedies|We'll|tracked issue" CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github` returns nothing
- [ ] The PR response line is byte-identical to `public-copy.md`'s
- [ ] Every link in CONTRIBUTING resolves (docs links after the docs deploy)

## Step 7 — github-review skill and ledger [agent]
Why: the developer reviews contributor PRs, issues and Discussions by hand today with no record
of what was reviewed; a ledger lets each run cover only items with outside activity since their
last review, and flag stale PRs by the CONTRIBUTING clock.
Verify:
- [ ] `node --test .agent/skills/github-review/scripts/ledger.test.mjs` passes
- [ ] `node .agent/skills/github-review/scripts/ledger.mjs pending` against the live repo prints
      valid JSON (open items with outside activity only)
- [ ] `harness sync` run; the skill appears under `.omp/skills/github-review/`; `harness doctor`
      shows no new errors

## Step 8 — Repo settings [dev]
Why: branch rules, squash message and the live label sync are GitHub settings only the
developer can change; queued in § Human queue.
Verify:
- [ ] `dev` ruleset: required check `CI`, not strict, admin bypass
- [ ] `master` ruleset active: required `CI`, `axe`, `lighthouse`, not strict (closes QP-10)
- [ ] Squash merge default message = pull request title and description
- [ ] After the feature issues are deleted: `sync-labels --prune`, then `--check` prints `no drift`

## Step 9 — Bookkeeping [agent]
Why: board, tasks, harness changelog and the cross-spec heads-up (LK's posts link `planned`
issues) must reflect what shipped.
Verify:
- [ ] Board rows CW-1…7, 9 `done`, CW-8 `human`; Log line; LK heads-up in § Log
- [ ] `harness tasks` entry moved to done; session log appended; commit message in the ledger
