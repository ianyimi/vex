# ✅ COMPLETED 2026-04-24

# Spec 21 — Module Augmentation for Type-Safe Collection Slugs

**Status:** Complete  
**Depends on:** Spec 20 (field types), existing `generateVexTypes` in `packages/core`

---

## Overview

Four related changes shipped together:

0. **Dependency catalog audit** — centralize all duplicated and version-drifted dependencies into the pnpm workspace catalog so every package pins to the same version. Resolve version mismatches. Update all `package.json` files to use `catalog:` references.

1. **Per-package ESLint configs** — `@vexcms/react` and `@vexcms/next` currently rely on the root `eslint.config.mjs`, which uses `js.configs.recommended` without browser globals. The browser globals issue is ESLint-only — `@vexcms/tsconfig/react-library.json` already includes `DOM` and `DOM.Iterable`, so TypeScript knows about `console`, `setTimeout`, etc. The fix is giving each package its own `eslint.config.mjs`: `@vexcms/react` extends a Vite React config, `@vexcms/next` extends the same config as the `www` app. The root config is updated to exclude these two packages.

2. **Module augmentation** — add a `GeneratedVexTypes` interface to `@vexcms/core` that `vex generate` augments via `declare module`. `CollectionSlug` and `DocumentBySlug` automatically narrow to the user's actual collections after generation with zero config changes from the user.

3. **`useCollectionForm` generic props** — once `DocumentBySlug` exists, `useCollectionForm` can infer the correct document type from the collection passed in, making the `document` prop and `collection` prop type-safe per-collection.

---

## Design Decisions

1. **Per-package ESLint configs, not a root patch.** The browser globals issue is ESLint-only — `@vexcms/tsconfig/react-library.json` already has `DOM` and `DOM.Iterable` so TypeScript is fine. Each package gets its own `eslint.config.mjs` rather than a band-aid on the root config. The root config gains an `ignores` entry for these two packages so they are not double-processed.

2. **`GeneratedVexTypes` is an empty interface with conditional fallbacks.** `CollectionSlug` falls back to `string` and `DocumentBySlug` falls back to `Record<string, unknown>` when empty. No breaking change on first install.

3. **`RelationshipFieldInput<TSlug extends CollectionSlug>` stays generic.** The literal `"posts"` is preserved through to `RelationshipField<"posts">`, which future validator/schema generators need to emit `v.id("posts")` from the field definition directly.

4. **Generated file keeps plain exports AND adds augmentation.** `vex.types.ts` continues to export `CollectionSlug` and `DocumentBySlug` as plain types AND appends `declare module '@vexcms/core'`. No breaking change for existing imports.

5. **Only `CollectionSlug` and `DocumentBySlug` in the augmentation.** `TitleFieldBySlug` and `FieldSlugByCollection` are deferred — nothing currently consumes them.

6. **Existing generics on `defineCollection` are kept.** The `TSlug`/`TFieldSlug` generics give write-time `useAsTitle` validation within a single call. Augmentation gives cross-file validation after generation. Complementary, not redundant.

7. **`useCollectionForm` types the props, not the full form internals.** Making the form's `TFormData` fully typed would require making `getCollectionDefaultValues` generic too (it currently returns `Record<string, unknown>`). That is a separate spec. This spec scopes the change to `collection` and `document` prop typing only, keeping `FormOptions<any>` for the form internals.

8. **No `declare module` block when there are no collections.** The conditional fallbacks in `generated-types.ts` handle the empty case correctly without emitting an empty augmentation block.

---

## Out of Scope

- `TitleFieldBySlug` and `FieldSlugByCollection` augmentation
- Removing generics from `defineCollection` or `CollectionConfig`
- Making `getCollectionDefaultValues` generic (typed `defaultValues`)
- Making the full `FormOptions<TFormData>` type-safe (typed `onSubmit` value)
- `relationship/config.ts`, `validator.ts`, `inputSchema.ts`
- Any admin UI components
- ESLint config for any package other than `@vexcms/react` and `@vexcms/next`
- Any tsconfig changes — `DOM` lib is already present in `@vexcms/tsconfig/react-library.json`
- Single-use dependencies (only appear in one package) — no catalog benefit

---

## Target Directory Structure

```
pnpm-workspace.yaml               ← MODIFIED — new catalog entries for all shared deps
package.json                      ← MODIFIED — switch ESLint devDeps to catalog:
apps/www/package.json             ← MODIFIED — switch all eligible deps to catalog:
packages/*/package.json           ← MODIFIED — switch all eligible deps to catalog:

packages/core/src/
  generated-types.ts              ← NEW — GeneratedVexTypes, CollectionSlug, DocumentBySlug
  index.ts                        ← MODIFIED — add export for generated-types
  types/
    generateVexTypes.ts           ← MODIFIED — append declare module block to output
    generateVexTypes.test.ts      ← MODIFIED — add tests for declare module output
                                     (rename from genetateVexTypes.test.ts — fix the typo)
  fields/
    relationship/
      types.ts                    ← MODIFIED — TSlug extends CollectionSlug = CollectionSlug

packages/react/
  eslint.config.mjs               ← NEW — Vite React ESLint config (react, react-hooks, globals)
  src/
    hooks/
      useCollectionForm.ts        ← MODIFIED — generic TSlug, typed collection + document props

packages/next/
  eslint.config.mjs               ← NEW — mirrors www app ESLint config (next/core-web-vitals, typescript-eslint)

eslint.config.mjs                 ← MODIFIED — ignore packages/react and packages/next
```

---

## Implementation Order

> **Key:**
>
> - `[agent]` — Boilerplate or pattern-following; agent generates this
> - `[dev]` — Important custom implementation; dev implements this

