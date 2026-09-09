---
status: draft
spec_id: 2026-09-08-react-bug-fixes
tier: low-care-override
touches:
  - "packages/react/src/components/fields/*/Cell.tsx"
  - "packages/react/src/components/fields/relationship/preview.tsx"
  - "packages/react/src/hooks/useTableSelection.ts"
  - "packages/react/src/hooks/usePaginatedQuery.ts"
  - "packages/react/src/hooks/usePagination.ts"
  - "packages/react/src/hooks/index.ts"
  - "packages/react/src/components/ui/data-table/DataTablePagination.tsx"
  - "packages/react/src/components/ui/data-table/index.ts"
  - "packages/react/src/testing/dataTableSuite.tsx"
  - "packages/react/src/components/modals/CreateDocumentModal.tsx"
  - "packages/react/src/components/views/MediaCollectionEditView.tsx"
  - "packages/react/src/components/views/MediaCollectionListView.tsx"
  - "packages/react/src/components/media/MediaUploadDropzone.tsx"
  - "packages/react/src/components/media/FilePreview.tsx"
  - "packages/core/src/collections/config.ts"
  - "packages/core/src/collections/config.test.ts"
  - "packages/core/package.json"
  - "pnpm-workspace.yaml"
  - ".changeset/"
  - ".agent/docs/product/backlog.md"
---

# React Bug Fixes — clear all 87 failing assertions

Fixes every defect catalogued in
`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`, plus two the report
missed, and deletes one family outright as dead code.

## Measured starting state

| Package | Failing | Total |
|---|---|---|
| `packages/react` | 52 | 1239 |
| `apps/test` | 35 | 906 |
| `apps/www` | 0 | 33 |
| `@vexcms/core` | 0 | 936 |
| better-auth / file-storage-convex / cli / create-vexcms | 0 | 99 |

87 failing assertions, 88 `findings.md` rows. `packages/react` coverage is **90.71%**
(3005 statements / 2726 covered), already past the 80% gate its own spec set.

## Corrections to the report, established during the interview

1. **`MODAL-2` is a 17th defect the report omits.** `findings.md` row 78: Escape pressed
   immediately after submit closes `CreateDocumentModal` and **the write still lands**. P0 by
   the report's own key — a user believes they cancelled and a document is created anyway.
2. **`CORE-LABEL-1` is two bugs.** The report caught `singular` (`"Posts"` for slug `posts`).
   It missed that `plural` double-pluralizes: `plural(toTitleCase("posts"))` → **`"Postses"`**,
   `categories` → `"Categorieses"`, `boxes` → `"Boxeses"`. Verified against real core. The
   plural is the more visible half — `AdminSidebar.tsx:124` renders `labels.plural` in the nav.
3. **`plural()` in `packages/core/src/utils.ts` is NOT buggy** and must not change. It
   correctly pluralizes its input; the bug is the call site handing it an already-plural word.
   It is also public API (`core/src/index.ts:23` re-exports `./utils`), so changing it would be
   a breaking change to a published export for no reason.
4. **`HOOK-1`, `HOOK-2`, `HOOK-3` and `HOOK-5` are defects in dead code.** `usePagination` and
   `DataTablePagination` have **zero** production consumers — both list views use
   `usePaginatedQuery` + `onLoadMore` (`CollectionListView.tsx:59,133`,
   `MediaCollectionListView.tsx:72,154`). `useTableSelection` is only *type*-referenced by
   `DataTableBulkActions`, which is never rendered. The report's P0 ranking of `HOOK-5` as a
   "destructive-action risk" assumed production reachability it does not have.
5. **Core has zero coverage of the label derivation.** All 935 core tests pass `labels`
   explicitly, so none exercise the inferred path. Every `apps/test` collection sets `labels`
   too, which is why `"Postses"` was never noticed.
6. **The report's open question #5 is moot.** `CORE-1` (`required` enforceability) was fixed by
   HEAD `10d3809`.

## Decisions

