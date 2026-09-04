# www

A VexCMS project built with Next.js, Better Auth, and Convex.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Convex

```bash
npx convex dev
```

On first run this creates (or links) a Convex project and prints your
deployment's URL and site URL.

### 3. Fill in your environment variables

`.env.local` already has a generated `BETTER_AUTH_SECRET` and a
`http://localhost:3010` `SITE_URL`/`NEXT_PUBLIC_SITE_URL` pair, so the app
builds and typechecks immediately. Replace the placeholder Convex URLs with the
real ones `npx convex dev` printed:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

`next.config.ts` reads `NEXT_PUBLIC_CONVEX_URL` at build/start time and adds that
deployment's hostname to `images.remotePatterns` automatically, so `next/image` can serve
uploaded media without a manual edit.

Better Auth runs inside your Convex deployment, not in the Next.js server —
it does **not** read `.env.local`. Set the same two values on the
deployment itself:

```bash
npx convex env set SITE_URL http://localhost:3010
npx convex env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>
```

Skipping this step is the most common cause of a `403` on your first sign-in
attempt.

### 4. Run the dev servers

```bash
# Terminal 1
pnpm vex:dev

# Terminal 2
pnpm dev
```

### 5. Create your admin account

Visit `http://localhost:3010`, click "Create Admin Account", and sign up. The
first user to sign up on a fresh project is automatically promoted to admin —
see `convex/vex/firstUser.ts`. From there, "Go to Admin Panel" opens `/admin`.


## Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/         # Public site routes
│   │   ├── (vexcms)/admin/     # Admin panel routes
│   │   └── layout.tsx          # Root layout
│   ├── auth/                   # Auth client + server helpers, access control
│   ├── components/             # React components
│   ├── vexcms/collections/     # Collection definitions
│   ├── vex.config.ts           # VexCMS config
│   └── env.mjs                 # Typed environment variables
├── convex/                     # Convex backend
│   ├── auth/                   # Better Auth config + plugins
│   ├── vex/                    # Bootstrap, media, globals endpoints
│   └── schema.ts               # Database schema
└── .env.local                  # Environment variables (not committed)
```

## Scripts

```bash
pnpm dev              # Start the Next.js dev server
pnpm vex:dev           # Start VexCMS's schema watcher + convex dev
pnpm vex:generate      # Regenerate the Convex schema and types once
pnpm deploy:convex     # Deploy the Convex functions to production
pnpm seed              # Seed missing documents only (fresh deployment)
pnpm seed:reinit       # Reconcile every seeded document against seed.ts
pnpm build             # Build for production
pnpm typecheck         # Type check without emitting
pnpm lint              # Lint
pnpm format            # Format with Prettier
pnpm secret:create     # Generate a Better Auth secret
```

## Documentation

- **VexCMS**: [docs.vexcms.dev](https://docs.vexcms.dev)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Better Auth**: [better-auth.com/docs](https://www.better-auth.com/docs)
- **Convex**: [docs.convex.dev](https://docs.convex.dev)

## Deployment

`vercel.json` sets the build command to
`pnpm turbo run build --filter=www^... && pnpm deploy:convex && pnpm build`, so
**every Vercel build builds this app's workspace dependencies, deploys the
Convex functions, and only then builds the app.** All three steps are
load-bearing.

**Why the `turbo` step.** Vercel starts from a fresh clone, so `packages/*/dist`
does not exist, and every `@vexcms/*` package resolves through an `exports` map
pointing into `dist` — `@vexcms/core`'s `./server` subpath is
`./dist/api/server.js`. Without it `convex deploy` cannot bundle
(`Could not resolve "@vexcms/core/server"`) and `next build` fails the same way
moments later. `--filter=www^...` selects this app's dependencies and excludes
the app itself, so nothing is built twice.

**Why the deploy step.** `next build` alone leaves the Convex deployment running
whatever function code was last pushed, and a stale backend fails in two ways
that both look like something else:

- `convex run seed:init` executes the **old** `seed.ts`, so reseeding appears to
  do nothing — the site keeps rendering superseded content.
- Access control enforces the **old** `access.ts` matrix, so the Next.js route
  (fresh from Vercel) admits a caller that the Convex queries then deny. The
  panel renders and every collection reports access denied.

Set **`CONVEX_DEPLOY_KEY`** in the Vercel project's environment variables —
generate it from the Convex Dashboard under *Settings → Deploy keys* for the
**production** deployment. Without it `convex deploy` fails and the build stops,
which is the intended behaviour: a deploy that silently skipped the backend is
worse than one that fails loudly.

**Why `convex deploy` and not `vex deploy`.** `vex deploy` does more — it
regenerates the schema and runs any auto-migration first — but its binary comes
from `@vexcms/cli`, whose `bin` points at `packages/cli/dist/index.js`. On a
fresh clone that file does not exist, so `pnpm install` cannot even create the
shim (it warns `Failed to create bin … .bin/vex`) and the build dies with
`sh: vex: command not found`. The `turbo` step now builds the CLI too, so
`vex deploy` *would* work — but nothing is gained: the three generated artifacts
(`convex/vex.schema.ts`, `convex/schema.ts`, `src/vex.types.ts`) are committed,
so `convex deploy` ships the same schema, and `turbo typecheck` already fails if
they drift. Keep them current with `pnpm vex:generate`.

### Verifying a deploy change before pushing

Run **`pnpm check:vercel`** from the repo root. It copies the files a fresh clone
would have — including uncommitted work, excluding every build output — installs
with `--frozen-lockfile`, and runs the exact `buildCommand` from `vercel.json`
with the push replaced by a resolution-only `convex/**` bundle. Both deploy
failures this setup has had were invisible in a normal working copy and
reproduce there in one run. It cannot check the push itself, which needs
`CONVEX_DEPLOY_KEY`.

Also required, once, in the Convex Dashboard:

1. Set `SITE_URL` to your production domain. It is a **Convex** environment
   variable, not a Vercel one — `convex/auth/options.ts` reads it for `baseURL`
   and `trustedOrigins`.
2. Keep `BETTER_AUTH_SECRET` identical to the Vercel value, or rotate it in
   both places together.

And in Vercel: `NEXT_PUBLIC_CONVEX_URL` (ends in `.convex.cloud`),
`NEXT_PUBLIC_CONVEX_SITE_URL` (ends in `.convex.site`), `NEXT_PUBLIC_SITE_URL`,
and `BETTER_AUTH_SECRET`. Swapping the two Convex URLs fails the build with
"Invalid deployment address".

### Updating seeded content

`seed:init` only inserts rows that are absent, so editing `convex/seed.ts` does
not change a deployment that is already seeded. Use `pnpm seed:reinit` to
reconcile every seeded document in place against the current file.
