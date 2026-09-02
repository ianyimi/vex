# 01 — Core + React + Next Integration

## Overview

Set up the foundation for v0.1.0 rebuild: connect the framework-agnostic core field system to
React/Next packages, add a Convex data layer with generic collection CRUD functions, and wire
up a working admin route in the www app with real live data.

**What this enables:**

- Type-safe field configuration in `vex.config.ts` with full autocomplete
- Framework adapter pattern enforcing field, cell, AND view components via HKT
- Generic Convex collection functions (`convex/vex/collections.ts`) — user copies once, works for all collections
- Admin view components with TanStack Query + Convex subscriptions and SSR-preloaded initial data
- `NextAdminPage` async server component routes to Dashboard / CollectionListView / CollectionEditView
- shadcn UI primitives, `AdminLayout`, and `AppSidebar` exported from `@vexcms/react`
- Working admin route in www navigable in the browser with live Convex data
- LSP source navigation (`gd` in neovim) jumps to `.ts` source across packages

**CLI watch mode is deferred** — handled in a future spec.

## Implementation Notes

The following deviations from the spec were made during implementation:

- **`"source"` export condition removed** — Turbopack cannot handle it. LSP navigation via `tsconfig paths` instead.
- **`export *` in `core/index.ts`** — Turbopack static analysis cannot resolve named exports through `export *` chains; switched to `export *` form.
- **`baseTypes.ts` added to core** — Extracted base field types to break a circular dependency between `fields/types.ts` and `fields/text/types.ts`.
- **`VexAdmin*` renamed to `NextAdmin*`** — Next.js adapter components use the `Next` prefix.
- **`fields` renamed to `data`** in Convex mutation args — cleaner, no naming confusion with field definitions.
- **`FrameworkComponentsContext.ts` moved** to `hooks/useFrameworkComponents.ts` (context + hook collocated).
- **`[[...slug]]`** used as catch-all param name, not `[[...vex]]`.
- **`@vexcms/next` split into sub-path exports** (`./server`, `./client`) to prevent `"use client"` banner from propagating to the server component.
- **Schema includes BetterAuth tables** — the www app uses `@convex-dev/better-auth`.
- **`CollectionListView` has placeholder data table** — TanStack Table implementation deferred to a future spec.

## Design Decisions

**`vexConvexApi` uses `anyApi` with type casts:**

The generic Convex functions always live at `vex.collections.*` — this is a fixed contract. Using
`anyApi` with explicit `FunctionReference` casts in `@vexcms/core` gives type-safe call sites
without requiring users to pass their generated `api` object through props or context. The tradeoff
is that if a user moves the functions out of `convex/vex/`, queries fail at runtime (not compile
time). This is acceptable — the path is part of the documented contract.

**`initialData` pattern for SSR:**

`NextAdminPage` is an `async` server component that calls `fetchQuery` (from `convex/nextjs`) to
get data before rendering. The preloaded data is passed as `initialData` to view components, which
pass it to `useQuery`. On the client, TanStack Query immediately has data (no loading flash) and
then subscribes to live Convex updates via `@convex-dev/react-query`.

**Generic Convex functions use dynamic table name casting:**

`list`, `get`, `create`, `update`, `remove` all accept `collection: string` and cast it to
`TableNamesInDataModel<DataModel>`. This is safe because: (a) the admin only shows collections
from `vex.config.ts`, and (b) `vex.config.ts` slugs must match Convex table names by convention.
The CLI will enforce this in a future spec.

**TanStack Form integration via `AppForm` context and `createFieldInput` factory:**

Field input components (`TextFieldInput`, etc.) are always connected to a TanStack Form instance —
they are not standalone inputs. There are two ways to wire them:

1. **Via `<AppForm>` context (primary — used in `CollectionEditView`):** Wrap inputs in `<AppForm form={form}>`. Each input reads the form from context via `useContext(AppFormContext)` and calls `form.Field name={props.name}` internally. The `name` prop from `InputComponentProps` doubles as both the HTML `id`/`for` and the TanStack Form field key — it must match the key in `form.defaultValues`.

2. **Via explicit `field` prop (typed escape hatch):** Pass a `TypedFieldApi<TValue>` (i.e. `FieldApi<any,any,any,any,TValue>`) directly as the `field` prop from a `<form.Field>` render prop. The value type is encoded in the generic — `TypedFieldApi<string>` ensures `field.state.value` is typed as `string` inside the render function. Use this when you need a fully-typed form outside the CMS admin panel.

The `createFieldInput` factory eliminates the boilerplate of managing these two paths in every component. Each field type only needs a render function that receives a `TypedFieldApi<TValue>` — use `field.state.value`, `field.handleChange`, `field.handleBlur`, and `field.state.meta.errors` directly. The factory handles context reading, `form.Field` wiring, and falling back to the explicit `field` prop — the render function is the only code specific to each field type.

**Calling with vs without `field`:**

```tsx
// Without field prop — must be inside <AppForm>
// createFieldInput reads form from context, calls form.Field name="title" internally
<AppForm form={form}>
  <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
</AppForm>

// With explicit field prop — works anywhere, bypasses context
// field.state.value is typed as string via TypedFieldApi<string>
<form.Field name="title">
  {(field) => (
    <TextFieldInput
      name="title"
      fieldDef={titleField}
      readOnly={false}
      field={field}
    />
  )}
</form.Field>
```

**shadcn components live in `@vexcms/react`:**

The react package ships shadcn UI primitives directly (not re-exported from shadcn). Consumers
must configure their tailwind to scan `node_modules/@vexcms/react/dist/**` or (for monorepos)
`../../packages/react/src/**` so tailwind generates the class names. This is documented in the
www tailwind config update in Step 8.

**`AdminLayout` + `AppSidebar` exported from `@vexcms/react`, used by `@vexcms/next`:**

The layout shell lives in the react package (framework-specific but not Next-specific).
`@vexcms/next` exports two components the user drops into their app:

- **`NextAdminLayout`** — a client component for `app/admin/layout.tsx`. Owns `AdminLayout`
  (sidebar + providers). Uses `usePathname()` to derive `activeSlug` for the sidebar, since
  Next.js layouts do not receive child route params. Passes `NextLink`/`NextImage` as
  framework components automatically.

- **`NextAdminPage`** — an async server component for `app/admin/[[...slug]]/page.tsx`.
  Renders **content only** — no layout wrapper. Routes by the `slug` array, prefetches data
  via `fetchQuery`, and passes `initialData` to view components.

**Why `[[...slug]]` (optional catch-all)?**
The double-bracket syntax matches both the bare `/admin` route and all child paths
(`/admin/posts`, `/admin/posts/123`). A single `page.tsx` handles all content routing.
The `layout.tsx` is a separate file — Next.js keeps it mounted across navigations so the
sidebar never re-renders.

**Why `NextAdminLayout` is a client component:**
Next.js `layout.tsx` does not receive params from child route segments. To highlight the
active sidebar item, `NextAdminLayout` calls `usePathname()` (a client hook) and extracts
the collection slug from the path. All child pages can still be server components.

**Framework-specific `Link` and `Image` via `FrameworkComponentsContext`:**

Different React meta-frameworks require their own `Link` and `Image` components for routing
and image optimisation (Next.js `next/link`, TanStack Router `@tanstack/react-router`).
Rather than coupling `@vexcms/react` to any one framework, injectable component slots are
provided via React context.

`FrameworkComponentsContext` holds an optional `Link` and `Image` component. `AdminLayout`
accepts a `components` prop and provides it — consumers never touch the context directly.
Two helper components, `VexLink` and `VexImage`, read the context and fall back to native
`<a>` and `<img>` when no framework component is configured. All internal components
(`AppSidebar` etc.) use these helpers rather than raw tags.

`VexLink` is a `forwardRef` component so it is compatible with shadcn's `asChild`/`Slot`
pattern used by `SidebarMenuButton`. The `Link` slot in `FrameworkComponents` is typed
`ComponentType<any>` internally — full prop safety lives on `VexLinkProps`, which all
call sites must satisfy.

**Framework adapter wiring (Next.js first, TanStack Start next):**

- **Next.js** (`@vexcms/next`): `NextAdminPage` passes `{ Link: NextLink, Image: NextImage }`
  to `AdminLayout` automatically. Users configure nothing.
- **TanStack Start** (`@vexcms/tanstack-start`, future): TanStack Router's `Link` uses `to`
  instead of `href`. The adapter package provides a thin wrapper
  `({ href, ...rest }) => <RouterLink to={href} {...rest} />` and passes it automatically.

The `Link` and `Image` types follow `ComponentType<P>` — the same type `ReactHKT` resolves
to for any props `P`. No new HKT machinery is needed; they are plain React component types.

**TypeScript `customConditions: ["source"]` for LSP navigation:**

Add the `"source"` export condition to each package's `package.json` and `customConditions`
to `packages/tsconfig/base.json`. When the LSP resolves `@vexcms/core`, it follows the
`"source"` condition to `./src/index.ts` instead of `./dist/index.d.ts`. Neovim `gd` then
opens the real TypeScript source.

## Out of Scope

- CLI watch mode + schema generation (separate spec)
- Advanced field types beyond text (number, checkbox, select, etc.)
- Authentication + RBAC
- Create / update / delete mutations wired to the form submit (Step 6 renders the form; saving is a future spec)
- Pagination in CollectionListView (future spec)
- Versioning / drafts system

## Target Directory Structure

