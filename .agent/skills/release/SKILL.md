---
name: release
description: Audit everything shipped since the last release (dev vs master) — missed docs, missing changesets, roadmap drift, template drift — fix it, and write the release PR message. Never versions packages: the Release workflow's version PR does that on master. Release-only: never writes the working-tree feature commit (that is the `commit` skill). Triggers on "release", "/release", "write the release", "release message". Fully autonomous; message-only by default.
harness_model_role: slow
---

# Release

**Fully autonomous — ask the developer NOTHING** (same rule as `commit`). Everything needed is
in git, `.changeset/`, the CHANGELOGs, the session logs and specs. Unknowables go in the final
summary.

One output, always: **the release message** — the `dev` → `master` PR title/body covering every
commit since the last release, plus any docs/changeset fixes the audit made. The working-tree
feature commit is NOT this skill's job: run `commit` (or `commit-release`) for that.

**Versioning is CI's job, never this skill's.** On every push to `master`,
`.github/workflows/release.yml` runs `changesets/action`: with unconsumed changesets it runs
`pnpm version:packages` and opens/updates the "chore: version packages" PR; merging that PR
leaves no changesets, so the next run publishes (`pnpm release`). Running
`pnpm version:packages` on `dev` consumes the changesets early, and any changeset added before
the merge makes CI bump again — that is how `0.1.0-alpha.31` was skipped (npm went 30 → 32).
So on `dev` changesets always stay pending, and this skill writes changesets, never CHANGELOG
entries or version bumps.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.
4. Release range: `BASE=$(git merge-base master dev)`; `git log --oneline $BASE..dev`.
   Last released version: `git show master:packages/core/package.json | grep version`.
   If `dev` has no commits beyond `master` and the tree is clean → stop: nothing to release.
5. **Is `dev` behind the last release?** `git log --oneline dev..master`. Commits there (the
   merged version PR, publish tags) mean `master`'s bumped `package.json`s, CHANGELOGs and
   `pre.json` never came back to `dev`. Put "merge `master` into `dev` first" at the top of the
   summary; the audit still runs.
6. **Classify the working tree** (`git status --porcelain`):
   - **clean** — everything is committed;
   - **local version bump** — `.changeset/` deletions, `pre.json`, `CHANGELOG.md`s and
     `package.json` version edits (someone ran `pnpm version:packages` locally). Flag it 🔴 at
     the top of the summary: do not commit it; restore those paths
     (`git restore .changeset 'packages/*/package.json' 'packages/*/CHANGELOG.md' apps/www/package.json packages/create-vexcms/templates`)
     so CI versions on `master`;
   - **has uncommitted feature work** — anything else. Do not write a commit message for it;
     note it at the top of the summary ("run `commit` first") and treat those files as NOT part
     of the release.
7. **Next version.** `pnpm changeset status --verbose` lists the pending changesets and the
   version the bot's version PR will produce ("Packages to be bumped at patch" → every package
   in the `fixed` group at the same `0.1.0-alpha.N`). Record it as the release version. When it
   exits 1 with "no changesets were found", nothing is pending yet: the audit (step 1) must
   write them, then re-run it — a merge with no changesets makes CI publish nothing.

## Steps

1. **Release audit** over `$BASE..dev` (plus nothing from uncommitted feature work):
   - **Surface list.** `git diff --stat $BASE -- 'packages/*/src/**'` and each commit's body
     (`git log --format='%h %s%n%b' $BASE..dev`). List every added/removed/renamed export,
     config key, field/option, CLI flag, component prop and user-visible behavior.
   - **Docs sweep over the full range** — the `commit` skill's step 8, driven by the range diff:
     field pages, guides, `roadmap.md`, the www `Roadmap` block + `convex/seed.ts`, every
     `README.md`. Grep old AND new spellings. Delegate independent slices to subagents with the
     verified facts; review their output against the code before accepting (factories in
     `packages/core/src/fields/<type>/` are truth).
   - **Changesets.** Map each `feat`/`fix`/`!` commit touching a published package
     (`@vexcms/*`, `create-vexcms`) to a changeset (`git diff --name-status $BASE..dev -- .changeset`
     + untracked ones). Write any missing one (`patch` in pre mode — see
     `commit/references/commit-format.md`). Never edit a CHANGELOG by hand: CI generates them
     from the changesets. Verify with `pnpm changeset status --verbose`.
   - **Templates.** `node scripts/template-diff.mjs --app apps/test` and `--app apps/www`;
     mirror structural fixes via `template-sync`, note what was deliberately left.
   - Audit edits to docs/changesets are working-tree changes: list them with an explicit file
     list and a short `docs:`/`chore:` commit message file (next free
     `.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.N.md`) to commit on `dev` before the PR.
2. **Write the release message** as `.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.N.md`
   (next free N):
   - Title: `release: <next version> — <3–5 headline features>`, the version from Preflight 7.
   - Opening paragraph: range (`master` version → next version), commit count, and that the
     version PR CI opens after the merge applies the bump and publishes on merge.
   - One bold-headed paragraph per feature area across the whole range (not per commit),
     symbols named, behavior contrasted with before.
   - `**Changesets by package**` list — every pending changeset in the range, grouped by
     package; packages that only ride the fixed-group bump say so.
   - One combined `BREAKING CHANGE:` footer with migration for every breaking changeset in the
     range (say explicitly when the release itself is non-breaking).
   - `Spec: .agent/docs/product/v0.1.0-launch-plan.md` (or the current plan) and `Log:`.
3. **Ledger.** Append a `## HH:MM — <release title>` section to `.agent/docs/commits/MM-DD-YYYY.md`:
   raw path, a note that it is the `dev` → `master` PR title/body (not a commit), and any
   audit-fix commit block with its exact file list. Plain Markdown.
4. **Summary.** 🔴 items first (local version bump, `dev` behind `master`, gate failures); then
   the version range, the next version, changesets the audit added, docs files the audit
   touched, the commit blocks in order, the full release message, and the reminder: merge the
   PR, then review and merge the bot's "chore: version packages" PR to publish.

Never run `git commit`, `git push`, `pnpm version:packages`, or open the PR unless
`workflow.commit_mode` is `agent-commits` and the developer confirms (one question, as in
`commit`) — and even then never run `pnpm version:packages`.
