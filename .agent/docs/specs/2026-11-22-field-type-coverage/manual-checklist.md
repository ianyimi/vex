# Field-type coverage — manual checklist

Run this on `apps/test` (:3020) after `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/react build && pnpm --filter @vexcms/next build`. Restart `vex dev` and `next dev`, because a running `vex dev` keeps the old `@vexcms/core` in memory. The dogfood collection is **Storage Shapes** (`/admin/collections/storage_shapes`, file `apps/test/src/vexcms/collections/storageShapes.ts`, drafts on). For data checks, run `npx convex data storage_shapes` from `apps/test`.

The agent's browser pass already covered the rows marked ✅. Re-check them anyway. Rows marked ☐ were not verified by the agent.

## Storage Shapes fields

| Field            | Config                                                         | Stored as                                                                                           | TS type                      |
| ---------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| `name`           | `text({ required: true })`                                     | `v.string()`                                                                                        | `string`                     |
| `nullableNote`   | `text({ nullable: true })`                                     | `v.optional(v.nullable(v.string()))`                                                                | `string \| null`             |
| `nullableCount`  | `number({ nullable: true })`                                   | `v.optional(v.nullable(v.number()))`                                                                | `number \| null`             |
| `nullableStatus` | `select({ nullable: true, hasMany: false })`                   | `v.optional(v.nullable(v.array(v.union(…))))`                                                       | `…Option[] \| null`          |
| `nullableMeta`   | `group({ nullable: true })`                                    | `v.optional(v.nullable(v.object({ note })))`                                                        | `{ note?: string } \| null`  |
| `viewCount`      | `number({ schema: { validator: "int64" }, min: BigInt(0) })`   | `v.optional(v.int64())`                                                                             | `bigint`                     |
| `literalStatus`  | `select({ schema: { validator: "literal" } })`                 | `v.optional(v.union(v.literal("active"), v.literal("inactive")))`                                   | `…Option`                    |
| `stringStatus`   | `select({ schema: { validator: "string" } })`                  | `v.optional(v.string())`                                                                            | `string`                     |
| `ownerId`        | `relationship({ schema: { validator: "id" } })` → user         | `v.optional(v.id("user"))`                                                                          | `Id<"user">`                 |
| `ownerRef`       | `relationship({ schema: { validator: "string" } })` → user     | `v.optional(v.string())`                                                                            | `string`                     |
| `cover`          | `upload({ schema: { validator: "id" } })` → images             | `v.optional(v.id("images"))`                                                                        | `Id<"images">`               |
| `payload`        | `bytes()`                                                      | `v.optional(v.bytes())`                                                                             | `ArrayBuffer`                |
| `scores`         | `keyValue({ value: number() })`                                | `v.optional(v.record(v.string(), v.number()))`                                                      | `Record<string, number>`     |
| `userScores`     | `keyValue({ keys: { collection: user }, value: number() })`    | `v.optional(v.record(v.id("user"), v.number()))`                                                    | `Record<Id<"user">, number>` |
| `channel`        | `variant({ discriminator: "kind", variants: { email, sms } })` | `v.optional(v.union(v.object({ kind: "email", address }), v.object({ kind: "sms", phoneNumber })))` | object union                 |
| `amount`         | `variant({ variants: { fixed: text(), metered: number() } })`  | `v.optional(v.union(v.string(), v.number()))`                                                       | `string \| number`           |

## New behavior

