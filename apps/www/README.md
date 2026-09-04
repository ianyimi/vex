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
pnpm vex:deploy        # Generate the schema and deploy Convex to production
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

`vercel.json` sets the build command to `pnpm vex:deploy && pnpm build`, so
**every Vercel build deploys the Convex functions before building the app.**
This is not optional plumbing. `next build` alone leaves the Convex deployment
running whatever function code was last pushed, and a stale deployment fails in
two ways that both look like something else:

- `convex run seed:init` executes the **old** `seed.ts`, so reseeding appears to
  do nothing — the site keeps rendering superseded content.
- Access control enforces the **old** `access.ts` matrix, so the Next.js route
  (fresh from Vercel) admits a caller that the Convex queries then deny. The
  panel renders and every collection reports access denied.

For that build command to work, set **`CONVEX_DEPLOY_KEY`** in the Vercel
project's environment variables — generate it from the Convex Dashboard under
*Settings → Deploy keys* for the **production** deployment. Without it
`vex deploy` fails and the build stops, which is the intended behaviour: a
deploy that silently skipped the backend is worse than one that fails loudly.

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
