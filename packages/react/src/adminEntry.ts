/**
 * `@vexcms/react/admin` — the admin panel's internals.
 *
 * Everything reachable from here is heavy: the framework adapter, the field
 * registry, every collection/global/media view, and the data-table and
 * drag-and-drop primitives they render through. None of it belongs on a
 * public page, so it lives behind its own entry instead of the root.
 *
 * @module
 */

// Framework adapter
export { reactAdapter } from "./adapter";
export type { ReactHKT, ReactAdapter } from "./adapter";

// Field components
export { TextFieldAdmin, TextFieldCell, EmailFieldAdmin, EmailFieldCell, TextareaFieldAdmin, TextareaFieldCell } from "./fields";
export { JsonFieldAdmin, JsonFieldCell, UrlFieldAdmin, UrlFieldCell, NumberFieldAdmin, NumberFieldCell, CheckboxFieldAdmin, CheckboxFieldCell, SelectFieldAdmin, SelectFieldCell, DateFieldAdmin, DateFieldCell, ColorFieldAdmin, ColorFieldCell, ArrayFieldAdmin, ArrayFieldCell, BlocksFieldAdmin, BlocksFieldCell, GroupFieldAdmin, GroupFieldCell, RelationshipFieldAdmin, RelationshipFieldCell, UploadFieldAdmin, UploadFieldCell, RichTextFieldAdmin, RichTextFieldCell } from "./fields";
export { AdminFieldBinding } from "./fields/AdminFieldBinding";

// Admin extension points (slots)
export { SlotOutlet, SlotOverrideOutlet } from "./slots";
export type { SlotOverrideProps } from "./slots";
export { useVexForm } from "./forms";
export { VexDocumentProvider, useVexDocument } from "./documents";
export type { VexDocumentState } from "./documents";
export { SLOT_IDS, BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
export {
  DocumentEditSlotOutlet,
  DocumentEditRuntimeProvider,
  useDocumentEditRuntime,
  documentEditBuiltinContributions,
  useEditActionsMenuDialog,
  EditActionsMenuItem,
} from "./documents";
export type { DocumentEditRuntimeState, EditActionsMenuDialogState, EditActionsMenuItemProps } from "./documents";
export type { EditSlotProps, EditSlotConfigInput } from "@vexcms/core";
export { VersionHistoryDropdown } from "./versions";
export type { VersionHistoryPanelProps, VersionHistoryTarget } from "./versions";
export type {
  ComponentContributionInput,
  ComponentOverrideInput,
  SlotId,
  SlotAccessContext,
  SlotAccessPredicate,
} from "@vexcms/core";

// Admin layout and top-level views
export {
  AdminLayout,
  AdminNotFound,
  AppSidebar,
  AdminTopNav,
  DashboardView,
  CollectionsIndexView,
  AdminCardSection,
  AdminIndexEmptyState,
} from "./admin";
export type {
  AdminUser,
  AdminLayoutProps,
  AdminNotFoundVariant,
  AdminNotFoundProps,
  AppSidebarProps,
  AdminCardSectionProps,
  AdminIndexEmptyStateProps,
} from "./admin";

// Collection / media / global views
export { CollectionListView, CollectionEditView } from "./collections";
export { MediaCollectionListView, MediaCollectionEditView } from "./media";
export { GlobalEditView, GlobalsListView } from "./globals";
export {
  useListViewContext,
  ListViewContextProvider,
  type ListViewContextState,
} from "./collections/listView/ListViewContext";

// Modal surface
export { ModalSurfaceProvider, useModalSurface } from "./modals";

// Live preview panel (the admin's split-pane preview chrome; the public
// `useLivePreview*` query hooks stay at the root — pages that render a
// live-preview iframe shouldn't pay for the panel that hosts it)
export {
  LivePreviewPanel,
  resolveLivePreviewUrl,
} from "./livePreview/LivePreviewPanel";
export type { LivePreviewFrameGeometry } from "./livePreview/LivePreviewPanel";
export {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
} from "./livePreview/useLivePreviewPanelState";

// Data table and drag-and-drop — the admin's own UI primitives, never used
// outside collection/global list and edit views
export * from "./ui/data-table";
export * from "./ui/dnd";
export * from "./ui/sidebar";
export * from "./ui/resizable";
