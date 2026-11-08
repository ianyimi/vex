---
status: draft
spec_id: 2026-11-08-tree-shakeable-react-package
touches: ["scripts/**", "pnpm-workspace.yaml", "package.json", "pnpm-lock.yaml", ".github/workflows/ci.yml", "packages/core/tsup.config.ts", "packages/react/**", "packages/next/src/**", "packages/create-vexcms/src/**", "packages/create-vexcms/templates/**", "apps/www/src/**", "apps/test/src/**", "apps/docs/src/content/docs/guides/**", ".changeset/**", ".agent/docs/decisions/**", ".agent/docs/standards/**", ".agent/docs/product/backlog.md"]
prompt_version: 1
---

# 2026-11-08-tree-shakeable-react-package — Tasks

> Stop shipping the admin panel to public pages. Today every `apps/www` route loads about 3.0 MB of
> JavaScript (1.1 MB admin UI, 671 KB TanStack Table, 505 KB of lucide icons, 338 KB auth UI), and CI
> Lighthouse TBT is 277–570 ms against a 200 ms budget. The same cost hits any consumer who imports one
> hook from `@vexcms/react`. `dev-spec` interview held 2026-11-08.
> **Agent tier:** agents implement every step to completion, and `spec.md` carries full code.
> Every step leaves `pnpm build && pnpm typecheck && pnpm test && pnpm lint` green.
>
> **Measured facts the design rests on** (local production builds of www against the dev deployment, 2026-11-08):
>
> | Variant | `/` initial JS | TanStack Table on `/` |
> |---|---|---|
> | Baseline (`dist/chunk-VKIK73SA.js`, 725 KB, holds the whole package) | 3058 KB | yes |
> | Drop `./dist/chunk-*.js` from `sideEffects` | 3058 KB | yes |
> | One dist file per source module | 3074 KB | yes |
> | + root barrel without `"use client"` (± `optimizePackageImports`) | 3097 KB | yes |
> | + server components import client components through a client file | **2210 KB** (TBT ~195 → ~110 ms locally) | **no** |
>
> - **Client imports tree-shake:** with one dist file per module, the site's client graph reached 18 of 413 `@vexcms/react` modules.
> - **Server imports don't:** a **server** component importing anything from a barrel makes every `"use client"` module that barrel can reach a client reference, and all of them ship. No Next config option changes this (tested `optimizePackageImports`, pure re-export barrels, `sideEffects`).
> - **So entries are split by reach:** the root holds everything users touch, `@vexcms/react/admin` holds panel internals, and a CI gate keeps the root's reach admin-free.
>
> **Decisions (interview):**
> - The root holds everything users touch; `/admin` holds panel internals; no deep subpaths.
> - Build: tsup + an esbuild preserve-modules plugin.
> - Packages: `@vexcms/react` and `@vexcms/core`.
> - Icons: lazy `DynamicIcon` with a reserved box; the admin uses an eager `AdminIcon`.
> - Auth UI: mounted only on auth routes.
> - Gates (all three): a package import-cost check, a site-bundle analyzer check, and Lighthouse.
> - Bundle budget: set from measurement + 10%.
> - Config-referenced components: out of scope (backlog).

## Step 1 — Preserve-modules build plugin [agent]
Why: tsup's `splitting` puts every module both entries share into one chunk, and Turbopack keeps a module whole once anything in it is used. One dist file per source module is the precondition for any tree-shaking. Shared by react and core, so it lives in `scripts/`.
Verify: `node --test scripts/preserveModulesPlugin.test.mjs`. Asserts on a temp fixture: one `.js` per source module, mirroring `src/`; relative specifiers rewritten to `.js` (directory imports become `/index.js`); `"use client"` kept per file; `import()` kept lazy; packages stay external; test files excluded
- [x] `scripts/preserveModulesPlugin.mjs`: `listModuleEntries({ srcDir, exclude })` and `preserveModulesPlugin({ srcDir })`
- [x] `scripts/preserveModulesPlugin.test.mjs`

