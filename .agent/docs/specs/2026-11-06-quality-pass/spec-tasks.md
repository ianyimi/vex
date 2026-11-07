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
> **CI:** jsx-a11y, component `vitest-axe`, and Playwright axe + Lighthouse CI against each PR's **Vercel preview** of www (`deployment_status`). Admin route-level axe runs locally only.
> **Out of scope:** auditing `apps/docs` (apart from the statement page), CI gates on `apps/test`, admin e2e in CI, nonce-based CSP, full AAA, component rewrites, a whole-repo K re-review, and the unstaged telemetry work (M lands before step 13).

## Step 1 — Normative checklist + surface inventory [agent]
Why: the brief requires the checklist to come from the fetched sources, not memory. Every later finding cites a row here.
Verify: `sources.md` covers all 31 A and 24 AA rows (including obsolete 4.1.1) plus 2.4.13, and each widget in `inventory.md` maps to an APG pattern in `sources.md`
- [x] `sources.md`: WCAG 2.2 A/AA + 2.4.13 table, ARIA 1.2 + APG patterns, Nu checker, CWV + LHCI, MQ5 preferences, axe/jsx-a11y usage, security headers
- [ ] `inventory.md`: every www route (seeded pages via `[slug]`, home, auth modal + fallback, 404, `unauthorized`) and every admin view. Each `packages/react/src/ui` and `apps/www/src/components/ui` primitive is mapped to its APG pattern and underlying library (Base UI / cmdk / custom), plus the C–I surfaces new to this pass
- [ ] `inventory.md`: the existing `vitest-axe` coverage (`testing/fieldInputContract.ts`, `fieldCellContract.ts`) and the interactive components it doesn't reach

## Step 2 — Audit tooling, non-blocking [agent]
Why: tools before findings. Everything is installed reporting-only, so lint and CI stay green until step 10 flips the gates.
Verify: `pnpm lint` passes with jsx-a11y warnings; `pnpm --filter www exec playwright test` against local `next dev` writes `audit/www-axe.json`; `pnpm --filter www exec lhci autorun` writes a report; `node scripts/validate-html.mjs <url>` prints the Nu results
- [ ] `eslint-plugin-jsx-a11y` (6.10.x) in the root `eslint.config.mjs` via `flatConfigs.recommended`, scoped to `**/*.tsx`, every rule at `warn`
- [ ] `apps/www`: `@playwright/test` + `@axe-core/playwright` (4.14.x). `playwright.config.ts` (`baseURL` from `QUALITY_BASE_URL`, default `http://localhost:3000`, plus the Vercel bypass header when set). `e2e/routes.ts` holds the route list from the inventory. `e2e/axe.test.ts` runs AxeBuilder with the `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa` tags per route, in light + dark, and writes JSON
- [ ] `apps/www/e2e/widths.test.ts`: the DOM width matrix (overflowX, offscreen controls, culprits outside scroll regions) at every width, in the discord matrix's JSON shape, written to `audit/www-width-matrix.json`
- [ ] `apps/test`: the same Playwright setup for the admin, signing in as a seeded test user. `e2e/adminAxe.test.ts` + `e2e/adminWidths.test.ts` → `audit/admin-*.json`. Local only
- [ ] `apps/www/lighthouserc.cjs`: mobile preset, key pages from `e2e/routes.ts`, assertions at `warn`
- [ ] `scripts/validate-html.mjs`: fetches the rendered HTML per route and runs `vnu-jar` (`--format json`) → `audit/*-nu.json`
- [ ] Root `.gitignore`: Playwright and LHCI output directories

## Step 3 — Baseline run + findings ledger [agent]
Why: one ledger of every failure, each tied to its criterion, before any fix lands. That makes fixes traceable and gives a measured scope.
Verify: `findings.md` has one row per finding (id, surface, width/theme, criterion or APG pattern, tool, evidence, disposition `fix`/`backlog`) and none is undispositioned
- [ ] Run axe, widths, Lighthouse and Nu against local www and the local admin; commit the `audit/*.json` output
- [ ] Triage the jsx-a11y warnings into the ledger
- [ ] Agent keyboard sweep with the `browser` tool (tab order, a visible focus ring, trap + return in every dialog/sheet/popover) over the inventory. Measure the focus indicator against 2.4.11 / 2.4.13; the current `ring-ring/50` utilities are suspect
- [ ] Classify each row against the fix boundary; rows needing structural work are marked `backlog`

## Step 4 — Document shell: skip link, landmarks, metadata, preferences [dev]
Why: page-wide fixes that clear whole classes of axe/Nu rows across every route at once. They have to land before per-component work so later re-runs aren't noise.
Verify: axe re-run shows the `bypass`/`landmark-*`/`region`/`document-title`/`html-*` rows cleared; Tab from the address bar reaches the skip link first at 375 and 1536; with `prefers-reduced-motion: reduce` emulated, motion primitives render static
- [ ] Skip link + `id="main"` target in the www frontend layout and the admin layout (`packages/react` `AdminLayout`)
- [ ] Landmarks: one `main`, labelled `nav`s, `header`/`footer` roles across www and the admin shell
- [ ] www `layout.tsx`: a `viewport` export with `themeColor` for light/dark; per-page unique `<title>` via the existing `lib/metadata.ts`; the admin's per-view document titles
- [ ] Focus appearance: one shared focus-visible treatment meeting 2.4.13 (≥ 2 CSS px perimeter, 3:1 contrast against both adjacent colors) in the `packages/react` theme tokens and www `globals.css`; replace the low-contrast `ring-*/50` variants
- [ ] `prefers-reduced-motion` in `motion-primitives/` (`TextEffect`, `AnimatedGroup`, `reveal.module.css`) and in admin transitions; `forced-colors` focus/selection visibility
- [ ] Re-run the step 2 tools; update the `findings.md` dispositions

