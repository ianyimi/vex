# Review 1 — Pass 2 convention review

Spec: `2026-10-25-codebase-conventions-refactor`, Step 22. One read-only reviewer per package/app (11), method per launch-plan § K.

## Summary

Totals: **16 violations**, **17 gaps** open for developer decision.

| package/app | violations | gaps |
|---|---|---|
| Core | 3 | 2 |
| React | 0 | 4 |
| Next | 0 | 2 |
| Cli | 0 | 0 |
| BetterAuth | 1 | 0 |
| FileStorage | 1 | 0 |
| Richtext | 0 | 0 |
| Create | 6 | 2 |
| AppTest | 3 | 3 |
| AppWww | 2 | 2 |
| AppDocs | 0 | 2 |

## core

### Grouping
| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| CONVENTION | Domain organization with shared infrastructure | collections/, globals/, versions/, media/, db/, access/, documents/, fields/, config/ | 8 domains + 5 shared | Domain folders contain domain-specific logic; db/, access/, documents/ contain cross-domain infrastructure that no domain folder may re-export |
| CONVENTION | api/ folders centralize operations | collections/api/, globals/api/, versions/api/, media/api/ | 4 folders | Each domain owns api/ containing <op>/server.ts + <domain>Api.ts factory |
| CONVENTION | Versions domain includes both layers | versions/{publish,saveDraft,unpublish,model,*.ts} + versions/api/ | 1 domain | Versions is both a domain AND versioning service for collections/globals; keep both layers |

### File roles
| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| CONVENTION | index.ts re-exports | collections/index.ts, globals/index.ts, versions/index.ts, media/index.ts, db/index.ts, access/index.ts | 6 files | All index.ts files re-export from their modules; none contain logic |
| CONVENTION | config.ts is configuration builder | collections/config.ts, globals/config.ts, media/config.ts | 3 files | Files export field builder functions (defineCollection, defineGlobal) |
| CONVENTION | types.ts holds type definitions | collections/types.ts, globals/types.ts, versions/api/types.ts, media/types.ts, db/types.ts, access/types.ts, fields/types.ts | 7 files | All types.ts files contain only type definitions, no logic |
| CONVENTION | constants.ts holds constant data | fields/constants.ts, access/constants.ts, revalidate/constants.ts, livePreview/constants.ts | 4 files | Files export const metadata; no logic functions |
| CONVENTION | <domain>Api.ts is operation factory | collections/api/collectionsApi.ts, globals/api/globalsApi.ts, versions/api/versionsApi.ts, media/api/mediaApi.ts | 4 files | Files wrap operations in Convex mutation/query builders |
| CONVENTION | <op>/server.ts holds operation logic | collections/api/{find,get,search,create,update,remove,publishedSlugs}/server.ts, globals/api/{find,get,upsert}/server.ts, versions/api/{saveDraft,publish,unpublish,listVersions,getVersionSnapshot,deleteVersion,backfillStatus}/server.ts, media/api/{generateUploadUrl,createMediaDocument,deleteMedia,getUrl}/server.ts | 23 files | Each operation lives in its own <op>/server.ts file with its server.test.ts sibling |
| GAP | Empty config files | globals/config/config.ts (0B), globals/config/types.ts (0B) | 2 files | These files are empty; either delete them or confirm they're intentional placeholders. |
| CONVENTION | Domain layer files (non-api) contain shared logic | collections/{config,validator,interfaceGen,hooks,utils}.ts, globals/{config,interfaceGen,hooks}.ts, versions/{model,publish,saveDraft,unpublish,constants}.ts, media/{config,validators,utils}.ts | 16 files | Files at domain root serve domain-wide shared logic that operations depend on |

### Exports and imports
| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| CONVENTION | index.ts re-exports only | collections/index.ts:export *, globals/index.ts:export *, versions/index.ts:export *, media/index.ts:export *, db/index.ts:export *, access/index.ts:export * | 6 files | Every domain/shared index.ts re-exports from its modules; no logic in barrels |
| CONVENTION | api/index.ts re-exports operations + factory | collections/api/index.ts (export find/get/search/etc + collectionsApi), globals/api/index.ts (export findGlobals/getGlobal/upsertGlobal + globalsApi), versions/api/index.ts (export saveDraft/publish/etc + versionsApi), media/api/index.ts (export all 4 operations + mediaApi) | 4 folders | Each api/index.ts exports all <op>/server.ts plus the <domain>Api factory |
| CONVENTION | No reverse imports from shared to domains | db/index.ts, access/index.ts, documents/index.ts do not import from collections/, globals/, versions/, media/ | 3 folders | Shared infrastructure modules import only from other shared modules or Convex |
| CONVENTION | Domains import from shared, not reverse | collections/api/find/server.ts imports db/, access/, collections/api/{types}; globals/api/find/server.ts imports db/, access/; versions/api/saveDraft/server.ts imports db/, config/ | All domains | Pattern: domain api → db/, access_, documents/, config/ only; never reverse |
| CONVENTION | No cross-domain api imports | collections/api/ does not import globals/api/ or versions/api/; versions/api/{saveDraft,publish,unpublish}/server.ts import versions/model, not other domain operations | All domains | Each api/ is self-contained; versions exceptions allowed as it services collections/globals |
| VIOLATION | Access imports from collections domain | access/types.ts:2 imports GlobalConfig from "../globals", access/validateAccessConfig.ts:4 imports resolveCollectionIndexes from "../collections" | 2 files | Access should not import domain types/functions. Root cause: AccessResource type includes CollectionConfig/GlobalConfig, and validateAccessConfig needs index details. Proposed fix: Move AccessResource definition to db/ or provide accessor functions in db/ rather than importing domain objects directly. Alternatively: access/types.ts can stay but should document that it's the exception for cross-domain RBAC needs. |
| VIOLATION | Versions layer (non-api) imports from collections api | versions/publish.ts:13 imports from "../versions/api", versions/model.ts imports from versions layer. Need to check if api operations import versions layer logic. | Check bidirectional | Versions operations should only consume versions/ layer logic, not vice-versa. |
| CONVENTION | db/ is pipeline only | db/{prepareEdit,populate,depth,queryArgs,triggers,documents,context}.ts do not import any domain or api | 8 files | db/ holds read/write pipeline shared by all domains; no domain-specific logic |
| CONVENTION | documents/ is type-only | documents/types.ts exports VexDocument, VexVersionDocument, VexMediaDocument; documents/index.ts re-exports only | 2 files | documents/ holds four document shape types only; no imports of domain logic |
| CONVENTION | server.ts barrel | server.ts imports from collections/api, globals/api, versions/api, re-exports operations | 1 file | server.ts is the public server entry; imports and re-exports all domain operations |
| CONVENTION | index.ts public export | index.ts imports from all domains, db/, access/, config/, re-exports | 1 file | index.ts is public export; re-exports all domain barrels |

