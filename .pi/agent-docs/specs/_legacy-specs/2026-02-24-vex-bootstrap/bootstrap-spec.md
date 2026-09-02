# Vex CMS Bootstrap Spec

A step-by-step guide to implement the minimum viable Vex CMS setup: config file with LSP support → admin dashboard with sidebar.

**Goal**: After completing this spec, you will have:

- A `vex.config.ts` with full IntelliSense
- An admin panel at `/admin` showing collections from config
- Hot-reload working between packages and test-app

---

## Prerequisites

Before starting:

1. Monorepo is set up with pnpm workspaces
2. Test app exists at `apps/test-app/` with `@vexcms/core` and `@vexcms/admin-next` as workspace dependencies
3. All packages have tsup configured

---

## Step 1: Fix tsconfig for bundler resolution

**File**: `packages/tsconfig/base.json`

The current config uses `NodeNext` module resolution which requires `.js` extensions on imports. Change to `bundler` resolution.

```json
{
  "$schema": "https://json-schema.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**Why**:

- `bundler` resolution allows extensionless imports (`./types` instead of `./types.js`)
- Standard for libraries built with tsup/esbuild
- Removes friction when writing TypeScript

**Verification**: `pnpm --filter @vexcms/core build` should complete without extension errors.

---

## Step 2: Implement @vexcms/core types

### File Structure

```
packages/core/src/
├── index.ts              # Main exports
├── types.ts              # All type definitions
├── config/
│   ├── defineConfig.ts
│   └── defineCollection.ts
└── fields/
    ├── index.ts
    ├── text.ts
    ├── number.ts
    ├── checkbox.ts
    └── select.ts
```

### types.ts

This file contains all TypeScript type definitions. Copy this entire file.

```typescript
// =============================================================================
// FIELD TYPES
// =============================================================================

/**
 * Branded type marker to identify VexField at runtime
 */
declare const VexFieldBrand: unique symbol;

/**
 * Base metadata shared by all field types
 */
export interface BaseFieldMeta {
  readonly type: string;
  label?: string;
  description?: string;
  required?: boolean;
  admin?: BaseAdminConfig;
}

/**
 * Admin panel configuration for fields
 */
export interface BaseAdminConfig {
  /** Hide this field in the admin UI */
  hidden?: boolean;
  /** Make this field read-only */
  readOnly?: boolean;
  /** Position in the form: main content area or sidebar */
  position?: "main" | "sidebar";
  /** Field width: full, half, or third of container */
  width?: "full" | "half";
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Helper text shown below the field */
  description?: string;
}

/**
 * Text field metadata
 */
export interface TextFieldMeta extends BaseFieldMeta {
  readonly type: "text";
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * Number field metadata
 */
export interface NumberFieldMeta extends BaseFieldMeta {
  readonly type: "number";
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Checkbox field metadata
 */
export interface CheckboxFieldMeta extends BaseFieldMeta {
  readonly type: "checkbox";
  defaultValue?: boolean;
}

/**
 * Select option type
 */
export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

/**
 * Select field metadata with typed options
 */
export interface SelectFieldMeta<
  T extends string = string,
> extends BaseFieldMeta {
  readonly type: "select";
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
}

/**
 * Union of all field metadata types
 */
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>;

/**
 * A VexField combines metadata with type information
 * The generic T represents the TypeScript type this field resolves to
 */
export interface VexField<
  T = unknown,
  TMeta extends BaseFieldMeta = BaseFieldMeta,
> {
  readonly [VexFieldBrand]: true;
  readonly _type: T;
  readonly _meta: TMeta;
}

/**
 * Extract the TypeScript type from a VexField
 */
export type InferFieldType<F> = F extends VexField<infer T, any> ? T : never;

/**
 * Extract types from a record of fields
 */
export type InferFieldsType<F extends Record<string, VexField<any, any>>> = {
  [K in keyof F]: InferFieldType<F[K]>;
};

// =============================================================================
// COLLECTION TYPES
// =============================================================================

/**
 * Collection admin configuration
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /** Group collections in sidebar under this heading */
  group?: string;
  /** Icon name or component for sidebar */
  icon?: string;
  /** Field to use as document title in lists */
  useAsTitle?: keyof TFields;
  /** Default columns shown in list view */
  defaultColumns?: (keyof TFields)[];
  /** Disable create button */
  disableCreate?: boolean;
  /** Disable delete button */
  disableDelete?: boolean;
}

/**
 * Collection configuration
 */
export interface CollectionConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /** Collection fields */
  fields: TFields;
  /** Display labels */
  labels?: {
    singular?: string;
    plural?: string;
  };
  /** Admin UI configuration */
  admin?: CollectionAdminConfig<TFields>;
}