```
packages/
├── tsconfig/
│   └── base.json                           # UPDATE — add customConditions: ["source"]
├── core/src/
│   ├── convex.ts                           # NEW — VexDocument + vexConvexApi
│   ├── framework.ts                        # UPDATE — initialData in view props
│   ├── index.ts                            # UPDATE — export VexDocument, vexConvexApi
│   ├── fields/baseTypes.ts                 # NEW — base types extracted to break circular dep
│   └── fields/text/
│       ├── inputSchema.test.ts             # NEW — Vitest tests
│       └── validator.test.ts               # NEW — Vitest tests
│
├── react/src/
│   ├── form/
│   │   ├── AppFormContext.ts               # NEW — AnyFormApi context + useAppForm hook
│   │   ├── AppForm.tsx                     # NEW — <AppForm> context provider component
│   │   ├── FieldApi.ts                     # NEW — re-exports TypedFieldApi for import compatibility
│   │   └── createFieldInput.tsx            # NEW — factory for typed field input components
│   ├── lib/
│   │   └── utils.ts                        # NEW — cn() utility
│   ├── hooks/
│   │   └── useFrameworkComponents.ts       # NEW — Link/Image slot context + hook (combined)
│   ├── components/
│   │   ├── VexLink.tsx                     # NEW — forwardRef link helper (falls back to <a>)
│   │   ├── VexImage.tsx                    # NEW — image helper (falls back to <img>)
│   │   ├── AdminLayout.tsx                 # NEW — layout shell (SidebarProvider + inset)
│   │   ├── AppSidebar.tsx                  # NEW — collection nav sidebar using VexLink
│   │   └── ui/                             # NEW — shadcn primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       └── card.tsx
│   ├── fields/text/
│   │   ├── Input.tsx                       # UPDATE — TextFieldInput via createFieldInput (stub exists)
│   │   └── Cell.tsx                        # UPDATE — TextFieldCell component (stub exists)
│   ├── views/
│   │   ├── DashboardView.tsx               # UPDATE — collection card grid (stub exists)
│   │   ├── CollectionListView.tsx          # UPDATE — data table with TanStack Query (stub exists)
│   │   └── CollectionEditView.tsx          # UPDATE — AppForm + field inputs (stub exists)
│   ├── adapter.ts                          # UPDATE — add views to reactAdapter
│   └── index.ts                            # UPDATE — export all components
│
├── next/src/
│   ├── NextAdminLayout.tsx                 # NEW — client component for admin/layout.tsx
│   ├── NextAdminPage.tsx                   # NEW — async server component for admin/[[...slug]]/page.tsx
│   └── index.ts                            # NEW — sub-path exports (./server + ./client)
│
apps/
└── www/
    ├── convex/
    │   ├── schema.ts                       # UPDATE — posts + BetterAuth tables
    │   └── vex/
    │       ├── collections.ts              # NEW — generic list/get/create/update/remove
    │       └── collections.test.ts         # NEW — convex-test tests
    ├── vex.config.ts                       # NEW — VexCMS config
    └── app/
        └── admin/
            ├── layout.tsx                  # NEW — NextAdminLayout wrapper
            └── [[...slug]]/
                └── page.tsx                # NEW — catch-all admin route
```

## Implementation Order

1. **TypeScript source navigation + Core types** — `customConditions` config, `VexDocument`, `vexConvexApi`, `framework.ts` with `initialData` in view props. Core builds.
2. **Core field tests** — `textFieldToInputSchema` and `textFieldToValidator`. Core tests pass.
3. **www: Convex setup** — schema with `posts` table, install `convex-test`, generic `vex/collections.ts` + tests. Convex tests pass.
4. **React: Package setup + shadcn** — add `@convex-dev/react-query` peer dep, `source` export, `cn()`, shadcn primitives.
5. **React: Adapter + field components + layout** — `ReactHKT`, `TextFieldInput`, `TextFieldCell`, `AdminLayout`, `AppSidebar`. React builds.
6. **React: View components** — `DashboardView`, `CollectionListView`, `CollectionEditView` with `useQuery`. Adapter updated with `views`. React builds.
7. **Next: `NextAdminPage`** — async server component using `fetchQuery` for SSR initial data. Next builds.
8. **www: Admin route** — `vex.config.ts`, catch-all page, `ConvexProvider` + `QueryClientProvider` in layout. Navigable in browser.

---

## Step 1: TypeScript Source Navigation + Core Types

**TypeScript source navigation:** Add the `"source"` export condition to each package so the LSP
resolves to the `.ts` source file instead of the compiled `.d.ts`. Then `customConditions: ["source"]`
in the base tsconfig tells TypeScript to prefer it.

**`VexDocument` and `vexConvexApi`:** Add to `@vexcms/core` so all packages import these from one
place. `vexConvexApi` uses `anyApi` with explicit `FunctionReference` casts — the paths are fixed
because users copy the `convex/vex/collections.ts` template to those exact paths.

**`framework.ts` update:** Add `initialData` to `CollectionListViewProps` and `CollectionEditViewProps`
so `NextAdminPage` can pass SSR-preloaded data and view components can hydrate their TanStack queries.

- [x] Edit `packages/tsconfig/base.json` — add `customConditions`
- [x] Edit `packages/core/package.json` — add `source` to exports
- [x] Edit `packages/react/package.json` — fix `source` field + add to exports + add `@convex-dev/react-query` and `@tanstack/react-query` as peer deps
- [x] Edit `packages/next/package.json` — add `source` to exports
- [x] Create `packages/core/src/convex.ts`
- [x] Update `packages/core/src/framework.ts`
- [x] Update `packages/core/src/index.ts`
- [x] Run `pnpm --filter @vexcms/core build` — must pass

### `packages/tsconfig/base.json` (UPDATE)

Add `customConditions` to `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "customConditions": ["source"],
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "templates"]
}
```

### `packages/core/package.json` (UPDATE)

Add `"source"` condition to exports:

```json
"exports": {
  ".": {
    "source": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
}
```

### `packages/react/package.json` (UPDATE)

Fix the top-level `"source"` field, add `"source"` to exports, add missing peer deps:

```json
{
  "source": "./src/index.ts",
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "peerDependencies": {
    "@convex-dev/react-query": "^0.1.0",
    "@tanstack/react-query": ">=5.0.0",
    "convex": ">=1.0.0",
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  }
}
```

Also add `@convex-dev/react-query` and `@tanstack/react-query` to `devDependencies` (needed for type-checking during build):

```json
"devDependencies": {
  "@convex-dev/react-query": "catalog:",
  "@tanstack/react-query": "catalog:"
}
```

### `packages/next/package.json` (UPDATE)

Add `"source"` to exports:

```json
"exports": {
  ".": {
    "source": "./src/index.ts",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js"
  }
}
```

> **Architecture Note (implemented):** The `"source"` export condition was **removed** during implementation. Turbopack uses bundler resolution and cannot handle the `"source"` condition without causing circular dependency failures and static analysis errors. Source navigation in the LSP is instead achieved via `tsconfig.json` `paths` mappings in each package. The `customConditions: ["source"]` setting in `base.json` is kept as it does not affect the Turbopack build.

---

### File: `packages/core/src/convex.ts` (NEW)

````typescript
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";

/**
 * Base type for all VexCMS documents as returned from Convex queries.
 *
 * All documents include the Convex system fields `_id` and `_creationTime`,
 * plus whatever field values are defined in the collection's schema.
 *
 * Framework adapters use this as the `initialData` type in view component
 * props — the actual field values are accessed via string keys.
 *
 * @example
 * ```ts
 * const title = typeof doc.title === "string" ? doc.title : "";
 * ```
 *
 * @see {@link vexConvexApi} for the query functions that return this type
 */
export interface VexDocument {
  /** Convex document ID string. */
  _id: string;
  /** Unix timestamp (milliseconds) when the document was created. */
  _creationTime: number;
  /** Field values defined by the collection schema. */
  [key: string]: unknown;
}

/**
 * Typed `anyApi` references to the VexCMS generic Convex collection functions.
 *
 * These point to functions that users copy into `convex/vex/collections.ts`
 * in their project. All paths are fixed under `vex.collections.*`.
 *
 * **Required:** copy `convex/vex/collections.ts` from the VexCMS template
 * into your project before these references will resolve at runtime.
 *
 * Used internally by view components in `@vexcms/react`. Framework adapter
 * authors do not need to import this directly unless building custom views.
 *
 * @example
 * ```ts
 * import { convexQuery } from "@convex-dev/react-query";
 * import { useQuery } from "@tanstack/react-query";
 * import { vexConvexApi } from "@vexcms/core";
 *
 * const { data } = useQuery({
 *   ...convexQuery(vexConvexApi.list, { collection: "posts" }),
 * });
 * ```
 */
export const vexConvexApi = {
  /**
   * Lists documents in a collection.
   * Called by {@link CollectionListView} in `@vexcms/react`.
   */
  list: anyApi.vex.collections.list as FunctionReference<
    "query",
    "public",
    { collection: string; limit?: number },
    VexDocument[]
  >,

  /**
   * Fetches a single document by ID.
   * Called by {@link CollectionEditView} in `@vexcms/react` when editing.
   */
  get: anyApi.vex.collections.get as FunctionReference<
    "query",
    "public",
    { collection: string; id: string },
    VexDocument | null
  >,

  /**
   * Creates a new document. Returns the new document's ID as a string.
   */
  create: anyApi.vex.collections.create as FunctionReference<
    "mutation",
    "public",
    { collection: string; data: Record<string, unknown> },
    string
  >,

  /**
   * Patches an existing document — unspecified fields are left unchanged.
   */
  update: anyApi.vex.collections.update as FunctionReference<
    "mutation",
    "public",
    { collection: string; id: string; data: Record<string, unknown> },
    void
  >,

  /**
   * Permanently deletes a document.
   */
  remove: anyApi.vex.collections.remove as FunctionReference<
    "mutation",
    "public",
    { collection: string; id: string },
    void
  >,
} as const;
````

