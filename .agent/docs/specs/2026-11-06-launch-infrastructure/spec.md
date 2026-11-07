---
status: draft
spec_id: 2026-11-06-launch-infrastructure
touches:
  - "apps/www/convex/**"
  - "apps/www/src/auth/**"
  - "apps/www/src/components/FirstAdminBootstrap.tsx"
  - "apps/www/src/db/constants/auth.ts"
  - "apps/www/src/env.mjs"
  - "apps/www/.env.example"
  - "apps/www/src/lib/routes.ts"
  - "apps/www/src/lib/analytics.ts"
  - "apps/www/src/testing/**"
  - "apps/www/src/app/layout.tsx"
  - "apps/www/src/app/tour/**"
  - "apps/www/src/app/(vexcms)/admin/**"
  - "apps/www/public/tour/**"
  - "apps/www/package.json"
  - "apps/www/vitest.config.ts"
  - "apps/test/src/auth/schema.ts"
  - "apps/test/convex/seed.ts"
  - "apps/test/src/components/FirstAdminBootstrap.tsx"
  - "apps/test/src/lib/routes.ts"
  - "apps/test/src/app/tour/**"
  - "apps/test/src/app/(vexcms)/admin/**"
  - "apps/test/public/tour/**"
  - "apps/docs/package.json"
  - "apps/docs/astro.config.mjs"
  - "apps/docs/src/components/Head.astro"
  - "apps/docs/src/content/docs/guides/auth.mdx"
  - "apps/docs/src/content/docs/guides/caching-and-seo.mdx"
  - "apps/docs/src/content/docs/guides/quickstart.mdx"
  - "packages/core/src/auth/types.ts"
  - "packages/core/src/config/**"
  - "packages/better-auth/src/adapter.ts"
  - "packages/better-auth/src/adapter.test.ts"
  - "packages/better-auth/README.md"
  - "packages/create-vexcms/templates/**"
  - "packages/create-vexcms/README.md"
  - "pnpm-workspace.yaml"
  - ".github/workflows/ci.yml"
  - ".changeset/roles-not-client-writable.md"
  - ".changeset/auth-roles-guard.md"
prompt_version: 1
---

# 2026-11-06-launch-infrastructure — Spec

## Overview

Launch-plan item 15: S (live demo hardening), P (launch analytics & monitoring), then N (template sync + scaffold tests). `apps/www` is the live demo a Show HN reader clicks first. It runs on Vercel + Convex, and today it is open to two problems:

- **Self-assigned admin.** Anyone can make themselves admin through Better Auth's sign-up (`roles` is client-writable, proven in-process; see `sources.md` §14).
- **User-table growth.** Scripted sign-ups can grow the user table without bound, and every new user re-runs a whole-table scan for every connected visitor.

S closes both and adds a demo fallback for outages. P adds measurement (Web Analytics on www + docs, sampled Speed Insights on www), a privacy page, spend and usage caps, and uptime alerts. N carries everything into the `create-vexcms` templates. It is **blocked** until quality-pass step 12 (`2026-11-06-quality-pass`) and M (`2026-10-26-build-time-telemetry`) are committed.

High-care: the developer implements; code blocks below are guided stubs plus complete tests. Vendor facts and fetch dates are in `sources.md`.

## Design Decisions

1. **The roles hotfix ships out-of-band, now.** vexcms.dev accepts `roles: ["admin"]` on `/api/auth/sign-up/email` today. Step 1 records the five-place fix and its changeset; step 8 proves it on production.
2. **The roles guard lives in core, filled in by the adapter.** `VexAuthAdapter` gains an optional `clientWritableUserFields`. `defineServerConfig` throws `VexAuthConfigError` when `config.access.userRolesField` is in that list for the adapter's user collection. This mirrors the existing `diffAuthCollections` drift check in the same function (`packages/core/src/config/config.ts:269-281`), the closest existing system. It stays provider-neutral, reads the real `userRolesField` instead of hardcoding `roles`, and fails at `vex dev` and in every test that imports the server config.
3. **`anonymous()` and email sign-up stay enabled on www** (interview: "as planned"). The Admin button no longer mints anonymous sessions (`AdminDemoButton.tsx:7-23`), so the launch plan's premise for S's first two tasks is stale. But `POST /api/auth/sign-in/anonymous` and `/sign-up/email` are still public, so the cleanup and the limit are still needed.
4. **Purge: hourly at minute 17; users older than 24h with `isAnonymous: true`; 200 per run; reschedules itself when a batch is full.** Convex advises against top-of-hour crons and skips an overlapping run instead of queuing it (`sources.md` §1). It deletes the user's `session`, `account` and `apikey` rows by their `by_userId` / `by_referenceId` indexes. Users are scanned through the built-in `by_creation_time` index, so no schema change. It uses the raw `internalMutation` from `_generated/server`, mirroring `convex/auth/db.ts`, because Better Auth's own tables are written through raw internal mutations, never `vexMutation` triggers.
5. **Rate limiting uses `@convex-dev/rate-limiter` in `convex/http.ts`, before Better Auth runs.** This is the repo's first Convex component; there is no existing system to mirror, so it follows the component's README (`sources.md` §2, §14). Better Auth's built-in limiter is rejected because its `memory` storage is per Convex isolate. Its `database` storage would go through the adapter's separate `runMutation` calls, which is not atomic.
   - **Attestation.** The Next route (`src/auth/server.ts` `handler`) sets `x-vex-client-ip` from Vercel's `x-forwarded-for` (Vercel overwrites it; `sources.md` §13) and `x-vex-proxy-secret` from `AUTH_PROXY_SECRET`. The Convex side treats a request as attested only when the secret matches. Anything else, including direct `.convex.site` calls with forged headers, draws from one shared unattested bucket.
   - **Limits.** Per attested IP: `/sign-in/anonymous` token bucket 10/hour, capacity 5; `/sign-up/email` 5/hour, capacity 3. Unattested: 30/hour, shared. Global cap on all user creation: 600/hour, fixed window.
   - **Keys.** Limiter keys are `SHA-256(AUTH_PROXY_SECRET + ":" + ip)`, so no raw IP is stored.
6. **`advanced.ipAddress.disableIpTracking: true` on www.** Sessions stop storing IPs, so the privacy page can truthfully say no raw IP is stored. This also turns off Better Auth's own limiter, which decision 5 replaces.
7. **`FirstAdminBootstrap` subscribes only when a session exists** (`"skip"` otherwise). `WelcomePage` keeps its unconditional query: it needs the answer before anyone signs in, and it mounts only on a deployment with no `home` page.
8. **Read-only proof = a permanent convex-test suite + one recorded production run.**
   - **Where the helper lives.** `createConvexTest` lives in `src/testing/`, not `convex/`. The Convex CLI pushes every single-dot module in `convex/` (`sources.md` §14), so a helper that imports `convex-test` would be bundled as a function module. Test files can sit in `convex/` because `*.test.ts` has two dots.
   - **Test environment.** Each Convex test file opens with `// @vitest-environment edge-runtime`, mirroring `packages/next/src/navigation/useNextNavigationBlocker.test.ts`. `convex-test` is inlined, mirroring `packages/core/vitest.config.ts`.
9. **`/tour` is a static route, a deliberate exception to P-018.** An outage fallback can't depend on the backend that failed. Seeded pages, and their Convex-stored images, are served by Convex. It mirrors `app/unauthorized/page.tsx`: outside the route groups, emitting `<ThemeStyle />` itself. `dynamic = "force-static"` bakes the theme CSS in at build. Screenshots ship from `public/tour/`.
10. **Convex: Starter now, sizing measured after** (interview). Spending limits need a paid subscription; on Free, writes may fail once usage passes a limit (`sources.md` §8).
11. **Vercel: Pro for launch.** Set an On-Demand Budget with pause-production. Spend Management is Pro-only, and Hobby is non-commercial with 30-day cooldowns on overage (`sources.md` §11).
12. **Speed Insights on www only, `sampleRate` 0.05. Web Analytics on docs through a Starlight `Head` override.** The Speed Insights pool is 10k events per 30 days, team-wide, so docs doesn't spend it.
13. **The marketing template ships no analytics.** `apps/docs` explains how to add it (step 14).
14. **The privacy page is seeded with the existing Hero + FAQ blocks; its footer link sits after "Licence".** This is how quality-pass step 11 seeds `/accessibility` (P-018, P-021). Contact is GitHub Discussions until R creates an address. The newsletter answer is T's to add.
15. **Uptime: UptimeRobot Free.** Keyword monitors on `vexcms.dev`, `docs.vexcms.dev` and `vexcms.dev/admin`, plus an HTTP monitor on the prod `.convex.site/api/auth/ok`. Alerts go through the mobile app (`sources.md` §16).
16. **The apps/test port is limited to template-bound changes plus seed data and new pages** (bootstrap fix, privacy seed, `/tour`). The rate limiter, cron, `AUTH_PROXY_SECRET`, `disableIpTracking` and analytics stay www-only.
17. **N stays in this spec, last and blocked.** It also carries this spec's base and template changes. Template seeds leave out the vexcms-only pages (`privacy`, `accessibility`, `tour`) and their footer links.
18. **Operational records live in this spec folder**: `live-proof.md`, `sizing.md`, `operations.md`, `n-sync.md`, `n-runthrough.md`, `bookkeeping.md`. This spec may not edit the launch plan, `backlog.md` or other specs. Step 21 lists those edits instead.

## Out of Scope

- PostHog, and an analytics adapter for VexCMS users (roadmap 🔭).
- Removing `anonymous()` from www or closing email sign-up (considered and rejected in the interview).
- Brute-force limiting on `/sign-in/email`. Better Auth's limiter is in-memory per isolate on Convex. Proposed for `backlog.md` in step 21.
- Rate limiting M's telemetry receiver (M's own step 10 decides where it lives). Proposed for `backlog.md`.
- The rate limiter, purge cron and `AUTH_PROXY_SECRET` in `apps/test` or either template.
- CSP and other security headers. Quality-pass step 8 owns them; see § Handoff to quality pass.
- Accessibility auditing of `/privacy` and `/tour`; the quality pass covers them through the handoff.
- The privacy page's newsletter answer (T), a `vexcms.dev` contact address (R), and a demo video on `/tour` (T's media kit).
- Vercel WAF rules and custom Convex domains.
- Making `isBootstrapped` / `promoteFirstAdmin` read in O(1). Only the per-visitor subscription is removed.

## Handoff to quality pass

`2026-11-06-quality-pass` is not edited by this spec. Its steps need these inputs from here, whichever spec lands first:

| Quality-pass step | Input from this spec |
|---|---|
| 8 — CSP `script-src` | Production: `'self'` covers `/_vercel/insights/script.js` and `/_vercel/speed-insights/script.js` (both same-origin; `sources.md` §14). Development: the debug scripts load from `https://va.vercel-scripts.com` (`/v1/script.debug.js`, `/v1/speed-insights/script.debug.js`). Either allow that origin only when `NODE_ENV === "development"`, or emit the CSP only in production. |
| 8 — CSP `connect-src` | Production: `'self'` covers the `/_vercel/insights/*` and `/_vercel/speed-insights/*` intake (same-origin "Resilient Intake"; `sources.md` §9–§10). Vercel publishes no CSP baseline (vercel/analytics#177, open), so confirm on the preview's console that no violation is logged. |
| 8 — CSP `img-src` | `/tour` serves `next/image` from `public/tour/`: `'self'` only. |
| 8 — other directives | Rate limiting is server-to-server (Next route → `.convex.site`), so there are no browser origins. `AUTH_PROXY_SECRET` never reaches the browser. |
| 2 / 3 — `e2e/routes.ts`, `inventory.md` | Add `/privacy` (seeded via `[slug]`) and `/tour` (static), plus the admin error boundary (`(vexcms)/admin/error.tsx`). |
| 5 — APG | `/privacy` renders the existing FAQ block (accordion pattern), so nothing new is added. |
| 11 — accessibility statement | Same mechanism as step 13 here: a seeded page with Hero + FAQ blocks. Footer order is `… Licence, Privacy, Accessibility, …`. |
| 12 — port to apps/test | This spec's step 16 ports the bootstrap fix, the privacy seed and `/tour`. Whichever of the two runs second ports onto the other's result. |

## Implementation

### Step 1 — Roles hotfix: `roles` not client-writable

`[agent]`

The developer applies this out-of-band before the rest of the spec, because production is exposed today. This step records the fix and closes any of the five places it missed. The checkboxes list every file so the record matches what shipped.

- [ ] `apps/www/convex/auth/schema.ts`: `input: false` on `roles`
- [ ] `apps/test/src/auth/schema.ts`: `input: false` on `roles`
- [ ] `packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts`: `input: false` on `roles`
- [ ] `packages/better-auth/README.md`: `input: false` on `roles` in the example
- [ ] `apps/docs/src/content/docs/guides/auth.mdx`: `input: false` on `roles` in the example
- [ ] `.changeset/roles-not-client-writable.md`

#### apps/www/convex/auth/schema.ts

1 edit; everything not shown is unchanged.

**1 — the `roles` field inside `authSchema.user.additionalFields`.**

```ts
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.user],
        required: true,
        input: false,
      },
```

#### apps/test/src/auth/schema.ts

1 edit; everything not shown is unchanged.

**1 — the `roles` field inside `authSchema.user.additionalFields`.** Same shape as `apps/www`'s; the file's trailing `organization.schema.invitation.additionalFields.roles` entry (already `input: true`) is unrelated and unchanged.

```ts
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.user],
        required: true,
        input: false,
      },
```

#### packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts

1 edit; everything not shown is unchanged.

**1 — the `roles` field inside `authSchema.user.additionalFields`.**

```ts
      roles: {
        type: "string[]",
        defaultValue: [USER_ROLES.user],
        required: true,
        input: false,
      },
```

#### packages/better-auth/README.md

1 edit; everything not shown is unchanged.

**1 — the `roles` field in the `src/auth/schema.ts` example (Usage section).**

```ts
      roles: { type: "string[]", defaultValue: ["user"], required: true, input: false },
```

#### apps/docs/src/content/docs/guides/auth.mdx

1 edit; everything not shown is unchanged.

**1 — the `roles` field in the "The client-safe schema module" example.**

```ts
      roles: { type: "string[]", defaultValue: ["user"], required: true, input: false },
```

#### .changeset/roles-not-client-writable.md

```md
---
"create-vexcms": patch
"@vexcms/better-auth": patch
---

Scaffolded `user.additionalFields.roles` now carries `input: false`. Without it, Better
Auth 1.6.23 writes any `roles` value a caller sends on `/sign-up/email` or `/update-user`
straight onto the user row — `additionalFields` only sets a *default*, not a block on
caller-supplied input. A visitor who knows the field name can `POST` `{ "roles": ["admin"] }`
during sign-up and become an admin on first request, no further exploit needed.

Existing projects: add `input: false` next to `roles` in `src/auth/schema.ts` (or wherever
your scaffold's `authSchema.user.additionalFields` lives) and redeploy. Any other
`additionalFields` entry the server sets itself — never one a sign-up or profile-update
form should carry — needs the same flag.
```

Verify: `grep -rn -A4 "roles: {" apps/www/convex/auth/schema.ts apps/test/src/auth/schema.ts packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts` shows `input: false` in each; `pnpm typecheck` green. The live sign-up probe in step 8 proves it on production.

### Step 2 — www Convex test harness + rate-limiter component

`[agent]`

Registers `@convex-dev/rate-limiter` as the repo's first Convex component and builds the Convex half of `apps/www`'s test harness (steps 3, 5 and 6 depend on both). `createConvexTest` lives in `src/testing/`, not `convex/`, so `convex-test` — a devDependency with no place in the deployed bundle — never gets swept into a pushed function module by the Convex CLI's single-dot rule (decision 8).

- [ ] `pnpm-workspace.yaml` catalog: `@convex-dev/rate-limiter: 0.4.3`
- [ ] `apps/www/package.json`: `@convex-dev/rate-limiter` (dependency), `convex-test` + `@edge-runtime/vm` (devDependencies), all `catalog:`
- [ ] `apps/www/convex/convex.config.ts`: `app.use(rateLimiter)`
- [ ] `apps/www/vitest.config.ts`: include `convex/**/*.test.ts`, inline `convex-test`, alias `@convex`
- [ ] `apps/www/src/testing/createConvexTest.ts`: `createConvexTest()` and `insertTestUser()`
- [ ] `.github/workflows/ci.yml`: `--filter www` on the Test Packages step

#### pnpm-workspace.yaml

1 edit; everything not shown is unchanged.

**1 — alphabetical position in `catalog:`, immediately after `@codemirror/view`.**

```yaml
  "@convex-dev/rate-limiter": 0.4.3
```

#### apps/www/package.json

2 edits; everything not shown is unchanged.

**1 — `dependencies`, alphabetical position after `@convex-dev/react-query`.**

```json
    "@convex-dev/rate-limiter": "catalog:",
```

**2 — `devDependencies`, alphabetical positions around the existing entries.**

```json
    "@edge-runtime/vm": "catalog:",
```
```json
    "convex-test": "catalog:",
```

#### apps/www/convex/convex.config.ts

New file content (replaces the current 5-line stub).

```ts
import { defineApp } from "convex/server"

import rateLimiter from "@convex-dev/rate-limiter/convex.config.js"

const app = defineApp()
app.use(rateLimiter)

export default app
```

#### apps/www/vitest.config.ts

1 edit; everything not shown is unchanged.

**1 — `test` and `resolve.alias`: add the Convex test glob, inline `convex-test`, and the `@convex` alias.**

```ts
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "convex/**/*.test.ts"],
    passWithNoTests: true,
    server: {
      deps: {
        // convex-test ships ESM only; inline so vitest doesn't externalize it.
        inline: ["convex-test"],
      },
    },
```
```ts
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
      "@convex": fileURLToPath(new URL("./convex", import.meta.url)),
    },
  },
```

#### apps/www/src/testing/createConvexTest.ts

```ts
import { convexTest } from "convex-test"
import type { TestConvex } from "convex-test"
import rateLimiterTest from "@convex-dev/rate-limiter/test"

import schema from "@convex/schema"
import type { Id } from "@convex/_generated/dataModel"

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * An identity shape ready for `t.withIdentity(identity)`. `email` is
 * required (not optional, unlike `convex-test`'s own `UserIdentity`): every
 * caller this harness builds resolves through `createGetAuth`, which looks
 * the subject up by `_id`, and `vex/firstUser.ts#promoteFirstAdmin` separately
 * reads `identity.email` to find the same user by its `by_email` index, so an
 * identity missing `email` silently breaks that one caller.
 */
export interface TestUserIdentity {
  subject: string
  sessionId: string
  email: string
}

export interface InsertTestUserResult {
  userId: Id<"user">
  sessionId: Id<"session">
  identity: TestUserIdentity
}

const testModules = import.meta.glob("../../convex/**/*.ts")

/**
 * Builds one `convex-test` instance wired the way every real deployment is:
 * schema from `@convex/schema`, every Convex module under `convex/` resolved
 * through `import.meta.glob` (a module-loader map `convex-test` requires
 * explicitly — passing only `schema` throws `import.meta.glob is not a
 * function` against convex-test's prebuilt dist), and the rate limiter
 * component pre-registered so any test touching an auth mutation that calls
 * `rateLimiter.limit(...)` does not throw on an unregistered component.
 *
 * @returns A fresh `convex-test` instance. Call once per test (or per
 *   `describe` block that shares fixtures) — state does not reset between
 *   calls to the SAME instance, so reusing one across unrelated tests leaks
 *   data between them.
 */
export function createConvexTest(): TestConvex<typeof schema> {
  // TODO: implement
  // 1. `const t = convexTest(schema, testModules)` → the real, schema- and
  //    module-aware harness instance.
  // 2. `rateLimiterTest.register(t)` → registers `components.rateLimiter`
  //    (and its `@convex-dev/batch-worker` dependency) against `t`, under
  //    the limiter's default component name `"rateLimiter"`. Must run before
  //    `t` is returned: a caller importing it after the first `t.mutation`/
  //    `t.run` call is too late — the component has to exist before any
  //    function that references `components.rateLimiter` executes.
  // 3. → return `t`.
  throw new Error("Not implemented")
}

/**
 * Inserts one `user` row plus a matching `session` row, and returns an
 * identity ready for `t.withIdentity(...)`.
 *
 * @param props.t - The `createConvexTest()` instance to seed.
 * @param props.roles - The `roles` array stamped onto the inserted user —
 *   drives which `USER_ROLES` permission set the identity resolves to once
 *   `t.withIdentity(identity)` wraps it.
 * @param props.isAnonymous - Stamped onto the user row as `isAnonymous`.
 *   Omit for a normal (non-anonymous-plugin) user.
 * @param props.email - Overrides the generated default
 *   `${props.roles.join("-")}@test.local`. Pass a fixed value when a test
 *   needs to assert on the email itself.
 * @returns `{ userId, sessionId, identity }` — `identity.subject` is the
 *   inserted user's `_id` (stringified), `identity.sessionId` is the
 *   inserted session's `_id` (stringified), and `identity.email` matches the
 *   user row, so `t.withIdentity(identity)` resolves through
 *   `createGetAuth` (subject → `ctx.db.get(TABLE_SLUG_USERS, subject)`) and
 *   through `promoteFirstAdmin`'s separate `by_email` lookup identically.
 */
export async function insertTestUser(props: {
  t: TestConvex<typeof schema>
  roles: string[]
  isAnonymous?: boolean
  email?: string
}): Promise<InsertTestUserResult> {
  // TODO: implement
  // 1. Resolve `email` → `props.email ?? \`${props.roles.join("-")}@test.local\``.
  // 2. `props.t.run(async (ctx) => { ... })`:
  //    a. Insert into `TABLE_SLUG_USERS`: `name` (any string), `email`,
  //       `emailVerified: true`, `createdAt`/`updatedAt` (`Date.now()`),
  //       `roles: props.roles`, `isAnonymous: props.isAnonymous` → `userId`.
  //    b. Insert into `TABLE_SLUG_SESSIONS`: `token` (any unique string),
  //       `expiresAt` (now + 1h), `createdAt`/`updatedAt` (`Date.now()`),
  //       `userId: String(userId)` → `sessionId`.
  //    c. → return `{ userId, sessionId }`.
  // 3. Build `identity = { subject: String(userId), sessionId: String(sessionId), email }`.
  // 4. → return `{ userId, sessionId, identity }`.
  throw new Error("Not implemented")
}
```

#### .github/workflows/ci.yml

1 edit; everything not shown is unchanged.

**1 — the `Test Packages` step's `run` line.**

```yaml
        run: pnpm --filter "@vexcms/*" --filter "create-vexcms" --filter www test
```

Verify: `pnpm --filter www test` and `pnpm --filter www typecheck` green; `convex/_generated/api.d.ts` exposes `components.rateLimiter` (regenerated by the developer's running `vex dev`).

### Step 3 — Read-only access suite

`[agent]`

Proves the whole public mutation surface rejects a sessionless caller and a plain `user`-role caller, against the real `src/auth/access.ts` matrix — not the UI, not a mock. `promoteFirstAdmin` is the one function that legitimately *resolves* for a `user`-role caller (it no-ops when an admin already exists, per `apps/www/convex/vex/firstUser.ts`), so it is asserted separately from the other 13.

- [ ] `apps/www/convex/readOnlyAccess.test.ts`

#### apps/www/convex/readOnlyAccess.test.ts

```ts
// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest"

import { api } from "./_generated/api"
import { createConvexTest, insertTestUser } from "~/testing/createConvexTest"
import {
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_IMAGES,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"

/**
 * Seeds one row per collection this suite touches, plus an admin user so
 * `promoteFirstAdmin` observes `hasAdmin: true` (the no-op branch) for every
 * caller below. Returns the seeded ids and a snapshot of every affected
 * table so each test can assert nothing moved.
 */
async function seed(t: ReturnType<typeof createConvexTest>) {
  const { userId: adminUserId } = await insertTestUser({
    t,
    roles: [USER_ROLES.admin],
    email: "admin@test.local",
  });

  const { pageId, imageId, globalId } = await t.run(async (ctx) => {
    const pageId = await ctx.db.insert(TABLE_SLUG_PAGES, {
      title: "Home",
      slug: "home",
      vex_status: "published",
    });
    const imageId = await ctx.db.insert(TABLE_SLUG_IMAGES, {
      filename: "logo.png",
      alt: "Logo",
      mimeType: "image/png",
      size: 1024,
      storageId: "storage_readonly_1",
      src: "https://example.com/logo.png",
    });
    const globalId = await ctx.db.insert("vex_globals", {
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      data: { name: "Read-Only Suite" },
    });
    return { pageId, imageId, globalId };
  });

  return { adminUserId, pageId, imageId, globalId };
}

async function snapshot(t: ReturnType<typeof createConvexTest>) {
  return t.run(async (ctx) => ({
    users: await ctx.db.query(TABLE_SLUG_USERS).collect(),
    pages: await ctx.db.query(TABLE_SLUG_PAGES).collect(),
    images: await ctx.db.query(TABLE_SLUG_IMAGES).collect(),
    globals: await ctx.db.query("vex_globals").collect(),
    views: await ctx.db.query("vex_views").collect(),
    versions: await ctx.db.query("vex_versions").collect(),
  }));
}

/**
 * One row per public mutation: the reference name for the test title, the
 * `api.*` function reference, and a factory for plausible args. `args` is a
 * function of the seeded ids so each row can reference `pageId`/`imageId`/
 * `globalId` without a module-level fixture.
 */
const MUTATIONS = [
  {
    name: "vex:create",
    fn: api.vex.create,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      data: { title: "Hijacked", slug: "hijacked" },
    }),
  },
  {
    name: "vex:update",
    fn: api.vex.update,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      data: { title: "Hijacked" },
    }),
  },
  {
    name: "vex:remove",
    fn: api.vex.remove,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      ids: [s.pageId],
    }),
  },
  {
    name: "vex:saveView",
    fn: api.vex.saveView,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      view: { viewId: "hijacked-view", name: "Hijacked", state: {} },
    }),
  },
  {
    name: "vex:removeView",
    fn: api.vex.removeView,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      viewId: "nonexistent-view",
    }),
  },
  {
    name: "vex/globals:upsert",
    fn: api.vex.globals.upsert,
    args: () => ({
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      data: { name: "Hijacked" },
    }),
  },
  {
    name: "vex/media:generateUploadUrl",
    fn: api.vex.media.generateUploadUrl,
    args: () => ({ adapter: "convex", collection: TABLE_SLUG_IMAGES }),
  },
  {
    name: "vex/media:createMediaDocument",
    fn: api.vex.media.createMediaDocument,
    args: () => ({
      adapter: "convex",
      collectionSlug: TABLE_SLUG_IMAGES,
      filename: "hijacked.png",
      mimeType: "image/png",
      size: 2048,
      storageId: "storage_hijacked_1",
    }),
  },
  {
    name: "vex/media:deleteMedia",
    fn: api.vex.media.deleteMedia,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      adapter: "convex",
      mediaId: s.imageId,
    }),
  },
  {
    name: "vex/versions:saveDraft",
    fn: api.vex.versions.saveDraft,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      data: { title: "Hijacked draft" },
    }),
  },
  {
    name: "vex/versions:publish",
    fn: api.vex.versions.publish,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
    }),
  },
  {
    name: "vex/versions:unpublish",
    fn: api.vex.versions.unpublish,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
    }),
  },
  {
    name: "vex/versions:deleteVersion",
    fn: api.vex.versions.deleteVersion,
    args: (s: Awaited<ReturnType<typeof seed>>) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      version: 1,
    }),
  },
];

describe("public mutations reject a caller with no identity", () => {
  it.each(MUTATIONS)("$name rejects an unauthenticated caller and leaves the database unchanged", async ({ fn, args }) => {
    const t = createConvexTest();
    const seeded = await seed(t);
    const before = await snapshot(t);

    await expect(t.mutation(fn, args(seeded))).rejects.toThrow();

    expect(await snapshot(t)).toEqual(before);
  });

  it("promoteFirstAdmin rejects an unauthenticated caller and leaves the database unchanged", async () => {
    const t = createConvexTest();
    await seed(t);
    const before = await snapshot(t);

    await expect(t.mutation(api.vex.firstUser.promoteFirstAdmin, {})).rejects.toThrow();

    expect(await snapshot(t)).toEqual(before);
  });
});

describe("public mutations reject a plain `user`-role caller", () => {
  it.each(MUTATIONS)("$name rejects a user-role caller and leaves the database unchanged", async ({ fn, args }) => {
    const t = createConvexTest();
    const seeded = await seed(t);
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.user] });
    const before = await snapshot(t);

    await expect(t.withIdentity(identity).mutation(fn, args(seeded))).rejects.toThrow();

    expect(await snapshot(t)).toEqual(before);
  });

  it("promoteFirstAdmin no-ops for a user-role caller when an admin already exists, and leaves the database unchanged", async () => {
    const t = createConvexTest();
    await seed(t);
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.user] });
    const before = await snapshot(t);

    await expect(
      t.withIdentity(identity).mutation(api.vex.firstUser.promoteFirstAdmin, {}),
    ).resolves.toEqual({ promoted: false });

    expect(await snapshot(t)).toEqual(before);
  });
});
```

Verify: `pnpm --filter www test -- readOnlyAccess` passes: 14 mutations × 2 callers, each rejected (or `promoteFirstAdmin` resolving `{ promoted: false }` for the `user`-role caller), database unchanged in every case. Proven to fail: temporarily set `pages: true` for `USER_ROLES.user` in `src/auth/access.ts` — the `vex:create`/`vex:update`/`vex:remove` cases for the `user`-role caller stop rejecting and this suite fails. Revert afterwards.

### Step 4 — Bootstrap subscription only with a session

`[agent]`

- [ ] `apps/www/src/components/FirstAdminBootstrap.tsx`: move `useSession()` above `useQuery`, skip the query when signed out

#### apps/www/src/components/FirstAdminBootstrap.tsx

1 edit; everything not shown is unchanged.

**1 — `useSession()` moves above `useQuery`, and the query skips when signed out.** Anchored on the `isBootstrapped`/`useSession` pair and the component JSDoc above it.

```tsx
/**
 * Promotes the first signed-in user to admin when no admin exists yet, then
 * redirects to `/admin`. Headless — renders nothing.
 *
 * `WelcomePage`'s own trigger (`convex/vex/firstUser.ts`'s
 * `promoteFirstAdmin`) only runs while `PageContent` is showing its
 * no-page-found fallback — which stops rendering the instant a `home` page
 * document exists. A fresh marketing scaffold gets a `home` document from
 * `pnpm seed` on day one, so that fallback may never mount again and the
 * bootstrap trigger would never fire. This mounts unconditionally in
 * `(frontend)/layout.tsx` instead, so the trigger survives seeding.
 *
 * `promoteFirstAdmin` is a Convex mutation, so concurrent signups cannot
 * both win — Convex serializes mutations, and the loser observes
 * `isBootstrapped` already true.
 *
 * `isBootstrapped` reads the whole `user` table (`ctx.db.query(...).collect()`),
 * so every connected visitor re-runs it on every user insert. Signed-out
 * visitors never promote anything, so the subscription only opens once a
 * session exists.
 */
