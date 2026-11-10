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
   (`.agent/skills/release/SKILL.md`), which owns every release step (audit, message,
   ledger, versioning mode). Versioning is CI's version PR on `master` by default, or a local
   `pnpm version:packages` when the developer's arguments ask for it (release skill's **local**
   mode). This skill only fixes the ORDER.

## Preflight
1. Run the `release` skill's Preflight (it includes the `commit` Preflight checks, the release
   range, the local-version-bump check and the next version).

## Steps

1. **`release` step 1 (audit) FIRST**, over `$BASE..dev` PLUS the working tree, so the
   audit's docs/changeset fixes ride the working-tree commit instead of a separate one.
   Changesets always stay pending on `dev`, so the audit writes changesets, never CHANGELOG
   entries.
2. **Run the `commit` skill** in full (its steps 1–11). The audit's edits are now part of the
   working tree and land in its single commit (P-016); its body gets a `**Docs.**` /
   release-audit paragraph naming what the audit fixed.
3. **`release` steps 2–4** (write the release message as the next free `.commit.N.md` after the
   commit skill's files, ledger, summary). The ledger's release section comes after the
   commit's section.
4. **Local mode only — `release` step 4 (version) LAST**, after the gate, so the bump rides the
   same working-tree commit. Add the version files to its ledger file list and a `**Release.**`
   paragraph to its body. The commit can't be split from the bump: `create-vexcms/package.json`
   and the templates carry both feature and version edits.
5. **Summary.** The commit skill's summary, then the `release` skill's summary as a
   **Release** section.

Never run `git commit`, `git push`, or open the PR unless `workflow.commit_mode` is
`agent-commits` and the developer confirms (one question, as in `commit`). Run
`pnpm version:packages` only in the release skill's **local** mode.
