# CDN & Edge Caching for vexcms

**Date:** 2026-09-04 · **Status:** exploratory, no decision taken

## Question

Can `@convex-dev/r2` (Convex Cloudflare R2 component) be the basis for letting
vexcms users put content on a CDN and use other Cloudflare features? What are
the industry-standard options for caching static content at the edge?

## Answer

**"CDN caching" is three separate problems in this codebase.** R2 addresses one
of them well, half of another, and none of the third — which is the one with the
biggest win available.

| Problem | Today | R2's role |
| --- | --- | --- |
| 1. Asset bytes (uploaded media) | `ctx.storage.getUrl()` → `<deployment>.convex.cloud/api/storage/<uuid>`. Convex origin, Convex egress, no custom domain, no cache-rule control | **Solves it.** Custom domain on the bucket = Cloudflare edge cache + free egress |
| 2. Image derivatives (srcset, formats) | None. `next/image` proxies `convex.cloud` through Vercel's optimizer | **No.** Needs Cloudflare Images or an equivalent transform CDN |
| 3. HTML / query responses | **Actively disabled.** `convex/nextjs` `fetchQuery` sets `cache: "no-store"`, which makes every consuming App Router route dynamic | **No.** Orthogonal to storage |

### Finding that reframes the whole question

`node_modules/convex/dist/esm/nextjs/index.js:50` — `client.setFetchOptions({ cache: "no-store" })`.

Every `fetchQuery` call opts its route out of static generation. `apps/www` has
no `export const dynamic`, and `apps/www/next.config.ts` does not enable
`cacheComponents`, so **`apps/www` public pages render per request on Vercel
today** — one function invocation plus one Convex round trip per hit, zero CDN
caching of HTML. That is the largest available win and it has nothing to do with
R2.

Mitigating context: `apps/www/src/app/(frontend)/(site)/PageContent.tsx:31-33`
already client-subscribes via `convexQuery` + react-query with the server fetch
as `initialData`. So the architecture is *already* "shell + live hydration" — an
edge-cached shell only affects first paint, which makes aggressive `s-maxage`
much cheaper to get right than it would be on a fully server-rendered site.

---

## Problem 1 — Asset delivery via R2

### What the component gives

Signed-URL client upload (`useUploadFile`), `r2.store()` from actions with a
`cacheControl` option, `r2.getUrl()`, `deleteObject`, `getMetadata`,
`listMetadata`/`pageMetadata`, and `checkUpload`/`onUpload`/`onSyncMetadata`
callbacks. Multi-bucket via separate `R2` instances sharing one metadata table.

It maps almost 1:1 onto the adapter contract that already exists
(`StorageAdapterPresignedUrl`: `generateUploadUrl`, `uploadFile`,
`createMediaDocument`, `deleteMedia`, `getUrl`), and "S3/R2/Vercel Blob storage
adapters" is already on the roadmap. Low structural risk.

### Two mismatches to fix first

1. **`r2.getUrl()` is the wrong URL for a CMS.** It returns a signed S3-endpoint
   URL that expires (default 900 s) and *bypasses Cloudflare's cache* — the
   component's own docs say so and tell you to attach a custom domain and build
   the URL from the object key instead. So an R2 adapter's `getUrl` should be:
   `publicBaseUrl` configured → `${publicBaseUrl}/${encodeKey(key)}` (stable,
   unsigned, cacheable); otherwise fall back to signed for private buckets.

2. **`src` is resolved and persisted at creation time**
   (`packages/file-storage-convex/src/adapter/methods.ts:35`). A URL baked into
   the document is wrong forever the moment the CDN hostname changes, and it
   makes migrating between adapters a data migration. Persist the **key +
   adapter name**; resolve the URL at read time. Worth fixing before R2 lands,
   not after.

### Cache-key strategy (pick one)

- **Immutable content-addressed keys** — `media/<sha256>/<filename>` plus
  `Cache-Control: public, max-age=31536000, immutable`. Purging never required;
  replacing a file mints a new key. This is the standard (`/_next/static`,
  S3+CloudFront, Vercel Blob). Gives you dedupe-by-hash for free and lines up
  with the in-flight versioning/drafts spec, where "replace file" becoming "new
  version" is the desired semantic anyway.
