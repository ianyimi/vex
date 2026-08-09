# Naming Conventions

## Identifiers

- **Hooks:** `useXxx` (`useCollectionForm`, `usePaginatedQuery`). A context with a companion hook lives as ONE file in `hooks/` named after the hook (`hooks/useFrameworkComponents.ts`).
- **Event handlers:** `onXxx` for props (`onSubmit`, `onSelectionChange`); `handleXxx` for internal functions (`handleBulkDelete`).
- **Booleans:** `isXxx` for state (`isMounted`, `isPending`, `isMobile`), `hasXxx` for possession (`_hasDraft`). Config flags may be bare nouns per Convex/Payload convention (`required`, `hidden`).
- **Components:** PascalCase, descriptive suffixes: `XxxView` (admin views), `XxxModal`, `XxxProvider`, `XxxLayout`. Adapter prefixes: `Next*` for `@vexcms/next` (`NextAdminPage`), `Vex*` reserved for framework-agnostic APIs from core/react.
- **Types:** plain `Xxx` for resolved shapes, `XxxInput` for user-facing input variants (`VexConfigInput` -> `VexConfig`, `TypesConfigInput` -> `TypesConfig`). Never `IXxx`, `XxxType`, `XxxT`.
- **Constants:** exported constants SCREAMING_SNAKE (`ADMIN_FIELDS`); file-local camelCase.
- **Field types:** named for the UI widget, never the data type — `checkbox()` not `boolean()`, `select()` not `string()`.
- **Convex functions:** mutation payload arg is `data` (never `fields`); collection param is `collection:` (never `slug:`); generated admin mutations use `adminXxx` verb prefix (`adminSaveDraft`, `adminPublish`).

## File / Folder Rules

