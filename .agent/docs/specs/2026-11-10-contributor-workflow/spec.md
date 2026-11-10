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

# 2026-11-10-contributor-workflow — Spec

## Overview

Outside contributors started sending pull requests (#67, #68, #71 from jay23606; #70 spam). They
targeted `master`, so the developer merged them there and rebased `dev` afterwards. They also
couldn't get the `axe`/`lighthouse` checks, which never run on fork PRs. This spec settles the
contributor workflow and writes it down: PRs go to `dev`; bugs start from an issue; features start
from an accepted Ideas discussion; titles follow Conventional Commits and PRs are squash-merged.
It covers CI, labeler and label changes, the GitHub community files, and the docs Development
pages that replace the harness rules contributors won't see once `.agent/` leaves the repo. It
also adds a private `github-review` harness skill whose ledger tracks which PRs, issues and
Discussions were reviewed.

## Design Decisions

1. **Contributor PRs target `dev`.** Why: contributor work lands next to the developer's in-flight
   work and ships in the dev → master release PR; `dev` no longer needs a rebase after each
   contributor merge; and `axe`/`lighthouse` (which never run on fork PRs — #67/#68/#71 heads have
   only `CI` + Vercel checks, all 75 `quality` runs are from `ianyimi/vex`) can be required on
   `master` without blocking forks. GitHub's default branch stays `master`.
2. **Required checks: `CI` on `dev` and `master`; `axe` + `lighthouse` on `master`; branches need
   not be up to date.** Why: QP-10's plan for `master`, and the strict up-to-date rule is what
   produced the "Merge branch 'master' into …" churn on #67/#68/#71. The `dev` rule needs an admin
   bypass because the developer pushes to `dev` directly. Settings, so Step 8 `[dev]`.
3. **Fork PRs against `master` fail a `Base branch` check with a "retarget to dev" message.**
   Why: it needs no write token (a `pull_request` run from a fork has a read-only one), unlike a
   bot comment; it lives in a new `pr-checks.yml` that also runs on `edited`, so retargeting
   re-runs it. `ci.yml` keeps its default trigger types, because adding `edited` there would
   re-run the full build on every description edit.
4. **PR titles are `type(scope)!: description`, checked by `scripts/check-pr-title.mjs`; commits
   inside a PR are free-form; contributor PRs are squash-merged.** Why: the developer's own titles
   already follow Conventional Commits (`commit-format.md`); squash makes the title the one
   commit. Types allowed: the commit-format set plus `ci` (Dependabot and the developer use
   `ci(...)`). No length or case rule, because the developer's own #75 title is longer than 72
   characters and scopes like `create-vexcms` are fine as-is.
5. **`Fixes #N` still closes the issue, at release time.** Why: closing keywords in a PR body only
   act when the PR targets the default branch (GitHub docs, "Linking a pull request to an issue").
   But a keyword in a *commit message* closes the issue once that commit reaches the default
   branch. With the squash message set to "pull request title and description" (Step 8), the
   squash commit carries `Fixes #N`, and the issue closes when `dev` merges into `master`.
6. **Changesets: the contributor adds a `patch` changeset for any change to a published package's
   behavior or types, breaking ones included, with **Breaking:** and migration text; the
   developer sets the final bump.** Why: P-025 (pre mode: patch only; after 0.1.0 the shifted
   scale is the developer's call). #67/#68/#71 already did this. Docs-only and `apps/*`-only
   changes need none. Not CI-enforced (developer's choice).
7. **Issues are for broken things. A bug PR links a bug issue, claimed by a comment; a
   `good first issue` is assigned before work starts. A feature PR links an Ideas discussion
   labeled `accepted`. Typo and broken-link fixes are exempt.** Why: the developer wants the issue
   list limited to bugs, with features ranked by 👍 in Discussions; assignment stops drive-by
   PRs like #70 on #56.
8. **Big changes need a written plan in the Discussion, approved before code.** "Big" means it
   changes a public API, touches more than one package, adds a field type, or adds a dependency.
   Why: the developer chose a Discussion RFC over issue comments or design docs in the PR.
9. **Roadmap items have no issues or Discussions; the 8 `planned` issues are deleted by the
   developer before launch.** This spec removes what refers to them: the docs roadmap's issue
   links and "👍 the linked issue" line, `public-copy.md`'s roadmap line and `planned` table, and
   the `planned`, `type: feature` and `roadmap: p0–p2` labels. The roadmap line becomes
   "No fixed order." with nothing after it; a pointer to Ideas would invite per-item discussions
   the developer doesn't want. LK's posts were to link the `planned` issues (LK spec decision 12),
   so a § Log heads-up goes to LK; LK's own files are not edited here.
10. **AI-assisted PRs are allowed without a disclosure line.** One bar for every line: the author
    ran what they claim, verified the change themselves (in a browser for UI), and can explain
    it. Why: developer's choice; the bar is what the #68 review enforced.
11. **No DCO, no CLA.** CONTRIBUTING says once that contributions are licensed under Apache-2.0
    (section 5 of the Apache License). Why: section 5 already grants the inbound licence; paid
    add-ons are separate packages the developer writes, so relicensing contributed code is
    never needed.
12. **Review promise: "I give every pull request a first review within a week."** It goes into
    `public-copy.md` first (VW-001) and is quoted byte for byte; re-review is also within a week.
13. **Stale PRs (manual):** after changes are requested, 30 days with no reply → `stale` label +
    comment; 14 more days → close, and it can be reopened. To take over: push to the branch, or
    open a new PR with a `Co-authored-by:` trailer. The `github-review` ledger computes both
    clocks.
14. **Path labeler:** `actions/labeler` v7.0.0 (SHA-pinned like every other action) on
    `pull_request_target` into `dev`, with no checkout. It applies the `area:`/`adapter:` labels
    that map 1:1 to a package or app. Semantic areas (`live-preview`, `versions`, `auth`,
    `storage`) stay manual. Why: `pull_request_target` is needed to write labels on fork PRs; the
    action reads its config through the API and never runs fork code.
15. **Voice: first person "I" in CONTRIBUTING, the PR template's guidance, SECURITY, and drafted
    GitHub replies** (VW-015 confirms VW-005). `public-copy.md`'s "Who builds this" line stays
    verbatim in third person. The `status:` table keeps quoting the live label descriptions
    ("a maintainer") verbatim, because they are GitHub label text.
16. **Policy in CONTRIBUTING, how-to in docs; no sentence lives in both.** CONTRIBUTING.md holds
    where things go, what a PR needs, review, stale handling, licensing, the reproduction bar and
    the `status:` table. The new `dev/contributing.mdx` holds setup, running checks, the local
    admin, changesets, the PR mechanics, the release flow and the repo map, which moves out of
    CONTRIBUTING. The new `dev/testing-and-code-style.mdx` holds the coding rules that are
    harness-only today. Mirrors: the existing dev pages (frontmatter `title` + `description`,
    `## ` sections, bash fences).
17. **Docs replace the harness as the public rule source.** `naming-conventions.mdx` says reviews
    check its rules (its rule ids already match the harness rules block 28/28) and drops the
    dead `blob/rebuild/.agent/...` links and `harness struct --check`.
    `adding-a-field-type.mdx` and `guides/auth.mdx` drop their `.agent/` paths. Not ported:
    `test-structure.md`'s package list, which is stale (`next` and `richtext-plate` have tests
    now).
18. **`github-review` is one private skill with three modes and a JSON ledger.** It lives in
    `.agent/skills/github-review/` (moves with `.agent/` to `../agents`); the ledger is
    `.agent/docs/github/ledger.json` plus one note per item in `.agent/docs/github/reviews/`.
    "New" means an open item with outside activity (author is neither the authenticated `gh`
    user nor a bot) after its last review, or a PR whose head moved. It drafts only; the
    developer posts. PR validation reads the whole diff first. It runs the change in a throwaway
    worktree under `~/tmp/vex-review/`, never in the main tree, and skips running it when the
    diff touches install/config/script/workflow files. UI changes are checked in a browser
    against the PR's vex-www preview after the developer authorizes the Vercel build. That build
    runs fork code with the project's Vercel secrets, `deploy:convex` included. Mirrors:
    `template-sync` (project skill layout, Preflight/Steps) and `scripts/sync-labels.mjs` (gh
    wrapper with exit code `2`, `node:test` colocated).
19. **The ledger script resolves the harness directory from its own real path.** It goes three
    levels up from `scripts/`, so it works whether `.agent` is a directory or the
    `../agents` symlink. Its main-module guard compares `realpathSync(process.argv[1])`, because
    Node resolves symlinks for `import.meta.url` but not for `argv`.

## Out of Scope

- Changing the default branch, `changesets` `baseBranch`, or the Release workflow.
- A changeset CI check (developer declined).
- A public naming-check script; `harness struct --check` stays harness-only.
- Deleting the `planned`/feature issues (the developer does it), and LK's launch-kit files.
- Repo settings, rulesets, and the live label sync: the human queue (Step 8).
- Moving `.agent/` out of the repo (PP-15).
- Retitling the existing dev pages to sentence case (VW-006 sweep belongs to L).
- Posting, labeling or closing anything on GitHub from the skill.
- `node --test scripts/*.test.mjs` in CI (no script tests run in CI today).

## Implementation

### Step 1 — Wording sources: public-copy, VW entries, board registration [agent]

- [ ] `.agent/docs/specs/2026-11-06-public-presence/public-copy.md`: roadmap line, `planned` table
      removed, new § Pull request response window
- [ ] `.agent/docs/standards/docs/voice-and-wording.md`: VW-015, VW-016 appended
- [ ] `.agent/docs/product/launch-coordination.md`: CW row in the session table, CW section, Log

#### .agent/docs/specs/2026-11-06-public-presence/public-copy.md

Three edits; everything not shown is unchanged.

**1 — roadmap item 2.** Replace the line beginning `2. **Free features, as demand appears**`:

```markdown
2. **Free features, as demand appears** — No fixed order.
```

**2 — delete the `### \`planned\` issues` subsection** (heading, table, and the blank line after).

**3 — new section, directly after § Who builds this:**

```markdown
## Pull request response window

I give every pull request a first review within a week.
```

#### .agent/docs/standards/docs/voice-and-wording.md

Append after VW-014:

```markdown
- VW-015 (2026-11-10) Confirms VW-005 for maintainer-voiced community copy: CONTRIBUTING.md, the PR template's guidance comments, SECURITY.md and drafted GitHub replies speak as "I"; the `public-copy.md` "Who builds this" line stays verbatim in third person, and label descriptions quoted from `.github/labels.yml` stay as written — "We'll coordinate the disclosure timeline" → "I'll coordinate the disclosure timeline" — developer ruling (contributor-workflow interview).
- VW-016 (2026-11-10) Issues are for broken things; feature ideas go to Discussions → Ideas, ranked by 👍; roadmap items carry no issue or discussion link — "👍 the linked issue to move one up" / "A 👍'd idea becomes a tracked issue" → "No fixed order." / "Feature ideas go to Discussions, where 👍 votes rank them." — developer ruling (contributor-workflow interview).
```

#### .agent/docs/product/launch-coordination.md

Three edits; rows only, per board rule 2.

**1 — session table**, after the DEP row:

```markdown
| CW      | `.agent/docs/specs/2026-11-10-contributor-workflow/`    | CW-*                  |
```

**2 — new section** after `### DEP — pre-launch dependency upgrades` and its table:

```markdown
### CW — contributor workflow

| Row  | Step                                          | Waits for | Status | Notes |
| ---- | --------------------------------------------- | --------- | ------ | ----- |
| CW-1 | Wording sources (public-copy, VW, board)      | —         | todo   |       |
| CW-2 | PR title check script                         | —         | todo   |       |
| CW-3 | Workflows: CI on dev, PR checks, labeler      | CW-2      | todo   | `.github/workflows/*` lock |
| CW-4 | Labels + issue chooser                        | CW-1      | todo   |       |
| CW-5 | Docs Development pages + roadmap              | CW-1      | todo   |       |
| CW-6 | CONTRIBUTING, PR template, SECURITY, CoC      | CW-4, CW-5 | todo  |       |
| CW-7 | github-review skill + ledger                  | —         | todo   |       |
| CW-8 | Repo settings                                 | human     | todo   | § Human queue CW-8 |
| CW-9 | Bookkeeping                                   | CW-1…8    | todo   |       |
```

**3 — § Log**, one line: `- <ISO time> CW: started (spec 2026-11-10-contributor-workflow).`

Verify: `rg -n "No fixed order|Pull request response window" .agent/docs/specs/2026-11-06-public-presence/public-copy.md`
prints both; `rg -c "planned. issues" .agent/docs/specs/2026-11-06-public-presence/public-copy.md` prints nothing.

### Step 2 — PR title check script [agent]

- [ ] `scripts/check-pr-title.mjs` created
- [ ] `scripts/check-pr-title.test.mjs` created
- [ ] `node --test scripts/check-pr-title.test.mjs`

#### scripts/check-pr-title.mjs

```js
/**
 * Checks a pull request title against the Conventional Commits shape this
 * repo squash-merges with: `type(scope)!: description`. The scope is
 * optional and may list several comma-separated lowercase names; `!` marks
 * a breaking change.
 *
 * Reads the title from `PR_TITLE` (set by `.github/workflows/pr-checks.yml`
 * from the event payload, never interpolated into the shell), or from the
 * first CLI argument when run by hand.
 *
 * Exit codes: `0` valid; `1` invalid, printing a GitHub `::error::`
 * annotation that names the expected shape; `2` no title given.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const PR_TITLE_TYPES = [
  "feat",
  "fix",
  "refactor",
  "perf",
  "test",
  "docs",
  "style",
  "chore",
  "build",
  "ci",
  "ops",
  "revert",
];

const PR_TITLE_PATTERN = new RegExp(
  `^(?:${PR_TITLE_TYPES.join("|")})(?:\\([a-z0-9-]+(?:,[a-z0-9-]+)*\\))?!?: \\S.*$`,
);

/**
 * Validates one pull request title.
 *
 * @param {object} props
 * @param {string} props.title - The pull request title as GitHub stores it.
 * @returns {{ valid: true } | { valid: false, reason: string }} `reason` is a
 *   one-line message addressed to the contributor.
 */
export function checkPrTitle(props) {
  const { title } = props;
  if (!PR_TITLE_PATTERN.test(title)) {
    return {
      valid: false,
      reason: `"${title}" is not \`type(scope): description\`. Types: ${PR_TITLE_TYPES.join(", ")}. Example: \`fix(react): show a toast when a media upload fails\`.`,
    };
  }
  if (title.endsWith(".")) {
    return { valid: false, reason: `"${title}" ends with a period. Drop it.` };
  }
  return { valid: true };
}

function main() {
  const title = process.env.PR_TITLE ?? process.argv[2];
  if (!title) {
    process.stderr.write(
      "check-pr-title: no title. Set PR_TITLE or pass the title as the first argument.\n",
    );
    process.exit(2);
  }
  const result = checkPrTitle({ title });
  if (!result.valid) {
    process.stdout.write(`::error title=Pull request title::${result.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(`check-pr-title: "${title}" is valid.\n`);
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
```

#### scripts/check-pr-title.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { checkPrTitle } from "./check-pr-title.mjs";

const scriptPath = fileURLToPath(new URL("./check-pr-title.mjs", import.meta.url));

test("accepts the repo's real title shapes: scoped, multi-scope, breaking, unscoped, Dependabot", () => {
  for (const title of [
    "fix(react): show a toast when a media upload fails",
    "feat(core,react,next,better-auth,create-vexcms,www,test): disableCreate, draft mode preview, static admin icons",
    "fix(deps)!: upgrade auth stack and pre-launch deps, add Dependabot",
    "chore: version packages (alpha)",
    "ci(deps): bump the github-actions group with 2 updates",
  ]) {
    assert.deepEqual(checkPrTitle({ title }), { valid: true }, title);
  }
});

test("rejects a missing or unknown type, a bad scope, an empty description, and a trailing period", () => {
  for (const title of [
    "Show a toast when media upload fails",
    "Fix: crash on upload",
    "feature(core): add an email field",
    "fix(React): crash on upload",
    "fix(core, react): crash on upload",
    "fix: ",
    "fix(core): crash on upload.",
  ]) {
    assert.equal(checkPrTitle({ title }).valid, false, title);
  }
});

test("CLI exits 0 for a valid title, 1 with an ::error annotation for an invalid one, 2 for none", () => {
  const { PR_TITLE: _unset, ...baseEnv } = process.env;
  const run = (env) =>
    spawnSync(process.execPath, [scriptPath], { encoding: "utf-8", env: { ...baseEnv, ...env } });

  assert.equal(run({ PR_TITLE: "docs: fix a broken link" }).status, 0);

  const invalid = run({ PR_TITLE: "Show a toast when media upload fails" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stdout, /^::error title=Pull request title::"Show a toast when media upload fails" is not/);

  assert.equal(run({}).status, 2);
});
```

Verify: `node --test scripts/check-pr-title.test.mjs` — 3 pass.

### Step 3 — Workflows: CI on dev, PR checks, labeler [agent]

Take the `.github/workflows/*` lock (board rule 6) for this step and its checks.

- [ ] `.github/workflows/ci.yml` edited
- [ ] `.github/workflows/pr-checks.yml` created
- [ ] `.github/workflows/labeler.yml` created
- [ ] `.github/labeler.yml` created
- [ ] `actionlint .github/workflows/*.yml`

#### .github/workflows/ci.yml

Two edits; everything not shown is unchanged.

**1 — trigger.** `on.pull_request.branches` gains `dev`:

```yaml
on:
  pull_request:
    branches:
      - dev
      - master
```

**2 — the fork-build step's comment.** In `Build Packages (fork PR, without apps/test)`, replace
the last two comment lines ("The Release workflow (push to master, with secrets) builds
apps/test in full once the PR merges.") with:

```yaml
        # makes no Convex calls. The dev → master pull request (same repo, with
        # secrets) builds apps/test in full before anything is released.
```

#### .github/workflows/pr-checks.yml

```yaml
name: PR checks

# Cheap checks that must re-run when a pull request is edited (title or base
# branch changed), which ci.yml deliberately doesn't trigger on.
on:
  pull_request:
    types: [opened, edited, reopened, synchronize]
    branches:
      - dev
      - master

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  title:
    name: PR title
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: Check the title
        run: node scripts/check-pr-title.mjs
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}

  base:
    name: Base branch
    runs-on: ubuntu-latest
    steps:
      - name: Fork pull requests target dev
        if: github.event.pull_request.head.repo.full_name != github.repository && github.event.pull_request.base.ref == 'master'
        run: |
          echo "::error title=Base branch::Pull requests from forks go to dev, not master. Edit the pull request, change the base branch to dev, and see CONTRIBUTING.md."
          exit 1
```

#### .github/workflows/labeler.yml

```yaml
name: Labeler

# pull_request_target so fork pull requests get labels (a fork's pull_request
# token is read-only). Safe because nothing here checks out or runs the
# pull request's code: actions/labeler reads .github/labeler.yml from the base
# branch through the API and only matches changed paths.
on:
  pull_request_target:
    types: [opened, synchronize, reopened]
    branches:
      - dev

permissions: {}

jobs:
  label:
    name: Label
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Apply area and adapter labels
        uses: actions/labeler@bf12e9b00b37c5c0ca2b87b79b2daf7891dbda13 # v7.0.0
```

#### .github/labeler.yml

```yaml
# Path → label rules for .github/workflows/labeler.yml. Only labels that map
# one-to-one onto a package or app; semantic areas (live-preview, versions,
# auth, storage) are applied by hand during triage.
"area: core":
  - changed-files:
      - any-glob-to-any-file: packages/core/**
"area: ui":
  - changed-files:
      - any-glob-to-any-file: packages/react/**
"area: cli":
  - changed-files:
      - any-glob-to-any-file: packages/cli/**
"area: create-vexcms":
  - changed-files:
      - all-globs-to-any-file:
          - packages/create-vexcms/**
          - "!packages/create-vexcms/templates/**"
"area: templates":
  - changed-files:
      - any-glob-to-any-file: packages/create-vexcms/templates/**
"area: docs":
  - changed-files:
      - any-glob-to-any-file: apps/docs/**
"adapter: better-auth":
  - changed-files:
      - any-glob-to-any-file: packages/better-auth/**
"adapter: next":
  - changed-files:
      - any-glob-to-any-file: packages/next/**
"adapter: richtext-plate":
  - changed-files:
      - any-glob-to-any-file: packages/richtext-plate/**
"adapter: file-storage-convex":
  - changed-files:
      - any-glob-to-any-file: packages/file-storage-convex/**
```

Verify: `actionlint .github/workflows/*.yml` exits 0; every key in `.github/labeler.yml` is a
`name:` in `.github/labels.yml` (one-liner in Verification). The labeler itself can't be
exercised before it is on `dev` (`pull_request_target` runs the base branch's workflow, per the
actions/labeler README); the first contributor PR after the merge is its live check.

### Step 4 — Labels and the issue chooser [agent]

- [ ] `.github/labels.yml` edited
- [ ] `.github/ISSUE_TEMPLATE/config.yml` edited
- [ ] `node scripts/sync-labels.mjs --check` (expected drift, below)

#### .github/labels.yml

Four edits; everything not shown is unchanged.

**1 — `type:` comment.** Replace `# type: — what kind of issue (orange family; no type: question — questions go to Discussions)` with:

```yaml
# type: — what kind of issue (orange family; no type: question or type: feature — both go to Discussions)
```

**2 — delete the `type: feature` entry** (its three lines).

**3 — `accepted`**, after the `help wanted` entry in the contributor-routing group:

```yaml
- name: accepted
  description: An Ideas discussion accepted for a pull request
  color: 0E8A16
```

**4 — delete the whole `# roadmap tracking …` group**: its comment and the `planned`,
`roadmap: p0`, `roadmap: p1`, `roadmap: p2` entries.

#### .github/ISSUE_TEMPLATE/config.yml

Two edits.

**1 — the `Suggest a feature` link's `about`:**

```yaml
    about: Feature ideas go to Discussions, where 👍 votes rank them.
```

**2 — new link**, between `Suggest a feature` and `Report a security vulnerability`:

```yaml
  - name: Contribute a fix or feature
    url: https://github.com/ianyimi/vex/blob/master/CONTRIBUTING.md
    about: Read this before opening a pull request.
```

Verify: `node scripts/sync-labels.mjs --check` exits 1 listing exactly: missing `accepted`;
extra `type: feature`, `planned`, `roadmap: p0`, `roadmap: p1`, `roadmap: p2`, `javascript`
(Dependabot's, already queued as DEP-7). `node -e` YAML parse of `config.yml` shows 4
`contact_links`.

### Step 5 — Docs Development pages and the roadmap [agent]

- [ ] `apps/docs/src/content/docs/dev/contributing.mdx` created
- [ ] `apps/docs/src/content/docs/dev/testing-and-code-style.mdx` created
- [ ] `apps/docs/src/content/docs/dev/naming-conventions.mdx` edited
- [ ] `apps/docs/src/content/docs/dev/adding-a-field-type.mdx` edited
- [ ] `apps/docs/src/content/docs/guides/auth.mdx` edited
- [ ] `apps/docs/src/content/docs/roadmap.md` edited
- [ ] `pnpm --filter docs build`

The sidebar's Development group autogenerates from `dev/`; `sidebar.order` puts the two new
pages first, so `astro.config.mjs` is untouched (no lock). `starlight-llms-txt` picks the pages
up with no config change.

#### apps/docs/src/content/docs/dev/contributing.mdx

````mdx
---
title: Contributing workflow
description: Set up the repo, run the checks, add a changeset, and open a pull request against dev — the path from a fork to a published release.
sidebar:
  order: 1
---

This page is the how-to for changing VexCMS itself. What needs an issue or an accepted idea
first, review times, and licensing are in
[CONTRIBUTING.md](https://github.com/ianyimi/vex/blob/master/CONTRIBUTING.md).

## Set up

You need Node.js 22.18 or later and pnpm 10. `corepack enable` gives you the pnpm version the
repo pins in `package.json`.

```bash
git clone https://github.com/<you>/vex.git
cd vex
git remote add upstream https://github.com/ianyimi/vex.git
git fetch upstream
pnpm install
```

Turborepo runs the root scripts across the workspace:

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds every package and app |
| `pnpm typecheck` | Typechecks the whole workspace |
| `pnpm test` | Runs Vitest in every package that has tests |
| `pnpm lint` / `pnpm lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}` |
| `pnpm changeset` | Records a changeset for your change |

`apps/www` and `apps/test` need their own Convex deployment to run or build, so `pnpm build`
fails on them in a fresh clone. Working on `packages/*` doesn't need one:
`pnpm build --filter='./packages/*'` builds just the packages.

### One package at a time

Packages import each other's built `dist/`, so a package's tests and typecheck need its
dependencies built first. `pnpm turbo run` builds them for you:

```bash
pnpm turbo run test typecheck --filter=@vexcms/react
```

Once the dependencies are built, `pnpm --filter <package> exec vitest run <path>` runs a subset
of tests without rebuilding anything:

```bash
pnpm --filter @vexcms/react exec vitest run src/media
```

### Run the admin panel

UI changes need a browser check, so you need `apps/test` running against a Convex deployment of
your own:

1. Copy `apps/test/.env.example` to `apps/test/.env.local`, then follow the quickstart's
   [Stand up your deployment](/guides/quickstart/#stand-up-your-deployment) from inside
   `apps/test`, with port `3020`.
2. From the repo root, in two terminals: `pnpm test:dev:vex` (regenerates the schema and runs
   `convex dev`) and `pnpm test:dev` (Next.js on `http://localhost:3020`).
3. Optionally seed the demo content, from `apps/test`: `npx convex run seed:init`.
4. Sign up. The first account becomes the admin.

## Make the change

Branch off the upstream `dev` branch:

```bash
git switch -c fix/upload-error-toast upstream/dev
```

Branch names are up to you. Keep the diff to the issue you're fixing.

## Check it

Run what CI runs, for the packages you touched:

```bash
pnpm turbo run build typecheck test --filter=@vexcms/react
pnpm lint
```

CI also checks import cost and the packed manifests of every published package. On pull
requests from the main repo it also builds `apps/test` for production and checks its bundle
budget. Fork pull requests get no secrets, so those two steps are skipped there.

- **A bug fix** comes with a regression test. Run it without your fix and watch it fail, then
  with your fix and watch it pass. Say so in the pull request.
- **A UI change** gets a browser check in `apps/test` at 375, 390, and 1280 px wide, in light and
  dark mode. Unit tests run in jsdom, which has no layout: a test that finds a `min-h-11` class
  doesn't prove a tap target is 44 px tall.
- [Testing and code style](/dev/testing-and-code-style/) covers where tests go and what reviews
  check.

## Add a changeset

A pull request that changes the behavior or types of a published package (anything under
`packages/*` that users install) needs a changeset. Docs-only and `apps/*`-only changes don't.

```bash
pnpm changeset
```

Pick the packages you changed and `patch`. Every change is a `patch`, including breaking ones,
and I set the final version bump when releasing. The summary becomes a line in the package's
CHANGELOG, so write it for someone upgrading:

```md
---
"@vexcms/react": patch
---

Show an error toast when a media upload fails, instead of only logging it to the console.
```

For a breaking change, add a **Breaking:** paragraph that says what changed and a
**Migration:** paragraph that says what to do about it.

## Open the pull request

Push your branch to your fork and open the pull request against `ianyimi/vex`'s `dev` branch.
GitHub suggests `master`; change it to `dev`.

- Title: `type(scope): description`, for example
  `fix(react): show a toast when a media upload fails`. The `PR title` check runs on every edit.
- Description: fill in the template, including `Fixes #123` or the link to the accepted idea.
- Leave **Allow edits by maintainers** on.

Path-based `area:` and `adapter:` labels are added automatically.

## From merge to release

1. I squash-merge your pull request into `dev`. Your title becomes the commit subject and your
   description its body.
2. When `dev` is ready to ship, I merge it into `master` through a pull request. That pull
   request runs CI again, plus the `axe` and Lighthouse checks against a Vercel preview. Once it
   merges, the `Fixes #123` in your commit closes the issue.
3. The merge to `master` starts the Release workflow, which opens a
   `chore: version packages (alpha)` pull request from the queued changesets.
4. Merging that pull request publishes the packages to npm under the `alpha` tag.

## Repo map

| Path | What's there |
| --- | --- |
| `packages/core` | Field system, collections, access control, schema and type generation |
| `packages/react` | The admin panel UI |
| `packages/next` | The Next.js framework adapter |
| `packages/cli` | `vex`: `dev`, `deploy`, `generate` |
| `packages/better-auth` | The Better Auth integration |
| `packages/file-storage-convex` | The Convex file-storage adapter |
| `packages/richtext-plate` | The richtext field's Plate.js editor |
| `packages/create-vexcms` | `pnpm create vexcms` and its templates |
| `packages/telemetry` | Build-time telemetry shared by `vex` and `create-vexcms` (private, not published) |
| `apps/test` | The admin panel host used for development, on port 3020 |
| `apps/www` | vexcms.dev, built on VexCMS itself |
| `apps/docs` | docs.vexcms.dev (Astro + Starlight) |
| `scripts/` | Repo-wide checks and sync scripts, run from the root `package.json` |

[Project structure](/dev/project-structure/) explains how packages, apps, and templates depend on
each other.
````

#### apps/docs/src/content/docs/dev/testing-and-code-style.mdx

````mdx
---
title: Testing and code style
description: Where tests live, what a useful test proves, how Convex-backed and field tests are set up, and the code-style rules reviews check.
sidebar:
  order: 2
---

## Where tests live

Tests sit next to the file they test, as `*.test.ts` or `*.test.tsx`: no `__tests__` folders
and no `.spec` suffix. Every package except `@vexcms/tsconfig` has a `test` script, and each
package's `vitest.config.ts` sets its environment: `edge-runtime` for `@vexcms/core` (Convex
code), `jsdom` for the React packages. Check it before adding a test to a package you haven't
worked in.

Run tests per package while you work (see
[One package at a time](/dev/contributing/#one-package-at-a-time)); the root `pnpm test` runs
everything.

## What a test proves

- **Behavior someone can observe**: a return value, a rendered result, a thrown error, a stored
  document. Assert exact expected values.
- **A bug fix's regression test fails without the fix.** Run it on the base commit once to see
  it fail.
- **Layout is checked in a browser, not in jsdom.** jsdom computes no sizes, clipping, or
  overflow, so a class-name assertion can pass while the bug is still there.
- **Skip tests that restate the implementation**: that a prop is passed through, that a mock
  returns what it was given, that a constant equals itself.
- **Types are fixed, not cast away.** A test that fails `typecheck` gets a correct value or is
  removed, never an `as` cast to silence the error.

## Convex-backed tests

Server code in `@vexcms/core` (and the adapters that touch Convex) is tested with
[`convex-test`](https://www.npmjs.com/package/convex-test):

- Import the schema and generated API from the package's test fixture directory
  (`src/db/test/convex/`) and pass an explicit modules map. `import.meta.glob` doesn't work
  there.
- Run database work inside `t.run`:
  `const t = convexTest(schema, modules); await t.run(async (ctx) => { … })`.
- Never assert an ID's format. `convex-test` IDs look different from production IDs, so check
  only that an ID is a non-empty string.

`packages/core/src/collections/api/create/server.test.ts` is a short worked example.

## Field type tests

Every field type in `packages/core/src/fields/<type>/` has two colocated tests:

- `validator.test.ts` checks the Convex validator the field emits, required and optional.
- `inputSchema.test.ts` checks the Zod input schema: valid data parses, invalid data fails, and
  an optional field accepts `undefined`.

Build field configs inline with the public factory (`upload({ to: "images", required: true })`),
not shared fixtures. The React half's tests (`Field.test.tsx`, `Cell.test.tsx`) sit next to its
files in `packages/react/src/fields/<type>/`. [Adding a field type](/dev/adding-a-field-type/)
walks through both halves.

## Code style

- **Names** follow [Naming conventions](/dev/naming-conventions/).
- **Lint**: `pnpm lint` passes, including the `jsx-a11y` accessibility rules on UI code.
- **Comments**: none narrating code inside function bodies. Exported functions and types carry
  JSDoc that says what they really do: parameters, return value, and what they throw.
- **Type assertions**: fix the type rather than asserting past it. A `@ts-expect-error` states
  exactly which error it expects and why.
- **New dependencies** need an approved plan first (see
  [CONTRIBUTING.md](https://github.com/ianyimi/vex/blob/master/CONTRIBUTING.md)).
````

#### apps/docs/src/content/docs/dev/naming-conventions.mdx

Three edits; everything not shown is unchanged.

**1 — frontmatter `description`:**

```mdx
description: Why VexCMS names things the way it does, and the file and folder rules reviews check.
```

**2 — the intro paragraph under `## File / folder rules`** (the one linking
`.agent/docs/standards/naming-conventions.md` and naming `harness struct --check`) becomes:

```mdx
These are the file and folder rules reviews check, grouped by the package or app family they
apply to. Reviews refer to each rule by the id in its heading.
```

**3 — the closing paragraph after the final `---`** becomes:

```mdx
This page is the reference reviews check new and renamed files against. When a pattern doesn't
settle a case, the reasoning under its rule does.
```

#### apps/docs/src/content/docs/dev/adding-a-field-type.mdx

One edit, in `## Tests + verification`: replace the sentence ending
"…is documented in `.agent/docs/standards/testing/convex-integration-testing.md`." with:

```mdx
files. Most field types need no server-side test of their own; when one does, the shared
`convex-test` setup is described in
[Testing and code style](/dev/testing-and-code-style/#convex-backed-tests).
```

#### apps/docs/src/content/docs/guides/auth.mdx

One edit, in `### Creating users as an admin`: the last sentence becomes:

```mdx
generic create form. VexCMS has no admin-panel control for this yet.
```

#### apps/docs/src/content/docs/roadmap.md

Two edits under `## After 0.1.0`; everything else unchanged.

**1 —** item 2's line becomes `2. **Free features, as demand appears** — No fixed order.`

**2 —** remove the trailing ` [\`planned\` issue #NN](https://github.com/ianyimi/vex/issues/NN)`
link from the Plugin system, the six sub-items, and Brownfield adoption (8 links).

Verify: `pnpm --filter docs build` exits 0; `dist/dev/contributing/index.html` and
`dist/dev/testing-and-code-style/index.html` exist; both titles appear in `dist/llms-full.txt`;
the in-page anchors `#stand-up-your-deployment`, `#one-package-at-a-time`,
`#convex-backed-tests` exist in the built HTML.

### Step 6 — CONTRIBUTING, PR template, SECURITY, CODE_OF_CONDUCT [agent]

- [ ] `CONTRIBUTING.md` rewritten
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` rewritten
- [ ] `SECURITY.md` edited
- [ ] `CODE_OF_CONDUCT.md` edited
- [ ] `pnpm exec prettier --check` on the four files

#### CONTRIBUTING.md

Full replacement. `## Reproduction bar` and `## What \`status:\` means` carry over unchanged;
`## Dev setup`, `## Changesets`, `## Before you open a PR`, `## PR checklist` and `## Repo map`
are replaced (their how-to content now lives on the docs page).

````markdown
# Contributing to VexCMS

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free
time. New issues are triaged within a week; how fast a fix lands depends on its severity and on
sponsorship.

## Where things go

| You have...                   | Goes to                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A question about using VexCMS | [Discussions → Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a)                                                                        |
| An idea for a new feature     | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — 👍 the ideas you want; I label the ones I'll take `accepted`     |
| A reproducible bug            | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A docs correction             | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A security vulnerability      | [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) (preferred) or `security@vexcms.dev` — never a public issue |

Issues are for things that are broken. A feature request opened as an issue is closed with a
pointer to Ideas.

## Before you write code

Every pull request starts from one of these:

- **A bug fix** links its issue. Comment on the issue to say you're taking it. On a
  `good first issue`, wait until I assign it to you, so two people don't build the same fix.
- **A feature** links an Ideas discussion labeled `accepted`. If it changes a public API,
  touches more than one package, adds a field type, or adds a dependency, post a plan in that
  discussion first — what changes, the public API, and the alternatives you considered — and
  wait for my OK before you write code.
- **A typo or broken-link fix** needs neither. Open the pull request directly.

A pull request without one of these is closed with a pointer back here.

## Opening a pull request

- Fork the repo, branch off `dev`, and open the pull request against `dev`, not `master`.
  `master` only receives releases.
- Title it `type(scope): description`, in [Conventional Commits](https://www.conventionalcommits.org/)
  form — for example `fix(react): show a toast when a media upload fails`. Commits inside the
  pull request can be anything: I squash-merge, so the title becomes the commit.
- Put `Fixes #123` in the description, or the link to the accepted discussion.
- Leave **Allow edits by maintainers** on.
- Keep the diff scoped to the issue. Unrelated cleanups make review slower, not faster.

The [contributing workflow](https://docs.vexcms.dev/dev/contributing/) covers dev setup, running
the checks, changesets, and how a merged change reaches a release.

## What a pull request needs

- **A changeset**, if it changes a published package (`packages/*`): `pnpm changeset`, then
  `patch`. Every change is a `patch`, breaking ones included; describe a breaking change under
  **Breaking:** with migration steps, and I set the final version bump. Docs-only and
  `apps/*`-only changes need none.
- **Tests** for the behavior it changes. A bug fix comes with a regression test that fails
  without the fix.
- **A browser check** for a UI change. Unit tests run in jsdom, which has no layout, so they
  can't prove sizes, clipping, or overflow. Say what you checked and at which widths.
- **Docs** (`apps/docs`), if it changes a public API or documented behavior.
- **Code that follows** the [naming conventions](https://docs.vexcms.dev/dev/naming-conventions/)
  and the [testing and code style](https://docs.vexcms.dev/dev/testing-and-code-style/) rules.
  Reviews check both.
- **Your own verification.** Run every check you mention in the description. AI tools are
  welcome, and the bar is the same for every line however it was written: you ran it, you
  checked it, and you can explain it.

## Review

- CI must pass. On your first contribution, CI waits until I approve the run.
- I check UI changes in a browser on the pull request's Vercel preview, which I approve after
  reading the diff.
- I give every pull request a first review within a week. After you push changes, I review again
  within a week.

## Stale pull requests

If I've asked for changes and there's been no reply for 30 days, I add the `stale` label and
leave a comment. After 14 more days without a reply, I close the pull request; you can reopen it
any time.

When a stale fix is close and the issue matters, I may finish it myself, either by pushing to
your branch or by opening a new pull request that credits you with a `Co-authored-by:` trailer.

## Licensing

Your contribution is licensed under Apache-2.0, the same as the rest of VexCMS (section 5 of the
[Apache License](LICENSE)). There's no CLA to sign and no sign-off line to add.

## Reproduction bar

Bug reports need either a reproduction link or clear numbered steps from a fresh install — not both.
A Convex-backed repro is a real ask for a stranger to set up, so the bar is "I can follow these steps
and see the bug," not "there's a hosted repo."

## What `status:` means

| Label                    | Meaning                                                   |
| ------------------------ | --------------------------------------------------------- |
| `status: needs-triage`   | Not yet looked at by a maintainer                         |
| `status: needs-repro`    | Reported but missing a reproduction link or clear steps   |
| `status: verified`       | Reproduced by a maintainer                                |
| `status: cant-reproduce` | A maintainer could not reproduce it from the report given |
````

#### .github/PULL_REQUEST_TEMPLATE.md

````markdown
<!--
Before you open this:
- The base branch is `dev`, not `master`.
- The title is `type(scope): description`, e.g. `fix(react): show a toast when a media upload fails`.
- CONTRIBUTING.md says what needs an issue or an accepted idea first.
-->

## What and why

<!-- The problem, and what this pull request changes to fix it. -->

Fixes #<!-- the bug issue number, or replace this line with the link to the accepted Ideas discussion -->

## How I verified it

<!-- The commands you ran and what they printed. For a bug fix: the regression test, and that it fails without your change. For a UI change: what you checked in a browser, and at which widths. -->

## Not verified

<!-- Anything you couldn't check, or "Nothing". -->

## Checklist

- [ ] The base branch is `dev`
- [ ] Links a bug issue or an accepted Ideas discussion (typo and broken-link fixes excepted)
- [ ] A `patch` changeset, if this changes a published package (`packages/*`)
- [ ] Tests added or updated for the behavior this changes
- [ ] Docs updated (`apps/docs`), if this changes a public API or documented behavior
- [ ] **Allow edits by maintainers** is on
````

#### SECURITY.md

Two edits.

**1 —** in the private-reporting item, `only you and the maintainer can see` → `only you and I can see`.

**2 —** in `## Disclosure`, `We'll coordinate the disclosure timeline with you before publishing.`
→ `I'll coordinate the disclosure timeline with you before publishing.`

#### CODE_OF_CONDUCT.md

One edit: delete the paragraph
`**[NOTE: The remedies and repairs outlined below are suggestions based on best practices in code of conduct enforcement. If your community has its own established enforcement process, be sure to edit this section to describe your own policies.]**`
and the blank line after it. The Covenant's text is otherwise kept verbatim.

Verify: `pnpm exec prettier --check CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md`;
`rg -n "NOTE: The remedies|We'll|tracked issue" CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github` prints nothing;
`rg -c "I give every pull request a first review within a week." CONTRIBUTING.md .agent/docs/specs/2026-11-06-public-presence/public-copy.md` prints 1 for each.

### Step 7 — github-review skill and ledger [agent]

- [ ] `.agent/skills/github-review/SKILL.md` created
- [ ] `.agent/skills/github-review/references/pull-requests.md` created
- [ ] `.agent/skills/github-review/references/issues.md` created
- [ ] `.agent/skills/github-review/references/discussions.md` created
- [ ] `.agent/skills/github-review/scripts/ledger.mjs` created
- [ ] `.agent/skills/github-review/scripts/ledger.test.mjs` created
- [ ] `.agent/docs/github/ledger.json` created (empty ledger)
- [ ] `.agent/docs/github/reviews/.gitkeep` created
- [ ] `.agent/docs/harness-guide.md`: one row in § Where knowledge goes
- [ ] `.agent/docs/harness-changelog.md`: one line
- [ ] `harness sync`

#### .agent/skills/github-review/SKILL.md

````markdown
---
name: github-review
description: Review new or changed pull requests, issues and Discussions on the GitHub repo and
  draft the replies. Triggers on "/github-review", "review the new PRs", "triage new issues",
  "check the discussions", "anything new on GitHub?". A ledger limits each run to items with
  outside activity since their last review, plus pull requests that went stale. Drafts only;
  the developer posts every reply.
harness_model_role: default
---

# GitHub Review

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. `gh auth status` succeeds; otherwise stop and ask the developer to log in.
3. Read `CONTRIBUTING.md`: it is the policy every review checks against.

## Steps
1. **List the work.** Run `node .agent/skills/github-review/scripts/ledger.mjs pending`, adding
   `--kind pr|issue|discussion` when the developer names one. It prints JSON:
   - `pending`: open items with outside activity (an author who is neither the developer nor a
     bot) since their last review, each with a `reason` (`new`, `new commits`, `new activity`);
   - `stale`: pull requests waiting on their author after `request-changes`, each with the
     CONTRIBUTING action due (`label` after 30 days, `close` 14 days after the stale comment).
   Both empty → report "nothing new" and stop.
2. **Review each pending item, one at a time**, with its checklist:
   - pull request → `references/pull-requests.md`
   - issue → `references/issues.md`
   - Discussion → `references/discussions.md`
   On a re-review (`reason` is not `new`), read the item's note first and review what changed
   since its last section.
3. **Write the note**: `.agent/docs/github/reviews/<kind>-<number>.md` (format below). A
   re-review appends a new dated section; earlier sections stay as written.
4. **Record it**, after the note exists:
   `node .agent/skills/github-review/scripts/ledger.mjs record --kind <kind> --number <n> --verdict <verdict>`.
5. **Stale pull requests**: for each `stale` row, draft the reply its `action` calls for (the
   stale comment, or the closing comment) into that item's note, then record verdict `stale`
   (for `label`) or `close`.
6. **Report** to the developer: one table (item linked, kind, verdict, one-line reason, note
   path), then every drafted reply ready to paste, and the labels or actions to take by hand.
   The developer posts, labels, assigns, and closes; this skill changes nothing on GitHub.

## Note format

```markdown
# <kind> #<number> — <title>

<url> · @<author>

## <YYYY-MM-DD> — <verdict>

### Findings
- <finding> — evidence: <command and output, measurement, or path:line>

### Drafted replies
**Summary comment**

<markdown>

**Inline — `path:line`**

<markdown>

### Actions for the developer
- <label to add, assignment, close, Vercel authorization, …>
```

## Drafted replies
- GitHub-flavored Markdown, in the developer's voice: first person "I". Follow
  `.agent/docs/standards/docs/voice-and-wording.md`.
- Pull request feedback is split into one summary comment plus one inline comment per finding,
  each headed with its `path:line`, so the developer can post it as a review.
- Every finding states what is wrong, the evidence, and the fix. The #68 review is the model:
  the measured table, the root cause in the code, the exact change.
- Short and specific. One thank-you at most.

## Verdicts
| Kind | Verdicts |
|---|---|
| `pr` | `approve`, `request-changes`, `close`, `needs-maintainer`, `stale` |
| `issue` | `verified`, `needs-repro`, `cant-reproduce`, `duplicate`, `redirect`, `close`, `needs-maintainer` |
| `discussion` | `answered`, `accept`, `ask-for-plan`, `decline`, `noted`, `needs-maintainer` |

`needs-maintainer` means the decision is the developer's (an assignment, a security report, a
diff the local-run gate stopped); the note says what to decide.
````

#### .agent/skills/github-review/references/pull-requests.md

````markdown
# Pull request checklist

Work top to bottom. A section that ends in `close` ends the review.

## 1. Policy (CONTRIBUTING.md)
- **Base** is `dev`. A fork PR on `master` → ask the author to retarget (the developer can also
  change the base); the `Base branch` check already fails.
- **Title** is `type(scope): description` (the `PR title` check shows it).
- **Anchor**: `Fixes #N` on a bug issue, or a link to an Ideas discussion labeled `accepted`.
  Typo and broken-link fixes need neither. No anchor → `close`, pointing at CONTRIBUTING.
- **Claim**: the bug issue has the author's claim comment; a `good first issue` is assigned to
  the author. Assigned to someone else → `close`, naming the assignee.
- **Big change** (public API, more than one package, a new field type, a new dependency): the
  discussion holds a plan the developer approved; otherwise `request-changes` asking for it.
- **Changeset** for a `packages/*` behavior or type change: `patch`; a breaking change carries
  **Breaking:** and **Migration:** text.
- **Template**: what and why, how verified, not verified, all filled in.
- **Maintainer edits**: `gh pr view <n> --json maintainerCanModify` is `true`.

## 2. Spam and farming
Signs: it promotes a tool or site; the diff doesn't address the linked issue; the description
claims things the diff doesn't contain; it's a drive-by on an issue assigned to someone else.
→ `close` with a one-line reason. Reference case: #70, an `llms.txt` "validated with" a
third-party AI-readiness suite, opened against #56, which asked for something else.

## 3. Read the whole diff
`gh pr diff <n>`, all of it, before running anything. Check every claim in the description
against the code.

**Local-run gate.** If the diff touches `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
`.npmrc`, any `*.config.*` file, `scripts/**`, or `.github/**`, don't run it: verdict
`needs-maintainer`, listing those paths, and finish the review read-only.

## 4. Run it in a throwaway worktree
The main working tree is never checked out, stashed, reset, or switched.

```bash
git fetch origin pull/<n>/head                     # updates FETCH_HEAD only
git worktree add --detach ~/tmp/vex-review/pr-<n> FETCH_HEAD
cd ~/tmp/vex-review/pr-<n>
pnpm install --frozen-lockfile
pnpm turbo run build typecheck test --filter=<each package the diff touches>
pnpm lint
```

- **Bug fix**: the regression test fails on the base and passes on the PR, twice each, to rule
  out a flake. For the base, check out the base commit
  (`gh pr view <n> --json baseRefOid`) with `git worktree add --detach ~/tmp/vex-review/pr-<n>-base <sha>`
  and copy only the PR's test files in.
- **Clean up**: `git worktree remove --force ~/tmp/vex-review/pr-<n>` (and `-base`).

## 5. UI changes: check in a browser
Find the vex-www preview of the PR's head:

```bash
sha=$(gh pr view <n> --json headRefOid --jq .headRefOid)
id=$(gh api "repos/{owner}/{repo}/deployments?sha=$sha&environment=Preview – vex-www" --jq '.[0].id')
gh api "repos/{owner}/{repo}/deployments/$id/statuses" --jq '.[0].environment_url'
```

- **No deployment** → the developer hasn't authorized the fork's Vercel build. Put "read the
  diff, then authorize the Vercel preview" in Actions for the developer (the build runs the
  fork's code with the project's Vercel secrets, `deploy:convex` included), and mark the
  browser check pending in the note.
- **Vercel login wall** → append
  `?x-vercel-protection-bypass=$VERCEL_AUTOMATION_BYPASS_SECRET&x-vercel-set-bypass-cookie=true`
  when that variable is set in the shell; otherwise ask the developer.
- Check the change at 375, 390, and 1280 px, light and dark. Measure what the PR claims: hit-test
  tap areas, read computed sizes, try the keyboard. A jsdom assertion is not layout evidence.

## 6. Verdict
`approve`, `request-changes`, `close`, or `needs-maintainer`.
````

#### .agent/skills/github-review/references/issues.md

````markdown
# Issue checklist

1. **Kind.**
   - A feature request or a question → `redirect`: draft a reply pointing at
     [Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) or
     [Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a); the developer closes it.
   - A security report → `needs-maintainer` at once, with a reply moving it to private
     vulnerability reporting. The note records only that it happened, none of its details.
   - Spam → `close`.
2. **Duplicates.** `gh search issues --repo {owner}/{repo} "<key terms>" --state all`. Found →
   `duplicate`, linking it.
3. **Completeness.** The bug form's versions, steps, expected and actual. No steps and no repro
   link → `needs-repro`, with a reply asking for exactly what's missing.
4. **Verify the claim** against `origin/dev`, not the working tree (it holds uncommitted work):
   `git show origin/dev:<path>`. When a failing test is cheap to write, write it in
   `git worktree add --detach ~/tmp/vex-review/issue-<n> origin/dev` and remove the worktree
   afterwards. Reproduced → `verified`. The code shows it can't happen as described →
   `cant-reproduce`, with the evidence.
5. **Labels.** Propose `type:`, `area:`/`adapter:`, and `status:` labels from
   `.github/labels.yml`; the developer applies them.
6. **Claims.** Someone asks to take an issue → `needs-maintainer`, with a recommendation:
   assign them, or say who claimed it first.
````

#### .agent/skills/github-review/references/discussions.md

````markdown
# Discussion checklist

Act on the `category` in the pending row.

- **Q&A** — Answer from the docs and the code, linking the docs page or file that proves it.
  It's a bug → ask them to open an issue with the bug form. Verdict `answered`, or
  `needs-maintainer` when the answer is a judgement call.
- **Ideas** — Search Discussions for duplicates, and check
  `apps/docs/src/content/docs/roadmap.md` (on the roadmap → say it's planned, verdict `noted`).
  Otherwise assess fit, rough size (packages and files touched), and whether it's a big change
  by CONTRIBUTING's definition. Recommend `accept` (the developer adds `accepted`),
  `ask-for-plan`, or `decline` with the reason, and draft the reply for that recommendation. The
  decision is the developer's.
- **A plan posted in an accepted idea** — Review it as a design: public API, alternatives,
  packages touched, migration. `accept` (plan approved) or `ask-for-plan` naming what's missing.
- **Show and tell** — `noted`; no reply.
- **Announcements** — the developer's own; record `noted` and move on.
````

#### .agent/skills/github-review/scripts/ledger.mjs

```js
/**
 * Ledger for the `github-review` skill: which pull requests, issues and
 * Discussions on the repo were reviewed, and which need a review now.
 *
 * `pending [--kind pr|issue|discussion]` prints `{ pending, stale }` as JSON:
 * - `pending`: open items with outside activity (an author who is neither
 *   the authenticated `gh` user nor a bot) after their last review, or
 *   never reviewed; each row's `reason` is `new`, `new commits` or
 *   `new activity`.
 * - `stale`: open pull requests waiting on their author after a
 *   `request-changes` or `stale` verdict; `action` is `label` once the
 *   maintainer's last activity is `STALE_LABEL_DAYS` old, or `close` once a
 *   `stale`-labeled pull request's is `STALE_CLOSE_DAYS` old.
 *
 * `record --kind <kind> --number <n> --verdict <verdict>` stores a review
 * of the item's current state, stamped now.
 *
 * The ledger is `docs/github/ledger.json` in the harness directory that
 * holds this skill, resolved from this file's real path so it works when
 * `.agent` is a symlink. Exit codes: `0` ok, `1` bad arguments, `2` a `gh`
 * call failed.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const agentDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ledgerPath = path.join(agentDir, "docs/github/ledger.json");

export const KINDS = ["pr", "issue", "discussion"];

export const VERDICTS = {
  pr: ["approve", "request-changes", "close", "needs-maintainer", "stale"],
  issue: ["verified", "needs-repro", "cant-reproduce", "duplicate", "redirect", "close", "needs-maintainer"],
  discussion: ["answered", "accept", "ask-for-plan", "decline", "noted", "needs-maintainer"],
};

export const STALE_LABEL_DAYS = 30;
export const STALE_CLOSE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;
const ACTOR = "login __typename";
const ACTIVITY = `createdAt author { ${ACTOR} }`;

const ITEM_FIELDS = {
  pr: `number title url createdAt lastEditedAt headRefOid author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} } }
    reviews(last: 50) { nodes { submittedAt author { ${ACTOR} } } }
    reviewThreads(last: 50) { nodes { comments(last: 20) { nodes { ${ACTIVITY} } } } }`,
  issue: `number title url createdAt lastEditedAt author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} } }`,
  discussion: `number title url createdAt lastEditedAt category { name } author { ${ACTOR} } editor { ${ACTOR} }
    labels(first: 20) { nodes { name } }
    comments(last: 50) { nodes { ${ACTIVITY} replies(last: 20) { nodes { ${ACTIVITY} } } } }`,
};

const CONNECTIONS = {
  pr: { list: "pullRequests(states: OPEN, first: 50, orderBy: { field: UPDATED_AT, direction: DESC })", one: "pullRequest" },
  issue: { list: "issues(states: OPEN, first: 100, orderBy: { field: UPDATED_AT, direction: DESC })", one: "issue" },
  discussion: { list: "discussions(states: [OPEN], first: 50, orderBy: { field: UPDATED_AT, direction: DESC })", one: "discussion" },
};

function latest(timestamps) {
  return timestamps.reduce((max, at) => (max === null || Date.parse(at) > Date.parse(max) ? at : max), null);
}

/**
 * Reduces one GraphQL node to the fields the ledger compares, splitting its
 * activity into outside (not the maintainer, not a bot) and the maintainer's.
 *
 * @param {object} props
 * @param {object} props.node - A pull request, issue or discussion node from the `ITEM_FIELDS` query.
 * @param {"pr" | "issue" | "discussion"} props.kind
 * @param {string} props.maintainer - Login whose activity is the maintainer's.
 * @returns {{ kind: string, number: number, title: string, url: string, author: string,
 *   isOutsideAuthor: boolean, headSha: string | null, labels: string[], category: string | null,
 *   outsideActivityAt: string | null, maintainerActivityAt: string | null }}
 */
export function summarizeActivity(props) {
  const { node, kind, maintainer } = props;
  const isOutside = (actor) => actor != null && actor.__typename !== "Bot" && actor.login !== maintainer;
  const outside = [];
  const own = [];
  const add = (actor, at) => {
    if (!actor || !at) return;
    if (isOutside(actor)) outside.push(at);
    else if (actor.login === maintainer) own.push(at);
  };

  add(node.author, node.createdAt);
  add(node.editor, node.lastEditedAt);
  for (const comment of node.comments.nodes) {
    add(comment.author, comment.createdAt);
    for (const reply of comment.replies?.nodes ?? []) add(reply.author, reply.createdAt);
  }
  for (const review of node.reviews?.nodes ?? []) add(review.author, review.submittedAt);
  for (const thread of node.reviewThreads?.nodes ?? []) {
    for (const comment of thread.comments.nodes) add(comment.author, comment.createdAt);
  }

  return {
    kind,
    number: node.number,
    title: node.title,
    url: node.url,
    author: node.author?.login ?? "ghost",
    isOutsideAuthor: isOutside(node.author),
    headSha: node.headRefOid ?? null,
    labels: node.labels.nodes.map((label) => label.name),
    category: node.category?.name ?? null,
    outsideActivityAt: latest(outside),
    maintainerActivityAt: latest(own),
  };
}

/**
 * Picks the items that need a review: never reviewed and with outside
 * activity, a pull request whose head moved, or outside activity after the
 * last review.
 *
 * @param {object} props
 * @param {ReturnType<typeof summarizeActivity>[]} props.items
 * @param {{ items: Record<string, { verdict: string, reviewedAt: string, headSha: string | null, note: string }> }} props.ledger
 * @returns {object[]} One row per pending item, with `reason`, `lastVerdict` and `note`.
 */
export function findPending(props) {
  const rows = [];
  for (const item of props.items) {
    const entry = props.ledger.items[`${item.kind}#${item.number}`];
    let reason = null;
    if (!entry) {
      if (item.outsideActivityAt) reason = "new";
    } else if (item.kind === "pr" && item.isOutsideAuthor && item.headSha !== entry.headSha) {
      reason = "new commits";
    } else if (item.outsideActivityAt && Date.parse(item.outsideActivityAt) > Date.parse(entry.reviewedAt)) {
      reason = "new activity";
    }
    if (reason) {
      rows.push({
        kind: item.kind,
        number: item.number,
        title: item.title,
        url: item.url,
        author: item.author,
        category: item.category,
        labels: item.labels,
        reason,
        lastVerdict: entry?.verdict ?? null,
        note: entry?.note ?? null,
      });
    }
  }
  return rows;
}

/**
 * Finds pull requests waiting on their author after changes were requested,
 * and the CONTRIBUTING action now due.
 *
 * @param {object} props
 * @param {ReturnType<typeof summarizeActivity>[]} props.items
 * @param {{ items: Record<string, { verdict: string, reviewedAt: string, headSha: string | null, note: string }> }} props.ledger
 * @param {number} props.now - Epoch milliseconds.
 * @returns {{ kind: "pr", number: number, title: string, url: string, action: "label" | "close", waitingDays: number, note: string }[]}
 */
export function findStale(props) {
  const rows = [];
  for (const item of props.items) {
    if (item.kind !== "pr") continue;
    const entry = props.ledger.items[`pr#${item.number}`];
    if (!entry || !["request-changes", "stale"].includes(entry.verdict)) continue;
    if (!item.maintainerActivityAt) continue;
    if (item.outsideActivityAt && Date.parse(item.outsideActivityAt) > Date.parse(item.maintainerActivityAt)) continue;
    const waitingDays = Math.floor((props.now - Date.parse(item.maintainerActivityAt)) / DAY_MS);
    const isLabeled = item.labels.includes("stale");
    const action = isLabeled
      ? waitingDays >= STALE_CLOSE_DAYS ? "close" : null
      : waitingDays >= STALE_LABEL_DAYS ? "label" : null;
    if (action) {
      rows.push({ kind: "pr", number: item.number, title: item.title, url: item.url, action, waitingDays, note: entry.note });
    }
  }
  return rows;
}

function gh(args) {
  try {
    return execFileSync("gh", args, { encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const detail = error.code === "ENOENT" ? "gh is not installed" : error.stderr?.toString().trim() || error.message;
    process.stderr.write(`ledger: gh ${args.slice(0, 2).join(" ")} failed — ${detail}\n`);
    process.exit(2);
  }
}

function graphql(props) {
  const args = ["api", "graphql", "-f", `query=${props.query}`];
  for (const [key, value] of Object.entries(props.variables)) args.push("-F", `${key}=${value}`);
  return JSON.parse(gh(args)).data.repository;
}

function repoContext() {
  const nameWithOwner =
    process.env.GITHUB_REPOSITORY ?? JSON.parse(gh(["repo", "view", "--json", "nameWithOwner"])).nameWithOwner;
  const [owner, name] = nameWithOwner.split("/");
  const maintainer = gh(["api", "user", "--jq", ".login"]).trim();
  return { owner, name, maintainer };
}

function readLedger() {
  if (!fs.existsSync(ledgerPath)) return { version: 1, items: {} };
  return JSON.parse(fs.readFileSync(ledgerPath, "utf-8"));
}

function writeLedger(ledger) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
}

function fail(message) {
  process.stderr.write(`ledger: ${message}\n`);
  process.exit(1);
}

function listOpenItems(props) {
  const { repo, kinds } = props;
  const query = `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
    ${kinds.map((kind) => `${kind}: ${CONNECTIONS[kind].list} { pageInfo { hasNextPage } nodes { ${ITEM_FIELDS[kind]} } }`).join("\n")}
  } }`;
  const data = graphql({ query, variables: { owner: repo.owner, name: repo.name } });
  return kinds.flatMap((kind) => {
    if (data[kind].pageInfo.hasNextPage) {
      process.stderr.write(`ledger: more open ${kind} items than one page; only the most recently updated are listed\n`);
    }
    return data[kind].nodes.map((node) => summarizeActivity({ node, kind, maintainer: repo.maintainer }));
  });
}

function pending(argv) {
  const { values } = parseArgs({ args: argv, options: { kind: { type: "string" } } });
  if (values.kind && !KINDS.includes(values.kind)) fail(`--kind must be one of ${KINDS.join(", ")}`);
  const kinds = values.kind ? [values.kind] : KINDS;
  const repo = repoContext();
  const items = listOpenItems({ repo, kinds });
  const ledger = readLedger();
  const result = { pending: findPending({ items, ledger }), stale: findStale({ items, ledger, now: Date.now() }) };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function record(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { kind: { type: "string" }, number: { type: "string" }, verdict: { type: "string" } },
  });
  const { kind, verdict } = values;
  const number = Number(values.number);
  if (!KINDS.includes(kind)) fail(`--kind must be one of ${KINDS.join(", ")}`);
  if (!Number.isInteger(number) || number <= 0) fail("--number must be a positive integer");
  if (!VERDICTS[kind].includes(verdict)) fail(`--verdict for ${kind} must be one of ${VERDICTS[kind].join(", ")}`);

  const repo = repoContext();
  const query = `query($owner: String!, $name: String!, $number: Int!) { repository(owner: $owner, name: $name) {
    item: ${CONNECTIONS[kind].one}(number: $number) { ${ITEM_FIELDS[kind]} }
  } }`;
  const node = graphql({ query, variables: { owner: repo.owner, name: repo.name, number } }).item;
  if (!node) fail(`${kind} #${number} not found`);

  const note = `docs/github/reviews/${kind}-${number}.md`;
  const ledger = readLedger();
  ledger.items[`${kind}#${number}`] = {
    kind,
    number,
    title: node.title,
    verdict,
    reviewedAt: new Date().toISOString(),
    headSha: node.headRefOid ?? null,
    note,
  };
  writeLedger(ledger);
  process.stdout.write(`ledger: recorded ${kind} #${number} as ${verdict} (${note})\n`);
}

function main() {
  const [command, ...argv] = process.argv.slice(2);
  if (command === "pending") pending(argv);
  else if (command === "record") record(argv);
  else fail("usage: ledger.mjs pending [--kind pr|issue|discussion] | record --kind <kind> --number <n> --verdict <verdict>");
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
```

#### .agent/skills/github-review/scripts/ledger.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";

import { findPending, findStale, summarizeActivity } from "./ledger.mjs";

const MAINTAINER = "ianyimi";
const DAY_MS = 24 * 60 * 60 * 1000;
const user = (login) => ({ login, __typename: "User" });
const bot = (login) => ({ login, __typename: "Bot" });

function issueNode(overrides) {
  return {
    number: 55,
    title: "Collapse duplicate exported types",
    url: "https://github.com/ianyimi/vex/issues/55",
    createdAt: "2026-11-08T02:00:00Z",
    lastEditedAt: null,
    author: user(MAINTAINER),
    editor: null,
    labels: { nodes: [{ name: "good first issue" }] },
    comments: { nodes: [] },
    ...overrides,
  };
}

function prNode(overrides) {
  return {
    number: 71,
    title: "Render AdminNotFound at the six remaining not-found call sites",
    url: "https://github.com/ianyimi/vex/pull/71",
    createdAt: "2026-11-08T12:42:16Z",
    lastEditedAt: null,
    headRefOid: "aaa111",
    author: user("jay23606"),
    editor: null,
    labels: { nodes: [] },
    comments: { nodes: [] },
    reviews: { nodes: [] },
    reviewThreads: { nodes: [] },
    ...overrides,
  };
}

const summarize = (node, kind) => summarizeActivity({ node, kind, maintainer: MAINTAINER });

test("a claim comment on a maintainer-authored issue is outside activity; bot comments are ignored", () => {
  const item = summarize(
    issueNode({
      comments: {
        nodes: [
          { createdAt: "2026-11-09T10:00:00Z", author: user("jay23606") },
          { createdAt: "2026-11-09T11:00:00Z", author: bot("vercel") },
        ],
      },
    }),
    "issue",
  );
  assert.equal(item.isOutsideAuthor, false);
  assert.equal(item.outsideActivityAt, "2026-11-09T10:00:00Z");
  assert.equal(item.maintainerActivityAt, "2026-11-08T02:00:00Z");
});

test("an unreviewed item is pending only when it has outside activity", () => {
  const quiet = summarize(issueNode({}), "issue");
  const claimed = summarize(
    issueNode({ number: 56, comments: { nodes: [{ createdAt: "2026-11-09T10:00:00Z", author: user("jay23606") }] } }),
    "issue",
  );
  const rows = findPending({ items: [quiet, claimed], ledger: { items: {} } });
  assert.deepEqual(rows.map((row) => [row.number, row.reason]), [[56, "new"]]);
});

test("a reviewed pull request is pending again after new commits or an outside review-thread reply, not after the maintainer's own comment", () => {
  const ledger = {
    items: {
      "pr#71": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "aaa111", note: "docs/github/reviews/pr-71.md" },
      "pr#72": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "bbb222", note: "docs/github/reviews/pr-72.md" },
      "pr#73": { verdict: "request-changes", reviewedAt: "2026-11-09T00:00:00Z", headSha: "ccc333", note: "docs/github/reviews/pr-73.md" },
    },
  };
  const moved = summarize(prNode({ headRefOid: "aaa999" }), "pr");
  const replied = summarize(
    prNode({
      number: 72,
      headRefOid: "bbb222",
      reviewThreads: { nodes: [{ comments: { nodes: [{ createdAt: "2026-11-09T05:00:00Z", author: user("jay23606") }] } }] },
    }),
    "pr",
  );
  const maintainerOnly = summarize(
    prNode({
      number: 73,
      headRefOid: "ccc333",
      comments: { nodes: [{ createdAt: "2026-11-09T06:00:00Z", author: user(MAINTAINER) }] },
    }),
    "pr",
  );
  const rows = findPending({ items: [moved, replied, maintainerOnly], ledger });
  assert.deepEqual(rows.map((row) => [row.number, row.reason, row.lastVerdict]), [
    [71, "new commits", "request-changes"],
    [72, "new activity", "request-changes"],
  ]);
});

test("stale: label after 30 days of maintainer-last silence, close 14 days after the stale comment, nothing once the author replies", () => {
  const now = Date.parse("2026-12-20T00:00:00Z");
  const daysAgo = (days) => new Date(now - days * DAY_MS).toISOString();
  const entry = (number, verdict) => ({
    verdict,
    reviewedAt: "2026-11-01T00:00:00Z",
    headSha: "aaa111",
    note: `docs/github/reviews/pr-${number}.md`,
  });
  const ledger = {
    items: {
      "pr#1": entry(1, "request-changes"),
      "pr#2": entry(2, "request-changes"),
      "pr#3": entry(3, "stale"),
      "pr#4": entry(4, "stale"),
      "pr#5": entry(5, "request-changes"),
      "pr#6": entry(6, "approve"),
    },
  };
  const waiting = (number, days, overrides = {}) =>
    summarize(
      prNode({
        number,
        createdAt: "2026-10-01T00:00:00Z",
        reviews: { nodes: [{ submittedAt: daysAgo(days), author: user(MAINTAINER) }] },
        ...overrides,
      }),
      "pr",
    );
  const items = [
    waiting(1, 31),
    waiting(2, 29),
    waiting(3, 15, { labels: { nodes: [{ name: "stale" }] } }),
    waiting(4, 13, { labels: { nodes: [{ name: "stale" }] } }),
    waiting(5, 40, { comments: { nodes: [{ createdAt: daysAgo(2), author: user("jay23606") }] } }),
    waiting(6, 60),
  ];
  const rows = findStale({ items, ledger, now });
  assert.deepEqual(rows.map((row) => [row.number, row.action, row.waitingDays]), [
    [1, "label", 31],
    [3, "close", 15],
  ]);
});
```

#### .agent/docs/github/ledger.json

```json
{
  "version": 1,
  "items": {}
}
```

#### .agent/docs/github/reviews/.gitkeep

Empty file.

#### .agent/docs/harness-guide.md

One row in § Where knowledge goes, after `What happened this session`:

```markdown
| A GitHub PR / issue / Discussion review | `docs/github/` — `ledger.json` + `reviews/<kind>-<n>.md`, written by the `github-review` skill |
```

#### .agent/docs/harness-changelog.md

Append one line:

```markdown
- 2026-11-10 — `skills/github-review/` (new: SKILL.md, references for PRs/issues/Discussions, `scripts/ledger.mjs` + test), `docs/github/ledger.json`, `docs/github/reviews/`, harness-guide row — PR/issue/Discussion review skill with a ledger so each run covers only items with outside activity since their last review, plus stale PRs; drafts only. Trigger: "i want to include a pr review skill that maintains a system in the agent harness of which prs have been reviewed … the same things for new issues and discussions".
```

Then run `harness sync`.

Verify: `node --test .agent/skills/github-review/scripts/ledger.test.mjs` — 4 pass;
`node .agent/skills/github-review/scripts/ledger.mjs pending` prints JSON with `pending` and
`stale` keys against the live repo (today: open issues #55/#56 only if they carry outside
comments, else empty); `node .agent/skills/github-review/scripts/ledger.mjs record --kind pr --number 1 --verdict nope`
exits 1; `ls .omp/skills/github-review/SKILL.md`; `harness doctor` has no new errors.

### Step 8 — Repo settings [dev]

Appended to § Human queue as `CW-8`; row CW-8 set to `human`.

- [ ] **Rulesets** (Settings → Rules → Rulesets):
  - New ruleset `dev`: target branch `dev`; rule "Require status checks to pass" with `CI`
    (GitHub Actions), "Require branches to be up to date" **off**; bypass list: Repository admin
    (always), so direct pushes to `dev` and the post-release reset still work.
  - Existing "Master Rule 1": required checks `CI`, `axe`, `lighthouse`; "Require branches to be
    up to date" **off**; enforcement **Active**. This also closes QP-10 step 3.
- [ ] **Squash message** (Settings → General → Pull Requests): "Allow squash merging" on, default
  commit message "Pull request title and description".
- [ ] **Labels**, after deleting the feature issues: `node scripts/sync-labels.mjs --prune`, then
  `node scripts/sync-labels.mjs --check` prints `no drift`.
- [ ] Keep Actions → "Approval for running fork pull request workflows" at "first-time
  contributors" (already set).

Verify: `gh api repos/ianyimi/vex/rulesets --jq '.[] | [.name, .enforcement] | @tsv'` shows both
rulesets `active`; `gh api repos/ianyimi/vex --jq '[.squash_merge_commit_title, .squash_merge_commit_message] | @tsv'`
prints `PR_TITLE	PR_BODY`.

### Step 9 — Bookkeeping [agent]

- [ ] Board: CW-1…7 and CW-9 `done`, CW-8 `human`; § Log line; a second § Log line for LK:
      "the `planned` issues are being deleted before launch and the roadmap no longer links them
      (contributor-workflow decision 9); LK decision 12's 'link the `planned` issues' needs
      re-deciding"
- [ ] `harness tasks add "Contributor workflow (spec 2026-11-10-contributor-workflow)" --to in-progress`
      at start; moved to done at the end
- [ ] Session log appended (`harness log append`); commit message drafted into the commit ledger
      per the commit skill (message-only)

Verify: `harness state` lists the spec; the board's CW rows read as above.

## Verification

Run once all `[agent]` steps are done, and fix failures before stopping:

- `node --test scripts/check-pr-title.test.mjs .agent/skills/github-review/scripts/ledger.test.mjs`
- `actionlint .github/workflows/*.yml`
- `node -e` check that every `.github/labeler.yml` key exists in `.github/labels.yml`
- `node scripts/sync-labels.mjs --check` shows only the drift listed in Step 4
- `pnpm --filter docs build`
- `pnpm exec prettier --check CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md .github/PULL_REQUEST_TEMPLATE.md`
- The new docs pages' commands run on this tree: `pnpm turbo run test typecheck --filter=@vexcms/react`,
  `pnpm --filter @vexcms/react exec vitest run src/media`, `pnpm build --filter='./packages/*'`
- VW lint of every edited public surface against `voice-and-wording.md` (sentence-case headings on
  new pages, backticked identifiers, first-person maintainer voice, canonical docs URLs with
  trailing slash, no hype, `public-copy.md` strings byte-identical)
- `rg -n "\.agent|harness " apps/docs/src/content/docs --glob '!api/**'` returns nothing
- `harness doctor` — no new errors
