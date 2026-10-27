---
name: commit-release
description: Run the commit skill for the working tree, then audit everything shipped since
  the last release (dev vs master) — missed docs, missing changesets, roadmap drift — fix
  it, and write the release PR message. Triggers on "commit-release", "/commit-release",
  "commit and release", "prepare the release". Fully autonomous; message-only by default.
harness_model_role: slow
---

# Commit + Release

**Fully autonomous — ask the developer NOTHING** (same rule as `commit`). Everything needed is
in git, `.changeset/`, the session logs and specs. Unknowables go in the final summary.

Two outputs, always:
1. **The working-tree commit** — produced by the `commit` skill, unchanged.
2. **The release message** — the `dev` → `master` PR title/body covering every commit since
   the last release, plus any docs/changeset fixes the release audit found.

## Preflight
1. Run the `commit` skill's Preflight.
2. Release range: `BASE=$(git merge-base master dev)`; `git log --oneline $BASE..dev`.
   Last released versions: `git show master:packages/core/package.json | grep version`.
   If `dev` has no commits beyond `master` and the tree is clean → stop: nothing to release.

## Steps

1. **Release audit FIRST** (so its fixes ride the working-tree commit). For the whole range
   `$BASE..dev` plus the working tree:
   - **Surface list.** `git diff --stat $BASE -- 'packages/*/src/**'` and each commit's body
     (`git log --format='%h %s%n%b' $BASE..dev`). List every added/removed/renamed export,
     config key, field/option, CLI flag, component prop and user-visible behavior.
   - **Docs sweep over the full range** — the `commit` skill's step 8, but driven by the
     range diff instead of the working tree: field pages, guides, `roadmap.md`, the www
     `Roadmap` block + `convex/seed.ts`, every `README.md`. Grep old AND new spellings.
     Earlier commits often shipped without docs; this is where they get caught. Delegate
     independent slices to subagents with the verified facts; review their output against
     the code before accepting (factories in `packages/core/src/fields/<type>/` are truth).
   - **Changesets.** `git diff --name-status $BASE..dev -- .changeset` + untracked ones.
     Map each `feat`/`fix`/`!` commit and the working tree to a changeset. Write a changeset
     (`patch` in pre mode — see `commit/references/commit-format.md`) for every published
     package (`@vexcms/*`, `create-vexcms`) change that has none. Verify with
     `pnpm changeset status --verbose`.
   - **Templates.** `node scripts/template-diff.mjs --app apps/test` and `--app apps/www`;
     mirror structural fixes via `template-sync`, note what was deliberately left.
2. **Run the `commit` skill** in full (its steps 1–11). The audit's doc and changeset edits are
   now part of the working tree and land in its single commit (P-016); its body gets a
   `**Docs.**` / release-audit paragraph naming what the audit fixed.
3. **Write the release message** as `.agent/docs/session-log/YYYY/MM/YYYY-MM-DD.commit.N.md`
   (next free N after the commit skill's files):
   - Title: `release: <next version> — <3–5 headline features>`. Next version from
     `pnpm changeset status --verbose`.
   - Opening paragraph: range (`master` version → new version), commit count, which release
     commits on `dev` are already on npm.
   - One bold-headed paragraph per feature area across the whole range (not per commit),
     symbols named, behavior contrasted with before.
   - `**Changesets by package**` list — every changeset in `.changeset/` that `pre.json`
     has not yet consumed into a published version, grouped by package; packages with only
     dependency bumps say so.
   - One combined `BREAKING CHANGE:` footer with migration for every breaking changeset in
     the range.
   - `Spec: .agent/docs/product/v0.1.0-launch-plan.md` (or the current plan) and `Log:`.
4. **Ledger.** Append a `## HH:MM — <release title>` section to `.agent/docs/commits/MM-DD-YYYY.md`
   after the commit's section: raw path, note that it is the PR title/body (not a commit in
   this tree), and that the version bump is a separate `release:` commit made from the
   files step 5 changes. Plain Markdown.
5. **Version the packages — last.** From the workspace root (normally the current
   directory), run `pnpm version:packages` (`changeset version` +
   `scripts/sync-template-versions.mjs`). It consumes the pending changesets, bumps every
   package version, writes CHANGELOGs and syncs template versions. Then
   `git status --porcelain` and record the bumped files and new versions; add a
   `git add -A && git commit -F <release raw file>` block to the release ledger section
   (it applies after the working-tree commit is made). If the command fails, report 🔴 and
   keep every message file.
6. **Summary.** The commit skill's summary, then a **Release** section: version range,
   new package versions, changesets added by the audit, docs files the audit touched
   (beyond the commit's own sweep), the full release message, and any gate 🔴 items first.

**Ordering caveat:** step 5 rewrites `.changeset/` and `package.json` files in the working
tree, so the developer commits the working-tree message first only if they commit
before step 5 runs, or stages its files by list. When the commit skill's file list was
`git add -A`, rewrite that block to the explicit pre-bump path list.

Never run `git commit`, `git push`, or open the PR unless `workflow.commit_mode` is
`agent-commits` and the developer confirms (one question, as in `commit`).
