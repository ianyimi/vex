# 2026-11-06-launch-infrastructure — Sources

Primary sources for the launch-infrastructure spec, all fetched 2026-11-06. §1–§12 were compiled by a research subagent from the vendor pages named in each section. §13–§17 were checked directly in this session against vendor pages, the installed packages in `node_modules/.pnpm`, and live HTTP probes. Where a §13+ entry contradicts an `UNVERIFIED` line in §1–§12, the §13+ entry wins.

---

## 1. Convex Cron Jobs

**URL:** https://docs.convex.dev/scheduling/cron-jobs
**Fetched:** 2026-11-06

- Cron jobs defined in `convex/crons.ts`:
  ```ts
  import { cronJobs } from "convex/server";
  import { internal } from "./_generated/api";
  const crons = cronJobs();
  crons.interval("clear messages table", { minutes: 1 }, internal.messages.clearAll);
  crons.monthly("payment reminder", { day: 1, hourUTC: 16 }, internal.payments.sendPaymentEmail, { email: "..." });
  export default crons;
  ```
- API surface: `crons.interval()` (seconds/minutes/hours granularity, first run at deploy time), `crons.cron()` (traditional 5-field cron string, UTC), `crons.hourly()`, `crons.daily()`, `crons.weekly()`, `crons.monthly()` (named-arg sugar; `minuteUTC` optional — Convex spreads the minute across the hour if omitted).
- Third argument to each scheduling call is a public or **internal** function (`internal.foo.bar`), either a mutation or an action.
- Docs explicitly recommend avoiding `minuteUTC: 0` (top-of-hour) scheduling to avoid contention; linked lint rule `@convex-dev/no-top-of-hour-crons`.
- **Limit:** "At most one run of each cron job can be executing at any moment." If the previous run is still executing when the next is due, the next run is **skipped** (not queued), and a log message is emitted in the dashboard logs view.
- Viewable in the Convex dashboard Cron Jobs view; add/update/delete events show in logs/history.

**Implication:** A cleanup cron for expired anonymous Better Auth users should be defined as `internal.auth.cleanupAnonymousUsers` (or similar) in `convex/crons.ts` via `crons.interval(...)` or `crons.daily(...)` with no fixed `minuteUTC`, calling an **internal** mutation/action. Because only one run executes at a time and overlapping runs are skipped (not duplicated), the cleanup job is safe to run frequently without manual locking — but a slow run will cause a *skip*, not a pile-up, so design the handler to be idempotent and bounded in cost per run.

---

## 2. Convex Rate Limiter Component

**URLs:** https://www.convex.dev/components/rate-limiter ; https://github.com/get-convex/rate-limiter (README)
**Fetched:** 2026-11-06

- Package: `@convex-dev/rate-limiter` (npm install `npm install @convex-dev/rate-limiter`).
- Registration in `convex/convex.config.ts`:
  ```ts
  import { defineApp } from "convex/server";
  import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
  const app = defineApp();
  app.use(rateLimiter);
  export default app;
  ```
- Client construction:
  ```ts
  import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
  import { components } from "./_generated/api";
  const rateLimiter = new RateLimiter(components.rateLimiter, {
    freeTrialSignUp: { kind: "fixed window", rate: 100, period: HOUR },
    sendMessage: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },
    failedLogins: { kind: "token bucket", rate: 10, period: HOUR },
    llmTokens: { kind: "token bucket", rate: 40000, period: MINUTE, shards: 10 },
  });
  ```
- Two `kind`s: `"token bucket"` (continuous refill at `rate`/`period`, allows burst up to `capacity`, default `capacity` = `rate`) and `"fixed window"` (grants tokens all at once every `period`, also supports `capacity` rollover and a `start` time for custom reset alignment).
- Core call: `const { ok, retryAfter } = await rateLimiter.limit(ctx, "name", { key?, count?, throws?, reserve? })`. `ok` = whether it succeeded; `retryAfter` = ms until it would succeed.
- `throws: true` makes `.limit()` throw a `ConvexError` with `data: { kind, name, retryAfter }` instead of returning `{ ok: false }`.
- `.check(ctx, name, { key })` — checks without consuming.
- `.reset(ctx, name, { key })` — resets a limit (e.g., on successful login after `failedLogins` tracking).
- `.credit(ctx, name, { key, count? })` — gives back consumed tokens (capped at `capacity`; excess discarded).
- `.getValue(ctx, name, { key })` — fetch raw current value/timestamp; `calculateRateLimit()` helper computes the value at an arbitrary timestamp.
- `key` parameter scopes the limit (e.g., per-user, **per-IP** — README explicitly lists per-IP as a supported key pattern via "custom composite keys").
- `shards` option splits counters across N db partitions for higher throughput (uses "power of two" choice of two random shards); **an async (`applyUpdates: "asynchronously"`) rate limit cannot be sharded**.
- `applyUpdates: "asynchronously"` trades strict correctness for throughput — avoids OCC conflicts under load, eventually consistent (uses a background Batch Worker queue); can go negative under burst, then blocks future requests until it recovers.
- `reserve: true` option lets a call reserve future capacity instead of failing now, returning `retryAfter` for scheduling via `ctx.scheduler.runAfter`.
- **ctx types accepted:** `limit`, `check`, `reset`, `credit`, `getValue` all take a Convex `ctx` as the first argument — demonstrated/used inside **mutations** and **actions** (`internalAction` example with `ctx.scheduler.runAfter`) in the README. The "Transactions" doc (see §3 below) explicitly shows `rateLimiter.limit(ctx, "failedLogins", { key: userId, throws: true })` called from a **mutation**, and notes it is "fully transactional" — i.e., rolls back with the mutation. No explicit example of calling `.limit()` directly from an `httpAction` ctx was found in either source — UNVERIFIED whether `.limit()` works unmodified inside an `httpAction` handler (httpAction ctx is a superset `ActionCtx`, so it is plausible, but not demonstrated in docs).
- No `isRateLimitError` helper was found in either the npm page or README text retrieved — **UNVERIFIED** (not mentioned on pages fetched; may exist in package source not read).

**Implication:** Use `key: <clientIp>` (or a composite `ip:path` key) with a `token bucket` or `fixed window` limiter for sign-in rate limiting, called from a Convex mutation/action backing the auth HTTP route; `throws: true` plus catching `ConvexError` (`error.data.retryAfter`) is the idiomatic way to surface `429`-style responses. Confirm empirically (not just from docs) whether `.limit()` is called directly inside `httpAction` before relying on that pattern for the public demo's `/sign-in/email` endpoint.