### Identifiers
| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| CONVENTION | Config types use field builder function names | defineCollection, defineGlobal, defineBlock, text(), number(), checkbox(), etc. | All field builders | Field factory function names match widget names; types match: CollectionConfig, GlobalConfig, BlockConfig, TextField, NumberField, CheckboxField |
| CONVENTION | Args types end with ServerArgs | FindServerArgs, GetServerArgs, CreateServerArgs, UpsertGlobalServerArgs, SaveDraftServerArgs, PublishServerArgs | 20+ operations | Every operation function exports its args type ending in ServerArgs |
| CONVENTION | Return types named plainly or with Return suffix | FindReturn, GetReturn, VersionSnapshotResult, GetUrlReturn, GenerateUploadUrlReturn | 10+ operations | Return types use plain names or explicit Return suffix; consistent with spec |
| CONVENTION | Query* and Convex* prefixes in access/ | QueryIndexConstraint, QueryFilterConstraint, ConvexQueryIndexRangeFn, ConvexQueryFilterFn, ConvexQueryIndex, QUERY_INDEX_CONSTRAINT_COMPARATORS | 6 types/constants in access/ | B3 convention: Query* for constraint/config, Convex* for values/functions bound to Convex API |
| CONVENTION | Hook types follow domain pattern | BeforeChangeProps (collections/hooks.ts), GlobalBeforeChangeProps (globals/hooks.ts) | 2 types | Domain-specific hook prop types |
| CONVENTION | Constants are SCREAMING_SNAKE | ADMIN_FIELDS, WILDCARD_KEY, CRUD_ACTIONS, DRAFT_ACTIONS, QUERY_INDEX_CONSTRAINT_COMPARATORS, VERSION_STATUSES | 6 constants | All exported constants use SCREAMING_SNAKE |
| CONVENTION | Document type names | VexDocument, VexVersionDocument, VexMediaDocument, AuthUserDocument, AuthOrgDocument | documents/types.ts, types/generated.ts | Plain Vex* prefix for document shapes; Auth* for auth-specific docs |
| CONVENTION | No fieldDef/field confusion | Field config types named TextField, NumberField; document field instances are typed by their field type; no conflation with TanStack FieldApi | All | Identifiers clearly distinguish field definition (config) from field instance (document value) |

