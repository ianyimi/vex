# VEX CMS Rebuild — Planning & Open Questions

Companion document to `rebuild-v1.md`. Covers what to bring over, migration strategy, testing approach, and open decisions.

---

## What to Bring Over vs Rewrite

| Module | Verdict | Rationale |
|---|---|---|
| **Tests (560+)** | Port as-is | Tests are the spec. Copy them, update import paths, implement until they pass. Tests don't care about package structure. |
| **Field type definitions** | Port with review | You wrote the initial field defs. These are small pure functions (`text()`, `select()`, etc.) that return typed objects. Study each one as you port — they're the foundation. |
| **defineCollection / defineGlobal / defineBlock** | Rewrite | Simple functions but they set up the generic type inference chain. Rewrite so you own the type plumbing. Use existing tests as spec. |
| **defineConfig** | Rewrite | Central config resolver. Needs to support plugins, TComponent generic, new package structure. Use existing tests but redesign internals. |
| **defineAccess / hasPermission** | Study then rewrite | The permission system has subtle edge cases (empty fields, dynamic callbacks, field-level mode objects). Study the tests carefully — they document the edge cases. Rewrite with those tests as your guide. |
| **Schema generation (generateVexSchema)** | Study then rewrite | Regex-based schema parsing and Convex schema output. Complex but well-tested (19 diffSchema tests, 11 planMigration tests). Understand the approach before deciding if you want the same architecture or a cleaner one. |
| **Type generation (generateVexTypes)** | Port with review | Generates TypeScript interfaces from collection definitions. Relatively straightforward string template code. |
| **CLI (vex dev, file watching, schema diffing)** | Study carefully | The CLI orchestrates everything — config loading, schema generation, Convex process management, file watching. It's the most complex piece and the one you interact with daily. Study it thoroughly. Consider rewriting the watcher and process management, porting the schema generation logic. |
| **Convex model functions** | Port with review | `getDocument`, `listDocuments`, `createDocument`, etc. These are Convex mutation/query helpers. Straightforward CRUD with pagination. |
| **vexQuery / preview snapshots** | Study then rewrite | The draft-aware query system and preview snapshot mechanism. Important for live preview. Study how it works, then rewrite. |
| **Version management** | Study then rewrite | Draft/publish workflow, version history, autosave. Complex state machine. Study the existing code + tests before rewriting. |
| **Block styles (blockStylesToTailwind)** | Port as-is | Pure function, well-tested (31 tests). Maps JSON style presets to Tailwind classes. No reason to rewrite. |
| **buildSiteMetadata** | Port as-is | Pure function, 11 tests. Simple metadata merging. You just wrote this. |
| **checkAdminAccess** | Port as-is | Simple function you just wrote. |
| **Admin panel React components** | Rewrite | The entire admin UI (sidebar, views, form fields, block editor, data table). This is where most of the "code I don't understand" lives. Rewrite from scratch using the headless admin logic as the foundation. |
| **RenderBlocks** | Port as-is | Tiny component (~30 lines). Maps block types to components. |
| **ThemeStyle / ThemeInjector** | Port with review | Server-side and client-side theme CSS injection. You understand how these work from our sessions. |
| **Marketing site blocks** | Port as-is | Hero, Features, CTA, FAQ, etc. These are your block components. |
| **create-vexcms templates** | Rebuild from scratch | The templates should be rebuilt once the new package structure is stable. Don't port old templates — scaffold fresh ones. |

### Verdict Key
- **Port as-is** — Copy the file, update imports, move on. You understand it or it's simple enough.
- **Port with review** — Copy it but read every line. Make sure you understand what it does before moving on.
- **Study then rewrite** — Don't copy the code. Read it, understand the approach, then write your own version from scratch with the tests as your guide.
- **Rewrite** — Start from scratch. The existing code's approach may not match the new architecture.

---

## Migration System

### What the current system does

The VEX CLI's auto-migration handles schema changes in 3 phases:

1. **Interim schema** — makes all changed fields optional so Convex accepts the new schema without breaking existing docs
2. **Deploy interim** — pushes the interim schema to Convex
3. **Run mutations** — transforms existing documents (fills defaults for new fields, removes old fields)
4. **Final schema** — deploys the real schema with correct required/optional constraints

This handles: adding fields, removing fields, making fields required/optional.

### What it does NOT handle

- **Renaming fields** — treated as "remove old + add new". Data in the old field is lost.
- **Changing field types** — e.g. `text()` → `select()`. The schema changes but existing data isn't transformed.
- **Complex data transformations** — e.g. splitting a `fullName` field into `firstName` + `lastName`.

### What Convex handles for you

- **Deployment rollbacks** — roll back to previous deployment from Convex dashboard. This reverts both code and schema.
- **Schema validation** — Convex rejects schema pushes that would break existing data (e.g. making a field required when existing docs don't have it).

### What to add in the rebuild

**Rename support:**
```
Migration op: { type: "rename", from: "title", to: "name", collection: "posts" }
```
- Interim: add `name` as optional
- Mutation: copy `doc.title` → `doc.name` for all docs
- Final: remove `title`, make `name` required

**Type change support:**
```
Migration op: { type: "transform", field: "status", collection: "posts", transform: (old) => ... }
```
- Requires a user-provided transform function
- Could be registered via a `migrations` config in `defineCollection`

**Migration file approach (alternative):**
Instead of auto-detecting changes, generate migration files that the developer reviews and edits:
```
vex migrate:generate "rename title to name"
→ creates migrations/001_rename_title_to_name.ts
→ developer reviews, edits transform logic
vex migrate:run
→ executes the migration
```

**Recommendation for the rebuild:** Start with the current add/remove system (it works). Add rename detection as the first enhancement. Type changes and migration files are Phase 2 — they require more design work and are less common.

**You do NOT need a rollback system.** Convex handles this at the deployment level. If a migration goes wrong, roll back the Convex deployment.

---

## Testing Strategy

### How to port tests

1. Create the new monorepo with the new package structure
2. Set up vitest config (same as current — vitest.config.ts per package)
3. Copy test files from `packages/core/src/**/*.test.ts` to the new repo
4. Update import paths to match new structure
5. Tests will fail (no implementations yet) — that's the point
6. Implement until all tests pass

### Test-first workflow

For each module in the rebuild:
1. Port the tests first
2. Run them — they all fail
3. Implement the module
4. Run them — they should pass
5. If a test doesn't make sense for the new architecture, understand why before deleting it

### What to test that isn't currently tested

The current test suite is mostly unit tests for core. Missing:
- **Integration tests** for the CLI (scaffold → generate → build)
- **Admin panel component tests** (the current admin-next has zero tests)
- **Permission system integration** (hasPermission + checkAdminAccess + dynamic callbacks with real data)
- **Plugin system** (config transform, hook execution)

Add these in the rebuild as you build each module.

### Versioning

Start at **0.1.0**. The `0.0.x` range was the AI-built prototype. `0.1.0` signals "intentionally designed first version."

Publish as `0.1.0-alpha.1`, `0.1.0-alpha.2`, etc. during development. Graduate to `0.1.0` when the core + react + next packages are stable enough for the marketing site to run on them.

---

## Open Questions to Decide During Rebuild

### 1. Same repo or new repo?

**Option A: New branch in this repo** — keeps git history, easier to reference old code. But the old `packages/` and `apps/` directories clutter the workspace.

**Option B: New repo** — clean slate. Link to the old repo in the README for reference. Copy tests over manually.

**Recommendation:** New branch (`v1` or `rebuild`) in this repo. Delete the old `packages/` and `apps/` directories on the new branch. Git history is preserved if you need to reference old implementations.

### 2. Class-based CMS instance vs plain functions?

The current architecture uses pure functions that require passing `access`/`config` explicitly. A class-based approach (`const vex = defineConfig({...})` returns an instance with bound methods) would be cleaner but has RSC serialization concerns.

**Decision needed when:** You implement `defineConfig` and the permission system.

**Recommendation:** Start with plain functions + config parameter (same as current). If the API feels awkward, prototype the class approach on a branch and test it with RSC.

### 3. Form state management library?

Current: TanStack Form (`@tanstack/react-form`). This works but adds a dependency.

Options for rebuild:
- Keep TanStack Form — proven, well-maintained
- Roll your own with React state — more control, one less dependency
- Use react-hook-form — more popular, larger ecosystem

**Decision needed when:** You build `@vexcms/react` form components.

### 4. UI component library?

Current: mix of shadcn/ui, @base-ui/react, and custom components.

Options for rebuild:
- Standardize on @base-ui/react (headless, composable)
- Standardize on shadcn/ui patterns (copy-paste, Tailwind)
- Roll custom components from scratch

**Decision needed when:** You build `@vexcms/react`.

### 5. Rich text editor?

Current: Plate.js (Slate-based). Payload uses Lexical.

Options:
- Keep Plate.js — you have a working integration
- Switch to Lexical — aligns with Payload's approach, has better docs
- Make it pluggable — `@vexcms/richtext-plate`, `@vexcms/richtext-lexical`

**Decision needed when:** You build the richtext field.

### 6. How to handle the CLI's generated Convex files?

Current: The CLI generates `convex/vex/collections.ts`, `convex/vex/versions.ts`, etc. as static files, plus per-collection API files. Some are generated, some are static templates.

Questions:
- Should ALL Convex files be generated? Or should some be static and shipped in the template?
- Should the CLI generate a single file or many small files?
- How does the developer customize generated code? (e.g. adding custom queries)

**Decision needed when:** You build `@vexcms/cli`.

### 7. Monorepo tooling?

Current: pnpm workspaces + turborepo + tsup + vitest.

Consider:
- Keep the same stack (it works)
- Switch to nx (more features but more complex)
- Switch to bun workspaces (faster but less mature)

**Recommendation:** Keep pnpm + turborepo + tsup + vitest. Don't change tooling during a rebuild — that's two unknowns at once.

---

## Decisions Made

These questions from above have been decided:

- **Class vs functions:** Functions. No class-based CMS instance.
- **Form state:** TanStack Form (`@tanstack/react-form`) in `@vexcms/react`.
- **UI components:** shadcn/ui + @base-ui/react (same as current).
- **Rich text:** Plate.js, but pluggable. Package named `@vexcms/richtext-plate`. Architecture supports future `@vexcms/richtext-lexical`.
- **CLI generated files:** Some files generated by CLI (for install-into-existing-project support), some static in templates. Both paths must work.
- **Monorepo tooling:** pnpm + turborepo + tsup + vitest. No changes.

---

## Production Readiness Concerns

These must be planned BEFORE rebuilding because they affect file structure, error types, config shape, and the boundary between packages.

### 1. Error System

**Problem:** The current version has generic errors ("Validation failed", "Not authenticated") that don't help users fix the issue.

**Plan:** Create a structured error system in `@vexcms/core`:

```
core/src/errors/
├── VexError.ts              — base error class, all VEX errors extend this
├── VexConfigError.ts        — config validation errors (bad slug, missing field, invalid option)
├── VexPermissionError.ts    — RBAC errors (denied action, missing role, insufficient access)
├── VexValidationError.ts    — form/field validation errors (required field, wrong type, bad format)
├── VexSchemaError.ts        — schema generation errors (duplicate slugs, reserved names)
└── VexMigrationError.ts     — migration errors (failed transform, schema conflict)
```

Each error class includes:
- `code` — machine-readable error code (e.g. `PERMISSION_DENIED`, `FIELD_REQUIRED`, `INVALID_SLUG`)
- `message` — human-readable description of what went wrong
- `hint` — actionable suggestion for how to fix it
- `context` — structured data (which collection, which field, which action, which role)

Example:
```typescript
throw new VexPermissionError({
  code: "PERMISSION_DENIED",
  message: `Access denied: "delete" on "pages"`,
  hint: `The "user" role does not have delete permission on the "pages" collection. Update your access config in defineAccess().`,
  context: { action: "delete", resource: "pages", userRoles: ["user"] },
})
```

**Admin panel error handling:** The `@vexcms/react` package needs an `ErrorBoundary` component and a toast/notification system. When a Convex mutation throws a `VexPermissionError`, the admin panel should show a clear message, not a stack trace. Plan for:

```
react/src/components/
├── ErrorBoundary.tsx         — catches render errors, shows fallback UI
├── ErrorToast.tsx            — toast notification for mutation errors
└── useErrorHandler.ts        — hook that parses VexError from Convex ConvexError responses
```

**File structure impact:** The `errors/` directory in core is a first-class module, not an afterthought. Every package that throws errors imports from `@vexcms/core/errors`. The error codes become part of the public API — they should be stable and documented.

### 2. Minimal Config — What's Required vs Optional

**Problem:** The current version requires auth to be configured before anything works. A user can't even see the admin panel without Better Auth set up. This makes the first-5-minutes experience painful.

**Plan:** Define three tiers of config:

**Tier 0 — Absolute minimum (works with zero config):**
```typescript
// This should work:
export default defineConfig({
  collections: [
    defineCollection({
      slug: "posts",
      fields: { title: text() },
    })
  ]
})
```
- No auth required — admin panel is open (development mode)
- No access config — everything is permissive
- No media — upload fields just don't work
- No globals — not needed
- Default admin path (`/admin`)
- Default schema output paths

**Tier 1 — Auth enabled:**
```typescript
export default defineConfig({
  auth: betterAuth({ ... }),
  collections: [...],
})
```
- Auth adds: sign-in/sign-out, user collection, session management
- Access is still permissive unless explicitly configured

**Tier 2 — Full production config:**
```typescript
export default defineConfig({
  auth: betterAuth({ ... }),
  access: defineAccess({ ... }),
  collections: [...],
  globals: [...],
  media: { ... },
  plugins: [...],
})
```

**File structure impact:** The auth adapter interface needs a "no-op" default. The admin panel needs to work WITHOUT auth — render the panel directly, skip sign-in. This means:
- `@vexcms/core` needs a `NoAuthAdapter` or the auth field must be truly optional
- The admin layout component (in `@vexcms/react` / `@vexcms/next`) needs a code path for "no auth configured"
- The generated Convex functions need to handle the case where `getUser()` returns null because there's no auth — currently they throw

### 3. TypeScript Error Quality

**Problem:** Deep generic chains (`TComponent<TFields<TExtraKeys<TSlug>>>`) produce unreadable TS errors when something doesn't match. Users see 50-line error messages pointing at the wrong location.

**Plan:**

**a) Limit generic depth.** The current architecture threads `TComponent` through `VexConfigInput → VexCollection → VexField → FieldAdminConfig`. That's 4 levels. Each level multiplies the error complexity. Consider flattening:

