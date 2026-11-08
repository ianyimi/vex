---
status: draft
spec_id: 2026-11-06-quality-pass
touches: []
prompt_version: 1
---

# 2026-11-06-quality-pass — Tasks

> Launch-plan item 14, the **quality pass**: V, plus J's width matrix, plus K's conformance review. `dev-spec` interview held 2026-11-06.
> High-care: the developer implements, and `spec.md` gives guided stubs.
> Every step leaves `pnpm typecheck && pnpm test && pnpm lint` green.
>
> **Target:** WCAG 2.2 AA in full, plus 2.4.13 Focus Appearance (AAA). The checklist comes from `sources.md`, which records each normative source's version, URL and fetch date (2026-11-06).
> **Surfaces:** `apps/www` and the admin. The admin is rendered by `apps/test`; its fixes land in `packages/react`. Step 12 then carries every www front-end fix into `apps/test`, which stays a superset of www.
> **Fix boundary:** classes, attributes, markup, and small keyboard/focus handlers (≤ ~30 lines, no public API change). Anything bigger goes to `backlog.md` with its audit evidence. Every fix is browser-verified at the widths it affects.
> **Widths:** 375 / 390 / 640 / 768 / 1024 / 1280 / 1536, plus 767 and 769. 375/390/768/1024 are a regression check against `2026-09-13-discord-post-readiness/audit/*-matrix.json`. The new widths and every surface C–I added get a full pass.
> **CI:** jsx-a11y, component `vitest-axe`, and Playwright axe + Lighthouse CI against each PR's **Vercel preview** of www (`deployment_status`). Admin route-level axe runs locally only. Routes flagged `draft: true` in `e2e/routes.ts` are skipped in CI and audited locally (cross-spec decision 3, 2026-11-07).
> **Out of scope:** auditing `apps/docs` (apart from the statement page), CI gates on `apps/test`, admin e2e in CI, nonce-based CSP, full AAA, component rewrites, a whole-repo K re-review, and the unstaged telemetry work (M lands before step 13).
>
> **Cross-spec handoffs absorbed (2026-11-07):** `2026-11-06-launch-infrastructure` (`/privacy`, `/tour`, the admin `error.tsx`, analytics CSP), `2026-11-06-public-presence` (`/brand`, `/roadmap` copy, `/posts/vexcms-0-1-0`, footer links, `@vexcms/richtext-plate` on www) and `2026-11-06-launch-kit-final-review` (4 launch-week posts, `/launch-week`, `/launch/*.mp4`). Footer link order and the statement's contact line come from `2026-11-06-public-presence/public-copy.md`. Content re-seeds use `seed:reinit` (decision 9). Agents attach to the running www on :3030 (P-024) and never start a dev server.

## Step 1 — Normative checklist + surface inventory [agent]
Why: the brief requires the checklist to come from the fetched sources, not memory. Every later finding cites a row here.
Verify: `sources.md` covers all 31 A and 24 AA rows (including obsolete 4.1.1) plus 2.4.13, and each widget in `inventory.md` maps to an APG pattern in `sources.md`
- [x] `sources.md`: WCAG 2.2 A/AA + 2.4.13 table, ARIA 1.2 + APG patterns, Nu checker, CWV + LHCI, MQ5 preferences, axe/jsx-a11y usage, security headers
- [x] `inventory.md`: every www route and every admin view. www routes: seeded pages via `[slug]` (including `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/launch-week`), home, `/posts/[slug]` (the announcement + the 4 launch-week posts), static `/tour`, auth modal + fallback, 404, `unauthorized`, plus the admin `error.tsx` boundary. Each `packages/react/src/ui` and `apps/www/src/components/ui` primitive is mapped to its APG pattern and underlying library (Base UI / cmdk / custom), plus the C–I surfaces new to this pass. Routes that don't exist yet are listed with their owning spec step
- [x] `inventory.md`: the existing `vitest-axe` coverage (`testing/fieldInputContract.ts`, `fieldCellContract.ts`) and the interactive components it doesn't reach

