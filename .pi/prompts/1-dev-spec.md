---
name: 1-dev-spec
description: Write a scoped implementation spec for vexcms. Produces spec.md (and optional design-walkthrough.md) under .pi/agent-docs/specs/.
invoke: "dev-spec"
---

# Dev Spec — vexcms

Tight checklist + pointers. Detail lives in standards files; read them when
you hit the relevant phase. **If you're feeling like the spec is getting
unstructured or repeating yourself, you're in the wrong file — read
`.pi/agent-docs/standards/spec-structure.md`.**

## Project context

**Project:** vexcms (Vex CMS — Convex-native headless CMS)
**Stack:** TypeScript · Turborepo + pnpm · Next.js 16 · React 19 · Convex · Better Auth · Tailwind 4 · shadcn/ui · TanStack Query/Form/Table · Vitest · Playwright · Plate richtext
**Workflow tier:** **High-care** — developer implements all production code.
Agent writes specs, reviews, and points out issues. Never write core logic
unilaterally. No edits to `packages/*/src/**` unless explicitly approved.

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
<!-- /sync-spec:monorepo-packages -->

Always pick a concrete package as the spec's **scope**. Cross-package
changes must list each affected package and their dependency order.

---

## When to use

Run `dev-spec` for any non-trivial feature, field type, adapter, or
migration. Skip for typo fixes, config tweaks, or obvious one-liners.

> **Questions:** Use the `ask_user_question` tool for every question. Never
> write question lists as plain text.

---

## Phase 1 — Scope (interview)

Ask via `ask_user_question`:

- What are we building? One line.
- Which workspace package is the **primary scope**?
- What other packages will this touch? Downstream consumers?
- Any packages or files this must **not** touch?
- Existing spec in `.pi/agent-docs/specs/` (continuing) or fresh?

## Phase 2 — Shape (interview)

- Inputs / outputs / side effects?
- New types, interfaces, field configs, Convex validators, auth hooks?
- Edge cases: empty states, missing default values, permission boundaries,
  schema drift, field-type registration timing, SSR vs client rendering.

## Phase 3 — Standards check (read what's relevant)

Read before drafting. Don't re-ask the user about anything in these:

| When you're working on…                       | Read                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Spec structure, layout, ordering, decisions    | [`standards/spec-structure.md`](../agent-docs/standards/spec-structure.md) — **read every time** |
| Writing JSDoc in code samples                  | [`standards/jsdoc-conventions.md`](../agent-docs/standards/jsdoc-conventions.md) — **read every time you write JSDoc** |
| Catalog deps, package architecture, conditions | [`standards/developer-preferences.md`](../agent-docs/standards/developer-preferences.md)        |
| Adding/modifying a field type                  | [`standards/adding-a-field-type.md`](../agent-docs/standards/adding-a-field-type.md)            |
| Backend / data layer / Convex                  | `standards/backend/`                                                                           |
| Frontend / React UI                            | `standards/frontend/`                                                                          |
| Tests                                          | `standards/testing/test-writing.md` + `standards/testing/unit-tests.md`                        |
| Debug / known fragile areas                    | `standards/debug-hierarchy.md`                                                                 |
| Recurring memory items (JSDoc, type colocation)| `standards/memory/`                                                                            |

## Phase 4 — References

List files to read before implementing: existing impl, types,
`package.json#exports`, related Convex validators, ideaLog entries.

---

## Build order rule

Each step must leave the repo in a runnable state (`pnpm typecheck` clean).

Canonical order for vexcms:

1. **Types + field config / validator shape** in `@vexcms/core` (pure shape, no impl)
2. **Barrel + `package.json#exports`** updates so downstream packages see the new type
3. **Convex side** — validators, schema generation handling in `@vexcms/cli` if needed
4. **Data layer** — Convex functions / hooks / access checks, with `convex-test` coverage
5. **Business logic / adapter plumbing** (`@vexcms/next`, `@vexcms/better-auth`, etc.)
6. **UI** in `@vexcms/react` (Admin components) — TanStack Form, field renderer, shadcn
7. **Wiring** in `apps/www` — mount page, verify in browser at `http://localhost:3020`

