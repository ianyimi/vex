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
| `/admin` error boundary | `apps/www/src/app/(vexcms)/admin/error.tsx` | client error boundary, "Demo unavailable" + `/tour` + retry links | yes (LI-10) | `2026-11-06-launch-infrastructure` step 10 | no |
| `/tour` | `apps/www/src/app/tour/page.tsx` | `force-static`, 4 fixed-size `next/image` screenshots | yes (LI-10) | `2026-11-06-launch-infrastructure` step 10 | no |
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