export function FirstAdminBootstrap() {
  const { data: session } = useSession()
  const isBootstrapped = useQuery(api.vex.firstUser.isBootstrapped, session?.user ? {} : "skip")
  const promoteFirstAdmin = useMutation(api.vex.firstUser.promoteFirstAdmin)
  const router = useRouter()
```

Verify: with `/` open signed out on :3030, the Convex dashboard's dev-deployment logs show no `vex/firstUser:isBootstrapped` execution; signed in on a deployment with no admin, the first user is still promoted and redirected to `/admin`

### Step 5 — Expired anonymous-user purge + cron

`[agent]`

- [ ] `apps/www/src/db/constants/auth.ts`: `ANONYMOUS_USER_MAX_AGE_MS`, `ANONYMOUS_USER_PURGE_BATCH_SIZE`
- [ ] `apps/www/convex/auth/anonymousUsers.ts`: `purgeExpired` internal mutation
- [ ] `apps/www/convex/auth/anonymousUsers.test.ts`
- [ ] `apps/www/convex/crons.ts`: hourly cron at `:17`

#### apps/www/src/db/constants/auth.ts

1 edit; everything not shown is unchanged.

**1 — append the purge constants after `AUTH_COOKIE_PREFIX`.**

```ts
/**
 * How old an anonymous Better Auth user (`isAnonymous: true`) may get, in
 * milliseconds, before `convex/auth/anonymousUsers.ts`'s hourly cron deletes
 * it along with its `session`, `account` and `apikey` rows. Better Auth's
 * anonymous plugin never expires users on its own, so without this purge the
 * `user` table grows without bound from scripted sign-ins.
 */
export const ANONYMOUS_USER_MAX_AGE_MS = 24 * 60 * 60 * 1000

/**
 * Maximum number of expired anonymous users `purgeExpired` deletes in one
 * cron run. The mutation reschedules itself immediately when a run fills
 * this batch, so a large backlog drains over several back-to-back runs
 * instead of one unbounded scan.
 */
export const ANONYMOUS_USER_PURGE_BATCH_SIZE = 200
```

#### apps/www/convex/auth/anonymousUsers.ts

```ts
import { internalMutation } from "@convex/_generated/server"
import { internal } from "@convex/_generated/api"

import { ANONYMOUS_USER_MAX_AGE_MS, ANONYMOUS_USER_PURGE_BATCH_SIZE, TABLE_SLUG_ACCOUNTS, TABLE_SLUG_API_KEYS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"

/**
 * Deletes anonymous Better Auth users (`isAnonymous: true`) older than
 * `ANONYMOUS_USER_MAX_AGE_MS`, plus each deleted user's `session`, `account`
 * and `apikey` rows (looked up by `by_userId` / `by_referenceId`, deleted
 * before the user row itself so no row ever points at a missing user). Runs
 * through a raw `internalMutation`, mirroring `convex/auth/db.ts`, because
 * Better Auth's own tables are written through raw internal mutations, never
 * `vexMutation` triggers.
 *
 * Scans at most `ANONYMOUS_USER_PURGE_BATCH_SIZE` candidate users per run,
 * ordered by `by_creation_time`. When the batch is full, schedules another
 * run of itself immediately (`ctx.scheduler.runAfter(0, ...)`) so a large
 * backlog drains over consecutive runs instead of blocking the cron's own
 * schedule.
 *
 * @returns `{ deleted, rescheduled }` — `deleted` is the number of user rows
 * removed this run; `rescheduled` is whether another run was scheduled
 * because the batch was full.
 */
export const purgeExpired = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; rescheduled: boolean }> => {
    // TODO: implement
    // 1. cutoff = Date.now() - ANONYMOUS_USER_MAX_AGE_MS
    // 2. candidates = ctx.db.query(TABLE_SLUG_USERS)
    //      .withIndex("by_creation_time", (q) => q.lt("_creationTime", cutoff))
    //      .filter((q) => q.eq(q.field("isAnonymous"), true))
    //      .take(ANONYMOUS_USER_PURGE_BATCH_SIZE)
    //    → candidates.length < ANONYMOUS_USER_PURGE_BATCH_SIZE means this is the last batch
    // 3. for each candidate user:
    //    a. delete every session row from TABLE_SLUG_SESSIONS.by_userId(userId)
    //    b. delete every account row from TABLE_SLUG_ACCOUNTS.by_userId(userId)
    //    c. delete every apikey row from TABLE_SLUG_API_KEYS.by_referenceId(userId)
    //    d. delete the user row itself
    // 4. if candidates.length === ANONYMOUS_USER_PURGE_BATCH_SIZE:
    //    → ctx.scheduler.runAfter(0, internal.auth.anonymousUsers.purgeExpired, {})
    //    → rescheduled = true
    // 5. return { deleted: candidates.length, rescheduled }
    // Edge cases:
    // - a candidate with no session/account/apikey rows: the per-index deletes
    //   are no-ops, not errors.
    // - zero candidates: return { deleted: 0, rescheduled: false } without
    //   scheduling anything.
    // - the explicit handler return type is required: the handler references
    //   its own `internal.auth.anonymousUsers.purgeExpired`, and without the
    //   annotation TypeScript reports a circular inferred type (TS7022).
    throw new Error("Not implemented")
  },
})
```

#### apps/www/convex/auth/anonymousUsers.test.ts

```ts
// @vitest-environment edge-runtime
import { internal } from "@convex/_generated/api"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

import { USER_ROLES } from "~/db/constants"
import { createConvexTest, insertTestUser } from "~/testing/createConvexTest"

describe("purgeExpired", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("deletes an anonymous user aged 25h along with its session, account and apikey", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId, sessionId } = await insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })
    const accountId = await t.run((ctx) =>
      ctx.db.insert("account", {
        accountId: String(userId),
        accessTokenExpiresAt: undefined,
        accessToken: undefined,
        createdAt: Date.now(),
        idToken: undefined,
        password: undefined,
        providerId: "anonymous",
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
        scope: undefined,
        updatedAt: Date.now(),
        userId: String(userId),
      }),
    )
    const apikeyId = await t.run((ctx) =>
      ctx.db.insert("apikey", {
        configId: "test-config",
        createdAt: Date.now(),
        key: "test-key",
        referenceId: String(userId),
        updatedAt: Date.now(),
      }),
    )

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 1, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(sessionId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(accountId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(apikeyId))).toBeNull()
  })

  it("keeps an anonymous user aged 1h", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId } = await insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })

    vi.setSystemTime(new Date("2026-11-06T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 0, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).not.toBeNull()
  })

  it("keeps a non-anonymous user aged 25h", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId } = await insertTestUser({ t, roles: [USER_ROLES.user] })

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 0, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).not.toBeNull()
  })

  it("reschedules itself when 201 expired anonymous users exceed one batch, and finishes draining both runs", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const userIds = await Promise.all(
      Array.from({ length: 201 }, () => insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })),
    )

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const firstRun = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})
    expect(firstRun).toEqual({ deleted: 200, rescheduled: true })

    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const remaining = await Promise.all(userIds.map(({ userId }) => t.run((ctx) => ctx.db.get(userId))))
    expect(remaining.every((user) => user === null)).toBe(true)
  })
})
```

#### apps/www/convex/crons.ts

```ts
import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

crons.hourly("purge expired anonymous users", { minuteUTC: 17 }, internal.auth.anonymousUsers.purgeExpired)

export default crons
```

Verify: `pnpm --filter www test -- anonymousUsers` passes; after deploy the Convex dashboard's Cron Jobs view lists "purge expired anonymous users", hourly at :17

### Step 6 — Auth rate limits with a proxy-attested client IP

`[agent]`

- [ ] `apps/www/src/db/constants/auth.ts`: `AUTH_RATE_LIMIT_HEADERS`, `AUTH_RATE_LIMITED_PATHS`, `AUTH_RATE_LIMIT_NAMES`
- [ ] `apps/www/src/env.mjs` + `.env.example`: `AUTH_PROXY_SECRET`
- [ ] `apps/www/src/auth/serverUtils.ts`: `withClientIpAttestation()`
- [ ] `apps/www/src/auth/server.ts`: exports the wrapped `handler`
- [ ] `apps/www/convex/auth/rateLimits.ts`: `authRateLimiter`, `hashClientIp()`, `limitAuthRequest()`
- [ ] `apps/www/convex/auth/rateLimits.test.ts`
- [ ] `apps/www/convex/http.ts`: `limitAuthRequest` before `auth.handler`
- [ ] `apps/www/convex/auth/options.ts`: `advanced.ipAddress.disableIpTracking: true`
- [ ] `[dev]` Generate and set `AUTH_PROXY_SECRET`

#### apps/www/src/db/constants/auth.ts

1 edit; everything not shown is unchanged (continues from step 5's additions).

**1 — append the rate-limit constants.**

```ts
/**
 * Header names the Next auth proxy (`src/auth/serverUtils.ts`'s
 * `withClientIpAttestation`) sets on every outgoing `/api/auth/*` request
 * before Better Auth forwards it to `.convex.site`, and that
 * `convex/auth/rateLimits.ts`'s `limitAuthRequest` reads on the Convex side.
 * `clientIp` carries the first `x-forwarded-for` value Vercel set; `proxySecret`
 * carries `AUTH_PROXY_SECRET`, proving the IP came from the Next proxy and
 * not a forged header on a direct `.convex.site` call.
 */
export const AUTH_RATE_LIMIT_HEADERS = {
  clientIp: "x-vex-client-ip",
  proxySecret: "x-vex-proxy-secret",
} as const

/**
 * Better Auth paths `limitAuthRequest` rate-limits per attested client IP.
 * Every other `/api/auth/*` path passes through unlimited.
 */
export const AUTH_RATE_LIMITED_PATHS = {
  anonymousSignIn: "/api/auth/sign-in/anonymous",
  emailSignUp: "/api/auth/sign-up/email",
} as const

/**
 * `authRateLimiter` limit names (`convex/auth/rateLimits.ts`). Shared with
 * `limitAuthRequest` so the path → limit-name mapping lives in one place.
 */