### Summary of violations and gaps
| kind | count | severity | |
|---|---|---|---|
| CONVENTION | 21 findings | | Consistent, no action needed |
| VIOLATION | 1 finding | MEDIUM | Access domain imports from collections/globals for AccessResource/resolveCollectionIndexes — acceptable for RBAC but should be documented as the exception |
| GAP | 1 finding | LOW | Empty globals/config/* files — clarify intent (delete or populate) |

## Findings Summary

### CONVENTIONS (Compliant)

| Kind | Rule/Area | Paths | Count | Evidence |
|---|---|---|---|---|
| CONVENTION | Field module required files (Field.tsx, Cell.tsx, columnDef.tsx, testFixture.ts, index.ts) | packages/react/src/fields/{text,email,textarea,number,checkbox,date,url,select,color,json,group,blocks,array,richtext,upload,relationship}/ | 16 | Each folder contains all required files; index.ts re-exports via spec decision 2 |
| CONVENTION | Admin field naming (TypeAdmin) | packages/react/src/fields/*/Field.tsx | 16 | TextFieldAdmin, EmailFieldAdmin, ArrayFieldAdmin, BlocksFieldAdmin, etc. naming follows spec decision 17 |
| CONVENTION | Form field naming (no Admin suffix) | packages/react/src/forms/[A-Z]*.tsx | 13 | TextField, EmailField, CheckboxField, BlocksField, ArrayField, etc. exported from forms/index.ts |
| CONVENTION | Layout field folders | packages/react/src/fields/{tabs,row,collapsible,ui}/ | 4 | Each contains only Field.tsx per spec decision 11 and 18 |
| CONVENTION | columnDef function naming (camelCase) | packages/react/src/fields/*/columnDef.tsx | 16 | textFieldToColumnDef, emailFieldToColumnDef, relationshipFieldToColumnDef, etc. |
| CONVENTION | API operation colocating | packages/react/src/{collections,globals,versions}/api/<op>/client.ts | 13 | find/, search/, get/, create/, update/, remove/ in collections; find/, get/, upsert/ in globals; saveDraft/, publish/, unpublish/, listVersions/, getVersionSnapshot/, deleteVersion/ in versions |
| CONVENTION | Client API re-export | packages/react/src/client/index.ts | 1 | All client operations re-exported from single entry per spec decision 19 |
| CONVENTION | Utility function naming (camelCase) | packages/react/src/fields/{readableFields,applyFieldPermissionReadOnly}.ts | 2 | pickReadableValues, pickReadableSchema, applyFieldPermissionReadOnly follow camelCase |
| CONVENTION | Component naming (PascalCase) | packages/react/src/fields/{FieldConditionGate,AdminFieldBinding}.tsx, RenderFields.tsx | 3 | Components follow PascalCase naming per spec identifier rules |
| CONVENTION | Hook naming (use* prefix) | packages/react/src/access/{useVexPermissions,usePermission,useFieldPermissions,useCanAccessAdminPanel}.ts | 4 | All hooks properly prefixed with 'use' |
| CONVENTION | No old pattern directories | packages/react/src/ | 1 | No components/, context/, lib/, or styles/ directories present; refactor already applied |
| CONVENTION | Package exports mapping | packages/react/package.json | 1 | '.': src/index.ts, './client': src/client/index.ts, './form': src/forms/index.ts, './testing': src/testing/index.ts follow spec decisions 10, 19 |
| CONVENTION | Form layer isolation | packages/react/src/forms/*.tsx | 1 | Form fields read useFieldContext() + plain props only; never fieldDef, VexConfigContext, permissions (spec decision 8) |
| CONVENTION | Admin field fieldDef binding | packages/react/src/fields/AdminFieldBinding.tsx | 1 | AdminFieldBinding wraps form fields to provide context from fieldDef (spec decision 14) |
| CONVENTION | RenderFields import direction | packages/react/src/fields/RenderFields.tsx:1-30 | 1 | Imports form utilities from forms/ (not reverse); imports layout Field components from field folders |

### GAPS (Specification Requirements Not Explicitly Verified)

| Kind | Rule/Area | Paths | Count | Proposed Options | Tradeoffs |
|---|---|---|---|---|---|
| GAP | Extra field module utilities | packages/react/src/fields/{date,color,json}/utils.ts | 3 | (A) Document as acceptable for complex fields (2 files) vs (B) Move to field-specific hooks (3 files) | (A) Minimal refactor, preserves current structure; (B) Clarifies pattern for future complex fields but requires investigation of utility usage |
| GAP | Layout field Cell/columnDef files | packages/react/src/fields/{tabs,row,collapsible,ui}/Cell.tsx? | 0 | (A) Confirm tabs/row/collapsible/ui fields have no Cell in list view (4 files) vs (B) Add placeholder Cell.tsx if needed (4 files) | (A) Validates spec decision 11 (layout-only, no list cells); (B) Future-proofs if list-view slots are added |
| GAP | BlocksField cloneBlock prop | packages/react/src/forms/BlocksField.tsx:58-64 | 1 | (A) Document cloneBlock as optional per spec decision 16 (0 changes) vs (B) Verify all call sites handle undefined gracefully (1 file) | (A) No changes needed if properly documented; (B) Ensures safety if cloneBlock omitted by callers |
| GAP | Custom field widgets | packages/react/src/fields/{upload,relationship,richtext}/[EmptyInput,FilledInput,RelationshipPicker].tsx | 5 | (A) Confirm these are the ONLY custom widget exceptions vs (B) Audit all field folders for undocumented custom components (16 folders) | (A) Assumes spec decision 11 is fully applied (5 files are exceptions); (B) Detects any new complexity not yet isolated |

### VERIFICATION NOTES

- **Import direction confirmed**: Fields import from forms/ (never reverse); form layer imports from adapter/, config/, access/, slots/. No cycles detected in spot checks.
- **Field module completeness**: All 16 data field types + 4 layout field types accounted for. Custom widget fields (upload, relationship, richtext) have additional control files beyond base 5 (acceptable per spec decision 11).
- **Export hygiene**: Main index.ts re-exports form layer (useAppForm, AppForm) and admin fields (*FieldAdmin, *FieldCell); client operations strictly from ./client entry point; no accidental admin imports on main barrel.
- **Naming consistency**: No violations of PascalCase components, camelCase utilities, useXxx hooks, *FieldToColumnDef functions, TextFieldAdmin/TextField pairs.

## Next

### Pass 2 Convention Review: packages/next

## Summary
The @vexcms/next adapter package follows naming and file-role conventions consistently throughout. All identifiers follow established patterns, import directions are correct, and file roles are clearly defined. No violations of current naming-conventions.md rules were found.

## Findings by Category

### CONVENTIONS (Consistent & Correct — Proposed as Rules)

| Kind | Rule/Area | Paths | Count | Rationale |
|---|---|---|---|---|
| Naming | Next* adapter prefix | NextAdminPage.tsx, NextAdminLayout.tsx, NextAdminLayoutClient.tsx | 3 | Per naming-conventions.md: "Adapter prefixes: `Next*` for `@vexcms/next`" — all three components follow this pattern consistently |
| Naming | Factory create* prefix | createVexServerClient.ts, createVexRevalidateRoute.ts, createVexSitemap.ts, createVexRobots.ts | 4 | Functions that return closures/objects for configuration follow the create* factory pattern consistently, contrasting correctly with utility functions |
| Naming | Utility vex* prefix | vexMetadata.ts, vexStaticParams.ts | 2 | Utilities return resolved values (Metadata, Record[]), not factories, so correctly omit create* prefix and use vex* package-name prefix |
| File Role | PascalCase components | src/Next*.tsx files | 3 | All .tsx files are PascalCase, following naming-conventions.md rule react-components-pascal |
| File Role | camelCase utilities | src/**/*.ts (non-component) files | 6+ | All TS files that are not components follow camelCase naming |
| File Role | types.ts files | cache/types.ts | 1 | Type definitions isolated in dedicated types.ts file, following observed convention |
| File Role | index.ts barrels | cache/index.ts, seo/index.ts, testing/index.ts, src/index.ts | 4 | All barrels contain only re-exports, no logic, following the consistent pattern |
| File Role | Test colocations | .test.ts files colocated with source | 6 | NextAdminPage.test.ts, createVexServerClient.test.ts, createVexRevalidateRoute.test.ts, vexMetadata.test.ts, vexStaticParams.test.ts, createVexSitemap.test.ts — all follow .test.ts suffix and are colocated with their unit |
| Imports | Import direction | All imports | All | All imports flow from adapter → lower layers (@vexcms/core, @vexcms/react). No reverse imports detected. No cycles. Correct hierarchy observed. |
| Exports | Export map organization | package.json exports | 7 entries | Exports are well-organized by entry point ('.' for root barrel, './server', './client', './cache', './seo', './testing', './styles'). Clear naming and purpose. |
| Exports | Barrel re-export hygiene | All index.ts files | 4 | Every barrel re-exports only; no logic is defined in barrel files |

### VIOLATIONS
None identified.

### GAPS (Organizational Decisions Needed)

| Kind | Area | Paths | Count | Options | Tradeoffs |
|---|---|---|---|---|---|
| Organization | Root-level component placement | NextAdminPage.tsx, NextAdminLayout.tsx, NextAdminLayoutClient.tsx, src/index.ts | 4 | (a) Create admin/ subfolder and move components (NextAdminPage, NextAdminLayout, NextAdminLayoutClient) here, with admin/index.ts re-exporting them — organizes primary components together. (b) Keep at src/ root as primary exports — simpler file structure, fewer directories, emphasizes these are the package's main entry points. | Option (a) groups related components and follows a pattern if packages/next is restructured to align with core/react domain structure. Option (b) is simpler and appropriate for a small adapter package. |
| Structure | Capability vs. domain grouping | All src/ subdirectories | 3 folders | (a) Keep current capability-based structure (cache, seo, testing) — each folder groups by what it does, appropriate for an adapter. (b) Align with core/react domain structure (collections/, globals/, versions/, admin/, etc.) — consistent with rest of monorepo but may not apply meaningfully to adapter. | Option (a) is purposeful for an adapter; the current structure clearly separates concerns. Option (b) would create confusion because @vexcms/next adapts to Next.js and doesn't implement domains — it orchestrates components from core/react. The spec explicitly deferred this: "Restructuring `next`, `cli`, `better-auth`, `file-storage-convex`, `richtext-plate`, or the apps beyond import updates — the pass 2 review decides those." |

