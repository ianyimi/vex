# Review 2 — Pass 2 convention review (after Pass 1 decisions)

## Summary

Open: 3 violations (core db→globals/api import; react 2 empty utils.ts; CodeHighlightContext in components/ in apps/test + marketing-site template), 3 gaps (core layout-field nesting; file-storage-convex uploadFile test; host-app rule scope excludes templates). apps/test "gaps" restate rules already codified in Pass 1 — closed, no action. next, cli, better-auth, richtext-plate, apps/www, apps/docs: none.

## core

### Violations

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| VIOLATION | Shared infrastructure imports from domain api | db/triggers.ts:5 | 1 | Move `flattenGlobalRow` function from `globals/api/utils.ts` to `globals/` layer (e.g., `globals/utils.ts` alongside the config utils), so db/ can import from the domain layer rather than domain api/. This function converts global rows for both the api layer AND the triggers mechanism in db/, making it a shared-within-domain utility, not api-specific. |

### Gaps

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| GAP | Layout field organization | fields/ui/{ui,tabs,collapsible,row}/ | 4 | Decide: (A) Keep nested structure under fields/ui/ to group layout-only fields together; clarify in naming-conventions.md that layout fields may be grouped. (B) Flatten to fields/{ui,tabs,collapsible,row}/ to mirror data field organization at root; move fields/ui/ui -> fields/ui, fields/ui/tabs -> fields/tabs, etc., plus adjust all re-exports in fields/ui/index.ts and fields/index.ts. Current structure is functionally correct (all files present, all re-exports working) but lacks documented convention. |

### Conventions (Verified Compliant)

| kind | rule/area | paths | count | evidence |
|---|---|---|---|---|
| CONVENTION | Domain organization with shared infrastructure | collections/, globals/, versions/, media/, db/, access/, documents/, config/ | 8 domains + 5 shared | Domain folders contain domain-specific logic; db/, access/, documents/, config/ contain cross-domain infrastructure with no reverse imports |
| CONVENTION | api/ folders centralize operations | collections/api/, globals/api/, versions/api/, media/api/ | 4 folders | Each domain owns api/ containing <op>/server.ts + <domain>Api.ts factory, with no cross-domain api imports |
| CONVENTION | Field module file roles | 18 field folders (16 data + 4 layout, some with utils.ts) | 18 | Each data field has config.ts, types.ts, validator.ts, inputSchema.ts, index.ts; layout fields have config.ts, types.ts, index.ts (no validator/inputSchema); complex fields (color, richtext, array, blocks, upload, json) include utils.ts/utils.test.ts |
| CONVENTION | index.ts re-exports only | All domain/shared/field index.ts files | 40+ files | No logic in barrel files; all index.ts files contain only `export *` directives |
| CONVENTION | types.ts holds type definitions | types.ts in collections/, globals(), versions/api/, fields/, access/, documents/, config/ | 8 files | All types.ts files contain only type definitions, no runtime logic |
| CONVENTION | Constants in SCREAMING_SNAKE | ADMIN_FIELDS, DRAFT_ACTIONS, VERSION_STATUSES, WILDCARD_KEY, QUERY_INDEX_CONSTRAINT_COMPARATORS | 5 constants | All exported constants follow SCREAMING_SNAKE naming |
| CONVENTION | Args types naming | Vex*Args for public API, *ServerArgs for server operations | 40+ types | FindServerArgs, GetServerArgs, CreateServerArgs for internal; VexFindArgs, VexGetArgs for public vex.* functions |
| CONVENTION | Return types naming | *Return, *Result suffixes | 20+ types | FindReturn, GetReturn, SearchReturn, VersionSnapshotResult, etc. |
| CONVENTION | Domain layer file organization | collections/, globals/, versions/, media/ roots hold shared logic | 20+ files | config.ts/validator.ts/interfaceGen.ts/hooks.ts/utils.ts at domain root, called by api/ operations |
| CONVENTION | No cross-domain api imports | Every api/ folder isolated | 4 folders | collections/api does not import globals/api, versions/api, or media/api; versions api operations only depend on versions layer |
| CONVENTION | Versions domain dual role | versions/{publish,saveDraft,unpublish,model,*.ts} + versions/api/ | 1 domain | Versions is both a cross-domain service AND a domain with its own api; api/ wraps shared layer functions cleanly |