1. `[agent]` **Step 1** — Baseline verification
2. `[dev]` **Step 2** — Dependency catalog audit: centralize all shared deps, resolve mismatches
3. `[dev]` **Step 3** — Per-package ESLint: `@vexcms/react` and `@vexcms/next` local configs; update root ignores
4. `[agent]` **Step 4** — `generated-types.ts`: `GeneratedVexTypes`, `CollectionSlug`, `DocumentBySlug`
5. `[agent]` **Step 5** — `index.ts`: export from `generated-types`
6. `[agent]` **Step 6** — `relationship/types.ts`: constrain `TSlug` to `CollectionSlug`; ensure `RelationshipField<string>` is in `AdminField` union
7. `[dev]` **Step 7** — `generateVexTypes.ts`: emit `declare module` block; add tests
8. `[dev]` **Step 8** — `useCollectionForm.ts`: generic `TSlug`, typed props

---

## Step 1: Baseline Verification

- [ ] Run `pnpm test --filter @vexcms/core` — note any pre-existing failures
- [ ] Run `pnpm build --filter @vexcms/core` — build succeeds
- [ ] Note the `console`/`setTimeout` ESLint squiggles in `CollectionEditView.tsx` — confirm they disappear after Step 2

---

## Step 2: Dependency Catalog Audit

Centralize all shared dependencies into `pnpm-workspace.yaml` so every package references the same version.

- [ ] Add all new and updated catalog entries to `pnpm-workspace.yaml` (see below)
- [ ] Update `package.json` in every affected package to use `catalog:`
- [ ] Run `pnpm install` to sync the lockfile
- [ ] Run `pnpm build` to verify nothing broke

### Version decisions (resolved)

| Package                | Decision                         | Impact                                                                                                                                                                            |
| ---------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `zod`                  | **v4** (`^4.3.6`)                | `packages/react` and `packages/next` peerDeps upgrade from `^3.24.0` → `^4.3.6`. Check for any v3 API usage in those packages.                                                    |
| `@tanstack/react-form` | **v1** (`^1.27.7`, www version)  | `packages/react` and `packages/next` upgrade from `^0.40.0` → `^1.27.7`. **Breaking change** — review the form API usage in `useCollectionForm` and field inputs after upgrading. |
| `better-auth`          | **`^1.5.0`** (www version)       | Catalog entry updated from `>=1.4.9 <1.5.0`. `packages/better-auth` peerDep updated to match.                                                                                     |
| `@types/node`          | **v20** (`^20`)                  | `packages/react` and `packages/cli` downgrade from `^25.5.0` → `^20`.                                                                                                             |
| `lucide-react`         | **catalog version** (`^0.577.0`) | `apps/www` upgrades from `^0.562.0`. Check for any removed/renamed icons.                                                                                                         |

### Complete `pnpm-workspace.yaml` catalog block after this step

Full updated catalog — replace the existing `catalog:` block entirely:

```yaml
catalog:
  # Convex
  "@convex-dev/react-query": ^0.1.0
  convex: ^1.31.5

  # Auth
  better-auth: ^1.5.0

  # React
  react: ^19.2.4
  react-dom: ^19.2.4
  next: ^16.2.1
  nuqs: ^2.8.8

  # Types
  "@types/react": ^19.2.14
  "@types/react-dom": ^19.2.0
  "@types/node": ^20

  # TanStack
  "@tanstack/react-form": ^1.27.7
  "@tanstack/react-query": ^5.90.17
  "@tanstack/react-table": 8.21.3

  # UI utilities
  class-variance-authority: "0.7.1"
  clsx: "2.1.1"
  lucide-react: ^0.577.0
  tailwind-merge: "3.5.0"
  tailwindcss: ^4.2.1

  # Data
  zod: ^4.3.6

  # Testing
  "@playwright/test": ^1.58.0
  "@testing-library/dom": ^10.5.0
  "@testing-library/react": ^16.3.0
  "@vitest/coverage-v8": ^4.0.18
  jsdom: ^26.1.0
  playwright: ^1.58.0
  vitest: ^4.0.18

  # Tooling
  prettier: ^3.8.1
  tsup: ^8.5.1
  typescript: ^5.9.3

  # ESLint core
  "@eslint/eslintrc": ^3.3.3
  "@eslint/js": ^9.0.0
  eslint: ^9.0.0

  # TypeScript ESLint
  "@typescript-eslint/eslint-plugin": ^8.0.0
  "@typescript-eslint/parser": ^8.0.0
  typescript-eslint: ^8.53.0

  # ESLint plugins
  eslint-config-next: "15.5.9"
  eslint-plugin-import-x: ^4.16.1
  eslint-plugin-jsdoc: ^50.0.0
  eslint-plugin-perfectionist: ^5.3.1
  eslint-plugin-react: ^7.37.0
  eslint-plugin-react-hooks: ^7.0.1
  eslint-plugin-react-refresh: ^0.4.0
  globals: ^14.0.0
```

### Per-package `package.json` updates

Every non-`catalog:`, non-`workspace:` entry that has a catalog equivalent. Apply all of these.

**`package.json` (root)** — devDependencies

```
@eslint/js              ^9.0.0        →  catalog:
@typescript-eslint/eslint-plugin  ^8.0.0  →  catalog:
@typescript-eslint/parser  ^8.0.0    →  catalog:
eslint                  ^9.0.0        →  catalog:
eslint-plugin-jsdoc     ^50.0.0       →  catalog:
```

**`apps/www/package.json`** — dependencies

```
@convex-dev/react-query  ^0.1.0       →  catalog:
@tanstack/react-form     ^1.27.7      →  catalog:
@tanstack/react-query    ^5.90.17     →  catalog:
better-auth              ^1.5.0       →  catalog:
class-variance-authority ^0.7.1       →  catalog:
clsx                     ^2.1.1       →  catalog:
lucide-react             ^0.562.0     →  catalog:  (upgrades to ^0.577.0)
tailwind-merge           ^3.4.0       →  catalog:
zod                      ^4.3.5       →  catalog:
```

