import {
  // Field config functions that have HKT-bound component slots
  // (currently: relationship; others added when they gain custom component slots)
  relationship as coreRelationship,
  // Collection / config functions that have HKT-bound component slots
  defineCollection as coreDefineCollection,
} from "@vexcms/core";

// Re-export field config functions that don't (yet) have user-supplied
// component slots. Pure pass-throughs — keeps imports consistent so users
// always import config functions from `@vexcms/react` (or `@vexcms/next`),
// never from `@vexcms/core` directly. When any of these gains a component
// slot, replace the pass-through with a typed wrapper like `relationship`.
export { text, number, select, date, url, checkbox, defineConfig } from "@vexcms/core";

// Re-export the *resolved* field types users reference in their code.
//
// Note: the `*FieldInput` types from core are intentionally NOT re-exported.
// They collide with the React `*FieldInput` *components* exported below
// (e.g. `TextFieldInput` is a React component for rendering, not a config
// type). Users instantiate fields via the config functions — `text()`,
// `number()`, etc. — which infer their own input types automatically.
export type {
  TextField,
  NumberField,
  SelectField,
  DateField,
  UrlField,
  CheckboxField,
  AdminField,
  CollectionSlug,
  VexDocument,
  VexConfig,
  VexConfigInput,
  RelationshipPreviewProps,
} from "@vexcms/core";
import type {
  CollectionSlug,
  RelationshipFieldInput as CoreRelationshipFieldInput,
  RelationshipField as CoreRelationshipField,
  CollectionConfigInput as CoreCollectionConfigInput,
  CollectionConfig as CoreCollectionConfig,
  AdminCollectionConfigInput as CoreAdminCollectionConfigInput,
} from "@vexcms/core";
import type { ReactHKT } from "./adapter";

// API functions are NOT exported from this barrel. @vexcms/next's
// NextAdminPage (a server component) imports from @vexcms/react. Adding
// @vexcms/core/client here would pull @convex-dev/react-query into the
// server module graph, crashing RSC with "createContext only works in
// Client Components".
//
// Import directly from the environment-specific path:
//   import { find, get, search } from "@vexcms/core/client";  // React components
//   import { find, get, search } from "@vexcms/core/server";  // Convex handlers

export type { FindClientArgs, GetClientArgs, SearchClientArgs } from "@vexcms/core/client";

// Server-side API (Convex query handlers)
export { find as findServer, get as getServer, search as searchServer } from "@vexcms/core/server";
export type { FindServerArgs, GetServerArgs, SearchServerArgs } from "@vexcms/core/server";

// Shared type helpers
export type {
  RelationshipKeysOf,
  TextKeysOf,
  SortableKeysOf,
  RelationshipTargetOf,
  Populated,
  PopulateShape,
} from "@vexcms/core";

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
  AppSidebar,
  // View components
  DashboardView,
  CollectionListView,
  MediaCollectionListView,
  MediaCollectionEditView,
  CollectionEditView,
} from "./components";

export type { AdminUser, AdminLayoutProps, AppSidebarProps } from "./components";

// Context
export { VexConfigContext, useVexConfig, StorageAdapterContextProvider } from "./context";

// Utilities
export { cn } from "./styles/utils";
export { Icon } from "./components/Icon";
export type { IconProps, LucideIconName } from "./components/Icon";

// shadcn UI primitives
export * from "./components/ui";

/**
 * Relationship field input type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipFieldInput<TCollectionSlug>` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TCollectionSlug>>`
 * instead of an opaque `ApplyComponent<ComponentHKT, _>`.
 */
export type RelationshipFieldInput<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipFieldInput<TFieldMeta, TCollectionSlug, ReactHKT>;

/**
 * Resolved relationship field type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipField<TCollectionSlug>` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TCollectionSlug>>`.
 */
export type RelationshipField<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipField<TFieldMeta, TCollectionSlug, ReactHKT>;

/**
 * Collection admin configuration input with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `AdminCollectionConfigInput` except
 * `components.preview` is typed as a React `ComponentType`.
 */
export type AdminCollectionConfigInput<TFieldSlug extends string = string> =
  CoreAdminCollectionConfigInput<TFieldSlug, ReactHKT>;

/**
 * Collection configuration input with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `CollectionConfigInput` — use this
 * when building a `defineCollection()` call in a React project so that
 * `admin.components.preview` is typed as a React `ComponentType`.
 */
export type CollectionConfigInput<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends CollectionSlug = CollectionSlug,
> = CoreCollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, ReactHKT>;

/**
 * Resolved collection configuration with React-typed component slots.
 *
 * Identical to `@vexcms/core`'s `CollectionConfig` except component slots
 * resolve to React `ComponentType` instead of the opaque `ComponentHKT` default.
 */
export type CollectionConfig<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends CollectionSlug = CollectionSlug,
> = CoreCollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, ReactHKT>;

/**
 * Defines a relationship field with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `relationship` — same behaviour,
 * but `options.admin.components.preview` is typed as a React `ComponentType`.
 */
export function relationship<
  TFieldMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
>(
  options: RelationshipFieldInput<TFieldMeta, TCollectionSlug>,
): RelationshipField<TFieldMeta, TCollectionSlug> {
  return coreRelationship<TFieldMeta, TCollectionSlug, ReactHKT>(options);
}

/**
 * Defines a collection with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `defineCollection` — same
 * behaviour, but `admin.components.preview` is typed as a React
 * `ComponentType<RelationshipPreviewProps<TCollectionSlug>>`.
 */
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends CollectionSlug = CollectionSlug,
>(
  config: CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug>,
): CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug> {
  return coreDefineCollection<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, ReactHKT>(
    config,
  );
}
