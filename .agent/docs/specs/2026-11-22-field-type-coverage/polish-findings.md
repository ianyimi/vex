# Polish findings (developer: fix ALL)

Reviewer evidence is summarized per row (file:line). Re-read the code before fixing; line numbers may have drifted.

| ID | Sev | Item |
|---|---|---|
| B1 | BLOCK | `forms/KeyValueField.tsx:82` `useKeyValueRows` seeds rows once. A version switch, post-save reset, live merge or null restore leaves stale rows, and the next edit commits them back. Re-seed on external value change (the `lastValueRef` pattern from `BytesControl`), reconciling rowIds by key |
| B2 | BLOCK | `fields/variant/Field.tsx:90` `selectedKey` is never re-derived when the value changes externally. Re-derive on external non-undefined changes, keeping a cleared-but-selected member |
| B3 | BLOCK | `forms/NumberField.tsx:67` `BigintNumberControl` is uncontrolled and shows stale text after reset/merge/restore. Also `getFieldsDefaultValues`' `Boolean(stored)` check loads a stored `BigInt(0)` as undefined. Make the control synced, and fix the falsy check |
| B4 | BLOCK | `forms/SelectField.tsx:70` clearing a scalar select commits `""`, which Convex's literal union rejects (`"string"` stores `""`). Commit `undefined`. Also core: optional scalar select input schema accepts `""` (`select/inputSchema.ts:56`); map `""` → undefined (transform or prepareEdit) so server callers are safe too |
| B5 | BLOCK | `core/src/db/populate.ts:210-233` an unresolvable scalar reference (non-id string, no config) is cast to an Id and sent to `db.get`, which throws on the real backend. Skip it and leave the string |
| B6 | BLOCK | `core/src/types/generateVexTypes.ts:72` `hasRichTextField` checks only the first primitive variant member, and an empty variants record crashes. Use `.some` over `Object.values` |
| B7 | BLOCK | `core/src/fields/childInterfaceType.ts:26-31` select branches omit `nullableSuffix` |
| B8 | BLOCK | Scroll-restore `<script>` rendered server-only deep in the tree causes a hydration failure and a full client re-render (`CollectionEditView.tsx:715-749`, `GlobalEditView.tsx:635-672`) |
| W1 | WARN | `core/src/db/depth.ts:175` primitive-variant depth entry is never consumed. Return the populatable member's own entry, or undefined + doc |
| W2 | WARN | keyValue populate: runtime populates records via depth, but `PopulateMapEntry` has no record kind. Add a `{ kind: "record"; value }` entry + PopulateOption/ApplyEntryPopulate cases so types match runtime |
| W3 | WARN | `select({ schema: { validator: "literal" } })` with no options emits `v.union()`. Throw `VexConfigError` |
| W4 | WARN | `core/src/versions/assertNoDraftRelationships.ts:67` string-stored id goes to `db.get` without `normalizeId`. Normalize, skip unresolvable |
| W5 | WARN | `forms/VariantField.tsx:127` duplicate `${name}-label` id in primitive mode. Suffix the accordion label id |
| W6 | WARN | `forms/BytesField.tsx:278` `file.arrayBuffer()` has no catch. Surface via `setFileError` |
| W7 | WARN | `forms/BytesField.tsx:400` filled-state input with the field id is `display:none`. Make it sr-only/opacity-0 or move the id to Replace |
| W8 | WARN | `forms/BytesField.tsx:412,433` hex/file errors have no id, aren't in `aria-describedby`, and have no reserved height |
| W9 | WARN | `forms/BytesField.tsx:335` a pending hex debounce overwrites a dropped file. Cancel it in handleFile/handleClear |
| W10 | WARN | `next/src/NextAdminPage.tsx` + `rscBigIntSafe.ts`: Next 16.4.5's Flight serializes bigint natively (`$n`). DEVELOPER: if Next serializes bigint, drop the custom encode/decode and the await gate, and correct the docs |
| W11 | WARN | `CollectionDuplicateMenuItem.tsx:46` hook dereferences the collection before the guard. Let the hook accept undefined |
| W12 | WARN | `apps/docs/.../fields/variant.mdx` TypeScript output shows required members as optional (`address?`). Drop the `?` |
| S1 | SUGG | Bytes Hex: clearing the textarea never commits, but the size line shows the old payload. Commit undefined on explicit empty + blur |
| S2 | SUGG | int64 input: allow an interim leading `-` without an error |
| S3 | SUGG | Variant picker shows "Select a type" after None. Show "None" |
| S4 | SUGG | keyValue remove button name: include the row key |
| S5 | SUGG | Relationship picker "Load more" sits outside the fixed area. Reserve its height inside |
| S6 | SUGG | Clear `vex-admin:edit-scroll:*` sessionStorage on sign-out |
| S7 | SUGG | `classifyVariantValueKind` stale docstring; variant superRefine unknown discriminator → addIssue; `nextDuplicateTitle` use BigInt; populateVariantContainer skip clone when no entry |
| S8 | SUGG | Rename VersionPublishAction `neverSaved` → clearer (publishedRowAbsent); mediaSuite `access` tri-state → explicit sentinel; Duplicate: on a field error for an unrendered key, reopen the dialog with `fieldsMode: "all"`; usePreservedScrollTop ResizeObserver instead of the timer ladder |