```typescript
// Instead of threading TComponent through every level:
interface VexConfigInput<TComponent> {
  collections: VexCollection<any, any, any, TComponent>[]  // 4 generics deep
}

// Consider a config-level validation instead:
interface VexConfigInput {
  collections: VexCollection[]  // no TComponent here
}
// TComponent checked at defineConfig call site via overloads or conditional types
```

**b) Use branded types with error messages:**
```typescript
type InvalidField<Message extends string> = { __error: Message } & never

// When a field type is wrong, TS shows:
// Type 'string' is not assignable to type '{ __error: "Expected a number field but got text" } & never'
```

**c) Test your types.** Use `vitest`'s `expectTypeOf` or `tsd` to write type-level tests:
```typescript
// type-tests/defineConfig.test-d.ts
import { expectTypeOf } from "vitest"

// This should compile:
expectTypeOf(defineConfig({ collections: [] })).toMatchTypeOf<VexConfig>()

// This should NOT compile:
// @ts-expect-error — collections is required
defineConfig({})
```

**File structure impact:** Add a `type-tests/` directory in core for type-level tests. Consider a `types/helpers.ts` file for type utilities like `InvalidField<Message>` and type-level error formatting.

### 4. Admin Panel Error UX

**Problem:** When a Convex mutation fails (permission denied, validation error, network error), the admin panel either shows nothing or shows a raw error. Users don't know what happened or what to do.

