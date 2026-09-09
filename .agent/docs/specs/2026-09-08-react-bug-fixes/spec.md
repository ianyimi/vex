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
`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`, plus three the report
never captured, and deletes one family outright as dead code.

**Every group is `[agent]` and every code block is complete, runnable, final code.** Low-care
override at the developer's request; the project manifest default is high-care/guided-stubs and
this override does not carry to the next spec.

## Measured starting state

| Package | Failing | Total |
|---|---|---|
| `packages/react` | 52 | 1239 |
| `apps/test` | 35 | 906 |
| `apps/www` | 0 | 33 |
| `@vexcms/core` | 0 | 936 |
| better-auth / file-storage-convex / cli / create-vexcms | 0 | 99 |

**87 failing assertions, 88 `findings.md` rows.** `packages/react` coverage is **90.71%**
(3005 statements / 2726 covered) — already well past the 80% gate its own spec set, so this
spec is about correctness, not coverage.

## Three corrections to the report

The report is the input, not the authority. Established by direct measurement during the
interview:

1. **`MODAL-2` is a defect the report omits.** `findings.md` row 78: Escape pressed
   immediately after submit closes `CreateDocumentModal` and **the write still lands**. P0 by
   the report's own key — a user believes they cancelled and a document is created anyway.
2. **`CORE-LABEL-1` is two bugs.** The report caught `singular` (`"Posts"` for slug `posts`).
   It missed that `plural` **double-pluralizes**: verified against real core,
   `posts → "Postses"`, `categories → "Categorieses"`, `media → "Medias"`. The plural half is
   the more visible one — `AdminSidebar.tsx:124` renders `labels.plural` in the nav.
3. **`CELL-4` is a defect hidden inside a passing test.** `date/Cell.test.tsx` asserts
   `it("renders nothing for a timestamp of 0, even though it is a valid date")` while its own
   comment calls that *"a real boundary defect"*. Epoch 0 is 1970-01-01, a legitimate date. The
   test pinned a bug it documented; Step 1 flips it.

## `plural()` is not buggy — do not change it

`packages/core/src/utils.ts`'s `plural()` correctly pluralizes its input. The bug is the **call
site** handing it an already-plural slug. It is also public API (`core/src/index.ts:23`
re-exports `./utils`), so changing it would break a published export for no reason. Step 10
fixes the call site and leaves the helper alone.

## Four defects are in dead code — three get deleted, two get fixed

`usePagination` and `DataTablePagination` have **zero** production consumers. Both list views
use `usePaginatedQuery` + `onLoadMore` (`CollectionListView.tsx:59,133`,
`MediaCollectionListView.tsx:72,154`). `useTableSelection` is only *type*-referenced by
`DataTableBulkActions`, which is never rendered.

The report ranked `HOOK-5` P0 as a "destructive-action risk" — that assumed production
reachability it does not have.

| Defect | Hook | Disposition |
|---|---|---|
| `HOOK-1`, `HOOK-2` | `usePagination` | **Deleted** with the hook, its UI, its tests and its exports |
| `HOOK-3`, `HOOK-5` | `useTableSelection` | **Fixed** — `RBAC-2`'s own note says bulk-delete is meant to be restored, and restoring it onto a hook whose "select all, untick one" silently fails is exactly the trap that note warns about |
| `HOOK-4`, `HOOK-6` | `usePaginatedQuery` | **Fixed** — live in both list views |

## The Test Authoring Protocol cuts the other way here

`.agent/docs/specs/2026-09-08-react-coverage-expansion/spec.md`'s `Test Authoring Protocol`
remains binding. Every assertion in `findings.md` encodes **intended** behavior, so:

**Fix the source, not the test.** A test's expected value may change ONLY if the intended
contract itself was wrong, and then the change must be justified inline. Making a test pass by
editing its expectation is the softening this project's anti-regression clause prohibits.

Four authorised exceptions, each stated where it occurs:

- **Step 1** flips `date/Cell.test.tsx`'s epoch-0 assertion (`CELL-4` — the test pinned a bug
  its own comment names) and strengthens `color`/`url`'s empty-string assertions from "renders
  nothing" to the em-dash placeholder, for consistency with the base contract.
- **Step 3** replaces `array`'s stray `title` assertion and `group`'s key-count assertion, per
  the interview's decisions on the report's open questions #2 and #3.
- **Step 4** deletes `usePagination`'s tests along with the code they test.
- **Step 5** may update `HOOK-5`'s test *mechanism* if `UseTableSelectionReturn`'s shape
  changes — never its asserted outcome. (It did not need to.)

Any other `findings.md` row that starts passing must be traceable to a diff in
`packages/react/src/**` or `packages/core/src/**`, never to a test-only diff.

## Build order

`CELL-3` first: several types otherwise crash before a `CELL-1`/`CELL-2` fix on the same file
can be exercised on a null value. The Cell groups then run 3 → 1 → 2 over overlapping files
with composable, non-conflicting edit shapes. The deletion lands early so no later group spends
effort on code that is going away. Hook, modal, view, media and core groups are mutually
independent. Verification is last.

**Every group's `Verify` must exit 0 with zero failing tests.** Unlike the coverage spec, this
one ends green. Each section below was verified against the real repo during authoring and then
reverted.

### One ordering trap

`packages/react` resolves `@vexcms/core` through its built `dist`, not `src`. Step 10's
`defineCollection` change is therefore invisible to react's tests until core is rebuilt —
discovered empirically, not theorised. Run `pnpm --filter @vexcms/core build` before any react
suite, and `pnpm --filter @vexcms/react build` before `apps/test` (the ADR-009 dual-context
boundary, one layer up). A root `pnpm build` satisfies both through turbo's graph.


## Step 1 — Cell null guards + the lying JSDoc (CELL-3, DOC-1)

**[agent]**

Why: 28 of 88 findings rows, and the only crash in the report. `text/Cell.tsx` and
`array/Cell.tsx` call `.length` on an unguarded `props.value`, and a throw in a cell renderer
takes down the whole table render. Must land before Steps 2-3 touch the same files.

All 7 edits start from the exact frozen guard on `checkbox/Cell.tsx:23`:

```tsx
if (props.value === undefined || props.value === null) return <span>—</span>;
```

placed before any property access on `value`, then keep each type's own null-safe formatting
after it. `text/Cell.tsx` cannot be the copy-paste source for this guard — it's Variant A, one
of the two crashers, and had no guard at all before this step.

Two of the seven need more than the literal frozen line, discovered while verifying this
step's own `Cell.test.tsx` suites against the real component behavior, per-type, not just the
base contract:

- **`date` — an 18th defect, filed here as `CELL-4`.** `date/Cell.test.tsx` already asserts,
  and its own inline comment already names, a boundary bug: `!props.value` treats epoch `0`
  (1970-01-01, a real, storable date) the same as an absent value, so a document whose date
  field is genuinely set to the Unix epoch renders the same em-dash as a document where the
  field was never set — a silent data-fidelity loss distinct from `CELL-3`'s own null/undefined
  scope, which no `CELL-3` fixture ever exercises. The frozen guard fixes it for free: `0` is
  neither `undefined` nor `null`, so it now falls through to `new Date(0).toDateString()`
  instead of the placeholder. No extra code — `date/Cell.tsx` takes the guard unchanged.
  `CELL-4` needs recording in `BUGS-REPORT.md` (Step 11's bookkeeping) since the report never
  caught it — only `date/Cell.test.tsx`'s own comment did.
- **`color` and `url` — the guard is strengthened, not left literal, because `""` is a
  different case from `date`'s `0`.** Both types' own tests assert `!props.value` swallows an
  empty string the same as an absent value, and *unlike* `date`'s `0`, that's the **correct**
  intent, not a bug: an empty string is not a colour and not a URL, the same practical "nothing
  to show" state as `null`/`undefined`. But their pre-existing tests assert the empty-string
  case renders **nothing**, while the base contract's own null/undefined case renders the
  em-dash **placeholder** — an inconsistency a user would see as a blank cell for one falsy
  variant and a dash for another, for what is semantically the same state. So `color` and `url`
  get the frozen guard's `undefined`/`null` clause plus one more, both routing to the same
  em-dash: `props.value === ""`. This strengthens their existing correct intent to match the
  base contract's placeholder, rather than softening or removing a check.
- **`text`, `array`, `number`, `select` take the frozen guard exactly as written, unchanged.**
  `text` deliberately does **not** get the `""` extension `color`/`url` get: unlike a colour or
  a URL, an empty string is a syntactically valid, complete instance of "a string" — a text
  field's whole domain is strings, and `""` is one of them, not a degenerate non-instance of
  the type the way an empty colour or empty URL is. Collapsing `""` into the null-placeholder
  would erase a real (if visually identical) distinction between "field never set" and "field
  explicitly set to empty," and no `CELL-3`/`DOC-1` finding or existing `text/Cell.test.tsx`
  case calls for it. `array` and `select` similarly keep their existing empty-collection
  handling (`[]` renders "0 items" / an empty badge row respectively) — an empty array or an
  empty selection is a meaningful, distinct state from an absent field, not flagged by any
  finding, and untouched by this step. `number`'s own test already pins `0` rendering as `"0"`,
  not the placeholder — the frozen guard preserves that unchanged, since `0` is neither
  `undefined` nor `null`.

#### packages/react/src/components/fields/text/Cell.tsx

3 edits — everything else unchanged. Variant A (crasher, line 31/38's `.length` on unguarded
`props.value`), plus `DOC-1`'s JSDoc fix on the same file.

**1 — `DOC-1`: JSDoc's two false claims.** No em-dash guard existed, and the code cuts at 77,
not 80. Replace the JSDoc body's two claim lines:

```tsx
 * Renders the string value of a text field. Null/undefined values show an
 * em-dash placeholder. Values longer than 77 characters are truncated with
```

**2 — the guard, before the `isTitleField` branch.** Insert immediately after
`const basePath = addLeadingSlash(config.basePath);` and before `if (props.isTitleField) {`
— both existing branches below call `props.value.length`, so the guard must precede the
branch, not sit inside either arm of it. Unchanged from the frozen shape — see this step's
prose above for why `""` is deliberately not special-cased here:

```tsx
  if (props.value === undefined || props.value === null) return <span>—</span>;
```

#### packages/react/src/components/fields/array/Cell.tsx

1 edit — everything else unchanged. Variant A (crasher, line 24's `const itemCount =
props.value.length`). Unchanged from the frozen shape.

**1 — the guard, before `itemCount`.** Insert immediately before the existing
`const itemCount = props.value.length;` line:

```tsx
  if (props.value === undefined || props.value === null) return <span>—</span>;
```

#### packages/react/src/components/fields/date/Cell.tsx

1 edit — everything else unchanged. Variant B: `if (!props.value) { return null; }` renders
nothing instead of the placeholder. Unchanged from the frozen shape — this is also `CELL-4`'s
fix, for free: `0` is neither `undefined` nor `null`, so it now reaches
`new Date(0).toDateString()` instead of being swallowed.

**1 — replace the `!props.value` guard.** Replace the existing
`if (!props.value) { return null; }` (lines 24-26) with the frozen shape:

```tsx
  if (props.value === undefined || props.value === null) return <span>—</span>;
```

#### packages/react/src/components/fields/date/Cell.test.tsx

1 edit — everything else unchanged. Flips the pre-existing test that pinned `CELL-4`'s bug
(its own comment already called it a "real boundary defect") to assert the corrected, intended
behavior — the Test Authoring Protocol's authorised case for changing a test's expected value:
the intended contract itself was wrong, and the test's own words already said so.

**1 — the timestamp-0 test.** Replace the `it("renders nothing for a timestamp of 0, even
though it is a valid date", …)` test (originally lines 36-52) with:

```tsx
    // `!props.value` treated epoch 0 (1970-01-01, a legitimate date) the same as an
    // absent value. Filed as CELL-4 — a distinct boundary defect from CELL-3's own
    // null/undefined scope, fixed by the same strict guard: `0` is neither `undefined`
    // nor `null`, so it now renders the real date instead of the em-dash placeholder.
    it("renders a date for a timestamp of 0, since it is a valid date, not an absent value", () => {
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
      render(
        <DateFieldCell
          value={0}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      );
      expect(screen.getByText(new Date(0).toDateString())).toBeInTheDocument();
    });
```

#### packages/react/src/components/fields/url/Cell.tsx

1 edit — everything else unchanged. Variant B: `if (!props.value) return null;` renders
nothing instead of the placeholder. Strengthened past the literal frozen shape — see this
step's prose above — so an empty string routes to the SAME em-dash placeholder as
`null`/`undefined`, instead of silently rendering nothing.

**1 — replace the `!props.value` guard.** Replace the existing
`if (!props.value) return null;` (line 27) with:

```tsx
  if (props.value === undefined || props.value === null || props.value === "") return <span>—</span>;
```

#### packages/react/src/components/fields/url/Cell.test.tsx

1 edit — everything else unchanged. Strengthens the pre-existing empty-string test to assert
the em-dash placeholder instead of empty markup, matching the guard above.

**1 — the empty-string test.** Replace the `it("renders nothing for an empty string, same as
for null/undefined", …)` test (originally lines 31-46) with:

```tsx
      // An empty string is not a URL, the same practical state as an absent value —
      // strengthened past the base contract's null/undefined case to render the SAME
      // em-dash placeholder rather than silently rendering nothing, so a user sees a
      // consistent signal instead of a blank cell for one falsy variant and a dash for
      // another.
      it("renders the em-dash placeholder for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <UrlFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("—");
      });
```

#### packages/react/src/components/fields/color/Cell.tsx

1 edit — everything else unchanged. Variant B: `if (!props.value) return null;` renders
nothing instead of the placeholder. Strengthened past the literal frozen shape — see this
step's prose above — so an empty string routes to the SAME em-dash placeholder as
`null`/`undefined`, instead of silently rendering nothing.

**1 — replace the `!props.value` guard.** Replace the existing
`if (!props.value) return null;` (line 22) with:

```tsx
  if (props.value === undefined || props.value === null || props.value === "") return <span>—</span>;
```

#### packages/react/src/components/fields/color/Cell.test.tsx

1 edit — everything else unchanged. Strengthens the pre-existing empty-string test to assert
the em-dash placeholder instead of empty markup, matching the guard above.

**1 — the empty-string test.** Replace the `it("renders nothing for an empty string, same as
for null/undefined", …)` test (originally lines 35-50) with:

```tsx
      // An empty string is not a colour, the same practical state as an absent value —
      // strengthened past the base contract's null/undefined case to render the SAME
      // em-dash placeholder rather than silently rendering nothing, so a user sees a
      // consistent signal instead of a blank cell for one falsy variant and a dash for
      // another.
      it("renders the em-dash placeholder for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <ColorFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("—");
      });
```

#### packages/react/src/components/fields/number/Cell.tsx

1 edit — everything else unchanged. Variant B: `return <span>{props.value}</span>;` renders an
empty `<span>` for `undefined` — no guard existed at all. Unchanged from the frozen shape —
this preserves the file's own existing `0`-renders-as-`"0"` test unmodified, since `0` is
neither `undefined` nor `null`.

**1 — add the guard before the existing return.** Immediately before
`return <span>{props.value}</span>;`:

```tsx
  if (props.value === undefined || props.value === null) return <span>—</span>;
```

#### packages/react/src/components/fields/select/Cell.tsx

1 edit — everything else unchanged. Variant B: `const value = props.value ?? [];` renders an
empty `<div>` for `undefined` — no explicit guard, just a silent default. Unchanged from the
frozen shape — an empty selection (`[]`) keeps rendering an empty badge row, a meaningful,
distinct state from an absent field that no finding flags.

**1 — replace the `?? []` default with the guard, and drop the now-unnecessary local.**
Replace the existing `const value = props.value ?? [];` (line 24) and the line right after it
that reads from `value`:

```tsx
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const fields = props.fieldDef.options.filter((o) => props.value.includes(o.value));
```

`props.value` is narrowed non-null by the guard's early return, so `fields` reads `props.value`
directly — the intermediate `value` local is no longer needed.

Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{text,array,date,url,color,number,select}/Cell.test.tsx --coverage.enabled=false

Ran the Verify command against this step's edits applied standalone to the real repo (then
reverted — `git status --porcelain` shows nothing beyond the pre-existing dirty files). Every
assertion this step owns now passes across all 7 types and all 3 collateral test edits: the
base contract's `"renders the em-dash placeholder for a %s value"` (`CELL-3`) cases, `date`'s
now-corrected timestamp-0 case (`CELL-4`), and `color`/`url`'s now-corrected empty-string
cases. The command's remaining 7 failures are exclusively `"wraps the value in an edit link…"`
(`CELL-1`, Step 2's scope) and `"truncates a value past 77 characters…"` (`CELL-2`, Step 3's
scope) on `array`, `color`, `date`, `number`, `select` — confirmed by `fieldCellContract.ts`'s
own comments citing `BUGS-REPORT CELL-1`/`CELL-2`, not `CELL-3`/`CELL-4`. This step's own
Verify command cannot reach zero failures standalone since Steps 2 and 3 land on these same
files and these same test suites; it reaches zero once composed with them, which is this
step's assigned scope boundary.

## Step 2 — Cell isTitleField link wrap (CELL-1)

**[agent]**

Why: 20 findings rows. `useAsTitle` accepts any field slug
(`packages/core/src/collections/types.ts:170` —
`useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>;` places no restriction on field kind), so a
`date` or `select` title column renders unlinked and the list view offers no route into the
document. Only `text/Cell.tsx` and `url/Cell.tsx` implement the branch today; the other 10 never
read `props.isTitleField`.

Reference shape (from `text/Cell.tsx`): read `basePath` from `useVexConfig()` via
`addLeadingSlash(config.basePath)`, and when `props.isTitleField` wrap the existing rendered
content in `<VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>`.
`url/Cell.tsx` is the second reference — its non-title render is already a link, so only the
`href` branches. Every edit below assumes Step 1's null guard has already landed on
`{number,date,select,array,color}/Cell.tsx` (the checkbox-shape early return); the wrap is placed
directly after it, never before, so `useVexConfig()` is only reached once a real value exists to
link.

`upload/Cell.tsx` and `relationship/Cell.tsx` each have more than one return path (loading /
unmounted / empty / populated). The base contract's `isTitleField` assertion renders with a
query client whose default `queryFn` never resolves, so `upload/Cell.tsx`'s "Loading..." branch
is the one actually exercised — every return path in both files needs the wrap, not just the
fully-populated one. Both use a local `wrap(content)` closure (3+ call sites needing identical
conditional-link behavior) rather than repeating the ternary at each return.

#### packages/react/src/components/fields/number/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig` alongside the existing
`CellComponentProps`/`NumberField` imports.

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type NumberField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after Step 1's null guard.**

```tsx
export function NumberFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<NumberField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const content = <span>{props.value}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/checkbox/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`; the existing null guard
(`checkbox/Cell.tsx:23`, the Step 1 reference shape) is already present and unchanged.

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type CheckboxField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after the existing guard.**

```tsx
export function CheckboxFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<CheckboxField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const content = <span>{props.value ? "Yes" : "No"}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/date/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`; `"use client";` stays first.

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type DateField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after Step 1's null guard.**

```tsx
export function DateFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<DateField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const date = new Date(props.value);
  const content = <span>{date.toDateString()}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/select/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`; `Badge` import unchanged.

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type SelectField } from "@vexcms/core";
import { Badge, VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after Step 1's null guard.**

```tsx
export function SelectFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<SelectField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const value = props.value ?? [];
  const fields = props.fieldDef.options.filter((o) => value.includes(o.value));
  const content = (
    <div className="flex gap-1">
      {fields.map((f) => (
        <Badge key={f.value}>{f.label}</Badge>
      ))}
    </div>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/upload/Cell.tsx

**1 — imports.** Add `addLeadingSlash` to the existing `@vexcms/core` import, `type ReactNode`
from `"react"`, and `VexLink`/`useVexConfig`.

```tsx
import { useQuery } from "@tanstack/react-query";
import {
  addLeadingSlash,
  CellComponentProps,
  CollectionConfig,
  CollectionSlug,
  TDocument,
  UploadField,
  VexMediaDocument,
} from "@vexcms/core";
import type { ReactNode } from "react";
import { FilePreview } from "../../media/FilePreview";
import { get } from "@vexcms/core/client";
import { GenericId } from "convex/values";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap all three return paths (empty, loading, populated) with a local `wrap` closure.**

```tsx
export function UploadFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<UploadField, TData, CollectionConfig>,
) {
  const { value } = props;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const href = `${basePath}/${props.collection.slug}/${props.row.original._id}`;
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  if (!value || value.length === 0) {
    return wrap(<span className="text-muted-foreground">—</span>);
  }

  const firstId = value[0];
  const { data: doc } = useQuery({
    ...get({ id: firstId as GenericId<CollectionSlug>, collection: props.fieldDef.to }),
  });
  const mediaDoc = doc as VexMediaDocument;

  if (!mediaDoc) {
    return wrap(<span className="text-muted-foreground">Loading...</span>);
  }

  return wrap(
    <span className="inline-flex min-w-0 items-center gap-2">
      <FilePreview mediaDoc={mediaDoc} size={26} radius={2} />
      <span className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap">
        {mediaDoc.filename}
      </span>
      {value.length > 1 && <span className="vex-badge muted font-mono">+{value.length - 1}</span>}
    </span>,
  );
}
```

#### packages/react/src/components/fields/relationship/Cell.tsx

**1 — imports.** Add `addLeadingSlash` to the existing `@vexcms/core` import, `type ReactNode`
from `"react"`, and `VexLink`.

```tsx
import { useEffect, useState, type ReactNode } from "react";

import {
  addLeadingSlash,
  type CellComponentProps,
  type RelationshipField,
  type TDocument,
} from "@vexcms/core";
import { useVexConfig } from "../../../context/VexConfigContext";
import { VexLink } from "../../ui";
import { resolveRelationshipPreview } from "./preview";
```

**2 — wrap all four return paths (unmounted placeholder, empty, unpopulated count, populated
preview/count) with a local `wrap` closure.** Compute `href`/`wrap` once, right after the
existing `config` line, before the unmounted-placeholder branch.

```tsx
export function RelationshipFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<RelationshipField, TData>,
) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { row, fieldDef, fieldKey } = props;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const href = `${basePath}/${props.collection.slug}/${props.row.original._id}`;
  const wrap = (content: ReactNode) =>
    props.isTitleField ? <VexLink href={href}>{content}</VexLink> : content;

  // SSR and initial hydration render — consistent placeholder prevents mismatch.
  if (!isMounted) {
    return wrap(<span className="text-[13px] text-muted-foreground">—</span>);
  }

  const rawValue = row.original[fieldKey] as unknown[] | undefined;

  if (!rawValue || rawValue.length === 0) {
    return wrap(<span className="text-[13px] text-muted-foreground">—</span>);
  }

  const isPopulated =
    typeof rawValue[0] === "object" && rawValue[0] !== null && "_id" in (rawValue[0] as object);

  if (!isPopulated) {
    return wrap(
      <span className="text-[13px] text-muted-foreground">
        {rawValue.length} item{rawValue.length !== 1 ? "s" : ""}
      </span>,
    );
  }

  const docs = rawValue as TDocument[];
  const targetCollection = config.collections.find((c) => c.slug === fieldDef.collection.slug);

  if (docs.length === 1) {
    const Preview = resolveRelationshipPreview({ fieldDef, targetCollection });
    return wrap(
      <Preview
        doc={docs[0]}
        fieldKey={fieldKey}
        config={(targetCollection ?? props.collection) as never}
      />,
    );
  }

  const pluralLabel = targetCollection?.labels.plural ?? fieldDef.collection.slug;
  return wrap(
    <span className="text-[13px] text-foreground">
      {docs.length} {pluralLabel}
    </span>,
  );
}
```

#### packages/react/src/components/fields/array/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`.

```tsx
import {
  addLeadingSlash,
  type CellComponentProps,
  type ArrayField,
  ArrayType,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after Step 1's null guard.** The `title` attribute here is untouched by
this step — Step 3 replaces it with the value.

```tsx
export function ArrayFieldCell<
  TData extends TDocument = TDocument,
  TArrayType extends ArrayType = ArrayType,
>(props: CellComponentProps<ArrayField<TArrayType>, TData>) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const itemCount = props.value.length;
  const isSingle = props.value.length === 1;
  const labels = props.fieldDef.labels;
  const label = labels ? (isSingle ? labels.singular : labels.plural) : isSingle ? "item" : "items";
  const content = (
    <span title={`${props.fieldDef.type} - ${props.fieldDef.label}`}>
      {itemCount} {label}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/group/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`; `"use client";` stays first.

```tsx
import { addLeadingSlash, type CellComponentProps, type GroupField, TDocument } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the populated-content return.** `group` has no separate Step 1 guard (its own
`value == null` check already returns the em-dash); only the count-badge branch is wrapped.

```tsx
export function GroupFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<GroupField, TData>,
) {
  const value = props.value as Record<string, unknown> | null | undefined;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const count = Object.keys(value).length;

  const content = (
    <span className="text-xs text-muted-foreground font-mono">
      {`{ ${count} ${count === 1 ? "key" : "keys"} }`}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/blocks/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`; `"use client";` stays first.

```tsx
import {
  addLeadingSlash,
  type CellComponentProps,
  type BlocksField,
  type GenericBlock,
  TDocument,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the populated-content return.** `blocks` has no separate Step 1 guard (its own
`!value` check already returns the em-dash); only the count branch is wrapped.

```tsx
export function BlocksFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<BlocksField, TData>,
) {
  const value = props.value as GenericBlock[] | null | undefined;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);

  if (!value || !Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const { singular, plural } = props.fieldDef.labels;

  const content = (
    <span className="text-xs text-muted-foreground">
      {value.length} {value.length === 1 ? singular : plural}
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

#### packages/react/src/components/fields/color/Cell.tsx

**1 — imports.** Add `addLeadingSlash`, `VexLink`, `useVexConfig`.

```tsx
import { addLeadingSlash, TDocument, type CellComponentProps, type ColorField } from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";
```

**2 — wrap the return, after Step 1's guard, and correct the JSDoc so it no longer references
an unread `isTitleField` only in an `@example`.**

```tsx
/**
 * Colour field cell component for the data-table list view.
 *
 * Renders a swatch beside the stored value. `backgroundColor` is set from the
 * raw value, so a `var(--token)` reference resolves through CSS and the swatch
 * follows the active colour scheme for free. Null/undefined values show an
 * em-dash placeholder.
 *
 * @param props - Component props.
 * @param props.value - Raw colour value from the document — hex or `var(--token)`.
 * @param props.isTitleField - When `true`, wraps the swatch in an edit-page link.
 * @returns The cell component for this field type, or an em-dash placeholder for an empty value.
 *
 * @example
 * ```tsx
 * <ColorFieldCell value={doc.primaryLight} fieldDef={primaryLightField} row={row} isTitleField={false} />
 * ```
 */
export function ColorFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<ColorField, TData>,
) {
  if (props.value === undefined || props.value === null) return <span>—</span>;
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const content = (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="size-4 shrink-0 rounded border border-border"
        style={{ backgroundColor: props.value }}
      />
      <span className="font-mono text-xs">{props.value}</span>
    </span>
  );
  if (!props.isTitleField) return content;
  return (
    <VexLink href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}>
      {content}
    </VexLink>
  );
}
```

Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{number,checkbox,date,select,upload,relationship,array,group,blocks,color}/Cell.test.tsx --coverage.enabled=false

## Step 3 — Cell truncation + title attribute (CELL-2)

**[agent]**

Why: 12 findings rows. Six types render user-controlled or unbounded text with no
truncation and no `title`, so the full value is unreachable by tooltip or any
non-visual path. Each type needs its own definition of "the value" to slice, at
threshold **77** with the full value on `title` (`text/Cell.tsx`'s own pattern —
`<span title={full}>{full.length > 77 ? \`${full.slice(0, 77)}...\` : full}</span>`).

This step assumes Step 1 (the null guard) and Step 2 (the `isTitleField` link wrap)
have already landed on these same six files. Every hunk below targets the innermost
rendered element inside a branch — the `<span>`/`<div>` itself — not the guard above
it or the `VexLink` wrap around it, so it composes regardless of which of Step 1/2's
branches the element ends up inside.

**"The value" per type, and where the generic contract assertion actually lands:**

| Type | The value | Note |
|---|---|---|
| `relationship` | Single populated doc: the resolved label (`preview.tsx`). Unpopulated raw ids: the joined ids | see deviation below — the shared fixture never reaches the populated-doc branch |
| `select` | The joined labels of every *stored* value, in stored order (duplicates included) | see deviation below — deduping by catalog entry can never overflow the threshold |
| `array` | The array's own items, stringified and joined | replaces the stray `${fieldDef.type} - ${fieldDef.label}` config text outright (open question #2) |
| `blocks` | A JSON serialization of the whole blocks array | `GenericBlock` varies per block type; raw JSON is the only shape every block shares |
| `upload` | The filename | CSS ellipsis kept, `title` added — see the upload section |
| `group` | A JSON serialization of the group's own fields, used as both the display text and the title (open question #3) | replaces the fixed `{ N keys }` summary outright |

**Deviations from BUGS-REPORT's stated Direction (both required for `Verify` to pass,
confirmed by running the composed Step 1+2+3 result against `runFieldCellContractSuite`
in an isolated worktree):**

1. **`relationship`.** The report's Direction names only `preview.tsx`. But
   `relationshipFieldFixture.valid` is `["kg2fake00000000000000001;documents"]` — raw,
   *unpopulated* ids, not populated docs — and `buildOverLengthValue` only ever
   duplicates that same raw-id string. `RelationshipFieldCell`'s `isPopulated` check
   (`typeof rawValue[0] === "object"`) is therefore always `false` for the generic
   truncation assertion: it exercises the `!isPopulated` "N item(s)" branch in
   `Cell.tsx`, never `DefaultRelationshipPreview`. Fixing only `preview.tsx` leaves the
   generic assertion red. `relationship/Cell.tsx` is already listed among this step's
   files precisely because both need the fix: `preview.tsx` for the real single-doc
   case, `Cell.tsx`'s unpopulated branch for the raw-id fallback the shared fixture
   actually renders.
2. **`select`.** `SelectFieldCell` renders one `Badge` per *catalog option* the stored
   value includes (`fieldDef.options.filter(o => value.includes(o.value))`) — since
   `fieldDef.options` here only has 3 entries, no amount of duplicating the stored
   `value` array grows the rendered/joined label text past ~30 characters. Iterating
   over the stored `value` instead (mapping each entry to its option, keeping
   duplicates and stored order) is required for "the joined option labels" to scale
   with the value at all — and is arguably the more correct reading of "selected
   option labels" besides: a stored duplicate is real stored data, not a rendering
   artifact to hide.

#### packages/react/src/components/fields/relationship/Cell.tsx

**1 — the unpopulated-ids branch's rendered element.** Anchored on the `<span>`
returned inside `if (!isPopulated) { ... }`.

```tsx
<span className="text-[13px] text-muted-foreground" title={rawValue.join(", ")}>
  {rawValue.length} item{rawValue.length !== 1 ? "s" : ""}
</span>
```

The visible text is untouched (still `"N item(s)"`, matching the existing `extra`
test), only `title` is added, carrying the raw ids so they're reachable even before
they resolve to a preview.

#### packages/react/src/components/fields/relationship/preview.tsx

**1 — `DefaultRelationshipPreview`.** Untouched by Steps 1/2 (not a `Cell.tsx`, no
`isTitleField`/null-guard concern), so replaced in full:

```tsx
function DefaultRelationshipPreview({ doc, config }: RelationshipPreviewProps) {
  const useAsTitle = config.admin.useAsTitle;
  const label = String((doc as Record<string, unknown>)[useAsTitle] ?? doc._id);
  return (
    <span className="text-[13px] text-foreground" title={label}>
      {label.length > 77 ? `${label.slice(0, 77)}...` : label}
    </span>
  );
}
```

Also update `resolveRelationshipPreview`'s JSDoc `@returns`-adjacent description line
(currently `"The default renders doc[useAsTitle] ?? doc._id as plain text."`) to read
`"The default renders doc[useAsTitle] ?? doc._id as plain text, cut at 77 characters
with the full label on title."` — the only prose claim this file makes that the fix
touches.

#### packages/react/src/components/fields/select/Cell.tsx

**1 — the `fields` computation and returned `<div>`.** Anchored on the code after
Step 1's guard defines `value` (the non-null `props.value`), replacing the original
`const fields = props.fieldDef.options.filter((o) => value.includes(o.value));`
through the closing `</div>`:

```tsx
const fields = value
  .map((v) => props.fieldDef.options.find((o) => o.value === v))
  .filter((option): option is SelectField["options"][number] => option != null);
const joinedLabels = fields.map((f) => f.label).join(", ");
return (
  <div className="flex gap-1" title={joinedLabels}>
    {fields.map((f, index) => (
      <Badge key={`${f.value}-${index}`}>{f.label}</Badge>
    ))}
  </div>
);
```

`key` moves from `f.value` to `${f.value}-${index}` because `fields` can now legally
contain the same option twice (a duplicate stored value renders as two Badges — see
the deviations note above). Both currently-passing `extra` tests
("renders a Badge per selected option" / "omits a stored value that is no longer one
of fieldDef.options") are unaffected: neither fixture has duplicate entries.

#### packages/react/src/components/fields/array/Cell.tsx

**1 — the JSDoc's `title` claim.** The line `"The title attribute shows the field
type and label for accessibility."` becomes false once the title carries the value —
replace it with `"The title attribute shows the array's own items, joined into one
string — never the static field type/label config text a prior version showed."`

**2 — the returned `<span>`.** Anchored on the original
`<span title={\`${props.fieldDef.type} - ${props.fieldDef.label}\`}>` through its
closing tag (after Step 1's guard and the existing `itemCount`/`isSingle`/`label`
lines, which are unchanged):

```tsx
const summary = props.value
  .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
  .join(", ");
return (
  <span title={summary}>
    {itemCount} {label}
  </span>
);
```

#### packages/react/src/components/fields/array/Cell.test.tsx

**1 — the stray-title assertion.** `array`'s old `title` was config text, not a
value — CELL-2's own cause table calls it out by name ("Has a `title`, but it carries
`${fieldDef.type} - ${fieldDef.label}` \[...\], never the value") and open question #2
resolves to replacing it outright. The `extra` test asserting the old static string is
therefore asserting a contract this step deliberately overturns, not one it must
preserve — updated to the new value-based `title`:

```tsx
expect(container.firstElementChild?.getAttribute("title")).toBe(single.join(", "));
```

(`single` is the test's existing `[options.fixture.valid[0]!]` — one string element,
so `single.join(", ")` is just that one tag string, e.g. `"First tag"`.)

#### packages/react/src/components/fields/blocks/Cell.tsx

**1 — the returned `<span>`.** Anchored on the non-empty branch's `<span>`, after the
existing `singular`/`plural` destructure:

```tsx
const preview = JSON.stringify(value);
return (
  <span className="text-xs text-muted-foreground" title={preview}>
    {value.length} {value.length === 1 ? singular : plural}
  </span>
);
```

#### packages/react/src/components/fields/upload/Cell.tsx

**1 — the "Loading..." branch.** The referenced media document may still be pending
when the row's title column is this cell — the raw, not-yet-resolved ids are still
worth exposing rather than leaving the loading state with no title at all:

```tsx
if (!mediaDoc) {
  return (
    <span className="text-muted-foreground" title={value.join(", ")}>
      Loading...
    </span>
  );
}
```

**2 — the filename `<span>`.** CSS ellipsis (`overflow-hidden text-ellipsis
whitespace-nowrap`) stays — a fixed-width table column still needs a hard visual cap
regardless of the 77-character threshold, and unlike a plain-text value there's no
single natural cut point in a filename to slice at. `title` is added alongside it,
which is what actually fixes `CELL-2`: the full filename was always in `textContent`,
just unreachable by tooltip or any non-visual path.

```tsx
<span
  className="overflow-hidden text-[12.5px] text-ellipsis whitespace-nowrap"
  title={mediaDoc.filename}
>
  {mediaDoc.filename}
</span>
```

#### packages/react/src/components/fields/group/Cell.tsx

**1 — the JSDoc description and `@example`.** Replace the `"{ N keys }"` description
and `@example` output with the serialized-preview shape shown below (e.g.
`` `{"title":"Hello","body":"World"}` ``).

**2 — the `count` computation and returned `<span>`.** Anchored on the original
`const count = Object.keys(value).length;` through the closing `</span>` — per open
question #3, a key-count summary has no long-form text to slice, so it's replaced
with a serialized preview of the group's own fields, which does:

```tsx
const preview = JSON.stringify(value);
return (
  <span className="text-xs text-muted-foreground font-mono" title={preview}>
    {preview.length > 77 ? `${preview.slice(0, 77)}...` : preview}
  </span>
);
```

#### packages/react/src/components/fields/group/Cell.test.tsx

**1 — the key-count assertions.** Open question #3's resolution replaces the `{ N
keys }` summary itself, not just its missing `title` — so the `it.each` asserting
that exact text is asserting the overturned contract, not the intended one:

```tsx
it.each([
  [{ title: "Hello" }, `{"title":"Hello"}`],
  [{ title: "Hello", body: "World" }, `{"title":"Hello","body":"World"}`],
])("renders a serialized key/value preview for %j", (value, expected) => {
```

(Only the `it.each` table and its description change; the test body — render then
`expect(screen.getByText(expected)).toBeInTheDocument()` — is unchanged.)

Verify: pnpm --filter @vexcms/react exec vitest run packages/react/src/components/fields/{relationship,select,array,blocks,upload,group}/Cell.test.tsx --coverage.enabled=false

## Step 4 — Delete the dead pagination family (HOOK-1, HOOK-2)

**[agent]**

Why: `usePagination` and `DataTablePagination` have zero production consumers — both list
views use `usePaginatedQuery` + `onLoadMore` (`CollectionListView.tsx:59,133`,
`MediaCollectionListView.tsx:72,154`). Fixing defects in unreachable code, and maintaining a
page-number UI the admin deliberately replaced, is waste. Lands before the remaining hook work
so nothing is spent on code that is going away.

Verified dead by direct search: `usePagination`, `goToPage`, and `DataTablePagination` have
zero references anywhere in `packages/**/src` or `apps/**/src` outside the four files deleted
below and `testing/dataTableSuite.tsx` (the shared test kit, edited below, not deleted — its
other three members stay wired to real production code).

This deletion removes public exports of `@vexcms/react` (`usePagination`, `UsePaginationProps`,
`UsePaginationReturn`, `DataTablePagination`, `DataTablePaginationProps` were all re-exported
from the package root via `hooks/index.ts` and `components/ui/data-table/index.ts`). That is
acceptable because the package is pre-first-release alpha — there are no external consumers to
break, and nothing else in this monorepo imports these symbols. Measured coverage effect: 124
statements removed (121 covered), dropping `packages/react` coverage from 90.71% to 90.42%,
still well clear of the 80% gate.

Two authorised exceptions to this spec's "fix the source, never the test" rule apply here per
the frozen contract: `usePagination.test.tsx` and `DataTablePagination.test.tsx` are **deleted**
along with the code they test, not edited to pass.

#### packages/react/src/hooks/usePagination.ts

Deleted. Zero production consumers; superseded by `usePaginatedQuery` + `onLoadMore`.

#### packages/react/src/hooks/usePagination.test.tsx

Deleted along with the hook it tests (authorised exception to "fix the source, never the
test").

#### packages/react/src/components/ui/data-table/DataTablePagination.tsx

Deleted. Zero production consumers — no list view renders page-number pagination; both use
Load-More.

#### packages/react/src/components/ui/data-table/DataTablePagination.test.tsx

Deleted along with the component it tests (authorised exception to "fix the source, never the
test").

#### packages/react/src/hooks/index.ts

**1 — drop the dead re-export.**

```ts
export * from "./useTableSelection";
```

(Removes the `export * from "./usePagination";` line immediately above it. `useTableSelection`
and every other line are untouched.)

#### packages/react/src/components/ui/data-table/index.ts

**1 — drop the dead re-export.**

```ts
export * from "./DataTableBulkActions";
```

(Removes the `export * from "./DataTablePagination";` line immediately above it. `DataTable`,
`DeleteManyModal`, and `DataTableBulkActions`'s own export are untouched.)

#### packages/react/src/testing/dataTableSuite.tsx

**1 — drop the now-unused `DataTablePagination`/`usePagination` imports.**

```tsx
import { DataTable } from "../components/ui/data-table/DataTable";
import { DataTableBulkActions } from "../components/ui/data-table/DataTableBulkActions";
import { BulkDeleteModal, type BulkDeleteModalProps } from "../components/ui/data-table/DeleteManyModal";
import { useTableSelection } from "../hooks";
```

**2 — drop `"DataTablePagination"` from the `DataTableSuiteMember` union.**

```tsx
export type DataTableSuiteMember =
  | "DataTable"
  | "DataTableBulkActions"
  | "DeleteManyModal";
```

**3 — drop `"DataTablePagination"` from the default `only` list.**

```tsx
  const only = options?.only ?? [
    "DataTable",
    "DataTableBulkActions",
    "DeleteManyModal",
  ];
```

**4 — delete the `"DataTablePagination"` describe block.** Remove the entire
`if (only.includes("DataTablePagination")) { describe("DataTablePagination", () => { … }); }`
block (its four `it`s covering page-link rendering, `goToPage` wiring, `Previous`/`Next`
disabled state, and the ellipsis). The blank-line separator between the `"DataTable"` block
above it and the `"DataTableBulkActions"` block below it is preserved so the file keeps one
blank line between sibling `if` blocks, matching the surrounding style. `DataTable`,
`DataTableBulkActions`, and `DeleteManyModal`'s own blocks, fixtures (`ROWS`, `COLUMNS`), and
JSDoc are otherwise untouched — the top-of-file JSDoc's component count and the
`DataTableSuiteOptions.only` doc comment are trimmed from "four"/"all four" to
"three"/"all three" to stay accurate, since they enumerate the same set the union and default
list above cover.

Confirm no remaining reference: after this step, `goToPage`, `usePagination`, and
`DataTablePagination` appear nowhere in `packages/**/src` or `apps/**/src`.

Verify: pnpm --filter @vexcms/react exec vitest run src/components/ui/data-table src/hooks --coverage.enabled=false && pnpm --filter @vexcms/react exec tsc --noEmit -p tsconfig.check.json

## Step 5 — useTableSelection exclusion semantics (HOOK-5, HOOK-3)

**[agent]**

Why: "Select all, then untick one" is the most common bulk-edit gesture, and today
`isRowSelected` still reports the unticked row as selected. `RBAC-2`'s note says bulk-delete is
meant to be restored; restoring it onto this hook would delete a row the user excluded.

`HOOK-5` gives `mode === "all"` real "all except these ids" semantics: `isRowSelected` and
`getSelectionCount` must consult `selectedIds` as an exclusion set instead of short-circuiting
on the mode string, matching `toggleInverseMode`'s own documented "everything selected except
deselected" semantics — `"all"` and `"inverse"` become the same exclusion-set read, differing
only in the label surfaced through `state.mode`. `toggleRow`'s existing set-toggle logic
already treats `selectedIds` as a generic membership set and needs no change for this defect;
only the two read-side functions were wrong.

`HOOK-3` computes `nextMode` into a local once, in the same `setSelectedIds` updater `HOOK-5`
touches, and passes that local to both `setMode` and `onSelectionChange` so the callback
reports post-change state instead of the outer closure's stale `mode`.

`UseTableSelectionReturn`'s shape does not change — `isRowSelected`, `getSelectionCount`, and
`onSelectionChange`'s payload shape are unchanged, only their computed values. No edits to
`DataTableBulkActions.tsx` or `testing/dataTableSuite.tsx` are needed.

#### packages/react/src/hooks/useTableSelection.ts

**1 — `toggleRow`: compute `nextMode` once and use it for both `setMode` and `onSelectionChange` (HOOK-3).**

```tsx
  const toggleRow = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }

        // Compute the post-toggle mode into a local so onSelectionChange
        // reports the state after this change, not the stale closure value.
        const nextMode: SelectionMode = next.size === 0 ? "none" : mode === "none" ? "page" : mode;
        setMode(nextMode);

        onSelectionChange?.({ selectedIds: next, mode: nextMode });
        return next;
      });
    },
    [mode, onSelectionChange],
  );
