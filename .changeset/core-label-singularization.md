---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/next": minor
---

Field-schema and admin-UI hardening, an exported React test kit, and two breaking default-behavior corrections.

**Breaking — `defineCollection`'s derived labels.** `labels.singular` now singularizes the
`slug` before title-casing it, and `labels.plural` is the title-cased slug itself rather than
that value run through `plural()` a second time. Every consumer that omits `labels` gets
different default admin text: for slug `"posts"`, `singular` was `"Posts"` and is now `"Post"`
(the "Create Posts" button becomes "Create Post"), and `plural` was `"Postses"` and is now
`"Posts"`. The same double-pluralization hit every irregular-suffix slug — `categories` was
`"Categorieses"`, `boxes` was `"Boxeses"`, `media` was `"Medias"`. To pin the old output, set
`labels` explicitly:

```ts
defineCollection({
  slug: "posts",
  labels: { singular: "Posts", plural: "Postses" },
  fields: {
    /* ... */
  },
});
```

`plural()` in `utils.ts` is unchanged and remains public API — it was always correct; the bug
was the call site handing it an already-plural slug.

**Breaking — dead pagination exports removed from `@vexcms/react`.** `usePagination`,
`UsePaginationProps`, `UsePaginationReturn`, `DataTablePagination` and
`DataTablePaginationProps` are gone. They had zero consumers: both list views paginate with
`usePaginatedQuery` + `onLoadMore`, and no view ever rendered page-number pagination. Use
`usePaginatedQuery` for cursor pagination.

**Required-field validation now composes instead of overwriting.** Every
`packages/core/src/fields/*/inputSchema.ts` layers `min`/`max` onto the required branch rather
than reassigning over it, so a required field with `min`/`max` configured keeps every check
instead of silently losing its "required" message — across `text`, `number`, `checkbox`,
`select`, `date`, `array`, `blocks`, `relationship`, `upload`, `url`, `group` and `color`.
`url` checks emptiness before URL format, so an empty required field reports "This field is
required." instead of "Invalid URL". `date`'s schema and UI both honor `min`/`max`.

**Field-input accessibility.** `date`, `select`, `checkbox`, `upload` and `relationship`
triggers carry a real `id`/`aria-labelledby`. `array`, `group` and `blocks` — which have no
single control a `<label for>` can point at — use `role="group"` with `aria-labelledby` on a
label span instead of a dangling label, keeping `FormLabel`'s visual output.

**List-view cells.** Every cell type now renders an em-dash placeholder for a `null`/
`undefined` value instead of crashing (`text` and `array` threw a `TypeError` on `.length`,
taking down the whole table render) or rendering empty markup. A `date` cell set to epoch `0`
renders 1970-01-01 rather than treating a real timestamp as an absent value. All 12 types honor
`isTitleField` by wrapping their content in an edit link, so a `date` or `select` title column
is finally clickable; `relationship` and `upload` wrap every return path, loading states
included. Long values truncate at 77 characters with the full value on `title` — `relationship`,
`select`, `array`, `blocks`, `upload` and `group` previously left user-controlled text
unreachable by tooltip. `array`'s `title` now carries its items instead of static field-config
text, and `group` renders a serialized key preview instead of a fixed `{ N keys }` summary.

**Selection and pagination hooks.** `useTableSelection`'s `"all"` mode treats `selectedIds` as
an exclusion set, so "select all, then untick one" genuinely deselects that row in both
`isRowSelected` and `getSelectionCount` instead of silently reporting it as selected — which
would have deleted an excluded row once bulk-delete is restored. `toggleRow`'s
`onSelectionChange` reports the post-change `mode` rather than a stale closure value.
`usePaginatedQuery.loadMore()` reveals one page per call instead of fetching page N and only
exposing it on the following call, and `isDone` is derived from the query's own
`isLoading`/`isError` so a pending first page or a rejected query is no longer indistinguishable
from a complete empty collection.

**Modals.** `Modal` (`BaseModal`) gains a `dismissible` prop that cancels Base UI's own close
handling, so Escape, backdrop clicks and every `DialogClose` are gated centrally rather than
per trigger. `CreateDocumentModal` uses it plus a synchronous in-flight guard set before
TanStack Form's async validation: a rapid double-click now creates one document instead of two,
and pressing Escape mid-submit no longer closes the dialog while the write still lands.

**Views and media.** `MediaCollectionEditView`'s Save/Cancel read `disabled={!canEdit ||
isDefaultValue}`, matching `CollectionEditView`. `MediaCollectionListView` resolves a
create-action permission and wires it to the Upload button, matching `CollectionListView`'s
"+ New". `MediaUploadDropzone` filters dropped files against a safe-media MIME allowlist —
previously it accepted any type, including executables — and keeps the first file of a
multi-file drop instead of rejecting the whole batch. `FilePreview` falls back to the filename
when `alt` is empty; the previous `??` never fired, because `alt` is a required `string` that
is `""` when unset, so every image without alt text rendered `alt=""`.

**Robustness fixes surfaced while hardening the suite.** `ThemeProvider` reads and writes
`localStorage` through guarded helpers: the unguarded access threw and unmounted the whole admin
shell wherever Web Storage is unavailable — Safari private mode, "block all cookies", or a
server/worker context. `upload`'s cell calls `useQuery` unconditionally with the `skip` sentinel
instead of after an early return, and `MediaUploadForm` owns its accordion state in a real
component instead of inside a render prop; both previously violated the Rules of Hooks and made
React abandon concurrent rendering. `FormArray` and `FormBlocks` pass `isDragDisabled` when
read-only, so a read-only list no longer registers drag handles it does not render.

**New: an exported test kit.** `@vexcms/react/testing` (re-exported wholesale as the new
`@vexcms/next/testing` subpath) ships `runVexReactSuite` — one call that runs the whole admin
contract against a consumer's own build — plus the factories behind it:
`runFieldInputContractSuite`, `runFieldCellContractSuite`, `runColumnDefSuite`,
`runNestedFieldContainerSuite`, `runShellSuite`, `runViewSuite`, `runDataTableSuite`,
`runModalSuite`, `runMediaSuite`, `runHooksSuite`, `runRbacStateSuite`, the `fieldFixtures`
registry, `expectNoA11yViolations`, `renderWithVexProviders` and `installDomPolyfills`. A
`sections` option selects categories (`fields`, `cells`, `columnDefs`, `views`, `shell`,
`dataTable`, `modals`, `hooks`, `media`), `custom` drives project-authored field fixtures
through the same contract, and `access` threads a real `VexAccessConfig` so RBAC-gated paths
render under the consumer's own matrix.
