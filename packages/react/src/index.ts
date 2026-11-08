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
export { text, email, textarea, number, select, date, url, checkbox, json, tabs, collapsible, row, ui, defineConfig } from "@vexcms/core";

// Re-export the *resolved* field types users reference in their code.
//
// Note: the `*FieldInput` types from core are intentionally NOT re-exported.
// They collide with the React `*FieldInput` *components* exported below
// (e.g. `TextFieldInput` is a React component for rendering, not a config
// type). Users instantiate fields via the config functions — `text()`,
// `number()`, etc. — which infer their own input types automatically.
export type {
  TextField,
  EmailField,
  TextareaField,
  NumberField,
  SelectField,
  DateField,
  UrlField,
  CheckboxField,
  JsonField,
  AdminField,
  CollectionSlug,
  VexDocument,
  VexConfig,
  VexClientConfig,
  VexClientConfigInput,
  VexServerConfigInput,
  RelationshipPreviewProps,
} from "@vexcms/core";
import type {
  CollectionSlug,
  RelationshipFieldInput as CoreRelationshipFieldInput,
  VexEditorAdapter as CoreVexEditorAdapter,
  RelationshipField as CoreRelationshipField,
  CollectionConfigInput as CoreCollectionConfigInput,
  CollectionConfig as CoreCollectionConfig,
  AdminCollectionConfigInput as CoreAdminCollectionConfigInput,
  AdminField,
} from "@vexcms/core";
import type { ReactHKT } from "./adapter";
import type { VexResourceSlug } from "@vexcms/core";

// API functions are NOT exported from this barrel. @vexcms/next's
// NextAdminPage (a server component) imports from @vexcms/react. Re-exporting
// ./client here would pull @convex-dev/react-query into the server module
// graph, crashing RSC with "createContext only works in Client Components".
//
// Import directly from the environment-specific path:
//   import { find, get, search } from "@vexcms/react/client";  // React components
//   import { find, get, search } from "@vexcms/core/server";  // Convex handlers

export type { FindClientArgs, GetClientArgs, SearchClientArgs } from "./client";

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

// Framework adapter types (the admin's `reactAdapter` value lives at
// `@vexcms/react/admin`; the types are free and used by root config helpers)
export type { ReactHKT, ReactAdapter } from "./adapter";

export { useVexPermissions } from "./access";

// The app form's full surface — `useAppForm`/`AppForm` — is
// `@vexcms/react/form` only: the root must not reach `dnd` through
// `ArrayField`/`BlocksField`'s drag handles.
export type { FieldControlProps, FieldComponentProps } from "@vexcms/core";

export { UnauthorizedView } from "./admin/UnauthorizedView";
export type { UnauthorizedViewProps } from "./admin/UnauthorizedView";

// Context
export {
  VexConfigContext,
  VexConfigProvider,
  useVexConfig,
  useVexAccess,
  useStorageAdapterMap,
} from "./config";
export type { NavigationBlockerAdapter, FrameworkAuthAdapter } from "./config";
export { useVexNavigate, COVERING_ROUTE_LINK_ATTRIBUTE } from "./config";
export { useVexAuth, VexAuthProvider, useAuthTransition, AuthTransitionProvider, type AuthTransitionState } from "./auth";

// Hooks
export { useCanAccessAdminPanel } from "./access";
export {
  usePaginatedQuery,
  type UsePaginatedQueryProps,
  type UsePaginatedQueryReturn,
} from "./hooks";
export { usePermission } from "./access";

// Utilities
export { cn } from "./utils/cn";
export { Icon, isIconName, IconNodeProvider } from "./ui/Icon";
export { adminHref } from "./admin/adminHref";
export type { AdminHrefTarget } from "./admin/adminHref";
export type { IconProps, IconName, IconNodeMap } from "./ui/Icon";
export { RenderBlocks } from "./fields/blocks/RenderBlocks";
export type {
  BlockComponentProps,
  BlockComponents,
  RenderableBlock,
  RenderBlocksProps,
} from "./fields/blocks/RenderBlocks";