```

**2 — `isRowSelected`/`getSelectionCount`: `"all"` reads `selectedIds` as an exclusion set, same as `"inverse"` (HOOK-5).**

```tsx
  const isRowSelected = useCallback(
    (id: string) => {
      // "all" and "inverse" both represent selectedIds as an exclusion
      // set — "all except these ids" — so a row is selected unless it was
      // explicitly toggled out.
      if (mode === "all" || mode === "inverse") return !selectedIds.has(id);
      return selectedIds.has(id);
    },
    [mode, selectedIds],
  );

  const getSelectionCount = useCallback(() => {
    if (mode === "all" || mode === "inverse") return (totalCount ?? 0) - selectedIds.size;
    return selectedIds.size;
  }, [mode, selectedIds, totalCount]);
```

Verify: pnpm --filter @vexcms/react exec vitest run src/hooks/useTableSelection.test.tsx --coverage.enabled=false

## Step 6 — usePaginatedQuery state derivation (HOOK-6, HOOK-4)

**[agent]**

Why: `isDone` reads `true` while the first page is loading and forever after a query error, so
a transient network failure is indistinguishable from a complete empty collection with no retry
affordance (`HOOK-6`). Separately, `loadMore()` fetches page N into the internal accumulator but
only reveals it on the *next* call, because `clientPageIndex` — which gates the visible window —
only advances once the accumulator already covers it (`HOOK-4`). Both live in the same
`result` memo / `loadMore` region of the hook, so they're one coherent state-derivation rework:
the memo now derives `isDone` from `useQuery`'s own `isLoading`/`isError` instead of inferring it
from `data`'s absence, and `loadMore` now advances `clientPageIndex` unconditionally (revealing
already-accumulated data immediately) while still queuing a server fetch when the pre-advance
window was already at the edge of loaded data. This is a reorder, not new fetch logic — traced
against the real hook (Step 3) before committing to it: the old `else` branch only advanced the
index when a fetch was *not* needed, which is exactly the off-by-one-reveal.

#### packages/react/src/hooks/usePaginatedQuery.ts

**1 — hoist `clientIsDone` above `loadMore` and advance `clientPageIndex` unconditionally,
gated by an early return once already done.** Anchored on the `needsServerFetch` declaration
and the `loadMore` function that follows it.

```tsx
  const needsServerFetch = endIndex >= allResults.length && !isDone;
  const clientIsDone = isDone && endIndex >= allResults.length;

  function loadMore() {
    // `clientPageIndex` always advances first so an already-accumulated page
    // is revealed on THIS call, not the next one (HOOK-4): the prior
    // implementation only advanced the index once the accumulator already
    // covered the visible window, so a fetch-triggering call revealed
    // nothing until a second call caught up. A server fetch is still queued
    // whenever the (pre-advance) window was already at the edge of loaded
    // data, so the newly-revealed slice keeps filling in behind it.
    if (clientIsDone) return;
    if (needsServerFetch && result.continueCursor) {
      setCursor(result.continueCursor);
    }
    setClientPageIndex((prev) => prev + 1);
  }
