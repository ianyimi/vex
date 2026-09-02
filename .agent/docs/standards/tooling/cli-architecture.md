---
applies_to: ["packages/cli/src/**", "scripts/vex-dev.mjs"]
---
# CLI Architecture (vex dev / generate)

- `vex dev` is dual-mode (`packages/cli/src/commands/dev.ts`): `--once` generates, waits
  for the Convex deploy, exits non-zero on failure (`dev.ts:35-47`); default mode runs the
  persistent watcher.
- Watch lifecycle (`dev.ts:49-180`): load config → generate initial schema → patch
  `convex/tsconfig.json` for customConditions BEFORE starting convex dev (and re-patch
  when provisioning rewrites it) → `startConvexDev(cwd)` (execa long-running child, in
  `lib/convexProcess.ts`) → trace the schema import tree and chokidar-watch it →
  debounce 200ms → regenerate + re-trace on change.
- **Shutdown invariant:** on SIGINT/SIGTERM, `await killConvexDev()` then
  `await watcher.close()` before exit — exiting early orphans the convex dev child
  (`dev.ts:170-180`).
- `vex generate` (`commands/generate.ts:10-45`) force-regenerates collection API files
  (`convex/vex/api/*`, `convex/vex/model/api/*`) then runs `eslint --fix` over the output
  dirs; unfixable lint warnings are informational (exit 0).
- CLI command files are camelCase verbs: `commands/{dev,deploy,generate}.ts`.
- Dev entry for the workspace: `pnpm dev:vex` runs `scripts/vex-dev.mjs` (cwd apps/test).
