# Verification Loop

How the agent checks that changes are working in vexcms.

## Methods (use in combination)

1. **Browser** — primary surface for admin UI work
2. **pnpm typecheck** — fast feedback for type/API changes
3. **pnpm test** (Vitest) — unit/integration for packages with tests
4. **tmux pane 1** — dev server output

## Browser

- **Primary dev URL:** `http://localhost:3020` (apps/www — Next.js admin host)
- Secondary: `http://localhost:4321` (apps/docs — Astro) when touching docs
- Individual package dev servers: see `dev-processes.md` per-package table. Most packages use `tsup --watch` and have no browser surface; the browser test is always against `www`.
- **Tool:** built-in `browse` tool (Arc + screenshot). Keep a pinned localhost tab.
- **After each UI change:**
  1. Navigate to the affected admin route (e.g. `/admin/collections/<slug>`)
  2. Screenshot — verify no visual regression
  3. Check devtools console for errors (browser console is the #1 debug source)
  4. Check tmux pane 1 for matching server-side errors

## Typecheck

- After edits inside a package: `pnpm --filter <pkg> typecheck`
- After edits across packages (e.g. changing core → used by react): `pnpm typecheck` at root
- **Never skip this** after touching `@vexcms/core` or any `types.ts` — type inference is the product's selling point.

## Tests (Vitest)

- After touching a package with tests, run: `pnpm --filter <pkg> test`
- Avoid root `pnpm test` in a loop — it's slow across the whole workspace
- E2E: `pnpm test:e2e` only when explicitly validating admin flows end-to-end

## Dev Server Logs

- Check `tmux_pane({ pane: "1" })` for:
  - Next.js compile errors
  - tsup build failures (a broken package can silently break consumers)
  - Convex codegen / schema errors from `@vexcms/cli`
  - Better Auth warnings
- Known error patterns: fill in as discovered during `/sync-spec`.

## Verify Command Shortcuts

| Intent | Command |
|--------|---------|
| Quick sanity after one package edit | `pnpm --filter <pkg> typecheck && pnpm --filter <pkg> test` |
| Full local CI mirror | `pnpm typecheck && pnpm test && pnpm lint` |
| Before committing | `pnpm typecheck && pnpm --filter <affected> test` |
