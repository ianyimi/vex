---
"create-vexcms": patch
---

The template's `src/env.mjs` now skips validation inside the Convex runtime too, not just
under `SKIP_ENV_VALIDATION`: `convex/vex.ts` bundles registered admin components into the
Convex deployment, and a Convex push never sets `NEXT_PUBLIC_*`, so every `vex dev`/`vex
deploy` push failed with "Invalid environment variables" the moment a project registered one.
Detected via `CONVEX_CLOUD_URL`, a Convex-only variable Next never sets.

Scaffolder hygiene fixes:

- A custom `--port` now rewrites `.env.example`'s placeholder origin too, not just
  `.env.local`/`README.md` — a cloned project's committed template pointed at the wrong origin
  otherwise.
- The generated Better Auth secret now lands only in `.env.local`; `.env.example` (committed to
  version control) keeps `BETTER_AUTH_SECRET=""` rather than a real secret.
- The template `.gitignore`'s `.env.*` rule now carries the same `!.env.example` negation as
  root/apps, so the committed placeholder file is no longer silently gitignored.
- `package.json` now carries a `packageManager` field (Corepack `pm@version`) when
  `npm_config_user_agent` actually identifies one; omitted rather than guessed when it doesn't,
  since a wrong guess breaks the next install under a different package manager's Corepack check.
- The `@better-auth/passkey` version pin (needed to avoid an `npm install` ERESOLVE against
  `@daveyplate/better-auth-ui`) is now mirrored into top-level `overrides` (npm) and
  `resolutions` (yarn), not just `pnpm.overrides`.
- `--bare` no longer ships a `"seed": "convex run seed:init"` script with no `convex/seed.ts`
  to run it against; the marketing overlay adds the script back since it ships the seed file.