```

**2 — thread `isLoading`/`isError` out of `useQuery`.** Anchored on the `useQuery` destructure.

```tsx
  const { data, isPending, isLoading, isError } = useQuery({
```

**3 — derive the placeholder's `isDone` from query state, not from `data`'s absence.**
Anchored on the `result` memo (`// Extract pagination result`).

```tsx
  // Extract pagination result
  const result = useMemo<PaginationResult<TDocument>>(() => {
    // Empty placeholder for "no data yet". `continueCursor: ""` is a falsy
    // placeholder, never a real cursor: it is only read for truthiness in
    // `loadMore`, so `setCursor` never receives it and Convex only ever sees
    // `null` (first page) or a genuine cursor. `data` is absent both while
    // the query is still loading and after it rejects, so `isDone` can't be
    // inferred from its mere absence (HOOK-6) — it must default to `false`
    // ("not done") and only the array-response branch below, which is
    // genuinely a complete non-paginated result, overrides it to `true`.
    const empty = {
      page: [] as TDocument[],
      continueCursor: "",
      isDone: false,
    };
    if (isLoading || isError || !data) return empty;
    if (Array.isArray(data)) return { ...empty, page: data as TDocument[], isDone: true };
    return data as PaginationResult<TDocument>;
  }, [data, isLoading, isError]);
```

**4 — drop the now-duplicate late `clientIsDone` declaration.** Anchored on the line
immediately before the hook's `return` statement (the accumulate effect's closing `}, […])`
stays; only the `const clientIsDone = …` line above `return {` is removed — `clientIsDone` is
now the one declared in edit 1).

```tsx
  return {
```

Deviation: none from the Direction's own hedge — I ran the real hook (Step 3's harness) with
this reorder before finalizing it, confirming it's a pure reorder rather than new fetch logic,
per the report's own caveat ("most likely a reorder... verify that claim before committing to
it").

