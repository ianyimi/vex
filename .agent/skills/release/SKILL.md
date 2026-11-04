---
name: release
description: Audit everything shipped since the last release (dev vs master) — missed docs, missing changesets/CHANGELOG entries, roadmap drift, template drift — fix it, version the packages if that has not been done yet, and write the release PR message. Release-only: never writes the working-tree feature commit (that is the `commit` skill). Triggers on "release", "/release", "write the release", "release message". Fully autonomous; message-only by default.
harness_model_role: slow
---

# Release

**Fully autonomous — ask the developer NOTHING** (same rule as `commit`). Everything needed is
in git, `.changeset/`, the CHANGELOGs, the session logs and specs. Unknowables go in the final
summary.

One output, always: **the release message** — the `dev` → `master` PR title/body covering every
commit since the last release, plus any docs/changeset fixes the audit made. The working-tree
feature commit is NOT this skill's job: run `commit` (or `commit-release`) for that.

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.
4. Release range: `BASE=$(git merge-base master dev)`; `git log --oneline $BASE..dev`.
   Last released versions: `git show master:packages/core/package.json | grep version`.
   If `dev` has no commits beyond `master` and the tree is clean → stop: nothing to release.
5. **Classify the working tree** (`git status --porcelain`):
   - **clean** — everything is committed;
   - **version-bump only** — only `.changeset/` deletions/`pre.json`, `CHANGELOG.md`s,
     `package.json` versions and template version syncs (the output of `pnpm version:packages`);
   - **has uncommitted feature work** — anything else. Do not write a commit message for it;
     note it at the top of the summary ("run `commit` first") and treat those files as NOT part
     of the release. If it is mixed with version-bump files, list the exact pre-bump file set
     so the developer can commit it separately before the `release:` commit.
6. **Has versioning run?** Versioning is pending when `.changeset/` holds changeset files that
   `pre.json`'s `changesets` array has not consumed (or, outside pre mode, any changeset file
   exists) — `pnpm changeset status --verbose` confirms. Record `pending` or `done`.

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
   - **Changesets / CHANGELOGs.** Map each `feat`/`fix`/`!` commit touching a published package
     (`@vexcms/*`, `create-vexcms`) to a changeset (`git diff --name-status $BASE..dev -- .changeset`
     + untracked ones) — or, when versioning is `done`, to an entry in the new version's
     CHANGELOG section.
     - Versioning `pending`: write a missing changeset (`patch` in pre mode — see
       `commit/references/commit-format.md`).
     - Versioning `done`: do NOT write a changeset (it would target the NEXT version); add the
       missing entry to the new version's CHANGELOG section instead.
     Verify with `pnpm changeset status --verbose`.
   - **Templates.** `node scripts/template-diff.mjs --app apps/test` and `--app apps/www`;
     mirror structural fixes via `template-sync`, note what was deliberately left.
   - Audit edits to docs/changesets are working-tree changes: list them with an explicit file
     list and a short `docs:`/`chore:` commit message file (next free
     `.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.N.md`) so they can be committed BEFORE
     versioning when versioning is pending, or as a follow-up when it is done.
2. **Version the packages — only if `pending`.** From the workspace root run
   `pnpm version:packages` (`changeset version` + `scripts/sync-template-versions.mjs`) AFTER the
   audit's changesets exist. It consumes pending changesets, bumps every package version,
   writes CHANGELOGs and syncs template versions. Record the bumped files and new versions. If
   it fails, report 🔴 and keep every message file. When `done`, never run it again.
3. **Write the release message** as `.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.N.md`
   (next free N):
   - Title: `release: <new version> — <3–5 headline features>`. New version from the bumped
     `package.json`s.
   - Opening paragraph: range (`master` version → new version), commit count, which release
     commits on `dev` are already on npm.
   - One bold-headed paragraph per feature area across the whole range (not per commit),
     symbols named, behavior contrasted with before.
   - `**Changesets by package**` list — every changeset `pre.json` consumed into a version not
     yet on `master`, grouped by package; packages with only dependency bumps say so.
   - One combined `BREAKING CHANGE:` footer with migration for every breaking changeset in the
     range (say explicitly when the newest version itself is non-breaking).
   - `Spec: .agent/docs/product/v0.1.0-launch-plan.md` (or the current plan) and `Log:`.
4. **Ledger.** Append a `## HH:MM — <release title>` section to `.agent/docs/commits/MM-DD-YYYY.md`:
   raw path, a note that it is the PR title/body, whether versioning was run by this skill or
   already done, and the commit blocks in order — (a) any audit-fix commit with its exact file
   list, (b) `git add -A && git commit -F <release raw file>` for the `release:` version-bump
   commit (rewrite `-A` to the explicit bump file list if uncommitted feature work is present).
   Plain Markdown.
5. **Summary.** Gate 🔴 items first; then the version range, new package versions, whether
   versioning ran, changesets/CHANGELOG entries the audit added, docs files the audit touched,
   the commit blocks in order, and the full release message.

Never run `git commit`, `git push`, or open the PR unless `workflow.commit_mode` is
`agent-commits` and the developer confirms (one question, as in `commit`).