**`apps/www/package.json`** — devDependencies

```
@eslint/eslintrc         ^3.3.3       →  catalog:
@types/node              ^20          →  catalog:
@types/react             ^19          →  catalog:
@types/react-dom         ^19          →  catalog:
eslint                   ^9           →  catalog:
eslint-config-next       15.5.9       →  catalog:
eslint-plugin-import-x   ^4.16.1      →  catalog:
eslint-plugin-perfectionist ^5.3.1    →  catalog:
eslint-plugin-react-hooks ^7.0.1      →  catalog:
prettier                 ^3.4.2       →  catalog:
tailwindcss              ^4           →  catalog:
typescript               ^5           →  catalog:
typescript-eslint        ^8.53.0      →  catalog:
```

**`packages/react/package.json`** — dependencies

```
@tanstack/react-form     ^0.40.0      →  catalog:  (upgrades to ^1.27.7 — breaking)
class-variance-authority 0.7.1        →  catalog:
clsx                     2.1.1        →  catalog:
tailwind-merge           3.5.0        →  catalog:
zod                      ^3.24.0      →  catalog:  (upgrades to ^4.3.6 — breaking, peerDep)
```

**`packages/react/package.json`** — devDependencies

```
@types/node              ^25.5.0      →  catalog:  (downgrades to ^20)
```

**`packages/next/package.json`** — devDependencies and peerDependencies

```
@tanstack/react-form     ^0.40.0      →  catalog:  (upgrades to ^1.27.7 — both devDep and peerDep)
zod                      ^3.24.0      →  catalog:  (upgrades to ^4.3.6 — peerDep)
```

**`packages/core/package.json`** — dependencies and devDependencies

```
zod                      ^4.3.6       →  catalog:
@types/node              ^20.19.33    →  catalog:
```

**`packages/cli/package.json`** — devDependencies

```
@types/node              ^25.5.0      →  catalog:  (downgrades to ^20)
```

**`packages/create-vexcms/package.json`** — devDependencies

```
tsup                     ^8.5.0       →  catalog:
```

**`packages/better-auth/package.json`** — peerDependencies

```
better-auth              >=1.4.9 <1.5.0  →  ^1.5.0  (direct value, not catalog — peerDeps stay loose)
```

---

## Step 3: Per-Package ESLint Configs

> **Previously Step 2.** Now proceeds after catalog is settled so devDependency entries use `catalog:`.

All ESLint-related packages are currently scattered with explicit versions across the root `package.json`, `apps/www/package.json`, and the new per-package configs. Before creating any config files, centralize them all in the pnpm workspace catalog so every package pins to the same version.

- [ ] Add all ESLint packages to the `catalog:` block in `pnpm-workspace.yaml`
- [ ] Update root `package.json` devDependencies to reference `catalog:`
- [ ] Update `apps/www/package.json` devDependencies to reference `catalog:`
- [ ] Add devDependencies to `packages/react/package.json` using `catalog:`
- [ ] Add devDependencies to `packages/next/package.json` using `catalog:`
- [ ] Run `pnpm install` to sync the lockfile
- [ ] Create `packages/react/eslint.config.mjs`
- [ ] Create `packages/next/eslint.config.mjs`
- [ ] Add `packages/react` and `packages/next` to the root `eslint.config.mjs` ignores
- [ ] Verify `console`/`setTimeout` squiggles are gone from `CollectionEditView.tsx`

### Catalog entries to add to `pnpm-workspace.yaml`

```yaml
# ESLint core
"@eslint/js": "^9.0.0"
"@eslint/eslintrc": "^3.3.3"
eslint: "^9.0.0"

# TypeScript ESLint — both the legacy separate packages (used by root config)
# and the unified package (used by react/next/www configs)
"@typescript-eslint/eslint-plugin": "^8.0.0"
"@typescript-eslint/parser": "^8.0.0"
typescript-eslint: "^8.53.0"

# ESLint plugins
globals: "^14.0.0"
eslint-config-next: "15.5.9"
eslint-plugin-import-x: "^4.16.1"
eslint-plugin-jsdoc: "^50.0.0"
eslint-plugin-perfectionist: "^5.3.1"
eslint-plugin-react: "^7.37.0"
eslint-plugin-react-hooks: "^7.0.1"
eslint-plugin-react-refresh: "^0.4.0"
```

### Root `package.json` — switch to `catalog:`

Replace the existing ESLint devDependencies with catalog references:

```json
"@eslint/js": "catalog:",
"@typescript-eslint/eslint-plugin": "catalog:",
"@typescript-eslint/parser": "catalog:",
"eslint": "catalog:",
"eslint-plugin-jsdoc": "catalog:"
```

### `apps/www/package.json` — switch to `catalog:`

Replace the existing ESLint devDependencies with catalog references:

```json
"@eslint/eslintrc": "catalog:",
"eslint": "catalog:",
"eslint-config-next": "catalog:",
"eslint-plugin-import-x": "catalog:",
"eslint-plugin-perfectionist": "catalog:",
"eslint-plugin-react-hooks": "catalog:",
"typescript-eslint": "catalog:"
```

### `packages/react/package.json` — devDependencies to add

```json
"eslint": "catalog:",
"globals": "catalog:",
"typescript-eslint": "catalog:",
"eslint-plugin-react": "catalog:",
"eslint-plugin-react-hooks": "catalog:",
"eslint-plugin-react-refresh": "catalog:",
"eslint-plugin-jsdoc": "catalog:"
```

### `packages/next/package.json` — devDependencies to add

```json
"eslint": "catalog:",
"globals": "catalog:",
"@eslint/eslintrc": "catalog:",
"eslint-config-next": "catalog:",
"eslint-plugin-import-x": "catalog:",
"eslint-plugin-perfectionist": "catalog:",
"eslint-plugin-react-hooks": "catalog:",
"typescript-eslint": "catalog:"
```

### `packages/react/eslint.config.mjs`