/**
 * A defined collection with inferred document type
 */
export interface VexCollection<
  TFields extends Record<string, VexField<any, any>>,
> {
  readonly slug: string;
  readonly config: CollectionConfig<TFields>;
  /** Type helper - use `typeof collection._docType` to get document shape */
  readonly _docType: InferFieldsType<TFields>;
}

// =============================================================================
// CONFIG TYPES
// =============================================================================

/**
 * Admin panel configuration
 */
export interface AdminConfig {
  /** Base path for admin routes (default: '/admin') */
  basePath?: string;
  /** Collection slug to use for user authentication */
  user?: string;
  /** Page metadata */
  meta?: {
    titleSuffix?: string;
    favicon?: string;
  };
}

/**
 * Top-level Vex CMS configuration
 */
export interface VexConfig {
  /** Array of collection definitions */
  collections: VexCollection<any>[];
  /** Admin panel configuration */
  admin?: AdminConfig;
}

// =============================================================================
// FIELD OPTION TYPES (for builder function parameters)
// =============================================================================

/**
 * Options for text() field builder
 */
export interface TextFieldOptions {
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  admin?: BaseAdminConfig;
}

/**
 * Options for number() field builder
 */
export interface NumberFieldOptions {
  label?: string;
  description?: string;
  required?: boolean;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  admin?: BaseAdminConfig;
}

/**
 * Options for checkbox() field builder
 */
export interface CheckboxFieldOptions {
  label?: string;
  description?: string;
  defaultValue?: boolean;
  admin?: BaseAdminConfig;
}

/**
 * Options for select() field builder
 */
export interface SelectFieldOptions<T extends string> {
  label?: string;
  description?: string;
  required?: boolean;
  options: readonly SelectOption<T>[];
  defaultValue?: T;
  hasMany?: boolean;
  admin?: BaseAdminConfig;
}
```

### index.ts (core package main export)

```typescript
// Config
export { defineConfig } from "./config/defineConfig";
export { defineCollection } from "./config/defineCollection";

// Fields
export { text } from "./fields/text";
export { number } from "./fields/number";
export { checkbox } from "./fields/checkbox";
export { select } from "./fields/select";