- **Mutable key + version query** — `?v=<updatedAt>`. Simpler; Cloudflare's
  default cache key includes the query string so it works, but the naked URL
  still needs purging.

Setting the header: `r2.store()` accepts `cacheControl`, but the **client
signed-PUT path does not** — so either route uploads through an action, or set
headers at the edge with a Cloudflare Cache Rule / Transform Rule on the custom
hostname. The edge rule is the better answer for client-side uploads because it
applies regardless of object metadata.

---

## Problem 2 — Image derivatives

Nothing exists today: the media document carries only `width?`/`height?`
(`apps/test/convex/vex.schema.ts:458-468`), no variants.

- **URL-based transform CDN** — Cloudflare Images / Image Resizing
  (`/cdn-cgi/image/width=800,format=auto/<url>`), or imgix/Cloudinary. No stored
  derivatives, no build step, arbitrary future sizes. Wire it as a `next/image`
  custom loader so images stop transiting Vercel's optimizer. **Recommended** —
  modern default, least code, and `apps/www/next.config.ts:60-64` already has a
  comment inviting a CDN host into `remotePatterns`.
- **Generate fixed variants on upload** — WordPress's model. Predictable cost,
  but wrong sizes are permanent and regeneration needs a backfill job. On Convex
  it means an action plus a wasm codec, fighting action time/memory limits.
- **On-demand derivative cached back to R2** — a Worker transforms on miss and
  writes the result to the bucket. Best economics at scale, most moving parts.

---

## Problem 3 — HTML / query-response caching

### Unblocking the `no-store`

1. **Cacheable read API via Convex HTTP actions.** Serve public reads from an
   `httpAction` you control, with real `Cache-Control` + `ETag`, and front it
   with a CDN. This is the Contentful CDA model (`cdn.contentful.com`: ETag,
   long TTL, edge-cached) and it also lets the read API live on the customer's
   own hostname. Most work, most control, CDN-agnostic.
2. **Cache boundary above the Convex call.** Next 16.3's `"use cache"` +
   `cacheLife`/`cacheTag` (needs `cacheComponents`) caches the *function result*
   regardless of the inner fetch's `no-store`; `unstable_cache` is the 15-era
   equivalent. Tag per document — `cacheTag(\`vex:pages:${slug}\`)` — and purge
   with `revalidateTag`. Least work if the deployment target stays Vercel.

### Invalidation is the missing primitive

There is no mutation-side hook: `packages/core/src/api/server.ts` registers
create/update/remove with RBAC and no callbacks, and lifecycle hooks
(`beforeChange`/`afterChange`) are marked future on the roadmap
(`apps/docs/src/content/docs/roadmap.md:52`). The standard headless-CMS pattern
is publish → webhook → `revalidateTag`.

- **Cheap path:** `convex-helpers` `Triggers` (already a dependency, 0.1.120)
  wrapping the generated mutations; fire an action that POSTs collection + id +
  slug to the app's `/api/revalidate`.
- **Right path:** build the roadmap's `afterChange` hook and make revalidation
  its first consumer. Cache invalidation, search-index sync, and webhooks are
  all the same hook — building it once for three consumers is the better trade.

### Purge granularity constraint

Cloudflare's `Cache-Tag` header and purge-by-tag are **Enterprise-only**. On
Free/Pro you get purge-by-URL and purge-everything. If the HTML cache is
Cloudflare's, you need a document→URL dependency map and expand tags to URLs at
purge time. Reference designs: Drupal cache tags + Purge module, Fastly
`Surrogate-Key`, Varnish `xkey`.

The escape hatch that dodges all of it:
`Cache-Control: public, s-maxage=60, stale-while-revalidate=86400`, accepting
bounded staleness — defensible here precisely because `PageContent` hydrates to
a live subscription.

---

## Product-shape fork (decide before writing code)

- **BYO-Cloudflare.** User creates bucket, API token, custom domain; vexcms
  ships `@vexcms/file-storage-r2` plus docs. Zero ops, zero billing surface, and
  it matches the "adapters are *the* extension story" positioning already
  written down in `.agent/docs/specs/2026-08-30-launch-readiness/spec.md:1067`.
  **This is the v1.**