### Import Direction Summary

- **Correct flow:** domains → shared (db/, access/, documents/, config/, versions/), never reverse
- **Exception (documented):** access/types.ts imports CollectionConfig from globals/, and access/validateAccessConfig.ts imports resolveCollectionIndexes from collections/ — necessary for RBAC, flagged for documentation in naming-conventions.md
- **No cycles detected** in spot checks of collections/api, versions/api, globals/api

### File Role Consistency

All recurring filename patterns verified:
- `config.ts`: field builders (text(), number()) or module configuration
- `types.ts`: type definitions only
- `validator.ts`: field validator converters
- `inputSchema.ts`: Zod schema builders
- `index.ts`: re-exports only
- `utils.ts`: utility functions in complex fields and shared modules (validators/, inputSchemas/, mask/)
- `constants.ts`: SCREAMING_SNAKE exported metadata

### Identifier Naming Summary

- Field builder functions: `text()`, `number()`, `checkbox()` (widget names, correct)
- Field config types: `TextField`, `NumberField`, `CheckboxField` (capitalized, correct)
- Document types: `VexDocument`, `VexVersionDocument` (Vex* prefix, correct)
- Access constraint types: `QueryIndexConstraint`, `QueryFilterConstraint` (Query* prefix for configs, correct)
- Access value types: `ConvexQueryIndex`, `ConvexQueryIndexRangeFn` (Convex* prefix for Convex-bound values, correct)
- Hooks: `BeforeChangeProps`, `GlobalBeforeChangeProps` (domain-specific prop types, correct)
- Document shape names: Auth* for auth documents (AuthUserDocument, AuthOrgDocument), correct

### No Open Issues from Review-1

- **Access domain imports:** Already flagged as acceptable exception for RBAC; recommend documenting in naming-conventions.md under "Documented exception" section
- **Empty globals/config/ files:** No longer present; were likely resolved in recent commits

## packages/react

### Violations

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| EMPTY FILE | Field module utils | packages/react/src/fields/relationship/utils.ts, packages/react/src/fields/select/utils.ts | 2 | Delete both empty files. Per Pass 1 decision, only date/color/json/upload complex fields should have utils.ts; relationship and select have no utilities to export. |

### Gaps

No open gaps. All Pass 1 decisions (field module structure, layout-field Cell/columnDef absence, BlocksField cloneBlock optionality, custom widget components) remain properly codified and implemented.

### Conventions Verified

| kind | rule/area | evidence | status |
|---|---|---|---|
| Field modules | Required files per field type | text, email, textarea, number, checkbox, date, url, select, color, json: Field.tsx, Cell.tsx, columnDef.tsx, testFixture.ts, index.ts all present; group, array, blocks, upload, richtext, relationship: additional custom widget components (EmptyInput/FilledInput/etc.) in appropriate fields only | ✓ |
| Layout fields | Only Field.tsx + test | tabs/, row/, collapsible/, ui/ each contain only Field.tsx and Field.test.tsx, no Cell/columnDef | ✓ |
| Complex field utils | Acceptable for date, color, json, upload | date/utils.ts, json/utils.ts, color/utils.ts, upload/utils.ts present with utilities; relationship/utils.ts and select/utils.ts are empty (violation noted above) | ⚠ |
| Forms layer | Isolation from admin config | useAppForm, AppForm, form-field components (TextField, ArrayField, BlocksField, etc.) read useFieldContext()/useFormContext() only; never fieldDef, VexConfigContext, admin permissions | ✓ |
| Admin fields | PascalCase naming | TextFieldAdmin, EmailFieldAdmin, ArrayFieldAdmin, BlocksFieldAdmin, RelationshipFieldAdmin, UploadFieldAdmin, RichTextFieldAdmin, etc. all follow pattern | ✓ |
| API operations | Domain/operation structure | collections/api/{find,get,search,create,update,remove}/client.ts; globals/api/{find,get,upsert}/client.ts; versions/api/{saveDraft,publish,unpublish,listVersions,getVersionSnapshot,deleteVersion}/client.ts | ✓ |
| Client barrel | Re-exports only | packages/react/src/client/index.ts re-exports all domain operations with correct types, no logic | ✓ |
| Blocks field | clipboard utility | clipboard.tsx contains helper functions and built-in action components; referenced in Field.tsx, not re-exported via barrel (Field.tsx re-exports two functions directly) | ✓ |
| Import direction | Form→Fields→Admin | Fields import from forms, config, ui, utils, modals, admin, client, collections; forms never import from fields; no reverse dependencies | ✓ |
| Type isolation | Field module types | relationship/types.ts and other field modules with types.ts contain only type re-exports or minimal type definitions | ✓ |