Standard Vite + React + TypeScript config with browser globals. Preserves the JSDoc rules from the root config since `@vexcms/react` is a published library.

```js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactRefreshPlugin from "eslint-plugin-react-refresh";
import jsdocPlugin from "eslint-plugin-jsdoc";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "react-refresh": reactRefreshPlugin,
      jsdoc: jsdocPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        project: "./tsconfig.check.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react/react-in-jsx-scope": "off", // not needed with React 17+ JSX transform

      // TypeScript — no-undef is redundant when TypeScript is checking types
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "warn",

      // JSDoc — same enforcement as root config (this is a published library)
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          contexts: [
            "ExportNamedDeclaration > FunctionDeclaration",
            "ExportDefaultDeclaration > FunctionDeclaration",
            "ExportNamedDeclaration > VariableDeclaration",
            "ExportNamedDeclaration > TSTypeAliasDeclaration",
            "ExportNamedDeclaration > TSInterfaceDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": ["error", { contexts: ["any"] }],
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    // Standard shadcn/base UI primitives — no JSDoc required
    files: ["src/components/ui/**/*.ts", "src/components/ui/**/*.tsx"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
    },
  },
);
```

### `packages/next/eslint.config.mjs`

Direct adaptation of `apps/www/eslint.config.mjs`. Changes from www:

- `@convex-dev/eslint-plugin` removed (no convex code in this package)
- `parserOptions.project` points to `./tsconfig.json` (not `./tsconfig.check.json` — the check config resets path aliases, breaking type-aware resolution of `@vexcms/core` and `@vexcms/react`)
- `globals.browser` added explicitly (not guaranteed by FlatCompat)
- Ignores trimmed to library-appropriate entries (no `.next`, `.sst`, `public/`, `convex/_generated/`)

```js
import { FlatCompat } from "@eslint/eslintrc";
import importX from "eslint-plugin-import-x";
import perfectionist from "eslint-plugin-perfectionist";
import globals from "globals";
import tseslint from "typescript-eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [
      "**/.temp",
      "**/.git",
      "**/.hg",
      "**/.pnp.*",
      "**/.svn",
      "**/.yarn/",
      "**/build/",
      "**/dist/",
      "**/node_modules/",
      "**/temp/",
      "**/tsconfig.tsbuildinfo",
      "**/README.md",
      "**/eslint.config.js",
      "**/vitest.config.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  perfectionist.configs["recommended-natural"],
  {
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "import-x": importX,
    },
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/ban-tslint-comment": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^(_|ignore)",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/unbound-method": "off",

      curly: ["warn", "all"],
      "import-x/no-duplicates": "warn",
      "import-x/prefer-default-export": "off",
      "no-console": "off",
      "no-restricted-exports": "off",
      "no-underscore-dangle": "off",
      "no-useless-escape": "warn",

      "object-shorthand": "warn",

      "perfectionist/sort-imports": "warn",
      "perfectionist/sort-interfaces": "warn",
      "perfectionist/sort-intersection-types": "warn",
      "perfectionist/sort-jsx-props": "warn",
      "perfectionist/sort-modules": "warn",
      "perfectionist/sort-named-imports": "warn",
      "perfectionist/sort-object-types": "warn",
      "perfectionist/sort-objects": [
        "off",
        {
          customGroups: [
            {
              elementNamePattern: "^(_id|id|name|slug|type)$",
              groupName: "top",
            },
          ],
          groups: ["top", "unknown"],
          order: "asc",
          partitionByComment: true,
          partitionByNewLine: true,
          type: "natural",
        },
      ],
      "perfectionist/sort-switch-case": "off",
      "perfectionist/sort-union-types": "warn",
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaVersion: "latest",
        project: "./tsconfig.json",
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    settings: {
      _internalSilentUse: true,
    },
  },
);
```

### Root `eslint.config.mjs` — add ignores

Add these to the top-level `ignores` so the root config stops covering these packages:

```js
"packages/react/**",
"packages/next/**",
```

---

## Step 4: `generated-types.ts`

Create this file. It is pure TypeScript type declarations — no runtime code.

- [ ] Create `packages/core/src/generated-types.ts` with the content below
- [ ] Run `pnpm build --filter @vexcms/core` — no type errors

````typescript
/**
 * Empty interface augmented by the generated `vex.types.ts` file.
 *
 * When `vex generate` has been run, this interface gains two properties:
 * - `CollectionSlug` — the specific union of collection slugs in the project
 * - `DocumentBySlug` — a map of slug → document interface
 *
 * When empty (before generation), all derived types fall back to their widest
 * safe variants (`string`, `Record<string, unknown>`).
 *
 * @remarks
 * Do not populate this interface manually. It is populated by the
 * `declare module '@vexcms/core'` block emitted at the bottom of
 * the generated `vex.types.ts` file.
 *
 * @example
 * ```ts
 * // After running `vex generate`, this interface is augmented to:
 * interface GeneratedVexTypes {
 *   CollectionSlug: "posts" | "authors"
 *   DocumentBySlug: { posts: PostsDocument; authors: AuthorsDocument }
 * }
 */
export interface GeneratedVexTypes {}

/**
 * Union of all collection slugs registered in this project's VexCMS config.
 *
 * - **Before `vex generate`:** resolves to `string` — any string is accepted.
 * - **After `vex generate`:** resolves to a specific union, e.g. `"posts" | "authors"`.
 *
 * Used by `RelationshipFieldInput.collection` so that invalid slugs are caught
 * at compile time without the user passing explicit generic parameters.
 *
 * @example
 * ```ts
 * // After generation — type is "posts" | "authors" | "tags"
 * import type { CollectionSlug } from "@vexcms/core"
 *
 * relationship({ collection: "nonexistent" }) // ✗ Type error after generation
 * relationship({ collection: "posts" })       // ✓
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 * @see {@link RelationshipFieldInput} for the primary consumer of this type
 */
