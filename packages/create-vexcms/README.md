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

```bash
pnpm create vexcms@alpha
```

Or with a project name:

```bash
pnpm create vexcms@alpha my-project
```

Supports relative paths, including scaffolding straight into a monorepo app directory:

```bash
pnpm create vexcms@alpha apps/website
```

## Flags

| Flag | Description |
|------|-------------|
| `--bare` | Skip the marketing-site overlay. Scaffolds `base-nextjs` alone — auth, admin panel, media, and no starter collections. |
| `--orgs` | Enable multi-tenant organizations (adds the Better Auth organizations plugin). |
| `--monorepo` | Scaffold into `apps/<name>` under the nearest ancestor `pnpm-workspace.yaml` instead of a standalone project. Rewrites `@vexcms/*` dependencies to `workspace:*` and any dependency present in the host workspace's catalog to `catalog:`; every other dependency stays a literal version. Skips `git init` and dependency install — the root workspace owns both. |
| `--yes` | Accept every interactive prompt's default (bare: no, orgs: no, port: `3010`, no OAuth providers, git init: yes, install: no) — no prompts at all. |

```bash
# Empty project, no pre-built collections
pnpm create vexcms@alpha my-app --bare

# Project with multi-tenant organizations
pnpm create vexcms@alpha my-app --orgs

# Non-interactive, defaults only
pnpm create vexcms@alpha my-app --yes

# Inside a pnpm workspace, catalog-aware
pnpm create vexcms@alpha my-app --monorepo --yes
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

## Getting started

After scaffolding:

```bash
cd my-project
pnpm install            # skip if you answered "yes" to install during scaffolding
```

### 1. Stand up your Convex deployment

```bash
npx convex dev
```

First run only — links or creates a Convex project and prints your real
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL`. Paste them into `.env.local`,
replacing the generated placeholder values so the app stops pointing at
`https://placeholder.convex.cloud`. Leave `Ctrl-C` once it reports functions are ready.

`next.config.ts` derives `images.remotePatterns` from `NEXT_PUBLIC_CONVEX_URL`
automatically, so `next/image` picks up the real deployment's hostname without any
further edits.

### 2. Configure environment variables

The installer writes `.env.local` with a generated `BETTER_AUTH_SECRET`,
`NEXT_PUBLIC_SITE_URL`, and `SITE_URL` already filled in — only the two Convex URLs above need
replacing for local dev.

Better Auth runs *inside* the Convex deployment, not the Next.js server, so it never reads
`.env.local`. Push the same two values to the deployment itself:

```bash
npx convex env set SITE_URL http://localhost:3010
npx convex env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>
```

Skipping this step is the most common cause of a `403` on the first sign-in attempt.

### 3. Run the dev servers

```bash
pnpm dev        # Next.js + convex dev + the vex config watcher, together
```

### 4. Create your admin account

Open `http://localhost:3010` (or your chosen port) and sign up. The first account created is
automatically promoted to admin and redirected into `/admin`.

### Available scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js, `convex dev`, and the `vex` watcher together |
| `pnpm build` | Production build |
| `pnpm typecheck` | Type-check the project |
| `pnpm seed` | Run the marketing-site seed mutation (marketing-site only) |
| `pnpm secret:create` | Generate a random 32-character secret and copy it to the clipboard |

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
