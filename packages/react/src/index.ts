/**
 * React framework adapter for VexCMS. @vexcms/react
 *
 * Exports the framework adapter, field components, view components,
 * layout primitives, and shadcn UI components used by the admin panel.
 *
 * @module
 */

// Framework adapter
export { reactAdapter } from "./adapter";
export type { ReactHKT, ReactAdapter } from "./adapter";

// Field components
export { TextFieldInput, TextFieldCell } from "./fields";

// View components
export { DashboardView, CollectionListView, CollectionEditView } from "./views";

// Layout components
export {
  AdminLayout,
  type AdminLayoutProps,
} from "./components/admin/AdminLayout";
export { AppSidebar, AppSidebarProps } from "./components/admin/AdminSidebar";

// Utilities
export { cn } from "./styles/utils";

// shadcn UI primitives
export * from "./components/ui/button";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/table";
export * from "./components/ui/badge";
export * from "./components/ui/card";