---

### File: `packages/core/src/framework.ts` (UPDATE)

Replace the full file with this. Key changes: import `VexDocument`, add `initialData` and
`documentId` to view props.

````typescript
import type {
  AdminField,
  ApplyComponent,
  CellComponentProps,
  ComponentHKT,
  InputComponentProps,
} from "./fields";
import type { VexConfig } from "./config";
import type { CollectionConfig } from "./collections";
import type { VexDocument } from "./convex";

// ── Field + cell component maps ───────────────────────────────────────────────

/**
 * Maps each field type to its input component type for the given framework.
 * TypeScript enforces that every type in the `AdminField` union has a component.
 *
 * @see {@link FrameworkAdapterInput}
 */
export type FieldComponentMap<F extends ComponentHKT> = {
  [K in AdminField["type"]]: ApplyComponent<
    F,
    InputComponentProps<Extract<AdminField, { type: K }>>
  >;
};

/**
 * Maps each field type to its data-table cell component type for the given framework.
 * TypeScript enforces that every type in the `AdminField` union has a cell component.
 *
 * @see {@link FrameworkAdapterInput}
 */
export type CellComponentMap<F extends ComponentHKT> = {
  [K in AdminField["type"]]: ApplyComponent<
    F,
    CellComponentProps<Extract<AdminField, { type: K }>>
  >;
};

// ── View component prop types ─────────────────────────────────────────────────

/**
 * Props passed to the admin `Dashboard` view component.
 *
 * Receives the full resolved VexCMS config and renders the dashboard content
 * area (collection cards, stats, etc.). The surrounding layout (sidebar,
 * header) is handled by `AdminLayout` in `@vexcms/react`.
 *
 * @see {@link ViewComponentMap}
 */
export interface DashboardProps {
  /** The full resolved VexCMS configuration. */
  config: VexConfig;
}

/**
 * Props passed to the `CollectionListView` component.
 *
 * Renders the list of documents for a single collection. The component
 * fetches live data internally via `vexConvexApi.list`. Pass `initialData`
 * from `NextAdminPage` (which prefetches via `fetchQuery`) to avoid a loading
 * flash on first render.
 *
 * @see {@link ViewComponentMap}
 * @see {@link vexConvexApi}
 */
export interface CollectionListViewProps {
  /** The resolved collection configuration for the collection being listed. */
  collection: CollectionConfig;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to
   * the TanStack Query so the list renders immediately on first load.
   * Omit when rendering client-side only.
   */
  initialData?: VexDocument[];
}

/**
 * Props passed to the `CollectionEditView` component.
 *
 * Renders the document edit form. Iterates `collection.fields` and renders
 * the appropriate input component for each field type. When `documentId` is
 * provided, the component fetches the document via `vexConvexApi.get` and
 * populates the form. When omitted, the form is empty (new document).
 *
 * @see {@link ViewComponentMap}
 * @see {@link vexConvexApi}
 */
export interface CollectionEditViewProps {
  /** The resolved collection configuration whose fields will be rendered. */
  collection: CollectionConfig;
  /**
   * The Convex document ID of the document being edited.
   * Omit for new document creation — the form will be empty.
   */
  documentId?: string;
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: VexDocument | null;
}

/**
 * Maps the three required admin views to their framework component types.
 *
 * All three are required — omitting any causes a TypeScript error at the
 * `defineFrameworkAdapter` call site.
 *
 * @see {@link FrameworkAdapterInput}
 */
export type ViewComponentMap<F extends ComponentHKT> = {
  /** Admin dashboard content component. Receives the full VexCMS config. */
  Dashboard: ApplyComponent<F, DashboardProps>;
  /** Collection list view — renders a table of documents for one collection. */
  CollectionListView: ApplyComponent<F, CollectionListViewProps>;
  /** Collection edit form — renders all field inputs for one collection. */
  CollectionEditView: ApplyComponent<F, CollectionEditViewProps>;
};

// ── Framework adapter ─────────────────────────────────────────────────────────

/**
 * Input shape for `defineFrameworkAdapter`. Requires field input components,
 * cell components, and the three admin view components.
 *
 * TypeScript enforces completeness via the HKT `F` — every slot resolves to
 * `ComponentType<CorrectProps>` (for React) or the equivalent for other frameworks.
 *
 * @example
 * ```ts
 * const reactAdapter = defineFrameworkAdapter<ReactHKT>({
 *   name: "react",
 *   version: "0.1.0",
 *   fields: { text: TextInput },
 *   cells: { text: TextCell },
 *   views: { Dashboard, CollectionListView, CollectionEditView },
 * });
 * ```
 */
export interface FrameworkAdapterInput<F extends ComponentHKT> {
  /** Adapter identifier (e.g. `"react"`, `"solid"`). */
  name: string;
  /** Adapter version string. */
  version: string;
  /** Field input components — one per `AdminField` type. */
  fields: FieldComponentMap<F>;
  /** Data-table cell components — one per `AdminField` type. */
  cells: CellComponentMap<F>;
  /** Admin view components — Dashboard, CollectionListView, CollectionEditView. */
  views: ViewComponentMap<F>;
}

/** Resolved framework adapter type. Same shape as the input. */
export type FrameworkAdapter<F extends ComponentHKT> = FrameworkAdapterInput<F>;

/**
 * Registers a framework adapter with VexCMS.
 *
 * A zero-runtime identity function — its value is the type system. TypeScript
 * uses `F` to verify that every component in `fields`, `cells`, and `views`
 * accepts the exact correct props. Adding a new `AdminField` type automatically
 * causes a build error here until components are added for it.
 *
 * @param adapter - The framework adapter configuration
 * @returns The adapter unchanged (identity function)
 *
 * @example
 * ```ts
 * export const reactAdapter = defineFrameworkAdapter<ReactHKT>({ ... });
 * ```
 */
export function defineFrameworkAdapter<F extends ComponentHKT>(
  adapter: FrameworkAdapterInput<F>,
): FrameworkAdapter<F> {
  return adapter;
}
````

### `packages/core/src/index.ts` additions

Add these exports to the existing file:

```typescript
// Convex integration
export type { VexDocument } from "./convex";
export { vexConvexApi } from "./convex";

// Framework adapter — view prop types
export type {
  DashboardProps,
  CollectionListViewProps,
  CollectionEditViewProps,
  ViewComponentMap,
} from "./framework";
```

---

## Step 2: Core — Field Function Tests

Tests for the existing `textFieldToInputSchema()` and `textFieldToValidator()` functions.

- [x] Create `packages/core/src/fields/text/inputSchema.test.ts`
- [x] Create `packages/core/src/fields/text/validator.test.ts`
- [x] Run `pnpm --filter @vexcms/core test` — all tests pass

### File: `packages/core/src/fields/text/inputSchema.test.ts`

`textFieldToInputSchema()` returns a Zod schema object — tests validate runtime behavior.

```typescript
import { describe, it, expect } from "vitest";
import { text } from "./config";
import { textFieldToInputSchema } from "./inputSchema";

describe("textFieldToInputSchema", () => {
  it("generates required string schema", () => {
    const schema = textFieldToInputSchema({
      field: text({ required: true, defaultValue: "test" }),
    });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional schema with default", () => {
    const schema = textFieldToInputSchema({
      field: text({ required: false, defaultValue: "" }),
    });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("");
  });

  it("applies min constraint", () => {
    const schema = textFieldToInputSchema({
      field: text({ required: true, defaultValue: "t", min: { value: 3 } }),
    });
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
  });

  it("applies max constraint", () => {
    const schema = textFieldToInputSchema({
      field: text({ required: true, defaultValue: "t", max: { value: 5 } }),
    });
    expect(schema.safeParse("hello").success).toBe(true);
    expect(schema.safeParse("toolong").success).toBe(false);
  });

  it("applies min with custom error message", () => {
    const schema = textFieldToInputSchema({
      field: text({
        required: true,
        defaultValue: "t",
        min: { value: 3, error: "Too short" },
      }),
    });
    const result = schema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe("Too short");
  });

  it("applies max with custom error message", () => {
    const schema = textFieldToInputSchema({
      field: text({
        required: true,
        defaultValue: "t",
        max: { value: 5, error: "Too long" },
      }),
    });
    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].message).toBe("Too long");
  });

  it("combines min and max constraints", () => {
    const schema = textFieldToInputSchema({
      field: text({
        required: true,
        defaultValue: "t",
        min: { value: 3 },
        max: { value: 10 },
      }),
    });
    expect(schema.safeParse("abc").success).toBe(true);
    expect(schema.safeParse("abcdefghij").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abcdefghijk").success).toBe(false);
  });

  it("optional field with constraints: accepts undefined, enforces constraints when value given", () => {
    const schema = textFieldToInputSchema({
      field: text({
        required: false,
        defaultValue: "",
        min: { value: 5 },
        max: { value: 50 },
      }),
    });
    const undefinedResult = schema.safeParse(undefined);
    expect(undefinedResult.success).toBe(true);
    if (undefinedResult.success) expect(undefinedResult.data).toBe("");
    expect(schema.safeParse("hi").success).toBe(false);
    expect(schema.safeParse("hello").success).toBe(true);
  });
});
```

