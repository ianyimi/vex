// @vexcms/next v0.1.0-alpha.1
//
// Two distinct export surfaces:
//
// 1. Server / client component entries (sub-path imports — required because
//    "use client" can't be mixed with async server components in one bundle):
//      import { NextAdminPage } from "@vexcms/next/server"   ← async server component
//      import { NextAdminLayout } from "@vexcms/next/client" ← "use client" component
//
// 2. Config / type re-exports (everything below). Re-exports `@vexcms/react`'s
//    HKT-bound config functions and types transitively so Next consumers can
//    import every config function from a single package:
//
//      import {
//        defineConfig,
//        defineCollection,
//        relationship,
//        text, number, select, date, url, checkbox,
//      } from "@vexcms/next";
//
//    `admin.components.preview` slots remain typed as React `ComponentType<P>`
//    via `ReactHKT` because @vexcms/react bound it before re-exporting. See
//    spec 22 Decision 15 for the architectural rationale.

// Server / client surface
export * from "./NextAdminPage";
export * from "./NextAdminLayout";

// Config functions — HKT-bound wrappers from @vexcms/react
export { relationship, defineCollection } from "@vexcms/react";

// Field config functions without component slots (pure pass-through)
export {
  text,
  number,
  select,
  date,
  url,
  checkbox,
  defineConfig,
} from "@vexcms/react";

// Public types — HKT-bound where applicable.
// `*FieldInput` core config types intentionally not re-exported (they collide
// with React `*FieldInput` component names; users get them via inference
// through the config functions).
export type {
  // HKT-bound (admin.components.preview = React ComponentType)
  RelationshipFieldInput,
  RelationshipField,
  AdminCollectionConfigInput,
  CollectionConfigInput,
  CollectionConfig,
  // Resolved field types
  TextField,
  NumberField,
  SelectField,
  DateField,
  UrlField,
  CheckboxField,
  // Shared types
  AdminField,
  CollectionSlug,
  VexDocument,
  VexConfig,
  VexConfigInput,
  RelationshipPreviewProps,
} from "@vexcms/react";

// API functions are NOT re-exported from this barrel because @vexcms/next's
// root index.ts is imported by server components (NextAdminPage). Pulling
// @vexcms/core/client here would transitively import @convex-dev/react-query
// which uses createContext — crashing RSC.
//
// Import directly from the correct environment-specific path instead:
//
//   import { find, get, search } from "@vexcms/core/client";  ← React components
//   import { find, get, search } from "@vexcms/core/server";  ← Convex handlers

export type {
  RelationshipKeysOf,
  TextKeysOf,
  SortableKeysOf,
  RelationshipTargetOf,
  Populated,
  PopulateShape,
} from "@vexcms/core";
