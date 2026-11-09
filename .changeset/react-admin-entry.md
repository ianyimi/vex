---
"@vexcms/react": patch
"@vexcms/next": patch
---

Bumped `patch` despite being breaking: the `alpha` pre-release track keeps every package on
the `0.1.0` base so `changeset pre exit` lands on `0.1.0`. The breaking surface is itemized
below and in the commit's `BREAKING CHANGE:` footer.

Split `@vexcms/react`'s public surface in two: the root (`.`) holds everything a page touches, `@vexcms/react/admin` holds the framework adapter, field `Admin`/`Cell` components, slots, the document-edit runtime, admin layout/views, collection/media/global views, the list-view context, the live-preview panel, the modal surface, `useVexForm`, and the `data-table`/`dnd`/`sidebar`/`resizable` UI primitives. A server component importing the root no longer pulls any of that into the client graph. `useAppForm`/`AppForm` are removed from the root entirely — the app form's surface was always `@vexcms/react/form`, and the root must not reach `dnd` through `ArrayField`/`BlocksField`'s drag handles.

**BREAKING CHANGE.** Update every import of a moved name from `@vexcms/react` to `@vexcms/react/admin`:

| Old import (`@vexcms/react`) | New import |
| --- | --- |
| `reactAdapter` | `@vexcms/react/admin` |
| `*FieldAdmin`, `*FieldCell` (all field types) | `@vexcms/react/admin` |
| `SlotOutlet`, `SlotOverrideOutlet`, `type SlotOverrideProps` | `@vexcms/react/admin` |
| `useVexForm` | `@vexcms/react/admin` |
| `VexDocumentProvider`, `useVexDocument`, `type VexDocumentState` | `@vexcms/react/admin` |
| `SLOT_IDS`, `BUILTIN_CONTRIBUTION_IDS` | `@vexcms/react/admin` |
| `DocumentEditSlotOutlet`, `DocumentEditRuntimeProvider`, `useDocumentEditRuntime`, `documentEditBuiltinContributions`, `useEditActionsMenuDialog`, `EditActionsMenuItem` (+ their types) | `@vexcms/react/admin` |
| `type EditSlotProps`, `type EditSlotConfigInput`, `type ComponentContributionInput`, `type ComponentOverrideInput`, `type SlotId`, `type SlotAccessContext`, `type SlotAccessPredicate` | `@vexcms/react/admin` |
| `AdminLayout`, `AdminNotFound`, `AppSidebar`, `AdminTopNav`, `DashboardView`, `CollectionsIndexView`, `AdminCardSection`, `AdminIndexEmptyState` (+ their types) | `@vexcms/react/admin` |
| `CollectionListView`, `CollectionEditView`, `MediaCollectionListView`, `MediaCollectionEditView`, `GlobalEditView`, `GlobalsListView` | `@vexcms/react/admin` |
| `useListViewContext`, `ListViewContextProvider`, `type ListViewContextState` | `@vexcms/react/admin` |
| `ModalSurfaceProvider`, `useModalSurface` | `@vexcms/react/admin` |
| `LivePreviewPanel`, `resolveLivePreviewUrl`, `type LivePreviewFrameGeometry`, `useLivePreviewPanelMinSize`, `useLivePreviewPanelState` | `@vexcms/react/admin` |
| `DataTable*` (all of `ui/data-table`), `Sidebar*`, `Resizable*`, dnd exports (`DndProvider`, `Droppable`, `Draggable`, `DragHandle`, `useAccordionDndState`) | `@vexcms/react/admin` |
| `useAppForm`, `AppForm` | `@vexcms/react/form` |

`ReactHKT` and `ReactAdapter` stay importable as types from both the root and `/admin` — they cost nothing and `RelationshipFieldInput`/`CollectionConfigInput`/etc. at the root reference `ReactHKT`.

`@vexcms/react/admin` also exports two components the docs already described but no entry exposed. `VersionHistoryDropdown` (with `VersionHistoryPanelProps` and `VersionHistoryTarget`) renders a document's version list in a custom edit view, and `AdminFieldBinding` binds a custom field component inside a framework adapter.

`@vexcms/next`'s `NextAdminLayoutClient` and `NextAdminPage` now import the ten moved view/layout components from `@vexcms/react/admin`; its own public API is unchanged.