export const AUTH_RATE_LIMIT_NAMES = {
  anonymousSignInPerIp: "anonymousSignInPerIp",
  emailSignUpPerIp: "emailSignUpPerIp",
  globalUserCreation: "globalUserCreation",
  unattested: "unattested",
} as const
```

#### apps/www/src/env.mjs

2 edits; everything not shown is unchanged.

**1 — add `AUTH_PROXY_SECRET` to the `server` schema, beside `BETTER_AUTH_SECRET`.**

```js
  server: {
    AUTH_PROXY_SECRET: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
```

**2 — add it to `runtimeEnv`.**

```js
  runtimeEnv: {
    AUTH_PROXY_SECRET: process.env.AUTH_PROXY_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
```

#### apps/www/.env.example

1 edit; everything not shown is unchanged.

**1 — add `AUTH_PROXY_SECRET` beside `BETTER_AUTH_SECRET`.**

```
BETTER_AUTH_SECRET=e1520c5c9235154830f25dafe8a3e103f71462cdb136c0ed1571d1b43736f947
AUTH_PROXY_SECRET=
```

#### apps/www/src/auth/serverUtils.ts

1 edit; everything not shown is unchanged.

**1 — add `withClientIpAttestation`, after the existing imports.**

```ts
import { AUTH_RATE_LIMIT_HEADERS } from "~/db/constants"
import { env } from "~/env.mjs"

/**
 * Wraps a Better Auth Next.js route handler ({@link handler}'s `{ GET, POST }`
 * shape) so every proxied request carries proof of its client IP before
 * Better Auth forwards it to `.convex.site`. Vercel overwrites
 * `x-forwarded-for` with the real client IP and never forwards external IPs,
 * so its first value is trustworthy inside this handler. A caller hitting
 * `.convex.site` directly can forge any header, so the Convex side
 * (`convex/auth/rateLimits.ts`'s `limitAuthRequest`) only trusts these two
 * headers when `proxySecret` matches `AUTH_PROXY_SECRET`.
 *
 * Always overwrites any client-sent `AUTH_RATE_LIMIT_HEADERS` values on the
 * cloned request — a caller cannot smuggle its own attestation past this
 * proxy hop.
 *
 * @param props.handler the unwrapped `{ GET, POST }` handler from
 * `convexBetterAuthNextJs`.
 * @returns a `{ GET, POST }` handler with the same signature, each method
 * cloning its `Request` with `AUTH_RATE_LIMIT_HEADERS.clientIp` and
 * `AUTH_RATE_LIMIT_HEADERS.proxySecret` set before delegating to the
 * matching method on `props.handler`.
 */
export function withClientIpAttestation(props: {
  handler: { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> }
}): { GET: (request: Request) => Promise<Response>; POST: (request: Request) => Promise<Response> } {
  // TODO: implement
  // 1. attest(request):
  //    a. clientIp = first value of the incoming `x-forwarded-for` header
  //       (split on ",", trim, take [0]) → "" if the header is absent
  //    b. headers = new Headers(request.headers)
  //    c. headers.set(AUTH_RATE_LIMIT_HEADERS.clientIp, clientIp)
  //    d. headers.set(AUTH_RATE_LIMIT_HEADERS.proxySecret, env.AUTH_PROXY_SECRET)
  //       → overwrites any client-sent value for both headers
  //    e. → new Request(request, { headers })
  // 2. GET(request) → props.handler.GET(attest(request))
  // 3. POST(request) → props.handler.POST(attest(request))
  // Edge cases:
  // - no x-forwarded-for on a request that reaches this handler locally
  //   (:3030 direct, not through Vercel): clientIp attests as "", which
  //   limitAuthRequest treats as an empty rate-limit key, not as unattested —
  //   the proxy secret is what marks the request attested, not a non-empty IP.
  throw new Error("Not implemented")
}
```

#### apps/www/src/auth/server.ts

2 edits; everything not shown is unchanged.

**1 — import `withClientIpAttestation` and rename the destructured `handler`.** Anchored on the `convexBetterAuthNextJs({...})` destructuring assignment.

```ts
import { withClientIpAttestation } from "./serverUtils"

export const {
  fetchAuthAction,
  fetchAuthMutation,
  fetchAuthQuery,
  getToken: getTokenUncached,
  handler: rawHandler,
  isAuthenticated,
  preloadAuthQuery,
} = convexBetterAuthNextJs({
```

**2 — export the wrapped handler.** Anchored directly after the `convexBetterAuthNextJs({...})` call closes (before `export const getToken = cache(getTokenUncached)`).

```ts
export const handler = withClientIpAttestation({ handler: rawHandler })
```

#### apps/www/convex/auth/rateLimits.ts

```ts
import { HOUR, RateLimiter } from "@convex-dev/rate-limiter"

import { AUTH_RATE_LIMIT_HEADERS, AUTH_RATE_LIMIT_NAMES, AUTH_RATE_LIMITED_PATHS } from "~/db/constants"

import { components } from "../_generated/api"
import type { ActionCtx, MutationCtx } from "../_generated/server"

/**
 * Rate limits for `/api/auth/*` sign-in and sign-up traffic, keyed per
 * attested client IP (`hashClientIp`) or shared across one unattested bucket
 * for requests `limitAuthRequest` cannot verify came through the Next proxy.
 *
 * - `anonymousSignInPerIp` / `emailSignUpPerIp`: token buckets, so a burst up
 *   to `capacity` succeeds immediately and the rest refill at `rate`/`period`.
 * - `unattested`: one fixed-window bucket shared by every request that fails
 *   attestation, regardless of its claimed IP.
 * - `globalUserCreation`: one fixed-window bucket shared by all attested and
 *   unattested traffic together, capping total new-user creation regardless
 *   of how it is distributed across IPs.
 */
export const authRateLimiter = new RateLimiter(components.rateLimiter, {
  [AUTH_RATE_LIMIT_NAMES.anonymousSignInPerIp]: { capacity: 5, kind: "token bucket", period: HOUR, rate: 10 },
  [AUTH_RATE_LIMIT_NAMES.emailSignUpPerIp]: { capacity: 3, kind: "token bucket", period: HOUR, rate: 5 },
  [AUTH_RATE_LIMIT_NAMES.globalUserCreation]: { kind: "fixed window", period: HOUR, rate: 600 },
  [AUTH_RATE_LIMIT_NAMES.unattested]: { kind: "fixed window", period: HOUR, rate: 30 },
})

/**
 * Derives an `authRateLimiter` key for an attested client IP without storing
 * the raw IP anywhere.
 *
 * @param props.ip the attested client IP (`AUTH_RATE_LIMIT_HEADERS.clientIp`).
 * @param props.secret `AUTH_PROXY_SECRET`, folded into the hash so the key
 * space cannot be precomputed from the IP alone.
 * @returns a hex `SHA-256(secret + ":" + ip)` digest, via Convex's Web Crypto
 * (`crypto.subtle.digest`).
 */
export async function hashClientIp(props: { ip: string; secret: string }): Promise<string> {
  // TODO: implement
  // 1. data = new TextEncoder().encode(`${props.secret}:${props.ip}`)
  // 2. digest = await crypto.subtle.digest("SHA-256", data)
  // 3. → hex-encode `digest` (Array.from(new Uint8Array(digest)), map to
  //    2-digit hex, join "")
  throw new Error("Not implemented")
}

/**
 * Enforces `authRateLimiter` on `AUTH_RATE_LIMITED_PATHS` POST requests,
 * called from `convex/http.ts` before `createAuth(ctx).handler(request)` runs.
 *
 * A request is attested only when `AUTH_RATE_LIMIT_HEADERS.proxySecret`
 * matches `AUTH_PROXY_SECRET` — anything else, including a forged
 * `AUTH_RATE_LIMIT_HEADERS.clientIp` on a direct `.convex.site` call, draws
 * from the shared `unattested` bucket instead of a per-IP one.
 *
 * @param props.ctx the `httpAction` ctx in production; a mutation ctx in
 * tests. `authRateLimiter.limit` accepts both.
 * @param props.request the incoming `Request`.
 * @returns `null` when the request is not subject to a limit or passes every
 * applicable limit; a `429 Response` with a `Retry-After` header (seconds,
 * rounded up) when any applicable limit fails.
 * @throws never — rate-limit failures are returned as a `Response`, not
 * thrown.
 */
export async function limitAuthRequest(props: { ctx: ActionCtx | MutationCtx; request: Request }): Promise<Response | null> {
  // TODO: implement
  // 1. if props.request.method !== "POST" → return null
  // 2. path = new URL(props.request.url).pathname
  // 3. limitName = path === AUTH_RATE_LIMITED_PATHS.anonymousSignIn
  //      ? AUTH_RATE_LIMIT_NAMES.anonymousSignInPerIp
  //      : path === AUTH_RATE_LIMITED_PATHS.emailSignUp
  //      ? AUTH_RATE_LIMIT_NAMES.emailSignUpPerIp
  //      : null
  //    → limitName === null means this path is not rate-limited → return null
  // 4. secret = process.env.AUTH_PROXY_SECRET
  //    attested = secret !== undefined && props.request.headers.get(AUTH_RATE_LIMIT_HEADERS.proxySecret) === secret
  // 5. a. attested:
  //       key = await hashClientIp({ ip: props.request.headers.get(AUTH_RATE_LIMIT_HEADERS.clientIp) ?? "", secret })
  //       firstResult = await authRateLimiter.limit(props.ctx, limitName, { key })
  //    b. not attested:
  //       firstResult = await authRateLimiter.limit(props.ctx, AUTH_RATE_LIMIT_NAMES.unattested, {})
  //    → !firstResult.ok → return tooManyRequests(firstResult.retryAfter) (step 7), WITHOUT touching the global bucket
  // 6. globalResult = await authRateLimiter.limit(props.ctx, AUTH_RATE_LIMIT_NAMES.globalUserCreation, {})
  //    → !globalResult.ok → return tooManyRequests(globalResult.retryAfter)
  //    → otherwise return null
  // 7. tooManyRequests(retryAfterMs) → new Response(null, { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } })
  // Edge cases:
  // - a request rejected by its per-IP or unattested bucket must not consume a
  //   global token; otherwise one IP spamming past its own limit would drain
  //   the global bucket and block sign-ups for everyone.
  // - AUTH_PROXY_SECRET unset on the deployment: nothing is attested, so
  //   every request draws from `unattested` (fails safe).
  // - attested with an empty clientIp header (the proxy saw no
  //   x-forwarded-for, i.e. local dev): limited under the hash of "", not
  //   routed to `unattested`; only a secret mismatch routes there.
  throw new Error("Not implemented")
}
```

#### apps/www/convex/auth/rateLimits.test.ts

```ts
// @vitest-environment edge-runtime
import { afterEach, describe, expect, it, vi } from "vitest"

import { AUTH_RATE_LIMIT_HEADERS } from "~/db/constants"
import { createConvexTest } from "~/testing/createConvexTest"

import { hashClientIp, limitAuthRequest } from "./rateLimits"

const SECRET = "test-proxy-secret"

function attestedRequest(props: { ip: string; path: string }) {
  return new Request(`https://example.convex.site${props.path}`, {
    headers: {
      [AUTH_RATE_LIMIT_HEADERS.clientIp]: props.ip,
      [AUTH_RATE_LIMIT_HEADERS.proxySecret]: SECRET,
    },
    method: "POST",
  })
}

function forgedRequest(props: { ip: string; path: string }) {
  return new Request(`https://example.convex.site${props.path}`, {
    headers: {
      [AUTH_RATE_LIMIT_HEADERS.clientIp]: props.ip,
      [AUTH_RATE_LIMIT_HEADERS.proxySecret]: "wrong-secret",
    },
    method: "POST",
  })
}

describe("limitAuthRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns null for a non-limited path", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    const result = await t.run((ctx) =>
      limitAuthRequest({ ctx, request: attestedRequest({ ip: "203.0.113.7", path: "/api/auth/get-session" }) }),
    )

    expect(result).toBeNull()
  })

  it("allows 5 attested anonymous sign-ins from one IP, then 429s the 6th with a positive Retry-After", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 5; i++) {
      const result = await t.run((ctx) =>
        limitAuthRequest({ ctx, request: attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }) }),
      )
      expect(result).toBeNull()
    }

    const sixth = await t.run((ctx) =>
      limitAuthRequest({ ctx, request: attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }) }),
    )

    expect(sixth).not.toBeNull()
    expect(sixth?.status).toBe(429)
    expect(Number(sixth?.headers.get("Retry-After"))).toBeGreaterThan(0)
  })

  it("still allows a different attested IP after the first IP is exhausted", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 6; i++) {
      await t.run((ctx) =>
        limitAuthRequest({ ctx, request: attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }) }),
      )
    }

    const otherIp = await t.run((ctx) =>
      limitAuthRequest({ ctx, request: attestedRequest({ ip: "198.51.100.1", path: "/api/auth/sign-in/anonymous" }) }),
    )

    expect(otherIp).toBeNull()
  })

  it("draws a forged client-IP header with the wrong secret from the shared unattested bucket, regardless of the claimed IP", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 30; i++) {
      const result = await t.run((ctx) =>
        limitAuthRequest({
          ctx,
          request: forgedRequest({ ip: `203.0.113.${i}`, path: "/api/auth/sign-in/anonymous" }),
        }),
      )
      expect(result).toBeNull()
    }

    const thirtyFirst = await t.run((ctx) =>
      limitAuthRequest({ ctx, request: forgedRequest({ ip: "203.0.113.99", path: "/api/auth/sign-in/anonymous" }) }),
    )

    expect(thirtyFirst?.status).toBe(429)
  })
})

describe("hashClientIp", () => {
  it("is deterministic for the same ip and secret", async () => {
    const first = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })
    const second = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })

    expect(first).toBe(second)
  })

  it("does not contain the raw ip", async () => {
    const hash = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })

    expect(hash).not.toContain("203.0.113.7")
  })
})
```

#### apps/www/convex/http.ts

1 edit; everything not shown is unchanged.

**1 — call `limitAuthRequest` before `createAuth`.** Anchored on the `authRequestHandler`'s `try` block.

```ts
import { limitAuthRequest } from "./auth/rateLimits"

  try {
    const limited = await limitAuthRequest({ ctx, request })
    if (limited) {
      return limited
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const auth = createAuth(ctx)
    return await auth.handler(request)
```

#### apps/www/convex/auth/options.ts

1 edit; everything not shown is unchanged.

**1 — add `ipAddress.disableIpTracking` under `advanced`.** Anchored on the existing `advanced:` key.

```ts
  advanced: { cookiePrefix: AUTH_COOKIE_PREFIX, ipAddress: { disableIpTracking: true } },
```

- [ ] `[dev]` Generate the secret (`pnpm --filter www secret:create`). Set it as `AUTH_PROXY_SECRET` in Vercel (www, Production + Preview) and on the dev and prod Convex deployments

Verify: `pnpm --filter www test -- rateLimits` passes. Against the dev deployment through `localhost:3030`, 6 POSTs to `/api/auth/sign-in/anonymous`, each carrying `x-forwarded-for: 203.0.113.7` → the 6th gets `429` with `Retry-After`. A direct `curl` to the dev `.convex.site` URL with a forged `x-vex-client-ip` draws from the shared unattested bucket, not a per-IP one

### Step 7 — Roles guard: adapters declare client-writable user fields

`[agent]`

**Blocked on:** M (`2026-10-26-build-time-telemetry`) being committed. `packages/core/src/config/config.ts` carries M's unstaged telemetry work; the anchored edits below assume that work has already landed, and are written against the file as it reads today (`server?.auth` block, `diffAuthCollections` check, `telemetry.hideLogs` in the return). Re-anchor against the real post-M file if any of those identifiers moved.

Why: step 1 fixes five copies of the same mistake by hand. This makes the next copy fail at `vex dev` instead of shipping a privilege escalation — `defineServerConfig` throws the moment `access.userRolesField` is a field the registered auth adapter reports as client-writable.

- [ ] `packages/core/src/auth/types.ts`: `VexAuthAdapter.clientWritableUserFields?: readonly string[]`
- [ ] `packages/core/src/config/assertRolesFieldNotClientWritable.ts`: new guard, called from `defineServerConfig`
- [ ] `packages/core/src/config/config.ts`: `defineServerConfig` throws `VexAuthConfigError` when `access.userRolesField` is client-writable
- [ ] `packages/core/src/config/config.test.ts`: cases in the existing `describe("defineServerConfig")`
- [ ] `packages/better-auth/src/adapter.ts`: `clientWritableUserFields` from the merged user table's fields where `input !== false`
- [ ] `packages/better-auth/src/adapter.test.ts`: cases in the existing `describe("betterAuthAdapter")` plus a new one
- [ ] `apps/docs/src/content/docs/guides/auth.mdx`: why `roles` needs `input: false`, and the error it raises
- [ ] `.changeset/auth-roles-guard.md`: `@vexcms/core` + `@vexcms/better-auth` patch (P-025)

#### packages/core/src/auth/types.ts

1 edit; everything not shown is unchanged.

**1 — add `clientWritableUserFields` to `VexAuthAdapter`, after `userCollection`.**

```ts
  /**
   * The slug of the collection that stores user documents.
   *
   * Used by the admin panel to resolve user references and by auth-aware
   * components to look up the current user collection.
   */
  readonly userCollection: CollectionSlug;

  /**
   * Field names on the user collection an end user can set directly
   * through the auth provider's own public endpoints (sign-up,
   * update-profile), as opposed to fields only server-trusted code can
   * write.
   *
   * `defineServerConfig` throws `VexAuthConfigError` when
   * `config.access.userRolesField` appears in this list for the
   * collection named by `userCollection` — a role field an end user can
   * set directly is a privilege-escalation path. Omitting this property
   * (`undefined`) skips the check entirely; an adapter that cannot
   * determine writability should leave it unset rather than guess.
   *
   * @see {@link assertRolesFieldNotClientWritable} for the check
   */
  readonly clientWritableUserFields?: readonly string[];
}
```

Verify: `pnpm --filter @vexcms/core typecheck`.

#### packages/core/src/config/assertRolesFieldNotClientWritable.ts

```ts
import type { VexAccessConfig } from "../access";
import { VexAuthConfigError, type VexAuthAdapter } from "../auth/types";

/**
 * Throws when the access config's role field can be set directly by an end
 * user through the registered auth adapter's user collection, instead of
 * only by server-trusted code.
 *
 * Runs only when an auth adapter is registered and `config.access` is
 * configured — neither check has anything to compare without both.
 *
 * @param props.access - The resolved access config, when one is
 *   configured. `undefined` means no RBAC is configured, so there is no
 *   role field to protect.
 * @param props.adapter - The registered auth adapter.
 * @throws {VexAuthConfigError} When `props.access.userRolesField` is listed
 *   in `props.adapter.clientWritableUserFields` for the collection named
 *   by `props.adapter.userCollection`, and that collection matches
 *   `props.access.userCollectionSlug`.
 * @see {@link defineServerConfig} — the only caller
 */
export function assertRolesFieldNotClientWritable(props: {
  access: VexAccessConfig | undefined;
  adapter: VexAuthAdapter;
}): void {
  // TODO: implement
  // 1. If props.access is undefined → return (no RBAC configured, nothing to protect).
  // 2. If props.adapter.userCollection !== props.access.userCollectionSlug → return
  //    (the role field lives on a collection this adapter doesn't manage).
  // 3. If props.adapter.clientWritableUserFields is undefined → return
  //    (the adapter doesn't report which user fields are client-writable).
  // 4. If props.adapter.clientWritableUserFields.includes(props.access.userRolesField):
  //    a. → throw new VexAuthConfigError(
  //         `The access config's userRolesField "${props.access.userRolesField}" is ` +
  //         `client-writable through the "${props.adapter.name}" adapter's ` +
  //         `"${props.adapter.userCollection}" collection. Mark it input: false ` +
  //         `wherever your auth provider configures field writability, so end users ` +
  //         `cannot set their own role.`,
  //       )
  // 5. Otherwise → return.
  // Edge cases:
  // - An empty clientWritableUserFields array means no field is writable; never throws.
  throw new Error("Not implemented");
}
```

Verify: `pnpm --filter @vexcms/core typecheck`.

#### packages/core/src/config/config.ts

3 edits; everything not shown is unchanged.

**1 — import the new guard, beside the `diffAuthCollections` import.**

```ts
import { diffAuthCollections } from "./diffAuthCollections";
import { assertRolesFieldNotClientWritable } from "./assertRolesFieldNotClientWritable";
```

**2 — `defineServerConfig`'s JSDoc, a new `@throws` beside the existing `VexAuthConfigError` one.**

```ts
 * @throws {VexAuthConfigError} When `config.authCollections` disagrees with the
 *   registered auth adapter's collections.
 * @throws {VexAuthConfigError} When `config.access.userRolesField` is
 *   client-writable through the registered auth adapter's user collection.
```

**3 — call the guard inside the existing `if (server?.auth)` block, after the divergence check.**

```ts
    if (divergence !== null) {
      throw new VexAuthConfigError(
        `The auth collections declared in the client config disagree with the ` +
          `"${server.auth.adapter.name}" adapter: ${divergence}. Update the client config's ` +
          `authCollections call to match your auth options.`,
      );
    }
    assertRolesFieldNotClientWritable({ access: config.access, adapter: server.auth.adapter });
  }