## Step 2 — Audit tooling, non-blocking [agent]
Why: tools before findings. Everything is installed reporting-only, so lint and CI stay green until step 10 flips the gates.
Verify: `pnpm lint && env -u CI pnpm --filter www exec playwright test e2e/axe.e2e.ts && pnpm --filter www exec lhci collect --collect.numberOfRuns=1 --collect.url=http://localhost:3030/ && node scripts/validate-html.mjs http://localhost:3030/ && pnpm --filter www test` — lint passes with jsx-a11y warnings; the axe suite writes `audit/www-axe.json`; LHCI writes a report; Nu prints its results; vitest collects no `e2e/` file
- [x] `eslint-plugin-jsx-a11y` (6.10.x) in the root `eslint.config.mjs` via `flatConfigs.recommended`, scoped to `**/*.tsx`, every rule at `warn`
- [x] `apps/www`: `@playwright/test` + `@axe-core/playwright` (4.14.x). `playwright.config.ts` (`testMatch: "**/*.e2e.ts"`, so vitest's `src/**` + `convex/**` includes never collect them; `baseURL` from `QUALITY_BASE_URL`, default `http://localhost:3030`; the Vercel bypass header when set). `e2e/routes.ts` exports `QUALITY_ROUTES: { path, draft?: true }[]` from the inventory; posts and pages that are seeded as drafts carry `draft: true`. `e2e/axe.e2e.ts` runs AxeBuilder with the `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa` tags per route, in light + dark, and writes JSON. When `CI` is set it skips `draft` routes
- [x] `apps/www/e2e/widths.e2e.ts`: the DOM width matrix (overflowX, offscreen controls, culprits outside scroll regions) at every width, in the discord matrix's JSON shape, written to `audit/www-width-matrix.json`
- [x] `apps/test`: the same Playwright setup for the admin, signing in as a seeded test user. `e2e/adminAxe.e2e.ts` + `e2e/adminWidths.e2e.ts` → `audit/admin-*.json`. Local only
- [x] `apps/www/lighthouserc.cjs`: mobile preset, the non-draft pages from `e2e/routes.ts` (always including `/` and one `/posts/[slug]` once one is published), assertions at `warn`
- [x] Draft audit procedure in `spec.md`: publish the draft on the dev deployment, run the local suite with `CI` unset, record the result in `findings.md`, then unpublish. The flag is dropped in the same edit that publishes the document for real
- [x] `scripts/validate-html.mjs`: fetches the rendered HTML per route and runs `vnu-jar` (`--format json`) → `audit/*-nu.json`
- [x] Root `.gitignore`: Playwright and LHCI output directories

## Step 3 — Baseline run + findings ledger [agent]
Why: one ledger of every failure, each tied to its criterion, before any fix lands. That makes fixes traceable and gives a measured scope.
Verify: `findings.md` has one row per finding (id, surface, width/theme, criterion or APG pattern, tool, evidence, disposition `fix`/`backlog`) and none is undispositioned
- [x] Run axe, widths, Lighthouse and Nu against local www and the local admin; commit the `audit/*.json` output
- [x] Triage the jsx-a11y warnings into the ledger
- [x] Agent keyboard sweep with the `browser` tool (tab order, a visible focus ring, trap + return in every dialog/sheet/popover) over the inventory. Measure the focus indicator against 2.4.11 / 2.4.13; the current `ring-ring/50` utilities are suspect
- [x] Classify each row against the fix boundary; rows needing structural work are marked `backlog`

## Step 4 — Document shell: skip link, landmarks, metadata, preferences [dev]
Why: page-wide fixes that clear whole classes of axe/Nu rows across every route at once. They have to land before per-component work so later re-runs aren't noise.
Verify: axe re-run shows the `bypass`/`landmark-*`/`region`/`document-title`/`html-*` rows cleared; Tab from the address bar reaches the skip link first at 375 and 1536; with `prefers-reduced-motion: reduce` emulated, motion primitives render static
- [x] Skip link + `id="main"` target in the www frontend layout and the admin layout (`packages/react` `AdminLayout`)
- [x] Landmarks: one `main`, labelled `nav`s, `header`/`footer` roles across www and the admin shell
- [x] www `layout.tsx`: a `viewport` export with `themeColor` for light/dark; per-page unique `<title>` via the existing `lib/metadata.ts`; the admin's per-view document titles
- [x] Focus appearance: one shared focus-visible treatment meeting 2.4.13 (≥ 2 CSS px perimeter, 3:1 contrast against both adjacent colors) in the `packages/react` theme tokens and www `globals.css`; replace the low-contrast `ring-*/50` variants
- [x] `prefers-reduced-motion` in `motion-primitives/` (`TextEffect`, `AnimatedGroup`, `reveal.module.css`) and in admin transitions; `forced-colors` focus/selection visibility
- [x] Re-run the step 2 tools; update the `findings.md` dispositions

## Step 5 — UI primitives against APG [dev]
Why: every admin view and www block composes these, so fixing the primitive fixes every consumer. Colocated axe tests keep them fixed.
Verify: `pnpm --filter @vexcms/react test -- ui` passes with a new `expectNoA11yViolations` + keyboard test per interactive primitive; the browser re-check of each APG keyboard model is recorded in `findings.md`
- [x] Per primitive in `packages/react/src/ui` (dialog, alert-dialog, sheet, dropdown-menu, select, popover, command/combobox, multi-select, tabs, accordion, checkbox, radio-group, tooltip, sidebar, pagination, data-table, resizable): roles/states/names and the keyboard model fixed within the boundary. A colocated `<name>.test.tsx` asserts no axe violations plus the APG keys that pattern requires
- [x] The same for `apps/www/src/components/ui` primitives that www actually renders
- [x] Icon-only buttons get accessible names; target size ≥ 24×24 CSS px (2.5.8) or the spacing exception

## Step 6 — Admin views, fields, and the width matrix [dev]
Why: the surfaces C–I added have never been audited, and the closeout leftovers live here. Depends on steps 4–5 so findings left at this point are view-specific.
Verify: `audit/admin-axe.json` has no violations; `audit/admin-width-matrix.json` is clean at every width (apart from the data table's deliberate scroll region); the sidebar flip across 767/768/769 is verified in both directions; each closeout item is browser-verified, with screenshot evidence in `findings.md`
- [ ] Views: list view (toolbar, search, filter builder, saved-view tabs, row/bulk actions, peek), edit view (sticky header actions, actions menu, unsaved-changes dialog, status badge, version history, live-preview panel), media list/edit/upload/library grid, globals, dashboard, modals, `AdminTopNav` breadcrumb overflow
- [ ] Fields: error association (`aria-describedby`/`aria-invalid`), `tabs`/`collapsible` APG patterns, the richtext toolbar as an APG toolbar, relationship/upload pickers
- [ ] Closeout leftovers verified and fixed within the boundary: array min/max errors, the `updatedAt` sidebar field (`versions/DocumentTimestamps.tsx`), upload picker search/pagination/MIME filter (`media/MediaLibraryGrid.tsx`), number `step`/`min`/`max` (`fields/number/Field.tsx`), the email cell's `mailto:` link (`fields/email/Cell.tsx`)
- [ ] Contrast in light, dark and one database theme (`ThemeStyle`), measured in the browser (axe `color-contrast` in Playwright, not jsdom)
- [ ] Structural findings → `backlog.md`

## Step 7 — www pages, blocks, images, performance [dev]
Why: the public surface a stranger sees first, and the one the Lighthouse budgets gate.
Verify: `audit/www-axe.json` and `audit/www-nu.json` clean; `audit/www-width-matrix.json` clean at every width; the LHCI local run meets the budgets (a11y 100; perf/best-practices/SEO ≥ 90; LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms; mobile)
- [x] Every block in `apps/www` renders valid, labelled markup (heading order, link purpose, lists, code panes)
- [x] Image `alt` end to end: upload field alt → media doc → rendered `<img>`; decorative images `alt=""`; `next/image` `sizes` on every responsive image
- [x] Font loading (preload, `display: swap` already set) and LCP image priority on the home page
- [x] Auth modal and fallback routes: dialog pattern, labelled form, error announcement (4.1.3)
- [x] `/posts/[slug]` (Plate static renderer, first richtext on www): heading order, list markup, image `alt`, code blocks; Lighthouse budgets met with the Plate bundle. Port the fixes to `apps/test`'s identical tree in step 12
- [x] `/tour` (static, `next/image` screenshots) and the admin `error.tsx` fallback: alt text, headings, focus on the retry link
- [x] Structural findings → `backlog.md`

## Step 8 — Security, caching and preference headers on www [dev]
Why: configuration coverage from the brief. It's static, so it ships with the build and is verified on the real Vercel preview, CDN included.
Verify: `curl -sI <preview-url>` shows CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`; the browser console shows no CSP violations on any route, including the live-preview iframe, the admin demo, `/posts/[slug]`, `/brand` downloads and `/launch/*.mp4` playback, with Web Analytics and Speed Insights reporting
- [ ] `apps/www/next.config.ts` `headers()`: a static CSP with no nonces, emitted only when `NODE_ENV === "production"` (dev's `va.vercel-scripts.com` debug scripts need no allowance). Scripts are `'self'` (covers `/_vercel/insights` and `/_vercel/speed-insights`) plus `sha256` hashes for the `ThemeScript` inline script; `style-src` allows `'unsafe-inline'` (the `ThemeStyle` CSS); `connect-src` covers `'self'`, the Convex URL + its websocket; `img-src` covers `'self'` and the Convex storage host; `media-src 'self'`; `frame-ancestors` matches live preview's allowed origins; `form-action 'self'`. Every third-party link added by public-presence (Sponsors, Buy Me a Coffee, Buttondown, Discussions) is navigation and needs no directive
- [ ] HSTS, nosniff, `Referrer-Policy: strict-origin-when-cross-origin`, a minimal `Permissions-Policy`; cache headers for static assets vs ISR pages are documented in `findings.md`

## Step 9 — Manual pass [dev]
Why: automated tools catch a minority of WCAG failures. The agent prepares the checklists; the developer runs them.
Verify: each row of `manual-checklist.md` is marked pass or links a `findings.md` row; any new `fix` rows are fixed and re-verified
- [ ] `[agent]` `manual-checklist.md` generated from `sources.md`'s manual/partial rows × the inventory
- [ ] Keyboard-only through every flow (sign in, create/edit/publish, media upload, list filters/saved views, live preview, www navigation)
- [ ] VoiceOver on macOS Safari and iOS Safari
- [ ] 200% zoom, and reflow at 320 CSS px
- [ ] Contrast in light, dark and a database theme
- [ ] Fix the new findings within the boundary; structural → `backlog.md`

## Step 10 — CI gates [agent]
Why: keeps it fixed. Flipped only after steps 4–9 leave every gate green.
Verify: a PR touching www gets `quality / axe` and `quality / lighthouse` checks on its Vercel preview, and both pass; a deliberate violation (unlabelled input) makes `pnpm lint` and the axe check fail; reverted afterwards
- [ ] `eslint.config.mjs`: jsx-a11y rules → `error`
- [ ] `.github/workflows/quality.yml`: on `deployment_status` (`state == success`, www's Preview environment only), runs the Playwright axe suite (`CI=1`, so `draft` routes are skipped) + `lhci autorun` against `deployment_status.target_url`, with `VERCEL_AUTOMATION_BYPASS_SECRET` as the protection-bypass header
- [ ] `lighthouserc.cjs` assertions → `error` at the agreed budgets
- [ ] `[dev]` Add the bypass secret in GitHub; mark both checks required in branch protection

## Step 11 — Accessibility statement [dev]
Why: deliverable in the brief. It's written last among the www changes so its known-exceptions list is final. Runs after public-presence steps 1–2 (`public-copy.md` contact line, footer list, live `hello@vexcms.dev`).
Verify: after `seed:reinit` on dev, `/accessibility` renders on :3030, the footer link sits at its `public-copy.md` § Footer position, and the page passes axe; the contact line matches `public-copy.md` byte for byte; the docs page builds
- [x] `apps/www/convex/seed.ts`: an `accessibility` page (conformance target WCAG 2.2 AA + 2.4.13, test date, methods, known exceptions from `backlog.md`, the contact line quoted from `public-copy.md`) plus its footer link at the § Footer position. Mirrors how every other www page is CMS-seeded, like launch-infra's `/privacy`
- [x] `apps/docs/src/content/docs/accessibility.md`: the same statement scoped to the admin panel and packages, with the same contact line

## Step 12 — Port www fixes to apps/test [dev]
Why: `apps/test` stays an extended version of www (decision 2026-11-06), and N syncs the templates from both apps next.
Verify: `node scripts/template-diff.mjs` (or a plain diff) shows www's fixed files matching in `apps/test`, apart from test-only extensions; the local Playwright axe run against `apps/test`'s frontend routes (including `posts/[slug]`) is clean
- [ ] Carry over the layout, metadata, motion, component, block, `next.config.ts` header and seed changes; keep the posts collection, fields collection and other test-only extensions. Launch-infrastructure step 16 ports `/privacy`, `/tour` and the bootstrap fix; whichever of the two runs second ports onto the other's result
- [ ] `apps/test` `posts/[slug]` audited with the same tools
- [ ] For N (launch-infra steps 17–20): the `marketing-site` template excludes `/accessibility` and its footer link, like every other vexcms-specific page (cross-spec decision 6)

## Step 13 — K conformance review (H, I, M, launch-infra 2–7, public-presence 14, this pass) [agent]
Why: it checks code written since K against the recorded conventions before N copies it into the templates (developer decision 2026-11-07: the scope also covers launch-infra steps 2–7 and public-presence step 14). Runs after M is committed and after those steps land, directly before N (launch-infra step 17).
Verify: the last `review-<n>.md` has no open violation or gap; `harness doctor` is clean; full typecheck/test/lint/build green
- [ ] One reviewer per touched package/app, using K's pass-2 method (grouping, file roles, exports/imports, identifiers). It covers code from H (`2026-10-26-edit-view-overhaul`), I (`2026-10-26-list-view-overhaul`), M (`2026-10-26-build-time-telemetry`), launch-infra steps 2–7 (`packages/core` roles guard, `packages/better-auth` adapter, www Convex rate limits/purge/test harness), public-presence step 14 (www `posts` collection, `convex/posts.ts`, `lib/useSitePreviewMode.ts`) and this spec
- [ ] `[dev]` Decide each violation/gap; apply; repeat until clean; record new rules in `naming-conventions.md` and the Development docs

## Step 14 — Bookkeeping [agent]
Why: plan and backlog stay the source of truth for what comes next (N).
Verify: launch plan items 14 and J/V/K tasks ticked with evidence; `harness doctor` clean
- [x] `v0.1.0-launch-plan.md`: tick item 14 and the J, V and K task lists, with commit refs
- [x] `backlog.md`: every `backlog` row from `findings.md`, with its evidence
