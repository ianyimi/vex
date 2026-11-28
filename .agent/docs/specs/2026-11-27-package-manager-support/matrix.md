# Package-manager matrix — 2026-11-27

macOS arm64, Node 24.9.0, `CI` unset. Managers: npm 11.6.0, pnpm 12.23.0 (10.30.2 spot-checked),
yarn 1.22.22, yarn 4.19.0, bun 1.4.5, Deno 2.9.6. Throwaway scaffolds under `~/tmp/vex-pm/`
(deleted afterwards), ports 3400–3456. Scripts: `static-matrix.sh` (no Convex), `runtime.sh` +
`flow.mjs` (Convex + Playwright), kept in this session's log only.

✅ pass · ❌ fail · — not reached

## 1. Published alpha.41, as a user gets it today (no Convex)

`<pm> create vexcms@alpha <dir> --yes [--bare]` → install → typecheck → lint → build.

| Manager | Template | create | install | typecheck | lint | build | Cause |
| ------- | -------- | ------ | ------- | --------- | ---- | ----- | ----- |
| npm | base / marketing | ✅ | ❌ | — | — | — | `ERESOLVE`: `@better-auth/passkey` peer `@better-auth/core ^1.7.18` → 1.7.28 → `better-call` 1.4.6 ≠ 1.4.5 |
| pnpm 12 | base / marketing | ✅ | ❌ | — | — | — | `ERR_PNPM_IGNORED_BUILDS` (core-js, esbuild); pnpm 11+ ignores `package.json#pnpm` |
| pnpm 10 | base | ✅ | ✅ | ✅ | ✅ | ✅ | (alpha.40 probe) |
| yarn 1 | base / marketing | ❌ 127 | ✅¹ | ✅ | ❌ | ❌ | `create-vexcms@alpha` bin; no peer auto-install → `react-hook-form`, `@hookform/resolvers`, radix… not found; two `@typescript-eslint` plugins |
| yarn 4 | base / marketing | ✅ / ❌² | ❌ | — | — | — | `npmMinimalAgeGate` quarantines `@vexcms/*` alpha.41; PnP by default |
| bun | base / marketing | ✅ | ✅ | ✅ | ✅ | ✅ | |
| deno | base / marketing | ✅ | ✅ | ❌ | ❌ | ❌ | `"packageManager": "npm@?"`; duplicate `@better-auth/core` (1.7.18 + 1.7.28) |

¹ scaffolded with `npx create-vexcms@alpha` + a yarn 1 user agent. ² network timeout, transient.

## 2. Fixed scaffolder (this tree), published `@vexcms/*` alpha.41 (no Convex)

`node packages/create-vexcms/dist/index.js` under each manager's user agent (Deno: `deno run -A`).

| Manager | base: create · install · typecheck · lint · build | marketing: same |
| ------- | -------------------------------------------------- | --------------- |
| npm | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |
| pnpm 12 | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |
| yarn 1 | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |
| yarn 4 | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |
| bun | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |
| deno | ✅ ✅ ✅ ✅ ✅ | ✅ ✅ ✅ ✅ ✅ |

## 3. Fixed scaffolder, full run-through with Convex

New Convex project per cell (`vex-pm-<manager>-<template>`). Steps: install → `convex dev --once
--configure new --dev-deployment cloud` → `env set SITE_URL/BETTER_AUTH_SECRET` → `vex:dev` →
`next dev` (→ `seed` on marketing) → Playwright: sign up → admin dashboard → save a document
(base: the admin's name; marketing: publish a page title), check the list → stop → `build` →
`start` (`/` 200, `/admin` 307 to sign-in) → `lint`.

| Manager | Template | vex dev runs convex via | sign up → admin | save | build | start | lint |
| ------- | -------- | ----------------------- | --------------- | ---- | ----- | ----- | ---- |
| npm | base | npx | ✅ → /admin | ✅ | ✅ | ✅ | ✅ |
| npm | marketing | npx | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |
| pnpm 12 | base | pnpm exec | ✅ → /admin | ✅ | ✅ | ✅ | ✅ |
| pnpm 12 | marketing | pnpm exec | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |
| yarn 1 | base | yarn | ✅ → /admin | ✅ | ✅ | ✅ | ✅ ⁵ |
| yarn 1 | marketing | yarn | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |
| yarn 4 | base | yarn | ✅ → /admin | ✅ | ✅ | ✅ | ✅ ⁵ |
| yarn 4 | marketing | yarn | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |
| bun | base | bunx | ✅ → /admin | ✅ | ✅ | ✅ | ✅ |
| bun | marketing | bunx | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |
| deno | base | npx (alpha.41 CLI) | ✅ → /admin | ✅ | ✅ | ✅ | ✅ ⁵ |
| deno | marketing | **deno** (this tree's CLI) | ✅ ³ | ✅ | ✅ ⁴ | ✅ | ✅ |

³ The first sign-up is promoted (the dashboard lists collections) but lands on `/`, not `/admin`,
on every manager — template behaviour, not a package-manager one. Reported, not fixed.
⁴ Failed on every manager until `marketing-site/src/lib/metadata.ts` stopped casting to
`Record<string, unknown>[]`: after `vex dev` regenerates `src/vex.types.ts`, `PagesDocument`
extends `VexDocumentShape` (no index signature) and `next build` fails TS2352. Fixed in the template.
⁵ Failed before `better-call` 1.4.5 became a direct dependency (yarn hoisted 2.0.2; Deno kept a
second `@better-auth/core`); re-run green on the final template (table 2).

## 4. Packed-tarball gate (`node scripts/verify-scaffold.mjs --pm <manager>`)

Both templates: scaffold (`--use-<manager>`) → hooks wiring → tarball pins → install →
typecheck → lint → build → prerender manifest + `next start` route checks.

| `--pm` | base-nextjs | marketing-site |
| ------ | ----------- | -------------- |
| npm | ✅ | ✅ |
| pnpm | ✅ | ✅ |
| yarn@4.19.0 | ✅ | ✅ |
| bun | ✅ | ✅ |
| deno (published `@vexcms/*`; Deno can't install `file:` tarballs) | ✅ | ✅ |

## Convex projects to delete (dashboard → team `isaiah-anyimi-83b5b`)

`vex-pm-npm-base`, `vex-pm-npm-marketing`, `vex-pm-pnpm-base`, `vex-pm-pnpm-marketing`,
`vex-pm-yarn1-base`, `vex-pm-yarn1-marketing`, `vex-pm-yarn4-base`, `vex-pm-yarn4-marketing`,
`vex-pm-bun-base`, `vex-pm-bun-marketing`, `vex-pm-deno-base`, `vex-pm-deno-marketing`.