Never spec a UI component before its `@vexcms/core` field config / type exists.

---

## Spec output

**Path:** `.pi/agent-docs/specs/NN-<feature-slug>.md` (single file) or
`.pi/agent-docs/specs/NN-<feature-slug>/spec.md` (directory). Match the
existing numbering convention. Use the directory format whenever the spec
touches public API surface (needs a companion `design-walkthrough.md`) or
otherwise needs more than one deliverable file.

**Required sections, layout, file ordering, test colocation, decisions
discipline:** see `standards/spec-structure.md`. **Read it once before
drafting; re-read it if the spec starts feeling unstructured.**

**JSDoc rules in code samples:** see `standards/jsdoc-conventions.md`.
**Read it every time you write JSDoc — common errors are documented with
their fix.**

### Quick checklist (the prompt is too thin to be the source of truth — confirm against the standards files):

- [ ] Status line + Overview paragraph
- [ ] Code Effect Preview (3–5 before/after diffs of the most consequential changes)
- [ ] API Surface table (for public-API specs)
- [ ] Design Decisions — **one-line table**, not prose. Detail goes in walkthrough.
- [ ] Out of Scope with cross-references
- [ ] Target Directory Structure with status markers
- [ ] Implementation Order (numbered, each step independently runnable)
- [ ] Per-step content — files in **dependency order**, tests **colocated**
      after their implementation file. Not pooled at end.
- [ ] Verification commands
- [ ] Success Criteria as compile/runtime/type-narrowing assertions
- [ ] References

For public-API specs, also:
- [ ] Companion `design-walkthrough.md` showing end-to-end consumer code
- [ ] Decisions Reference section in walkthrough (full prose)

## Design walkthrough companion (when required)

Required when the spec touches public API surface. Lives at
`.pi/agent-docs/specs/NN-feature/design-walkthrough.md`. Sections, layout,
canonical example: see `standards/spec-structure.md` § *Design walkthrough
companion*.

**General principle:** Show the working code before writing the
implementation. A document that demonstrates what the consumer will write,
with annotations explaining non-obvious behavior, surfaces API ergonomic
issues that pure shape/type definitions miss. Apply this principle to any
new public surface, not just spec.md — new prompts/skills, new packages,
new field types.

---

## Workflow tier behavior

<!-- sync-spec:workflow-tier-detail -->
- Agent produces the spec file (`spec.md` or `NN-feature.md`) and, when the
  spec touches public API surface, the companion `design-walkthrough.md`.
- Agent does **not** write the implementation. No edits to
  `packages/*/src/**` unless explicitly requested.
- After implementation, developer runs `/sync-spec` (or the agent recognises
  end-of-session intent and the `sync-spec` skill auto-fires) to extract
  patterns.
- Agent may write or edit: specs, design walkthroughs, docs (`apps/docs`),
  standards files, scripts in `scripts/`, and example configs in `apps/www`
  when part of an approved spec.
<!-- /sync-spec:workflow-tier-detail -->

---

## After presenting the spec

Ask via `ask_user_question` (never plain text):
> Does this spec look right? Anything to add, remove, or change before you start implementing?

If this was a public-API spec, the question must also confirm the companion
`design-walkthrough.md` is approved — don't approve `spec.md` in isolation
when there's a walkthrough alongside.