### File: `packages/core/src/fields/text/validator.test.ts`

`textFieldToValidator()` returns a Convex validator string — tests check the output string directly.

```typescript
import { describe, it, expect } from "vitest";
import { text } from "./config";
import { textFieldToValidator } from "./validator";

describe("textFieldToValidator", () => {
  it("generates required string validator", () => {
    expect(
      textFieldToValidator({
        field: text({ required: true, defaultValue: "t" }),
      }),
    ).toBe("v.string()");
  });

  it("generates optional string validator", () => {
    expect(
      textFieldToValidator({
        field: text({ required: false, defaultValue: "" }),
      }),
    ).toBe("v.optional(v.string())");
  });

  it("default text() field is optional", () => {
    expect(textFieldToValidator({ field: text({ defaultValue: "" }) })).toBe(
      "v.optional(v.string())",
    );
  });

  it("ignores length constraints — DB schema validates type only, not length", () => {
    const field = text({
      required: true,
      defaultValue: "t",
      min: { value: 3 },
      max: { value: 100 },
    });
    expect(textFieldToValidator({ field })).toBe("v.string()");
  });
});
```

---

## Step 3: www — Convex Setup and Generic Collection Functions

Set up the Convex schema for the www app and create the generic collection CRUD functions
that all view components use. These functions are the user-side template — they live in the
user's project (`convex/vex/`), not in the VexCMS packages.

**Note:** The www app has a `convex/` directory with old pre-rebuild files. These must be replaced:

- `convex/schema.ts` — currently imports 11 tables from the old architecture. **Replace entirely** with the schema below (just the `posts` table).
- `convex/vex/collections.ts` — currently has `listDocuments`, `getDocument`, `countDocuments`, `updateDocument`, `createDocument`, `deleteDocument`, `bulkDeleteDocuments`, `searchDocuments` with RBAC/auth permission checks. **Delete this entire file** and replace with the simple generic `list`/`get`/`create`/`update`/`remove` functions below. Auth-aware variants will be added back in a future spec when that feature is built.
- Keep `convex/convex.config.ts` as-is.
- Delete old collection-specific files (`pages.ts`, `headers.ts`, `footers.ts`, `theme.ts`, `siteSettings.ts`, `seed.ts`, `http.ts`) and the `convex/auth/` folder — these are from the pre-rebuild architecture.

- [x] Delete old pre-rebuild convex files: `auth/`, `auth.config.ts`, `footers.ts`, `headers.ts`, `http.ts`, `pages.ts`, `seed.ts`, `siteSettings.ts`, `theme.ts`, `convex/vex.config.ts`, `vex.schema.ts`, `vex.types.ts`, and old `vex/` subdirs
- [x] Delete `convex/_generated/` — it reflects the old project and must be regenerated
- [x] Replace `apps/www/convex/schema.ts` with the schema below
- [x] Run `pnpm add -D convex-test @edge-runtime/vm --filter www` to install convex-test (if not already done)
- [x] Create `apps/www/vitest.config.ts` (named exactly this — vitest auto-discovers it)
- [x] Create `apps/www/convex/vex/collections.ts`
- [x] Create `apps/www/convex/vex/collections.test.ts`
- [x] Run `npx convex dev --once` in `apps/www/` — regenerates `convex/_generated/` from the new schema + functions. Requires `CONVEX_DEPLOYMENT` in `.env.local`. If not set, run `npx convex dev` interactively to link the project first.
- [x] Run `pnpm --filter www test` — all 14 tests pass

### File: `apps/www/convex/schema.ts` (REPLACE)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
  }),
  // BetterAuth required tables — present when www app uses @convex-dev/better-auth
  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    // ... additional BetterAuth fields (role, banned, etc.)
  }).index("by_email", ["email"]),
  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.id("user"),
    // ... additional OAuth fields
  }).index("by_userId", ["userId"]).index("by_accountId", ["accountId"]),
  session: defineTable({
    expiresAt: v.number(),
    token: v.string(),
    userId: v.id("user"),
    // ... additional session fields
  }).index("by_token", ["token"]),
  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
  }).index("by_identifier", ["identifier"]),
  jwks: defineTable({
    publicKey: v.string(),
    privateKey: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
```

> **Note:** The www app uses BetterAuth. The schema includes the required BetterAuth tables in addition to `posts`. Apps without BetterAuth only need the `posts` table.

### File: `apps/www/vitest.config.ts` (NEW)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
```

### File: `apps/www/convex/vex/collections.ts` (NEW)

Generic CRUD functions for any VexCMS collection. Users copy this file into their project at
exactly `convex/vex/collections.ts` — the path is fixed because `vexConvexApi` in `@vexcms/core`
references `anyApi.vex.collections.*`.

```typescript
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { TableNamesInDataModel } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

/**
 * Lists all documents in a VexCMS-managed collection.
 *
 * The `collection` argument must match a Convex table name in your schema —
 * this is enforced via the `TableNamesInDataModel` cast. VexCMS convention:
 * collection slugs in `vex.config.ts` must match their Convex table names.
 *
 * Used internally by `CollectionListView` in `@vexcms/react` via `vexConvexApi.list`.
 *
 * @param collection - Collection slug (must match a Convex table name)
 * @param limit - Maximum number of documents to return (default: 50)
 * @returns Array of documents with all fields, ordered by creation time
 */
export const list = query({
  args: {
    collection: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>;
    return await ctx.db.query(tableName).take(args.limit ?? 50);
  },
});

/**
 * Fetches a single document by Convex ID.
 *
 * Used internally by `CollectionEditView` in `@vexcms/react` via `vexConvexApi.get`.
 *
 * @param collection - Collection slug (must match a Convex table name)
 * @param id - The Convex document ID as a string
 * @returns The document, or `null` if not found
 */
export const get = query({
  args: {
    collection: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id as Id<TableNamesInDataModel<DataModel>>);
  },
});

/**
 * Creates a new document in a VexCMS-managed collection.
 * Returns the new document's Convex ID as a string.
 *
 * @param collection - Collection slug
 * @param data - The field values to store (must match the table's schema)
 * @returns The new document's ID
 */
export const create = mutation({
  args: {
    collection: v.string(),
    data: v.any(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const tableName = args.collection as TableNamesInDataModel<DataModel>;
    const id = await ctx.db.insert(tableName, args.data);
    return id as string;
  },
});

/**
 * Patches an existing document — only specified fields are updated,
 * unspecified fields are left unchanged.
 *
 * @param collection - Collection slug
 * @param id - The Convex document ID as a string
 * @param data - The fields to update (partial patch)
 */
export const update = mutation({
  args: {
    collection: v.string(),
    id: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(
      args.id as Id<TableNamesInDataModel<DataModel>>,
      args.data,
    );
  },
});

/**
 * Permanently deletes a document from a VexCMS-managed collection.
 *
 * @param collection - Collection slug
 * @param id - The Convex document ID as a string
 */
export const remove = mutation({
  args: {
    collection: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as Id<TableNamesInDataModel<DataModel>>);
  },
});
```

### File: `apps/www/convex/vex/collections.test.ts` (NEW)

Each test creates a fresh `convexTest` instance for isolation. Tests cover each function across the
full CRUD lifecycle plus edge cases.

```typescript
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

// ── list ──────────────────────────────────────────────────────────────────────

describe("vex.collections.list", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema);
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
    });
    expect(docs).toEqual([]);
  });

  test("returns all documents in insertion order", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });
    });
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
    });
    expect(docs).toHaveLength(2);
    expect(docs[0].title).toBe("First");
    expect(docs[1].title).toBe("Second");
  });

  test("respects the limit argument", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}` });
      }
    });
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
      limit: 3,
    });
    expect(docs).toHaveLength(3);
  });

  test("returns up to 50 documents by default", async () => {
    const t = convexTest(schema);
    await t.run(async (ctx) => {
      for (let i = 0; i < 55; i++) {
        await ctx.db.insert("posts", { title: `Post ${i}` });
      }
    });
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
    });
    expect(docs).toHaveLength(50);
  });
});

// ── get ───────────────────────────────────────────────────────────────────────