### Actionable Items

1. Delete `packages/react/src/fields/relationship/utils.ts` (0B empty file)
2. Delete `packages/react/src/fields/select/utils.ts` (0B empty file)

## Next

No open violations or gaps.

## packages/cli

### Summary
**Violations:** 0  
**Gaps:** 0  

### Grouping
| kind | rule/area | count | evidence |
|---|---|---|---|
| CONVENTION | Layer-based organization (commands + lib) appropriate for CLI tool | 1 | src/commands (3 files) + src/lib (9 files) |
| CONVENTION | No domain mixing; utilities isolated from command dispatch | 1 | All lib imports are by command, no cross-domain dependencies |

### File Roles
| kind | rule/area | paths | count | notes |
|---|---|---|---|---|
| CONVENTION | CLI commands follow cli-command-verbs rule (camelCase verbs) | src/commands/dev.ts, src/commands/generate.ts, src/commands/deploy.ts | 3 | Pattern: ^[a-z][a-zA-Z0-9]*\.ts$ in commands/ folder |
| CONVENTION | Lib files follow non-component-camel rule (camelCase) | generateSchema.ts, loadConfig.ts, convexProcess.ts, logger.ts, resolveConfigPath.ts, resolveConvexUrl.ts, migrate.ts, traceImports.ts, watcher.ts | 9 | All filenames match their primary concern |
| CONVENTION | Test files colocated with .test.ts suffix | resolveConfigPath.test.ts, resolveConvexUrl.test.ts | 2 | Follows tests-colocated rule |
| CONVENTION | File content matches role name | all 12 lib+command files | 12 | Each filename accurately describes its exports |

### Exports and Imports
| kind | rule/area | count | evidence |
|---|---|---|---|
| CONVENTION | Single package export: index.ts → ./dist/index.js | 1 | package.json exports['.'] only; bin entry points to dist/index.js |
| CONVENTION | Commands import directly from lib utilities (no barrel re-exports) | 9 lib files | Each command imports from specific lib files; no index.ts re-export in lib/ |
| CONVENTION | Acyclic import graph: index → commands → lib | 1 | index.ts dispatches commands, commands call lib, lib has no upward imports |
| CONVENTION | ESM module imports with .js extensions | 30+ imports | All relative imports use .js suffix (e.g., "./lib/logger.js") |
| CONVENTION | No relative imports crossing package boundaries | 1 | All imports are local to packages/cli; external deps via @vexcms/core, convex |

### Identifiers
| kind | rule/area | examples | count | notes |
|---|---|---|---|---|
| CONVENTION | Command functions follow verb pattern | devCommand, generateCommand, deployCommand | 3 | Clear that each is a top-level CLI action |
| CONVENTION | Utility functions are descriptive camelCase | loadConfig, resolveConfigPath, createResolver, startConvexDev, waitForDeploy, killConvexDev, writeVexTypes, generateAndWrite, getOutputPath, traceImports, executeMigration, createWatcher, resolveConvexUrl, patchConvexTsconfig, deployToProduction, executeFieldRemoval, and 10+ more | 25+ | Each name clearly states what the function does |
| CONVENTION | Interface/Type names are PascalCase | DevOptions, GenerateOptions, GenerateResult, MigrateOptions, RemovalOptions, Watcher, PackageManager | 7 | Follows standard TypeScript identifier convention |
| CONVENTION | Constants are camelCase or SCREAMING_SNAKE | logger (camelCase), DEPLOY_SUCCESS_RE, DEPLOY_FAILURE_RE, LOCK_FILES, SEARCH_DIRS, SERVER_CONFIG_NAMES, CLIENT_CONFIG_NAMES, MUTATION_TIMEOUT_MS, IMPORT_RE, and color constants | 10+ | Exported constants use appropriate casing for their role |
| CONVENTION | No ambiguous naming; names reflect actual value in context | all identifiers | 40+ | No field-like names that could mean different things in different files |