export type CollectionSlug = GeneratedVexTypes extends {
  CollectionSlug: infer S extends string;
}
  ? S
  : string;

/**
 * Maps each collection slug to its generated document interface.
 *
 * - **Before `vex generate`:** resolves to `Record<string, unknown>`.
 * - **After `vex generate`:** resolves to a typed map, e.g.
 *   `{ posts: PostsDocument; authors: AuthorsDocument }`.
 *
 * Used by `useCollectionForm` to type the `document` prop per collection.
 *
 * @example
 * ```ts
 * // After generation:
 * import type { DocumentBySlug } from "@vexcms/core"
 * type Post = DocumentBySlug["posts"]     // → PostsDocument
 * type Author = DocumentBySlug["authors"] // → AuthorsDocument
 *
 * @see {@link GeneratedVexTypes} for the augmentation interface
 */
export type DocumentBySlug = GeneratedVexTypes extends {
  DocumentBySlug: infer D extends Record<string, unknown>;
}
  ? D
  : Record<string, unknown>;
````

---

## Step 5: Export from `index.ts`

- [ ] Add one export section to `packages/core/src/index.ts`
- [ ] Run `pnpm build --filter @vexcms/core` — still compiles

```typescript
// ============================================================================
// GENERATED TYPES
// ============================================================================

export * from "./generated-types";
```

---

## Step 6: Update `relationship/types.ts`

Only the generic constraint on `TSlug` changes — from `extends string` to `extends CollectionSlug`. The rest of the file is yours from Spec 20.

- [ ] Add the `CollectionSlug` import to `relationship/types.ts`
- [ ] Change `TSlug extends string = string` to `TSlug extends CollectionSlug = CollectionSlug` on `RelationshipFieldInput`
- [ ] Leave `RelationshipField`'s generic as `TSlug extends string = string` — the output type carries the literal forward without further constraint
- [ ] Ensure `RelationshipField<string>` is in the `AdminField` union in `fields/types.ts` (add it if missing)
- [ ] Run `pnpm build --filter @vexcms/core` — still compiles

Import to add at the top of `relationship/types.ts`:

```typescript
import type { CollectionSlug } from "../../generated-types";
```

Signature change on `RelationshipFieldInput` only:

```typescript
// Before:
export interface RelationshipFieldInput<TSlug extends string = string>

// After:
export interface RelationshipFieldInput<TSlug extends CollectionSlug = CollectionSlug>
```

`RelationshipField` generic is unchanged:

```typescript
// Unchanged — validation already happened at the input stage:
export interface RelationshipField<TSlug extends string = string>
```

`AdminField` union in `fields/types.ts` — add if missing:

```typescript
import { RelationshipField } from "./relationship";

export type AdminField =
  | TextField
  | NumberField
  | CheckboxField
  | DateField
  | SelectField
  | UrlField
  | RelationshipField<string>; // ← add this if not already present
```

---

## Step 7: Emit `declare module` Block in `generateVexTypes`

The existing function builds the interfaces, `CollectionSlug`, and `DocumentBySlug` sections. Append the `declare module '@vexcms/core'` augmentation block after those when collections exist.

- [ ] Modify `generateVexTypes` in `packages/core/src/types/generateVexTypes.ts`
- [ ] Add tests to `packages/core/src/types/generateVexTypes.test.ts`
  - Rename from `genetateVexTypes.test.ts` while editing — fix the typo
- [ ] Run `pnpm test --filter @vexcms/core` — all tests pass

### Expected output shape

For a config with `posts` and `authors`, the generated file ends with:

```typescript
declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    CollectionSlug: "posts" | "authors";
    DocumentBySlug: {
      posts: PostsDocument;
      authors: AuthorsDocument;
    };
  }
}
```

For a config with no collections, no `declare module` block is emitted.

### Guided stub — the section to add inside `generateVexTypes`

Add this logic after `documentBySlugType` is built, before the return:

```typescript
// TODO: implement the declare module block
//
// 1. Guard: if props.config.collections.length === 0, set declareModuleBlock = ""
//    The conditional fallbacks in generated-types.ts handle the empty case.
//
// 2. Build the CollectionSlug value line:
//    Same union string as collectionSlugType but WITHOUT "export type CollectionSlug = "
//    e.g.  CollectionSlug: "posts" | "authors"
//    → Same .map(c => `"${c.slug}"`).join(" | ") you used above, just wrapped differently
//
// 3. Build the DocumentBySlug block:
//    e.g.:
//      DocumentBySlug: {
//        posts: PostsDocument
//        authors: AuthorsDocument
//      }
//    → Map each collection to `      ${collection.slug}: ${collection.interfaceName}`
//    → Wrap in "    DocumentBySlug: {\n" + lines.join("\n") + "\n    }"
//
// 4. Assemble the full block:
//    `declare module '@vexcms/core' {\n  interface GeneratedVexTypes {\n    ${collectionSlugLine}\n    ${documentBySlugBlock}\n  }\n}`
//
// 5. Append to the return array with a preceding blank line:
//    [...existingParts, "", declareModuleBlock].join("\n")
//    When declareModuleBlock === "", do not append the extra blank line
//
// Edge cases:
// - Single collection: CollectionSlug has no " | " — still valid TypeScript
// - Slug with underscores: interfaceName is already correct (slugToPascalCase ran upstream)
// - No collections: return the existing joined output unchanged
throw new Error("Not implemented");
```

### Full `generateVexTypes.test.ts` — complete file to copy-paste

This is the complete file. It consolidates all `generateVexTypes` tests (currently spread across `interfaceGen.test.ts`) into the correct location, plus adds the declare module suite. Save as `packages/core/src/types/generateVexTypes.test.ts`.

