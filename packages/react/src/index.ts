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
export { TextFieldInput, TextFieldCell } from "./components/fields";

export {
  // Layout components
  AdminLayout,
  type AdminLayoutProps,
  AppSidebar,
  type AppSidebarProps,
  // View components
  DashboardView,
  CollectionListView,
  CollectionEditView,
} from "./components";

// Context
export { VexConfigContext, useVexConfig } from "./context/VexConfigContext";

// Utilities
export { cn } from "./styles/utils";
export { Icon } from "./components/Icon";
export type { IconProps, LucideIconName } from "./components/Icon";

// shadcn UI primitives
export * from "./components/ui";
