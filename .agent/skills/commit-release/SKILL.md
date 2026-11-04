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
2. **The release message** — produced by the `release` skill
   (`.agent/skills/release/SKILL.md`), which owns every release step (audit, versioning,
   message, ledger). This skill only fixes the ORDER of the two.

## Preflight
1. Run the `release` skill's Preflight (it includes the `commit` Preflight checks, the release
   range, and the versioning-pending check).

## Steps

1. **`release` step 1 (audit) FIRST**, over `$BASE..dev` PLUS the working tree, so the
   audit's docs/changeset fixes ride the working-tree commit instead of a separate one.
   Versioning is `pending` at this point (the working tree is unreleased), so the audit writes
   changesets, not CHANGELOG entries.
2. **Run the `commit` skill** in full (its steps 1–11). The audit's edits are now part of the
   working tree and land in its single commit (P-016); its body gets a `**Docs.**` /
   release-audit paragraph naming what the audit fixed.
3. **`release` steps 2–5** (version the packages, write the release message as the next free
   `.commit.N.md` after the commit skill's files, ledger, summary). The ledger's release section
   comes after the commit's section.
4. **Summary.** The commit skill's summary, then the `release` skill's summary as a
   **Release** section.

**Ordering caveat:** versioning rewrites `.changeset/` and `package.json` files in the working
tree, so the developer commits the working-tree message first only if they commit before
versioning runs, or stages its files by list. When the commit skill's file list was
`git add -A`, rewrite that block to the explicit pre-bump path list.

Never run `git commit`, `git push`, or open the PR unless `workflow.commit_mode` is
`agent-commits` and the developer confirms (one question, as in `commit`).
