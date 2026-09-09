---
status: draft
spec_id: 2026-09-08-react-coverage-expansion
touches:
  - "packages/react/vitest.config.ts"
  - "packages/react/src/testing/**"
  - "packages/react/src/hooks/*.test.tsx"
  - "packages/react/src/components/fields/*/Cell.test.tsx"
  - "packages/react/src/components/fields/*/columnDef.test.ts"
  - "packages/react/src/components/views/*.test.tsx"
  - "packages/react/src/components/*.test.tsx"
  - "packages/react/src/components/ui/data-table/*.test.tsx"
  - "packages/react/src/components/modals/*.test.tsx"
  - "packages/react/src/components/media/*.test.tsx"
  - "apps/test/vitest.config.ts"
  - "apps/test/src/vexcms/admin.test.ts"
  - "apps/www/vitest.config.ts"
  - "apps/www/src/vexcms/admin.test.ts"
  - ".agent/docs/standards/testing/react-test-factories.md"
  - ".agent/docs/standards/testing/coverage-policy.md"
  - "scripts/record-test-findings.mjs"
prompt_version: 1
---

# 2026-09-08-react-coverage-expansion — Tasks

Raises `@vexcms/react` statement coverage from **58.2% to 80%** on first-party code, covering
the surface the `2026-09-04-react-test-suite` spec deliberately scoped out: list-view cells,
column defs, the data table, views, admin shell, modals, hooks and media.

**Measured baseline** (`pnpm --filter @vexcms/react exec vitest run --coverage`, 917/918
passing): 50.13% across 2679 statements. After the Step 1 exclusions the denominator is
**1884 first-party statements at 58.2% (1096 covered)**. The 80% gate needs **+412** of the
**788** available — 52% of remaining uncovered code. Verified reachable before being written
as an acceptance criterion.

**Additive only.** The 12 field-input edit-form suites are complete and green; no task group
touches them.

**This spec closes with a deliberately RED suite.** The base Cell contract surfaces ~13 real
defects (9 `isTitleField`, 4 truncation) which are **recorded, not fixed** — fixing them is a
follow-up spec. Consequences, all handled below:
- Every Verify that would otherwise run a plain `vitest`/`pnpm test` over the field Cells goes
  through `scripts/record-test-findings.mjs`, which exits 0 when tests ran and non-zero only
  when a file cannot collect. Same mechanism the 09-04 spec used.
- **Coverage is unaffected by the failures.** A failing assertion still renders the component,
  so those statements are still counted — the 80% gate stands on its own.
- Step 9 produces the BUGS-REPORT that hands the ~13 defects to the fix spec.

## Interview decisions

| Decision | Answer |
|---|---|
| Priority | Value-per-effort: hooks → views+shell → Cell/columnDef → data-table/modals → media |
| Strategy | Contract factory for repeated shapes (Cell), targeted tests elsewhere |
| Target | **80%**, vendored code excluded from the denominator |
| Vendored exclusions | shadcn/Base UI primitives **and** `ui/datetime/**` (vendored from `github.com/huybuidac/shadcn-datetime-picker`; upstream carries its own tests) |
| Exclusion policy | `coverage.exclude` + a standards rule naming the criterion, so it cannot become a silent loophole |
| View depth | Hybrid — full-mount views for integration **and** isolated Cell/columnDef contract suites |
| `usePaginatedQuery` | Extend the existing convex bridge with a `findPaginated` handler; no hand-typed fixtures |
| Cell contract | Base: `isTitleField` link + null placeholder + truncation + a11y. Truncation is **opt-out** (`truncates: false`); everything else per-type |
| Media | Render states, selection, accept filtering — no real upload round-trip |
| Consumers | `runVexReactSuite` gains a `sections` string array, defaulting to all; both apps get measured floors |
| Base-contract defects | **Record and defer** — tests ship red, filed to a BUGS-REPORT for a follow-up fix spec |

**`isTitleField` is a universal contract, and 9 of 12 Cells currently violate it.**
`useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>` (`collections/types.ts:170`) accepts ANY
field key — there is no narrowing to text-ish types — so a `date`, `number` or `select` field
can legitimately be the title column. Only `text`, `url` and `color` handle the prop; the
other **nine ignore it**, meaning with such a title field the column is silently not clickable
and the list view offers no way into the document. The base contract asserts it precisely to
surface those nine.