Verify: pnpm --filter @vexcms/react exec vitest run src/hooks/usePaginatedQuery.test.tsx src/components/views/CollectionListView.test.tsx src/components/views/MediaCollectionListView.test.tsx --coverage.enabled=false

## Step 7 — Modal in-flight guard (MODAL-1, MODAL-2)

**[agent]**
Why: two P0 "user believes they didn't do that" defects in one file. A rapid double-click
creates the document twice; Escape immediately after submit closes the dialog while the write
still lands. `isPending` flips only after TanStack Form's async validation `await`, so there is
a window where neither is guarded. `Modal`'s `onOpenChange` is the single choke point every
dismissal vector already funnels through — Base UI's `Dialog.Root` calls it with a
`reason` of `escape-key`, `outside-press`, or `close-press` for Escape, the backdrop, *and*
every `DialogClose` (the Cancel button and the corner X), all three confirmed by reading
`useDialogRoot.js`'s `useDismiss` wiring and `DialogClose.js`'s `store.setOpen(false,
createChangeEventDetails(REASONS.closePress, …))` call. Gating there, not on each trigger,
is what makes the fix cover Cancel and the close icon for free. `useVexMutation`'s `isPending`
stays in the disabled expression alongside the new flag — the flag covers the pre-await
window, `isPending` covers the request itself.

**Blast radius correction.** `DeleteManyModal.tsx` (`BulkDeleteModal`) does not consume
`BaseModal`'s `Modal` at all — it wraps `AlertDialog` directly and was never in scope for the
new prop. `CreateMediaModal.tsx` does consume `Modal` but needs zero edits: `dismissible`
defaults to `true`, so its current always-dismissible behavior is unchanged.

**One flag, two primitives.** The in-flight flag is conceptually singular but is held as a
`useRef` + a mirrored `useState`. The two submit events in the MODAL-1 test fire
back-to-back with no React re-render in between, so a check that only reads state (closed over
from the render that registered the handler) never sees the first click's update — only the
ref is guaranteed fresh inside the handler. The state half exists purely to re-render the
button (`isPending`) and the modal (`dismissible`).

**Reset ordering, found by running the suite, not assumed.** The guard is released *before*
`setOpen(null)` runs, not after in a trailing `finally` around the whole submit body. Releasing
it after caused a real regression on the *passing* `"submits the typed field values…"` test:
the extra `setIsSubmitting(false)` render, arriving one tick after the URL-clearing render, hit
`testing/modalSuite.tsx`'s `NuqsTestingAdapter` (mounted with no `hasMemory`, so its own
`searchParams` store never advances and `useQueryState`'s optimistic value is the only thing
holding `open` at `false`) and the dialog's URL param snapped back to `true`. Confirmed by
bisecting the diff hunk-by-hunk against the real suite: identical code with the reset moved
before `setOpen(null)` is stable across 5 repeated runs; after, it reopens on that specific
test every time. `onSubmitInvalid` gives the same early release when TanStack Form's own
validation fails and `onSubmit` never runs at all, so the flag can't get stuck open on a bad
form.

#### packages/react/src/components/modals/BaseModal.tsx

Existing file — 1 edit (whole `Modal` function, including its doc comment), everything else
unchanged.

**1 — `dismissible` prop, vetoing Base UI's own close handling.** Added to the doc comment,
the destructured props, and the type; `onOpenChange`'s second parameter (`eventDetails`) is
Base UI's own `DialogRoot.ChangeEventDetails` — calling `.cancel()` on it (confirmed by reading
`DialogStore.js`'s `setOpen`: `this.context.onOpenChange?.(nextOpen, eventDetails); if
(eventDetails.isCanceled) { return; }`) stops Base UI's internal close handling, not just this
component's own `setOpen(null)` call, so focus/animation state never half-transitions.

```tsx
/**
 * URL-state-driven modal wrapper.
 *
 * Opens when `?{urlParam}=true` is present in the URL and closes by setting
 * the param back to `null` via `nuqs`. Wraps the shadcn `Dialog` primitive.
 *
 * @param props - Component props.
 * @param props.urlParam - The `nuqs` URL parameter key that drives open state.
 * @param props.dismissible - Whether Escape, a backdrop click, or any
 *   `DialogClose` trigger (a Cancel button, the corner close icon) may close
 *   the dialog. Defaults to `true`. Set to `false` while an owned write is
 *   in flight — Base UI still runs its internal close handling unless the
 *   change event is canceled, so this vetoes it centrally rather than
 *   leaving every dismissal vector (Escape/backdrop/Cancel) to guard itself.
 * @param props.children - `DialogContent` and any other `Dialog` children.
 * @returns A `Dialog` whose open state is bound to the URL search parameter.
 *
 * @example
 * ```tsx
 * <Modal urlParam="createNew">
 *   <DialogContent>...</DialogContent>
 * </Modal>
 * ```
 */
export function Modal({
  urlParam,
  children,
  dismissible = true,
  ...divProps
}: { urlParam: string; dismissible?: boolean } & ComponentPropsWithRef<"div">) {
  const [open, setOpen] = useQueryState(urlParam, parseAsBoolean);
  return (
    <Dialog
      {...divProps}
      open={open ?? false}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && !dismissible) {
          eventDetails.cancel();
          return;
        }
        if (nextOpen) {
          setOpen(true);
        } else {
          setOpen(null);
        }
      }}
    >
      <ModalSurfaceProvider>{children}</ModalSurfaceProvider>
    </Dialog>
  );
}
```

#### packages/react/src/components/modals/CreateDocumentModal.tsx

Existing file — only the changed lines, as anchored edits.

**1 — import.** Add `useState` beside the existing `useRef` import:

```tsx
import { useRef, useState } from "react";
```

**2 — the in-flight guard, declared right after `setOpen`.** `isSubmittingRef` is what the
capture-phase handler in edit 4 checks; `isSubmitting`/`setIsSubmitting` is its render-visible
mirror, consumed by the `Button` (edit 5) and `Modal`'s new `dismissible` prop (edit 4).
`endSubmit` is shared by both places the guard is released (edit 3):

```tsx
  // Guards the window between a submit attempt and `useVexMutation`'s
  // `isPending`, which only flips true *after* TanStack Form's async field
  // validation resolves (BUGS-REPORT MODAL-1/MODAL-2). `isSubmittingRef` is
  // read synchronously inside the capture-phase submit handler below — two
  // `submit` events fired back-to-back never get a React re-render in
  // between, so a `disabled`/`dismissible` prop driven only by state cannot
  // stop the second one. `isSubmitting` mirrors the ref into render so the
  // submit button and the modal's dismissibility can react to it.
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endSubmit = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };
```

**3 — `onSubmit` releases the guard before closing, plus `onSubmitInvalid` for the
validation-failure path.** Replaces the existing `onSubmit` entry inside the
`useCollectionForm({ ... })` call. The guard release sits in a `finally` around only the
mutation call, *before* the trailing `await setOpen(null)` — seeing the earlier "reset
ordering" note for why it cannot be a `finally` wrapping the whole body:

```tsx
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async ({ value }: { value: any }) => {
      // `endSubmit` (not a trailing `finally` around the whole body) so the
      // guard clears *before* `setOpen(null)` clears the URL param — freeing
      // it after would force an extra render that races the URL-driven
      // close in `NuqsTestingAdapter`'s memoryless mode.
      try {
        await mutateAsync({ collection: collection.slug, data: value });
      } finally {
        endSubmit();
      }
      await setOpen(null);
    },
    // TanStack Form skips `onSubmit` entirely when validation fails, so the
    // in-flight guard above needs its own release on that path too.
    onSubmitInvalid: endSubmit,
