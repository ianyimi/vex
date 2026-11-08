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
  - "apps/www/e2e/routes.ts"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".agent/docs/product/backlog.md"
  - ".agent/docs/standards/anti-patterns.md"
  - ".agent/docs/product/tech-stack.md"
  - ".omp/skills/template-sync/SKILL.md"
prompt_version: 1
---

# 2026-11-06-launch-infrastructure — Tasks

> Launch-plan item 15, **launch infrastructure**: S (live demo hardening), P (analytics & monitoring), then N (template sync + scaffold tests). `dev-spec` interview held 2026-11-06.
> High-care, developer implements. Every step is `[agent]` unless it needs a person in a vendor dashboard (plan tiers, budgets, monitors, env vars, sign-ups); those are `[dev]` steps or `[dev]` sub-items.
> Every step leaves `pnpm typecheck && pnpm test && pnpm lint` green. No agent starts a dev server (P-024): attach to the running `apps/www` on port 3030.
> **Order.** `.agent/docs/product/launch-cross-spec-decisions.md` (2026-11-07) is binding. Its dependency edges:
> - **Implementable now:** steps 1–6, 9–12, 14 and 15 (except step 10's screenshot recapture). Step 8 runs once steps 1–7 are deployed.
> - **Step 13** (`/privacy`) waits for public-presence steps 1–2 (`2026-11-06-public-presence`).
> - **Step 7** waits for M (`2026-10-26-build-time-telemetry`) to be committed, because `packages/core/src/config/config.ts` carries its unstaged work.
> - **Step 16** waits for M (it touches `apps/test`, which carries M's unstaged work) and for step 13.
> - **Step 10's recapture** sub-item waits for the shared media session (after quality-pass steps 6–7).
> - **Steps 17–20 (N) are BLOCKED on all of:** quality-pass steps 12 and 13 (`2026-11-06-quality-pass`), M committed, and public-presence steps 10, 13 and 14. Launch-kit step 9 is **not** required (amended 2026-11-07): its posts and `launch-week` are excluded from the templates by type, and L step 18 checks the scaffold. The coordination board (`.agent/docs/product/launch-coordination.md`) is the source of truth for these edges.
> - **Downstream:** public-presence step 17 waits on step 19 here.
>
> Vendor facts come from `sources.md` (every URL with fetch date 2026-11-06). `spec.md` § Handoff to quality pass was absorbed into the quality-pass spec on 2026-11-07 and stays only as a record. Routes go in `apps/www/e2e/routes.ts` `QUALITY_ROUTES: { path, draft?: true }[]` (cross-spec decision 3). Re-seeding is always `seed:reinit` (decision 9).

## Step 1 — Roles hotfix: `roles` not client-writable [agent]
Why: `user.additionalFields.roles` has no `input: false`. Better Auth 1.6.23 then accepts `roles` from `/sign-up/email` and `/update-user`. Proven in-process 2026-11-06: signing up with `roles: ["admin"]` stored `["admin"]`, and with `input: false` it stored `["user"]`. vexcms.dev has email sign-up open, so it is exposed today. The developer applies this out-of-band first. This step records it and closes any of the five places it missed.
Verify: `grep -rn -A4 "roles: {" apps/www/convex/auth/schema.ts apps/test/src/auth/schema.ts packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts` shows `input: false` in each; `pnpm typecheck` green. The live sign-up probe in step 8 proves it on production
- [x] `apps/www/convex/auth/schema.ts`, `apps/test/src/auth/schema.ts`, `packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts`: `input: false` on `roles`
- [x] `packages/better-auth/README.md` and `apps/docs/src/content/docs/guides/auth.mdx`: the same in the example
- [x] `.changeset/roles-not-client-writable.md`: `create-vexcms` + `@vexcms/better-auth` patch, with an upgrade note for existing scaffolds

## Step 2 — www Convex test harness + rate-limiter component [agent]
Why: no Convex function in `apps/www` has a test, and the repo has no Convex component yet. The tooling lands before steps 3, 5 and 6 need it.
Verify: `pnpm --filter www test` and `pnpm --filter www typecheck` green; `convex/_generated/api.d.ts` exposes `components.rateLimiter` (regenerated by the developer's running `vex dev`)
- [x] `pnpm-workspace.yaml` catalog: `@convex-dev/rate-limiter: 0.3.2` (0.4.x depends on `@convex-dev/batch-worker` → `convex-helpers` ≥0.1.127, which peers `convex ^1.46`; the catalog has 1.44. Same client API)
- [x] `apps/www/package.json`: `@convex-dev/rate-limiter` (dep), `convex-test` + `@edge-runtime/vm` (devDeps), all `catalog:`
- [x] `apps/www/convex/convex.config.ts`: `app.use(rateLimiter)`
- [x] `apps/www/vitest.config.ts`: include `convex/**/*.test.ts`; inline `convex-test`; split into `app` (jsdom + setup file) and `convex` (edge-runtime) projects, since the setup file's axe-core throws outside a DOM
- [x] `apps/www/src/testing/createConvexTest.ts`: `createConvexTest()` (schema + module glob + rate-limiter registration) and `insertTestUser()`
- [x] `.github/workflows/ci.yml`: `--filter www` on the Test Packages step

## Step 3 — Read-only access suite [agent]
Why: launch-plan S says "prove read-only under attack, not just in the UI". This is the permanent half: every public mutation, called directly, against the real access matrix.
Verify: `pnpm --filter www test -- readOnlyAccess` passes: 14 mutations × 2 callers (no identity; `user` role). Each call is rejected, or for `promoteFirstAdmin` with an admin already present returns `{ promoted: false }`, and the database is unchanged. Proven to fail: temporarily set `pages: true` for `USER_ROLES.user` in `src/auth/access.ts` and the `vex:create` cases fail. Revert afterwards
- [x] `apps/www/convex/readOnlyAccess.test.ts`

## Step 4 — Bootstrap subscription only with a session [agent]
Why: `FirstAdminBootstrap` mounts on every public page and subscribes to `isBootstrapped`, which `.collect()`s the whole `user` table. Every user insert re-runs it for every connected visitor. Signed-out visitors never need it.
Verify: with `/` open signed out on :3030, the Convex dashboard's dev-deployment logs show no `vex/firstUser:isBootstrapped` execution; signed in on a deployment with no admin, the first user is still promoted and redirected to `/admin`
- [x] `apps/www/src/components/FirstAdminBootstrap.tsx`: `useQuery(api.vex.firstUser.isBootstrapped, session?.user ? {} : "skip")`

## Step 5 — Expired anonymous-user purge + cron [agent]
Why: Better Auth's anonymous plugin never expires users (`sources.md` §5), and `POST /api/auth/sign-in/anonymous` stays public (decision 4).
Verify: `pnpm --filter www test -- anonymousUsers` passes; after deploy the Convex dashboard's Cron Jobs view lists "purge expired anonymous users", hourly at :17
- [x] `apps/www/src/db/constants/auth.ts`: `ANONYMOUS_USER_MAX_AGE_MS`, `ANONYMOUS_USER_PURGE_BATCH_SIZE`
- [x] `apps/www/convex/auth/anonymousUsers.ts`: `purgeExpired` internal mutation. Deletes users older than 24h with `isAnonymous: true`, plus their sessions, accounts and API keys; 200 per run, and schedules itself again when a batch is full
- [x] `apps/www/convex/auth/anonymousUsers.test.ts`
- [x] `apps/www/convex/crons.ts`: `crons.hourly(..., { minuteUTC: 17 }, internal.auth.anonymousUsers.purgeExpired)`

## Step 6 — Auth rate limits with a proxy-attested client IP [agent]
Why: launch-plan S's per-IP sign-in limit. Convex HTTP actions don't expose the client IP. Vercel overwrites `x-forwarded-for` (`sources.md` §13), but a direct `<deployment>.convex.site` call can forge it. Only the Next proxy, proven by a shared secret, may vouch for an IP.
Verify: `pnpm --filter www test -- rateLimits` passes. Against the dev deployment through `localhost:3030`, 6 POSTs to `/api/auth/sign-in/anonymous`, each carrying `x-forwarded-for: 203.0.113.7` → the 6th gets `429` with `Retry-After`. A direct `curl` to the dev `.convex.site` URL with a forged `x-vex-client-ip` draws from the shared unattested bucket, not a per-IP one
- [x] `apps/www/src/db/constants/auth.ts`: `AUTH_RATE_LIMIT_HEADERS`, `AUTH_RATE_LIMITED_PATHS`, `AUTH_RATE_LIMIT_NAMES`
- [x] `apps/www/src/env.mjs` + `.env.example`: `AUTH_PROXY_SECRET`
- [x] `apps/www/src/auth/serverUtils.ts`: `withClientIpAttestation()`; `apps/www/src/auth/server.ts` exports the wrapped `handler`
- [x] `apps/www/convex/auth/rateLimits.ts`: `authRateLimiter`, `limitAuthRequest()`, `hashClientIp()`
- [x] `apps/www/convex/auth/rateLimits.test.ts`
- [x] `apps/www/convex/http.ts`: `limitAuthRequest` before `auth.handler`
- [x] `apps/www/convex/auth/options.ts`: `advanced.ipAddress.disableIpTracking: true`, so sessions store no IP
- [x] `[dev]` Generate the secret (`pnpm --filter www secret:create`). Set it as `AUTH_PROXY_SECRET` in Vercel (www, Production + Preview) and on the dev and prod Convex deployments

## Step 7 — Roles guard: adapters declare client-writable user fields [agent]
Why: step 1 fixes five copies. This makes the next copy fail at `vex dev` instead of shipping an escalation. Needs M committed (`packages/core/src/config/config.ts`).
Verify: `pnpm --filter @vexcms/core test -- config` and `pnpm --filter @vexcms/better-auth test -- adapter` pass. Proven to fail: removing `input: false` from `apps/www/convex/auth/schema.ts` makes `pnpm --filter www test` fail with `VexAuthConfigError` naming `roles` (the step 2 harness imports `vex.config.server`). Revert afterwards
- [x] `packages/core/src/auth/types.ts`: `VexAuthAdapter.clientWritableUserFields?: readonly string[]`
- [x] `packages/core/src/config/assertRolesFieldNotClientWritable.ts`: the check, throwing `VexAuthConfigError`
- [x] `packages/core/src/config/config.ts`: `defineServerConfig` calls it after the `diffAuthCollections` check
- [x] `packages/core/src/config/config.test.ts`: cases in the existing `describe("defineServerConfig")`
- [x] `packages/better-auth/src/adapter.ts`: `clientWritableUserFields` from the merged user table's fields where `input !== false`
- [x] `packages/better-auth/src/adapter.test.ts`
- [x] `apps/docs/src/content/docs/guides/auth.mdx`: why `roles` needs `input: false`, and the error it raises
- [x] `.changeset/auth-roles-guard.md`: `@vexcms/core` + `@vexcms/better-auth` patch (P-025)

## Step 8 — Live read-only proof on production [agent]
Why: step 3 proves the matrix in-process. This proves the deployed env, auth and limiter, as the launch plan asks.
Verify: `live-proof.md` has one row per probe (command, expected, observed, pass), and every row passes
- [ ] `[dev]` Deploy www with steps 1–7 (Vercel production + `convex deploy`); give the agent CLI access to the prod Convex project
- [ ] `npx convex run <fn> '<args>' --prod` for all 14 public mutations, with no identity and with `--identity` of a `user`-role user → each rejected
- [ ] `curl` checks:
  - `POST https://vexcms.dev/api/auth/sign-up/email` with `roles: ["admin"]` → stored roles `["user"]`, then delete that user
  - `POST /api/auth/update-user` with `roles` → rejected
  - `POST /api/vex/revalidate` with no session → 401/403
  - the 6th `sign-in/anonymous` from one IP → 429
- [ ] `live-proof.md` in this spec folder

## Step 9 — Convex Starter, spending limits, usage alerts, sizing [dev]
Why: on Free, writes may fail once usage passes a limit, and spending limits need a paid subscription (`sources.md` §8). Decided: Starter now, then size.
Verify: `sizing.md` records the plan, both thresholds, the alert recipients, the measured calls per visit, and a 50k-visitor projection with headroom per resource
- [ ] `[dev]` Move the team to Starter; set the spending-limit warning and disable thresholds; turn on usage notifications for www prod (`usable-bee-730`) and for M's telemetry receiver deployment (wherever M step 10 puts it)
- [ ] `[agent]` Measure Convex function calls, database bandwidth and HTTP actions per anonymous visit (home → features → `/admin` → one list view) using the browser tool on production plus the dashboard's per-function counts; write `sizing.md`

## Step 10 — `/tour` static demo fallback [agent]
Why: when Convex is down or over its limits, the demo today ends on `/unauthorized`. The fallback must not depend on the backend that failed, so it is a static route, not a seeded page (deliberate P-018 exception, decision 9).
Verify: `pnpm --filter www build` lists `/tour` as static (`○`). `/tour` on :3030 shows four screenshots at 375 and 1280 with no layout shift. `apps/www/e2e/routes.ts` `QUALITY_ROUTES` holds `{ path: "/tour" }` with no `draft`. `[dev]` With `NEXT_PUBLIC_CONVEX_URL` pointed at an unreachable host in your own dev server, `/admin` lands on `/tour`, and a thrown render error inside the admin shows the error boundary's `/tour` link. After the recapture, `diff -r apps/www/public/tour apps/test/public/tour` prints nothing
- [x] `apps/www/src/lib/routes.ts`: `TOUR_PATH`
- [x] `apps/www/public/tour/*.png`: four 1280×800 screenshots of the local admin (dashboard, list view with a saved view, edit view with live preview, media library), captured with the browser tool. `/tour` ships with these. The "media library" shot is the `images` collection list (signed out, the picker grid isn't reachable), so its alt/caption and the dashboard's (no document counts) were reworded to match
- [x] `apps/www/e2e/routes.ts`: `{ path: "/tour" }` in `QUALITY_ROUTES` (quality-pass step 2 creates the file from its inventory; add the entry if it's missing) — present, no `draft` (QP-2)
- [ ] `[dev]` **Blocked on the shared media session** (public-presence step 16 + launch-kit step 8, after quality-pass steps 6–7; cross-spec decision 7): recapture the same four screenshots under the same filenames into both `apps/www/public/tour/` and `apps/test/public/tour/`
- [x] `apps/www/src/app/tour/page.tsx`: `force-static`, `<ThemeStyle />` (baked in at build), `next/image` with fixed dimensions, `robots: { index: false }`
- [x] `apps/www/src/app/(vexcms)/admin/error.tsx`: client error boundary → "Demo unavailable" with links to `/tour` and retry
- [x] `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`: redirect to `/tour` when session verification fails (Convex unreachable)

## Step 11 — Speed Insights on www, sampled [agent]
Why: launch plan P. The free pool is 10k events per rolling 30 days, team-wide, and collection pauses for 14+ days when it runs out (`sources.md` §10). Sampled at 5% to survive launch week.
Verify: `pnpm --filter www build` green; on the production deploy, `/_vercel/speed-insights/script.js` loads and the Vercel Speed Insights tab shows data within 24h
- [x] `pnpm-workspace.yaml` catalog: `@vercel/speed-insights: 2.0.0` (2.1.0 was inside the 3-day `minimumReleaseAge` on 2026-11-07); `apps/www/package.json` dep
- [x] `apps/www/src/lib/analytics.ts`: `SPEED_INSIGHTS_SAMPLE_RATE = 0.05`
- [x] `apps/www/src/app/layout.tsx`: `<SpeedInsights sampleRate={SPEED_INSIGHTS_SAMPLE_RATE} />` beside `<Analytics />`

## Step 12 — Web Analytics: www confirmed, docs added [agent]
Why: launch plan P. www already mounts `<Analytics />` and `/_vercel/insights/script.js` answers 200; docs answers 404 (probed 2026-11-06).
Verify: `pnpm --filter docs build` green; after deploy, `https://docs.vexcms.dev/_vercel/insights/script.js` returns 200 and the docs project's Analytics tab shows page views; www's Analytics tab shows production page views
- [x] `apps/docs/package.json`: `@vercel/analytics: catalog:`
- [x] `apps/docs/src/components/Head.astro`: Starlight `Head` override rendering the default head plus `<Analytics />`
- [x] `apps/docs/astro.config.mjs`: `components: { Head: "./src/components/Head.astro" }`
- [ ] `[dev]` Enable Web Analytics on the docs Vercel project; confirm events on both projects

## Step 13 — Privacy page + footer link [agent] — BLOCKED on public-presence steps 1–2
Why: launch plan P. Seeded the same way quality-pass step 11 seeds `/accessibility` (P-018, P-021), using the existing FAQ block. The contact and release-emails lines are quoted from `public-copy.md` (cross-spec decision 5), and the footer position comes from its § Footer (decision 4).
Verify: `pnpm --filter www exec convex run seed:reinit` on dev, then `/privacy` renders on :3030 with every answer, and the footer shows "Privacy" at its `public-copy.md` § Footer position. The contact and release-emails answers match `public-copy.md` § Privacy contact and § Release emails privacy entry byte for byte. After deploy, `npx convex run seed:reinit --prod` and `curl -s -o /dev/null -w '%{http_code}' https://vexcms.dev/privacy` prints `200`
- [x] `apps/www/convex/seed.ts`: a `privacy` page (compact Hero + FAQ block: what we collect, cookies, Web Analytics, Speed Insights, the live demo and rate limiting, CLI telemetry with a link to its field list, release emails quoting § Release emails privacy entry verbatim, contact quoting § Privacy contact verbatim) — dev verified 2026-11-08; the prod `seed:reinit` + curl rides the pre-launch deploy (LI-8)
- [x] `apps/www/convex/seed.ts`: `{ label: "Privacy", href: "/privacy" }` in the footer `links` at its `public-copy.md` § Footer position
- [x] `apps/www/e2e/routes.ts`: `{ path: "/privacy" }` in `QUALITY_ROUTES` (quality-pass step 2 creates the file from its inventory; add the entry if it's missing) — present (QP-2)

## Step 14 — Docs: adding page analytics to a scaffold [agent]
Why: decided that the marketing template ships no analytics. The docs say how to add it.
Verify: `pnpm --filter docs build` green; the section renders under `/guides/caching-and-seo/`
- [x] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`: an "Adding page analytics" section before "What's deliberately out of scope"

## Step 15 — Vercel Pro, spend management, uptime monitors [dev]
Why: Spend Management is Pro-only, and Hobby is non-commercial with hard caps (`sources.md` §11). Decided: Pro for launch, UptimeRobot Free for uptime.
Verify: `operations.md` records the budget, thresholds and pause setting, plus each monitor's URL, keyword, interval and alert contact; a test alert reaches the phone
- [ ] `[dev]` Upgrade the Vercel team to Pro. Set an On-Demand Budget with pause-production on, notifications at 50/75/100%, SMS at 100%
- [ ] `[dev]` UptimeRobot Free (5-minute interval), alerts through the mobile app:
  - keyword monitors on `https://vexcms.dev` and `https://docs.vexcms.dev`
  - a keyword monitor on `https://vexcms.dev/admin`, keyword present only when the panel renders
  - an HTTP monitor on `https://usable-bee-730.convex.site/api/auth/ok`
- [ ] `[agent]` `operations.md` in this spec folder (template, filled in by the developer)

## Step 16 — Port to apps/test [agent]
Why: `apps/test` stays a superset of www. The template-bound changes plus the new seed data and pages go there, so N syncs one source per template. Needs M committed and step 13.
Verify: `pnpm --filter test typecheck && pnpm --filter test test` green; after `pnpm --filter test exec convex run seed:reinit`, `/tour` and `/privacy` render on apps/test's dev server; a signed-out visit there runs no `isBootstrapped`; `diff -r apps/www/public/tour apps/test/public/tour` prints nothing
- [x] `apps/test/src/components/FirstAdminBootstrap.tsx`: the step 4 change
- [x] `apps/test/convex/seed.ts`: the step 13 page and footer link (at the § Footer position), verbatim
- [x] `apps/test/src/lib/routes.ts`, `apps/test/src/app/tour/page.tsx` + `TourContent.tsx`, `apps/test/src/app/(vexcms)/admin/error.tsx`, admin page redirect: the step 10 change, verbatim (step 10 moved the tour body into a client `TourContent.tsx`: `cn`/`buttonVariants`/`Container` are client-only and can't run in the static server page)
- [x] `apps/test/public/tour/*.png`: byte-identical copies of www's four screenshots (the media-session recapture replaces both later)

## Step 17 — N: Sync both templates [agent] — BLOCKED on quality-pass steps 12–13 + M + public-presence steps 10, 13, 14
Why: launch plan N. Every change since the last sync (G, D, F, K, H, I, the quality pass, this spec, public-presence and launch-kit's www content) reaches the templates. It runs once, against the final www, so no second sync is needed.
Verify: `node scripts/template-diff.mjs --app apps/www` and `--app apps/test` list only the intentional differences, each recorded in `n-sync.md`. Inside `packages/create-vexcms/templates/marketing-site`, `rg` finds no `richtext-plate`, no `posts` collection, none of the excluded page slugs, footer links or `socialLinks` entry, and no `public-copy.md` string
- [x] Run the `template-sync` skill for `base-nextjs` ← `apps/test` and `marketing-site` ← `apps/www`
- [x] `marketing-site` excludes everything vexcms-specific (cross-spec decision 6):
  - the `posts` collection and `/posts/[slug]`, and every post document (`base-nextjs` already has posts; `@vexcms/richtext-plate` stays out of the marketing template)
  - the `privacy`, `accessibility`, `brand` and `launch-week` pages, and `/tour`
  - the Privacy, Accessibility, Brand, Discussions, Release emails, Sponsor and Buy Me a Coffee footer links, and the Sponsors `socialLinks` entry
  - the roadmap and FAQ copy, replaced with generic template copy (no `public-copy.md` strings)
- [x] Both templates keep the step 4 bootstrap fix and the step 1 `input: false`
- [x] Prepare the `template-sync` skill's banned-pattern update (`richtext(`, `livePreview`, `vex_status` have shipped); step 21 applies it
- [x] `n-sync.md`: every ORPHANED/CHANGED/MISSING entry, with its disposition

## Step 18 — N: Scaffold from packed tarballs [agent] — BLOCKED on step 17 (and everything it waits for)
Why: launch plan N. Only a real scaffold run finds template defects (AP-020).
Verify: `node scripts/verify-scaffold.mjs` exits 0; `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs` exit 0
- [x] Run all three; fix each failure in the template and its source app

## Step 19 — N: Run-through per template on a fresh Convex deployment [agent] — BLOCKED on step 18 (and everything it waits for)
Why: launch plan N. Install, typecheck and build don't prove a stranger can sign in and edit content. Public-presence step 17 (README quick start) waits for this step.
Verify: `n-runthrough.md` has every check below marked pass for both templates
- [ ] `[dev]` Create a fresh Convex project per template; start `vex dev` + `next dev` in each scaffold
- [ ] `[agent]` With the browser tool:
  - first-user signup becomes admin
  - sign-up with `roles: ["admin"]` via `curl` stores `["user"]`
  - create / edit / publish in every collection
  - live preview and media upload
  - the marketing scaffold shows no vexcms-specific content
  - `next build`
- [ ] Fix every failure in the template and its source app

## Step 20 — N: create-vexcms README + quickstart match the CLI [agent] — BLOCKED on step 19 (and everything it waits for)
Why: launch plan N. The first page a stranger reads.
Verify: every prompt and output line quoted in `packages/create-vexcms/README.md` and `apps/docs/src/content/docs/guides/quickstart.mdx` appears in a captured `create-vexcms` run
- [ ] Update both files from a captured run

## Step 21 — Bookkeeping [agent]
Why: plan and backlog stay the source of truth (cross-spec decision 8). This step edits them directly; handoffs to sibling specs were already applied in the 2026-11-07 review.
Verify: launch plan item 15 and the S, P and N task lists are ticked with commit refs; the four backlog entries exist; `harness doctor` clean
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md`: tick item 15 and the S/P/N tasks with commit refs; annotate S task 1 (Admin button mints no session; purge + limits cover the public endpoints) and record the roles fix; add the release-notes security note to § Release mechanics
- [ ] `.agent/docs/product/backlog.md`: `/sign-in/email` brute-force limiting on Convex, telemetry-receiver rate limit, O(1) `isBootstrapped`, PostHog trigger
- [ ] `.agent/docs/standards/anti-patterns.md` (Better Auth `input: false` AP), `.agent/docs/product/tech-stack.md`, the `template-sync` skill sweep, `harness struct`, `harness tasks`, `sync-spec`
