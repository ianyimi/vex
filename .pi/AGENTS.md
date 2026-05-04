# vexcms — Agent Context

Convex-native, TypeScript-first headless CMS. MIT OSS. High-care project — **developer implements, agent specs and reviews**.

## Mission
→ `.pi/agent-docs/product/mission.md`

## Tech Stack
→ `.pi/agent-docs/product/tech-stack.md`

Summary: Turborepo + pnpm · TypeScript · Next.js 16 / React 19 · Convex · Better Auth · Tailwind 4 · shadcn/ui · TanStack Query/Form/Table · Vitest · Playwright · Plate richtext. 2 apps (`www`, `docs`) + 9 packages under `@vexcms/*`.

## Dev Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Turbo dev across all packages (concurrency 11) |
| `pnpm dev:app` | Next.js admin only — `apps/www` on **port 3020** |
| `pnpm --filter <pkg> <script>` | Target a single workspace package |
| `pnpm typecheck` | Turbo typecheck across workspace |
| `pnpm test` | Vitest across workspace (prefer per-package filter) |
| `pnpm test:e2e` | Playwright |
| `pnpm lint` / `lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}` |
| `pnpm changeset` | Release-notes entry |
| `pnpm release` | Build + `changeset publish` |

→ Full per-package command table: `.pi/agent-docs/product/dev-processes.md`

## Workflow Tier

**High-care.** Developer implements all production code. Agent writes specs, reviews, points out issues. Agent does **not** edit `packages/*/src/**` unless explicitly asked.

## Verification
→ `.pi/agent-docs/standards/verification.md`

- Primary: browser at `http://localhost:3020` via built-in `browse` tool
- `pnpm --filter <pkg> typecheck && pnpm --filter <pkg> test` after edits
- Dev server errors: `tmux_pane({ pane: "project-vex:0.0" })` (Next.js/tsup) · `tmux_pane({ pane: "project-vex:0.1" })` (Convex)

## Tmux Workspace
→ `.pi/agent-docs/product/tmux-workspace.md`

Session `project-vex` — two always-running dev panes in window 0:
- `project-vex:0.0` → `pnpm dev` (Next.js + all tsup watchers)
- `project-vex:0.1` → `pnpm dev:vex` (Convex + vex CLI)

**Never start duplicate dev processes.** Inspect live output with `tmux_pane` before browsing after a code change. Full pane map, capture commands, and rules in the linked file.

## Debug Hierarchy
→ `.pi/agent-docs/standards/debug-hierarchy.md`

UI-first: browser console → `project-vex:0.0` (Next.js) → `project-vex:0.1` (Convex) → `git diff` → ideaLog → Vitest output → changed spec files.

## Agent Harness

The full harness for this project lives in `.pi/` — it includes `AGENTS.md` (this file), `agent-docs/` (standards, specs, product docs, implementation log), `prompts/`, and any project-local skills.

Base harness (global, all projects): `~/.pi/agent/` — sourced from chezmoi at `~/dotfiles/pi-agent-base/` (see below).

→ Run `/sync-tmux-layout` to re-scan the session and update `tmux-workspace.md` + the chezmoi tmuxinator config.

## Standards
→ `.pi/agent-docs/standards/` — `global/`, `backend/`, `frontend/`, `testing/`, `memory/` (JSDoc + type colocation), `adding-a-field-type.md`, `developer-preferences.md`.

Key rules baked into prompts (full list in `developer-preferences.md`):
- Framework adapters use framework prefix (`NextAdminPage`), not `Vex*`
- Convex mutation payload is `data: v.any()`, never `fields`
- Field `types.ts` colocated with `config.ts`
- JSDoc: Input types get full defaults block + examples; resolved types get one-liners + `@see`

## Active Specs
→ `.pi/agent-docs/specs/` (new specs land here as `YYYY-MM-DD-HHMM-<slug>/`)
→ `.pi/agent-docs/specs/archive/` (legacy numbered specs from `agent-os/`)

## IdeaLog
→ `.pi/agent-docs/implementation-log/YYYY/MM/`

## Prompts Available

| Prompt | Invoke | Purpose |
|--------|--------|---------|
| 1-dev-spec | `/dev-spec` | Write scoped implementation spec (monorepo-aware) |
| 2-sync-spec | `/sync-spec` | Extract patterns → update prompts; run typecheck/test upkeep |
| 3-commit | `/commit` | Conventional commit with required package scope |
| changeset | `/changeset` | Draft Changesets release notes from commits since last changeset |
| document | `/document` | JSDoc with Input-vs-resolved rule; runs typecheck+test |
| debug | `/debug` | Systematic bug investigation (UI-first, reads `debug-hierarchy.md`) |
| build-prompt | `/build-prompt` | Create a new project-specific prompt |
| review | `/review` | Code review against standards |
| research · learn | `/research` · `/learn` | External library / API investigation |

## Git Worktrees

This is a **bare git repo**. Two worktrees are always available:

| Worktree | Path | Branch | Purpose |
|----------|------|--------|---------|
| `dev` | `/Users/zaye/Documents/Projects/vex.git/dev` | `rebuild` | **Active development — all work happens here** |
| `agents` | `/Users/zaye/Documents/Projects/vex.git/agents` | `master` | Read-only reference — inspect old implementation without touching dev |

**Rules:**
- All file edits go to `dev/` — never edit files in `agents/`
- Use `agents/` to read existing implementations before writing specs or new code
- Never run `git checkout` inside `dev/` — switch branches via worktree commands on the bare repo if ever needed
- To inspect master branch code: `cat /Users/zaye/Documents/Projects/vex.git/agents/packages/...`
- To check which branch each worktree is on: `git -C /Users/zaye/Documents/Projects/vex.git worktree list`

---

## Dotfiles & Base Harness

| Location | Purpose |
|----------|---------|
| `~/.local/share/chezmoi/` | Chezmoi source — source of truth for all dotfiles |
| `~/.local/share/chezmoi/pi-agent-base/` | Source of truth for the global Pi agent harness |
| `~/.pi/agent/` | Live global harness (auto-synced from `pi-agent-base/` on `cma`) |
| `~/.local/share/chezmoi/dot_config/tmuxinator/` | Tmuxinator session configs managed by chezmoi |

**`cma` alias** — runs `chezmoi apply && source ~/.zshrc`. Use this after editing anything in the chezmoi source to deploy changes to the live system.

To propagate a pattern discovered in this project back to all projects: edit the relevant file in `~/.local/share/chezmoi/pi-agent-base/`, then run `cma`.

## Migration Note

`agent-os/`, `memory/`, and `.claude/` directories still exist on disk but are **deprecated**. Source of truth is `.pi/`. Safe to delete the originals once you've verified nothing downstream (CI, scripts) references them.