```typescript
import { describe, expect, it } from "vitest";
import { defineCollection, defineConfig } from "../index";
import { checkbox } from "../fields/checkbox/config";
import { date } from "../fields/date/config";
import { number } from "../fields/number/config";
import { select } from "../fields/select/config";
import { text } from "../fields/text/config";
import { generateVexTypes } from "./generateVexTypes";

const HEADER = "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️";

// ─── header ──────────────────────────────────────────────────────────────────

describe("generateVexTypes — header", () => {
  it("always includes the auto-generated header on line 1", () => {
    const config = defineConfig();
    const output = generateVexTypes({ config });
    expect(output.split("\n")[0]).toBe(HEADER);
  });

  it("returns only the header when there are no collections", () => {
    const config = defineConfig();
    const output = generateVexTypes({ config });
    expect(output).not.toContain("export interface");
    expect(output).not.toContain("CollectionSlug");
  });
});

// ─── document interfaces ──────────────────────────────────────────────────────

describe("generateVexTypes — document interfaces", () => {
  it("generates a document interface for each collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
        defineCollection({
          slug: "authors",
          fields: { name: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface PostsDocument {");
    expect(output).toContain("export interface AuthorsDocument {");
  });

  it("always includes _id and _creationTime in every interface", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("_id: string");
    expect(output).toContain("_creationTime: number");
  });

  it("generates required fields without ? modifier", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("title: string");
    expect(output).not.toContain("title?: string");
  });

  it("generates optional fields with ? modifier", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { excerpt: text({ required: false }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("excerpt?: string");
  });

  it("generates all field types correctly in one collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
            views: number({ required: true }),
            published: checkbox({ required: false }),
            publishedAt: date({ required: false }),
            status: select({
              required: true,
              optionInterfaceName: "Status",
              options: [{ label: "Draft", value: "draft" }],
            }),
            tags: select({
              required: false,
              options: [{ label: "News", value: "news" }],
            }),
          },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("title: string");
    expect(output).toContain("views: number");
    expect(output).toContain("published?: boolean");
    expect(output).toContain("publishedAt?: number");
    expect(output).toContain("status: Status");
    expect(output).toContain("tags?: TagsOption");
  });

  it("uses PascalCase slug for interface name (underscore slug)", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "blog_posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface BlogPostsDocument {");
  });
});

// ─── CollectionSlug ───────────────────────────────────────────────────────────

describe("generateVexTypes — CollectionSlug", () => {
  it("generates a CollectionSlug union type for all slugs", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export type CollectionSlug =");
    expect(output).toContain('"posts"');
    expect(output).toContain('"authors"');
  });

  it("generates a single-value CollectionSlug for one collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain('export type CollectionSlug = "posts"');
  });
});

// ─── DocumentBySlug ───────────────────────────────────────────────────────────

describe("generateVexTypes — DocumentBySlug", () => {
  it("generates a DocumentBySlug mapped type", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export type DocumentBySlug = {");
    expect(output).toContain("posts: PostsDocument");
    expect(output).toContain("authors: AuthorsDocument");
  });
});

// ─── declare module augmentation ─────────────────────────────────────────────

describe("generateVexTypes — declare module augmentation", () => {
  it("emits declare module block when collections exist", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("declare module '@vexcms/core'");
    expect(output).toContain("interface GeneratedVexTypes");
  });

  it("includes CollectionSlug in GeneratedVexTypes augmentation", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(`CollectionSlug: "posts" | "authors"`);
  });

  it("includes DocumentBySlug in GeneratedVexTypes augmentation", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("DocumentBySlug:");
    expect(output).toContain("posts: PostsDocument");
    expect(output).toContain("authors: AuthorsDocument");
  });

  it("does NOT emit declare module block when there are no collections", () => {
    const config = defineConfig();
    const output = generateVexTypes({ config });
    expect(output).not.toContain("declare module");
    expect(output).not.toContain("GeneratedVexTypes");
  });

  it("emits declare module block for a single collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("declare module '@vexcms/core'");
    expect(output).toContain(`CollectionSlug: "posts"`);
    expect(output).toContain("posts: PostsDocument");
  });

  it("declare module block appears after DocumentBySlug in the output", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    const documentBySlugPos = output.indexOf("export type DocumentBySlug");
    const declareModulePos = output.indexOf("declare module");
    expect(declareModulePos).toBeGreaterThan(documentBySlugPos);
  });

  it("uses the collection interfaceName in DocumentBySlug augmentation", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "blog_posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("blog_posts: BlogPostsDocument");
  });
});
```

---

## Step 8: `useCollectionForm` Generic Props

Once `CollectionSlug` and `DocumentBySlug` are exported from `@vexcms/core`, `useCollectionForm` can infer the document type from the collection argument. The change is **props only** — `FormOptions<any>` stays as-is because `getCollectionDefaultValues` returns `Record<string, unknown>`, which means the full `TFormData` generic on the form cannot be resolved without deeper changes (a future spec).

The practical improvement: passing the wrong document type for a collection becomes a type error, and the `collection` prop is constrained to a specific slug's config.

Before generation, `DocumentBySlug[TSlug]` resolves to `unknown` (from `Record<string, unknown>`), and `unknown & TDocument` collapses to `TDocument` — so the signature degrades gracefully to the current behaviour. After generation it narrows to e.g. `PostsDocument & TDocument` = `PostsDocument`.

- [ ] Update `packages/react/src/hooks/useCollectionForm.ts`
- [ ] Run `pnpm build --filter @vexcms/react` — compiles without errors

### Full updated `useCollectionForm.ts`

Only the imports and function signature change. The body is identical to the current implementation.