describe("vex.collections.get", () => {
  test("returns a document by id", async () => {
    const t = convexTest(schema);
    let id: string;
    await t.run(async (ctx) => {
      id = await ctx.db.insert("posts", { title: "Hello", slug: "hello" });
    });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id: id!,
    });
    expect(doc).not.toBeNull();
    expect(doc?.title).toBe("Hello");
    expect(doc?.slug).toBe("hello");
  });

  test("returns null for a non-existent or malformed id", async () => {
    const t = convexTest(schema);
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id: "not_a_real_id",
    });
    expect(doc).toBeNull();
  });

  test("returned document includes _id and _creationTime system fields", async () => {
    const t = convexTest(schema);
    let id: string;
    await t.run(async (ctx) => {
      id = await ctx.db.insert("posts", { title: "System fields test" });
    });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id: id!,
    });
    expect(doc?._id).toBe(id!);
    expect(typeof doc?._creationTime).toBe("number");
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe("vex.collections.create", () => {
  test("inserts a document and returns its id", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "New Post", slug: "new-post" },
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("created document is retrievable via get", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "Retrievable", slug: "retrievable" },
    });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id,
    });
    expect(doc?.title).toBe("Retrievable");
    expect(doc?.slug).toBe("retrievable");
  });

  test("created document appears in list", async () => {
    const t = convexTest(schema);
    await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "Listed Post" },
    });
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Listed Post");
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe("vex.collections.update", () => {
  test("patches specified fields, leaves others unchanged", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "Original Title", slug: "original-slug" },
    });
    await t.mutation(api.vex.collections.update, {
      collection: "posts",
      id,
      data: { title: "Updated Title" },
    });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id,
    });
    expect(doc?.title).toBe("Updated Title");
    expect(doc?.slug).toBe("original-slug"); // unchanged
  });

  test("can set a field to undefined (remove it)", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "Has Excerpt", excerpt: "Some excerpt" },
    });
    await t.mutation(api.vex.collections.update, {
      collection: "posts",
      id,
      data: { excerpt: undefined },
    });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id,
    });
    expect(doc?.excerpt).toBeUndefined();
    expect(doc?.title).toBe("Has Excerpt"); // unchanged
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe("vex.collections.remove", () => {
  test("deletes a document — get returns null afterwards", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "To Delete" },
    });
    await t.mutation(api.vex.collections.remove, { collection: "posts", id });
    const doc = await t.query(api.vex.collections.get, {
      collection: "posts",
      id,
    });
    expect(doc).toBeNull();
  });

  test("deleted document no longer appears in list", async () => {
    const t = convexTest(schema);
    const id = await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "To Delete" },
    });
    await t.mutation(api.vex.collections.create, {
      collection: "posts",
      data: { title: "Stays" },
    });
    await t.mutation(api.vex.collections.remove, { collection: "posts", id });
    const docs = await t.query(api.vex.collections.list, {
      collection: "posts",
    });
    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe("Stays");
  });
});
```

---

## Step 4: React — Package Setup and shadcn Primitives

Install missing dependencies, set up shadcn for the react package, and add the `cn()` utility
and primitive UI components that the layout and view components use.

- [x] Run `pnpm install` after editing `packages/react/package.json` in Step 1
- [x] Create `packages/react/components.json` (shadcn config)
- [x] Create `packages/react/src/lib/utils.ts`
- [x] Run `npx shadcn add button input label table badge card --cwd packages/react` — installs primitives to `packages/react/src/components/ui/`
- [x] Verify `packages/react/src/components/ui/` contains the six component files
- [x] Run `pnpm --filter @vexcms/react build` — must pass

**Tailwind in the www app:** Add the react package source path to `apps/www/tailwind.config.ts`
so tailwind generates class names used in `@vexcms/react` components:

```typescript
// apps/www/tailwind.config.ts — add to content array:
"../../packages/react/src/**/*.{ts,tsx}";
```

### File: `packages/react/components.json` (NEW)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "./src/components",
    "utils": "./src/lib/utils",
    "ui": "./src/components/ui",
    "lib": "./src/lib",
    "hooks": "./src/hooks"
  },
  "iconLibrary": "lucide"
}
```

### File: `packages/react/src/lib/utils.ts` (NEW)

````typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names with conflict resolution.
 *
 * Combines `clsx` (conditional classes) with `tailwind-merge` (deduplication
 * of conflicting Tailwind utilities). Use this wherever class names are
 * conditionally composed in component props.
 *
 * @param inputs - Class names, arrays, or conditional objects
 * @returns Merged, deduplicated class string
 *
 * @example
 * ```ts
 * cn("px-2 py-1", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
````

---

## Step 5: React — Adapter, Field Components, Layout, and Sidebar

Build the `ReactHKT` adapter, `TextInput`, `TextCell`, `AdminLayout`, and `AppSidebar`. At the
end of this step `pnpm build` on the react package passes (the adapter doesn't include `views`
yet — that comes in Step 6).

**Existing stubs:** The repo already has partial stub files at the correct paths. Update them in place — do not create new files.

- `packages/react/src/adapter.ts` — exists with `ReactHKT` but without `FrameworkAdapterInput<ReactHKT>` annotation; replace body with the version below
- `packages/react/src/fields/text/Input.tsx` — replace stub body with the shadcn Label + Input implementation below
- `packages/react/src/fields/text/Cell.tsx` — replace stub body with the implementation below
- `packages/react/src/views/DashboardView.tsx` — replace stub body with the Dashboard implementation below

- [x] Create `packages/react/src/form/AppFormContext.ts`
- [x] Create `packages/react/src/form/AppForm.tsx`
- [x] Create `packages/react/src/form/FieldApi.ts`
- [x] Create `packages/react/src/form/createFieldInput.tsx`
- [x] Update `packages/react/src/adapter.ts` — add `FrameworkAdapterInput<ReactHKT>` type annotation
- [x] Update `packages/react/src/fields/text/Input.tsx` — replace stub with `createFieldInput` version
- [x] Update `packages/react/src/fields/text/Cell.tsx` — replace stub with truncation implementation
- [x] Update `packages/react/src/views/DashboardView.tsx` — replace stub with collection card grid
- [x] Create `packages/react/src/hooks/useFrameworkComponents.ts` (context + hook combined)
- [x] Create `packages/react/src/components/VexLink.tsx`
- [x] Create `packages/react/src/components/VexImage.tsx`
- [x] Create `packages/react/src/components/AdminLayout.tsx`
- [x] Create `packages/react/src/components/AppSidebar.tsx`
- [x] Run `pnpm --filter @vexcms/react build` — must pass

### File: `packages/react/src/form/AppFormContext.ts` (NEW)

Holds the shared `FormApi` instance and the hook components use to access it.

```typescript
import type { FormApi } from "@tanstack/react-form";
import { createContext, useContext } from "react";

/**
 * Opaque form API type — generics erased at the context boundary.
 * The concrete `TFormData` is known at the `useForm` call site in each view component;
 * field input components read from context and cast their values via `createFieldInput`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFormApi = FormApi<any, any>;

/** React context carrying the active TanStack Form instance. */
export const AppFormContext = createContext<AnyFormApi | null>(null);

/**
 * Returns the nearest `AppForm`'s form instance.
 * Throws if called outside `<AppForm>`.
 */
export function useAppForm(): AnyFormApi {
  const form = useContext(AppFormContext);
  if (!form) throw new Error("useAppForm must be called inside <AppForm>");
  return form;
}
```

### File: `packages/react/src/form/AppForm.tsx` (NEW)

Context provider that wraps a TanStack Form instance and renders an HTML `<form>`.

````tsx
import type { ReactNode } from "react";
import { AppFormContext, type AnyFormApi } from "./AppFormContext";

/**
 * Provides a TanStack Form instance to all descendant field input components.
 *
 * Wrap any set of `TextFieldInput` (or other field input) components in `<AppForm>`
 * and they will read the form from context — no prop threading needed.
 *
 * The `name` prop on each input must match the corresponding key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { title: "", slug: "" } })
 *
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 *   <TextFieldInput name="slug"  fieldDef={slugField}  readOnly={false} />
 * </AppForm>
 */
export function AppForm(props: {
  form: AnyFormApi;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AppFormContext.Provider value={props.form}>
      <form
        className={props.className}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.form.handleSubmit();
        }}
      >
        {props.children}
      </form>
    </AppFormContext.Provider>
  );
}
````

### File: `packages/react/src/form/FieldApi.ts` (NEW)

Re-exports `TypedFieldApi` from `createFieldInput` for import compatibility.
`FieldController` is no longer used — field input components receive a `TypedFieldApi<TValue>` directly.

```typescript
/**
 * Re-exports `TypedFieldApi` from `createFieldInput`.
 *
 * `FieldController` is no longer used — field input components receive a
 * `TypedFieldApi<TValue>` directly. This file exists for import compatibility.
 *
 * @deprecated Import `TypedFieldApi` from `./createFieldInput` directly.
 */