---

## 3. Convex Components — Using Components

**URL:** https://docs.convex.dev/components/using
**Fetched:** 2026-11-06

- Install flow: `npm i <package>`, then register in `convex/convex.config.ts` via `app.use(<component>)`; multiple instances of the same component can be registered with `app.use(component, { name: "agent2" })`.
- Run `npx convex dev` to generate code.
- Component functions are accessed via `components.<name>.<path>` and are reactive like normal Convex functions (query/mutation/action rules apply across the sandbox boundary).
- **Transactions:** a mutation's writes, including writes made by nested component mutation calls, commit together atomically. If a *component* mutation throws and the *caller* does NOT catch it, the whole top-level mutation rolls back. If the caller *does* catch it, only the component's writes roll back and the caller can continue — the doc's own example is the rate limiter: `await rateLimiter.limit(ctx, "failedLogins", { key: userId, throws: true });` thrown and uncaught rolls back the entire calling mutation.
- Components can expose their own `http.ts` HTTP routes, only reachable if the app sets an `httpPrefix` when calling `app.use(component, { httpPrefix: "/my-component/" })`; otherwise not exposed. This differs from the app's own `httpPrefix` (set via `defineApp({ httpPrefix: "/app/" })`), which does **not** affect component routes.
- Testing with `convex-test`: components provide a `/test` helper (e.g. `agentTest.register(t)`) or manual `t.registerComponent(name, schema, modules)`.

**Implication:** Register both the rate limiter and Better Auth as components via separate `app.use(...)` calls in one `convex/convex.config.ts`; both can coexist. The transactional rollback semantics mean a `throws: true` rate limit failure inside a sign-in mutation will cleanly abort any partial auth state changes in the same transaction, provided it's not swallowed by a try/catch.

---

## 4. Convex HTTP Actions — Client IP Availability

**URL:** https://docs.convex.dev/functions/http-actions
**Fetched:** 2026-11-06

- HTTP actions take a standard Fetch API `Request` object and are defined via `httpAction(async (ctx, request) => {...})`, exposed at `https://<deployment>.convex.site`.
- The docs page's full text (routing, limits, CORS, debugging, common patterns sections) contains **no mention of `x-forwarded-for`, `x-real-ip`, or any documented way to read the caller's IP address** from `request` or `ctx`. No `RequestMetadata`/IP accessor is described on this page.
- Request size: no specific limit except multipart/form-data (20 MiB cap); response capped at 100 MiB; 64 MiB runtime memory.
- Supplementary web search confirms this gap is a known community pain point:
  - GitHub issue `get-convex/convex-backend#130` ("Remote IP address in queries/mutations/actions", opened 2025-06-27): confirms "there doesn't appear to be a built-in way to retrieve the client's IP address" — **UNVERIFIED** whether this has since shipped (issue was open as of the search result, title implies it was still a feature gap).
  - GitHub issue `get-convex/convex-js#28` ("question: how to get the request ip inside a convex server side function") — closed/completed, exact resolution not read in full.
  - Convex docs' **Abuse Protection** page (https://docs.convex.dev/production/abuse-protection, fetched 2026-11-06) confirms Convex sits behind Cloudflare for `*.convex.cloud`/`*.convex.site` but documents no first-party IP-forwarding API; it instead recommends bringing your own Cloudflare zone or Vercel rewrite in front of a **custom domain** (Pro plan required) if you need request-level control (WAF, rate limiting) — this is a network/edge-layer workaround, not an in-function IP accessor.
  - `convex/server` module docs mention a `RequestMetadata` type (api/modules/server) — **UNVERIFIED** whether this exposes IP; not read directly, found only via search snippet.

**Implication:** Convex HTTP actions do **not** document a built-in way to read the caller's IP from the `Request` object directly — there is no documented `x-forwarded-for` support baked into the Convex runtime like Vercel adds at its edge. Any IP-based rate limiting in a Convex HTTP action must rely on a header set by whatever upstream proxy terminates the connection (e.g., `x-forwarded-for` set by Vercel if traffic is proxied through a Vercel rewrite per the Abuse Protection doc, or by Better Auth's own Next.js origin if going through the `convexBetterAuthNextJs` handler — see §7). Convex's own `.convex.site` domain, hit directly, has **no documented standard header** to trust for client IP — this needs explicit verification via a live test (not resolvable from docs alone).

---

## 5. Better Auth — Anonymous Plugin

**URL:** https://www.better-auth.com/docs/plugins/anonymous
**Fetched:** 2026-11-06

- Install: `anonymous()` plugin added to `betterAuth({ plugins: [anonymous()] })` server-side; `anonymousClient()` added to `createAuthClient({ plugins: [anonymousClient()] })` client-side.
- Endpoint: **`POST /sign-in/anonymous`**. Client: `authClient.signIn.anonymous()`. Server: `auth.api.signInAnonymous()`.
- If the current session already belongs to an anonymous user, calling `signIn.anonymous()` again **returns an error** (prevents stacking anonymous users) — caller must link or sign out first.
- **Link account:** `onLinkAccount: async ({ anonymousUser, newUser }) => {...}` callback fires when an anonymous user signs in/up with a real method; by default the anonymous user record is **automatically deleted** after linking.
  - With the two-factor plugin, a sign-in pending 2FA does **not** trigger linking — `onLinkAccount` is not called and the anonymous user is retained.
- **Delete endpoint:** `POST /delete-anonymous-user`; client `authClient.deleteAnonymousUser()`, server `auth.api.deleteAnonymousUser()`.
- **Options:**
  - `emailDomainName` (string) — domain used for generated anonymous emails; default format `{id}@anonymous.placeholder.invalid`.
  - `generateRandomEmail` (sync/async fn) — fully custom email generator; overrides `emailDomainName` if provided; caller is responsible for uniqueness.
  - `onLinkAccount` — callback described above.
  - `disableDeleteAnonymousUser` (boolean) — if `true`, disables auto-deletion on link **and** blocks the `/delete-anonymous-user` endpoint for anonymous users.
  - `generateName` — callback to generate a display name for anonymous users.