- **Platform-managed.** Provisioning buckets and hostnames on users' behalf via
  the Cloudflare REST API, and letting a customer point `cdn.theirdomain.com` at
  your infrastructure, requires **Cloudflare for SaaS / Custom Hostnames (SSL
  for SaaS)**. That is the standard mechanism, and it is a billing, support, and
  liability surface rather than a feature. Not v1.

Note also that the R2 component is **only object storage over the S3 API**. It
does not expose Cache Rules, purge, Images, Workers, or custom hostnames —
those are separate Cloudflare REST APIs called from Convex actions with a scoped
token.

## Platform limits that set the tradeoff math

From Convex's limits page and Cloudflare's R2 pricing page (both fetched
2026-09-04):

| Constraint | Value | Why it matters here |
| --- | --- | --- |
| Convex file egress | **$0.12/GB** | Serving media from Convex is the dominant cost of a media-heavy site |
| Convex file access | **counts as a function call** | 1M/month included, then $2.20/M. Every image request burns quota |
| Convex file storage | $0.03/GB-month | vs R2 at $0.015 |
| R2 egress | **$0** | The decisive number |
| R2 free tier | 10 GB storage, 10M Class B reads/month | A typical customer site never leaves the free tier |
| Convex-runtime action RAM | **64 MiB** | Kills in-Convex image processing (a 4000×3000 RGBA decode alone is ~48 MB) |
| Node-runtime action | 512 MiB, 10 min, $0.32/GB-hour | Image processing is possible but metered |
| Convex query cache | 1 GB shared (S16) | Repeat identical queries are already cached server-side — the missing HTML cache is less catastrophic than it looks |
| HTTP action response | 20 MiB | Ample for a cacheable read API |

**Worked example** — 5 GB of media, 500k image requests/month at ~200 KB
average (≈100 GB egress):

- Convex storage: $0.15 storage + **$12.00 egress** + 500k function calls
- R2 + custom domain: $0 storage (free tier) + **$0 egress** + Class B reads
  only on cache misses

At 10M requests/day the same comparison is roughly **$104/month on R2 versus
~$7,000/month of Convex egress**. Two orders of magnitude. This is not a
marginal optimisation; for any customer with real media volume it is the
difference between viable and not.

---

## Tradeoffs, option by option

Frame used throughout: **build cost · run cost · reversibility · what it
forecloses · failure mode**.

### Asset storage: stay on Convex

- **Build:** zero. Already shipped.
- **Run:** $0.12/GB egress plus a function call per file access. Scales
  linearly and badly.
- **Reversibility:** high *if* URLs are derived, near-zero as built today
  (`src` is persisted per document, so migrating means rewriting every media
  row in every customer deployment).
- **Forecloses:** custom domains, cache rules, edge transforms, signed private
  media with your own policy, per-tenant asset hostnames.
- **Failure mode:** a customer's launch traffic produces a surprise Convex bill,
  and the fix is a data migration they have to run.

### Asset storage: R2 adapter, BYO credentials

- **Build:** moderate. The adapter contract already exists; the work is one
  package plus the `src`→key refactor plus documenting bucket/token/domain
  setup.
- **Run:** effectively $0 for typical sites. Cost moves onto the customer's
  Cloudflare account, which is also where the blame goes when it misconfigures.
- **Reversibility:** high. It is one adapter among several; S3 and Vercel Blob
  follow the same shape.
- **Forecloses:** nothing. It *opens* Cloudflare Images, cache rules, and
  per-tenant domains as later config-only additions.
- **Failure mode:** setup friction. Five environment variables, a CORS policy,
  an API token, and a DNS record is a real onboarding cliff — the reason to
  keep the Convex adapter as the zero-config default.

### Asset storage: platform-managed (you provision buckets and hostnames)

- **Build:** high. Cloudflare REST API integration, credential custody,
  per-tenant key namespacing, and **Cloudflare for SaaS / Custom Hostnames**
  for customer-owned CDN domains.
- **Run:** you carry the egress, the storage, and the support burden.
- **Reversibility:** low. Once customers' assets live in your buckets under
  your hostnames, you cannot exit without migrating their data and their DNS.
- **Forecloses:** the "self-hosted, you own your data" positioning — this turns
  vexcms from a library into a service with a hosting business attached.
