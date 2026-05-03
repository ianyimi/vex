---
name: 1-dev-spec
description: Write a scoped implementation spec for vexcms. Produces plan.md, shape.md, standards.md, and references.md in .pi/agent-docs/specs/.
invoke: "dev-spec"
---

# Dev Spec — vexcms

---

## Project Context

**Project:** vexcms (Vex CMS — Convex-native headless CMS)
**Stack:** TypeScript · Turborepo + pnpm · Next.js 16 · React 19 · Convex · Better Auth · Tailwind 4 · shadcn/ui · TanStack Query/Form/Table · Vitest · Playwright · Plate richtext
**Workflow tier:** **High-care** — developer implements all production code. Agent writes specs, reviews, and points out issues. Never write core logic unilaterally.

<!-- sync-spec:dev-commands -->
**Dev commands (root):**

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Turbo dev across all packages (concurrency 11) |
| `pnpm dev:app` | Next.js admin only — `apps/www` on port 3020 |
| `pnpm typecheck` | Turbo typecheck across workspace |
| `pnpm test` | Turbo test (Vitest) across workspace |
| `pnpm test:e2e` | Playwright |
| `pnpm lint` / `pnpm lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}` |
| `pnpm changeset` | Create release-notes entry |

Per-package: `pnpm --filter <name> <script>` — see `.pi/agent-docs/product/dev-processes.md`.
<!-- /sync-spec:dev-commands -->

<!-- sync-spec:monorepo-packages -->
**Monorepo packages:**

| Name | Path | Purpose |
|------|------|---------|
| `www` | `apps/www` | Next.js 16 admin host + demo (primary dev, port 3020) |
| `docs` | `apps/docs` | Astro docs site |
| `@vexcms/core` | `packages/core` | Framework-agnostic schema / fields / hooks / access control |
| `@vexcms/cli` | `packages/cli` | `vex dev`, codegen, Convex schema generation |
| `@vexcms/next` | `packages/next` | Next.js adapter (`NextAdminPage`, `NextAdminLayout`, route handlers) |
| `@vexcms/react` | `packages/react` | Framework-agnostic admin UI (shadcn + TanStack) |
| `@vexcms/better-auth` | `packages/better-auth` | Better Auth ↔ Convex adapter (`>=1.4.9 <1.5.0`) |
| `@vexcms/file-storage-convex` | `packages/file-storage-convex` | Convex file-storage adapter |
| `@vexcms/richtext-plate` | `packages/richtext-plate` | Plate richtext field |
| `create-vexcms` | `packages/create-vexcms` | `pnpm create vexcms` scaffolder |

Always pick a concrete package as the spec's **scope**. Cross-package changes must list each affected package and the dependency order.
<!-- /sync-spec:monorepo-packages -->

---

## When to use

Run `dev-spec` for any non-trivial feature, field type, adapter, or migration. Skip for typo fixes, config tweaks, or obvious one-liners.

---

> **Questions:** Use the `ask_user_question` tool for every question. Never write question lists as plain text.

## Spec interview

### Phase 1 — Scope

- What are we building? One line.
- Which workspace package is the **primary scope**? (e.g. `@vexcms/core`, `@vexcms/react`, `apps/www`)
- What other packages will this touch? List downstream consumers.
- Any packages or files this must **not** touch?
- Is there an existing spec in `.pi/agent-docs/specs/` (including `specs/archive/` from the pre-migration `agent-os/`)? Continuing or fresh?

### Phase 2 — Shape

- Inputs / outputs / side effects?
- New types, interfaces, field configs, Convex validators, auth hooks?
- Edge cases: empty states, missing default values, permission boundaries, schema drift, field-type registration timing, SSR vs client rendering.

### Phase 3 — Standards check

Read before finalizing:
1. `.pi/agent-docs/standards/developer-preferences.md` — apply every rule that fits, don't re-ask.
2. `.pi/agent-docs/standards/memory/` — JSDoc patterns and type-colocation rule.
3. `.pi/agent-docs/standards/adding-a-field-type.md` — when adding or modifying a field type.
4. `.pi/agent-docs/standards/global/`, `backend/`, `frontend/`, `testing/` — section matching the spec area.

### Phase 4 — References

List files to read before implementing: existing impl, types, `package.json#exports`, related Convex validators, ideaLog entries.

---

## Build order rule

Each step must leave the repo in a runnable state (`pnpm typecheck` clean).

Canonical order for vexcms:

1. **Types + field config / validator shape** in `@vexcms/core` (pure shape, no impl)
2. **Barrel + `package.json#exports`** updates so downstream packages see the new type
3. **Convex side** — validators, schema generation handling in `@vexcms/cli` if needed
4. **Data layer** — Convex functions / hooks / access checks, with `convex-test` coverage
5. **Business logic / adapter plumbing** (`@vexcms/next`, `@vexcms/better-auth`, etc.), with Vitest coverage
6. **UI** in `@vexcms/react` (Admin components) — TanStack Form integration, field renderer, shadcn components
7. **Wiring** in `apps/www` — mount page, verify in browser at `http://localhost:3020`