| Defect(s) | Decision |
|---|---|
| `CELL-3`, `DOC-1` | Add the `checkbox/Cell.tsx` guard shape to all 7 types. `text/Cell.tsx` is itself a crash variant so it is NOT the reference. Fix its lying JSDoc in the same change |
| `CELL-1` | Fix all 10 Cells by wrapping in `VexLink`. `useAsTitle` keeps its permissive type — "any field type can be a title" is the intended contract (report Q1) |
| `CELL-2` | Per-type definition of "the value". `array`'s stray config-text `title` is **replaced outright** (report Q2). `group` renders a serialized key preview so there is real text to truncate (report Q3) |
| `CORE-LABEL-1` | Add `pluralize-esm` (ESM, bundled types, zero deps, verified against irregulars and uncountables). Derive `singular` via singularization, `plural` as the title-cased slug itself. Treat as breaking. Leave `plural()` untouched |
| `HOOK-1`, `HOOK-2` | **Delete** `usePagination`, `DataTablePagination`, their tests, their exports, and the `"DataTablePagination"` member of `runDataTableSuite` |
| `HOOK-3`, `HOOK-5` | **Fix** — `useTableSelection` survives because `RBAC-2`'s note says bulk-delete is meant to be restored, and restoring it onto a hook whose "select all then untick one" silently fails is exactly the trap that note warns about |
| `HOOK-4`, `HOOK-6` | Fix together as one state-derivation rework — same region of `usePaginatedQuery.ts` |
| `MODAL-1`, `MODAL-2` | One synchronous in-flight guard gating **both** the submit control and dismissal |
| `RBAC-1` | Add `!canEdit` to both buttons' `disabled`, matching `CollectionEditView.tsx:113,121` |
| `RBAC-2` | Add the create-action `usePermission` + `aria-disabled` on Upload. `canDelete` stays unwired; its passing guard test stays |
| `MEDIA-1` | Read `accept` from the target media collection config; add `maxFiles: 1` |
| `MEDIA-2` | `alt || filename` now; decorative-image escape hatch → `backlog.md`, not this spec (report Q4) |

## Test Authoring Protocol still applies

`.agent/docs/specs/2026-09-08-react-coverage-expansion/spec.md`'s
`## Test Authoring Protocol` remains binding, and it cuts the other way here: **a test's
expected value may only change if the intended contract itself was wrong.** Every assertion in
`findings.md` encodes intent. Making one pass by editing the test rather than the source is the
softening this project's anti-regression clause prohibits.

Two exceptions, both explicit:
- `HOOK-1`/`HOOK-2`'s tests are **deleted** with the code they test, not edited.
- `HOOK-5`'s test may have its *mechanism* updated if the exclusion-set fix changes
  `UseTableSelectionReturn`'s shape, but its asserted outcome — an unticked row is not
  selected and the count drops — must not weaken.

Any other `findings.md` failure that starts passing must be traceable to a diff in
`packages/react/src/**` or `packages/core/src/**`, never to a test-only diff.

## Build order

`CELL-3` first: several types otherwise crash before a `CELL-1`/`CELL-2` fix on the same file
can be exercised on a null value. Cell groups then run 3 → 1 → 2 on overlapping files. The
hook, modal, view, media and core groups are mutually independent. Deletion lands early so no
later group wastes effort on code that is going away. Verification is last.

Every group's `Verify` must **pass** — unlike the coverage spec, this one ends green.

## Step 1 — Cell null guards + the lying JSDoc (CELL-3, DOC-1)

Why: 28 of 88 findings rows, and the only crash in the report. `text/Cell.tsx` and
`array/Cell.tsx` call `.length` on an unguarded `props.value`, and a throw in a cell renderer
takes down the whole table render. Must land before Steps 2-3 touch the same files.
Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{text,array,date,url,color,number,select}/Cell.test.tsx --coverage.enabled=false
- [x] `packages/react/src/components/fields/{text,array}/Cell.tsx` — Variant A, the crashers. Add the `checkbox/Cell.tsx:23` guard shape before any property access on `value`
- [x] `packages/react/src/components/fields/{date,url,color,number,select}/Cell.tsx` — Variant B. Same guard shape, returning the em-dash placeholder instead of `null` or empty markup
- [x] `packages/react/src/components/fields/text/Cell.tsx` — `DOC-1`: JSDoc claims an em-dash placeholder that did not exist and "80 characters" where the code cuts at 77. Correct both; the guard fix touches the exact lines the first claim is about