- **Failure mode:** it is a company, not a feature. Abuse handling, quota
  enforcement, and billing all become yours.

### Cache keys: immutable content-addressed vs mutable + version query

- Content-addressed (`media/<sha256>/<name>` + `max-age=31536000, immutable`)
  costs a hash on upload and makes "replace this file" into "new object". In
  exchange **purge never happens**, which removes the entire
  Cloudflare-tier/purge-API problem from the design, and gives dedupe for free.
  It is also the only scheme that is correct across *every* CDN, so it does not
  bind you to a vendor.
- Mutable key + `?v=<updatedAt>` is less work and keeps human-readable paths
  (which matters for SEO and for users who look at URLs), but leaves the naked
  URL cached and therefore keeps you dependent on a purge mechanism.
- **Evolvability verdict:** content-addressed is the higher-optionality choice
  and the cost is a hash. The one thing it forecloses is pretty URLs for media;
  if that matters, a Worker or a redirect table can map slugs to hashes later.

### Image derivatives: transform CDN vs generate-on-upload vs Worker-cached

| | Transform CDN (Cloudflare Images/imgix) | Generate on upload | Worker transform, cached to R2 |
| --- | --- | --- | --- |
| Build | Low — a `next/image` loader | High — Node action + codec, backfill job | High — Worker + cache-write path |
| Run | Per-transform vendor fee | Node action compute ($0.32/GB-hour) + storage per variant | Cheapest at volume |
| New size needed later | Free, instant | **Backfill every asset** | Free, lazily filled |
| Reversibility | High — swap the loader | Low — variants are data you now own | Medium |
| Forecloses | Vendor-neutrality unless the loader is abstracted | Arbitrary future sizes; art direction changes | Little |

The asymmetry that decides it: **unknown future requirements around image sizes
are guaranteed.** Design systems change, art direction changes, AVIF replaces
WebP. Generate-on-upload is the only option where each of those is a migration.
Convex's 64 MiB action RAM ceiling independently rules out doing it in the
Convex runtime at all.

### HTML caching: do nothing vs cacheable read API vs Next cache boundary

- **Do nothing** (today). Build zero. Run cost is one Vercel invocation plus one
  Convex round trip per page view — partly absorbed by Convex's shared query
  cache. Reversible trivially. Forecloses nothing. Rational to defer, and the
  reactive `PageContent` hydration means the user-visible benefit of caching is
  first-paint latency, not correctness. **Defensible as a deliberate choice for
  v1** — but say it out loud rather than shipping it by accident, which is the
  current situation.
- **Cacheable read API (Convex `httpAction` + `Cache-Control`/`ETag`).** High
  build cost: a second read surface to design, version, and secure. But it is
  the only option that is framework-neutral and CDN-neutral, which matters
  because the roadmap already promises a **TanStack Start adapter**. It also
  opens per-customer API hostnames and a public content API — a plausible future
  requirement for a headless CMS.
- **Next cache boundary (`"use cache"` + `cacheTag`/`revalidateTag`).** Lowest
  build cost if the target stays Vercel. **The trap:** if the API you expose is
  "call `cacheTag()` in your page", your cache contract *is* Next's cache
  contract forever, and the TanStack adapter cannot implement it. Keep the tag
  vocabulary inside vexcms (a `cachePolicy` on the collection, translated by the
  framework adapter) and this becomes reversible instead of load-bearing.

### Invalidation: tag purge vs URL purge vs bounded staleness

- **Cache-Tag purge** is Cloudflare **Enterprise-only**. Depending on it means
  your caching story only works for enterprise customers — a hard segmentation
  you probably do not want in an open-source CMS.
