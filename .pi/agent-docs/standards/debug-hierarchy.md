# Debug Hierarchy

When a bug is reported or found, check in this order. This is a **UI-first** order because most vexcms bugs surface in the admin panel at `http://localhost:3020`.

1. **Browser devtools console + Network tab** — open the affected admin route, read console errors, inspect failing Convex requests / auth redirects.
2. **tmux pane 1 (`pnpm dev` output)** — Next.js stack traces, tsup rebuild errors, Convex function errors, Better Auth warnings. A broken `@vexcms/core` build silently breaks downstream packages — always scroll tmux before guessing.
3. **`git diff` (uncommitted)** — the bug almost always lives in the last edit. Scan for:
   - Changed types / generics in `@vexcms/core` that downstream packages now misuse
   - Missing barrel exports
   - Renamed files without `package.json#exports` or `src/index.ts` update
4. **Recent ideaLog** — `.pi/agent-docs/implementation-log/YYYY/MM/*.ideaLog.md` — a decision from the last session may explain the new behavior.
5. **Vitest output** — `pnpm --filter <affected-pkg> test` for the package in question. `convex-test` failures often point at schema/codegen drift.
6. **Changed spec files** — `.pi/agent-docs/specs/` — spec may have been updated mid-implementation and code has drifted.

## Known Fragile Areas

| Area | Signs of trouble | Notes |
|------|-----------------|-------|
| _(none recorded yet — `/sync-spec` will populate this table as patterns emerge)_ | | |

## Debug Heuristics by Symptom

| Symptom | First check |
|---------|-------------|
| Admin route 500 / blank page | Browser console → tmux pane 1 Next.js stack |
| Type error after editing `@vexcms/core` | `pnpm --filter @vexcms/core build` then `pnpm typecheck` at root |
| Convex function not found | `@vexcms/cli` codegen in tmux — schema may have failed to generate |
| Form field not rendering | `@vexcms/react` — check field type registration + default value handling (historical fragile area) |
| Auth redirect loop | `@vexcms/better-auth` version pin (must be `>=1.4.9 <1.5.0`) + `.env.local` |
| Test passes locally, fails in CI | Turbo cache — `pnpm clean && pnpm build && pnpm test` |