## Step 2 — Cell isTitleField link wrap (CELL-1)

Why: 20 findings rows. `useAsTitle` accepts any field slug (`core/src/collections/types.ts:170`),
so a `date` or `select` title column renders unlinked and the list view offers no route into
the document.
Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{number,checkbox,date,select,upload,relationship,array,group,blocks,color}/Cell.test.tsx --coverage.enabled=false
- [x] `packages/react/src/components/fields/{number,checkbox,date,select,upload,relationship,array,group,blocks,color}/Cell.tsx` — read `basePath` from `useVexConfig()` via `addLeadingSlash`, and when `props.isTitleField` wrap the existing rendered content in `<VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>`. A wrap, not a rewrite — each type keeps its own formatting inside the link
- [x] `packages/react/src/components/fields/relationship/Cell.tsx` — all four return paths need the wrap, not just the populated one

## Step 3 — Cell truncation + title attribute (CELL-2)

Why: 12 findings rows. Six types render user-controlled or unbounded text with no truncation
and no `title`, so the full value is unreachable by tooltip or any non-visual path.
Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{relationship,select,array,blocks,upload,group}/Cell.test.tsx --coverage.enabled=false
- [x] `packages/react/src/components/fields/{relationship,select,array,blocks,upload,group}/Cell.tsx` — cut at 77 with the full value on `title`, per `text/Cell.tsx`'s pattern
- [x] `packages/react/src/components/fields/relationship/preview.tsx` — `DefaultRelationshipPreview` renders the resolved label in a bare `<span>`; truncation belongs here
- [x] `packages/react/src/components/fields/array/Cell.tsx` — replace the existing `title` (static `${fieldDef.type} - ${fieldDef.label}` config text) with the value, per the interview decision
- [x] `packages/react/src/components/fields/group/Cell.tsx` — render a serialized key preview so there is real text to slice, replacing the fixed `{ N keys }` summary

## Step 4 — Delete the dead pagination family (HOOK-1, HOOK-2)

Why: `usePagination` and `DataTablePagination` have zero production consumers — both list views
use `usePaginatedQuery` + `onLoadMore`. Fixing defects in unreachable code, and maintaining a
page-number UI the admin deliberately replaced, is waste. Lands before the remaining hook work
so nothing is spent on code that is going away.
Verify: pnpm --filter @vexcms/react exec vitest run src/components/ui/data-table src/hooks --coverage.enabled=false && pnpm --filter @vexcms/react exec tsc --noEmit -p tsconfig.check.json
- [x] Delete `packages/react/src/hooks/usePagination.ts` and `packages/react/src/hooks/usePagination.test.tsx`
- [x] Delete `packages/react/src/components/ui/data-table/DataTablePagination.tsx` and `DataTablePagination.test.tsx`
- [x] `packages/react/src/hooks/index.ts` — drop the `export * from "./usePagination"` line
- [x] `packages/react/src/components/ui/data-table/index.ts` — drop the `DataTablePagination` re-export
- [x] `packages/react/src/testing/dataTableSuite.tsx` — remove `"DataTablePagination"` from `DataTableSuiteMember`, from the default `only` list, and delete its `describe` block plus the now-unused `usePagination`/`DataTablePagination` imports
- [x] Confirm no remaining reference: `goToPage`, `usePagination` and `DataTablePagination` appear nowhere in `packages/**/src` or `apps/**/src`

## Step 5 — useTableSelection exclusion semantics (HOOK-5, HOOK-3)

