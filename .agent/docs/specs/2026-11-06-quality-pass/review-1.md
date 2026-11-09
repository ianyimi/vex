# Quality pass — K conformance review, pass 1 (2026-11-08)

K's pass-2 method (grouping, file roles, exports/imports, identifiers) over code written since
K (`f837f20`): H (`30b4c10`), I (`b937b2b`), M (`32277bf`), launch-infrastructure steps 2–7,
public-presence step 14 and this spec, one read-only reviewer per package/app. `decision` is
`-` for `CONVENTION` rows. Machine check: `harness doctor` → `naming-violations` OK for every
existing rule scope. Two reviewer rows were dropped as unfounded after checking the tree:
better-auth "empty `utils.ts`" (no such file; `convex/utils.ts` exists and is imported), and
core's "no changes since K" (corrected below: launch-infra 7's `config/` additions).

## core

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Domain organization with shared infrastructure | collections/, globals/, versions/, media/, db/, access/, documents/, fields/, config/ | 8 domains + shared | Domain folders contain domain-specific logic; db/, access/, documents/ contain cross-domain infrastructure |  ✓ |
| CONVENTION | api/ folders centralize operations | collections/api/, globals/api/, versions/api/, media/api/ | 4 folders | Each domain owns api/ with <op>/server.ts + <domain>Api.ts factory | ✓ |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | <op>/server.ts + .test.ts colocated | collections/api/{find,get,search,create,update,remove}/server.ts, globals/api/{find,get}/server.ts, versions/api/{saveDraft,publish,unpublish,listVersions,getVersionSnapshot,deleteVersion,backfillStatus}/server.ts, media/api/{generateUploadUrl,createMediaDocument,deleteMedia,getUrl}/server.ts | 23 total | Each operation lives in its own <op>/server.ts + server.test.ts sibling pair | ✓ |
| CONVENTION | index.ts re-exports only | collections/index.ts, globals/index.ts, versions/index.ts, media/index.ts, db/index.ts, access/index.ts, documents/index.ts | 7 files | All index.ts files re-export from their modules; none contain logic | ✓ |
| CONVENTION | types.ts holds type definitions | collections/types.ts, globals/types.ts, versions/types.ts, media/types.ts, db/types.ts, access/types.ts, documents/types.ts | 7 files | All types.ts files contain only type definitions | ✓ |
| CONVENTION | Field module structure | fields/{text,email,textarea,number,checkbox,date,url,select,color,json,commitTs,richtext,upload,relationship,group,blocks,array}/ | 17 fields | Each field dir contains config.ts, types.ts, validator.ts, inputSchema.ts with .test.ts siblings | ✓ |

### Exports/imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | No reverse imports (shared → domains) | db/index.ts, access/index.ts, documents/index.ts | 3 folders | Shared infrastructure never imports domain logic | ✓ |
| CONVENTION | Domains import shared only | collections/api/find/server.ts, globals/api/find/server.ts, versions/api/saveDraft/server.ts | All ops | Each operation imports db/, access/, documents/ but not cross-domain ops | ✓ |
| CONVENTION | server.ts barrel export | server.ts (root) | 1 file | Re-exports all domain api operations; single server entry point | ✓ |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Field builders = widget names | text(), number(), checkbox(), select(), date(), upload(), relationship(), array(), blocks(), richtext(), group(), json(), email(), url(), textarea(), commitTs() | 15 builders | Field factory function names match widget names exactly | ✓ |
| CONVENTION | Args types end with ServerArgs | FindServerArgs, GetServerArgs, CreateServerArgs, SaveDraftServerArgs, PublishServerArgs | 20+ operations | Every operation exports its args type with ServerArgs suffix | ✓ |
| CONVENTION | Constants are SCREAMING_SNAKE | ADMIN_FIELDS, QUERY_INDEX_CONSTRAINT_COMPARATORS, VERSION_STATUSES, WILDCARD_KEY | 6 constants | All exported constants use SCREAMING_SNAKE naming | ✓ |
| CONVENTION | Domain hook types | BeforeChangeProps (collections), GlobalBeforeChangeProps (globals), VersionStatusQueryConstraint (versions) | 3 types | Domain-specific hook/model types are appropriately namespaced | ✓ |
|CONVENTION|launch-infra step 7 additions|`config/assertRolesFieldNotClientWritable.ts`, `auth/types.ts` (`clientWritableUserFields`)|2|camelCase file named after its export, inside the existing `config/` domain (`core-domain-folders`, `non-component-camel`)|-|

## react

### Grouping
| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Domain-based top-level organization mirroring core structure | access, admin, auth, client, collections, config, documents, fields, forms, globals, hooks, livePreview, media, modals, revalidate, slots, testing, ui, utils, versions | 20 domains | Folders organize code by domain with shared infrastructure in dedicated folders | — |
| VIOLATION | Undeclared top-level folder outside the CLOSED set (`react-feature-folders`) | `packages/react/src/server/` (`ThemeScript.tsx`, `index.ts`; added by I, `b937b2b`) | 1 folder | It is the `@vexcms/react/server` subpath entry (server-only exports), the counterpart of the listed `client/` entry folder — add `server` to the closed list rather than move it | apply: add `server` to `react-feature-folders`' pattern and description in `naming-conventions.md` |
| CONVENTION | Adapter/framework wiring files at top level | adapter.ts, adminCookie.ts | 2 files | Both files handle framework integration concerns and are correctly placed at src root | — |

