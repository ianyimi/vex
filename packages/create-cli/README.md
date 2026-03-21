# create-vexcms

Scaffolding CLI for [VEX CMS](https://github.com/ianyimi/vex) projects. Creates a complete Next.js application with Convex backend, Better Auth authentication, and an admin panel — ready to run.

## Usage

```bash
pnpm create vexcms@latest
```

Or with a project name:

```bash
pnpm create vexcms@latest my-project
```

Supports relative paths:

```bash
pnpm create vexcms@latest apps/website
```

## Flags

| Flag | Description |
|------|-------------|
| `--bare` | Skip the marketing site template. Scaffolds an empty VEX CMS project with no collections. |
| `--orgs` | Enable multi-tenant organizations (adds Better Auth organizations plugin). |

```bash
# Empty project with no pre-built collections
pnpm create vexcms@latest my-app --bare

# Project with organizations support
pnpm create vexcms@latest my-app --orgs
```

## Interactive Prompts

The CLI walks you through:

1. **Project name** — validates npm package name rules, supports `.` for current directory
2. **Framework** — Next.js (recommended) or TanStack Start (coming soon)
3. **Email/password auth** — enable or disable (default: yes)
4. **OAuth providers** — multi-select from 30+ Better Auth providers (Google, GitHub, Discord, etc.)
5. **Organizations** — enable multi-tenant support (default: no, skipped if `--orgs` passed)
6. **Git repository** — initialize git (default: yes)
7. **Install dependencies** — run package install (default: no)

## Templates

### Marketing Site (default)

Pre-built collections for a marketing website:

- **Pages** — with title, slug, richtext content, draft/publish versioning, and live preview
- **Headers** — name, logo upload, sticky option
- **Footers** — name, richtext content, copyright text
- **Themes** — name, colors, font family
- **Site Settings** — site name, description, favicon upload

Also includes:

- Landing page with sign-in/sign-up flow
- First-user auto-admin promotion
- Admin panel onboarding tour (driver.js)
- Preview routes at `/preview/[slug]` with live preview support
- Public page routes at `/[slug]` (published pages only)
- Draft-aware queries using `vexQuery`

### Bare (`--bare`)

Empty VEX CMS project with:

- Authentication setup (Better Auth + Convex adapter)
- Admin panel wired at `/admin`
- Empty `collections: []` in `vex.config.ts`
- No onboarding tour

## Getting Started

After scaffolding your project:

### 1. Install dependencies

```bash
cd my-project
pnpm install
```

### 2. Generate a Better Auth secret

```bash
pnpm secret:create
```

This generates a random 32-character string and copies it to your clipboard.

### 3. Configure environment variables

The CLI creates a `.env.local` file with `NEXT_PUBLIC_SITE_URL` set to your chosen port. Add the auth secret:

```env
# .env.local (auto-generated)
NEXT_PUBLIC_SITE_URL=http://localhost:3010

# Add manually:
BETTER_AUTH_SECRET=your-generated-secret-here
```

### 4. Start VEX dev server

```bash
pnpm vex:dev
```

This starts the VEX CLI watcher (generates schema, types, and queries) and the Convex dev server. On first run, it will prompt you to create or select a Convex project.

### 5. Add environment variables to Convex

In the [Convex Dashboard](https://dashboard.convex.dev), navigate to your project's **Settings > Environment Variables** and add:

- `BETTER_AUTH_SECRET` — the same secret from step 2
- `SITE_URL` — `http://localhost:3010` (or your chosen port)

### 6. Start the Next.js dev server

In a separate terminal:

```bash
pnpm dev
```

### 7. Create your admin account

Open `http://localhost:3010` in your browser. Click **"Create Admin Account"** to sign up. The first user is automatically promoted to admin and redirected to the admin panel.

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm vex:dev` | Start VEX CLI watcher + Convex dev server |
| `pnpm vex:generate` | One-shot schema/type/query generation |
| `pnpm vex:update` | Update all `@vexcms/*` packages to latest |
| `pnpm secret:create` | Generate a random 32-character secret and copy to clipboard |
| `pnpm build` | Production build |

## Versioning

`create-vexcms` is versioned alongside all `@vexcms/*` packages. Running `pnpm create vexcms@latest` always scaffolds with the latest package versions. You can also pin a specific version:

```bash
pnpm create vexcms@0.0.3
```

The scaffolded project's `@vexcms/*` dependencies match the version of `create-vexcms` used.

## License

MIT