```typescript
import { FormOptions, useForm } from "@tanstack/react-form";
import {
  type CollectionConfig,
  type CollectionSlug,
  type DocumentBySlug,
  getCollectionDefaultValues,
  getCollectionInputSchema,
  type TDocument,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS collection.
 *
 * Sets `defaultValues` from the collection's field defaults and wires up
 * the collection's Zod input schema as the `onChange` validator.
 * Returns `AnyFormApi` so the instance can be passed directly to `<AppForm>`.
 *
 * The `TSlug` generic is inferred from the `collection` argument. After running
 * `vex generate`, this constrains `document` to the correct document type for
 * that collection — passing a document from a different collection is a type error.
 *
 * @param props - Hook props.
 * @param props.collection - The collection whose fields drive the form shape.
 * @param props.document - Optional existing document to pre-populate `defaultValues`
 *   when editing. Typed to `DocumentBySlug[TSlug]` after generation, so only a
 *   document from the same collection is accepted.
 * @returns A TanStack Form instance compatible with `<AppForm>`.
 */
export function useCollectionForm<TSlug extends CollectionSlug = CollectionSlug>(
  props: {
    collection: CollectionConfig<TSlug>;
    document?: DocumentBySlug[TSlug] & TDocument;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } & FormOptions<any>,
): AnyFormApi {
  const { collection, document, validators, ...formOptions } = props;
  return useForm({
    defaultValues: getCollectionDefaultValues({ collection, document }),
    ...formOptions,
    validators: {
      onSubmitAsync: getCollectionInputSchema({ collection }),
      onBlur: getCollectionInputSchema({ collection }),
      ...validators,
    },
  });
}
```

---

## Step 9: Make View Components Generic

Now that `vex.types.ts` generates correctly, the three remaining typecheck failures are all in `@vexcms/react` and `@vexcms/next`. The problem in each case is the same: `collection` is typed as `CollectionConfig<string, string>` at some point in the chain, and `string` no longer extends `CollectionSlug` once the generated types are present.

- [ ] Replace `packages/react/src/components/views/CollectionEditView.tsx`
- [ ] Replace `packages/react/src/components/modals/CreateDocumentModal.tsx`
- [ ] Replace `packages/next/src/NextAdminPage.tsx`
- [ ] Run `pnpm typecheck --filter www` — passes

### `packages/react/src/components/views/CollectionEditView.tsx`

Make the function generic over `TSlug`. The `document` from `vexConvexApi.get` is typed as `VexDocument` — it can't be narrowed to `DocumentBySlug[TSlug]` at compile time since the query API has no collection context. Cast it as `TDocument` when passing to `useCollectionForm`.

```tsx
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  type CollectionEditViewProps,
  type CollectionSlug,
  type TDocument,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { VexLink } from "../ui/VexLink";
import { Button } from "../ui/button";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";

/**
 * Collection document edit form.
 *
 * Fetches the document when editing, initialises a TanStack Form instance with
 * the current field values (or empty strings for new documents), and renders an
 * `<AppForm>` containing one input component per field. Field inputs read the
 * form instance from `AppFormContext` — no controller prop needed.
 *
 * `TSlug` is inferred from the `collection` prop. After running `vex generate`,
 * passing a document from a different collection to `document` is a type error.
 *
 * @param props - View props
 * @param props.collection - The collection configuration whose fields are rendered
 * @param props.documentId - Convex ID of the document being edited (omit for new)
 * @param props.initialData - Pre-fetched document from the server (for SSR)
 * @returns The document edit form for the given collection.
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
export function CollectionEditView<
  TSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionEditViewProps<TSlug>) {
  const isEditing = Boolean(props.documentId);

  const { data: document } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId ?? "",
    }),
    initialData: props.initialData,
    enabled: isEditing,
  });

  if (!document) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.update),
  });

  const form = useCollectionForm({
    // vexConvexApi.get returns VexDocument — cast is safe since the query
    // fetched this document for the correct collection at runtime.
    document: document as TDocument,
    collection: props.collection,
    onSubmit: async ({ value }) => {
      await mutateAsync({ id: document._id, data: value });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Edit {props.collection.labels.singular}
      </h1>
      <AppForm form={form} className="space-y-4">
        {Object.entries(props.collection.fields).map(([fieldKey, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          if (!InputComponent) {
            // TODO: handle missing component error here
            return null;
          }
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
          <Button type="submit" isPending={isPending}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<VexLink href={`/admin/${props.collection.slug}`} />}
          >
            Cancel
          </Button>
        </div>
      </AppForm>
    </div>
  );
}
```

### `packages/react/src/components/modals/CreateDocumentModal.tsx`

Make the function generic over `TSlug` so `useCollectionForm` can infer the slug from the collection prop. The no-document create path is straightforward — no cast needed.

```tsx
"use client";

import { useRef } from "react";
import {
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "../ui";
import { Modal } from "./BaseModal";
import {
  type CollectionConfig,
  type CollectionSlug,
  vexConvexApi,
} from "@vexcms/core";
import { MODALS } from "./constants";
import { AppForm } from "../form";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import { RenderFieldInputComponents } from "../fields";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";

/**
 * Modal for creating a new document in a collection.
 *
 * Opens when `?createNew=true` is in the URL (see `MODALS.createDocument`).
 * Builds a TanStack Form instance via `useCollectionForm`, renders all
 * collection fields with `<RenderFieldInputComponents>`, and calls the
 * Convex `create` mutation on submit. Closes by clearing the URL param.
 *
 * `TSlug` is inferred from the `collection` prop — no explicit annotation needed.
 *
 * @param props - Component props.
 * @param props.collection - The collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form.
 *
 * @example
 * ```tsx
 * // Rendered inside CollectionListView — opens automatically when ?createNew=true
 * <CreateDocumentModal collection={postsCollection} />
 * ```
 */
export function CreateDocumentModal<
  TSlug extends CollectionSlug = CollectionSlug,
>({
  collection,
}: {
  collection: CollectionConfig<TSlug>;
}) {
  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(
    MODALS.createDocument.urlParam,
    parseAsBoolean,
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.create),
  });

  const form = useCollectionForm({
    collection,
    onSubmit: async ({ value }) => {
      await mutateAsync({ collection: collection.slug, data: value });
      await setOpen(null);
    },
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.createDocument.urlParam}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="w-[50svw] h-[50svh] flex flex-col"
      >
        <AppForm form={form} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="px-2 pb-4">
            Create {collection.labels.singular}
          </DialogHeader>
          <div className="overflow-y-auto grow flex flex-col px-2">
            <RenderFieldInputComponents
              fields={collection.fields}
              className="grow flex flex-col gap-2"
            />
          </div>
          <DialogFooter className="p-1">
            <Button isPending={isPending} type="submit">
              {MODALS.createDocument.label}
            </Button>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          </DialogFooter>
        </AppForm>
      </DialogContent>
    </Modal>
  );
}
```

