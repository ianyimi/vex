---
description: Draft a Changesets release-notes entry for vexcms by reviewing commits since the last changeset. Produces copy-pasteable output for `pnpm changeset`.
invoke: "changeset"
---

# Changeset — vexcms

Review recent commits and produce a release-notes description ready to paste into `pnpm changeset`.

This mirrors the `/commit` prompt's style but operates over **a range of commits** instead of a single diff, and outputs text shaped for Changesets.

> **Questions:** Use `ask_user_question` for every question. Never write question lists as plain text.

---

## Step 1 — Determine the commit range

Run:

```bash
ls -t .changeset/*.md 2>/dev/null | grep -v '^.changeset/README' | head -5
git log --pretty=format:"%h %s" -50
```

Find the most recent `.changeset/*.md` file (ignore `README.md` and `config.json`). Its git commit is the anchor — everything after it is unreleased.

If no changeset files exist, use the last `chore(repo): release` / `version:packages` commit, or fall back to the last 20 commits.

Report the range to the developer:

> Reviewing commits since `<short-hash>` (<commit subject>):
> <list of commits with short hash + subject>

Ask:
> Is this the right range?
> A) Yes, proceed
> B) Extend further back — go back N more commits
> C) Narrow — only include commits after <hash>

---

## Step 2 — Classify per-package impact

For each commit in the range:

1. Run `git show --stat <hash>` to see which files changed.
2. Map file paths to workspace package names using the table below:

| Path prefix | Package |
|-------------|---------|
| `packages/core/` | `@vexcms/core` |
| `packages/cli/` | `@vexcms/cli` |
| `packages/next/` | `@vexcms/next` |
| `packages/react/` | `@vexcms/react` |
| `packages/better-auth/` | `@vexcms/better-auth` |
| `packages/richtext-plate/` | `@vexcms/richtext-plate` |
| `packages/file-storage-convex/` | `@vexcms/file-storage-convex` |
| `packages/create-vexcms/` | `create-vexcms` |

Skip commits that only touch: `apps/**`, `.pi/**`, `agent-os/**`, `memory/**`, `scripts/**`, root config (`turbo.json`, `package.json`, `eslint.config.mjs`, `pnpm-lock.yaml`), docs-only (`*.md`, `apps/docs/**`). These don't get changesets.

3. Classify bump type per package based on commit prefix + body:
   - `feat(...)!` or `BREAKING CHANGE` in body → **major**
   - `feat(...)` → **minor**
   - `fix(...)`, `perf(...)`, `refactor(...)` that changes runtime behavior → **patch**
   - `chore`, `docs`, `test`, `style`, `ci` on a package → usually **no changeset needed** (ask)
   - Internal-only refactors with no public-API change → **no changeset** (ask)

---

## Step 3 — Draft the changeset

Produce output in the exact format Changesets expects. Show the developer the full YAML frontmatter + markdown body so they can paste it into `pnpm changeset` (which prompts for packages, then bump, then description).

```
---
"@vexcms/core": minor
"@vexcms/react": patch
"@vexcms/next": patch
---

<one-line headline describing the release theme>

### @vexcms/core

- <bullet summarizing change, user-facing language — what a consumer needs to know>
- <...>

### @vexcms/react

- <bullet>

### @vexcms/next

- <bullet>

<optional "Breaking changes" subsection with migration notes if any package is `major`>
```

**Bullet-writing rules:**

- Write for **package consumers**, not contributors. Describe the *effect*, not the commit.
  - ✅ `Add color field type with 6/8-digit hex validation`
  - ❌ `feat(core): add ColorFieldInput type`
- Omit internal refactors and test-only changes.
- Group related commits into one bullet.
- For **breaking changes**, add a `### Breaking changes` subsection with before/after migration snippets.
- Preserve the `!` breaking marker from commit subjects as a warning icon (⚠️) in the bullet.

---

## Step 4 — Review with developer

Show the drafted changeset and ask:

> Changeset draft:
> ```
> <full output>
> ```
> A) Looks good — create `.changeset/<random-slug>.md` with this content
> B) Edit — tell me what to change
> C) Split — produce multiple changesets (e.g. one per package, or one per feature)
> D) Cancel — I'll run `pnpm changeset` manually

If A: ask the developer for a slug (or generate one like `clever-ferrets-hide` — two adjectives + a noun). Write `.changeset/<slug>.md` with the drafted content.

If D: just print the summary so they can paste into the interactive `pnpm changeset` prompt.

---

## Step 5 — Log it

Append to today's ideaLog (`.pi/agent-docs/implementation-log/YYYY/MM/YYYY-MM-DD.ideaLog.md`):

```markdown
## Changeset — <HH:MM>

Range: <first-hash>..HEAD (<N commits>)
Packages: <list with bumps>
File: .changeset/<slug>.md (or "printed only")
```

---

## What NOT to include in changesets

- Changes to `apps/www`, `apps/docs`, `.pi/`, `agent-os/`, `memory/`, `scripts/`
- Root tooling (`turbo.json`, root `package.json`, ESLint config, CI)
- `@vexcms/tsconfig` (not published standalone — or if it is, only when its `extends` target changes)
- Test-only commits (`test(...)`)
- Pure doc commits (`docs(...)`) unless they ship with a package (README updates to a published package *do* warrant a `patch`)
- Revert commits — merge them with the original feat/fix into a single bullet, or omit if the revert restored pre-release state