## Step 5 — UI primitives against APG [dev]
Why: every admin view and www block composes these, so fixing the primitive fixes every consumer. Colocated axe tests keep them fixed.
Verify: `pnpm --filter @vexcms/react test -- ui` passes with a new `expectNoA11yViolations` + keyboard test per interactive primitive; the browser re-check of each APG keyboard model is recorded in `findings.md`
- [ ] Per primitive in `packages/react/src/ui` (dialog, alert-dialog, sheet, dropdown-menu, select, popover, command/combobox, multi-select, tabs, accordion, checkbox, radio-group, tooltip, sidebar, pagination, data-table, resizable): roles/states/names and the keyboard model fixed within the boundary. A colocated `<name>.test.tsx` asserts no axe violations plus the APG keys that pattern requires
- [ ] The same for `apps/www/src/components/ui` primitives that www actually renders
- [ ] Icon-only buttons get accessible names; target size ≥ 24×24 CSS px (2.5.8) or the spacing exception

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
- [ ] Every block in `apps/www` renders valid, labelled markup (heading order, link purpose, lists, code panes)
- [ ] Image `alt` end to end: upload field alt → media doc → rendered `<img>`; decorative images `alt=""`; `next/image` `sizes` on every responsive image
- [ ] Font loading (preload, `display: swap` already set) and LCP image priority on the home page
- [ ] Auth modal and fallback routes: dialog pattern, labelled form, error announcement (4.1.3)
- [ ] Structural findings → `backlog.md`

## Step 8 — Security, caching and preference headers on www [dev]
Why: configuration coverage from the brief. It's static, so it ships with the build and is verified on the real Vercel preview, CDN included.
Verify: `curl -sI <preview-url>` shows CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`; the browser console shows no CSP violations on any route, including the live-preview iframe and the admin demo
- [ ] `apps/www/next.config.ts` `headers()`: a static CSP with no nonces. Scripts are `'self'` plus `sha256` hashes for the `ThemeScript` inline script; `style-src` allows `'unsafe-inline'` (the `ThemeStyle` CSS); `connect-src` covers the Convex URL + its websocket and the Vercel analytics/insights endpoints; `frame-ancestors` matches live preview's allowed origins; `img-src` covers the Convex storage host
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
- [ ] `.github/workflows/quality.yml`: on `deployment_status` (`state == success`, www's Preview environment only), runs the Playwright axe suite + `lhci autorun` against `deployment_status.target_url`, with `VERCEL_AUTOMATION_BYPASS_SECRET` as the protection-bypass header
- [ ] `lighthouserc.cjs` assertions → `error` at the agreed budgets
- [ ] `[dev]` Add the bypass secret in GitHub; mark both checks required in branch protection

## Step 11 — Accessibility statement [dev]
Why: deliverable in the brief. It's written last among the www changes so its known-exceptions list is final.
Verify: `/accessibility` renders on the www preview, linked from the footer, and passes axe; the docs page builds
- [ ] `apps/www/convex/seed.ts`: an `accessibility` page (conformance target WCAG 2.2 AA + 2.4.13, test date, methods, known exceptions from `backlog.md`, a contact address) plus a footer link. Mirrors how every other www page is CMS-seeded
- [ ] `apps/docs/src/content/docs/accessibility.md`: the same statement scoped to the admin panel and packages

## Step 12 — Port www fixes to apps/test [dev]
Why: `apps/test` stays an extended version of www (decision 2026-11-06), and N syncs the templates from both apps next.
Verify: `node scripts/template-diff.mjs` (or a plain diff) shows www's fixed files matching in `apps/test`, apart from test-only extensions; the local Playwright axe run against `apps/test`'s frontend routes (including `posts/[slug]`) is clean
- [ ] Carry over the layout, metadata, motion, component, block, `next.config.ts` header and seed changes; keep the posts collection, fields collection and other test-only extensions
- [ ] `apps/test` `posts/[slug]` audited with the same tools

## Step 13 — K conformance review (H, I, M, this pass) [agent]
Why: the last step in the plan. It checks code written since K against the recorded conventions before N copies it into the templates. Needs M committed.
Verify: the last `review-<n>.md` has no open violation or gap; `harness doctor` is clean; full typecheck/test/lint/build green
- [ ] One reviewer per touched package/app, using K's pass-2 method (grouping, file roles, exports/imports, identifiers) over code from H (`2026-10-26-edit-view-overhaul`), I (`2026-10-26-list-view-overhaul`), M (`2026-10-26-build-time-telemetry`) and this spec
- [ ] `[dev]` Decide each violation/gap; apply; repeat until clean; record new rules in `naming-conventions.md` and the Development docs

## Step 14 — Bookkeeping [agent]
Why: plan and backlog stay the source of truth for what comes next (N).
Verify: launch plan items 14 and J/V/K tasks ticked with evidence; `harness doctor` clean
- [ ] `v0.1.0-launch-plan.md`: tick item 14 and the J, V and K task lists, with commit refs
- [ ] `backlog.md`: every `backlog` row from `findings.md`, with its evidence