- **Schema:** anonymous plugin requires an additional field on the `user` table — the field is `isAnonymous` (referenced as "anonymousUserTableFields" in the docs' schema table, consistent with the task's noted field name; exact field name `isAnonymous` is the commonly documented field per Better Auth convention, confirmed by the page title referencing `anonymousUserTableFields`).
- **No automatic time-based cleanup is documented.** The only built-in removal mechanism is deletion-on-link (`disableDeleteAnonymousUser` gates it) or the explicit `/delete-anonymous-user` endpoint. There is **no TTL/expiry or background job** for anonymous users mentioned anywhere on this page.

**Implication:** Anonymous users that never link an account and are never explicitly deleted will accumulate indefinitely — this directly motivates the spec's cleanup cron (§1): a scheduled Convex internal mutation must query for stale anonymous users (`isAnonymous: true`, old `_creationTime`) and delete them, since Better Auth provides no automatic expiry.

---

## 6. Better Auth — Rate Limit Concept

**URL:** https://www.better-auth.com/docs/concepts/rate-limit
**Fetched:** 2026-11-06

- **Default (production):** window = **10 seconds**, max = **100 requests**, scoped per path per client.
- **Server-side calls via `auth.api` are NOT rate-limited** — only client-initiated HTTP requests are.
- **Disabled by default in development.** Enable explicitly: `rateLimit: { enabled: true }`.
- Config shape:
  ```ts
  betterAuth({
    rateLimit: {
      enabled: true,
      window: 10,        // seconds
      max: 100,
      customRules: {
        "/sign-in/email": { window: 10, max: 3 },
        "/two-factor/*": async (request) => ({ window: 10, max: 3 }),
      },
    },
  })
  ```
- **Built-in default custom rule:** `/sign-in/email` is limited to **3 requests per 10 seconds** out of the box (separate from the global default). The `twoFactor` plugin similarly adds its own `/two-factor/*` rule (3 req / 10s).
- `customRules` entries can be set to `false` (or a function returning `false`) to **disable** rate limiting for a specific path (e.g. `"/get-session": false`).
- **IP derivation (`advanced.ipAddress` under `betterAuth({ advanced: { ipAddress: {...} } })`):**
  - Default: reads `X-Forwarded-For` header.
  - `ipAddressHeaders: ["cf-connecting-ip"]` — use when a single trusted proxy sets its own header (proxy must overwrite, not append).
  - `trustedProxies: ["192.0.2.10", "10.0.0.0/24"]` — list of proxy IPs to skip when parsing a chained `X-Forwarded-For`; must not include a range covering real clients.
  - `ipAddressHeaders: []` plus a custom header set by your own server code (e.g., reading `req.socket.remoteAddress`) for direct-connection setups — all clients otherwise share one counter per path if no address can be derived.
  - `disableIpTracking: true` — disables the rate limiter entirely for HTTP requests when IP cannot be determined reliably.
  - When no valid address is found (e.g., unparseable `X-Forwarded-For` with no `trustedProxies` set), requests **share one counter per path** and a warning is logged once. In dev/test, Better Auth substitutes `127.0.0.1`.
  - **IPv6:** automatically normalized (different representations of the same address treated identically); IPv4-mapped IPv6 (`::ffff:192.0.2.1`) converted to IPv4 form. Rate-limited per **/64 subnet by default** (configurable via `ipv6Subnet`, 0–128, common values 128/64/56/48/32) to prevent rotation-based bypass; IPv4 is always limited per-address.