### File roles
| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | index.ts re-exports only | packages/react/src/index.ts | 1 file | Main barrel re-exports all domains; no logic implemented | — |
| CONVENTION | Domain index.ts files re-export only | access/index.ts, admin/index.ts, auth/index.ts, client/index.ts, collections/index.ts, config/index.ts, documents/index.ts, forms/index.ts, globals/index.ts, hooks/index.ts, livePreview/index.ts, media/index.ts, modals/index.ts, revalidate/index.ts, slots/index.ts, testing/index.ts, ui/index.ts, utils/index.ts, versions/index.ts | 19 barrels | All domain-level index.ts files re-export from their modules; no inline logic | — |
| CONVENTION | Field module required files | packages/react/src/fields/{text,email,textarea,number,checkbox,date,url,select,color,json,group,blocks,array,richtext,upload,relationship,tabs,row,collapsible,ui}/ | 20 field folders | Each contains Field.tsx, Cell.tsx (where applicable), columnDef.tsx, testFixture.ts, index.ts, following react-field-module pattern | — |
| CONVENTION | Admin field naming (TypeAdmin, TypeFieldCell, TypeFieldDisplay) | packages/react/src/fields/*/Field.tsx exports | 20 fields | TextFieldAdmin, EmailFieldAdmin, NumberFieldAdmin, etc., plus corresponding Cell and Display exports per react-field-module rule | — |
| CONVENTION | Form field naming (no Admin suffix in exports/forms/) | packages/react/src/forms/*.tsx | 20 fields | TextField, EmailField, NumberField, BlocksField, ArrayField, etc., exported from forms/ without Admin suffix per spec decision 7 | — |
| CONVENTION | Component files use PascalCase | packages/react/src/admin/AdminCardSection.tsx, AdminTopNav.tsx, AdminLayout.tsx, AdminSidebar.tsx, AdminNotFound.tsx, AdminIndexEmptyState.tsx, DashboardView.tsx, etc. | 15+ files | Component files follow PascalCase naming per react-components-pascal rule | — |
| CONVENTION | Test files colocated with .test.tsx suffix | packages/react/src/**/*.test.tsx | 40+ files | All test files are colocated with their source and use .test.tsx suffix per tests-colocated rule | — |
| CONVENTION | Utility functions camelCase | packages/react/src/{access,config,documents,fields,versions,utils}/*.ts | 20+ files | Utility functions like useVexPermissions, resolveFie ldComponent, adminHref follow camelCase per non-component-camel rule | — |

### Exports and imports
| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | No cross-domain imports for UI primitives | packages/react/src/ui/ | 1 folder | UI primitives import from shared libraries only (@base-ui, lucide-react, etc.); no domain-specific imports | — |
| CONVENTION | Domain code imports from shared domains only | access/*, forms/*, fields/* → config/, auth/, client/ | 5 shared domains | Domains import from config/, auth/, client/, utils/, access/, testing/ — no circular imports | — |
| CONVENTION | Form fields read useFieldContext() + plain props only | packages/react/src/forms/*.tsx | 1 pattern | Form field components never import fieldDef, VexConfigContext, or admin-specific dependencies; that binding lives in AdminFieldBinding.tsx per spec decision 8 | — |
| CONVENTION | Client API operations exported from separate entry | packages/react/src/client/index.ts | 1 entry | Collections, globals, versions client operations and hooks exported from ./client entry point per spec decision 19 | — |
| CONVENTION | Testing utilities exported from separate entry | packages/react/src/testing/index.ts | 1 entry | Field contracts, harnesses, fixtures exported from ./testing entry point; separate from main barrel | — |

### Identifiers
| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Hook naming use* prefix | packages/react/src/{access,config,hooks,documents,versions,livePreview,revalidate}/*.ts | 30+ hooks | usePermission, useVexPermissions, useCanAccessAdminPanel, useCanReadField, useVexConfig, useVexAuth, useVexNavigate, useLivePreviewPanelState, usePaginatedQuery, useVexListQuery follow use* pattern | — |
| CONVENTION | Event handler naming on* for props, handle* for internals | packages/react/src/ui/*.tsx, forms/*.tsx | 10+ handlers | onClick, onSubmit, onSelectionChange for props; handleBulkDelete, handleCancel for internal functions per identifier conventions | — |
| CONVENTION | Admin view naming *View | packages/react/src/{admin,collections,globals,media}/CollectionEditView.tsx, CollectionListView.tsx, GlobalEditView.tsx, GlobalsListView.tsx, MediaCollectionEditView.tsx, DashboardView.tsx, etc. | 8+ views | Admin views end with View suffix per component naming conventions | — |
| CONVENTION | Status/boolean naming is*/has* prefix | packages/react/src/fields/**/*.tsx, forms/**/*.tsx | 15+ identifiers | isPending, isMounted, hasDraft, isReadOnly follow boolean naming per identifier conventions | — |
| CONVENTION | Constants SCREAMING_SNAKE | packages/react/src/ui/resizeHandleStyles.ts, constants.ts, modals/constants.ts | 3+ constants | ADMIN_FIELDS, PERMISSION_SCOPES, exported as SCREAMING_SNAKE per identifier conventions | — |
| CONVENTION | Singular labels for repeatable items | packages/react/src/fields/ | groups/array/blocks fields | BlocksField renders one-item labels ("Block", not "Blocks"); array items labeled singularly per P-017 | — |
| CONVENTION | Column definition function naming camelCase | packages/react/src/fields/*/columnDef.tsx | 20 functions | textFieldToColumnDef, emailFieldToColumnDef, numberFieldToColumnDef follow function naming convention | — |

## next

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Framework adapter structure (no domain mirroring) | root: `NextAdminPage.tsx`, `NextAdminLayoutClient.tsx`; capability folders: `navigation/`, `cache/`, `seo/`, `auth/`, `testing/` | 1 | Framework adapters use capability-based organization rather than domain-based structure — appropriate for adapting core/react into Next.js | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Primary components at root | `NextAdminPage.tsx`, `NextAdminLayoutClient.tsx` | 2 | Root holds primary `Next*.tsx` components (server component + client layout) | - |
| CONVENTION | Capability folders group by function | `navigation/`, `cache/`, `seo/`, `auth/`, `testing/` | 5 | Each folder collects utilities by capability (routing, caching, SEO, auth context, test utilities), not by domain | - |
| CONVENTION | Hook utilities in navigation folder | `navigation/useNextNavigate.ts`, `navigation/useNextNavigationBlocker.ts`, `navigation/useNextIsRouteCovered.ts`, `navigation/useNextSearchParams.ts` | 4 | Framework-specific navigation adapters implementing `@vexcms/react`'s contracts, grouped in capability folder | - |
| CONVENTION | Barrel re-exports only | `navigation/index.ts`, `cache/index.ts`, `seo/index.ts`, `auth/index.ts`, `testing/index.ts`, `index.ts` | 6 | All index.ts files contain only re-exports, no logic | - |
| CONVENTION | Test files colocated | `NextAdminPage.test.ts`, `navigation/useNextNavigationBlocker.test.ts` | 2 | Tests sit next to units with `.test.ts` suffix per `tests-colocated` rule | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Sub-path exports for server/client separation | `package.json`: `"./server"` → `NextAdminPage`, `"./client"` → `NextAdminLayout` + client leaf | 2 | Required because "use client" cannot mix with async server components in one bundle; each surface is a separate entry | - |
| CONVENTION | Config re-exports via main barrel | `index.ts` re-exports: `defineCollection`, `relationship` (HKT-bound from `@vexcms/react`), field builders, types | 1 | Root barrel re-exports `@vexcms/react`'s config functions and types so consumers can import all config from `@vexcms/next` | - |
| CONVENTION | Explicit import restrictions documented | `index.ts`: "API functions are NOT re-exported from this barrel because… pulling @vexcms/react/client would transitively import @convex-dev/react-query which uses createContext — crashing RSC" | 1 | Comments explain why `@vexcms/react/client` APIs must be imported from subpaths, not root barrel — RSC requirement | - |
| CONVENTION | No circular imports | All imports flow: adapter → `@vexcms/core`, `@vexcms/react`, Next.js, Convex | 1 | Import graph is acyclic; no reverse imports from react/core into adapter | - |
| CONVENTION | Navigation hooks re-exported from barrel | `navigation/index.ts` re-exports all four hooks; consumed by `NextAdminLayoutClient` | 1 | Capability folder barrel makes navigation adapters discoverable without deep imports | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `Next*` prefix on primary components | `NextAdminPage`, `NextAdminLayoutClient` | 2 | Framework adapter prefix distinguishes vexcms-specific Next.js components from generic ones | - |
| CONVENTION | `use*` prefix on hooks | `useNextNavigate`, `useNextNavigationBlocker`, `useNextIsRouteCovered`, `useNextSearchParams` | 4 | React hook naming convention, all implement framework-specific adapters for `@vexcms/react` contracts | - |
| CONVENTION | Camel-case utility functions | `renderAdminShell`, `resolveInitialPreviewUrl`, `warnIfAuthMissing` | 3 | Helper functions use descriptive camelCase names; only exported components use Next* prefix | - |
| CONVENTION | Type names PascalCase | `VexServerClient`, `VexServerClientOptions`, `CreateVexRevalidateRouteProps` (re-exported or defined) | 3 | All types follow standard TypeScript PascalCase convention | - |

## better-auth

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Layer-based organization (adapter package) | server entry (`index.ts`), client entry (`client.ts`), framework-specific (`convex/`) | 3 layers | Adapter packages use layer organization; clean split between server-only and client-safe code | - |
| CONVENTION | Convex integration layer isolated | `convex/{index,anonRole,getAuth,db,utils,adapter,types}.ts` | 8 files | Convex code grouped in dedicated folder; exports via `convex/index.ts` barrel | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `adapter.ts` = adapter factory | `packages/better-auth/src/adapter.ts` (11.2KB, recently modified) | 1 file | Exports `betterAuthAdapter` function implementing `VexAuthAdapter` interface; wires Better Auth schema into Vex collections | - |
| CONVENTION | `client.ts` = client-safe entry | `packages/better-auth/src/client.ts` (1020B) | 1 file | Re-exports `betterAuthCollections` only; zero imports of server code (`convex/`, `adapter.ts`) | - |
| CONVENTION | `index.ts` = server entry barrel | `packages/better-auth/src/index.ts` (2.4KB) | 1 file | Re-exports `betterAuthAdapter` from `./adapter` and convex functions | - |
| CONVENTION | `collections.ts` = auth schema model | `packages/better-auth/src/collections.ts` (4.4KB) | 1 file | Exports `betterAuthCollections` buildin defining user/session/account/verification schemas | - |
| CONVENTION | `pluginSchemas.ts` = plugin type catalog | `packages/better-auth/src/pluginSchemas.ts` (9.8KB, + .generated.ts, + .test.ts) | 3 files | Hand-authored plugin schema registry (`pluginSchemas.ts`), test coverage (`pluginSchemas.test.ts`), generated types (`pluginSchemas.generated.ts`) | - |
| CONVENTION | `convex/index.ts` = convex barrel | `packages/better-auth/src/convex/index.ts` (5.0KB) | 1 file | Re-exports `createBetterAuthAdapter` and sub-operation functions; no logic, only composition | - |
| CONVENTION | Colocated tests | `adapter.test.ts`, `pluginSchemas.test.ts`, `convex/anonRole.test.ts`, `convex/db.test.ts` | 4 files | Tests use `.test.ts` suffix colocated next to units under test; zero `__tests__` directories | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Package exports (package.json) | `"."` → `src/index.ts` (server), `"./client"` → `src/client.ts` (client-safe) | 2 entries | Clean two-entry export map; server-only entry and client-safe entry clearly separated | - |
| CONVENTION | Barrel re-exports only | `index.ts`, `client.ts`, `convex/index.ts` | 3 files | All barrels contain only `export` statements; no logic defined in any barrel file | - |
| CONVENTION | Client entry has no server imports | `client.ts` imports only `./collections`, `./pluginSchemas` (types/values only); zero `convex/`, `adapter.ts` imports | 1 file | Client entry verifiable as server-free; safe for devDependency-only consumers like `create-vexcms` scaffold | - |
| CONVENTION | No reverse imports (convex ← adapter, adapter ← collections) | `convex/{anonRole,getAuth,db}.ts` import from `./`, `types.ts`, `utils.ts`, `adapter.ts` only; no cycle | All layers | Convex → adapter/collections is allowed; no convex imports from outside convex/ | - |
| CONVENTION | Adapter imports from `@vexcms/core` only (no `@vexcms/react` in server) | `adapter.ts` imports `@vexcms/core`, `better-auth/db`; zero React layer imports | 1 file | Adapter is framework-agnostic; safe reuse across SSR/CSR contexts | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Factory function naming (`createXxx`) | `createBetterAuthAdapter` (convex/index.ts), `createGetAuth` (convex/getAuth.ts) | 2 functions | Functions returning closures/configured objects use `create*` prefix per spec decision | - |
| CONVENTION | Adapter export naming | `betterAuthAdapter`, `betterAuthCollections` | 2 exports | No `Better*` capitalization (reserved for React/Next adapters); `betterAuth*` matches package intent | - |
| CONVENTION | Hook naming (use* prefix) | `useVexAuth` not found (expected for client-side auth consumer, if exists) | scope | Auth context accessed via `useAuth` from `better-auth/react` library, not re-exported; correct boundary | - |
| CONVENTION | Types use Vex prefix where appropriate | `VexAuthAdapter` (interface from `@vexcms/core`), `BetterAuthOptions` (from `better-auth/core`) | 2 types | No homemade type confusion; both from authoritative sources (core or `better-auth` library) | - |

### File roles — gap

|kind|rule/area|paths|count|proposed fix|decision|
|---|---|---|---|---|---|
|GAP|No `naming-conventions.md` rule scopes `packages/better-auth/src/**`|every file (all camelCase: `adapter.ts`, `client.ts`, `collections.ts`, `pluginSchemas{,.generated}.ts`, `convex/{anonRole,db,getAuth,utils,…}.ts`)|1|New rule `better-auth-package-files`: `^[a-z][A-Za-z0-9]*(\.generated)?(\.test)?\.ts$`, scope `packages/better-auth/src/**`|apply: add the rule|

## cli

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Layer-based organization (commands + lib) appropriate for CLI tool | src/commands (4 files) + src/lib (9 files) | 1 | No action — CLI tools use layer-based dispatch, not domain folders | - |
| CONVENTION | No domain mixing; utilities isolated from command dispatch | All lib imports are consumed by commands; no cross-domain dependencies | 1 | No action — pattern is clean | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | CLI commands follow cli-command-verbs rule (camelCase verbs) | src/commands/{dev,deploy,generate,telemetry}.ts | 4 | All four files match `^[a-z][a-zA-Z0-9]*\.ts$` pattern exactly | - |
| CONVENTION | Lib files follow non-component-camel rule (camelCase) | src/lib/{loadConfig,generateSchema,convexProcess,resolveConfigPath,resolveConvexUrl,migrate,traceImports,watcher,logger}.ts | 9 | All filenames are camelCase and descriptive of their exports | - |
| CONVENTION | Test files colocated with .test.ts suffix | resolveConfigPath.test.ts, loadConfig.test.ts, resolveConvexUrl.test.ts | 3 | All follow tests-colocated rule exactly | - |
| CONVENTION | Telemetry command added by M (new in scope) | src/commands/telemetry.ts | 1 | File name follows cli-command-verbs rule: `^[a-z][a-zA-Z0-9]*\.ts$` | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Single package export: index.ts → ./dist/index.js | package.json exports["."] only; bin entry points to dist/index.js | 1 | No action — only one entry point | - |
| CONVENTION | Commands import directly from lib utilities (no barrel re-exports) | All four commands import named functions from specific lib/ files | 4 | No action — no lib/index.ts barrel exists; commands import directly | - |
| CONVENTION | Acyclic import graph: index → commands → lib | index.ts dispatches commands, all commands call lib, lib has no upward imports | 1 | No action — graph is acyclic and follows dispatcher pattern | - |
| CONVENTION | ESM module imports with .js extensions | All relative imports use .js suffix (e.g., "./lib/logger.js", "./commands/telemetry.js") | 12+ | No action — consistent ESM usage | - |
| CONVENTION | No relative imports crossing package boundaries | All imports are local to packages/cli; external deps via @vexcms/core, @vexcms/telemetry, convex | 1 | No action — proper package boundary isolation | - |
| CONVENTION | Telemetry command imports follow pattern | telemetry.ts imports from @vexcms/telemetry, @vexcms/telemetry/config, ../lib/*, no cross-command imports | 1 | No action — telemetryCommand imports correctly match other commands | - |

### Identifiers

| kind | rule/area | examples | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Command functions follow verb pattern | devCommand, deployCommand, generateCommand, telemetryCommand | 4 | All follow `XxxCommand` naming — clear top-level CLI actions | - |
| CONVENTION | Utility functions are descriptive camelCase | loadConfig, resolveConfigPath, createResolver, startConvexDev, waitForDeploy, killConvexDev, deployToProduction, writeVexTypes, generateAndWrite, getOutputPath, traceImports, etc. | 16+ | All function names clearly state their purpose | - |
| CONVENTION | Interface/Type names are PascalCase | DevOptions, GenerateResult, GenerateOptions | 3 | All follow TypeScript convention | - |
| CONVENTION | Constants are lowercase (descriptive identifiers) | logger (object) | 1 | No action — logger exported as constant object | - |
| CONVENTION | No ambiguous naming | All identifiers in context are unambiguous; names match actual function behavior | 20+ | No action — naming is clear and consistent | - |

## telemetry

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Private package with two export entry points | `.` (main), `./config` | 2 entries | Package appropriately splits config-related exports from general telemetry functions | - |
| CONVENTION | Utility-focused organization | 28 src files | 28 files | Each file owns one concern: settings, environment collection, event sending, error classification, anonymization | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | index.ts barrel re-export only | index.ts (13 re-export lines) | 1 file | All exports from dedicated modules; no logic in barrel | - |
| CONVENTION | config.ts alternate entry re-export | config.ts (1 re-export line) | 1 file | Single function export; entry point mirrors main barrel pattern | - |
| CONVENTION | types.ts type definitions only | types.ts (using `import type` for all @vexcms/core imports) | 1 file | All @vexcms/core imports are type-only per peer dependency contract | - |
| CONVENTION | constants.ts exports SCREAMING_SNAKE | constants.ts (7 constants) | 1 file | TELEMETRY_SCHEMA_VERSION, TELEMETRY_DOCS_URL, TELEMETRY_TIMEOUT_MS, etc. | - |
| CONVENTION | Utility functions in dedicated files | isTelemetryEnabled.ts, settings.ts, projectId.ts, classifyTelemetryError.ts, sendTelemetryEvent.ts, collectEnvironment.ts, recordTelemetryEvent.ts, showTelemetryNotice.ts, fitTelemetryEvent.ts | 9 files | Each file names a single logical concern and exports related functions | - |
| CONVENTION | `anonymizeConfig.ts` imports runtime values from `@vexcms/core` | `anonymizeConfig.ts` | 2 imports | It is exported only from the `./config` subpath (`config.ts`), which only `@vexcms/cli` imports (`commands/{dev,deploy,telemetry}.ts`), and the CLI has `@vexcms/core` as a real dependency; the root entry stays type-only — the boundary AP-025 records | - |
| CONVENTION | Test files colocated | *.test.ts files beside their units | 10 test files | All tests use .test.ts suffix and sit alongside source; no __tests__ dirs | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | package.json exports structure | `"."` and `"./config"` | 2 entries | Two export points mirroring the spec's two entry-point design | - |
| CONVENTION | Index.ts only re-exports | index.ts re-exports all 13 modules | 1 file | Barrel contains only re-export lines | - |
| CONVENTION | Config.ts only re-exports | config.ts re-exports anonymizeConfig | 1 file | Alternate entry re-exports one function | - |
| CONVENTION | No cross-module cycles | All imports trace downward (leaf utilities → shared types/constants) | 28 files | No circular dependencies detected | - |
| CONVENTION | Core peer only receives type imports (except violation) | types.ts uses `import type` for all @vexcms/core imports | 1 file | Respects peer-only contract; AP-025 violation isolated to anonymizeConfig.ts | - |
| CONVENTION | Root entry stays type-only against `@vexcms/core` | `index.ts`, `types.ts` | — | See the `./config` row above (AP-025) | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Utility functions camelCase | isTelemetryEnabled, recordTelemetryEvent, sendTelemetryEvent, classifyTelemetryError, resolveSettingsPath, readTelemetrySettings, writeTelemetrySettings, isDebugEnabled, createProjectId, collectEnvironment, showTelemetryNotice, showTelemetryRunNotice, fitTelemetryEvent, anonymizeConfig, anonymizeAccess, anonymizeAuthAdapter | 16+ functions | All function names are descriptive, lowercase-start, no abbreviations | - |
| CONVENTION | Event name constants SCREAMING_SNAKE | TELEMETRY_EVENTS, TELEMETRY_FAILURE_STAGES, TELEMETRY_ERROR_CODES, TELEMETRY_STATUS_REASONS, TELEMETRY_ENV | 5 constants | All exported const unions/objects use SCREAMING_SNAKE per P-003 | - |
| CONVENTION | Type names PascalCase | TelemetryEvent, TelemetrySettings, TelemetryEnvironment, TelemetryTimings, TelemetryCreateOptions, AnonymizedConfig, AnonymizedField, AnonymizedBlock, AnonymizedResource | 9+ types | All interface/type names use PascalCase | - |
| CONVENTION | Type derivative unions use suffix | TelemetryEventName (from TELEMETRY_EVENTS), TelemetryErrorCode (from TELEMETRY_ERROR_CODES), TelemetryStatusReason (from TELEMETRY_STATUS_REASONS), TelemetryFailureStage (from TELEMETRY_FAILURE_STAGES) | 4 types | All unions derived from const arrays get descriptive `*Name`/`*Code`/`*Reason`/`*Stage` suffixes | - |
| CONVENTION | Boolean check functions start with is/has | isTelemetryEnabled, isDebugEnabled, isEnvFlagSet, isTelemetrySettings, isCi | 5 functions | Predicate functions correctly named per naming-conventions.md | - |
| CONVENTION | No field/type confusion | Field type is never conflated with document shape; `anonymizeConfig` clearly names the transformation function | All | Clear distinction between data shapes and transformers | - |

## Summary

**Violations:** 1 (AP-025 pattern in anonymizeConfig.ts)  
**Gaps:** 1 (clarity of entry-point export semantics)

The telemetry package follows established conventions well across file roles, exports, naming, and organization. The single violation is a peer-dependency contract breach (AP-025) where `anonymizeConfig.ts` imports runtime values `ADMIN_CUSTOM_SUBJECTS` and `ADMIN_FIELDS` from `@vexcms/core` despite it being a types-only peer. This creates a coupling that could break builds when the package is bundled into CLIs that assume type-only consumption of core. The proposed fix routes these constants through function parameters rather than direct imports, shifting the responsibility to callers that have real dependencies on core.

### File roles — gap

|kind|rule/area|paths|count|proposed fix|decision|
|---|---|---|---|---|---|
|GAP|No `naming-conventions.md` rule scopes `packages/telemetry/**`|every file in `packages/telemetry/src` (all camelCase, colocated tests)|1|New rule `telemetry-package-files`: `^[a-z][A-Za-z0-9]*(\.test)?\.ts$`, scope `packages/telemetry/src/**`|apply: add the rule|

## create-vexcms

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Root entry point + feature folders | `index.ts`, `installers/`, `helpers/`, `utils/`, `__tests__/` | 5 | Package organizes into a root CLI entry, installer implementations, shared utilities, and tests — appropriate for a scaffolding tool without domain structure | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| GAP | No file-role rule scopes `packages/create-vexcms/src/**` | `packages/create-vexcms/src/**` (every file camelCase: `index.ts`, `installers/{base,nextjs,createInstaller,types}.ts`, `helpers/*.ts`, `utils/*.ts`) | 1 | New rule `create-vexcms-src-files`: `^[a-z][A-Za-z0-9]*(\.test)?\.ts$`, scope `packages/create-vexcms/src/**` (the pre-K `__tests__/` folder is outside this review) | apply: add the rule |
| CONVENTION | Barrel re-exports | `index.ts`, `installers/index.ts` | 2 | Both re-export from submodules; no logic in barrels | - |
| CONVENTION | Factory function naming | `installers/createInstaller.ts` | 1 | `createInstaller` factory follows camelCase prefix convention (matches `create*` pattern in spec) | - |
| CONVENTION | Abstract + concrete class naming | `installers/base.ts` (`VexFrameworkInstaller`), `installers/nextjs.ts` (`VexNextJSInstaller`) | 2 | Both follow PascalCase component naming; base abstract class, concrete implementation extends it | - |
| CONVENTION | Type definition files | `installers/types.ts` | 1 | Contains `PackageManager`, `Framework`, `EnvVariable`, `OAuthProvider`, `ProjectOptions` interfaces; follows types-file convention | - |
| CONVENTION | Utility function files | `helpers/monorepo.ts`, `helpers/fileOperations.ts`, `utils/validation.ts`, `utils/messages.ts` | 4 | Each file exports utility functions and their prop/return types; no logic outside these files | - |
| CONVENTION | Test files colocated | `__tests__/integration.test.ts`, `__tests__/fileOperations.test.ts`, `__tests__/monorepo.test.ts`, `__tests__/validation.test.ts` | 4 | Tests use `.test.ts` suffix and colocate with units under test (note: not yet migrated to next to each file, but pattern is consistent) | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Root barrel re-export | `index.ts:1-3` | 1 | Root `index.ts` imports `@inquirer/prompts`, `commander`, `chalk`, `fs-extra`, `path` and internal modules, then re-exports `createInstaller`, types, and utilities | - |
| CONVENTION | Installer barrel aggregates implementations | `installers/index.ts` | 1 | Re-exports `VexFrameworkInstaller`, `VexNextJSInstaller`, all types, string utilities, and the factory | - |
| CONVENTION | Import direction acyclic | All imports throughout package | All | Utilities import only from other utilities or external packages; installers import from types + utils; root imports from installers + utils. No circular dependencies observed. | - |
| CONVENTION | Telemetry integration | `index.ts:24`, `index.ts:244`, `index.ts:252` | 1 | `index.ts` imports `classifyTelemetryError` and `recordTelemetryEvent` from `@vexcms/telemetry` — only entry point uses these, correct pattern | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Types are PascalCase | `PackageManager`, `Framework`, `EnvVariable`, `OAuthProvider`, `ProjectOptions`, `PackageManifest`, `FindWorkspaceRootProps`, `ReadWorkspaceCatalogProps`, `RewriteManifestForMonorepoProps` | 8 | All type interfaces follow PascalCase naming | - |
| CONVENTION | Factory functions use `create*` prefix | `createInstaller` | 1 | Factory function correctly named with `create*` camelCase prefix | - |
| CONVENTION | Utility functions are camelCase | `findWorkspaceRoot`, `readWorkspaceCatalog`, `rewriteManifestForMonorepo`, `displaySuccessMessage`, `displayInvalidNameError`, `copyTemplate`, `overlayTemplate`, `recordTelemetryEvent`, `classifyTelemetryError` | 9+ | All utility functions follow camelCase naming convention | - |
| CONVENTION | Class names are PascalCase | `VexFrameworkInstaller`, `VexNextJSInstaller` | 2 | Abstract base and concrete implementation follow PascalCase naming | - |
| CONVENTION | Methods follow naming pattern | Protected/public methods: `initProject`, `updateOAuthConfig`, `detectPackageManager`, `installDependencies`, `configurePort`, `applyMonorepoRewrite`, `copyBaseFiles`, `applyTemplateOverlay`, `finalizeMarketingOverlay`, `updatePackageName` | 10+ | Methods use descriptive camelCase names; private methods also camelCase | - |
| CONVENTION | Constants are screaming_snake or camelCase | `MARKETING_DEPENDENCIES`, `MONOREPO_DEPENDENCY_FIELDS` | 2 | Exported constants use `SCREAMING_SNAKE`; file-local constants use camelCase | - |
| CONVENTION | No field-vs-type confusion | All identifiers | All | Types clearly distinguish definitions (interfaces, types) from instances (function params, properties). No `IXxx` or `XxxType` patterns used. | - |

## apps/www

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Feature-based organization with fixed provider/auth roles | src/components/, src/components/providers/, src/auth/, src/lib/, src/vexcms/, e2e/, convex/ | 7 domains | Host apps use feature/concern grouping: components by visual role, auth with fixed roles, lib for utilities, vexcms for CMS config, e2e/convex for framework resources | — |
| CONVENTION | CMS configuration mirrors domain structure | src/vexcms/{collections,globals,blocks}/, src/app/(frontend)/, src/app/(vexcms)/ | 6 folders | Collections and globals paired with block renderers; app routes split between public (site) and admin, plus shared auth slot | — |
| CONVENTION | Block module pattern (PascalCase dir + config.ts + index.tsx) | src/vexcms/blocks/{Hero,Header,Roadmap,CTA,FAQ,etc}/ | 11 blocks | Each block is a directory: Hero/config.ts (defineBlock), Hero/index.tsx (render), matching vexcms-block-module rule | — |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | PascalCase components | src/components/{FirstAdminBootstrap,AdminDemoButton,ThemeStyle,SessionButton,NotFoundContent,PostContent,etc}.tsx | 19 | All host-app components follow PascalCase, matching react-components-pascal rule; includes server and client components | — |
| CONVENTION | shadcn UI primitives (kebab-case) + test files | src/components/ui/{button,alert-dialog,dropdown-menu,select,dialog,combobox,accordion,badge,etc}.tsx + .test.tsx | 19 files | Generated/hand-written primitives kept kebab-case per host-app-ui-kebab; colocated tests use .test.tsx suffix matching tests-colocated rule | — |
| CONVENTION | Fixed-role provider components | src/components/providers/{client,server,auth,convex}.tsx | 4 | Files match host-app-providers-fixed-roles: one per provider concern (client context, server wrappers, auth session, Convex client) | — |
| CONVENTION | Fixed-role auth files | src/auth/{access,client,server,serverUtils,hasPermission,types}.ts(x) | 6 | Files match auth-file-roles: access.ts (defineAccess matrix), client.tsx (client checks), server.ts (setup), serverUtils.ts (helpers), hasPermission.ts (wrapper), types.ts (shape types) | — |
| CONVENTION | camelCase utilities | src/lib/{csp,authPageTitle,metadata,highlight,analytics,resolvePagePath,vex,useSitePreviewMode,codeHighlightKey,highlightClient}.ts | 11 | All utilities follow host-app-lib-camel; includes hooks (use*), pure functions, and server/client boundaries respected | — |
| CONVENTION | camelCase collection/global definitions | src/vexcms/{collections/{posts,pages,images,themes,headers,footers,testimonials,products,leads,users},globals/siteSettings}.ts | 11 | Match vexcms-resource-defs: resource names (posts.ts exports `posts`), all in singular camelCase; vexcms globals use same pattern | — |
| CONVENTION | camelCase Convex resource files | convex/{theme,images,pages,posts,seed,http,crons,auth,vex/etc}.ts | 15+ | Files match convex-resource-files: camelCase nouns/resources, no PascalCase; auth/ subfolder holds plugin list (index.ts) and rate limit config (rateLimits.ts) | — |
| CONVENTION | Barrel files (index.ts) | src/vexcms/{collections,blocks}/index.ts, src/db/constants/index.ts | 3 | All barrels re-export only; no inline logic (collections re-export all; blocks re-export blockComponents map and config exports; constants re-export from auth.ts and export SCREAMING_SNAKE constants) | — |
| CONVENTION | camelCase e2e test files | e2e/{routes,axe.e2e,widths.e2e,settlePage,auditJson}.ts | 5 | Match camelCase pattern; .e2e.ts suffix signals end-to-end scope (Playwright); helper files (settlePage, auditJson) are plain camelCase utilities | — |
| CONVENTION | App router error boundaries | src/app/not-found.tsx, src/app/(vexcms)/admin/error.tsx | 2 | Next.js special files use lowercase-hyphen convention (not-found, error); components that render them (NotFoundContent, AdminError) use PascalCase | — |

### Exports/imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Import direction (no cycles, no reverse imports) | src/components → src/lib; src/vexcms → src/db/constants; src/app → src/components; e2e → src/lib | All callsites | Import hierarchy: components import from lib/utils, vexcms imports from db/constants, app routes import components; no domain imports its consumers | — |
| CONVENTION | Provider re-exports in client.tsx | src/components/providers/client.tsx re-exports context hooks | 1 file | Providers barrel (src/components/providers/client.tsx used by root layout) pulls all client contexts; matches host-app pattern where provider concern is one role per file | — |
| CONVENTION | Convex API entry point | src/vexcms/api.ts binds vexServerApi once | 1 file | Bound operations exported as bare names (find, get, create, etc.); mirrors core pattern where domain api operations are wired at their public export point | — |
| CONVENTION | Database constants barrel | src/db/constants/index.ts re-exports from auth.ts | 1 file | Central constant export point; re-exports TABLE_SLUG_* and GLOBAL_SLUG_* constants; auth.ts is co-located for auth-specific constants (USER_ROLES) | — |
| CONVENTION | Block components map | src/vexcms/blocks/index.ts exports blockComponents + re-exports config | 1 file | blockComponents is a Record<slug, ComponentType> for RenderBlocks contract; loose typing documented because slug union only exists post-vex-generate; config.ts holds defineBlock() calls | — |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Function naming (camelCase, descriptive) | resolveAuthPageTitle, buildContentSecurityPolicy, getById, resolveTheme, promoteFirstAdmin | 5 examples | All functions use verb+noun or resolve*/build*/get* patterns; match non-component-camel rule | — |
| CONVENTION | Component naming (PascalCase) | FirstAdminBootstrap, AdminDemoButton, PostContent, NotFoundContent, ThemeStyle, SessionButton | 6 examples | All components use PascalCase matching react-components-pascal; suffixes clarify role (Bootstrap=auto-run, Button=clickable, Content=extracted render) | — |
| CONVENTION | Type naming (PascalCase, descriptive) | PostContentProps, ContentSecurityPolicyInput, QualityRoute, RouteAxeResult, ActiveTheme, BlockComponentProps | 6 examples | Input types end with Input; result/return types plain or explicit Return/Result suffix; matches standard TypeScript convention | — |
| CONVENTION | Constants (SCREAMING_SNAKE, values as const) | BLOCK_SLUG_*, TABLE_SLUG_*, GLOBAL_SLUG_*, QUALITY_ROUTES, QUALITY_WIDTHS, QUALITY_THEMES, AUTH_PAGE_TITLES | 20+ exports | All exported constants use SCREAMING_SNAKE; option/enum constants (TESTIMONIAL_SOURCES, PRODUCT_STATUSES, LEAD_SOURCES) use as const pattern; matches P-003 preference | — |
| CONVENTION | Booleans and flags (is*, has*, can*, use*Sync) | isBootstrapped, previewModeActive, promotingRef (ref, not state) | 3 examples | Boolean state/queries use is*/has*; boolean refs are explicit (promotingRef comment explains "latch, not state"); matches preferences.md P-027 on avoiding state-in-effect | — |
| CONVENTION | Query/mutation naming (camelCase, action verb) | getActive, getAdmin, byId (theme queries); getBySlug, getBySlugPreview (posts queries) | 5 examples | Convex operations use verb-first pattern; query= reads, mutation= writes; matches convex-resource-files convention | — |

