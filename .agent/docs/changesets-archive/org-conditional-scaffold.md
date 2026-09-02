---
"create-vexcms": patch
---

Fix the default (`--orgs` declined) scaffold, which failed `pnpm build` — the installer stripped
the organization plugin but ten checked-in template files still referenced `organization`
unconditionally. `configureOrganizations(false)` now also strips organization wiring down to the
org-free shape (`convex/vex.ts`, `convex/vex/globals.ts`, `convex/vex/media.ts`,
`convex/auth/api.ts`, `src/auth/access.ts`, `src/context/AuthContext.tsx`,
`src/auth/hasPermission.ts`, `src/db/constants/index.ts`, and `src/vexcms/api.ts` for full
scaffolds) instead of leaving them referencing a table that no longer exists once the first
`vex dev` regen drops the organization tables from the generated registry. Every transform throws
loudly when its expected pattern is missing, instead of silently no-opping on template drift.
`--orgs` accepted scaffolds are untouched.

Also: the `base-nextjs` template's `convex/tsconfig.json` drops the deprecated `baseUrl` and adds
`types: ["node"]` (the relocated `convex/auth/options.ts` reads `process.env`) and
`../src/vex.types.ts` to `include`, so the convex program actually sees the generated
`vex.types.ts` module augmentation instead of typing `settings`/`user` as `{}`/`unknown`.
`README.md`'s (and the root `create-vexcms` README's, and the docs quickstart guide's) stand-up
sequence now documents `npx convex env set SITE_URL ...` / `npx convex env set
BETTER_AUTH_SECRET ...` — Better Auth runs inside the Convex deployment and never reads
`.env.local`, and omitting this step is the most common cause of a `403` on first sign-in.

Also drops the unused `motion` dependency from the `base-nextjs` template.