**Truncation is asserted by DEFAULT and opted out explicitly.** By value shape 8 of 12 types
can render an unbounded string — `text`, `url`, `upload` (filename), `group` (summary),
`relationship` (doc-title chips), `select` (multi-value labels), `array` and `blocks` (item
summaries). Only `date` (fixed format), `number`, `checkbox` (boolean) and `color`
(`#e8622a`) genuinely should not, and those four pass `truncates: false`.

Defaulting the assertion ON makes the contract a forcing function: a newly added field type
must consciously declare `truncates: false` rather than silently inheriting no coverage. Only
4 of the 8 that should truncate currently do (`text`, `url`, `upload`, `group`), so this
surfaces 4 further real defects — `relationship`, `select`, `array` and `blocks` can each
render an arbitrarily long cell today.

## Step 1 — Coverage policy: exclusions, thresholds, standards rule
Why: Every later group's Verify measures against this denominator, so it must be defined and
justified first. Excluding vendored code is what makes 80% mean something about our own code
rather than a number dragged by third-party wrappers.
Verify: pnpm --filter @vexcms/react exec vitest run --coverage 2>&1 | grep -E "^Statements" && test "$(node -e "const s=require('./packages/react/coverage/coverage-summary.json');process.stdout.write(String(s.total.statements.total<2000))")" = true
- [x] `packages/react/vitest.config.ts` — `coverage.exclude` for the vendored shadcn/Base UI primitives and `src/components/ui/datetime/**`, each with an inline comment citing its upstream source; add `coverage.reporter` `json-summary` so later groups can assert numbers programmatically
- [x] `.agent/docs/standards/testing/coverage-policy.md` — new standards doc (`applies_to: ["packages/*/vitest.config.ts"]`): only files vendored verbatim from a named upstream may be excluded, any hand-modification returns a file to the denominator, and the exclusion list requires the upstream URL
- [x] Record the post-exclusion baseline in the spec's Verification section as the number later groups move

## Step 2 — Hooks: usePagination, useTableSelection
Why: 92 statements at 0% and the cheapest coverage in the package — both import only React and
core types, so `renderHook` needs no providers at all. Highest value per unit of effort, and
they underpin the data-table work in Step 5.
Verify: node scripts/record-test-findings.mjs packages/react/src/hooks/usePagination.test.tsx packages/react/src/hooks/useTableSelection.test.tsx
- [x] `packages/react/src/hooks/usePagination.test.tsx` — page/pageSize state transitions, boundary clamping (first/last page, out-of-range), `pageCount` derivation, option defaults
- [x] `packages/react/src/hooks/useTableSelection.test.tsx` — select/deselect one, select-all/none, indeterminate derivation, selection surviving a page change, clearing

## Step 3 — Hooks: usePaginatedQuery via the convex bridge
Why: 37 statements at 0% and the only hook needing real data. Driving it through the existing
`createFakeConvexClient` keeps the testing standards' "real query execution, no hand-typed
response fixtures" rule intact, and the same `findPaginated` handler serves Step 4's
full-mount view tests.
Verify: node scripts/record-test-findings.mjs packages/react/src/hooks/usePaginatedQuery.test.tsx
- [x] `packages/react/src/testing/convex/bridge.ts` — add a `findPaginated` entry to `QUERY_HANDLERS` returning a real `PaginationResult` from convex-test, plus the matching `anyApi` reference export
- [x] `packages/react/src/testing/convex/schema.ts` — seed helper producing enough documents to page through
- [x] `packages/react/src/hooks/usePaginatedQuery.test.tsx` — first page, cursor advance, `isDone` on the last page, empty result, and page-size change resetting the cursor