export type { TypedFieldApi } from "./createFieldInput";
```

### File: `packages/react/src/form/createFieldInput.tsx` (NEW)

Factory that produces a field input component with all form wiring handled. Every field type
in `@vexcms/react` is built with this factory — the only code specific to each field type is
the render function.

````tsx
import type { ReactNode } from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { AdminField, InputComponentProps } from "@vexcms/core";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";

/**
 * A TanStack Form `FieldApi` narrowed to a specific value type.
 *
 * Use this as the type for a field input component's `field` prop when you need
 * an explicit, typed field outside of `<AppForm>` context.
 *
 * @example
 * ```tsx
 * const form = useForm<{ title: string }>({ ... })
 *
 * <form.Field name="title">
 *   {(field) => (
 *     <TextFieldInput
 *       name="title"
 *       fieldDef={titleField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedFieldApi<TValue> = FieldApi<any, any, any, any, TValue>;

/**
 * Creates a typed field input component, handling all TanStack Form wiring.
 *
 * Every field type in `@vexcms/react` is built with this factory. The render
 * function receives a `TypedFieldApi<TValue>` so `field.state.value` is typed
 * to `TValue` with no casts needed inside the render.
 *
 * Two usage paths:
 * - **`field` prop omitted — inside `<AppForm>`:** reads the form from `AppFormContext`,
 *   calls `form.Field name={props.name}` internally, and casts the value to `TValue`.
 * - **`field` prop provided — anywhere:** uses the field directly. Value is already
 *   typed from the `FieldApi` generic.
 *
 * **How field components know the field name:** `props.name` from `InputComponentProps`
 * is the collection field key (e.g. `"title"`). It is passed directly to `form.Field`
 * as the `name`, connecting the input to the matching key in `form.defaultValues`.
 *
 * @param render - Renders the field UI. Receives base `InputComponentProps` plus a
 *   `field: TypedFieldApi<TValue>` — use `field.state.value`, `field.handleChange`,
 *   `field.handleBlur`, and `field.state.meta.errors` for all form interactions.
 * @returns A React component accepting `InputComponentProps<TField> & { field?: TypedFieldApi<TValue> }`.
 * @throws {Error} When `field` is omitted and the component is rendered outside `<AppForm>`.
 *
 * @example
 * ```tsx
 * export const TextFieldInput = createFieldInput<string, TextField>(
 *   ({ name, fieldDef, readOnly, field }) => (
 *     <div className="flex flex-col gap-1.5">
 *       <Label htmlFor={name}>{fieldDef.label || name}</Label>
 *       <Input
 *         id={name}
 *         value={field.state.value ?? ""}
 *         onChange={(e) => field.handleChange(e.target.value)}
 *         onBlur={field.handleBlur}
 *         readOnly={readOnly}
 *       />
 *       {field.state.meta.errors[0] && (
 *         <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
 *       )}
 *     </div>
 *   ),
 * )
 * ```
 */
export function createFieldInput<TValue, TField extends AdminField>(
  render: (
    props: InputComponentProps<TField> & { field: TypedFieldApi<TValue> },
  ) => ReactNode,
) {
  return function FieldInput(
    props: InputComponentProps<TField> & { field?: TypedFieldApi<TValue> },
  ) {
    const form = useContext(AppFormContext);

    if (props.field) {
      return render({ ...props, field: props.field });
    }

    if (!form) {
      throw new Error(
        `Field "${props.name}" must be rendered inside <AppForm> or receive an explicit field prop.`,
      );
    }

    return (
      <form.Field name={props.name}>
        {(fieldApi) =>
          render({
            ...props,
            field: fieldApi as TypedFieldApi<TValue>,
          })
        }
      </form.Field>
    );
  };
}
````

---

### File: `packages/react/src/adapter.ts`

```typescript
import {
  defineFrameworkAdapter,
  type FrameworkAdapterInput,
} from "@vexcms/core";
import type { ComponentHKT } from "@vexcms/core";
import type { ComponentType } from "react";

import { TextFieldInput } from "./fields/text/Input";
import { TextFieldCell } from "./fields/text/Cell";

/**
 * HKT for React — maps any props type `P` to `ComponentType<P>`.
 *
 * Passed to `defineFrameworkAdapter<ReactHKT>` so every slot in `fields`,
 * `cells`, and `views` resolves to `ComponentType<CorrectProps>` at the
 * TypeScript level. This gives full prop autocomplete inside each component.
 *
 * @see {@link ComponentHKT} in `@vexcms/core`
 */
export interface ReactHKT extends ComponentHKT {
  component: ComponentType<this["_props"]>;
}

/**
 * React framework adapter for VexCMS.
 *
 * Registers all field input, cell, and view components. TypeScript enforces
 * via `ReactHKT` that every slot accepts the correct props for its field type
 * or view. Adding a new `AdminField` type to core automatically causes a type
 * error here until components are added for it.
 *
 * @see {@link defineFrameworkAdapter} in `@vexcms/core`
 */
export const reactAdapter: FrameworkAdapterInput<ReactHKT> =
  defineFrameworkAdapter<ReactHKT>({
    name: "react",
    version: "0.1.0-alpha.1",
    fields: {
      text: TextFieldInput,
    },
    cells: {
      text: TextFieldCell,
    },
    views: {
      // Filled in Step 6 after view components are created
      Dashboard: null as any,
      CollectionListView: null as any,
      CollectionEditView: null as any,
    },
  });

/** Resolved type of the React adapter, for use in consuming code. */
export type ReactAdapter = typeof reactAdapter;
```

**Note:** The `null as any` placeholders for `views` are temporary — replace them in Step 6 with
the actual view components. This lets the build pass while you implement the views.

### File: `packages/react/src/fields/text/Input.tsx`

Built with `createFieldInput` — the only text-field-specific code is the render function.
The `field` prop is typed as `TypedFieldApi<string>` by the factory; no explicit type
annotation is needed on the exported component.

````tsx
import type { TextField } from "@vexcms/core";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { createFieldInput } from "../../form/createFieldInput";

/**
 * Text field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"title"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="title">
 *   {(field) => (
 *     <TextFieldInput
 *       name="title"
 *       fieldDef={titleField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const TextFieldInput = createFieldInput<string, TextField>(
  ({ name, fieldDef, readOnly, field }) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{fieldDef.label || name}</Label>
      <Input
        id={name}
        type="text"
        value={field.state.value ?? ""}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={fieldDef.admin.placeholder}
        readOnly={readOnly}
      />
      {fieldDef.admin.description && (
        <p className="text-[0.8rem] text-muted-foreground">
          {fieldDef.admin.description}
        </p>
      )}
      {field.state.meta.errors[0] && (
        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
      )}
    </div>
  ),
);
````

### File: `packages/react/src/fields/text/Cell.tsx`

````tsx
import type { CellComponentProps, TextField } from "@vexcms/core";

/**
 * Text field cell component for the data-table list view.
 *
 * Renders the string value of a text field. Null/undefined values show an
 * em-dash placeholder. Values longer than 80 characters are truncated with
 * the full text shown on hover via the `title` attribute.
 *
 * @param props - Component props
 * @param props.value - Raw value from the document (may be null or undefined)
 * @param props.fieldDef - Resolved `TextField` definition
 *
 * @example
 * ```tsx
 * <TextFieldCell value={doc.title} fieldDef={titleField} row={row} />
 * ```
 */
export function TextFieldCell(props: CellComponentProps<TextField>) {
  if (props.value == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const str = String(props.value);
  if (str.length > 80) {
    return (
      <span title={str} className="truncate">
        {str.slice(0, 77)}…
      </span>
    );
  }
  return <span>{str}</span>;
}
````

### File: `packages/react/src/components/AppSidebar.tsx`

Uses shadcn's `Sidebar` primitives (already installed in the package). `AppSidebar` is the
inner sidebar content — it does not own the `SidebarProvider`. That belongs in `AdminLayout`
so the trigger and inset can share the same context.

````tsx
import type { VexConfig } from "@vexcms/core";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

/**
 * Props for the `AppSidebar` component.
 */
export interface AppSidebarProps {
  /** The full resolved VexCMS config — used to render the collection nav links. */
  config: VexConfig;
  /**
   * The slug of the currently active collection.
   * Used to set `isActive` on the matching `SidebarMenuButton`.
   */
  activeSlug?: string;
}

---

## Step 6: React — View Components with TanStack Query

Create the three admin view components. Each fetches its own live data via `useQuery` +
`convexQuery` and accepts `initialData` for SSR hydration. Then update `adapter.ts` to
replace the `null as any` placeholders with the real components.

- [x] Update `packages/react/src/views/DashboardView.tsx` — replace stub with card grid implementation
- [x] Update `packages/react/src/views/CollectionListView.tsx` — replace stub with TanStack Query implementation
- [x] Update `packages/react/src/views/CollectionEditView.tsx` — replace stub with field form implementation
- [x] Update `packages/react/src/adapter.ts` — replace `null as any` with real views
- [x] Update `packages/react/src/index.ts` — export all public components
- [x] Run `pnpm --filter @vexcms/react build` — must pass
- [x] Verify removing `views.Dashboard` from `reactAdapter` produces a TypeScript error

### File: `packages/react/src/views/DashboardView.tsx` (UPDATE)

````tsx
import type { DashboardProps } from "@vexcms/core";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { VexLink } from "../components/VexLink";

/**
 * Admin dashboard content component.
 *
 * Renders a card grid with one card per registered VexCMS collection.
 * Each card links to the collection's list view at `/admin/:slug`.
 *
 * This component renders the *content area only* — it does not include the
 * sidebar or layout shell. `NextAdminPage` in `@vexcms/next` wraps it with
 * `AdminLayout`.
 *
 * @param props - Dashboard props
 * @param props.config - The full resolved VexCMS configuration
 *
 * @example
 * ```tsx
 * <DashboardView config={vexConfig} />
 * ```
 */
export function DashboardView(props: DashboardProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.config.collections.map((collection) => (
          <VexLink
            key={collection.slug}
            href={`/admin/${collection.slug}`}
            className="block group"
          >
            <Card className="transition-shadow group-hover:shadow-md cursor-pointer">
              <CardHeader>
                <CardTitle>{collection.labels.plural}</CardTitle>
                <CardDescription>
                  Manage {collection.labels.plural.toLowerCase()}
                </CardDescription>
              </CardHeader>
            </Card>
          </VexLink>
        ))}
      </div>
    </div>
  );
}
````

### File: `packages/react/src/views/CollectionListView.tsx`

````tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionListViewProps } from "@vexcms/core";
import { Button } from "~/components/ui/button";
import { VexLink } from "~/components/ui/VexLink";

export function CollectionListView(props: CollectionListViewProps) {
  const { data: documents = [], isLoading } = useQuery({
    ...convexQuery(vexConvexApi.list, { collection: props.collection.slug }),
    initialData: props.initialData,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{props.collection.labels.plural}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<VexLink href={`/admin/${props.collection.slug}/new`} />}
        >
          + New {props.collection.labels.singular}
        </Button>
      </div>

      {documents.length === 0 && !isLoading ? (
        <div className="text-center py-12 border rounded-md text-muted-foreground">
          No {props.collection.labels.plural.toLowerCase()} yet.{" "}
          <VexLink href={`/admin/${props.collection.slug}/new`} className="text-primary hover:underline">
            Create one.
          </VexLink>
        </div>
      ) : (
        <div className="border grid place-items-center rounded-md">
          <p>add data table here. {documents.length} documents found.</p>
        </div>
      )}
    </div>
  );
}
````

> **Implementation note:** The data table is a placeholder pending a dedicated data table spec. A real TanStack Table implementation with column definitions, sorting, and pagination is planned. The `nativeButton={false}` prop is required when using Base UI's `Button` with a non-`<button>` render element (e.g., `VexLink` renders an `<a>`).

### File: `packages/react/src/views/CollectionEditView.tsx`

````tsx
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import type { ComponentType } from "react";
import { vexConvexApi } from "@vexcms/core";
import type {
  CollectionEditViewProps,
  InputComponentProps,
  AdminField,
} from "@vexcms/core";
import { TextFieldInput } from "../fields/text/Input";
import { AppForm } from "../form/AppForm";
import { VexLink } from "../components/VexLink";
import { Button } from "../components/ui/button";

/**
 * Local map from field type string to its input component.
 * Mirrors `reactAdapter.fields` — both live in `@vexcms/react`.
 * Add a new entry here whenever a new field type is added to core.
 */
const fieldInputs: Record<
  string,
  ComponentType<InputComponentProps<AdminField>>
> = {
  text: TextFieldInput as ComponentType<InputComponentProps<AdminField>>,
};

/**
 * Collection document edit form.
 *
 * Fetches the document when editing, initialises a TanStack Form instance with
 * the current field values (or empty strings for new documents), and renders an
 * `<AppForm>` containing one input component per field. Field inputs read the
 * form instance from `AppFormContext` — no controller prop needed.
 *
 * The form key in `form.defaultValues` for each field is the collection field key
 * (e.g. `"title"`, `"slug"`). Each `<InputComponent name={fieldKey} ...>` connects
 * to that key via `createFieldInput`'s `form.Field name={props.name}` call.
 *
 * **Note:** form submission (create/update mutations) is wired in a future spec.
 * For now the form renders correctly but Save is a no-op.
 *
 * @param props - View props
 * @param props.collection - The collection configuration whose fields are rendered
 * @param props.documentId - Convex ID of the document being edited (omit for new)
 * @param props.initialData - Pre-fetched document from the server (for SSR)
 *
 * @example
 * ```tsx
 * // New document
 * <CollectionEditView collection={postsCollection} />
 *
 * // Editing existing document
 * <CollectionEditView
 *   collection={postsCollection}
 *   documentId="k573abc..."
 *   initialData={serverDoc}
 * />
 * ```
 */
export function CollectionEditView(props: CollectionEditViewProps) {
  const isEditing = Boolean(props.documentId);

  const { data: document } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      collection: props.collection.slug,
      id: props.documentId ?? "",
    }),
    initialData: props.initialData,
    enabled: isEditing,
  });

  // Build defaultValues from the fetched document (or empty strings for new).
  // Keys match collection field keys — the same keys passed as `name` to each input.
  const defaultValues = Object.fromEntries(
    Object.keys(props.collection.fields).map((key) => [
      key,
      typeof document?.[key] === "string" ? document[key] : "",
    ]),
  ) as Record<string, string>;

  const form = useForm({
    defaultValues,
    onSubmit: async () => {
      // Wired in a future spec — save mutation goes here
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditing
          ? `Edit ${props.collection.labels.singular}`
          : `New ${props.collection.labels.singular}`}
      </h1>
      <AppForm form={form} className="max-w-2xl space-y-4">
        {Object.entries(props.collection.fields).map(([fieldKey, field]) => {
          const InputComponent = fieldInputs[field.type];
          if (!InputComponent) return null;
          return (
            <InputComponent
              key={fieldKey}
              name={fieldKey}
              fieldDef={field}
              readOnly={field.admin.readOnly}
            />
          );
        })}
        <div className="pt-2 flex gap-2">
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="outline"
            render={<VexLink href={`/admin/${props.collection.slug}`} />}
          >
            Cancel
          </Button>
        </div>
      </AppForm>
    </div>
  );
}
````

