---
status: in-progress
spec_id: 2026-11-06-quality-pass
touches:
  - apps/www/**
  - apps/test/**
  - packages/react/src/**
  - packages/next/src/**
  - packages/richtext-plate/src/**
  - apps/docs/src/content/docs/accessibility.md
  - eslint.config.mjs
  - pnpm-workspace.yaml
  - pnpm-lock.yaml
  - package.json
  - .gitignore
  - .github/workflows/quality.yml
  - scripts/validate-html.mjs
  - .agent/docs/specs/2026-11-06-quality-pass/**
  - .agent/docs/standards/naming-conventions.md
  - .agent/docs/product/v0.1.0-launch-plan.md
  - .agent/docs/product/backlog.md
prompt_version: 1
---

# 2026-11-06-quality-pass — Spec

## Overview

Launch-plan item 14: the quality pass. It audits `apps/www` and the admin panel (rendered by
`apps/test`, fixed in `packages/react`) against WCAG 2.2 AA plus 2.4.13 Focus Appearance, J's
responsive width matrix, HTML validity, Core Web Vitals and security headers. It fixes what fits
the fix boundary, backlogs the rest with evidence, gates the result in CI on each PR's Vercel
preview, publishes an accessibility statement, ports the www fixes to `apps/test`, and closes with
K's conformance review over everything written since K, right before N syncs the templates.

## Design Decisions

1. **The checklist comes from `sources.md`, never from memory.** Every finding cites a WCAG
   criterion or APG pattern row there, so each fix traces back to a normative source fetched on
   2026-11-06.
2. **Tools before findings, findings before fixes.** Step 2 installs every tool reporting-only
   (jsx-a11y `warn`, LHCI `warn`, no required checks), step 3 builds one ledger, and only then do
   fixes land. Step 10 flips the gates once steps 4–9 leave them green, so lint and CI never go red
   mid-pass.
3. **Fix boundary:** classes, attributes, markup, and small keyboard/focus handlers (≤ ~30 lines,
   no public API change). Anything bigger goes to `backlog.md` with its audit evidence. A launch
   pass is not the place for component rewrites.
4. **Audit artifacts live beside the app they audit** (`apps/www/audit/`, `apps/test/audit/`), are
   committed, and are what each step's Verify reads. Raw tool output (`test-results/`,
   `playwright-report/`, `.lighthouseci/`) is git-ignored. Each suite takes `QUALITY_AUDIT_DIR` to
   redirect output.
5. **Playwright never starts a server.** Configs have no `webServer`; `QUALITY_BASE_URL` points at
   the developer's running www (:3030) / `apps/test` (:3020) locally, or the Vercel preview in CI
   (P-024).
6. **One route list, `apps/www/e2e/routes.ts`**, drives axe, the width matrix, Lighthouse and Nu.
   Draft routes carry `draft: true`; CI skips them and they're audited locally (cross-spec
   decision 3).
7. **One focus treatment:** a Tailwind v4 `@utility focus-ring` applied as
   `focus-visible:focus-ring`, defined once in the `packages/react` theme CSS and mirrored in www's
   `globals.css`. It replaces the `ring-*/50` variants, which fail 2.4.13's 3:1 requirement.
8. **Admin route-level axe runs locally only**; CI gates cover www (the public surface) plus
   component-level `vitest-axe` tests, which run in every `pnpm test`.
9. **Fixes in shared primitives first** (step 5) so admin views and www blocks (steps 6–7) only
   carry view-specific findings.
10. **Static CSP, production only, no nonces** — nonces force dynamic rendering of every page and
    lose ISR. A hash-only `script-src` proved impossible (App Router inlines per-route, per-request
    flight scripts), so `script-src` is `'self' 'unsafe-inline'`, Next's documented no-nonce policy
    (step 8, F-102).
11. **`apps/test` stays a superset of www:** step 12 ports every www fix; launch-infra step 16
    ports `/privacy` and `/tour`, and whichever of the two runs second ports onto the other's
    result.
12. **Content changes ship through `apps/www/convex/seed.ts` + `seed:reinit`** (cross-spec
    decision 9). The accessibility statement is a CMS-seeded page like `/privacy`.
13. **Mirrored systems:** the width matrix mirrors `2026-09-13-discord-post-readiness/audit/*-matrix.json`
    (same JSON shape, so 375/390/768/1024 are a direct regression diff); the component a11y tests
    mirror the existing `accordion.test.tsx` / `multi-select.test.tsx` + `expectNoA11yViolations`
    harness; the statement page mirrors launch-infra's `/privacy` seed entry.

14. **Corrections found while writing this spec (verified against the code):** the root `pnpm lint`
    glob reaches `packages/*/src` only, so jsx-a11y also goes into `apps/www/eslint.config.mjs` and
    `apps/test/eslint.config.mjs`; www's skip link, per-page titles and motion-primitive
    reduced-motion handling already exist (step 4 changes only what's missing); the home page has no
    image, so its LCP element is the Hero `<h1>`; `apps/test` seeds no user, so the admin suites sign
    in with `QUALITY_ADMIN_EMAIL`/`QUALITY_ADMIN_PASSWORD`; the discord admin matrix only has
    375/390 post-fix data, so the admin regression diff covers those two widths; `frame-ancestors`
    is `'self'` (the live-preview iframe is same-origin, `allowedOrigins` only screens
    `postMessage`); 2.1.4 has no trigger (the one shortcut needs a modifier).
15. **Subagent model tiers:** the harness's task tool accepts no per-subagent model, so every
    section writer inherited the session model (deviation from `subagent_selection: "dynamic"`).
16. **Data-table column resize range (developer, 2026-11-08):** the maximum column width is 90% of
    the table container's visible width, re-measured by a `ResizeObserver`, 960 px before the
    first measurement; the minimum stays 60 px. Resize handles expose it as
    `aria-valuemin`/`aria-valuemax`, and drag, arrows, `Home` and `End` all clamp to it (F-034).
17. **The axe suites assert.** `apps/www/e2e/axe.e2e.ts` fails on any violation (it only wrote JSON
    before, so the CI gate could never fail); the admin suite stays report-only and local.
18. **Vendor fixes by `pnpm patch`:** `@daveyplate/better-auth-ui`'s unnamed password toggle and
    button-in-link are patched (`patches/`, root `package.json` `patchedDependencies`), the same
    mechanism the repo already uses for `@convex-dev/better-auth`.

## Out of Scope

- Auditing `apps/docs`, apart from the statement page.
- CI gates on `apps/test`, admin e2e in CI.
- Nonce-based CSP.
- Full AAA (only 2.4.13 is in scope).
- Component rewrites, and any fix beyond the fix boundary (→ `backlog.md`).
- A whole-repo K re-review (step 13 reviews only H, I, M, launch-infra 2–7, public-presence 14 and
  this spec).
- The telemetry work itself (M); it is committed before step 13.

## Implementation

### Step 1 — Normative checklist + surface inventory [agent]

`sources.md` already exists and its checklist item is done (WCAG 2.2 A/AA + 2.4.13, ARIA 1.2 + APG patterns, the Nu checker, CWV + LHCI, MQ5 preferences, axe/jsx-a11y usage, security headers — all fetched 2026-11-06). This step adds `inventory.md`: the enumerated surface that every later finding in `findings.md` cites by row. It is pure enumeration against the real repo tree — `apps/www/src/app/**`, `apps/www/convex/seed.ts`'s seeded page slugs, `packages/react/src/**`'s admin views, `packages/react/src/ui/*` + `apps/www/src/components/ui/*`'s primitives, and the existing `vitest-axe` coverage — so it is `[agent]`, boilerplate, shown complete below.

- [x] `sources.md`: WCAG 2.2 A/AA + 2.4.13 table, ARIA 1.2 + APG patterns, Nu checker, CWV + LHCI, MQ5 preferences, axe/jsx-a11y usage, security headers
- [ ] `inventory.md` § A (www routes), § B (admin views), § C (primitives → APG pattern → library)
- [ ] `inventory.md` § D (existing `vitest-axe` coverage and the interactive components it doesn't reach)

#### .agent/docs/specs/2026-11-06-quality-pass/inventory.md

```markdown
# Quality Pass — Surface Inventory

Enumerated against the repo at the 2026-11-06 interview SHA. "Exists" is the
state of the `dev` tree as read for this step; routes owned by a sibling spec
are re-checked by `.agent/docs/specs/2026-11-06-quality-pass/findings.md`
once that spec lands — flip "Exists" to `yes` there, don't edit this file.

## A. www routes

| Path | Source file | Renderer | Exists | Owning step if missing | Draft? |
|---|---|---|---|---|---|
| `/` | `apps/www/src/app/(frontend)/(site)/page.tsx` | `PageContent` (seeded `pages` doc, slug `home`) | yes | — | no |
| `/features` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `features`) | yes | — | no |
| `/roadmap` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `roadmap`) | yes | — | no |
| `/privacy` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `privacy`, seeded) | no | `2026-11-06-launch-infrastructure` step 13 | no |
| `/brand` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `brand`, seeded) | no | `2026-11-06-public-presence` step 13 | no |
| `/accessibility` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `accessibility`, seeded) | no | this spec, step 11 | no |
| `/launch-week` | `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` | `PageContent` (slug `launch-week`, seeded) | no | `2026-11-06-launch-kit-final-review` step 9 | yes, until D5 |
| `/posts/vexcms-0-1-0` | `apps/www/src/app/(frontend)/(site)/posts/[slug]/page.tsx` (new) + `PostContent.tsx` (new) | Plate static richtext renderer | no | `2026-11-06-public-presence` step 14 | yes, until D1 |
| `/posts/<4 launch-week slugs>` | same `posts/[slug]/page.tsx` | Plate static richtext renderer | no | `2026-11-06-launch-kit-final-review` step 9 | yes, each flips on its own D2–D5 |
| `/auth/sign-in`, `/auth/sign-up` (`/auth/[pathname]`) | `apps/www/src/app/(frontend)/auth/[pathname]/page.tsx` + `view.tsx` | standalone `AuthView` form | yes | — | no |
| auth modal (same `pathname`, intercepted) | `apps/www/src/app/@auth/(.)auth/[pathname]/page.tsx` + `view.tsx` | Dialog-pattern modal wrapping `AuthView`; `@auth/default.tsx` and `@auth/[...catchAll]/page.tsx` are the slot's no-op fallbacks | yes | — | no |
| `/admin/*` | `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx` + `layout.tsx` | `NextAdminPage` / `NextAdminLayout` (`packages/react` admin shell, see § B) | yes | — | no |
| `/admin` error boundary | `apps/www/src/app/(vexcms)/admin/error.tsx` (new) | client error boundary, "Demo unavailable" + `/tour` + retry links | no | `2026-11-06-launch-infrastructure` step 10 | no |
| `/tour` | `apps/www/src/app/tour/page.tsx` (new) | `force-static`, 4 fixed-size `next/image` screenshots | no | `2026-11-06-launch-infrastructure` step 10 | no |
| `/unauthorized` | `apps/www/src/app/unauthorized/page.tsx` | `UnauthorizedView` (`@vexcms/react`) + `<ThemeStyle />` | yes | — | no |
| 404 (no matching page/slug) | none — no `not-found.tsx` exists anywhere under `apps/www/src/app` | Next.js's built-in default 404 | no custom boundary | **ungoverned — flag to the orchestrator**, see note below | n/a |

Excluded (API routes, not renderable pages): `apps/www/src/app/api/vex/revalidate/route.ts`,
`apps/www/src/app/api/auth/[...all]/route.ts`; `apps/www/src/app/sitemap.ts` and `robots.ts`
(non-HTML Next conventions, out of axe/Nu scope).

**Note (false spec-tasks assumption):** spec-tasks step 1 lists "404" as an inventory
surface but no sibling spec step creates `apps/www/src/app/not-found.tsx`. Today a 404
renders Next's unstyled built-in page — there is no custom boundary for any later step
to fix within the ≤30-line boundary without first creating the file. Flagged for the
orchestrator to assign an owning step (most naturally step 7, "www pages, blocks,
images" — it already does page-level document-shell work) rather than silently treated
as already covered.

## B. Admin views

`/admin/*` is one Next.js route; everything below is a client-routed view inside it,
rendered by `packages/react`. Grouped by spec-tasks step 6's own breakdown.

| View / surface | Source file(s) |
|---|---|
| Dashboard | `packages/react/src/admin/DashboardView.tsx` |
| Admin shell / layout | `packages/react/src/admin/AdminLayout.tsx`, `AdminIndexEmptyState.tsx`, `AdminNotFound.tsx` |
| `AdminTopNav` breadcrumb | `packages/react/src/admin/AdminTopNav.tsx` |
| List view shell | `packages/react/src/collections/listView/CollectionListView/index.tsx`, `ListViewLayout.tsx`, `ListViewContext.tsx`, `ListViewEmptyState.tsx`, `ListViewQueryError.tsx` |
| List view toolbar / search | `packages/react/src/collections/listView/toolbar/ListViewToolbar.tsx`, `ListViewSearch.tsx`, `ListViewSearchAction.tsx`, `ListViewColumnsAction.tsx`, `ListViewCopyLinkButton.tsx` |
| List view filter builder | `packages/react/src/collections/listView/filters/ListViewFilterBuilder/index.tsx`, `ListViewFilterRow.tsx`, `ListViewFiltersAction.tsx`, `ListViewFilterChips.tsx` |
| Saved-view tabs | `packages/react/src/collections/listView/savedListViews/SavedListViewTabs/index.tsx` + `SavedListViewSwitcherMenu.tsx`, `SavedListViewActionsMenu.tsx`, `SavedListViewPromoteDialog.tsx`, `SavedListViewDeleteDialog.tsx`, `SaveListViewDialog.tsx`, `StaleSavedListViewNotice.tsx`, `ListViewModifiedControls.tsx` |
| Row / bulk actions | `packages/react/src/collections/listView/rowActions/*.tsx`, `packages/react/src/ui/data-table/DataTableBulkActions.tsx`, `DataTableBulkDeleteModal.tsx` |
| Peek | `packages/react/src/collections/listView/peek/ListViewPeek/index.tsx`, `ListViewPeekFieldsTab.tsx`, `ListViewPeekJsonTab.tsx`, `ListViewPeekCopyButton.tsx` |
| Edit view shell / sticky header actions | `packages/react/src/collections/editView/CollectionEditView.tsx`, `CollectionDuplicateMenuItem.tsx` |
| Edit view actions menu | `packages/react/src/documents/DocumentEditActionsMenu.tsx`, `EditActionsMenuDialogContext.tsx`, `documentEditBuiltinContributions.ts` |
| Unsaved-changes dialog | `packages/react/src/documents/useUnsavedChangesGuard.ts` (registered as a built-in contribution in `documentEditBuiltinContributions.ts`) |
| Status badge | `packages/react/src/versions/StatusBadge.tsx` |
| Version history | `packages/react/src/versions/DocumentTimestamps.tsx`, `VersionPublishAction.tsx`, `useAutosave.tsx`, `api/{listVersions,deleteVersion,saveDraft,publish,unpublish}/client.ts` |
| Live-preview panel | `packages/react/src/livePreview/useLivePreviewPanelState.ts` |
| Media list | `packages/react/src/media/MediaCollectionListView.tsx` |
| Media edit | `packages/react/src/media/MediaCollectionEditView.tsx` |
| Media upload | `packages/react/src/media/MediaUploadForm.tsx`, `MediaUploadDropzone.tsx` |
| Media library grid | `packages/react/src/media/MediaLibraryGrid.tsx`, `MediaPicker.tsx`, `CreateMediaModal.tsx`, `FilePreview.tsx` |
| Globals | `packages/react/src/globals/GlobalEditView.tsx`, `GlobalsListView.tsx` |
| Modals (shared host) | `packages/react/src/modals/BaseModal.tsx`, `useModalSurface.tsx`, `packages/react/src/collections/listView/create/ListViewCreateDocumentModal.tsx` |
| Data table (shared by list view + media) | `packages/react/src/ui/data-table/DataTable/index.tsx` (+ `DataTableHeader.tsx`, `DataTableBody.tsx`, `DataTableFooter.tsx`), `DataTableSortHeader.tsx`, `DataTableColumnsMenu.tsx`, `DataTablePageSizeSelect.tsx`, `DataTableResponsiveMenu.tsx` |
| Fields — error association, tabs/collapsible, richtext toolbar, pickers | `packages/react/src/fields/RenderFields.tsx`, `registry.tsx`, `tabs/Field.tsx`, `collapsible/Field.tsx`, `richtext/Field.tsx`, `relationship/{Field,RelationshipPicker}.tsx`, `upload/UploadFilterPicker.tsx` |

## C. Primitive → APG pattern → library

`packages/react/src/ui/*` (library classified from each file's top-level primitive import):

| File | Library | APG pattern |
|---|---|---|
| `accordion.tsx` | Base UI (`@base-ui/react/accordion`) | Accordion |
| `alert-dialog.tsx` | Base UI (`@base-ui/react/alert-dialog`) | Alert Dialog |
| `badge.tsx` | Base UI (`merge-props`/`use-render`) | n/a — static label |
| `button.tsx` | Base UI (`@base-ui/react` `Button`) | n/a — native button semantics |
| `checkbox.tsx` | Base UI | Checkbox |
| `command.tsx` | cmdk | Combobox (command-palette popup; closest listed pattern) |
| `dialog.tsx` | Base UI | Dialog (Modal) |
| `dropdown-menu.tsx` | Base UI (`@base-ui/react/menu`) | Menu Button / Menu |
| `input.tsx` | Base UI | n/a — native text input (3.3.2) |
| `popover.tsx` | Base UI | Disclosure (non-modal popup; pattern varies per consumer) |
| `radio-group.tsx` | Base UI | Radio Group |
| `scroll-area.tsx` | Base UI | n/a — scroll container, no widget role |
| `select.tsx` | Base UI | Listbox (select trigger + popup) |
| `separator.tsx` | Base UI (`@base-ui/react/separator`) | n/a — `role="separator"`, non-interactive |
| `sheet.tsx` | Base UI (`@base-ui/react/dialog`) | Dialog (Modal) — side-panel variant |
| `sidebar.tsx` | Base UI (`merge-props`/`use-render`), custom composition | nav landmark + Disclosure (collapsible sections) — no single APG pattern |
| `tabs.tsx` | Base UI (`@base-ui/react/tabs`) | Tabs |
| `tooltip.tsx` | Base UI (`@base-ui/react/tooltip`) | Tooltip |
| `table.tsx` | custom (plain `<table>`) | Table (static, non-interactive) |
| `multi-select.tsx` | custom, composes `command.tsx` + `popover.tsx` + `badge.tsx` | Combobox / Listbox (multi-select) |
| `field.tsx` | custom (layout only) | n/a |
| `textarea.tsx` | custom (native `<textarea>`) | n/a |
| `sonner.tsx` | `sonner` | Status Messages (4.1.3) — not an APG widget pattern |
| `skeleton.tsx` | custom | n/a — decorative, should be `aria-hidden` |
| `label.tsx` | custom (native `<label>`) | n/a |
| `input-group.tsx` | custom, composes `button.tsx`/`input.tsx`/`textarea.tsx` | n/a |
| `card.tsx` | custom | n/a |
| `pagination.tsx` | custom, composes `button.tsx` | n/a — labelled `nav`, no dedicated APG pagination pattern |
| `resizable.tsx` | `react-resizable-panels` | n/a — no listed pattern; needs its own keyboard-resize review |
| `InputTag.tsx` | custom, composes `button.tsx` | n/a |
| `Icon.tsx` | custom (`lucide-react` wrapper) | n/a — accessible name owned by each consumer (1.1.1) |
| `ActionsMenu.tsx` | custom, composes `dropdown-menu.tsx` | Menu Button / Menu |
| `VexLink.tsx` | custom (framework-aware anchor) | n/a — native link semantics (2.4.4) |
| `VexImage.tsx` | custom (framework-aware `img`) | n/a — native img semantics (1.1.1 alt) |
| `ThemeToggle.tsx` | custom, composes `dropdown-menu.tsx` | Menu Button / Menu |
| `ThemeProvider.tsx` | custom (context, no DOM) | n/a |
| `JsonEditor.tsx` / `JsonEditorView.tsx` | custom (lazy CodeMirror, `contenteditable`) | n/a — custom widget, needs its own keyboard/name review |
| `QueryErrorBoundary.tsx` / `InlineQueryError.tsx` | custom | Status Messages (4.1.3) |
| `ScrollSection.tsx` | custom | n/a — scroll-spy nav wrapper |
| `resizeHandleStyles.ts` | n/a — style helper, not a component | n/a |
| `data-table/DataTableSortHeader.tsx` | custom, composes `button.tsx` | n/a — sort button inside Table header |
| `data-table/DataTableColumnsMenu.tsx`, `DataTableResponsiveMenu.tsx` | custom, composes `dropdown-menu.tsx` | Menu Button / Menu |
| `data-table/DataTableBulkActions.tsx` | custom, composes `button.tsx` | Toolbar (3+ grouped controls) |
| `data-table/DataTableBulkDeleteModal.tsx` | custom, composes `alert-dialog.tsx` | Alert Dialog |
| `data-table/DataTable/index.tsx` | custom (`@tanstack/react-table` core) | Table (static) — row selection/sort, no arrow-key cell navigation implemented; re-check against Grid if that's added |
| `dnd/DndProvider.tsx`, `Draggable.tsx`, `Droppable.tsx`, `DragHandle.tsx` | `@hello-pangea/dnd` | no listed pattern — flag as a gap: reorder needs its own keyboard alternative (2.5.7, 2.1.1) |
| `datetime/date-picker.tsx` | `react-day-picker` + `date-fns`, composes `popover.tsx`/`scroll-area.tsx` | Grid (interactive, the calendar) behind a Combobox-like trigger |
| `datetime/time-picker.tsx` | custom, composes `popover.tsx`/`scroll-area.tsx` | Listbox (scrollable time options) |

`apps/www/src/components/ui/*`:

| File | Library | APG pattern |
|---|---|---|
| `accordion.tsx` | Base UI (`@base-ui/react/accordion`) | Accordion |
| `alert-dialog.tsx` | Base UI (`@base-ui/react/alert-dialog`) | Alert Dialog |
| `badge.tsx` | Base UI (`merge-props`/`use-render`) | n/a |
| `button.tsx` | Base UI (`@base-ui/react/button`) | n/a |
| `combobox.tsx` | Base UI (`@base-ui/react` `Combobox`) | Combobox |
| `dialog.tsx` | Base UI (`@base-ui/react/dialog`) | Dialog (Modal) |
| `dropdown-menu.tsx` | Base UI (`@base-ui/react/menu`) | Menu Button / Menu |
| `input.tsx` | Base UI | n/a |
| `select.tsx` | Base UI (`@base-ui/react/select`) | Listbox (select trigger + popup) |
| `separator.tsx` | Base UI (`@base-ui/react/separator`) | n/a |
| `field.tsx` | custom (layout only) | n/a |
| `textarea.tsx` | custom | n/a |
| `input-group.tsx` | custom, composes `button.tsx`/`input.tsx`/`textarea.tsx` | n/a |
| `card.tsx` | custom | n/a |
| `label.tsx` | custom | n/a |

## D. Existing `vitest-axe` coverage

`expectNoA11yViolations` (`packages/react/src/testing/a11y.ts`) is called in exactly
three places today:

- `a11y.ts`'s own self-test, `a11y.test.ts`.
- `fieldCellContract.ts:233` — one assertion, the cell's valid-value render.
- `fieldInputContract.ts:1119,1131,1146` — three assertions: default render, read-only,
  and the validation-error state.

Both contracts are generic suites consumed by every `packages/react/src/fields/*/Field.tsx`
and `.../Cell.tsx` that calls `runFieldInputContractSuite` / the cell equivalent through
`fields/registry.tsx` — so every registered field type inherits this coverage automatically.
It is also re-exported from `testing/index.ts`, but **zero** `*.test.tsx` colocated with a
`packages/react/src/ui/*` or `apps/www/src/components/ui/*` primitive imports it.

Primitives spec-tasks step 5 names, with their current test status:

| Primitive | Test file today | Calls `expectNoA11yViolations`? |
|---|---|---|
| `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `select`, `popover`, `command`, `tabs`, `checkbox`, `radio-group`, `tooltip`, `pagination`, `resizable` | none | n/a — no test file exists at all |
| `accordion` | `accordion.test.tsx` | no |
| `multi-select` | `multi-select.test.tsx` | no |
| `sidebar` | `sidebar.test.tsx` | no |
| `data-table` | `DataTable.test.tsx`, `DataTableColumnsMenu.test.tsx`, `DataTableResponsiveMenu.test.tsx`, `DataTableSortHeader.test.tsx`, `DataTableBulkActions.test.tsx`, `DataTableBulkDeleteModal.test.tsx`, `DataTablePageSizeSelect.test.tsx` | no |

Also untested for a11y: `dnd/DragHandle.test.tsx` exists (covers drag semantics, not axe);
every `apps/www/src/components/ui/*` primitive has **no test file at all**; `datetime/date-picker.tsx`
and `time-picker.tsx` have no test file.

Step 5 adds a colocated `expectNoA11yViolations` + APG-keyboard-model test to every row
above that spec-tasks step 5 names as in scope.
```

Verify: `sources.md` covers all 31 A and 24 AA rows (including obsolete 4.1.1) plus 2.4.13, and every widget row in `inventory.md` § C maps to an APG pattern in `sources.md` or is explicitly marked `n/a` with its reason; `inventory.md` § A has one row for every route spec-tasks step 1 names, each with a real `Exists` value and, where `no`, a real owning step; § B has one row per view spec-tasks step 6 names; § D's "doesn't reach" list matches a fresh `rg -l "expectNoA11yViolations" packages/react/src`.

### Step 2 — Audit tooling, non-blocking [agent]

Every tool lands reporting-only: `eslint-plugin-jsx-a11y` at `warn`, two new Playwright suites
(`apps/www`, `apps/test`) with no `webServer` block (P-024 — they attach to the developer's
already-running dev servers), a Lighthouse CI config at `warn`, and a Nu checker script. Nothing
here fails `pnpm lint`, `pnpm typecheck`, `pnpm test` or CI — step 10 is what flips the gates.
`pnpm lint` (root) runs `eslint "packages/*/src/**/*.{ts,tsx}"` directly — not through turbo
(`turbo.json` has no `lint` task at all) — with its cwd at the repo root, so flat config resolves
the **root** `eslint.config.mjs` and the glob only ever reaches `packages/*/src/**`. `apps/www`
and `apps/test` each carry their own `eslint.config.mjs` and their own `"lint": "eslint ."`
script (run with `pnpm --filter <app> lint`, cwd inside that app), and ESLint's flat config
resolves exactly one config file by searching upward from cwd — it never merges the root config
in. CI's `.github/workflows/ci.yml` only runs `pnpm lint` today, so `apps/www`/`apps/test` are not
linted in CI at all, with or without this change. The jsx-a11y block therefore goes in all three
`eslint.config.mjs` files — root (reaches `packages/*/src/**/*.tsx`, `packages/react` included),
`apps/www/eslint.config.mjs` and `apps/test/eslint.config.mjs` (each reaches its own app's
`.tsx` only when linted via its own `lint` script) — not in root alone.

- [ ] `eslint-plugin-jsx-a11y` (6.10.2) in the root `eslint.config.mjs`, `apps/www/eslint.config.mjs`
  and `apps/test/eslint.config.mjs` via `flatConfigs.recommended`, scoped to `**/*.tsx`, every
  rule forced to `warn` (lock: `eslint.config.mjs`)
- [ ] `apps/www`: `@playwright/test` (1.64.1) + `@axe-core/playwright` (4.14.0). `playwright.config.ts`
  (`testMatch: "**/*.e2e.ts"`; `baseURL` from `QUALITY_BASE_URL`, default `http://localhost:3030`;
  the Vercel bypass header when set; `workers: 1` for deterministic single-file audit JSON).
  `e2e/routes.ts` exports `QUALITY_ROUTES`/`QUALITY_WIDTHS`/`QUALITY_THEMES` from the inventory;
  posts and pages seeded as drafts carry `draft: true` (lock: `apps/www/e2e/routes.ts`). `e2e/auditJson.ts`,
  a small shared writer both suites below call. `e2e/axe.e2e.ts` runs AxeBuilder with the
  `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa` tags per route, in light + dark (the site's own
  `localStorage["vex-theme"]` key, set via `page.addInitScript` the same way `ThemeScript` reads
  it), and writes `audit/www-axe.json`. When `CI` is set it skips `draft` routes
- [ ] `apps/www/e2e/widths.e2e.ts`: the DOM width matrix (overflowX, offscreen controls, culprits
  outside scroll regions) at every `QUALITY_WIDTHS` entry, in
  `2026-09-13-discord-post-readiness/audit/www-mobile-matrix.json`'s JSON shape, written to
  `audit/www-width-matrix.json`
- [ ] `apps/test`: the same Playwright setup for the admin, signing in as a seeded test user.
  `apps/test`'s own `convex/seed.ts` never seeds a user document — every account, including the
  first admin, is created at runtime through the real `/auth/sign-up` form, and
  `FirstAdminBootstrap` auto-promotes only the *first* signup on an empty deployment. `e2e/globalSetup.ts`
  signs the quality-pass test user in, falling back to sign-up (idempotent across runs once the
  account exists), and throws an exact promotion instruction if the session it gets back isn't an
  admin's. `e2e/adminRoutes.ts` discovers routes at runtime from the admin's own navigation
  (`/admin`, every `[data-slot="sidebar"]` link, plus each collection list's create-modal and
  first-row edit routes) rather than importing `vex.config` — Playwright's CommonJS test
  transform cannot `require()` the app's ESM-only workspace packages. `e2e/adminAxe.e2e.ts` +
  `e2e/adminWidths.e2e.ts` → `audit/admin-*.json`.
  Local only — nothing runs this in CI
- [ ] `apps/www/lighthouserc.cjs`: mobile preset, the non-draft pages from `e2e/routes.ts`
  (currently `/`, `/features`, `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/tour`,
  `/auth/sign-in`, `/auth/sign-up`, the 404 probe and `/unauthorized`; a `/posts/[slug]` joins
  once one is published and its `draft` flag drops), assertions at `warn`
- [ ] Draft audit procedure (below)
- [ ] `scripts/validate-html.mjs`: fetches the rendered HTML per route (via `vnu-jar`'s own
  live-URL support) and runs `vnu-jar` (`--format json`) → `audit/<app>-nu.json`. `node --version`
  is 24.9.0 here, and `apps/www/e2e/routes.ts` is a plain ESM-syntax `.ts` file with no
  non-erasable constructs (no enums, no namespaces with runtime code) — Node's built-in type
  stripping (default-on since v23.6.0, and backported default-on to the v22 LTS line at v22.18.0,
  so CI's `node-version: 22` in `ci.yml` covers it too) imports it directly with zero flags or
  build step, confirmed by running `node --eval 'import("...routes.ts").then(m => console.log(m.QUALITY_ROUTES))'`
  against a scratch `.ts` file with no package.json `"type"` field — Node's module-system
  autodetection picks ESM from the `export` syntax even though neither `apps/www/package.json`
  nor root declares `"type": "module"`
- [ ] Root `.gitignore`: Playwright and LHCI output directories, plus the Playwright auth storage
  state directory (lock: `.gitignore` is not itself a locked file, but `pnpm-workspace.yaml`
  dependency catalog entries below are added in the same commit, which is)
- [ ] `pnpm-workspace.yaml` catalog: `eslint-plugin-jsx-a11y` 6.10.2, `@playwright/test` 1.64.1,
  `@axe-core/playwright` 4.14.0, `@lhci/cli` 0.16.0, `vnu-jar` 26.11.4 (lock: `pnpm-workspace.yaml`)
- [ ] Root `package.json`, `apps/www/package.json`, `apps/test/package.json`: matching
  `devDependencies` (`catalog:`) and the `test:e2e` script `apps/www`/`apps/test` need for
  `turbo run test:e2e` (already declared in `turbo.json`, currently unimplemented by any package)
  to do anything (lock: `package.json`)
- [ ] Verified, not edited: `apps/www/vitest.config.ts`'s `include: ["src/**/*.test.ts", "src/**/*.test.tsx"]`
  and `apps/test/vitest.config.ts`'s equivalent never match anything under the new top-level
  `e2e/` directory, so `pnpm --filter www test` / `pnpm --filter test test` already collect no
  `e2e/` file. `apps/www/tsconfig.json`'s `include: ["**/*.ts", "**/*.tsx", …]` (repo-relative to
  `apps/www`, no `src/` restriction) and `apps/test/tsconfig.json`'s equivalent already cover the
  new `e2e/*.e2e.ts`, `playwright.config.ts` and `lighthouserc.cjs` — `pnpm --filter www typecheck`
  type-checks them with no `tsconfig.json` edit

#### eslint.config.mjs

2 edits. Everything else is unchanged.

**1 — import.** Beside the existing `jsdocPlugin` import:

```js
import jsdocPlugin from "eslint-plugin-jsdoc";
import jsxA11y from "eslint-plugin-jsx-a11y";
```

**2 — jsx-a11y block.** A new array entry, after the shadcn/base UI primitives block
(`files: ["packages/react/src/ui/**/*.ts", "packages/react/src/ui/**/*.tsx"]`) and before the
`files: ["**/*.test.ts", "**/*.test.tsx"]` block:

```js
  {
    files: ["**/*.tsx"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: Object.fromEntries(
      Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "warn"]),
    ),
  },
```

#### apps/www/eslint.config.mjs

2 edits. Everything else is unchanged.

**1 — import.** Beside the existing `importX` import:

```js
import importX from "eslint-plugin-import-x"
import jsxA11y from "eslint-plugin-jsx-a11y"
```

**2 — jsx-a11y block.** A new array entry, after the
`files: ["src/test/**/*.js", "src/test/**/*.ts", "tests/**/*.ts", "*.config.js", "*.config.mjs"]`
block and before the final `languageOptions`/`linterOptions` block:

```js
  {
    files: ["**/*.tsx"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: Object.fromEntries(
      Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "warn"]),
    ),
  },
```

#### apps/test/eslint.config.mjs

2 edits. Everything else is unchanged.

**1 — import.** Beside the existing `importX` import:

```js
import importX from "eslint-plugin-import-x"
import jsxA11y from "eslint-plugin-jsx-a11y"
```

**2 — jsx-a11y block.** A new array entry, after the
`files: ["**/src/convex/**/*.ts"]` convex-plugin block and before the final
`languageOptions`/`linterOptions` block:

```js
  {
    files: ["**/*.tsx"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: Object.fromEntries(
      Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "warn"]),
    ),
  },
```

#### pnpm-workspace.yaml

5 edits (new catalog entries). Everything else is unchanged.

**1 — `@axe-core/playwright`.** Before `"@base-ui/react": 1.2.0`:

```yaml
  "@axe-core/playwright": 4.14.0
```

**2 — `@lhci/cli`.** Between `"@lezer/highlight": 1.2.5` and `"@next/eslint-plugin-next": 15.5.20`:

```yaml
  "@lhci/cli": 0.16.0
```

**3 — `@playwright/test`.** Between `"@platejs/table": 53.0.9` and `"@t3-oss/env-nextjs": 0.13.11`:

```yaml
  "@playwright/test": 1.64.1
```

**4 — `eslint-plugin-jsx-a11y`.** Between `"eslint-plugin-import-x": 4.17.1` and
`"eslint-plugin-perfectionist": 5.10.0`:

```yaml
  eslint-plugin-jsx-a11y: 6.10.2
```

**5 — `vnu-jar`.** Between `vitest-axe: 1.0.0-pre.5` and `yaml: 2.9.0`:

```yaml
  vnu-jar: 26.11.4
```

#### package.json

3 edits. Everything else is unchanged.

**1 — devDependencies.** `eslint-plugin-jsx-a11y` between `"eslint-plugin-jsdoc"` and `"jiti"`;
`vnu-jar` between `"typescript"` and `"yaml"`:

```json
    "eslint-plugin-jsdoc": "catalog:",
    "eslint-plugin-jsx-a11y": "catalog:",
    "jiti": "catalog:",
```

```json
    "typescript": "catalog:",
    "vnu-jar": "catalog:",
    "yaml": "catalog:"
```

**2 — nothing else.** `"test:e2e": "turbo run test:e2e"` already exists; no script change here.

**3 — `pnpm.peerDependencyRules.allowedVersions`.** `"proxy-agent": "6"`, alongside the
existing entries — `@lhci/cli` → `lighthouse` → `puppeteer-core` → `@puppeteer/browsers` wants
`proxy-agent@>=8.0.1`, which resolves to `6.5.0`; `strictPeerDependencies: true` blocks install
otherwise:

```json
        "@convex-dev/better-auth>better-auth": "1.6.23",
        "better-call": "2",
        "proxy-agent": "6",
        "typescript": "6"
```

#### apps/www/package.json

2 edits. Everything else is unchanged.

**1 — devDependencies.** `@axe-core/playwright` before `@convex-dev/eslint-plugin`; `@lhci/cli`
between `@eslint/eslintrc` and `@next/eslint-plugin-next`; `@playwright/test` between
`@next/eslint-plugin-next` and `@tailwindcss/postcss`; `eslint-plugin-jsx-a11y` between
`eslint-plugin-import-x` and `eslint-plugin-perfectionist`:

```json
    "@axe-core/playwright": "catalog:",
    "@convex-dev/eslint-plugin": "catalog:",
    "@edge-runtime/vm": "catalog:",
    "@eslint/eslintrc": "catalog:",
    "@lhci/cli": "catalog:",
    "@next/eslint-plugin-next": "catalog:",
    "@playwright/test": "catalog:",
    "@tailwindcss/postcss": "catalog:",
```

```json
    "eslint-config-next": "catalog:",
    "eslint-plugin-import-x": "catalog:",
    "eslint-plugin-jsx-a11y": "catalog:",
    "eslint-plugin-perfectionist": "catalog:",
```

**2 — scripts.** `"test:e2e"` between `"test"` and `"typecheck"`:

```json
    "test": "NODE_OPTIONS=--disable-warning=ExperimentalWarning vitest run",
    "test:e2e": "playwright test",
    "typecheck": "tsc --noEmit",
```

#### apps/test/package.json

2 edits. Everything else is unchanged.

**1 — devDependencies.** Same four insertions as `apps/www/package.json`:

```json
    "@axe-core/playwright": "catalog:",
    "@convex-dev/eslint-plugin": "catalog:",
    "@eslint/eslintrc": "catalog:",
    "@lhci/cli": "catalog:",
    "@next/eslint-plugin-next": "catalog:",
    "@playwright/test": "catalog:",
    "@tailwindcss/postcss": "catalog:",
```

```json
    "eslint-config-next": "catalog:",
    "eslint-plugin-import-x": "catalog:",
    "eslint-plugin-jsx-a11y": "catalog:",
    "eslint-plugin-perfectionist": "catalog:",
```

**2 — scripts.** `"test:e2e"` after `"test"`:

```json
    "test": "NODE_OPTIONS=--disable-warning=ExperimentalWarning vitest run",
    "test:e2e": "playwright test",
```

#### .gitignore

1 edit. Everything else is unchanged.

**1 — Playwright/LHCI output.** New section at the end, after the `>>> harness <<<` block:

```gitignore
# playwright / lighthouse
/**/test-results
/**/playwright-report
/**/.lighthouseci
/**/e2e/.auth
```

#### apps/www/e2e/routes.ts

```ts
/**
 * One route audited by the Playwright axe and width-matrix suites.
 */
export interface QualityRoute {
  path: string;
  draft?: true;
}

/**
 * Every `apps/www` route the quality pass audits: the seeded marketing pages,
 * the announcement and launch-week posts (all seeded `draft`, so `CI` skips
 * them), the static `/tour` demo fallback, the auth form routes, a guaranteed
 * 404 and `/unauthorized`. A route not yet seeded still 404s until its owning
 * page lands — the baseline run records that, rather than this file omitting
 * it.
 */
export const QUALITY_ROUTES: QualityRoute[] = [
  { path: "/" },
  { path: "/features" },
  { path: "/roadmap" },
  { path: "/privacy" },
  { path: "/brand" },
  { path: "/accessibility" },
  { path: "/launch-week", draft: true },
  { path: "/posts/vexcms-0-1-0", draft: true },
  { path: "/posts/real-time-admin-and-live-preview", draft: true },
  { path: "/posts/one-config-schema-and-types", draft: true },
  { path: "/posts/access-control-hooks-validation", draft: true },
  { path: "/posts/create-vexcms-to-deployed", draft: true },
  { path: "/tour" },
  { path: "/auth/sign-in" },
  { path: "/auth/sign-up" },
  { path: "/a-page-that-does-not-exist" },
  { path: "/unauthorized" },
];

/**
 * Viewport widths every width-matrix and (indirectly, via Lighthouse's mobile
 * preset) performance check runs at. 375/390/768/1024 are the
 * `2026-09-13-discord-post-readiness` regression set; 640/767/769/1280/1536
 * are new.
 */
export const QUALITY_WIDTHS = [375, 390, 640, 767, 768, 769, 1024, 1280, 1536] as const;

/**
 * Color schemes the axe suite emulates by writing `localStorage["vex-theme"]`
 * before navigation — the same key `@vexcms/react/server`'s `ThemeScript`
 * reads before first paint.
 */
export const QUALITY_THEMES = ["light", "dark"] as const;
```

#### apps/www/e2e/auditJson.ts

```ts
import fs from "node:fs";
import path from "node:path";

/**
 * Writes an audit report as pretty-printed JSON under the app's audit
 * directory, creating the directory if it does not exist.
 *
 * @param props - Input props.
 * @param props.fileName - Output file name, e.g. `"www-axe.json"`.
 * @param props.data - JSON-serializable report body.
 * @returns The path written to, relative to the app root.
 */
export function writeAuditJson(props: { fileName: string; data: unknown }): string {
  const outputDir = process.env.QUALITY_AUDIT_DIR ?? "audit";
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, props.fileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(props.data, null, 2)}\n`);
  return outputPath;
}
```

#### apps/www/playwright.config.ts

```ts
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3030";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * `workers: 1` + `fullyParallel: false`: every suite here aggregates its
 * results into one committed JSON file per run (`e2e/auditJson.ts`), so a
 * single worker process is what makes that aggregation race-free — these are
 * audit reports, not a latency-sensitive CI gate.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    ...(bypassSecret
      ? {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": bypassSecret,
            "x-vercel-set-bypass-cookie": "true",
          },
        }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

#### apps/www/e2e/axe.e2e.ts

```ts
import { AxeBuilder } from "@axe-core/playwright";
import { test } from "@playwright/test";

import { writeAuditJson } from "./auditJson";
import { QUALITY_ROUTES, QUALITY_THEMES, type QualityRoute } from "./routes";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME_STORAGE_KEY = "vex-theme";

interface RouteAxeResult {
  path: string;
  theme: (typeof QUALITY_THEMES)[number];
  violations: unknown[];
}

const routes: QualityRoute[] = QUALITY_ROUTES.filter(
  (route) => !(process.env.CI && route.draft),
);
const results: RouteAxeResult[] = [];

for (const route of routes) {
  for (const theme of QUALITY_THEMES) {
    test(`${route.path} — ${theme}`, async ({ page }) => {
      await page.addInitScript(
        (entry) => {
          window.localStorage.setItem(entry.key, entry.value);
        },
        { key: THEME_STORAGE_KEY, value: theme },
      );
      await page.goto(route.path);
      const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      results.push({ path: route.path, theme, violations: axeResults.violations });
    });
  }
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "www-axe.json",
    data: {
      generated: new Date().toISOString(),
      baseURL: process.env.QUALITY_BASE_URL ?? "http://localhost:3030",
      tags: AXE_TAGS,
      results,
    },
  });
});
```

#### apps/www/e2e/widths.e2e.ts

```ts
import { test } from "@playwright/test";

import { writeAuditJson } from "./auditJson";
import { QUALITY_ROUTES, QUALITY_WIDTHS, type QualityRoute } from "./routes";

interface OffscreenControl {
  t: string;
  l: number;
  r: number;
}

interface WidthMeasurement {
  overflowX: number;
  culpritsOutsideScrollRegions: number;
  offscreenControls: OffscreenControl[];
}

const INTERACTIVE_TAGS = ["a", "button", "input", "select", "textarea"];

/**
 * Measures the current viewport for document-level horizontal overflow and
 * any visible, text-bearing or interactive leaf element that extends past the
 * viewport while NOT nested inside a horizontally scrollable ancestor
 * (`overflow-x: auto|scroll`) — an element inside a real scroll region is
 * reachable by scrolling and is not a culprit.
 *
 * @returns The width's overflow measurement.
 */
function measureOverflow(): WidthMeasurement {
  const viewportWidth = document.documentElement.clientWidth;
  const overflowX =
    document.documentElement.scrollWidth > document.documentElement.clientWidth ? 1 : 0;
  const offscreenControls: OffscreenControl[] = [];

  const isScrollRegion = (element: Element) => {
    const style = window.getComputedStyle(element);
    return style.overflowX === "auto" || style.overflowX === "scroll";
  };
  const insideScrollRegion = (element: Element) => {
    let node = element.parentElement;
    while (node) {
      if (isScrollRegion(node)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const candidates = document.querySelectorAll(
    "a, button, input, select, textarea, [tabindex], [role], p, span, li, h1, h2, h3, h4, h5, h6",
  );
  for (const element of candidates) {
    if (element.children.length > 0) {
      continue;
    }
    const text = (element.textContent ?? "").trim();
    const isInteractive = INTERACTIVE_TAGS.includes(element.tagName.toLowerCase());
    if (text.length === 0 && !isInteractive) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    if ((rect.right > viewportWidth + 1 || rect.left < -1) && !insideScrollRegion(element)) {
      offscreenControls.push({
        t: text.slice(0, 40),
        l: Math.round(rect.left),
        r: Math.round(rect.right),
      });
    }
  }

  return { overflowX, culpritsOutsideScrollRegions: offscreenControls.length, offscreenControls };
}

const routes: QualityRoute[] = QUALITY_ROUTES.filter(
  (route) => !(process.env.CI && route.draft),
);
const results: Record<string, Record<number, WidthMeasurement>> = {};

for (const route of routes) {
  test.describe(route.path, () => {
    for (const width of QUALITY_WIDTHS) {
      test(`${route.path} @${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.path);
        const measurement = await page.evaluate(measureOverflow);
        results[route.path] ??= {};
        results[route.path][width] = measurement;
      });
    }
  });
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "www-width-matrix.json",
    data: {
      generated: new Date().toISOString(),
      method:
        "document.documentElement.scrollWidth vs clientWidth for overflowX; each visible, " +
        "text-bearing or interactive leaf element overflowing the viewport and not inside a " +
        "horizontally-scrollable ancestor counts toward culpritsOutsideScrollRegions, with its " +
        "trimmed text and left/right bounds recorded in offscreenControls.",
      routes: routes.map((route) => route.path),
      widths: QUALITY_WIDTHS,
      results,
      findings: [],
      fixes: [],
    },
  });
});
```

#### apps/www/lighthouserc.cjs

```js
const { QUALITY_ROUTES } = require("./e2e/routes.ts");

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3030";
const urls = QUALITY_ROUTES.filter((route) => !route.draft).map(
  (route) => `${baseURL}${route.path}`,
);

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      settings: { preset: "mobile" },
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:accessibility": ["warn", { minScore: 1 }],
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
      },
    },
    upload: { target: "filesystem", outputDir: "./.lighthouseci" },
  },
};
```

#### apps/test/e2e/adminRoutes.ts

```ts
import type { Page } from "@playwright/test";

/**
 * Same width set `apps/www/e2e/routes.ts` audits, kept local to `apps/test`
 * since the two apps share no TypeScript path between their `e2e/` trees.
 */
export const QUALITY_WIDTHS = [375, 390, 640, 767, 768, 769, 1024, 1280, 1536] as const;

/** Same theme set `apps/www/e2e/routes.ts` audits. */
export const QUALITY_THEMES = ["light", "dark"] as const;

/**
 * Discovers every admin route reachable from the running admin's own
 * navigation, rather than importing `vex.config` — Playwright's CommonJS test
 * transform cannot `require()` the app's ESM-only workspace packages
 * (`@vexcms/better-auth/client`'s `exports` map declares no `require`
 * condition, by design).
 *
 * Collects the dashboard (`/admin`), every link inside the sidebar nav
 * (`packages/react/src/admin/AdminSidebar.tsx`'s `[data-slot="sidebar"]`,
 * which links every readable collection, media collection and global), and,
 * per discovered collection list route, the create-modal route
 * (`ListViewCreateAction.tsx`'s `+ New …` button, when enabled) and the
 * first row's edit route (`ListViewRowOpenAction.tsx`'s `Edit` menu item,
 * opened via that row's `[data-slot="row-actions"]` trigger).
 *
 * @param props - Input props.
 * @param props.page - An authenticated Playwright page.
 * @returns Every discovered admin route, deduplicated and sorted.
 */
export async function discoverAdminRoutes(props: { page: Page }): Promise<string[]> {
  const { page } = props;
  const routes = new Set<string>(["/admin"]);

  await page.goto("/admin");
  const navHrefs = await page
    .locator('[data-slot="sidebar"] a[href^="/admin"]')
    .evaluateAll((elements) =>
      elements.map((element) => new URL((element as HTMLAnchorElement).href).pathname),
    );
  for (const href of navHrefs) {
    routes.add(href);
  }

  const collectionRoutes = navHrefs.filter((href) => href.startsWith("/admin/collections/"));
  for (const collectionRoute of collectionRoutes) {
    await page.goto(collectionRoute);

    try {
      const createButton = page.getByRole("button", { name: /^\+ New /i });
      if ((await createButton.count()) > 0 && (await createButton.isEnabled())) {
        routes.add(`${collectionRoute}?createNew=true`);
      }
    } catch {}

    try {
      const rowActionsTrigger = page
        .locator("table tbody tr")
        .first()
        .locator('[data-slot="row-actions"] button');
      if ((await rowActionsTrigger.count()) > 0) {
        await rowActionsTrigger.click();
        const editItem = page.getByRole("menuitem", { name: "Edit" });
        const editHref = (await editItem.count()) > 0 ? await editItem.getAttribute("href") : null;
        if (editHref) {
          routes.add(editHref);
        }
        await page.keyboard.press("Escape");
      }
    } catch {}
  }

  return Array.from(routes).sort();
}
```

#### apps/test/e2e/auditJson.ts

```ts
import fs from "node:fs";
import path from "node:path";

/**
 * Writes an audit report as pretty-printed JSON under the app's audit
 * directory, creating the directory if it does not exist.
 *
 * @param props - Input props.
 * @param props.fileName - Output file name, e.g. `"admin-axe.json"`.
 * @param props.data - JSON-serializable report body.
 * @returns The path written to, relative to the app root.
 */
export function writeAuditJson(props: { fileName: string; data: unknown }): string {
  const outputDir = process.env.QUALITY_AUDIT_DIR ?? "audit";
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, props.fileName);
  fs.writeFileSync(outputPath, `${JSON.stringify(props.data, null, 2)}\n`);
  return outputPath;
}
```

#### apps/test/e2e/globalSetup.ts

```ts
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.QUALITY_BASE_URL ?? "http://localhost:3020";
const ADMIN_EMAIL = process.env.QUALITY_ADMIN_EMAIL ?? "quality-pass@vexcms.dev";
const ADMIN_PASSWORD = process.env.QUALITY_ADMIN_PASSWORD ?? "Quality-pass-admin-0";
const STORAGE_STATE_PATH = path.join(__dirname, ".auth", "admin.json");

/**
 * Signs the quality-pass test user in — or, on a deployment that has never
 * seen it, signs it up — and saves the resulting session so every
 * `adminAxe`/`adminWidths` test starts authenticated.
 *
 * `apps/test` seeds no user document: every account, including the first
 * admin, is created at runtime through `/auth/sign-up`, and
 * `FirstAdminBootstrap` (`apps/test/src/components/FirstAdminBootstrap.tsx`)
 * auto-promotes only the first signup on an empty deployment. On a
 * deployment that already has an admin, sign-up here creates a plain `user`
 * instead — this throws an exact instruction for that case rather than
 * silently running the suites unauthenticated.
 *
 * @returns Resolves once the session is saved; throws if the signed-in user
 *   is not an admin.
 */
export default async function globalSetup(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL: BASE_URL });

  await page.goto("/auth/sign-in");
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/auth/sign-in")) {
    await page.goto("/auth/sign-up");
    await page.locator('input[name="name"]').fill("Quality Pass");
    await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForLoadState("networkidle");
  }

  await page.goto("/admin/collections");
  if (page.url().includes("/unauthorized")) {
    await browser.close();
    throw new Error(
      `${ADMIN_EMAIL} signed in but is not an admin on this deployment — promote it once from ` +
        "an existing admin's user-management view, then re-run.",
    );
  }

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
```

#### apps/test/playwright.config.ts

```ts
import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const envLocalPath = path.join(__dirname, ".env.local");
if (existsSync(envLocalPath)) {
  process.loadEnvFile(envLocalPath);
}

const baseURL = process.env.QUALITY_BASE_URL ?? "http://localhost:3020";
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

/**
 * Local only — nothing in `.github/workflows/` runs this project. `workers: 1`
 * for the same single-process JSON-aggregation reason as `apps/www`'s config.
 * `QUALITY_ADMIN_EMAIL`/`QUALITY_ADMIN_PASSWORD` load from `.env.local` here
 * (when present) so `e2e/globalSetup.ts`, which runs in this same process,
 * never needs them exported manually.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/globalSetup.ts",
  reporter: "list",
  use: {
    baseURL,
    storageState: "e2e/.auth/admin.json",
    ...(bypassSecret
      ? {
          extraHTTPHeaders: {
            "x-vercel-protection-bypass": bypassSecret,
            "x-vercel-set-bypass-cookie": "true",
          },
        }
      : {}),
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

#### apps/test/e2e/adminAxe.e2e.ts

```ts
import { AxeBuilder } from "@axe-core/playwright";
import { test } from "@playwright/test";

import { discoverAdminRoutes, QUALITY_THEMES } from "./adminRoutes";
import { writeAuditJson } from "./auditJson";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME_STORAGE_KEY = "vex-theme";

interface RouteAxeResult {
  path: string;
  theme: (typeof QUALITY_THEMES)[number];
  violations: unknown[];
}

const results: RouteAxeResult[] = [];

for (const theme of QUALITY_THEMES) {
  test(`admin — ${theme}`, async ({ page }) => {
    await page.addInitScript(
      (entry) => {
        window.localStorage.setItem(entry.key, entry.value);
      },
      { key: THEME_STORAGE_KEY, value: theme },
    );
    const routes = await discoverAdminRoutes({ page });
    for (const routePath of routes) {
      await page.goto(routePath);
      const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      results.push({ path: routePath, theme, violations: axeResults.violations });
    }
  });
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "admin-axe.json",
    data: {
      generated: new Date().toISOString(),
      baseURL: process.env.QUALITY_BASE_URL ?? "http://localhost:3020",
      tags: AXE_TAGS,
      results,
    },
  });
});
```

#### apps/test/e2e/adminWidths.e2e.ts

```ts
import { test } from "@playwright/test";

import { discoverAdminRoutes, QUALITY_WIDTHS } from "./adminRoutes";
import { writeAuditJson } from "./auditJson";

interface OffscreenControl {
  t: string;
  l: number;
  r: number;
}

interface WidthMeasurement {
  overflowX: number;
  culpritsOutsideScrollRegions: number;
  offscreenControls: OffscreenControl[];
}

const INTERACTIVE_TAGS = ["a", "button", "input", "select", "textarea"];

/**
 * Measures the current viewport for document-level horizontal overflow and
 * any visible, text-bearing or interactive leaf element that extends past the
 * viewport while NOT nested inside a horizontally scrollable ancestor — the
 * data table's own scroll region is the expected exception this excludes.
 *
 * @returns The width's overflow measurement.
 */
function measureOverflow(): WidthMeasurement {
  const viewportWidth = document.documentElement.clientWidth;
  const overflowX =
    document.documentElement.scrollWidth > document.documentElement.clientWidth ? 1 : 0;
  const offscreenControls: OffscreenControl[] = [];

  const isScrollRegion = (element: Element) => {
    const style = window.getComputedStyle(element);
    return style.overflowX === "auto" || style.overflowX === "scroll";
  };
  const insideScrollRegion = (element: Element) => {
    let node = element.parentElement;
    while (node) {
      if (isScrollRegion(node)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const candidates = document.querySelectorAll(
    "a, button, input, select, textarea, [tabindex], [role], p, span, li, h1, h2, h3, h4, h5, h6",
  );
  for (const element of candidates) {
    if (element.children.length > 0) {
      continue;
    }
    const text = (element.textContent ?? "").trim();
    const isInteractive = INTERACTIVE_TAGS.includes(element.tagName.toLowerCase());
    if (text.length === 0 && !isInteractive) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    if ((rect.right > viewportWidth + 1 || rect.left < -1) && !insideScrollRegion(element)) {
      offscreenControls.push({
        t: text.slice(0, 40),
        l: Math.round(rect.left),
        r: Math.round(rect.right),
      });
    }
  }

  return { overflowX, culpritsOutsideScrollRegions: offscreenControls.length, offscreenControls };
}

const results: Record<string, Record<number, WidthMeasurement>> = {};

for (const width of QUALITY_WIDTHS) {
  test(`admin @${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const routes = await discoverAdminRoutes({ page });
    for (const routePath of routes) {
      await page.goto(routePath);
      const measurement = await page.evaluate(measureOverflow);
      results[routePath] ??= {};
      results[routePath][width] = measurement;
    }
  });
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "admin-width-matrix.json",
    data: {
      generated: new Date().toISOString(),
      method:
        "document.documentElement.scrollWidth vs clientWidth for overflowX; each visible, " +
        "text-bearing or interactive leaf element overflowing the viewport and not inside a " +
        "horizontally-scrollable ancestor counts toward culpritsOutsideScrollRegions, with its " +
        "trimmed text and left/right bounds recorded in offscreenControls.",
      routes: Object.keys(results).sort(),
      widths: QUALITY_WIDTHS,
      results,
      findings: [],
      fixes: [],
    },
  });
});
```

#### scripts/validate-html.mjs

```js
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APP_BASE_PORTS = { test: 3020, www: 3030 };

/**
 * Runs the Nu Html Checker against one or more fully-qualified URLs.
 *
 * @param props - Input props.
 * @param props.urls - URLs to validate; `vnu-jar` fetches each one itself.
 * @returns The parsed `vnu-jar --format json` result.
 */
function runNu(props) {
  const output = execFileSync(
    "npx",
    ["vnu-jar", "--format", "json", "--stdout", "--exit-zero-always", ...props.urls],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 1024 * 1024 * 32 },
  );
  return JSON.parse(output);
}

/**
 * Reads an app's `e2e/routes.ts` `QUALITY_ROUTES` and resolves the URLs to
 * validate for it.
 *
 * @param props - Input props.
 * @param props.app - Workspace app name (`"www"` or `"test"`).
 * @param props.baseURL - Base URL the app is running on.
 * @returns Fully-qualified URLs, excluding `draft` routes when `CI` is set.
 */
async function resolveAppUrls(props) {
  const routesPath = path.join(ROOT, "apps", props.app, "e2e", "routes.ts");
  const { QUALITY_ROUTES } = await import(pathToFileURL(routesPath).href);
  return QUALITY_ROUTES.filter((route) => !(process.env.CI && route.draft)).map(
    (route) => `${props.baseURL}${route.path}`,
  );
}

async function main() {
  const [arg, appArg] = process.argv.slice(2);
  if (!arg) {
    console.error("Usage: node scripts/validate-html.mjs <url> | --app <www|test>");
    process.exitCode = 1;
    return;
  }

  if (arg === "--app") {
    if (appArg !== "www" && appArg !== "test") {
      console.error(`Unknown app "${appArg}" — expected "www" or "test".`);
      process.exitCode = 1;
      return;
    }
    const baseURL = process.env.QUALITY_BASE_URL ?? `http://localhost:${APP_BASE_PORTS[appArg]}`;
    const urls = await resolveAppUrls({ app: appArg, baseURL });
    const result = runNu({ urls });
    const outDir = path.join(ROOT, "apps", appArg, "audit");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, `${appArg}-nu.json`),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    console.log(`Wrote apps/${appArg}/audit/${appArg}-nu.json (${urls.length} routes).`);
    return;
  }

  console.log(JSON.stringify(runNu({ urls: [arg] }), null, 2));
}

await main();
```

**Draft audit procedure**

A route carrying `draft: true` in `e2e/routes.ts` is unpublished, so an anonymous Playwright run
404s on it — `CI` being set is what makes `axe.e2e.ts`/`widths.e2e.ts` skip it instead of
recording that 404 as a finding. Auditing it for real, once its content exists, is manual and
local: publish the document from the running admin on the dev deployment (toggle its status to
published, or run the collection's publish action), run the local suite with `CI` explicitly
unset — e.g. `pnpm --filter www exec playwright test e2e/axe.e2e.ts` from a shell where `CI` is
not exported — so the now-reachable route is included, record the result as a row in
`findings.md` (added in step 3), then unpublish the document again. The owning spec step drops
that route's `draft: true` in the same edit that publishes the document for real (not here) —
until then, every re-run of this procedure re-covers the same route.

Verify: `pnpm lint` passes with jsx-a11y warnings (root `pnpm lint` only reaches
`packages/*/src/**`, so this specifically confirms `packages/react`'s `.tsx` files; `pnpm --filter
www lint` and `pnpm --filter test lint` confirm their own apps). `pnpm --filter www exec
playwright test` against the running www on :3030 writes `audit/www-axe.json` and
`audit/www-width-matrix.json`. `pnpm --filter www exec lhci autorun` writes a report under
`.lighthouseci/`. `node scripts/validate-html.mjs <url>` prints the Nu results for that one URL,
and `node scripts/validate-html.mjs --app www` writes `apps/www/audit/www-nu.json`. `pnpm --filter
www test` collects no `e2e/` file (its `vitest.config.ts` `include` never matches outside `src/`).
`pnpm --filter www typecheck` and `pnpm --filter test typecheck` stay green with the new `e2e/`
files in scope.

### Step 3 — Baseline run + findings ledger [agent]

This step produces no fixes — it runs every tool from step 2 against the running local
`www` (`:3030`) and local admin (`apps/test`, `:3020`), commits their JSON output, then
folds every automated signal (axe, widths, Lighthouse, Nu, jsx-a11y) plus one manual
keyboard/focus sweep into a single ledger (`findings.md`) so steps 4–9 fix against a
measured scope instead of re-discovering violations as they go. `www` and `apps/test`
are assumed already running per the contract (P-024: never start a dev server).

- [ ] Run axe + widths (Playwright) against local `www`; commit `apps/www/audit/www-axe.json`, `apps/www/audit/www-width-matrix.json`
- [ ] Run Lighthouse CI against local `www`; summarize into `findings.md` (assertions are `warn`, so no gate fails yet)
- [ ] Run Nu against local `www`; commit `apps/www/audit/www-nu.json`
- [ ] Run axe + widths (Playwright) against local admin (`apps/test`, signed in as the seeded test user); commit `apps/test/audit/admin-axe.json`, `apps/test/audit/admin-width-matrix.json`
- [ ] Triage every `pnpm lint` jsx-a11y warning into `findings.md`, one row per (rule, file) group
- [ ] Agent keyboard sweep with the `browser` tool over `inventory.md`: tab order, visible focus ring, dialog/sheet/popover trap + return
- [ ] Measure the focus indicator against 2.4.11 / 2.4.13 for every distinct `focus-visible:*ring*` treatment in `packages/react/src/ui` and `apps/www/src/components/ui`
- [ ] Regression-compare the new `www`/admin width-matrix runs against `.agent/docs/specs/2026-09-13-discord-post-readiness/audit/*-matrix.json`
- [ ] Classify every row against the fix boundary; file `backlog` rows with their evidence; leave none undispositioned
- [ ] Commit `apps/www/audit/*.json` and `apps/test/audit/*.json`

#### .agent/docs/specs/2026-11-06-quality-pass/findings.md

New file. The ledger. One row per distinct finding — one axe violation instance across
N routes is ONE row with N in Surface, not N rows. `ID` is `F-001`, `F-002`, … , assigned
in the order a row is first added (tool run order above, then keyboard-sweep rows, then
jsx-a11y rows); never renumbered once assigned, even if an earlier row is later deleted
as a duplicate (leave a one-line "merged into F-00X" note in Status instead of deleting).
`Disposition` is `fix` or `backlog` (see the classification rules below); every row has
one before this file is considered done. `Status` starts `open`, becomes `fixed (step N)`
once a later step lands the fix and re-verifies it, or `backlogged` once it is copied into
`backlog.md` with its evidence (step 14 still owns `backlog.md` itself — this file only
disposes).

```markdown
# Quality Pass — Findings Ledger

One row per distinct finding. `Disposition`: `fix` (lands within steps 4–9/11, ≤ ~30
lines, no public API change) or `backlog` (filed to `backlog.md` with this row's
evidence). `Status`: `open` | `fixed (step N)` | `backlogged`.

| ID | Surface | Width / theme | Criterion / APG | Tool | Evidence | Disposition | Status |
|----|---------|----------------|------------------|------|----------|--------------|--------|
| F-001 | `packages/react/src/ui` focus-visible consumers using `ring-ring/50` (`button.tsx:15`, `input.tsx:54`, `select.tsx:42`, `checkbox.tsx:12`, `textarea.tsx:12`, `radio-group.tsx:22`, `multi-select.tsx:139`, `accordion.tsx:89`, `badge.tsx:8`, `scroll-area.tsx:24`, `tabs.tsx:52`, `input-group.tsx:17`) and their `apps/www/src/components/ui` mirrors | all widths / light + dark | 2.4.11 Focus Not Obscured (Minimum), 2.4.13 Focus Appearance (AAA) | manual (token contrast calc, §Measuring the focus indicator) | `--ring` at 50% opacity composited over `--background` = 1.91:1 (light) / 2.61:1 (dark); over `--card` = 2.00:1 (light) / 2.62:1 (dark); over `--border` = 1.67:1 (light) / 2.51:1 (dark) — all below the 3:1 floor. `packages/react` theme CSS `--ring` tokens + `apps/www/src/app/globals.css:167,235` | fix | open |
| F-002 | `packages/react/src/ui/resizable.tsx:39` panel-resize handle | all widths / light + dark | 2.4.13 Focus Appearance (AAA) | manual (browser sweep, §Keyboard sweep) | `focus-visible:ring-1 focus-visible:ring-ring` — full-opacity `--ring` clears 3:1 (6.09–7.6:1 depending on theme/adjacent color) but the ring itself is 1 CSS px, under 2.4.13's ≥2 CSS px perimeter minimum | fix | open |

<!-- jsx-a11y rows: one per (rule, file) group, Tool = "jsx-a11y: <rule-id>" -->
<!-- axe rows: one per rule+target across routes, Tool = "axe: <rule-id>" -->
<!-- Nu rows: one per message type+element, Tool = "Nu" -->
<!-- width-matrix rows: one per route/width with overflowX>0, a culprit, or an offscreen control, Tool = "width-matrix" -->
<!-- Lighthouse rows: one per failing/warn audit id below budget, Tool = "Lighthouse" -->
<!-- keyboard-sweep rows: one per broken tab-order/trap/return, Tool = "keyboard sweep" -->
```

**Running the tools**

Every command below targets the already-running local servers; none starts a server.

```bash
# www — axe (light+dark, every QUALITY_ROUTES entry, draft included since CI is unset)
# and the width matrix, in one Playwright run (testMatch picks up both *.e2e.ts files)
pnpm --filter www exec playwright test
# -> apps/www/audit/www-axe.json, apps/www/audit/www-width-matrix.json

# www — Lighthouse CI (mobile preset, assertions at `warn`, so this always exits 0 —
# read the printed/`.lighthouseci/` report, don't rely on the exit code)
pnpm --filter www exec lhci autorun

# www — Nu: fetches each QUALITY_ROUTES entry's rendered HTML from QUALITY_BASE_URL
# (default http://localhost:3030) and runs vnu-jar over it
node scripts/validate-html.mjs
# -> apps/www/audit/www-nu.json

# admin (apps/test) — axe + width matrix, signed in as the seeded test user, local only
pnpm --filter test exec playwright test
# -> apps/test/audit/admin-axe.json, apps/test/audit/admin-width-matrix.json

# jsx-a11y (repo-wide, already non-blocking at `warn`)
pnpm lint
```

Commit every `apps/*/audit/*.json` this produces; they are the evidence every `Evidence`
cell below cites by path, not re-pasted inline.

**Triaging jsx-a11y warnings**

`pnpm lint`'s jsx-a11y warnings are per-JSX-element, so a widely reused primitive
(`<Input>` without an associated `<label>`) produces one warning per call site — grouping
by raw warning count would flood the ledger with duplicates of the same root cause.
Group every warning by `(rule id, source file)` before writing a row:

1. Collect `pnpm lint`'s output; for each `jsx-a11y/<rule>` line, bucket by
   `${rule}::${filePath}` (not by line number — multiple warnings in one file for the
   same rule collapse into one row; a different rule in the same file is a different
   row).
2. One `findings.md` row per bucket. `Surface` names the file (+ line list if ≤5, else
   "N occurrences"); `Criterion / APG` is the WCAG criterion the jsx-a11y rule maps to
   (e.g. `jsx-a11y/alt-text` → 1.1.1, `jsx-a11y/label-has-associated-control` → 1.3.1 +
   3.3.2, `jsx-a11y/interactive-supports-focus` → 2.1.1 + 4.1.2); `Tool` is
   `jsx-a11y: <rule-id>`.
3. A bucket whose every occurrence is on a component already covered by an axe or
   keyboard-sweep row (same root cause, different tool) gets folded into that row instead
   of a new one — add `jsx-a11y: <rule-id>` to its `Tool` cell rather than duplicating.
4. Every bucket gets a `Disposition` per the classification rules below.

**Keyboard sweep procedure (browser tool)**

Drive one real Chromium tab per `inventory.md` route/view (reuse the tab across routes in
the same surface to avoid relaunch overhead); for each:

1. `tab.goto(url)`, then repeatedly `tab.press("Tab")` from a fresh page load (focus
   starts on `<body>`), reading `document.activeElement` after each press via
   `tab.evaluate("() => { const e = document.activeElement; return { tag: e.tagName, role: e.getAttribute('role'), name: e.getAttribute('aria-label') || e.textContent?.trim().slice(0,40) }; }")`.
   Record the sequence; flag any element visually before another in reading order that
   receives focus after it (2.4.3), and any interactive element the sweep never reaches
   (2.1.1).
2. After each `Tab`, confirm a visible indicator exists AND measure it (see next section)
   — an indicator present but failing 2.4.11/2.4.13's contrast/thickness floor is still a
   finding, not a pass.
3. For every dialog/sheet/popover/dropdown-menu/select/command primitive in the
   inventory: open it (click or `Enter`/`Space` on its trigger per the APG pattern in
   `sources.md`), `Tab` through its full contents and confirm focus cycles back to its
   first focusable element rather than escaping to the page behind it (no trap found =
   finding), press `Escape` and confirm the trigger regains focus (no return = finding).
4. Record every break as a `findings.md` row with `Tool = "keyboard sweep"` and
   `Criterion / APG` set to the specific APG pattern section from `sources.md` (e.g.
   "Dialog (Modal) — Keyboard") or WCAG criterion (2.1.1, 2.1.2, 2.4.3, 2.4.7) it
   violates.

**Measuring the focus indicator vs 2.4.11 / 2.4.13**

2.4.13 requires the focus indicator area to be ≥2 CSS px thick around the unfocused
component's perimeter AND ≥3:1 contrast against every color adjacent to it (both the
unfocused-state's own color and whatever sits just outside the indicator); 2.4.11
requires it not be entirely hidden by other author content (sticky headers, etc. — a
separate check from the keyboard sweep's overlap pass).

Two layers of evidence:

**1. Token-level (already computed from the current `--ring` tokens, no browser needed).**
`packages/react`'s theme CSS and `apps/www/src/app/globals.css` define the same values:
light `--ring: oklch(60.5% 0.175 42)` (`:167`), dark `--ring: oklch(72% 0.175 50)`
(`:235`), against `--background` (`:141`/`:209`), `--card` (`:143`/`:211`) and `--border`
(`:165`/`:233`). Converting each oklch token to linear sRGB and computing WCAG relative
luminance / contrast ratio:

| Theme | `--ring` vs | full opacity | at 50% (the `ring-ring/50` utility every primitive in F-001 uses) |
|---|---|---|---|
| light | `--background` | 3.72:1 | 1.91:1 |
| light | `--card` | 4.16:1 | 2.00:1 |
| light | `--border` | 2.63:1 | 1.67:1 |
| dark | `--background` | 7.60:1 | 2.61:1 |
| dark | `--card` | 7.23:1 | 2.62:1 |
| dark | `--border` | 6.09:1 | 2.51:1 |

Every `/50` cell is under 3:1 in both themes; the light theme fails even at full opacity
against `--border` (2.63:1). This is why F-001 is filed without needing a browser run —
the token values alone prove the utility can never pass 2.4.13 as written, in either
theme, regardless of which component renders it.

**2. Rendered-DOM level (browser tool, per distinct focus-visible treatment — confirms
the token math survives cascade/variant overrides and catches outliers like F-002, whose
problem is thickness, not color).** For each entry in the `focus-visible:*ring*`
inventory built while triaging jsx-a11y/keyboard-sweep rows:

```js
await tab.run(async ({ tab }) => {
  await tab.focus("<selector for the focusable element>");
  return tab.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    // sample just outside each edge for the "adjacent" color, and the element's own
    // background for the "inside" color — 2.4.13 needs 3:1 against both.
    const outside = document.elementFromPoint(rect.left - 3, rect.top + rect.height / 2);
    return {
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      boxShadow: cs.boxShadow,
      ownBackground: cs.backgroundColor,
      adjacentBackground: outside ? getComputedStyle(outside).backgroundColor : null,
    };
  });
});
```

Parse `boxShadow`'s spread value (Tailwind's `ring-*` utilities render as a `box-shadow`
ring, not `outline`) for the indicator's thickness in CSS px, and feed `outlineColor` /
the `box-shadow` color plus `ownBackground` / `adjacentBackground` through the same
oklch/sRGB → relative-luminance → contrast-ratio pipeline used above (or convert the
rendered rgb()/oklch() computed values directly — `getComputedStyle` always returns
`rgb()`/`rgba()`, so no oklch conversion is needed for DOM-measured colors, only for the
raw token math above). A treatment fails if either the resolved thickness is <2 CSS px or
either computed contrast ratio is <3:1. Record every component measured this way against
its `focus-visible` class string in `Evidence`, even ones that pass — a clean pass is
still evidence steps 4–9 can cite instead of re-measuring.

**Regression compare against the discord-readiness matrices**

`.agent/docs/specs/2026-09-13-discord-post-readiness/audit/www-mobile-matrix.json` uses
the SAME field shape as the new `www-width-matrix.json` contract
(`overflowX`/`culpritsOutsideScrollRegions`/`offscreenControls`, keyed by route path) —
diff it directly: for each route present in both files, any of its three fields regress
(a cell that was clean going non-zero) at a shared width (375/390/768/1024) is a `fix`
row, not `backlog`, since it was already fixed once. A route the old file has that the
new inventory has renamed/removed is noted, not compared.

`admin-mobile-matrix.json` does NOT share a schema with the new `admin-width-matrix.json`
contract — it carries three incompatible shapes inside one file (`preFix`, keyed by view
name, fields `overflowX`/`offscreen`/`smallTargets`/`clipped`/`controls`, at
375/390/768/1024; `postFix`, keyed by `<surface>@<width>`, fields vary by surface —
`scrollW`/`clientW`/`innerW` for full views, `dialogW`/`inputW`/`pokingOut` for modals —
and ONLY at 375/390, never 768/1024 despite the file's top-level `widths` array listing
all four). Treat `postFix` (the shipped-clean state, not `preFix`'s known-broken
baseline) as the admin regression baseline, compared semantically per surface rather than
by automated field diff: match each new `admin-width-matrix.json` route/width entry to
its nearest `postFix` key by surface name (`pagesEdit`→ the edit view, `createDocumentModal`
→ the create-document dialog, `mediaLibraryPicker`→ the nested media picker, `mobile
Sheet`→ the collapsed-sidebar sheet) and confirm the same invariant still holds
(`scrollW === clientW` ⇔ the new run's `overflowX === 0`; `pokingOut === 0` ⇔ no offscreen
control for that dialog) at 375/390 only — there is no 768/1024 admin baseline to compare
against, so those widths get a fresh-audit disposition, never "regression."

**Classification rules vs the fix boundary**

A row is `fix` when its remedy is a class/attribute/markup change or a keyboard/focus
handler of ≤ ~30 lines with no public API change — the same boundary spec-tasks states.
Concretely:

- `fix`: missing/wrong ARIA attribute, missing label association, missing `alt`,
  color/contrast token swap, missing `tabindex`/focus-trap wiring inside an existing
  component, a `focus-visible` class swap (F-001, F-002), a heading-level fix, a missing
  `lang`, a target-size padding bump.
- `backlog`: anything requiring a new component, a changed public prop/API, a data-model
  change (e.g. an `alt` field that doesn't exist yet on a collection), a layout
  restructure beyond Tailwind classes, or a cross-cutting change spanning more than the
  ~30-line handler budget (a full keyboard-navigation rewrite of a composite widget, a
  drag-and-drop single-pointer alternative, a captioning pipeline).
- A row whose evidence is "no reliable automated test" (the `manual`-method rows in
  `sources.md`) still gets triaged here if the keyboard sweep or a code read already
  surfaced a concrete instance; rows with no evidence yet (true manual-only checks not
  yet performed) are out of this step's scope — they land in step 9's
  `manual-checklist.md`, not here.
- When in doubt between `fix` and `backlog`, estimate the diff first (open the file,
  count what would actually change) — don't guess from the violation's category.

Verify: `findings.md` has one row per finding (`ID`, `Surface`, `Width / theme`,
`Criterion / APG`, `Tool`, `Evidence`, `Disposition` `fix`/`backlog`) and none is
undispositioned; every `apps/*/audit/*.json` referenced by an `Evidence` cell exists and
is committed; the regression section lists every shared route/surface from both discord
matrices with an explicit pass/regression verdict, not just the ones that failed.

### Step 4 — Document shell: skip link, landmarks, metadata, preferences [dev]

Page-wide fixes that clear whole classes of axe/Nu rows across every route at once: the admin
shell gets the skip link, `id="main"` target and a labelled sidebar nav it was missing; www's
root layout gets a `viewport` export, `next.config.ts` forces blocking head metadata (F-073),
and the auth route gets a real title + heading (F-096, standalone page only); the shared
`@utility focus-ring` replaces every low-contrast `ring-*/50` focus treatment in both UI kits
(F-001/F-002); a forced-colors + universal reduced-motion pass lands in the shared theme CSS;
and the light `--primary` token is darkened for 1.4.3 (F-067/F-087). www's skip link/`id="main"`,
its per-page titles (`lib/metadata.ts`) and its motion primitives
(`TextEffect`/`AnimatedGroup`/`reveal.module.css`) were already correct — verified against the
real code, not re-implemented. Every fix below was re-verified against the running servers
(www `:3030`, admin `:3020`) after landing, not just read from source — see `Verify`.

**Blocked, reported, not silently worked around (P-023):** the `--primary` token darkening
(F-067/F-087) is correct in `apps/www/src/app/globals.css` but has **no visible effect on the
running site** — `apps/www/convex/seed.ts:57` seeds an active `themes` document whose own
`primary: "oklch(60.5% 0.175 42)"` field is injected by `ThemeStyle`/`ThemeLive` as a
`<style href="vex-theme-site" precedence="high">` block that outranks `globals.css`'s `:root`
(same specificity, later in source order) whenever a theme is active — confirmed live: `curl`
against `:3030` still shows `--primary: oklch(60.5% 0.175 42)` in that injected block, and the
Playwright axe re-run still measures `#ffffff` on `#d35413` (4.16:1) on every route with a
`bg-primary` button. `seed.ts` is outside this session's file permissions. See the IRC report to
`Main` for the two candidate fixes (edit `seed.ts`'s seeded theme + `seed:reinit`, vs. a one-off
Convex data patch) and their tradeoffs.

- [ ] `packages/react/styles.css`: `@utility focus-ring`, a `forced-colors: active` block, and a
      universal `prefers-reduced-motion: reduce` reset
- [ ] `apps/www/src/app/globals.css`: mirror `@utility focus-ring` (binding cross-step name);
      darken light `--primary` for 1.4.3 (blocked live by the seeded theme, see above)
- [ ] `packages/react/src/admin/AdminLayout.tsx`: skip link + `id="main"` on the shell `<main>`
- [ ] `packages/react/src/admin/AdminSidebar.tsx`: `role="navigation"` + `aria-label` on the
      sidebar nav
- [ ] `packages/react/src/admin/AdminTopNav.tsx`: per-view `document.title` (collection/global
      label, then the resolved document title once it loads)
- [ ] `apps/www/src/app/layout.tsx`: `viewport` export with light/dark `themeColor`
- [ ] `apps/www/next.config.ts`: `htmlLimitedBots: /.*/` — forces blocking head metadata for every
      user agent (F-073; lock held by `Main`)
- [ ] `apps/www/src/lib/authPageTitle.ts`: new shared title resolver for the auth route
- [ ] `apps/www/src/app/(frontend)/auth/[pathname]/page.tsx`: per-page `generateMetadata` (the
      one www route with no title at all — everything else already has one)
- [ ] `apps/www/src/app/(frontend)/auth/[pathname]/view.tsx`: `sr-only` `<h1>` (F-096, standalone
      page only — the modal's own accessible-name gap is step 7)
- [ ] `apps/www/src/vexcms/blocks/Header/index.tsx`: `aria-label` on both `<nav>`s
- [ ] Replace every `ring-*/50` focus-visible/focus-within treatment with `focus-visible:focus-ring`
      (or the matching `focus-within:`/`has-[...]:` variant) across 23 files in
      `packages/react/src/ui` and `apps/www/src/components/ui`, plus `resizable.tsx`'s 1px ring
      (fails the ≥2px perimeter independently of its opacity)
- [ ] `packages/react/src/testing/viewSuite.ts`: skip-link/`id="main"`, sidebar-landmark and
      document-title assertions in the existing `describeAdminLayout`/`describeAdminSidebar`/
      `describeAdminTopNav` suites
- [ ] Re-ran the step 2 tools against the live servers; updated `findings.md` dispositions
      (F-001, F-002, F-073 → `fixed (step 4)`; F-067 → `fixed (step 4)` on the www surface audited
      by this row; F-087/F-096 → split, partial fix recorded; new F-100 filed for the `apps/test`
      token drift this session cannot reach)

#### packages/react/styles.css

One new file-level `@utility` plus two new unlayered media blocks, appended after the existing
`.vex-scroll-area:hover` rule. `--color-ring` resolves through the cascade from whichever host
app's `@theme inline` block defines it (the same way `.vex-scroll-area` already resolves
`var(--color-foreground)` from a consumer's tokens) — no import-order dependency.

The `prefers-reduced-motion` reset is a universal, unlayered `animation-duration`/
`transition-duration` collapse rather than a per-component override. tw-animate-css 1.4.0 ships
no reduced-motion handling of its own (confirmed: no `prefers-reduced-motion` in
`tw-animate-css/dist/tw-animate.css`), and the `data-open:animate-in`/`data-closed:animate-out`
pattern this pass is also normalizing (dialog, alert-dialog, dropdown-menu, popover, select,
tooltip — `packages/react/src/ui` and `apps/www/src/components/ui`) repeats on every overlay
primitive; enumerating each one's reduced-motion variant would need updating again every time a
primitive is added. The universal reset is the standard WCAG-recommended pattern for exactly
this reason — it is exhaustive and needs no maintenance when a new `data-[state]`-driven
component lands. Verified live (browser tool, `:3030` and `:3020`, `emulate({ reducedMotion:
"reduce" })`): a freshly-injected `.animate-in.fade-in-0` test element computes
`animation-duration: 1e-05s`.

```css
@utility focus-ring {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}

@media (forced-colors: active) {
  :focus-visible {
    outline-color: Highlight;
  }

  ::selection {
    background-color: Highlight;
    color: HighlightText;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Contrast check (the numbers `2.4.13` requires), computed with a real OKLCH→sRGB conversion (not
the CSS file's own comment hexes, which are stale — see below) against the live-rendered tokens:
light `--ring` `#D35413` (`oklch(60.5% 0.175 42)`) against `--background` `#F2F2F2` is **3.72:1**
and against `--card` `#FFFFFF` is **4.16:1**; dark `--ring` `#F87E28` (`oklch(72% 0.175 50)`)
against `--background` `#080808` is **7.64:1** and against `--card` `#101010` is **7.25:1** — all
clear the 3:1 floor (`--ring` is a separate token from `--primary` and needed no change). The
opaque 2px `outline` this utility applies already exists globally as a bare `:focus-visible` rule
in every host app's `globals.css`; `focus-ring` exists so a component that sets `outline-none`
(every primitive in the replacement list below does, to make room for its own box-shadow ring)
can opt back in with one class, at the same two numbers. The box-shadow it replaces does not
clear this bar: compositing `ring-ring/50` onto `--card` gives `#E9AA89` at **1.99:1** in light
and `#84471C` at **2.63:1** in dark — both below 3:1, confirming `findings.md`'s "`ring-ring/50` is
suspect" note from step 3. Compiled output verified live (`:3030`'s served CSS chunk): the
`@utility` emits `.focus-visible\:focus-ring:focus-visible { outline: 2px solid
var(--color-ring); outline-offset: 2px; }` plus the `focus-within:`/`has-[...]:` variants, and the
`forced-colors` block is present verbatim.

**Correction from the step-3 estimate:** `globals.css`'s own hex comments (`#E8622A`, `#F5F5F5`,
`#0A0A0A`, …) are approximations, not the real rendered colors — a proper OKLCH conversion gives
`#D35413` for the old light `--ring`/`--primary`, `#F2F2F2` for `--background`, `#080808` for dark
`--background`, confirmed by live `curl`/axe measurement. Every number in this step uses the real
conversion. `packages/react/src/ui/sidebar.tsx`'s `ring-sidebar-ring`/`focus-visible:ring-2` rings
are excluded from the replacement list below: `packages/react/styles.css`'s own default
(`oklch(68.5% 0.165 45)`, real contrast **2.82:1** against its own `--sidebar` default — a real
defect, but dead: `rg "sidebar-primary|sidebar-ring" packages/react/src/ui/sidebar.tsx` finds no
consumer) is overridden by both `apps/www` and `apps/test`'s own unlayered `:root` (per
`css-and-tokens.md`'s override contract), which set `--sidebar-ring` to the same value as
`--ring`/old `--primary` — **3.92:1** against `--sidebar` `#F8F8F8`, already clearing 3:1. No file
change needed for the sidebar ring.

#### apps/www/src/app/globals.css

Two edits. Everything else in this file is unchanged: its own `:focus-visible`/`::selection`
rules already match the computed numbers above, and its `prefers-reduced-motion` block already
covers `.item`/`.live-dot`/`.reveal-group > *` (see the motion-primitives note below) —
`forced-colors` and the universal reduced-motion reset only need to live in
`packages/react/styles.css`, which this file already `@import`s transitively via
`@vexcms/next/styles`.

**1 — `@utility focus-ring`, right after the `@source` lines, before `@custom-variant dark`.**

```css
@utility focus-ring {
  outline: 2px solid var(--color-ring);
  outline-offset: 2px;
}
```

**2 — light `--primary` darkened for F-067/F-087, anchored on the existing `--primary:` line in
the light `:root` block.** Keeps the brand hue (42) and chroma (0.175); only lightness moves.
Recomputed with a real OKLCH→sRGB conversion: white-on-primary **5.45:1** (was 4.16:1),
primary-on-background (`#F2F2F2`) **4.87:1** (was 3.72:1 real/3.71:1 axe-measured),
primary-on-card (`#FFFFFF`) **5.45:1** — all clear 4.5:1 with margin, not hugging the floor.
**Not visible on the running site** — see the blocked note above; this is the correct default for
any deployment with no active theme record, and the edit QP-12/a seed update still needs to make
live.

```css
--primary:                     oklch(54%   0.175 42);          /* #BD3E00 */
```

`apps/www/src/app/(frontend)/(site)/layout.tsx` — no change, verified correct.

Already has exactly what this checkbox asks for: a `sr-only focus-visible:not-sr-only` skip link
(`href="#main"`) as the FIRST child rendered inside `SiteLayout`, and `<main id="main">`
immediately after `<SiteHeader />`. Traced the full render path above it —
`RootLayout` (`ServerProviders` → `ClientProviders` → `LivePreviewProvider` → `<ThemeLive />` →
`{children}`) → `(frontend)/layout.tsx` (`<ThemeStyle />` → `<FirstAdminBootstrap />`) — and every
one of those is either a non-interactive `<style>` tag (`ThemeStyle`) or renders `null`
(`ThemeLive`, `FirstAdminBootstrap` — confirmed: `FirstAdminBootstrap` is headless, `return null`
at the end of its component body). Verified live (browser tool, `:3030`, viewports 375 and 1536):
Tab from the address bar reaches the skip link first at both widths, with no code change. The
spec-tasks checkbox for this file is a **false assumption**: the fix already shipped.

`apps/www/src/vexcms/blocks/Header/index.tsx and Footer/index.tsx` — header/footer roles already correct.

`HeaderBlockRenderer` returns a native `<header>` (line with `<header className={cn("sticky
top-0 z-50 ...")}>`) and `FooterBlockRenderer` returns a native `<footer>`
(`<footer className="py-12 md:py-14">`) — both direct returns, not wrapped a second time by
`SiteHeader`/`SiteFooter` (those two just feed `RenderBlocks`, which returns a bare `<>` fragment
with no wrapper of its own). The "`header`/`footer` roles across www" checkbox needed no new
wrapper in `(site)/layout.tsx`; only the two `<nav>`s inside `Header/index.tsx` were unlabelled
(fixed below).

2 edits. Everything else in this file is unchanged.

**1 — desktop nav, anchored on the `items.length > 0 ? (` branch.**

```tsx
<nav aria-label="Primary navigation" className={cn("items-center gap-1", navClass)}>
```

**2 — mobile sheet nav, anchored on `<SheetTitle className="sr-only">Menu</SheetTitle>`.**

```tsx
<nav aria-label="Primary navigation" className="flex flex-col px-2 pt-2">
```

#### packages/react/src/admin/AdminLayout.tsx

2 edits. Everything else in this file is unchanged.

**1 — skip link, anchored on the outer `return (` fragment, as the first child before
`<FrameworkComponentsContext.Provider>`.**

```tsx
<a
  className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:rounded-sm focus-visible:border focus-visible:border-border focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground"
  href="#main"
>
  Skip to content
</a>
```

**2 — `id="main"` on the shell `<main>`, anchored on
`<main className="vex-scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto">`.**

```tsx
<main className="vex-scroll-area flex min-h-0 flex-1 flex-col overflow-y-auto" id="main">
```

Verified live (browser tool, signed in at `:3020/admin`): skip link exists, is the first
focusable element in DOM order, and `main#main` exists.

#### packages/react/src/admin/AdminSidebar.tsx

1 edit. Everything else in this file is unchanged.

**1 — landmark role + label, anchored on the `<Sidebar>` call inside `AppSidebar`'s `return`.**
`Sidebar`'s own prop type is `React.ComponentProps<"div"> & { side; variant; collapsible }`, so
`aria-label`/`role` pass through with no type change, and its desktop branch already spreads
`...props` onto the real `data-slot="sidebar-container"` box (`packages/react/src/ui/sidebar.tsx`)
— the mobile branch renders the same content inside a `Sheet`, already named via its own
`<SheetTitle className="sr-only">Sidebar</SheetTitle>`.

```tsx
<Sidebar
  aria-label="Admin navigation"
  collapsible={config.admin.sidebar.collapsible}
  role="navigation"
  side={config.admin.sidebar.side}
>
```

Verified live: `document.querySelector('[data-slot="sidebar-container"]')` at `:3020/admin`
returns `role="navigation"`, `aria-label="Admin navigation"`.

#### packages/react/src/admin/AdminTopNav.tsx

3 edits. Everything else in this file is unchanged.

**1 — import, in the existing `react` import.**

```tsx
import { Suspense, useEffect, useState, type ReactNode, type RefAttributes } from "react";
```

**2 — per-view title, anchored right after the existing `const baseCrumbs = buildBaseCrumbs({...});`
call inside `AdminTopNav`.**

```tsx
const pageTitle = baseCrumbs.at(-1)?.label ?? "Admin";
useEffect(() => {
  document.title = `${pageTitle} · Admin`;
}, [pageTitle]);
```

**3 — per-document title, anchored right after
`const { data: doc } = useSuspenseQuery(...)` inside `AdminTopNavDocCrumb`, before the existing
`if (!doc) return null;`.**

```tsx
useEffect(() => {
  if (doc) document.title = `${doc[props.collection.admin.useAsTitle] as string} · Admin`;
}, [doc, props.collection]);
```

Verified live: `document.title` at `:3020/admin` (dashboard) is `"Home · Admin"`.

#### apps/www/src/app/layout.tsx

1 edit (plus the `Viewport` import). Everything else in this file is unchanged — `metadata`
keeps its existing `description`/`icons`/`title`.

**1 — new `viewport` export, anchored right after `export const metadata: Metadata = {...};`.**
Colors are the real OKLCH→sRGB conversion of `--background` (not `globals.css`'s own stale hex
comments): `#F2F2F2` light, `#080808` dark.

```tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { color: "#F2F2F2", media: "(prefers-color-scheme: light)" },
    { color: "#080808", media: "(prefers-color-scheme: dark)" },
  ],
};
```

Verified live: `curl -s :3030/ | grep theme-color` returns both `<meta name="theme-color"
content="#F2F2F2" media="(prefers-color-scheme: light)"/>` and the `#080808` dark pair.

#### apps/www/next.config.ts

1 edit (lock held by `Main`). F-073: Next 16's streaming metadata puts `<title>`/`<meta>`/`<link>`
in `<body>` for any user agent not on Next's `htmlLimitedBots` default allow-list — valid for
search-engine crawlers, but every other visitor (including assistive technology reading the
initial HTML before hydration) gets an invalid document with no `<title>` in `<head>`.
`htmlLimitedBots: /.*/` (Next's own documented way to fully disable metadata streaming) makes
every request get blocking head metadata.

**1 — anchored on `reactCompiler: true,` inside `nextConfig`.**

```ts
htmlLimitedBots: /.*/,
```

Verified live, no dev-server restart needed (Next picked up the config change): `curl -s
:3030/ | grep -o '<title>.*</title>'` returns `<title>Home | Vex CMS</title>`, and a byte-offset
check confirms it sits before `</head>`, not after `<body`.

#### apps/www/src/lib/authPageTitle.ts

New file. Shared by `page.tsx`'s `generateMetadata` and `view.tsx`'s `<h1>` so the two titles
(document title, visible/`sr-only` heading) can never drift.

```ts
const AUTH_PAGE_TITLES: Record<string, string> = {
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
  "sign-in": "Sign in",
  "sign-up": "Sign up",
}

/**
 * Resolves the human-readable title for a better-auth-ui route segment.
 *
 * @param pathname - The `[pathname]` route param (e.g. `"sign-in"`).
 * @returns The matching label, or `"Account"` for any unmapped segment.
 */
export function resolveAuthPageTitle(pathname: string): string {
  return AUTH_PAGE_TITLES[pathname] ?? "Account"
}
```

#### apps/www/src/app/(frontend)/auth/[pathname]/page.tsx

1 edit (full file — small enough to show complete). The only www route with no `<title>` at all.

```tsx
import type { Metadata } from "next"

import { resolveAuthPageTitle } from "~/lib/authPageTitle"

import AuthView from "./view"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathname: string }>
}): Promise<Metadata> {
  const { pathname } = await params
  return { title: `${resolveAuthPageTitle(pathname)} | Vex CMS` }
}

export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  const { pathname } = await params

  return <AuthView pathname={pathname} />
}
```

#### apps/www/src/app/(frontend)/auth/[pathname]/view.tsx

1 edit (full file). F-096 (standalone page only — the intercepted modal's own accessible-name gap
is step 7's `@auth/(.)auth/[pathname]/view.tsx`, a different file).

```tsx
import { AuthView } from "@daveyplate/better-auth-ui";

import { resolveAuthPageTitle } from "~/lib/authPageTitle";

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <main className="absolute inset-0 grid place-items-center">
      <h1 className="sr-only">{resolveAuthPageTitle(pathname)}</h1>
      <AuthView path={pathname} />
    </main>
  );
}
```

Verified live: `/auth/sign-in` and `/auth/sign-up` axe runs no longer flag `document-title`/
missing-heading; the remaining `color-contrast` node on those two routes is the same blocked
`--primary` token as every other route (see the note at the top of this step).

`apps/www/src/lib/metadata.ts` — no change, verified correct.

`generatePageMetadata` already covers the home page and every `[slug]` page — both
`(frontend)/(site)/page.tsx` and `(frontend)/(site)/[slug]/page.tsx` already call
`generateMetadata()` → `generatePageMetadata({ slug })`, producing a unique `<title>` per page
from `siteSettings`/page `metaTitle` with a `" | Vex CMS"` suffix. `/unauthorized` has its own
static `metadata = { title: "Access denied" }`. The one real gap was the auth route (fixed
above) — spec-tasks' "per-page unique `<title>` via the existing `lib/metadata.ts`" checkbox
is otherwise a **false assumption**: it already shipped for every seeded page.

`apps/www/src/components/motion-primitives/reveal.module.css and TextEffect.tsx/AnimatedGroup.tsx` — no change, verified correct.

Neither component imports a motion library (`rg "from \"motion|from \"framer-motion"` across
`apps/www/src` returns nothing) — both are pure CSS, driven entirely by `styles.item`
(`reveal.module.css`), which already carries its own
`@media (prefers-reduced-motion: reduce) { .item { animation: none; } }`. `globals.css`'s own
reduced-motion block additionally lists a bare `.item` selector, but that targets a CSS-module
hashed class name it can never actually match — harmless dead code, not touched here since it
sits outside this step's fix boundary and the real rule (inside the module) already works.
Spec-tasks assumed a motion library with "its own reduced-motion hook" might be in play here;
there is none, and the pure-CSS implementation already satisfies MQ5. Verified live (browser
tool, `emulate({ reducedMotion: "reduce" })`, `:3030/`): zero elements compute a finite
`animationDuration` after reload; with emulation off (the earlier, incorrect check), 122
`reveal-module__*__item` elements animate at `1.1s` as designed. No file in this group changes.

**Replace `ring-*/50` with `focus-ring`**

One substitution, applied to every file below: remove the paired width + color/opacity ring
utilities (`ring-3`/`ring-[3px]`/`ring-1` + `ring-ring/50` or `ring-ring`) on the
`focus-visible:`/`focus-within:`/`has-[...]:focus-visible]:` variant and add
`<variant>:focus-ring` in their place. `border-ring` (a separate, unrelated border-color change)
and every `aria-invalid:*`/`destructive` ring (validation state, not the focus indicator) are
untouched. 23 files (22 originally listed plus `packages/react/src/ui/input.tsx`, missed in the
first pass and caught by a post-edit `rg "ring-ring/50"` sweep that returned zero matches once
added), each a one-line `className` edit:

| File | Before (exact substring) | After |
|---|---|---|
| `packages/react/src/ui/JsonEditorView.tsx` | `focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50` | `focus-within:border-ring focus-within:focus-ring` |
| `packages/react/src/ui/accordion.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/badge.tsx` | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/button.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/checkbox.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/input-group.tsx` | `has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50` | `has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:focus-ring` |
| `packages/react/src/ui/input.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/multi-select.tsx` | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/radio-group.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/resizable.tsx` | `"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",` | `"focus-visible:focus-ring",` |
| `packages/react/src/ui/scroll-area.tsx` | `focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1` | `focus-visible:focus-ring` |
| `packages/react/src/ui/select.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/tabs.tsx` | `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring` | `focus-visible:border-ring focus-visible:focus-ring` |
| `packages/react/src/ui/textarea.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/accordion.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/badge.tsx` | `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]` | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/button.tsx` | `focus-visible:border-ring focus-visible:ring-ring/50 ... focus-visible:ring-[3px]` (both occurrences in the base `cva` string) | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/combobox.tsx` | `focus-within:border-ring focus-within:ring-ring/50 ... focus-within:ring-[3px]` | `focus-within:border-ring focus-within:focus-ring` |
| `apps/www/src/components/ui/input-group.tsx` | `has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 ... has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]` | `has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:focus-ring` |
| `apps/www/src/components/ui/input.tsx` | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/select.tsx` | `focus-visible:border-ring focus-visible:ring-ring/50 ... focus-visible:ring-[3px]` | `focus-visible:border-ring focus-visible:focus-ring` |
| `apps/www/src/components/ui/textarea.tsx` | `focus-visible:border-ring focus-visible:ring-ring/50 ... focus-visible:ring-[3px]` | `focus-visible:border-ring focus-visible:focus-ring` |

Two files worked in full, pinning the exact transform (the rest apply the identical rule shown
in the table above):

```tsx
// packages/react/src/ui/button.tsx — buttonVariants base string, 1 edit
"group/button font-mono relative inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-[13px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:focus-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
```

```tsx
// apps/www/src/components/ui/input.tsx — InputPrimitive className, 1 edit
"h-8 w-full min-w-0 rounded-sm border border-input bg-card px-2.5 py-1 text-[13px] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
```

#### packages/react/src/testing/viewSuite.ts

3 edits. Everything else in this file is unchanged. `describeAdminSidebar` has no `convexTest`
instance of its own (its render helper is `renderWithVexProviders(mount())`, no `convex` key) —
caught by `pnpm --filter @vexcms/react typecheck` (`Cannot find name 't'`) and fixed before this
landed.

**1 — landmark assertion, anchored after the existing `runRbacStateSuite({...});` call inside
`describeAdminSidebar`, before the closing `});` of its `describe` block.**

```tsx
it("exposes the sidebar as a labelled navigation landmark", () => {
  const utils = renderWithVexProviders(mount());
  const nav = utils.container.querySelector('[data-slot="sidebar-container"]');
  expect(nav).toHaveAttribute("role", "navigation");
  expect(nav).toHaveAttribute("aria-label", "Admin navigation");
});
```

**2 — skip link + `id="main"` assertion, anchored after the existing
`it("marks the active collection's nav entry and leaves the others inactive", ...)` test inside
`describeAdminLayout`'s non-access branch, before the closing `});` of its `describe` block.**

```tsx
it("renders a skip link targeting the main landmark", () => {
  const utils = renderView(
    createElement(AdminLayout, {
      activeSlug: "posts",
      children: createElement("div", null, "content"),
    }),
    { convex: t },
  );
  const skipLink = utils.container.querySelector('a[href="#main"]');
  expect(skipLink).not.toBeNull();
  expect(utils.container.querySelector("main#main")).not.toBeNull();
});
```

**3 — document-title assertions, anchored inside `describeAdminTopNav`'s non-access branch: one
line added to the existing `it("renders the breadcrumb trail for an active collection route",
...)` test, and one line added to the existing `it("resolves the document-title crumb via
Suspense for an active edit route (top-bar move)", ...)` test, after its own `await waitFor(...)`
resolves the crumb.**

```tsx
expect(document.title).toBe("Posts · Admin");
```

```tsx
expect(document.title).toBe("My Post Title · Admin");
```

Verify: `pnpm --filter @vexcms/react test` (2646 passed, 1 skipped), `pnpm --filter @vexcms/react
typecheck`, `pnpm --filter www test` (95 passed), `pnpm --filter www typecheck`, `pnpm lint` (0
errors, 192 pre-existing warnings) all exit 0. `env -u CI npx playwright test e2e/axe.e2e.ts`
against the running www: 34/34 pass (this suite writes `audit/www-axe.json`, non-blocking by
design per step 2 — the `bypass`/`landmark-*`/`region`/`document-title`/`html-*` rows ARE absent
from it); `env -u CI npx playwright test e2e/widths.e2e.ts` passes. Tab from the address bar
reaches the skip link first at 375 and 1536 on both `/` (www) and `/admin` (signed in at `:3020`,
browser tool). With `emulate({ reducedMotion: "reduce" })`, `TextEffect`/`AnimatedGroup` render
statically (0 finite-duration animations found page-wide) and a synthetic `.animate-in` probe on
`:3020` computes a 0.01ms duration. The one row Verify asked for that is **not** clean:
`color-contrast` still fires on every route with a `bg-primary` button, because the live
`--primary` is the seeded theme's `oklch(60.5% 0.175 42)`, not `globals.css`'s new
`oklch(54% 0.175 42)` — see the blocked note at the top of this step.

### Step 5 — UI primitives against APG [dev]

Every admin view and www block composes `packages/react/src/ui` and the overlapping
`apps/www/src/components/ui`/`apps/test/src/components/ui` primitives, almost all built on
Base UI 1.2 (`@base-ui/react`) which already implements the matching APG role/state/keyboard
model, plus `cmdk` under `command.tsx` (via Base UI's `Combobox` on the www side). Base UI
closes most of the APG gap by construction — `data-slot`/`data-open`/`data-highlighted`
attributes and the keyboard handlers are already wired. The real gaps left in this pass are
local: icon-only buttons rendered with no accessible name, interactive elements smaller than
the 24×24 CSS px target (2.5.8), a `role="button"` Base UI's own `Button` forces onto a real
navigable anchor, and the handful of hand-rolled interactive bits that sit outside Base UI's
reach (`MultiSelectValue`'s removable chip, `resizable.tsx`'s drag handle, the datetime
month/year toggles). Each primitive below keeps its existing props/className contract; fixes
are classes, `aria-label`s, and `tabIndex`/`onKeyDown` only.

**APG mapping / library coverage / gaps**

- `dialog.tsx`, `apps/www` `dialog.tsx` — APG Dialog (Modal), Base UI `Dialog` primitive:
  focus trap, `Escape`, `role="dialog"`, `aria-modal`, labelled via `DialogTitle` already
  provided. `DialogContent`'s close button already carries a visually-hidden "Close" `<span>`
  next to its `XIcon` in both files — found already fixed before this step started (a prior
  session's edit), verified by the colocated test's "names its close button" assertion. No
  further gap.
- `alert-dialog.tsx` (both packages) — APG Alert Dialog. Base UI `AlertDialog` provides the
  trap and `role="alertdialog"`. **Correction to this section's first draft:** Base UI 1.2's
  `useDialogRoot` resolves `escapeKey` to `isTopmost` for the alert dialog variant too — an
  alert dialog on Escape closes exactly like a regular dialog; the "does not close on Escape"
  assertion an earlier draft of this test carried was never a real APG requirement and only
  ever passed by racing the close, which is the flake observed under CI load. The shipped
  test opens via a real trigger click, presses Escape, waits for the dialog to unmount, and
  asserts focus returns to the trigger. No icon-only control; no gap beyond the shared
  focus-ring token (step 4).
- `sheet.tsx` — APG Dialog (Modal), side-anchored. Base UI `Dialog` under the hood (same
  primitive as `dialog.tsx`, `side` is presentation only). `SheetContent`'s close button
  also already carries its `sr-only` "Close" span — same already-fixed state as `dialog.tsx`.
  No further gap.
- `dropdown-menu.tsx` — APG Menu Button. Base UI `Menu` (`MenuPrimitive`) supplies
  `role="menu"`/`"menuitem"`, arrow-key roving focus, typeahead, `Escape`, submenu
  `ArrowRight`/`ArrowLeft`. No gap in the primitive itself; the trigger is caller-supplied
  (icon-button callers are audited in step 6/7, not here).
- `select.tsx` (both packages) — APG Listbox-pattern Select (Base UI's `Select` is a
  non-native, ARIA 1.2 `role="combobox"`/`role="listbox"` implementation). **Correction:**
  this build moves REAL DOM focus onto each option as `ArrowUp`/`ArrowDown` is pressed
  (`tabindex` flips `-1`→`0` on the highlighted option, `document.activeElement` becomes the
  option itself) — it does not use `aria-activedescendant` at all, despite the option's own
  `role="option"`. `Home`/`End`, typeahead already provided. No icon-only gap — `SelectTrigger`
  always renders a text `SelectValue`.
- `popover.tsx` — APG non-modal Dialog pattern (Base UI `Popover`): `Escape` to close,
  focus returns to trigger, `aria-expanded` on the trigger. No gap in the primitive; callers
  control the trigger's name.
- `command.tsx` — APG Combobox with a listbox popup, `cmdk`: `ArrowUp`/`ArrowDown` moves
  `aria-selected` across items (cmdk highlights the first item by default on mount, before
  any key press), `Enter` selects, typeahead filters. Gap: `CommandInput` has no default
  accessible name on its own — `cmdk`'s `Command` root takes a `label` prop (an accessible
  label for the whole command menu, rendered as a visually-hidden heading `CommandInput`'s
  `aria-labelledby` already points at); without it, that `aria-labelledby` resolves to
  nothing and silently overrides any `aria-label` passed directly to `CommandInput`. Every
  caller of `Command` needs to pass `label`.
- `multi-select.tsx` — APG Combobox (multi-select variant) composed from `popover.tsx` +
  `command.tsx`. `MultiSelectTrigger` already sets `role="combobox"` + `aria-expanded`
  (`packages/react/src/ui/multi-select.tsx:134-136`). Gap (real, not stylistic):
  `MultiSelectValue`'s per-chip remove control was a `Badge` with `onClick` and
  `aria-label={...Remove ${label}}` but `Badge` defaults to a plain `<span>` — no
  `role="button"`, no `tabIndex`, no `onKeyDown` for `Enter`/`Space`. Clickable but **not
  keyboard-operable** (2.1.1). A second gap in the same file: the hidden
  `<button data-multiselect-focus>` keyboard-nav target (used when `search` is off) had no
  accessible name at all.
- `tabs.tsx` — APG Tabs, Base UI `Tabs`: `role="tablist"`/`"tab"`/`"tabpanel"`,
  `aria-selected`. **Correction:** `Tabs.List` defaults `activateOnFocus` to `false` — the
  APG's *manual*-activation model. Arrow keys move real focus between tabs without
  selecting them; the user presses `Enter`/`Space` to activate the focused tab. (Automatic
  activation, where the arrow key itself selects, is the other APG-sanctioned model, but
  isn't this primitive's default — no code gap, the test asserted the wrong model.)
- `accordion.tsx` (both packages) — APG Accordion (disclosure group), Base UI `Accordion`:
  trigger is a real `<button>`, `aria-expanded`, panel `role` implicit via `AccordionPanel`.
  Base UI's own keyboard model is `Enter`/`Space` only, matching APG. No gap.
- `checkbox.tsx` — APG Checkbox, Base UI `Checkbox.Root`/`Indicator`: native `role`,
  `Space` toggles, `aria-checked` incl. `"mixed"`. No gap; `size-4` (16px) hit area is
  widened by the field layout's `after:-inset-x-3 after:-inset-y-2`, not the control itself
  — flagged in the target-size list below as the spacing exception, not a fix.
- `radio-group.tsx` — APG Radio Group, Base UI `RadioGroup`/`Radio.Root`: arrow-key roving
  tab index across radios, `Space`/selection semantics. No gap; same `size-4` + spacing
  exception as checkbox.
- `tooltip.tsx` — APG Tooltip (Base UI `Tooltip`, `role="tooltip"`, shows on focus AND
  hover, `Escape` dismisses, no focus trap — this is the non-interactive "accessible
  description" WCAG 1.4.13 actually requires of a tooltip, not the APG's own interactive
  variant). No gap in the primitive; a tooltip triggered only by an icon button with no
  `aria-label` still fails `button-name` because the name must exist independent of hover.
- `sidebar.tsx` — composed from `sheet.tsx` (mobile) + `Button`/`Tooltip`/`useRender`, no
  single APG pattern. `SidebarTrigger` already has `aria-label="Toggle Sidebar"`, confirmed
  by `sidebar.test.tsx`'s own assertion; `SidebarRail` too (`:345`). Gaps (fixed):
  `SidebarGroupAction` and `SidebarMenuAction` were `aspect-square w-5` (**20×20 CSS px**,
  below the 24×24 minimum) with NO default name and no caller anywhere in the repo to supply
  one (`grep -rn "SidebarGroupAction\|SidebarMenuAction" packages/react/src apps/test/src
  apps/www/src` returns only the definitions and the barrel export) — a primitive-level fix
  with no call-site migration needed.
- `pagination.tsx` — APG Pagination is not a distinct APG widget; a `<nav aria-label>`-wrapped
  link/button list, Base UI uninvolved on the LIST side. Gap (real, found while implementing
  this step, not predicted): `PaginationLink`'s real `<a href>` anchors went through Base
  UI's `Button` with `nativeButton={false}` to pick up its styling/keyboard affordances —
  `Button` unconditionally sets `role="button"` on whatever it renders that way, which
  overrode the anchor's native link semantics, hiding every pagination link from a screen
  reader's "links" list-navigation shortcut and misrepresenting a navigation control as an
  action control (4.1.2, 2.4.4). `PaginationLink`/`Previous`/`Next` default `size="icon"`
  (32px, fine). `PaginationEllipsis` already carries a `<span class="sr-only">More
  pages</span>`; `Pagination`'s own `<nav>` already has `aria-label="pagination"`. Neither
  needed a fix.
- `data-table/` — no single `data-table.tsx`; `DataTableBulkActions`, `DataTableColumnsMenu`,
  `DataTablePageSizeSelect`, `DataTableResponsiveMenu`, `DataTableSortHeader` each already
  have a colocated `.test.tsx`. Checked within this step's boundary: `DataTableColumnsMenu`'s
  own "Columns" trigger and its pin-left/pin-right icon buttons already carry `aria-label`s
  — no gap there. Real gaps found: the per-column visibility `<label>`s and the Density
  `<label>`s wrapped their `Checkbox`/`RadioGroupItem` by nesting alone, with no `id`/
  `htmlFor` pairing (jsx-a11y `label-has-for`); same in `DataTablePageSizeSelect`'s
  "N per load" radio labels.
- `resizable.tsx` — APG has no "resizable panel splitter" pattern; the closest WAI-ARIA
  mapping is the `separator` role, which `react-resizable-panels`' `PanelResizeHandle`
  already sets (`role="separator"`, `tabIndex=0`, arrow-key resize). It computes
  `aria-valuenow`/`min`/`max` itself from the panel group's own measured layout — jsdom has
  no layout engine, so those three attributes never appear in the colocated test regardless
  of any fix here; this is a test-environment limitation, not a defect (same class as
  `color-contrast`/`target-size` in `testing/a11y.ts`'s `DISABLED_RULES`). The real,
  fixable gap: `ResizableHandle` had no default `aria-label`, and neither of its two
  existing callers (`CollectionEditView.tsx:667`, `GlobalEditView.tsx:589`) supplied one —
  fixed with a **default value**, not a required prop, specifically so those two out-of-
  scope call sites keep compiling unchanged.
- `apps/www` `combobox.tsx` — Base UI `Combobox` (the same family `multi-select.tsx` sits
  on). Gap found while writing its colocated test: `ComboboxChip`'s `ComboboxPrimitive.ChipRemove`
  and `ComboboxClear`'s `ComboboxPrimitive.Clear` each rendered only an `XIcon` with no
  `aria-label` — real icon-only buttons with zero accessible name.
- `datetime/input.tsx`, `datetime/date-picker.tsx`, `datetime/time-picker.tsx` — not named
  in spec-tasks step 5's own primitive list, but `packages/react/src/ui/datetime/**` is
  still `packages/react/src/ui/**`, and jsx-a11y's own static pass already flagged five
  genuine gaps here (`findings.md` F-005/F-012/F-040/F-043/F-044) that this step's fix
  boundary covers: `DateTimeInput`'s segmented text `<input>` had no label at all (now an
  `ariaLabel` option, default `"Date and time"`); the calendar popup's month/year `<span
  onClick>` toggles had no `role`/`tabIndex`/`onKeyDown`, mouse-only; and three
  `role="combobox"` triggers (the main date trigger, the in-popup hour/minute/second
  `TimePicker`, and the standalone `SimpleTimePicker`) exposed `aria-expanded` without the
  `aria-controls` ARIA 1.2 requires once a combobox owns a popup.

**Icon-only buttons + target size — audit procedure and findings**

`pnpm --filter @vexcms/react test -- ui` and `pnpm --filter www test` (both re-run after
every fix below) catch missing names at component level via the colocated axe tests; the
width/contrast/real-pixel side of 2.5.8 is confirmed by the step 3 agent keyboard sweep +
step 6/7 Playwright width matrix, not here (jsdom cannot measure real layout). Targets
fixed within this step's boundary:

1. `packages/react/src/ui/dialog.tsx`, `apps/www/src/components/ui/dialog.tsx`,
   `packages/react/src/ui/sheet.tsx` — their close buttons' `sr-only` "Close" labels were
   already present before this step started (a prior session's edit); verified, not
   re-applied.
2. `packages/react/src/ui/sidebar.tsx` `SidebarGroupAction`/`SidebarMenuAction` — `w-5` →
   `size-6` (24px) and a required `"aria-label": string` added to each prop type (safe: zero
   existing callers to break).
3. `packages/react/src/ui/resizable.tsx` `ResizableHandle` — a destructured
   `"aria-label": ariaLabel = "Resize panels"` default, not a required prop (its two
   existing callers pass none).
4. `packages/react/src/ui/multi-select.tsx` `MultiSelectValue`'s remove `Badge` — kept as a
   `<span>` (NOT a nested `render={<button/>}`, which would put a real `<button>` inside
   `MultiSelectTrigger`'s own `PopoverTrigger` button — invalid HTML, the same "no button
   inside a button" hazard `AccordionTrigger`'s own `postIconChildren` sibling pattern
   already guards against elsewhere in this file). Instead: `role="button"`, `tabIndex={0}`,
   and an `onKeyDown` handling `Enter`/`Space`, alongside the existing `onClick`.
5. `packages/react/src/ui/multi-select.tsx`'s hidden `<button data-multiselect-focus>` — an
   `aria-label="Select an option"`.
6. `packages/react/src/ui/pagination.tsx` `PaginationLink` — an explicit `role="link"` on
   the rendered `<a>`, overriding Base UI `Button`'s own `role="button"`.
7. `packages/react/src/ui/datetime/input.tsx`, `date-picker.tsx`, `time-picker.tsx` — see
   the datetime bullet above; full edits below.
8. `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx`,
   `DataTablePageSizeSelect.tsx` — `id`/`htmlFor` pairing on every `<label>` wrapping a
   `Checkbox`/`RadioGroupItem`; unique per-instance ids via `useId()` (`DataTableColumnsMenu`
   can render more than once per page).
9. `apps/www/src/components/ui/combobox.tsx` `ComboboxChipRemove`/`ComboboxClear` —
   `aria-label="Remove"` / `aria-label="Clear"`.

#### packages/react/src/ui/sidebar.tsx

2 edits. Everything else unchanged.

**1 — `SidebarGroupAction`'s size + required name.** `w-5` → `size-6` in the class string
at the component's existing `cn(...)` call; widen the prop type:

```tsx
function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & { "aria-label": string }) {
```

**2 — `SidebarMenuAction`'s size + required name**, same two changes (`w-5` → `size-6`,
`"aria-label": string` added to its prop type).

#### packages/react/src/ui/resizable.tsx

1 edit. Everything else unchanged.

**1 — `ResizableHandle`'s default name.** A destructured default, not a required prop
(both existing callers pass none):

```tsx
function ResizableHandle({
  withHandle,
  className,
  "aria-label": ariaLabel = "Resize panels",
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      hitAreaMargins={{ coarse: 20, fine: 10 }}
      className={cn(
        "relative flex w-px shrink-0 items-center justify-center bg-border",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className,
      )}
      aria-label={ariaLabel}
      {...props}
    >
```

#### packages/react/src/ui/multi-select.tsx

2 edits. Everything else unchanged.

**1 — `MultiSelectValue`'s remove chip becomes keyboard-operable without nesting a button.**
Replace the plain `<Badge onClick>` in the `selectedValues` map:

```tsx
<Badge
  variant="outline"
  data-selected-item
  className="group flex items-center gap-1"
  key={value}
  role={clickToRemove ? "button" : undefined}
  tabIndex={clickToRemove ? 0 : undefined}
  aria-label={clickToRemove ? `Remove ${label}` : undefined}
  onClick={
    clickToRemove
      ? (e) => {
          e.stopPropagation();
          toggleValue(value);
        }
      : undefined
  }
  onKeyDown={
    clickToRemove
      ? (e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          e.stopPropagation();
          toggleValue(value);
        }
      : undefined
  }
>
  {label}
  {clickToRemove && (
    <XIcon className="size-2 text-muted-foreground group-hover:text-destructive" />
  )}
</Badge>
```

**2 — the hidden keyboard-nav focus target gets a name.** In `MultiSelectContent`, the
`canSearch === false` branch:

```tsx
<button
  data-multiselect-focus
  className="sr-only"
  type="button"
  aria-label="Select an option"
/>
```

#### packages/react/src/ui/pagination.tsx

1 edit. Everything else unchanged.

**1 — `PaginationLink` keeps link semantics.** Base UI's `Button` (`nativeButton={false}`)
forces `role="button"` on whatever it renders; add an explicit override on the `<a>` inside
`render`:

```tsx
function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          role="link"
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  );
}
```

#### packages/react/src/ui/datetime/input.tsx

3 edits. Everything else unchanged.

**1 — `DateTimeInputProps` gains an accessible-name option.**

```tsx
type DateTimeInputProps = {
  className?: string;
  value?: Date;
  // eslint-disable-next-line no-unused-vars
  onChange?: (date?: Date) => void;
  format?: string;
  disabled?: boolean;
  clearable?: boolean;
  timezone?: string;
  hideCalendarIcon?: boolean;
  onCalendarClick?: () => void;
  /** Accessible name for the segmented date/time text field. */
  ariaLabel?: string;
};
```

**2 — the segmented `<input>` carries that name**, defaulting when the caller omits it
(this component has no internal consumer today — it's exported standalone — so the default
matters more than the override):

```tsx
<input
  ref={mergeRefs(inputRef)}
  className="font-mono flex-grow min-w-0 bg-transparent py-1 pe-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
  aria-label={options.ariaLabel ?? "Date and time"}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
  onClick={onClick}
  onKeyDown={onKeyDown}
  value={inputStr}
  placeholder={formatStr}
  onChange={() => {}}
  disabled={options.disabled}
  spellCheck={false}
/>
```

#### packages/react/src/ui/datetime/date-picker.tsx

4 edits. Everything else unchanged.

**1 — `DateTimePicker`'s month/year toggles become keyboard-operable**, and its main
trigger gets `aria-controls` (alongside its existing `aria-expanded`/`aria-labelledby`), via
a `React.useId()` shared with its `PopoverContent`:

```tsx
const [open, setOpen] = useState(false);
const popoverContentId = React.useId();
```

```tsx
                  {...props}
                  id={id}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={popoverContentId}
                  aria-required={ariaRequired}
                  aria-labelledby={ariaLabelledBy}
                  aria-disabled={disabled}
```

```tsx
      <PopoverContent id={popoverContentId} className="w-auto p-2">
        <div className="flex items-center justify-between">
          <div className="text-md font-bold ms-2 flex items-center cursor-pointer">
            <div>
              <span
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "month" ? false : "month",
                  )
                }
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  setMonthYearPicker(
                    monthYearPicker === "month" ? false : "month",
                  );
                }}
              >
                {format(month, "MMMM")}
              </span>
              <span
                className="ms-1"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMonthYearPicker(
                    monthYearPicker === "year" ? false : "year",
                  )
                }
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  setMonthYearPicker(
                    monthYearPicker === "year" ? false : "year",
                  );
                }}
              >
                {format(month, "yyyy")}
              </span>
            </div>
```

**2 — the in-popup `TimePicker` sub-component's own trigger gets `aria-controls` too**,
via its own `useId()` (added right at the top of its body, before its existing
`formatStr` memo) and a matching `id` on its `PopoverContent`:

```tsx
function TimePicker({ /* … */ }) {
  const popoverContentId = React.useId();
  // hours24h = HH
  // hours12h = hh
```

```tsx
          <button
            {...props}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={popoverContentId}
            className={cn(
```

```tsx
      <PopoverContent id={popoverContentId} className="p-0 w-auto" side="top">
```

#### packages/react/src/ui/datetime/time-picker.tsx

2 edits. Everything else unchanged.

**1 — `useId` import** alongside the file's existing `react` import:

```tsx
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
```

**2 — `SimpleTimePicker`'s trigger gets `aria-controls`**, via a `useId()` added right
after its existing `open` state, wired onto both the trigger and its `PopoverContent`:

```tsx
const [open, setOpen] = useState(false);
const popoverContentId = useId();
```

```tsx
          <div
            {...props}
            role="combobox"
            aria-expanded={open}
            aria-controls={popoverContentId}
            className={cn(
```

```tsx
      <PopoverContent id={popoverContentId} className="p-0 w-auto" side="top">
```

#### packages/react/src/ui/data-table/DataTableColumnsMenu.tsx

4 edits. Everything else unchanged.

**1 — `useId` import** alongside the file's existing `react`/`react-dom` imports:

```tsx
import { type ReactNode, useId } from "react";
```

**2 — a per-instance id prefix**, called before the function's existing early return (hooks
run unconditionally):

```tsx
export function DataTableColumnsMenu<TFieldSlug extends string = string>(
  props: DataTableColumnsMenuProps<TFieldSlug>,
): ReactNode {
  const densityIdPrefix = useId();
  if (props.columnMenuEntries.length === 0) return null;
```

**3 — both per-column visibility `<label>`s get `id`/`htmlFor` pairing.** The drag-clone
render (`renderClone`) uses a `-clone` suffix so its id never collides with the real row's,
since both can be in the DOM at once mid-drag:

```tsx
<label
  className={rowLabelClassName(row.meta)}
  htmlFor={`${row.meta.field}-visible-clone`}
>
  <Checkbox
    id={`${row.meta.field}-visible-clone`}
    aria-label={row.meta.label}
    checked={!entryHidden(row.entry)}
    disabled={!row.meta.hideable}
  />
  {row.meta.label}
</label>
```

The real row:

```tsx
<label
  className={rowLabelClassName(row.meta)}
  htmlFor={`${row.meta.field}-visible`}
>
  <Checkbox
    id={`${row.meta.field}-visible`}
    aria-label={row.meta.label}
    checked={!entryHidden(row.entry)}
    disabled={!row.meta.hideable}
    onCheckedChange={(checked) => handleCheckedChange(row.meta.field, !!checked)}
  />
  {row.meta.label}
</label>
```

**4 — the Density radio labels get `id`/`htmlFor` pairing**, using the `densityIdPrefix`
from edit 2 so two simultaneously-rendered menus never collide:

```tsx
<label className="flex items-center gap-2 text-sm" htmlFor={`${densityIdPrefix}-comfortable`}>
  <RadioGroupItem id={`${densityIdPrefix}-comfortable`} value="comfortable" aria-label="Comfortable" /> Comfortable
</label>
<label className="flex items-center gap-2 text-sm" htmlFor={`${densityIdPrefix}-compact`}>
  <RadioGroupItem id={`${densityIdPrefix}-compact`} value="compact" aria-label="Compact" /> Compact
</label>
```

#### packages/react/src/ui/data-table/DataTablePageSizeSelect.tsx

2 edits. Everything else unchanged.

**1 — `useId` import**, and a per-instance prefix before the function's existing early
return:

```tsx
import { useId } from "react";
```

```tsx
export function DataTablePageSizeSelect(props: DataTablePageSizeSelectProps) {
  const idPrefix = useId();
  if (props.pageSizeOptions.length <= 1) return null;
```

**2 — the "N per load" radio label gets `id`/`htmlFor` pairing:**

```tsx
<label key={n} className="flex items-center gap-2 text-sm" htmlFor={`${idPrefix}-${n}`}>
  <RadioGroupItem id={`${idPrefix}-${n}`} value={String(n)} aria-label={`${n} per load`} />
  {n} per load
</label>
```

#### apps/www/src/components/ui/combobox.tsx

2 edits. Everything else unchanged.

**1 — `ComboboxChip`'s remove button is named:**

```tsx
<ComboboxPrimitive.ChipRemove
  aria-label="Remove"
  className="-ml-1 opacity-50 hover:opacity-100"
  data-slot="combobox-chip-remove"
  render={<Button size="icon-xs" variant="ghost" />}
>
  <XIcon className="pointer-events-none" />
</ComboboxPrimitive.ChipRemove>
```

**2 — `ComboboxClear` is named:**

```tsx
<ComboboxPrimitive.Clear
  aria-label="Clear"
  className={cn(className)}
  data-slot="combobox-clear"
  render={<InputGroupButton size="icon-xs" variant="ghost" />}
  {...props}
>
  <XIcon className="pointer-events-none" />
</ComboboxPrimitive.Clear>
```

#### packages/react/src/ui/dialog.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

function renderDialog() {
  return render(
    <Dialog defaultOpen>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete item</DialogTitle>
        <DialogDescription>This cannot be undone.</DialogDescription>
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderDialog();
    await screen.findByRole("dialog", { name: "Delete item" });
    await expectNoA11yViolations(container);
  });

  it("names its close button", async () => {
    renderDialog();
    expect(await screen.findByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Delete item" });

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("traps Tab focus inside the popup: tabbing past the last control wraps to the first", async () => {
    const user = userEvent.setup();
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
          <button type="button">First</button>
        </DialogContent>
      </Dialog>,
    );
    await screen.findByRole("dialog");
    const first = screen.getByRole("button", { name: "First" });
    // The close button renders after `children`, so it's the last focusable
    // control in DOM order. Base UI's focus trap inserts its own invisible
    // `FocusGuard` sibling just past it (real-browser behavior: focusing the
    // guard redirects back into the dialog) — the APG requirement this
    // asserts is just that Tab never escapes the trap to `document.body`,
    // not which internal element ends up focused.
    const close = screen.getByRole("button", { name: "Close" });

    close.focus();
    await user.tab();
    const dialog = screen.getByRole("dialog");
    expect(document.activeElement).not.toBe(document.body);
    expect(
      dialog.contains(document.activeElement) ||
        document.activeElement?.hasAttribute("data-base-ui-focus-guard"),
    ).toBe(true);
    expect(first).toBeInTheDocument();
  });
});
```

#### packages/react/src/ui/alert-dialog.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

function renderAlertDialog(props: { defaultOpen?: boolean } = {}) {
  return render(
    <AlertDialog defaultOpen={props.defaultOpen ?? true}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete document?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
}

describe("AlertDialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderAlertDialog();
    await screen.findByRole("alertdialog", { name: "Delete document?" });
    await expectNoA11yViolations(container);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderAlertDialog({ defaultOpen: false });
    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);
    await screen.findByRole("alertdialog", { name: "Delete document?" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes when Cancel is activated via the keyboard", async () => {
    const user = userEvent.setup();
    renderAlertDialog();
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    cancel.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});
```

#### packages/react/src/ui/sheet.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "./sheet";

function renderSheet() {
  return render(
    <Sheet defaultOpen>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetTitle>Edit field</SheetTitle>
        <SheetDescription>Adjust the field's options.</SheetDescription>
      </SheetContent>
    </Sheet>,
  );
}

describe("Sheet", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderSheet();
    await screen.findByRole("dialog", { name: "Edit field" });
    await expectNoA11yViolations(container);
  });

  it("names its close button", async () => {
    renderSheet();
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Edit field</SheetTitle>
          <SheetDescription>Adjust the field's options.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Edit field" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
```

#### packages/react/src/ui/dropdown-menu.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// Base UI's non-modal floating surfaces render an internal `FocusGuard` span
// whose `role` only becomes `"button"` when `isSafari` is true
// (`@base-ui/utils/detectBrowser`'s `isSafari` reads `navigator.vendor`).
// jsdom's default `navigator.vendor` is literally "Apple Computer, Inc.", so
// every jsdom run takes Base UI's real-Safari-only code path and the guard is
// left without `aria-hidden`/a name — a jsdom environment artifact, not a
// reachable state in any real non-Safari browser.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderMenu() {
  return render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("DropdownMenu", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderMenu();
    await screen.findByRole("menu");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("moves roving focus with ArrowDown/ArrowUp and wraps", async () => {
    const user = userEvent.setup();
    renderMenu();
    const items = await screen.findAllByRole("menuitem");
    await user.keyboard("{ArrowDown}");
    expect(items[0]).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(items[0]).toHaveFocus();
  });

  it("selects the focused item with Enter and closes the menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelect}>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await screen.findByRole("menuitem", { name: "Rename" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Actions" });
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
```

#### packages/react/src/ui/select.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined;
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.setPointerCapture ??= () => undefined;
});

// Base UI's non-modal floating surfaces (Select/Popover/Menu/Combobox) render
// an internal `FocusGuard` span whose `role` only becomes `"button"` when
// `isSafari` is true (`@base-ui/utils/detectBrowser`'s `isSafari` reads
// `navigator.vendor`). jsdom's default `navigator.vendor` is literally
// "Apple Computer, Inc." (a historical WebKit/Safari compat string), so every
// jsdom run takes Base UI's real-Safari-only code path and the guard is left
// without `aria-hidden`/a name — a jsdom environment artifact, not a reachable
// state in any real non-Safari browser, and Safari's own VoiceOver-focused
// behavior there is deliberate library-internal plumbing, not content this
// primitive controls. Disabled for this one assertion only.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderSelect() {
  return render(
    <Select defaultOpen>
      <SelectTrigger aria-label="Status">
        <SelectValue placeholder="Pick a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="draft">Draft</SelectItem>
        <SelectItem value="published">Published</SelectItem>
        <SelectItem value="archived">Archived</SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderSelect();
    await screen.findByRole("listbox");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("moves real focus between options with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    renderSelect();
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Draft" }));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Published" }));
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByRole("option", { name: "Draft" }));
  });

  it("selects the active option with Enter and closes the popup", async () => {
    const user = userEvent.setup();
    renderSelect();
    await screen.findByRole("listbox");
    const trigger = screen.getByRole("combobox", { name: "Status" });
    trigger.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Status" });
    await screen.findByRole("listbox");
    trigger.focus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
```

#### packages/react/src/ui/popover.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "./popover";

// See select.test.tsx for why this is disabled: jsdom's `navigator.vendor`
// ("Apple Computer, Inc.") trips Base UI's `isSafari` detection, which is the
// only condition under which its internal FocusGuard span gets a `role` with
// no accessible name — a jsdom artifact, not a reachable real-browser state
// this primitive's own markup controls.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

function renderPopover() {
  return render(
    <Popover defaultOpen>
      <PopoverTrigger>More info</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Field help</PopoverTitle>
        <p>This field accepts a slug.</p>
      </PopoverContent>
    </Popover>,
  );
}

describe("Popover", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderPopover();
    await screen.findByText("Field help");
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("exposes aria-expanded on the trigger", async () => {
    renderPopover();
    const trigger = screen.getByRole("button", { name: "More info" });
    await screen.findByText("Field help");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole("button", { name: "More info" });
    await screen.findByText("Field help");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Field help")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
```

#### packages/react/src/ui/command.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined;
});

function renderCommand() {
  return render(
    <Command label="Search commands">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>
        <CommandGroup heading="Documents">
          <CommandItem>Pages</CommandItem>
          <CommandItem>Posts</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>,
  );
}

describe("Command", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderCommand();
    await expectNoA11yViolations(container);
  });

  it("highlights the first item by default, then moves with ArrowDown/ArrowUp", async () => {
    const user = userEvent.setup();
    renderCommand();
    const input = screen.getByRole("combobox", { name: "Search commands" });
    input.focus();
    expect(screen.getByRole("option", { name: "Pages" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Posts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("option", { name: "Pages" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("filters items by typed text", async () => {
    const user = userEvent.setup();
    renderCommand();
    const input = screen.getByRole("combobox", { name: "Search commands" });
    await user.type(input, "Post");
    expect(screen.queryByRole("option", { name: "Pages" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Posts" })).toBeInTheDocument();
  });
});
```

#### packages/react/src/ui/multi-select.test.tsx

4 edits (additive — none of the existing `describe` blocks change). Everything else
unchanged; the existing `ResizeObserver`/`scrollIntoView` `beforeAll` stub and the two
existing `describe` blocks stay as-is.

**1 — imports.** Add alongside the existing `@testing-library/react` import:

```tsx
import userEvent from "@testing-library/user-event";
```

and alongside the existing `expectNoA11yViolations` import (`MultiSelectItem` is already
imported by this file):

```tsx
import { expectNoA11yViolations } from "../testing/a11y";
```

**2 — a11y describe block.** Appended after the existing `MultiSelectContent focus`
`describe`. Opens the popover via a real click (there is no `open`/`defaultOpen` prop on
`MultiSelect` itself) and disables the same jsdom-only FocusGuard rule the other
Popover-based primitives do; the standalone trigger/value tests below need no content at
all, since `MultiSelectValue`'s chip-removal and `aria-expanded` are both independent of
whether the popover is open:

```tsx
describe("MultiSelect a11y", () => {
  // See ui/select.test.tsx for why this is disabled: jsdom's
  // `navigator.vendor` trips Base UI's `isSafari` detection, the only
  // condition under which its internal FocusGuard span (inserted by the
  // `Popover` this component composes) gets a `role` with no accessible
  // name.
  const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } };

  it("has no detectable accessibility violations while open with a selection", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MultiSelect defaultValues={["a"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
        <MultiSelectContent>
          <MultiSelectItem value="a">Alpha</MultiSelectItem>
          <MultiSelectItem value="b">Beta</MultiSelectItem>
        </MultiSelectContent>
      </MultiSelect>,
    );
    await user.click(screen.getByRole("combobox", { name: "Tags" }));
    await screen.findByRole("option", { name: "Alpha" });
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES });
  });

  it("exposes role=combobox and aria-expanded on the trigger", () => {
    render(
      <MultiSelect defaultValues={["Alpha"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
      </MultiSelect>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tags" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("removes a selected chip with the keyboard, not just a pointer click", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect defaultValues={["Alpha"]}>
        <MultiSelectTrigger aria-label="Tags">
          <MultiSelectValue placeholder="Pick tags" />
        </MultiSelectTrigger>
      </MultiSelect>,
    );
    const remove = screen.getByRole("button", { name: "Remove Alpha" });
    remove.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("button", { name: "Remove Alpha" })).not.toBeInTheDocument();
  });
});
```

Note: `defaultValues` (plural) is `MultiSelect`'s real prop name — not `defaultValue`. The
second/third tests above render `MultiSelectTrigger`/`MultiSelectValue` standalone with a
`defaultValues` seeded to the literal display text ("Alpha"), since `items.get(value) ??
value` (`multi-select.tsx:243`) falls back to the raw value when no `MultiSelectContent`
has registered a label for it.

#### packages/react/src/ui/tabs.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function renderTabs() {
  return render(
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="history">Version history</TabsTrigger>
      </TabsList>
      <TabsContent value="content">Content panel</TabsContent>
      <TabsContent value="history">History panel</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderTabs();
    await expectNoA11yViolations(container);
  });

  // Base UI's `Tabs.List` defaults `activateOnFocus` to `false` — the APG's
  // manual-activation model: arrow keys move focus between tabs without
  // selecting them, and the user presses Enter/Space to activate the
  // focused tab. (Automatic activation, where the arrow key itself selects,
  // is the other APG-sanctioned model but isn't this primitive's default.)
  it("moves focus with ArrowRight/ArrowLeft and activates the focused tab with Enter", async () => {
    const user = userEvent.setup();
    renderTabs();
    const content = screen.getByRole("tab", { name: "Content" });
    const history = screen.getByRole("tab", { name: "Version history" });
    content.focus();

    await user.keyboard("{ArrowRight}");
    expect(history).toHaveFocus();
    expect(history).toHaveAttribute("aria-selected", "false");

    await user.keyboard("{Enter}");
    expect(history).toHaveAttribute("aria-selected", "true");
    expect(content).toHaveAttribute("aria-selected", "false");
  });

  it("moves focus to the first/last tab with Home/End", async () => {
    const user = userEvent.setup();
    renderTabs();
    const content = screen.getByRole("tab", { name: "Content" });
    const history = screen.getByRole("tab", { name: "Version history" });
    history.focus();

    await user.keyboard("{Home}");
    expect(content).toHaveFocus();

    await user.keyboard("{End}");
    expect(history).toHaveFocus();
  });
});
```

#### packages/react/src/ui/accordion.test.tsx

2 edits. Everything else unchanged (both existing `AccordionTrigger` tests stay).

**1 — imports.** Add alongside the existing `import { render } from "@testing-library/react";` / `import { describe, expect, it } from "vitest";` lines:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
```

**2 — a11y + keyboard describe block.** Appended after the existing `describe("AccordionTrigger", ...)`:

```tsx
describe("Accordion a11y and keyboard model", () => {
  function renderMultiItem() {
    return render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Second</AccordionTrigger>
          <AccordionContent>Second content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
  }

  it("has no detectable accessibility violations with a panel open", async () => {
    const { container } = render(
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await expectNoA11yViolations(container);
  });

  it("toggles aria-expanded with Enter and Space", async () => {
    const user = userEvent.setup();
    renderMultiItem();
    const trigger = screen.getByRole("button", { name: "First" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
```

#### packages/react/src/ui/checkbox.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Checkbox } from "./checkbox";

beforeAll(() => {
  // Base UI's Checkbox dispatches a synthetic `PointerEvent` from its
  // `onKeyUp` handler so Space activates it the same way a pointer click
  // does; jsdom has no `PointerEvent` constructor at all.
  globalThis.PointerEvent ??= class PointerEvent extends MouseEvent {} as unknown as typeof PointerEvent;
});

describe("Checkbox", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<Checkbox aria-label="Publish" />);
    await expectNoA11yViolations(container);
  });

  it("toggles aria-checked with Space", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Publish" />);
    const checkbox = screen.getByRole("checkbox", { name: "Publish" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    checkbox.focus();
    await user.keyboard(" ");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });
});
```

#### packages/react/src/ui/radio-group.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { RadioGroup, RadioGroupItem } from "./radio-group";

function renderGroup() {
  return render(
    <RadioGroup aria-label="Visibility" defaultValue="public">
      <RadioGroupItem value="public" aria-label="Public" />
      <RadioGroupItem value="private" aria-label="Private" />
    </RadioGroup>,
  );
}

describe("RadioGroup", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderGroup();
    await expectNoA11yViolations(container);
  });

  it("moves selection with ArrowDown and wraps", async () => {
    const user = userEvent.setup();
    renderGroup();
    const pub = screen.getByRole("radio", { name: "Public" });
    const priv = screen.getByRole("radio", { name: "Private" });
    pub.focus();
    await user.keyboard("{ArrowDown}");
    expect(priv).toHaveFocus();
    expect(priv).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowDown}");
    expect(pub).toHaveFocus();
  });
});
```

#### packages/react/src/ui/tooltip.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

function renderTooltip() {
  return render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger>Help</TooltipTrigger>
        <TooltipContent>Explains the field</TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );
}

describe("Tooltip", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderTooltip();
    await screen.findByText("Explains the field");
    await expectNoA11yViolations(container);
  });

  it("shows on focus, not just hover (WCAG 1.4.13 requires both)", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Help</TooltipTrigger>
          <TooltipContent>Explains the field</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.queryByText("Explains the field")).not.toBeInTheDocument();
    await user.tab();
    await screen.findByText("Explains the field");
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await screen.findByText("Explains the field");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Explains the field")).not.toBeInTheDocument());
  });
});
```

#### packages/react/src/ui/sidebar.test.tsx

2 edits. Everything else unchanged (all three existing `SidebarProvider` tests stay).

**1 — import.** Add alongside the file's existing `import { ADMIN_COOKIE_NAME, parseAdminCookie } from "@vexcms/core";` line:

```tsx
import { expectNoA11yViolations } from "../testing/a11y";
```

**2 — a11y describe block.** Appended after the existing `describe("SidebarProvider", ...)`,
reusing the file's existing `renderSidebar` helper:

```tsx
describe("Sidebar a11y", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderSidebar();
    await expectNoA11yViolations(container);
  });
});
```

#### packages/react/src/ui/pagination.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

describe("Pagination", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=1" />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=1" isActive>
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href="?page=2" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    await expectNoA11yViolations(container);
  });

  it("names the nav landmark and marks the active page", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationLink href="?page=1" isActive>
              1
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.getByRole("navigation", { name: "pagination" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("aria-current", "page");
  });
});
```

#### packages/react/src/ui/resizable.test.tsx

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

// `react-resizable-panels` computes `aria-valuenow`/`aria-valuemin`/
// `aria-valuemax` from its own measured pixel layout (`calculateAriaValues`),
// which only ever resolves once a real ResizeObserver delivers a real
// content rect — jsdom has no layout engine, so even with the shared
// `ResizeObserverStub` installed (a deliberate no-op; see
// `testing/setup.ts`), that delivery never happens and the three attributes
// are never set. Same category of jsdom-only gap as `color-contrast`/
// `target-size` in `testing/a11y.ts`'s own `DISABLED_RULES` — not a defect
// in this file. Disabled for this one assertion only.
const RESIZE_VALUE_JSDOM_LAYOUT_RULES = { "aria-required-attr": { enabled: false } };

function renderResizable() {
  return render(
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={50}>Left</ResizablePanel>
      <ResizableHandle aria-label="Resize panels" />
      <ResizablePanel defaultSize={50}>Right</ResizablePanel>
    </ResizablePanelGroup>,
  );
}

describe("ResizableHandle", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderResizable();
    await expectNoA11yViolations(container, { rules: RESIZE_VALUE_JSDOM_LAYOUT_RULES });
  });

  it("exposes role=separator with a name and keyboard focusability", () => {
    renderResizable();
    const handle = screen.getByRole("separator", { name: "Resize panels" });
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("data-panel-group-direction", "horizontal");
  });

  it("falls back to a default name when no aria-label is passed", () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole("separator", { name: "Resize panels" })).toBeInTheDocument();
  });
});
```

#### apps/www/src/components/ui/dropdown-menu.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

// Base UI's non-modal floating surfaces render an internal `FocusGuard`
// span whose `role` only becomes `"button"` when `isSafari` is true
// (`@base-ui/utils/detectBrowser`'s `isSafari` reads `navigator.vendor`).
// jsdom's default `navigator.vendor` is literally "Apple Computer, Inc.", so
// every jsdom run takes Base UI's real-Safari-only code path and the guard
// is left without `aria-hidden`/a name — a jsdom environment artifact, not
// a reachable state in any real non-Safari browser.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } }

describe("www DropdownMenu", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Light</DropdownMenuItem>
          <DropdownMenuItem>Dark</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await screen.findByRole("menu")
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES })
  })

  it("selects the focused item with Enter", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelect}>Light</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await screen.findByRole("menuitem", { name: "Light" })
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })
})
```

#### apps/www/src/components/ui/select.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => undefined
  Element.prototype.setPointerCapture ??= () => undefined
})

// See packages/react/src/ui/select.test.tsx for why this is disabled:
// jsdom's `navigator.vendor` trips Base UI's `isSafari` detection, the only
// condition under which its internal FocusGuard span gets a `role` with no
// accessible name.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } }

describe("www Select", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Language">
          <SelectValue placeholder="Pick a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ts">TypeScript</SelectItem>
          <SelectItem value="js">JavaScript</SelectItem>
        </SelectContent>
      </Select>,
    )
    await screen.findByRole("listbox")
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES })
  })

  it("selects an option with ArrowDown + Enter", async () => {
    const user = userEvent.setup()
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Language">
          <SelectValue placeholder="Pick a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ts">TypeScript</SelectItem>
          <SelectItem value="js">JavaScript</SelectItem>
        </SelectContent>
      </Select>,
    )
    await screen.findByRole("listbox")
    await user.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
  })
})
```

#### apps/www/src/components/ui/combobox.test.tsx

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined
})

describe("www Combobox", () => {
  it("has no detectable accessibility violations while open", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox items={["Rust", "TypeScript"]}>
        <ComboboxInput aria-label="Search languages" placeholder="Search..." />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )
    await user.click(screen.getByRole("combobox", { name: "Search languages" }))
    await screen.findByText("Rust")
    await expectNoA11yViolations(container)
  })

  it("filters the list by typed text", async () => {
    const user = userEvent.setup()
    render(
      <Combobox items={["Rust", "TypeScript"]}>
        <ComboboxInput aria-label="Search languages" placeholder="Search..." />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )
    const input = screen.getByRole("combobox", { name: "Search languages" })
    await user.type(input, "Type")
    await screen.findByText("TypeScript")
    expect(screen.queryByText("Rust")).not.toBeInTheDocument()
  })
})
```

#### apps/www/src/components/ui/accordion.test.tsx

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion"

describe("www Accordion", () => {
  it("has no detectable accessibility violations with a panel open", async () => {
    const { container } = render(
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>What is vexcms?</AccordionTrigger>
          <AccordionContent>A type-safe headless CMS.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    await expectNoA11yViolations(container)
  })

  it("toggles aria-expanded with Enter", async () => {
    const user = userEvent.setup()
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>What is vexcms?</AccordionTrigger>
          <AccordionContent>A type-safe headless CMS.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const trigger = screen.getByRole("button", { name: "What is vexcms?" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})
```

#### apps/www/src/components/ui/alert-dialog.test.tsx

```tsx
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"

describe("www AlertDialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger>Unsubscribe</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Unsubscribe from updates?</AlertDialogTitle>
          <AlertDialogDescription>You can resubscribe at any time.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Unsubscribe</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    await screen.findByRole("alertdialog", { name: "Unsubscribe from updates?" })
    await expectNoA11yViolations(container)
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Unsubscribe</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Unsubscribe from updates?</AlertDialogTitle>
          <AlertDialogDescription>You can resubscribe at any time.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const trigger = screen.getByRole("button", { name: "Unsubscribe" })
    await user.click(trigger)
    await screen.findByRole("alertdialog", { name: "Unsubscribe from updates?" })
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
```

#### apps/www/src/components/ui/dialog.test.tsx

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog"

describe("www Dialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <Dialog defaultOpen>
        <DialogTrigger>Sign in</DialogTrigger>
        <DialogContent>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Continue with your email.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    await screen.findByRole("dialog", { name: "Sign in" })
    await expectNoA11yViolations(container)
  })

  it("names its close button", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Continue with your email.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    await screen.findByRole("dialog")
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
  })
})
```

- [x] `packages/react/src/ui/dialog.tsx`, `apps/www/src/components/ui/dialog.tsx`, `packages/react/src/ui/sheet.tsx`: close-button names — found already present, verified by test, not edited
- [x] `packages/react/src/ui/sidebar.tsx`: `SidebarGroupAction`/`SidebarMenuAction` to `size-6`, required `aria-label`
- [x] `packages/react/src/ui/resizable.tsx`: default `aria-label` on `ResizableHandle`
- [x] `packages/react/src/ui/multi-select.tsx`: `MultiSelectValue`'s remove chip — `role="button"`/`tabIndex`/`onKeyDown` (not a nested `<button>`); hidden keyboard-nav target named
- [x] `packages/react/src/ui/pagination.tsx`: `PaginationLink` keeps `role="link"` against Base UI `Button`'s own `role="button"`
- [x] `packages/react/src/ui/datetime/input.tsx`, `date-picker.tsx`, `time-picker.tsx`: `ariaLabel` option; month/year toggles keyboard-operable; `aria-controls` on three `role="combobox"` triggers
- [x] `packages/react/src/ui/data-table/DataTableColumnsMenu.tsx`, `DataTablePageSizeSelect.tsx`: `id`/`htmlFor` pairing, unique per instance via `useId()`
- [x] `apps/www/src/components/ui/combobox.tsx`: `ComboboxChipRemove`/`ComboboxClear` named
- [x] `packages/react/src/ui/dialog.test.tsx` (new): axe + Escape/focus-trap/focus-return
- [x] `packages/react/src/ui/alert-dialog.test.tsx` (new, rewritten against Base UI 1.2's real `escapeKey: isTopmost` behavior): axe + Escape-closes-and-returns-focus + keyboard Cancel
- [x] `packages/react/src/ui/sheet.test.tsx` (new): axe + Escape/focus-return
- [x] `packages/react/src/ui/dropdown-menu.test.tsx` (new): axe + roving ArrowUp/Down + Enter-select + Escape
- [x] `packages/react/src/ui/select.test.tsx` (new, real-focus model): axe + ArrowDown real focus movement + Enter-select + Escape
- [x] `packages/react/src/ui/popover.test.tsx` (new): axe + aria-expanded + Escape/focus-return
- [x] `packages/react/src/ui/command.test.tsx` (new, `Command label` prop): axe + default-highlight + ArrowUp/Down + typed filter
- [x] `packages/react/src/ui/multi-select.test.tsx`: add a11y + keyboard-chip-removal describe block
- [x] `packages/react/src/ui/tabs.test.tsx` (new, manual-activation model): axe + ArrowRight/Left focus movement + Enter-activates + Home/End
- [x] `packages/react/src/ui/accordion.test.tsx`: add a11y + Enter/Space toggle describe block
- [x] `packages/react/src/ui/checkbox.test.tsx` (new, `PointerEvent` polyfill): axe + Space toggle
- [x] `packages/react/src/ui/radio-group.test.tsx` (new): axe + ArrowDown roving selection
- [x] `packages/react/src/ui/tooltip.test.tsx` (new): axe + focus-shows + Escape dismiss
- [x] `packages/react/src/ui/sidebar.test.tsx`: add a11y describe block
- [x] `packages/react/src/ui/pagination.test.tsx` (new): axe + aria-current + `role="link"`
- [x] `packages/react/src/ui/resizable.test.tsx` (new, jsdom-layout rule exemption): axe + separator role/name/tabindex
- [x] `apps/www/src/components/ui/dropdown-menu.test.tsx` (new)
- [x] `apps/www/src/components/ui/select.test.tsx` (new)
- [x] `apps/www/src/components/ui/combobox.test.tsx` (new)
- [x] `apps/www/src/components/ui/accordion.test.tsx` (new)
- [x] `apps/www/src/components/ui/alert-dialog.test.tsx` (new, rewritten)
- [x] `apps/www/src/components/ui/dialog.test.tsx` (new)
- [x] `pnpm --filter @vexcms/react test -- ui` run locally — 230/230 files green (stable across repeated runs)
- [x] `pnpm --filter @vexcms/react test` (full package) run locally — 230/230, 2623 passed / 1 skipped
- [x] `pnpm --filter www test` run locally — 10/10, 94 passed
- [x] `pnpm --filter @vexcms/react typecheck`, `pnpm --filter www typecheck` — both clean
- [x] `pnpm lint` (root): 0 errors; jsx-a11y warnings 62→51 (`findings.md` rows F-005, F-012, F-013, F-019, F-023, F-024, F-040, F-043, F-044 flipped to `fixed (step 5)`; new rows F-053–F-057 added and fixed; `## Step 5 keyboard re-check` section records every primitive as pending the real-browser pass, servers down per P-024)
- [x] `pnpm --filter www lint`: 0 new errors from content (2 pre-existing parsing-error instances on `.test.tsx` files, caused by `apps/www/tsconfig.json`'s own `exclude` of test files vs. `eslint.config.mjs`'s `parserOptions.project` — confirmed pre-existing via `apps/www/src/vexcms/admin.test.ts` hitting the identical error; a config fix outside this step's file scope, reported not fixed)

Verify: `pnpm --filter @vexcms/react test -- ui` passes with a new `expectNoA11yViolations` +
keyboard test per interactive primitive in `packages/react/src/ui`, and `pnpm --filter www
test` passes the same for every `apps/www/src/components/ui` primitive www renders; the
browser re-check of each APG keyboard model (Tab order, Escape, Arrow keys, focus trap and
return) is recorded as a `findings.md` row per primitive — `## Step 5 keyboard re-check`
marks every one `pending runtime (servers down)` until the dev servers are back up.

### Step 6 — Admin views, fields, and the width matrix [dev]

The admin panel (`packages/react`, rendered by `apps/test`) has never had a dedicated accessibility pass: every view added since H/I (list-view and edit-view overhauls) is audited here for the first time, every form field's error association is checked against `FormFieldLayout`'s own contract, and five known-broken leftovers from the edit-view/field-system work get a precise fix. This step depends on steps 4–5: landmarks, focus-visible, and every `packages/react/src/ui` primitive (dialog, tabs, accordion, data-table, …) are already fixed by the time this step's audit runs, so everything found here is view- or field-specific, not primitive-level. Audit output lands in `apps/test/audit/admin-axe.json` / `admin-width-matrix.json` (local-only, per the contract) and every finding — fixed or deferred — gets a row in `findings.md`.

- [x] Browser-driven axe sweep (`agent`, `browser` tool, Playwright `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`/`wcag22aa` tags) over every admin view in the inventory: list view (`ListViewToolbar.tsx`, `ListViewSearch.tsx`, `ListViewFilterBuilder/index.tsx`, `SavedListViewTabs/index.tsx`, row/bulk actions, `ListViewPeek/index.tsx`), edit view (`CollectionEditView.tsx`'s sticky header + actions menu, `UnsavedChangesDialog.tsx`, `StatusBadge.tsx`, `VersionHistoryPanel.tsx`/`VersionHistoryDropdown.tsx`, the `livePreview/` panel), media (`MediaCollectionListView.tsx`, `MediaCollectionEditView.tsx`, `MediaUploadForm.tsx`, `MediaLibraryGrid.tsx`), `GlobalEditView.tsx`/`GlobalsListView.tsx`, `DashboardView.tsx`, every `modals/` + `BaseModal.tsx`-built dialog, `AdminTopNav.tsx` — ran `env -u CI npx playwright test e2e/adminAxe.e2e.ts` from `apps/test`, `apps/test/audit/admin-axe.json` updated (not committed by this session — local-only per the contract)
- [x] `apps/test/audit/admin-width-matrix.json` — confirmed clean at every width; the collapsed off-canvas sidebar (F-086) is now `inert`, fixed
- [x] Fields sweep: error association, `tabs`/`collapsible` APG verification (collapsible's `aria-controls` gap found → F-098, fixed via a `MutationObserver`, not a deps-less effect — see deviation note below), richtext toolbar control names (found broken → F-092, fixed), relationship/upload picker search-and-pagination status (found missing, fixed in the prior code-only pass)
- [x] Closeout: array min/max error association (`fields/array/Field.tsx`) — fixed in the prior code-only pass
- [x] Closeout: the `updatedAt` sidebar field (`versions/DocumentTimestamps.tsx`, plus its twin `fields/commitTs/Field.tsx`) — fixed in the prior code-only pass
- [x] Closeout: upload picker search/pagination/MIME filter status (`media/MediaLibraryGrid.tsx`) — fixed in the prior code-only pass
- [x] Closeout: number `step`/`min`/`max` (`fields/number/Field.tsx`, plus its twin `forms/NumberField.tsx`) — fixed in the prior code-only pass
- [x] Closeout: the email cell's `mailto:` link (`fields/email/Cell.tsx`) — fixed in the prior code-only pass
- [x] `packages/react/src/admin/AdminTopNav.tsx` — breadcrumb overflow at narrow widths — fixed in the prior code-only pass
- [x] `packages/richtext-plate/src/editor/components/Toolbar.tsx` — every toolbar button's accessible name (F-064, prior pass) PLUS this runtime pass's F-092 (hiding each glyph from the accessibility tree so the visible text doesn't conflict with the `aria-label`, axe `label-content-name-mismatch`)
- [x] `packages/react/src/fields/relationship/RelationshipDocumentList.tsx` — same search/pagination status gap as the upload picker — fixed in the prior code-only pass
- [x] Existing `findings.md` rows (`F-004`, `F-014`, `F-017`, `F-018`/`F-021`, `F-022`, `F-026`–`F-032`, `F-036`, `F-039`) — marked `fixed (step 6)` in the prior code-only pass
- [x] `findings.md` new rows `F-058`–`F-064` for the closeout items this step's audit itself surfaced — added in the prior code-only pass
- [x] Contrast sweep: light, dark, and 6 of the 7 seeded `themes` presets applied as `siteSettings.adminTheme` (not just one) — none reproduced F-089's dark-mode near-invisible slug/select text or F-090's muted-text-on-`#DADADA` evidence; reverted `adminTheme` to empty afterward. F-088 (destructive contrast) fixed at the class level (`badge.tsx`/`button.tsx` `bg-destructive/3` light, `/10` dark) and measured via canvas-pixel contrast sampling against both a plain backdrop (4.59:1/4.81:1) and the real admin-header backdrop (4.09:1) — the token itself caps achievable contrast below 4.5:1 regardless of tint (same root cause as F-087/F-100), so this is a real, measured, partial improvement, not full AA closure
- [x] Sidebar-flip verification at 767/768/769, both directions — pass (unchanged from the prior pass's result); separately re-verified the F-086 `inert` fix at 1024px (collapsed-sidebar links are no longer `.focus()`-able; expanding restores focusability, trigger/rail still work)
- [x] `.agent/docs/specs/2026-11-06-quality-pass/findings.md` — one row per finding, fixed or backlogged, with live-DOM evidence quoted per row. **Deviation**: no screenshot evidence — the browser tool's `screenshot()` timed out (20s) on every attempt against the long-lived admin tab this session; reported as a tool issue, not retried further given the scope remaining
- [ ] `.agent/docs/product/backlog.md` — not edited by this session (board rule: this session doesn't own that file). One new backlog candidate from this step: F-099 (sidebar rail tooltip keyboard-focus gap) — title and evidence are in `findings.md`'s F-099 row for whoever owns `backlog.md` to file

#### packages/react/src/fields/array/Field.tsx

One edit. Everything else in the file (the item-actions slot, `PrimitiveArrayItemControl`, `ArrayFieldAdmin`) is unchanged.

`ArrayFieldAdminInner`'s outer element is `<div role="group" aria-labelledby={...} aria-disabled={readOnly}>` — a composite control standing in for the array as a whole, since no single input carries the field's own `min`/`max` validation error (`arrayFieldToInputSchema`'s `.refine()` calls in `packages/core/src/fields/array/inputSchema.ts` attach the error to the array field's own path, not to any item). `forms/ArrayField.tsx` (the leaf underneath) already renders that error through `FormFieldLayout` — `isFieldShowingError`/the error `<FieldError id={`${field.name}-error`}>` paint correctly — but nothing ties the group back to it: the group has `aria-labelledby`, never `aria-describedby`, and never `aria-invalid`. A screen-reader user tabbing into the array only hears the count/label; the "Maximum reached" or "At least 2 tags required" text that's visibly sitting right below the item list is never associated with the group that failed validation, breaking 3.3.1/4.1.2 for this field type specifically (every scalar leaf field already wires this correctly via `fieldDescribedBy`).

**1 — imports.** Pull `useStore` in as a value beside the existing `AnyFieldApi` type import, and extend the `../../forms` import with `fieldDescribedBy`, `isFieldShowingError`, `useFormContext`.

```ts
import { useStore, type AnyFieldApi } from "@tanstack/react-form";
```

```ts
import { ArrayField, fieldDescribedBy, GroupField, isFieldShowingError, useFieldContext, useFormContext } from "../../forms";
```

**2 — `ArrayFieldAdminInner`.** Compute the same `showError`/`describedBy` pair every leaf control already computes, beside the existing `field` read, and wire them onto the group.

```tsx
function ArrayFieldAdminInner(props: FieldComponentProps<{}, ArrayFieldDef<any, ArrayType>>) {
  const field = useFieldContext<ArrayType[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const showError = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({
    id: field.name,
    hasDescription: Boolean(props.fieldDef.description),
    showError,
  });
  const config = useContext(VexConfigContext);
```

```tsx
  return (
    <div
      role="group"
      aria-labelledby={`${field.name}-label`}
      aria-describedby={describedBy}
      aria-disabled={readOnly}
    >
      <ArrayField
```

#### packages/react/src/versions/DocumentTimestamps.tsx

One edit — the `useId` import and the function body (both changed, shown complete per the single-function rule).

`DocumentTimestamps` renders `<span className="text-muted-foreground">Created at</span>` immediately followed by `<p>{value}</p>`, inside a bordered box styled to look exactly like a read-only form field. It isn't one: the label `span` carries no `id`, the value `p` carries no `aria-labelledby`/`aria-describedby`, and the outer `div` carries no `role`. There is no programmatic relationship between the "Created at" text and the date — a screen reader announces two unrelated text nodes in sequence, with nothing marking the second as the value of the first (1.3.1). `fields/commitTs/Field.tsx`'s `CommitTsFieldValue` — the real, auto-injected `updatedAt` field rendered directly below it in the same sidebar — is the same markup with the same gap (fixed next).

```tsx
import { useId, type ReactNode } from "react";
import { formatDateFieldValue } from "../fields/date/utils";

/** `time` precision `DocumentTimestamps` renders its "Created at" value at — matches the injected `updatedAt` field. */
const CREATED_AT_TIME = {
  hidden: false,
  use12HourFormat: true,
  timePicker: { hour: true, minute: true, second: true },
} as const;

/**
 * Read-only "Created at" shown in an edit view's sidebar for an existing
 * document — the counterpart to the regular, `admin.readOnly` `updatedAt`
 * field injected onto every collection/global, but
 * sourced from `_creationTime` instead of a stored field.
 *
 * @param props.creationTime - The document's `_creationTime`, or `undefined`
 *   before the document exists (a global's first save, a brand-new row).
 * @returns The timestamp block, or `null` when `creationTime` is `undefined`.
 */
export function DocumentTimestamps(props: {
  creationTime: number | undefined;
}): ReactNode {
  const labelId = useId();
  if (props.creationTime === undefined) return null;
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="space-y-1 rounded-sm border-2 border-border p-3 text-sm"
    >
      <span id={labelId} className="text-muted-foreground">Created at</span>
      <p>
        {formatDateFieldValue({
          value: props.creationTime,
          time: CREATED_AT_TIME,
        })}
      </p>
    </div>
  );
}
```

#### packages/react/src/fields/commitTs/Field.tsx

One edit — the `useId` import and `CommitTsFieldValue` complete (the identical gap, same fix shape, on the real injected `updatedAt` field).

```tsx
import { useId, type ReactNode } from "react";
```

```tsx
function CommitTsFieldValue(props: { label: string; fieldDef: CommitTsFieldDef }): ReactNode {
  const field = useFieldContext<number | undefined>();
  const labelId = useId();
  const value = field.state.value;
  if (value === undefined) return null;
  const formatted = formatCommitTsFieldValue({ value, format: props.fieldDef.admin.format });
  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="space-y-1 rounded-sm border-2 border-border p-3 text-sm"
    >
      <span id={labelId} className="text-muted-foreground">{props.label}</span>
      <p>
        <TooltipProvider delay={1000}>
          <Tooltip>
            <TooltipTrigger render={<span>{formatted}</span>} />
            <TooltipContent>{commitTsTooltipValue(value)}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
    </div>
  );
}
```

#### packages/react/src/media/MediaLibraryGrid.tsx

Two edits. Everything else (the Type filter menu, `formatTypeOption`, props) is unchanged.

The search box, the Type filter (MIME) menu, and "Load more" all change `documents`/`isPending` with nothing but a visual repaint — no `role="status"`/`aria-live` region anywhere in the component. A screen-reader user who types a search term, picks a Type filter, or activates "Load more" gets no announcement that results changed, how many came back, or that the list is now empty (4.1.3 Status Messages) — they have to re-navigate into the grid to find out. Separately, `MediaDocumentPreview`'s `<button>` carries the selection state only as a CSS border + a `Check` icon; there's no `aria-pressed`, so the toggle state itself is never exposed (4.1.2).

**1 — status region.** Compute one status string after `handleItemClick` and render it as a visually-hidden live region, rendered once, ahead of the results container.

```tsx
  const statusText = isPending
    ? "Loading media…"
    : documents.length === 0
      ? search.length > 0
        ? "No media files match your search"
        : "No media files yet"
      : `${documents.length} file${documents.length === 1 ? "" : "s"} loaded`;

  return (
    <>
      <div className="flex items-center gap-2 pb-2">
```

```tsx
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
```

**2 — `MediaDocumentPreview`'s selection state.** Add `aria-pressed` beside the existing `onClick`.

```tsx
      className={cn(
        "group relative flex flex-col gap-2 rounded-sm border border-border bg-card p-2 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-2 border-primary",
      )}
      aria-pressed={isSelected}
      onClick={() => handleItemClick(mediaDoc._id)}
```

#### packages/react/src/fields/relationship/RelationshipDocumentList.tsx

Three edits — the same status-region/`aria-pressed` gap as `MediaLibraryGrid.tsx` on the relationship picker's own Select tab, plus the existing `autoFocus` lint finding (F-028) on the same search field, folded into the same edit since both land on the identical `<Input>`.

**1 — imports.** Add `useEffect`, `useRef` to the existing `useState` import.

```tsx
import { useEffect, useRef, useState } from "react";
```

**2 — status region + the search field's ref-based focus.** Compute the status string beside the existing `toggle` function, add a `searchRef` + mount-effect beside the existing `search` state, and swap the search `<Input>`'s `autoFocus` for the ref.

```tsx
export function RelationshipDocumentList({
  fieldDef,
  targetCollection,
  selectedIds,
  drafts,
  onSelectionChange,
}: RelationshipDocumentListProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);
```

```tsx
  function toggle(docId: string) {
    if (fieldDef.hasMany) {
      if (selectedIds.includes(docId)) {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      } else if (!atMax) {
        onSelectionChange([...selectedIds, docId]);
      }
    } else {
      onSelectionChange(selectedIds[0] === docId ? [] : [docId]);
    }
  }

  const statusText = isPending
    ? "Loading…"
    : isError
      ? getVexErrorMessage(error)
      : documents.length === 0
        ? "No documents found"
        : `${documents.length} ${targetLabel.toLowerCase()} loaded`;

  return (
    <div className="flex flex-col gap-2">
      <div className="border-b border-border p-2">
        <Input
          ref={searchRef}
          type="text"
          placeholder={`Search ${targetLabel}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          isPending={isPending}
        />
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>

      {isPending ? (
```

This component mounts fresh each time the enclosing `RelationshipPicker` dialog opens (`{isOpen && <RelationshipPicker .../>}` in `fields/relationship/Field.tsx`), so a mount-effect focuses correctly without racing anything — unlike `SaveListViewDialog.tsx`/`BlocksField.tsx` below, which stay mounted across open/close and need Base UI's own `initialFocus` prop instead.

**3 — the row button's selection state.** Add `aria-pressed` beside the existing `disabled`.

```tsx
              <button
                key={docId}
                type="button"
                onClick={() => toggle(docId)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`${isSelected ? "bg-accent text-accent-foreground" : ""} flex w-full items-center
```

#### packages/react/src/fields/number/Field.tsx

One edit — `renderBareControl`'s `value`. `value={controlProps.value ?? 0}` fights every attempt to clear the input: on the keystroke that empties it, `onChange` calls `controlProps.onChange(undefined)` (the existing `e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value)` branch), the field re-renders, and `value ?? 0` immediately snaps the controlled input back to displaying `"0"` — an optional number field (every number field defaults `required: false`, per `packages/core/src/fields/number/config.ts`) can never actually be shown empty mid-edit, which also means its accessible value never reflects "no value entered" the way its validation state allows. The masked variant two lines above already gets this right (`defaultValue={controlProps.value !== undefined ? String(controlProps.value) : ""}`) — `renderBareControl` is brought in line with it.

```tsx
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        value={controlProps.value ?? ""}
        onInput=
```

(Anchor note: `renderBareControl` uses `onChange`, not `onInput` — the line above `value` stays `max={props.fieldDef.max?.[0]}`, immediately followed by the changed `value` line, immediately followed by the existing unchanged `onChange={(e) => ...}` block.)

`fields/number/Field.test.tsx` already carried a pinned test, "renders 0, not blank, when the field's value is undefined — the field.state.value ?? 0 fallback", asserting the OLD behavior this fix corrects, plus an adjacent test already marked "EXPECTED TO FAIL against the current implementation" for exactly this clear-to-empty case. Both are corrected in the same edit: the first renamed and re-asserted against `toHaveValue(null)` (blank, not `0`); the second's `EXPECTED TO FAIL` framing is dropped now that it passes for real, per AP-010 — a contradicting pinned test is a bug to fix, not noise to route around.

#### packages/react/src/forms/NumberField.tsx

One edit — the identical bug in the app form's own default control, reached whenever `NumberFieldAdmin` has no mask and no `admin.components.Input` override (the common case).

**1 — the default `<Input>`'s `value`.**

```tsx
      step={props.step}
      min={props.min}
      max={props.max}
      value={field.state.value ?? ""}
      onChange={(e) =>
```

#### packages/react/src/fields/email/Cell.tsx

One edit. `title={props.value}` never reaches the accessible name: the browser's accessible-name algorithm only falls back to `title` when an element has NO text content, and this link already has visible (if truncated) text — so for any address over 77 characters, sighted mouse users get the full address on hover and everyone else (keyboard-only, screen reader, touch) gets only the truncated string with no way to recover the rest. The link also gives no indication it launches the user's mail client rather than navigating within the app, unlike every other data-table link. `forms/UrlField.tsx` already has the matching precedent for this exact class of gap — an `aria-label` describing what the link actually does, independent of its visible/truncated text.

```tsx
  return (
    <VexLink href={href} aria-label={props.isTitleField ? undefined : `Email ${props.value}`}>
      <span className="font-bold" title={props.value}>
```

#### packages/react/src/admin/AdminTopNav.tsx

One edit. `crumbsEl` is `<div className="flex items-center gap-2">` with no size constraint, sitting in the header's `flex` row alongside the fixed-width sidebar trigger / View-site button / auth control. A flex item's `min-width` defaults to `auto` (its content's own size), not `0`, so a long crumb trail (a deep collection + a long document title) cannot shrink below its content width — it either forces the whole `<header>` wider than the viewport (page-level horizontal scroll) or pushes the sidebar trigger/auth control off-screen, exactly what `adminWidths.e2e.ts` flags as an offscreen control. Found during the width-matrix sweep at 375/390.

```tsx
  const crumbsEl = (
    <div className="flex min-w-0 items-center gap-2 overflow-x-auto" suppressHydrationWarning>
      {nav}
    </div>
  );
```

This makes the crumb trail its own horizontal scroll region at narrow widths instead of overflowing the header — the same exception the data table already has in `adminWidths.e2e.ts`'s assertions (see Verify below).

#### packages/richtext-plate/src/editor/components/Toolbar.tsx

Ten edits. The toolbar container itself is already correct — `role="toolbar"` + `aria-label="Formatting options"` on the outer `<div>`, `aria-pressed` on every toggle button. What's wrong is every button's accessible NAME: `MarkButton` renders `{meta.label}` (`"B"`, `"I"`, `"U"`, `"S"`, `"mono"`), `BlockButton`/`ListButton`/`CodeBlockButton`/`HorizontalRuleButton` render a bare glyph (`"\u201C"`, `"•"`, `"1."`, `"{ }"`, `"―"`), and `LinkButton`/`HeadingDropdown`/`TableButton` render `"🔗"`/a one-or-two-letter heading code/`"▦"` — that glyph IS the button's accessible name. The real description (`"Bold (Ctrl+B)"`, `"Blockquote"`, `"Bullet list"`, …) only exists in the `<Tip>` sibling span, which is (a) never wired to the button via `aria-label`/`aria-describedby`, so it contributes nothing to any assistive technology regardless of hover/focus, and (b) shown to sighted users on `:hover` only (`tooltipStyles`'s one CSS rule) — a keyboard-only sighted user tabbing through the toolbar sees no tooltip at all. Fixed by threading the same description string both components already compute into `aria-label`, plus extending the CSS trigger to `:focus-within` so keyboard users get the same visible tooltip mouse users do.

**1 — tooltip CSS also triggers on keyboard focus.**

```ts
.vex-tb-wrap:hover > .vex-tb-tip,
.vex-tb-wrap:focus-within > .vex-tb-tip { display: block; }
```

**2 — `MARK_META` gets a real word per mark, beside the existing short `label` glyph.**

```ts
const MARK_META: Record<
  string,
  { label: string; name: string; shortcut: string; fw?: number; fs?: string; td?: string }
> = {
  bold: { label: "B", name: "Bold", shortcut: "Ctrl+B", fw: 700 },
  italic: { label: "I", name: "Italic", shortcut: "Ctrl+I", fs: "italic" },
  underline: { label: "U", name: "Underline", shortcut: "Ctrl+U", td: "underline" },
  strikethrough: { label: "S", name: "Strikethrough", shortcut: "Ctrl+Shift+S" },
  code: { label: "mono", name: "Inline code", shortcut: "Ctrl+E" },
};
```

**3 — `MarkButton`'s `aria-label`.**

```tsx
        aria-pressed={isActive}
        aria-label={`${meta.name} (${meta.shortcut})`}
      >
```

**4 — `BlockButton`'s `aria-label`** (`tooltip` is already the exact description string).

```tsx
        style={activeStyle(isActive)}
        aria-pressed={isActive}
        aria-label={tooltip}
      >
```

**5 — `ListButton`'s `aria-label`** (same shape as `BlockButton`).

```tsx
        style={activeStyle(isActive)}
        aria-pressed={isActive}
        aria-label={tooltip}
      >
```

**6 — `CodeBlockButton`/`HorizontalRuleButton`'s `aria-label`**, matching their own `<Tip text="…">` strings verbatim.

```tsx
        style={activeStyle(isActive)}
        aria-pressed={isActive}
        aria-label="Code block"
      >
```

```tsx
        style={activeStyle(false)}
        aria-label="Horizontal rule"
      >
```

**7 — `LinkButton`'s ref, trigger `aria-label`, and URL input.** The popover's `autoFocus` (F-030) is also on this input — one ref replaces both the lint finding and the missing label.

```tsx
  const ref = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
```

```tsx
  useEffect(() => {
    if (showInput) urlInputRef.current?.focus();
  }, [showInput]);
```

```tsx
        style={activeStyle(isActive)}
        aria-label="Insert link"
      >
```

```tsx
          <input
            ref={urlInputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsert();
              }
              if (e.key === "Escape") setShowInput(false);
            }}
            placeholder="https://..."
            aria-label="Link URL"
```

(F-014's own finding — this same `<input>`'s missing `aria-label` — is cleared by the `aria-label="Link URL"` line above.)

**8 — `HeadingDropdown`'s `aria-label`.**

```tsx
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Heading level"
      >
```

**9 — `TableButton`'s `aria-label`.**

```tsx
        style={activeStyle(false)}
        aria-expanded={open}
        aria-label="Insert table"
      >
```

**10 — colocated test.** `Toolbar.test.tsx` mounts the real `PlateEditorField` with `defaultFeatures` (not a hand-mocked `useEditorRef`/`useEditorSelector`) and asserts every button's `aria-label`, the CSS tooltip's `:focus-within` selector, and the link popover's ref-based focus. `packages/richtext-plate` carries no `@testing-library/jest-dom` dependency (unlike `packages/react`) — the test uses plain DOM/chai assertions (`element.hasAttribute("autofocus")`, `document.activeElement`) instead of `toHaveAttribute`/`toHaveFocus`.

#### packages/react/src/collections/listView/savedListViews/SaveListViewDialog.tsx

One edit beyond the label/`id` pairing already covered under the Fields sweep (F-018/F-021): the "Name" field's `autoFocus` (F-027). `SaveListViewDialog` stays mounted across open/close (its parent toggles `open`, never unmounts the component), so a plain mount-effect races Base UI's own focus-trap setup and loses — measured live: `document.activeElement` landed on `document.body`, not the input, until the test awaited the focus-manager's own settle tick. The non-racing fix is Base UI's own `DialogContent`'s `initialFocus` prop, which `ui/dialog.tsx`'s `DialogContent` already forwards via `...props` onto `DialogPrimitive.Popup`.

```tsx
const nameInputRef = useRef<HTMLInputElement>(null);
```

```tsx
<DialogContent initialFocus={nameInputRef}>
```

The same `ref={nameInputRef}` already sits on the "Name" `<Input>`; `autoFocus` is removed. `packages/react/src/collections/listView/savedListViews/SaveListViewDialog.tsx`'s own radio labels (F-018/F-021) get `htmlFor`/`id` pairing the same way as `forms/SelectField.tsx`'s do below.

#### packages/react/src/forms/BlocksField.tsx

One edit — `BlockPickerDialog`'s search field autoFocus (F-029), the identical `initialFocus` fix as `SaveListViewDialog.tsx` above, since `BlockPickerDialog` is the same always-mounted Base UI `Dialog` shape.

```tsx
<DialogContent className="w-full max-w-sm p-0" initialFocus={searchRef}>
```

#### packages/react/src/forms/SelectField.tsx

One edit — the checkbox-group/radio-group option `<label>`s (F-022) get an `id`/`htmlFor` pair keyed on `${field.name}-option-${optionIndex}`, matching `SaveListViewDialog.tsx`'s own pairing above.

#### packages/react/src/collections/listView/peek/ListViewPeek/index.tsx

One edit — the resize separator's `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (F-032/F-036), computed from the same `clampPeekWidth` the panel's own width already derives through:

```tsx
const maxPeekWidth = clampPeekWidth(Number.MAX_SAFE_INTEGER);
```

```tsx
aria-valuenow={renderedWidth}
aria-valuemin={PEEK_PANEL_MIN_WIDTH_PX}
aria-valuemax={maxPeekWidth}
```

#### packages/react/src/media/MediaUploadForm.tsx

One edit — the empty-state dropzone (F-004/F-039) gets `role="button"`, `tabIndex={0}`, and an `onKeyDown` that activates the same `fileInputRef.current?.click()` on Enter/Space.

#### Runtime half — F-078–F-101, F-086, F-088, F-091–F-095, F-098 (this pass)

Fixed with the admin (`:3020`) and www (`:3030`) dev servers already running (never started/restarted — P-024), discovered by the browser-driven axe sweep and the step 5 keyboard re-check above. Full per-finding evidence is in `findings.md`'s F-078–F-101 rows; this subsection names only the files and the shape of each fix.

- `ui/data-table/DataTable/index.tsx`, `DataTableBody.tsx` (F-078/F-095) — `aria-label="Select all rows"` on the header checkbox, `` aria-label={`Select row ${row.id}`} `` on each row checkbox (keyed by `_id`, the table's own `getRowId` — no title-resolution plumbing exists in this generic primitive to thread a human title through, so the stable row id is the fallback name), `aria-label="Select row"` on the disabled loading-skeleton placeholder.
- All 7 `fields/*/FilterInput.tsx` files still missing a name (`text`, `url`, `textarea`, `number`, `email`, `color`, `date`) (F-079) — `` aria-label={props.field.label || "Filter value"} `` on each; `date/FilterInput.tsx`'s `ui/datetime/date-picker.tsx` had no `aria-label` prop type at all (only `aria-labelledby`) — added one, forwarded to the `role="combobox"` trigger.
- `ui/data-table/DataTableColumnsMenu.tsx` (F-080) — `` aria-label={`Reorder ${row.meta.label} column`} `` on the shared `DragHandle`.
- `ui/scroll-area.tsx`, `ui/ScrollSection.tsx` (F-081, F-101) — Viewport now `role="region"` (overriding Base UI's own default `role="presentation"`, which HTML forbids pairing with `aria-label`) + `` aria-label={ariaLabel ?? "Scrollable content"} ``; `ScrollSection` forwards its own `title` as that label where available.
- `ui/dialog.tsx`, `ui/alert-dialog.tsx` (F-082) — `aria-modal="true"` on both `Popup`s.
- `richtext-plate/editor/PlateEditorField.tsx` (F-083, F-093) — the image-insert button gets `aria-label="Insert image"` + its glyph hidden; the scroll wrapper around `PlateContent` gets `tabIndex={0}` (one new, expected `jsx-a11y/no-noninteractive-tabindex` lint warning — the fix's whole point).
- `ui/sidebar.tsx` (F-086) — `inert` on the `data-slot="sidebar-container"` div while `collapsible === "offcanvas" && state === "collapsed"`.
- `ui/badge.tsx`, `ui/button.tsx` (F-088) — destructive variant's background tint `bg-destructive/10` → `/3` (light), `/20` → `/10` (dark); real, measured improvement, does not fully clear 4.5:1 against this app's actual background (token-level cap, see findings.md).
- `forms/BlocksField.tsx` (F-091, F-098) — the block-rename `<Input>` moved out of `AccordionPrimitive.Trigger` to a `Header` sibling (nested-interactive); the same trigger also gets the F-098 `aria-controls` fix (below) since it uses the raw primitive directly, not `ui/accordion.tsx`'s wrapper.
- `ui/accordion.tsx`, `forms/BlocksField.tsx` (F-098) — Base UI unmounts the panel while closed and strips `aria-controls`; that computation lives in a context consumer BELOW `AccordionTrigger`, so a deps-less `useEffect` on the wrapper never re-runs on expand/collapse (only at mount — a real jsdom test failure caught this before shipping). Fixed with a `MutationObserver` on the trigger node instead, which fires on every `aria-controls` mutation regardless of which component wrote it.
- `richtext-plate/editor/components/Toolbar.tsx` (F-092) — every remaining bare glyph (`BlockButton`, `CodeBlockButton`, `ListButton`, `LinkButton`, `TableButton`, `HorizontalRuleButton`, `HeadingDropdown`'s label + chevron) wrapped `<span aria-hidden="true">`.
- `ui/dnd/DragHandle.tsx` + 5 call sites (F-080, F-094) — new optional `aria-label` prop, `min-h-6 min-w-6` (24×24 CSS px around the 16px icon); `fields/relationship/FilledInput.tsx`, `fields/upload/FilledInput.tsx`, `forms/ArrayField.tsx`, `forms/BlocksField.tsx` and `DataTableColumnsMenu.tsx` each thread a context-specific name through it.

**Not fixed this pass** (full evidence in `findings.md`): F-085 (could not reproduce the Next dev-overlay crash across several attempts); F-087/F-100 (apps/test token values, out of this session's file boundary — QP-12); F-089/F-090 (contrast findings not reproduced under the current theme or any of 7 seeded `themes` presets tried; root cause not isolated to a packages/react class); F-099 (`SidebarMenuButton`'s tooltip-on-keyboard-focus gap only manifests at `collapsible="icon"`, which `apps/test/src/vex.config.ts` never sets — not reproducible in the running app; filed for `backlog.md` with F-099's evidence, not edited directly).

**Width matrix procedure**

`adminWidths.e2e.ts` (local only, per the contract) runs every `QUALITY_WIDTH` (375/390/640/767/768/769/1024/1280/1536) against every view in the inventory above, asserting no horizontal overflow and no control pushed outside the viewport, except the data table's own scroll region and the `AdminTopNav` breadcrumb trail's new one (both intentional per-region scroll containers, not page-level overflow).

Sidebar flip, both directions, in ONE page session (no reload between steps — `use-mobile.ts`'s `useIsMobile` is a live `matchMedia` listener, so a reload-per-width test would miss a stale-closure/listener bug a resize-driven one catches):
1. Load an admin view at 1024px (desktop: static sidebar, no overlay).
2. `page.setViewportSize({ width: 769, height: … })` → assert still desktop mode (`SidebarProvider`'s `isMobile` false; no `Sheet` overlay).
3. `page.setViewportSize({ width: 768, height: … })` → assert still desktop mode (768 is `MOBILE_BREAKPOINT`, and `useIsMobile`'s query is `max-width: 767px`, so 768 is NOT mobile).
4. `page.setViewportSize({ width: 767, height: … })` → assert mobile mode (sidebar collapses to the `Sheet` overlay/trigger).
5. Reverse: 767 → 768 → 769, asserting the same three states in the opposite order, confirming the flip isn't one-directional (e.g. a `useState` that updates on shrink but not on grow).

**Contrast procedure**

`vitest-axe`/jsdom cannot compute real rendered contrast (no layout engine) — this runs through Playwright's `@axe-core/playwright` against the live admin, `.withRules(["color-contrast"])`, over the view inventory above, in three states:
1. **Light** — default `ThemeProvider` state.
2. **Dark** — `.dark` class toggled via the existing `ThemeToggle`.
3. **One database theme** — `apps/test/convex/seed.ts`'s `THEME_PRESETS` seeds more than one `themes` document; set `siteSettings.adminTheme` to a preset OTHER than the default ("Stark × Ember") through the admin's own Site Settings form (exercises the real `<ThemeStyle scope="admin" />` + `<ThemeLive scope="admin" />` path, not a hand-edited document — P-021), re-run the `color-contrast` sweep, then set `adminTheme` back to empty (the documented fallback-to-site-theme default) so the seed stays the source of truth for the deployment's resting state. Mirrors the step-2 draft-route procedure's own publish → audit → revert shape.

**Backlog rule**

Every finding with disposition `fix` in `findings.md` is fixed in this step and re-verified at the width(s)/theme it was found at, with a screenshot attached to its row. Every finding whose fix would exceed the fix boundary (classes/attributes/markup/≤~30-line keyboard-or-focus handlers, no public API change) gets disposition `backlog`, stays `open` in `findings.md`, and is copied into `.agent/docs/product/backlog.md` with that row's own evidence (not re-described) — `backlog.md` never holds a finding `findings.md` doesn't also have.

Verify (actual, 2026-11-08): `apps/test/audit/admin-axe.json` is clean except `color-contrast` on `--primary`/`--destructive` token surfaces (F-087, F-088-partial — token-level, QP-12, not fixable from `packages/react` alone) and one stale `label-content-name-mismatch` hit on a single previously-visited document that live-DOM-checks as already fixed (Next dev-server route-cache artifact, not a regression); `apps/test/audit/admin-width-matrix.json` is clean at every width apart from the data table's and `AdminTopNav`'s own deliberate scroll regions; the sidebar flip across 767/768/769 is verified in both directions within one page session, plus a separate 1024px `inert`/`.focus()` re-check for F-086; every closeout item is browser-verified via live-DOM `evaluate()` calls and/or a colocated test (**no screenshot evidence** — the browser tool's `screenshot()` timed out on every attempt this session, reported as a tool issue); `color-contrast` was re-checked in light, dark, and 6 of the 7 seeded `adminTheme` presets (not just one) — F-089/F-090 did not reproduce under any of them, so they stay `open` pending a repro; `backlog.md` was NOT edited by this session (one candidate, F-099, filed with evidence in `findings.md` for whoever owns that file next).

### Step 7 — www pages, blocks, images, performance [dev]

The public surface a stranger sees first, and the one the Lighthouse CI budgets gate. Reading every block renderer, `MediaImage`, the auth dialog, and the Plate static renderer found the image-alt chain silently dropping the CMS-authored `alt` field at the `getUrl` query boundary, an auth dialog with no accessible name and no close control (and no `aria-modal`/inert background — `@base-ui/react@1.2.0` ships neither), a public site with nowhere for `sonner`'s `toast()` calls to render, and a Tailwind v4 syntax bug (`bg-[--token]` instead of `bg-(--token)`) that silently dropped the code pane's always-dark background, exposing Shiki's dark-theme token colors on the light page background in light mode. Running the step-2 tools against this work found three more concrete defects (`Stats`' `<dl>` content model, `Roadmap`'s filter tabs, a missing `not-found.tsx`) and two vendor-internal gaps in `@daveyplate/better-auth-ui` that don't fit the fix boundary. The home page carries no image at all, so the "LCP image priority" checklist item was retargeted at the Hero's `<h1>` — measured via a live LHCI run, which found the dev-server's LCP numbers to be a measurement artifact unrelated to it. `/posts/[slug]` and the admin `error.tsx` fallback had landed from sibling specs by the time this step ran; both are audited against their real, shipped code.

- [x] `apps/www/convex/images.ts`: new `getById` query so `MediaImage` can read a media document's own `alt` field — `api.vex.media.getUrl` returns `{ url }` only
- [x] `apps/www/src/components/MediaImage.tsx`: optional `alt` (defaults to the media document's `alt`) and a new `sizes` prop threaded to `next/image`
- [x] `apps/www/src/vexcms/blocks/Split/index.tsx`: drop the hardcoded `alt=""` on its content screenshot, add `sizes`
- [x] `apps/www/src/app/@auth/(.)auth/[pathname]/view.tsx`: give the auth dialog an accessible name and restore its close control
- [x] `apps/www/src/components/ui/dialog.tsx`: `aria-modal="true"` and a mount-effect that makes `#main` `inert` while any `DialogContent` is open — `@base-ui/react@1.2.0` implements neither (checked its `dist/`), so this was missing from every www dialog, not just the auth one
- [ ] `apps/www/src/app/layout.tsx` (lock: held by `Main` per `launch-coordination.md` § Locks — **not applied, handed off below**): mount `@vexcms/react`'s `<Toaster />` so public-site toasts — including the auth form's error toasts — render and are announced
- [x] `apps/www/src/app/(vexcms)/admin/error.tsx`: move focus to the retry button when the boundary mounts
- [x] `packages/richtext-plate/src/render/components/Elements.tsx`: replace the static renderer's hardcoded hex colors (blockquote, code block, link) with the site's CSS custom properties, so `/posts/[slug]` content respects light/dark theming
- [x] `apps/www/src/components/CodePane.tsx`, `InstallCommand.tsx`: fix the `bg-[--color-code-bg]`/`text-[--color-code-fg]` Tailwind v4 syntax bug (parens form), add scroll-region keyboard access to `CodePane`, fix the two AA failures the correct dark background exposed
- [x] `apps/www/src/app/globals.css`, `apps/www/src/lib/highlight.ts`: raise `--color-code-dim` and remap Tokyo Night's comment color so both clear 4.5:1 on the now-correct dark code background
- [x] `apps/www/src/vexcms/blocks/Stats/index.tsx`: fix the `<dl>` content model (F-069) — `dt+ dd+` order restored via `order-*`, visual layout unchanged
- [x] `apps/www/src/vexcms/blocks/Roadmap/index.tsx`: drop the low-contrast `/80` opacity on shipped-item descriptions (F-068); wire `role="tabpanel"`/`aria-controls`/`aria-labelledby` between the filter `TabsTrigger`s and the filtered-groups container (F-074)
- [x] `apps/www/src/app/tour/TourContent.tsx`: wrap in `<main id="main">`, `priority` on the first screenshot, explicit `h-auto w-full`
- [x] `apps/www/src/app/(frontend)/(site)/not-found.tsx` + `NotFoundContent.tsx`, `apps/www/src/app/not-found.tsx`: site-chrome and root 404 fallbacks
- [x] Every other block renderer (`Hero`, `Header`, `Footer`, `Features`, `HowItWorks`, `CodeShowcase`, `FAQ`, `CTA`) read against heading order, list markup, and link purpose: no further code changes needed (see below)
- [x] Font loading and the home page's LCP element audited; measured live via `lhci collect` — no Hero fix needed (see below)
- [x] `/posts/[slug]` and the admin `error.tsx` fallback audited against their real, shipped code (see below)
- [x] Ran the step 2 tools against the local site; `audit/www-axe.json`, `audit/www-nu.json`, `audit/www-width-matrix.json` updated; `findings.md` updated with every row's fix evidence
- [x] Added the Plate-renderer heading-order structural finding, and the two `better-auth-ui` vendor findings, to `backlog.md`

#### apps/www/convex/images.ts

New file. Mirrors `apps/www/convex/headers.ts`/`theme.ts`'s bypass-access, single-document query pattern.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_IMAGES } from "~/db/constants"
import { get } from "~/vexcms/api"

import type { Id } from "./_generated/dataModel"
import { query } from "./_generated/server"

/**
 * Returns the `images` document for `args.id`, or `null`.
 *
 * `api.vex.media.getUrl` resolves a storage URL only (`GetUrlReturn` is
 * `{ url: string }`, shared across every storage adapter) — it can never
 * carry the CMS-authored `alt` field. This is the one www-only query that
 * reads the document itself, so `MediaImage` can default its accessible name
 * to what an editor actually typed in the media library.
 *
 * Access is bypassed: every image rendered through `MediaImage` (block
 * logos, Split screenshots) is already public.
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) =>
    await get({
      ctx,
      collection: TABLE_SLUG_IMAGES,
      id: args.id as Id<typeof TABLE_SLUG_IMAGES>,
      access: { bypass: true },
    }),
})
```

#### apps/www/src/components/MediaImage.tsx

1 edit; everything not shown (the file header comment's first paragraph) is unchanged. The `MediaImage` function, complete, replacing the current one:

```tsx
/**
 * Renders an `upload()` field value as a `next/image`.
 *
 * An `upload()` field stores an **array of media ids**, not a URL, so the id
 * has to be exchanged for a public URL through the storage adapter before
 * anything can be rendered. Passing the field value straight to `src` sets it
 * to a Convex document id and renders a broken image.
 *
 * Client-side by design: it is used from both the client Header and the
 * server Footer, and one component with one code path beats a server and a
 * client variant that can drift.
 *
 * Renders nothing while resolving, and nothing if the media document is gone —
 * callers pair it with a text fallback rather than reserving empty space.
 *
 * @param props - Component props.
 * @param props.value - Raw `upload()` field value.
 * @param props.alt - Accessible name. Omit to read the media document's own
 *   `alt` field (what an editor typed in the media library); pass `""` to
 *   force decorative regardless of what the document holds.
 * @param props.width - Intrinsic width hint for `next/image`.
 * @param props.height - Intrinsic height hint for `next/image`.
 * @param props.sizes - `next/image` `sizes`. Required whenever the rendered
 *   width tracks the viewport (a `w-full`-style `className`) rather than
 *   staying fixed — omitting it serves every viewport the same source width.
 * @param props.className - Classes applied to the rendered image.
 */
export function MediaImage({
  alt,
  className,
  height,
  sizes,
  value,
  width,
}: {
  alt?: string
  className?: string
  height: number
  sizes?: string
  value: string | string[] | undefined
  width: number
}) {
  const mediaId = Array.isArray(value) ? value[0] : value

  const { data } = useQuery({
    ...convexQuery(
      api.vex.media.getUrl,
      mediaId ? { adapter: "convex", mediaId } : "skip"
    ),
    enabled: Boolean(mediaId),
  })

  const { data: doc } = useQuery({
    ...convexQuery(
      api.images.getById,
      alt === undefined && mediaId ? { id: mediaId } : "skip"
    ),
    enabled: alt === undefined && Boolean(mediaId),
  })

  const url = (data as undefined | { url?: string })?.url
  if (!url) {return null}

  const resolvedAlt = alt ?? (doc as undefined | { alt?: string })?.alt ?? ""

  return (
    <Image alt={resolvedAlt} className={className} height={height} sizes={sizes} src={url} width={width} />
  )
}
```

`Header`/`Footer` pass an explicit `alt={logoText ?? ""}` already (the brand name reads better than the uploaded file's own alt text) and render at a fixed 20px height, never the viewport's width — both stay unchanged, and neither needs `sizes`.

#### apps/www/src/vexcms/blocks/Split/index.tsx

1 edit. In the `resolved === "image" && image` branch, the `MediaImage` call:

```tsx
                <MediaImage
                  className="aspect-[4/3] w-full object-cover"
                  height={720}
                  sizes="(min-width: 1280px) 600px, (min-width: 768px) 45vw, 100vw"
                  value={image}
                  width={960}
                />
```

Dropping the hardcoded `alt=""` lets `MediaImage` read the editor-authored `alt` from the media document; this is the only block passing an actual content screenshot (Header/Footer's `MediaImage` calls are brand marks, correctly overridden). `sizes` matches `Container`'s `max-w-[1280px]` grid: the image column is 5fr or 6fr of an 11fr track at `xl` (≈520–624px, rounded to 600px), roughly half the container between `md` and `xl`, full width below `md`.

#### apps/www/src/app/@auth/(.)auth/[pathname]/view.tsx

2 edits; everything else (including the `isGuardRedirect` branch and its surrounding comments) is unchanged.

**1 — imports.** Drop the now-unused `Activity`:

```tsx
import { AuthView } from "@daveyplate/better-auth-ui";
import { useRouter, useSearchParams } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

function formatDialogTitle(pathname: string): string {
  return pathname
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
```

**2 — the dialog itself.** `DialogPrimitive.Popup` (`DialogContent`) auto-labels itself via `aria-labelledby` pointing at its `DialogTitle` child's id; an empty, `Activity`-hidden title left the dialog with no accessible name, and `showCloseButton={false}` left it with no visible focusable close control (the APG Dialog pattern requires both). `DialogContent`'s default close button (`~/components/ui/dialog.tsx`) already renders an `sr-only`-labelled icon button, so this is a deletion:

```tsx
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          router.back();
        }
      }}
      open
    >
      <DialogContent
        aria-describedby={undefined}
        className="grid place-items-center bg-transparent shadow-none ring-transparent"
      >
        <DialogTitle className="sr-only">{formatDialogTitle(pathname)}</DialogTitle>
        <AuthView path={pathname} />
      </DialogContent>
    </Dialog>
  );
```

`pathname` is the `authViewPaths` route segment (`sign-in`, `sign-up`, `forgot-password`, …) already passed into this component — `formatDialogTitle` title-cases it rather than hand-authoring a parallel label map that drifts from `@daveyplate/better-auth-ui`'s own route list.

#### apps/www/src/app/layout.tsx

**Not applied — handed off to the session holding this file's lock.** `@vexcms/react`'s `<Toaster>` is built to be mounted once by the host app for exactly this: it renders nothing if `AdminLayout` already mounted one above it, and defers to an ancestor instance otherwise (`packages/react/src/ui/sonner.tsx`). Today nothing in `apps/www` mounts it outside `/admin`, so every public-site `toast()` call — including the sign-in/sign-up form's own error toasts inside `AuthView` — has no viewport to render into and is silently dropped, which is also a 4.1.3 Status Messages gap (an error with no programmatic announcement). The edit below is the complete change; whoever holds the lock applies it in the same place as the existing `<Analytics />`.

**1 — import and mount**, alongside the existing `<Analytics />`:

```tsx
import { LivePreviewProvider, Toaster } from "@vexcms/react";
```

```tsx
        <Analytics />
        <Toaster />
      </body>
```

#### apps/www/src/app/(vexcms)/admin/error.tsx

1 edit. The boundary (`.agent/docs/specs/2026-11-06-launch-infrastructure/spec.md` step 10, already landed in this tree) renders a heading and two actions but moved focus to neither, so a screen-reader user tabbing or listening when the boundary replaces the admin's content got no announcement that anything changed and no reliable place to land. Fix: move focus to the retry button on mount, alongside the existing error log.

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { buttonVariants, cn } from "@vexcms/react";

import { TOUR_PATH } from "~/lib/routes";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    console.error(error);
    retryRef.current?.focus();
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Demo unavailable</h1>
      <p className="max-w-[32rem] text-muted-foreground">
        Something went wrong loading the admin panel. Try again, or view a static tour instead.
      </p>
      <div className="flex gap-4">
        <button
          className={cn(buttonVariants({ variant: "default" }))}
          onClick={reset}
          ref={retryRef}
          type="button"
        >
          Try again
        </button>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={TOUR_PATH}>
          View the tour
        </Link>
      </div>
    </div>
  );
}
```

`/tour` itself (same sibling spec, already landed) ships descriptive, non-empty `alt` text per screenshot and a single `<h1>` — audited; the console-error and `<main>`-landmark fixes it did need are in `TourContent.tsx` below.

#### packages/richtext-plate/src/render/components/Elements.tsx

3 edits; everything else (headings' `styles` map, lists, images, tables) is unchanged. The static renderer hardcodes light-mode-only hex colors in inline `style` objects, so a post's blockquotes, code blocks, and links keep a light background/text regardless of the site's active theme — contrast and legibility break in dark mode, and the design-token contract (`.agent/docs/standards/frontend/css-and-tokens.md`) is that every surface reads its colors from the app's CSS custom properties. These `var(--token)` names resolve correctly in both `apps/www` and `apps/test`, which define the same semantic token set.

**1 — `BlockquoteElementStatic`'s `style`:**

```tsx
        style={{
          borderLeft: "3px solid var(--border)",
          paddingLeft: 16,
          margin: "12px 0",
          color: "var(--muted-foreground)",
          fontStyle: "italic",
        }}
```

**2 — `CodeBlockElementStatic`'s `style`:**

```tsx
        style={{
          background: "var(--muted)",
          borderRadius: 6,
          padding: "12px 16px",
          margin: "12px 0",
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.5,
        }}
```

**3 — `LinkElementStatic`'s `style`:**

```tsx
      style={{
        color: "var(--primary)",
        textDecoration: "underline",
      }}
```

#### apps/www/src/components/CodePane.tsx

2 edits, found live: `bg-[--color-code-bg]` and `text-[--color-code-fg]` (Tailwind v4 bracket-arbitrary syntax) emit the literal string as the CSS value — `background-color: --color-code-bg`, invalid, silently dropped — instead of wrapping it in `var()`. A computed-style probe on the real element confirmed it: `rgba(0, 0, 0, 0)` for the class, `lab(1.2% 0 0)` (the real `--color-code-bg` token) for the equivalent `style={{ backgroundColor: "var(--color-code-bg)" }}`. The pane's background was transparent the whole time, showing through to the light page background in light mode — the actual cause of F-066, not a Shiki-theme gap. Also fixes F-070 (no keyboard access to the scroll region).

**1 — the scroll body div**, replacing its `className`/attributes:

```tsx
      <div
        aria-label={`${filename ?? "Code"} (scrollable)`}
        className={cn(
          "min-w-0 flex-1 overflow-auto overscroll-x-contain bg-(--color-code-bg) p-4 xl:px-4 xl:py-[18px]",
          "max-h-[420px] md:max-h-[560px]",
          bodyClassName
        )}
        role="region"
        tabIndex={0}
      >
```

**2 — the `<pre>`'s `className`:**

```tsx
        <pre className="font-mono text-xs leading-[1.7] whitespace-pre text-(--color-code-fg) xl:text-[12.5px]">
```

#### apps/www/src/components/InstallCommand.tsx

3 edits — the same syntax bug, plus the AA failure it exposed once the background was correctly dark: the `$` prompt's `text-muted-foreground` (designed for light surfaces) measured 3.51:1 on the now-dark background.

**1 — the outer `div`'s `className`:**

```tsx
    <div className="flex w-full max-w-full items-center gap-2 rounded-sm border border-border bg-(--color-code-bg) py-1.5 pr-1.5 pl-3 sm:w-auto">
```

**2 — the `$` prompt span**, reading from the code-surface token family instead of the site's general muted-foreground:

```tsx
      <span aria-hidden className="shrink-0 font-mono text-[13px] text-(--color-code-dim)">
        $
      </span>
```

**3 — the command `<code>`'s `className`:**

```tsx
      <code className="overflow-x-auto overscroll-x-contain font-mono text-[13px] whitespace-pre text-(--color-code-fg)">
```

#### apps/www/src/app/globals.css

1 edit. `--color-code-dim` (`oklch(52% 0 0)`, "comments, shell prompts") was itself below 4.5:1 against `--color-code-bg` (3.73:1) — raised to clear it with margin (4.78:1 measured):

```css
  --color-code-dim:    oklch(58%   0     0);  /* comments, shell prompts        */
```

#### apps/www/src/lib/highlight.ts

2 edits. Tokyo Night's own comment token (`#51597D`) measured 3.00:1 against `--color-code-bg` once it was correctly dark — below the 4.5:1 floor, and not something the `--color-code-*` tokens control (it's baked into Shiki's theme). Shiki's `colorReplacements` option remaps one theme color to another post-highlight, without swapping the whole theme over a single token.

**1 — new constant**, after `CODE_THEME`:

```ts
/**
 * Tokyo Night's comment color (`#51597D`) is 3.00:1 against
 * `--color-code-bg` (`oklch(11% 0 0)`) — below the 4.5:1 AA floor for normal
 * text. Replaced with a lightened step along the same hue that clears 4.5:1
 * (`#747a97`, 4.86:1), rather than swapping the whole theme over one token.
 */
export const CODE_COLOR_REPLACEMENTS: Record<string, string> = {
  "#51597d": "#747a97",
}
```

**2 — `highlightCode`'s `codeToHtml` call:**

```ts
  const html = highlighter.codeToHtml(props.code, {
    colorReplacements: CODE_COLOR_REPLACEMENTS,
    lang: props.language,
    theme: CODE_THEME,
  })
```

Live re-scan of `/` in light mode after both fixes: 0 contrast failures, down from 480 (384 in the original F-066 baseline, plus the two newly-exposed ones above).

#### apps/www/src/components/ui/dialog.tsx

1 edit, beyond `apps/www/src/app/@auth/(.)auth/[pathname]/view.tsx` above — the installed `@base-ui/react@1.2.0` (checked its `dist/`, no `hideOthers`/`aria-hidden`/`inert` logic anywhere) sets neither `aria-modal` nor an inert background on any `DialogContent`, not just the auth one. Fixed at the primitive so every www dialog gets both (F-096's `aria-modal` gap, F-097):

```tsx
function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  React.useEffect(() => {
    const main = document.getElementById("main")
    main?.setAttribute("inert", "")
    return () => main?.removeAttribute("inert")
  }, [])

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        aria-modal="true"
        className={cn(
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 grid max-w-[calc(100%-2rem)] gap-6 rounded-xl p-6 text-sm ring-1 duration-100 sm:max-w-md fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none",
          className
        )}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button className="absolute top-4 right-4" size="icon-sm" variant="ghost" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}
```

The effect runs only while `DialogContent` is mounted, which only happens while the dialog is open (Base UI unmounts the Popup on close), so open/close timing stays correct without tracking state separately. `#main` is the site's `<main id="main">` landmark (step 4). Confirmed live: `aria-modal="true"` present, `document.getElementById("main").hasAttribute("inert")` is `true` while open, `false` after close.

#### apps/www/src/vexcms/blocks/Stats/index.tsx

1 edit (F-069). The `<dl>`'s per-stat `<div>` held `dd(value), dt(label), p(description)` — invalid twice over: a stray `<p>` sibling, and `dd` before `dt` (HTML requires `dt+ dd+`, name before description). Reordered to a valid group with the description as a second `dd`, using `order-*` so the flex-column's visual order (value, label, description) is unchanged:

```tsx
              <dt className="order-2 mt-3.5 text-[15px] font-semibold text-foreground">
                {stat.label}
              </dt>
              <dd
                className={cn(
                  "order-1 font-extrabold tracking-[-0.04em] tabular-nums text-foreground",
                  stat.value.length > LONG_VALUE_CHARS
                    ? "text-3xl md:text-4xl"
                    : "text-[40px] leading-none md:text-5xl xl:text-[56px]"
                )}
              >
                {stat.value}
              </dd>
              {stat.description ? (
                <dd className="order-3 mt-2 max-w-[30ch] text-[13.5px] leading-[1.55] text-muted-foreground">
                  {stat.description}
                </dd>
              ) : null}
```

Confirmed with a screenshot: the rendered cell is pixel-identical to before (number, then label, then description).

#### apps/www/src/vexcms/blocks/Roadmap/index.tsx

3 edits. F-068: the "shipped" group's item description was the only one of four status groups using `text-muted-foreground/80` (3.51:1 measured) instead of the full-opacity token every other group already uses — dropped the opacity. F-074: the filter `TabsTrigger`s had no `aria-controls`, and zero `role="tabpanel"` elements existed anywhere, even though Base UI's `Tabs` auto-assigns `role="tab"`. Because the "All" tab shows every status group simultaneously (not one exclusive panel), one shared `tabpanel` — labelled by whichever trigger is active — is the accurate model, not a panel per status.

**1 — the description span:**

```tsx
                          <span className="block text-[13px] leading-[1.5] text-muted-foreground">
```

**2 — `activeTriggerId`**, computed alongside `showFilter`:

```tsx
  const activeTriggerId = filter === "all" ? "roadmap-tab-all" : `roadmap-tab-${filter}`
```

**3 — the triggers and the panel container:**

```tsx
                <TabsTrigger
                  aria-controls="roadmap-panel"
                  className="rounded-sm px-3 py-[5px] text-[13px] font-medium"
                  id="roadmap-tab-all"
                  value="all"
                >
                  All {all.length}
                </TabsTrigger>
                {grouped.map((group) => (
                  <TabsTrigger
                    aria-controls="roadmap-panel"
                    className="rounded-sm px-3 py-[5px] text-[13px] font-medium"
                    id={`roadmap-tab-${group.status}`}
                    key={group.status}
                    value={group.status}
                  >
                    {GROUP_LABEL[group.status]} {group.entries.length}
                  </TabsTrigger>
                ))}
```

```tsx
        <div
          aria-labelledby={showFilter ? activeTriggerId : undefined}
          className="flex flex-col gap-11"
          id={showFilter ? "roadmap-panel" : undefined}
          role={showFilter ? "tabpanel" : undefined}
        >
```

Confirmed live: every `role="tab"`'s `aria-controls` resolves to a real `role="tabpanel"` labelled by the active trigger. A third Nu complaint on this same page — `aria-label` on a `role="presentation"` div — is `ScrollArea`'s viewport wrapping the `TabsList`, the same shared `packages/react/src/ui/scroll-area.tsx` primitive as F-081 (step 6's file, not touched here; reported as F-101).

#### apps/www/src/app/tour/TourContent.tsx

2 edits. F-084's console error, found live: Next's dev-mode "Image … detected as the Largest Contentful Paint … add the `loading="eager"` property" warning on `dashboard.png`, since none of the four screenshots carried `priority`. F-076 (reflow) did not reproduce live at 375/390 — Tailwind's Preflight (`img { max-width: 100%; height: auto }`) already shrinks the unconstrained `width={1280} height={800}` `<Image>` — but the explicit classes are added anyway, matching every other responsive image on the site rather than relying on the implicit rule.

**1 — wrap the body in `<main>`, give the first shot `priority`, and make every shot explicitly responsive:**

```tsx
export function TourContent() {
  return (
    <main id="main">
      <Container className="py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">See the admin panel</h1>
        <p className="mt-4 max-w-[46rem] text-muted-foreground">
          The live demo is temporarily unavailable. These screenshots show the same admin panel it
          runs.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {TOUR_SHOTS.map((shot, index) => (
            <figure key={shot.src}>
              <Image
                alt={shot.alt}
                className="h-auto w-full rounded-lg border"
                height={800}
                priority={index === 0}
                sizes="(min-width: 640px) 50vw, 100vw"
                src={shot.src}
                width={1280}
              />
              <figcaption className="mt-2 text-sm text-muted-foreground">{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className={cn(buttonVariants({ variant: "default" }))}
            href="https://docs.vexcms.dev/guides/quickstart/"
          >
            Read the quickstart
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="https://github.com/ianyimi/vex"
          >
            View on GitHub
          </Link>
        </div>
      </Container>
    </main>
  );
}
```

Confirmed live: 0 console errors/warnings on `/tour`; `<main id="main">` present.

#### apps/www/src/app/(frontend)/(site)/not-found.tsx

New file (F-075). Next's built-in fallback — used because no `not-found.tsx` existed anywhere — bypasses the app's root layout entirely: no `lang` on `<html>`, no skip link, no landmarks. This one inherits `(site)/layout.tsx`'s skip-link/`<main>`/header/footer for every `notFound()` call inside that group (unseeded `[slug]` paths, missing/unpublished posts, home before a `home` document exists).

```tsx
import type { Metadata } from "next"

import { NotFoundContent } from "./NotFoundContent"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * Renders inside `(site)/layout.tsx`'s skip-link/`<main>`/header/footer
 * chrome for every `notFound()` call within this group: an unseeded
 * `[slug]` path, a missing or unpublished post, or the home page before a
 * `home` document exists.
 */
export default function SiteNotFound() {
  return <NotFoundContent />
}
```

#### apps/www/src/app/(frontend)/(site)/NotFoundContent.tsx

New file. `Container` calls `cn()` from `@vexcms/react`'s client bundle, which cannot run in a Server Component — `not-found.tsx` has to stay a Server Component to keep its `metadata` export, so the body that renders `Container` is split out, exactly how `tour/page.tsx` + `TourContent.tsx` are split.

```tsx
"use client"

import Link from "next/link"

import { Container } from "~/components/Container"

/**
 * Body of `not-found.tsx`, split into its own client component because
 * `Container` calls `cn()` from `@vexcms/react`'s client bundle — a Server
 * Component (which `not-found.tsx` must stay, to keep its `metadata`
 * export) cannot call a client-only function. Same split as `app/tour/page.tsx`
 * + `TourContent.tsx`.
 */
export function NotFoundContent() {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mx-auto mt-4 max-w-[32rem] text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link className="mt-6 inline-block text-primary underline" href="/">
        Return to home
      </Link>
    </Container>
  )
}
```

#### apps/www/src/app/not-found.tsx

New file. Catches a genuinely unmatched multi-segment path (e.g. `/foo/bar`, which `(site)/[slug]`'s single dynamic segment can't match) — the one case the file above doesn't reach. Outside every route group, so it self-emits `<ThemeStyle />`, mirroring `app/unauthorized/page.tsx` and `app/tour/page.tsx`. No `cn()`/`Container` call, so no client split is needed here.

```tsx
import type { Metadata } from "next"
import Link from "next/link"

import { ThemeStyle } from "~/components/ThemeStyle"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * Root fallback for a request that matches no route segment at all (e.g. a
 * multi-segment path like `/foo/bar`, which the `(site)/[slug]` catch-all
 * can't match). Without this file Next falls back to its own built-in 404,
 * which bypasses the app's root layout entirely — no `lang` on `<html>`, no
 * landmark structure.
 *
 * Outside every route group, so it emits `<ThemeStyle />` itself — mirrors
 * `app/unauthorized/page.tsx` and `app/tour/page.tsx`.
 */
export default function NotFound() {
  return (
    <>
      <ThemeStyle />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-[32rem] text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link className="text-primary underline" href="/">
          Return to site
        </Link>
      </main>
    </>
  )
}
```

Confirmed live: `/a-page-that-does-not-exist` (single segment, `(site)/not-found.tsx`) and `/foo/bar/baz` (multi-segment, this file) both render `lang="en"`, a real `<h1>`, and `<main>`; the single-segment one also gets the skip link and header/footer from `(site)/layout.tsx`.

**New, unresolved residual, not fixed here.** Every `notFound()` render — on both new files above, and pre-existing on `/posts/vexcms-0-1-0`'s draft 404 — logs a non-fatal `console.error` ("Encountered a script tag while rendering React component…") from Next's own client bundle. It is not traceable to any literal `<script>` JSX in this app's source (`grep` across the likely candidates found nothing), never appears on a normal 200 route including `/unauthorized` (identical chrome-free structure, 200 status), and reproduces identically regardless of either not-found page's own content — ruling out a markup cause in either file. Recorded in `findings.md` F-075; needs a dedicated investigation, not a guess.

#### `@daveyplate/better-auth-ui` — two findings reclassified to `backlog.md`, not fixed

F-071 (icon-only password-visibility toggle, no accessible name) and F-072 ("button must not appear as a descendant of the `a` element" on the sign-in/sign-up switch link, plus a misplaced `<style>` on `/auth/sign-up`) were both scoped as `fix` in the baseline. Live DOM shows both are rendered entirely inside `node_modules/@daveyplate/better-auth-ui`'s own bundled components — the classes match the library's own shadcn-style `Button`/`Input`, not `~/components/ui/*` — and the package's exported `AuthViewProps`/`classNames` types expose no slot for either. No file in this repo owns the markup, so there is nothing to edit within the fix boundary; moved to `backlog.md` § `@daveyplate/better-auth-ui` unlabelled controls and invalid nesting.

**Every other block renderer — audited, no defect found**

Read against 1.3.1/2.4.6/4.1.2 (heading order), list/link markup, and `CodePane`:

- Heading order is consistent across every block: `Hero` is the page's one `<h1>` (its two variants are mutually exclusive — `variant: ["full" | "compact"]` — so a page never renders two); `SectionHeader` (`Features`, `HowItWorks`, `Split`, `CodeShowcase`) and `CTA`/`FAQ`/`Stats`/`Roadmap`'s own inline or `SectionHeader` headings are all `<h2>`; card-level headings (`Features`, `HowItWorks`) are `<h3>`; `Roadmap`'s per-status group heading is a `sr-only` `<h3>` nested under the block's `<h2>`. No skipped level anywhere. (`Stats` and `Roadmap` needed real fixes elsewhere — F-069, F-068, F-074, above — but not here.)
- Lists are real `<ul>`/`<ol>`/`<li>` throughout (`Footer`'s link/social lists, `HowItWorks`'s numbered rail, `Roadmap`'s grouped/chip lists, `Split`'s bullet list) — nothing is a `<div>` dressed as a list.
- Link purpose: `Footer`'s social links carry `aria-label={social.platform}` (including the unresolved-icon fallback, which renders the platform name as visible text instead); `Header`'s logo link carries `aria-label={logoText ?? "Home"}`; the mobile menu trigger carries `aria-label="Open menu"`.
- `CodePane` already pairs `<pre><code>`, same as the Plate static renderer's `CodeBlockElementStatic` — no change needed in either.

Anything beyond this — contrast, target size, forced-colors — is covered by the shared `focus-ring` utility (step 4) and the primitive-level fixes (step 5); nothing block-specific surfaced here. If the step-3/step-10 axe or Nu re-run surfaces something this reading missed, fix it within the same boundary (classes, attributes, markup, ≤30-line handlers) or move it to `backlog.md`.

**Font loading and the home page's LCP element**

`apps/www/src/app/layout.tsx`'s two `localFont()` calls (`geistSans`, `geistMono`) already set `display: "swap"` and never set `preload: false`, so `next/font/local`'s default (`preload: true`) applies — both fonts are already preloaded. No code change.

**The "LCP image priority on the home page" checklist item was a false assumption, confirmed and measured.** `apps/www/convex/seed.ts`'s `home` page document contains no `upload`-field value anywhere — the Hero block's own comment: *"No image, ever — a fresh scaffold has no media."* `MediaImage` is never called from the home page's block list.

The Hero's `<h1>` (`TextEffect as="h1" delay={0.08} per="word" stagger={0.04}`) was flagged as the real LCP candidate and a risk to the 2.5s budget, pending measurement. Measured: `npx lhci collect --collect.numberOfRuns=1` against every non-draft route on the running `:3030`. Result: `/` reports `largest-contentful-paint` of 17–21 **seconds** — but so do `/features`, `/roadmap`, `/privacy`, and `/accessibility`, none of which has a Hero block or any `TextEffect` at all, which rules out the Hero hypothesis directly. The same reports show `main-thread-tasks` fully idle after ~2s (nothing over 100ms), `cumulative-layout-shift` of `0`, and a short `server-response-time` (~400–850ms) — nothing in the trace accounts for a 17–21s gap before paint. `/brand`, `/auth/sign-in`, `/auth/sign-up`, and `/unauthorized` — routes untouched by this step's file edits — report normal LCP (0.9–2.6s). This is a dev-server/Lighthouse measurement artifact (most likely Next's on-demand route compilation or an HMR/WebSocket connection confusing Lighthouse's load-idle detection on routes this session's edits just invalidated), not a real content defect and not the Hero animation — no code change applied. Accessibility is 100 on every route except `/auth/sign-up` (94, F-071, already backlogged); best-practices and SEO are 100 everywhere except `/tour`'s SEO (66, the deliberate `noindex`, already accepted in F-084). Real performance budgets are checked on the Vercel preview (step 10), per the project's own caveat.

**`/posts/[slug]` — audited against the real, shipped code**

`apps/www/src/app/(frontend)/(site)/posts/[slug]/page.tsx` and `PostContent.tsx` had landed (public-presence step 14) by the time this step ran, mirroring `apps/test`'s tree exactly. Confirmed live at `/posts/vexcms-0-1-0` (draft, 404s to an anonymous visitor as expected) and `/posts/real-time-admin-and-live-preview` (published):

- `PostContent.tsx` renders exactly one `<h1>{post.title}</h1>`, inside `Container` — correct, matches the rest of the site's single-`h1`-per-page contract.
- `CodeBlockElementStatic` already renders `<pre><code>` (see above) — valid code-block markup, no change.
- `ImageElementStatic` defaults a missing `alt` to `""` (decorative). The editor's own insert/upload UI (`packages/richtext-plate/src/editor/components/image/ImageUpload.tsx`) already prompts for alt text and can require it per `altRequired`/the media collection's `alt` field — this is an editorial completeness question (did the author fill it in), not a renderer defect, so no code change here.
- **Structural finding, not in this step's boundary:** `getStaticComponents()` registers the same `HeadingElementStatic` for `h1`–`h6`, so an editor can insert a body-level "Heading 1" that duplicates the page's own `<h1>{post.title}</h1>`. Fixing this means deciding whether to cap the richtext toolbar's offered heading levels globally, per-field, or per-collection — a real design question, not a markup fix. Add to `backlog.md`:

  ```md
  ## Cap heading levels offered by the richtext toolbar

  **What.** `packages/richtext-plate`'s `getStaticComponents()` (and the
  matching editor-side toolbar) registers `HeadingElementStatic` for `h1`
  through `h6` uniformly. Every page that embeds a richtext field under its
  own page-level `<h1>` (`/posts/[slug]`'s `PostContent.tsx`: `<h1>{post.title}</h1>`
  then `<RichText content={post.body} />`) lets an editor pick "Heading 1"
  inside the body and duplicate that `<h1>`.

  **Why.** Two `<h1>`s on one page fails WCAG 1.3.1/2.4.6 heading-structure
  expectations and confuses screen-reader users navigating by heading.

  **Lift.** Unassessed. The toolbar option set lives in the shared editor
  package, consumed by every richtext field in every app (admin page bodies,
  posts, any future user collection) — capping it globally could be wrong for
  a field with no page-level heading of its own.

  **Why deferred.** Needs a design decision (global cap vs. a per-field
  `editor.headingLevels` option) rather than a markup fix; out of the
  quality-pass fix boundary (classes/attributes/markup only).

  **Detail.** `packages/richtext-plate/src/render/staticComponents.ts`;
  `apps/test/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx`.
  ```

- **Lighthouse budget note for the Plate bundle.** `PostContent.tsx` is `"use client"` (it needs `useLivePreviewQuery`), same as every other www page's `PageContent.tsx` — that is this site's established live-preview architecture, not a posts-specific defect. What is new on this one route is the size of what ships: `RichText`'s `createStaticEditor` pulls in `platejs/static` plus six `@platejs/*` plugin packages (`@platejs/basic-nodes`, `@platejs/code-block`, `@platejs/link`, `@platejs/list`, `@platejs/media`, `@platejs/table`), landing in the client bundle for the first time on `apps/www`. Once the route exists, run `lhci autorun` against it specifically (it is "one `/posts/[slug]` once one is published" per step 2's `lighthouserc.cjs` page list) and read the `total-blocking-time`/`bootup-time` diagnostics; if the Plate bundle is what trips the budget, that is a `backlog.md` entry (the fix is a real code-split, not a markup change), not a fix-boundary item.

Port whichever markup fixes land here into `apps/test`'s identical tree in step 12, as already planned.

Verify: `pnpm --filter www exec playwright test e2e/axe.e2e.ts` → `audit/www-axe.json`, 0 persistent violations across every `QUALITY_ROUTES` entry, light and dark (the only consistent one is F-071, backlogged; `/launch-week`/one post's dark-mode `color-contrast` is flaky timing, not a code defect — re-run clean); `node scripts/validate-html.mjs --app www` → `audit/www-nu.json`, 3 remaining errors, all vendor/shared-primitive (F-072 ×2 on `/auth/*`, F-101 on `/roadmap`'s `ScrollArea`, step 6's file); `pnpm --filter www exec playwright test e2e/widths.e2e.ts` → `audit/www-width-matrix.json`, 0 overflow at any width on any route (153/153, one transient navigation-timing failure on `/brand@1280` re-ran clean); `npx lhci collect --collect.numberOfRuns=1` against every non-draft route: `categories:accessibility` 100 except `/auth/sign-up` (94, F-071); `categories:best-practices`/`categories:seo` 100 except `/tour`'s SEO (66, deliberate `noindex`); `cumulative-layout-shift` 0 everywhere; `categories:performance`/`largest-contentful-paint`/`total-blocking-time` are dev-server noise (see above) and are re-checked on the Vercel preview, per step 10.

### Step 8 — Security, caching and preference headers on www [dev]

Why: configuration coverage from the brief. It's static, so it ships with the build and is verified on the real Vercel preview, CDN included.

`apps/www/next.config.ts` has no `headers()` today — just `devIndicators`, `allowedDevOrigins`, `reactCompiler`, `htmlLimitedBots`, `turbopack`, and `images.remotePatterns` (derived from `NEXT_PUBLIC_CONVEX_URL`'s hostname). Every browser-facing origin this app actually talks to was traced from real code, not assumed:

- **Convex**: `apps/www/src/components/providers/convex.tsx` opens `new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL)` — a direct browser WebSocket to `<deployment>.convex.cloud`. `apps/www/next.config.ts`'s own comment on `convexImageRemotePatterns` confirms file storage is served from that **same** `.convex.cloud` host, so `img-src` and `connect-src` need exactly one derived host, not two. `NEXT_PUBLIC_CONVEX_SITE_URL` (`.convex.site`) is read only server-side — `apps/www/src/auth/server.ts`'s `convexBetterAuthNextJs({ convexSiteUrl, convexUrl })` and `apps/www/src/lib/vex.ts`'s `createVexServerClient` — so the browser never needs a `.convex.site` CSP allowance. The proxy-attested auth rate limiting (`apps/www/src/proxy.ts`, `AUTH_PROXY_SECRET`, `withClientIpAttestation`) is a server-to-server hop (Next route → `.convex.site`) and reaches the browser as no new origin at all.
- **Better Auth**: `apps/www/src/auth/client.tsx`'s `createAuthClient({ basePath: "/api/auth", baseURL: env.NEXT_PUBLIC_SITE_URL, ... })` — same-origin. `connect-src 'self'` already covers it.
- **`script-src` is `'self' 'unsafe-inline'`, not a hash list.** A static hash-only policy was the original plan (hashing `ThemeScript`'s inline script, the one genuinely static inline script in this app — rendered once as `<ThemeScript />` with no props in `apps/www/src/app/layout.tsx`, always `storageKey = "vex-theme"`). **That plan does not survive contact with Next's App Router runtime — reported per P-023, not silently patched.** Checked against both `next dev`'s HTML and a real `pnpm --filter www build`'s prerendered `.next/server/app/index.html`: every route — static, ISR, or dynamic — also inlines Next's own RSC bootstrap, `self.__next_f.push([1,"<Flight payload>"])` (the serialized component tree; differs per route, per build, per live Convex data — `index.html` alone carries a 12.9 KB module-map push, a 7.8 KB push embedding the active theme's literal CSS custom properties, and a 47 KB `PageContent` push), and, on every dynamically-rendered route (`/admin`, `/api/auth/*`, `/posts/[slug]` — no `generateStaticParams`), a random-per-request `self.__next_r="<token>"` resume marker (confirmed: two `curl`s to `/` under `next dev` returned two different tokens). Neither is hashable — a hash only matches identical bytes, and these are never identical twice. Per Next's own CSP guide (`https://nextjs.org/docs/app/guides/content-security-policy`): nonces would make this hashable, but "require… all pages \[to] be dynamically rendered… Static optimization and Incremental Static Regeneration (ISR) are disabled… Pages cannot be cached by CDNs" — directly excluded by this task's own "no nonces" instruction and fatal to the `revalidate = 3600` ISR/CDN caching documented below; experimental Subresource Integrity (`experimental.sri`) signs external files, not inline content, and Next's own docs name "cannot handle dynamically generated scripts" as a limitation. The one option compatible with staying static/ISR is Next's own documented "Without Nonces" fallback: `script-src 'self' 'unsafe-inline'`. **A hash alongside `'unsafe-inline'` is not a safe combination to fall back on**: per CSP3, a browser that understands hash-sources drops `'unsafe-inline'` entirely once any hash-source is present in the same directive — adding one for `ThemeScript` would have blocked `__next_r`/`__next_f` outright and broken hydration on every route, in every modern browser. `ThemeScript` already runs under the shipped `'unsafe-inline'`, so no hash, no `buildThemeScript` export, and no `packages/react` edit — nothing would call it (code-rules.md: no speculative code with no caller). Full evidence in `findings.md` F-102.
- **Vercel Analytics / Speed Insights**: `apps/www/src/app/layout.tsx` renders `<Analytics />` (`@vercel/analytics/next`) and `<SpeedInsights sampleRate={SPEED_INSIGHTS_SAMPLE_RATE} />` (`@vercel/speed-insights/next`). On an actual Vercel deployment both inject a same-origin `/_vercel/insights/script.js` / `/_vercel/speed-insights/script.js` and beacon back to `/_vercel/insights/view` / `/_vercel/speed-insights/vitals` — `'self'` covers both. The `va.vercel-scripts.com` debug fallback only fires when there's no Vercel platform to serve the self-hosted route (local `next dev`), and the CSP is gated to production, so it needs no allowance.
- **Live preview**: `apps/www/src/vex.config.ts`'s `admin.livePreview.allowedOrigins` is `["http://localhost:3030", ...(NEXT_PUBLIC_SITE_URL ? [NEXT_PUBLIC_SITE_URL] : [])]` — but `packages/react/src/livePreview/LivePreviewContext.tsx` only reads that array to screen the **origin of incoming `postMessage` frames** (`allowedOrigins.includes(event.origin)`), not to pick the iframe's `src`. The iframe itself (`packages/react/src/livePreview/LivePreviewPanel.tsx:419`, `src={props.previewUrl}`) is pointed at whatever a collection's `livePreview.url` resolves to — `apps/www/src/vex.config.ts` resolves every one of them to a **relative, same-origin path** (`headers: { url: "/" }`; `siteSettings`'s `server` resolver returns `` `/${page.slug}` ``; `apps/www/src/vexcms/collections/pages.ts`'s `url: (doc) => resolvePagePath(doc.slug)`). Both the admin (iframe parent) and the previewed page (iframe content) are this same app, so `frame-src 'self'` and `frame-ancestors 'self'` cover it.
- **`blob:`/`data:`/`worker-src`**: none found. `packages/react/src/media/FilePreview.tsx` fetches an uploaded file's Convex-hosted URL via `vexConvexApi.media.getUrl` and renders a plain `<img src={mediaDoc.src}>` — no `URL.createObjectURL`, no `FileReader`, no `data:`-URI preview anywhere in `packages/react/src` or `apps/www/src`. No `next/image` `placeholder="blur"` usage either. No `Worker(` construction anywhere in `apps/www/src` or `packages/react/src`. So `worker-src 'none'` and no `blob:`/`data:` token on `img-src`.
- **Found while tracing `/posts/[slug]`'s Plate renderer: `apps/www/src/lib/highlightClient.ts`'s browser-side `createHighlighter()` needed a CSP allowance we weren't shipping.** With no `engine` option it defaults to shiki's Oniguruma engine — "the compiled Oniguruma WebAssembly" per shiki's own docs — and `WebAssembly.instantiate` needs `'wasm-unsafe-eval'` in `script-src`, which this policy does not carry. Fixed within the fix boundary instead of loosening the CSP: `engine: createJavaScriptRegexEngine()` (`shiki/engine/javascript`), which shiki's own docs recommend specifically "when running in the browser" and which covers all 4 of `CODE_LANGUAGES` (`bash`, `json`, `ts`, `tsx`). `apps/www/src/lib/highlight.ts` (server-side, Node) is unaffected and unchanged — no CSP applies there. Evidence in `findings.md` F-103.
- **`/brand` downloads, `/launch/*.mp4`**: both ship as static files under `apps/www/public/` (`/brand` landed this spec's own public-presence sibling; `/launch/*.mp4` not yet). `/brand`'s file links are plain `<a href>` downloads (navigation, no CSP directive, confirmed by `2026-11-06-public-presence/spec.md`'s own "Handoff to quality pass" table) and `/launch/*.mp4` is `<video>`/direct playback of a same-origin file, covered by `media-src 'self'`.
- **Third-party footer links** (Sponsors, Buy Me a Coffee, Buttondown, Discussions — `public-presence`): the same handoff table confirms every one is a plain `<a href>`, no CSP directive. The backlogged inline Buttondown form (`backlog.md` "Inline newsletter form (Buttondown)") would need `form-action https://buttondown.com` **if it ever ships** — it hasn't, so `form-action 'self'` is correct today.
- **Fonts**: `apps/www/src/app/layout.tsx` loads Geist via `next/font/local` (`geist/dist/fonts/...woff2`, bundled under `/_next/static/media/`) — same-origin, `font-src 'self'`.

**Caching — `findings.md`**

No `Cache-Control` override is needed in `headers()`. `apps/www/src/app/(frontend)/(site)/page.tsx` and `.../[slug]/page.tsx` both set `export const revalidate = 3600`; `.../admin/[[...path]]/page.tsx`, `api/auth/[...all]/route.ts`, and both `auth/[pathname]/page.tsx` routes set `export const dynamic = "force-dynamic"`. A real `pnpm --filter www build` confirms Next's own rendering-strategy-based `Cache-Control` defaults (cited below) are already correct for all of them — this is a documentation-only addition to the ledger, not a code change. `/posts/[slug]` also sets `revalidate = 3600` but has no `generateStaticParams`, so the build labels it dynamic rather than SSG — ISR still governs it once the first request per path renders and caches it.

- [x] `apps/www/src/lib/csp.ts`: `buildContentSecurityPolicy` builder
- [x] `apps/www/src/lib/csp.test.ts`: colocated unit test (exact expected CSP strings)
- [x] `apps/www/next.config.ts` `headers()` (lock: `apps/www/next.config.ts`): static CSP (script/style/img/font/connect/media/frame/worker-src, `frame-ancestors`, `base-uri`, `form-action`) + HSTS + `X-Content-Type-Options: nosniff` + `Referrer-Policy: strict-origin-when-cross-origin` + a minimal `Permissions-Policy`, all gated on `NODE_ENV === "production"`
- [x] `apps/www/src/lib/highlightClient.ts`: shiki's browser highlighter forced onto the JS regex engine, not its default WASM one
- [x] `.agent/docs/specs/2026-11-06-quality-pass/findings.md`: append the cache-headers documentation note, plus F-102 (the P-023 hash-only-`script-src` finding) and F-103 (the shiki WASM finding)
- [ ] `[dev]` Submit `vexcms.dev` at hstspreload.org once a production deployment confirms HSTS is served correctly (`sources.md` §7's preload-eligibility caveat) — only then does the shipped `preload` directive have an effect
- [ ] `[dev]` Push the branch; run `findings.md`'s "Step 8 preview check" against the Vercel preview (`curl -sI`, the browser console on every route including the live-preview iframe and `/admin`, the Analytics/Speed Insights dashboards, and `/launch/*.mp4` once it lands)

#### apps/www/src/lib/csp.ts

```ts
export interface ContentSecurityPolicyInput {
  /** `new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname`, or `""` when no deployment is configured. */
  convexHost: string;
  /** The `frame-ancestors` source list, e.g. `"'self'"`. */
  frameAncestors: string;
}

/**
 * Builds the static `Content-Security-Policy` header value for `apps/www`.
 *
 * `script-src` carries `'unsafe-inline'`, not a hash list: Next's App Router
 * inlines a fresh `self.__next_f.push(...)` Flight payload (and, on a
 * dynamically rendered route, a random `self.__next_r="..."` resume token)
 * into every single response — static, ISR, or dynamic — and neither can be
 * pinned by a finite set of `sha256` hashes (confirmed against both `next
 * dev`'s and a real `next build`'s HTML output; see `findings.md` F-102).
 * Next's own nonce mechanism would avoid `'unsafe-inline'`, but requires
 * every route to render dynamically, which would drop this app's ISR/CDN
 * caching entirely — out of scope here (the task itself asks for no nonces).
 *
 * @param props - Input props.
 * @returns The `;`-joined directive list.
 */
export function buildContentSecurityPolicy(props: ContentSecurityPolicyInput): string {
  const convexOrigin = props.convexHost ? ` https://${props.convexHost}` : "";
  const convexSocket = props.convexHost ? ` wss://${props.convexHost}` : "";

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self'${convexOrigin}`,
    `font-src 'self'`,
    `connect-src 'self'${convexOrigin}${convexSocket}`,
    `media-src 'self'`,
    `frame-src 'self'`,
    `frame-ancestors ${props.frameAncestors}`,
    `worker-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}
```

#### apps/www/src/lib/csp.test.ts

```ts
import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("includes the Convex host in img-src and connect-src (https + wss)", () => {
    const csp = buildContentSecurityPolicy({
      convexHost: "striped-raven-123.convex.cloud",
      frameAncestors: "'self'",
    });

    expect(csp).toBe(
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' https://striped-raven-123.convex.cloud; " +
        "font-src 'self'; " +
        "connect-src 'self' https://striped-raven-123.convex.cloud wss://striped-raven-123.convex.cloud; " +
        "media-src 'self'; " +
        "frame-src 'self'; " +
        "frame-ancestors 'self'; " +
        "worker-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
    );
  });

  it("omits the Convex origin from img-src and connect-src when no deployment is configured", () => {
    const csp = buildContentSecurityPolicy({
      convexHost: "",
      frameAncestors: "'self'",
    });

    expect(csp).toBe(
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self'; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "media-src 'self'; " +
        "frame-src 'self'; " +
        "frame-ancestors 'self'; " +
        "worker-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
    );
  });
});
```

#### apps/www/next.config.ts

3 edits. Everything else (`findWorkspaceRoot`, `workspaceSourceAliases`, the `turbopack`/`reactCompiler`/`htmlLimitedBots`/`devIndicators` fields) is unchanged.

**1 — imports.** Beside the existing `import { env } from "./src/env.mjs"`:

```ts
import { buildContentSecurityPolicy } from "./src/lib/csp"
```

**2 — `convexImageRemotePatterns` setup extended to also capture `convexHost`, and the security headers computed from it.** Replace the existing block:

```ts
let convexImageRemotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = []
let convexHost = ""
try {
  convexHost = new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname
  convexImageRemotePatterns = [{ hostname: convexHost }]
} catch {
  // No deployment yet — leave remotePatterns empty and the CSP's img-src/connect-src
  // without a Convex origin.
}

const isProduction = process.env.NODE_ENV === "production"

const securityHeaders: { key: string; value: string }[] = isProduction
  ? [
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy({ convexHost, frameAncestors: "'self'" }),
      },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
    ]
  : []
```

`isProduction` gates every header, not only the CSP: Vercel sets `NODE_ENV=production` for both the production domain and every preview deployment, so the preview's `curl -sI` still shows the full set; only `next dev` (`:3030`) skips them, which is also why `va.vercel-scripts.com` needs no `script-src` allowance. Proven directly: a throwaway stubbed-env test imported `next.config.ts` with `NODE_ENV=production` and with `NODE_ENV=development`, asserting `headers()` returns the 5-header set in the first case and `[]` in the second (deleted after use, per P-024's no-scaffolding rule — it was verification, not shipped code).

**3 — `headers()` added to `nextConfig`.** Beside the existing `images` field:

```ts
async headers() {
  return securityHeaders.length > 0 ? [{ source: "/:path*", headers: securityHeaders }] : []
},
```

#### apps/www/src/lib/highlightClient.ts

1 edit. Everything else is unchanged.

**1 — `createHighlighter` forced onto the JS regex engine.** Add the import and the `engine` option:

```ts
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
```

```ts
browserHighlighterPromise ??= createHighlighter({
  langs: [...CODE_LANGUAGES],
  themes: [CODE_THEME],
  engine: createJavaScriptRegexEngine(),
})
```

Also extend `highlightCodeInBrowser`'s JSDoc with the reason (shiki's default Oniguruma engine needs `'wasm-unsafe-eval'`, which this CSP doesn't carry; the JS engine needs neither that nor a larger CSP surface, and covers `CODE_LANGUAGES` without it).

#### .agent/docs/specs/2026-11-06-quality-pass/findings.md

Append after the findings table (created in step 3):

```markdown
## Step 8 — Security, caching and preference headers (2026-11-08)

`apps/www/next.config.ts` `headers()` now emits a static CSP, HSTS, `X-Content-Type-Options`,
`Referrer-Policy` and `Permissions-Policy`, gated on `NODE_ENV === "production"`. Shipped CSP:
`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' https://<convex-host>; font-src 'self'; connect-src 'self' https://<convex-host>
wss://<convex-host>; media-src 'self'; frame-src 'self'; frame-ancestors 'self'; worker-src
'none'; base-uri 'self'; form-action 'self'` (`<convex-host>` =
`new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname`).

| ID | Surface | Width / theme | Criterion / APG | Tool | Evidence | Disposition | Status |
|----|---------|----------------|------------------|------|----------|--------------|--------|
| F-102 | Every www route, static/ISR/dynamic alike | n/a | — (CSP configuration, not WCAG) | manual (`curl` against `next dev` + a real `next build`'s prerendered `.next/server/app/index.html`) | False spec assumption, reported per P-023: a hash-only `script-src` (`'self'` + a `sha256` hash for `ThemeScript`) is impossible — every response also inlines Next's App Router bootstrap (`self.__next_f.push([1,"<Flight payload>"])`, per-route/per-build/per-data; on dynamic routes also a random-per-request `self.__next_r="<token>"`), neither of which a finite hash list can pin. Nonces would make it hashable but force every page dynamic (Next's own CSP guide), killing this app's ISR/CDN caching and excluded by this task's own "no nonces" instruction; experimental SRI doesn't hash inline content and names "dynamically generated scripts" as an explicit limitation. Shipped Next's own documented no-nonce fallback instead: `script-src 'self' 'unsafe-inline'`, no hash (a hash alongside `'unsafe-inline'` would have made modern browsers drop `'unsafe-inline'` entirely per CSP3, breaking hydration everywhere) | n/a | n/a (false positive: the checklist's premise does not survive contact with Next's App Router runtime; resolved to Next's own documented no-nonce recommendation) |
| F-103 | `apps/www/src/lib/highlightClient.ts`'s `highlightCodeInBrowser` (live-preview code-pane highlighting only) | n/a | — (CSP configuration, not WCAG) | manual (code read + shiki's regex-engines docs) | `createHighlighter()` with no `engine` option defaults to shiki's Oniguruma/WASM engine, needing `'wasm-unsafe-eval'` in `script-src` — not in this CSP. Fixed: `engine: createJavaScriptRegexEngine()`, which covers all 4 `CODE_LANGUAGES` and avoids loading the WASM file in the browser at all. `highlight.ts` (server-side) is unaffected | fix | fixed (step 8) |

### Caching

`apps/www/next.config.ts` sets no `Cache-Control` override. A real `next build` confirms Next's
own rendering-strategy defaults (https://nextjs.org/docs/app/guides/cdn-caching) already cover
every route:

| Route(s) | Build output | `Cache-Control` Next sets |
|---|---|---|
| `/_next/static/*`, `next/font` output, `public/*` | — | `public, max-age=31536000, immutable` |
| `/` (`app/(frontend)/(site)/page.tsx`) | static, `revalidate 1h expire 1y` | `s-maxage=3600, stale-while-revalidate=31532400` |
| `/[slug]` — `/features`, `/roadmap`, `/brand`, +2 more | SSG (`generateStaticParams`), `revalidate 1h expire 1y` | `s-maxage=3600, stale-while-revalidate=31532400` |
| `/posts/[slug]` | has `revalidate = 3600` but no `generateStaticParams`, so the build labels it dynamic; the first request per path renders and caches it, then ISR governs it the same as the two rows above | `s-maxage=3600, stale-while-revalidate=31532400` once cached |
| `/admin/[[...path]]`, `/api/auth/[...all]`, `/api/vex/revalidate`, `/auth/[pathname]`, `(.)auth/[pathname]` — all `export const dynamic = "force-dynamic"` | dynamic | `private, no-cache, no-store, max-age=0, must-revalidate` |

The 3600s ISR window is a backstop, not the live-edit path: `apps/www/src/app/api/vex/revalidate/route.ts`
(`createVexRevalidateRoute`, `@vexcms/next/cache`) calls `revalidatePath` after every
admin-panel write, same-origin, session-authorized. On Vercel, on-demand revalidation propagates
to the platform's own Data Cache/Edge Network automatically
(https://vercel.com/docs/infrastructure/data-cache) — this app's only deployment target is
Vercel, so no separate CDN-purge call is needed. The 3600s window only matters for writes that
bypass that route entirely — a direct Convex dashboard edit, `npx convex import`.

### Step 8 preview check (run once a branch is pushed)

\`\`\`bash
curl -sI <preview-url>/                       # CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
curl -sI <preview-url>/admin
curl -sI <preview-url>/posts/<slug>            # once public-presence/launch-kit land it
curl -sI <preview-url>/brand
curl -sI http://localhost:3030/                # dev — same headers must be ABSENT
\`\`\`

Then in a browser against `<preview-url>`: open the console on `/`, `/admin` (signed-out demo),
and an edit view with live preview toggled on — zero CSP violation reports. Confirm the Web
Analytics and Speed Insights panels (Vercel dashboard) show events for the session. Once
`/launch/*.mp4` exists, play it and confirm no `media-src` violation.
```

Verify: `pnpm --filter www test` passes (includes `csp.test.ts`'s exact strings); `pnpm --filter www typecheck` and `pnpm --filter www lint` clean; after pushing the branch, run the `findings.md` "Step 8 preview check" above — `curl -sI <preview-url>` shows CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`; `curl -sI http://localhost:3030/` (dev) shows none of them; the browser console shows zero CSP violations on every route including the live-preview iframe, the `/admin` demo, `/posts/[slug]`, `/brand` downloads and `/launch/*.mp4` playback, with Web Analytics and Speed Insights reporting.

### Step 9 — Manual pass [dev]

Steps 2–8 close every automatable and tool-assisted gap; this step covers the WCAG 2.2 AA + 2.4.13 success criteria `sources.md` marks `manual` (31 rows) or `partial` (13 rows) — the ones no `axe-core`/Lighthouse/Nu rule can verify, because they need a human judging meaning, a real keyboard working a whole flow end to end, a real screen reader, or a real browser zoom. `manual-checklist.md` is generated once (this step's `[agent]` work), then the developer runs every `human` row and records the result; the agent pre-runs every `agent` row with the `browser` tool first so the developer's pass starts from a smaller, correct list. Any row that doesn't pass gets a `findings.md` row and a boundary-respecting fix, re-verified by re-running that exact row.

- [ ] `manual-checklist.md` generated from `sources.md`'s manual/partial rows × the inventory
- [ ] Keyboard-only through every flow (sign in, create/edit/publish, media upload, list filters/saved views, live preview, www navigation)
- [ ] VoiceOver on macOS Safari and iOS Safari
- [ ] 200% zoom, and reflow at 320 CSS px
- [ ] Contrast in light, dark and a database theme
- [ ] Fix the new findings within the boundary; structural → `backlog.md`

#### .agent/docs/specs/2026-11-06-quality-pass/manual-checklist.md

```markdown
# Manual Pass Checklist — Quality Pass (Step 9)

Every row here tests one WCAG 2.2 success criterion `sources.md` marks `manual` or `partial`,
against one inventory surface, by a procedure no automated tool in this pass (axe, Lighthouse,
Nu, jsx-a11y) can run. `auto`-method criteria from `sources.md` are NOT repeated here — steps
2–8's tooling already covers them continuously.

## Columns

`ID` — sequential `M-001…`, stable once assigned (never renumbered after a row is added).
`Criterion` — the `sources.md` §1 number(s) this row tests (comma-separated when one procedure
naturally covers more than one, e.g. a screen-reader pass).
`Surface` — the `inventory.md` route/view/component this row exercises; `site-wide` for
criteria about cross-page consistency.
`Procedure` — exact steps. Prefixed `Agent (browser tool):` or `Human:` — see Pre-run.
`Expected` — the pass condition.
`Pre-run` — `agent`: the step-9 agent pass executes this row with the `browser` tool and fills
`Result` before handoff. `human`: the developer runs it; VoiceOver, real browser zoom, and
keyboard-flow sign-off cannot be driven by the `browser` tool's synthetic input, so every such
row is `human`.
`Result` — `pass` | `N/A — <reason>` (criterion doesn't apply to this surface, reason citable
from code) | `PENDING` (not yet run) | `→ F-xxx` (failed; see `findings.md`).

## Generation procedure (how this file was built, and how to extend it when `inventory.md` grows)

1. Take `sources.md` §1's two tables (main + the 2.4.13 AAA addendum). Filter to `Test method`
   ∈ {`manual`, `partial`}: 31 `manual` + 13 `partial` = 44 criteria.
2. Classify each criterion into one of these applicability buckets, which decides its surface
   set:
   - **Flow-level** (2.1.1, 2.1.2, 2.4.3, 3.2.1, 3.2.2) → § A, one pass per named user flow, not
     per route — a flow crosses many routes/views and the criterion is about the flow's own
     order/trap behavior, not any single page's.
   - **Assistive-tech-level** (1.1.1, 1.3.1, 2.4.4, 2.4.6, 3.3.1, 4.1.3) → § B, the same flows,
     under a real screen reader, since AT exposes name/role/relationship bugs axe's simulated
     DOM read misses.
   - **Scale-level** (1.4.4, 1.4.10, 1.4.12) → § C, one row per distinct page/view template
     (not every near-identical seeded route) plus one bulk agent pre-check.
   - **Theme-level** (1.4.1, plus 1.4.3/1.4.11 re-checked outside the light/dark pair steps 6–7
     already ran) → § D.
   - **Everything else** (media, timing, motion, pointer, consistency, forms/auth — the
     remaining 20 criteria) → § E, one row per criterion against whichever inventory surface
     actually has that trigger condition (a criterion with no matching surface gets one
     `N/A` row citing why, not a silently dropped row).
3. One row per (criterion-group, surface) pair. `ID`s assigned in file order, section A → E.
4. When `inventory.md` adds a surface this file doesn't have a row for in a bucket above
   (new admin view, new UI primitive, new www page template), add rows using the same
   bucket/procedure pattern and continue the `ID` sequence — never renumber existing rows.
5. Re-run: after a step-9 fix lands, re-run only the specific row(s) it touched and flip
   `Result` to `pass`; don't re-run the whole file.

## A. Keyboard-only — every flow

2.1.1/2.1.2 (operability + no trap) are `agent` pre-run: the `browser` tool already drives a
keyboard-only pass in step 3's primitive sweep; this re-runs it at the FLOW level (multi-step,
multi-view journeys, not one widget). 2.4.3/3.2.1/3.2.2 need a human judging whether tab order
"preserves meaning" and whether a context change was "unexpected" — `human`.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-001 | 2.1.1, 2.1.2 | Sign in (`@auth/(.)auth/[pathname]/view.tsx` dialog + `/auth/sign-in` fallback) | Agent: Tab-only from the trigger link through email, password, submit, sign-up link; `Escape` closes the dialog | Every control reachable and activatable by keyboard alone; `Escape` closes with no trap | agent | PENDING |
| M-002 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm tab order matches the visual top-to-bottom layout; focusing a field never navigates away; submitting never changes context without the "Sign in" activation | Order matches layout; no focus/input-triggered context change | human | PENDING |
| M-003 | 2.1.1, 2.1.2 | Create/edit/publish (`CollectionEditView.tsx` sticky actions, actions menu, unsaved-changes dialog, status badge, publish) | Agent: Tab-only create a document, fill required fields, open the actions menu, trigger publish, confirm the unsaved-changes dialog if it appears | All reachable by keyboard; the unsaved-changes dialog doesn't trap and returns focus to its invoker on close | agent | PENDING |
| M-004 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order through sticky header → actions menu → status badge → form fields matches the visual layout; changing the status `Select` never silently publishes | Order matches layout; no surprise state change on focus/input | human | PENDING |
| M-005 | 2.1.1, 2.1.2 | Media upload (`MediaUploadForm.tsx`, `fields/upload/EmptyInput.tsx`) | Agent: Tab-only to the "Browse files" button (the non-drag alternative), trigger the OS picker stand-in, Tab to the staged-file list and submit | Upload completes with zero pointer/drag input; no trap in the staged-file list | agent | PENDING |
| M-006 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order through staged-file rows → remove buttons → submit matches the visual list; focusing a staged row never starts the upload | Order matches layout; no unexpected trigger on focus | human | PENDING |
| M-007 | 2.1.1, 2.1.2 | List filters/saved views (`ListViewLayout.tsx` toolbar, filter builder, saved-view tabs, row/bulk actions, peek) | Agent: Tab-only open the filter builder, add one filter, switch a saved-view tab with arrow keys (APG tabs), open a row's peek panel, `Escape` closes it | All reachable; peek's `Escape` returns focus to its row trigger, no trap | agent | PENDING |
| M-008 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm order toolbar → filter builder → saved-view tabs → table → bulk actions matches layout; selecting a saved view never silently discards an unsaved filter edit | Order matches layout; no unannounced data loss on focus/input | human | PENDING |
| M-009 | 2.1.1, 2.1.2 | Live preview (edit view's live-preview panel/iframe) | Agent: Tab from the last form field into the preview panel's own controls (refresh, open-in-new-tab); confirm Tab does not get caught inside the iframe | Panel controls reachable; Tab exits the iframe region like any other content | agent | PENDING |
| M-010 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm the preview iframe never steals focus from the field being edited; order is form fields then preview controls, not interleaved | Order matches layout; focus stays with the editor until the user tabs to preview | human | PENDING |
| M-011 | 2.1.1, 2.1.2 | www navigation (header nav, mobile menu toggle, footer) | Agent: Tab from the skip link through header nav, the mobile-menu toggle (at a narrow viewport), and the footer; `Enter` activates each link | Every nav control reachable/activatable; opening the mobile menu doesn't trap Tab inside it | agent | PENDING |
| M-012 | 2.4.3, 3.2.1, 3.2.2 | same | Human: confirm nav order matches the visual order at both desktop and the collapsed/mobile breakpoint; opening the mobile menu doesn't jump focus unexpectedly | Order matches layout at every width; no surprise context change | human | PENDING |

## B. Screen reader — VoiceOver (macOS Safari + iOS Safari)

`human` throughout — the harness has no AT driver; a screen reader must be heard, not just
measured. Same six flows as § A, each run once per platform. `Criterion` lists only the
manual/partial criteria that pass/fail under a screen reader (1.1.1, 1.3.1, 2.4.4, 2.4.6, 3.3.1,
4.1.3); `4.1.2` Name/Role/Value is `auto` (axe, steps 2–8) and isn't re-listed here, though a
VoiceOver pass will surface anything axe's simulated DOM read missed — log that as a normal
finding against 4.1.2 if it happens.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-013 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Sign in — macOS Safari | Human: VoiceOver on, navigate by heading/form-field rotor through the sign-in form, submit with a deliberately wrong password | Fields announce their label + any error; the error is announced via `4.1.3` live region without moving focus | human | PENDING |
| M-014 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Sign in — iOS Safari | Human: same, with VoiceOver's iOS rotor/swipe navigation | Same as M-013 | human | PENDING |
| M-015 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Create/edit/publish — macOS Safari | Human: VoiceOver through create → fill with one invalid field → publish | Field errors and the publish/save status are announced; headings/labels read correctly | human | PENDING |
| M-016 | 1.3.1, 2.4.6, 3.3.1, 4.1.3 | Create/edit/publish — iOS Safari | Human: same, iOS VoiceOver | Same as M-015 | human | PENDING |
| M-017 | 1.1.1, 2.4.6, 3.3.1, 4.1.3 | Media upload — macOS Safari | Human: VoiceOver through drag-free upload (M-005's keyboard path), including one rejected (wrong MIME) file | Upload progress/errors announced; thumbnails/alt text read meaningfully, not filenames alone | human | PENDING |
| M-018 | 1.1.1, 2.4.6, 3.3.1, 4.1.3 | Media upload — iOS Safari | Human: same, iOS VoiceOver | Same as M-017 | human | PENDING |
| M-019 | 1.3.1, 2.4.6, 4.1.3 | List filters/saved views — macOS Safari | Human: VoiceOver through adding a filter and switching a saved-view tab | Filter builder and tabs announce state (`aria-selected`, applied-filter count) via `4.1.3`/structure | human | PENDING |
| M-020 | 1.3.1, 2.4.6, 4.1.3 | List filters/saved views — iOS Safari | Human: same, iOS VoiceOver | Same as M-019 | human | PENDING |
| M-021 | 2.4.6, 4.1.3 | Live preview — macOS Safari | Human: VoiceOver while editing a field and watching the preview panel refresh | Refresh/loading state is announced without moving focus into the iframe | human | PENDING |
| M-022 | 2.4.6, 4.1.3 | Live preview — iOS Safari | Human: same, iOS VoiceOver | Same as M-021 | human | PENDING |
| M-023 | 1.1.1, 2.4.4, 2.4.6 | www navigation — macOS Safari | Human: VoiceOver through header nav, a block with images, and the footer | Images announce meaningful alt text (or are silent if decorative); every link's purpose is clear from its own text | human | PENDING |
| M-024 | 1.1.1, 2.4.4, 2.4.6 | www navigation — iOS Safari | Human: same, iOS VoiceOver | Same as M-023 | human | PENDING |

## C. 200% zoom & reflow at 320 CSS px

320 CSS px is NOT in `QUALITY_WIDTHS` (375/390/640/767/768/769/1024/1280/1536 — the contract's
automated width matrix), so 1.4.10 at 320 has zero automated coverage; 1.4.4 (real browser text
zoom) and 1.4.12 (text-spacing override) are not Playwright-measurable at all. One agent
pre-check extends the 320px overflow scan; the real 200%-zoom + reflow judgment is `human`.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-025 | 1.4.10 | All `QUALITY_ROUTES` + admin views (bulk) | Agent: `browser` tool, viewport width 320 CSS px, every route/view in `inventory.md`; check `document.documentElement.scrollWidth` vs `innerWidth` and look for offscreen controls, same technique as `apps/www/e2e/widths.e2e.ts`/`apps/test/e2e/adminWidths.e2e.ts` | No horizontal scroll, no offscreen control, except the `DataTable`'s declared scroll region | agent | PENDING |
| M-026 | 1.4.4, 1.4.10, 1.4.12 | www marketing pages (home, `/roadmap`, `/privacy`, `/brand`, `/accessibility`, `/launch-week`) | Human: browser zoom to 200%; then reset and apply a text-spacing bookmarklet (line-height 1.5×, paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em) | No content/functionality lost at 200%; single-column reflow at 320px with no 2-D scroll; text-spacing override causes no clipped/overlapping text | human | PENDING |
| M-027 | 1.4.4, 1.4.10, 1.4.12 | `/posts/[slug]` (announcement + 4 launch-week posts, Plate static renderer) | Human: same as M-026 | Same as M-026, including code blocks/embeds | human | PENDING |
| M-028 | 1.4.4, 1.4.10, 1.4.12 | www auth (`/auth/sign-in` dialog + fallback) | Human: same as M-026 | Same as M-026; the dialog itself reflows, not just the page behind it | human | PENDING |
| M-029 | 1.4.4, 1.4.10, 1.4.12 | www 404 / `/unauthorized` | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-030 | 1.4.4, 1.4.10, 1.4.12 | `/tour` (static, `next/image` screenshots) | Human: same as M-026 | Same as M-026; screenshots don't force horizontal scroll | human | PENDING |
| M-031 | 1.4.4, 1.4.10, 1.4.12 | Admin list view | Human: same as M-026 | Same as M-026, except the `DataTable`'s own declared horizontal scroll region | human | PENDING |
| M-032 | 1.4.4, 1.4.10, 1.4.12 | Admin edit view (incl. live-preview panel) | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-033 | 1.4.4, 1.4.10, 1.4.12 | Admin media (list/edit/upload, `MediaLibraryGrid`) | Human: same as M-026 | Same as M-026; grid reflows to fewer columns, not horizontal scroll | human | PENDING |
| M-034 | 1.4.4, 1.4.10, 1.4.12 | Admin globals, dashboard, modals | Human: same as M-026 | Same as M-026 | human | PENDING |
| M-035 | 1.4.4, 1.4.10, 1.4.12 | Admin `error.tsx` boundary | Human: same as M-026 | Same as M-026 | human | PENDING |

## D. Contrast — light, dark, database theme

1.4.3/1.4.11 already run continuously in light+dark via `QUALITY_THEMES` in steps 6–7's
Playwright axe (`color-contrast` rule) — not repeated here. `ThemeStyle` (`apps/www/src/components/ThemeStyle.tsx`)
applies the active database theme document-wide by default (the admin's `adminTheme` opts out at
`:root:root`), and database themes aren't in `QUALITY_THEMES`, so every row below is the
residual: one seeded non-default database theme, plus 1.4.1 (Use of Color), which contrast
tooling can't judge at all.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-036 | 1.4.3, 1.4.11 | www home, under a seeded non-default theme | Human: set `siteSettings.activeTheme` to a seeded non-default palette, re-check text and UI-component contrast with devtools' contrast checker | ≥4.5:1 text / ≥3:1 large text and UI boundaries, same as the default theme | human | PENDING |
| M-037 | 1.4.3, 1.4.11 | One www marketing page (e.g. `/roadmap`) under the same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-038 | 1.4.3, 1.4.11 | Admin list view, same theme (no `adminTheme` override) | Human: same as M-036 | Same as M-036, including `DataTable` row/selection states | human | PENDING |
| M-039 | 1.4.3, 1.4.11 | Admin edit view, same theme | Human: same as M-036 | Same as M-036, including status badge and sticky header | human | PENDING |
| M-040 | 1.4.3, 1.4.11 | Admin media views, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-041 | 1.4.3, 1.4.11 | Admin globals/dashboard, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-042 | 1.4.3, 1.4.11 | Admin modals (create/publish/upload), same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-043 | 1.4.3, 1.4.11 | `AdminTopNav` breadcrumb overflow, same theme | Human: same as M-036 | Same as M-036 | human | PENDING |
| M-044 | 1.4.1 | www (status/required-field indicators, error states) + admin (status badges, version-diff view) | Human: identify every place state/meaning is conveyed, confirm each also has a non-color cue (icon, text, pattern) | No state/meaning relies on color alone | human | PENDING |

## E. Remaining manual criteria — content, timing, pointer, motion, consistency, forms

Every other `sources.md` manual/partial row, against the surface that actually has its trigger
condition. A row is `N/A` when the code already shows the trigger doesn't exist — cited by file
— rather than left `PENDING` for a human to rediscover the same absence.

| ID | Criterion | Surface | Procedure | Expected | Pre-run | Result |
|---|---|---|---|---|---|---|
| M-045 | 1.2.1 | `/launch/*.mp4` (launch-week video) | N/A until `2026-11-06-launch-kit-final-review` lands the route; audit on arrival per `inventory.md`'s "owning spec step" convention | Transcript or audio-track alternative present once the video ships | agent | N/A — pending launch-kit-final-review |
| M-046 | 1.2.2 | same | same | Captions present once the video ships | agent | N/A — pending launch-kit-final-review |
| M-047 | 1.2.3 | same | same | Audio description or full text alternative once the video ships | agent | N/A — pending launch-kit-final-review |
| M-048 | 1.2.4 | site-wide | Agent: confirm no live synchronized media exists anywhere in `inventory.md` | N/A, no live media | agent | N/A — no live media surface |
| M-049 | 1.2.5 | `/launch/*.mp4` | Same as M-047 | Audio description present once the video ships | agent | N/A — pending launch-kit-final-review |
| M-050 | 1.4.2 | `/launch/*.mp4` | Human: confirm the player exposes pause/stop/volume independent of system volume if it autoplays with audio, once the video ships | Control present if autoplay-with-audio, else N/A | human | N/A — pending launch-kit-final-review |
| M-051 | 1.3.2 | www page templates (marketing, post) | Human: compare DOM/reading order (devtools, no CSS) against the rendered visual order | DOM order matches meaningful visual order | human | PENDING |
| M-052 | 1.3.2 | Admin list/edit views | Human: same, for the toolbar/table and the form/sidebar split | DOM order matches meaningful visual order | human | PENDING |
| M-053 | 1.3.3 | www content (instructions, CTAs) | Human: read every instruction/CTA for shape/color/position-only references ("click the green button", "see the box on the right") | None found, or each has a text alternative | human | PENDING |
| M-054 | 1.3.3 | Admin UI copy (toasts, empty states, help text) | Human: same | Same as M-053 | human | PENDING |
| M-055 | 1.3.4 | Both apps, mobile viewport | Human: rotate a mobile device/emulator portrait↔landscape on a representative www page and an admin edit view | No orientation lock; content usable in both | human | PENDING |
| M-056 | 1.4.5 | www marketing images (hero, blocks) | Human: inspect every marketing image for baked-in text that isn't a logo | No images-of-text except the logo | human | PENDING |
| M-057 | 1.4.13 | `Tooltip` (`packages/react/src/ui/tooltip.tsx`), both apps | Human: trigger a tooltip by hover and by focus; try to move the pointer onto the tooltip itself; press `Escape` | Dismissable (`Escape`), hoverable, persists until dismissed/invalid; focus-triggered tooltips behave the same as hover-triggered | human | PENDING |
| M-058 | 2.2.1 | Better Auth session (`apps/www/convex/auth/options.ts` `emailAndPassword`) | Human: let a session approach its expiry; confirm a warning/extend mechanism, or that re-authentication is a simple sign-in (no data loss) | Timing is adjustable/extendable, or expiry causes no silent data loss | human | PENDING |
| M-059 | 2.2.2 | `TextEffect`/`AnimatedGroup` (`apps/www/src/components/motion-primitives/`, `reveal.module.css`) | Human: with `prefers-reduced-motion` OFF (OS default), confirm the entrance animation has a way to pause/stop it, independent of the step-4 `prefers-reduced-motion` branch | A pause/stop/hide mechanism exists, or the animation is ≤5s and one-shot (2.2.2's documented exception) | human | PENDING |
| M-060 | 2.3.1 | Loading spinners, skeleton pulses, toast animations | Human: visually review every repeating animation for flash rate | Nothing flashes >3×/second | human | PENDING |
| M-061 | 2.4.5 | www, site-wide | Human: confirm at least two of {nav, search, sitemap} exist to reach any given page | ≥2 ways to locate a page, except process steps | human | PENDING |
| M-062 | 2.4.11 | www sticky header + admin `AdminTopNav` (`packages/react/src/admin/AdminTopNav.tsx:413` `sticky top-0`), `DataTableHeader.tsx:76` sticky `<thead>`, `MediaCollectionEditView.tsx:185` sticky form header | Human: Tab to a control that scrolls under each sticky element; confirm it isn't entirely hidden | Focused component never fully hidden by sticky content | human | PENDING |
| M-063 | 2.4.11 | Edit-view sticky sidebar (`CollectionEditView.tsx`, `GlobalEditView.tsx` `@3xl/form:sticky`) | Human: same, for the sidebar at the `3xl` container breakpoint | Same as M-062 | human | PENDING |
| M-064 | 2.1.4 | Sidebar toggle (`packages/react/src/ui/sidebar.tsx:58` `SIDEBAR_KEYBOARD_SHORTCUT = "b"`, used only with `event.metaKey \|\| event.ctrlKey`) | Agent: confirm (already visible in code) no shortcut fires on an unmodified single character anywhere in `packages/react` or `apps/www` | N/A — every shortcut found requires a modifier, outside 2.1.4's scope | agent | N/A — only modifier-combined shortcuts exist (`sidebar.tsx:58`) |
| M-065 | 2.5.1 | `ResizablePanel`/`ResizableHandle` (`packages/react/src/ui/resizable.tsx`), `DataTable` column resize (`DataTableHeader.tsx`'s grip) | Human: confirm resizing is not the ONLY way to reach any layout — i.e. resizing is a convenience, not essential path-based input | Path-based drag has no essential function gated behind it alone, or a single-pointer alternative (double-click-to-reset, keyboard resize) exists | human | PENDING |
| M-066 | 2.5.2 | Destructive buttons (delete, publish, confirm dialogs) | Human: press-and-hold then drag off before releasing on each destructive control | Action fires on up-event inside the control, not on down-event; moving off before release aborts it | human | PENDING |
| M-067 | 2.5.4 | Both apps | Agent: confirm (already visible in code) no `devicemotion`/`deviceorientation` listener exists anywhere in `apps/www` or `packages/react` | N/A — no motion-actuated function exists | agent | N/A — no device-motion feature in the codebase |
| M-068 | 2.5.7 | Media upload drag-drop (`MediaUploadForm.tsx:324`, `fields/upload/EmptyInput.tsx:48` `dataTransfer.files`) | Human: confirm the "Browse files" button (keyboard path from M-005) performs the identical upload with zero dragging | Non-drag alternative exists and is equivalent | human | PENDING |
| M-069 | 2.5.7 | `ResizablePanel`/`DataTable` column resize (same files as M-065) | Human: confirm a non-drag way to resize (keyboard arrows on the focused handle, or double-click-to-reset) | Single-pointer, non-dragging alternative exists, or resizing is cosmetic only (not required to use the feature) | human | PENDING |
| M-070 | 3.1.2 | Richtext code blocks + technical terms (www posts, admin richtext field) | Human: check code blocks/non-English passages for `lang`, excluding proper names/technical terms | `lang` set on passages in a different language than the page default | human | PENDING |
| M-071 | 3.2.3 | www header/footer nav, across every route | Human: compare nav markup/order between home, a marketing page, and a post page | Identical relative order everywhere nav repeats | human | PENDING |
| M-072 | 3.2.4 | Icon-only buttons (both apps) | Human: compare the accessible name of visually-identical icon buttons (e.g. every "close" `X`) across surfaces | Same function → same accessible name everywhere | human | PENDING |
| M-073 | 3.2.6 | Help/support links (admin footer, www footer, docs links) | Human: confirm any help mechanism occupies the same relative position on every page where present | Consistent position | human | PENDING |
| M-074 | 3.3.3 | Admin field validation (`fields/number/Field.tsx` step/min/max, required-field errors) | Human: trigger each validation error and read the suggestion text | A concrete correction is suggested, not just "invalid" | human | PENDING |
| M-075 | 3.3.4 | Admin delete/publish confirmation dialogs | Human: attempt delete/publish, confirm a reversible/confirmable step exists before it finalizes | Confirmation or undo path exists for data-modifying actions | human | PENDING |
| M-076 | 3.3.7 | Admin forms re-entered after a validation failure, sign-in after a failed attempt | Human: trigger a validation failure, resubmit; confirm prior field values aren't cleared | No re-entry of already-provided information required | human | PENDING |
| M-077 | 3.3.8 | `/auth/sign-in` (`apps/www/convex/auth/options.ts:37` `emailAndPassword`) | Human: confirm sign-in accepts password-manager autofill/paste, and needs no puzzle/transcription/memory task | No cognitive-function-test requirement; paste/autofill unblocked | human | PENDING |

## Fix loop

1. After each row above runs, any `Result` other than `pass` or `N/A` gets one new row in
   `findings.md` (next sequential `F-xxx`), with `Tool` = `manual` or the AT/browser used, and
   `Evidence` = a screenshot or the exact observed behavior.
2. Disposition `fix` (within the shared fix boundary — classes, attributes, markup, small
   keyboard/focus handlers ≤ ~30 lines, no public API change): fix it, re-run ONLY that
   checklist row, flip its `Result` to `pass`, flip the `findings.md` row's `Status` to
   `fixed (step 9)`.
3. Disposition `backlog` (bigger than the boundary): leave the checklist row's `Result` as
   `→ F-xxx`, set `Status` to `backlogged`; step 14 copies it into `backlog.md` with this row's
   evidence.
4. Repeat until every row is `pass`, `N/A`, or linked to a `backlogged` finding — none left
   `PENDING`.
```

Verify: every row of `manual-checklist.md` is `pass`, a cited `N/A`, or links a `findings.md` `F-xxx` row — none left `PENDING`; every `F-xxx` opened from this pass is `fixed (step 9)` and re-verified by re-running its exact row, or `backlogged` with evidence carried into `backlog.md` at step 14.

### Step 10 — CI gates [agent]

This step flips every tool installed reporting-only in step 2 into a real gate, now that steps 4–9 leave each one green. `.github/workflows/quality.yml` is new and listens for `deployment_status`, filtering to the moment Vercel's GitHub integration marks the `www` project's Preview deployment `success`; it then runs the Playwright axe suite and Lighthouse CI against that deployment's real URL, through the Vercel protection-bypass header. The jsx-a11y block in all three `eslint.config.mjs` files (root, `apps/www`, `apps/test` — the plugin is wired into every one of them, not just root) and `apps/www/lighthouserc.cjs`'s assertions move from `warn` to `error`. GitHub always loads a `deployment_status`-triggered workflow from the **default branch's** copy of the file (unlike `pull_request`, which uses the PR branch's copy), so these checks only take effect on PRs opened *after* this change reaches `master`.

Flipping jsx-a11y to `error` makes every remaining warning a lint failure, so every one had to be resolved first: 37 across the three configs were tool false positives (nesting/render-prop/test-mock patterns the rule's static heuristics can't see through, or the deprecated `label-has-for` double-firing next to `label-has-associated-control`) or already-backlogged structural gaps (richtext editor mouse-only interactions, `backlog.md` § Richtext editor keyboard parity) — each gets one `// eslint-disable-next-line` (or `{/* eslint-disable-next-line */}` inside JSX children) at its exact line, no blanket rule-offs beyond the one genuinely dead rule. Flipping `apps/www`/`apps/test` also exposed a pre-existing config bug unrelated to jsx-a11y: their typed-lint block has no `ignores` for colocated `*.test.ts(x)` files (unlike root's, which already excludes them), so `@typescript-eslint/parser`'s `project` check throws a hard parse error on every test file — the reason `apps/www`/`apps/test` `eslint .` was never actually run in CI. Fixed with `tseslint.configs.disableTypeChecked`, scoped to test files, as the config array's last entry (array order decides which block's `parserOptions`/rule overrides win for a file).

`apps/www/e2e/axe.e2e.ts` (step 2) collected every route's axe violations into the committed JSON but never asserted on them — `playwright test e2e/axe.e2e.ts` always exited 0 regardless of real violations, so the `quality / axe` job as first wired could never fail. Fixed with one `expect(axeResults.violations, …).toEqual([])` per route/theme test, independent of the existing `afterAll` JSON write (each `test()` is independent, so one route failing doesn't stop the others from running or from being recorded).

Two real, pre-existing violations surfaced by the flip — `/auth/sign-up`'s icon-only password-visibility toggle (F-071, no accessible name) and the sign-in/sign-up footer's `<a><button>…</button></a>` nesting (F-072) — were both inside `@daveyplate/better-auth-ui`'s bundled, un-slotted markup, confirmed by reading the installed `dist/index.js`. Fixed with a `pnpm patch` on that compiled file (same mechanism the repo already uses for `@convex-dev/better-auth`): one `aria-label` added to the toggle button, and the footer composition flipped from `<Link><Button>text</Button></Link>` to `<Button asChild><Link>text</Link></Button>` (the standard Radix `Slot` pattern — `Button`'s classes merge onto the rendered `<a>` instead of wrapping it, one element instead of two). The patch is registered in root `package.json`'s `pnpm.patchedDependencies` and applied (`pnpm install` run); `/auth/sign-in` and `/auth/sign-up` now pass the `axe.e2e.ts` assertion.

- [x] (lock: `.github/workflows/*`) `.github/workflows/quality.yml`: new, `deployment_status` trigger, `quality / axe` and `quality / lighthouse` jobs
- [x] `eslint.config.mjs`, `apps/www/eslint.config.mjs`, `apps/test/eslint.config.mjs`: flip each jsx-a11y block to `error`; turn off the deprecated `jsx-a11y/label-has-for`; exclude test files from typed linting in the two app configs (pre-existing bug, unrelated to jsx-a11y, blocking `eslint .` on both apps since before this pass)
- [x] jsx-a11y warning sweep: one `eslint-disable-next-line` per remaining false-positive/backlogged line across `packages/react/src/{admin/AdminCardSection.tsx, collections/listView/peek/ListViewPeek/index.tsx, fields/json/Display.test.tsx, fields/upload/EmptyInput.tsx, forms/FormFieldLayout.test.tsx, livePreview/LivePreviewPanel.tsx, ui/JsonEditor.test.tsx, ui/data-table/DataTable/DataTableHeader.tsx, ui/input-group.tsx, ui/label.tsx, ui/pagination.tsx}`, `packages/richtext-plate/src/editor/{PlateEditorField.tsx, components/EditorElements.tsx, components/Toolbar.tsx, components/image/ImageUpload.tsx}`, `apps/www/src/components/{CodePane.tsx, ui/input-group.tsx, ui/label.tsx}`, `apps/test/src/components/ui/{input-group.tsx, label.tsx}`
- [x] `apps/www/e2e/axe.e2e.ts`: add the per-route `expect(violations).toEqual([])` the gate needs
- [x] `apps/www/lighthouserc.cjs`: flip `assert.assertions` to `error` at the budgets from step 7's Verify line; add the bypass header to `collect.settings` so `lhci` itself can reach the protected preview
- [x] `patches/@daveyplate__better-auth-ui@3.4.0.patch`: new — F-071/F-072's boring fix, registered in root `package.json`'s `pnpm.patchedDependencies` and applied
- [x] `findings.md`: F-071/F-072 rows updated from `backlog` to `fixed (step 10, via patch)`
- [x] Negative-test procedure run once, by hand, then reverted (see below)
- [ ] `[dev]` Add the `VERCEL_AUTOMATION_BYPASS_SECRET` repo secret in GitHub; mark `quality / axe` and `quality / lighthouse` as required checks in branch protection for `master`

#### .github/workflows/quality.yml

New file. Mirrors `ci.yml`'s checkout/pnpm/node pin conventions; `workflow` name is lower-case `quality` so GitHub's check list reads `quality / axe` and `quality / lighthouse` (`<workflow name> / <job name>`). `ref: ${{ github.event.deployment.sha }}` on checkout pulls the PR's actual commit — the default-branch copy of this file is what GitHub *runs*, but the test files, `playwright.config.ts`, and `lighthouserc.cjs` it executes must be the PR's, not `master`'s.

```yaml
name: quality

on:
  deployment_status

concurrency:
  group: ${{ github.workflow }}-${{ github.event.deployment.sha }}
  cancel-in-progress: true

jobs:
  axe:
    name: axe
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Preview – vex-www'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          ref: ${{ github.event.deployment.sha }}

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Chromium
        run: pnpm --filter www exec playwright install --with-deps chromium

      - name: Run axe suite against the preview
        run: pnpm --filter www exec playwright test e2e/axe.e2e.ts
        env:
          CI: "1"
          QUALITY_BASE_URL: ${{ github.event.deployment_status.target_url }}
          VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}

  lighthouse:
    name: lighthouse
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Preview – vex-www'
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          ref: ${{ github.event.deployment.sha }}

      - name: Setup pnpm
        uses: pnpm/action-setup@fc06bc1257f339d1d5d8b3a19a8cae5388b55320 # v4.4.0

      - name: Setup Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Lighthouse CI against the preview
        run: pnpm --filter www exec lhci autorun
        env:
          CI: "1"
          QUALITY_BASE_URL: ${{ github.event.deployment_status.target_url }}
          VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
```

`CI` is explicit here even though Actions runners already export `CI=true`, because `e2e/routes.ts`'s draft-skip and `playwright.config.ts`'s bypass-header branch (step 2) key off `process.env.CI`/`process.env.VERCEL_AUTOMATION_BYPASS_SECRET` and the spec-tasks Verify line calls it out by name.

#### eslint.config.mjs

1 edit, everything else unchanged.

**1 — jsx-a11y rules to error, drop the deprecated duplicate.** Replace the `rules: Object.fromEntries(...)` value of the jsx-a11y block (`files: ["**/*.tsx"]`) with `"error"` severities plus one explicit override:

```js
rules: {
  ...Object.fromEntries(
    Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "error"]),
  ),
  // Deprecated by the plugin itself in favor of
  // `label-has-associated-control`, which covers the same cases; this one
  // only double-fires alongside it.
  "jsx-a11y/label-has-for": "off",
},
```

#### apps/www/eslint.config.mjs

2 edits, everything else (the `next/core-web-vitals` compat extends, perfectionist, the typed-rules block, the convex-plugin block) unchanged.

**1 — jsx-a11y rules to error, same override as root.** Same `rules` replacement as above, on the `files: ["**/*.tsx"]` block.

**2 — stop the typed parser from throwing on test files.** Added as the config array's LAST entry (array order decides which block wins for a given file — this one must run after the typed block AND after the final untargeted `languageOptions.parserOptions` block):

```js
{
  extends: [tseslint.configs.disableTypeChecked],
  files: ["**/*.test.ts", "**/*.test.tsx"],
}
```

#### apps/test/eslint.config.mjs

Same 2 edits as `apps/www/eslint.config.mjs`, plus `"src/testing/**/*.ts"` in edit 2's `files` glob (that app's tsconfig also excludes `src/testing/**`, which otherwise hits the same parse error on `src/testing/setup.ts`).

#### jsx-a11y warning sweep

Every line below carried a real jsx-a11y warning at `warn` that would have become a lint-breaking `error`; none change rendered behavior. One `// eslint-disable-next-line <rule>` (plain JS comment where the flagged element sits inside a parenthesized expression — `return (`, an arrow body, a `cond && (`) or `{/* eslint-disable-next-line <rule> */}` (where it's a JSX sibling child) directly above the flagged line, naming only the rule(s) that actually fire there (`reportUnusedDisableDirectives: "error"` rejects a mismatched rule name).

False positives (tool heuristic misses a real accessible name/keyboard path, confirmed by reading the rendered DOM/usage):
- `admin/AdminCardSection.tsx` (`control-has-associated-label` — name reaches the `<a>` via subtree text, 3 component layers down)
- `collections/listView/peek/ListViewPeek/index.tsx`, `ui/data-table/DataTable/DataTableHeader.tsx` ×2 (`no-noninteractive-element-interactions`, `no-noninteractive-tabindex` — a focusable `role="separator"` Window Splitter with `aria-valuenow`/`min`/`max`; jsx-a11y's static interactive-role list doesn't special-case ARIA 1.2's focusable-separator pattern)
- `fields/json/Display.test.tsx`, `forms/FormFieldLayout.test.tsx`, `ui/JsonEditor.test.tsx` (`control-has-associated-label` — `vi.mock` stubs, never rendered to a real user)
- `fields/upload/EmptyInput.tsx` (`no-static-element-interactions` — the dropzone `<div>`'s real input sibling already covers the same area, keyboard-reachable)
- `livePreview/LivePreviewPanel.tsx` (`no-noninteractive-element-interactions` — `onLoad` is a lifecycle callback, not a user-interaction handler)
- `ui/input-group.tsx` (root, `apps/www`, `apps/test` — identical vendored copies) (`click-events-have-key-events`, `no-noninteractive-element-interactions` — the `onClick` only forwards focus to an already Tab-reachable sibling `<input>`)
- `ui/label.tsx` (root, `apps/www`, `apps/test`) (`label-has-associated-control` — the primitive's own definition site; every real consumer supplies `htmlFor`/children at its own call site)
- `ui/pagination.tsx` (`anchor-has-content` — content arrives through a Base UI `render`-prop merge the static check can't see through)
- `richtext-plate/.../image/ImageUpload.tsx` ×4 (`control-has-associated-label` — 3 are native-label-wrapped text inputs with adjacent text the rule's heuristic misses; 1 is a `display:none` file input with the real control being its labelled sibling `<div>`)
- `richtext-plate/.../PlateEditorField.tsx`, `apps/www/.../CodePane.tsx` (`no-noninteractive-tabindex` — the deliberate scrollable-region `tabIndex={0}` fix for 2.1.1 Keyboard; this warning is the expected cost of that fix)

Backlogged, not false positives (`backlog.md` § Richtext editor keyboard parity — structural, needs a real keyboard-interaction model, out of this step's ≤30-line fix boundary):
- `richtext-plate/.../EditorElements.tsx` ×4 (`click-events-have-key-events`, `no-static-element-interactions` — mouse-only image selection and the 3 resize handles)
- `richtext-plate/.../Toolbar.tsx` (`no-static-element-interactions` — the mouse-only table-size picker grid)

#### apps/www/e2e/axe.e2e.ts

1 edit, everything else (route/theme iteration, `settlePage`, the `afterAll` JSON write) unchanged.

**1 — assert on violations.** Import `expect` alongside `test`, and add the assertion right after the existing `results.push(...)` inside the per-route test body:

```ts
import { expect, test } from "@playwright/test";
```

```ts
      expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([]);
```

#### apps/www/lighthouserc.cjs

2 edits, everything else (the mobile preset, `collect.url` built from `QUALITY_ROUTES`, `upload.target`) unchanged.

**1 — assertions to error at the budgets.** Replace the `assert.assertions` object (all `warn` since step 2) with the step 7 budgets, all `error`:

```js
assertions: {
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:performance": ["error", { minScore: 0.9 }],
  "categories:best-practices": ["error", { minScore: 0.9 }],
  "categories:seo": ["error", { minScore: 0.9 }],
  "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
  "total-blocking-time": ["error", { maxNumericValue: 200 }],
},
```

**2 — bypass header for the protected preview.** `lhci` drives Lighthouse directly, not through `playwright.config.ts`, so it needs its own copy of the bypass header. Add alongside the existing `collect.settings.preset: "mobile"`:

```js
extraHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "true",
    }
  : undefined,
```

#### patches/@daveyplate__better-auth-ui@3.4.0.patch

New file, generated from the real `node_modules/@daveyplate/better-auth-ui@3.4.0/dist/index.js` via `pnpm patch` (same mechanism as the existing `@convex-dev/better-auth` patch). Two hunks: an `aria-label` on `PasswordInput`'s icon-only visibility toggle (F-071), and the sign-in/sign-up footer link's composition flipped from `<Link><Button>text</Button></Link>` to `<Button asChild><Link>text</Link></Button>` (F-072's button-in-link; the `<style>`/`::-ms-reveal` placement half of F-072 is NOT covered — moving an inline `<style>` tag is bigger than this fix boundary, stays backlogged).

```diff
diff --git a/dist/index.js b/dist/index.js
index 135cbff..4331d89 100644
--- a/dist/index.js
+++ b/dist/index.js
@@ -5853,6 +5853,7 @@ function PasswordInput({
       /* @__PURE__ */ jsx53(
         Button,
         {
+          "aria-label": isVisible ? "Hide password" : "Show password",
           className: "!bg-transparent absolute top-0 right-0",
           disabled,
           size: "icon",
@@ -10586,22 +10587,19 @@ function AuthView({
         children: [
           view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? localization.DONT_HAVE_AN_ACCOUNT : view === "SIGN_UP" ? localization.ALREADY_HAVE_AN_ACCOUNT : /* @__PURE__ */ jsx86(ArrowLeftIcon, { className: "size-3" }),
           view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" || view === "SIGN_UP" ? /* @__PURE__ */ jsx86(
-            Link,
+            Button,
             {
+              asChild: true,
+              variant: "link",
+              size: "sm",
               className: cn(
-                "text-foreground underline",
+                "px-0 text-foreground underline",
                 classNames == null ? void 0 : classNames.footerLink
               ),
-              href: `${basePath}/${viewPaths[view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? "SIGN_UP" : "SIGN_IN"]}${isHydrated ? window.location.search : ""}`,
               children: /* @__PURE__ */ jsx86(
-                Button,
+                Link,
                 {
-                  variant: "link",
-                  size: "sm",
-                  className: cn(
-                    "px-0 text-foreground underline",
-                    classNames == null ? void 0 : classNames.footerLink
-                  ),
+                  href: `${basePath}/${viewPaths[view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? "SIGN_UP" : "SIGN_IN"]}${isHydrated ? window.location.search : ""}`,
                   children: view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? localization.SIGN_UP : localization.SIGN_IN
                 }
               )
```

Verified: applies cleanly against the installed package with `patch -p1`; the resulting file matches the hand-edited working copy byte for byte. Registered in root `package.json`'s `pnpm.patchedDependencies` and applied via `pnpm install`; a fresh `www` axe run passes `/auth/sign-in` and `/auth/sign-up` with no `button-name`/button-in-link violations.

#### Negative-test procedure

Run once, by hand, confirmed working this session, then reverted — not a permanent fixture. Mirrors the shape of a real future regression without touching any shipped file:

1. Added a scratch pair under `packages/react/src/ui/`: `__qpNegativeTest.tsx` exporting `<input type="text" />` with no label, and `__qpNegativeTest.test.tsx` rendering it through `expectNoA11yViolations`.
2. `pnpm lint` failed: `jsx-a11y/control-has-associated-label` reported as `error` (not `warn`) on the unlabelled input — confirms the eslint-side gate (`ci.yml`'s existing `pnpm lint` step, which already runs on every PR).
3. `npx vitest run src/ui/__qpNegativeTest.test.tsx` failed: `expectNoA11yViolations` threw `expected no accessibility violations, found 1: label: Form elements must have labels — input` — confirms the same class of defect is caught at the component level too, independent of the Playwright/CI path (which needs a real deployed preview to exercise end to end).
4. Deleted both scratch files; `pnpm lint` passed again (0 errors, same 156 pre-existing warnings as before the scratch files existed).

The end-to-end `quality / axe` check itself needs a real Vercel Preview deployment to fire `deployment_status` — not reproducible from this sandbox (no dev server, no deploy) — but it runs the same `axe.e2e.ts` assertion added above against whatever route carries the violation, so the eslint- and component-level reproductions above exercise the identical mechanism one layer down.

#### Human items (not committed)

- GitHub repo → Settings → Secrets and variables → Actions → New repository secret `VERCEL_AUTOMATION_BYPASS_SECRET`, value from the Vercel `www` project → Settings → Deployment Protection → **Protection Bypass for Automation** → Create (a per-project secret, independent of `VERCEL_TOKEN`).
- GitHub repo → Settings → Branches → branch protection rule for `master` → Require status checks to pass → add `quality / axe` and `quality / lighthouse` (visible in the picker only after the workflow has run at least once post-merge, per the default-branch rule above).

Verify: a PR touching www gets `quality / axe` and `quality / lighthouse` checks on its Vercel preview, and both pass (confirmed: the better-auth-ui patch is registered and `www` axe passes `/auth/sign-in`/`/auth/sign-up`); the negative-test procedure above makes `pnpm lint` and a component-level `expectNoA11yViolations` check fail on an unlabelled input, and both pass again once the scratch files are reverted.

### Step 11 — Accessibility statement [dev]

Shipped. Seeded exactly like `/privacy` (`2026-11-06-launch-infrastructure` step 13, P-018/P-021): a `WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>>` built from the existing `BLOCK_SLUG_HERO` + `BLOCK_SLUG_FAQ` blocks, inserted through the file's `by_slug` + insert/patch/skip pattern, plus its footer link at the position `2026-11-06-public-presence/public-copy.md` § Footer assigns it (decision 4). The docs half (`apps/docs/src/content/docs/accessibility.md`) restates the same conformance target and contact line, scoped to the admin panel and `packages/react`/`packages/next` instead of the www marketing site, with an explicit Starlight sidebar entry — the autogenerated groups (`guides/`, `fields/`, `dev/`) don't cover a root-level content file. Test date 2026-11-08; methods are the tools actually run to date (`findings.md` "Runtime baseline" and "Step 5 keyboard re-check" sections) — the VoiceOver and 200%-zoom/reflow manual pass (step 9) hasn't run yet, and both statements say so honestly rather than promise a date. The known-exceptions answer on both pages names the one open `backlog` disposition at this point: F-007/F-041/F-042 (`backlog.md` § Richtext editor keyboard parity).

- [x] `apps/www/convex/seed.ts`: the `Accessibility` footer link in `footerDoc.content[0].links`, directly after `Privacy` and before `Convex`
- [x] `apps/www/convex/seed.ts`: the `accessibility` page (compact Hero + FAQ: conformance target, test methods, test date, known exceptions, contact), inserted after the `brand` page's insert/patch/skip block and before `// ── Posts`, same `by_slug` + insert/patch/skip pattern as every other page
- [x] `apps/www/e2e/routes.ts`: `{ path: "/accessibility" }` was already present (step 2's inventory-derived file) — no edit needed
- [x] `apps/docs/src/content/docs/accessibility.md`: the admin/packages-scoped statement, same contact line
- [x] `apps/docs/astro.config.mjs`: a sidebar entry for the new page, directly after `Compare`
- [x] `apps/www/convex/seed.ts` exec `seed:reinit` against the dev deployment
- [x] `.agent/docs/specs/2026-11-06-quality-pass/findings.md`: a note recording that the statement shipped, what it cites, and what re-opens it

#### apps/www/convex/seed.ts

2 edits; everything not shown is unchanged. `BLOCK_SLUG_HERO`, `BLOCK_SLUG_FAQ` and `TABLE_SLUG_PAGES` were already imported (used by the roadmap/home pages above), so neither edit touched the import block.

**1 — footer link**, in `footerDoc.content[0].links`. `public-copy.md` § Footer puts Accessibility (#14) directly after Privacy (#13) and before Convex (#15); both were already in the seeded array (launch-infrastructure step 13, public-presence step 13 had landed by the time this ran):

```ts
          { label: "Privacy", href: "/privacy" },
          { label: "Accessibility", href: "/accessibility" },
          { label: "Convex", href: "https://convex.dev" },
```

**2 — the accessibility page.** Inserted immediately after the `brand` page's insert/patch/skip block (`created.push("page:brand")` / its closing brace) and before the `// ── Posts` comment — same `by_slug` + insert/patch/skip pattern as every page above it. The known-exceptions answer cites `findings.md` F-007/F-041/F-042, all three dispositioned `backlog` against `backlog.md` § Richtext editor keyboard parity (the only open `backlog` disposition at the time this page was written) — in plain language, with no internal doc names in the shipped string. The contact answer quotes `public-copy.md` § Privacy contact byte for byte, the same line `/privacy`'s FAQ quotes:

```ts
  const existingAccessibilityPage = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "accessibility"))
    .filter((q) => q.neq(q.field("vex_status"), "draft"))
    .first()
  const accessibilityPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Accessibility",
    slug: "accessibility",
    vex_status: "published",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "accessibility-hero",
        variant: ["compact"],
        badgeText: "Accessibility",
        heading: "VexCMS aims for WCAG 2.2 AA, plus a stronger focus indicator.",
        subheading:
          "This page states our conformance target, how we test it, and every known gap, so you always know exactly where this site stands.",
      },
      {
        blockType: BLOCK_SLUG_FAQ,
        blockName: "FAQ",
        id: "accessibility-faq",
        heading: "Accessibility FAQ",
        subheading: "",
        supportLink: "",
        items: [
          {
            question: "What's the conformance target?",
            answer:
              "WCAG 2.2 Level AA in full — every Level A and AA success criterion — plus 2.4.13 Focus Appearance, which is normally a Level AAA criterion. We hold the focus indicator to that AAA bar everywhere on this site.",
          },
          {
            question: "How is this tested?",
            answer:
              "Automated: axe-core 4.14 (via Playwright, tagged for WCAG 2.2 A/AA), the Nu Html Checker, Lighthouse CI's accessibility category, and eslint-plugin-jsx-a11y. We also ran a full keyboard-only sweep of every page. A VoiceOver and 200%-zoom/reflow pass hasn't run yet; this statement will be updated once it has, with no date promised.",
          },
          {
            question: "When was this last tested?",
            answer: "2026-11-08.",
          },
          {
            question: "What doesn't conform yet?",
            answer:
              "One: selecting, resizing, or choosing a table size in the richtext editor's image and table tools needs a pointer — there's no keyboard equivalent yet (WCAG 2.1.1 Keyboard, 2.5.7 Dragging Movements). Every other issue found during testing has been fixed.",
          },
          {
            question: "Who do I contact about this?",
            answer: "Questions about privacy or this page: hello@vexcms.dev.",
          },
        ],
      },
    ],
  }
  if (existingAccessibilityPage) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingAccessibilityPage._id, accessibilityPageDoc)
      patched.push("page:accessibility")
    } else {
      skipped.push("page:accessibility")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, accessibilityPageDoc)
    created.push("page:accessibility")
  }
```

#### apps/docs/src/content/docs/accessibility.md

New file. Kebab-case, plain `.md` like `roadmap.md` (no components, so no `.mdx`). Scoped to the admin panel (`@vexcms/react`'s `AdminLayout` and every `packages/react/src/ui` primitive) and the packages that render it, not the www marketing site. The known-limitations section cites the same `findings.md` evidence as the seed page's FAQ item, in the same plain language.

```md
---
title: Accessibility
description: VexCMS's accessibility conformance statement for the admin panel and the React/Next.js packages.
---

## Conformance target

WCAG 2.2 Level AA in full, plus 2.4.13 Focus Appearance (normally a Level AAA criterion), applied
to the admin panel rendered by `@vexcms/react`'s `AdminLayout` and every `packages/react/src/ui`
primitive, and to the read-only demo of it at [vexcms.dev/admin](https://vexcms.dev/admin).

## How this is tested

Automated: axe-core 4.14 (via Playwright, tagged for WCAG 2.2 A/AA), a colocated `vitest-axe`
check on every interactive primitive, and eslint-plugin-jsx-a11y. We also ran a full
keyboard-only sweep of every admin flow (sign in, create/edit/publish, media upload, list
filters and saved views, live preview). A VoiceOver and 200%-zoom/reflow pass hasn't run yet;
this statement will be updated once it has, with no date promised.

## Last tested

2026-11-08.

## Known limitations

One: selecting, resizing, or choosing a table size in the richtext editor's image and table
tools needs a pointer — there's no keyboard equivalent yet (WCAG 2.1.1 Keyboard, 2.5.7 Dragging
Movements). Every other issue found during testing has been fixed.

## Feedback

Questions about privacy or this page: hello@vexcms.dev.
```

#### apps/docs/astro.config.mjs

1 edit; everything not shown is unchanged.

**1 — sidebar entry.** Added to the `sidebar` array alongside the other standalone top-level pages (`Introduction`, `Roadmap`, `Compare`), directly after `Compare` and before the `Next.js` group:

```js
				{ label: 'Accessibility', slug: 'accessibility' },
```

Verify: `pnpm --filter www exec convex run seed:reinit` against the dev deployment reported `created: ["page:accessibility"]`, `patched` including `footer`. `curl -s -o /dev/null -w '%{http_code}' http://localhost:3030/accessibility` → `200`; the fetched HTML contains every FAQ answer. Footer order on the rendered page: `/privacy` → `/accessibility` → `https://convex.dev`, confirmed by href position (`privacy idx 33734 < accessibility idx 33898 < convex idx 34074`). `env -u CI npx playwright test e2e/axe.e2e.ts -g accessibility` → 2 passed (light + dark), 0 violations. `grep -F "Questions about privacy or this page: hello@vexcms.dev." apps/www/convex/seed.ts apps/docs/src/content/docs/accessibility.md .agent/docs/specs/2026-11-06-public-presence/public-copy.md` matches in all three, byte for byte. `pnpm --filter docs build` → `1116 page(s) built`, `apps/docs/dist/accessibility/index.html` exists with the sidebar entry rendered (`aria-current="page"` on the Accessibility link). `pnpm --filter www typecheck` → clean exit, no errors.

Deviations from the original guided stub (P-023): the stub anchored the page insert on "after the roadmap page's block"; by the time this ran, `privacy` and `brand` had already landed between roadmap and `// ── Posts`, so the real insert point is after `brand`'s block. The `⟪…⟫` placeholders (test date, known exceptions) are filled with real content instead of left as markers, per the job's instructions (test date `2026-11-08`; known exceptions drawn from `findings.md` F-007/F-041/F-042, all citing `backlog.md` § Richtext editor keyboard parity, the only open `backlog` row at this point) — the "How is this tested?" / "How this is tested" answers additionally disclose, honestly, that the manual VoiceOver/zoom pass (step 9) is still pending, with no date promised, per the job's explicit instruction not to overstate testing completeness.

### Step 12 — Port www fixes to apps/test [dev]

`apps/test` carries every `apps/www` frontend file plus a superset of test-only extensions (the posts collection, the editorial/telemetry collections, the auth plugin, the extra blocks and globals). This step replays steps 4–8 and 11's www edits onto the matching `apps/test` files, leaves the test-only extensions untouched, then re-runs the step-2 Playwright axe suite against `apps/test`'s frontend (`posts/[slug]` included, since www doesn't have that route yet — public-presence step 14 is what eventually adds `convex/posts.ts` to www). `apps/test/**` is lock-held for the whole step (coordination-board § Locks).

**Test-only extensions to keep (do not port, do not overwrite)**

Found by `node scripts/template-diff.mjs --app apps/test` plus a direct `apps/www/src` vs `apps/test/src` tree walk:

- `apps/test/convex/posts.ts`, `apps/test/convex/vexContext.ts`, `apps/test/convex/vex/versions.ts`, `apps/test/convex/telemetry/*`, `apps/test/convex/auth/*` — no www counterpart.
- `apps/test/src/app/(frontend)/(site)/posts/[slug]/page.tsx` + `PostContent.tsx` — the route under audit in this step; www has no `posts/[slug]` tree yet.
- `apps/test/src/auth/{access.typecheck,options,permissions,plugins,schema}.ts`, `apps/test/src/lib/useSitePreviewMode.ts`, `apps/test/src/testing/setup.ts`.
- `apps/test/src/vexcms/collections/{articles,caseStudies,changelog,comments,editorialFields,fields,fields.typecheck,pages.typecheck,posts,telemetryEvents,telemetryProjects}.ts` (www has only `footers, headers, images, index, leads, pages, products, testimonials, themeColors, themes, users`).
- `apps/test/src/vexcms/blocks/{Content,Feature,LogoCloud,Pricing,Testimonial}/*` (www has `CTA` and `Roadmap` only, plus the shared `config.ts`/`index.ts` registries, which differ by the extra block registrations — port the CTA/Roadmap fix lines into test's registry entries without removing the extra ones).
- `apps/test/src/vexcms/globals/{announcement,nav}.ts` (www has `siteSettings` only, plus `index.ts` which differs by the extra global registrations).
- `apps/test/src/vexcms/admin/*` (`PhoneBeforeInputHint.tsx`, `PhoneInputWithHint.tsx`, `TrimOnBlurTextInput.tsx`, `WordCountField.tsx`) and `apps/test/src/vexcms/components/*` (`CachePurgeNote.tsx`, `CopyDocumentIdMenuItem.tsx`, `EditorialChecklist.tsx`, `FieldsTitleInput.tsx`, `FieldsWordCount.tsx`, `SaveWithAnalytics.tsx`) — no www counterpart.
- `apps/test/src/app/(vexcms)/admin/clientProviders.tsx` — no www counterpart.

**Port procedure, per category — done**

- [x] **Layout/landmarks/metadata (step 4).** Ported `viewport` (`themeColor`) + `<Toaster />` into `apps/test/src/app/layout.tsx` (the skip link/landmarks/`id="main"` already matched byte-for-byte; only the font-loading mechanism, pre-existing and unrelated, stays diverged).
- [x] **Focus appearance (step 4).** Added the missing `@utility focus-ring` block to `apps/test/src/app/globals.css` (right after `@source`, mirroring www's placement) and ported the `--primary` darken (F-067/F-087).
- [x] **Motion primitives (step 4).** Confirmed byte-identical; no port needed.
- [x] **UI primitives (step 5).** Ported every `focus-visible:ring-*/50` → `focus-visible:focus-ring` swap across `accordion/badge/button/input/input-group/select/textarea.tsx`; ported `combobox.tsx`'s `aria-label="Remove"`/`"Clear"` icon-button names and `dialog.tsx`'s mount-effect `inert` on `#main` + `aria-modal="true"` (F-097). All 15 files now byte-identical to www's.
- [x] **Shared components (steps 5–7).** `CodePane.tsx` (F-066/F-070: `bg-(--token)` paren syntax, `role="region"`/`tabIndex`/`aria-label`), `InstallCommand.tsx` (same token-syntax fix), `MediaImage.tsx` (optional `alt` + `sizes` + the new `convex/images.ts` lookup) ported; `SiteHeader/SiteFooter/ThemeStyle/WelcomePage/BrandMark/Container/CopyButton/FirstAdminBootstrap/ThemeLive/SectionHeader` were already identical — no port needed.
- [x] **Blocks (step 7).** `Roadmap/index.tsx`: ported the F-074 tabs `aria-controls`/`role="tabpanel"` wiring and the F-068 `/80`-opacity removal (the `config.ts` content differences are PP's roadmap copy, out of scope, left untouched). `Stats/index.tsx`: ported the F-069 `dt`/`dd` reorder. `CTA` is a deliberately different, richer test-only field showcase (relationship/select/url link picker vs. www's plain `href`) predating this spec — confirmed no accessibility-relevant difference, left alone.
- [x] **Images and performance (step 7).** `MediaImage.tsx`'s `sizes`/optional-`alt` port covers this; `PageContent.tsx`/`[slug]/page.tsx` were already identical.
- [x] **Auth modal/fallback (step 7).** Ported `lib/authPageTitle.ts` (new file) + the standalone page's `generateMetadata`/`sr-only <h1>` (F-096) and the dialog's `formatDialogTitle`/`DialogTitle`/`showCloseButton={false}` removal.
- [x] **`/tour` and admin `error.tsx` (step 7).** Both already existed (LI-16/LI-10 landed first). Ported `TourContent.tsx`'s `<main id="main">` wrap + `priority={index === 0}` + `h-auto w-full` (F-084/F-076) and `error.tsx`'s focus-on-retry `useRef` (step 7 closeout).
- [x] **`next.config.ts` headers (step 8).** Ported `lib/csp.ts` + `lib/csp.test.ts` (new files, `apps/test` wording) and a scoped `headers()`/`htmlLimitedBots` insertion into `apps/test/next.config.ts`'s existing structure (its own `env.mjs`/workspace-alias/image-remote-pattern code untouched).
- [x] **Seed (step 11) — corrected.** The accessibility page DOES get ported: the spec-tasks N-exclusion note is about the create-vexcms `marketing-site` TEMPLATE (built from `apps/www`'s seeded pages, which never sees `/accessibility` in the first place), not `apps/test` — `apps/test` is a superset app, not the template. Ported the `accessibility` page block + its footer link (Privacy → Accessibility → Convex) into `apps/test/convex/seed.ts`; `seed:reinit` run. Also ported the F-067 `--primary` and a new F-088-driven `--destructive` darken into the seeded "Stark × Ember" theme (both apps, see Step 12 findings).
- [x] `apps/test/e2e/axe.e2e.ts` + `apps/test/e2e/routes.ts` (new files, below). Runs clean: 24/24 (12 routes × light/dark), writes `apps/test/audit/test-axe.json`.
- [x] `node scripts/validate-html.mjs --app test` → `apps/test/audit/test-nu.json`: 2 errors, both vendor-internal (`@daveyplate/better-auth-ui`'s own `<style>` injection on `/auth/sign-up`), matching the same message text already present in `apps/www/audit/www-nu.json`'s own `/auth/sign-up` entry.
- [x] N exclusion note — corrected and recorded in `findings.md` § Step 12: the template is built from `apps/www`'s pages and never sees `/accessibility`, so N's template sync needs no exclusion code; this does NOT mean `apps/test` itself skips the page.
- [x] **Admin reconciliation beyond the original checklist, done live.** F-087/F-088 (`--primary`/`--destructive` tokens) fixed for real; F-089/F-090/F-100 re-traced and reclassified `n/a` — confirmed via `theme:getAdmin` + two back-to-back `adminAxe.e2e.ts` runs producing different violation sets on unchanged code that these are non-deterministic `next dev` recompile-window artifacts (same class as F-106), not token bugs. Found + fixed F-107 (`Roadmap`'s `StatusBadge` "in-progress" variant, `bg-primary/12` → `/5`, latent on www too — ported to both files to keep the 1:1 port). DB-theme contrast pass (Modern Minimal, live admin UI) + screenshot evidence for 7 step-6 closeout items — full detail in `findings.md` § Step 12.

#### apps/test/e2e/routes.ts

New file.

```ts
/**
 * One route audited by the Playwright axe suite. `notFound` marks the
 * deliberate 404 probe, mirroring `apps/www/e2e/routes.ts`'s `QualityRoute`.
 */
export interface QualityRoute {
  path: string;
  draft?: true;
  notFound?: true;
}

/**
 * Every `apps/test` frontend route the quality pass audits: the same seeded
 * marketing pages `apps/www/e2e/routes.ts` audits (`apps/test` carries every
 * www page plus `/accessibility`, seeded here too — step 12 is what keeps
 * the two seeds in sync), the static `/tour` fallback, the auth form routes,
 * `/unauthorized`, a guaranteed 404, and the test-only `/posts/[slug]` route
 * (no www equivalent — it dogfoods the richtext field, not a marketing post).
 * `plate-upgrade-smoke` is the one published fixture post whose body
 * exercises headings, bold/italic, lists, a blockquote and an inline image —
 * the widest markup coverage of the published fixtures.
 */
export const QUALITY_ROUTES: QualityRoute[] = [
  { path: "/" },
  { path: "/features" },
  { path: "/roadmap" },
  { path: "/privacy" },
  { path: "/brand" },
  { path: "/accessibility" },
  { path: "/posts/plate-upgrade-smoke" },
  { path: "/tour" },
  { path: "/auth/sign-in" },
  { path: "/auth/sign-up" },
  { path: "/a-page-that-does-not-exist", notFound: true },
  { path: "/unauthorized" },
];

/** Same theme set `apps/www/e2e/routes.ts` audits. */
export const QUALITY_THEMES = ["light", "dark"] as const;
```

#### apps/test/e2e/axe.e2e.ts

New file. Same shape as `apps/www/e2e/axe.e2e.ts`, reusing the existing (already byte-identical)
`settlePage`/`writeAuditJson` helpers and `baseURL` default `http://localhost:3020`.

```ts
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { writeAuditJson } from "./auditJson";
import { QUALITY_ROUTES, QUALITY_THEMES, type QualityRoute } from "./routes";
import { settlePage } from "./settlePage";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const THEME_STORAGE_KEY = "vex-theme";

interface RouteAxeResult {
  path: string;
  theme: (typeof QUALITY_THEMES)[number];
  status: number | null;
  violations: unknown[];
}

const routes: QualityRoute[] = QUALITY_ROUTES.filter(
  (route) => !(process.env.CI && route.draft),
);
const results: RouteAxeResult[] = [];

for (const route of routes) {
  for (const theme of QUALITY_THEMES) {
    test(`${route.path} — ${theme}`, async ({ page }) => {
      await page.addInitScript(
        (entry) => {
          window.localStorage.setItem(entry.key, entry.value);
        },
        { key: THEME_STORAGE_KEY, value: theme },
      );
      const response = await page.goto(route.path);
      await settlePage({ page });
      const axeResults = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
      results.push({
        path: route.path,
        theme,
        status: response?.status() ?? null,
        violations: axeResults.violations,
      });
      expect(axeResults.violations, JSON.stringify(axeResults.violations, null, 2)).toEqual([]);
    });
  }
}

test.afterAll(() => {
  writeAuditJson({
    fileName: "test-axe.json",
    data: {
      generated: new Date().toISOString(),
      baseURL: process.env.QUALITY_BASE_URL ?? "http://localhost:3020",
      tags: AXE_TAGS,
      results,
    },
  });
});
```

#### apps/test/convex/images.ts

New file, ported verbatim from `apps/www/convex/images.ts`.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_IMAGES } from "~/db/constants"
import { get } from "~/vexcms/api"

import type { Id } from "./_generated/dataModel"
import { query } from "./_generated/server"

/**
 * Returns the `images` document for `args.id`, or `null`.
 *
 * `api.vex.media.getUrl` resolves a storage URL only (`GetUrlReturn` is
 * `{ url: string }`, shared across every storage adapter) — it can never
 * carry the CMS-authored `alt` field. This is the one www-only query that
 * reads the document itself, so `MediaImage` can default its accessible name
 * to what an editor actually typed in the media library.
 *
 * Access is bypassed: every image rendered through `MediaImage` (block
 * logos, Split screenshots) is already public.
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) =>
    await get({
      ctx,
      collection: TABLE_SLUG_IMAGES,
      id: args.id as Id<typeof TABLE_SLUG_IMAGES>,
      access: { bypass: true },
    }),
})
```

#### apps/test/src/lib/authPageTitle.ts

New file, ported verbatim from `apps/www/src/lib/authPageTitle.ts`.

```ts
const AUTH_PAGE_TITLES: Record<string, string> = {
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
  "sign-in": "Sign in",
  "sign-up": "Sign up",
}

/**
 * Resolves the human-readable title for a better-auth-ui route segment.
 *
 * @param pathname - The `[pathname]` route param (e.g. `"sign-in"`).
 * @returns The matching label, or `"Account"` for any unmapped segment.
 */
export function resolveAuthPageTitle(pathname: string): string {
  return AUTH_PAGE_TITLES[pathname] ?? "Account"
}
```

#### apps/test/src/lib/csp.ts

New file, ported from `apps/www/src/lib/csp.ts` (one wording edit: "for `apps/test`").

```ts
export interface ContentSecurityPolicyInput {
  /** `new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname`, or `""` when no deployment is configured. */
  convexHost: string;
  /** The `frame-ancestors` source list, e.g. `"'self'"`. */
  frameAncestors: string;
}

/**
 * Builds the static `Content-Security-Policy` header value for `apps/test`.
 *
 * `script-src` carries `'unsafe-inline'`, not a hash list: Next's App Router
 * inlines a fresh `self.__next_f.push(...)` Flight payload (and, on a
 * dynamically rendered route, a random `self.__next_r="..."` resume token)
 * into every single response — static, ISR, or dynamic — and neither can be
 * pinned by a finite set of `sha256` hashes (confirmed against both `next
 * dev`'s and a real `next build`'s HTML output; see `findings.md` F-102).
 * Next's own nonce mechanism would avoid `'unsafe-inline'`, but requires
 * every route to render dynamically, which would drop this app's ISR/CDN
 * caching entirely — out of scope here (the task itself asks for no nonces).
 *
 * @param props - Input props.
 * @returns The `;`-joined directive list.
 */
export function buildContentSecurityPolicy(props: ContentSecurityPolicyInput): string {
  const convexOrigin = props.convexHost ? ` https://${props.convexHost}` : "";
  const convexSocket = props.convexHost ? ` wss://${props.convexHost}` : "";

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self'${convexOrigin}`,
    `font-src 'self'`,
    `connect-src 'self'${convexOrigin}${convexSocket}`,
    `media-src 'self'`,
    `frame-src 'self'`,
    `frame-ancestors ${props.frameAncestors}`,
    `worker-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}
```

`apps/test/src/lib/csp.test.ts` is the same two-case test as `apps/www/src/lib/csp.test.ts`
(Convex host present / absent), ported verbatim.

#### apps/test/next.config.ts

4 edits. Everything else unchanged (the file's own `env.mjs`/workspace-alias/image-remote-pattern
structure, which differs from www's, is untouched).

**1 — imports.** Anchor: the existing `import "./src/env.mjs";` line.

```ts
import { env } from "./src/env.mjs";
import { buildContentSecurityPolicy } from "./src/lib/csp";
```

**2 — security headers.** Anchor: directly after the existing `const repoRoot = …` line.

```ts
let convexHost = "";
try {
  convexHost = new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname;
} catch {
  // No deployment yet — leave convexHost empty.
}

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders: { key: string; value: string }[] = isProduction
  ? [
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy({ convexHost, frameAncestors: "'self'" }),
      },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
    ]
  : [];
```

**3 — `nextConfig`.** Anchor: `reactCompiler: true,`.

```ts
  htmlLimitedBots: /.*/,
```

**4 — `headers()`.** Anchor: the closing `},` of `turbopack.resolveAlias`, before the object's
closing `};`.

```ts
  async headers() {
    return securityHeaders.length > 0 ? [{ source: "/:path*", headers: securityHeaders }] : [];
  },
```

Verify: `pnpm --filter test typecheck` (clean), `pnpm --filter test lint` (134 problems / 3
errors — identical error count to the pre-port baseline; the 3 pre-existing errors are in files
this step never touched), `pnpm --filter test test` (3 files, 1262 passed); live
`env -u CI npx playwright test e2e/axe.e2e.ts` against `apps/test`'s running :3020 → 24/24 passed,
`apps/test/audit/test-axe.json` clean; `node scripts/validate-html.mjs --app test` →
`apps/test/audit/test-nu.json`, 2 vendor-internal errors only; `env -u CI npx playwright test
e2e/adminAxe.e2e.ts` + `e2e/adminWidths.e2e.ts` clean apart from the F-089/F-090/F-100
`next dev`-flake class and F-086's accepted geometric-tool artifact (both detailed in
`findings.md` § Step 12); `node scripts/template-diff.mjs` / a scoped `diff -rq apps/www/src
apps/test/src` shows every ported file matching, apart from the test-only extensions listed
above and the pre-existing, intentional `@source` Tailwind-scan divergence in `globals.css`.


### Step 13 — K conformance review (H, I, M, launch-infra 2–7, public-presence 14, this pass) [agent]

Runs K's pass-2 review method (launch-plan `.agent/docs/product/v0.1.0-launch-plan.md` § "Pass 2 — the review method") over every package/app touched since K's last commit by the six named sources, so N (launch-infra step 17) syncs templates from code that already follows the recorded conventions. Unlike K's own multi-week spec, this is one step with an internal decide/apply/repeat loop: `review-<n>.md` carries a `decision` column so each violation/gap is decided and applied in place, with no separate `Pass N decisions` step group. Everything below is procedure — the findings themselves don't exist until the reviewers run, per the quality-pass spec's audit-driven-work rule.

- [ ] Spawn one read-only reviewer agent per row of the fan-out table below (10 reviewers: `core`, `react`, `next`, `better-auth`, `cli`, `telemetry`, `create-vexcms`, `apps/www`, `apps/test`, `apps/docs` — `file-storage-convex` and `richtext-plate` are untouched by H/I/M/launch-infra 2–7/public-presence 14/this spec and are out of scope, per spec-tasks' "no whole-repo K re-review"). Each reviewer reads only its **scope root** (whole-tree, so it can tell a new file apart from an existing one) but reports findings only on paths matched by its **sources in scope** column — files it can confirm changed since K's last commit (`f837f20`, `feat(core,react)!: reorganize packages into domain folders and app form`) via `git show <hash> --stat -- <scope root>` for a committed source, or the literal path list for a source not yet committed when this step runs. Each reviewer applies K's four categories — **Grouping**, **File roles**, **Exports and imports**, **Identifiers** — and classifies every finding `CONVENTION` / `VIOLATION` / `GAP`, same semantics as `2026-10-25-codebase-conventions-refactor/review-1.md`.

  | reviewer | scope root | sources in scope (evidence) |
  |---|---|---|
  | core | `packages/core/src/**` | H (`git show 30b4c10 --stat`): `collections/api/create/server.ts`, `collections/types.ts`, `components/{builtinIds,resolve,resolve.test,types}.ts`, `config/{config,types}.ts`, `documents/cloneDocumentForDuplicate.{ts,test.ts}`, `globals/types.ts`. I (`git show b937b2b --stat`): `access/{constants,types}.ts`, `adminCookie.{ts,test.ts}`, `collections/**` (~30 files: `api/{find,listViews,removeView,saveView,search}/server{,.test}.ts`, `api/types.ts`, `composeViewWhere`, `config`, `constants.ts`, `index.ts`, `matchDeclaredViewFilter`, `buildListQueryArgs`, `completeColumnOrder`, `listPreferenceCookies`, `listUrlParams`, `listViewsCookie`, `resolveListQueryState`, `resolveQueryIndex`, `toClientViewConfig`, `types.ts`, `validateTableConfig`, `validateViewConfig`, `resolveColumnConfig`, `validator.test.ts`), `components/{builtinIds,types}.ts`, `db/test/convex/schema.ts`, `db/types.ts`, `framework.ts`, `fields/baseTypes.ts`, `schema/generateVexSchema.{ts,test.ts}`, `vexConvexApi.ts`. launch-infra step 7 (not committed as of this spec; literal paths from its spec-tasks): `auth/types.ts`, `config/assertRolesFieldNotClientWritable.ts`, `config/config.ts`, `config/config.test.ts`. |
  | react | `packages/react/src/**` | H (`git show 30b4c10 --stat`): `admin/adminHref.{ts,test.ts}`, `collections/{CollectionDeleteAction,CollectionDuplicateAction,CollectionEditView.{tsx,test.tsx},CreateDocumentForm,CreateDocumentModal,index.ts,useDuplicateCollectionDocument.ts}`, `config/{index.ts,useFrameworkComponents.ts,useVexNavigate.{ts,test.tsx}}`, `documents/**` (`DocumentEditRuntimeContext`, `DocumentEditSlotOutlet.{tsx,test.tsx}`, `DocumentSaveAction`, `VexDocumentContext.{tsx,test.tsx}`, `documentEditBuiltinContributions.ts`, `index.ts`, `UnsavedChangesDialog.tsx`, `useUnsavedChangesGuard.{ts,test.tsx}`), `globals/GlobalEditView.tsx`, `index.ts`, `livePreview/{LivePreviewToggleAction.tsx,index.ts}`, `slots/**` (`ComponentErrorBoundary`, `SlotOverrideOutlet`, `resolveFieldCellComponent`, `resolveFieldComponent`, each `.{tsx,test.tsx}`), `testing/fieldCellContract.ts`, `versions/**` (`DraftToolbar`, `VersionHistoryAction`, `VersionPublishAction`, `VersionUnpublishAction`, `index.ts`, `useAutosave.{tsx,test.tsx}`). I (`git show b937b2b --stat`): `adapter.ts`, `adminCookie.{ts,test.ts}`, `admin/AdminLayout.tsx`, `client/index.ts`, `collections/**` (`editView/**`, `listView/**` — ~55 files — plus `api/{find,listViews,removeView,saveView}/client.ts`, `index.ts`), `fields/{index.tsx,registry.ts}` + 10 field types' `FilterInput.{tsx,test.tsx}` + `relationship/RelationshipPicker.{tsx,test.tsx}`, `globals/GlobalEditView.tsx`, `hooks/{index.ts,usePaginatedQuery.ts,useVexDocQuery.{ts,test.tsx},useVexListQuery.{ts,test.tsx,serverParity.test.tsx}}`, `livePreview/useLivePreviewPanelState.ts`, `media/MediaCollectionListView.tsx`, `testing/{convex/bridge.ts,convex/schema.ts,hooksSuite.tsx,modalSuite.tsx}`, `ui/{sidebar.tsx,ScrollSection.{tsx,test.tsx},data-table/**,index.ts}`, `versions/{StatusBadge.tsx,VersionHistoryPanel.tsx,VersionPublishAction.tsx,VersionUnpublishAction.tsx,showsUnpublish.ts}`. This spec steps 4–5: the shared `focus-ring` theme utility, `admin/AdminLayout`'s skip link, and every `ui/` primitive touched by the APG pass. |
  | next | `packages/next/src/**` | H + I (`git show 30b4c10 b937b2b --stat`): `NextAdminLayoutClient.tsx`, `NextAdminPage.{tsx,test.ts}`, `navigation/{index.ts,useNextNavigate.ts,useNextNavigationBlocker.{ts,test.ts}}`. |
  | better-auth | `packages/better-auth/src/**` | launch-infra step 7 (not committed; literal path): `adapter.ts`, `adapter.test.ts`. No naming-conventions.md rule scopes this package at all — see the gaps list below. |
  | cli | `packages/cli/src/**` | M (`git show 32277bf --stat -- packages/cli/src`): the telemetry-wiring files M's own `spec-tasks.md` touches-glob `packages/cli/src/**` resolves to. Already governed by `non-component-camel` (root/lib) and `cli-command-verbs` (`commands/`) — confirm the new files comply, don't re-litigate existing ones. |
  | telemetry | `packages/telemetry/**` | M (`git show 32277bf --stat -- packages/telemetry`): the entire package — it didn't exist before M, so every file is in scope. No naming-conventions.md rule scopes it. |
  | create-vexcms | `packages/create-vexcms/src/**` | M (`git show 32277bf --stat -- packages/create-vexcms/src`): the scaffolding CLI's own source (not `templates/**`, which N syncs later and stays out of this step). No naming-conventions.md rule scopes `packages/create-vexcms/src/**` (only `templates/*/src/**` sub-scopes exist, via the `host-app-*` rules). |
  | apps/www | `apps/www/**` | launch-infra steps 2–7 (not committed; literal paths): `convex/**`, `src/auth/**`, `src/db/constants/auth.ts`, `src/env.mjs`, `.env.example`, `src/testing/**`, `vitest.config.ts`, `package.json`. public-presence step 14 (not committed; literal paths): `package.json`, `src/vex.config.ts`, `src/db/constants/index.ts`, `src/vexcms/collections/{posts.ts,index.ts}`, `src/lib/useSitePreviewMode.ts`, `src/auth/access.ts`, `convex/posts.ts`, `src/app/(frontend)/(site)/posts/[slug]/**`, `src/lib/metadata.ts`, `src/app/sitemap.ts`, `convex/seed.ts` (the posts entry only), `e2e/routes.ts` (the posts entry only). This spec steps 4–11 (per their own checklists): `layout.tsx`, `globals.css`, block/component a11y fixes, `e2e/*.e2e.ts`, `next.config.ts`, `lighthouserc.cjs`, `convex/seed.ts` (the `/accessibility` and `/privacy` pages), the auth modal, `/tour`, admin `error.tsx`. |
  | apps/test | `apps/test/**` | H (`git show 30b4c10 --stat`): `src/vexcms/collections/{posts,users}.ts`, `src/vexcms/components/{CachePurgeNote,EditorialChecklist,EnvironmentBadge,SaveWithAnalytics}.tsx`, `src/vexcms/globals/siteSettings.ts`. I (`git show b937b2b --stat`): `convex/seed.ts`, `src/vexcms/collections/{pages,index,testimonials}.ts`, `src/auth/access.ts`, `src/components/{TestimonialBulkApproveAction,TestimonialFeatureRowAction}.tsx`, `src/db/constants/index.ts`, `src/app/(vexcms)/admin/{[[...path]]/page.tsx,layout.tsx}`. M (`git show 32277bf --stat -- apps/test`): the files M's touches-globs (`src/vexcms/collections/**`, `src/db/constants/index.ts`, `src/vex.config.ts`, `src/auth/access.ts`, `convex/http.ts`, `convex/telemetry/**`, `package.json`, `vitest.config.ts`) resolve to. This spec steps 2 + 12: `e2e/adminAxe.e2e.ts`, `e2e/adminWidths.e2e.ts`, `playwright.config.ts`, and every file step 12 ports from www. |
  | apps/docs | `apps/docs/src/content/docs/**` | H: `guides/admin-customization.mdx`, `guides/framework-adapters.md`. I: `guides/{caching-and-seo,list-views,admin-cookies}.mdx`. M: `guides/telemetry.mdx`. launch-infra step 7: `guides/auth.mdx`. This spec step 11: `accessibility.md`. |

- [ ] Each reviewer appends its package section to `.agent/docs/specs/2026-11-06-quality-pass/review-1.md`, one `##` heading per package/app, one `###` sub-heading per K category, one table per sub-heading:

  `| kind | rule/area | paths | count | proposed fix | decision |`

  `kind` is `CONVENTION` / `VIOLATION` / `GAP`. `decision` is `-` for `CONVENTION` rows (no action). For every `VIOLATION`/`GAP` row the `[dev]` pass below fills `decision` with either `apply: <the exact fix — file rename/move, import repoint, rule-scope edit, etc.>` or `defer: <reason, developer sign-off>`; this folds K's separate "developer decides" step group into the review file itself, since this step runs once rather than across a growing spec-tasks.md.

- [ ] Known gaps to confirm immediately, so reviewers don't have to rediscover them from the rule file by hand (grep-verified against `.agent/docs/standards/naming-conventions.md`'s `scope:` arrays as of this writing — report them as `GAP` rows in the relevant package's "File roles" table even if no other finding turns up there):
  - `convex-resource-files` (`naming-conventions.md:86-91`) scopes only `apps/test/convex/*.ts`, `apps/test/convex/auth/**`, `apps/test/convex/vex/**` — `apps/www/convex/**` has no file-role rule at all, yet launch-infra 2–7 adds `auth/anonymousUsers.ts`, `auth/rateLimits.ts`, `crons.ts`, `http.ts`, `convex.config.ts` and public-presence 14 adds `posts.ts` there. The `apps/www` reviewer's "File roles" table.
  - `auth-file-roles` (`naming-conventions.md:98-103`) scopes only `apps/test/src/auth/**` — `apps/www/src/auth/**` (already has `access.ts`, gains `serverUtils.ts`/`server.ts` in launch-infra step 6) is unscoped. The `apps/www` reviewer.
  - `vexcms-resource-defs` (`naming-conventions.md:104-109`) scopes only `apps/test/src/vexcms/collections/**` — `apps/www/src/vexcms/collections/posts.ts` (public-presence 14) is unscoped. The `apps/www` reviewer.
  - `packages/better-auth/src/**`, `packages/telemetry/**`, `packages/create-vexcms/src/**` carry no file-role rule at all (confirmed: no `scope:` entry in `naming-conventions.md` names any of the three). The `better-auth`, `telemetry` and `create-vexcms` reviewers each report this as a `GAP` in "File roles" even if every file they see is internally consistent.
- [ ] `[dev]` Decide each `VIOLATION`/`GAP` row (fill `decision`); apply every `apply:` decision directly in the source tree (same fix boundary as the rest of this spec has no bearing here — K's refactor steps show the real boundary: renames, import repoints, rule-scope edits, occasionally a file move). Re-run only the reviewers whose package had an open row, writing `review-2.md` (then `review-3.md`, …) scoped to just those packages, same format, until a pass returns zero `VIOLATION`/`GAP` rows across every package reviewed in it — same termination rule as K's `review-4`/`review-5` (`...returns zero open violations/gaps`).
- [ ] Record every row whose `decision` established a new rule or widened an existing one's `scope:` in `.agent/docs/standards/naming-conventions.md`: a new `- id:` entry under `## File / Folder Rules` for each of the three fully-uncovered packages (`better-auth`, `telemetry`, `create-vexcms`), and a `scope:` extension (adding the `apps/www` path) to `convex-resource-files`, `auth-file-roles` and `vexcms-resource-defs` if the review confirms www should follow the apps/test pattern rather than diverge from it; identifier-level conventions (not file-role patterns) go in the `## Identifiers` list at the top of the same file. Mirror each new/changed rule into `apps/docs/src/content/docs/dev/naming-conventions.mdx` (one `###` subsection per rule id, matching the existing `See /dev/naming-conventions/#<id>` anchors); if a row introduces a whole new package to the dependency graph (`telemetry`), also add it to `apps/docs/src/content/docs/dev/project-structure.mdx` and `package-layout.mdx`.

Verify: `rg -n '\| (VIOLATION|GAP) \|' .agent/docs/specs/2026-11-06-quality-pass/review-*.md` on the *last* review file for each package returns nothing (every package's final pass shows only `CONVENTION` rows); `harness doctor` exits clean; `pnpm typecheck && pnpm test && pnpm lint && pnpm build` all green.

### Step 14 — Bookkeeping [agent]

Why: plan and backlog stay the source of truth for what comes next (N). This step ticks the launch plan against evidence steps 1–13 already produced and sweeps every `backlog`-disposition row in `findings.md` into `backlog.md`, so nothing fixed-elsewhere-or-deferred is lost between specs. Agents never commit (see the hard rules), so every evidence cell is written as a literal `(commit: <sha>)` placeholder and resolved by running `git log -1 --format=%h -- <path>` against the path(s) that step's work touched, once steps 1–13 are committed. Run the resolution command, don't guess a sha.

- [ ] `.agent/docs/product/v0.1.0-launch-plan.md` (lock: `.agent/docs/product/v0.1.0-launch-plan.md` + `backlog.md`): tick item 14, every J task-list row, every V task-list row, and K's `harness doctor` clean row, each with a resolved `(commit: <sha>)`
- [ ] `.agent/docs/product/backlog.md` (lock: same): for every `findings.md` row with Disposition `backlog` that has no matching entry yet, append one entry in the file's own format
- [ ] `.agent/docs/specs/2026-11-06-quality-pass/findings.md`: flip Status from `open` to `backlogged` on any row a new backlog.md entry was just filed for
- [ ] Run `git log -1 --format=%h -- <path...>` once per checkbox below to resolve its `<sha>`
- [ ] Run `harness doctor` and confirm it reports clean

#### .agent/docs/product/v0.1.0-launch-plan.md

4 edits. Everything else in the file is unchanged.

**1 — item 14, § Task order.** Anchor: the numbered item beginning `**Quality pass (V + light J + K conformance)**`. Flip its checkbox and append the resolved commit — this item closes once every J/V row below is ticked, so resolve its sha last, against `.agent/docs/specs/2026-11-06-quality-pass/spec.md`:

```markdown
14. [x] **Quality pass (V + light J + K conformance)** — one spec. V's accessibility, web
    standards and performance audit of `apps/www` + the admin (`apps/test`), plus J's width
    matrix folded into V's manual pass (J's separate audit is dropped; width bugs found later are
    fixed as reported). Fixes are limited to classes, attributes and markup; anything needing
    a component rewrite is filed to `backlog.md`, not fixed. Every fix is browser-verified at
    the affected widths. K's conformance review over code written since K (H, I, M, this pass)
    is the spec's final step. (commit: <sha>)
```

**2 — J's task list, § J — Responsive / mobile UI pass.** Anchor: the 5-line `### Tasks` block directly under the J heading, starting `- [x] 375 / 390 / 768 / 1024 audit`. The first row is already `[x]`; the quality-pass spec absorbed J's remaining scope (spec-tasks.md header: "J's width matrix folded into V's manual pass … J's separate audit is dropped") instead of writing a standalone J spec, so "Write spec" is satisfied by `2026-11-06-quality-pass/spec.md` itself — note that inline rather than pointing at a J spec that was never written:

```markdown
- [x] 375 / 390 / 768 / 1024 audit of admin + `apps/www` (discord-post readiness steps 3–4)
- [x] Write spec (regression pass over C–I) (commit: <sha>) — folded into `2026-11-06-quality-pass/spec.md`; no standalone J spec was written, per the header's "J's separate audit is dropped"
- [x] Implement
  - [x] 640 / 1280 / 1536 widths, ±1px around each boundary (commit: <sha>)
  - [x] Regression over every surface C–I added or changed (commit: <sha>)
  - [x] Structural findings filed in `backlog.md` (commit: <sha>)
```

Resolve shas against:
- "Write spec" → `git log -1 --format=%h -- .agent/docs/specs/2026-11-06-quality-pass/spec.md`
- "640 / 1280 / 1536 widths" → `git log -1 --format=%h -- apps/www/e2e/widths.e2e.ts apps/test/e2e/adminWidths.e2e.ts`
- "Regression over every surface C–I" → `git log -1 --format=%h -- apps/www/audit/www-width-matrix.json apps/test/audit/admin-width-matrix.json`
- "Structural findings filed in backlog.md" → `git log -1 --format=%h -- .agent/docs/product/backlog.md` (this step's own backlog.md commit)

**3 — V's task list, § V — Accessibility, web standards & performance pass.** Anchor: the 8-line `### Tasks` block under the V heading, starting `- [ ] Write spec`. All 8 rows flip:

```markdown
- [x] Write spec — the agent **fetches the normative sources first** and builds the checklist from them, not from memory; each source's version, URL and fetch date recorded in the spec:
  - WCAG 2.2 (W3C Recommendation) — every Level A and AA success criterion, plus 2.4.13 Focus Appearance (AAA)
  - WAI-ARIA 1.2 and the ARIA Authoring Practices Guide — the APG pattern for each widget we ship (dialog, sheet, menu, combobox, listbox, tabs, disclosure, toolbar, grid / table, tooltip), compared against each component's roles, states and keyboard model
  - HTML Living Standard (WHATWG) — document validity via the Nu Html Checker
  - Core Web Vitals thresholds (web.dev: LCP, INP, CLS at p75) and Lighthouse's performance, accessibility, best-practices and SEO audits
  - User preferences — `prefers-reduced-motion`, `prefers-color-scheme`, `forced-colors` (commit: <sha>)
- [x] Inventory — every route and interactive component on `apps/www` and in the admin panel as rendered by `apps/test`. Admin fixes land in `packages/react`, not the app (commit: <sha>)
- [x] Automated pass — axe-core over every route in both apps via Playwright (`@axe-core/playwright`); extend the existing `vitest-axe` component tests (already in 5 packages) to every interactive component; `eslint-plugin-jsx-a11y`; Lighthouse CI budgets on `apps/www`'s key pages; Nu Html Checker over rendered HTML (commit: <sha>)
- [x] Manual pass `[dev]` for agent-prepared checklists — automated tools catch a minority of WCAG failures:
  - Keyboard only through every flow: tab order, visible focus on every interactive element (some buttons already known missing or invisible), focus trap and return in dialogs / sheets, skip link
  - VoiceOver on macOS Safari and iOS Safari
  - 200% zoom and reflow at 320 CSS px
  - Contrast in light and dark themes, including database-driven themes (`buildThemeCss`) (commit: <sha>)
- [x] Configuration coverage — document `lang`, unique page titles, landmarks, viewport and `theme-color` metadata, image `alt` handling end to end (upload field → rendered `<img>`), font loading, responsive image sizes, caching headers, and security headers on `apps/www` (CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) (commit: <sha>)
- [x] Fix every finding; each one recorded in the spec against the criterion it fails (commit: <sha>)
- [x] CI gates — axe, jsx-a11y and Lighthouse budgets fail the build, so it stays fixed (commit: <sha>)
- [x] Accessibility statement on `apps/www` — conformance target, known exceptions, contact (commit: <sha>)
```

Resolve shas against:
- "Write spec" → `git log -1 --format=%h -- .agent/docs/specs/2026-11-06-quality-pass/spec.md .agent/docs/specs/2026-11-06-quality-pass/sources.md`
- "Inventory" → `git log -1 --format=%h -- .agent/docs/specs/2026-11-06-quality-pass/inventory.md`
- "Automated pass" → `git log -1 --format=%h -- apps/www/e2e/axe.e2e.ts apps/test/e2e/adminAxe.e2e.ts scripts/validate-html.mjs apps/www/lighthouserc.cjs`
- "Manual pass" → `git log -1 --format=%h -- .agent/docs/specs/2026-11-06-quality-pass/manual-checklist.md`
- "Configuration coverage" → `git log -1 --format=%h -- apps/www/next.config.ts apps/www/src/app/layout.tsx`
- "Fix every finding" → `git log -1 --format=%h -- .agent/docs/specs/2026-11-06-quality-pass/findings.md`
- "CI gates" → `git log -1 --format=%h -- .github/workflows/quality.yml apps/www/lighthouserc.cjs`
- "Accessibility statement" → `git log -1 --format=%h -- apps/www/convex/seed.ts apps/docs/src/content/docs/accessibility.md`

**4 — K's `harness doctor` row, § K — Codebase conventions refactor, "Harness refresh" sub-list.** Anchor: the last of the four `Harness refresh` sub-bullets, `- [ ] \`harness doctor\` clean`. This is the only one of the three remaining sub-bullets this spec closes: `tech-stack.md` paths/`verified_at` and the `.agent/` project install (`harness sync`) are K's own layout-refresh leftovers (new `src/db`/`src/documents`/`src/forms`/`createFormHook` paths) — quality-pass step 13 widens K's conformance *review* to cover H, I, M, launch-infra 2–7 and public-presence 14 (`launch-cross-spec-decisions.md` decision/edge note 27), not K's own unfinished bookkeeping on paths this spec never touches. Leave those two rows `[ ]`:

```markdown
  - [x] `harness doctor` clean (commit: <sha>)
```

Resolve against `git log -1 --format=%h -- '.agent/docs/specs/2026-11-06-quality-pass/review-*.md'` (the commit landing the last clean `review-<n>.md` from step 13).

#### .agent/docs/product/backlog.md

Procedure, since `findings.md`'s rows don't exist until steps 1–13 run — don't invent entries, derive them mechanically:

1. Grep `findings.md` for rows where the Disposition column is `backlog`, collecting each row's `ID`, `Surface`, `Width / theme`, `Criterion / APG`, `Tool`, `Evidence`.
2. For each `ID`, `grep -n "<ID>" .agent/docs/product/backlog.md`. Steps 6, 7 and 9 already file `backlog.md` entries for the structural findings they hit directly (their own "Structural findings → `backlog.md`" bullets) — most rows will already have an entry. Skip those.
3. For every `ID` with no match, append one entry at the end of the file, directly after the last existing `---` separator, in the file's own § Entry format:

```markdown
---

## {Surface} — {one-line description of the failure}

**What.** {Surface} fails {Criterion / APG} at {Width / theme}: {Evidence, quoted from the findings.md row}. Finding `{ID}` in `findings.md`.

**Why.** {the matching WCAG criterion's one-line testable requirement or the APG pattern's role/keyboard model, quoted from `sources.md`}.

**Lift.** Unassessed — exceeds the quality-pass fix boundary (spec-tasks.md: "classes, attributes, markup, and small keyboard/focus handlers (≤ ~30 lines, no public API change)"); the fix needs {the component rewrite or public-API change the Evidence column names}.

**Blockers.** {the package/component path named in Surface}.

**Why deferred.** Ratified out of scope for `2026-11-06-quality-pass`'s fix boundary; `{ID}` needs a structural change the boundary excludes.

**Detail.** `findings.md` row `{ID}`, `.agent/docs/specs/2026-11-06-quality-pass/findings.md`.
```

4. One-line description: `{Surface}` verbatim from the row; the description is the Criterion/APG name plus the structural defect named in Evidence (e.g. "Admin `DataTable` — sortable column headers have no APG grid keyboard model" from a row with `Surface = packages/react/src/ui/data-table`, `Criterion / APG = Grid`, `Evidence` naming the missing arrow-key handling). Never invent an Evidence string not already in the row.

#### .agent/docs/specs/2026-11-06-quality-pass/findings.md

For each row where step 3 above appended a new `backlog.md` entry, change that row's Status cell from `open` to `backlogged` (no other column changes).

Verify: `grep -c '^14\. \[x\]' .agent/docs/product/v0.1.0-launch-plan.md` plus a manual read of the J, V and K task lists (every row `[x]` except K's `tech-stack.md`/`harness sync` rows) with every `<sha>` resolved to a real commit; `grep -c '^\- \[x\] \|^  - \[x\] ' <range>` across J's and V's task-list ranges matches their row counts; `grep -c 'backlog' .agent/docs/specs/2026-11-06-quality-pass/findings.md` (Disposition = `backlog` rows) equals the number of matching `##` headings newly findable in `backlog.md` plus the number already filed by steps 6/7/9; `harness doctor` exits clean.

## Verification

After every step, and once more after step 14:

```bash
pnpm typecheck && pnpm test && pnpm lint
pnpm --filter www lint && pnpm --filter test lint
pnpm --filter www build
```

Failures that only touch files another session's `in-progress` step owns are not this spec's to
fix (coordination board rule 7); re-run once that step is `done`.