### Verification
- **Import direction confirmed:** All imports flow from index → commands → lib with zero upward imports from lib
- **File naming precision:** Each filename (dev.ts, generate.ts, deploy.ts, generateSchema.ts, loadConfig.ts, etc.) accurately maps to its primary exports
- **Test coverage:** Two lib utilities have colocated test files; both follow .test.ts suffix convention
- **ESM consistency:** All relative imports use .js file extensions; package.json declares "type": "module"
- **No circular dependencies:** Import graph is strictly acyclic

### Conclusion
The CLI package maintains perfect alignment with established naming conventions and file-role patterns. No violations or gaps identified in Pass 2. All patterns observed in Review 1 continue to be correctly applied.

## better-auth

**Pass 1 Decision Applied:** ✓ Empty file `packages/better-auth/src/utils.ts` deleted

**Violations:** 0  
**Gaps:** 0  

### Findings

| kind | rule/area | paths | count | notes |
|---|---|---|---|---|
| CONVENTION | Adapter factory file naming | adapter.ts | 1 | Named after primary export `betterAuthAdapter()` ✓ |
| CONVENTION | Builder function naming (camelCase) | betterAuthAdapter, betterAuthCollections, authDbApi, createBetterAuthAdapter, convexAdapter, createGetAuth, anonRoleDatabaseHook | 7 | All factory/builder functions follow camelCase convention ✓ |
| CONVENTION | Package exports split (server + client) | package.json exports['.'], exports['./client'] | 2 | Server entry includes adapter + convex exports; client entry isolated ✓ |
| CONVENTION | Barrel re-exports only | index.ts, client.ts, convex/index.ts | 3 | All barrels contain only `export { ... } from ...` statements ✓ |
| CONVENTION | Type definitions in dedicated files | adapter.ts, collections.ts, convex/types.ts, pluginSchemas.ts | 4 | Types colocated with related logic or isolated in types.ts ✓ |
| CONVENTION | Test files colocated with `.test.ts` suffix | adapter.test.ts, pluginSchemas.test.ts, convex/anonRole.test.ts, convex/db.test.ts | 4 | All tests next to units under test ✓ |
| CONVENTION | Client entry has zero server imports | client.ts, collections.ts | 2 | No imports of convex/, adapter, or server-only modules ✓ |
| CONVENTION | Convex utilities isolated | convex/utils.ts | 1 | Helper functions (isUniqueField, checkUniqueFields, selectFields, etc.) in single file ✓ |
| CONVENTION | Import direction (flow down to server, up to client) | all 11 files | 11 | client → collections → pluginSchemas (pure data); adapter → @vexcms/core; convex → better-auth adapters ✓ |

### Assessment

**What works well:**
- Clean layer separation: server entry, client entry, convex framework folder
- No reverse imports; client.ts is genuinely browser-safe (~1 KB gzipped)
- Consistent naming: factory functions (betterAuthXxx, createXxx), types (BetterAuthXxx)
- Barrels contain only re-exports
- Tests properly colocated
- No circular imports detected

**No open violations or gaps.** The package is an adapter—not a domain package—and its layer-based organization is appropriate for that role. Import directions are clean and uni-directional. All naming conventions observed.