### File: `packages/react/src/adapter.ts` (UPDATE — replace null placeholders)

```typescript
import {
  defineFrameworkAdapter,
  type FrameworkAdapterInput,
} from "@vexcms/core";
import type { ComponentHKT } from "@vexcms/core";
import type { ComponentType } from "react";

import { TextFieldInput } from "./fields/text/Input";
import { TextFieldCell } from "./fields/text/Cell";
import { DashboardView } from "./views/DashboardView";
import { CollectionListView } from "./views/CollectionListView";
import { CollectionEditView } from "./views/CollectionEditView";

/**
 * HKT for React — maps any props type `P` to `ComponentType<P>`.
 *
 * @see {@link ComponentHKT} in `@vexcms/core`
 */
export interface ReactHKT extends ComponentHKT {
  component: ComponentType<this["_props"]>;
}

/**
 * React framework adapter for VexCMS.
 *
 * Registers all field input, cell, and view components. TypeScript enforces
 * via `ReactHKT` that every slot accepts the correct props. Adding a new
 * `AdminField` type to core automatically causes a type error here until
 * components are added for it.
 *
 * @see {@link defineFrameworkAdapter} in `@vexcms/core`
 */
export const reactAdapter: FrameworkAdapterInput<ReactHKT> =
  defineFrameworkAdapter<ReactHKT>({
    name: "react",
    version: "0.1.0-alpha.1",
    fields: { text: TextFieldInput },
    cells: { text: TextFieldCell },
    views: { Dashboard: DashboardView, CollectionListView, CollectionEditView },
  });

/** Resolved type of the React adapter, for use in consuming code. */
export type ReactAdapter = typeof reactAdapter;
```

### File: `packages/react/src/index.ts` (UPDATE)

```typescript
/**
 * @vexcms/react — React framework adapter for VexCMS.
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
export { TextFieldInput } from "./fields/text/Input";
export { TextFieldCell } from "./fields/text/Cell";

// View components
export { DashboardView } from "./views/DashboardView";
export { CollectionListView } from "./views/CollectionListView";
export { CollectionEditView } from "./views/CollectionEditView";

// Layout components
export { AdminLayout } from "./components/AdminLayout";
export type { AdminLayoutProps } from "./components/AdminLayout";
export { AppSidebar } from "./components/AppSidebar";
export type { AppSidebarProps } from "./components/AppSidebar";

// Utilities
export { cn } from "./lib/utils";

// shadcn UI primitives
export * from "./components/ui/button";
export * from "./components/ui/input";
export * from "./components/ui/label";
export * from "./components/ui/table";
export * from "./components/ui/badge";
export * from "./components/ui/card";
```

---

## Step 7: Next — `NextAdminLayout`, `NextAdminPage`, and Exports

Two components to create. Users drop exactly two files into their Next.js app:

```
app/admin/layout.tsx          → imports NextAdminLayout
app/admin/[[...slug]]/page.tsx → imports NextAdminPage
```

`NextAdminLayout` is a **client component** — it uses `usePathname()` to derive `activeSlug`
for the sidebar and passes `NextLink`/`NextImage` as framework components. It owns the
persistent shell (sidebar, all providers) and is never re-mounted on navigation.

`NextAdminPage` is an **async server component** — content only, no layout wrapper. It
routes by the `slug` array and prefetches data via `fetchQuery` for SSR.

URL routing handled by `NextAdminPage`:

- `slug = []` or undefined → `DashboardView`
- `slug = [collectionSlug]` → `CollectionListView` (with preloaded docs)
- `slug = [collectionSlug, "new"]` → `CollectionEditView` (empty form)
- `slug = [collectionSlug, documentId]` → `CollectionEditView` (preloaded doc)

- [x] Create `packages/next/src/NextAdminLayout.tsx`
- [x] Create `packages/next/src/NextAdminPage.tsx`
- [x] Create `packages/next/src/index.ts`
- [x] Run `pnpm --filter @vexcms/next build` — must pass

### File: `packages/next/src/NextAdminLayout.tsx`

Client component — uses `usePathname()` to derive `activeSlug`, injects `NextLink`/`NextImage`
as framework components, and provides the persistent admin shell. Goes in `app/admin/layout.tsx`.

````tsx
"use client";

import type { ReactNode } from "react";
import type { VexConfig } from "@vexcms/core";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import { AdminLayout } from "@vexcms/react";

/**
 * Next.js admin layout shell for VexCMS.
 *
 * A client component that wraps `AdminLayout` from `@vexcms/react` with
 * Next.js-specific wiring:
 * - Passes `NextLink` and `NextImage` as framework components so all
 *   `VexLink`/`VexImage` helpers in the admin panel use Next.js routing
 *   and image optimisation automatically.
 * - Uses `usePathname()` to derive the active collection slug for sidebar
 *   highlighting. Next.js layouts do not receive child route params, so
 *   pathname parsing is the only way to know which collection is active.
 *
 * Place this in `app/admin/layout.tsx`. It stays mounted across navigations —
 * the sidebar and all providers are never re-rendered on route changes.
 *
 * @param props - Layout props
 * @param props.config - The resolved VexCMS config from `vex.config.ts`
 * @param props.children - The page content from `[[...slug]]/page.tsx`
 *
 * @example
 * ```tsx
 * // app/admin/layout.tsx
 * import { NextAdminLayout } from "@vexcms/next";
 * import config from "../../../vex.config";
 *
 * export default function AdminLayout({ children }: { children: React.ReactNode }) {
 *   return <NextAdminLayout config={config}>{children}</NextAdminLayout>;
 * }
 * ```
 */
