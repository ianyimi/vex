# {{PROJECT_NAME}}

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

<!-- {{OAUTH_SETUP_GUIDE}} -->

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

1. `npx convex deploy`
2. In the Convex Dashboard, set `SITE_URL` to your production domain (keep
   `BETTER_AUTH_SECRET` the same, or rotate it and update both places).
3. Deploy the Next.js app (e.g. Vercel) with `NEXT_PUBLIC_CONVEX_URL`,
   `NEXT_PUBLIC_CONVEX_SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and
   `BETTER_AUTH_SECRET` set to their production values.