## Assessment

### What works well:
1. **Clear naming patterns** — Next* for components, create* for factories, vex* for utilities
2. **Correct import hierarchy** — adapter depends on lower layers, never reverse
3. **Type definitions isolated** — types.ts contains the type surfaces
4. **Barrels are minimal** — index.ts files contain only re-exports
5. **Tests are colocated** — .test.ts files sit next to units under test
6. **Export map is organized** — package.json entries are named for clarity and grouped logically

### What needs a decision:
1. **Component folder organization** — Should NextAdminPage/Layout live in an admin/ subfolder? The spec left this for the pass 2 review to decide. Current structure is simpler but less grouped.
2. **Capability vs. domain structure** — Is the current capability-based organization (cache, seo, testing) adequate, or should packages/next eventually mirror core/react's domain structure? The spec explicitly deferred this decision to the pass 2 review.

### Recommendation:
No violations require remediation. Both gaps are organizational decisions, not correctness issues:
- **For component grouping**: Recommend Option (b) — keep components at src/ root. The package is small and these three components are its primary exports; they don't need a subfolder.
- **For structure alignment**: Recommend keeping the capability-based structure. @vexcms/next is a framework adapter, not a domain package. Its job is to wire core/react domains into Next.js, not to reimplement them. The current structure (cache, seo, testing) groups by capability and is appropriate for this purpose.

## packages/cli — Convention Review

### 1. GROUPING

| kind | rule/area | count | evidence |
|---|---|---|---|
| CONVENTION | Layer-based organization (commands + lib) appropriate for CLI tool | 1 | src/commands (3 files) + src/lib (9 files) |
| CONVENTION | No domain mixing; utilities isolated from command dispatch | 1 | All lib imports are by command, no cross-domain dependencies |

### 2. FILE ROLES

| kind | rule/area | paths | count | notes |
|---|---|---|---|---|
| CONVENTION | CLI commands follow cli-command-verbs rule (camelCase verbs) | src/commands/dev.ts, src/commands/generate.ts, src/commands/deploy.ts | 3 | Pattern: ^[a-z][a-zA-Z0-9]*\.ts$ in commands/ folder |
| CONVENTION | Lib files follow non-component-camel rule (camelCase) | generateSchema.ts, loadConfig.ts, convexProcess.ts, logger.ts, resolveConfigPath.ts, resolveConvexUrl.ts, migrate.ts, traceImports.ts, watcher.ts | 9 | All filenames match their primary concern |
| CONVENTION | Test files colocated with .test.ts suffix | resolveConfigPath.test.ts, resolveConvexUrl.test.ts | 2 | Follows tests-colocated rule |
| CONVENTION | File content matches role name | all 12 lib+command files | 12 | Each filename accurately describes its exports |

### 3. EXPORTS AND IMPORTS

| kind | rule/area | count | evidence |
|---|---|---|---|
| CONVENTION | Single package export: index.ts → ./dist/index.js | 1 | package.json exports["."] only; bin entry points to dist/index.js |
| CONVENTION | Commands import directly from lib utilities (no barrel re-exports) | 9 lib files | Each command imports from specific lib files; no index.ts re-export in lib/ |
| CONVENTION | Acyclic import graph: index → commands → lib | 1 | index.ts dispatches commands, commands call lib, lib has no upward imports |
| CONVENTION | ESM module imports with .js extensions | 30+ imports | All relative imports use .js suffix (e.g., "./lib/logger.js") |
| CONVENTION | No relative imports crossing package boundaries | 1 | All imports are local to packages/cli; external deps via @vexcms/core, convex |

### 4. IDENTIFIERS

| kind | rule/area | examples | count | notes |
|---|---|---|---|---|
| CONVENTION | Command functions follow verb pattern | devCommand, generateCommand, deployCommand | 3 | Clear that each is a top-level CLI action |
| CONVENTION | Utility functions are descriptive camelCase | loadConfig, resolveConfigPath, createResolver, startConvexDev, waitForDeploy, killConvexDev, writeVexTypes, generateAndWrite, getOutputPath, traceImports, executeMigration, createWatcher, resolveConvexUrl, patchConvexTsconfig, deployToProduction, executeFieldRemoval | 16 | Each name clearly states what the function does |
| CONVENTION | Interface/Type names are PascalCase | DevOptions, GenerateOptions, GenerateResult, MigrateOptions, RemovalOptions, Watcher, PackageManager | 7 | Follows standard TypeScript identifier convention |
| CONVENTION | Constants are camelCase | logger | 1 | Exported logger object is lowercase |
| CONVENTION | No ambiguous naming; names reflect actual value in context | all identifiers | 27 | No field-like names that could mean different things in different files |

### SUMMARY

**Violations:** 0  
**Gaps:** 0 (documented below)  
**Conventions Confirmed:** 15  

### OUT OF SCOPE (Per Spec)

CLI restructuring is explicitly out of scope for Pass 1 refactoring. The review observes current conventions only; refactoring decisions are for Pass 2.

### DOCUMENTATION NOTES (For Development Docs)

The following patterns should be documented in apps/docs Development section if not already:

1. **Utility modules pattern:** Lib files export multiple related functions (all functions in a file concern a single domain, e.g., all of generateSchema.ts handle schema generation).
   - generateSchema.ts: 3 exports (generateAndWrite, writeVexTypes, getOutputPath)
   - loadConfig.ts: 3 exports (loadConfig, createResolver, patchConvexTsconfig)
   - convexProcess.ts: 4 exports (startConvexDev, waitForDeploy, killConvexDev, deployToProduction)
   - Other files: 1-2 exports each
   - **Pattern:** Group related functions by concern, not by individual export

2. **CLI-specific entry point:** The CLI exports only a command dispatcher (bin: vex), not a library interface. No per-function exports in package.json.

