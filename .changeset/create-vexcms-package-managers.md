---
"create-vexcms": patch
---

Scaffolds now install and run with npm, pnpm, yarn and bun, and with Deno on a best-effort
basis. Before this, only pnpm worked on alpha.41: npm stopped on a `better-call` peer conflict
(`ERESOLVE`), pnpm 11+ ignored the template's `package.json#pnpm` settings and stopped on
blocked build scripts, yarn 4 refused the day-old `@vexcms/*` release and installed Plug'n'Play,
yarn left `better-auth-ui`'s peers uninstalled, and Deno got an invalid `"packageManager": "npm@?"`.

- The project is set up for the package manager that ran `create-vexcms`, detected from
  `npm_config_user_agent` (Deno from its runtime); `--use-npm`, `--use-pnpm`, `--use-yarn`,
  `--use-bun` and `--use-deno` choose another. `--monorepo` implies pnpm.
- `README.md`, `vex:update` and the next steps the CLI prints at the end use that manager's
  commands (`npm run dev`, `pnpm convex …`, `bunx convex …`, `deno task dev`, …).
- `packageManager` is written only when the manager reported an exact version, never for Deno.
- Version pins live where each manager reads them: `pnpm-workspace.yaml` (with the build
  allowlist and peer rules) for pnpm, `resolutions` for yarn, `overrides` for npm, bun and Deno.
- yarn gets a `.yarnrc.yml` with `nodeLinker: node-modules` and `@vexcms/*` exempt from yarn 4's
  one-day release-age gate; Deno gets a `deno.json` exempting `@vexcms/*` from Deno 2.9's.
- The base template declares `@daveyplate/better-auth-ui`'s peers and `@better-auth/core`/
  `better-call` directly, and pins the `@typescript-eslint/*` family, so every manager resolves
  the same tree and `lint` passes.
- marketing-site: `src/lib/metadata.ts` no longer casts pages to `Record<string, unknown>[]`,
  which stopped `build` from compiling once `vex dev` had regenerated `src/vex.types.ts`.
- marketing-site: the hero's install command gets a package-manager select joined to its left;
  the command and the copy button follow the choice, the row never resizes, and the copy icon
  is visible on the dark code surface.
