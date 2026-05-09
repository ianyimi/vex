# Debug Hierarchy

When a bug is reported or found, check in this order. This is a **UI-first** order because most vexcms bugs surface in the admin panel at `http://localhost:3020`.

1. **Browser devtools console + Network tab** — open the affected admin route, read console errors, inspect failing Convex requests / auth redirects.
2. **`project-vex:0.0` (`pnpm dev`)** — Next.js stack traces, tsup rebuild errors, Better Auth warnings. `tmux_pane({ pane: "project-vex:0.0" })` or `tmux capture-pane -t project-vex:0.0 -p -S -100`. A broken `@vexcms/core` build silently breaks downstream — always check this before guessing.
   **`project-vex:0.1` (`pnpm dev:vex`)** — Convex function errors, schema codegen failures. `tmux_pane({ pane: "project-vex:0.1" })`. Check here whenever a Convex query or mutation fails.
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
| **PostCSS comment tokenizer (under Turbopack)** | `CssSyntaxError: Unclosed string` at a line inside a `/* */` block; entire stylesheet rejected, no Tailwind output, page renders unstyled | PostCSS treats unmatched `'` (apostrophes in contractions like `don't`, `won't`) and `"` inside CSS comments as string delimiters and reads forward until EOF looking for the close. **Avoid apostrophes, single quotes, double quotes, and backticks in CSS comments.** Same trap with `{a,b}` brace-expansion patterns inside `@source "…"` strings — split into separate `@source "…/*.ts"; @source "…/*.tsx";` lines instead of `@source "…/*.{ts,tsx}"`. *(Recorded: sync-spec, 2026-05-04)* |

## Debug Heuristics by Symptom

| Symptom | First check |
|---------|-------------|
| Admin route 500 / blank page | Browser console → tmux pane 1 Next.js stack |
| Type error after editing `@vexcms/core` | `pnpm --filter @vexcms/core build` then `pnpm typecheck` at root |
| Convex function not found | Check `project-vex:0.1` — schema codegen may have failed |
| Form field not rendering | `@vexcms/react` — check field type registration + default value handling (historical fragile area) |
| Auth redirect loop | `@vexcms/better-auth` version pin (must be `>=1.4.9 <1.5.0`) + `.env.local` |
| Test passes locally, fails in CI | Turbo cache — `pnpm clean && pnpm build && pnpm test` |

→ Full tmux pane map: `.pi/agent-docs/product/tmux-workspace.md`