3. **ESM-first:** All imports use .js extensions, indicating ESM-only (no CommonJS fallback). Aligned with monorepo convention.

## better-auth Pass 2 Review

### 1. Grouping — CONVENTION

The package uses **layer-based organization** rather than domain-based, which is appropriate for an adapter/integration package. The split between server-only code (root level) and client-safe code (under ./client entry) is clean.

**Evidence:**
- `src/index.ts:1-30` declares server-only entry
- `src/client.ts:1-20` declares client-safe entry with no server imports
- `src/convex/` groups Convex-specific code (not a domain, but a runtime concern)

**Convention established:**
- Adapter/integration packages use layer organization: server entry, client entry, framework subfolders
- Constraint: client-facing entries must not import server code

---

### 2. File Roles — VIOLATION (1 file)

**Violation: `packages/better-auth/src/utils.ts` is empty (0 bytes)**

This file exists but contains no code. Either it should be deleted or should contain utilities.

**Evidence:** `packages/better-auth/src/utils.ts` shows `0B` in file listing

**Proposed fix:** Delete the empty file; it appears to be leftover from an earlier iteration.

**Consistent patterns (all others CONVENTION):**
- `index.ts` = barrel exports only ✓
- `adapter.ts` = adapter factory implementation ✓
- `types.ts` = type definitions only ✓
- `<function>.ts` (getAuth, anonRole) = named function implementation ✓
- `utils.ts` (convex/utils.ts only) = utility functions ✓
- `db.ts` = database operations (handlers + args) ✓
- `collections.ts`, `pluginSchemas.ts` = mixed types and functions (acceptable for client builders) ✓

---

### 3. Exports and Imports — CONVENTION

**Package exports (package.json):** Clean, two entries
```json
{
  ".": { "source": "./src/index.ts" },  // Server entry
  "./client": { "source": "./src/client.ts" }  // Client-safe entry
}
```

**Evidence:**
- `packages/better-auth/package.json:27-39` shows the two export entries
- `src/index.ts:1-10` re-exports `betterAuthAdapter` and convex functions
- `src/client.ts:1-15` re-exports only `betterAuthCollections` (no server imports)

**Barrel re-exports (all CONVENTION):**
- `src/index.ts` re-exports from `./adapter` and `./convex/*` ✓
- `src/client.ts` re-exports from `./collections` and `./pluginSchemas` ✓
- `src/convex/index.ts` re-exports from subfunctions and types ✓

**Import direction:**
- Client code (`client.ts`, `collections.ts`) has no imports from server paths ✓
- Convex code (`convex/*`) imports only utilities and types, never server adapter ✓
- No circular imports detected ✓
- No relative imports crossing into another package ✓

**Evidence:**
- `src/collections.ts:1-5` imports only `@vexcms/core`, `better-auth/db`, and local `./adapter` + `./pluginSchemas`
- `src/client.ts:19-23` imports only local modules, no `convex/`

---

### 4. Identifiers — CONVENTION

All identifiers follow established naming families:

**Factory functions (`<type>` + `Factory` or `create<Type>`):**
- `betterAuthAdapter()` — main factory ✓
- `authDbApi()` — DB factory (matches `queryApi` / `mutationApi` pattern from @vexcms/core) ✓
- `createBetterAuthAdapter()` — Convex adapter factory ✓
- `createGetAuth()` — auth resolver factory ✓
- `anonRoleDatabaseHook()` — hook factory ✓

**Evidence:**
- `src/adapter.ts:60` defines `betterAuthAdapter()`
- `src/convex/index.ts:18` defines `authDbApi()`
- `src/convex/index.ts:67` defines `createBetterAuthAdapter()`
- `src/convex/getAuth.ts:18` defines `createGetAuth()`
- `src/convex/anonRole.ts:44` defines `anonRoleDatabaseHook()`

**Helper/utility functions (clear action names):**
- `addAuthCollectionFields()` — verb + noun ✓
- `betterAuthAttrToVexField()` — type + "To" + conversion ✓
- `resolvePluginStubs()` — verb + noun ✓
- `checkUniqueFields()` — verb + noun ✓
- `selectFields()` — verb + noun ✓
- `filterByWhere()` — verb + qualifier ✓
- `findIndex()` — verb + noun ✓

**Type names (descriptive):**
- `BetterAuthAdapterOptions` — `<Library><Function>Options` ✓
- `BetterAuthSchemaInput` — `<Library><Concept>Input` ✓
- `BetterAuthCoreTableInput` — `<Library><Feature>Input` ✓
- `AuthDbApiOptions` — `<Feature><Function>Options` ✓
- `CreateBetterAuthAdapterArgs` — `<Function><Type>Args` ✓
- `CreateBetterAuthAdapterResult` — `<Function><Type>Result` ✓

**Evidence:** All types defined in `src/adapter.ts`, `src/collections.ts`, `src/convex/types.ts` follow consistent naming with descriptive, non-abbreviated names.

No naming clashes with core field types; `BetterAuthSchemaInput` avoids `FieldInput` or similar core naming families.

---

## Summary Table

| Kind | Rule/Area | Paths | Count | Proposed Fix |
|---|---|---|---|---|
| VIOLATION | Empty file artifact | `src/utils.ts` | 1 | Delete; no code ever existed here |
| CONVENTION | Layer-based organization | `src/index.ts`, `src/client.ts`, `src/convex/*` | 12 | Documented pattern for adapter packages |
| CONVENTION | Barrel re-exports | All `index.ts` files | 3 | Current pattern already consistent |
| CONVENTION | Factory naming | `betterAuthAdapter()`, `authDbApi()`, `create*` | 5 | Established and consistent |
| CONVENTION | Helper function naming | `add*`, `betterAuth*`, `resolve*`, `check*`, `select*`, `filter*`, `find*` | 15 | Clear action+object pattern |
| CONVENTION | Type naming | `BetterAuth*`, `Auth*`, `Create*Args/Result` | 14 | Descriptive, no abbreviations |
| CONVENTION | Client/server separation | `client.ts` no convex imports | 1 | Bundle-safe; enforced by structure |
| CONVENTION | No circular imports | All files | 13 | One-way dependencies maintained |