// Types
export type {
  // Field types
  VexField,
  BaseFieldMeta,
  TextFieldMeta,
  NumberFieldMeta,
  CheckboxFieldMeta,
  SelectFieldMeta,
  SelectOption,
  InferFieldType,
  InferFieldsType,
  // Collection types
  VexCollection,
  CollectionConfig,
  CollectionAdminConfig,
  // Config types
  VexConfig,
  AdminConfig,
  // Field options
  TextFieldOptions,
  NumberFieldOptions,
  CheckboxFieldOptions,
  SelectFieldOptions,
} from "./types";
```

---

## Step 3: Implement field builder functions

### fields/index.ts

```typescript
export { text } from "./text";
export { number } from "./number";
export { checkbox } from "./checkbox";
export { select } from "./select";
```

### fields/text.ts

**Function**: `text(options?: TextFieldOptions): VexField<string, TextFieldMeta>`

**Must accomplish**:

1. Return a VexField with `_type` as `string`
2. Store all options in `_meta` with `type: 'text'`
3. Handle optional `required` flag (affects form validation, not type)
4. Handle `defaultValue` as string only

**Edge cases**:

- `minLength > maxLength`: Log warning, don't throw
- Empty string `""` should be valid even if required (different from undefined)
- `defaultValue` with `minLength`: Should warn if default is shorter than min

**Tests**: Yes - unit tests for:

- Returns correct structure
- All options are preserved in meta
- Type inference works (compile-time test with tsd)

---

### fields/number.ts

**Function**: `number(options?: NumberFieldOptions): VexField<number, NumberFieldMeta>`

**Must accomplish**:

1. Return a VexField with `_type` as `number`
2. Store all options in `_meta` with `type: 'number'`
3. Handle `min`, `max`, `step` constraints

**Edge cases**:

- `min > max`: Log warning
- `step` is only for UI stepper, not validation
- Integer vs float: Both are `number`, no distinction needed

**Tests**: Yes - same pattern as text

---

### fields/checkbox.ts

**Function**: `checkbox(options?: CheckboxFieldOptions): VexField<boolean, CheckboxFieldMeta>`

**Must accomplish**:

1. Return a VexField with `_type` as `boolean`
2. Store all options in `_meta` with `type: 'checkbox'`
3. Default `defaultValue` to `false` if not specified

**Edge cases**:

- `required` doesn't make sense for checkbox (always has a value)
- Consider omitting `required` from CheckboxFieldOptions

**Tests**: Yes - minimal

---

### fields/select.ts

**Function**: `select<T extends string>(options: SelectFieldOptions<T>): VexField<T, SelectFieldMeta<T>>`

**Must accomplish**:

1. Return a VexField with `_type` constrained to the option values
2. Generic `T` must be inferred from `options.options[].value`
3. `defaultValue` must be type-checked against `T`
4. Handle `hasMany: true` by changing return type to `VexField<T[], ...>`

**Edge cases**:

- Empty `options` array: Should be a compile-time error (required param)
- Single option: Valid, though unusual
- `hasMany: true` changes inferred type from `T` to `T[]`
- Options with duplicate values: Use first occurrence's label

**Tests**: Yes - important for type inference. Use tsd for compile-time tests.

---

## Step 4: Implement config functions

### config/defineConfig.ts

**Function**: `defineConfig(config: VexConfig): VexConfig`

**Must accomplish**:

1. Accept a VexConfig object and return it (identity function for now)
2. Provide type checking for the config structure
3. Set defaults for optional properties:
   - `admin.basePath` defaults to `'/admin'`

**Edge cases**:

- Empty `collections` array: Valid (might only have globals later)
- Duplicate collection slugs: Log warning
- No `admin.user` specified: Valid for public admin (unusual)

**Tests**: No - trivial function. Add tests when validation logic is added.

```typescript
import type { VexConfig } from "../types";

/**
 * Define the Vex CMS configuration.
 * This is the main entry point for configuring collections, globals, and admin settings.
 */
export function defineConfig(config: VexConfig): VexConfig {
  // Set defaults
  const admin = {
    basePath: "/admin",
    ...config.admin,
  };

  // Optional: Warn about duplicate collection slugs in development
  if (process.env.NODE_ENV !== "production") {
    const slugs = config.collections.map((c) => c.slug);
    const duplicates = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
    if (duplicates.length > 0) {
      console.warn(
        `[vex] Duplicate collection slugs detected: ${duplicates.join(", ")}`
      );
    }
  }

  return {
    ...config,
    admin,
  };
}
```

---

### config/defineCollection.ts

**Function**: `defineCollection<TFields>(slug: string, config: CollectionConfig<TFields>): VexCollection<TFields>`

**Must accomplish**:

1. Accept slug string and collection config separately (not a VexCollection)
2. Return VexCollection with `_docType` for type inference
3. Preserve full generic type information for fields
4. The `_docType` is a phantom type - its runtime value is `{}` but TypeScript infers the shape

**Edge cases**:

- Slug must be valid identifier (lowercase, no spaces, alphanumeric + underscore)
- Slug must not start with underscore (reserved for system)
- Slug must not be `vex_*` (reserved prefix)
- Empty `fields` object: Log warning

**Tests**: Yes - test slug validation, type inference

```typescript
import type {
  CollectionConfig,
  InferFieldsType,
  VexCollection,
  VexField,
} from "../types";

