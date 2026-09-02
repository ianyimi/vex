# Tech Stack

## Language + Runtime
- Language: TypeScript (strict)
- Runtime: Node.js ≥ 20
- Package manager: pnpm 10.30.2 (via `packageManager` field)

## Repo Structure
- Type: monorepo
- Monorepo tool: Turborepo + pnpm workspaces

### Workspace Packages

| Name | Path | Purpose |
|------|------|---------|
| `www` | `apps/www` | Next.js 16 demo + admin host app (primary dev target, port **3020**) |
| `docs` | `apps/docs` | Astro docs site (port 4321) |
| `@vexcms/core` | `packages/core` | Framework-agnostic schema, field system, hooks, access control |
| `@vexcms/cli` | `packages/cli` | `vex dev` / codegen / Convex schema generation |
| `@vexcms/next` | `packages/next` | Next.js adapter — `NextAdminPage`, `NextAdminLayout`, route handlers |
| `@vexcms/react` | `packages/react` | Framework-agnostic admin UI (shadcn/ui + TanStack Form/Table) |
| `@vexcms/better-auth` | `packages/better-auth` | Better Auth ↔ Convex adapter (pinned `>=1.4.9 <1.5.0`) |
| `@vexcms/file-storage-convex` | `packages/file-storage-convex` | Convex file-storage adapter |
| `@vexcms/richtext-plate` | `packages/richtext-plate` | Plate-based richtext field |
| `create-vexcms` | `packages/create-vexcms` | `pnpm create vexcms` scaffolder |
| `@vexcms/tsconfig` | `packages/tsconfig` | Shared tsconfig base |

Root tooling lives in `package.json` / `turbo.json` / `eslint.config.mjs`.

## Core Libraries

| Library | Purpose |
|---------|---------|
| Next.js 16 | Admin host framework (App Router, React 19) |
| React 19 | UI runtime |
| Convex | Real-time DB, serverless functions, file storage |
| Better Auth | Auth (OAuth, sessions) |
| TanStack Query (+ `@convex-dev/react-query`) | Server state with Convex subscriptions |
| TanStack Form | Form state in admin |
| TanStack Table | Admin data tables |
| Tailwind CSS 4 | Styling |
| shadcn/ui + `lucide-react` | Component primitives |
| nuqs | URL query state |
| Plate (`@vexcms/richtext-plate`) | Richtext editor |
| Astro | Docs site (`apps/docs`) |

## Dev Tooling

| Tool | Purpose |
|------|---------|
| Turborepo | Task orchestration across workspace |
| tsup | Library bundling (all `@vexcms/*` packages) |
| Vitest 4 + `@vitest/coverage-v8` | Unit/integration tests |
| `convex-test` | In-memory Convex for tests |
| `@testing-library/react` + jsdom | Component tests |
| Playwright | E2E tests (`test:e2e`) |
| ESLint 9 (flat config) + `@typescript-eslint` + `eslint-plugin-jsdoc` | Linting |
| Prettier (catalog) | Formatting |
| Changesets | Versioning + release notes |
| TypeScript 5.9 | Typecheck |

## Workflow Tier

- **Tier:** high-care
- **Rule:** Developer implements all production code. Agent writes specs, reviews diffs, points out issues, and only edits code when explicitly asked. Never writes core logic unilaterally.

This is a public OSS CMS with real users, changesets, and a test suite — treat every PR as shippable.