export {
  LivePreviewProvider,
  useLivePreview,
  useLivePreviewDocumentQuery,
  useLivePreviewQuery,
} from "./livePreview/LivePreviewContext";
export type {
  LivePreviewDocumentQueryResult,
  LivePreviewQueryResult,
} from "./livePreview/LivePreviewContext";
export { useLivePreviewServerUrl } from "./livePreview/useLivePreviewServerUrl";
export { useLivePreviewSync } from "./livePreview/useLivePreviewSync";

// shadcn UI primitives — explicit re-exports, skipping `data-table`, `dnd`,
// `sidebar` and `resizable` (the admin's own primitives, `@vexcms/react/admin`)
export * from "./ui/accordion";
export * from "./ui/card";
export * from "./ui/checkbox";
export * from "./ui/radio-group";
export * from "./ui/badge";
export * from "./ui/dialog";
export * from "./ui/datetime";
export * from "./ui/dropdown-menu";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/sheet";
export * from "./ui/button";
export * from "./ui/table";
export * from "./ui/select";
export * from "./ui/VexLink";
export * from "./ui/VexImage";
export * from "./ui/tooltip";
export * from "./ui/scroll-area";
export * from "./ui/ScrollSection";
export * from "./ui/skeleton";
export * from "./ui/separator";
export * from "./ui/popover";
export * from "./ui/tabs";
export * from "./ui/sonner";
export * from "./ui/field";
export * from "./ui/ActionsMenu";
export * from "./ui/InputTag";
export * from "./ui/InlineQueryError";
export * from "./ui/QueryErrorBoundary";
export * from "./ui/ThemeProvider";
export * from "./ui/ThemeToggle";

/**
 * Relationship field input type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipFieldInput` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TTargetSlug>>`.
 */
export type RelationshipFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug, ReactHKT>;

/**
 * Resolved relationship field type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `RelationshipField` except
 * `admin.components.preview` is typed as `ComponentType<RelationshipPreviewProps<TTargetSlug>>`.
 */
export type RelationshipField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
> = CoreRelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug, ReactHKT>;

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
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
> = CoreCollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, ReactHKT>;

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
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
> = CoreCollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, ReactHKT>;

/**
 * Root editor adapter type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `VexEditorAdapter` except `editorComponent`
 * and `renderComponent` are typed as `ComponentType<...>` instead of an
 * opaque `ApplyComponent<ComponentHKT, _>`. `plateEditor()` from
 * `@vexcms/richtext-plate` returns this type; `vex.config.ts` sets
 * `editor: plateEditor()`.
 */
export type VexEditorAdapter = CoreVexEditorAdapter<ReactHKT>;

/**
 * Defines a relationship field with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `relationship`, with the same generics
 * minus the component slot: `relationship<"articles", "author">({ … })` types
 * `index.additionalFields`, `admin.condition` and `validate()` against `articles`.
 *
 * @param options - Relationship field configuration.
 * @returns The resolved relationship field definition.
 */
export function relationship<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
>(
  options: RelationshipFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug>,
): RelationshipField<TCollectionSlug, TFieldMeta, TTargetSlug> {
  return coreRelationship<TCollectionSlug, TFieldKey, TFieldMeta, TTargetSlug, ReactHKT>(options);
}

/**
 * Defines a collection with React-typed component slots.
 *
 * Drop-in replacement for `@vexcms/core`'s `defineCollection` — same
 * behaviour, but `admin.components.preview` is typed as a React
 * `ComponentType<RelationshipPreviewProps<TCollectionSlug>>`.
 *
 * The parameter type is derived from core's own signature rather than
 * restated, so core's reserved-field-key guard (naming a field `updatedAt` is
 * a compile error) reaches callers of this wrapper too, and cannot drift from
 * it.
 *
 * @param config - Collection configuration.
 * @returns The resolved collection configuration.
 */
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFields extends Record<string, AdminField<TFieldMeta>> = Record<string, AdminField<TFieldMeta>>,
>(
  config: Parameters<
    typeof coreDefineCollection<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, ReactHKT>
  >[0],
): CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields> {
  return coreDefineCollection<TFieldMeta, TCollectionMeta, TCollectionSlug, TFields, ReactHKT>(
    config,
  );
}