Why: "Select all, then untick one" is the most common bulk-edit gesture, and today
`isRowSelected` still reports the unticked row as selected. `RBAC-2`'s note says bulk-delete is
meant to be restored; restoring it onto this hook would delete a row the user excluded.
Verify: pnpm --filter @vexcms/react exec vitest run src/hooks/useTableSelection.test.tsx --coverage.enabled=false
- [x] `packages/react/src/hooks/useTableSelection.ts` — `HOOK-5`: give `mode === "all"` real "all except these ids" semantics. `isRowSelected` and `getSelectionCount` must consult the exclusion set instead of short-circuiting on the mode string
- [x] `packages/react/src/hooks/useTableSelection.ts` — `HOOK-3`: compute `nextMode` into a local and pass it to both `setMode` and `onSelectionChange`, so the callback reports post-change state rather than the stale closure value
- [x] If `UseTableSelectionReturn`'s shape changes, update `DataTableBulkActions.tsx`'s type import and `testing/dataTableSuite.tsx`'s selection-count assertions — the asserted outcomes must not weaken

## Step 6 — usePaginatedQuery state derivation (HOOK-6, HOOK-4)

Why: `isDone` reads `true` while the first page is loading and forever after a query error, so
a transient network failure is indistinguishable from a complete empty collection with no retry
affordance. `loadMore()` also reveals page N only on call N+1. Both stem from inferring state
from `data`'s absence and from where `clientPageIndex` advances — one rework, not two.
Verify: pnpm --filter @vexcms/react exec vitest run src/hooks/usePaginatedQuery.test.tsx src/components/views/CollectionListView.test.tsx src/components/views/MediaCollectionListView.test.tsx --coverage.enabled=false
- [x] `packages/react/src/hooks/usePaginatedQuery.ts` — `HOOK-6`: thread `useQuery`'s own `isLoading`/`isError` into the `result` memo instead of inferring from `data === undefined`, and default the placeholder's `isDone` to `false`
- [x] `packages/react/src/hooks/usePaginatedQuery.ts` — `HOOK-4`: advance `clientPageIndex` relative to the accumulator read so one `loadMore()` reveals one page. Most likely a reorder, not a fetch-logic change
- [x] Both list views consume this hook — confirm their suites still pass, since `onLoadMore` behavior changes

## Step 7 — Modal in-flight guard (MODAL-1, MODAL-2)

Why: two P0 "user believes they didn't do that" defects in one file. A rapid double-click
creates the document twice; Escape immediately after submit closes the dialog while the write
still lands. `isPending` flips only after TanStack Form's async validation `await`, so there is
a window where neither is guarded.
Verify: pnpm --filter @vexcms/react exec vitest run src/components/modals --coverage.enabled=false
- [x] `packages/react/src/components/modals/CreateDocumentModal.tsx` — a local in-flight flag set **synchronously** on submit, before awaiting validation. Gate the submit control on it (`MODAL-1`) and gate dismissal — Escape, backdrop, Cancel — on it too (`MODAL-2`)
- [x] Keep `useVexMutation`'s `isPending` in the disabled expression as well; the local flag covers the pre-await window, `isPending` covers the request itself

## Step 8 — View RBAC gating (RBAC-1, RBAC-2)

Why: 8 findings rows. `MediaCollectionEditView` drops `canEdit` from its Save/Cancel
`disabled` expression, and `MediaCollectionListView` never checks create permission for its
Upload button.
Verify: pnpm --filter @vexcms/react exec vitest run src/components/views/MediaCollectionEditView.test.tsx src/components/views/MediaCollectionListView.test.tsx src/components/views/CollectionListView.test.tsx --coverage.enabled=false
- [x] `packages/react/src/components/views/MediaCollectionEditView.tsx` — add `!canEdit` to both buttons' `disabled`, matching `CollectionEditView.tsx:113,121`
- [x] `packages/react/src/components/views/MediaCollectionListView.tsx` — add the create-action `usePermission` check and wire `aria-disabled={!canCreate}` onto Upload, using the disabled-link pattern `CollectionListView` already uses
- [x] Leave `canDelete` unwired in both list views. Its passing `it("has no reachable destructive control while bulk-delete UI remains unwired")` guard test and its code comment stay exactly as they are

## Step 9 — Media upload filtering and alt text (MEDIA-1, MEDIA-2)

