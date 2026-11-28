# create-vexcms

> [!WARNING]
> `create-vexcms` is pre-release software, published only under the `alpha` npm
> dist-tag (`0.1.0-alpha.x`) — the `latest` tag on npm still points at an old,
> unrelated `0.0.20` line, so always scaffold with an explicit tag:
> `pnpm create vexcms@alpha`. Use it for experiments and evaluation only; the
> projects it scaffolds should not carry production traffic or real user data.
> Breaking changes land between alpha releases without deprecation cycles, and
> there is no migration path between alphas. See the
> [roadmap](https://docs.vexcms.dev) for what is and is not shipped.

Scaffolding CLI for [VexCMS](https://github.com/ianyimi/vex) projects. Creates a complete
Next.js application with a Convex backend, Better Auth authentication, and a self-hosted admin
panel — ready to run.

## Usage

Run it with the package manager you want the project set up for. npm, pnpm, yarn 4 and bun are
supported; Deno 2.6+ and yarn 1 work on a best-effort basis. Node.js 22 or newer.

<details open>
<summary>npm</summary>

```bash
npm create vexcms@alpha my-project
# flags go after `--`
npm create vexcms@alpha my-project -- --bare
```

</details>

<details>
<summary>pnpm</summary>

```bash
pnpm create vexcms@alpha my-project
pnpm create vexcms@alpha my-project --bare
```

</details>

<details>
<summary>yarn</summary>

```bash
yarn create vexcms@alpha my-project
yarn create vexcms@alpha my-project --bare
```

Yarn 1 can't run a tagged `create` package (it looks for a binary named `create-vexcms@alpha`);
on yarn 1 run `npx create-vexcms@alpha my-project --use-yarn`.

</details>

<details>
<summary>bun</summary>

```bash
bun create vexcms@alpha my-project
bun create vexcms@alpha my-project --bare
```

</details>

<details>
<summary>deno</summary>

```bash
deno run -A npm:create-vexcms@alpha my-project
deno run -A npm:create-vexcms@alpha my-project --bare
```

</details>

Leave out the name to be asked for it. Relative paths work too, including scaffolding straight
into a monorepo app directory (`apps/website`).

The project is set up for the package manager that ran the command:

| Manager | What the scaffold gets |
|---------|------------------------|
| all | `packageManager` field (when the manager reported its version; never for Deno), `vex:update` and every README command in that manager's syntax, next steps printed in it |
| npm, bun, deno | version pins in `overrides` |
| pnpm | version pins, build allowlist and peer rules in `pnpm-workspace.yaml` (pnpm 11+ no longer reads `package.json#pnpm`) |
| yarn | version pins in `resolutions`; `.yarnrc.yml` with `nodeLinker: node-modules` (Next.js and the Convex CLI don't run under Plug'n'Play) and `@vexcms/*` exempt from yarn 4's one-day release-age gate |
| deno | `deno.json` exempting `@vexcms/*` from Deno 2.9's one-day release-age gate |

## Flags

| Flag | Description |
|------|-------------|
| `--bare` | Skip the marketing-site overlay. Scaffolds `base-nextjs` alone — auth, admin panel, media, and no starter collections. |
| `--orgs` | Enable multi-tenant organizations (adds the Better Auth organizations plugin). |
| `--monorepo` | Scaffold into `apps/<name>` under the nearest ancestor `pnpm-workspace.yaml` instead of a standalone project. Rewrites `@vexcms/*` dependencies to `workspace:*` and any dependency present in the host workspace's catalog to `catalog:`; every other dependency stays a literal version. Skips `git init` and dependency install — the root workspace owns both. Implies pnpm. |
| `--yes` | Accept every interactive prompt's default (bare: no, orgs: no, port: `3010`, no OAuth providers, git init: yes, install: no) — no prompts at all. |
| `--use-npm`, `--use-pnpm`, `--use-yarn`, `--use-bun`, `--use-deno` | Set the project up for that package manager instead of the one that ran the command. At most one. |

```bash
# Empty project, no pre-built collections
pnpm create vexcms@alpha my-app --bare

# Project with multi-tenant organizations
pnpm create vexcms@alpha my-app --orgs

# Non-interactive, defaults only
pnpm create vexcms@alpha my-app --yes

# Inside a pnpm workspace, catalog-aware
pnpm create vexcms@alpha my-app --monorepo --yes

# Run with npm, set up for bun
npm create vexcms@alpha my-app -- --use-bun
```

## Interactive prompts

Skipped entirely by `--yes` (each falls back to its default); otherwise the CLI walks you
through:

1. **Project name** — validates npm package name rules; `.` scaffolds into the current directory
2. **Framework** — Next.js (TanStack Start is not yet implemented)
3. **Dev server port** — default `3010`
4. **Email/password auth** — enable or disable (default: yes)
5. **Organizations** — multi-tenant support (default: no; skipped if `--orgs` was passed)
6. **OAuth providers** — multi-select from Better Auth's supported providers
7. **Git repository** — run `git init` (default: yes; skipped under `--monorepo`)
8. **Install dependencies** — run the package manager install (default: no; skipped under `--monorepo`)

## Templates

### `base-nextjs`

The foundation every scaffold starts from — used alone when `--bare` is passed:

- Better Auth wired through `@vexcms/better-auth`, with email/password and any selected OAuth
  providers
- Admin panel mounted at `/admin` via `@vexcms/next`
- Media collection backed by `@vexcms/file-storage-convex`
- Users collection merged from the auth adapter
- First-admin bootstrap: the first account created anywhere in the project is auto-promoted to
  admin (`convex/vex/firstUser.ts`); until then, the home route renders a `WelcomePage` prompting
  sign-up instead of a `404`
- No pages, blocks, themes, or site content — `vex.config.ts` ships an empty `collections: []`
  overlay slot

### `marketing-site` (default)

An overlay applied over `base-nextjs` with file-level overwrite, adding a complete marketing
site:

- Collections: `pages`, `headers`, `footers`, `themes` (with a `themeColors` sub-shape)
- Global: `siteSettings` (active theme, admin theme, site name)
- 8 content blocks (`blocks/<Name>/{config.ts,index.tsx}`) rendered anywhere via `RenderBlocks`
  from `@vexcms/react` — no hand-rolled block-type switch
- Theme system: database-driven CSS custom properties (`ThemeStyle` for first paint,
  `ThemeLive` for live updates), seeded with four starter palettes
- `convex/seed.ts` — an idempotent `init` mutation seeding site settings, a header, a footer, the
  starter palettes, and a complete home page from the blocks' own defaults (`pnpm seed`)

### Configuration

Every scaffold ships two config files: `src/vex.config.ts` — client-safe, holds collections,
globals, media collections, access rules, and the auth collections
`betterAuthCollections(authSchema)` derives from `src/auth/schema.ts` — and
`src/vex.config.server.ts`, which layers the Better Auth adapter and the storage adapter(s)
onto it via `defineServerConfig`. Nothing is generated for auth: `src/auth/schema.ts` is the
one source of truth for model names and fields (organizations on or off, per the `--orgs`
flag) — the client config calls `betterAuthCollections()` on it directly, and
`src/auth/options.ts` spreads it into the real Better Auth options.

## Getting started

The CLI prints the next steps when it finishes, and the scaffolded `README.md` walks through
them; both use the package manager the project was set up for. In order:

1. Install dependencies, if you declined the install prompt.
2. `convex dev --once` through your package manager (`npx convex`, `pnpm convex`,
   `yarn convex`, `bunx convex`, `deno x convex`): creates or links a Convex project and writes
   its URLs and `CONVEX_DEPLOYMENT` into `.env.local`, replacing the placeholders.
3. `convex env set SITE_URL http://localhost:3010` and `convex env set BETTER_AUTH_SECRET <the
   value from .env.local>`, the same way. Better Auth runs inside the Convex deployment and never
   reads `.env.local`; skipping this is the most common cause of a `403` on the first sign-in.
4. Run the `vex:dev` script and the `dev` script in two terminals. On the marketing-site
   starter, run the `seed` script once while `vex:dev` runs.
5. Open `http://localhost:3010` (or your chosen port) and sign up. The first account is
   promoted to admin and redirected into `/admin`.

Every command for every package manager is in the
[quickstart](https://docs.vexcms.dev/guides/quickstart/).

### Available scripts

| Script | Description |
|--------|-------------|
| `dev` | Start the Next.js dev server |
| `vex:dev` | Start the `vex` schema watcher and `convex dev` |
| `build` / `start` | Production build / serve it |
| `typecheck` | Type-check the project |
| `lint` / `format` | ESLint / Prettier |
| `seed` | Run the marketing-site seed mutation (marketing-site only) |
| `secret:create` | Generate a random 32-character secret and copy it to the clipboard |
| `vex:update` | Update every `@vexcms/*` package |
| `vex:deploy` | Generate schema/types and deploy to Convex production |

## Monorepo mode (`--monorepo`)

Run from inside an existing pnpm workspace to scaffold a new app under it instead of a
standalone project:

```bash
pnpm create vexcms@alpha my-app --monorepo --yes
```

The installer walks up from the current directory for the nearest `pnpm-workspace.yaml`, targets
`apps/my-app`, rewrites every `@vexcms/*` dependency to `workspace:*` and any dependency also
present in the host workspace's catalog to `catalog:` (other dependencies keep literal
versions), and skips both `git init` and dependency install — the root workspace owns them.

## Deployment

See the [deployment guide](https://docs.vexcms.dev/guides/deployment/) — Convex production via
the `vex:deploy` script, then a Vercel production deploy whose build command runs `vex:deploy`
with `--cmd '<your build command>'` (for example `pnpm vex:deploy --cmd 'pnpm build'`).

## Telemetry

`create-vexcms` sends one anonymous event per run (template, options, ok or failed), the same
opt-out telemetry the `vex` CLI uses. Disable it with `DO_NOT_TRACK=1`,
`VEX_TELEMETRY_DISABLED=1`, or `vex telemetry disable` inside a scaffolded project; it is
always off in CI. Every field sent is listed in the
[Telemetry guide](https://docs.vexcms.dev/guides/telemetry/).

## Versioning

`create-vexcms` is versioned alongside every `@vexcms/*` package. Running
`pnpm create vexcms@alpha` always scaffolds with the newest pre-release. The npm
`latest` tag still points at an old, unrelated `0.0.20` line, so `@alpha` — or an
exact version — is the only way to get the current API:

```bash
pnpm create vexcms@0.1.0-alpha.10
```

The scaffolded project's `@vexcms/*` dependencies match the version of `create-vexcms` used to
generate it.

## License

Apache-2.0