**Plan:**

**Error categories and their UI treatment:**

| Error Type | UI Treatment |
|---|---|
| Permission denied | Toast: "You don't have permission to [action] this [resource]. Contact an admin." |
| Validation failed | Inline field errors (red border + message below field) |
| Network error | Banner: "Connection lost. Changes will sync when reconnected." (Convex handles this mostly) |
| Not found | Redirect to collection list with toast: "[Document] was deleted or doesn't exist." |
| Server error | Toast: "Something went wrong. Try again." + error details in console |

**Component structure in `@vexcms/react`:**
```
react/src/
├── components/
│   ├── error/
│   │   ├── ErrorBoundary.tsx      — catches React render errors
│   │   ├── ErrorToast.tsx         — toast component for mutation errors
│   │   └── MutationErrorHandler.tsx — wraps useMutation, parses errors
│   └── ...
├── hooks/
│   ├── useSafeMutation.ts        — wraps useMutation with error parsing + toast
│   └── ...
```

`useSafeMutation` wraps every Convex `useMutation` call. On error, it parses the `ConvexError` data, matches it to a `VexError` type, and shows the appropriate toast. The developer never writes error handling code — it's built into the admin panel.

**File structure impact:** Error handling is a cross-cutting concern. The `error/` directory in `@vexcms/react` is a first-class module. The `useSafeMutation` hook replaces every direct `useMutation` call in the admin panel.

