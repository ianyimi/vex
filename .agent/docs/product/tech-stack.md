---
verified_at: 3a18c95eb3bed73e6c218a32a587d4cf36ce9d7a
---

# Tech Stack

## Language + Runtime
- Language: TypeScript 6.0 (strict; catalog `^6.0.0`, installed 6.0.3)
- Runtime: Node.js >= 20
- Package manager: pnpm 10.30.2 (`packageManager` field)

## Repo Structure
- Type: monorepo (Turborepo + pnpm workspaces, catalog-pinned deps in `pnpm-workspace.yaml`)
- Worktree layout: bare git repo at `vex.git/`, working branch `rebuild` checked out at `dev/`

### Workspace Packages

| Name | Path | Purpose |
|------|------|---------|
| `www` | `apps/www` | Next.js 16 demo + admin host app (primary dev target, port **3020**) |
| `docs` | `apps/docs` | Astro 6 + Starlight docs site (port 4321) |
| `@vexcms/core` | `packages/core` | Framework-agnostic schema, field system, hooks, config (`defineCollection`, `defineConfig`) |
| `@vexcms/cli` | `packages/cli` | `vex dev` / codegen / Convex schema generation |
| `@vexcms/next` | `packages/next` | Next.js adapter — `NextAdminPage`, `NextAdminLayout`, route handlers |
| `@vexcms/react` | `packages/react` | Framework-agnostic admin UI (Base UI + TanStack Form/Table) |
| `@vexcms/better-auth` | `packages/better-auth` | Better Auth <-> Convex adapter (peer: catalog `^1.5.0`) |
| `@vexcms/file-storage-convex` | `packages/file-storage-convex` | Convex file-storage adapter |
| `@vexcms/richtext-plate` | `packages/richtext-plate` | Plate-based richtext field |
| `create-vexcms` | `packages/create-vexcms` | `pnpm create vexcms` scaffolder |
| `@vexcms/tsconfig` | `packages/tsconfig` | Shared tsconfig base |

Root tooling lives in `package.json` / `turbo.json` / `eslint.config.mjs`.

## Core Libraries

| Library | Purpose |
|---------|---------|
| Next.js 16 | Admin host framework (App Router, React 19) |
| React 19 | UI runtime (React Compiler via babel plugin) |
| Convex (`^1.39.1`, pnpm override) | Real-time DB, serverless functions, file storage |
| Better Auth `^1.5.0` (+ `@convex-dev/better-auth`) | Auth (OAuth, sessions) |
| TanStack Query (+ `@convex-dev/react-query`) | Server state with Convex subscriptions |
| TanStack Form | Form state in admin |
| TanStack Table | Admin data tables |
| Tailwind CSS 4 | Styling |
| Base UI (`@base-ui/react`) + shadcn CLI + `lucide-react` | Component primitives |
| nuqs | URL query state |
| Plate 52 (`@vexcms/richtext-plate`) | Richtext editor |
| Zod 4 | Input validation / field input schemas |
| Astro 6 + Starlight (+ starlight-typedoc) | Docs site (`apps/docs`) |

## Dev Tooling

| Tool | Purpose |
|------|---------|
| Turborepo 2 | Task orchestration (build, dev, test, typecheck, coverage, test:e2e, clean) |
| tsup | Library bundling (all `@vexcms/*` packages) |
| Vitest 4 + `@vitest/coverage-v8` | Unit/integration tests |
| `convex-test` | In-memory Convex for tests |
| `@testing-library/react` + jsdom | Component tests |
| Playwright | E2E tests (`test:e2e`) |
| ESLint 9 flat config (`@typescript-eslint`, jsdoc, perfectionist, import-x, react-hooks, convex) | Linting |
| Prettier | Formatting |
| Changesets | Versioning + release notes |
| TypeDoc + starlight-typedoc | API reference generation |
