---
applies_to: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.test.tsx", "packages/*/vitest.config.ts"]
---
# Test Structure

- Tests colocate with source as `*.test.ts` / `*.test.tsx` — no `__tests__` dirs, no
  `.spec` suffix. Vitest `globals: true` everywhere (file-storage-convex is the minimal
  exception).
- Environment split by domain: `edge-runtime` for Convex-touching packages
  (`packages/core/vitest.config.ts:11-13`, better-auth) — required for crypto/timer
  semantics with convex-test; `jsdom` for React component tests
  (`packages/react/vitest.config.ts:8-10`).
- Every `vitest.config.ts` sets `pool: "threads"` — never the default `forks`. Fork
  workers outlive a crashed/interrupted vitest main process and spin forever on
  convex-test's real-`setTimeout` scheduler (~100% CPU, GBs of RAM each); threads die
  with the main process. New packages/apps copy this.
- Packages WITH test scripts: core, react, better-auth, file-storage-convex, cli,
  create-vexcms. WITHOUT: next, richtext-plate — do not invent test commands for them.
- Run per-package (`pnpm --filter <pkg> test`) after non-trivial changes; root `pnpm test`
  is for the commit gate, not the inner loop. `coverage` exists for core/react/better-auth.
- `packages/cli/vitest.config.ts:4-7` excludes generateCollectionFiles/generateSchema
  tests — check the exclude list before assuming a CLI test runs.
- No Playwright/E2E setup currently exists despite the root `test:e2e` script — the turbo
  task is wired but no specs/config are present. Don't claim E2E coverage.