```yaml
rules:
  - id: react-components-pascal
    pattern: '^([A-Z][A-Za-z0-9]*|index|create[A-Z][A-Za-z0-9]*)\.tsx$|^[a-zA-Z][A-Za-z0-9]*\.ts$'
    scope: ["packages/react/src/components/**/*.tsx", "!packages/react/src/components/ui/**", "!packages/react/src/components/fields/**", "packages/next/src/**/*.tsx"]
    description: React component files are PascalCase named after their default export.
    examples: ["AdminLayout.tsx", "CollectionListView.tsx", "MediaPicker.tsx"]
    counter_examples: ["admin-layout.tsx", "collectionListView.tsx"]
  - id: shadcn-ui-kebab
    pattern: '^[a-z][a-z0-9-]*\.(tsx|ts)$|^[A-Z][A-Za-z0-9]*\.tsx$|^(use|create)[A-Z][A-Za-z0-9]*\.tsx?$|^(index|context|constants|types|utils)\.tsx?$'
    scope: ["packages/react/src/components/ui/**"]
    description: shadcn-generated primitives keep their kebab-case names (button.tsx, alert-dialog.tsx); hand-written additions in ui/ may be PascalCase (ThemeProvider.tsx, data-table/DataTable.tsx).
    examples: ["button.tsx", "alert-dialog.tsx", "ThemeProvider.tsx"]
    counter_examples: ["Button.tsx (regenerating shadcn would clash)"]
  - id: hooks-camel-use
    pattern: '^use[A-Z][A-Za-z0-9]*\.tsx?$|^use-[a-z-]+\.ts$|^index\.ts$'
    scope: ["packages/react/src/hooks/**"]
    description: Hook files are camelCase named after the exported hook. shadcn-generated hooks (use-mobile.ts) keep kebab-case.
    examples: ["useCollectionForm.ts", "usePagination.ts", "use-mobile.ts"]
    counter_examples: ["collection-form-hook.ts", "UseCollectionForm.ts"]
  - id: core-field-module
    pattern: '^(config|types|validator|inputSchema|constants|index)(\.test)?\.ts$'
    scope: ["packages/core/src/fields/*/**"]
    description: Each core field dir (lowercase widget name) contains config.ts, types.ts, validator.ts, inputSchema.ts, with colocated .test.ts files.
    examples: ["text/config.ts", "upload/validator.test.ts"]
    counter_examples: ["text/textConfig.ts", "upload/validator.spec.ts"]
  - id: react-field-module
    pattern: '^(Input|Cell|EmptyInput|FilledInput|columnDef|preview|index|types|utils|constants)\.(tsx|ts)$'
    scope: ["packages/react/src/components/fields/*/**"]
    description: Each react field dir mirrors the core field name and contains Input.tsx, Cell.tsx, columnDef.tsx (+ index.ts barrel).
    examples: ["text/Cell.tsx", "upload/FilledInput.tsx", "blocks/columnDef.tsx"]
    counter_examples: ["text/TextCell.tsx", "upload/input.tsx"]
  - id: tests-colocated
    pattern: '\.test\.tsx?$'
    scope: ["packages/*/src/**/*.test.*"]
    description: Tests are colocated next to the unit under test with a .test.ts(x) suffix — no __tests__ dirs, no .spec suffix.
    examples: ["validator.test.ts", "inputSchema.test.ts"]
    counter_examples: ["__tests__/validator.ts", "validator.spec.ts"]
  - id: non-component-camel
    pattern: '^[a-z][A-Za-z0-9.-]*\.ts$'
    scope: ["packages/core/src/**", "packages/cli/src/**"]
    description: Non-component TypeScript files are camelCase (or established lowercase names like constants.ts).
    examples: ["interfaceGen.ts", "generateVexTypes.ts", "baseTypes.ts"]
    counter_examples: ["InterfaceGen.ts", "interface_gen.ts"]
  - id: api-operation-split
    pattern: '^(client|server)(\.test)?\.ts$'
    scope: ["packages/core/src/api/*/**"]
    description: Core API operations are directories named for the operation, split into client.ts and server.ts implementations.
    examples: ["api/find/client.ts", "api/find/server.ts", "api/create/server.ts"]
    counter_examples: ["api/find.ts", "api/findClient.ts"]
  - id: cli-command-verbs
    pattern: '^[a-z][a-zA-Z0-9]*\.ts$'
    scope: ["packages/cli/src/commands/**"]
    description: CLI command files are camelCase verbs naming the action.
    examples: ["commands/dev.ts", "commands/deploy.ts", "commands/generate.ts"]
    counter_examples: ["commands/dev-server.ts", "commands/StartDev.ts"]
  - id: convex-resource-files
    pattern: '^[a-z][a-zA-Z0-9.]*\.ts$'
    scope: ["apps/www/convex/*.ts", "apps/www/convex/auth/**", "apps/www/convex/vex/**"]
    description: Convex function files are camelCase resource/action nouns.
    examples: ["convex/media.ts", "convex/collections.ts", "convex/auth/db.ts"]
    counter_examples: ["convex/media-operations.ts", "convex/GetMedia.ts"]
  - id: react-context-suffix
    pattern: '^[A-Z][A-Za-z0-9]*Context\.tsx?$'
    scope: ["packages/react/src/**/*Context.*", "apps/www/src/**/*Context.*"]
    description: React Context definition files are PascalCase with a Context suffix; a context with a companion hook lives instead as one hooks/useXxx.ts file.
    examples: ["form/AppFormContext.ts", "context/VexConfigContext.ts"]
    counter_examples: ["app-form-context.ts", "AppForm.ts (missing suffix)"]
  - id: auth-file-roles
    pattern: '^(client|server|serverUtils|options|permissions|types)\.tsx?$'
    scope: ["apps/www/src/auth/**"]
    description: Host-app auth files use fixed role names separating client/server/util/config concerns.
    examples: ["auth/client.tsx", "auth/server.ts", "auth/serverUtils.ts"]
    counter_examples: ["auth/client-auth.tsx", "auth/AuthClient.tsx"]
  - id: vexcms-resource-defs
    pattern: '^[a-z][a-zA-Z0-9-]*\.ts$'
    scope: ["apps/www/src/vexcms/collections/**", "apps/www/src/vexcms/blocks/**"]
    description: Collection and block definitions are camelCase resource names (no PascalCase, no type suffixes). Preferred camelCase; kebab tolerated for legacy files pending rename.
    examples: ["collections/pages.ts", "collections/siteSettings.ts", "blocks/stats.ts"]
    counter_examples: ["collections/PageCollection.ts", "blocks/HeroBlock.ts"]
  - id: script-files
    pattern: '^[A-Za-z][A-Za-z0-9-]*\.(mjs|sh)$'
    scope: ["scripts/**/*.mjs", "scripts/**/*.sh"]
    description: Build/utility scripts are kebab-case .mjs (node) or .sh (shell).
    examples: ["scripts/vex-dev.mjs", "scripts/reset-packages.mjs", "scripts/rebuild-reset.sh"]
    counter_examples: ["scripts/vexDev.mjs", "scripts/rebuild_reset.sh"]
  - id: docs-content-kebab
    pattern: '^[a-z0-9]+(-[a-z0-9]+)*\.(mdx|md)$'
    scope: ["apps/docs/src/content/docs/*.md", "apps/docs/src/content/docs/*.mdx", "apps/docs/src/content/docs/guides/**", "apps/docs/src/content/docs/fields/**"]
    description: Hand-written docs content files are kebab-case .mdx/.md. The api/ subtree is TypeDoc-generated (symbol-named) and exempt.
    examples: ["docs/roadmap.md", "guides/custom-storage-adapter.mdx", "fields/blocks.mdx"]
    counter_examples: ["docs/CustomStorageAdapter.mdx", "docs/Custom_Storage_Adapter.md"]
```

## Known inconsistencies (flagged, not yet fixed)

- `packages/react/src/components/media/MediaLibaryGrid.tsx` — typo, should be `MediaLibraryGrid.tsx`.
- `packages/react/src/hooks/use-mobile.ts` — shadcn-generated kebab outlier among camelCase hooks.
- `apps/www/src/vexcms/blocks/logo-cloud.ts` — kebab outlier among camelCase block files.