```

Verify: `pnpm --filter @vexcms/core test -- config`.

#### packages/core/src/config/config.test.ts

3 edits; everything not shown is unchanged.

**1 — import `defineAccess` and `WILDCARD_KEY` beside the existing `"../"` import, and widen `makeMockAuthAdapter`.**

```ts
import {
  defineConfig,
  defineServerConfig,
  defineCollection,
  defineAccess,
  text,
  upload,
  richtext,
  WILDCARD_KEY,
  DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
} from "../";
```

**2 — widen `makeMockAuthAdapter` to accept the client-writable list, beside its current definition.**

```ts
function makeMockAuthAdapter(
  collections: VexAuthAdapter["collections"] = [],
  clientWritableUserFields?: readonly string[],
): VexAuthAdapter {
  return {
    name: "mock-auth",
    collections,
    userCollection: "users",
    clientWritableUserFields,
  } as unknown as VexAuthAdapter;
}
```

**3 — new cases, pasted before the closing `});` of `describe("defineServerConfig", ...)`.**

```ts
  const usersWithRoles = defineCollection({
    slug: "users",
    fields: { email: text(), roles: text() },
  });

  const rolesAccess = defineAccess({
    roles: ["admin", "user"] as const,
    resources: [usersWithRoles],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: { admin: { [WILDCARD_KEY]: true } },
  });

  it("throws when the access role field is client-writable on the adapter's user collection", () => {
    const client = defineConfig({ access: rolesAccess, authCollections: [usersWithRoles] });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([usersWithRoles], ["roles"]) } },
      }),
    ).toThrow(VexAuthConfigError);
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([usersWithRoles], ["roles"]) } },
      }),
    ).toThrow(/"roles" is client-writable through the "mock-auth" adapter/);
  });

  it("does not throw when the role field is not in the adapter's client-writable list", () => {
    const client = defineConfig({ access: rolesAccess, authCollections: [usersWithRoles] });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([usersWithRoles], ["name"]) } },
      }),
    ).not.toThrow();
  });

  it("does not throw when the adapter omits clientWritableUserFields", () => {
    const client = defineConfig({ access: rolesAccess, authCollections: [usersWithRoles] });
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: makeMockAuthAdapter([usersWithRoles]) } },
      }),
    ).not.toThrow();
  });

  it("does not throw when the adapter's user collection differs from access.userCollectionSlug", () => {
    const client = defineConfig({ access: rolesAccess, authCollections: [usersWithRoles] });
    const differentUserCollectionAdapter = {
      name: "mock-auth",
      collections: [usersWithRoles],
      userCollection: "accounts",
      clientWritableUserFields: ["roles"],
    } as unknown as VexAuthAdapter;
    expect(() =>
      defineServerConfig({
        config: client,
        server: { auth: { adapter: differentUserCollectionAdapter } },
      }),
    ).not.toThrow();
  });
```

Verify: `pnpm --filter @vexcms/core test -- config`.

#### packages/better-auth/src/adapter.ts

2 edits; everything not shown is unchanged.

**1 — new helper, directly above `export function betterAuthAdapter`.**

```ts
/**
 * Lists the user table's field names an end user can set directly through
 * Better Auth's public endpoints (sign-up, update-user).
 *
 * @param props.fields - The merged `DBFieldAttribute` map for the user
 *   table (`tables.user.fields`). `getAuthTables` already spreads
 *   `config.user.additionalFields` into this map, so no separate merge is
 *   needed here.
 * @returns Field names whose `input` is not explicitly `false`.
 */
function getClientWritableUserFields(props: {
  fields: Record<string, DBFieldAttribute>;
}): readonly string[] {
  // TODO: implement
  // 1. Object.entries(props.fields)
  // 2. Filter to [name, attr] pairs where attr.input !== false
  //    → Better Auth treats a field as writable unless it explicitly sets
  //      `input: false`, so an omitted `input` counts as writable.
  // 3. → map the filtered pairs to field names and return.
  throw new Error("Not implemented");
}

export function betterAuthAdapter(props?: BetterAuthAdapterOptions): VexAuthAdapter {
```

**2 — the return statement, adding `clientWritableUserFields`.**

```ts
  const userSlug = tables.user?.modelName ?? "user";
  return {
    name: "better-auth",
    collections,
    userCollection: userSlug as CollectionSlug,
    clientWritableUserFields: tables.user
      ? getClientWritableUserFields({ fields: tables.user.fields })
      : undefined,
  };
}
```

Verify: `pnpm --filter @vexcms/better-auth test -- adapter`.

#### packages/better-auth/src/adapter.test.ts

1 edit; everything not shown is unchanged.

**1 — new `describe` block, pasted after the closing `});` of `describe("betterAuthAdapter", ...)`.**

```ts
describe("betterAuthAdapter — clientWritableUserFields", () => {
  it("lists an additionalField without input: false", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            roles: { type: "string[]", defaultValue: ["user"], required: true },
          },
        },
      },
    });
    expect(adapter.clientWritableUserFields).toContain("roles");
  });

  it("excludes an additionalField marked input: false", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            roles: {
              type: "string[]",
              defaultValue: ["user"],
              required: true,
              input: false,
            },
          },
        },
      },
    });
    expect(adapter.clientWritableUserFields).not.toContain("roles");
  });

  it("excludes the built-in emailVerified field", () => {
    const adapter = betterAuthAdapter();
    expect(adapter.clientWritableUserFields).not.toContain("emailVerified");
  });

  it("excludes the admin plugin's role field", () => {
    const adapter = betterAuthAdapter({ config: { plugins: [admin()] } });
    expect(adapter.clientWritableUserFields).not.toContain("role");
  });
});
```

Verify: `pnpm --filter @vexcms/better-auth test -- adapter`.

#### apps/docs/src/content/docs/guides/auth.mdx

1 edit; everything not shown is unchanged.

**1 — new subsection, pasted after the `### The client-safe schema module` section (after its closing paragraph ending "…so the client-safe half lives on its own and `options.ts` spreads it instead."), before `### Building the auth collections`.**

````md
### Why `roles` needs `input: false`

Any `additionalFields` entry without `input: false` is writable by the caller through
Better Auth's own `/sign-up/email` and `/update-user` endpoints — including a role
field. Without it, anyone can sign up with `roles: ["admin"]` and the value is stored
as given.

`betterAuthAdapter()` reports every such field as `clientWritableUserFields` on the
`VexAuthAdapter` it returns, and `defineServerConfig` throws `VexAuthConfigError` at
`vex dev` (and in any test that imports the server config) when `access.userRolesField`
is one of them:

```
VexAuthConfigError: The access config's userRolesField "roles" is client-writable
through the "better-auth" adapter's "user" collection. Mark it input: false wherever
your auth provider configures field writability, so end users cannot set their own
role.
```

The fix is the `input: false` shown in the example above — add it to the field's entry
in `authSchema.user.additionalFields`, and to the matching entry if `options.ts`
redeclares the type rather than spreading `schemaOptions`.
````

Verify: `pnpm --filter docs build`.

#### .changeset/auth-roles-guard.md

```md
---
"@vexcms/core": patch
"@vexcms/better-auth": patch
---

`defineServerConfig` now throws `VexAuthConfigError` when `access.userRolesField` is
client-writable through the registered auth adapter's user collection. A role field that
end users can set through sign-up or profile update is a privilege escalation, and it now
fails at `vex dev` instead of shipping.

**`VexAuthAdapter` gains an optional `clientWritableUserFields`.** `betterAuthAdapter()`
fills it from the merged user table's fields (including `user.additionalFields`) where
`input !== false`. Any other adapter that wants this check opts in the same way;
omitting the property skips the check entirely.

**Upgrade note.** If `access.userRolesField` names a field your auth provider lets end
users set directly, `vex dev` and anything importing your server config now fails
immediately with `VexAuthConfigError` naming the field, the adapter and the fix — add
`input: false` to that field's definition (for Better Auth, in
`authSchema.user.additionalFields` and the matching entry passed to `betterAuth()`).
```

Verify: `pnpm --filter @vexcms/core test -- config && pnpm --filter @vexcms/better-auth test -- adapter`.

### Step 8 — Live read-only proof on production

`[agent]`

Why: step 3 proves the access matrix in-process, against a convex-test sandbox. This proves the deployed environment — real auth, real rate limiter, real network path — the way the launch plan asks.

- [ ] `[dev]` Deploy `apps/www` with steps 1–7 applied (Vercel production + `convex deploy`); give the agent CLI access to the prod Convex project (`usable-bee-730`) so `npx convex run … --prod` and `npx convex data … --prod` work
- [ ] `npx convex run <fn> '<args>' --prod`, for all 14 public mutations, once with no identity and once with `--identity '{"subject":"<probe user id>","email":"<probe user email>"}'` for a throwaway `user`-role account — each call rejected (or, for `firstUser.promoteFirstAdmin` with an admin already present, returns `{ promoted: false }`)
- [ ] `curl` checks: sign-up with `roles: ["admin"]` stores `["user"]`; `update-user` with `roles` is rejected; `POST /api/vex/revalidate` with no session is rejected; the 6th `sign-in/anonymous` from one IP gets `429`
- [ ] `live-proof.md` in this spec folder, one row per probe, every row passing
- [ ] Delete the probe user and its sessions; the cron (step 5) purges any leftover anonymous probe users within 24h

#### live-proof.md

New file in `.agent/docs/specs/2026-11-06-launch-infrastructure/`, filled in as each probe runs. `<probe-user-id>` / `<probe-user-email>` come from the sign-up probe in § A, which must run first since §§ B–C reuse that account.

```md
# Live read-only proof — production

Run date: ____  Prod deployment: `usable-bee-730` (`https://usable-bee-730.convex.site`)  Site: `https://vexcms.dev`

## A — Create the probe user

| Probe | Command | Expected | Observed | Pass |
|---|---|---|---|---|
| sign-up with `roles: ["admin"]` is downgraded | `curl -i -X POST https://vexcms.dev/api/auth/sign-up/email -H 'Content-Type: application/json' -d '{"email":"<probe-user-email>","password":"<probe-password>","name":"live-proof probe","roles":["admin"]}'` | `200`, response body's `user.roles` is `["user"]` | | |
| stored roles confirmed server-side | `npx convex data user --prod \| grep -A3 '"email": "<probe-user-email>"'` | row shows `"roles": ["user"]`, not `["admin"]` | | |

Record the returned `user.id` as `<probe-user-id>` and the session cookie from the
`Set-Cookie` response header as `<probe-session-cookie>` — both are reused below.

## B — Public mutations, no identity and a `user`-role identity

Each row run twice: first with no `--identity` flag, then with
`--identity '{"subject":"<probe-user-id>","email":"<probe-user-email>"}'`. Every call is
rejected unless noted.

| # | Function | Args | Caller | Expected | Observed | Pass |
|---|---|---|---|---|---|---|
| 1 | `api.vex.create` | `{"collection":"pages","data":{"title":"probe","slug":"live-proof-probe","blocks":[]}}` | none | rejected | | |
| 2 | `api.vex.create` | (same) | user | rejected | | |
| 3 | `api.vex.update` | `{"collection":"pages","id":"<existing-page-id>","data":{"title":"hacked"}}` | none | rejected | | |
| 4 | `api.vex.update` | (same) | user | rejected | | |
| 5 | `api.vex.remove` | `{"collection":"pages","ids":["<existing-page-id>"]}` | none | rejected | | |
| 6 | `api.vex.remove` | (same) | user | rejected | | |
| 7 | `api.vex.saveView` | `{"collection":"pages","view":{"name":"probe-view","filters":[]}}` | none | rejected | | |
| 8 | `api.vex.saveView` | (same) | user | rejected | | |
| 9 | `api.vex.removeView` | `{"collection":"pages","viewId":"<existing-view-id>"}` | none | rejected | | |
| 10 | `api.vex.removeView` | (same) | user | rejected | | |
| 11 | `api.vex.globals.upsert` | `{"slug":"siteSettings","data":{"siteName":"hacked"}}` | none | rejected | | |
| 12 | `api.vex.globals.upsert` | (same) | user | rejected | | |
| 13 | `api.vex.media.generateUploadUrl` | `{"adapter":"convex","collection":"images"}` | none | rejected | | |
| 14 | `api.vex.media.generateUploadUrl` | (same) | user | rejected | | |
| 15 | `api.vex.media.createMediaDocument` | `{"adapter":"convex","collectionSlug":"images","filename":"probe.png","mimeType":"image/png","size":1,"storageId":"<fake-storage-id>"}` | none | rejected | | |
| 16 | `api.vex.media.createMediaDocument` | (same) | user | rejected | | |
| 17 | `api.vex.media.deleteMedia` | `{"adapter":"convex","mediaId":"<existing-media-id>"}` | none | rejected | | |
| 18 | `api.vex.media.deleteMedia` | (same) | user | rejected | | |
| 19 | `api.vex.versions.saveDraft` | `{"collection":"pages","id":"<existing-page-id>","data":{"title":"hacked-draft"}}` | none | rejected | | |
| 20 | `api.vex.versions.saveDraft` | (same) | user | rejected | | |
| 21 | `api.vex.versions.publish` | `{"collection":"pages","id":"<existing-page-id>"}` | none | rejected | | |
| 22 | `api.vex.versions.publish` | (same) | user | rejected | | |
| 23 | `api.vex.versions.unpublish` | `{"collection":"pages","id":"<existing-page-id>"}` | none | rejected | | |
| 24 | `api.vex.versions.unpublish` | (same) | user | rejected | | |
| 25 | `api.vex.versions.deleteVersion` | `{"collection":"pages","id":"<existing-page-id>","version":1}` | none | rejected | | |
| 26 | `api.vex.versions.deleteVersion` | (same) | user | rejected | | |
| 27 | `api.vex.firstUser.promoteFirstAdmin` | `{}` | none | rejected (`ConvexError: Not authenticated`) | | |
| 28 | `api.vex.firstUser.promoteFirstAdmin` | `{}` | user (identity email = `<probe-user-email>`) | `{ promoted: false }` — an admin already exists on prod | | |

Each row's command: `npx convex run <Function> '<Args>' --prod` for "none", and
`npx convex run <Function> '<Args>' --prod --identity '{"subject":"<probe-user-id>","email":"<probe-user-email>"}'`
for "user".

## C — curl checks

| Probe | Command | Expected | Observed | Pass |
|---|---|---|---|---|
| `update-user` rejects a `roles` write | `curl -i -X POST https://vexcms.dev/api/auth/update-user -H 'Content-Type: application/json' -H 'Cookie: <probe-session-cookie>' -d '{"roles":["admin"]}'` | `roles` unchanged in the response body (still `["user"]`); confirm via `npx convex data user --prod` | | |
| revalidate requires a session | `curl -i -X POST https://vexcms.dev/api/vex/revalidate` | `401` or `403`, no session cookie sent | | |
| anonymous sign-in rate limit trips on the 6th request from one IP | `for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code}\n' -X POST https://vexcms.dev/api/auth/sign-in/anonymous; done` (Vercel overwrites `x-forwarded-for` with the caller's real IP, so all six count against this machine's IP) | requests 1–5 return `200`, request 6 returns `429` with a `Retry-After` header | | |

## Cleanup