### 5. First 5 Minutes Experience

**Problem:** Too many steps between install and "I see my content." Current flow: install → set up Better Auth secret → set up env vars → run vex dev → create Convex project → run seed → run next dev → sign up → get promoted to admin → go to admin panel. That's 10 steps.

**Target flow:**
1. `npx create-vexcms@latest my-app`
2. `cd my-app && pnpm vex dev` (creates Convex project automatically)
3. `pnpm dev`
4. Open browser → see admin panel → create content

**What needs to change:**
- Auth must be optional for development (Tier 0 config)
- `vex dev` should handle Convex project creation seamlessly (the tsconfig patching fix is a start)
- The admin panel should work without sign-in in development mode
- The welcome page should be the admin panel, not a "create account" flow
- Generate a `BETTER_AUTH_SECRET` automatically during scaffold (just a random string)

**File structure impact:** The CLI's scaffold logic needs a "generate env" step. The admin panel needs a "dev mode" code path. The `@vexcms/next` AdminLayout needs to skip auth checks when no auth is configured.

### 6. JSDoc as Documentation

**Rule:** Every exported function, type, and interface gets JSDoc with:
- One-line description
- `@param` for each parameter (including `props.fieldName` for object params)
- `@returns` description
- `@example` with a realistic usage example
- `@throws` if it can throw

This is not optional. It's the primary documentation surface for users — they'll see it in their editor before they ever visit a docs site.

**File structure impact:** None directly, but enforce it via an ESLint rule (`eslint-plugin-jsdoc`) that fails CI if exported symbols lack JSDoc.

---

## Rebuild Readiness Checklist

Before starting the rebuild, confirm:

- [ ] Architecture doc reviewed and finalized (`rebuild-v1.md`)
- [ ] This planning doc reviewed — open questions noted but don't need answers yet
- [ ] New branch created (`v1`) in this repo
- [ ] Old packages/apps deleted on the new branch
- [ ] Monorepo scaffolded (pnpm workspaces, tsconfig, vitest, tsup)
- [ ] Package stubs created (core, react, next, cli, better-auth, storage-convex, richtext)
- [ ] CI set up (build + test on push)
- [ ] Tests ported from current repo to new structure (failing is expected)
- [ ] First module implemented and tests passing (field type system is the best starting point)