export function NextAdminLayout(props: {
  config: VexConfig;
  children: ReactNode;
}) {
  const pathname = usePathname();
  // pathname: "/admin", "/admin/posts", "/admin/posts/123"
  // Split on "/" and take the segment after "admin"
  const segments = pathname.split("/").filter(Boolean);
  const activeSlug = segments[1]; // undefined on /admin, "posts" on /admin/posts

  return (
    <AdminLayout
      config={props.config}
      activeSlug={activeSlug}
      components={{ Link: NextLink, Image: NextImage }}
    >
      {props.children}
    </AdminLayout>
  );
}
````

### File: `packages/next/src/NextAdminPage.tsx`

Async server component — content only, no layout wrapper. Routes by the `slug` array,
prefetches data via `fetchQuery`, passes `initialData` to view components.
Goes in `app/admin/[[...slug]]/page.tsx`.

````tsx
import { fetchQuery } from "convex/nextjs";
import { vexConvexApi } from "@vexcms/core";
import type { VexConfig } from "@vexcms/core";
import { DashboardView, CollectionListView, CollectionEditView } from "@vexcms/react";

/**
 * VexCMS admin page server component for Next.js.
 *
 * An `async` server component that routes by the `[[...slug]]` catch-all
 * params, prefetches Convex data via `fetchQuery`, and renders the correct
 * view component. Does **not** include a layout wrapper — `NextAdminLayout`
 * in `app/admin/layout.tsx` owns the persistent shell.
 *
 * **Route mapping:**
 * | `slug` array | View |
 * |---|---|
 * | `[]` or undefined | `DashboardView` |
 * | `[collectionSlug]` | `CollectionListView` with preloaded docs |
 * | `[collectionSlug, "new"]` | `CollectionEditView` (empty form) |
 * | `[collectionSlug, documentId]` | `CollectionEditView` with preloaded doc |
 *
 * @param props - Component props
 * @param props.config - The resolved VexCMS configuration from `vex.config.ts`
 * @param props.params - Next.js 15 async params `{ slug?: string[] }`
 *
 * @example
 * ```tsx
 * // app/admin/[[...slug]]/page.tsx
 * import { NextAdminPage } from "@vexcms/next";
 * import config from "../../../../vex.config";
 *
 * export default function AdminPage({
 *   params,
 * }: {
 *   params: Promise<{ slug?: string[] }>;
 * }) {
 *   return <NextAdminPage config={config} params={params} />;
 * }
 * ```
 */
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await props.params;
  const [collectionSlug, second] = slug;

  // [] — Dashboard
  if (!collectionSlug) {
    return <DashboardView config={props.config} />;
  }

  const collection = props.config.collections.find(
    (c) => c.slug === collectionSlug,
  );

  if (!collection) {
    return (
      <p className="text-muted-foreground p-6">
        Collection &quot;{collectionSlug}&quot; not found.
      </p>
    );
  }

  // [collectionSlug, "new"] — empty edit form
  if (second === "new") {
    return <CollectionEditView collection={collection} />;
  }

  // [collectionSlug, documentId] — edit form with prefetched doc
  if (second) {
    const initialData = await fetchQuery(vexConvexApi.get, {
      collection: collectionSlug,
      id: second,
    });
    return (
      <CollectionEditView
        collection={collection}
        documentId={second}
        initialData={initialData}
      />
    );
  }

  // [collectionSlug] — list view with prefetched docs
  const initialData = await fetchQuery(vexConvexApi.list, {
    collection: collectionSlug,
  });
  return <CollectionListView collection={collection} initialData={initialData} />;
}
````

### File: `packages/next/src/index.ts`

```typescript
// @vexcms/next v0.1.0-alpha.1
// Use sub-path imports to avoid mixing server and client bundles:
//   import { NextAdminPage } from "@vexcms/next/server"   ← async server component
//   import { NextAdminLayout } from "@vexcms/next/client"  ← "use client" component
export * from "./NextAdminPage";
export * from "./NextAdminLayout";
```

> **Implementation note:** `@vexcms/next` exports via sub-path entries instead of a single barrel:
> - `@vexcms/next/server` → `NextAdminPage` (async server component, no `"use client"` banner)
> - `@vexcms/next/client` → `NextAdminLayout` (client component, stamped with `"use client"`)
> This is required because tsup's global `banner` stamps ALL entries — a single entry would mark
> `NextAdminPage` as a client component, breaking Next.js RSC. The `package.json` exports field
> maps `./server` and `./client` to the corresponding dist files.

---

## Step 8: www — Admin Route and Providers

Wire the admin panel into the www Next.js app. Ensure `ConvexProvider` and
`QueryClientProvider` are set up in the layout, then create `vex.config.ts`
and the catch-all admin route.

**Note on the Convex URL:** `NextAdminPage` uses `fetchQuery` from `convex/nextjs`, which
reads `NEXT_PUBLIC_CONVEX_URL` from the environment. Ensure this is set in `.env.local`.

- [x] Create `apps/www/vex.config.ts`
- [x] Create `apps/www/app/admin/layout.tsx`
- [x] Create `apps/www/app/admin/[[...slug]]/page.tsx`
- [x] Verify `apps/www/app/layout.tsx` (or a provider file) wraps the app with `ConvexProvider` and `QueryClientProvider`
- [x] Run `pnpm dev` in `apps/www/` — server starts
- [x] Navigate to `/admin` — Dashboard renders with "Posts" card
- [x] Navigate between `/admin` and `/admin/posts` — sidebar does NOT re-mount (stays mounted in layout)
- [x] Navigate to `/admin/posts` — CollectionListView renders (empty table)
- [x] Navigate to `/admin/posts/new` — CollectionEditView renders with title/slug/excerpt inputs
- [x] Navigate to `/admin/posts/:id` — CollectionEditView renders with the document preloaded

### File: `apps/www/vex.config.ts` (NEW)

```typescript
import { defineCollection, defineConfig, text } from "@vexcms/core";

/**
 * VexCMS configuration for the www app.
 *
 * Each collection here must have a matching table in `convex/schema.ts`.
 * The CLI (future spec) will auto-generate the schema from this file.
 */
export default defineConfig({
  collections: [
    defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true, label: "Title" }),
        slug: text({
          required: true,
          label: "Slug",
          admin: { width: "half", placeholder: "url-friendly-slug" },
        }),
        excerpt: text({
          label: "Excerpt",
          admin: { description: "Short summary shown in previews" },
        }),
      },
    }),
  ],
});
```

### File: `apps/www/app/admin/layout.tsx` (NEW)

```tsx
import type { ReactNode } from "react";
import { NextAdminLayout } from "@vexcms/next/client";
import config from "../../../vex.config";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <NextAdminLayout config={config}>{children}</NextAdminLayout>;
}
```

### File: `apps/www/app/admin/[[...slug]]/page.tsx` (NEW)

```tsx
import { NextAdminPage } from "@vexcms/next/server";
import config from "../../../../vex.config";

export default function AdminPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  return <NextAdminPage config={config} params={params} />;
}
```

**ConvexProvider + QueryClientProvider:** The www app needs both providers in its root layout.
If not already set up, create or update `apps/www/app/providers.tsx`:

```tsx
"use client";

import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const convexQueryClient = useMemo(
    () => new ConvexQueryClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    [],
  );
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            queryKeyHashFn: convexQueryClient.hashFn(),
            queryFn: convexQueryClient.queryFn(),
          },
        },
      }),
    [convexQueryClient],
  );
  convexQueryClient.connect(queryClient);

  return (
    <ConvexProvider client={convexQueryClient.convexClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  );
}
```

Then in `apps/www/app/layout.tsx`, wrap `{children}` with `<Providers>`.

---

## Verification (Mandatory)

**Run each in order — fix any failure before proceeding to the next.**

- [x] `pnpm --filter @vexcms/core build` — passes with no type errors
- [x] `pnpm --filter @vexcms/core test` — all field function tests pass
- [x] `pnpm test:convex` in `apps/www/` — all 10 convex collection tests pass
- [x] `pnpm --filter @vexcms/react build` — passes with no type errors
- [x] `pnpm --filter @vexcms/next build` — passes with no type errors
- [x] Start `npx convex dev` in one terminal, `pnpm dev` in another (both in `apps/www/`)
- [x] Navigate to `/admin` — Dashboard renders with "Posts" card
- [x] Navigate to `/admin/posts` — CollectionListView renders (empty initially)
- [x] Navigate to `/admin/posts/new` — CollectionEditView renders with Title, Slug, Excerpt inputs
- [x] Create a post via the Convex dashboard — CollectionListView auto-updates with live data
- [x] Navigate to `/admin/posts/:id/edit` — CollectionEditView renders with prefetched post data
- [x] Omit `views.Dashboard` from `reactAdapter` in `adapter.ts` — TypeScript error appears
- [x] In neovim, `gd` on `@vexcms/core` import — jumps to `packages/core/src/index.ts` (not dist)

---

## Success Criteria

- [x] `defineFrameworkAdapter` requires all three views — missing any causes a build error
- [x] `CollectionListView` shows live Convex data with no loading flash (SSR `initialData`)
- [x] `CollectionEditView` renders correct input components for each field type, pre-populated when editing
- [x] `NextAdminPage` routes correctly across all four URL patterns
- [x] All convex-test tests pass for the generic collection functions
- [x] LSP source navigation (`gd`) opens `.ts` source files across packages
- [x] www admin is navigable end-to-end in the browser with Convex dev server running
