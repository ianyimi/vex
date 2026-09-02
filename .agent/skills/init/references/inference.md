# Init Inference — What to Detect Before Asking

Read these sources per phase; present inferences for confirmation instead of asking.

## Existing agent setups (mine FIRST — but NEVER adopt as fact)

An existing `.pi/`, `.claude/`, `CLAUDE.md`, `AGENTS.md`, or `.cursorrules` records how this
project once wanted to be worked on — **the code is usually newer than these docs**. The
default is verify-then-adopt, never copy-then-trust:

1. Read the developer's **trusted documents** first (gathered in the opening question) — they
   are the accuracy baseline.
2. For every claim in a mined doc, check it against the actual codebase before it enters the
   harness: commands exist in package.json/Makefile? packages still in the manifest? paths
   still real? patterns still used in current code? decisions still reflected?
3. Classify each claim **verified / corrected (say what changed) / dropped (stale)** and
   present the drift report with the draft — the developer confirms the corrected version.

Per-phase sources (drafts only, post-verification):

- `.pi/agent-docs/product/tech-stack.md` → phase 4 draft
- `.pi/agent-docs/product/dev-processes.md` → phase 5 draft (+ env vars)
- `.pi/agent-docs/product/mission.md`, `roadmap.md` → phase 9 draft
- `.pi/agent-docs/standards/*` → discovery-pass content (preferences/anti-patterns/debug refs)
- `.claude/commands/*.md`, `CLAUDE.md` → workflow expectations (phase 7) + discovery content

Never delete the old trees — the developer removes them after verifying the new harness.

## Manifest files (Phase 1, 4, 6)

- `package.json` — name, scripts, dependencies, workspaces; `pnpm-workspace.yaml`, `turbo.json`
- `Cargo.toml`, `go.mod`, `pyproject.toml`, `Makefile`, `Justfile`
- Lockfiles reveal the package manager (bun.lock / pnpm-lock.yaml / package-lock.json)

## Language + ecosystem (Phase 1)

Majority file extension under src-like dirs; tsconfig.json → TypeScript; .python-version → Python.
Repo type: a `.git` FILE (not dir) or `worktrees/` layout suggests bare-git-worktrees.

## Domain proposals (Phase 3)

- react/next/astro/vue in deps → `frontend`
- server frameworks, DB clients, convex/prisma/drizzle → `backend`
- vitest/jest/pytest/playwright in devDeps → `testing`
- playwright/stagehand/puppeteer as a PRIMARY dep → `automation`
- openai/anthropic/ai SDKs → `ai`
- terraform/docker-compose/k8s manifests → `infrastructure`
- shell scripts as the main artifact → `shell`, `tooling`

Never propose a domain with no evidence. An empty standards folder is worse than none.

## Dev processes (Phase 5)

- scripts from package.json/Makefile → command table
- `.env.example` → env var names (ask for descriptions + which are required)
- tmuxinator configs / Procfile → session layout

## Dependencies worth cloning (Phase 6)

Recommend cloning when the project deeply extends the library (adapters, plugins, custom
fields) — not for commodity deps. Open-source only; find the repo URL from the package's
`repository` field.

## Naming conventions (Phase 8)

Scan existing code before interviewing: component file casing, hook prefixes, test file
suffixes, folder casing. Only ask about patterns with no examples in the codebase.
