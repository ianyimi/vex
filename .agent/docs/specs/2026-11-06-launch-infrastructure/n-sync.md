# N: Template sync — 2026-11-06-launch-infrastructure

Run: `node scripts/template-diff.mjs --app apps/www` and `node scripts/template-diff.mjs --app apps/test`, 2026-11-08 (final pass, all previously-deferred rows resolved per lead directive — N runs once against final www, so every change either reaches the templates now or is recorded here as a permanent `do not sync`/`n/a` with a concrete reason, never "pending sign-off").

Scope note: `richtext(`, `livePreview`, and `vex_status`/`vex_version` are **shipped** current API (spec's own 2026-11-06 sweep correction, `spec.md:2593-2616`; `packages/core` changelog). Versioning/drafts (`versions:{drafts:true}`, `getBySlugPreview`, `convex/vex/versions.ts`) is likewise shipped — the `posts` collection stays out of `marketing-site` because `base-nextjs` already ships posts (decision 6, spec line 2556/2579), not because drafts are unshipped. `vex generate` emits `vex_versions`/`vex_views` unconditionally regardless of whether any collection opts in; both templates now also have a real consumer of `vex_versions` (the `pages` collection's `versions:{drafts:true}` below), so this is no longer a latent no-op.

## Actions taken this (final) sync