## Step 4 — Views + admin shell (full-mount, RBAC-gated)
Why: 149 statements at 0%, and the 14 `usePermission` gating sites across five views and
`AdminSidebar` are exactly what the 09-04 spec deferred — where a wrong permission answer is
user-visible. `runRbacStateSuite` already exists for this. Full-mount also exercises the
list-view stack transitively, which is where ADR-009-class composition defects appear.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/views/{CollectionListView,CollectionEditView,GlobalEditView,GlobalsListView,DashboardView,UnauthorizedView,MediaCollectionListView,MediaCollectionEditView}.test.tsx packages/react/src/components/{AdminLayout,AdminSidebar,AdminTopNav}.test.tsx
- [x] `packages/react/src/testing/harness/viewHarness.tsx` — one mount helper composing the providers every view needs (`VexConfigContext`, Convex + QueryClient via the Step 3 bridge, nuqs, access/auth), reusing `renderWithVexProviders` rather than duplicating it
- [x] `packages/react/src/components/views/CollectionListView.test.tsx`, `CollectionEditView.test.tsx` — full mount: rows render from seeded data, `canCreate`/`canDelete`/`canEdit` gate their controls across `runRbacStateSuite`'s five scenarios, empty state
- [x] `packages/react/src/components/views/GlobalEditView.test.tsx`, `GlobalsListView.test.tsx`, `DashboardView.test.tsx`, `UnauthorizedView.test.tsx` — render + gating per view
- [x] `packages/react/src/components/views/MediaCollectionListView.test.tsx`, `MediaCollectionEditView.test.tsx` — same, against the media collection config
- [x] `packages/react/src/components/AdminSidebar.test.tsx` — nav entries filtered by `usePermission` per collection/global/media collection (three call sites), across all five scenarios
- [x] `packages/react/src/components/AdminLayout.test.tsx`, `AdminTopNav.test.tsx` — framework-component injection (`Link`/`Image` overrides), active-route highlighting, the `"skip"` sentinel path on globals routes