- [ ] Delete the § A probe user and its `session` rows as the admin: Convex dashboard → `usable-bee-730` → Data → `user` (filter by `<probe-user-email>`) → delete, then `session` rows whose `userId` is `<probe-user-id>`
- [ ] Confirm the probe user and its `session`/`account`/`apikey` rows are gone: `npx convex data user --prod \| grep '<probe-user-email>'` returns nothing
- [ ] Any anonymous probe users created incidentally (e.g. during the rate-limit check) are left for the hourly purge cron (step 5) — no manual deletion needed, they clear within 24h
```

Verify: every row in `live-proof.md` is marked pass.

### Step 9 — Convex Starter, spending limits, usage alerts, sizing

`[dev]`

Why: on Free, writes may start failing once a resource's monthly cap is hit, and spending limits are a paid-subscription feature (`sources.md` §8). Decided: move to Starter now, measure real usage, then size the budget from measurements instead of guesses (AP-026).

- [ ] `[dev]` Move the Convex team to the Starter plan
- [ ] `[dev]` Set the spending-limit warning and disable thresholds on the team billing page
- [ ] `[dev]` Turn on usage notifications for `apps/www` prod (`usable-bee-730`) and for M's telemetry receiver deployment (wherever M step 10 deploys it)
- [ ] `[agent]` Measure Convex function calls, database bandwidth and HTTP action calls per anonymous visit, using the browser tool on production plus the dashboard's per-function call counts
- [ ] `sizing.md` in this spec folder

#### Dashboard actions (developer)

1. **Plan.** Convex dashboard → team settings → **Billing** → **Change plan** → **Starter**. Starter keeps the Free plan's S16 deployment class and quotas but bills pay-as-you-go beyond them instead of failing writes (`sources.md` §8).
2. **Spending limits.** Same **Billing** page, **Spending limits** section:
   - **Warning threshold** (soft — email notification only, no functional effect): suggested **$20/month**, covering roughly one Starter-plan resource's worth of overage before anyone reacts. Developer fills in the actual value: **$______/month**.
   - **Disable threshold** (hard — exceeding it disables every project on the team): suggested **$100/month**, high enough that ordinary launch-week traffic won't trip it, low enough that a runaway script or attack doesn't produce a surprise bill. Developer fills in the actual value: **$______/month**.
3. **Usage notifications.** Team settings → **Usage** → enable email notifications for both `usable-bee-730` (`apps/www` prod) and M's telemetry receiver deployment (check `2026-10-26-build-time-telemetry`'s step 10 for the deployment name — this spec does not create or know it).

#### Measurement method (agent)

1. With the browser tool, open `https://vexcms.dev/` signed out and open the Network tab (or the browser tool's equivalent request log).
2. Record, for this single visit:
   - the Convex WebSocket connection's **query subscriptions** (each `query` the client subscribes to — e.g. count distinct query names in the WS frames, or the Convex client devtools if attached)
   - any Convex **HTTP action** calls (requests to `https://usable-bee-730.convex.site/*` outside the WebSocket, e.g. `/api/auth/*`)
3. Repeat for `/features`, `/admin` (signed out: the read-only demo panel's dashboard), and one collection list view inside that same signed-out panel (e.g. `/admin/collections/testimonials`). Every step stays signed out, matching an anonymous launch visitor; create no user for this measurement.
4. Cross-check against the Convex dashboard's **Health → Functions** tab, filtered to the last hour covering this session, reading each function's **call count** directly rather than relying only on the browser-side count.
5. Sum the per-visit call count across pages into one "anonymous visit" figure (home → `/features` → `/admin` → one list view).

#### sizing.md

```md
# Convex sizing — launch

Plan: Starter  Warning threshold: $______/month  Disable threshold: $______/month
Notification recipients: ______

Measured: ______ (date), browser-tool walkthrough of https://vexcms.dev/ —
home → /features → /admin (signed out, read-only demo) → one list view
(signed out)

| Resource | Starter included quota (sources.md §8) | Measured per anonymous visit | Projected, 10k visitors/mo | Projected, 50k visitors/mo | Headroom at 50k |
|---|---|---|---|---|---|
| Function calls | 1,000,000/month | ______ calls | ______ | ______ | ______ |
| Database I/O (bandwidth) | 1 GB/month | ______ | ______ | ______ | ______ |
| Action compute | 20 GB-hours/month | ______ | ______ | ______ | ______ |
| HTTP action calls | counted within function calls, above | ______ calls | ______ | ______ | ______ |
| Database storage | 0.5 GB total | n/a — cumulative, not per-visit | — | — | ______ (current usage vs. cap) |
| File storage | 1 GB total | n/a — cumulative, not per-visit | — | — | ______ (current usage vs. cap) |
| File data egress | 1 GB/month | ______ (media-heavy pages only) | ______ | ______ | ______ |

Notes:
- "Projected" = measured per-visit figure × visitor count; function-call and
  database-I/O projections are what decide whether Starter's pay-as-you-go overage
  stays within the disable threshold above.
- Database storage and file storage don't scale with visit count — they grow with
  content volume, not traffic — so they're sized against current usage, not projected.
```

Verify: `sizing.md` records the plan, both thresholds, the alert recipients, the measured calls per visit, and a 50k-visitor projection with headroom for every resource row.

### Step 10 — `/tour` static demo fallback

`[agent]`

- [ ] `apps/www/src/lib/routes.ts`: `TOUR_PATH`
- [ ] `apps/www/src/app/tour/page.tsx`: `force-static`, `<ThemeStyle />` (baked in at build), `next/image` with fixed dimensions, `robots: { index: false }`
- [ ] `apps/www/src/app/(vexcms)/admin/error.tsx`: client error boundary → "Demo unavailable" with links to `/tour` and retry
- [ ] `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`: redirect to `/tour` when session verification fails (Convex unreachable)
- [ ] `apps/www/public/tour/*.png`: four 1280×800 screenshots of the local admin (dashboard, list view with a saved view, edit view with live preview, media library), captured with the browser tool against :3030 — attach the captures, never start a server

#### apps/www/src/lib/routes.ts

`TOUR_PATH` is a Next.js route, not a Convex table/content slug, so it lives beside the other `src/lib/` helpers rather than in `src/db/constants/` — that directory is reserved for the data model (table slugs, content-type unions) and Better Auth config.

```ts
/**
 * The static demo-unavailable fallback route. Served from `app/tour/page.tsx`
 * with `dynamic = "force-static"`, so it renders with no Convex dependency —
 * the target for every redirect that fires when the backend itself is what
 * failed.
 */
export const TOUR_PATH = "/tour";
```

#### apps/www/src/app/tour/page.tsx

Mirrors `app/unauthorized/page.tsx`: outside every route group, so it emits `<ThemeStyle />` itself. `dynamic = "force-static"` bakes the theme CSS in at build time — the whole point of this route is that it renders with no live Convex read.

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants, cn } from "@vexcms/react";

import { Container } from "~/components/Container";
import { ThemeStyle } from "~/components/ThemeStyle";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tour",
  robots: { index: false },
};

const TOUR_SHOTS = [
  {
    src: "/tour/dashboard.png",
    alt: "The admin panel's collections and globals overview, with live document counts.",
    caption: "Every collection and global, with live document counts.",
  },
  {
    src: "/tour/list-view.png",
    alt: "A collection list view with a saved view applied, showing sortable columns and pagination.",
    caption: "List view — search, sort, and saved views.",
  },
  {
    src: "/tour/edit-view-live-preview.png",
    alt: "A document edit view with live preview streaming unsaved changes onto the real page.",
    caption: "Edit view — live preview of unsaved changes.",
  },
  {
    src: "/tour/media-library.png",
    alt: "The media library, showing a searchable, paginated grid of uploaded files.",
    caption: "Media library — search, upload, and pick.",
  },
] as const;

/**
 * Static stand-in for the live demo. Rendered once at build time with no
 * Convex read at request time, so it still serves while the backend the demo
 * depends on is down or over its limits.
 */
