# Naming Conventions

## Identifiers

- **Hooks:** `useXxx` (`useCollectionForm`, `usePaginatedQuery`). A context with a companion hook lives as ONE file in `hooks/` named after the hook (`hooks/useFrameworkComponents.ts`).
- **Event handlers:** `onXxx` for props (`onSubmit`, `onSelectionChange`); `handleXxx` for internal functions (`handleBulkDelete`).
- **Booleans:** `isXxx` for state (`isMounted`, `isPending`, `isMobile`), `hasXxx` for possession (`hasDraft`). Config flags may be bare nouns per Convex/Payload convention (`required`, `hidden`).
- **Components:** PascalCase, descriptive suffixes: `XxxView` (admin views), `XxxModal`, `XxxProvider`, `XxxLayout`. Adapter prefixes: `Next*` for `@vexcms/next` (`NextAdminPage`), `Vex*` reserved for framework-agnostic APIs from core/react.
- **Types:** plain `Xxx` for resolved shapes, `XxxInput` for user-facing input variants (`VexConfigInput` -> `VexConfig`, `TypesConfigInput` -> `TypesConfig`). Never `IXxx`, `XxxType`, `XxxT`.
- **Constants:** exported constants SCREAMING_SNAKE (`ADMIN_FIELDS`); file-local camelCase.
- **Field types:** named for the UI widget, never the data type — `checkbox()` not `boolean()`, `select()` not `string()`.
- **Convex functions:** mutation payload arg is `data` (never `fields`); collection param is `collection:` (never `slug:`). Factory-registered API functions use bare operation names matching their factory export (`find`, `get`, `create`, `update`, `remove`, `globals`, `publish`, `saveDraft`) — no `adminXxx` prefix.
- **Name by code area, then thing:** an identifier's prefix says which part of the codebase it belongs to, because different areas share paradigms and so share nouns — `BaseFormFieldProps` (the app form), not `BaseFieldProps` or `BaseKitFieldProps`. Never invent an umbrella word the code doesn't use: no "kit", "frame", "toolkit", "layer". The exported form is the **app form** (`useAppForm`, `AppForm`, `src/form/`).

## File / Folder Rules

