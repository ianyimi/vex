---
applies_to: ["pnpm-workspace.yaml", "packages/*/package.json", "apps/*/package.json", "packages/tsconfig/**"]
---
# Workspace Packaging

- **Catalog discipline:** ALL `dependencies`/`devDependencies` use `"catalog:"` resolving
  through `pnpm-workspace.yaml#catalog`. Literal versions in package.json are forbidden.
  Adding a dep = (1) catalog entry, (2) `"<dep>": "catalog:"` reference. Only
  `peerDependencies` may be literal, when intentionally wider (`react: ">=18.0.0"`).
- **Pin style:** caret `^X.Y.Z` for reputable infrastructure (React, Next, Convex,
  TanStack, Better Auth, Zod, TS, ESLint, Tailwind, Plate, testing). Exact `X.Y.Z` for
  small/niche single-purpose deps (chalk 5.3.0, cmdk 1.1.1, lucide-react 0.577.0,
  @hello-pangea/dnd 18.0.1) — supply-chain risk outweighs upgrade benefit.
- **customConditions ["source"]:** set in `packages/tsconfig/base.json:6` and inherited by
  every package that imports siblings. Without it TS resolves to `exports.types` →
  `./dist/index.d.ts` which may not exist during dev → silent type widening. Package
  `exports` include a `"source": "./src/index.ts"` condition alongside types/import.
- **Peer mirror rule:** any peer dep whose TYPES are imported by package source must also
  appear in that package's `devDependencies` (as `"catalog:"`) — peers alone aren't
  symlinked during local dev, so LSP + `pnpm --filter <pkg> typecheck` fail without it
  (`packages/core/package.json` mirrors convex, @tanstack/react-query, @convex-dev/react-query).
- **Library peer ranges bound OUR peer ranges:** reject any dependency of a published
  package whose React peer is narrower than `>=18.0.0` (e.g. @mantine/hooks pinning ^19.2)
  — the constraint is what users' host apps see, not what the dev catalog runs.