## file-storage-convex

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| CONVENTION | camelCase non-component files | src/mediaCollection.ts, src/storage.ts, src/adapter/{methods,uploadFile}.ts | 4 | Codified in review-1 ✓ |
| CONVENTION | Factory naming (`define*` config, `*Storage` adapter) | src/mediaCollection.ts (defineMediaCollection), src/storage.ts (convexFileStorage) | 2 | Codified in review-1 ✓ |
| CONVENTION | Barrels gate entries (`index.ts` full, `client.ts` client-safe subset) | src/index.ts, src/client.ts, src/adapter/index.ts | 3 | Codified in review-1 ✓ |
| CONVENTION | Colocated `.test.ts` files for core functions | src/mediaCollection.test.ts, src/storage.test.ts, src/adapter/methods.test.ts, src/adapter/index.test.ts, src/index.test.ts | 5 | Codified in review-1 ✓ |
| CONVENTION | Empty file removal (Pass 1 decision applied) | src/adapter/types.ts (deleted) | 1 | Completed ✓ |
| GAP | uploadFile.ts test coverage | src/adapter/uploadFile.ts (662B, no test file) | 1 | Decide: single-function browser utilities (uploadFile) in adapter/ may be exempt from colocated test requirement, or add uploadFile.test.ts for consistency with methods.ts. uploadFile is browser-side (no ctx) and exported to client entry, unlike Methods functions; pattern differs from methods.test.ts. |

### Assessment

**What works well:**
- Clean client-server separation via package.json exports ('.', './client')
- All factory naming follows established patterns (defineMediaCollection, convexFileStorage, ConvexStorageAdapter)
- Consistent camelCase file naming for non-component utilities
- Barrel re-exports are minimal and correct (index.ts full, client.ts subset, adapter/index.ts re-exports methods + uploadFile)
- Import direction correct (adapter imports from storage; storage imports from adapter; no reverse)
- Type naming consistent (ConvexStorageOptions, MediaCollectionConfig from @vexcms/core)

**What needs a decision:**
1. **uploadFile.ts test file** — The browser-side `uploadFile()` utility lacks a .test.ts file, unlike `methods.ts`. This is a gap because:
   - The naming-conventions.md rule `tests-colocated` applies universally ("colocated next to the unit under test")
   - However, uploadFile is a 662B browser-side POST wrapper, while methods.ts contains four server-side Convex operations
   - Methods are complex with multiple Convex ctx calls; uploadFile is a simple fetch wrapper
   - No established precedent in review-1 for exempting small utilities
   
   **Options:** (A) Add uploadFile.test.ts for consistency with methods.test.ts (3 tests covering success, HTTP error, JSON parse error); (B) Document uploadFile as a browser utility exempt from colocated test rule (analogous to how layout field Cell/columnDef are optional); (C) Inline uploadFile into adapter/index.ts as a private implementation detail (removes export, breaks client.ts)
   
   **Recommendation:** Option A — add uploadFile.test.ts with 3 tests (success, fetch failure, response parse error). Consistency with methods.test.ts and coverage of the two error paths in uploadFile's code (fetch failure, JSON parse). Small file, high value.

**No violations found.** The empty types.ts file identified in Pass 1 has been deleted per Step 24 decision. All remaining files follow codified conventions.

## Richtext

No open violations or gaps.

## marketing-site

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| VIOLATION | Context file placement | packages/create-vexcms/templates/marketing-site/src/components/CodeHighlightContext.tsx | 1 | Move CodeHighlightContext.tsx to src/context/CodeHighlightContext.tsx and update imports in PageContent.tsx:10 and CodePane.tsx:5 from `~/components/CodeHighlightContext` to `~/context/CodeHighlightContext` |
| GAP | Missing context folder | packages/create-vexcms/templates/marketing-site/src/ | 1 | Create context/ folder to hold *Context.tsx files per Pass 1 decision and base-nextjs pattern |

## base-nextjs

No open violations or gaps.

## Naming conventions coverage (global gap)

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| GAP | Rule scope coverage for create-vexcms templates | .agent/docs/standards/naming-conventions.md (host-app-components-pascal, host-app-ui-kebab, host-app-providers-fixed-roles, host-app-lib-camel rules) | 4 rules | Extend scopes from ['apps/test/src/**', 'apps/www/src/**'] to include 'packages/create-vexcms/templates/*/src/**' OR create explicit create-vexcms-app-layer rules (id: create-vexcms-components-pascal, create-vexcms-context-suffix, create-vexcms-lib-camel, etc.) to enforce the codified convention |

## apps/test