```yaml
rules:
  - id: react-components-pascal
    pattern: '^([A-Z][A-Za-z0-9]*|index|create[A-Z][A-Za-z0-9]*|resolve[A-Z][A-Za-z0-9]*|use[A-Z][A-Za-z0-9]*)\.tsx$|^[a-zA-Z][A-Za-z0-9]*\.ts$'
    scope: ["packages/react/src/*/*.tsx", "!packages/react/src/ui/**", "!packages/react/src/fields/**", "!packages/react/src/fields/*.tsx", "!packages/react/src/forms/**", "packages/next/src/**/*.tsx", "packages/richtext-plate/src/**/*.tsx"]
    description: React component files are PascalCase named after their default export; `create*` factories and `resolve*` component resolvers (functions returning a `ComponentType`, composing an override chain with JSX) keep their camelCase names. See /dev/naming-conventions/#react-components-pascal.
    examples: ["AdminLayout.tsx", "CollectionListView.tsx", "MediaPicker.tsx", "resolveFieldComponent.tsx"]
    counter_examples: ["admin-layout.tsx", "collectionListView.tsx"]
  - id: shadcn-ui-kebab
    pattern: '^[a-z][a-z0-9-]*\.(tsx|ts)$|^[A-Z][A-Za-z0-9]*\.tsx$|^(use|create)[A-Z][A-Za-z0-9]*\.tsx?$|^(index|context|constants|types|utils)\.tsx?$'
    scope: ["packages/react/src/ui/**"]
    description: shadcn-generated primitives keep their kebab-case names (button.tsx, alert-dialog.tsx); hand-written additions in ui/ may be PascalCase (ThemeProvider.tsx, data-table/DataTable.tsx). See /dev/naming-conventions/#shadcn-ui-kebab.
    examples: ["button.tsx", "alert-dialog.tsx", "ThemeProvider.tsx"]
    counter_examples: ["Button.tsx (regenerating shadcn would clash)"]
  - id: hooks-camel-use
    pattern: '^use[A-Z][A-Za-z0-9]*\.tsx?$|^use-[a-z-]+\.ts$|^index\.ts$'
    scope: ["packages/react/src/hooks/**"]
    description: Hook files are camelCase named after the exported hook. shadcn-generated hooks (use-mobile.ts) keep kebab-case. See /dev/naming-conventions/#hooks-camel-use.
    examples: ["useCollectionForm.ts", "usePagination.ts", "use-mobile.ts"]
    counter_examples: ["collection-form-hook.ts", "UseCollectionForm.ts"]
  - id: core-field-module
    pattern: '^(config|types|validator|inputSchema|constants|convert|formats|utils|index)(\.test)?\.ts$'
    scope: ["packages/core/src/fields/*/**"]
    description: Each core field dir (lowercase widget name) contains config.ts, types.ts, validator.ts, inputSchema.ts, with colocated .test.ts files. See /dev/naming-conventions/#core-field-module.
    examples: ["text/config.ts", "upload/validator.test.ts"]
    counter_examples: ["text/textConfig.ts", "upload/validator.spec.ts"]
  - id: react-field-module
    pattern: '^(Field|Cell|EmptyInput|FilledInput|columnDef|preview|index|types|utils|constants|testFixture|clipboard)\.(tsx|ts)$|^[A-Z][A-Za-z0-9]*\.tsx$|^use[A-Z][A-Za-z0-9]*\.ts$'
    scope: ["packages/react/src/fields/*/**"]
    description: Each react field dir mirrors the core field name and contains Field.tsx, Cell.tsx, columnDef.tsx (+ index.ts barrel), plus testFixture.ts exporting that field type's FieldFixture and any field-specific test helper. Complex fields (date, color, json) may also hold a utils.ts of field-local helpers and PascalCase helper widget components (upload/relationship/richtext's EmptyInput/FilledInput/RelationshipPicker); layout fields (tabs/row/collapsible/ui) hold Field.tsx (+ Field.test.tsx) only — no Cell/columnDef, since they never appear in list views. A field type owns everything about itself in one folder; testing/fixtures/index.ts only aggregates. See /dev/naming-conventions/#react-field-module.
    examples: ["text/Cell.tsx", "upload/FilledInput.tsx", "blocks/columnDef.tsx", "text/testFixture.ts"]
    counter_examples: ["text/TextCell.tsx", "upload/input.tsx"]
  - id: react-app-form
    pattern: '^([A-Z][A-Za-z0-9]*Field|AppForm|FormFieldLayout|useAppForm|useVexForm|formContext|useArrayItems|useFieldErrorCount|changedValues|FormCompactContext|ArrayItemHeaderContext|types|index)\.(tsx|ts)$'
    scope: ["packages/react/src/forms/**"]
    description: The exported app form (@vexcms/react/form) is named after each field it exports (TextField.tsx, ArrayField.tsx, BlocksField.tsx), plus the fixed roles formContext.ts, useAppForm.ts, AppForm.tsx, FormFieldLayout.tsx, types.ts. These files read useFieldContext()/useFormContext() and plain props only — never fieldDef, VexConfigContext, or permissions; that wiring belongs in fields/<type>/Field.tsx. BlocksField's `cloneBlock` prop is intentionally optional — callers that omit it simply don't get a per-item duplicate action. See /dev/naming-conventions/#react-app-form.
    examples: ["forms/TextField.tsx", "forms/ArrayField.tsx", "forms/useAppForm.ts", "forms/FormFieldLayout.tsx"]
    counter_examples: ["forms/Input.tsx", "forms/TextField.tsx importing VexConfigContext"]
  - id: tests-colocated
    pattern: '\.test\.tsx?$'
    scope: ["packages/*/src/**/*.test.*"]
    description: Tests are colocated next to the unit under test with a .test.ts(x) suffix — no __tests__ dirs, no .spec suffix. See /dev/naming-conventions/#tests-colocated.
    examples: ["validator.test.ts", "inputSchema.test.ts"]
    counter_examples: ["__tests__/validator.ts", "validator.spec.ts"]
  - id: non-component-camel
    pattern: '^[a-z][A-Za-z0-9.-]*\.ts$'
    scope: ["packages/core/src/**", "packages/cli/src/**"]
    description: Non-component TypeScript files are camelCase (or established lowercase names like constants.ts). See /dev/naming-conventions/#non-component-camel.
    examples: ["interfaceGen.ts", "generateVexTypes.ts", "baseTypes.ts"]
    counter_examples: ["InterfaceGen.ts", "interface_gen.ts"]
  - id: react-testing-kit-camel
    pattern: '^[a-z][A-Za-z0-9]*\.(ts|tsx)$|^index\.tsx?$'
    scope: ["packages/react/src/testing/**"]
    description: The exported testing kit (factories, shared harness, the fixture registry/type) is camelCase — it ships as plain functions, not components, even where a file contains JSX. Per-field-type fixture DATA does not live here; it lives in each field's own fields/<type>/testFixture.ts. See /dev/naming-conventions/#react-testing-kit-camel.
    examples: ["fieldInputContract.ts", "nestedFieldContainer.ts", "harness/accessFixtures.ts", "fixtures/index.ts"]
    counter_examples: ["FieldInputContract.ts", "fixtures/text.ts (per-type data belongs in the field's own folder)"]
  - id: api-operation-split
    pattern: '^[a-z][A-Za-z0-9]*Api\.ts$|^(server|types|index)(\.test)?\.ts$|^[a-z][A-Za-z0-9]*\.(ts)$'
    scope: ["packages/core/src/*/api/**"]
    description: Each domain's api/ folder holds one <op>/server.ts (+ server.test.ts) per operation, a <domain>Api.ts factory named after its export, and an index.ts that only re-exports. A types.ts holds arg/result types shared across that domain's operations. See /dev/naming-conventions/#api-operation-split.
    examples: ["collections/api/find/server.ts", "globals/api/upsert/server.ts", "versions/api/publish/server.ts", "media/api/mediaApi.ts"]
    counter_examples: ["collections/api/find.server.ts", "globals/api/upsertServer.ts", "media/api/queries.ts"]
  - id: cli-command-verbs
    pattern: '^[a-z][a-zA-Z0-9]*\.ts$'
    scope: ["packages/cli/src/commands/**"]
    description: CLI command files are camelCase verbs naming the action. See /dev/naming-conventions/#cli-command-verbs.
    examples: ["commands/dev.ts", "commands/deploy.ts", "commands/generate.ts"]
    counter_examples: ["commands/dev-server.ts", "commands/StartDev.ts"]
  - id: convex-resource-files
    pattern: '^[a-z][a-zA-Z0-9.]*\.ts$'
    scope: ["apps/test/convex/*.ts", "apps/test/convex/auth/**", "apps/test/convex/vex/**"]
    description: Convex function files are camelCase resource/action nouns. See /dev/naming-conventions/#convex-resource-files.
    examples: ["convex/media.ts", "convex/collections.ts", "convex/auth/db.ts"]
    counter_examples: ["convex/media-operations.ts", "convex/GetMedia.ts"]
  - id: react-context-suffix
    pattern: '^[A-Z][A-Za-z0-9]*Context\.tsx?$'
    scope: ["packages/react/src/**/*Context.*", "apps/test/src/**/*Context.*", "apps/www/src/**/*Context.*", "packages/create-vexcms/templates/*/src/**/*Context.*"]
    description: React Context definition files are PascalCase with a Context suffix; a context with a companion hook lives instead as one hooks/useXxx.ts file. See /dev/naming-conventions/#react-context-suffix.
    examples: ["form/AppFormContext.ts", "context/VexConfigContext.ts"]
    counter_examples: ["app-form-context.ts", "AppForm.ts (missing suffix)"]
  - id: auth-file-roles
    pattern: '^(access|client|hasPermission|options|permissions|plugins|schema|server|serverUtils|types)(\.typecheck)?\.tsx?$'
    scope: ["apps/test/src/auth/**"]
    description: Host-app auth files use fixed role names separating client/server/util/config concerns. RBAC adds `access` (the `defineAccess` matrix), `hasPermission` (the app-side check wrapper), and `plugins` (the better-auth plugin list). `schema` is the client-safe half of the auth options — model names, additional fields, and the plugin descriptor map — imported by BOTH `options.ts` and `vex.config.ts` so they cannot drift; it must stay free of server imports. A role may carry a `<role>.typecheck.ts` sibling — a pure compile-time assertion file (P-008) that `tsc` enforces; it pins the role's generated/registry-derived types (e.g. `access.typecheck.ts` pins slug-aware action unions). See /dev/naming-conventions/#auth-file-roles.
    examples: ["auth/client.tsx", "auth/server.ts", "auth/serverUtils.ts", "auth/access.ts", "auth/plugins.ts", "auth/schema.ts"]
    counter_examples: ["auth/client-auth.tsx", "auth/AuthClient.tsx"]
  - id: vexcms-resource-defs
    pattern: '^[a-z][a-zA-Z0-9-]*(\.typecheck)?\.ts$'
    scope: ["apps/test/src/vexcms/collections/**"]
    description: Collection definitions are camelCase resource names (no PascalCase, no type suffixes). Preferred camelCase; kebab tolerated for legacy files pending rename. See /dev/naming-conventions/#vexcms-resource-defs.
    examples: ["collections/pages.ts", "collections/siteSettings.ts"]
    counter_examples: ["collections/PageCollection.ts"]
  - id: vexcms-block-module
    pattern: '^(config|index|constants)\.(ts|tsx)$'
    scope: ["apps/test/src/vexcms/blocks/*/**"]
    description: Each block is a PascalCase directory (named for the block, matching its blockType literal in title case) holding config.ts (the defineBlock() call) and index.tsx (the renderer); blocks/config.ts and blocks/index.ts at the top level only aggregate. See /dev/naming-conventions/#vexcms-block-module.
    examples: ["blocks/LogoCloud/config.ts", "blocks/LogoCloud/index.tsx", "blocks/Hero/config.ts"]
    counter_examples: ["blocks/logo-cloud.ts", "blocks/LogoCloud/LogoCloudConfig.ts"]
  - id: script-files
    pattern: '^[A-Za-z][A-Za-z0-9-]*(\.test)?\.(mjs|sh)$'
    scope: ["scripts/**/*.mjs", "scripts/**/*.sh"]
    description: Build/utility scripts are kebab-case .mjs (node) or .sh (shell). See /dev/naming-conventions/#script-files.
    examples: ["scripts/vex-dev.mjs", "scripts/verify-scaffold.mjs", "scripts/template-diff.mjs"]
    counter_examples: ["scripts/vexDev.mjs", "scripts/verify_scaffold.mjs"]
  - id: docs-content-kebab
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*\.(mdx|md)$'
    scope: ["apps/docs/src/content/docs/*.md", "apps/docs/src/content/docs/*.mdx", "apps/docs/src/content/docs/guides/**", "apps/docs/src/content/docs/fields/**"]
    description: Hand-written docs content files are kebab-case .mdx/.md. The api/ subtree is TypeDoc-generated (symbol-named) and exempt. See /dev/naming-conventions/#docs-content-kebab.
    examples: ["docs/roadmap.md", "guides/custom-storage-adapter.mdx", "fields/blocks.mdx"]
    counter_examples: ["docs/CustomStorageAdapter.mdx", "docs/Custom_Storage_Adapter.md"]
  - id: react-feature-folders
    pattern: '^(access|admin|auth|client|collections|config|documents|fields|forms|globals|hooks|livePreview|media|modals|revalidate|slots|testing|ui|utils|versions|adapter\.ts|index\.ts)$'
    scope: ["packages/react/src/*"]
    description: "The react package's top level is a CLOSED set of domain folders mirroring core/src/ (access, admin, auth, client, collections, config, documents, fields, forms, globals, hooks, livePreview, media, modals, revalidate, slots, testing, ui, utils, versions) plus adapter.ts and index.ts. A new top-level folder is allowed only for a new domain that core/src/ also has, and is added to this list in the same change; never one named after a UI surface, view, or feature (list/, edit/, data/, views/, table/, filters/, actions/). Placement: code serving ONE domain's view lives in that domain folder with a domain/view name prefix (collections/CollectionListToolbar.tsx). Code shared by several domains' views goes in the existing domain that owns the shared concept (collection + global edit view → documents/, mirroring core/src/documents/); if none fits, ask the developer. Hooks bound to a domain stay in it (access/usePermission.ts); hooks/ holds only generic hooks reused across domains (usePaginatedQuery, useVexList). Generic UI primitives with no domain knowledge go in ui/ (ui/data-table/DataTableColumnsMenu.tsx). Inside a domain folder, files stay flat; the only subfolders are api/ (server.ts + client.ts per operation) and fields/<type>/. Once a folder grows crowded, the DEVELOPER splits it into the conventional React subfolders components/, hooks/, context/. Agents never split a folder themselves and never invent ad-hoc subfolders (collections/list/, collections/filters/, edit/actions/). See /dev/naming-conventions/#react-feature-folders."
    examples: ["collections/CollectionEditView.tsx", "collections/CollectionListToolbar.tsx", "access/usePermission.ts", "hooks/useVexList.ts", "ui/data-table/DataTableColumnsMenu.tsx", "versions/api/publish/client.ts", "fields/text/Field.tsx"]
    counter_examples: ["list/ListToolbar.tsx", "edit/SaveAction.tsx", "data/useVexList.ts", "collections/filters/FilterBuilder.tsx", "components/views/CollectionEditView.tsx", "hooks/usePermission.ts"]
  - id: core-domain-folders
    pattern: '^(access|auth|collections|components|config|db|documents|editor|fields|globals|hooks|livePreview|media|revalidate|routes|schema|types|utils|versions|[a-z][A-Za-z0-9]*(\.test)?\.ts)$'
    scope: ["packages/core/src/*"]
    description: "The core package's top level is a CLOSED set of domain folders plus camelCase root modules (index.ts, server.ts, errors.ts, framework.ts, vexConvexApi.ts). A new domain folder is added to this list in the same change that creates it. Never add a folder for a sub-feature of an existing domain. Saved views are a collections feature, so they go in collections/types.ts and collections/api/saveView/server.ts, not in views/. New server operations go in <domain>/api/<op>/server.ts (api-operation-split). See /dev/naming-conventions/#core-domain-folders."
    examples: ["collections/resolveSort.ts", "collections/api/saveView/server.ts", "documents/cloneDocumentForDuplicate.ts"]
    counter_examples: ["views/types.ts", "list/resolveSort.ts", "edit/duplicate.ts"]
  - id: host-app-components-pascal
    pattern: '^([A-Z][A-Za-z0-9]*)\.tsx$'
    scope: ["apps/test/src/components/*.tsx", "apps/www/src/components/*.tsx", "apps/test/src/components/motion-primitives/*.tsx", "apps/www/src/components/motion-primitives/*.tsx", "packages/create-vexcms/templates/*/src/components/*.tsx", "packages/create-vexcms/templates/*/src/components/motion-primitives/*.tsx"]
    description: Host-app `components/` root is PascalCase components named after their default export (mirrors react-components-pascal); `ui/` keeps the shadcn exception below, `providers/` keeps its fixed roles, and `motion-primitives/` (marketing-site derived apps only) is a feature subfolder of plain PascalCase widgets, not a components/providers-style fixed-role folder. See /dev/naming-conventions/#host-app-components-pascal.
    examples: ["components/BrandMark.tsx", "components/SiteFooter.tsx", "components/motion-primitives/AnimatedGroup.tsx"]
    counter_examples: ["components/component-example.tsx", "components/motion-primitives/animated-group.tsx"]
  - id: host-app-ui-kebab
    pattern: '^[a-z][a-z0-9-]*\.(tsx|ts)$|^[A-Z][A-Za-z0-9]*\.tsx$|^(use|create)[A-Z][A-Za-z0-9]*\.tsx?$|^(index|context|constants|types|utils)\.tsx?$'
    scope: ["apps/test/src/components/ui/**", "apps/www/src/components/ui/**", "packages/create-vexcms/templates/*/src/components/ui/**"]
    description: Host-app `components/ui/` mirrors packages/react/src/ui's shadcn-ui-kebab exception — generated primitives keep kebab-case, hand-written additions may be PascalCase. See /dev/naming-conventions/#host-app-ui-kebab.
    examples: ["ui/button.tsx", "ui/field.tsx"]
    counter_examples: ["ui/Button.tsx"]
  - id: host-app-providers-fixed-roles
    pattern: '^(client|server|auth|convex)\.tsx$'
    scope: ["apps/test/src/components/providers/*.tsx", "apps/www/src/components/providers/*.tsx", "packages/create-vexcms/templates/*/src/components/providers/*.tsx"]
    description: Host-app `components/providers/` is a fixed-role folder, like auth/ — one file per provider concern (client-only context providers, server-rendered wrappers, auth session provider, Convex client provider), composed in app/layout.tsx. Not a dumping ground for arbitrary components. See /dev/naming-conventions/#host-app-providers-fixed-roles.
    examples: ["providers/client.tsx", "providers/server.tsx", "providers/auth.tsx", "providers/convex.tsx"]
    counter_examples: ["providers/Providers.tsx", "providers/AppProviders.tsx"]
  - id: host-app-lib-camel
    pattern: '^[a-z][A-Za-z0-9.-]*\.ts$'
    scope: ["apps/test/src/lib/**", "apps/www/src/lib/**", "packages/create-vexcms/templates/*/src/lib/**"]
    description: Host-app `lib/` holds camelCase utility functions and hooks (useXxx.ts for hooks, camelCase.ts for utilities) — no feature-folder restructure; each file is a self-contained concern (metadata.ts, highlight.ts, vex.ts). See /dev/naming-conventions/#host-app-lib-camel.
    examples: ["lib/resolvePagePath.ts", "lib/useSitePreviewMode.ts", "lib/metadata.ts"]
    counter_examples: ["lib/ResolvePagePath.ts", "lib/resolve-page-path.ts"]
  - id: next-adapter-layout
    pattern: '^(Next[A-Z][A-Za-z0-9]*\.tsx|[a-z][A-Za-z0-9]*\.ts|index\.ts)$'
    scope: ["packages/next/src/*"]
    description: packages/next is a framework adapter, not a domain package — its root holds the primary `Next*.tsx` components (NextAdminPage, NextAdminLayout, NextAdminLayoutClient) plus index.ts, and capability folders (cache/, seo/, testing/) group by what they do rather than mirroring core/react's domain structure. Codified as-is per spec's pass-2 review (next has 0 violations). See /dev/naming-conventions/#next-adapter-layout.
    examples: ["NextAdminPage.tsx", "cache/index.ts", "seo/vexMetadata.ts"]
    counter_examples: ["admin/NextAdminPage.tsx (no restructure needed)"]
```

