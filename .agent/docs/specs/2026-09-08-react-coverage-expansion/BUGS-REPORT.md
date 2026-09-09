# `@vexcms/react` Cell Coverage — Bug Report

> **Purpose.** Triaged output of the `2026-09-08-react-coverage-expansion` spec. Written to
> be fed straight into a fix spec, the same way `.agent/docs/specs/2026-09-04-react-test-suite/
> BUGS-REPORT.md` was for the field-input suite.
>
> **Every finding below is backed by a failing (red) assertion, not a passing one.** This
> spec's binding Test Authoring Protocol ("assert intended behavior, never observed
> behavior") required every step to assert intent and let the assertion fail, rather than pin
> whatever the code currently does. There is no "suspected / pinned by a passing test" tier:
> every defect here is in the red baseline. Three findings — `HOOK-5`, `HOOK-6`, and
> `MODAL-1` — exist *only* because the Protocol forced an intent assertion (or, for
> `MODAL-1`, its mandatory "submit twice rapidly" edge case) where pinning current behavior
> would have hidden them.
>
> **Read `CELL-3` → `HOOK-5` → `HOOK-6` → `MODAL-1` → `CELL-1` → `HOOK-1` → `MEDIA-1` →
> `MEDIA-2` → `RBAC-1` → `RBAC-2` → `HOOK-2` → `CELL-2` → `DOC-1` → `CORE-LABEL-1` →
> `HOOK-3` → `HOOK-4`,** in that order — `CELL-3`'s crash variant is the most severe finding
> in this report, followed by three destructive/data-integrity risks (`HOOK-5`, `HOOK-6`,
> `MODAL-1`) that rank alongside it. All four `CELL-*`/`DOC-1` causes were found by a
> full-file read of every `packages/react/src/components/fields/*/Cell.tsx` against the shared
> base contract in `packages/react/src/testing/fieldCellContract.ts` (four assertions: null
> placeholder, `isTitleField` link-wrap, truncation, `expectNoA11yViolations`) — not inferred
> from a name. **`text/Cell.tsx` was originally treated as this report's single reference
> implementation. That assumption was wrong on two of its three documented behaviors — see
> `DOC-1`. Do not adopt it as a template without checking each behavior it claims.**

### Resolution — `2026-09-08-react-bug-fixes`

Every defect below is resolved by the follow-up fix spec (`.agent/docs/specs/
2026-09-08-react-bug-fixes/spec.md`). Per its own binding contract, every fix changed the
component or hook source, never the test's expected value — the two authorised exceptions are
`HOOK-1`/`HOOK-2`'s tests, deleted along with the dead code they tested, and `HOOK-5`'s test
mechanism, updated to match `useTableSelection`'s new exclusion-set return shape without
weakening its asserted outcome. `MODAL-2` and `CORE-LABEL-1`'s `plural` half — never captured
by this report — are filed below as new entries, both resolved by the same fix spec.

