# Developer Preferences

> Patterns extracted from sync-spec runs. Each entry represents a deviation from
> AI-generated spec code that the developer consistently prefers. These are encoded
> in `.claude/commands/dev-spec.md` — this file is the audit trail.

## UI Components and shadcn/ui

- **Always use shadcn/ui components for UI patterns**: All UI components across the project are built on shadcn/ui components, which are built on Base UI primitives. Before writing any UI code in a spec, search the [shadcn/ui registry](https://ui.shadcn.com/docs/components) to determine which components should be used. The `packages/react/components.json` file is configured with the `@wds` registry and `base-vega` style. Install new components as needed with `npx shadcn@latest add <component-name>`. Never write custom implementations of common UI patterns (tabs, dialogs, dropdowns, etc.) when a shadcn component exists — use the shadcn component for ARIA compliance and consistency. *(Encoded: spec 32b, 2026-07-05)*

- **List of installed shadcn components** (as of 2026-07-05): `accordion`, `badge`, `button`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `multi-select`, `popover`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `textarea`, `tooltip`. Check `packages/react/src/components/ui/` for the current list before assuming a component needs installation. *(Encoded: spec 32b, 2026-07-05)*

## Spec Code Effect Previews

- **Diff previews in specs use `ts` language blocks with `+`/`-` line prefixes, not `diff` blocks or BEFORE/AFTER splits.** The `ts` language ensures the syntax highlighter treats the content as TypeScript (enabling LSP, IntelliSense, and consistent formatting). `+`/`-` prefixes on lines mark additions and removals visually. Avoid `diff` language blocks (may not render in all markdown viewers) and avoid splitting into separate BEFORE/AFTER blocks (doubles code volume, harder to scan at speed). *(Encoded: dev-spec, 2026-05-12)*

## Next.js Adapter Naming

- **Components are named `Next*` not `Vex*`**: Framework adapter components exported
  from `@vexcms/next` use the `Next` prefix (e.g. `NextAdminPage`, `NextAdminLayout`),
  not the `Vex` prefix. The `Vex` prefix is for framework-agnostic APIs in `@vexcms/core`
  or `@vexcms/react`. *(Encoded: sync-spec 01, 2026-04-07)*

## Convex Functions

- **Mutation payload arg is named `data`, not `fields`**: `create` and `update` Convex
  mutations use `data: v.any()` as the payload arg name. `fields` is confusing because
  "fields" in VexCMS refers to field definitions in the collection config, not the data
  being written to the database. Use `data` everywhere for the mutation payload.
  *(Encoded: sync-spec 01, 2026-04-07)*

- **Convex mutation payload uses `v.any()`**: Generic collection mutations accept
  `data: v.any()` rather than a typed record (`v.record(v.string(), v.any())` or
  `fields: Record<string, unknown>`). Flexibility is preferred at this stage; the CLI
  will enforce schema correctness at codegen time. *(Encoded: sync-spec 01, 2026-04-07)*

## File Organization

- **Context + hook collocated in `hooks/` as a single file**: When a React context has
  a companion hook (e.g., `FrameworkComponentsContext` + `useFrameworkComponents`), put
  both in the `hooks/` directory as one file (`hooks/useFrameworkComponents.ts`), not in
  `components/` and not as two separate files. *(Encoded: sync-spec 01, 2026-04-07)*

## Next.js Route Params

- **Catch-all slug param is `[[...slug]]`**: The optional catch-all segment for the admin
  route is named `slug`, not the feature name. So the directory is `[[...slug]]/page.tsx`,
  not `[[...vex]]/page.tsx` or `[[...admin]]/page.tsx`.
  *(Encoded: sync-spec 01, 2026-04-07)*

## Tailwind CSS in Monorepo

- **`@source` points to workspace package source, not dist**: In a pnpm monorepo, Tailwind
  `@source` directives for workspace packages should point to the source files directly
  using relative paths (`../../../../packages/react/src/**/*.{ts,tsx}`), not to
  `node_modules/@vexcms/react/dist/**`. Workspace packages are symlinked, not copied to
  `node_modules` locally, and the dist files don't exist during dev if packages haven't
  been built. *(Encoded: sync-spec 01, 2026-04-07)*

## Next.js Package Structure (`@vexcms/next`)

- **Server/client split via sub-path exports**: Any `@vexcms/next` package that exports
  both async server components AND `"use client"` components must split into sub-path
  exports (`./server`, `./client`) with separate tsup entry points. tsup's global
  `banner: { js: '"use client";' }` stamps ALL entries in a single config — a shared
  entry would incorrectly mark server components as client components.
  *(Encoded: sync-spec 01, 2026-04-07)*

## ADMIN_FIELDS Metadata Keys

- **TypeScript type string key is `interfaceType`, not `tsType`**: When adding a TypeScript type string to an `ADMIN_FIELDS` entry, name the key `interfaceType` (e.g., `interfaceType: "string"`). `tsType` was the spec-generated name; `interfaceType` is preferred because it specifically names what the string generates — a TypeScript interface property type. The derived `AdminFieldTsType` union also reads `["interfaceType"]`. Each field config function stamps `ADMIN_FIELDS[type].interfaceType` onto the resolved field object. *(Encoded: sync-spec 21, 2026-04-20)*

- **`interfaceType` is stored on field objects AND on ADMIN_FIELDS**: Field config functions (e.g., `text()`) stamp `interfaceType: ADMIN_FIELDS.text.interfaceType` onto the resolved field at config time. Type generators read `field.interfaceType` directly — they do not look up `ADMIN_FIELDS[field.type].interfaceType` at generation time. *(Encoded: sync-spec 21, 2026-04-20)*

- **`interfaceName` is stored on `CollectionConfig`**: `defineCollection` sets `interfaceName: slugToPascalCase({ slug })` on the resolved config. Type generators read `collection.interfaceName` directly — they do not recompute it. *(Encoded: sync-spec 21, 2026-04-20)*

## Schema/Types Config Structure

- **Types output gets its own top-level config key, not nested in schema**: `VexConfigInput.types?: TypesConfigInput` and `VexConfig.types: TypesConfig` are separate from `schema`. Do not nest `typesOutputPath` inside `SchemaConfigInput`. When generated output files are logically independent, give each its own config section. *(Encoded: sync-spec 21, 2026-04-21)*

- **Default path for `vex.types.ts` is `/src/vex.types.ts`**: Placed next to `vex.config.ts` in the project's `src/` directory, not in `convex/`. The CLI resolves this relative to `vex.config.ts` at runtime. *(Encoded: sync-spec 21, 2026-04-21)*

## File Organization in `@vexcms/core`

- **Generated/augmentation type files belong in `src/types/`, not `src/` root**: When adding a file that supports type generation or module augmentation (e.g., `generated.ts` containing `GeneratedVexTypes`), place it in `packages/core/src/types/` alongside the generator functions (`generateVexTypes.ts`, etc.), not at `src/` root. Re-export via `types/index.ts`. The spec named the file `generated-types.ts` at root; the developer placed it as `types/generated.ts`. *(Encoded: sync-spec 21, 2026-04-24)*

## Code Generation Helpers

- **Interface generation file is named `interfaceGen.ts`, not `typeGen.ts`**: When generating TypeScript interfaces from collection configs, name the file `interfaceGen.ts`. `typeGen.ts` is too generic — `interfaceGen.ts` specifically names what the file does. *(Encoded: sync-spec 21, 2026-04-21)*

- **Select fields in generated interfaces produce typed option subtypes**: `collectionConfigToInterface` generates `type StatusOption = "draft" | "published"` as a sub-type for each select field, using `{FieldKey}Option` as the name (or `field.optionInterfaceName` if set). The field property type is the option sub-type name, not `string[]`. Do not defer this to a future spec — it is always implemented alongside the interface generator. *(Encoded: sync-spec 21, 2026-04-21)*

- **Auto-generated type files include ESLint disable comments for perfectionist**: `generateVexTypes` writes `/* eslint-disable perfectionist/sort-union-types */`, `/* eslint-disable perfectionist/sort-interfaces */`, and `/* eslint-disable perfectionist/sort-modules */` at the top of generated `vex.types.ts` files. Always include these when generating TypeScript files whose member order is controlled by user config, not alphabetical sort. *(Encoded: sync-spec 21, 2026-04-21)*

## Field Type Naming

- **Field type names describe the UI widget, not the data type**: The function name, type string, and interfaces match the input control, not the underlying data type. `checkbox()` stores a `boolean` via `v.boolean()`, but the field type is `"checkbox"`. `select()` stores a `string`, but the field type is `"select"`. Never name a field type after its data type (no `boolean()`, no `string()`). *(Encoded: sync-spec 20, 2026-04-11)*

## Field Type Defaults

- **Do not override `admin.width` or `admin.cellAlignment` as field-type-level defaults**: Keep both at the base defaults (`width: "full"`, `cellAlignment: "left"`) and let users opt in via the config. Field-type-specific override defaults in the spec (e.g., `width: "half"` for checkbox, `cellAlignment: "right"` for number) were intentionally dropped during implementation. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date()` defaultValue is `undefined`, not `0`**: An empty start is more intuitive than epoch. `0` would silently pre-fill the form with 1970-01-01. *(Encoded: sync-spec 20, 2026-04-11)*

## Date Field

- **`date` input uses `<DateTimePicker>`, not `<input type="datetime-local" />`**: The custom DateTimePicker component handles `Date ↔ Unix ms` conversion, `clearable`, `modal`, `use12HourFormat`, and `timePicker` props internally. Never write manual `toISOString().slice(0, 16)` conversion code in a date field input component. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date` cell uses `toLocaleDateString()`, not `date-fns`**: Native browser API is sufficient for locale-aware date display in table cells. Reserve `date-fns` for cases where formatting precision or locale control is actually required. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date()` `time` option is a config object, not a boolean**: `time?: { hidden?: boolean; use12HourFormat?: boolean; timePicker?: { hour, minute, second } }`. The config function deeply merges defaults so all keys are always present on the resolved `DateField.time`. This lets components drive all picker props from `fieldDef.time` without conditional logic. Defaults: `{ hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } }`. *(Encoded: sync-spec 20, 2026-04-11)*

## Checkbox / Boolean Fields

- **`CheckboxFieldCell` renders `"Yes"` / `"No"` text, not icons**: Avoids an icon import and is readable regardless of font/icon loading state. Always use text strings for boolean cell display. *(Encoded: sync-spec 20, 2026-04-11)*

## Package CSS Defaults

- **Package-level CSS defaults go in `@layer base`**: When a `@vexcms/*` package ships a `styles.css` with default CSS variable values, always place them inside `@layer base { :root { } }`. Unlayered `:root {}` declarations in any consuming app automatically win over `@layer base` defaults without needing `!important` or specificity tricks. This is the intended override contract for `@vexcms/react/styles` and `@vexcms/next/styles`. *(Encoded: sync-spec 23, 2026-05-01)*

## Framework Adapter Architecture

- **Re-export every core config function from framework packages**: Every config function exported from `@vexcms/core` (`relationship`, `defineCollection`, `defineConfig`, `text`, `number`, `select`, `date`, `url`, `checkbox`, `tabs`, `color`, ...) MUST be re-exported from `packages/react/src/index.ts` with the framework's `ComponentHKT` bound (`F = ReactHKT`), and transitively re-exported from `packages/next/src/index.ts`. **Users import every config function from `@vexcms/next` (Next apps) or `@vexcms/react` (other React apps), never from `@vexcms/core` directly.** This keeps `@vexcms/core` framework-agnostic (no `react` imports, no JSX) while letting the user-facing API expose strongly-typed `ComponentType<P>` slots wherever a component override is allowed. Even fields without component slots get a pass-through wrapper so import paths stay consistent. Update `adding-a-field-type.md` so every new field type follows this without rediscovery. *(Encoded: sync-spec, 2026-05-04 — Decision 15 of spec 22)*

- **User-facing component slots in core use `ApplyComponent<F, Props>`, not `ComponentType<P>`**: Any user-supplied component override in a field or collection config (e.g., `admin.components.preview`) is typed via the existing HKT machinery in `packages/core/src/fields/baseTypes.ts`: declare the slot as `preview?: ApplyComponent<F, MyPreviewProps>` with `F extends ComponentHKT = ComponentHKT` as a generic parameter on the input/resolved interface, defaulting to the unspecialized HKT (slot resolves to `unknown` in pure-core context). The framework adapter package (`@vexcms/react`) supplies the concrete HKT (`ReactHKT extends ComponentHKT { component: ComponentType<this["_props"]> }`) at re-export time, so consumers see `ComponentType<MyPreviewProps>` in the IDE. **Core never imports from `react`** — even a type-only `import { ComponentType } from "react"` is forbidden, despite `react` being a peerDependency at the package level. Apply this to every new field/collection slot that accepts user components. *(Encoded: sync-spec, 2026-05-04 — Decision 11 of spec 22)*

## Generic React Hooks

- **Use `@ts-hooks-kit/core` for any generic hook; don't roll your own**: For debounce, throttle, copy-to-clipboard, media query, local storage, intersection observer, and any other generic hook the project needs, prefer [`@ts-hooks-kit/core`](https://github.com/naufaldi/ts-hooks-kit) over hand-rolled implementations or AI-generated one-offs. Only write a custom hook in `packages/react/src/hooks/` when it has domain logic specific to vexcms (Convex schema, field config, admin UI orchestration). Examples of "domain-specific, write yourself": `useCollectionForm`, `useFrameworkComponents`, `useRelationshipPickerOptions`. Examples of "generic, use the library": `useDebounceValue`, `useThrottle`, `useEventListener`, `useMediaQuery`, `useLocalStorage`. The library is a maintained fork of `usehooks-ts` (v3.1.1 base) supporting **React 18 and 19** — critical because `@vexcms/react`'s peerDependency is `react: ">=18.0.0"` and the admin panel must install cleanly into host apps on either version. **Locked to exact `0.2.0` in `pnpm-workspace.yaml#catalog` — do NOT bump (not even patch) without manual review.** Tiny package, low download volume, vulnerable to malicious patch releases via `^` ranges. *(Encoded: sync-spec, 2026-05-04)*

- **Considered and rejected: `@mantine/hooks`.** Mantine has a more battle-tested hooks codebase and stronger maintenance, but `@mantine/hooks@9.x` pins `peerDependencies.react` to `^19.2.0`. Adopting it would force every published `@vexcms/*` package to also require React 19, breaking React-18 host apps. The admin panel is embedded into user projects (often on Next.js or other frameworks at varying React versions) — the React peer range must remain `>=18.0.0`. Bundle size / tree-shaking are not the deciding factor (both libraries declare `sideEffects: false`); the React-version peer range is. Revisit if Mantine relaxes its peer or if vexcms drops React 18 support. *(Encoded: sync-spec, 2026-05-04)*

- **Library peer ranges must not constrain `@vexcms/*` peer ranges**: Any third-party library added as a dependency or peerDependency of a published `@vexcms/*` package must support the full React peer range we declare (`react: ">=18.0.0"`). Reject any library whose React peer is narrower (e.g., `^19.2.0`-only) — even if technically the workspace runs on React 19. The constraint is what users' host apps see, not what our dev catalog uses. Apply the same rule to other peer-pinned ecosystems (TanStack Query versions, Convex versions, Next.js versions). *(Encoded: sync-spec, 2026-05-04)*

## Type Generation

Two complementary mechanisms enforce field-typed constraints in vexcms. Pick by where the data lives, not by preference — they're not interchangeable.

- **Same-call-site constraints → deep generics + conditional types (no codegen)**: When a constraint references fields defined in the SAME call as the constraint itself, use deep generics. Examples: `defineCollection.admin.useAsTitle` references the collection's own fields (right there in the same `defineCollection` call); `defineCollection.admin.defaultSort` same; `select.options[].value` constrains `select.defaultValue` to a literal in the same options array. Pattern: thread `TFields extends Record<string, AdminField>` (or similar) through the function signature; use a conditional+mapped type like `FieldKeysByType<TFields, "text"> = { [K in keyof TFields]: TFields[K] extends { type: "text" } ? K : never }[keyof TFields]` to extract field keys by type. Each field config function (`text()`, `relationship()`, etc.) already returns an object with a literal `type: "…"` so the conditional reads it directly. Result: works on first definition with zero codegen lag, immediate IDE feedback as the user types, autocomplete shows exactly the valid subset. Use this for `useAsTitle`, `defaultSort`, `searchableFields`, filter-operator typing, select option-value narrowing, and anything else where the constraint and the data live in the same `defineCollection` / `defineConfig` / config-function call. *(Encoded: sync-spec, 2026-05-04)*

- **Cross-call-site constraints → augmented-module codegen**: When the type system needs to know something *about* a collection from elsewhere in the codebase — the document shape, the registered slug union, valid relationship populate keys for `vex.list(slug, { populate })`, the `useAsTitle` field per slug for the relationship picker preview, reverse references, etc. — the answer is to extend the augmented-module codegen pipeline (`packages/core/src/types/generated.ts` + `vex generate` writing into the user's `vex.types.ts` via `declare module "@vexcms/core"`). Pattern: declare a single empty `GeneratedVexTypes` interface in core; `vex generate` augments it with properties (`CollectionSlug`, `DocumentBySlug`, `CollectionsFieldTypeMap`, future siblings); top-level derived exports read each property via `GeneratedVexTypes extends { X: infer T extends … } ? T : <fallback>`. Helper types (`KeysOf`, `TargetOf`, `RelationshipKeysOf`, `TextKeysOf`, etc.) live in core and consult the relevant top-level export. **Never introduce a parallel augmentation interface like `GeneratedFieldTypeMap` or `GeneratedRelationshipMap` — they fragment the registry.** One interface, multiple properties. The most powerful single property is `CollectionsFieldTypeMap` keyed `slug → fieldType → fieldKey union`, from which all per-field-type helpers derive. Result: plain object literals at call sites, localized errors at usage sites, fast editor performance, consistency with the existing `DocumentBySlug`/`CollectionSlug` mental model. Trade-off accepted: types only refresh after `vex generate` runs — same as the existing codegen flow. *(Encoded: sync-spec, 2026-05-04)*

- **Picking between the two**: the rule is mechanical, not preferential. Ask: "are the fields the constraint references in scope at the same call site as the constraint, or do they live somewhere else (different file, different collection, indirected through a slug string)?" Same call → deep generics. Different call → codegen. Both mechanisms compose: `defineCollection` uses deep generics for self-referencing constraints AND feeds the codegen pipeline that powers cross-call-site constraints elsewhere. *(Encoded: sync-spec, 2026-05-04)*

## Workspace Packaging

- **Every workspace package tsconfig.json that imports from a sibling needs `customConditions: ["source"]`**: Without this flag, TypeScript inside the package follows standard module resolution to `package.json#exports.types` (`./dist/index.d.ts`) — which may not exist during dev (e.g., when a sibling's tsup config has `dts: false` or hasn't built yet). The result is silent loss of all sibling types: every imported type widens to loosely-typed, and errors like *Property `fieldKey` does not exist on type `CellComponentProps<…>`* fire even though the source declares the property. `apps/www/tsconfig.json` already sets this flag; every workspace package that imports from `@vexcms/core`, `@vexcms/react`, etc. must match. *(Encoded: sync-spec, 2026-05-04 — Step 8a of spec 22)*

- **All `dependencies` and `devDependencies` use `"catalog:"`; never literal versions in package.json**: Every workspace package's `dependencies` and `devDependencies` resolve through `pnpm-workspace.yaml#catalog`. Adding a new dep is two steps: (1) add the entry to `pnpm-workspace.yaml#catalog` with the appropriate pin style (see next rule), (2) reference it as `"<dep>": "catalog:"` in the consuming package.json. Direct literal versions in package.json are forbidden — they break lockstep, hide cross-package version drift, and make audits painful (e.g. the `@base-ui/react` `1.2.0` vs `^1.1.0` mismatch fixed during this audit). `peerDependencies` are the only exception: keep ranges literal when intentionally wider than the catalog version (e.g. `react: ">=18.0.0"` while the catalog is `^19.2.4`), since peer ranges declare consumer compat, not workspace pin. *(Encoded: sync-spec, 2026-05-04)*

- **Catalog pin style: `^X.Y.Z` for reputable infrastructure, exact `X.Y.Z` for small/niche/single-purpose deps**: Every catalog entry consciously picks one of two styles. Use `^X.Y.Z` (caret range) for heavily-maintained infrastructure where security and perf updates are valuable: React, Next, Convex, TanStack, Better Auth, Zod, ESLint, TypeScript, testing tooling, Plate (richtext core), Tailwind core, Astro/Starlight, etc. Use exact `X.Y.Z` (no caret — "locked") for small/niche packages where (a) the surface area is one feature (icons, dnd, color picker, command palette, animation lib, niche hooks) so we don't benefit from minor/patch upgrades, AND (b) supply-chain risk of an auto-applied malicious patch outweighs the upgrade benefit. Currently locked: `@base-ui/react`, `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge`, `tw-animate-css`, `shadcn`, `eslint-config-next`, `@hello-pangea/dnd`, `@uiw/react-color-sketch`, `cmdk`, `react-day-picker`, `next-themes`, `@ts-hooks-kit/core`, `chalk`, `ora`, `sort-package-json`, `validate-npm-package-name`. To bump a locked dep: review the diff/release notes manually, then change the version here (the pnpm-lock.yaml further pins the resolved tarball). When in doubt, lock it — bumping is a manual decision either way. The full policy with rationale is in the header comment of `pnpm-workspace.yaml`. *(Encoded: sync-spec, 2026-05-04)*

- **Peer-only dependencies must mirror in devDependencies for typecheck**: When a workspace package's source imports types from a peer dependency (e.g., `@tanstack/react-query`, `@convex-dev/react-query`, `convex`), that dependency MUST also appear in the package's `devDependencies`. peerDependencies alone don't get pnpm-symlinked into the package's `node_modules` during local dev/typecheck — even if the workspace has those deps installed elsewhere. Without the mirror, the LSP and `pnpm --filter <pkg> typecheck` both fail to resolve the import. Use `"<dep>": "catalog:"` to keep versions in lockstep with peer ranges. *(Encoded: sync-spec, 2026-05-04 — Step 8a of spec 22)*

## Implementation Completeness

- **CollectionListView needs a real data table**: The list view should include a TanStack
  Table implementation with column definitions derived from the collection's field config,
  not a `<p>` placeholder or a manual `<Table>` iteration. This was deferred to a dedicated
  data table spec because it requires cursor-based Convex pagination, column configuration,
  and sorting — enough complexity to deserve its own spec. Future specs for list views should
  default to including this. *(Noted: sync-spec 01, 2026-04-07)*

- **`Button nativeButton={false}` when wrapping non-button elements**: When Base UI's
  `Button` component wraps a non-`<button>` render element (e.g., `VexLink` which renders
  an `<a>`), always pass `nativeButton={false}` to suppress the accessibility warning.
  *(Encoded: sync-spec 01, 2026-04-07)*

## Convex ID Runtime Behavior

- **`GenericId<T>.__tableName` is a TypeScript phantom type — not a runtime property**: `Id<"posts">` is `string & { __tableName: "posts" }` at the TypeScript level only. At runtime, Convex IDs are plain strings (production: opaque base32; convex-test: `"{random};{tableName}"`). Accessing `(id as any).__tableName` is always `undefined` at runtime. When a server function needs the table name from an ID, use the convex-test extraction heuristic `(id as string).split(";").at(-1)` with `__tableName` as the higher-priority fallback. This works in convex-test and gracefully returns `undefined` in production (where IDs have no semicolon), enabling safe degradation. Apply this in any function that resolves the collection from an ID (e.g., `get` with `depth`). *(Encoded: sync-spec 24, 2026-05-10)*

## React Cells and Convex Subscription Data

- **`isMounted` guard on cells that read Convex subscription data**: Any React cell or component that reads from a Convex TanStack Query subscription (i.e., data driven by `convexQuery` + `useQuery`) must render a consistent placeholder on SSR and during the initial hydration render. Pattern: `const [isMounted, setIsMounted] = useState(false); useEffect(() => setIsMounted(true), []);` — return the placeholder (e.g., `—`) when `!isMounted`. Reason: Convex's reactive model can push subscription data into TanStack Query's cache via `useSyncExternalStore` synchronously during the hydration render, while the server rendered from a different snapshot. This causes a systematic hydration mismatch on every page load if cells render real data on first client render. The `isMounted` guard ensures the first client render matches the server output (static placeholder); data appears after mount. Apply to all collection list-view cells that display relationship, computed, or subscription-driven data. *(Encoded: sync-spec 24, 2026-05-10)*

## API Design — Mutation Client Files (Spec 24)

- **Mutation client files export `create()` / `update()` / `remove()` factory functions, not bare re-exports of `vexConvexApi.*`**: The spec (D8) said to re-export `vexConvexApi.create` directly, but the actual implementation wraps each in a factory function that calls `useConvexMutation` internally: `export function create() { return useConvexMutation(vexConvexApi.create); }`. Consumers call it as `mutationFn: create()` inside `useMutation({ ... })` — keeping the hook call at React's top level. The factory pattern is more ergonomic at call sites (`mutationFn: create()`) than the spec's re-export pattern (`mutationFn: useConvexMutation(vexConvexApi.create)`). Follow this factory pattern for any future mutation client file. *(Encoded: sync-spec 24, 2026-05-10)*

## API Design — Vex API (Spec 23)

- **`collection:` not `slug:` as the param name**: All `find`/`search`/`create` server and client API functions use `collection: TSlug` not `slug: TSlug`. Matches the Convex convention (`args.collection`) and avoids confusion with Convex's internal table-name concept. *(Encoded: sync-spec 23, 2026-05-09)*

- **Factory functions co-located with server barrel, not a separate file**: `queryApi` and `mutationApi` live in `src/api/server.ts` alongside the server barrel exports, not in a separate `src/api/index.ts` or `src/convex/factory.ts`. The `@vexcms/core/convex` package export maps to `server.ts`. *(Encoded: sync-spec 23, 2026-05-09)*

- **`Prettify<ConditionalReturnItem>` for IDE-visible populate narrowing**: Any server query function that supports optional populate should use the three-part pattern: (1) `const TPopulate` generic to preserve literal populate keys, (2) `[TPopulate] extends [Record<string, never>]` tuple-wrapped discriminator to branch on populate presence, (3) `Prettify<Populated<TSlug, TPopulate>>` on the populated branch to force TypeScript to eagerly evaluate the mapped type. This eliminates the `Id<"slug">[] | Doc[]` union that other CMSes leave for users to handle. *(Encoded: sync-spec 23, 2026-05-09)*

- **`as CollectionSlug` not `as never` at factory/URL-param boundaries**: When bridging from `string` (Convex validator output, URL params) to `CollectionSlug` (narrowed literal union), use `args.collection as CollectionSlug`. Never use `as never` — it collapses the `TSlug` type parameter to `never` which propagates through all conditional return types, making everything `never`. *(Encoded: sync-spec 23, 2026-05-09)*

- **Convex reactivity requires module-level client singletons**: `ConvexReactClient`, `ConvexQueryClient`, and `QueryClient` must be module-level singletons (not created inside a React component with `useState`). `convexQueryClient.connect(queryClient)` must be called synchronously at module load time. If `connect()` is called in `useEffect`, there is a timing window where queries added to the TanStack cache during first render miss the `"added"` event and never get a Convex WebSocket subscription — mutations update the DB but the UI doesn't react. *(Encoded: sync-spec 23, 2026-05-09)*

- **Expose full Convex query chain as optional args on server `find`**: `find.server.ts` accepts `filter?`, `order?`, and `withIndex?` in addition to `populate?` and `limit?`. These map directly to `ctx.db.query().filter()`, `.order()`, `.withIndex()`. This is the pattern for all future server query functions — the goal is that users never need to bypass the API to get the expressiveness of raw `ctx.db.query()` calls, while the API remains the mandatory interception point for future hooks. *(Encoded: sync-spec 23, 2026-05-09)*