## file-storage-convex

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | camelCase non-component files | src/mediaCollection.ts, src/storage.ts, src/adapter/{methods,uploadFile}.ts | 4 | codify as-is |
| convention | factory naming (`define*` config, `*Storage` adapter) | src/mediaCollection.ts (`defineMediaCollection`), src/storage.ts (`convexFileStorage`) | 2 | codify as-is |
| convention | barrels gate entries (`index.ts` full, `client.ts` client-safe subset) | src/index.ts, src/client.ts, src/adapter/index.ts | 3 | codify as-is |
| convention | colocated `.test.ts` | src/** | 5 | codify as-is |
| violation | file role: empty `types.ts` | src/adapter/types.ts (0 bytes, never imported) | 1 | delete file |

## richtext-plate

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | Domain grouping | editor/, render/, src/ | 3 folders | Domain-organized structure; editor/ owns composition + UI, render/ owns static components. Codify as-is. |
| convention | Root file roles | index.ts, server.ts, types.ts | 3 files | index.ts barrel exports public API; server.ts provides Convex bundler entry; types.ts exports element type definitions. Pattern matches core/react conventions. Codify as-is. |
| convention | Feature subfolders | editor/features/, editor/plugins/, editor/components/ | 3 folders | features/ defines VexEditorFeature interface and constants; plugins/ maps features to Plate plugins; components/ organizes UI. Subfolders flat with image/ domain subdirectory. Codify as-is. |
| convention | Component file naming | Toolbar.tsx, EditorContainer.tsx, PlateEditorField.tsx, RichText.tsx | 4 files | PascalCase for React components; content matches exported component names. Codify as-is. |
| convention | Hook naming | useImageUpload.ts | 1 file | useXxx pattern followed consistently. Codify as-is. |
| convention | Factory naming | plateEditor.ts, createPlugins.ts | 2 files | camelCase for factory functions; names match exported functions. Codify as-is. |
| convention | Static component naming | staticComponents.ts, elements.tsx, leaves.tsx | 3 files | Lowercase files exporting *ElementStatic and *LeafStatic components. Naming is clear and consistent. Codify as-is. |
| convention | Type naming | VexEditorFeature, PlateEditorOptions, UploadResult | 3 examples | PascalCase interfaces and types; consistent with @vexcms/core conventions. Codify as-is. |
| convention | Feature constant naming | BoldFeature, ItalicFeature, ImageFeature, defaultFeatures | 13 exported | PascalCase with Feature suffix; defaultFeatures array lowercase. Naming clearly indicates these are feature definitions. Codify as-is. |
| convention | Barrel exports | editor/index.ts, render/index.ts, features/index.ts, plugins/index.ts | 4 files | All index.ts files re-export their domain's public API; no internal re-exports cross boundaries. Pattern matches react/core conventions. Codify as-is. |
| convention | Package exports field | package.json exports | 1 config | '.', './editor', './render' entry points correctly specify convex bundler condition; mirrors established vexcms pattern. Codify as-is. |
| convention | Import direction | @vexcms/core, @vexcms/react, platejs, @platejs/* | all files | All external imports from core/react/platejs dependencies; no reverse imports or circular dependencies detected. Codify as-is. |
| convention | Image domain | editor/components/image/ | 3 files (ImageUpload.tsx, useImageUpload.ts, ImagePlaceholder.tsx) | Domain-grouped image logic (upload, placeholder, hook) colocated; mirrors vexcms pattern of feature-specific subfolders. Codify as-is. |

## create-vexcms (base-nextjs + marketing-site templates)

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | auth file roles | `src/auth/{access,client,server,serverUtils,hasPermission,types,plugins}.{ts,tsx}` | 6 | auth files follow naming-conventions.md auth-file-roles rule: `access` = RBAC matrix, `client.tsx` = auth client export, `server.ts` = server utilities, `serverUtils.ts` = server-only helpers, `hasPermission` = app-side check wrapper, `types.ts` = shared types |
| convention | vexcms domain grouping | `src/vexcms/{collections,blocks,globals,api.ts}` | 4 | vexcms folder properly groups by domain (collections, blocks, globals) with api.ts factory and index.ts aggregators |
| convention | block module pattern | `src/vexcms/blocks/{BlockName}/{config.ts,index.tsx}` | 10+ blocks | each block has PascalCase directory (Hero, FAQ, CTA, etc.) with config.ts (defineBlock call) and index.tsx (renderer); blocks/config.ts and blocks/index.ts aggregate |
| convention | collection file naming | `src/vexcms/collections/{pages,users,images,themes}.ts` | 6 | collection definitions use camelCase resource names per naming-conventions.md vexcms-resource-defs rule |
| convention | constants naming | `src/vexcms/blocks/constants.ts`, `src/db/constants/`, `src/lib/codeHighlightKey.ts` | 3+ | SCREAMING_SNAKE for exported constants (BLOCK_SLUG_*, AUTH_COOKIE_PREFIX); file-local camelCase |
| convention | component PascalCase | `src/components/{BrandMark,CodePane,SiteFooter,Container,CopyButton}.tsx` | 12+ | React components are PascalCase named after default export |
| convention | hooks naming | `src/components/CodeHighlightContext.tsx` exports `useCodeHighlight` | 1+ | hook files use `useXxx` pattern; context with companion hook lives as one file (CodeHighlightContext.tsx exports both context and useCodeHighlight) |
| convention | context PascalCase suffix | `src/components/CodeHighlightContext.tsx`, `src/context/AuthContext.tsx` (base-nextjs) | 2 | contexts use PascalCase with Context suffix |
| convention | import direction | auth → vexcms → lib, no reverse imports detected | N/A | domain folders (vexcms) and auth do not import from components/lib; components/lib import up into domains and auth, maintaining correct direction |
| violation | components/ folder mixes layers | `src/components/{BrandMark,CodePane,ThemeLive,CodeHighlightContext,motion-primitives,providers}/` | 12+ files | components/ contains UI primitives (BrandMark, CodePane, Container), utility components (MediaImage, CopyButton, CodePane), context providers (CodeHighlightContext, FirstAdminBootstrap), and motion primitives — should group by concern (UI/, providers/, utilities/) or domain, not layer |
| violation | lib/ folder mixes roles | `src/lib/{resolvePagePath,metadata,highlight,codeHighlightKey,vex,utils}.ts` | 6 files | lib/ contains page-path resolution (resolvePagePath.ts), SEO metadata (metadata.ts), code highlighting (highlight.ts, codeHighlightKey.ts, highlightClient.ts), vex query wrapper (vex.ts), and motion utilities (utils.ts) — should group by domain concern (highlighting/, metadata/, vex/, utilities/) |
| violation | providers/ subfolder exists | `src/components/providers/{client.tsx,server.tsx}` (base-nextjs only) | 2 files | providers folder introduces secondary layer grouping inside components/; should be at `src/providers/` or colocated with auth |
| violation | motion-primitives/ subfolder | `src/components/motion-primitives/{text-effect,animated-group,reveal.module.css}` (marketing-site) | 3 files | motion-primitives is a secondary layer folder inside components/; should be `src/ui/motion/` or colocated in a features folder |
| violation | context/ folder exists | `src/context/AuthContext.tsx` (base-nextjs) | 1 file | isolated context folder for a single auth context; auth/client.tsx already exports BetterAuthClientProvider; context pattern should follow naming-conventions.md rule (context with hook lives as one file in its domain/feature folder) |
| violation | component naming lacks consistency | `src/components/{BrandMark,FirstAdminBootstrap,WelcomePage,component-example,example}.tsx` | 5 | component files lack descriptive suffixes (e.g., no `*Provider`, `*Modal`, `*Layout` convention); inconsistent (component-example.tsx is kebab, others are PascalCase; example.tsx is lowercase) |
| gap | no clear lib utilities structure | `src/lib/{utils.ts (in motion-primitives), vex.ts, metadata.ts, ...}` | 6 functions/files | multiple utility files without domain grouping; options: (1) move `utils.ts` to `src/utils/`; (2) split lib by concern (`lib/metadata/`, `lib/highlight/`, `lib/vex/`); (3) inline helpers into domain folders (motion logic into ui/motion/, vex wrapper into collections/); marketing-site also has `src/lib/utils.ts` in motion-primitives folder, base-nextjs has `src/lib/utils.ts` (empty) — consolidate and organize |
| gap | no top-level feature folders | src/ is flat domain (vexcms/, auth/) + layer folders (app/, components/, lib/, db/, context/) | N/A | templates could adopt spec § design decision 18 (top-level feature folders mirroring vexcms domain) for consistency with monorepo after K refactor, but this is out of scope as templates are scaffolds for user projects, not internal architecture |

## apps/test

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | Collection definition camelCase | `src/vexcms/collections/*.ts` | 16 files | camelCase filenames exporting camelCase objects (users.ts, pages.ts, posts.ts, etc.). Codify: "Collection definitions are camelCase resource names." |
| convention | Block module structure | `src/vexcms/blocks/*/{config,index,constants}` | 15 blocks | PascalCase directories (Hero, Features, Content, etc.) with config.ts (camelCase export) + index.tsx (PascalCase component). Codify as explicit rule. |
| convention | Index.ts re-exports | `src/vexcms/collections/index.ts`, `src/vexcms/globals/index.ts` | 2 files | Re-export all collection/global definitions and aggregate as array. Codify: "index.ts in collections/ and globals/ re-export all siblings and aggregate array." |
| convention | Convex camelCase | `convex/*.ts`, `convex/auth/**`, `convex/vex/**` | 20+ files | camelCase filenames for query/mutation/action files. Already codified in naming-conventions.md rule `convex-resource-files`. |
| convention | Auth fixed-role names | `src/auth/{access,client,server,options,plugins,schema,hasPermission,serverUtils,permissions,types}.ts(x)` | 10 files | Fixed role filenames for auth domain. Already codified in naming-conventions.md rule `auth-file-roles`. |
| convention | UI component kebab-case | `src/components/ui/*.tsx` | 14 files | kebab-case filenames (button.tsx, input.tsx, card.tsx, field.tsx, etc.) following shadcn convention. Already codified in naming-conventions.md rule `shadcn-ui-kebab` (scoped to packages/react/src/ui, should include apps/test). |
| violation | component-example.tsx filename | `src/components/component-example.tsx` | 1 file | File is kebab-case but exports PascalCase `ComponentExample`. Rename to `ComponentExample.tsx` to match convention or document as exception. |
| violation | example.tsx filename | `src/components/example.tsx` | 1 file | File is kebab-case but exports PascalCase `Example` and `ExampleWrapper`. Rename to `Example.tsx` or document exception. |
| violation | motion-primitives kebab-case filenames | `src/components/motion-primitives/{animated-group,text-effect}.tsx` | 2 files | Filenames are kebab-case (animated-group.tsx, text-effect.tsx) but export PascalCase components (AnimatedGroup, AnimatedItem, TextEffect). Either rename files to PascalCase (AnimatedGroup.tsx) or move under ui/ folder to apply shadcn exception. |
| gap | App-level component naming rule | `src/components/*.tsx` (excluding ui/) | 30+ files | No explicit rule in naming-conventions.md for general app-level components. Current: mostly PascalCase (AdminDemoButton.tsx, Container.tsx, WelcomePage.tsx). Options: (A) Codify PascalCase for components/ root (matches 28 files, conflicts with component-example.tsx, example.tsx); (B) Accept mixed convention if kebab-case files are intended as non-component utilities (0 files currently follow); (C) Document providers/ as fixed-role folder like auth/ (4 files: client.tsx, server.tsx, auth.tsx, convex.tsx). Recommend Option A + B: PascalCase for all export PascalCase components, fixed-role for providers/. |
| gap | providers/ folder fixed roles | `src/components/providers/*.tsx` | 4 files | Files named like fixed roles (client.tsx, server.tsx, auth.tsx, convex.tsx) wrapping providers, similar to auth/ pattern but undocumented. No explicit rule. Options: (A) Document as fixed-role folder like auth-file-roles, define allowed role names; (B) Treat as regular components and rename to PascalCase (ClientProviders.tsx, ServerProviders.tsx, etc.); (C) Move into separate fixed-role structure. Recommend Option A: codify as `provider-file-roles` rule for `src/components/providers/**`. |
| gap | lib/ directory rule | `src/lib/*.ts` | 8 files | No explicit rule for src/lib, though all files follow camelCase (useSitePreviewMode.ts, resolvePagePath.ts, metadata.ts, etc.). Files include both hooks (useX) and utilities (camelCase functions). Codify: "lib/ contains camelCase utility functions and hooks, following patterns: useXxx.ts for hooks, camelCase.ts for utilities." |
| convention | Index.ts file role | `src/vexcms/blocks/index.ts`, `src/vexcms/globals/index.ts` | 2 files | Aggregate exports of submodules + blockComponents/globals array. Correct per naming-conventions.md guidance. |
| convention | Context suffix | `src/components/CodeHighlightContext.tsx`, `src/context/AuthContext.tsx` | 2 files | PascalCase Context suffix used correctly. Follows react-context-suffix rule. |
| convention | Import direction | All examined imports | N/A | Convex imports from src/ (vexcms/api, db/constants, auth/server, vex.config.server) — correct direction. No cycles observed. No domain-to-domain crossing. |

## apps/www

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| VIOLATION | react-components-pascal naming | `component-example.tsx`, `example.tsx` | 2 | Rename to `ComponentExample.tsx` and choose descriptive PascalCase name (e.g., `ExampleComponent.tsx` or delete if unused) |
| VIOLATION | react-context-suffix placement | `components/CodeHighlightContext.tsx` | 1 | Move file to `context/CodeHighlightContext.tsx` per naming-conventions.md rule requiring contexts in dedicated folder |
| CONVENTION | vexcms-block-module | `vexcms/blocks/<BlockName>/{config.ts,index.tsx}` | 11 blocks | All block definitions follow core convention: PascalCase folder names, config.ts for defineBlock(), index.tsx for React component, constants.ts for slugs, proper barrel in blocks/index.ts |
| CONVENTION | vexcms-resource-defs | `vexcms/collections/*.ts` | 7 collections | Collection definitions follow core convention: camelCase file names (pages.ts, themes.ts, users.ts), proper barrel in collections/index.ts |
| CONVENTION | react-components-pascal | `components/*.tsx` (excluding violations) | 18 | All site components follow PascalCase naming: ThemeLive, SiteHeader, SiteFooter, SessionButton, AdminDemoButton, FirstAdminBootstrap, WelcomePage, etc. |
| CONVENTION | react-context-suffix | `context/AuthContext.tsx` | 1 | Context with companion hook pattern correctly implemented; provider + useAuth hook |
| CONVENTION | auth-file-roles | `auth/{access.ts,client.tsx,hasPermission.ts,server.ts,serverUtils.ts,types.ts}` | 6 | Auth folder uses fixed role naming convention; matches apps/test pattern |
| CONVENTION | hooks-camel-use | `components/CodeHighlightProvider`, `useCodeHighlight` (in CodeHighlightContext) | 2 | Hook naming follows use* prefix convention (once file is relocated to context/) |
| CONVENTION | shadcn-ui-kebab | `components/ui/*.tsx` | 15 | shadcn-generated and hand-written UI components correctly use kebab-case (button.tsx, input.tsx) and PascalCase (field.tsx) per conventions |
| CONVENTION | core provider pattern | `components/providers/{client,server,auth,convex}.tsx` | 4 | Providers organized in dedicated subfolder; follows Next.js + vexcms patterns |
| CONVENTION | api-operation-split | `vexcms/api.ts` | 1 | Server API binding file mirrors apps/test pattern; single bound vexServerApi export |
| GAP | app-folder structure | `app/(frontend)/(site)`, `app/(vexcms)/admin`, `app/api/` | N/A | Next.js app directory grouping is appropriate; route groups and segments follow Next.js conventions, not part of naming-conventions.md scope |
| GAP | db constants organization | `db/constants/auth.ts` | 1 | Uses db/constants/ subfolder pattern; reasonable for app-level constants, could be documented if convention extends to apps |
| CONVENTION | library imports | `~/` alias for src/ imports | universal | Path alias usage is Next.js standard; consistently applied throughout |

## apps/docs

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | docs-content-kebab | `src/content/docs/**/*.mdx` / `*.md` | 39 | All hand-written content files (guides, fields, index, roadmap) follow kebab-case naming; rule established and codify as-is. |
| convention | config-file-naming | `astro.config.mjs`, `src/content.config.ts`, `tsconfig.json`, `package.json` | 4 | All config files properly named per Astro conventions (camelCase .mjs for Astro, camelCase .ts for collection config); codify as-is. |
| convention | content-grouping | `guides/` (14), `fields/` (20) | 34 | Content grouped by domain (guides are task-focused, fields are reference). Both use autogenerated sidebars per astro.config.mjs. Codify as-is. |
| convention | imports-external-only | `astro.config.mjs`, `src/content.config.ts` | 2 | All imports reference external Astro/Starlight libraries (no monorepo internal imports); appropriate for a documentation consumer. Codify as-is. |
| convention | field-doc-coverage | `src/content/docs/fields/*.mdx` | 19 | Nineteen documented core field types (text, number, checkbox, select, date, email, url, textarea, json, color, upload, relationship, array, group, blocks, row, ui, tabs, collapsible) match core field directories. One placeholder file (coming-soon.mdx). Codify coverage rule as-is. |
| gap | richtext-field-documentation | `packages/core/src/fields/richtext/` → no matching `src/content/docs/fields/richtext.mdx` | 1 field | **Option A** (3 files favor): Richtext is shipped (via @vexcms/richtext-plate plugin, not core), may be intentionally documented separately in plugin package. No doc page needed. **Option B** (0 files favor): Add `richtext.mdx` to document richtext field from core; decide if core richtext or plugin richtext is the canonical user-facing API. Per roadmap.md (✅ Shipped: richtext via @vexcms/richtext-plate), plugin may be the user path; confirm with developer before adding doc. |
| gap | development-section-missing | `src/content/docs/dev/` does not exist | — | Per launch-plan § K and spec §16043, Development sidebar group with Project structure, Core/React layout, Naming conventions, and Adding a field type guides is **intentionally post-review** ("written from the final review's conventions, not before"). This is a planned task to complete after convention review finalizes, not a violation. No fix needed in this review. |
| convention | sidebar-config | `astro.config.mjs` hardcoded Next.js items + autogenerated guides/fields | 2 groups | Sidebar structure mixes hardcoded quick-links (Quickstart, Caching) with autogenerated groups (Guides, Fields, API). Both quickstart and caching-and-seo appear in both the hardcoded section and autogenerated guides/; this is intentional per Starlight pattern. Codify as-is. |
| convention | assets-naming | `src/assets/houston.webp`, `public/favicon.svg` | 2 | Assets follow lowercase/kebab naming appropriate for static files. Codify as-is. |

## Developer decisions (2026-10-26)

Recorded as the `Pass 1 decisions` step group in spec.md / spec-tasks.md.