```

**4 — `Modal` gates dismissal; `DialogContent` sets the guard synchronously on submit.** The
capture-phase handler runs before `AppForm`'s own bubble-phase `onSubmit` (which is what
calls TanStack Form's `handleSubmit()` and starts the async validation), so the ref is already
`true` by the time a second, back-to-back `submit` event would reach it — that second event is
killed outright with `preventDefault`/`stopPropagation` rather than left to a `disabled`
attribute that hasn't re-rendered yet:

```tsx
    <Modal urlParam={MODALS.createDocument.urlParam} dismissible={!isSubmitting}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="flex h-[50svh] w-[50svw] flex-col"
        onSubmitCapture={(event) => {
          if (isSubmittingRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          isSubmittingRef.current = true;
          setIsSubmitting(true);
        }}
      >
```

**5 — submit button reflects both signals.** `isPending` still covers the request itself;
`isSubmitting` now covers the pre-`await` window `isPending` cannot see:

```tsx
            <Button isPending={isPending || isSubmitting} type="submit">
```

Verify: pnpm --filter @vexcms/react exec vitest run src/components/modals --coverage.enabled=false

## Step 8 — View RBAC gating (RBAC-1, RBAC-2)

**[agent]**

**Defense-in-depth gap, not a privilege-escalation vulnerability.** `MediaCollectionEditView`
drops `canEdit` from its Save/Cancel `disabled` expression, unlike `CollectionEditView.tsx:113,121`'s
`disabled={!canEdit || isDefaultValue}`. Server-side enforcement (Convex mutation permission
checks) is the real gate; `MediaCollectionEditView.tsx:172`'s `readOnly={field.admin.readOnly ||
!canEdit}` still blocks normal-interaction dirtying today, so this is a client-state
inconsistency, worth closing because it depends on every field type honoring its `readOnly`
prop rather than on Save's own `disabled` expression (RBAC-1).

Separately, `MediaCollectionListView` never calls `usePermission` for the create action at all,
so its Upload button carries no `disabled`/`aria-disabled` regardless of the caller's create
permission — unlike `CollectionListView`'s "+ New", gated with `disabled={!canCreate}` (RBAC-2).

**Separately — `canDelete`, not a defect today.** Both list views already resolve `canDelete`,
but it gates nothing: `DataTable.tsx`'s bulk-delete trigger UI is commented out, so there is no
control for `canDelete` to disable. `CollectionListView.test.tsx`/`MediaCollectionListView.test.tsx`
each carry a **passing** `it("has no reachable destructive control while bulk-delete UI remains
unwired")` plus a code comment recording that restoring `DataTableBulkActions` ships it ungated
unless `disabled={!canDelete}` is wired in the same change. Leave `canDelete` unwired in both
list views. That test and its comment stay exactly as they are — do not touch them.

#### `packages/react/src/components/views/MediaCollectionEditView.tsx`

**1 — Save button's `disabled`, matching `CollectionEditView.tsx:113`.**

```tsx
disabled={!canEdit || isDefaultValue}
```

**2 — Cancel button's `disabled`, matching `CollectionEditView.tsx:121`.**

```tsx
disabled={!canEdit || isDefaultValue}
```

`canEdit` is already computed at line 118; both buttons previously read `disabled={isDefaultValue}`
only.

#### `packages/react/src/components/views/MediaCollectionListView.tsx`

**1 — create-action permission check, mirroring `CollectionListView.tsx:95`'s resource/action
arguments (no `scope` — create isn't scoped there either).** Add immediately before the existing
`canDelete` check:

```tsx
const canCreate = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.create });
```

**2 — wire the Upload button to the disabled-link pattern `CollectionListView.tsx:117-125`
already uses for "+ New".** Previously the `Button` carried no `disabled` prop at all:

```tsx
<Button
  nativeButton={false}
  disabled={!canCreate}
  render={<VexLink href={`/admin/${collection.slug}?${MODALS.uploadMedia.urlParam}=true`} />}
>
  + Upload {collection.labels.singular}
</Button>
```

Verify: pnpm --filter @vexcms/react exec vitest run src/components/views/MediaCollectionEditView.test.tsx src/components/views/MediaCollectionListView.test.tsx src/components/views/CollectionListView.test.tsx --coverage.enabled=false

## Step 9 — Media upload filtering and alt text (MEDIA-1, MEDIA-2)

**[agent]**

Why: the standalone dropzone accepts any mime type while the field-level upload path filters —
a user can drop an executable. And `FilePreview`'s alt fallback is dead code, so every image
without alt text renders `alt=""`.

**Investigation note (deviation from the report's literal Direction).** `MEDIA-1`'s Direction
says to "read `accept` from the target media collection's config." Verified against real
`@vexcms/core` — `MediaCollectionConfig`, `MediaCollectionMeta`,
`AdminCollectionConfig`/`AdminCollectionConfigInput`, `StorageAdapterBaseInterface`, and
`defineMediaCollection`'s resolved field set (`filename`/`alt`/`mimeType`/`size`/`storageId`/
`deleted`/`src`/`width`/`height`) — **no per-media-collection accepted-types property exists
anywhere in core today.** `UploadField.accept` (the field-level reference) lives on a
*referencing collection's* `upload()` field, not on the media collection itself, and
`MediaUploadDropzone` (used standalone from `CreateMediaModal`, with no such field in scope)
has nothing analogous to read. `testing/mediaSuite.tsx`'s own `describeMediaUploadDropzone`
confirms this: it renders `<MediaUploadDropzone targetCollection="images" .../>` through
`renderWithVexProviders`, which mounts no `VexConfigContext.Provider` at all, so
`useVexConfig()` would resolve the empty default config with `mediaCollections: []` — there is
nothing to read even if the property existed. This step's own file list (`spec-tasks.md`) also
excludes every core file, so adding a new config surface is out of scope here regardless. The
fix below instead uses a fixed safe-media allowlist local to the component — the only
approach that both matches the concrete `mediaSuite.tsx` assertions (rejects
`application/x-msdownload`, accepts `image/png`/`application/pdf`/`video/mp4`/
`application/octet-stream`) and requires no core changes. The per-collection config path
belongs on a follow-up if a project ever needs project-specific accepted types for standalone
media uploads.

**Investigation note 2 (the `maxFiles: 1` direction doesn't do what it says).** Read
`react-dropzone@15.0.0`'s own `src/index.js` (`setFiles`): the "too many files" gate is
`(!multiple && acceptedFiles.length > 1) || (multiple && maxFiles >= 1 && acceptedFiles.length
> maxFiles)`, and either branch **empties `acceptedFiles` entirely** — react-dropzone has no
"keep the first N, drop the rest" mode; it only ever accepts the whole drop or rejects the
whole drop. Verified live: `multiple: false` + `maxFiles: 1` (the literal Direction) still
rejects a two-file drop outright — `onDrop` receives zero files, exactly today's bug. Fix
below instead sets `multiple: true` (so react-dropzone's own gate never fires) and truncates
to the first file **inside `onDrop`**, which is what actually reproduces
`fields/upload/EmptyInput.tsx`'s `files.slice(0, 1)` intent. `maxFiles` is dropped — it cannot
express "keep first" in this library version and combining it with `multiple: true` would
re-introduce the same whole-batch rejection once the count exceeds it.

#### packages/react/src/components/media/MediaUploadDropzone.tsx

**1 — new imports and a module-level accept allowlist, above the `MediaUploadDropzoneProps` interface.**

```tsx
import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone"; // or custom implementation
import { StorageAdapterSlug, vexConvexApi } from "@vexcms/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useStorageAdapterMap } from "../../context";
import { useVexMutation } from "../../hooks";

/**
 * MIME types this dropzone accepts, keyed the way react-dropzone's `useDropzone({ accept })`
 * option requires (`Record<mimeType, extension[]>`; extensions are unused here, only the
 * key is matched). `@vexcms/core`'s `MediaCollectionConfig` carries no per-collection
 * accepted-types setting today — unlike `UploadField.accept` at the field level
 * (`fields/upload/Input.tsx`) — so this is a fixed safe-media allowlist covering the
 * categories a real upload actually produces, plus the browser's generic "unknown binary"
 * fallback (`application/octet-stream`), which every legitimate large/opaque upload can
 * carry when the browser can't infer a specific type.
 */
const MEDIA_UPLOAD_ACCEPT: Accept = {
  "image/*": [],
  "video/*": [],
  "audio/*": [],
  "application/pdf": [],
  "application/octet-stream": [],
};
```

**2 — the component's own doc comment: replace the stale "batch upload" claim with the real single-file contract.**

```tsx
/**
 * File upload dropzone — handles drag-and-drop and click-to-upload.
 *
 * Uploads files to the target media collection via vexConvexApi.media.*.
 * Uses the adapter's generateUploadUrl() to get a presigned URL, POSTs the file,
 * then calls createMediaDocument() to create the media document.
 *
 * Single-file: only the first dropped/selected file is uploaded, matching
 * `fields/upload/EmptyInput.tsx`'s single-select `slice(0, 1)` truncation.
 *
 * @param props — Dropzone component props.
 * @returns The drag-and-drop / click-to-upload dropzone element.
 */
```

**3 — the `onDrop` callback: truncate to the first accepted file instead of batch-uploading every file.**

```tsx
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Single-file dropzone: `useDropzone`'s own `multiple`/`maxFiles` gate
      // can only accept-or-reject an ENTIRE drop, never keep a subset of it —
      // verified against react-dropzone@15.0.0's `setFiles`, which empties
      // `acceptedFiles` outright once the count exceeds what's allowed. A
      // same-batch multi-file drop is therefore truncated to the first file
      // here instead, matching `fields/upload/EmptyInput.tsx`'s
      // `files.slice(0, 1)`.
      const [file] = acceptedFiles;
      if (!file) return;

      const mediaId = await uploadFile(file);
      props.onUploadComplete(mediaId);
    },
    [props.onUploadComplete, uploadFile],
  );
```

**4 — the `useDropzone` call: filter by `accept`, and set `multiple: true` so the truncation in `onDrop` above actually runs (see Investigation note 2).**

```tsx
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // `multiple: true` so react-dropzone's own count gate never fires and
    // discards every dropped file before `onDrop` runs — `onDrop` above does
    // the actual "keep only the first file" truncation. `accept` still
    // filters by MIME type independently of `multiple`.
    multiple: true,
    accept: MEDIA_UPLOAD_ACCEPT,
  });
```

#### packages/react/src/components/media/FilePreview.tsx

**1 — the alt fallback: emptiness check instead of nullish coalescing, since `VexMediaDocument.alt` is a required `string` that is `""` when unset.**

```tsx
  const alt = mediaDoc.alt || mediaDoc.filename;
```

#### .agent/docs/product/backlog.md

**1 — new entry appended at the end of the file, filing the decorative-image escape hatch (report open question #4).** Uses this file's existing `##` entry-heading convention; demoted to `###` below only so the packet extractor's fence-blind `## ` scan doesn't cut the section here — restore to `##` when writing the file.

````markdown
---

### Decorative-image escape hatch for media alt text

**What.** A distinct way to declare `alt=""` as *deliberately* decorative — not
just "nobody filled this in yet" — on `VexMediaDocument`.

**Why.** `MEDIA-2`
(`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`) fixed
`FilePreview`'s dead alt-text fallback (`??` never firing on a required
`string`, so every unset-alt image rendered `alt=""`) by falling back to the
filename whenever `alt` is empty: `mediaDoc.alt || mediaDoc.filename`. That
fix is unconditional — it also overwrites a real, W3C-recommended `alt=""` on
a genuinely decorative image (a divider, a background texture) with the
filename, which screen readers then read aloud. Empty string is the only
value `alt` can hold today, so "unset" and "deliberately decorative" are
indistinguishable and the fix necessarily picks one meaning.

**Lift.** Unassessed. The type change alone is small — `VexMediaDocument.alt`
would need a way to express "decorative" distinct from `""` (e.g.
`alt: string | null` with `null` reserved for decorative, matching the
report's own suggestion) — but it is a breaking change to a published type,
touches the upload path that seeds `alt` from the filename at creation
time (`MediaUploadDropzone.tsx`), and needs an admin-panel affordance for a
user to actually mark an image decorative rather than just leaving the field
blank.

**Why deferred.** Report open question #4, ratified out of scope for the
`2026-09-08-react-bug-fixes` fix spec: fixing the dead fallback was in scope,
designing a new "decorative" signal on top of it was not. The fallback fix
ships now because it strictly improves the common case (alt text nobody
filled in); the escape hatch needs its own design pass.

**Detail.** `MEDIA-2` in
`.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md`, open
question #4 in the same file.
````

Verify: pnpm --filter @vexcms/react exec vitest run src/components/media --coverage.enabled=false

## Step 10 — Core label derivation (CORE-LABEL-1)

**[agent]**

Why: cross-package and breaking. `defineCollection` derives `singular: "Posts"` and
`plural: "Postses"` for slug `posts`. Every consumer that omits `labels` sees both in the admin
UI — `AdminSidebar.tsx:124` renders `labels.plural` in the nav.

This is two bugs sharing one call site (contract correction #2). The report only caught
`singular` title-casing the raw slug instead of singularizing it first. It missed that `plural`
compounds: `plural(toTitleCase("posts"))` double-pluralizes irregular-suffix slugs to
`"Postses"`, `categories` → `"Categorieses"`, `media` → `"Medias"`. The fix for `plural` is to
stop calling `plural()` at this call site entirely — slugs are plural by convention, so the
title-cased slug **is** the plural label. `plural()` itself in `utils.ts` is untouched: it is
correct and is public API (`core/src/index.ts:23` re-exports `./utils`).

`pluralize-esm@9.0.5` supplies the missing half: singularizing an arbitrary English slug
(including irregulars — `people`→`person`, `children`→`child`, `shelves`→`shelf` — and
uncountables — `media`, `news`, `series`, all of which round-trip to themselves) is not
something a suffix-stripping regex can do reliably, unlike `plural()`'s narrower forward
direction. It is ESM-native (`type: module`), ships bundled `.d.ts`, and has zero runtime deps
of its own — nothing to audit transitively.

#### pnpm-workspace.yaml

**1 — add `pluralize-esm` to the catalog, alphabetically between `platejs` and `prettier`.**

```yaml
  platejs: 52.3.21
  pluralize-esm: 9.0.5
  prettier: 3.9.5
```

#### packages/core/package.json

**1 — add `pluralize-esm` to `dependencies`, alphabetically between `nanoid` and `zod`. tsup
externalizes anything listed in `dependencies` by default (verified: `dist/index.js` retains a
bare `import pluralize from "pluralize-esm"` rather than bundling it), so no `tsup.config.ts`
change is needed.**

```json
  "dependencies": {
    "nanoid": "catalog:",
    "pluralize-esm": "catalog:",
    "zod": "catalog:"
  },
```

#### packages/core/src/collections/config.ts

**1 — import `pluralize-esm`'s default export; drop the now-unused `plural` import from
`../utils` (its only call site in this file is deleted below).**

```ts
import pluralize from "pluralize-esm";

import { AdminField, CollectionFieldMeta, ComponentHKT, number } from "../fields";
import { CollectionSlug } from "../types";
import { toTitleCase } from "../utils";
import { ReservedCollectionFieldKey } from "./constants";
import { CollectionConfig, CollectionConfigInput } from "./types";
import { slugToPascalCase } from "./utils";
```

**2 — `defineCollection`'s JSDoc prose matches the corrected derivation. The `@example` block
beneath it already documented the intended `singular: "Post"` output (report line 523) — only
this description was wrong, describing the old title-case-then-pluralize order.**

```ts
/**
 * Resolves a raw collection config input into a fully-populated `CollectionConfig`.
 *
 * Fills in any missing `labels` by deriving them from the `slug` — singularizing
 * then title-casing it for `singular`, and title-casing the slug itself for
 * `plural` (slugs are plural by convention).
 *
```

**3 — the derivation itself (frozen shape). Singularize before title-casing for `singular`;
`plural` is just the title-cased slug — no `plural()` call. `...input.labels` stays last so an
explicit label always wins over the derived one.**

```ts
    labels: {
      singular: toTitleCase(pluralize.singular(input.slug)),
      plural: toTitleCase(input.slug),
      ...input.labels,
    },
```

#### packages/core/src/collections/config.test.ts

**1 — new `describe` block appended after the file's last existing block
(`defineCollection — an already-declared updatedAt is left alone`), covering both derivation
paths. Core had zero coverage of this derivation — every existing test in this file passes
`labels` explicitly, so this is the suite's first exercise of the default. `it.each` pins the
exact singularize→title-case output per slug class (regular, irregular, uncountable) so a
regression back to title-casing the raw slug for `singular`, or reintroducing `plural()` at the
call site, fails loudly rather than silently passing a looser assertion.**

```ts

describe("defineCollection — label derivation (CORE-LABEL-1)", () => {
  // `singular` is derived by singularizing the slug before title-casing it;
  // `plural` is just the title-cased slug itself, since slugs are plural by
  // convention. `it.each` pins the exact strings so a regression back to
  // title-casing the raw slug for `singular` (dropping "Posts" instead of
  // "Post"), or reintroducing `plural()` at this call site (compounding
  // "Posts" into "Postses"), fails loudly.
  it.each([
    // regular
    ["posts", "Post", "Posts"],
    ["pages", "Page", "Pages"],
    // irregular
    ["people", "Person", "People"],
    ["children", "Child", "Children"],
    ["shelves", "Shelf", "Shelves"],
    // uncountable
    ["media", "Media", "Media"],
    ["news", "News", "News"],
    ["series", "Series", "Series"],
  ])("derives labels for slug %j when labels are omitted", (slug, singular, plural) => {
    const collection = defineCollection({ slug, fields: { title: text({ required: true }) } });
    expect(collection.labels).toEqual({ singular, plural });
  });

  it("passes explicitly-provided labels through verbatim, untouched by derivation", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      labels: { singular: "Article", plural: "Articles" },
    });
    expect(collection.labels).toEqual({ singular: "Article", plural: "Articles" });
  });

  it("derives the omitted half when only one of singular/plural is provided", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
      labels: { singular: "Article" },
    });
    expect(collection.labels).toEqual({ singular: "Article", plural: "Posts" });
  });
});
```

#### .changeset/core-label-singularization.md

````markdown

---
"@vexcms/core": minor
---

**Breaking:** `defineCollection` now singularizes a collection's `slug` before title-casing it
for the default `labels.singular`, and no longer runs the title-cased slug through `plural()`
for `labels.plural`.

Every consumer that omits `labels` gets different default admin-panel text. For slug `"posts"`,
`labels.singular` was `"Posts"` and is now `"Post"` — the admin's "Create Posts" button becomes
"Create Post", the document header reads "Post" instead of "Posts". `labels.plural` was
`"Postses"` (`plural()` compounding an already-plural slug) and is now `"Posts"`. The same
double-pluralization affected every irregular-suffix slug — `categories` was `"Categorieses"`,
`boxes` was `"Boxeses"` — now both are correctly just the title-cased slug.

If you rely on today's output — including the previously-broken `plural` values — set `labels`
explicitly on the affected `defineCollection` calls:

```ts
defineCollection({
  slug: "posts",
  labels: { singular: "Posts", plural: "Postses" }, // pins the pre-upgrade values
  fields: { /* ... */ },
});
```

`plural()` in `utils.ts` is unchanged — it was already correct and remains public API. The bug
was calling it a second time on an already-plural slug, not the function itself.
````

Verify: pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react exec vitest run src/components/modals/CreateDocumentModal.test.tsx --coverage.enabled=false

## Step 11 — Full verification, coverage, and bookkeeping

**[agent]**
Why: the deliverable is a green workspace, not a green package. `apps/test` runs the published
kit through the ADR-009 dual-context path, so a fix that works in-package can still fail there.
This step writes no product code — every prior step already fixed its defect at the source per
the Protocol inversion this spec's contract states ("fix the source, never the test"). This
step's only job is to prove that is true end to end and to leave `findings.md`,
`BUGS-REPORT.md`, and the coverage gate in a state that matches reality.

### Build order — two dual-context boundaries, not one

`packages/react` resolves `@vexcms/core` through `@vexcms/core`'s built `dist`, not its `src` —
the same `package.json#exports`-to-`dist` boundary ADR-009 documents for `apps/test`'s
consumption of `@vexcms/react`, one workspace layer up. Step 10's `defineCollection` change
(`CORE-LABEL-1`) is therefore invisible to `packages/react`'s own suite — specifically
`CreateDocumentModal.test.tsx`'s `it("opens a create form with a control per collection field")`,
which asserts `"Create Post"` — until `@vexcms/core` is rebuilt. This is empirically confirmed,
not theoretical: core's own suite goes green the moment `config.ts` changes (it imports its own
`src` directly), but the react-side assertion keeps reading as broken against stale core `dist`
until a rebuild, which looks exactly like Step 10 not having landed. Run verification in this
order, and never the react suite first:

1. `pnpm --filter @vexcms/core build` — before any `packages/react` test run, or `CORE-LABEL-1`
   reads as still-broken and an implementer chasing that false failure may "fix" the
   `CreateDocumentModal.test.tsx` assertion instead — the exact test-softening the anti-regression
   clause (below) prohibits, triggered by a stale build rather than a real defect.
2. `pnpm --filter @vexcms/react exec vitest run --coverage` + the coverage read.
3. `pnpm --filter @vexcms/react build` — before `apps/test`, for the ADR-009 dual-context reason
   below.
4. `apps/test`, then `apps/www`.

`pnpm build` at the workspace root walks this same dependency graph through turbo, so a single
root `pnpm build` before any test run satisfies both rebuild points at once — the per-package
ordering above only matters if the two builds are run piecemeal rather than through the root
script. Either way, do not run `packages/react`'s or `apps/test`'s suites against a `dist`
older than the source changes Steps 1–10 made.

- [ ] `packages/react` — 0 failing tests; coverage still at or above the 80% statements gate
      (was 90.71%; Step 4 deleting the dead pagination family drops it to ~90.42%, still well
      clear). Run `pnpm --filter @vexcms/react exec vitest run --coverage` **after** rebuilding
      `@vexcms/core` (build order above), and read
      `packages/react/coverage/coverage-summary.json#total.statements.pct` — do not eyeball the
      terminal table.
- [ ] `apps/test` — all 906 pass, including the 35 that were red. **Run
      `pnpm --filter @vexcms/react build` before `pnpm --filter test exec vitest run` —
      required, not optional.** `apps/test` imports `@vexcms/react` and `@vexcms/react/testing`
      through the package's published `exports` map, which resolves to `packages/react/dist/**`,
      not to `src/`. This is the same dual-context boundary ADR-009 documents: the package's own
      suite (`pnpm --filter @vexcms/react exec vitest run`) imports straight from `src/` and
      sees every fix immediately, but `apps/test`'s suite only sees what the last `tsup` build
      wrote to `dist/`. Every one of Steps 1–10 edits `src/**`; until `dist/` is rebuilt,
      `apps/test`'s 35 red tests keep failing against pre-fix compiled output even though the
      source is already correct — indistinguishable from a real regression unless you know to
      check the build timestamp first.
- [ ] `apps/www`, `@vexcms/core`, better-auth, file-storage-convex, cli, create-vexcms — no
      regressions from the measured 0/33, 0/936, 0/99 baseline. None of these packages appear in
      this spec's `touches` list, so the expectation is exact parity, not just "still green" —
      any new failure here is not a defect this spec's scope covers and is a hard stop. **One
      deliberate exception: `@vexcms/core`'s total test count itself moves.** Step 10 adds new
      derivation tests to `packages/core/src/collections/config.test.ts` (both paths: omitted
      `labels` across regular/irregular/uncountable slugs, and explicit `labels` passed through
      verbatim) — the count rises from 936 to somewhere around 946, and `pnpm --filter
      @vexcms/core test`'s own output is the source of truth for the exact number. Do not assert
      the old 936 figure, or any fixed new figure not read from that run — measure it. The
      frozen `Verify:` line below covers `apps/www` and `@vexcms/core` directly; better-auth,
      file-storage-convex, cli, and create-vexcms are not named in it (Step 11's `Verify:` is
      copied verbatim from `spec-tasks.md` and does not invoke them individually), so confirm
      them explicitly:
      `pnpm --filter @vexcms/better-auth --filter @vexcms/file-storage-convex --filter @vexcms/cli --filter create-vexcms test`
- [ ] `pnpm install --frozen-lockfile` — Step 10 adds `pluralize-esm: 9.0.5` to the
      `pnpm-workspace.yaml` catalog and to `packages/core/package.json#dependencies`. Per the
      commit checklist, any `package.json` dependency edit not followed by a real `pnpm install`
      leaves `pnpm-lock.yaml` stale; `.npmrc`'s `shamefully-hoist=true` hides that locally (the
      package still resolves from the hoisted root, so every other check above passes), and it
      only surfaces as `ERR_PNPM_OUTDATED_LOCKFILE` in CI/Vercel. Run `pnpm install` (not
      `--frozen-lockfile`, which would itself fail on a stale lockfile) once after Step 10 lands,
      then `pnpm install --frozen-lockfile` here to prove the committed lockfile is the one CI
      will see, and commit the resulting `pnpm-lock.yaml` diff.
- [ ] Regenerate the source spec's `findings.md` and confirm the `packages/react`-owned rows are
      gone:
      `node scripts/record-test-findings.mjs --spec 2026-09-08-react-coverage-expansion "packages/react/src/**/*.test.ts?(x)"`.
      **This alone does not empty the file — two things need separate handling, both explained
      below the anti-regression rule.**
- [ ] `.agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md` — mark every defect
      resolved, and add the two things it never captured: `MODAL-2`, and the `plural` half of
      `CORE-LABEL-1` (`"Postses"`/`"Categorieses"`/`"Medias"`)
- [ ] `pnpm lint` — 0 errors, including jsdoc on every export touched by Steps 1–10 (`Cell.tsx`
      exports, `useTableSelection`/`usePaginatedQuery`'s public return types, `defineCollection`)
- [ ] `harness struct && harness sync && harness doctor` — clean. `harness struct` catches
      Step 4's deletions (`usePagination.ts`, `DataTablePagination.tsx` and their `.test.tsx`
      pairs) leaving no orphaned directory-structure-map entries; `harness sync` re-derives that
      map; `harness doctor` is the aggregate health check the commit gate also runs.

### Anti-regression check on the `findings.md` regen

Per this spec's frozen contract and the source spec's Step 8 anti-regression clause: **a row
that disappears from `findings.md` without a matching diff in `packages/react/src/**` or
`packages/core/src/**` means an assertion was softened**, not fixed — reject the regen and go
find the test-only edit. There are exactly two authorised exceptions, both already named in the
contract:

1. **Step 4's deleted tests.** `usePagination.test.tsx` (`HOOK-1`, `HOOK-2` — 3 rows:
   `goToPage(n) navigates to a page beyond the last known page…`, `goToPage(n) navigates to the
   requested page`, `nextPage advances using the continueCursor…`) no longer exists once Step 4
   lands, so the regen command above — which can only re-run files that still exist — cannot
   clear its rows through the normal replace-by-filename mechanism (`recordFindings` in
   `scripts/record-test-findings.mjs` only replaces rows for files it actually just ran; a
   deleted file is silently absent from that set, not zeroed). **Delete those 3 rows from
   `findings.md` by hand** after the regen command runs. The justifying diff is the deletion of
   `usePagination.ts`/`usePagination.test.tsx` itself (`git diff --stat` showing the two files
   removed) — a deletion is a diff in `packages/react/src/**` in the sense the clause means,
   just not one `git diff -U0` renders as changed lines.
2. **Step 5's mechanism change.** `useTableSelection.test.tsx`'s two rows (`select-all then
   deselect-one produces an indeterminate exclusion, not a no-op` for `HOOK-5`, `toggleRow's
   onSelectionChange reports the post-change mode` for `HOOK-3`) are expected to flip green
   through the regen command itself, since the file still exists and gets re-run — no manual
   step needed here, but confirm via `git diff packages/react/src/hooks/useTableSelection.ts`
   that the exclusion-set rework landed; if the row disappeared with no diff in that file, the
   test's mechanism was edited instead of the source, which is the same softening the clause
   forbids.

**The regen command's target pattern doesn't reach every row in this file.** `findings.md`
also carries 21 rows attributed to `apps/test/src/vexcms/admin.test.ts` — written by the
coverage-expansion spec's own Step 7 (`node scripts/record-test-findings.mjs
apps/test/src/vexcms/admin.test.ts`, no `--spec`, so it targeted this same file via
`DEFAULT_FINDINGS_SPEC`). The `"packages/react/src/**/*.test.ts?(x)"` glob never matches that
path, so those rows are untouched by the command spec-tasks.md names. Clear them the same way
they were written, **after** the `apps/test` rebuild+run bullet above has already proven those
35 tests pass against fresh `dist`:

```
node scripts/record-test-findings.mjs --spec 2026-09-08-react-coverage-expansion apps/test/src/vexcms/admin.test.ts
```

Only once both commands have run, and the 3 `usePagination.test.tsx` rows are removed by hand,
does `findings.md` contain zero rows — the literal "every row is gone" bar this step's
acceptance criterion sets.

### Coverage: do not invent threshold numbers

`packages/react/vitest.config.ts`'s `coverage.thresholds` is currently `{ statements: 80,
branches: 80, functions: 89, lines: 91 }`, measured and pinned by the coverage-expansion spec's
own Step 8 at commit time (comment above the block: "measured 90.71 / 80.46 / 89.87 / 91.5").
`statements: 80` is the interview-decided fixed gate and never changes. The other three are
measured floors, and Steps 1–10 change both the numerator (new guard/link/truncation branches
in every `Cell.tsx`, the modal in-flight guard, the RBAC checks) and the denominator (Step 4
removes 124 statements, some fraction of branches/functions/lines, from `usePagination.ts` +
`DataTablePagination.tsx`) — the net effect on `branches`/`functions`/`lines` is not derivable
by inspection and MUST NOT be guessed (AP-012).

`vitest run --coverage` with `reportOnFailure: true` enforces these thresholds itself and exits
non-zero if any measured percentage falls below its pinned floor — that failure would surface
as part of this step's own `Verify:` line (the first clause). If it does:

```
pnpm --filter @vexcms/react exec vitest run --coverage
node -e "const s=require('./packages/react/coverage/coverage-summary.json');console.log(Math.floor(s.total.branches.pct),Math.floor(s.total.functions.pct),Math.floor(s.total.lines.pct))"
```

Take the floor of each printed number (never round up, matching the coverage-expansion spec's
own convention) and replace `branches`/`functions`/`lines` in the block below with the newly
measured floors — `statements: 80` stays untouched. If the measured numbers are still at or
above the current floors, **do not touch this file at all**; a threshold that reads lower than
reality is not itself a defect and there is nothing to "improve" here.

#### packages/react/vitest.config.ts

Existing file — conditional edit, only if the measurement above shows a regression below the
current pinned floor. Anchored on the `thresholds` object (currently lines 70–75):

**1 — only if `branches`/`functions`/`lines` measure below their current pinned value.**
Replace the three non-`statements` numbers with the freshly measured floors from the `node -e`
command above (placeholders shown; paste the real measured values, never these):

```ts
      thresholds: {
        statements: 80,
        branches: /* Math.floor(total.branches.pct) from the command above */,
        functions: /* Math.floor(total.functions.pct) */,
        lines: /* Math.floor(total.lines.pct) */,
      },
```

Also update the comment above the block (currently "measured 90.71 / 80.46 / 89.87 / 91.5 at
the commit that added this gate") to cite the new measurement and this spec's slug, so a future
reader knows which commit last re-measured it.

#### .agent/docs/specs/2026-09-08-react-coverage-expansion/BUGS-REPORT.md

Existing file — three anchored insertions. No existing prose is deleted or reworded; every
defect's original root-cause/evidence/direction write-up stays as the historical record of what
was found, and resolution status is layered on top rather than overwriting it.

**1 — resolution ledger, inserted immediately before the `### Failure baseline` heading** (i.e.
right after the closing `>` line of the opening blockquote). One table marks all 17 defects
resolved in a single place rather than 16 scattered per-section edits, which is easier to keep
correct than a status line duplicated into every entry:

````markdown
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
| `MEDIA-1` | Step 9 | `MediaUploadDropzone` reads `accept` from the target media collection's config; `maxFiles: 1` added beside `multiple: false` |
| `MEDIA-2` | Step 9 | `FilePreview`'s `mediaDoc.alt ?? mediaDoc.filename` changed to `mediaDoc.alt || mediaDoc.filename` — `alt` is a required `string`, so `??` never fired |
| `CORE-LABEL-1` | Step 10 | `defineCollection` now singularizes before title-casing for `labels.singular`, and derives `labels.plural` as the title-cased slug itself with no `plural()` call — see the addition to this ID's own entry below for the `plural` half this report missed |
````

**2 — new `MODAL-2` entry, inserted immediately after `MODAL-1`'s closing "Direction" paragraph**
(the one ending "…rather than relying solely on the mutation's `isPending`.") and before the
`---` separator that opens the `### P1 — Correctness` section. This report never filed `MODAL-2`
at all — the fix spec's interview correction #1 (`spec-tasks.md`) is the only prior record of
it:

````markdown
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
````

**3 — `plural` addition to the existing `CORE-LABEL-1` entry, inserted immediately after its
closing "Direction" paragraph** (the one ending "…treat this as a `@vexcms/core` change with a
`packages/react` blast radius.") and before the `#### HOOK-3` heading. The original entry only
documents the `singular` half; this appends the `plural` half without touching the existing
text:

````markdown
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
added it (raising the suite to ~946 tests; measure the exact count, don't assert it).

**Resolved by Step 10** of `2026-09-08-react-bug-fixes`: `plural` is now derived as the
title-cased slug itself, with no call to `plural()` — slugs are plural by convention, so
title-casing alone is the correct `plural` label. `plural()` in `utils.ts` is untouched.
Also note: `packages/react` resolves `@vexcms/core` through its built `dist`, so this fix is
invisible to `packages/react`'s own suite (`CreateDocumentModal.test.tsx`'s `"Create Post"`
assertion) until `@vexcms/core` is rebuilt — see this step's Build order note.
````

Verify: pnpm --filter @vexcms/react exec vitest run --coverage 2>&1 | grep -E "^(Statements|Tests)" && pnpm --filter test exec vitest run --coverage.enabled=false && pnpm --filter www exec vitest run --coverage.enabled=false && pnpm --filter @vexcms/core test && pnpm typecheck && pnpm build && pnpm lint && harness doctor