On approval:
> Spec saved to `.pi/agent-docs/specs/<NN-slug>/`. Run `/sync-spec` when you're done — or just say "let's sync" / "wrap this up" / equivalent and the `sync-spec` skill will auto-fire.

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
- **JSDoc patterns** — see `.pi/agent-docs/standards/jsdoc-conventions.md` (lint-rule-grounded reference) and `.pi/agent-docs/standards/memory/feedback_jsdoc_patterns.md` (higher-level Input vs resolved type guidance).
- **Re-export every core config function from framework packages.** Users `import { defineCollection, relationship, text, … } from "@vexcms/next"` (or `"@vexcms/react"` for non-Next React apps). `@vexcms/react/src/index.ts` binds `F = ReactHKT` and re-exports every config function from `@vexcms/core`; `@vexcms/next/src/index.ts` transitively re-exports those. Even fields without component slots get a pass-through wrapper. *(sync-spec, 2026-05-04)*
- **User-supplied component slots in core use `ApplyComponent<F, Props>`, not `ComponentType<P>`.** Any field/collection config slot that accepts a component override (e.g., `admin.components.preview`) is typed via the existing HKT machinery in `packages/core/src/fields/baseTypes.ts`: declare it as `preview?: ApplyComponent<F, MyProps>` with `F extends ComponentHKT = ComponentHKT` defaulting unspecialized. The framework adapter binds `F = ReactHKT` at re-export time. **Core never imports from `react`** — not even type-only. *(sync-spec, 2026-05-04)*
- **Workspace package tsconfigs need `customConditions: ["source"]`.** Any `packages/*/tsconfig.json` that imports from a sibling (`@vexcms/core`, `@vexcms/react`) must include this flag. Without it, package-internal LSP and `pnpm typecheck` follow standard module resolution to `package.json#exports.types`, which may not exist during dev (e.g., when sibling has `dts: false` in tsup). Symptom: imported types silently widen, errors like *Property `X` does not exist on `<SiblingType>`* fire on properties that exist in source. *(sync-spec, 2026-05-04)*
- **Peer-only deps mirror in devDependencies for typecheck.** If a workspace package's source imports from a peer dep (`@tanstack/react-query`, `@convex-dev/react-query`, `convex`, etc.), that dep must also be in `devDependencies`. peerDependencies don't get pnpm-symlinked into the package's `node_modules`. Use `"<dep>": "catalog:"`. *(sync-spec, 2026-05-04)*
- **All `dependencies` and `devDependencies` use `"catalog:"`; never literal versions in package.json.** Adding a dep is a two-step move: add to `pnpm-workspace.yaml#catalog` with the right pin style, then reference as `"catalog:"` in the consuming package.json. peerDependencies are the only place literal ranges live, and only when intentionally wider than the catalog version. *(sync-spec, 2026-05-04)*
- **Field-type-constrained config: pick the right mechanism by call-site locality.** For field-typed constraints (e.g., "this option must be a relationship field key", "this must be a text field key"), use **deep generics + conditional types** when the constraint and the field definitions live in the SAME call (`useAsTitle`, `defaultSort`, `searchableFields` on `defineCollection`). Use **augmented-module codegen** when the constraint references a collection by slug from elsewhere in the codebase (`vex.list(slug, { populate })`, target-collection preview lookups, RBAC predicates against `Doc<TSlug>`). The codegen augments the single `GeneratedVexTypes` interface in core with properties (`CollectionSlug`, `DocumentBySlug`, `CollectionsFieldTypeMap`, etc.); per-field-type helpers (`RelationshipKeysOf<TSlug>`, `TextKeysOf<TSlug>`, etc.) read `CollectionsFieldTypeMap`. **Never introduce parallel augmentation interfaces** (`GeneratedFieldTypeMap`, `GeneratedRelationshipMap`) — they fragment the registry. One interface, multiple properties. Both mechanisms compose; they're not interchangeable. *(sync-spec, 2026-05-04)*
- **Catalog pin style: `^X.Y.Z` for reputable infrastructure, exact `X.Y.Z` for niche/single-purpose deps.** Caret for React/Next/Convex/TanStack/Better Auth/Zod/ESLint/TypeScript/testing/Plate/Tailwind/Astro — security updates valuable. Exact pin for small one-feature packages (icons, dnd, color picker, command palette, animation lib, niche hooks, scaffolder utilities) where supply-chain risk outweighs minor-bump value. When in doubt, lock it. Full rationale in `pnpm-workspace.yaml` header comment. *(sync-spec, 2026-05-04)*
<!-- /sync-spec:developer-preferences -->

---

→ see `.pi/agent-docs/standards/spec-structure.md` for spec layout details
→ see `.pi/agent-docs/standards/jsdoc-conventions.md` for JSDoc rules
→ see `.pi/agent-docs/standards/developer-preferences.md` for the full audit trail
→ see `.pi/agent-docs/product/dev-processes.md` for all dev commands
→ see `.pi/agent-docs/standards/debug-hierarchy.md` for debug order