**base-nextjs** (synced from `apps/test`):
- `src/components/WelcomePage.tsx` — **not** given the skip-guard. Spec decision 7: `WelcomePage` keeps its unconditional `isBootstrapped` query (a skip-guard would show a signed-out visitor the "no admin yet" state on an already-bootstrapped deployment). A sync pass applied the guard; the lead reverted it to `apps/test`'s copy (2026-11-08). `marketing-site`'s `FirstAdminBootstrap.tsx` is the one with the guard — it mounts unconditionally and needed it for a different reason (see that file's doc comment).
- `convex/vex.ts` — exports a `getAuth` resolver (used by this file's own `collectionsApi` call and by `convex/vex/versions.ts`, the only other module that needs it). `convex/vex/globals.ts`/`convex/vex/media.ts` each build their own identical `createGetAuth(...)` call rather than importing this one — a DRY hoist was attempted and reverted: `packages/create-vexcms/src/installers/base.ts`'s `stripOrganizationWiring()` does an exact-string transform expecting each of `vex.ts`/`globals.ts`/`media.ts` to independently carry the org-wiring markers, and hoisting broke `verify-scaffold.mjs`'s `--orgs`-declined step (`expected the TABLE_SLUG_ORGANIZATIONS db/constants import … template drift?`). `apps/test` itself has made this refactor (it never goes through the installer), so this file stays diverged from `apps/test` by design.
- `convex/vex/firstUser.ts` — `promoteFirstAdmin` now built on the trigger-wrapped `vexMutation` (fires `afterChange`/`afterDelete`) instead of the raw `mutation` builder. Not affected by the `getAuth` revert (not in the installer's file list).
- `convex/vex/versions.ts` (new) — `versionsApi({config,query,mutation,getAuth})` wrapper exposing `saveDraft`/`publish`/`unpublish`/`listVersions`/`getVersionSnapshot`/`deleteVersion`. Base-owned (any collection in any template can opt into `versions:{drafts:true}`), and now has a real caller: `marketing-site`'s `pages` collection.
- `src/lib/csp.ts` (new) + `next.config.ts` — ported the CSP/security-headers builder and wired it into `next.config.ts`'s `headers()` (production only), plus `htmlLimitedBots: /.*/,`. `workspaceSourceAliases()`'s turbopack dev-resolve-to-source aliasing and the `nuqs` dev-alias/`turbopackMemoryEviction` tweaks stayed out — monorepo-dev-only, meaningless for a scaffolded standalone project.
- `src/app/globals.css` + `src/components/ui/{accordion,badge,button,combobox,dialog,input-group,input,label,select,textarea}.tsx` — added the `@utility focus-ring` utility and consolidated each component's focus-ring classes onto it; `combobox.tsx` also gained `aria-label="Remove"`/`"Clear"`; `dialog.tsx` gained `inert` on `#main` + `aria-modal="true"`; `input-group.tsx`/`label.tsx` gained justified `eslint-disable` comments matching `apps/test`.
- `src/lib/authPageTitle.ts` (new) + `src/app/(frontend)/auth/[pathname]/{page,view}.tsx` + `src/app/@auth/(.)auth/[pathname]/view.tsx` — ported the auth-page-title feature (dynamic `<title>` + sr-only heading + real `DialogTitle` on the intercepted modal).
- `src/auth/hasPermission.ts` — added `"changes"` to the client-side omitted-props union (server-only enforcement of field-map writes).
- `src/db/constants/index.ts` — a `PageDoc`/`PageID` type-export addition was attempted and reverted: bare `base-nextjs` has no `pages` Convex table, so `Doc<typeof TABLE_SLUG_PAGES>` fails `tsc` with `Type '"pages"' does not satisfy the constraint 'TableNames'` on a `--bare` scaffold (`apps/test`'s own `pages` is a distinct dogfood collection). `TABLE_SLUG_PAGES` itself (pre-existing, used by the marketing overlay) is unchanged.
- Regenerated `convex/schema.ts` (added `vex_versions`/`vex_views`) and `convex/vex.schema.ts`/`src/vex.types.ts` via the now-fixed `scripts/regen-template-schema.mjs` (lead applied the `loadConfig({configPath, projectDir})` call-site fix); registered `vex/versions` in `convex/_generated/api.d.ts`.

**marketing-site** (synced from `apps/www`):
- `src/components/FirstAdminBootstrap.tsx` — the spec-mandated bootstrap skip-guard fix.
- `src/app/(frontend)/layout.tsx` / `src/app/(frontend)/(site)/layout.tsx` — moved `<ThemeStyle />` up to the outer layout (covers auth routes too), removed the now-duplicate inner copy.
- `src/app/unauthorized/page.tsx` (new override) — adds `<ThemeStyle />` to fix the same colour-flash bug; base-nextjs's own copy stays themeless (`ThemeStyle` is marketing-owned).
- `src/app/not-found.tsx` (new override) — root-level 404 outside every route group (catches multi-segment unmatched paths Next's own built-in 404 would otherwise serve, bypassing the root layout), with `<ThemeStyle />` for the same reason as `unauthorized/page.tsx`. Generic copy (no `/tour` mention, unlike `apps/www`'s version).
- `src/components/CodePane.tsx`, `src/components/InstallCommand.tsx` — a11y attributes + Tailwind v4 arbitrary-var syntax.
- `src/components/motion-primitives/{AnimatedGroup,TextEffect}.tsx` — `cn` import migrated to `~/lib/utils`.
- `src/vexcms/blocks/Roadmap/index.tsx` — real ARIA tabs/tabpanel wiring.
- `src/vexcms/blocks/Stats/index.tsx` — `<dt>`/`<dd>` DOM-order fix via CSS `order`.
- `src/vexcms/blocks/Header/index.tsx` — `aria-label="Primary navigation"` on both `<nav>` elements, and wired `SessionButton` (see below) into the desktop bar and mobile sheet, alongside the existing `useCanAccessAdminPanel()`-gated `/admin` link (not replaced — `AdminDemoButton` stays excluded).
- `src/components/SessionButton.tsx` (new) — the always-occupied sign-in/out header control, ported minus its one demo-specific branch: `apps/www`'s `!session?.user || session.user.isAnonymous === true` narrowed to `!session?.user` (anonymous-session handling rides the excluded live-demo/`AdminDemoButton` flow).
- `src/lib/highlight.ts` — WCAG-AA contrast fix for the Tokyo Night comment color.
- `src/lib/highlightClient.ts` — switched shiki to the JS regex engine (drops the `'wasm-unsafe-eval'` CSP need).
- `src/proxy.ts` — removed the dead `ALWAYS_ALLOWED` allowlist short-circuit.
- `convex/images.ts` (new) + `src/components/MediaImage.tsx` — `images.getById` query backing `MediaImage`'s alt-text auto-fallback and new `sizes` prop.
- `src/vexcms/blocks/Split/index.tsx` — `sizes` prop, dropped redundant `alt=""`.
- `src/vexcms/collections/themes.ts` — `admin.defaultCollapsed` on the light/dark field groups.
- `src/vexcms/api.ts` — `"server only"` pragma guard.
- `src/vex.config.ts` + `src/vexcms/collections/headers.ts` — relocated `headers`' inline `admin.livePreview.url` into `vex.config.ts`'s `admin.livePreview.collections` map, and added the server-resolved `siteSettings` live-preview URL — mechanical relocation of existing behaviour, not a new feature.
- **Drafts/live-preview, now fully synced** (previously deferred, resolved this pass): `src/vexcms/collections/pages.ts` gained `versions:{drafts:true, autosave:{enabled:true}}` exactly as `apps/www` has it, and its `validate()` switched from raw `ctx.db.query(...)` to `vex.find({...})`. `convex/pages.ts` gained `getBySlugPreview` (session-authenticated, gated on `DRAFT_ACTIONS.readDrafts`, never bypasses access). `src/lib/useSitePreviewMode.ts` (new) detects an active live-preview session. `src/app/(frontend)/(site)/PageContent.tsx` now swaps between `getBySlug`/`getBySlugPreview` based on that hook. No access.ts changes needed: `admin`'s `"*": true` wildcard already grants every action on every resource regardless of the `resources` array (confirmed — the admin panel's existing CRUD on `pages`/`headers`/`footers`/`themes` already works today despite none of them being registered as `resources` in `access.ts`, so `readDrafts` reaches admin the same way).
- `src/app/api/vex/revalidate/route.ts` (new marketing-site override) — wires `listCollection` for the "Revalidate all" button, keyed to `api.pages.publishedSlugs` (base-nextjs ships no `pages` collection, so the override lives here, not in base).
- `convex/seed.ts` — fixed the "Stark × Ember" theme preset's stale `primary`/`destructive` oklch values (`60.5%`/`57.7%` → `54%`/`54%`, matching both `apps/www` and `apps/test`, which agree with each other — the template was the only outlier) and the matching `globals.css` `--primary`/`--destructive` tokens + hex comments. Also fixed (prior pass, step-17 verify sweep): renamed the "Code Showcase" illustrative example collection `posts`→`articles`, dropped `richtext-plate` from a stats string, reworded a `public-copy.md`-colliding FAQ sentence.
- `src/app/(frontend)/(site)/{NotFoundContent,not-found}.tsx` (new) — fully generic 404 (no www branding).
- Regenerated `convex/schema.ts` (added `vex_versions`/`vex_views`), `convex/vex.schema.ts`/`src/vex.types.ts` via the fixed `regen-template-schema.mjs` run against a temporary in-repo merge of `base-nextjs`+`marketing-site` (deleted after use — the overlay has no standalone `tsconfig.json`/`node_modules`); registered `images`/`vex/versions` in `convex/_generated/api.d.ts`.

**Tried and reverted — breaks a step-18 gate** (recorded per the lead's rule: "do not sync" only where it breaks a gate, with the failing output as the reason):
- `src/app/(frontend)/(site)/page.tsx`'s try/catch removal: removing it and letting `vex.query(api.pages.getBySlug, {slug:"home"})` throw unguarded reproduces exactly: `Error occurred prerendering page "/"` → `Export encountered an error on /(frontend)/(site)/page: /, exiting the build` → `pnpm build — exit 1` in `verify-scaffold.mjs`. This route is statically prerendered (`export const revalidate = 3600`, no `generateStaticParams` gate), and a fresh scaffold's placeholder env has no reachable Convex deployment at build time — `apps/www` always has a live deployment during its own build, so its unguarded version never hits this. The try/catch stays.
- `src/app/(frontend)/(site)/[slug]/page.tsx` needed **no change**: it already has a more sophisticated version of the same fix than `apps/www`'s — a `reachable` flag distinguishes "deployment unreachable" (swallow, don't 404, let the client hydrate) from "deployment answered, slug genuinely missing" (`notFound()`), exactly the behavior `apps/www`'s simpler always-throw version lacks the nuance for. The template's own doc comment explains this is deliberate (CI builds with placeholder env must not fail `next build`). Confirmed via the www diff that the only *other* difference is cosmetic (`vexStaticParams` argument order).

**Deliberately not synced — content/design decision, not a drift fix**:
- `src/vexcms/blocks/FAQ/config.ts`'s cost-FAQ wording beyond the one `public-copy.md` collision already fixed, and `Roadmap/config.ts`'s copy — generic template copy per decision 6, independent of either app's current real-feature-status wording.
- `src/app/layout.tsx`'s Geist-font-via-`localFont` Turbopack workaround and `viewport.themeColor` — narrow, Next-version-dependent workarounds with no template-side symptom to fix; `<Toaster/>`'s only consumers are excluded demo components.
- `src/app/robots.ts`/`sitemap.ts`/`src/lib/metadata.ts` — `@vexcms/next/seo`'s `createVexRobots`/`createVexSitemap`/`vexMetadata` are current, unremoved APIs that already generalize the exact fixes `apps/www` made by hand (one doc comment says so verbatim); the template's helper-based versions are already correct, not stale.

## MISSING / CHANGED / ORPHANED — apps/www (base-nextjs, marketing-site)

| Path | Bucket | Template | Disposition | Reason |
|---|---|---|---|---|
| `.env.dev`/`.env.example`/`.env.local`/`.env.prod` | MISSING | — | do not add | Dev/deploy-only dotfiles; `.env.example` covered by the installer-marker `_env.example` (ORPHANED, correct as-is). |
| `.gitignore`/`.prettierignore`/`.prettierrc` | MISSING | — | do not add | Covered by `_gitignore`/`_prettierignore`/`_prettierrc` installer markers (ORPHANED, correct as-is; content confirmed matching). |
| `CHANGELOG.md`, `audit/*.json`, `coverage/coverage-summary.json`, `e2e/**`, `lighthouserc.cjs`, `playwright.config.ts`, `test-results/.last-run.json`, `vercel.json`, `vitest.config.ts`, `*.test.ts`/`*.test.tsx` | MISSING | — | do not add | Sandbox/dev-only junk per the skill's own exclusion list. |
| `convex/auth/anonymousUsers.{ts,test.ts}`, `convex/auth/rateLimits.{ts,test.ts}`, `convex/crons.ts` | MISSING | — | do not add | Explicitly on the "never in any template" list. |
| `convex/posts.ts`, `src/vexcms/collections/posts.ts`, `src/app/(frontend)/(site)/posts/[slug]/*` | MISSING | — | do not add | Posts excluded from `marketing-site` (base-nextjs already ships posts — decision 6). |
| `src/app/(vexcms)/admin/error.tsx`, `src/app/tour/*`, `src/lib/routes.ts` | MISSING | — | do not add | `/tour` explicitly excluded from every template (spec line 2560/2584). |
| `src/components/AdminDemoButton.tsx` | MISSING | — | do not add | Live-demo-only feature (opens the real admin panel read-only for anonymous visitors) — not a default a real scaffold should ship. |
| `src/components/TestimonialBulkApproveAction.tsx`, `src/components/TestimonialFeatureRowAction.tsx`, `src/vexcms/collections/{leads,products,testimonials}.ts` | MISSING | — | do not add | Live-demo showcase collections/actions (`access.ts`'s own "Live-demo content" comment block). |
| `src/lib/analytics.ts` | MISSING | — | do not add | Explicitly excluded — no analytics in any template. |
| `src/components/ui/*.test.tsx`, `convex/readOnlyAccess.test.ts`, `src/lib/csp.test.ts`, `src/testing/createConvexTest.ts`, `src/vexcms/admin.test.ts` | MISSING | — | do not add | `src/testing/**` and test files, explicitly excluded. |
| `convex/_generated/api.d.ts` [marketing-site] | CHANGED | marketing-site | regenerated | Registers `images`/`vex/versions`; remaining diff is registration of excluded modules (anonymousUsers/rateLimits/crons/posts/rate-limiter `components`) — expected. |
| `convex/auth/api.ts`, `convex/auth/schema.ts`, `convex/convex.config.ts`, `convex/tsconfig.json`, `tsconfig.tsbuildinfo` [base-nextjs] | CHANGED | base-nextjs | do not sync | `auth/api.ts`/`convex.config.ts` diffs are www-only org-removal / excluded rate-limiter; `auth/schema.ts` already has the required `roles.input:false` fix in both; `tsconfig.json`/`tsconfig.tsbuildinfo` are www-local drift / generated build cache. |
| `convex/http.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Adds `limitAuthRequest` from the excluded `rateLimits.ts`. |
| `convex/images.ts` [marketing-site] | CHANGED | marketing-site | **synced** | See Actions taken. |
| `convex/pages.ts`, `src/lib/useSitePreviewMode.ts`, `src/app/(frontend)/(site)/PageContent.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | Live-preview/drafts base-layer swap — see Actions taken (resolved; previously deferred). |
| `convex/schema.ts`, `convex/vex.schema.ts`, `src/vex.types.ts` [marketing-site] | CHANGED | marketing-site | regenerated | Now carries `vex_versions`/`vex_views` with a real consumer (`pages`'s drafts); excluded-collection tables correctly absent. |
| `convex/seed.ts` [marketing-site] | CHANGED | marketing-site | **synced** (partial) + do not sync (rest) | Brand-color fix applied (see Actions taken). Structural content (sections/comment style) stays hand-authored/intentionally divergent per the 2026-09-14 changelog entry ("template ships generic starter content"); the "Built on Convex" Split-block marketing copy is an editorial question, out of this skill's scope. |
| `convex/tsconfig.json` [base-nextjs] | — | — | (see `auth/api.ts` row above) | |
| `convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | `getAuth` DRY-refactor hoist attempted and reverted — see Actions taken (breaks the `--orgs`-declined installer step). Remaining diff vs `apps/www` is www's own org-removal; base correctly keeps organizations (matches `apps/test`). |
| `convex/vex/firstUser.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** | `vexMutation` fix — see Actions taken. |
| `convex/vex/versions.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (new) | See Actions taken; style-only diff remains (template's no-semicolon convention). |
| `next.config.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (partial) | CSP/security-headers + `htmlLimitedBots` — see Actions taken. `workspaceSourceAliases()` monorepo-dev-only, not ported. |
| `src/app/(frontend)/(site)/NotFoundContent.tsx`, `not-found.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | Generic 404, added; remaining diff is doc-comment trimming of `/tour`/posts references that don't apply. |
| `src/app/(frontend)/(site)/[slug]/page.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Template's version is already a more correct superset of `apps/www`'s fix — see "Tried and reverted" above. No change needed. |
| `src/app/(frontend)/(site)/page.tsx` [marketing-site] | CHANGED | marketing-site | do not sync — breaks build gate | See "Tried and reverted" above; `verify-scaffold.mjs`'s `pnpm build` step fails with the recorded prerender error. |
| `src/app/(vexcms)/admin/[[...path]]/page.tsx` [base-nextjs] | CHANGED | base-nextjs | do not sync | Spec-confirmed (line 2585): redirect target is `/tour`-specific; template correctly keeps `/unauthorized`. |
| `src/app/(vexcms)/admin/layout.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Comment-only rewording (TTFB perf-measurement writeup); zero functional change. |
| `src/app/@auth/(.)auth/[pathname]/view.tsx` [base-nextjs] | CHANGED | base-nextjs | **synced** | Real `DialogTitle` a11y fix — see Actions taken. |
| `src/app/api/vex/revalidate/route.ts` [marketing-site] | CHANGED | marketing-site | **synced** (new override) | See Actions taken (resolved; previously deferred). |
| `src/app/globals.css`, `src/components/ui/*.tsx` (10 files) [base-nextjs] | CHANGED | base-nextjs | **synced** | `focus-ring` utility + consolidation + a11y attributes — see Actions taken. |
| `src/app/layout.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | See "Deliberately not synced" above. |
| `src/app/not-found.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (new override) | See Actions taken (resolved; previously deferred). |
| `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/metadata.ts` [marketing-site] | CHANGED | marketing-site | do not sync | See "Deliberately not synced" above. |
| `src/app/unauthorized/page.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (new override) | See Actions taken. |
| `src/auth/access.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Entire diff is the live-demo anonymous-admin-read feature (`adminPanel.access:true` for anon) plus excluded demo-collection resources. |
| `src/auth/hasPermission.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** | `"changes"` omission — see Actions taken. |
| `src/auth/server.ts`, `src/auth/serverUtils.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Functional diff is the excluded `withClientIpAttestation`/`AUTH_PROXY_SECRET` feature verbatim. |
| `src/components/FirstAdminBootstrap.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | Spec-mandated fix. |
| `src/components/SessionButton.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (new, partial) | Ported minus the anonymous-demo branch — see Actions taken (resolved; previously deferred). |
| `src/components/ThemeLive.tsx`, `src/components/ThemeStyle.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Semicolon/type-cast-removal style only. |
| `src/components/providers/{auth,convex,server}.tsx`, `src/context/AuthContext.tsx` [base-nextjs] | CHANGED | base-nextjs | do not sync | Comment-only, or (AuthContext) www-only `organization` removal — base correctly keeps organizations. |
| `src/db/constants/auth.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Backs excluded anonymous-user/rate-limit features; `AUTH_COOKIE_PREFIX` literal-vs-marker is the expected real-app-vs-template asymmetry. |
| `src/db/constants/index.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | `PageDoc`/`PageID` tried and reverted — see Actions taken. `TABLE_SLUG_ORGANIZATIONS` removal is www-only drift. |
| `src/lib/csp.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (new) | See Actions taken (resolved; previously deferred). |
| `src/lib/resolvePagePath.ts`, `src/lib/vex.ts`, `src/vex.config.server.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Style-only. |
| `src/vexcms/api.ts` [marketing-site] | CHANGED | marketing-site | **synced** (partial) | `"server only"` pragma; org-resolution code is template-specific, untouched. |
| `src/vexcms/blocks/FAQ/config.ts`, `src/vexcms/blocks/Roadmap/config.ts` [marketing-site] | CHANGED | marketing-site | do not sync | See "Deliberately not synced" above. |
| `src/vexcms/blocks/Header/index.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (partial) | `aria-label` + `SessionButton` wiring — see Actions taken. `AdminDemoButton` itself stays excluded. |
| `src/vexcms/blocks/Roadmap/index.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | ARIA tabs wiring; remaining diff is Roadmap's content-copy divergence (intentionally generic). |
| `src/vexcms/collections/headers.ts`, `src/vex.config.ts` [marketing-site] | CHANGED | marketing-site | **synced** | livePreview relocation — see Actions taken. |
| `src/vexcms/collections/index.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Exports for the excluded `leads`/`posts`/`products`/`testimonials` collections. |
| `src/vexcms/collections/pages.ts` [marketing-site] | CHANGED | marketing-site | **synced** | drafts/autosave + `vex.find()` validate — see Actions taken (resolved; previously deferred). |
| `_env.example`, `_gitignore`, `_prettierignore`, `_prettierrc`, `src/app/(frontend)/page.tsx` [base-nextjs, ORPHANED] | ORPHANED | base-nextjs | n/a — correct as-is | Installer-marker dotfiles; `(frontend)/page.tsx` is the documented overlay-removal file. |

## MISSING / CHANGED / ORPHANED — apps/test (base-nextjs)

| Path | Bucket | Template | Disposition | Reason |
|---|---|---|---|---|
| `.DS_Store`, `.env.example`, `.env.local`, `.gitignore`, `.prettierignore`, `.prettierrc`, `AGENTS.md`, `CLAUDE.md`, `audit/*.json`, `coverage/coverage-summary.json`, `e2e/**`, `playwright.config.ts`, `pnpm-workspace.yaml`, `skills-lock.json`, `test-results/.last-run.json`, `traces/*.json`, `vitest.config.ts`, `*.test.ts`, `src/lib/csp.test.ts` | MISSING | — | do not add | Sandbox/monorepo/dotfile/test-artifact junk; dotfiles covered by installer markers as above. |
| `convex/auth/config.ts` | MISSING | base-nextjs | **flag — possible dead code** | A Convex `applicationID`/`domain` provider block distinct from the already-matching `convex/auth.config.ts`; no importer found besides the auto-generated `api.d.ts` registration. Not added — looks like leftover/dead config in `apps/test` itself, not a template gap. Lead should verify on the `apps/test` side. |
| `convex/posts.ts`, `src/vexcms/collections/posts.ts`, `src/app/(frontend)/(site)/posts/[slug]/*` | MISSING | — | do not add | Posts excluded (base-nextjs already ships its own posts collection). |
| `convex/telemetry/**` | MISSING | — | do not add | Demo/dogfood telemetry feature, not a shipped CMS feature. |
| `convex/vexContext.ts` | MISSING | base-nextjs | **flag — possible dead code** | No `withVexConfig`/`withVexConfigMutation` callers found anywhere in `convex/` or `src/`; only reference is the auto-generated `api.d.ts` registration. Not added — appears unused in `apps/test` itself. |
| `src/app/(vexcms)/admin/clientProviders.tsx`, `src/app/(vexcms)/admin/layout.tsx`'s extra wrap | MISSING/CHANGED | base-nextjs | **flag for lead** | Mounts a second `VexConfigProvider` scoped to `/admin`, contradicting the root `ClientProviders`' own doc comment ("two mounts would be two provenances for one config"). Looks like an `apps/test`-side inconsistency/regression rather than a template gap. Not ported. |
| `src/app/(vexcms)/admin/error.tsx`, `src/app/tour/*`, `src/lib/routes.ts` | MISSING | — | do not add | `/tour` excluded everywhere. |
| `src/auth/access.typecheck.ts`, `src/vexcms/collections/{fields,pages}.typecheck.ts`, `src/vexcms/admin.test.ts` | MISSING | — | do not add | Compile-time pin tests / test files, hard-coded to excluded demo collections. |
| `src/auth/options.ts`, `src/auth/plugins.ts`, `src/auth/schema.ts` | MISSING | base-nextjs | n/a — path-translated | Already present in the template at `convex/auth/{options,plugins/index,schema}.ts` (schema.ts already carries `roles.input:false`; `plugins.ts`'s template copy is a superset, adding `nextCookies()`). |
| `src/auth/permissions.ts` | MISSING | base-nextjs | do not add | Generic access-check helpers, but only callers are the excluded demo collections' access rules. |
| `src/components/AdminDemoButton.tsx`, `TestimonialBulkApproveAction.tsx`, `TestimonialFeatureRowAction.tsx` | MISSING | — | do not add | Demo-only, tied to excluded guest-role/testimonials flows. |
| `src/vexcms/admin/{PhoneBeforeInputHint,PhoneInputWithHint,TrimOnBlurTextInput,WordCountField}.tsx` | MISSING | — | do not add | Per-instance `admin.components.Field` components — prohibited pattern, tied to excluded dogfood fields regardless. |
| `src/vexcms/blocks/{Content,Feature,LogoCloud,Pricing,Testimonial}/*` | MISSING | — | do not add | `apps/test`'s own comments label these "test-only blocks — no www equivalent"; `marketing-site` is sourced from `apps/www`. |
| `src/vexcms/collections/{articles,caseStudies,changelog,comments,editorialFields,fields,telemetryEvents,telemetryProjects,testimonials}.ts` | MISSING | — | do not add | Dogfood/demo-showcase collections. |
| `src/vexcms/components/{CachePurgeNote,CopyDocumentIdMenuItem,EditorialChecklist,FieldsTitleInput,FieldsWordCount,SaveWithAnalytics}.tsx` | MISSING | — | do not add | Each dogfoods a specific admin-contribution point or ties to excluded fields/analytics. |
| `src/vexcms/globals/{announcement,nav}.ts` | MISSING | — | do not add | `announcement` is a draft/versioning dogfood surface; `nav` is `apps/test`-specific. |
| `convex/_generated/api.d.ts`, `convex/schema.ts` [marketing-site] | CHANGED | marketing-site | regenerated | See www table. |
| `convex/auth/index.ts`, `convex/auth/sessions.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Path-translation / brace-style noise only. |
| `convex/http.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Excluded telemetry-ingest route. |
| `convex/images.ts` [marketing-site] | CHANGED | marketing-site | **synced** | See www table. |
| `convex/pages.ts`, `src/app/(frontend)/(site)/PageContent.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | Live-preview/drafts — see www table; `apps/test`'s own `pages` collection is a different, dogfood resource, but `marketing-site` sources from `apps/www`'s shape here. |
| `convex/theme.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Pure style; no functional change. |
| `convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | `apps/test` has hoisted its own `getAuth` export; porting the identical refactor into the template was attempted and reverted — see Actions taken. `apps/test` isn't scaffolded through the installer, so it's free to refactor; the template must keep the per-file shape. |
| `convex/vex/firstUser.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** | See www table. |
| `convex/vex/versions.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (new) | See www table; `apps/test` doesn't have this file yet (MISSING there before this sync, now exists in the template only — fine, it's base-owned and generically useful). |
| `next.config.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (partial) | CSP wiring — see www table; `apps/test`'s own `turbopackMemoryEviction`/demo `images.remotePatterns` stay app-specific, not ported. |
| `src/app/(frontend)/(site)/[slug]/page.tsx`, `page.tsx` [marketing-site] | CHANGED | marketing-site | do not sync (page.tsx breaks build gate; [slug] needs no change) | See www table / "Tried and reverted" above. |
| `src/app/(frontend)/(site)/layout.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Adds `<Toaster/>`, whose only consumers are excluded demo components. |
| `src/app/(vexcms)/admin/[[...path]]/page.tsx` [base-nextjs] | CHANGED | base-nextjs | do not sync | `/tour`-redirect exclusion. |
| `src/app/@auth/(.)auth/[pathname]/view.tsx` [base-nextjs] | CHANGED | base-nextjs | **synced** | See www table. |
| `src/app/api/vex/revalidate/route.ts` [marketing-site] | CHANGED | marketing-site | **synced** (new override) | See www table. |
| `src/app/globals.css`, `src/components/ui/*.tsx` [base-nextjs] | CHANGED | base-nextjs | **synced** | `focus-ring` consolidation — see www table. |
| `src/app/layout.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Comment rewording + the same no-value `<Toaster/>` addition. |
| `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/metadata.ts` [marketing-site] | CHANGED | marketing-site | do not sync | See "Deliberately not synced" above. |
| `src/app/unauthorized/page.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | See www table. |
| `src/auth/access.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Demo-collection resources/`guest` anonRole tier; base's minimal resource set is correct. |
| `src/auth/server.ts`, `src/auth/serverUtils.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | Comment-wording-only / brace-style only. |
| `src/components/Container.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | `apps/test`'s `cn` migration has no counterpart in `apps/www` (the real source for `marketing-site`); `apps/test`-only drift. |
| `src/components/FirstAdminBootstrap.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | Spec-mandated fix. |
| `src/components/SessionButton.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (new, partial) | See www table. |
| `src/components/ThemeLive.tsx`, `ThemeStyle.tsx` [marketing-site] | CHANGED | marketing-site | do not sync | Style-only. |
| `src/components/providers/{auth,convex,server}.tsx` [base-nextjs] | CHANGED | base-nextjs | do not sync | Comment-only. |
| `src/db/constants/auth.ts`, `index.ts` [base-nextjs] | CHANGED | base-nextjs | do not sync | New roles tied to excluded demo/anon features; `PageDoc`/`PageID` tried and reverted (see Actions taken); dead `AUTH_PROVIDERS`/`COLLECTION_SLUG_MEDIA` not ported. |
| `src/lib/csp.ts` [base-nextjs] | CHANGED | base-nextjs | **synced** (new) | See www table. |
| `src/lib/highlight.ts`, `highlightClient.ts` [marketing-site] | CHANGED | marketing-site | **synced** | See www table. |
| `src/lib/resolvePagePath.ts`, `vex.ts`, `src/vex.config.server.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Style-only. |
| `src/lib/useSitePreviewMode.ts` [marketing-site] | CHANGED | marketing-site | **synced** (new) | See www table. |
| `src/proxy.ts` [marketing-site] | CHANGED | marketing-site | **synced** | Dead-allowlist removal. |
| `src/vex.config.ts` [marketing-site] | CHANGED | marketing-site | do not sync | All substantive `apps/test` differences are demo collections/globals/prohibited components/`@vexcms/richtext-plate` — `marketing-site` sources from `apps/www`'s `vex.config.ts`, not `apps/test`'s. |
| `src/vexcms/api.ts` [marketing-site] | CHANGED | marketing-site | **synced** | `"server only"` pragma. |
| `src/vexcms/blocks/CTA/{config,index}.tsx` [marketing-site] | CHANGED | marketing-site | **flag for lead** | `apps/test` has a real CTA internal-vs-external-link feature that `apps/www`'s `CTA` doesn't carry — not portable 1:1 from this comparison; would need to land in `apps/www` first. Not ported. |
| `src/vexcms/blocks/FAQ/config.ts`, `Roadmap/config.ts` [marketing-site] | CHANGED | marketing-site | do not sync | See "Deliberately not synced" above. |
| `src/vexcms/blocks/Header/index.tsx` [marketing-site] | CHANGED | marketing-site | **synced** (partial) | See www table. |
| `src/vexcms/blocks/Roadmap/index.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | ARIA fix, confirmed independently via `apps/test`. |
| `src/vexcms/blocks/Split/index.tsx` [marketing-site] | CHANGED | marketing-site | **synced** | `sizes`/`alt` fix. |
| `src/vexcms/blocks/{config,index}.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Registers `apps/test`'s 5 excluded dogfood blocks. |
| `src/vexcms/collections/headers.ts` [marketing-site] | CHANGED | marketing-site | **synced** | livePreview relocation. |
| `src/vexcms/collections/index.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Registers excluded demo collections. |
| `src/vexcms/collections/pages.ts` [marketing-site] | CHANGED | marketing-site | **synced** | See www table; `apps/test`'s dogfood "Advanced" tab/testField/legacy `content` field stay out (not applicable regardless, since `marketing-site` sources from `apps/www`'s `pages.ts`, which has no such tab). |
| `src/vexcms/collections/themeColors.ts` [marketing-site] | CHANGED | marketing-site | do not sync | Pure function-order reshuffle in `apps/test`'s copy; `apps/www`'s copy has no such diff. |
| `src/vexcms/collections/users.ts` [marketing-site] | CHANGED | marketing-site | do not sync | `apps/test` hides "Duplicate" on user docs; verified `apps/www`'s `users.ts` has no such code anywhere — `apps/test`-only, not portable from this comparison. Good candidate for `apps/test`/`apps/www` to adopt independently; out of this sync's scope. |
| `src/vexcms/globals/index.ts`, `siteSettings.ts` [marketing-site] | CHANGED | marketing-site | do not sync | `apps/test`'s version registers excluded demo globals; `apps/www`'s `siteSettings.ts` is already byte-identical to the template's. |
| `_env.example`, `_gitignore`, `_prettierignore`, `_prettierrc`, `convex/auth/schema.ts`, `convex/tsconfig.json`, `src/app/(frontend)/page.tsx` [base-nextjs, ORPHANED] | ORPHANED | base-nextjs | n/a — correct as-is | Installer markers; `convex/auth/schema.ts` is the path-translation target of `apps/test`'s `src/auth/schema.ts` (already carries `roles.input:false`); `convex/tsconfig.json` is a genuine structural necessity for a standalone scaffold; `(frontend)/page.tsx` is the documented overlay-removal file. |

## Remaining flags for the lead (no template action taken, outside this session's write access)

- `scripts/regen-template-schema.mjs`'s `loadConfig(configPath)` call-site bug — **the lead already applied this fix** (confirmed: the script now passes `{ configPath, projectDir: cwd }` and runs via `jiti` directly).
- `apps/test`'s `convex/auth/config.ts` and `convex/vexContext.ts` look like dead code (no importers besides generated `api.d.ts` registration).
- `apps/test`'s admin `clientProviders.tsx` double-mounts `VexConfigProvider`, contradicting its own architecture doc comment.
- `apps/test`'s `src/vexcms/collections/users.ts` "hide duplicate action" fix and its `CTA/{config,index}.tsx` internal-link feature have no counterpart in `apps/www` — good candidates for `apps/test`/`apps/www` to adopt independently (would then flow through a future `marketing-site` sync), not portable from this one since `marketing-site` sources from `apps/www`.

## Verify (step 17, spec lines 2626-2630)

- `node scripts/template-diff.mjs --app apps/www` / `--app apps/test`: every remaining CHANGED/MISSING/ORPHANED entry is recorded above with a disposition — nothing unaccounted for.
- Inside `packages/create-vexcms/templates/marketing-site`: `rg -n "richtext-plate|slug: \"posts\"|\"(privacy|accessibility|brand|launch-week)\""`, `rg -ni "buttondown|sponsors|buymeacoffee|discussions"`, and every non-empty `public-copy.md` line fed to `rg -F` all return nothing.

## Re-sync 2026-11-08 — QP polish fixes (QP § Log 09:22Z)

Run: `node scripts/template-diff.mjs --app apps/www` / `--app apps/test` plus a plain `diff` per file QP changed after the first sync. Every app file newer than the first sync was checked; only the rows below changed in a template.

| Path | Template | Disposition | Reason |
|---|---|---|---|
| `src/components/ui/dialog.tsx` | base-nextjs | **synced** (byte-identical to `apps/test`) | reference-counted `inert` on `#main` (`openDialogCount`) |
| `src/app/@auth/(.)auth/[pathname]/view.tsx` | base-nextjs | **synced** (byte-identical) | title from `resolveAuthPageTitle` (`src/lib/authPageTitle.ts`, already identical); `showCloseButton={false}` dropped as in the apps |
| `next.config.ts` | base-nextjs | **synced** (comment only) | `htmlLimitedBots` comment, without QP's `F-073` finding id |
| `eslint.config.mjs` + `package.json` (`eslint-plugin-jsx-a11y` 6.10.2, catalog literal) | base-nextjs | **inlined** | apps import the root `eslint.jsx-a11y.mjs`; a scaffold can't, so the same block is inlined: every recommended rule at its own options, severity `error`, `label-has-for` off |
| `src/components/MediaImage.tsx`, `src/vexcms/blocks/Roadmap/index.tsx`, `src/components/CodePane.tsx` | marketing-site | **synced** (byte-identical to `apps/www`) | alt-wait, tabpanel `tabIndex` (+ the muted-text contrast fix), scroll-region label |
| `convex/images.ts` | marketing-site | **synced** except the doc comment | `normalizeId` + `null` on a bad id; comment keeps generic wording (no "www-only", no "Split screenshots") |
| `src/components/providers/convex.tsx` | base-nextjs | **template-only lint fix** | `() => {}` → `() => undefined`, dropped an unnecessary `as string \| undefined`; scaffold `pnpm lint` failed on both. **Same errors exist in `apps/www` and `apps/test`** (reported, not edited) |
| `src/components/ThemeLive.tsx`, `src/lib/useSitePreviewMode.ts` | marketing-site | **template-only lint fix** | two unnecessary assertions dropped; preview flag read through `useSyncExternalStore` (server snapshot `false`) instead of `setState` in an effect. **Same errors in `apps/www`** (reported, not edited) |
| `*.test.ts(x)` (`dialog`, `MediaImage`, `images`), `e2e/**`, `playwright.config.ts`, `lighthouserc.cjs`, `audit/**` | — | do not add | templates ship no tests or audit tooling |