| #   | Check                                                                                                                                                                                            | Agent                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 1   | `pnpm --filter test vex:generate`: `storage_shapes` in `convex/vex.schema.ts` and `StorageShapesDocument` in `src/vex.types.ts` match the table above                                            | ✅                             |
| 2   | Quick-create with only a name: Save Draft and Publish both succeed (`channel`/`amount` start on "Select a type")                                                                                 | ✅                             |
| 3   | Fill every field, publish, reload: every value comes back the same, and `convex data` matches                                                                                                    | ✅                             |
| 4   | Nullable scalars: clear `nullableNote`/`nullableCount`/`nullableStatus`, save. Stored as `null`, inputs empty after reload, no literal "null" text in the number input                           | ✅                             |
| 5   | Nullable group: the Null toggle on `nullableMeta` hides the group and saves `null`; toggling it off gives back an editable, empty group                                                          | ✅                             |
| 6   | int64 input: `9007199254740993` round-trips with exact digits; `1.5` and `abc` show "Must be a whole number." and aren't saved                                                                   | ✅                             |
| 7   | int64 list: the cell shows exact digits; the filter `viewCount ≥ 9007199254740992` shows only the big doc, also after a hard reload of the filtered URL (SSR)                                    | ✅                             |
| 8   | int64 sort: click the View Count column header, both directions                                                                                                                                  | ✅                             |
| 9   | select scalar: `literalStatus`/`stringStatus` store one string; the list filter `eq` on each matches                                                                                             | ✅ store / ✅ filter           |
| 10  | Scalar refs: set `ownerId` then `ownerRef` (and the reverse); both persist. The cell shows the user's title; peek populates the user                                                             | ✅ persist / ✅ cell + peek    |
| 11  | Single upload `cover`: choose, remove, save; the thumbnail shows in the list cell                                                                                                                | ✅                             |
| 12  | Clearing: clear `payload`, `ownerId` and `cover`, then save. The keys are **gone** from the row (not stale, not `null`)                                                                          | ✅ payload + ownerId / ☐ cover |
| 13  | Bytes File tab: upload a small file; the size shows and download returns identical bytes. Over 512 KiB is rejected with a size message                                                           | ✅                             |
| 14  | Bytes Hex tab: edit a byte, save, reopen and the hex matches; invalid hex shows an error and doesn't change the value                                                                            | ✅                             |
| 15  | keyValue: add/rename/remove rows on `scores`; a duplicate key shows "Duplicate key"; `userScores` keys use the user picker; the cell shows "N entries"; no stray top-level keys in `convex data` | ✅                             |
| 16  | Variant discriminated: email ↔ sms, save each; the stored object has `kind` + only that variant's fields; "None" removes `channel`                                                               | ✅                             |
| 17  | Variant primitive: fixed (string) ↔ metered (number), save each; after reload the picker matches the stored type                                                                                 | ✅                             |
| 18  | Peek JSON tab + copy value on `viewCount` and `payload`: no errors; copy gives exact digits                                                                                                      | ✅ (payload copy ☐)            |
| 19  | Duplicate a full document: bigint, bytes, records and variants are all identical                                                                                                                 | ✅                             |
| 20  | Drafts: publish v1, save a draft with changes, restore v1 from History, publish: values (incl. bigint/bytes/records/variant) come back                                                           | ✅                             |
| 21  | Draft clear: clear `payload` in a draft, publish; the published row has no `payload`                                                                                                             | ✅ (integration test) / ☐ UI   |
| 22  | Better Auth: the session/account list `userId` cell shows the user title; the edit view shows a read-only relationship                                                                           | ✅                             |
| 23  | Console: no `Do not know how to serialize a BigInt` and no page errors anywhere above                                                                                                            | ✅                             |

## Regression checks on existing behavior

These areas changed under the hood. Check them on the existing collections (`fields`, `posts`, `pages`, media):

| #   | Check                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | `fields` collection: two relationship fields in one doc. Pick both quickly after a fresh load; neither resets the other. The picker now opens from local state: a `?relationship=<field>` link still opens it on first load, but browser back/forward no longer reopens or closes it (intended change) |
| R2  | Upload fields on `pages`/`posts`: open the media picker, select, remove, save; the edit-media dialog still opens                                                                                                                                                                                       |
| R3  | Default (no `schema`) select/relationship/upload with `hasMany: false` still store an **array** (`convex data`)                                                                                                                                                                                        |
| R4  | Blocks copy/paste between documents still works. A block copied **before** this change won't paste (the clipboard format is now Convex JSON)                                                                                                                                                           |
| R5  | `posts` autosave + publish still work, and clearing an optional text field still saves `""`                                                                                                                                                                                                            |
| R6  | List view filters on number/date/select/relationship fields and saved views: apply, save view, reload. The URL state is unchanged                                                                                                                                                                      |
| R7  | Group/array/blocks list cells and the peek JSON tab render as before                                                                                                                                                                                                                                   |
| R8  | Live preview on `pages`/`posts` still updates while typing                                                                                                                                                                                                                                             |
| R9  | A number field with the project-wide mask (`apps/test` `inputMasks.number`): type digits and watch the console for `querySelector('42')`. The agent saw it once and couldn't reproduce it; the masked-input code is unchanged from before this work                                                    |
| R10 | Own server code: `update({ data: { someOptionalField: null } })` now **removes** an optional non-nullable field, stores `null` on a nullable one, and still fails on a required one                                                                                                                    |

## Re-check after the 2026-11-23 fixes