| ID | Fixed by | Resolution |
| --- | --- | --- |
| `CELL-3` | Step 1 | Null/undefined guard (`checkbox/Cell.tsx`'s shape) added to `text`, `array`, `date`, `url`, `color`, `number`, `select` |
| `CELL-4` | Step 1 | Never filed by this report — `date/Cell.tsx` swallowed epoch `0` as absent. The same strict guard fixes it for free; see the new entry below |
| `DOC-1` | Step 1 | `text/Cell.tsx` JSDoc corrected: em-dash placeholder documented accurately, "80 characters" corrected to 77 |
| `CELL-1` | Step 2 | `isTitleField` → `VexLink` wrap added to `number`, `checkbox`, `date`, `select`, `upload`, `relationship` (all 4 return paths), `array`, `group`, `blocks`, `color` |
| `CELL-2` | Step 3 | 77-char truncation + full value on `title` added to `relationship` (incl. `preview.tsx`), `select`, `array` (replacing the stray config-text `title`), `blocks`, `upload`, `group` (now renders a serialized key preview) |
| `HOOK-1` | Step 4 | `usePagination.ts` deleted — zero production consumers |
| `HOOK-2` | Step 4 | `DataTablePagination.tsx` deleted with it |
| `HOOK-3` | Step 5 | `useTableSelection`'s `nextMode` computed into a local and passed to both `setMode` and `onSelectionChange`, so the callback reports post-change state |
| `HOOK-5` | Step 5 | `mode === "all"` given real "all except these ids" exclusion-set semantics; `isRowSelected`/`getSelectionCount` consult it instead of short-circuiting on the mode string |
| `HOOK-4` | Step 6 | `usePaginatedQuery`'s `clientPageIndex` advance reordered so one `loadMore()` reveals one page |
| `HOOK-6` | Step 6 | `result` memo threads `useQuery`'s own `isLoading`/`isError`; placeholder `isDone` now defaults to `false` |
| `MODAL-1` | Step 7 | `CreateDocumentModal` gains a synchronous in-flight flag, set before awaiting validation, gating the submit control |
| `MODAL-2` | Step 7 | The same in-flight flag also gates dismissal (Escape, backdrop, Cancel) — see the new entry below |
| `RBAC-1` | Step 8 | `MediaCollectionEditView` adds `!canEdit` to Save/Cancel `disabled`, matching `CollectionEditView` |
| `RBAC-2` | Step 8 | `MediaCollectionListView` adds a create-action `usePermission` check, wired to `aria-disabled` on Upload. `canDelete` stays intentionally unwired — no reachable destructive control exists yet, so its guard test stays as a non-defect note |
| `MEDIA-1` | Step 9 | `MediaUploadDropzone` filters by a fixed safe-media `accept` allowlist (core carries no per-media-collection accepted-types setting) and truncates a multi-file drop to the first file inside `onDrop` |
| `MEDIA-2` | Step 9 | `FilePreview`'s `mediaDoc.alt ?? mediaDoc.filename` changed to `mediaDoc.alt \|\| mediaDoc.filename` — `alt` is a required `string`, so `??` never fired |
| `CORE-LABEL-1` | Step 10 | `defineCollection` now singularizes before title-casing for `labels.singular`, and derives `labels.plural` as the title-cased slug itself with no `plural()` call — see the addition to this ID's own entry below for the `plural` half this report missed |

### Failure baseline

This report intentionally states **no fixed failure count**. The authoritative failure set is
whatever `scripts/record-test-findings.mjs` writes into this spec's `findings.md`:

- Measured at implementation close: **52 failing assertions** inside `packages/react`
  (30 Cell base-contract + 8 RBAC-gated view + 9 hook + 5 modal/media), and **35** in the
  `apps/test` consumer run (30 Cell + 5 modal/media — the view/shell/data-table sections pass
  there). `findings.md`, not these numbers, is the baseline a future run compares against.
- Every defect below carries a code comment in its test file naming the id it proves
  (`// FAILS: … — see BUGS-REPORT <ID>`), so a reader can tell a discovered defect from a
  broken test at a glance.
- **A `findings.md` failure that starts passing must be traceable to a diff in component or
  hook source (`packages/react/src/**`, or `packages/core` for `CORE-LABEL-1`), never to a
  diff in only a test file's expected value.** A shrinking failure count with no matching
  source change means an assertion was softened — see Step 8's anti-regression clause.

The three `CELL-*` groups do not overlap on the same assertion for the same type — a type can
appear in more than one group (e.g. `array` is in both `CELL-3`'s crash variant and `CELL-2`),
but each group counts a distinct base-contract assertion.

### Severity key

- **P0** — crashes the render, or a silent destructive/data-integrity risk: an action a user
  believes they did NOT take (or a state a user believes is safe) executes anyway.
- **P1** — silent data/validation correctness, or a control a user cannot operate.
- **P3** — inconsistency, dead code, a documentation mismatch, or a decision to make.

---

### P0 — Critical

#### CELL-3 — 7 of 12 Cells mishandle a null/undefined value; 2 of those crash the table render

**The most severe finding in this report.** The base contract's first assertion is the
simplest one — render the em-dash placeholder for a `null`/`undefined` value — and 7 of 12
types fail it, in two variants of very different severity.

**Variant A — uncaught `TypeError`, crashes the render (rank above `CELL-1` and `CELL-2`).**
`text/Cell.tsx` and `array/Cell.tsx` both call `.length` directly on `props.value` with no
guard:

```tsx
// packages/react/src/components/fields/text/Cell.tsx:31 (also line 38, the non-title branch)
{props.value.length > 77 ? `${props.value.slice(0, 77)}...` : props.value}
```

```tsx
// packages/react/src/components/fields/array/Cell.tsx:24
const itemCount = props.value.length;
```

`CellComponentProps.value` is documented by these very components' own JSDoc as "may be null
or undefined." That's not a hypothetical: any optional `text()`/`array()` field, or any
document written before the field existed, reaches this code path with `value === undefined`.
`props.value.length` on `undefined` throws — and a throw inside one cell renderer takes down
the **entire table's render**, not just that column. Reachable in normal use.

**Variant B — renders nothing instead of the em-dash placeholder.** Less severe (no crash),
still a defect: the user sees a blank cell with no indication whether that's the real value
or a rendering failure.

| Field | Cause |
|---|---|
| `date` | `if (!props.value) { return null; }` (`date/Cell.tsx:24`) |
| `url` | `if (!props.value) return null;` (`url/Cell.tsx:27`) |
| `color` | `if (!props.value) return null;` (`color/Cell.tsx:22`) |
| `number` | `return <span>{props.value}</span>;` (`number/Cell.tsx:22`) — renders an empty `<span>` for `undefined`, no placeholder |
| `select` | `const value = props.value ?? [];` (`select/Cell.tsx:24`) — renders an empty `<div>`, no placeholder |

**Correct today (5 of 12) — use one of these as the fix reference, NOT `text/Cell.tsx`:**
`checkbox`, `group`, `blocks`, `upload`, `relationship`. All five guard explicitly before
touching the value. Example (`checkbox/Cell.tsx:23`):

```tsx
if (props.value === undefined || props.value === null) return <span>—</span>;
```

**Files:** `packages/react/src/components/fields/{text,array,date,url,color,number,
select}/Cell.tsx`.

**Confirmed by:** every `Cell.test.tsx` for the 7 affected types (Step 5) →
`it("renders the em-dash placeholder for a null value")` /
`it("renders the em-dash placeholder for a undefined value")`, both from
`runFieldCellContractSuite`'s base contract. The two Variant A types (`text`, `array`) fail
with a raw `TypeError: Cannot read properties of null/undefined (reading 'length')` thrown
during render rather than an `AssertionError` — that distinction, visible directly in
`findings.md`'s failure column, is what separates the crash variant from the placeholder
variant.

**Direction.** Variant A first — it's a crash, not a UX gap. Add the same guard `checkbox`/
`group`/`blocks`/`upload`/`relationship` already use, before any property access on `value`.
Variant B needs the same guard shape but returning the placeholder instead of `null`/empty
markup. Because `text/Cell.tsx` is itself Variant A, it cannot be the copy-paste source —
copy the guard from `checkbox/Cell.tsx` or `group/Cell.tsx`, then layer each type's own
null-safe formatting after it.

#### CELL-4 — `date/Cell.tsx` treats epoch `0` as an absent value

**Not filed by this report — found while verifying `CELL-3`'s own fix per-type against the
real component behavior.** `date/Cell.tsx`'s guard was `if (!props.value) return null;`, so a
document whose date field is genuinely set to the Unix epoch (`0` — 1970-01-01, a real,
storable date) rendered exactly the same as a document where the field was never set. A silent
data-fidelity loss, distinct from `CELL-3`'s own `null`/`undefined` scope, which no `CELL-3`
fixture ever exercises.

**File:** `packages/react/src/components/fields/date/Cell.tsx`.

**Confirmed by:** `date/Cell.test.tsx`'s own pre-existing `it("renders nothing for a timestamp
of 0, even though it is a valid date")`, whose inline comment already named it "a real boundary
defect distinct from the base contract's null/undefined assertion". The report never caught it;
only that test's comment did.

**Resolved by Step 1** of `2026-09-08-react-bug-fixes`, for free and with no extra code: the
frozen strict guard (`props.value === undefined || props.value === null`) leaves `0` — neither
`undefined` nor `null` — to fall through to `new Date(0).toDateString()`. The test was flipped
to assert the corrected contract, the Test Authoring Protocol's authorised case for changing an
expected value: the intended contract itself was wrong, and the test's own words said so.

#### HOOK-5 — `useTableSelection.toggleRow` is a silent no-op when deselecting a row out of "select all"

**Destructive-action risk, not a cosmetic hook quirk.** `isRowSelected(id)` branches only on
`mode === "all"` and never consults `selectedIds`, and `getSelectionCount()` reads the same
way — so calling `toggleRow(id)` while `mode === "all"` mutates `selectedIds` underneath but
every consumer-facing read still reports the row as selected and the count unchanged. "Select
all, then untick one" is the single most common bulk-edit gesture in a data table; a consumer
wiring `isRowSelected`/`getSelectionCount()` into a bulk-delete confirmation would delete a
row the user explicitly excluded, with no visible sign anything was wrong.

**File:** `packages/react/src/hooks/useTableSelection.ts`.

**Confirmed by:** `useTableSelection.test.tsx` →
`it("select-all then deselect-one produces an indeterminate exclusion, not a no-op")`, whose
intent comes from `toggleInverseMode`'s own "everything selected except deselected" semantics
(Protocol source of intent #4, the sibling implementation).
`// FAILS: toggleRow in "all" mode does not exclude the row — see BUGS-REPORT HOOK-5`.

**Direction.** `mode === "all"` needs its own exclusion-set semantics (an "all except these
ids" representation) rather than treating `selectedIds` as an inclusion set unconditionally.
`isRowSelected`/`getSelectionCount()` must read that exclusion set when `mode === "all"`, not
just check the mode string. Do not ship a bulk-action UI that trusts today's `isRowSelected`
while `mode === "all"`.

#### HOOK-6 — `usePaginatedQuery.isDone` reads `true` before the first page loads and forever after a query error

**Masks failed and pending loads as "fully loaded," with no retry affordance.** The `result`
memo falls back to a placeholder with `isDone: true` whenever the underlying `useQuery`'s
`data` is `undefined` — true both while the first page is loading and after the query rejects
— and the mount-time accumulate effect commits that placeholder into state. `isDone`'s own
JSDoc states "whether all documents have been loaded"; a consumer gating a "Load more" button
or an empty-state message on `isDone` shows "nothing more to load" during a transient loading
state and permanently after any network error, indistinguishable from a genuinely complete,
empty collection.

**File:** `packages/react/src/hooks/usePaginatedQuery.ts`.

**Confirmed by:** `usePaginatedQuery.test.tsx` (Step 3) →
`it("reports a pending, not-yet-done state before the first page resolves")` and
`it("surfaces a query failure without crashing the render")` (mounts against a client whose
`.query` always rejects; `results` correctly stays `[]`, which is why only the `isDone` half
is red). Both carry `// FAILS: … — see BUGS-REPORT HOOK-6`.

**Direction.** The `data === undefined` fallback must distinguish "loading" and "errored" from
"the query returned an empty, complete page" — thread `useQuery`'s own `isLoading`/`isError`
into the memo instead of inferring state from `data`'s absence, and default the placeholder's
`isDone` to `false`.

#### MODAL-1 — `CreateDocumentModal` can create the same document twice on a rapid double-click

**Silent duplicate write, same class of risk as `HOOK-5`/`HOOK-6`.** The submit button is
disabled only via `useVexMutation`'s `isPending`, which does not flip to `true` until *after*
TanStack Form's async field validation completes — an `await` boundary between the click and
the disable taking effect. Two back-to-back clicks with no gap between them (a fast
real-world double-click, not contrived timing) both land before the button disables, so the
`create` mutation fires twice and the document is created twice.

**File:** `packages/react/src/components/modals/CreateDocumentModal.tsx`.

**Confirmed by:** `CreateDocumentModal.test.tsx` (via `testing/modalSuite.tsx`),
`describe("CreateDocumentModal")` →
`it("submitting the form twice in rapid succession creates the document only once")`. The
assertion reads the real `documents` table back out of the convex-test instance the modal
wrote through (`testing/convex/schema.ts`'s `readTable`) and finds **two** rows, so the
duplicate write is proven against stored state rather than a spy's call count — it reproduces
identically inside `packages/react` and inside the `apps/test` consumer process. `// FAILS:
rapid double-click submits before the mutation's isPending disables the button, creating the
document twice — see BUGS-REPORT MODAL-1`.

**Direction.** Disable the submit control synchronously on the first click (local
`isSubmitting` state set before awaiting validation, or gating on TanStack Form's own
in-flight submission state) rather than relying solely on the mutation's `isPending`.

#### MODAL-2 — `CreateDocumentModal` can be dismissed while its write still lands

**Not filed by this report — found during the follow-up fix spec's interview.** Same root
cause as `MODAL-1`: nothing gates dismissal (Escape, backdrop click, Cancel) on the in-flight
submit. A user who presses Escape immediately after Enter believes they cancelled the create —
the dialog closes — but the `create` mutation, already in flight, still resolves and the
document still lands. This is worse than `MODAL-1`'s double-submit in one respect: there the
user sees two rows and can tell something went wrong; here the dialog closing looks like
confirmation the action was cancelled, and nothing on screen contradicts that.

**File:** `packages/react/src/components/modals/CreateDocumentModal.tsx`.

**Confirmed by:** `findings.md` row (`packages/react/src/components/modals/
CreateDocumentModal.test.tsx`) → `it("dismissal is not gated on the in-flight create: Escape
pressed immediately after submit closes the dialog, and the write still lands")`, which fails
with `Error: expect(element).not.toBeInTheDocument()` — the write is asserted against the real
`documents` table the modal wrote through, not a spy, the same evidentiary standard `MODAL-1`
uses. `// FAILS: Escape closes the dialog before the in-flight mutation is guarded — see
BUGS-REPORT MODAL-2`.

**Direction.** The same synchronous in-flight flag `MODAL-1`'s fix introduces must also gate
Escape/backdrop/Cancel dismissal, not just the submit control — one flag, two gates, set
before the `await` boundary opens.

**Resolved by Step 7** of `2026-09-08-react-bug-fixes`, alongside `MODAL-1`.

---

### P1 — Correctness

#### CELL-1 — 10 of 12 Cells ignore `isTitleField`, so the title column is unclickable

**10 rows.** The base contract's second assertion: when `isTitleField` is `true`, the
rendered value is wrapped in a link to
`${basePath}/${collection.slug}/${row.original._id}` — the only way a list-view row reaches
its document. Only `text/Cell.tsx` and `url/Cell.tsx` implement this; the other 10 never read
`props.isTitleField` at all. (`color/Cell.tsx`'s JSDoc `@example` shows an `isTitleField`
prop, which reads as a real branch on a `grep`-level pass — the component body never checks
it.)

**Why this is reachable:** `AdminCollectionConfigInput.useAsTitle` is typed
`CoreAdminField | NoInfer<TFieldSlug>` (`packages/core/src/collections/types.ts:170`) — it
accepts **any** field slug on the collection, not just `text`/`url`. A collection can legally
set `useAsTitle: "publishedAt"` (a `date` field) or `useAsTitle: "priority"` (a `select`
field), and nothing in `@vexcms/core` rejects it. When that happens the list view's title
column renders a plain, unlinked value with **no route into the document**.

| Field | Cause |
|---|---|
| `number` | Returns a bare `<span>{props.value}</span>`; no `isTitleField` read, no `VexLink` import |
| `checkbox` | Returns `<span>{props.value ? "Yes" : "No"}</span>` unconditionally |
| `date` | Returns `<span>{date.toDateString()}</span>` unconditionally |
| `select` | Renders a `<div>` of `Badge`s; no `isTitleField` branch |
| `upload` | Renders a thumbnail + filename `<span>`; no `isTitleField` branch |
| `relationship` | All 4 return paths (unmounted placeholder, empty, unpopulated count, populated preview/count) skip `isTitleField` |
| `array` | Renders `<span title={…}>{count} {label}</span>`; the `title` attribute is config text, not a link |
| `group` | Renders a `{ N keys }` summary `<span>`; no `isTitleField` branch |
| `blocks` | Renders an `{N} {label}` summary `<span>`; no `isTitleField` branch |
| `color` | Returns `null` for an empty value, else a swatch `<span>`; the JSDoc `@example` passes `isTitleField={false}` but the body never reads it |

**Files:** `packages/react/src/components/fields/{number,checkbox,date,select,upload,
relationship,array,group,blocks,color}/Cell.tsx`.

**Confirmed by:** each affected type's `Cell.test.tsx` (Step 5) →
`it("wraps the value in an edit link to the document when isTitleField is true")`, from
`runFieldCellContractSuite`'s base contract.

**Direction.** Reference implementation is `text/Cell.tsx`'s `isTitleField` branch
specifically (this one behavior is correct there — see `DOC-1` for what isn't): read
`basePath` from `useVexConfig()` via `addLeadingSlash(config.basePath)`, and when
`props.isTitleField` is true wrap the existing rendered content in
`<VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>`. Each
type keeps its own value formatting inside the link — a wrap, not a rewrite. `url/Cell.tsx`
is the second reference: it shows the pattern for a type whose non-title render is itself
already a link, i.e. the `href` branches on `isTitleField` rather than the whole return.
**Fix `CELL-3` first** — several of these types otherwise crash before the `isTitleField` fix
can be exercised on a null value.

#### HOOK-1 — `usePagination.goToPage(page)` ignores its argument

Beyond the `page < 1` guard, `goToPage` always resets to page 1 regardless of what was
requested — `goToPage(5)` navigates to page 1, not page 5.

```ts
// packages/react/src/hooks/usePagination.ts:121-129
const goToPage = useCallback((page: number) => {
  if (page < 1) return;
  setCursorStack([null]);
  setCurrentPage(1);
  setHasNextPage(false);
}, []);
```

`page` is read only by the guard; nothing downstream uses its value. A paginated list view
cannot jump to an arbitrary page — every call behaves like `goToPage(1)`.

**File:** `packages/react/src/hooks/usePagination.ts`.

**Confirmed by:** `usePagination.test.tsx` →
`it("goToPage(n) navigates to the requested page")` and
`it("goToPage(n) navigates to a page beyond the last known page (no upfront page count to clamp against)")`.
Both carry `// FAILS: goToPage ignores its argument — see BUGS-REPORT HOOK-1`.

**Direction.** Confirm there's no Convex-pagination reason arbitrary jumps are unsupported
(cursor pagination generally can't jump without refetching from the start, which may be why
it was stubbed), then either implement a real jump (refetch from `null` and step forward
`page - 1` times) or rename/redocument it as `resetToFirstPage`.

#### MEDIA-1 — `MediaUploadDropzone` configures no `accept` filter, and drops all but the first file of a same-batch multi-file drop

`useDropzone` is configured with only two options:

```ts
// packages/react/src/components/media/MediaUploadDropzone.tsx:108-111
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  multiple: false,
});
```

No `accept` — the standalone dropzone accepts any mime type, regardless of the target media
collection's configured restrictions. The field-level upload flow (`fields/upload/Input.tsx`)
does filter by `accept`, so this is an **inconsistency between two entry points to the same
operation**: a media collection's type restrictions are enforced on one upload path and
silently ignored on the other. A user can drop an executable onto this dropzone and have it
uploaded.

**Verified adjacent behavior, resolved as intent:** with `multiple: false` and no `maxFiles`,
react-dropzone rejects the **entire batch** when two or more files are dropped at once.
Intended behavior is "keep the first file and upload it" — the established codebase pattern:
`fields/upload/EmptyInput.tsx`'s `handleDrop` truncates a multi-file drop to
`files.slice(0, 1)` for single-select fields.

**File:** `packages/react/src/components/media/MediaUploadDropzone.tsx`.

**Confirmed by:** `MediaUploadDropzone.test.tsx` (Step 6) →
`it("rejects a disallowed mime type instead of uploading it, honoring the target collection's accepted media types")`
(drops a `.exe`; asserts the injected storage adapter is never invoked and no `media` row is
written) and
`it("keeps the first dropped file and uploads it when multiple files are dropped at once, instead of rejecting the whole batch")`.
Both carry `// FAILS: … — see BUGS-REPORT MEDIA-1`.

**Direction.** Read `accept` from the target media collection's config (matching the
field-level path) and pass it into `useDropzone`. Add `maxFiles: 1` alongside
`multiple: false` so a same-batch multi-file drop keeps the first file, matching
`EmptyInput.tsx`'s `slice(0, 1)`.

#### MEDIA-2 — `FilePreview`'s alt-text fallback never fires, so images with no alt text render `alt=""`

`FilePreview.tsx` computes `const alt = mediaDoc.alt ?? mediaDoc.filename;`. `??` only falls
back on `null`/`undefined`, but `VexMediaDocument.alt` is a **required `string`** — a real
media item with no user-provided alt text has `alt: ""`, not `undefined`. The fallback is
therefore dead code and every such image renders with an empty `alt` attribute: an
accessibility defect on the most common case (uploads whose alt text nobody filled in), since
`MediaUploadDropzone` itself seeds `alt` from the filename only at creation time.

**File:** `packages/react/src/components/media/FilePreview.tsx`.

**Confirmed by:** `FilePreview.test.tsx` (Step 6) →
`it("falls back to filename as alt text when alt is empty")`. `// FAILS: `??` doesn't fall
back on empty string … — see BUGS-REPORT MEDIA-2`.

**Direction.** Use an emptiness check rather than nullishness:
`const alt = mediaDoc.alt || mediaDoc.filename;` (or an explicit
`mediaDoc.alt.trim() === "" ? mediaDoc.filename : mediaDoc.alt`). Decide at the same time
whether a decorative-image escape hatch is needed — `alt=""` is correct for decorative
images, so a fix that unconditionally substitutes the filename removes the only way to
express that. If so, the contract needs a distinct signal (e.g. `alt: null` reserved for
"decorative") rather than overloading the empty string.

#### RBAC-1 — `MediaCollectionEditView` doesn't gate Save/Cancel on `canEdit`, unlike its siblings

**Defense-in-depth gap — state this precisely, it is not a privilege-escalation
vulnerability.** `CollectionEditView.tsx:113,121` disables Save/Cancel with
`disabled={!canEdit || isDefaultValue}`; `MediaCollectionEditView.tsx:139,147` disables the
same buttons with `disabled={isDefaultValue}` only — `canEdit` is dropped. Server-side
enforcement (Convex mutation permission checks) is the real gate; this is a client-state
inconsistency, not a reachable escalation.

**Why it's still worth fixing.** `MediaCollectionEditView.tsx:172` still applies
`readOnly={field.admin.readOnly || !canEdit}` on the underlying fields, so under real form
interaction a user without update permission cannot dirty a field the normal way, and Save
stays disabled via the `isDefaultValue` path. But that protection depends on the `readOnly`
cascade holding for every field on the form, not on Save's own `disabled` expression — any
future field type that ignores its `readOnly` prop would silently expose an ungated Save with
no client check positioned to catch it.

**File:** `packages/react/src/components/views/MediaCollectionEditView.tsx`.

**Confirmed by:** `MediaCollectionEditView.test.tsx` (Step 4), inside
`describe("MediaCollectionEditView")`'s `runRbacStateSuite` call. The test forces
`isDefaultValue: false` (a `fireEvent.change` on `#alt`, which jsdom fires even though the
control is `disabled` for a non-`canEdit` user) so the `isDefaultValue` fallback cannot mask
the missing check, then asserts Save/Cancel stay disabled whenever `canEdit` is `false`.
Failing: `it('resolves the "anonymous" scenario')`, `"denied"`, `"allowed"`, and `"scoped"` —
only `"none"` (RBAC unconfigured, every check passes) passes.

**Direction.** Align with `CollectionEditView.tsx:113,121` — add `!canEdit` to both buttons'
`disabled` expression. Small, low-risk fix.

#### RBAC-2 — `MediaCollectionListView` has no `canCreate` check gating its Upload button

`MediaCollectionListView` calls no create-action `usePermission` check at all, and its Upload
button carries no `disabled`/`aria-disabled` prop regardless of the caller's create
permission — unlike `CollectionListView`, whose analogous "+ New" action is gated with
`disabled={!canCreate}`.

**File:** `packages/react/src/components/views/MediaCollectionListView.tsx`.

**Confirmed by:** `MediaCollectionListView.test.tsx` (Step 4) → the RBAC-state matrix's
`it('resolves the "anonymous" scenario')`, `"denied"`, `"allowed"`, `"scoped"`, asserting the
Upload link carries `aria-disabled="true"` when create permission is absent. `// FAILS:
MediaCollectionListView never calls usePermission for the create action … — see BUGS-REPORT
RBAC-2`.

**Direction.** Add the create-action `usePermission` check and wire
`aria-disabled={!canCreate}` (the disabled-link pattern `CollectionListView` already uses)
onto the Upload button.

**Separately — `canDelete`, not a defect today.** Both list views also resolve `canDelete`,
but it gates nothing: `DataTable.tsx`'s bulk-delete trigger UI is commented out, so there is
no control for `canDelete` to disable and nothing can be asserted red against a control that
doesn't exist. Filed as a forward-looking note:
`CollectionListView.test.tsx`/`MediaCollectionListView.test.tsx` both carry a **passing**
`it("has no reachable destructive control while bulk-delete UI remains unwired")` asserting
`queryByRole("button", { name: /delete/i })` is `null`, plus a code comment recording that
restoring `DataTableBulkActions` (exported but never rendered in `DataTable.tsx`) ships it
ungated unless `disabled={!canDelete}` is wired in the same change.

**Files:** `packages/react/src/components/views/{CollectionListView,
MediaCollectionListView}.tsx`, `packages/react/src/components/ui/data-table/DataTable.tsx`.

#### HOOK-2 — `usePagination.nextPage` pushes the pre-advance cursor, not `updateFromResult`'s `continueCursor`

`updateFromResult` receives Convex's `continueCursor` for the page just fetched but never
stores it — it only derives `hasNextPage`:

```ts
// packages/react/src/hooks/usePagination.ts:98-103
const updateFromResult = useCallback(
  (result: { continueCursor: string | null; isDone: boolean }) => {
    setHasNextPage(!result.isDone);
  },
  [],
);
```

`nextPage` then pushes the *current* `cursor` (the one already used to fetch the page just
shown) onto the stack, not the discarded `continueCursor`:

```ts
// packages/react/src/hooks/usePagination.ts:105-111
const nextPage = useCallback(() => {
  if (!hasNextPage) return;
  setCursorStack((prev) => [...prev, cursor]);
  setCurrentPage((p) => p + 1);
}, [hasNextPage, cursor]);
```

Intent is resolved by the sibling implementation: `usePaginatedQuery`'s own `loadMore()` does
`setCursor(result.continueCursor)`. Deep paging past page 2 currently re-fetches the wrong
(repeated) page.

**File:** `packages/react/src/hooks/usePagination.ts`.

**Confirmed by:** `usePagination.test.tsx` →
`it("nextPage advances using the continueCursor from updateFromResult, not the pre-advance cursor")`.
`// FAILS: nextPage does not chain continueCursor — see BUGS-REPORT HOOK-2`.

**Direction.** `updateFromResult` stores `continueCursor` in state; `nextPage` pushes that
stored value instead of the current `cursor`.

---

### P3 — Inconsistency

#### CELL-2 — 6 of 12 Cells render unbounded values with no truncation or `title` attribute

**6 rows.** The base contract's third assertion (threshold 77, matching `text/Cell.tsx`'s
actual cutoff — see `DOC-1` for its JSDoc claiming 80) requires: a value longer than the
threshold is cut for display, and the **full** value is available on a `title` attribute.
Only `text` and `url` implement this. `relationship`, `select`, `array`, `blocks`, `upload`,
and `group` render user-controlled or unbounded text with neither.

| Field | Cause |
|---|---|
| `relationship` | `DefaultRelationshipPreview` (`preview.tsx:32-36`) renders `String(doc[useAsTitle] ?? doc._id)` in a plain `<span>` — no length check, no `title` |
| `select` | One `Badge` per matched option label, no cap on combined width, no `title` |
| `array` | Has a `title`, but it carries `${fieldDef.type} - ${fieldDef.label}` (static config), never the value |
| `blocks` | No `title` at all; the `{N} {label}` summary has no cap |
| `upload` | Filename is CSS-truncated (`overflow-hidden text-ellipsis whitespace-nowrap`) — the full name stays in `textContent`, but there is no `title`, so it's unreachable via tooltip or any non-visual path |
| `group` | Fixed `"{ N keys }"` summary with no `title` at all |

**Files:** `packages/react/src/components/fields/{relationship,select,array,blocks,upload,
group}/Cell.tsx`, `packages/react/src/components/fields/relationship/preview.tsx`.

**Confirmed by:** each affected type's `Cell.test.tsx` (Step 5) →
`it("truncates a value past 77 characters and keeps the full value on a title attribute")`.

**Direction.** Reference implementation is `text/Cell.tsx`'s pattern:
`<span title={fullValue}>{fullValue.length > 77 ? `${fullValue.slice(0, 77)}...` : fullValue}</span>`
— correct there once `CELL-3`'s guard is added in front of it. Each of the 6 types needs its
own definition of "the value" to slice — `relationship`'s resolved label, `select`'s joined
option labels, `array`'s and `blocks`'s summary text, `upload`'s filename, `group`'s summary
— a per-type `extra` fix, not a shared helper change.

#### DOC-1 — `text/Cell.tsx`'s JSDoc promises behavior the component doesn't have

Filed separately from `CELL-3` because it's a documentation defect — and because
`text/Cell.tsx` was this report's original reference implementation, so its doc's accuracy
matters more than a typical file's.

```tsx
// packages/react/src/components/fields/text/Cell.tsx:8-9
 * Renders the string value of a text field. Null/undefined values show an
 * em-dash placeholder. Values longer than 80 characters are truncated with
```

Two claims, both wrong:
1. **"Null/undefined values show an em-dash placeholder"** — no such guard exists;
   `text/Cell.tsx` is one of `CELL-3`'s two crashing types.
2. **"Values longer than 80 characters are truncated"** — the code cuts at **77** (lines 31
   and 38). The Cell contract's `truncates` default and Step 5's assertions deliberately use
   **77**, matching the code, not the doc.

Of the file's three documented behaviors, only the `isTitleField` link-wrap is both documented
and implemented correctly.

**File:** `packages/react/src/components/fields/text/Cell.tsx`.

**Direction.** Fix the JSDoc alongside `CELL-3`'s guard fix for this file — the null-guard
change touches the exact lines the doc's first false claim is about.

#### CORE-LABEL-1 — `defineCollection` title-cases the slug without singularizing, so `labels.singular` is wrong

**Cross-package — this is `@vexcms/core`, not React. The follow-up fix spec's scope is not
confined to `packages/react` for this finding.** For slug `"posts"`, `defineCollection`
computes `labels.singular: "Posts"`, not `"Post"`:

```ts
// packages/core/src/collections/config.ts:191-195
labels: {
  singular: toTitleCase(input.slug),
  plural: plural(toTitleCase(input.slug)),
  ...input.labels,
},
```

`toTitleCase` (`packages/core/src/utils.ts:56`) only capitalizes words — it never
singularizes — so `toTitleCase("posts")` is `"Posts"`, and `plural("Posts")` compounds it for
irregular slugs. The collection config's own JSDoc example
(`packages/core/src/collections/config.ts:60`) documents the *intended* output as
`singular: "Post"` — the code doesn't match its own doc.

User-visible everywhere the admin renders a singular label: "Create Posts", "Delete Posts", a
document header reading "Posts" instead of "Post".

**File:** `packages/core/src/collections/config.ts`.

**Confirmed by:** `packages/react/src/components/modals/CreateDocumentModal.test.tsx` (via
`testing/modalSuite.tsx`) → `it("opens a create form with a control per collection field")`,
which asserts `screen.findByText("Create Post")` (the intended singular) instead of the
as-built `"Create Posts"`. `// FAILS: defineCollection's labels.singular title-cases the slug
without singularizing — see BUGS-REPORT CORE-LABEL-1`.

**Direction.** *Not a drop-in fix* — real blast radius. Correcting the derivation
(singularize before title-casing) changes every default label in every consumer's admin UI
that doesn't explicitly set `labels`. That's a breaking change for anyone relying on today's
output, so the fix spec should consider an explicit opt-in path rather than a silent behavior
change, and treat this as a `@vexcms/core` change with a `packages/react` blast radius.

**Addendum — this is two bugs, not one.** `labels.plural` is wrong too, and more visibly:
`AdminSidebar.tsx:124` renders `labels.plural` in the nav, so every consumer that omits
`labels` sees the double-pluralized form on every page load, not just on the create-document
title this entry's original evidence cites.

```ts
// packages/core/src/collections/config.ts:191-195 (original, before the fix spec)
labels: {
  singular: toTitleCase(input.slug),
  plural: plural(toTitleCase(input.slug)),
  ...input.labels,
},
```

`plural()` (`packages/core/src/utils.ts`) is not itself buggy and must not change — it is
public API (`core/src/index.ts:23` re-exports `./utils`) and correctly pluralizes its input.
The bug is the call site handing it an already-plural slug: `toTitleCase("posts")` is
`"Posts"`, and `plural("Posts")` pluralizes that again to `"Postses"`. Same shape for
`categories` → `"Categorieses"` and `media` → `"Medias"`. Zero of `@vexcms/core`'s pre-fix 936
tests caught this because every one of them passes `labels` explicitly, and every `apps/test`
collection does too — the inferred path had no coverage at all until this fix spec's Step 10
added it (raising the suite to 946 tests).

**Resolved by Step 10** of `2026-09-08-react-bug-fixes`: `plural` is now derived as the
title-cased slug itself, with no call to `plural()` — slugs are plural by convention, so
title-casing alone is the correct `plural` label. `plural()` in `utils.ts` is untouched.
Also note: `packages/react` resolves `@vexcms/core` through its built `dist`, so this fix is
invisible to `packages/react`'s own suite (`CreateDocumentModal.test.tsx`'s `"Create Post"`
assertion) until `@vexcms/core` is rebuilt — see that step's Build order note.

#### HOOK-3 — `useTableSelection.toggleRow`'s `onSelectionChange` reports a stale `mode`

`onSelectionChange` fires from inside the `setSelectedIds` functional updater, but the `mode`
it reports is the outer closure's `mode` — captured at the last render — not the value
`setMode` was just called with in the same invocation:

```ts
// packages/react/src/hooks/useTableSelection.ts:71-93
      if (next.size === 0) {
        setMode("none");
      } else if (mode === "none") {
        setMode("page");
      }
      onSelectionChange?.({ selectedIds: next, mode });   // <- stale `mode`
```

`setMode` calls are async React state updates; the local `mode` never reflects them within
the same call. Ranked P3 because no consumer in this codebase reads `mode` from this callback
yet — a real bug with no live blast radius.

**File:** `packages/react/src/hooks/useTableSelection.ts`.

**Confirmed by:** `useTableSelection.test.tsx` →
`it("toggleRow's onSelectionChange reports the post-change mode")`. `// FAILS: toggleRow's
onSelectionChange reports stale closure-captured mode — see BUGS-REPORT HOOK-3`.

**Direction.** Compute the next mode into a local
`const nextMode = next.size === 0 ? "none" : mode === "none" ? "page" : mode;` and pass
`nextMode` to both `setMode` and `onSelectionChange`.

#### HOOK-4 — `usePaginatedQuery.loadMore()` fetches page N but only reveals it on the (N+1)th call

Verified by running the real hook (Step 3), not by reading. `clientPageIndex` only increments
once the accumulator already covers the currently visible window, so one `loadMore()` fetches
the next page's data without displaying it — the page becomes visible on the *second* call.
Traced: reaching page 2 takes 2 calls; exhausting a 5-doc/`numItems=2` collection takes 4,
not 2. Ranked below `HOOK-1`/`MEDIA-1`: a real usability defect (a "Load more" button that
appears to do nothing on first press) that degrades gracefully — a second press recovers.

**File:** `packages/react/src/hooks/usePaginatedQuery.ts`.

**Confirmed by:** `usePaginatedQuery.test.tsx` →
`it("reveals the next page after a single loadMore call")` and
`it("flips isDone after the intended number of loadMore calls")`. Both carry
`// FAILS: … — see BUGS-REPORT HOOK-4`.

**Direction.** Trace where `clientPageIndex` advances relative to where the accumulator is
read for the visible slice; the fix is most likely reordering those two, not changing the
fetch logic.

---

### Architectural notes for the fix spec

Not defects — recorded so a fix spec doesn't assume something about the surface that isn't
true.

- **`vexConvexApi.findPaginated` and `vexConvexApi.find` are the same server function, not
  two.** `packages/core/src/api/convex.ts` defines `findPaginated` as `anyApi.vex.find` — the
  identical reference `find` uses. Convex's `getFunctionName()` returns `"vex:find"` for
  both, so they are indistinguishable at the react-query cache-key level except by their args
  (`paginationOpts` present or not). This invalidated an earlier plan to add a distinct
  `"vex:findPaginated"` bridge-handler key — it would have been unreachable dead code.
- **A section-selectable suite cannot depend on `vi.mock`.** The first `apps/test` run of
  `sections: ["modals", "media"]` produced 39 "Could not find Convex client" / "No
  QueryClient set" errors: `vi.mock` only intercepts inside `packages/react`'s own vitest
  module graph, so both suites were silently inert for consumers while green in-package.
  Both were rewritten to inject through real seams — the convex-test bridge (which now
  dispatches `.mutation()` through its own `MUTATION_HANDLERS`, so a component's real write
  path lands in convex-test tables) and `StorageAdapterContextProvider`'s public
  `adapterClients` prop — and assert what the write recorded rather than a spy's arguments.
  The rule is now recorded in `.agent/docs/standards/testing/react-test-factories.md`.
- **The kit's `documents` table now declares `status` and makes `title` optional**
  (`packages/react/src/testing/convex/schema.ts`), because it backs both seeded reads and
  real `vex:create` writes from `CreateDocumentModal` — Convex rejects an undeclared field
  and a missing required one alike. A new component under test that writes a different field
  shape needs the same declaration added.

---

### Not defects — types correctly exempt from truncation

`date`, `number`, `checkbox`, and `color` are passed `truncates: false` in their
`Cell.test.tsx` (per `FieldCellContractOptions.truncates`'s documented default) and
**correctly** skip the truncation assertion:

| Field | Why truncation is meaningless here |
|---|---|
| `date` | Fixed-format output (`Date.toDateString()`) — bounded by construction |
| `number` | A JS number's string form has no unbounded-length failure mode in practice |
| `checkbox` | Only ever renders `"Yes"`, `"No"`, or the em-dash placeholder |
| `color` | Fixed-format output (`#e8622a` or a `var(--token)` reference) |

None of these four are part of `CELL-2`. Their exemption says nothing about their
`CELL-1`/`CELL-3` status: **`color` is exempt from truncation but is part of both `CELL-1`
and `CELL-3`**, and `date`/`number`/`checkbox` are each in `CELL-1` too. All three properties
are independent per type — cross-reference each type against every `CELL-*` section.

---

### Open questions for the fix spec

1. **Should `CELL-1`'s fix also constrain `useAsTitle` at the type level** (reject
   non-text/url/date-safe field kinds), or is "any field type can be a title, so every Cell
   must handle `isTitleField`" the intended contract? The direction above assumes the latter,
   since `packages/core/src/collections/types.ts:170` places no restriction on which field
   slugs `useAsTitle` accepts.
2. **Does `array`'s stray `title` attribute (config text, not the value) count as a partial
   implementation worth preserving alongside the value-truncation fix, or should it be
   replaced outright?**
3. **What is "the value" to truncate for `group`?** A `{ N keys }` summary has no natural
   long-form text to slice unless the fix spec renders a serialized object preview instead
   (which needs its own truncation strategy).
4. **Is `alt=""` a supported "decorative image" signal (`MEDIA-2`)?** If yes, the filename
   fallback needs a different trigger than emptiness, and `VexMediaDocument.alt`'s type needs
   a way to express "deliberately decorative".
5. **Is `required` an input-schema concern at all, or the Convex validator's job?** Carried
   forward from the 09-04 spec's report; `CORE-1`'s fix shape depends on it and it spans 7 of
   12 field types.

---

### Reproducing any of this

```bash
# Whole suite, findings recorded — this is the authoritative baseline
node scripts/record-test-findings.mjs "packages/react/src/**/*.test.ts?(x)"

# One Cell type in isolation
pnpm --filter @vexcms/react exec vitest run src/components/fields/text/Cell.test.tsx --coverage.enabled=false

# HOOK-1/2/3/5 (usePagination, useTableSelection) and HOOK-4/6 (usePaginatedQuery)
pnpm --filter @vexcms/react exec vitest run src/hooks/usePagination.test.tsx src/hooks/useTableSelection.test.tsx src/hooks/usePaginatedQuery.test.tsx --coverage.enabled=false

# RBAC-1/RBAC-2 (view-level RBAC gating)
pnpm --filter @vexcms/react exec vitest run src/components/views/MediaCollectionEditView.test.tsx src/components/views/MediaCollectionListView.test.tsx src/components/views/CollectionListView.test.tsx --coverage.enabled=false

# CORE-LABEL-1 and MODAL-1
pnpm --filter @vexcms/react exec vitest run src/components/modals/CreateDocumentModal.test.tsx --coverage.enabled=false

# MEDIA-1 and MEDIA-2
pnpm --filter @vexcms/react exec vitest run src/components/media/MediaUploadDropzone.test.tsx src/components/media/FilePreview.test.tsx --coverage.enabled=false

# The same suites inside a consumer process (ADR-009 dual-context check)
pnpm --filter @vexcms/react build && node scripts/record-test-findings.mjs apps/test/src/vexcms/admin.test.ts
```