- **Storage (`rateLimit.storage`):**
  - `"memory"` (default) — not suitable for serverless (resets per instance).
  - `"database"` — `storage: "database", modelName: "rateLimit"` (default model name `rateLimit`); requires running `npx auth migrate` (only works with the built-in Kysely adapter; Prisma/Drizzle/etc. require `auth generate` + the ORM's own migration tool).
  - `"secondary-storage"` — reuses a configured Secondary Storage backend.
  - `customStorage: { consume: async (key, rule) => ({ allowed, retryAfter }) }` — must check-and-increment atomically in one call; Better Auth no longer supports separate get/set (race-prone).
- **Error handling:** exceeded limit returns header **`X-Retry-After`** (seconds). Client-side: `createAuthClient({ fetchOptions: { onError: async ({ response }) => { if (response.status === 429) {...} } } })`, usable globally or per-request.
- Schema for `storage: "database"`: table `rateLimit`.

**Implication:** For the Convex-backed demo, `storage: "database"` is the only durable/shared option across serverless Convex function instances if Better Auth's rate limiter is used directly against the Convex adapter (Convex itself is the DB) — `"memory"` would not share state across concurrent Convex executions. The default `/sign-in/email` rule (3 req/10s) already gives baseline protection but IP derivation must be configured correctly (`ipAddressHeaders`/`trustedProxies`) given the Next.js → Convex proxy hop (see §7), or all users could collapse to one shared counter.

---

## 7. Convex + Better Auth Integration (Next.js Proxy & IP Forwarding)

**URLs:** https://labs.convex.dev/better-auth ; https://labs.convex.dev/better-auth/framework-guides/next ; https://github.com/get-convex/better-auth/blob/main/src/nextjs/index.ts (raw source)
**Fetched:** 2026-11-06

- Install: `npm install convex@latest @convex-dev/better-auth` + `npm install better-auth@~1.7.16` (pinned version). Requires Convex ≥ 1.25.0.
- Component registration: `convex/convex.config.ts` → `app.use(betterAuth)` (from `@convex-dev/better-auth/convex.config`).
- Auth instance in `convex/auth.ts` uses `createClient<DataModel>(components.betterAuth)` and `betterAuth({ baseURL: siteUrl, database: authComponent.adapter(ctx), plugins: [convex({ authConfig })] })`.
- Next.js server utilities: `convexBetterAuthNextJs({ convexUrl, convexSiteUrl })` from `@convex-dev/better-auth/nextjs`, returning `{ handler, preloadAuthQuery, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction }`.
- Mounted in Next.js at `app/api/auth/[...all]/route.ts`: `export const { GET, POST } = handler;` — this proxies all `/api/auth/*` Next.js requests to the Convex deployment's `.convex.site` URL.
- **Header forwarding — read directly from `src/nextjs/index.ts` source (not documented in prose anywhere on labs.convex.dev):**
  ```ts
  const handler = async (request: Request, siteUrl: string) => {
    const requestUrl = new URL(request.url);
    const nextUrl = `${siteUrl}${requestUrl.pathname}${requestUrl.search}`;
    const headers = new Headers(request.headers);
    headers.delete("transfer-encoding");
    headers.delete("content-length");
    headers.delete("connection");
    headers.set("accept-encoding", "application/json");
    headers.set("host", new URL(siteUrl).host);
    headers.delete("x-forwarded-host");
    headers.delete("x-forwarded-proto");
    headers.set("x-better-auth-forwarded-host", requestUrl.host);
    headers.set("x-better-auth-forwarded-proto", requestUrl.protocol.replace(/:$/, ""));
    // ...method, body, redirect: "manual"
  };
  ```
  - The handler copies **all** of the incoming `request.headers` (`new Headers(request.headers)`) through to the outbound fetch to Convex's `.convex.site` URL, **except** it strips `transfer-encoding`, `content-length`, `connection`, and explicitly strips/replaces `x-forwarded-host`/`x-forwarded-proto` with its own `x-better-auth-forwarded-host`/`x-better-auth-forwarded-proto` (to prevent origin spoofing).
  - **Crucially, it does NOT strip or rewrite `x-forwarded-for`** — any `x-forwarded-for` header present on the incoming Next.js `Request` (e.g., one set upstream by Vercel's edge/CDN before reaching the Next.js serverless function) passes through unmodified to the Convex `.convex.site` origin.
- No prose documentation on labs.convex.dev mentions IP forwarding at all — this fact is derived entirely from reading the raw GitHub source, as instructed. It is **UNVERIFIED** whether Vercel's own serverless/edge runtime sets `x-forwarded-for` on the `Request` object seen by a Next.js Route Handler (this is standard platform behavior for most Node/edge hosts but was not independently confirmed from a Vercel doc in this pass).

**Implication:** Because the proxy forwards `x-forwarded-for` unchanged, Better Auth's `advanced.ipAddress` default (reading `X-Forwarded-For`) should see the real client IP as long as (a) Vercel's platform sets/appends to `x-forwarded-for` on the request reaching the Next.js handler, and (b) Better Auth on the Convex side is configured with `trustedProxies` for the proxy hop, or otherwise doesn't misinterpret a multi-hop chain. This needs a live header-dump test to confirm before launch, but the source code rules out one failure mode (header being stripped by the Convex Better Auth Next.js proxy itself).

---

## 8. Convex Limits, Pricing, Usage Alerts

**URLs:** https://docs.convex.dev/production/state/limits ; https://www.convex.dev/pricing ; https://docs.convex.dev/dashboard/teams/teams
**Fetched:** 2026-11-06

**Plans:** Free, Starter (same S16 tier as Free but pay-as-you-go beyond free amounts), Professional, Business, Enterprise.

**Free/Starter quotas (shared tier):**
| Resource | Free (hard cap) | Starter (included, then pay-as-you-go) |
|---|---|---|
| Function calls | 1,000,000/month total | 1,000,000/month included; $2.20/additional 1M |
| Action compute | 20 GB-hours/month total | 20 GB-hours included; $0.33/GB-hr additional |
| Database storage | 0.5 GB total | 0.5 GB included; $0.22/mo per additional GB |
| Database I/O | 1 GB/month total | 1 GB/month included; $0.22/additional GB |
| File storage | 1 GB total | 1 GB included; $0.033/mo per additional GB |
| File data egress | 1 GB/month total | 1 GB/month included; $0.132/additional GB |
| Search storage | 0.5 GB total | 0.5 GB included; $0.55/mo per additional GB |
| Search queries | 3,000 query-GBs/month total | 3,000 included; $0.11/additional 1,000 query-GBs |

Professional: 25M function calls included ($2/additional 1M), 250 GB-hours action compute ($0.30/GB-hr additional), 50 GB db storage, 50 GB db I/O, 100 GB file storage, 50 GB file egress, 1 GB search storage, 50,000 query-GBs search.

- **Deployment class:** Free/Starter limited to **S16** (1,000 concurrent sessions, 16 concurrent queries, 16 concurrent mutations, 64 concurrent actions/HTTP actions), with a **team-wide 40 deployment limit**.
- **What happens when Free exceeds limits:** per the Limits page footer: *"After these limits are hit on the Free plan, new mutations that attempt to commit more insertions or updates may fail."* This is a **functional failure of writes**, not a full account suspension — reads/existing data remain, but new mutations that would grow usage past the cap can error out. (Starter/paid plans instead bill for overage rather than failing.)
- **Pricing page confirms:** Free & Starter get Auth, Crons, Node.js actions, Health & Insights dashboard, Preview deployments, etc. "Everything in Free & Starter" carries into Professional.
- **Spending limits (Team > Billing page, requires an active paid subscription):**
  - **Warning threshold** — soft limit; team notified by email when exceeded, no other action.
  - **Disable threshold** — hard limit; if exceeded, **all projects in the team are disabled**, causing errors when running functions; re-enable by raising/removing the limit.
  - Spending limits apply only to usage **beyond plan-included amounts**; seat fees are excluded from the limit calculation (e.g., setting the limit to $0/month still bills seats but disables projects on any resource overage).
  - This spending-limit mechanism requires "an active Convex subscription" — i.e., **UNVERIFIED whether Free-plan (no subscription) teams can set a spending/warning threshold at all**; the doc's wording implies this feature is gated to paid plans.
- **Usage dashboard:** `/team/settings/usage` shows daily-breakdown metrics per resource against plan limits — this is the usage-notification/monitoring surface, separate from the billing spending-limit toggles above.
- Custom domains require Convex **Pro** plan (per Abuse Protection doc, §4).

**Implication:** On Free, the live demo risks silent-ish write failures (not an outage) once any single resource (function calls, DB storage, action compute, etc.) is exhausted for the month — spec should budget conservatively and consider the Starter plan (pay-as-you-go, same hard caps lifted) specifically to avoid demo breakage from a traffic spike, while relying on the team Usage dashboard for visibility since Free-tier spend-limit alerting is likely unavailable (no active subscription).

---

## 9. Vercel Web Analytics

**URLs:** https://vercel.com/docs/analytics ; https://vercel.com/docs/analytics/quickstart ; https://vercel.com/docs/analytics/package ; https://vercel.com/docs/analytics/privacy-policy ; https://vercel.com/docs/analytics/limits-and-pricing
**Fetched:** 2026-11-06

- **Available on all plans** (including Hobby).
- **Next.js App Router:** `import { Analytics } from '@vercel/analytics/next';` placed in `app/layout.tsx` body (`<Analytics />`). (Pages Router uses the same `@vercel/analytics/next` import in `pages/_app.tsx`.)
- **Astro:** `import Analytics from '@vercel/analytics/astro';` used as `<Analytics />` inside the Astro layout `<head>` (component form, not React).
- **Install:** `npm i @vercel/analytics`. Must also click **Enable** under the project's Analytics tab on the Vercel dashboard — enabling adds new routes scoped at **`/_vercel/insights/*`** and `/<unique-path>/*` after the next deployment.
- **`@vercel/analytics/package` config props** (passed to `<Analytics />`):
  - `mode` — override auto environment detection (`"production"`/`"development"`/`"auto"`).
  - (Doc segment captured covers `mode`; `debug` and `beforeSend` are referenced elsewhere in the full page per task brief but the specific prop signatures for `debug`/`beforeSend` were not captured in the portion read — **UNVERIFIED** exact signatures; `beforeSend` is referenced in the privacy-policy page as the redaction hook, confirmed to exist.)
- **Privacy (cookieless):** No cookies used; visitors identified by a **hash of the incoming request**, valid for a single day then automatically reset — so visitors cannot be tracked across days or across different websites. Data is anonymous and not tied to any individual or IP address.
  - **Data points collected per event:** Event Timestamp, URL, Dynamic Path, Referrer, Query Params (filtered), Geolocation (country/region/city), Device OS & Version, Browser & Version, Device Type, Script Version.
  - **Retention:** visitor session hash discarded after 24 hours; actual analytics data retention follows the plan's "Reporting Window" (see below).
  - Configurable via `beforeSend` to redact sensitive URL/query data before it's sent.
  - **Bots:** excluded from analytics by inspecting the `User-Agent` header.
  - **Resilient Intake (v2):** build-time random seed used to generate non-predictable script/intake URLs — meaning the script path and ingest path are **not fixed, documented constants** in v2; they vary per-build. The only fixed documented route prefix is **`/_vercel/insights/*`** (and a dynamic `/<unique-path>/*`), both same-origin (served from the Vercel deployment's own domain, not a third-party `vercel-scripts.com`/`vercel-insights.com` host based on what these specific pages state).
- **Limits & pricing:**
  | Plan | Included Events | Additional Events | Reporting Window |
  |---|---|---|---|
  | Hobby | 50,000/month | N/A (can't purchase more) | 1 month |
  | Pro | None included | $0.03/1K events | 12 months |
  | Pro + Web Analytics Plus (+$10/mo/team) | N/A | $0.03/1K events | 24 months |
  | Enterprise | None | Custom | 24 months |
  - **Hobby overage behavior:** collection **pauses** after reaching the monthly limit; a **3-day grace period** starts first, then capturing stops; collection **resumes after 7 days** (or next billing cycle) — Hobby teams are never billed for overage.
  - Pro/Enterprise are billed per event over the included credit.
  - Events are shared/pooled across **all projects** on the team/account.
  - Vercel sends usage notifications as you approach the limit (same on-demand usage notification system referenced in §11).
- **CSP origins:** No official Vercel documentation page defines CSP directives. **Confirmed gap:** GitHub issue `vercel/analytics#177` ("Document Content Security Policy (CSP) directives"), opened 2025-11-13, still **open** as of 2026-03-11 — maintainers have not published a CSP baseline; multiple users report ongoing violations with no official guidance. **UNVERIFIED**: the specific script host (`va.vercel-scripts.com`) and ingest host (`vitals.vercel-insights.com`) commonly cited in community discussion were **not confirmed from an official Vercel source** in this research pass — the official docs describe the script/data routes as same-origin (`/_vercel/insights/*`) under Resilient Intake v2, which may differ from older v1 behavior that used separate external hosts.

**Implication:** Because script injection and data collection are described as same-origin routes under `/_vercel/insights/*` on the deployed domain (not a documented third-party host) in the v2/Resilient Intake architecture, a CSP for the Next.js app and Astro docs site may only need `script-src 'self'` / `connect-src 'self'` rather than allow-listing `va.vercel-scripts.com` — but this must be **empirically verified** (e.g., via browser network tab on a deployed preview) since Vercel has no official CSP doc and the open GitHub issue confirms this is a known undocumented gap.

---

## 10. Vercel Speed Insights

**URLs:** https://vercel.com/docs/speed-insights ; https://vercel.com/docs/speed-insights/quickstart ; https://vercel.com/docs/speed-insights/privacy-policy ; https://vercel.com/docs/speed-insights/limits-and-pricing
**Fetched:** 2026-11-06

- **Available on all plans** (free tier on Hobby/Pro/Enterprise).
- **Next.js:** `import { SpeedInsights } from '@vercel/speed-insights/next';` → `<SpeedInsights />` in `app/layout.tsx` (App Router) or `pages/_app.tsx` (Pages Router). For Next.js < 13.5, use `@vercel/speed-insights/react` and pass `route={pathname}` manually.
- **Astro:** same `@vercel/speed-insights/astro` pattern implied by the quickstart's generic framework list (not shown in the captured excerpt, but Astro is listed among supported frameworks requiring `npm i @vercel/speed-insights` + a component/inject call).
- **Install:** `npm i @vercel/speed-insights`.
- **Privacy:** data points are anonymous, not tied to an individual visitor or IP address. Data points collected per event: Route, URL, Network Speed (4g/3g/2g/slow-2g), Browser, Device Type, Device OS, Country (ISO 3166-1 alpha-2), Web Vital (metric + value), Web Vital Attribution (DOM selector), SDK version, Server-Received Event Time.
- **Resilient Intake (v2):** same seeded, non-predictable script/intake URL scheme as Web Analytics — no fixed documented external host; package v2 required.
- **Tiers:**
  | | Speed Insights (free) | Speed Insights Plus |
  |---|---|---|
  | Price | Free on all plans | $10/project/month on Pro (included Enterprise) + on-demand events |
  | Included events | 10,000 events over the last 30 days, **shared across the team** (rolling window, not calendar-month) | None on Pro |
  | Event overage | N/A | $0.65 per 10,000 events |
  | Metrics | Real Experience Score (RES) only | All Core Web Vitals (FCP, LCP, INP, CLS, TTFB) |
  | Breakdowns | Path/route counts (Great/Needs Improvement only) | Full breakdowns incl. Poor entries, countries, element selectors |
  | Date ranges | 24h, 7 days | 24h/7d + 30 days (Pro) / 90 days (Enterprise) |
  | Drains | Not available | Available |
- **Free-tier overage behavior:** once the rolling 10,000-event/30-day allocation is hit, Vercel **pauses collection for at least 14 days**, continuing the pause while trailing 30-day usage stays above half the allocation; the site itself keeps running (no outage), and **no overage charges** accrue on the free tier. Speed Insights Plus projects are exempt from this free-tier cap entirely.
- **Sample rate:** configurable at the project level via the `@vercel/speed-insights` package (`sampleRate` prop per `/docs/speed-insights/package#samplerate`) to reduce event volume; `beforeSend` can also filter specific pages — exact prop name confirmed as `sampleRate` per cross-reference link text (not independently read in full).
- **CSP:** No CSP-specific KB article was found for Speed Insights distinct from the Web Analytics gap described in §9; **UNVERIFIED** — likely shares the same same-origin `/_vercel/insights/*`-style routing under Resilient Intake v2, but not explicitly documented.

**Implication:** Both the Next.js app and the separately-deployed Astro docs site can each run Speed Insights for free up to the shared 10K-events/30-day pool across the whole team — if both sites are on the same Vercel team, traffic from either counts against the same pool, so a popular docs site could exhaust the allocation and pause collection on the main app too.

---

## 11. Vercel Spend Management & Hobby Plan

**URLs:** https://vercel.com/docs/spend-management ; https://vercel.com/docs/plans/hobby ; https://vercel.com/docs/limits/fair-use-guidelines
**Fetched:** 2026-11-06

- **Spend Management availability: Pro and Enterprise (Flexible Commitment) plans only — NOT available on Hobby** ("Spend Management is available on Enterprise and Pro plans"). Requires Owner or Billing role.
- Spend Management covers: (1) notifications, (2) webhook triggers, (3) **pausing production deployments** of all projects when a configured USD **On-Demand Budget** threshold is hit. It applies to **metered usage beyond the plan's included monthly credit**; excludes seats, Marketplace integrations, and separate paid add-ons.
- Checks run **every few minutes** (not real-time) — actions/notifications can lag several minutes past the actual threshold crossing; recommend setting the budget below the true max tolerance.
- Alert thresholds: automatic web/email notifications at **50%, 75%, 100%** of budget; optional **SMS at 100%** only.
- `vercel billing budgets` CLI (`vercel@65.11.0`+) to set/inspect/remove budgets (`--amount`, `--pause`, `--webhook`).
- Pausing: production deployments return **503 DEPLOYMENT_PAUSED**; does **not** stop AI Gateway/v0 usage or already-stored resource billing (Deployment/Functions Storage, Blob storage, Container Registry images continue billing). Projects must be **manually unpaused** individually — raising the budget does not auto-resume.
- Webhook payload on threshold cross: `{ budgetAmount, currentSpend, teamId, thresholdPercent }`, POSTed to a configured URL, verifiable via `x-vercel-signature` header.

**Hobby plan (free):**
| Resource | Hobby Included |
|---|---|
| Fast Data Transfer | First 100 GB |
| Fast Origin Transfer | First 10 GB |
| CDN Requests | First 1,000,000 |
| Active CPU | 4 CPU-hrs |
| Provisioned Memory | 360 GB-hrs |
| Function Invocations | First 1,000,000 |
| Image Transformations | First 5,000 |
| Speed Insights Events | 10,000/30 days (shared team) |
| Web Analytics Events | 50,000/month |
| Workflow Events | 50,000/month |
| Projects | 200 |
| Function max duration | 300s (5 min) |
| Deployments/day | 100 |
| Runtime logs | 1 hour retained |
| WAF IP blocking | up to 10 |
| WAF custom rules | up to 3 |

- **Hobby overage behavior:** generally must **wait until 30 days have passed** to resume most features (Web Analytics is a documented exception with its own 7-day-after-grace-period resumption, per §9). No Spend Management is available to automatically pause a Hobby project on overage — Hobby simply enforces hard per-resource caps and re-opens them on a rolling basis.
- **Commercial-use clause (Fair Use Guidelines, "Commercial usage" section):** **"Hobby teams are restricted to non-commercial personal use only. All commercial usage of the platform requires either a Pro or Enterprise plan."** Commercial usage is defined broadly as any deployment used for **financial gain of anyone involved in any part of production** of the project (including a paid employee/consultant writing the code) — examples: payment processing, advertising a product/service for sale, being paid to build/host the site, affiliate-linking as primary purpose, ad inclusion (e.g. Google AdSense). **Donations are explicitly excluded** from the commercial-use definition.
- Account-level personal-account → Hobby-team conversion resets usage/activity logs (noted but not central to spec).

**Implication:** If vexcms's public demo or its hosting entity has any commercial nexus (e.g., vexcms is a commercial product, the demo advertises a paid CMS, or a consultant is paid to maintain it), **Hobby plan use would violate Vercel's fair-use terms** and Pro ($20/dev/mo plus usage) would be required — this is a decision point the spec must resolve explicitly rather than defaulting to Hobby for cost reasons. Separately, Spend Management (the only automatic cost-cap mechanism) is **unavailable on Hobby regardless** — Hobby's only protection against runaway usage is Vercel's hard per-resource caps and a ~30-day cool-down, with **no owner-configurable spend ceiling**.

---

## 12. External Uptime Monitors

**URLs:** https://uptimerobot.com/pricing/ ; https://betterstack.com/pricing ; https://www.checklyhq.com/pricing/
**Fetched:** 2026-11-06

### UptimeRobot (Free plan)
- **50 monitors** included, **5-minute check interval**.
- HTTP, port, and **ping monitoring; keyword monitoring included on Free**.
- 1 status page (no customization).
- 5 integrations (Google Chat, Discord, Pushover, Pushbullet, Splunk) — **no Slack/webhook/PagerDuty on Free** (those start at Solo/Team tiers).
- **No SMS/voice, no API monitoring, no multi-location checks, no SSL/domain-expiry monitoring, no heartbeat (cron) monitoring on Free.**
- Platform API access included even on Free.
- Paid tiers (Solo from €10/mo) unlock 60s intervals, SMS/voice credits (10–20 included), API/UDP/multi-location/SSL/heartbeat monitoring.

### Better Stack (Free tier)
- **10 monitors & heartbeats** included, **1 status page**, Slack & email alerts.
- (General free-tier also bundles telemetry allowances — 100K exceptions, 5K session replays, 3GB logs/traces for 3 days — not relevant to uptime specifically.)
- **Paid "Uptime monitoring" module** (separate from the free bundle, under "External monitoring"): 10 monitors included, additional 50 monitors = $25/mo. Features at this tier include **unlimited phone call alerts, unlimited SMS, push notifications, email, Slack/MS Teams/Zapier, REST API, Terraform, up to 30-second check frequency, HTTP(s) keyword checks, TCP/UDP port monitoring, POP3/IMAP/SMTP, SSL monitoring, TLD expiry, DNS server monitoring, ping, IPv6, screenshots of errors, multi-location/geo checks, multi-step incident verification, AI post-mortem analysis, uptime SLA reporting, response-time tracking, traceroute/MTR, maintenance windows, status pages.**
- **UNVERIFIED** precisely which of the paid-tier feature list (30s interval, keyword checks, multi-location, etc.) is also included in the **free** 10-monitor allocation vs. gated behind payment — the pricing page structure bundles "Uptime monitoring" as one module with a single feature list, and doesn't clearly separate free-vs-paid feature gating the way UptimeRobot's comparison table does; the "10 monitors included" line appears under both the general Free Tier summary and the paid Uptime Monitoring module, suggesting the 10-monitor free allocation already carries the full feature set (30s checks, keyword, SSL, etc.) with only additional-monitor purchases being paid — but this should be confirmed on Better Stack's site directly before relying on it.
- Heartbeats (cron/job monitoring) separately: 10 included free, additional 10 = $20/mo, up to 1-second check resolution.

### Checkly (Hobby/free plan)
- **10 uptime monitors** included free (Detect module, $0 Hobby tier), plus 1,000 browser checks/month and 10,000 API checks/month free.
- Monitor types: HTTPS, TCP, DNS, ICMP, SSL/TLS, gRPC, Traceroute, Heartbeat — **all protocol types available even on Hobby**.
- **6 public check locations** on Hobby (of 22 total), max 3 locations selectable per check; **no private locations** on Hobby.
- **Automatic retries: No on Hobby** (Starter+ only, for uptime monitors specifically — browser/API checks get retries even on Hobby).
- Alerting on Hobby: Email, Slack, Webhook — **0 SMS, 0 phone alerts** (Starter adds 100 SMS/mo, Team adds 200 SMS + 200 phone/mo).
- 1 free status page, 1 free dashboard, 20 services, 250 subscribers.
- 10 AI Root-Cause-Analysis invocations/month included free.
- Data retention on Hobby: 7 days raw, 30 days aggregated.
- 1 user only on Hobby (vs. 3 on Starter, 10 on Team).

**Keyword/body assertion comparison:**
- **UptimeRobot Free:** keyword monitoring explicitly included.
- **Better Stack:** "HTTP(s) keyword checks" listed under the Uptime Monitoring module feature set (ambiguous free/paid boundary per above UNVERIFIED note).
- **Checkly Hobby:** uptime monitors support HTTPS protocol checks; explicit "keyword"/body-assertion language wasn't itemized separately in the fetched comparison tables (Checkly's API/browser checks support assertions more generally, but the free Hobby **uptime monitor** feature list doesn't call out keyword/body matching by name) — **UNVERIFIED** whether Checkly's free HTTPS uptime monitor supports keyword/body assertions vs. status-code-only checks.

**Implication:** For a zero-cost single external check with the fastest free interval and keyword assertion support, **UptimeRobot Free (5 min interval, keyword monitoring included, no card required)** is the most straightforward no-cost fit for a go/no-go uptime check on the public demo, at the cost of a slow 5-minute interval and no SMS alerting. Better Stack's free 10-monitor allocation plausibly includes the richer paid-tier feature set (30s interval, SSL/keyword checks) at no cost but this needs direct confirmation before being specified. Checkly's free Hobby tier is the only one of the three with explicit multi-protocol monitor types (DNS/ICMP/gRPC/Traceroute) bundled for free, useful if the spec wants synthetic/API checks beyond a basic ping.

---

## 13. Vercel request headers — `x-forwarded-for`

**URL:** https://vercel.com/docs/headers/request-headers (page `last_updated: 2025-12-13`)
**Fetched:** 2026-11-06

- `x-forwarded-for`: "The public IP address of the client that made the request. If you are trying to use Vercel behind a proxy, we currently overwrite the `X-Forwarded-For` header and **do not forward external IPs**. This restriction is in place to prevent IP spoofing."
- `x-forwarded-host` is identical to `host`; `x-vercel-id` lists the regions hit.

**Implication:** inside a Vercel function (`apps/www`'s `/api/auth/[...all]` route), the first `x-forwarded-for` value is the real client IP. A request sent straight to `<deployment>.convex.site` never passes Vercel, so its `x-forwarded-for` is whatever the caller wrote. That is why step 6 needs a proxy secret.

## 14. Installed packages (read from `node_modules/.pnpm`, 2026-11-06)

- **`better-auth` / `@better-auth/core` 1.6.23** (`@better-auth/core/dist/db/type.d.mts:44-46`): `DBFieldAttributeConfig.input` is `@default true`. `better-auth/dist/db/schema.mjs` `parseInputData` only rejects or overrides a key when `fields[key].input === false`; any other field present in the request body is written as given. `parseUserInput` (same file, line 110) applies the same rule to update input.
- **In-process probe, 2026-11-06** (throwaway script, deleted). `betterAuth({ database: memoryAdapter, emailAndPassword: { enabled: true }, user: { additionalFields: { roles: { type: "string[]", defaultValue: ["user"], required: true } } } })`, then `auth.api.signUpEmail({ body: { …, roles: ["admin"] } })` → status 200, stored `roles: ["admin"]`. The same call with `input: false` on `roles` → status 200, stored `["user"]`.
- **`@better-auth/core` 1.6.23 `init-options.d.mts`:**
  - `rateLimit.storage` is `"memory" | "database" | "secondary-storage"`, default `"memory"`.
  - `customStorage` carries optional atomic `consume(key, { window, max }) → { allowed, retryAfter }`.
  - `advanced.ipAddress` has `ipAddressHeaders`, `disableIpTracking`, `ipv6Subnet` (default 64) and `trustedProxies`. With `trustedProxies` unset, "only single-value IP headers" are trusted.
- **`@convex-dev/better-auth` 0.11.5:** `convexBetterAuthNextJs().handler` copies the incoming request headers to the `.convex.site` fetch. It deletes `transfer-encoding`, `content-length`, `connection`, `x-forwarded-host` and `x-forwarded-proto`, and sets `x-better-auth-forwarded-*`. `x-forwarded-for` and any custom header pass through (§7).
- **`@convex-dev/rate-limiter` 0.4.3** (`npm pack`, `dist/client/index.d.ts`):
  - `limit(ctx: MutationCtx | ActionCtx, name, { key?, count?, throws?, reserve?, config? })`. An inline `config` is accepted.
  - `isRateLimitError(error)` is exported.
  - `./test` exports `register(t, name = "rateLimiter")`, which also registers `@convex-dev/batch-worker`.
  - Peers: `convex ^1.43.0` (catalog has 1.44.0), `react ^18.2.0 || ^19.0.0`.
- **`@vercel/analytics` 2.0.1** (`dist/next/index.mjs`): production script `/_vercel/insights/script.js` (same origin); development debug script `https://va.vercel-scripts.com/v1/script.debug.js`. `./astro` export → `dist/astro/component.ts` (default `Analytics` component).
- **`@vercel/speed-insights` 2.1.0** (`npm pack`, `dist/next/index.mjs`):
  - Production script `/_vercel/speed-insights/script.js` (same origin).
  - `https://va.vercel-scripts.com/v1/speed-insights/script.js` is used only when a `dsn` is passed (non-Vercel hosting); dev debug script is `https://va.vercel-scripts.com/v1/speed-insights/script.debug.js`.
  - Props include `sampleRate`, `beforeSend`, `dsn`, `endpoint`.
  - Subpath exports include `astro` and `next`. Peer `next >= 13`.
- **`convex` 1.44.0 CLI** (`dist/cli.bundle.cjs`, `entryPoints`): files whose basename has more than one dot are skipped (`Skipping … that contains multiple dots`), as are `schema.ts`, `_generated/` and dotfiles. So `*.test.ts` files inside `convex/` are never pushed.
- **`@astrojs/starlight` 0.38.5:** the components schema defaults `Head` to `@astrojs/starlight/components/Head.astro`. The default component reads `Astro.locals.starlightRoute.head` and takes no props. Overrides are registered via `starlight({ components: { Head: "./src/components/Head.astro" } })` (https://starlight.astro.build/guides/overriding-components/, fetched 2026-11-06).

## 15. Live probes (2026-11-06)

- `curl -sI https://vexcms.dev` and `https://docs.vexcms.dev` → `server: Vercel` on both.
- `https://vexcms.dev/_vercel/insights/script.js` → 200 `application/javascript`; `https://vexcms.dev/_vercel/speed-insights/script.js` → 200; `https://docs.vexcms.dev/_vercel/insights/script.js` → 404 (Web Analytics not enabled on the docs project).
- `npx convex function-spec` on www's dev deployment lists the public write surface:
  - 14 public mutations: `vex:create`, `vex:update`, `vex:remove`, `vex:saveView`, `vex:removeView`, `vex/globals:upsert`, `vex/media:generateUploadUrl`, `vex/media:createMediaDocument`, `vex/media:deleteMedia`, `vex/versions:saveDraft`, `vex/versions:publish`, `vex/versions:unpublish`, `vex/versions:deleteVersion`, `vex/firstUser:promoteFirstAdmin`.
  - HTTP routes: `GET`/`POST /api/auth/*`.
- The production Convex project (`usable-bee-730`) is not readable from this machine's CLI ("You don't have access to the selected project"). Every prod-data step needs the developer's credentials.

## 16. UptimeRobot pricing (supersedes §12's alerting notes)

**URL:** https://uptimerobot.com/pricing/ (served as `pricing.md` alternate)
**Fetched:** 2026-11-06

- Free: 50 monitors, 5-minute interval, HTTP/port/ping, **keyword monitoring**, 1 status page, 5 integrations (Google Chat, Discord, Pushover, Pushbullet, Splunk).
- Feature table: **Mobile app (iOS/Android): Yes on Free**. SMS/voice credits: 0 included, but credits can be bought one-time on Free too.
- Not on Free: custom headers/statuses, multi-location, SSL/domain expiry, heartbeat, maintenance windows.

**Implication:** keyword monitors plus push through the mobile app cover "alerting to your phone" at no cost.

## 17. Repo facts this spec relies on (read 2026-11-06)

- `apps/www/src/components/AdminDemoButton.tsx:7-23`: the Admin button is a plain `/admin` link. It mints no anonymous session ("no session of any kind is created anymore").
- `apps/www/convex/auth/plugins/index.ts:22`: `anonymous()` is still registered. `apps/www/convex/auth/options.ts:37-39`: `emailAndPassword: { enabled: true }` with no `disableSignUp`.
- `apps/www/convex/auth/schema.ts:33-37`: `roles` with no `input` flag. The same pattern is in `apps/test/src/auth/schema.ts:37-41`, `packages/create-vexcms/templates/base-nextjs/convex/auth/schema.ts:36-40`, `packages/better-auth/README.md:34` and `apps/docs/src/content/docs/guides/auth.mdx:65`.
- `apps/www/convex/vex/firstUser.ts:16`: `isBootstrapped` runs `ctx.db.query(TABLE_SLUG_USERS).collect()`. `apps/www/src/app/(frontend)/layout.tsx:35` mounts `<FirstAdminBootstrap />` on every frontend route, and it subscribes unconditionally (`FirstAdminBootstrap.tsx:27`). The marketing template has the same files.
- `apps/www/src/app/(vexcms)/admin/[[...path]]/page.tsx`: when session verification fails (Convex unreachable), the page redirects to `/unauthorized`.
- No `crons.ts`, no `app.use(...)` and no Convex component exist anywhere in `apps/` or `packages/`. `apps/www` has no Convex tests.
- `packages/core/src/config/config.ts:269-281`: `defineServerConfig` already checks auth collections for drift (`diffAuthCollections` → `VexAuthConfigError`). Its tests live in `packages/core/src/config/config.test.ts`, `describe("defineServerConfig")`, with `makeMockAuthAdapter`.
- `pnpm-workspace.yaml` catalog: `@edge-runtime/vm: 5.0.0`, `convex-test: 0.0.38`, `vitest: 4.1.10`, `@vercel/analytics: "^2.0.1"`, `@astrojs/starlight: 0.38.5`.