## Step 5 — List view: Cell contract factory + per-type cells + columnDefs + data table
Why: 166 statements at 0% across 26 files. A registry-driven Cell factory mirrors
`runFieldInputContractSuite` exactly, so all 12 types share the null-placeholder and a11y
assertions while each keeps its own rendering in `extra`. The data table is the component the
cells render inside, so it belongs in the same group.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/fields/{text,number,checkbox,date,url,color,select,upload,relationship,array,group,blocks}/Cell.test.tsx && pnpm --filter @vexcms/react exec vitest run src/components/ui/data-table --coverage.enabled=false
- [x] `packages/react/src/testing/fieldCellContract.ts` — `runFieldCellContractSuite({ fixture, Component, truncates?, extra? })`: base assertions are the null/undefined placeholder, the `isTitleField` edit-link wrap, truncation with a `title` attribute carrying the full value, and `expectNoA11yViolations`. `truncates` defaults to `77` (text/Cell.tsx's existing threshold) and is set to `false` by the four types where truncation is meaningless; everything else is the caller's `extra`
- [x] `packages/react/src/components/fields/*/Cell.test.tsx` (12 files) — each calls the factory with its own `testFixture` and asserts its own rendering in `extra`: text truncation + `isTitleField` link, number/date formatting, checkbox state, color swatch, select labels, relationship chips, upload thumbnail, array/group/blocks summaries
- [x] `packages/react/src/components/fields/*/columnDef.test.ts` (12 files) — one parameterized assertion set per type: `accessorKey`, cell renderer identity, `meta.alignment` from `admin.cellAlignment`, header from `label`
- [x] `packages/react/src/components/ui/data-table/DataTable.test.tsx`, `DataTablePagination.test.tsx`, `DataTableBulkActions.test.tsx`, `DeleteManyModal.test.tsx` — sorting, pagination controls wired to `usePagination`, bulk selection wired to `useTableSelection`, delete-many confirm/cancel

## Step 6 — Modals + media
Why: The last two first-party gaps — modals 19 statements at 5%, media 148 at 40%. Media stays
short of a real upload round-trip: `upload/Input.test.tsx` already proves that path, so these
tests cover render states, selection and accept filtering only.
Verify: node scripts/record-test-findings.mjs packages/react/src/components/modals/{BaseModal,CreateDocumentModal,CreateMediaModal}.test.tsx packages/react/src/components/media/{FilePreview,MediaLibaryGrid,MediaUploadDropzone}.test.tsx
- [x] `packages/react/src/components/modals/BaseModal.test.tsx`, `CreateDocumentModal.test.tsx`, `CreateMediaModal.test.tsx` — open/close, escape and backdrop dismissal, focus trap, submit wiring
- [x] `packages/react/src/components/media/FilePreview.test.tsx` — per-mime rendering branches (image, video, audio, document, unknown) using the existing `makeFile()` helper
- [x] `packages/react/src/components/media/MediaLibaryGrid.test.tsx` — empty/loading/populated states, item selection, multi-select (note: filename retains the existing `Libary` typo — renaming is out of scope, it is tracked separately in the harness inbox)
- [x] `packages/react/src/components/media/MediaUploadDropzone.test.tsx` — accept/reject filtering by mime, drag-enter/leave visual state, multi-file staging

## Step 7 — Consumer surface: `sections` selector and measured floors
Why: The suites above are internal until `runVexReactSuite` exposes them, and consuming them
through the published subpath is the only place dual-context/packaging defects (ADR-009) show
up. Floors are written from measured numbers, never guessed (AP-012).
Verify: pnpm --filter @vexcms/react build && node scripts/record-test-findings.mjs apps/test/src/vexcms/admin.test.ts && node scripts/record-test-findings.mjs apps/www/src/vexcms/admin.test.ts
- [x] `packages/react/src/testing/index.ts` — add `sections?: VexSuiteSection[]` (union of `"fields" | "cells" | "columnDefs" | "views" | "shell" | "dataTable" | "modals" | "hooks" | "media"`), defaulting to ALL sections; each section gates its own dispatch block. Purely additive conditional dispatch — no restructuring. Keep `includeCore` working as sugar for the field sections so `apps/www`'s existing `includeCore: false` call is unbroken, and document the interaction
- [x] `packages/react/src/testing/index.test.ts` — asserts the default runs every section, a `sections` subset runs only those, and `includeCore: false` still suppresses the field sections
- [x] `apps/test/src/vexcms/admin.test.ts` — run the full section set (dogfood host)
- [x] `apps/www/src/vexcms/admin.test.ts` — keep the fast smoke by naming an explicit subset rather than `includeCore: false`
- [x] `apps/test/vitest.config.ts`, `apps/www/vitest.config.ts` — `coverage.thresholds` set from the numbers measured in this group's own run, not estimated

## Step 8 — Gate the 80% target and record the policy
Why: Turns the target into an enforced floor rather than a one-off measurement, and captures
the conventions the new factories introduce so the next field type follows them.
Verify: node scripts/record-test-findings.mjs "packages/react/src/**/*.test.ts?(x)" && node -e "const s=require('./packages/react/coverage/coverage-summary.json');if(s.total.statements.pct<80)throw new Error('statements '+s.total.statements.pct+'% < 80%')" && harness doctor
- [x] `packages/react/vitest.config.ts` — `coverage.thresholds.statements: 80` (plus branches/functions/lines at their measured values) so a regression fails the build
- [x] `.agent/docs/standards/testing/react-test-factories.md` — document `runFieldCellContractSuite` (and its deliberately minimal shared contract), the view harness, and the `sections` selector alongside the existing factories
- [x] Run `harness struct && harness sync`; confirm `harness doctor` is clean, the 918 pre-existing tests still pass, and the ONLY failures are the ~13 recorded base-contract defects — any other red test is a defect in this spec's own work
- [x] `coverage.thresholds` is asserted programmatically against `coverage-summary.json`, not eyeballed from the terminal table (a cached `FULL TURBO` banner is not evidence the check ran)

## Step 9 — File the recorded defects for the follow-up fix spec
Why: The ~13 base-contract failures are this spec's second output, and they are only useful if
they arrive triaged. Without this the next agent inherits a red suite and no explanation.
Verify: test -f .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md && grep -qE "isTitleField|truncat" .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md
- [x] `.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md` — triaged from `findings.md`, in the shape the 09-04 spec's report used: root cause, affected files, severity, suggested direction, and the reference implementation for each (`text/Cell.tsx` already does both correctly)
- [x] Group the two causes explicitly: `CELL-1` — 9 Cells ignore `isTitleField`, so a non-text title column is unclickable and offers no route into the document; `CELL-2` — 4 Cells render unbounded values with no truncation or `title` attribute
- [x] Note that `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>` (`packages/core/src/collections/types.ts:170`) is what makes `CELL-1` reachable — any field key is legal as the title field
- [x] State the expected failure count so a future run can tell a NEW regression from a known one
