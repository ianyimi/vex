# Spec 30.5 — create-vexcms CLI

## Overview

A scaffolding CLI that creates new VEX CMS projects with all necessary dependencies, configuration, and optional template content. Published as `create-vexcms` on npm, invoked via `pnpm create vexcms@latest`. Lives at `packages/create-cli/` in the vex monorepo.

Forked from [create-z3-app](https://github.com/zayecq/create-z3-app) and adapted for the VEX CMS ecosystem. Supports Next.js now; TanStack Start appears in the framework prompt as "Coming Soon" so the architecture is ready for it.

## Design Decisions

- **Marketing site is the default:** Running `pnpm create vexcms@latest` scaffolds the marketing site template with pre-built collections (pages, headers, footers, themes, site settings). Users who want a bare project with no collections pass `--bare`. No interactive template prompt — just a CLI flag.
- **Two-layer template system:** A `base-nextjs/` template is a complete working Next.js + VEX project. The marketing site overlay is a sparse directory that only contains files that differ from or add to the base. The installer copies the base first, then overlays (unless `--bare`). This avoids duplicating the entire project for each template.
- **Fork create-z3's installer pattern:** The abstract `VexFrameworkInstaller` → concrete `VexNextJSInstaller` pattern is proven and directly applicable. The OAuth provider registry (`providers.ts`) is copied wholesale since it's pure Better Auth configuration data with no framework coupling.
- **No TweakCN theme prompt:** Default theme only.
- **Real collections, not stubs:** The marketing site template ships collection definitions with meaningful fields (pages with richtext content, headers with logo upload, footers with copyright, themes with color/font fields). Users can modify and extend them. This gives a working starting point, not an empty shell.
- **Consts pattern:** `TABLE_SLUG_*` constants in `db/constants/index.ts` isolate all slug strings, preventing typos and enabling IDE rename refactoring across the project.
- **Auth adapter stays in templates:** The custom Better Auth Convex adapter (adapter/, db.ts, sessions.ts, etc.) is copied as template files. Convex requires functions to be defined in the user's `convex/` directory — they can't live in `node_modules`. If the adapter needs updates, we provide migration guides.
- **Framework prompt with Coming Soon:** The CLI prompts for framework selection (Next.js / TanStack Start). TanStack Start shows "(Coming Soon)" and exits with a message. This keeps the architecture ready without shipping broken code.
- **npm distribution from monorepo:** Published as `create-vexcms` on npm. Template `package.json` files use real npm versions (not `workspace:*`). The `"files"` field includes `dist/` and `templates/` so templates ship with the package.

## Out of Scope

- TanStack Start template files and installer (future spec — just the "Coming Soon" prompt is in scope)
- Full marketing site UI pages/layouts (this spec ships collections + admin, not frontend pages)
- Publishing/CI pipeline for create-vexcms npm releases
- Custom theme selection at scaffold time
- `defineSite()` or multi-site features (scrapped from Spec 30)

## CLI Flow

```
$ pnpm create vexcms@latest [project-name] [--bare]

--bare    Skip the marketing site overlay, scaffold an empty VEX CMS project

1. Project name?              (default: "my-vexcms-app", validates npm name rules, supports ".")
                              (skipped if provided as positional arg)
2. Select a framework:
   - Next.js (Recommended)
   - TanStack Start (Coming Soon)
3. Enable email/password?     (default: yes)
4. Select OAuth providers:    (multi-select from Better Auth providers)
5. Initialize git repo?       (default: yes)
6. Install dependencies?      (default: yes)
```

If `--bare` is passed, the installer copies only the base template (empty collections). Otherwise, the marketing site overlay is applied automatically — no template selection prompt.

If the user selects TanStack Start, show a message like "TanStack Start support is coming soon! For now, please select Next.js." and loop back to the framework prompt.

## Target Directory Structure

```
packages/create-cli/
├── package.json                    # name: "create-vexcms", bin: "create-vexcms"
├── tsconfig.json
├── tsup.config.ts
├── src/
│   ├── index.ts                    # CLI entry (commander + inquirer prompts)
│   ├── installers/
│   │   ├── base.ts                 # Abstract VexFrameworkInstaller (forked from create-z3)
│   │   ├── nextjs.ts               # VexNextJSInstaller subclass
│   │   ├── providers.ts            # OAuth provider registry (copied from create-z3)
│   │   ├── string-utils.ts         # Placeholder replacement helpers (forked from create-z3)
│   │   ├── types.ts                # ProjectOptions, Template, Framework, OAuthProvider types
│   │   └── index.ts                # Re-exports + createInstaller factory
│   ├── helpers/
│   │   └── fileOperations.ts       # copyTemplate, overlayTemplate, createProjectDirectory
│   └── utils/
│       ├── validation.ts           # Project name validation (from create-z3)
│       └── messages.ts             # CLI output formatting (rebranded from create-z3)
├── templates/
│   ├── base-nextjs/                # Complete working Next.js + VEX project
│   │   ├── _gitignore
│   │   ├── .env.example            # With # {{ENV_OAUTH_VARS}} placeholder
│   │   ├── .prettierrc
│   │   ├── components.json
│   │   ├── eslint.config.mjs
│   │   ├── next.config.ts
│   │   ├── package.json            # Real npm versions, {{PROJECT_NAME}}
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── README.md               # With <!-- {{OAUTH_SETUP_GUIDE}} --> placeholder
│   │   ├── convex/
│   │   │   ├── _generated/         # Stub files (tsconfig, dataModel, api, server)
│   │   │   ├── auth/               # Full Better Auth Convex adapter
│   │   │   │   ├── adapter/
│   │   │   │   │   ├── index.ts    # Adapter factory (uses _generated/api)
│   │   │   │   │   └── utils.ts    # Query building, filtering, pagination
│   │   │   │   ├── options.ts      # // {{OAUTH_PROVIDERS}} and // {{EMAIL_PASSWORD_AUTH}}
│   │   │   │   ├── config.ts       # OAuth env config
│   │   │   │   ├── db.ts           # Internal mutations/queries
│   │   │   │   ├── api.ts          # Current user identity query
│   │   │   │   ├── sessions.ts     # Session + user query
│   │   │   │   ├── plugins/
│   │   │   │   │   └── index.ts    # Better Auth plugins (admin, apiKey, convex, nextCookies)
│   │   │   │   └── index.ts        # betterAuth() instance
│   │   │   ├── auth.config.ts
│   │   │   ├── convex.config.ts
│   │   │   ├── http.ts
│   │   │   └── schema.ts           # Better Auth tables only
│   │   ├── src/
│   │   │   ├── env.mjs             # t3-oss env with OAuth placeholders
│   │   │   ├── proxy.ts
│   │   │   ├── app/
│   │   │   │   ├── globals.css
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── (frontend)/     # Landing page + auth routes
│   │   │   │   ├── admin/          # AdminPage wiring at [[...path]]
│   │   │   │   └── api/
│   │   │   ├── auth/
│   │   │   │   ├── client.tsx      # // {{OAUTH_UI_PROVIDERS}} and /* {{EMAIL_PASSWORD_CREDENTIALS}} */
│   │   │   │   ├── server.ts
│   │   │   │   ├── serverUtils.ts
│   │   │   │   ├── permissions.ts
│   │   │   │   └── types.ts
│   │   │   ├── components/
│   │   │   │   └── providers/      # Convex, theme, auth providers
│   │   │   ├── db/
│   │   │   │   └── constants/
│   │   │   │       ├── index.ts    # TABLE_SLUG_USERS, etc. (auth tables only)
│   │   │   │       └── auth.ts     # USER_ROLES
│   │   │   ├── lib/
│   │   │   │   └── utils.ts        # cn() helper
│   │   │   └── vexcms/
│   │   │       ├── auth.ts         # vexBetterAuth() config
│   │   │       └── collections/
│   │   │           └── index.ts    # Empty barrel export
│   │   └── vex.config.ts           # Empty collections array
│   │
│   └── marketing-site/             # Sparse overlay (merged onto base-nextjs)
│       ├── src/
│       │   ├── db/
│       │   │   └── constants/
│       │   │       └── index.ts    # Extends base: adds TABLE_SLUG_PAGES, HEADERS, FOOTERS, THEMES, SITE_SETTINGS
│       │   └── vexcms/
│       │       └── collections/
│       │           ├── index.ts    # Re-exports all collections
│       │           ├── pages.ts
│       │           ├── headers.ts
│       │           ├── footers.ts
│       │           ├── themes.ts
│       │           └── site_settings.ts
│       └── vex.config.ts           # Imports collections, wires into defineConfig
```

## Templates

### Base Next.js Template

Derived from `apps/test-app/` but stripped of test-specific content (articles, posts, categories, custom field components, blocks). A complete working project with:

- All `@vexcms/*` dependencies at real npm versions
- Convex backend with full Better Auth adapter (adapter/, plugins/, sessions, etc.)
- Admin panel wired at `/admin` via `[[...path]]/page.tsx`
- Auth UI routes at `/(frontend)/@auth/` and `/(frontend)/auth/`
- Provider wrappers (Convex, theme, auth, React Query)
- `vex.config.ts` with empty `collections: []`
- OAuth placeholder system (same markers as create-z3)

**Placeholder markers in template files:**

| File | Placeholder | Replaced With |
|------|------------|---------------|
| `convex/auth/options.ts` | `// {{EMAIL_PASSWORD_AUTH}}` | `emailAndPassword: { enabled: true }` or removed |
| `convex/auth/options.ts` | `// {{OAUTH_PROVIDERS}}` | Better Auth social provider config |
| `src/auth/client.tsx` | `/* {{EMAIL_PASSWORD_CREDENTIALS}} */` | `credentials={true}` or empty |
| `src/auth/client.tsx` | `// {{OAUTH_UI_PROVIDERS}}` | `social={{providers: [...]}}` |
| `.env.example` | `# {{ENV_OAUTH_VARS}}` | Provider env var declarations |
| `src/env.mjs` | `// {{OAUTH_ENV_SERVER_SCHEMA}}` | Zod server schema entries |
| `src/env.mjs` | `// {{OAUTH_ENV_RUNTIME_MAPPING}}` | `process.env.*` assignments |
| `README.md` | `<!-- {{OAUTH_SETUP_GUIDE}} -->` | Provider setup instructions |
| `package.json` | `{{PROJECT_NAME}}` | User's project name |

### Marketing Site Overlay

Sparse directory merged on top of the base template. Only contains added/replaced files.

**`src/db/constants/index.ts`** (replaces base — extends with site builder slugs):
```ts
// Re-export auth constants from base
export * from "./auth"

// Better Auth
export const TABLE_SLUG_USERS = "user" as const
export const TABLE_SLUG_ACCOUNTS = "account" as const
export const TABLE_SLUG_SESSIONS = "session" as const
export const TABLE_SLUG_VERIFICATIONS = "verification" as const
export const TABLE_SLUG_JWKS = "jwks" as const

// Media
export const TABLE_SLUG_MEDIA = "media" as const

// Site Builder
export const TABLE_SLUG_PAGES = "pages" as const
export const TABLE_SLUG_HEADERS = "headers" as const
export const TABLE_SLUG_FOOTERS = "footers" as const
export const TABLE_SLUG_THEMES = "themes" as const
export const TABLE_SLUG_SITE_SETTINGS = "site_settings" as const
```

**Collection files** (e.g., `src/vexcms/collections/pages.ts`):
```ts
import { defineCollection, richtext, select, text } from "@vexcms/core"

import { TABLE_SLUG_MEDIA, TABLE_SLUG_PAGES } from "~/db/constants"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  admin: {
    group: "Site Builder",
    useAsTitle: "title",
  },
  fields: {
    slug: text({
      admin: { description: "URL-friendly page path" },
      label: "Slug",
      required: true,
    }),
    content: richtext({
      label: "Content",
      mediaCollection: TABLE_SLUG_MEDIA,
    }),
    status: select({
      defaultValue: "draft",
      label: "Status",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
      required: true,
    }),
    title: text({ label: "Title", required: true }),
  },
  labels: { plural: "Pages", singular: "Page" },
})
```

Other collections follow the same pattern:
- **`headers.ts`** — name, logoText, logoUrl (upload to media), sticky (checkbox)
- **`footers.ts`** — name, content (richtext), copyright
- **`themes.ts`** — name, primaryColor, secondaryColor, backgroundColor, fontFamily
- **`site_settings.ts`** — name, description, favicon (upload to media)

**`src/vexcms/collections/index.ts`:**
```ts
export * from "./footers"
export * from "./headers"
export * from "./pages"
export * from "./site_settings"
export * from "./themes"
```

**`vex.config.ts`** (overrides base):
```ts
import { defineConfig } from "@vexcms/core"
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"
import { footers, headers, pages, siteSettings, themes } from "~/vexcms/collections"

export default defineConfig({
  admin: {
    meta: { titleSuffix: " | My Site" },
    user: "user",
  },
  auth,
  basePath: "/admin",
  collections: [pages, headers, footers, themes, siteSettings],
  media: {
    collections: [],
    storageAdapter: convexFileStorage(),
  },
})
```

## Installer Architecture

```
VexFrameworkInstaller (abstract)        ← forked from create-z3 FrameworkInstaller
├── copyBaseFiles()                     (concrete: copies templates/{framework}/)
├── applyTemplateOverlay()              (concrete: overlays templates/{template}/ if not "plain")
├── updatePackageName(name)             (concrete: JSON parse → set name → write)
├── detectPackageManager()              (concrete: from create-z3)
├── installDependencies()               (concrete: from create-z3)
├── initGitRepo()                       (concrete: "Initial commit from create-vexcms")
├── generateAuthSecret()                (concrete: from create-z3)
├── initProject(options)                (template method orchestrator)
│
├── updateOAuthConfig(providers)        (abstract → subclass)
├── updateOAuthUIConfig(providers)      (abstract → subclass)
├── updateEnvExample(providers)         (abstract → subclass)
├── updateEnvTs(providers)              (abstract → subclass)
└── updateReadme(providers)             (abstract → subclass)

VexNextJSInstaller extends VexFrameworkInstaller
├── frameworkTemplate = "base-nextjs"
├── updateOAuthConfig → convex/auth/options.ts
├── updateOAuthUIConfig → src/auth/client.tsx
├── updateEnvExample → .env.example
├── updateEnvTs → src/env.mjs
└── updateReadme → README.md
```

**`initProject()` orchestration:**
1. Copy base framework template
2. Apply template overlay (if not "plain")
3. Update package.json name
4. Configure OAuth (replace placeholders in auth files)
5. Configure OAuth UI (replace placeholders in client auth)
6. Update .env.example with provider env vars
7. Update env.mjs with typed env schema
8. Update README with OAuth setup guides
9. Generate `BETTER_AUTH_SECRET` → write to .env.example
10. Git init (optional)
11. Install dependencies (optional)
12. Lint and format (if deps installed)

## Code Reuse from create-z3

| File | Strategy | Changes |
|------|----------|---------|
| `installers/base.ts` | Fork | Remove `applyTweakCNTheme`, add `applyTemplateOverlay()`, rebrand |
| `installers/providers.ts` | Copy | None — pure Better Auth data, framework-agnostic |
| `installers/string-utils.ts` | Fork | Remove `DEFAULT_THEME` and TweakCN functions |
| `installers/types.ts` | Fork | Add `bare` flag to `ProjectOptions`, remove `TweakCNTheme`, keep `Framework` with both values |
| `installers/nextjs.ts` | Fork | Update file paths for VEX template structure |
| `utils/validation.ts` | Copy | None |
| `utils/messages.ts` | Fork | Rebrand create-z3 → create-vexcms |
| `helpers/fileOperations.ts` | Fork | Add overlay copy support |

## Package Configuration

```json
{
  "name": "create-vexcms",
  "version": "0.0.1",
  "type": "module",
  "bin": { "create-vexcms": "./dist/index.js" },
  "files": ["dist", "templates"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --watch",
    "test": "vitest run"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "@inquirer/prompts": "^7.2.0",
    "fs-extra": "^11.2.0",
    "chalk": "^5.3.0",
    "ora": "^8.1.0",
    "execa": "^9.5.2",
    "sort-package-json": "^2.10.0",
    "validate-npm-package-name": "^5.0.0"
  }
}
```

Template `package.json` uses real npm versions (not `workspace:*`/`catalog:`). Updated as part of release workflow.

## Template Version Strategy

Template `package.json` files list specific npm versions for all `@vexcms/*` packages (e.g., `"@vexcms/core": "^0.1.0"`). These are hardcoded and updated before each `create-vexcms` release. This matches create-z3's approach — simple, no network dependency at scaffold time.

## Implementation Order

1. **Step 1: Package skeleton** — create `packages/create-cli/` with config, copy utility files from create-z3. After this step, `pnpm build` works.
2. **Step 2: Base Next.js template** — copy from `apps/test-app/`, strip test content, add placeholders. After this step, the template directory exists with a complete project.
3. **Step 3: Marketing site overlay** — create overlay directory with collection files and overridden vex.config.ts. After this step, both templates are ready.
4. **Step 4: Installer infrastructure** — fork installer classes from create-z3, add overlay support. After this step, the installer can scaffold projects programmatically.
5. **Step 5: CLI entry point** — fork index.ts from create-z3, add framework prompt (Next.js + TanStack Coming Soon), template selection, remove TweakCN. After this step, the CLI is interactive.
6. **Step 6: Tests** — port validation and string-utils tests, add overlay tests, add integration test (scaffold → verify structure → verify no remaining placeholders).

---

## Step 1: Package skeleton

- [ ] Create `packages/create-cli/package.json`
- [ ] Create `packages/create-cli/tsconfig.json`
- [ ] Create `packages/create-cli/tsup.config.ts`
- [ ] Copy `utils/validation.ts` from create-z3 (no changes)
- [ ] Fork `utils/messages.ts` from create-z3 (rebrand create-z3 → create-vexcms)
- [ ] Fork `helpers/fileOperations.ts` from create-z3 (add `overlayTemplate()`)
- [ ] Fork `installers/types.ts` from create-z3 (add `bare` flag to `ProjectOptions`, keep `Framework`, remove `TweakCNTheme` and `Template`)
- [ ] Run `pnpm build` — verify it compiles

### `File: packages/create-cli/src/installers/types.ts`

```typescript
export type PackageManager = "pnpm" | "npm" | "yarn" | "bun"
export type Framework = "nextjs" | "tanstack"

export interface EnvVariable {
  name: string
  type: "server" | "client"
  description: string
}

export interface OAuthProvider {
  id: string
  name: string
  envPrefix: string
  clientIdVar: string
  clientSecretVar: string
  betterAuthConfig: string
  env: EnvVariable[]
  docs: string
  requiresExtraConfig: boolean
  readme: string
}

export interface ProjectOptions {
  projectName: string
  projectDir: string
  framework: Framework
  bare: boolean
  emailPasswordAuth: boolean
  oauthProviders: string[]
  initGit: boolean
  installDependencies: boolean
}
```

### `File: packages/create-cli/src/helpers/fileOperations.ts`

Forked from create-z3. Add `overlayTemplate()` alongside existing `copyTemplate()`:

```typescript
import fs from "fs-extra"
import path from "path"

export function createProjectDirectory(props: { targetDir: string }): void {
  // TODO: implement
  //
  // 1. If targetDir is "." (current directory), return early — no creation needed
  // 2. Call fs.mkdirSync(props.targetDir, { recursive: true })
  //
  // Edge cases:
  // - Directory already exists and is empty → no error
  // - Permission denied → let fs error propagate
  throw new Error("Not implemented")
}

export function getTargetDirectory(props: {
  projectName: string
}): string {
  // TODO: implement
  //
  // 1. If projectName is ".", return process.cwd()
  // 2. If projectName contains "/" (scoped package like @org/name), use last segment
  // 3. Return path.resolve(process.cwd(), projectName)
  throw new Error("Not implemented")
}

export function copyTemplate(props: {
  templateDir: string
  targetDir: string
}): void {
  // TODO: implement
  //
  // 1. fs.copySync(templateDir, targetDir, { overwrite: true })
  // 2. If _gitignore exists in targetDir, rename to .gitignore
  //    (npm strips .gitignore from published packages)
  throw new Error("Not implemented")
}

export function overlayTemplate(props: {
  overlayDir: string
  targetDir: string
}): void {
  // TODO: implement
  //
  // 1. fs.copySync(overlayDir, targetDir, { overwrite: true })
  //    This merges the overlay onto the existing target — existing files
  //    not present in the overlay are left untouched, overlay files
  //    replace their base counterparts
  //
  // Edge cases:
  // - Overlay adds new files (e.g., collections/) → they appear in target
  // - Overlay replaces existing files (e.g., vex.config.ts) → overwritten
  // - Overlay doesn't touch a file → base version remains
  throw new Error("Not implemented")
}
```

---

## Step 2: Base Next.js template

- [ ] Create `packages/create-cli/templates/base-nextjs/` directory
- [ ] Copy relevant files from `apps/test-app/` into `templates/base-nextjs/`
- [ ] Strip test-specific content: remove articles, posts, categories collections, custom field components (ColorCell, ColorField), blocks, live preview config
- [ ] Add OAuth placeholder markers to `convex/auth/options.ts`, `src/auth/client.tsx`, `.env.example`, `src/env.mjs`, `README.md`
- [ ] Create minimal `vex.config.ts` with empty `collections: []`
- [ ] Create empty `src/vexcms/collections/index.ts` barrel
- [ ] Replace `workspace:*` and `catalog:` versions in `package.json` with real npm versions
- [ ] Add `{{PROJECT_NAME}}` placeholder to `package.json` name field
- [ ] Rename `.gitignore` → `_gitignore`
- [ ] Verify the template directory is a complete, self-contained Next.js project

The base template is not generated code — it's a manual copy-and-edit of the test app. The key changes from test-app:

1. `vex.config.ts`: empty `collections: []`, no articles/posts/categories imports
2. `src/vexcms/collections/index.ts`: empty barrel (no collections exported)
3. `src/db/constants/index.ts`: auth table slugs only (no content slugs)
4. `convex/auth/options.ts`: placeholder markers for OAuth config
5. `src/auth/client.tsx`: placeholder markers for OAuth UI
6. `package.json`: real npm versions, `{{PROJECT_NAME}}` placeholder
7. All test-specific components and custom fields removed

---

## Step 3: Marketing site overlay

- [ ] Create `packages/create-cli/templates/marketing-site/` directory
- [ ] Create `src/db/constants/index.ts` extending base with site builder slugs
- [ ] Create `src/vexcms/collections/pages.ts` with richtext content, slug, status fields
- [ ] Create `src/vexcms/collections/headers.ts` with name, logoText, logoUrl (upload), sticky fields
- [ ] Create `src/vexcms/collections/footers.ts` with name, content (richtext), copyright fields
- [ ] Create `src/vexcms/collections/themes.ts` with name, color, font fields
- [ ] Create `src/vexcms/collections/site_settings.ts` with name, description, favicon fields
- [ ] Create `src/vexcms/collections/index.ts` barrel re-exporting all collections
- [ ] Create `vex.config.ts` importing all collections and wiring into defineConfig

These collection files match the ones built for the test app (pages, headers, footers, themes) with the addition of `site_settings`. All use `admin.group: "Site Builder"` for sidebar grouping.

---

## Step 4: Installer infrastructure

- [ ] Copy `installers/providers.ts` from create-z3 (no changes)
- [ ] Fork `installers/string-utils.ts` from create-z3 (remove `DEFAULT_THEME`, TweakCN functions)
- [ ] Fork `installers/base.ts` from create-z3 (remove `applyTweakCNTheme`, add `applyTemplateOverlay`, rebrand)
- [ ] Fork `installers/nextjs.ts` from create-z3 (update file paths for VEX template structure)
- [ ] Create `installers/index.ts` with re-exports and `createInstaller()` factory
- [ ] Verify `pnpm build` compiles all installer code

### `File: packages/create-cli/src/installers/index.ts`

```typescript
export { VexFrameworkInstaller } from "./base"
export { VexNextJSInstaller } from "./nextjs"
export * from "./types"
export * from "./providers"
export {
  replacePlaceholder,
  generateAuthProvidersBlock,
  generateOAuthUIProvidersBlock,
  generateEnvVarsBlock,
  generateEnvTsServerSchema,
  generateEnvTsRuntimeMapping,
  generateReadmeSection,
  generateCredentialsValue,
} from "./string-utils"

export function createInstaller(props: {
  framework: "nextjs"
  projectDir: string
}): VexNextJSInstaller {
  // Only nextjs for now. When tanstack is ready, switch on props.framework.
  return new VexNextJSInstaller({ projectDir: props.projectDir })
}
```

### Key changes in `installers/base.ts` (forked from create-z3):

The abstract base class gains `applyTemplateOverlay()` which is called by `initProject()` after `copyBaseFiles()`:

```typescript
// In initProject(), after step 1 (copyBaseFiles):
if (!props.options.bare) {
  this.applyTemplateOverlay({ overlay: "marketing-site" })
}
```

The `applyTemplateOverlay` method uses the `overlayTemplate()` helper from `fileOperations.ts` to merge the marketing site overlay onto the already-copied base template. When `--bare` is passed, this step is skipped entirely.

Remove: `applyTweakCNTheme()`, any TweakCN references.
Rebrand: all "create-z3" strings → "create-vexcms", commit message → "Initial commit from create-vexcms".

---

## Step 5: CLI entry point

- [ ] Fork `src/index.ts` from create-z3
- [ ] Add framework selection prompt (Next.js recommended, TanStack Start "Coming Soon")
- [ ] Handle TanStack selection: show message, loop back to framework prompt
- [ ] Add `--bare` flag via commander (no template selection prompt)
- [ ] Remove TweakCN theme prompt
- [ ] Update branding, defaults, success messages
- [ ] Verify `pnpm build && node dist/index.js --help` works

### CLI prompt flow in `src/index.ts`:

```typescript
// Parse CLI args with commander
const program = new Command()
  .name("create-vexcms")
  .argument("[project-name]", "Project directory name")
  .option("--bare", "Skip marketing site collections, scaffold empty project")
  .parse()

const args = program.args
const opts = program.opts()
const bare = opts.bare ?? false

// 1. Project name (skip if provided as positional arg)
const projectName = args[0] ?? await input({
  message: "What is your project named?",
  default: "my-vexcms-app",
  validate: validateProjectName,
})

// 2. Framework selection
let framework: Framework
while (true) {
  framework = await select({
    message: "Select a framework:",
    choices: [
      { name: "Next.js (Recommended)", value: "nextjs" },
      { name: "TanStack Start (Coming Soon)", value: "tanstack" },
    ],
  })
  if (framework === "tanstack") {
    console.log(chalk.yellow("\n  TanStack Start support is coming soon! Please select Next.js for now.\n"))
    continue
  }
  break
}

// 3. Email/password auth
const emailPasswordAuth = await confirm({
  message: "Enable email/password authentication?",
  default: true,
})

// 4. OAuth providers (multi-select from Better Auth providers)
// ... same as create-z3

// 5. Git init
// 6. Install dependencies
// ... same as create-z3

// Build options — bare flag controls whether marketing site overlay is applied
const options: ProjectOptions = {
  projectName,
  projectDir: getTargetDirectory({ projectName }),
  framework,
  bare,
  emailPasswordAuth,
  oauthProviders,
  initGit,
  installDependencies,
}
```

---

## Step 6: Tests

- [ ] Copy `validation.test.ts` from create-z3 (no changes)
- [ ] Fork `string-utils` tests from create-z3 (remove TweakCN tests)
- [ ] Create `fileOperations.test.ts` with overlay tests
- [ ] Create integration test: scaffold plain + marketing-site templates, verify file structure
- [ ] Run `pnpm --filter create-vexcms test` — all pass

### `File: packages/create-cli/src/__tests__/fileOperations.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import fs from "fs-extra"
import path from "path"
import os from "os"
import { copyTemplate, overlayTemplate } from "../helpers/fileOperations"

describe("overlayTemplate", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vex-test-"))
  })

  afterEach(() => {
    fs.removeSync(tmpDir)
  })

  it("adds new files from overlay", () => {
    // Setup base
    const baseDir = path.join(tmpDir, "base")
    fs.mkdirSync(baseDir)
    fs.writeFileSync(path.join(baseDir, "existing.ts"), "base content")

    // Setup overlay
    const overlayDir = path.join(tmpDir, "overlay")
    fs.mkdirSync(overlayDir)
    fs.writeFileSync(path.join(overlayDir, "new-file.ts"), "overlay content")

    // Copy base then overlay
    const targetDir = path.join(tmpDir, "target")
    copyTemplate({ templateDir: baseDir, targetDir })
    overlayTemplate({ overlayDir, targetDir })

    expect(fs.existsSync(path.join(targetDir, "existing.ts"))).toBe(true)
    expect(fs.existsSync(path.join(targetDir, "new-file.ts"))).toBe(true)
    expect(fs.readFileSync(path.join(targetDir, "existing.ts"), "utf-8")).toBe("base content")
    expect(fs.readFileSync(path.join(targetDir, "new-file.ts"), "utf-8")).toBe("overlay content")
  })

  it("replaces existing files with overlay versions", () => {
    const baseDir = path.join(tmpDir, "base")
    fs.mkdirSync(baseDir)
    fs.writeFileSync(path.join(baseDir, "config.ts"), "base config")

    const overlayDir = path.join(tmpDir, "overlay")
    fs.mkdirSync(overlayDir)
    fs.writeFileSync(path.join(overlayDir, "config.ts"), "overlay config")

    const targetDir = path.join(tmpDir, "target")
    copyTemplate({ templateDir: baseDir, targetDir })
    overlayTemplate({ overlayDir, targetDir })

    expect(fs.readFileSync(path.join(targetDir, "config.ts"), "utf-8")).toBe("overlay config")
  })

  it("preserves base files not in overlay", () => {
    const baseDir = path.join(tmpDir, "base")
    fs.mkdirpSync(path.join(baseDir, "src"))
    fs.writeFileSync(path.join(baseDir, "src/layout.tsx"), "layout")
    fs.writeFileSync(path.join(baseDir, "src/globals.css"), "styles")

    const overlayDir = path.join(tmpDir, "overlay")
    fs.mkdirpSync(path.join(overlayDir, "src"))
    fs.writeFileSync(path.join(overlayDir, "src/layout.tsx"), "new layout")

    const targetDir = path.join(tmpDir, "target")
    copyTemplate({ templateDir: baseDir, targetDir })
    overlayTemplate({ overlayDir, targetDir })

    expect(fs.readFileSync(path.join(targetDir, "src/layout.tsx"), "utf-8")).toBe("new layout")
    expect(fs.readFileSync(path.join(targetDir, "src/globals.css"), "utf-8")).toBe("styles")
  })
})
```

### Integration test sketch:

```typescript
describe("scaffold integration", () => {
  it("scaffolds default (marketing-site) template with collection files", () => {
    // 1. Run the installer programmatically with bare: false (default)
    // 2. Assert pages.ts, headers.ts, footers.ts, themes.ts, site_settings.ts exist
    // 3. Assert vex.config.ts imports all collections
    // 4. Assert db/constants/index.ts has TABLE_SLUG_PAGES etc.
    // 5. Assert no file contains "{{" (all placeholders replaced or removed)
    // 6. Assert package.json has the correct project name
  })

  it("scaffolds bare template with empty collections when --bare is passed", () => {
    // 1. Run the installer with bare: true
    // 2. Assert vex.config.ts has empty collections array
    // 3. Assert no collection files in src/vexcms/collections/ (just empty index.ts)
    // 4. Assert no file contains "{{" (all placeholders replaced or removed)
  })
})
```

## Extensibility

Adding a new template:
1. Create `templates/{template-name}/` with overlay files
2. Add a new CLI flag (e.g., `--ecommerce`, `--blog`) that selects the overlay
3. Update the installer to apply the correct overlay based on the flag
4. No other installer changes needed — overlays are template-agnostic

Adding TanStack Start support:
1. Create `templates/base-tanstack/` with complete TanStack Start project
2. Create `VexTanStackInstaller` subclass (fork from create-z3's `tanstack.ts`)
3. Remove "Coming Soon" guard from framework prompt
4. Template overlays work across frameworks (same relative paths)

## Dependencies (for generated projects)

```
@vexcms/core, @vexcms/admin-next, @vexcms/ui, @vexcms/richtext
@vexcms/better-auth, @vexcms/file-storage-convex
@vexcms/cli (devDep)
convex, better-auth, @convex-dev/better-auth, @convex-dev/react-query
@tanstack/react-query, @tanstack/react-form
next, react, react-dom
tailwindcss, shadcn, lucide-react
@t3-oss/env-nextjs, zod
next-themes, class-variance-authority, clsx, tailwind-merge
```

## Testing

**Unit:** Project name validation, placeholder replacement, auth config generation, overlay file operations.
**Integration:** Scaffold to temp dir → verify all files exist, no `{{` placeholders remain, package.json has correct name, marketing-site template has collection files.
**Manual:** `pnpm --filter create-vexcms build && node packages/create-cli/dist/index.js test-project` → verify `pnpm install && pnpm dev` works.

## Success Criteria

- [ ] `pnpm --filter create-vexcms build` succeeds
- [ ] `pnpm --filter create-vexcms test` — all tests pass
- [ ] CLI scaffolds a marketing site project by default with all 5 collection files present
- [ ] CLI scaffolds a bare project with `--bare` flag (empty collections, no overlay)
- [ ] OAuth placeholder replacement works (no `{{` remaining after scaffold)
- [ ] TanStack Start selection shows "Coming Soon" and loops back
- [ ] `_gitignore` renamed to `.gitignore` in scaffolded project
- [ ] Package.json name is set to user's project name
- [ ] Marketing site vex.config.ts imports all collections correctly