### `packages/next/src/NextAdminPage.tsx`

The collection is found at runtime via URL slug lookup — TypeScript sees `CollectionConfig<string, string>` after `.find()`. This can't be narrowed at compile time. Cast it to `CollectionConfig<CollectionSlug>` before passing to view components — safe because `.find()` searches only `config.collections`, which are the registered collections whose slugs make up `CollectionSlug`.

```tsx
import { fetchQuery } from "convex/nextjs";
import {
  type CollectionSlug,
  type CollectionConfig,
  vexConvexApi,
  type VexConfig,
} from "@vexcms/core";
import {
  DashboardView,
  CollectionListView,
  CollectionEditView,
} from "@vexcms/react";

/**
 * VexCMS admin page server component for Next.js.
 *
 * An `async` server component that routes by the `[[...slug]]` catch-all
 * params, prefetches Convex data via `fetchQuery`, and renders the correct
 * view component. Does **not** include a layout wrapper — `VexAdminLayout`
 * in `app/admin/layout.tsx` owns the persistent shell.
 *
 * **Route mapping:**
 * | `path` array | View |
 * |---|---|
 * | `[]` or undefined | `DashboardView` |
 * | `[collectionSlug]` | `CollectionListView` with preloaded docs |
 * | `[collectionSlug, "new"]` | `CollectionEditView` (empty form) |
 * | `[collectionSlug, documentId]` | `CollectionEditView` with preloaded doc |
 *
 * @param props - Component props
 * @param props.config - The resolved VexCMS configuration from `vex.config.ts`
 * @param props.params - Next.js 15 async params `{ path?: string[] }`
 * @returns The appropriate admin view for the current route.
 *
 * @example
 * ```tsx
 * // app/admin/[[...slug]]/page.tsx
 * import { VexAdminPage } from "@vexcms/next";
 * import config from "../../../../vex.config";
 *
 * export default function AdminPage({
 *   params,
 * }: {
 *   params: Promise<{ path?: string[] }>;
 * }) {
 *   return <VexAdminPage config={config} params={params} />;
 * }
 * ```
 */
export async function NextAdminPage(props: {
  config: VexConfig;
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await props.params;
  const [collectionSlug, documentId] = path;

  if (!collectionSlug) {
    return <DashboardView config={props.config} />;
  }

  const collection = props.config.collections.find(
    (c) => c.slug === collectionSlug,
  );

  if (!collection) {
    return (
      <div>
        <p className="text-muted-foreground p-6">
          Collection &quot;{collectionSlug}&quot; not found.
        </p>
        <p>TODO: add not found view</p>
      </div>
    );
  }

  // .find() returns CollectionConfig<string, string> — cast is safe because
  // config.collections only contains registered collections whose slugs
  // are the exact members of CollectionSlug.
  const typedCollection = collection as CollectionConfig<CollectionSlug>;

  if (documentId) {
    const initialData = await fetchQuery(vexConvexApi.get, {
      id: documentId,
    });
    return (
      <CollectionEditView
        collection={typedCollection}
        documentId={documentId}
        initialData={initialData}
      />
    );
  }

  const initialData = await fetchQuery(vexConvexApi.list, {
    collection: collectionSlug,
  });
  return (
    <CollectionListView collection={typedCollection} initialData={initialData} />
  );
}
```

---

## Verification (mandatory)

- [ ] `pnpm install` — lockfile updates cleanly, no unresolved peer dep warnings
- [ ] `pnpm build` — full monorepo build succeeds after catalog changes
- [ ] `pnpm build --filter @vexcms/core` — builds successfully
- [ ] `pnpm build --filter @vexcms/react` — builds successfully
- [ ] `pnpm build --filter @vexcms/next` — builds successfully
- [ ] `pnpm test --filter @vexcms/core` — all tests pass including the new declare module suite
- [ ] `console` and `setTimeout` ESLint squiggles are gone from `CollectionEditView.tsx`
- [ ] No ESLint errors from the root config appearing in `packages/react` or `packages/next` (double-processing check)
- [ ] Manually verify the augmentation end-to-end: generate types for a two-collection config, paste the output into a scratch `.ts` file next to the project, confirm your editor shows `CollectionSlug` as the specific union not `string`

---

## Success Criteria

- [ ] `CollectionSlug` from `@vexcms/core` resolves to `string` before `vex generate` has run
- [ ] `CollectionSlug` from `@vexcms/core` resolves to the specific slug union after `vex generate`
- [ ] `relationship({ collection: "invalid" })` is a type error after generation
- [ ] `relationship({ collection: "posts" })` compiles after generation (assuming `"posts"` is registered)
- [ ] `vex.types.ts` contains both the plain `export type CollectionSlug` AND `declare module '@vexcms/core'`
- [ ] `useCollectionForm({ collection: postsCollection, document: authorsDoc })` is a type error after generation
- [ ] `useCollectionForm({ collection: postsCollection, document: postsDoc })` compiles after generation
- [ ] No `console`/`setTimeout` ESLint errors in `packages/react` or `packages/next` source files
- [ ] `@vexcms/react` and `@vexcms/next` are excluded from the root ESLint config's file globs
- [ ] All existing tests in `@vexcms/core` continue to pass