export default function TourPage() {
  return (
    <>
      <ThemeStyle />
      <Container className="py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          See the admin panel
        </h1>
        <p className="mt-4 max-w-[46rem] text-muted-foreground">
          The live demo is temporarily unavailable. These screenshots show the same admin panel
          it runs.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {TOUR_SHOTS.map((shot) => (
            <figure key={shot.src}>
              <Image
                alt={shot.alt}
                className="rounded-lg border"
                height={800}
                sizes="(min-width: 640px) 50vw, 100vw"
                src={shot.src}
                width={1280}
              />
              <figcaption className="mt-2 text-sm text-muted-foreground">
                {shot.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className={cn(buttonVariants({ variant: "default" }))}
            href="https://docs.vexcms.dev/guides/quickstart/"
          >
            Read the quickstart
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline" }))}
            href="https://github.com/ianyimi/vex"
          >
            View on GitHub
          </Link>
        </div>
      </Container>
    </>
  );
}
```

#### apps/www/src/app/(vexcms)/admin/error.tsx

Next's client error boundary convention: `error.tsx` is a Client Component receiving `{ error, reset }`. Catches a thrown render error anywhere under `(vexcms)/admin` and offers the `/tour` fallback plus a retry.

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants, cn } from "@vexcms/react";

import { TOUR_PATH } from "~/lib/routes";

/**
 * Error boundary for every route under `/admin`: a render error in the admin
 * panel shows a retry button and a link to the static tour instead of a
 * blank page.
 *
 * @param props.error - The thrown error; logged to the console.
 * @param props.reset - Re-renders the failed segment.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Demo unavailable</h1>
      <p className="max-w-[32rem] text-muted-foreground">
        Something went wrong loading the admin panel. Try again, or view a static tour instead.
      </p>
      <div className="flex gap-4">
        <button
          className={cn(buttonVariants({ variant: "default" }))}
          onClick={reset}
          type="button"
        >
          Try again
        </button>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={TOUR_PATH}>
          View the tour
        </Link>
      </div>
    </div>
  );
}
```

#### apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx

4 edits; everything not shown is unchanged.

**1 — import.** Alongside the existing `~/auth/server` / `~/vex.config.server` imports:

```ts
import { getToken, getUserOrg } from "~/auth/server";
import { TOUR_PATH } from "~/lib/routes";
import config from "~/vex.config.server";
```

**2 — the verification-failure doc paragraph.** In `AdminPage`'s own doc comment, the bullet starting "`getToken()`/`getUserOrg()` are awaited inside a `try`/`catch`":

```ts
 * - `getToken()`/`getUserOrg()` are awaited inside a `try`/`catch`: a session
 *   **verification** failure (Convex unreachable, a lookup timeout) redirects to
 *   `TOUR_PATH` — the backend that failed can't be the thing the fallback
 *   depends on, so this no longer reuses `/unauthorized`. `redirect()` throws
 *   its own control-flow error to unwind to the nearest segment, so it is only
 *   ever called from the `catch` block, never awaited inside the `try`.
```

**3 — the verification-failure redirect.** `AdminPage`'s `if (!session)` branch — the access-check branch below it (`canAccessAdminPanel` false, signed-in caller) is unchanged and keeps `/unauthorized`:

```ts
  const session = await loadAdminSession();
  if (!session) {
    redirect(TOUR_PATH);
  }
```

**4 — `loadAdminSession`'s doc comment.**

```ts
/**
 * Resolves the session, failing closed: a `getToken()`/`getUserOrg()` throw
 * (Convex unreachable, a lookup timeout) returns `null` rather than letting
 * the error surface as a 500 — the caller redirects to `TOUR_PATH`, the
 * static fallback that carries no dependency on the backend that failed.
 */
```

Verify: `pnpm --filter www build` lists `/tour` as static (`○`). `/tour` on :3030 shows four screenshots at 375 and 1280 with no layout shift. `[dev]` With `NEXT_PUBLIC_CONVEX_URL` pointed at an unreachable host in your own dev server, `/admin` lands on `/tour`, and a thrown render error inside the admin shows the error boundary's `/tour` link.

### Step 11 — Speed Insights on www, sampled

`[agent]`

- [ ] `pnpm-workspace.yaml` catalog: `@vercel/speed-insights: 2.1.0`
- [ ] `apps/www/package.json`: `@vercel/speed-insights` dep, `catalog:`
- [ ] `apps/www/src/lib/analytics.ts`: `SPEED_INSIGHTS_SAMPLE_RATE`
- [ ] `apps/www/src/app/layout.tsx`: `<SpeedInsights sampleRate={SPEED_INSIGHTS_SAMPLE_RATE} />` beside `<Analytics />`

#### pnpm-workspace.yaml

1 edit; everything not shown is unchanged.

**1 — catalog entry**, beside the existing `@vercel/analytics` line:

```yaml
  "@vercel/analytics": "^2.0.1"
  "@vercel/speed-insights": 2.1.0
```

#### apps/www/package.json

1 edit; everything not shown is unchanged.

**1 — dependency**, beside the existing `@vercel/analytics` entry:

```json
    "@vercel/analytics": "catalog:",
    "@vercel/speed-insights": "catalog:",
```

#### apps/www/src/lib/analytics.ts

```ts
/**
 * Speed Insights sample rate for www.
 *
 * The free event pool is 10,000 events per rolling 30 days, shared across
 * every project on the Vercel team; once it runs out, collection pauses for
 * at least 14 days. Sampling 5% of page views keeps a launch-week traffic
 * spike inside the pool.
 */
export const SPEED_INSIGHTS_SAMPLE_RATE = 0.05;
```

#### apps/www/src/app/layout.tsx

2 edits; everything not shown is unchanged.

**1 — imports**, beside the existing `@vercel/analytics` and `~/components/ThemeLive` imports:

```ts
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LivePreviewProvider } from "@vexcms/react";
import { ThemeScript } from "@vexcms/react/server";
import localFont from "next/font/local";

import ClientProviders from "~/components/providers/client";
import ServerProviders from "~/components/providers/server";
import { ThemeLive } from "~/components/ThemeLive";
import { SPEED_INSIGHTS_SAMPLE_RATE } from "~/lib/analytics";
```

**2 — mount**, directly after `<Analytics />`:

```tsx
        <Analytics />
        <SpeedInsights sampleRate={SPEED_INSIGHTS_SAMPLE_RATE} />
```

Verify: `pnpm --filter www build` green; on the production deploy, `/_vercel/speed-insights/script.js` loads and the Vercel Speed Insights tab shows data within 24h.

### Step 12 — Web Analytics: www confirmed, docs added

`[agent]`

- [ ] `apps/docs/package.json`: `@vercel/analytics: catalog:`
- [ ] `apps/docs/src/components/Head.astro`: Starlight `Head` override rendering the default head plus `<Analytics />`
- [ ] `apps/docs/astro.config.mjs`: `components: { Head: "./src/components/Head.astro" }`
- [ ] `[dev]` Enable Web Analytics on the docs Vercel project; confirm events on both projects (www's Analytics tab already shows production page views — `<Analytics />` is already mounted there)

#### apps/docs/package.json

1 edit; everything not shown is unchanged.

**1 — dependency**, beside the existing `@astrojs/starlight` entry:

```json
  "dependencies": {
    "@astrojs/starlight": "catalog:",
    "@vercel/analytics": "catalog:",
    "astro": "catalog:",
```

#### apps/docs/src/components/Head.astro

Starlight's default `Head` component takes no props and reads `Astro.locals.starlightRoute.head` itself, so the override only needs to render it plus the analytics script.

```astro
---
import Default from "@astrojs/starlight/components/Head.astro";
import Analytics from "@vercel/analytics/astro";
---

<Default />
<Analytics />
```

#### apps/docs/astro.config.mjs

1 edit; everything not shown is unchanged.

**1 — register the override**, inside `starlight({...})`, beside `title`:

```js
		starlight({
			title: 'VexCMS',
			components: { Head: './src/components/Head.astro' },
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ianyimi/vex' }],
```

Verify: `pnpm --filter docs build` green; after deploy, `https://docs.vexcms.dev/_vercel/insights/script.js` returns 200 and the docs project's Analytics tab shows page views; www's Analytics tab shows production page views.

### Step 13 — Privacy page + footer link

`[agent]`

- [ ] `apps/www/convex/seed.ts`: a `privacy` page (compact Hero + FAQ block: what we collect, cookies, Web Analytics, Speed Insights, the live demo and rate limiting, CLI telemetry with a link to its field list, contact through GitHub Discussions); a `{ label: "Privacy", href: "/privacy" }` footer link after "Licence"

#### apps/www/convex/seed.ts

2 edits; everything not shown is unchanged.

**1 — footer link**, in `footerDoc.content[0].links`, right after the `"Licence"` entry:

```ts
          { label: "Licence", href: "https://github.com/ianyimi/vex/blob/master/LICENSE" },
          { label: "Privacy", href: "/privacy" },
          { label: "Convex", href: "https://convex.dev" },
```

**2 — the privacy page.** Inserted after the roadmap page's insert/patch/skip block (`created.push("page:roadmap")` / its closing brace), before the `// ── Testimonials` comment — same `by_slug` + insert/patch/skip pattern as every other page above it:

```ts
  const existingPrivacyPage = await ctx.db
    .query(TABLE_SLUG_PAGES)
    .withIndex("by_slug", (q) => q.eq("slug", "privacy"))
    .filter((q) => q.neq(q.field("vex_status"), "draft"))
    .first()
  const privacyPageDoc: WithoutSystemFields<Doc<typeof TABLE_SLUG_PAGES>> = {
    title: "Privacy",
    slug: "privacy",
    vex_status: "published",
    blocks: [
      {
        blockType: BLOCK_SLUG_HERO,
        blockName: "Hero",
        id: "privacy-hero",
        variant: ["compact"],
        badgeText: "Privacy",
        heading: "What this site collects, and what it doesn't.",
        subheading:
          "VexCMS runs the analytics, the live demo, and the CLI telemetry described below. This page lists exactly what each one sends.",
      },
      {
        blockType: BLOCK_SLUG_FAQ,
        blockName: "FAQ",
        id: "privacy-faq",
        heading: "Privacy FAQ",
        subheading: "",
        supportLink: "",
        items: [
          {
            question: "What does this site collect?",
            answer:
              "Anonymous, aggregated analytics through Vercel Web Analytics and Vercel Speed Insights. Browsing the site, reading the docs and opening the read-only live demo need no account.",
          },
          {
            question: "Does this site use cookies?",
            answer:
              "Not for analytics: Vercel Web Analytics and Speed Insights are cookieless. The admin panel keeps two preference cookies scoped to /admin (layout and list-view settings; see https://docs.vexcms.dev/guides/admin-cookies/), and signing in sets a session cookie. Your light or dark theme choice is kept in your browser's local storage.",
          },
          {
            question: "What does Vercel Web Analytics collect?",
            answer:
              "Vercel Web Analytics identifies visitors by a hash of the incoming request that resets every 24 hours, not a cookie or your IP address. Per page view it records the event timestamp, URL, dynamic path, referrer, filtered query parameters, country/region/city, device and browser, device type, and script version. Full policy: https://vercel.com/docs/analytics/privacy-policy.",
          },
          {
            question: "What does Speed Insights collect?",
            answer:
              "Vercel Speed Insights samples 5% of page views on this site and records anonymous Web Vitals — route, network speed, browser, device, country, and the vital's value — none of it tied to an individual visitor or IP address. Full policy: https://vercel.com/docs/speed-insights/privacy-policy.",
          },
          {
            question: "What happens in the live demo?",
            answer:
              "The demo opens the admin panel read-only, with no account and no session: you can browse every collection, but nothing you do is saved. Sign-up and anonymous sign-in requests are rate-limited using a salted one-way hash of your IP address, and the raw IP address is never stored. Anonymous accounts created through the auth API are deleted 24 hours after they're created.",
          },
          {
            question: "Does the CLI send telemetry?",
            answer:
              "create-vexcms and vex collect anonymous usage telemetry by default — no personal data, no IP address, no project content. Opt out at any time with vex telemetry disable, DO_NOT_TRACK=1, or VEX_TELEMETRY_DISABLED=1. Full field list: https://docs.vexcms.dev/guides/telemetry/.",
          },
          {
            question: "Who do I contact about this?",
            answer: "Ask on GitHub Discussions: https://github.com/ianyimi/vex/discussions.",
          },
        ],
      },
    ],
  }
  if (existingPrivacyPage) {
    if (mode === "patch") {
      await ctx.db.patch(TABLE_SLUG_PAGES, existingPrivacyPage._id, privacyPageDoc)
      patched.push("page:privacy")
    } else {
      skipped.push("page:privacy")
    }
  } else {
    await ctx.db.insert(TABLE_SLUG_PAGES, privacyPageDoc)
    created.push("page:privacy")
  }
```

Verify: `pnpm --filter www exec convex run seed:reinit` on dev, then `/privacy` renders on :3030 with every answer and the footer shows "Privacy". After deploy, `npx convex run seed:reinit --prod` and `curl -s https://vexcms.dev/privacy` returns 200.

### Step 14 — Docs: adding page analytics to a scaffold

`[agent]`

- [ ] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`: an "Adding page analytics" section before "What's deliberately out of scope"

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

1 edit; everything not shown is unchanged. Inserted as a new `##` section, directly before `## What's deliberately out of scope`:

````md
## Adding page analytics

The marketing-site starter ships with no analytics configured — nothing collects a page view or
a performance metric until you add it.

### Vercel Web Analytics

Install the package and mount `<Analytics />` once, in the root layout:

```bash
pnpm add @vercel/analytics
```

```tsx
// src/app/layout.tsx
import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

Then enable Web Analytics under the project's **Analytics** tab on the Vercel dashboard — the
routes it needs (`/_vercel/insights/*`) only exist after the next deployment. Collection is
cookieless: a visitor is identified by a hash of the request that resets every 24 hours, never a
cookie or an IP address. See https://vercel.com/docs/analytics.

### Speed Insights (optional)

`<SpeedInsights />` from `@vercel/speed-insights/next` reports Core Web Vitals the same way.
Mount it beside `<Analytics />`:

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

<Analytics />
<SpeedInsights sampleRate={0.05} />
```

`sampleRate` (0–1) caps how much of your traffic reports a Web Vital — useful if the free
10,000-events-per-30-days pool, shared across every project on the team, needs to stretch across
a traffic spike. Omit it to sample every page view. See https://vercel.com/docs/speed-insights.

````

Verify: `pnpm --filter docs build` green; the section renders under `/guides/caching-and-seo/`.

### Step 15 — Vercel Pro, spend management, uptime monitors

`[dev]`

- [ ] Upgrade the Vercel team to Pro. Settings → Billing → Spend Management: set an On-Demand Budget amount (developer-filled), pause production deployments on, notification thresholds 50/75/100%, SMS at 100%
- [ ] UptimeRobot Free (5-minute interval), alerts through the mobile app push:
  - keyword monitor on `https://vexcms.dev`, keyword `The content backend for everything Convex.` (the seeded home-page hero heading, `apps/www/convex/seed.ts` — a phrase that only appears once the site has rendered, not on an error page)
  - keyword monitor on `https://docs.vexcms.dev`, keyword `VexCMS` (the Starlight `title` in `apps/docs/astro.config.mjs` — appears in every page's rendered head/nav)
  - keyword monitor on `https://vexcms.dev/admin`, keyword `Dashboard` (`DashboardView`'s `<h1>`, `packages/react/src/admin/DashboardView.tsx` — renders only when the admin panel itself renders, and is deliberately absent from `/tour`'s copy, so the monitor also catches a session/config failure that still returns a 200)
  - HTTP monitor on `https://usable-bee-730.convex.site/api/auth/ok`
  - send a test alert to the mobile app before relying on it
- [ ] `apps/www/convex/seed.ts`'s home-hero heading changing in a later spec, or `DashboardView`'s `<h1>` text changing, breaks its monitor's keyword — update the monitor at the same time as the text
- [ ] `operations.md` in this spec folder (template, filled in by the developer)

#### operations.md

New file — a template; dollar amounts and account-specific fields are left for the developer to fill in.

```md
# Launch Infrastructure — Operations Record

## Vercel

| | |
|---|---|
| Team plan | Pro |
| On-Demand Budget | $___ /month |
| Pause production on overage | On |
| Notification thresholds | 50%, 75%, 100% |
| SMS alert | 100% only |
| Budget set by | ___ (name/date) |

## Uptime monitors (UptimeRobot Free, 5-minute interval)

| Monitor | URL | Type | Keyword | Alert contact |
|---|---|---|---|---|
| www | `https://vexcms.dev` | Keyword | `The content backend for everything Convex.` | Mobile app push |
| docs | `https://docs.vexcms.dev` | Keyword | `VexCMS` | Mobile app push |
| admin | `https://vexcms.dev/admin` | Keyword | `Dashboard` | Mobile app push |
| Convex auth | `https://usable-bee-730.convex.site/api/auth/ok` | HTTP | — | Mobile app push |

Test alert sent: ___ (date, confirmed received).

## Convex

Plan, deployment class, and usage thresholds are recorded in `sizing.md` (step 9) — this file
doesn't duplicate them. `usable-bee-730` is www's production deployment.

## Who receives alerts

| Channel | Recipient |
|---|---|
| Vercel spend-management email/SMS | ___ |
| UptimeRobot mobile app push | ___ |
| Convex usage-notification email | ___ (set in step 9) |
```

Verify: `operations.md` records the budget, thresholds and pause setting, plus each monitor's URL, keyword, interval and alert contact; a test alert reaches the phone.

### Step 16 — Port to apps/test
`[agent]` **Blocked on:** M (`2026-10-26-build-time-telemetry`) committed.

Every file here is a verbatim copy of its `apps/www` counterpart from steps 4, 10 and 13. Before this step, `apps/test/src/components/FirstAdminBootstrap.tsx` is byte-identical to www's pre-fix copy. `apps/test/convex/seed.ts` has the same `"Licence"` footer link and the same `existingRoadmapPage` / `created.push("page:roadmap")` anchors. The admin page has the same `if (!session) { redirect("/unauthorized"); }` branch in `AdminPage`. `apps/test/src/lib/` exists (`metadata.ts`, `vex.ts`, …), so `TOUR_PATH` gets the same home as in www.

Do NOT port the rate limiter, the purge cron, `AUTH_PROXY_SECRET`, `disableIpTracking` or Speed Insights (decision 16). `apps/test` has unstaged telemetry edits from M today, which is why this step waits for M to land.

- [ ] `apps/test/src/components/FirstAdminBootstrap.tsx`: step 4's edit, verbatim
- [ ] `apps/test/convex/seed.ts`: step 13's two edits (footer link after `"Licence"`, the `privacy` page block after the roadmap block), verbatim, with the same copy, so both apps describe the same deployment rules
- [ ] `apps/test/src/lib/routes.ts`: step 10's file, verbatim
- [ ] `apps/test/src/app/tour/page.tsx`: step 10's file, verbatim (it imports `~/components/Container` and `~/components/ThemeStyle`, both present in apps/test)
- [ ] `apps/test/src/app/(vexcms)/admin/error.tsx`: step 10's file, verbatim
- [ ] `apps/test/src/app/(vexcms)/admin/[[...path]]/page.tsx`: step 10's four page edits (import, the two JSDoc passages, `redirect(TOUR_PATH)` in the `if (!session)` branch); the signed-in `/unauthorized` redirect stays
- [ ] `apps/test/public/tour/{dashboard,list-view,edit-view-live-preview,media-library}.png`: the same four filenames as www. Recapture them from apps/test's admin on its running dev server (:3020) with the browser tool, because apps/test's admin shows more collections

No code blocks: each file is identical to the block shown in steps 4, 10 and 13. Copy those blocks; don't re-derive them, so the two apps can't drift.

Verify: `pnpm --filter test typecheck && pnpm --filter test test` green. On the developer's running apps/test dev server (:3020), `/tour` and `/privacy` render, and a signed-out visit shows no `vex/firstUser:isBootstrapped` execution in the Convex dashboard's dev-deployment logs. `diff apps/www/src/app/tour/page.tsx apps/test/src/app/tour/page.tsx` and `diff apps/www/src/app/(vexcms)/admin/error.tsx apps/test/src/app/(vexcms)/admin/error.tsx` print nothing.

### Step 17 — N: Sync both templates
`[agent]` **Blocked on:** quality-pass step 12 + M.

Run the `template-sync` skill (`.omp/skills/template-sync/SKILL.md`) once for `base-nextjs` ← `apps/test` and once for `marketing-site` ← `apps/www`, per its own preflight (`harness doctor`, `harness state`) and its step 1 (load the app→template translation table in `2026-08-31-wp2-cli-templates/spec.md` before touching anything).

Translation rules specific to this spec, applied on top of the skill's existing ownership boundary (step 3: `base-nextjs` owns auth/admin/media/users/the bootstrap flow; `marketing-site` owns pages/headers/footers/themes/`siteSettings`/seed/site content):

- The template seed (`marketing-site`'s `convex/seed.ts`) omits every vexcms-only page this spec and the quality pass add — `privacy`, `accessibility`, `tour` — and their footer links. A template scaffold is a stranger's blank site; those pages describe THIS deployment, not theirs.
- `/tour` and `(vexcms)/admin/error.tsx` are www/test-only. They answer "what does the live demo show when it's down", which has no meaning for a scaffold that has never been deployed. Neither file crosses into either template.
- The bootstrap fix (step 4/16's `useQuery(..., session?.user ? {} : "skip")`) and the step 1 `roles` `input: false` fix MUST be in both templates — `base-nextjs`'s `FirstAdminBootstrap.tsx` and `base-nextjs`'s `convex/auth/schema.ts`.
- Template `layout.tsx` (both templates) mounts no `<Analytics />` and no `<SpeedInsights />` — decision 13, the marketing template ships no analytics, and the base template never had either to begin with.

#### n-sync.md

New file, in the spec folder. Populate the `disposition`/`reason` columns from the actual `template-diff.mjs` output; the table below is the expected shape and the known entries this spec's own changes produce — fill in every other ORPHANED/CHANGED/MISSING entry the script reports.

```markdown
# N: Template sync — 2026-11-06-launch-infrastructure

Run: `node scripts/template-diff.mjs --app apps/www` and `node scripts/template-diff.mjs --app apps/test`, <date>.

| Path | Bucket | Template | Disposition | Reason |
|---|---|---|---|---|
| `src/components/FirstAdminBootstrap.tsx` | CHANGED | base-nextjs | sync | step 4/16's `"skip"` fix; must reach every scaffold |
| `convex/auth/schema.ts` (`roles` field) | CHANGED | base-nextjs | sync | step 1's `input: false` fix; must reach every scaffold |
| `convex/seed.ts` (footer links, `privacy`/`accessibility` pages) | CHANGED | marketing-site | sync footer order only; drop the `privacy`/`accessibility` page blocks and their footer links | decision 17: template seeds omit vexcms-only pages |
| `src/app/tour/page.tsx` | MISSING | marketing-site | do not add | www/test-only static fallback, meaningless before first deploy |
| `public/tour/*.png` | MISSING | marketing-site | do not add | screenshots of a deployment the template has never had |
| `src/app/(vexcms)/admin/error.tsx` | MISSING | base-nextjs | do not add | links to `/tour`, which the template does not ship |
| `src/app/(vexcms)/admin/[[...path]]/page.tsx` (redirect target) | CHANGED | base-nextjs | do not sync | redirect target is `/tour`-specific; template keeps `/unauthorized` |
| `src/app/layout.tsx` (`<Analytics />`/`<SpeedInsights />`) | N/A | both | do not add | decision 13: templates ship no analytics |

<!-- Append every other ORPHANED/CHANGED/MISSING entry `template-diff.mjs` reports for each app run, with its disposition and reason, before this sync is considered complete. -->
```

#### Prohibited-pattern sweep — proposed skill update

The skill's current sweep (`.omp/skills/template-sync/SKILL.md:73-77`) lists `object(`, `ui(`, `tabs(`, `imageUrl(`, `richtext(`, `admin.blockStyles`, a scalar `select` `defaultValue`, `_vexDrafts`, `livePreview`, `vex_status`/`vex_version`, and per-instance `admin.components.Field`. Verified against the current codebase:

- `richtext(` — shipped. `packages/core/src/fields/richtext/config.ts` defines the field (launch-plan D), and N's brief requires richtext to reach both templates. Drop it from the sweep.
- `livePreview` — shipped. `collectionsApi` exports `livePreviewUrl` (`apps/www/convex/vex.ts`), and the seeded `headers`/`pages` collections configure live preview. Drop it from the sweep.
- `vex_status`/`vex_version` — shipped as real field names: `apps/test/convex/seed.ts` and `apps/www/convex/seed.ts` both read/write `vex_status` directly (`.filter((q) => q.neq(q.field("vex_status"), "draft"))`, seen in both seed files). Keep off the sweep.
- `_vexDrafts` — not found anywhere in `packages/core/src` or either app's `convex/`; still prohibited (no such internal table/field exists in the current versioning design, which instead patches the same row). Keep.
- `object(`, `ui(`, `tabs(`, `imageUrl(`, `admin.blockStyles`, scalar `select` `defaultValue`, per-instance `admin.components.Field` — not re-verified in this session (out of this spec's area); keep as-is pending a dedicated check.

Proposed diff (not applied — for whoever runs this step to land in the skill file):

```diff
-   **Prohibited-pattern sweep.** Grep every translated file for `object(`, `ui(`, `tabs(`,
-     `imageUrl(`, `richtext(`, `admin.blockStyles`, a scalar (non-array) `select`
-     `defaultValue`, `_vexDrafts`, `livePreview`, `vex_status`/`vex_version`, and any
-     per-instance `admin.components.Field` — none may survive translation. These are current-API
-     violations or unshipped-feature (versioning/drafts) leftovers, not stylistic nits.
+   **Prohibited-pattern sweep.** Grep every translated file for `object(`, `ui(`, `tabs(`,
+     `imageUrl(`, `admin.blockStyles`, a scalar (non-array) `select`
+     `defaultValue`, `_vexDrafts`, and any per-instance `admin.components.Field` — none may
+     survive translation. These are current-API violations or unshipped-feature leftovers, not
+     stylistic nits. (`richtext(`, `livePreview` and `vex_status`/`vex_version` were removed
+     from this list 2026-11-06: all three are shipped field/API names used in the apps and
+     templates.)
```

- [ ] Run `template-sync` skill: `base-nextjs` ← `apps/test`, `marketing-site` ← `apps/www`
- [ ] `node scripts/template-diff.mjs --app apps/www`
- [ ] `node scripts/template-diff.mjs --app apps/test`
- [ ] Regenerate template artifacts per the skill's step 4 last bullet (`convex/_generated/*`, `convex/vex.schema.ts`, `src/vex.types.ts`) if anything touched `vex.config.ts`, a collection, or a block config since the last sync
- [ ] `n-sync.md` in this spec folder
- [ ] Propose (do not apply) the prohibited-pattern sweep diff above as a note for whoever next edits `.omp/skills/template-sync/SKILL.md`

Verify: `node scripts/template-diff.mjs --app apps/www` and `--app apps/test` list only the intentional differences recorded in `n-sync.md`; `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs` exit 0 (skill step 5).

### Step 18 — N: Scaffold from packed tarballs
`[agent]` **Blocked on:** step 17.

Run the three scaffold gates in order. `verify-scaffold.mjs` requires every publishable package's `dist/` to be current (`pnpm --filter "@vexcms/*" --filter create-vexcms build` first — the script's own header says this precondition is "not performed here"); it packs tarballs and scaffolds both templates against them, not the workspace. `scaffold-smoke.mjs --bare` scaffolds the base template with no install/git; `scaffold-smoke.mjs` (no flag) does the full marketing scaffold. Neither smoke script needs the packed-tarball precondition — both load installer source directly via `jiti`.

Failure-handling rule (AP-020): a defect any of the three gates finds is fixed in BOTH the template file and the app it was translated from, never the template alone — a template-only patch drifts back out of sync the next time `template-sync` runs from the (still-broken) source app.

- [ ] `pnpm --filter "@vexcms/*" --filter create-vexcms build`
- [ ] `node scripts/verify-scaffold.mjs`
- [ ] `node scripts/scaffold-smoke.mjs --bare`
- [ ] `node scripts/scaffold-smoke.mjs`
- [ ] Fix every failure in both the template file and its source app (`apps/test` for `base-nextjs`, `apps/www` for `marketing-site`), then re-run the failing gate

Verify: `node scripts/verify-scaffold.mjs` exits 0; `node scripts/scaffold-smoke.mjs --bare` exits 0; `node scripts/scaffold-smoke.mjs` exits 0.

### Step 19 — N: Run-through per template on a fresh Convex deployment
`[agent]` **Blocked on:** step 18.

`[dev]` Create a fresh Convex project per template (two separate projects — scaffolds must not share a deployment). In each scaffold directory: start `vex dev` and `next dev` (the developer starts both; no agent starts a dev server, P-024).

`[agent]` With the browser tool, against each template's own running `next dev`, work through every row of `n-runthrough.md` below and mark it pass/fail.

#### n-runthrough.md

New file, in the spec folder.

```markdown
# N: Run-through — 2026-11-06-launch-infrastructure

One row per check, per template. Fill in `date`/`result` after running against a fresh Convex
deployment per template (step 19's `[dev]` sub-item).

## base-nextjs

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms my-base-app` (base-nextjs preset) | Install, typecheck, `vex dev` codegen all succeed | |
| `vex dev` generates | after scaffold, run `vex dev` once | `convex/_generated/api.d.ts`, `convex/vex.schema.ts`, `src/vex.types.ts` all present and typecheck | |
| First-user signup becomes admin | sign up as the first user through the app's sign-up form | Redirected to `/admin`; the user's `roles` is `["admin"]` | |
| `curl` sign-up escalation is rejected | `curl -s -X POST http://localhost:3010/api/auth/sign-up/email -H "content-type: application/json" -d '{"email":"escalate@example.com","password":"correcthorsebattery","name":"Escalate","roles":["admin"]}'` (base's `dev` script uses `--port=3010`), then `npx convex data user` | The `escalate@example.com` row has `roles: ["user"]`, not `["admin"]` | |
| Signed-out visit runs no `isBootstrapped` | open `/` signed out; watch the Convex dashboard's dev-deployment logs | No `vex/firstUser:isBootstrapped` execution logged | |
| Create / edit — `user` | admin panel, users collection | Create and edit succeed | |
| Create / edit — `images` | admin panel, media collection | Upload-create and edit succeed | |
| Live preview | open an edit view with live preview enabled | Preview pane reflects unsaved edits | |
| Media upload | upload an image through the media library | Upload succeeds; `generateUploadUrl` → `createMediaDocument` round-trip completes | |
| `next build` | `pnpm build` | Exits 0 | |

## marketing-site

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms my-marketing-app` (marketing-site preset) | Install, typecheck, `vex dev` codegen all succeed | |
| `vex dev` generates | after scaffold, run `vex dev` once | `convex/_generated/api.d.ts`, `convex/vex.schema.ts`, `src/vex.types.ts` all present and typecheck | |
| First-user signup becomes admin | sign up as the first user through the app's sign-up form | Redirected to `/admin`; the user's `roles` is `["admin"]` | |
| `curl` sign-up escalation is rejected | the same `curl` against the marketing scaffold's dev origin (its `dev` script's port), then `npx convex data user` | The `escalate@example.com` row has `roles: ["user"]`, not `["admin"]` | |
| Signed-out visit runs no `isBootstrapped` | open `/` signed out; watch the Convex dashboard's dev-deployment logs | No `vex/firstUser:isBootstrapped` execution logged | |
| Create / edit / publish — `pages` | admin panel, `pages` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `headers` | admin panel, `headers` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `footers` | admin panel, `footers` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `themes` | admin panel, `themes` collection | Create, edit, publish all succeed | |
| Live preview | open a `pages` edit view with live preview enabled | Preview pane reflects unsaved edits | |
| Media upload | upload an image through the media library | Upload succeeds; `generateUploadUrl` → `createMediaDocument` round-trip completes | |
| `next build` | `pnpm build` | Exits 0; seeded routes prerender | |

Fix every failure in both the template and its source app (AP-020), then re-run the failed row.
```

- [ ] `[dev]` Create a fresh Convex project per template; start `vex dev` + `next dev` in each scaffold
- [ ] `[agent]` Run every `n-runthrough.md` check with the browser tool against each template's running dev server
- [ ] `n-runthrough.md` in this spec folder, every row marked pass
- [ ] Fix every failure in the template and its source app

Verify: `n-runthrough.md` has every check marked pass for both templates.

### Step 20 — N: create-vexcms README + quickstart match the CLI
`[agent]` **Blocked on:** step 19.

Procedure: run `pnpm create vexcms` interactively (or `npx create-vexcms@<version>` against the packed tarball from step 18) for both the `base-nextjs` and `marketing-site` presets, capturing the full terminal transcript of each run (every prompt, every output line, including install/typecheck/`vex dev` codegen output) to a file. `packages/create-vexcms/README.md` has unstaged edits from M (telemetry) today — diff the captured transcript against the README's CURRENT committed content plus M's unstaged edits together, so the reconciliation doesn't get reverted when M lands.

Reconcile line by line: every prompt and every output line quoted in `packages/create-vexcms/README.md` and `apps/docs/src/content/docs/guides/quickstart.mdx` must appear verbatim in one of the two captured transcripts. Delete or correct any quoted line that doesn't match; add any real prompt/output the docs are missing.

- [ ] Capture a `create-vexcms` transcript for `base-nextjs`
- [ ] Capture a `create-vexcms` transcript for `marketing-site`
- [ ] `packages/create-vexcms/README.md`: reconcile every quoted prompt/output line against the two transcripts
- [ ] `apps/docs/src/content/docs/guides/quickstart.mdx`: reconcile every quoted prompt/output line against the two transcripts

Verify: every prompt and output line quoted in `packages/create-vexcms/README.md` and `apps/docs/src/content/docs/guides/quickstart.mdx` appears in a captured `create-vexcms` run.

### Step 21 — Bookkeeping proposals
`[agent]`

This spec may not edit the launch plan, `backlog.md` or other specs (decision 18). `bookkeeping.md` lists every proposed edit, with its exact target file and exact text, for whoever closes this spec out to apply.

- [ ] `bookkeeping.md` in this spec folder (contents below)

#### bookkeeping.md

New file, in the spec folder.

```markdown
# Bookkeeping proposals — 2026-11-06-launch-infrastructure

Every edit below is PROPOSED, not applied by this spec (decision 18: this spec may not edit the
launch plan, `backlog.md`, or other specs). Fill in commit refs when this spec's steps land.

## 1. `v0.1.0-launch-plan.md`

- Tick item 15 ("launch infrastructure") once steps 1–21 land.
- Tick S's task list items, each annotated with its landing commit ref:
  - Task 1 ("Anonymous-user cleanup — every 'Admin' click on `apps/www` mints a Better Auth anonymous user and session …"): annotate that
    `AdminDemoButton.tsx:7-23` no longer mints a session of any kind — it is a plain `/admin`
    link — so the task's original premise is stale. What this spec actually ships against it:
    the anonymous-user purge (step 5) covers direct, unauthenticated
    `POST /sign-in/anonymous` calls, which stay public per decision 3.
  - Record the roles-escalation fix (step 1's five-place `input: false` fix, closed by step 7's
    guard) against whichever S task covers auth hardening.
- Tick P's and N's task lists the same way, each annotated with its commit ref.

## 2. `backlog.md` — new entries

- Brute-force limiting for `/sign-in/email` on Convex. Better Auth's built-in rate limiter uses
  `memory` storage by default, which is per Convex isolate and does not share state across
  concurrent function instances — not viable as-is on Convex. Needs either `storage: "database"`
  through the Better Auth adapter or a dedicated `@convex-dev/rate-limiter` limiter, mirroring
  this spec's `/sign-in/anonymous` and `/sign-up/email` limits (decision 5).
- Rate limiting M's telemetry receiver. Out of this spec's scope (M's own step 10 decides where
  the receiver lives); it has no attested-IP mechanism today and no limiter.
- O(1) `isBootstrapped` / `promoteFirstAdmin` reads. This spec removes the per-visitor
  subscription (step 4/16) but leaves the underlying `ctx.db.query(TABLE_SLUG_USERS).collect()`
  — a full table scan — in place; it still runs once per promotion attempt and once per signed-in
  bootstrap check.
- PostHog: revisit when there is a hosted product with signup (launch plan § P's own trigger);
  until then Vercel Web Analytics covers page traffic.

## 3. Handoffs

- **R** — replace the privacy page's GitHub Discussions contact with the address R creates, in
  both `apps/www/convex/seed.ts` and `apps/test/convex/seed.ts`'s `privacy` page FAQ item ("How
  do I ask a question about any of this?").
- **T** — add the newsletter answer to the privacy page's FAQ (both seed files), and add a demo
  video to `/tour` (both `apps/www/src/app/tour/page.tsx` and `apps/test/src/app/tour/page.tsx`)
  once T's media kit has one.
- **Release notes** — a security note: scaffolds created with `create-vexcms` before this spec's
  fix (step 1 / the `.changeset/roles-not-client-writable.md` patch) must add `input: false` to
  their own `convex/auth/schema.ts`'s `roles` field by hand; the patch only fixes new scaffolds
  and the two live apps.

## 4. Harness

- `.agent/docs/standards/anti-patterns.md` — candidate new AP: Better Auth's
  `additionalFields` entries default `input: true` (`@better-auth/core` 1.6.23,
  `DBFieldAttributeConfig.input`); any role/permission field on the `user` table MUST set
  `input: false` explicitly, or it becomes client-writable through `/sign-up/email` and
  `/update-user` — proven in-process (`sources.md` §14) and reachable on `vexcms.dev` until
  step 1's fix.
- `.agent/docs/product/tech-stack.md` — add `@convex-dev/rate-limiter` and
  `@vercel/speed-insights` to the dependency inventory.
- `harness struct` — regenerate after this spec's new files land (`apps/www/convex/crons.ts`,
  `apps/www/convex/auth/{anonymousUsers,rateLimits}.ts`, `apps/www/src/testing/`, `/tour` routes,
  `(vexcms)/admin/error.tsx` in both apps, this spec's folder).
- `.omp/skills/template-sync/SKILL.md` — apply step 17's proposed prohibited-pattern sweep diff
  (drop `richtext(`, `livePreview` and `vex_status`/`vex_version`, all shipped).
- `harness tasks` — move the S/P/N inbox items this spec closes out of the launch plan's open
  task lists into done, per item 1's commit refs.
- Run the `sync-spec` skill against this spec after implementation.

Verify: `harness doctor` clean.
```

Verify: `bookkeeping.md` lists every proposed edit with its target file and exact text; `harness doctor` clean.

## Verification

After each step, and once more after step 16 (before N):

```bash
pnpm typecheck && pnpm test && pnpm lint
pnpm --filter www build && pnpm --filter docs build
```

After N (steps 17–20): `node scripts/verify-scaffold.mjs`, `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs` exit 0, and `harness doctor` is clean.
