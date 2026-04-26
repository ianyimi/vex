---
name: 3-commit
description: Stage and commit vexcms changes with a conventional-commit message (scoped to package name). Prompts for a changeset when public packages change.
invoke: "commit"
---

# Commit — vexcms

Stage and commit the current changes with a well-formed message, then record it in the implementation log.

---

> **Questions:** Use `ask_user_question` for every question. Never write question lists as plain text.

## Process

### Step 1 — Read current state

- `git status`
- `git diff`
- `git diff --cached`

### Step 2 — Ask what to include

If untracked / unstaged files exist, list them and ask which to include. Never `git add .` or `git add -A`.

### Step 3 — Find relevant ideaLog entries

1. List files in `.pi/agent-docs/implementation-log/YYYY/MM/` for today and the previous 2 days.
2. Scan each for entries mentioning the same files/feature.
3. Collect relative paths for `Refs:` in the commit body.

If none, skip silently.

### Step 4 — Draft commit message

```
<type>(<scope>): <short summary>

<body — only when the why is non-obvious>

Refs: <ideaLog path(s)>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `style`, `ci`.

<!-- sync-spec:commit-conventions -->
**vexcms conventions:**

- **Scope is required** and must be a workspace name (unprefixed) or `repo` for root-level changes:
  - Packages: `core`, `cli`, `next`, `react`, `better-auth`, `richtext-plate`, `file-storage-convex`, `create-vexcms`, `tsconfig`
  - Apps: `www`, `docs`
  - Root / tooling: `repo` (for `turbo.json`, root scripts, ESLint config, CI, root `package.json`)
  - Multiple packages touched: pick the primary one, mention the others in the body
- **Breaking changes** affecting a published package: add `!` after scope — `feat(core)!: rename field config shape`. Must also be accompanied by a changeset marked `major`.
- **Changesets:** if the commit changes the public surface of any `@vexcms/*` package or `create-vexcms`, the commit body must include:
  - A `Changeset:` line with either `pending` (will run `pnpm changeset` next) or the path to the `.changeset/*.md` entry just created.
- Summary: imperative mood, ≤ 72 chars, no trailing period.
- Body: explain WHY, not WHAT. Skip when the summary is self-explanatory.
- Never mention "as per spec" or ticket numbers.
<!-- /sync-spec:commit-conventions -->

**Examples:**

```
feat(core): add color field type

Mirrors the shape of the text field but validates a 6- or 8-digit hex.
Needed for the brand-theme block in apps/www.

Changeset: .changeset/clever-ferrets-hide.md
Refs: .pi/agent-docs/implementation-log/2026/04/2026-04-21.ideaLog.md
```

```
fix(react): preserve array-field default values on first render
```

```
chore(repo): bump turbo to 2.8.11
```

### Step 5 — Confirm

Show the drafted message and ask the developer to confirm, edit, or cancel.

### Step 6 — Commit

On confirmation:

```
git add <approved files>
git commit -m "<message>"
```

Report hash + summary.

### Step 7 — Post-commit changeset check

If any staged file matched `packages/*/src/**` for a published package (all except `@vexcms/tsconfig`) or `packages/create-vexcms/**`:

Ask:
> This commit touched a published package's source. Create a changeset now?
> A) Yes — run `pnpm changeset` interactively
> B) Draft one via `/changeset` — I'll summarize recent commits for the release notes
> C) Skip — already have a changeset / not a publishable change

### Step 8 — Append to implementation log

Get the current date and time in PST/PDT before writing:

```bash
TZ='America/Los_Angeles' date '+%Y-%m-%d %H:%M'
```

Use the output for both the filename (`YYYY-MM-DD`) and the timestamp in the heading. Never use the system clock directly — it may be UTC.

Append to `.pi/agent-docs/implementation-log/YYYY/MM/YYYY-MM-DD.commit.md` (create if missing, never overwrite):

```markdown
## <HH:MM> — <short hash> — <summary line>

<body if present>

Files: <comma-separated list>
```

---

## Monorepo scope reference

Detected automatically from `turbo.json` + `pnpm-workspace.yaml`. Scopes for vexcms:

| Scope | Path |
|-------|------|
| `core` | `packages/core` |
| `cli` | `packages/cli` |
| `next` | `packages/next` |
| `react` | `packages/react` |
| `better-auth` | `packages/better-auth` |
| `richtext-plate` | `packages/richtext-plate` |
| `file-storage-convex` | `packages/file-storage-convex` |
| `create-vexcms` | `packages/create-vexcms` |
| `tsconfig` | `packages/tsconfig` |
| `www` | `apps/www` |
| `docs` | `apps/docs` |
| `repo` | root (`turbo.json`, root scripts, ESLint, CI) |

---

## What to avoid

- `git add .` / `git add -A` without showing the developer
- Skipping the confirmation step
- Committing `.env*`, secrets, `node_modules`, `.turbo`, `dist`, `.next`
- Amending a pushed commit
- Forgetting the changeset for a published-package change
