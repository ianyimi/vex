# Spec 30.5 — create-vexcms CLI

## Overview

A scaffolding CLI that creates new VEX CMS projects with all necessary dependencies, configuration, and optional template content. Published as `create-vexcms` on npm, invoked via `pnpm create vexcms@latest`. Lives at `packages/create-cli/` in the vex monorepo.

Forked from [create-z3-app](https://github.com/zayecq/create-z3-app) and adapted for the VEX CMS ecosystem. Only supports Next.js for now but the architecture supports adding TanStack Start (or other frameworks) later via new installer subclasses and template directories.

## Design Decisions

- **Two-layer template system:** A `base-nextjs/` template is a complete working Next.js + VEX project. Template variants like `marketing-site/` are sparse overlay directories that only contain files that differ from or add to the base. The installer copies the base first, then overlays. This avoids duplicating the entire project for each template.
- **Fork create-z3's installer pattern:** The abstract `FrameworkInstaller` → concrete `NextJSInstaller` pattern is proven and directly applicable. The OAuth provider registry (`providers.ts`) is copied wholesale since it's pure Better Auth configuration data with no framework coupling.
- **No TweakCN theme prompt:** Default theme only. Themes will be managed via a theme collection (Spec 30 defineSite), not baked in at scaffold time.
- **Collection stubs, not full collections:** The marketing site template ships collection definitions with slug/label and minimal fields (title, slug). Users fill in their own fields. This keeps the template lightweight and avoids opinionated content modeling.
- **Consts pattern:** `TABLE_SLUG_*` and `BLOCK_SLUG_*` constants isolate all slug strings into a single file, preventing typos and enabling IDE rename refactoring across the project.

## Out of Scope

- TanStack Start framework support (future installer subclass)
- Full marketing site template with populated fields and UI blocks (Spec 33)
- Custom TweakCN theme selection (themes via collection instead)
- Publishing/CI pipeline for create-vexcms (Spec 02)

## CLI Flow

```
$ pnpm create vexcms@latest

1. Project name?              (default: "my-vexcms-app", validates npm name rules, supports ".")
2. Select a template:
   - Plain — Next.js + VEX CMS (empty config)
   - Marketing Site — Pages, headers, footers, themes, site settings
3. Enable email/password?     (default: yes)
4. Select OAuth providers:    (multi-select from Better Auth providers)
5. Initialize git repo?       (default: yes)
6. Install dependencies?      (default: yes)
```

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
│   │   ├── nextjs.ts               # NextJSInstaller subclass
│   │   ├── providers.ts            # OAuth provider registry (copied from create-z3)
│   │   ├── string-utils.ts         # Placeholder replacement helpers (forked from create-z3)
│   │   ├── types.ts                # ProjectOptions, Template, OAuthProvider types
│   │   └── index.ts                # Re-exports
│   ├── helpers/
│   │   └── fileOperations.ts       # copyTemplate, overlay, createProjectDirectory
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
│   │   ├── package.json            # Real npm versions (not workspace:*), {{PROJECT_NAME}}
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── README.md               # With <!-- {{OAUTH_SETUP_GUIDE}} --> placeholder
│   │   ├── convex/
│   │   │   ├── _generated/         # Stub files
│   │   │   ├── auth/               # Full Better Auth adapter
│   │   │   │   ├── adapter/        # Convex adapter for Better Auth
│   │   │   │   ├── options.ts      # // {{OAUTH_PROVIDERS}} and // {{EMAIL_PASSWORD_AUTH}}
│   │   │   │   ├── config.ts
│   │   │   │   ├── db.ts
│   │   │   │   ├── api.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── plugins/
│   │   │   │   └── index.ts
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
│   │   │   │   └── client.tsx      # // {{OAUTH_UI_PROVIDERS}} placeholder
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
│       │   │       └── index.ts    # Extends base with TABLE_SLUG_PAGES, HEADERS, etc.
│       │   └── vexcms/
│       │       ├── consts.ts       # TABLE_SLUG_* and BLOCK_SLUG_* constants
│       │       └── collections/
│       │           ├── index.ts    # Re-exports all collection stubs
│       │           ├── pages.ts
│       │           ├── headers.ts
│       │           ├── footers.ts
│       │           ├── themes.ts
│       │           └── site-settings.ts
│       └── vex.config.ts           # Imports stubs, wires defineSite()
```

## Templates

### Base Next.js Template

Derived from `apps/test-app/` but stripped of test-specific content. A complete working project with:

- All `@vexcms/*` dependencies at real npm versions
- Convex backend with Better Auth adapter (full adapter/, plugins/, sessions, etc.)
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

Sparse directory merged on top of the base template. Only contains added/replaced files:

**`src/vexcms/consts.ts`:**
```ts
// Table slugs
export const TABLE_SLUG_PAGES = "pages" as const
export const TABLE_SLUG_HEADERS = "headers" as const
export const TABLE_SLUG_FOOTERS = "footers" as const
export const TABLE_SLUG_THEMES = "themes" as const
export const TABLE_SLUG_SITE_SETTINGS = "site_settings" as const

// Block slugs (empty stubs — user adds their own)
// export const BLOCK_SLUG_HERO = "hero" as const
// export const BLOCK_SLUG_CTA = "cta" as const
```

**Collection stubs** (e.g., `src/vexcms/collections/pages.ts`):
```ts
import { defineCollection, text } from "@vexcms/core"
import { TABLE_SLUG_PAGES } from "../consts"

export const pages = defineCollection({
  slug: TABLE_SLUG_PAGES,
  labels: { singular: "Page", plural: "Pages" },
  admin: { useAsTitle: "title" },
  fields: {
    title: text({ label: "Title", required: true }),
    slug: text({ label: "Slug", required: true }),
  },
})
```

**`vex.config.ts`** (overrides base):
```ts
import { defineConfig } from "@vexcms/core"
// import { defineSite } from "@vexcms/core"  // uncomment when Spec 30 lands
import { convexFileStorage } from "@vexcms/file-storage-convex"

import { auth } from "~/vexcms/auth"
import { pages, headers, footers, themes, siteSettings } from "~/vexcms/collections"

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
  // sites: [
  //   defineSite({
  //     slug: "main",
  //     label: "Main Site",
  //     settings: "site_settings",
  //     header: "headers",
  //     footer: "footers",
  //     theme: "themes",
  //     pages: "pages",
  //   }),
  // ],
})
```

Note: `defineSite()` is commented out until Spec 30 is implemented. The collections and consts are ready for it.

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
| `installers/types.ts` | Fork | Add `Template` type, remove `TweakCNTheme`, simplify `Framework` |
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

### Step 1: Package skeleton
- Create `packages/create-cli/` with `package.json`, `tsconfig.json`, `tsup.config.ts`
- Copy utility files from create-z3: `validation.ts`, `messages.ts` (rebrand)
- Copy and adapt `fileOperations.ts` (add overlay support)

### Step 2: Base Next.js template
- Copy relevant files from `apps/test-app/` into `templates/base-nextjs/`
- Strip test-specific content (articles, posts, categories, custom components)
- Add OAuth placeholders to auth files
- Create minimal `vex.config.ts` with empty collections
- Replace `workspace:*` and `catalog:` versions with real npm versions
- Rename `.gitignore` → `_gitignore` (npm ignores `.gitignore` in packages)

### Step 3: Marketing site overlay
- Create `templates/marketing-site/` with collection stubs
- Create `src/vexcms/consts.ts` with TABLE_SLUG_ and BLOCK_SLUG_ constants
- Create `vex.config.ts` override importing stubs
- Create extended `src/db/constants/index.ts`

### Step 4: Installer infrastructure
- Fork `installers/base.ts` from create-z3 (remove TweakCN, add overlay step)
- Fork `installers/nextjs.ts` (update file paths)
- Copy `installers/providers.ts` from create-z3
- Fork `installers/string-utils.ts` (remove TweakCN functions)
- Fork `installers/types.ts` (add Template, remove TweakCN)

### Step 5: CLI entry point
- Fork `index.ts` from create-z3
- Remove framework selection (hardcode Next.js)
- Add template selection prompt
- Remove TweakCN theme prompt
- Update branding and defaults

### Step 6: Tests
- Port validation and string-utils tests from create-z3
- Add template overlay tests
- Add integration test: scaffold → verify file structure → verify no remaining placeholders

## Extensibility

Adding a new template:
1. Create `templates/{template-name}/` with overlay files
2. Add to `Template` type union
3. Add to template selection prompt
4. No installer changes needed — overlays are template-agnostic

Adding a new framework:
1. Create `templates/base-{framework}/` with complete project
2. Create new installer subclass (e.g., `TanStackInstaller`)
3. Add framework selection prompt back to CLI
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

**Unit:** Project name validation, placeholder replacement, auth config generation.
**Integration:** Scaffold to temp dir → verify all files exist, no `{{` placeholders remain, package.json has correct name, marketing-site template has collection stubs.
**Manual:** `pnpm --filter create-vexcms build && node packages/create-cli/dist/index.js test-project` → verify `pnpm install && pnpm dev` works.