## Step 2 — `@vexcms/core` per-module dist [agent]
Why: core ships to every page through the client config (114 KB, all in one chunk today), and react's server/client split relies on core resolving per module.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && node scripts/export-names.mjs --check`; `ls packages/core/dist` shows a per-module tree with no `chunk-*.js`; `pnpm --filter test build` succeeds
- [x] `packages/core/tsup.config.ts`: per-module entries + plugin, `splitting: false`
- [x] `packages/core/package.json`: `exports` unchanged (`dist/index.js`, `dist/server.js`, `dist/internal.js` keep their paths); `sideEffects: false` re-verified (no top-level side effects in `src/**`, checked by step 3's directive test pattern)

## Step 3 — `@vexcms/react` per-module dist + per-module `"use client"` [agent]
Why: per-module output only works if every client module declares its own boundary. The root barrel stops being a boundary, so a server component can import `cn` or a hook without making the whole package a client reference. ADR-009's shared-chunk contract goes away: per-module files are already single instances across entries.
Verify: `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test && node scripts/export-names.mjs --check`. Also, run by hand:
- `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test`. The new `src/clientDirective.test.ts` passes, and fails if `"use client"` is removed from any `.tsx`, `use*.ts` or `createContext` module.
- `node scripts/export-names.mjs --check` shows no surface change.
- `pnpm --filter test build` and `pnpm --filter www build` succeed. This is the first real RSC proof: server components import the root without a directive error.
- [x] `packages/react/tsup.config.ts`: per-module entries (`src/**` minus tests), plugin, no `splitting`; old ADR-009 comment replaced
- [x] `packages/react/src/index.ts`: drop the barrel `"use client"` and its rationale comment
- [x] `"use client"` added to every client module that lacks it (`.tsx` outside `src/server/**`, `use*.ts` hooks, modules calling `createContext`), including `hooks/useAriaControlsCleanup.ts` and `ui/accordion.tsx`, the two the spike surfaced
- [x] `packages/react/src/clientDirective.test.ts`: enforces the rule above over `src/**`
- [x] `packages/react/package.json`: `sideEffects` → `["./src/adapter.ts", "./dist/adapter.js"]`; `./form` export fixed to `dist/forms/index.{js,d.ts}` (types path never existed)

## Step 4 — Package import-cost gate [agent]
Why: a consumer importing one hook must pay for that hook, not the package. This is the deterministic, Next-independent proof for the user-facing claim, checked against the built `dist` with esbuild, which honours `sideEffects` and tree-shakes ESM like consumer bundlers do.
Verify: `node --test scripts/check-import-cost.test.mjs`, which covers the metafile analysis: a deny-list hit's failure message names the import chain, and a budget overrun fails. Negative proof, run by hand: node scripts/check-import-cost.mjs exits 1 against the current dist, because the fixtures reach the admin through the root's reactAdapter. Step 5's Verify requires it to pass.
- [x] `scripts/check-import-cost.mjs`: bundles fixtures against the built `dist` of `@vexcms/react`; `useLivePreviewQuery`-only and `cn`-only fixtures, budgets `null` until Step 5 measures them; exported `ADMIN_DENY_LIST`
- [x] `scripts/check-import-cost.test.mjs`
- [x] No CI wiring yet: the fixtures fail by design until Step 5's split (fixture budgets start `null`)

## Step 5 — Root / `@vexcms/react/admin` entry split [agent]
Why: the root's reach is what a server component pays. Panel internals move behind `./admin` so the root never reaches the adapter, the field registry, admin views, `data-table` or `dnd`.
Verify: `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test && pnpm --filter @vexcms/next build && node --test scripts/check-import-cost.test.mjs && node scripts/check-import-cost.mjs`. Also, run by hand:
- Build, test and typecheck across the repo.
- `node scripts/check-import-cost.mjs` passes its new root-reach fixture (`export * from "@vexcms/react"`) with no deny-listed module.
- A one-off union check: root + `/admin` exports ⊇ the old root, apart from the documented removals. Then `node scripts/export-names.mjs --write`.
- `pnpm --filter test build && pnpm --filter www build`.
- [x] `packages/react/src/adminEntry.ts`: the `/admin` surface (adapter + types, field Admin/Cell components, slots, documents/edit runtime, admin layout/views, collection/media/global views, list-view context, `LivePreviewPanel` + panel hooks, modal surface, `useVexForm`, `DataTable*`, dnd exports)
- [x] `packages/react/src/index.ts`: those exports removed. `export * from "./ui"` replaced by explicit re-exports that skip `data-table`, `dnd`, `sidebar` and `resizable`. `useAppForm`/`AppForm` re-exports removed: the app form's surface is `@vexcms/react/form`, because the root must not reach dnd through `ArrayField`/`BlocksField` (design decision for developer review)
- [x] `packages/react/package.json`: `./admin` export
- [x] Consumers: `packages/next/src/NextAdminLayoutClient.tsx`, `packages/next/src/NextAdminPage.tsx`; `apps/test/src/vexcms/admin/{PhoneInputWithHint,TrimOnBlurTextInput}.tsx`, `apps/test/src/vexcms/components/{CopyDocumentIdMenuItem,EditorialChecklist,SaveWithAnalytics}.tsx`, `apps/{www,test}/src/vexcms/admin.test.ts`; any root `AppForm`/`useAppForm` importer → `@vexcms/react/form`
- [x] `scripts/check-import-cost.mjs`: root-reach fixture + deny list
- [x] `.changeset/react-admin-entry.md` (react, next: BREAKING, with migration table)
- [x] Fixture budgets recorded from `--report` (measured + 10%); `.github/workflows/ci.yml` "Check Import Cost" step after "Build Packages"

## Step 6 — Lazy root `Icon`, eager `AdminIcon` [agent]
Why: `icons[name]` lookups ship all 1703 lucide icons (505 KB) to every page. On the site, names come from CMS data, so the root `Icon` loads each icon on demand into a box of the same size. The admin keeps synchronous icons, at admin-only cost.
Verify: `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test && node scripts/check-import-cost.mjs`. Also, run by hand:
- `pnpm --filter @vexcms/react test`. `ui/Icon.test.tsx` covers:
  - the placeholder `<svg>` before load carries the same `width`/`height`/`className` as the loaded icon
  - the loaded icon renders
  - an unknown name renders nothing and warns once
  - `isIconName("Grid2x2")`/`("LayoutGrid")` are true and `("NotAnIcon")` is false
- `ui/AdminIcon.test.tsx` covers the eager render.
- `check-import-cost`'s root reach has no `lucide-react/dist/esm/icons/index.js`.
- Blocks render their icons in the browser on `/` and `/features` (www dev).
- [x] `packages/react/src/ui/Icon.tsx` (lazy, `isIconName`, placeholder), `packages/react/src/ui/AdminIcon.tsx` (eager), tests
- [x] Internal admin modules (`admin/*`, `collections/**`, `documents/*`, `media/**`, `fields/**`, `livePreview/*`, `revalidate/*`, `versions/*`): `Icon` → `AdminIcon`. `ui/button.tsx` and `ui/input.tsx` keep the lazy `Icon`, because they're root primitives
- [x] `adminEntry.ts` exports `AdminIcon`; root exports `isIconName`
- [x] `SessionButton.tsx` (www, test, marketing-site): static `LogOut` from `lucide-react`
- [x] `Features`/`HowItWorks` blocks (www, test, marketing-site): `Icon` + `isIconName` instead of `icons[...]`
- [x] `.changeset/react-lazy-icon.md`

## Step 7 — Auth UI only where auth views render [agent]
Why: `AuthUIProvider` at the root ships `better-auth-ui`, react-hook-form, hcaptcha and qrcode (~250 KB) to every page. Only the two `AuthView` render sites need it.
Verify: `pnpm --filter www test && pnpm --filter test test && pnpm --filter create-vexcms test`. Also, run by hand:
- `pnpm --filter www test && pnpm --filter test test`.
- In www dev: the `/auth/sign-in` page and the header "Sign in" modal both sign in.
- Sign-out from `SessionButton` still refreshes the header.
- `/` loads no `better-auth-ui` (checked by step 8's gate).
- [x] `src/auth/AuthViewProvider.tsx` (`"use client"`; www, test, base-nextjs template, which also carries the installer's two OAuth/credentials placeholders): `AuthUIProvider` with the existing options
- [x] Each `view.tsx` that renders `AuthView` wraps it in the provider: www and test have two, `(frontend)/auth/[pathname]` and `@auth/(.)auth/[pathname]`; base-nextjs has one
- [x] `src/auth/client.tsx`: `BetterAuthClientProvider` drops `AuthUIProvider`, keeps `VexAdminAuthAdapterProvider`
- [x] `packages/create-vexcms/src/installers/nextjs.ts` (`updateOAuthUIConfig` now edits `src/auth/AuthViewProvider.tsx`) and its integration test assertions

## Step 8 — Site bundle gate + budget [agent]
Why: the package gate proves the packages; this proves an app. It catches regressions anywhere in the app graph (config components, providers, blocks) with Next's own analyzer, so it's deterministic, unlike Lighthouse.
Verify: `node --test scripts/check-site-bundle.test.mjs && node scripts/check-site-bundle.mjs --app apps/test`. Also, run by hand:
- `node --test scripts/check-site-bundle.test.mjs` passes, covering the JSONL analysis on a synthetic fixture: initial set = bootstrap + render-dependent groups, deny-list hits are reported with their chain, and a budget overrun is reported.
- `node scripts/check-site-bundle.mjs --app apps/test` and `--app apps/www` pass with the budgets recorded (measured + 10%).
- CI runs it for `apps/test` after build.
- [x] `scripts/check-site-bundle.mjs` (runs `next analyze -o` + `next analyze export --route`, reads initial client modules, enforces the deny list and a per-route KB budget)
- [x] `scripts/check-site-bundle.test.mjs`
- [x] `.github/workflows/ci.yml` step

## Step 9 — ADR, standards, docs, backlog, changesets [agent]
Why: the package's public import contract changes; docs, standards and the release notes must say so.
Verify: `pnpm --filter docs build && pnpm changeset status --verbose`. Also, run by hand:
- `pnpm --filter docs build`.
- Grep shows no docs page imports a moved symbol from `@vexcms/react`.
- `pnpm changeset status --verbose` lists react, core, next and create-vexcms.
- After pushing: the PR's `quality / lighthouse` passes TBT ≤ 200 ms and performance ≥ 0.9.
- [x] `.agent/docs/decisions/ADR-017.md` (supersedes ADR-009), ADR-009 status → superseded
- [x] `.agent/docs/standards/tooling/tsup-and-exports.md`: per-module dist, per-module `"use client"`, root reach rule
- [x] Docs: `guides/admin-customization.mdx`, `guides/framework-adapters.md`, `guides/list-views.mdx`, `guides/pagination.mdx` imports; new "What ships to your pages" section in `guides/framework-adapters.md`
- [x] `.agent/docs/product/backlog.md`: lazy config-referenced components
- [x] `.changeset/core-per-module-dist.md`, `.changeset/create-vexcms-lean-site-pages.md`

## Step 10 — Server-resolved icon nodes for first paint [agent]
Why: after Steps 1–9, `/` requests 18 lazy icon chunks right after hydration. Lighthouse's simulator puts them in the LCP chain (simulated LCP 6.3 s, performance 0.75), failing this spec's acceptance. The server resolves the icons a route renders to `IconNode`s; `Icon` renders them synchronously from context; the lazy path stays for names the server never saw.
Verify: `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test && node scripts/check-import-cost.mjs && pnpm --filter www test`. Also, run by hand:
- `node scripts/check-site-bundle.mjs --app apps/www` and `--app apps/test` pass.
- Local www production build: `/` makes zero lazy icon-chunk requests on load, its SSR HTML carries the icons' SVG markup, and Lighthouse on `/` reaches performance ≥ 0.9 (3 runs).
- Negative check: without `IconNodeProvider` in `PageContent`, the icon-chunk requests return.
- `node scripts/verify-scaffold.mjs` is green.
- [x] `packages/react/src/ui/iconKey.ts`, `ui/Icon.tsx` (`IconNodeProvider`), `server/resolveIconNodes.ts`, root + server exports, tests
- [x] www, test, marketing-site: `src/lib/iconNodes.ts` (+ test), `page.tsx`, `[slug]/page.tsx`, `PageContent.tsx`, `(site)/layout.tsx`
- [x] `.changeset/react-lazy-icon.md` updated; export-names baseline rewritten