### VIOLATIONS

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| VIOLATION | Context placement | src/components/CodeHighlightContext.tsx (1 file) | 1 | Move CodeHighlightContext.tsx from src/components/ to src/context/ per Pass 1 decision "context/ for *Context.tsx"; AuthContext.tsx already established pattern at src/context/ |

### GAPS

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| GAP | App-level component naming rule | src/components/*.tsx (excluding ui/, providers/) — 18 PascalCase components | 1 | Codify in naming-conventions.md: "host-app-components-pascal rule for apps/test/src/components/: PascalCase components named after their default export; ui/ uses shadcn kebab-case exception" |
| GAP | providers/ fixed-role folder | src/components/providers/{client.tsx, server.tsx, auth.tsx, convex.tsx} | 1 | Codify in naming-conventions.md as a fixed-role folder for app providers (parallel to auth-file-roles); establishes that client.tsx, server.tsx, auth.tsx, convex.tsx are reserved names for provider composition |
| GAP | lib/ directory rule | src/lib/{useSitePreviewMode.ts, resolvePagePath.ts, metadata.ts, highlightClient.ts, highlight.ts, codeHighlightKey.ts, vex.ts, utils.ts} | 1 | Codify in naming-conventions.md: "host-app-lib-camel rule: lib/ contains camelCase utilities and hooks; useXxx.ts for hooks, camelCase.ts for utilities, following patterns established in current src/lib/ files" |

### VERIFICATION NOTES

**Pass 1 violations — all fixed:**
- component-example.tsx: ✅ DELETED (was src/components/component-example.tsx)
- example.tsx: ✅ DELETED (was src/components/example.tsx)
- motion-primitives/{animated-group,text-effect}.tsx: ✅ FIXED (now src/components/motion-primitives/AnimatedGroup.tsx, TextEffect.tsx — PascalCase)

**Naming consistency verified:**
- All component files in src/components/ (excluding ui/ and providers/) follow PascalCase: AdminDemoButton.tsx, Container.tsx, WelcomePage.tsx, ThemeStyle.tsx, ThemeLive.tsx, SiteHeader.tsx, SiteFooter.tsx, SessionButton.tsx, SectionHeader.tsx, MediaImage.tsx, InstallCommand.tsx, FirstAdminBootstrap.tsx, CopyButton.tsx, CodePane.tsx, BrandMark.tsx
- ui/ subfolder uses kebab-case per shadcn-ui-kebab rule: input.tsx, accordion.tsx, badge.tsx, textarea.tsx, dropdown-menu.tsx, separator.tsx, select.tsx, input-group.tsx, field.tsx, dialog.tsx, combobox.tsx, label.tsx
- lib/ files all camelCase: useSitePreviewMode.ts, resolvePagePath.ts, metadata.ts, highlightClient.ts, highlight.ts, codeHighlightKey.ts, vex.ts, utils.ts
- providers/ fixed-role files: client.tsx (default export ClientProviders), server.tsx (default export ServerProviders), auth.tsx (export AuthServerProvider), convex.tsx (export ConvexClientProvider)
- convex/ files all camelCase per convex-resource-files rule: seed.ts, vex.schema.ts, schema.ts, posts.ts, vex.ts, theme.ts, siteSettings.ts, pages.ts, headers.ts, footers.ts, vexContext.ts, http.ts, convex.config.ts, auth.config.ts; vex/ subfolder (firstUser.ts, globals.ts, media.ts, versions.ts); auth/ subfolder (api.ts, db.ts, sessions.ts, index.ts, config.ts)
- vexcms/ collection definitions all camelCase: articles.ts, caseStudies.ts, changelog.ts, comments.ts, editorialFields.ts, fields.ts, footers.ts, headers.ts, images.ts, pages.ts, posts.ts, themes.ts, users.ts
- vexcms/ block modules all PascalCase directories: Hero/, Pricing/, LogoCloud/, Testimonial/, Stats/, Split/, Roadmap/, HowItWorks/, Header/, Footer/, Features/, Feature/, FAQ/, Content/, CodeShowcase/, CTA/
- auth/ fixed-role files per auth-file-roles rule: access.ts, access.typecheck.ts, client.tsx, server.ts, serverUtils.ts, options.ts, plugins.ts, schema.ts, hasPermission.ts, permissions.ts

**Import direction verified (spot checks):**
- src/components/providers/auth.tsx imports ~/auth/server and ~/context/AuthContext (correct direction)
- src/components/providers/client.tsx imports ~/vex.config (server-side shared config)
- src/components/CodeHighlightContext.tsx imports ~/lib/highlight and ~/lib/codeHighlightKey (correct direction)
- No reverse imports detected; domain→lib pattern holds

**File role consistency:**
- index.ts barrels: vexcms/collections/index.ts, vexcms/globals/index.ts, vexcms/blocks/index.ts (re-exports only, no logic)
- No context with hook duplicated files; CodeHighlightContext.tsx is the single file exporting both (violation noted above for placement, not duplication)

**Summary:**
- **Violations:** 1 (CodeHighlightContext.tsx placement)
- **Gaps:** 3 (component naming rule, providers rule, lib rule — all are codified-pattern candidates, not naming inconsistencies)
- **Prior violations:** 3 (all fixed)
- **New violations since Pass 1:** 1 (CodeHighlightContext.tsx — likely oversight when context/ folder was created)

## apps/www

| kind | rule/area | paths | count | status |
|---|---|---|---|---|
| CONVENTION | react-components-pascal | All 18 component files (CodePane, ThemeLive, SiteHeader, SiteFooter, SessionButton, AdminDemoButton, MediaImage, SectionHeader, CopyButton, InstallCommand, FirstAdminBootstrap, WelcomePage, BrandMark, Container, TextEffect, AnimatedGroup) | 18 | ✓ VERIFIED COMPLIANT |
| CONVENTION | react-context-suffix | CodeHighlightContext.tsx, AuthContext.tsx in src/context/ | 2 | ✓ VERIFIED COMPLIANT |
| CONVENTION | hooks-camel-use | useCodeHighlight, useAuth hooks in context files | 2 | ✓ VERIFIED COMPLIANT |
| CONVENTION | shadcn-ui-kebab | All ui/ files (button.tsx, input.tsx, card.tsx, etc.) | 15 | ✓ VERIFIED COMPLIANT |
| CONVENTION | vexcms-resource-defs | collections/*.ts camelCase (pages.ts, users.ts, themes.ts, footers.ts, headers.ts, images.ts, themeColors.ts) | 7 | ✓ VERIFIED COMPLIANT |
| CONVENTION | vexcms-block-module | blocks/{BlockName}/{config.ts,index.tsx} (Hero, FAQ, CTA, Features, Footer, Header, HowItWorks, Roadmap, CodeShowcase, Split, Stats) | 11 | ✓ VERIFIED COMPLIANT |
| CONVENTION | auth-file-roles | auth/{access,client,server,serverUtils,hasPermission,types}.tsx? | 6 | ✓ VERIFIED COMPLIANT |
| CONVENTION | host-app-lib-camel | lib/*.ts files (resolvePagePath.ts, metadata.ts, highlight.ts, vex.ts, utils.ts, etc.) | 7 | ✓ VERIFIED COMPLIANT |
| CONVENTION | provider-file-roles | components/providers/{client,server,auth,convex}.tsx fixed-role folder | 4 | ✓ VERIFIED COMPLIANT |
| CONVENTION | imports-correct-direction | All verified: context imports from lib/, vexcms from auth/, auth from db/constants, no reverse imports | all | ✓ VERIFIED COMPLIANT |
| DECISION | Pass 1: Remove kebab-case components | component-example.tsx, example.tsx deleted | 0 | ✓ APPLIED - FILES REMOVED |
| DECISION | Pass 1: Move context to context/ | CodeHighlightContext.tsx moved from components/ to context/ | 1 | ✓ APPLIED - VERIFIED IN LOCATION |
| DECISION | Pass 1: PascalCase motion-primitives | TextEffect.tsx, AnimatedGroup.tsx (not kebab-case) | 2 | ✓ APPLIED - VERIFIED NAMING |

**Result: No open violations or gaps.**

## apps/docs

No open violations or gaps.

## Developer decisions (2026-10-26)

Recorded as `Step 25 — Pass 2 decisions` in spec.md / spec-tasks.md.