- **URL purge** works on every tier but requires maintaining a document→URL
  dependency map. That map is the same artifact regardless of CDN, so building
  it is portable work (Drupal's cache-tags model, Fastly `Surrogate-Key`).
- **Bounded staleness** (`s-maxage` + `stale-while-revalidate`) needs no map, no
  purge API, and no CDN tier. It is wrong for at most `s-maxage` seconds, and
  the live client subscription corrects it after hydration.
- **Verdict:** ship staleness first, add the URL map when someone complains.
  The map is additive; nothing about the staleness approach blocks it.

---

## The two moves that buy the most optionality

Both are refactors, not features. Both are cheap now and expensive after
customers have production data. Neither commits you to any CDN decision.

**1. Make the asset URL computed, never stored.** Persist
`(adapterName, key)` on the media document; derive the URL at read time from
adapter config. With this in place, *every* subsequent choice — R2, S3,
Cloudflare Images, signed private media, a per-tenant CDN hostname, migrating
between any two of them — is a configuration change. Without it (today's
behaviour, `methods.ts:35`), each one is a data migration you must write, ship,
support, and talk customers through. This single indirection is what converts
the entire CDN question from an architecture decision into a reversible one.

**2. Build the `afterChange` lifecycle hook.** It is the join point for six
things already on the roadmap or in these two documents: cache invalidation,
search-index sync, outbound webhooks, audit log, scheduled publish, and the
dynamic-field secondary index. One primitive, six consumers, and it forecloses
nothing. `convex-helpers` `Triggers`
(`node_modules/convex-helpers/server/triggers.d.ts` — `register(table, (ctx,
change) => …)` with `insert`/`update`/`delete` and `oldDoc`/`newDoc`) is
already a dependency and gives the mechanism for free; the design work is the
public API, not the plumbing.

Do both before choosing a caching strategy. Then the caching strategy stops
being a bet.

## Suggested sequencing

1. Fix `src`-resolution: persist key + adapter, resolve URL on read.
2. `@vexcms/file-storage-r2` with `publicBaseUrl` → unsigned CDN URLs, immutable
   content-addressed keys, `Cache-Control: immutable`.
3. `next/image` custom loader for Cloudflare Images (opt-in via config).
4. `afterChange` lifecycle hook (roadmap item) — unblocks everything below.
5. Page caching: `"use cache"` + `cacheTag` per document, `revalidateTag` from
   the hook. Ship with `stale-while-revalidate` as the safety net.

## Sources

- https://github.com/get-convex/r2 (README, full) — component API, custom-domain
  CDN section, `cacheControl` on `store`, signed-URL expiry semantics
- https://www.convex.dev/components/cloudflare-r2
- https://docs.convex.dev/production/state/limits — egress, function-call
  billing, action RAM, query cache, HTTP action response size
- https://developers.cloudflare.com/r2/pricing/ — $0 egress, free tier, Class
  A/B operation pricing
- Cloudflare docs referenced by the component: R2 custom domains, default cached
  file extensions, CORS policy setup; Cloudflare for SaaS (Custom Hostnames) for
  the managed variant

## Code references

- `node_modules/convex/dist/esm/nextjs/index.js:50` — `setFetchOptions({ cache: "no-store" })`
- `packages/core/src/media/types.ts:113-380` — `StorageAdapterPresignedUrlInterface`
- `packages/file-storage-convex/src/adapter/methods.ts:35,97` — URL resolved at
  create time into `src`; `getUrl` re-resolves per read
- `apps/test/convex/vex.schema.ts:458-468` — media document shape, no variants
- `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx:21` — `fetchQuery`, no cache directives
- `apps/www/src/app/(frontend)/(site)/PageContent.tsx:31-33` — reactive `convexQuery` with `initialData`
- `apps/test/src/app/(frontend)/page.tsx:7` — `export const dynamic = "force-dynamic"`
- `apps/www/next.config.ts:60-64` — `remotePatterns` derived from `NEXT_PUBLIC_CONVEX_URL`
- `packages/core/src/api/server.ts` — no mutation-side hook point
- `node_modules/convex-helpers/server/triggers.d.ts` — `Triggers.register(table, (ctx, change) => …)`, `insert`/`update`/`delete` with `oldDoc`/`newDoc`

## Open questions

- Is the target audience developer-BYO or non-technical/managed? Decides the
  whole scope.
- Do public pages want live reactivity at all? If yes, HTML caching only ever
  buys first paint, and problem 3 drops in priority behind problems 1 and 2.
- Does dropping `apps/test`'s `force-dynamic` break admin-preview flows?
- Is bounded staleness (`s-maxage` + `stale-while-revalidate`) acceptable to the
  target customer, or is instant purge a requirement? Instant purge on
  non-enterprise Cloudflare forces the document→URL map.
- Does the TanStack Start adapter on the roadmap need to implement the same
  cache contract? If yes, the cache API must not be Next's.