/**
 * Define a collection with typed fields.
 *
 * @param slug - The collection identifier (used in URLs and database)
 * @param config - Collection configuration including fields and admin options
 * @returns A VexCollection with inferred document type
 *
 * @example
 * const posts = defineCollection('posts', {
 *   labels: { singular: 'Post', plural: 'Posts' },
 *   fields: {
 *     title: text({ label: 'Title', required: true }),
 *     status: select({ options: [...] }),
 *   },
 * });
 *
 * // Type inference works:
 * type Post = typeof posts._docType;
 * // Post = { title: string; status: "draft" | "published" }
 */
export function defineCollection<
  TFields extends Record<string, VexField<any, any>>,
>(slug: string, config: CollectionConfig<TFields>): VexCollection<TFields> {
  // Optional: Validate slug in development
  if (process.env.NODE_ENV !== "production") {
    // Must be lowercase alphanumeric with underscores
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      console.warn(
        `[vex] Collection slug "${slug}" should be lowercase alphanumeric with underscores, starting with a letter`
      );
    }

    // Must not use reserved prefix
    if (slug.startsWith("vex_")) {
      console.warn(
        `[vex] Collection slug "${slug}" uses reserved prefix "vex_"`
      );
    }

    // Warn about empty fields
    if (Object.keys(config.fields).length === 0) {
      console.warn(`[vex] Collection "${slug}" has no fields defined`);
    }
  }

  return {
    slug,
    config,
    // _docType is a phantom type for inference only
    // Runtime value is empty object, but TypeScript sees InferFieldsType<TFields>
    _docType: {} as InferFieldsType<TFields>,
  };
}
```

**Key points about `_docType`:**

The `_docType` property enables type inference for your documents:

```typescript
const posts = defineCollection('posts', {
  fields: {
    title: text({ required: true }),
    views: number({ defaultValue: 0 }),
  },
});

// Extract the document type
type Post = typeof posts._docType;
// Post = { title: string; views: number }

// Use in your code
function renderPost(post: Post) {
  return post.title; // ✅ TypeScript knows this is a string
}
```

The runtime value `{}` is never used - it's purely for TypeScript's type system.

---

## Step 5: Implement @vexcms/ui components

### File Structure

```
packages/ui/src/
├── index.ts
└── layout/
    ├── Layout.tsx
    └── Header.tsx
```

### index.ts

```typescript
export { Layout } from "./layout/Layout";
export { Header } from "./layout/Header";
```

### layout/Layout.tsx

A flex container component for the admin shell.

**Must accomplish**:

1. Render a full-height flex container
2. Accept `children` prop
3. Use minimal Tailwind classes for layout

```tsx
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {children}
    </div>
  );
}
```

**Tests**: No - pure presentational component

---

### layout/Header.tsx

Top bar component for the admin panel.

**Must accomplish**:

1. Render a header bar with title
2. Accept optional `title` prop

```tsx
interface HeaderProps {
  title?: string;
}