### File roles — gaps

|kind|rule/area|paths|count|proposed fix|decision|
|---|---|---|---|---|---|
|GAP|`convex-resource-files` scopes only `apps/test/convex/**`|`apps/www/convex/{images,posts,crons,http,convex.config,…}.ts`, `apps/www/convex/auth/{anonymousUsers,rateLimits,…}.ts`, `apps/www/convex/vex/*.ts`|1|www follows the apps/test pattern (all camelCase resource nouns) — widen the scope|apply: add `apps/www/convex/*.ts`, `apps/www/convex/auth/**`, `apps/www/convex/vex/**` to `convex-resource-files`|
|GAP|`auth-file-roles` scopes only `apps/test/src/auth/**`|`apps/www/src/auth/{access,client,server,serverUtils,hasPermission,types}.ts(x)`|1|Same fixed roles as apps/test — widen the scope|apply: add `apps/www/src/auth/**` to `auth-file-roles`|
|GAP|`vexcms-resource-defs` scopes only `apps/test/src/vexcms/collections/**`|`apps/www/src/vexcms/collections/{posts,pages,images,…}.ts`|1|Same camelCase resource names — widen the scope|apply: add `apps/www/src/vexcms/collections/**` to `vexcms-resource-defs`|

## apps/test

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Collection definitions grouped by domain (vexcms/collections/), with imports organized by concern | vexcms/collections/{posts,pages,fields,users,telemetryProjects,telemetryEvents,index}.ts | 7 | Collections cleanly separated; shared imports from db/constants and admin components | - |
| CONVENTION | App structure mirrors core domain organization (auth/, db/, vexcms/, components/), with e2e tests in e2e/ | src/{auth/,db/,vexcms/,components/,lib/}, convex/{auth/,vex/,telemetry/}, e2e/ | 5 domains + e2e | Grouping follows spec pattern for host app | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Collection definitions use camelCase names matching `vexcms-resource-defs` rule | pages.ts, posts.ts, fields.ts, users.ts, testimonials.ts, telemetryProjects.ts, telemetryEvents.ts | 7 | All follow camelCase naming per spec decision | - |
| CONVENTION | Auth files follow fixed-role pattern (`auth-file-roles`) | schema.ts, access.ts, client.tsx, server.ts, access.typecheck.ts, serverUtils.ts, options.ts, plugins.ts, hasPermission.ts | 9 | All files use fixed role naming (schema, access, client, server, typecheck) per spec | - |
| CONVENTION | E2e test files use camelCase | axe.e2e.ts, adminAxe.e2e.ts, adminWidths.e2e.ts, adminRoutes.ts, routes.ts, settlePage.ts, auditJson.ts, globalSetup.ts | 8 | Naming matches pattern for test helpers | - |
| CONVENTION | Library utilities in src/lib/ use camelCase with descriptive names | csp.ts, authPageTitle.ts, vex.ts, metadata.ts, useSitePreviewMode.ts, resolvePagePath.ts, highlight.ts, codeHighlightKey.ts | 8 | All follow host-app-lib-camel convention | - |
| CONVENTION | UI components in src/components/ui/ follow shadcn-ui-kebab pattern (kebab for generated, PascalCase for custom) | button.tsx, input.tsx, dialog.tsx, textarea.tsx, badge.tsx, select.tsx, input-group.tsx, accordion.tsx, label.tsx, combobox.tsx | 10 | Naming matches pattern from apps/www mirror | - |
| CONVENTION | Components in src/components/ use PascalCase per host-app-components-pascal | CodePane.tsx, MediaImage.tsx, InstallCommand.tsx, FirstAdminBootstrap.tsx, TestimonialFeatureRowAction.tsx, TestimonialBulkApproveAction.tsx, AdminDemoButton.tsx, Container.tsx, WelcomePage.tsx, ThemeStyle.tsx, ThemeLive.tsx, SiteHeader.tsx, SiteFooter.tsx, SessionButton.tsx, SectionHeader.tsx, CopyButton.tsx, BrandMark.tsx | 17 | All PascalCase per spec | - |
| CONVENTION | Admin component extensions use PascalCase | PhoneInputWithHint.tsx, PhoneBeforeInputHint.tsx, TrimOnBlurTextInput.tsx, WordCountField.tsx | 4 | Admin overrides follow PascalCase pattern | - |
| CONVENTION | Convex functions follow camelCase resource names per `convex-resource-files` rule scoped to apps/test/convex/ | auth/db.ts, auth/sessions.ts, auth/config.ts, auth/api.ts, auth/index.ts, vex/{versions,media,globals}.ts, telemetry/{ingest,deriveTelemetryProject}.ts | 12 | Files follow camelCase naming for Convex resources | - |
| CONVENTION | not-found.tsx in app/ root matches Next.js convention, exported as default function NotFound | apps/test/src/app/not-found.tsx | 1 | Next.js built-in route naming, correct | - |
| CONVENTION | lib/csp.ts exports function buildContentSecurityPolicy and interface ContentSecurityPolicyInput | apps/test/src/lib/csp.ts | 1 | Naming follows camelCase utility + PascalCase type pattern | - |
| CONVENTION | lib/authPageTitle.ts exports function resolveAuthPageTitle and const AUTH_PAGE_TITLES | apps/test/src/lib/authPageTitle.ts | 1 | Naming follows camelCase function + SCREAMING_SNAKE constant pattern | - |