Never spec a UI component before its `@vexcms/core` field config / type exists.

---

## Spec output format

Create `.pi/agent-docs/specs/YYYY-MM-DD-HHMM-<feature-slug>/` with four files: `plan.md`, `shape.md`, `standards.md`, `references.md`. (Format per base template.)

### shape.md — TypeScript rules

- Full types, no `any`, no `as` casts (except documented narrow boundaries e.g. Convex `v.any()` payload — see developer-preferences)
- Field `types.ts` lives **colocated** with its `config.ts` — never consolidate field types into one file
- JSDoc on every exported interface / type / function per `standards/memory/feedback_jsdoc_patterns.md`
- Framework adapter components use the **framework prefix**, not `Vex`: `NextAdminPage` in `@vexcms/next`, not `VexAdminPage`
- Barrel exports in `src/index.ts` + `package.json#exports` — shape.md must list both

### Function body comment rule

When speccing function signatures in `shape.md`, the JSDoc comment is the source of truth for what a function does — do **not** repeat that in the body. Comments inside the function body are for **edge cases only**:

```ts
/**
 * Publishes a draft document and records it in version history.
 * Throws if the document has no draft snapshot or if the caller lacks publish permission.
 */
async function adminPublish(ctx, args) {
  // Edge: no draft snapshot means nothing to publish — throw before touching the DB
  // Edge: environmentId must match the document's environment when environments are enabled
}
```

Do NOT write comments like `// Get the document from the DB`, `// Check permissions`, or `// Return the result` — those describe the obvious flow and duplicate what the JSDoc already covers. Only call out non-obvious invariants, guards against tricky inputs, or behavior that differs from what a reader would expect.

### standards.md

List every rule from `developer-preferences.md` that applies. Note any one-off exceptions.

### references.md

- Files to read (existing impl, related field types)
- Convex / Better Auth / TanStack / Plate docs sections when APIs are unfamiliar
- Recent ideaLog entries in `.pi/agent-docs/implementation-log/`
- Legacy specs in `.pi/agent-docs/specs/archive/` when there's prior art

---

## Workflow tier behavior

Developer implements. Agent writes specs and reviews.

<!-- sync-spec:workflow-tier-detail -->
- Agent produces `plan.md` + `shape.md` + `standards.md` + `references.md`.
- Agent does **not** write the implementation. No edits to `packages/*/src/**` unless explicitly requested.
- After implementation, developer runs `/sync-spec` to extract patterns.
- Agent may write or edit: specs, docs (`apps/docs`), standards files, scripts in `scripts/`, and example configs in `apps/www` when part of an approved spec.
<!-- /sync-spec:workflow-tier-detail -->

---

## After presenting the spec

Ask:
> Does this spec look right? Anything to add, remove, or change before you start implementing?

On approval:
> Spec saved to `.pi/agent-docs/specs/YYYY-MM-DD-HHMM-<slug>/`. Run `/sync-spec` when you're done.

Do not begin implementation.

---

## Developer preferences

<!-- sync-spec:developer-preferences -->
Current standing rules (mirrored from `.pi/agent-docs/standards/developer-preferences.md` — read that file for full audit trail):

- **Package CSS defaults in `@layer base`**: Any `styles.css` shipped by a `@vexcms/*` package must put default CSS variable values inside `@layer base { :root { } }` (and `.dark {}` for dark mode). This ensures consuming app `:root {}` declarations always win without `!important`. *(sync-spec 23)*

- **Next.js adapter components use `Next*` prefix**, not `Vex*`. `Vex*` is reserved for framework-agnostic APIs in `@vexcms/core` / `@vexcms/react`.
- **Convex mutation payload arg is `data`, not `fields`.** "Fields" refers to field definitions in the collection config, never to DB payload.
- **Convex mutation payload uses `v.any()`**, not a typed record. Schema correctness enforced at codegen time by `@vexcms/cli`.
- **Context + hook collocated in `hooks/` as a single file.** E.g. `hooks/useFrameworkComponents.ts` exports both the context and its hook — never split across `components/` + `hooks/`.
- **Catch-all route segment is `[[...slug]]`**, not the feature name. Directory: `[[...slug]]/page.tsx`.
- **Field `types.ts` colocated with `config.ts`** — never consolidate field types.
- **Type generation support files go in `src/types/`**, not `src/` root. E.g. `generated.ts` (module augmentation interface) lives in `packages/core/src/types/` alongside `generateVexTypes.ts`, re-exported via `types/index.ts`.
- **JSDoc patterns** — see `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md`: full interface docs, per-property docs, defaults block, `@example` on public APIs.
<!-- /sync-spec:developer-preferences -->

---

→ see `.pi/agent-docs/standards/developer-preferences.md` for the full audit trail
→ see `.pi/agent-docs/product/dev-processes.md` for all dev commands
→ see `.pi/agent-docs/standards/debug-hierarchy.md` for debug order