| # | Check |
| --- | --- |
| F1 | Bytes File tab: an empty field shows the upload-style dropzone; with a file, the dropzone is replaced by an upload-style row (icon, name, size, Download, Clear) plus a Replace button that opens the picker and swaps the bytes |
| F2 | Bytes Hex tab: a large file stays inside a ~288px scrolling textarea and typing stays responsive. The value commits 250 ms after typing stops or on blur; invalid hex shows an error and leaves the saved value unchanged |
| F3 | Publish state: publish → the button switches to Unpublish; clear a nullable field and publish → still clean; hard reload with no edits → Unpublish shown, Save Draft/Cancel disabled |
| F4 | Version history: keep the dialog open and publish (here or in a second tab); the green row follows the new version |
| F5 | A brand-new, never-published draft: Publish stays disabled until you edit something |
| F6 | Cancel after an edit restores the published values and the buttons go back to the disabled/Unpublish state |
| F7 | Topbar at narrow widths: every section stays on one line with ellipses, there's no horizontal scrollbar, and below 768px Sign out shows only its icon |
| F8 | keyValue rows: the Key/User label and the value label line up on every row; only the first row shows the visible label |
| F9 | Null toggle: on groups/arrays/blocks it sits at the right end of the field's own header row, not above the first child |

## Re-check after the second round of fixes

| # | Check |
| --- | --- |
| G1 | `scores`, `userScores`, `channel` and `amount` render as collapsible accordions like `nullableMeta`; the header shows the label, entry count or selected option, and the Null toggle when nullable |
| G2 | A new `scores` row and the `metered` member start with an empty number input; focusing a masked number that holds `0` selects it so typing replaces it |
| G3 | `amount` = metered: clearing the input keeps metered selected; saving shows the required error |
| G4 | Edit a published doc and Save Draft → Publish enabled; view the published version in History → Publish disabled; back to the draft → enabled; a new never-published draft with no edits → disabled |
| G5 | Duplicate opens the create dialog with the title `X (2)` and a note that other fields are copied; Create lands on the new doc with all fields; duplicating `X (2)` gives `X (3)` |
| G6 | The peek JSON tab isn't dimmed |
| G7 | Scroll down an edit view, hard reload: the position comes back (per document, for this browser session) |
| G8 | Below 1024px, Sign out and the user block show icons only; the top bar stays on one line |

## Re-check after the third round of fixes

| # | Check |
| --- | --- |
| H1 | `amount` = metered, clear the input, Publish: "This field is required." appears **once**, under the metered input |
| H2 | `viewCount`: typing `1.5` still shows "Must be a whole number."; `9007199254740993` saves exactly |
| H3 | Hard-load a `storage_shapes` doc with saved `scores`/`userScores` rows: no hydration warning in the browser console or the `next dev` terminal |
| H4 | New doc: `nullableCount` shows the empty mask `___-___-____` (no `0`), including after you click away; `viewCount` is empty. Leave both empty and save: they're stored empty, never the mask text |
| H5 | A number field with an explicit `defaultValue` (e.g. in `fields`) still prefills it |
| H6 | Relationship and upload pickers open at full height with skeleton rows/tiles while loading; searching (incl. few/no results) never changes the dialog height |
| H7 | The upload picker for `images` (no searchFields) shows no search box and no errors; a picker for a collection with searchFields shows one |
| H8 | Below 1024px, the icon-only Sign out is the same size as the view-site button |
| H9 | Scroll an edit view down and reload: it paints at the saved position with no jump (collection and global edit views) |
| H10 | `nullableMeta`: type a note, check Null → the section collapses and can't be expanded; uncheck → it re-opens with your typed note. Same for keyValue/variant (collapse) and array/blocks/checkbox/richtext (restore). A field loaded as null unchecks to its stored value from the viewed version, else empty |

## Re-check after the polish fixes

| # | Check |
| --- | --- |
| P1 | Publish a doc with `scores`, `channel` and `viewCount`, save a draft changing all three, then view the published version in History: the keyValue rows, the variant and the int64 input show the published values; switching back shows the draft values; Cancel after an edit restores them |
| P2 | Clear `literalStatus` and save: the key is absent in the data, no save error |
| P3 | Reload a scrolled edit view (collection and global): it paints at the saved position and the console has no hydration errors; signing out clears the saved positions |
| P4 | Bytes: type hex, then immediately drop a file: the file wins. Empty the hex textarea and tab away: the value clears |
| P5 | The variant picker shows "None" after choosing None; only one label carries the field's label id |
| P6 | int64: typing a lone `-` shows no error until a digit follows |
| P7 | keyValue's remove button is announced with the row's key |
| P8 | Relationship picker with more than one page: "Load more" stays inside the fixed results area |
| P9 | Duplicate where create fails on a field the dialog didn't show: the dialog reopens with every field and the error on that field |
| P10 | int64: type `12a` (error shows), then view another version in History: the error clears with the new value |
| P11 | keyValue: every row shows `Key *` (or `User *`) above its key input, aligned with `Score *`. Add a row, leave its key empty and save: "This field is required." appears once, under that key, and the save is blocked; typing a key clears it |