### Exports and imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Collection index.ts barrel re-exports all collections without logic | src/vexcms/collections/index.ts | 1 | Barrel contains only `export { pages, posts, fields, users, ... }` | - |
| CONVENTION | Auth files import only within auth/ folder or from core; no cross-domain reverse imports | src/auth/*.ts imports from "@vexcms/core", "~/db/constants", "~/vexcms/collections" | 3 files | Import direction is downward only (auth → shared domains) | - |
| CONVENTION | Convex vex/ and auth/ folders import only Convex generated types and shared utils; no app imports | convex/auth/*.ts, convex/vex/*.ts | 6 files | Convex layer does not import from src/ (correct separation) | - |
| CONVENTION | E2e test utilities use named exports; main test files import from utilities | e2e/axe.e2e.ts imports routes/QUALITY_ROUTES, e2e/adminAxe.e2e.ts imports adminRoutes/discoverAdminRoutes | 5 files | Named imports for test data and helpers | - |
| CONVENTION | Components import UI primitives from "./ui" and library hooks from "~/lib" with correct ~ alias | src/components/*.tsx imports from ./ui/, ~/lib/, and @vexcms/react | 17 files | Import paths follow alias and local organization | - |
| CONVENTION | Admin components (PhoneInputWithHint, etc.) export only the component; used in vexcms/collections fields | src/vexcms/admin/{Phone*,Trim*,WordCount*}.tsx exported as default or named, consumed by collections | 4 files | Admin extensions properly exported and consumed | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Collection definitions use singular/plural labels and interfaceNames matching resource | defineCollection slug "pages" with interfaceName "Page", slug "posts" with interfaceName "Post" | 7 | All collections follow singular resource naming pattern | - |
| CONVENTION | Field builders follow @vexcms/core naming (text(), email(), richtext(), etc. — widget name, never data type) | pages.ts fields: text(), email(), group(), blocks(), richtext(), upload(), relationship(), date(), json(), textarea(), checkbox(), select(), color(), url(), ui() | 8 files | All field types named after widget (e.g., checkbox() not boolean()) | - |
| CONVENTION | Event handler props use onXxx naming | AdminDemoButton.tsx: onClick prop passed to button | 1 file | Handler naming follows convention | - |
| CONVENTION | Boolean fields/values use isXxx or hasXxx naming | fields.ts: isFeatured (checkbox), hasMany in upload/relationship, showHeading in block | 5 | Boolean naming consistent per convention | - |
| CONVENTION | Custom admin components in vexcms/admin/ use XxxComponent or XxxxField pattern | PhoneInputWithHint, TrimOnBlurTextInput, WordCountField | 4 | Admin override names clearly signal purpose | - |
| CONVENTION | Convex query/mutation functions match their collection/feature name | posts.ts (in convex/), vex/versions.ts, auth/sessions.ts, telemetry/ingest.ts | 6 | Function/file naming mirrors domain | - |
| CONVENTION | Tailwind utility class exported as focus-ring in csp.ts comment and globals.css | buildContentSecurityPolicy(), resolveAuthPageTitle() | 2 | Utility function names are descriptive camelCase | - |
| CONVENTION | TypeScript type/interface names: ContentSecurityPolicyInput uses PascalCase + Input suffix for user-facing shapes | lib/csp.ts: ContentSecurityPolicyInput interface | 1 | Type naming follows XxxInput pattern for input variants | - |
| CONVENTION | Auth type names follow core pattern: QualityRoute, QUALITY_ROUTES (types and constants separate) | e2e/routes.ts: QualityRoute interface, QUALITY_ROUTES const, QUALITY_THEMES const | 3 | Type and constant naming distinct (type singular, const SCREAMING_SNAKE) | - |

## apps/docs

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Content organized by feature/category | guides/, fields/, dev/ | 3 folders | Subdirectories group related content; root docs/ contains top-level pages | - |
| CONVENTION | Sidebar uses autogenerate for subfolders | dev/, guides/, fields/ in astro.config.mjs | 3 entries | Starlight autogenerate = no manual slug listing per docs-site-conventions | - |
| CONVENTION | API reference managed by TypeDoc plugin | typeDocSidebarGroup in astro.config.mjs | 1 | starlight-typedoc owns the `api/**` group; hand-listing forbidden | - |

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Docs content files are kebab-case .md/.mdx | accessibility.md, roadmap.md, compare.mdx, index.mdx, guides/*, fields/*, dev/* | 24 files | All content files follow docs-content-kebab rule | - |
| CONVENTION | Config file manages build and sidebar | apps/docs/astro.config.mjs | 1 | One entry point for Astro/Starlight configuration; no content duplication | - |
| CONVENTION | Zero TypeDoc warnings enforced | typeDoc.treatWarningsAsErrors: true | 1 | Any broken {@link}, undocumented type, bad tag fails build | - |
| CONVENTION | TSDoc entry points are documented packages | entryPoints array | 5 packages | core, react, next, better-auth, file-storage-convex; richtext-plate intentionally excluded | - |

### Exports/imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | No imports within markdown content files | guides/*.mdx, fields/*.mdx, dev/*.mdx | 21 files | Content files are static markdown; MDX frontmatter is metadata only | - |
| CONVENTION | Sidebar config imports Starlight + TypeDoc | astro.config.mjs:1-5 | 2 imports | Only build-system imports in config; no reference to content | - |
| CONVENTION | Generated API docs not hand-edited | .gitignore: apps/docs/src/content/docs/api/** | 1 | TypeDoc output is generated; never committed or edited | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Content slugs match filenames | accessibility → accessibility.md, compare → compare.mdx | 24 files | Slug derived from kebab-case filename per Starlight convention | - |
| CONVENTION | Sidebar labels are human-readable | "Introduction", "Roadmap", "Development", "Guides", "Fields" | 5 labels | Labels capitalize guide names; match folder intent | - |
| CONVENTION | Frontmatter titles + descriptions | All 24 content files | 24 files | Every page has title + description in YAML frontmatter | - |

## root

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | HTML validator is a utility script | scripts/validate-html.mjs | 1 | Single-purpose tool; exported functions have JSDoc; no ES exports | - |
| CONVENTION | Quality workflow is a GitHub Actions file | .github/workflows/quality.yml | 1 | Workflow triggered on Vercel preview deployment; separates from main CI | - |

### Exports/imports

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Node stdlib only in validate-html.mjs | execFileSync, fs, os, path, fileURLToPath, pathToFileURL | 6 imports | No third-party dependencies; tool is self-contained | - |
| CONVENTION | Quality workflow runs on preview status | on: deployment_status | 1 event | Triggered only after Vercel preview succeeds; no separate server needed | - |

### Identifiers

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | Script filename follows script-files rule | scripts/validate-html.mjs | 1 file | kebab-case .mjs per naming-conventions.md#script-files | - |
| CONVENTION | Workflow and job names are descriptive | name: quality, jobs: axe/lighthouse | 1 workflow | Workflow name matches spec name; job names are the tools run | - |
| CONVENTION | Function names are descriptive camelCase | ensureJava, runNu, bypassHeaders, resolveAppUrls, main | 5 functions | Each function name states its action clearly; no abbreviations | - |
| CONVENTION | JSDoc describes purpose, not mechanism | @returns blocks explain what each function produces | 4 functions | Technical descriptions without reference to spec decisions | - |