Why: the standalone dropzone accepts any mime type while the field-level upload path filters —
a user can drop an executable. And `FilePreview`'s alt fallback is dead code, so every image
without alt text renders `alt=""`.
Verify: pnpm --filter @vexcms/react exec vitest run src/components/media --coverage.enabled=false
- [x] `packages/react/src/components/media/MediaUploadDropzone.tsx` — read `accept` from the target media collection's config (matching `fields/upload/Input.tsx`) and pass it to `useDropzone`; add `maxFiles: 1` beside `multiple: false` so a same-batch multi-file drop keeps the first file, per `fields/upload/EmptyInput.tsx`'s `slice(0, 1)`
- [x] `packages/react/src/components/media/FilePreview.tsx` — `alt || filename`; `??` never fires because `VexMediaDocument.alt` is a required `string` and is `""` when unset
- [x] `.agent/docs/product/backlog.md` — file the decorative-image escape hatch (report Q4): `alt=""` is correct for decorative images, so a distinct signal is needed rather than overloading the empty string

## Step 10 — Core label derivation (CORE-LABEL-1)

Why: cross-package and breaking. `defineCollection` derives `singular: "Posts"` and
`plural: "Postses"` for slug `posts`. Every consumer that omits `labels` sees both in the admin
UI — `AdminSidebar.tsx:124` renders `labels.plural` in the nav.
Verify: pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react exec vitest run src/components/modals/CreateDocumentModal.test.tsx --coverage.enabled=false
- [x] `pnpm-workspace.yaml` — add `pluralize-esm: 9.0.5` to the catalog. ESM (`type: module`), bundled types, zero deps; verified to handle irregulars (`people`→`person`, `shelves`→`shelf`, `children`→`child`) and uncountables (`media`, `news`, `series`)
- [x] `packages/core/package.json` — add `pluralize-esm: "catalog:"` to `dependencies`. Runtime deps are externalized per `.agent/docs/standards/tooling/tsup-and-exports.md`
- [x] `packages/core/src/collections/config.ts` — derive `singular` by singularizing the slug before title-casing, and `plural` as the title-cased slug itself (slugs are plural by convention). Do **not** call `plural()` here and do **not** modify `plural()` in `utils.ts` — it is correct and is public API
- [x] `packages/core/src/collections/config.test.ts` — new tests for **both** paths: omitted `labels` derives correctly across regular, irregular and uncountable slugs; explicitly-provided `labels` pass through verbatim and are untouched by the derivation
- [x] `.changeset/` — a changeset covering the breaking label change, naming the old and new output and telling consumers to set `labels` explicitly to keep today's values

## Step 11 — Full verification, coverage, and bookkeeping

Why: the deliverable is a green workspace, not a green package. `apps/test` runs the published
kit through the ADR-009 dual-context path, so a fix that works in-package can still fail there.
Verify: pnpm --filter @vexcms/react exec vitest run --coverage 2>&1 | grep -E "^(Statements|Tests)" && pnpm --filter test exec vitest run --coverage.enabled=false && pnpm --filter www exec vitest run --coverage.enabled=false && pnpm --filter @vexcms/core test && pnpm typecheck && pnpm build && pnpm lint && harness doctor
- [x] `packages/react` — 0 failing tests; coverage still at or above the 80% gate (was 90.71%; deleting the dead pagination family drops it to ~90.42%, still well clear)
- [x] `apps/test` — all 906 pass, including the 35 that were red. Requires `pnpm --filter @vexcms/react build` first so the consumer resolves the fixed `dist`
- [x] `apps/www`, `@vexcms/core`, better-auth, file-storage-convex, cli, create-vexcms — no regressions
- [x] `node scripts/record-test-findings.mjs --spec 2026-09-08-react-coverage-expansion "packages/react/src/**/*.test.ts?(x)"` — regenerate the source spec's `findings.md`; every row must be gone. A row that disappears without a matching source diff means an assertion was softened
- [x] `.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md` — mark each defect resolved and record `MODAL-2` and the `plural` half of `CORE-LABEL-1`, which the report never captured
- [x] `pnpm lint` — 0 errors, including jsdoc on every export touched
- [x] `harness struct && harness sync && harness doctor` — clean
