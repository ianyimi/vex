---
verified_at: 3a18c95eb3bed73e6c218a32a587d4cf36ce9d7a
---

# Dev Processes

## Dev Commands (root)

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Turbo dev across all packages (concurrency 11). Package tsup watchers + Next + Astro. |
| `pnpm dev:app` | Next.js admin only (`apps/test` on port **3020**). |
| `pnpm dev:vex` | Runs `@vexcms/cli dev` watching core+cli builds, cwd `apps/test`. |
| `pnpm build` | `turbo run build` — all packages + apps. |
| `pnpm typecheck` | `turbo run typecheck` across workspace. |
| `pnpm test` | `turbo run test` — Vitest in every package that has it. |
| `pnpm test:e2e` | `turbo run test:e2e` — Playwright. |
| `pnpm coverage` | `turbo run coverage` — v8 coverage report. |
| `pnpm lint` / `pnpm lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}`. |
| `pnpm changeset` | Create a changeset entry for release notes. |
| `pnpm version:packages` | `changeset version` + sync template versions script. |
| `pnpm release` | Build publishable packages + `changeset publish`. |

## Per-Package Commands

Use `pnpm --filter <name>` to target a single workspace.

| Package | Dev | Test | Typecheck |
|---------|-----|------|-----------|
| `www` | `pnpm --filter www dev` (port 3020) | — | `pnpm --filter www typecheck` |
| `docs` | `pnpm --filter docs dev` (port 4321) | — | — |
| `@vexcms/core` | `pnpm --filter @vexcms/core dev` | `pnpm --filter @vexcms/core test` | `pnpm --filter @vexcms/core typecheck` |
| `@vexcms/cli` | `pnpm --filter @vexcms/cli dev` | `pnpm --filter @vexcms/cli test` | `pnpm --filter @vexcms/cli typecheck` |
| `@vexcms/react` | `pnpm --filter @vexcms/react dev` | `pnpm --filter @vexcms/react test` | `pnpm --filter @vexcms/react typecheck` |
| `@vexcms/next` | `pnpm --filter @vexcms/next dev` | — | `pnpm --filter @vexcms/next typecheck` |
| `@vexcms/better-auth` | `pnpm --filter @vexcms/better-auth dev` | `pnpm --filter @vexcms/better-auth test` | `pnpm --filter @vexcms/better-auth typecheck` |
| `@vexcms/file-storage-convex` | `pnpm --filter @vexcms/file-storage-convex dev` | `pnpm --filter @vexcms/file-storage-convex test` | same |
| `@vexcms/richtext-plate` | `pnpm --filter @vexcms/richtext-plate dev` | — | same |

## Testing

- **Unit/Integration:** Vitest 4 (`pnpm --filter <pkg> test` or `pnpm test` at root)
- **E2E:** Playwright (`pnpm test:e2e`)
- **Convex:** `convex-test` (in-memory) for Convex function tests
- Packages with tests: `@vexcms/core`, `@vexcms/react`, `@vexcms/cli`, `@vexcms/better-auth`, `@vexcms/file-storage-convex`, `create-vexcms`
- Run `pnpm --filter <affected-pkg> test` after non-trivial changes; do not run root `pnpm test` in a loop (slow).

## Error Surfaces (Debug Hierarchy)

1. **tmux pane 0.0** — `pnpm dev` output: Next.js errors, tsup build failures, Convex function errors. Check here FIRST — browser errors almost always surface here too.
2. **Developer-pasted browser console errors** — the developer pastes console/Network errors into chat. Agents NEVER open browser windows or tabs on this machine.
3. **`git diff` (uncommitted)** — recent edits are the most common bug source.
4. **Vitest output** — `pnpm --filter <pkg> test` for the affected package.
5. **Session log / recent implementation notes.**

## Tmux Workspace

Session: `project-vex` — always already running.

| Pane | Command | Purpose |
|------|---------|--------|
| `project-vex:0.0` | `pnpm dev` | Turbo: all tsup watchers + Next.js (port 3020) |
| `project-vex:0.1` | `pnpm dev:vex` | VexCMS CLI watcher + `convex dev` |

**Never start `pnpm dev` or `pnpm dev:vex`** — they are always already running; duplicates cause port conflicts.
Read live output: `tmux capture-pane -t project-vex:0.0 -p -S -100`.

## Background Services

| Service | Start command | Port / Notes |
|---------|--------------|--------------|
| Convex dev | Auto-started by `pnpm dev` via `@vexcms/cli` in `apps/test` | Cloud dev deployment, no local port |
| Next.js (test) | `pnpm dev:app` or part of `pnpm dev` | `http://localhost:3020` |
| Astro docs | `pnpm --filter docs dev` | `http://localhost:4321` |

## Changesets + Release Flow

1. Feature/fix commit lands.
2. `pnpm changeset` — select affected packages, pick bump type, write description.
3. Changeset lives in `.changeset/*.md` until release.
4. `pnpm version:packages` bumps versions + updates template version refs.
5. `pnpm release` builds and publishes `@vexcms/*` + `create-vexcms` to npm (needs `NPM_TOKEN`).