export function Header({ title = "Vex Admin" }: HeaderProps) {
  return (
    <header className="flex h-14 items-center border-b border-border px-6">
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
```

**Tests**: No - pure presentational component

---

## Step 6: Implement @vexcms/admin-next components

### File Structure

```
packages/admin-next/src/
├── index.ts
├── components/
│   ├── AdminPage.tsx
│   └── Sidebar.tsx
└── views/
    ├── DashboardView.tsx
    └── NotFoundView.tsx
```

### index.ts

```typescript
// Components
export { AdminPage } from "./components/AdminPage";
export { Sidebar } from "./components/Sidebar";

// Re-export from ui
export { Layout, Header } from "@vexcms/ui";
```

### components/Sidebar.tsx

Navigation sidebar using Next.js routing.

**Must accomplish**:

1. Accept `config: VexConfig` prop
2. Render navigation links for each collection
3. Use `next/link` for navigation
4. Use `usePathname` to highlight active link
5. Show dashboard link at top

**Edge cases**:

- Collection without `labels.plural`: Use `slug` capitalized
- Very long collection names: Truncate with ellipsis
- Many collections: Consider scroll area (future)

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { VexConfig } from "@vexcms/core";

interface SidebarProps {
  config: VexConfig;
}

export function Sidebar({ config }: SidebarProps) {
  const pathname = usePathname();
  const basePath = config.admin?.basePath ?? "/admin";

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="font-semibold">Vex CMS</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <Link
          href={basePath}
          className={`block rounded-md px-3 py-2 text-sm ${
            pathname === basePath
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          }`}
        >
          Dashboard
        </Link>

        {config.collections.map((collection) => {
          const href = `${basePath}/${collection.slug}`;
          const isActive = pathname.startsWith(href);
          const label =
            collection.config.labels?.plural ??
            collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1);

          return (
            <Link
              key={collection.slug}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

**Tests**: No for now - integration test later

---

### components/AdminPage.tsx

Runtime router component that renders the appropriate view based on path.

**Must accomplish**:

1. Accept `config: VexConfig` and `path?: string[]` props
2. Parse path to determine view:
   - No path → Dashboard
   - `[slug]` → Collection list (placeholder for now)
   - `[slug, id]` → Document edit (placeholder for now)
3. Handle unknown slugs with NotFound view

```tsx
"use client";

import type { VexConfig } from "@vexcms/core";
import { DashboardView } from "../views/DashboardView";
import { NotFoundView } from "../views/NotFoundView";

interface AdminPageProps {
  config: VexConfig;
  path?: string[];
}

export function AdminPage({ config, path = [] }: AdminPageProps) {
  const [collectionSlug, documentId] = path;

  // Dashboard
  if (!collectionSlug) {
    return <DashboardView config={config} />;
  }

  // Find collection
  const collection = config.collections.find((c) => c.slug === collectionSlug);
  if (!collection) {
    return <NotFoundView />;
  }

  // TODO: Implement collection list and document edit views
  // For now, show a placeholder
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        {collection.config.labels?.plural ?? collection.slug}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {documentId
          ? `Editing document: ${documentId}`
          : "Collection list view coming soon"}
      </p>
    </div>
  );
}
```

**Tests**: Yes - test routing logic

---

### views/DashboardView.tsx

Dashboard showing collection cards.

**Must accomplish**:

1. Accept `config: VexConfig` prop
2. Render a grid of collection cards
3. Each card links to collection list
4. Show collection label and field count

```tsx
import Link from "next/link";
import type { VexConfig } from "@vexcms/core";

interface DashboardViewProps {
  config: VexConfig;
}

export function DashboardView({ config }: DashboardViewProps) {
  const basePath = config.admin?.basePath ?? "/admin";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to Vex CMS</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.collections.map((collection) => {
          const fieldCount = Object.keys(collection.config.fields).length;
          const label =
            collection.config.labels?.plural ??
            collection.slug.charAt(0).toUpperCase() + collection.slug.slice(1);

          return (
            <Link
              key={collection.slug}
              href={`${basePath}/${collection.slug}`}
              className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
            >
              <h2 className="font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fieldCount} {fieldCount === 1 ? "field" : "fields"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

**Tests**: No - presentational

---

### views/NotFoundView.tsx

404 view for unknown routes.

```tsx
import Link from "next/link";

export function NotFoundView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/admin"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
```

**Tests**: No - presentational

---

## Step 7: Create vex.config.ts in test-app

**File**: `apps/test-app/vex.config.ts`

```typescript
import {
  defineConfig,
  defineCollection,
  text,
  number,
  checkbox,
  select,
} from "@vexcms/core";

// =============================================================================
// COLLECTIONS
// =============================================================================

const posts = defineCollection("posts", {
  labels: {
    singular: "Post",
    plural: "Posts",
  },
  fields: {
    title: text({
      label: "Title",
      required: true,
      maxLength: 200,
    }),
    slug: text({
      label: "Slug",
      required: true,
      admin: {
        description: "URL-friendly identifier",
      },
    }),
    status: select({
      label: "Status",
      required: true,
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "archived", label: "Archived" },
      ],
      defaultValue: "draft",
    }),
    featured: checkbox({
      label: "Featured",
      defaultValue: false,
    }),
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "status", "featured"],
    group: "Content",
  },
});

const users = defineCollection("users", {
  labels: {
    singular: "User",
    plural: "Users",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    email: text({
      label: "Email",
      required: true,
    }),
    role: select({
      label: "Role",
      required: true,
      options: [
        { value: "admin", label: "Admin" },
        { value: "editor", label: "Editor" },
        { value: "author", label: "Author" },
      ],
      defaultValue: "author",
    }),
    postCount: number({
      label: "Post Count",
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
      },
    }),
  },
  admin: {
    useAsTitle: "name",
    group: "Admin",
  },
});

const categories = defineCollection("categories", {
  labels: {
    singular: "Category",
    plural: "Categories",
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
    }),
    slug: text({
      label: "Slug",
      required: true,
    }),
    sortOrder: number({
      label: "Sort Order",
      defaultValue: 0,
    }),
  },
  admin: {
    useAsTitle: "name",
    group: "Content",
  },
});

// =============================================================================
// CONFIG
// =============================================================================

export default defineConfig({
  collections: [posts, users, categories],
  admin: {
    basePath: "/admin",
    meta: {
      titleSuffix: " | Vex CMS",
    },
  },
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Post = typeof posts._docType;
export type User = typeof users._docType;
export type Category = typeof categories._docType;
```

---

## Step 8: Create admin routes in test-app

### File: `apps/test-app/src/app/admin/layout.tsx`

```tsx
import { Layout, Sidebar } from "@vexcms/admin-next";
import config from "../../../vex.config";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <Sidebar config={config} />
      <main className="flex-1 overflow-auto">{children}</main>
    </Layout>
  );
}
```

### File: `apps/test-app/src/app/admin/[[...path]]/page.tsx`

```tsx
import { AdminPage } from "@vexcms/admin-next";
import config from "../../../../vex.config";

interface Props {
  params: Promise<{ path?: string[] }>;
}

export default async function Page({ params }: Props) {
  const { path } = await params;
  return <AdminPage config={config} path={path} />;
}
```

---

## Step 9: Verify tsup configs

Ensure each package has the correct tsup configuration.

### packages/core/tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

### packages/ui/tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
});
```

### packages/admin-next/tsup.config.ts

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
  banner: {
    js: '"use client";',
  },
});
```

---

## Verification Checklist

After completing all steps:

### Build Verification

- [ ] `pnpm build` completes without errors
- [ ] `packages/core/dist/` contains `index.js` and `index.d.ts`
- [ ] `packages/ui/dist/` contains `index.js` and `index.d.ts`
- [ ] `packages/admin-next/dist/` contains `index.js` and `index.d.ts`

### Type Verification

- [ ] Open `apps/test-app/vex.config.ts` in VS Code
- [ ] `text({})` shows autocomplete for options
- [ ] `select({ options: [...] })` constrains `defaultValue` type
- [ ] `posts._docType` shows correct inferred type
- [ ] Hover over `defineConfig` shows VexConfig type

### Runtime Verification

- [ ] `pnpm dev` starts without errors
- [ ] Navigate to `http://localhost:3010/admin`
- [ ] Dashboard shows "Posts", "Users", "Categories" cards
- [ ] Sidebar shows navigation links
- [ ] Clicking collection name shows placeholder view
- [ ] Unknown path shows 404 page

### Hot-Reload Verification

- [ ] Edit `vex.config.ts` - add new collection
- [ ] Save file
- [ ] Sidebar updates without full page refresh
- [ ] New collection appears in dashboard

---

## Common Issues

### "Cannot find module '@vexcms/core'"

**Cause**: Package not built
**Fix**: Run `pnpm build` from root

### "Relative import paths need explicit file extensions"

**Cause**: tsconfig using `NodeNext` resolution
**Fix**: Complete Step 1 (fix base.json)

### Sidebar not updating on config change

**Cause**: Config imported at build time, not runtime
**Fix**: This is expected behavior. Changes require page refresh or Fast Refresh.

### Type inference not working for `_docType`

**Cause**: Generic type not preserved through defineCollection
**Fix**: Ensure VexCollection generic is properly constrained

### "use client" directive errors

**Cause**: Client components imported in server context
**Fix**: Ensure admin-next tsup config has banner with "use client"

---

## Next Steps

After completing this spec, proceed to:

1. **06-convex-integration-spec.md** - Add Convex schema generation and CRUD handlers
2. **05-schema-field-system-spec.md** - Add complex field types (relationship, array, group, blocks)
3. **03-admin-shell-spec.md** - Add authentication and user management
