# SEO & Prerendering Audit — vexcms public pages

**Date:** 2026-09-04 · **Status:** empirical audit, findings verified by build +
HTTP inspection · **Supersedes assumptions in** `cdn-edge-caching-options.md`

## Question

Many CMSs hurt SEO because content is fetched from the database dynamically,
ruining first render and indexing. Does vexcms suffer from this? Does it affect
users' **public site pages**, or only the admin panel? Is it fixable by config?

## Answer

**Three separate verdicts, and they do not point the same way.**

1. **Indexability: not affected.** Content *is* in the server-rendered HTML.
   vexcms does not have the classic empty-shell problem.
2. **Prerendering and cacheability: fully broken, app-wide.** Every route in
   every scaffolded project is dynamic, including pure-static pages with no data
   fetching. Not fixable by config.
3. **SEO metadata hygiene: several real gaps** — no sitemap, no robots, no
   canonical, no OG tags in practice, and a silent HTTP-200-empty-page failure.

The damage lands **entirely on users' public pages**. The admin panel is
authenticated and should be dynamic — dynamic rendering there costs nothing. The
defect is that the *admin panel's* requirement (a cookie read for auth) has been
hoisted into the **root layout**, where it contaminates the public site.

---

## Evidence

### Content is server-rendered (so indexing is fine)

`apps/www` production build, `next start`, `curl http://127.0.0.1:3131/`:

```
h1 (1): ["The CMS that thinks in types."]
h2 (6): ["Everything comes from one schema.", "Write the collection. Get the database.",
         "From zero to a live CMS in four steps.", "Roadmap",
         "Questions we keep getting.", "Start with a schema. Ship in an hour."]
h3 (21): ["Convex-native codegen", "End-to-end types", "Real-time admin panel", …]
```

All of that text originates in Convex documents and is present in the initial
HTML byte stream. The reason: `PageContent` is a `"use client"` component, but
Next.js still server-renders client components on first request, and the page
passes the server `fetchQuery` result in as `initialData`. `"use client"` means
*hydrated*, not *client-only* — a distinction that is exactly where other CMS
stacks get this wrong.

**Googlebot sees the content without executing JavaScript.** This part of the
architecture is correct and should not be changed.

### Every route is dynamic — including a page with no data at all

Build output, unmodified `apps/www`:

```
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /(...)auth/[pathname]
├ ƒ /[slug]
├ ƒ /admin/[[...path]]
├ ƒ /api/auth/[...all]
├ ƒ /auth/[pathname]
└ ƒ /unauthorized

ƒ  (Dynamic)  server-rendered on demand
```

Zero `○` (static) and zero `●` (SSG) routes. `.next/prerender-manifest.json`
lists only `/_global-error`.

**Controlled experiment.** A throwaway route was added at `src/app/seo-probe/`
containing nothing but:

```tsx
export default function SeoProbe() {
  return <h1>static, no data, no fetch</h1>
}
```

No imports, no Convex, no fetch. It still built as `ƒ /seo-probe`. (An earlier
attempt at `src/app/__seo-probe/` never appeared in the route table at all —
`_`-prefixed folders are private in the App Router and excluded from routing.)
Probe removed afterwards; baseline re-verified at 8 routes.

**Conclusion: the cause is above the page layer.** No page-level or
`next.config.ts` change can fix it.

### Response headers confirm nothing is cacheable

```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

Explicitly uncacheable by every CDN, proxy, and browser. TTFB measured locally
(zero network latency to the client): **781 ms cold, 342 ms warm** — almost all
of it Convex round trips. Production adds Vercel cold start and inter-region
latency on top.

---

## The two independent blockers

Both are real; **fixing either one alone changes nothing.**

### Blocker 1 — cookie read in the root layout (the app-wide one)

`apps/www/src/app/layout.tsx:76` renders `<ServerProviders>`, which renders
`AuthServerProvider` (`src/components/providers/auth.tsx:7`):

```ts
const sessionToken = await getToken();
```

`getToken()` reads cookies. A cookie read in the **root layout** makes every
route in the application dynamic — public marketing pages included. This is what
the `seo-probe` experiment isolated.

`ThemeStyle` (`src/app/layout.tsx:73` → `components/ThemeStyle.tsx:40`) is a
second root-layout offender: an uncached `fetchQuery(api.theme.getActive)` on
every request.

### Blocker 2 — `fetchQuery` is hard-wired to `no-store`

`node_modules/convex/dist/esm/nextjs/index.js:50`:

```js
client.setFetchOptions({ cache: "no-store" });
```

Applied by `convex/nextjs`'s `setupClient`. Any route whose render path touches
`fetchQuery` is dynamic. In `apps/www` that is the page, the `(site)` layout,
`ThemeStyle`, and `generatePageMetadata`.

**Important:** this is only in the `convex/nextjs` wrapper. A raw
`ConvexHttpClient` (`convex/browser`) leaves `fetchOptions` undefined
(`http_client.js:53,142`), so it does **not** force `no-store` and can
participate in ISR or a `"use cache"` boundary. The escape hatch exists.

---

## This is a template defect, not an `apps/www` mistake

The same structure ships to every user:

| File | Root layout renders | Auth provider reads cookies |
| --- | --- | --- |
| `apps/www/src/app/layout.tsx:76` | `ServerProviders` + `ThemeStyle` | yes |
| `apps/test/src/app/layout.tsx:56` | `ServerProviders` + `ThemeStyle` | yes |
| `packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx:40` | `ServerProviders` | `providers/auth.tsx:7` — yes |
| `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx:79` | `ServerProviders` + `ThemeStyle` | inherits base |

So **every project scaffolded with `create-vexcms` is un-prerenderable out of
the box**, and the user did not do anything wrong to cause it. It is not
something they can fix with config either — the offending code is in the
scaffold's root layout, and the `no-store` is inside a dependency.

---

## Redundant round trips per public page render

Counted from source; all sequential, none deduplicated (`no-store` defeats
Next's fetch-level dedup and nothing is wrapped in `React.cache()`):

| Source | Query |
| --- | --- |
| `components/ThemeStyle.tsx:40` | `theme.getActive` |
| `components/providers/auth.tsx:7,11` | cookie read, then `auth.api.getUserOrg` when signed in |
| `app/(frontend)/(site)/layout.tsx:25` | `headers.getFirst` |
| `app/(frontend)/(site)/layout.tsx:26` | `footers.getFirst` |
| `lib/metadata.ts:19` | `siteSettings.get` |
| `lib/metadata.ts:26` | `pages.getBySlug` |
| `lib/metadata.ts:73` | `vex.media.getUrl` (when an OG image is set) |
| `app/(frontend)/(site)/page.tsx:17` | `pages.getBySlug` — **duplicate of `metadata.ts:26`** |

Six to eight serial Convex round trips per page view, one of them a literal
duplicate. Every one of them is in front of the first byte. That is the TTFB
number above, and TTFB feeds LCP, which is a ranking signal.

---

## Metadata gaps found in the served HTML

| Check | Result |
| --- | --- |
| `<title>` | ✅ `Home \| Vex CMS` |
| `<meta name="description">` | ❌ absent |
| `og:title` / `og:image` | ❌ absent |
| `<link rel="canonical">` | ❌ absent |
| `metadataBase` | ❌ not set |
| JSON-LD structured data | ❌ absent |
| `app/sitemap.ts` | ❌ does not exist in either app or either template |
| `app/robots.ts` | ❌ does not exist in either app or either template |

Two are code defects rather than missing content:

- `lib/metadata.ts:51-53` only sets `openGraph` **when an OG image resolves**.
  With no image configured, the page emits no OG title or description at all.
  Title and description should be unconditional; the image should be the only
  conditional part.
- `lib/metadata.ts:20-22` returns `{ title: "Untitled" }` when `siteSettings` is
  missing, and `:60-63` returns `{ title: "Vex CMS" }` on any thrown error.

### The worst finding: HTTP 200 with an empty body

`app/(frontend)/(site)/page.tsx:20-24` wraps `fetchQuery` in a `try {} catch {}`
that swallows the error and leaves `initialData` undefined. `PageContent`
(`PageContent.tsx:37-39`) then returns `null`:

```tsx
if (isPending && initialData === undefined) {
  return null
}
```

So a transient Convex failure at render time produces **a 200 response with no
content**. To a crawler that is a soft 404 served as success — Google may index
the empty version or drop the URL. This is worse for SEO than the entire caching
question, and it is a handful of lines to fix: `notFound()` for a genuinely
missing page (correct 404), and let infrastructure errors throw so the framework
returns 500 instead of a misleading 200.

---

## Fix feasibility — proven by spike, not asserted

A throwaway spike removed **only** the two root-layout blockers and added two
probe routes. Both root-layout edits were reverted with `git checkout --` and
the baseline route table re-verified afterwards.

Spike edits:
- `providers/auth.tsx` — `await getToken()` stubbed out
- `app/layout.tsx` — `<ThemeStyle />` removed

Probes:
- `app/seo-probe-a/page.tsx` — pure static JSX, no data
- `app/seo-probe-b/page.tsx` — `ConvexHttpClient` query + `export const revalidate = 3600`

Result:

```
Route (app)                Revalidate  Expire
┌ ƒ /
├ ○ /_not-found
├ ƒ /(...)auth/[pathname]
├ ƒ /[slug]
├ ƒ /admin/[[...path]]
├ ƒ /api/auth/[...all]
├ ƒ /auth/[pathname]
├ ○ /seo-probe-a
├ ○ /seo-probe-b                   1h      1y
└ ○ /unauthorized

○  (Static)   prerendered as static content
```

And the prerendered artifact `.next/server/app/seo-probe-b.html` contains the
**Convex document title**, baked in at build time with no server involved:

```
self.__next_f.push([1,"8:[\"$\",\"h1\",null,{\"children\":[\"probe B: \",\"Home\"]}]\n"])
```

Four conclusions, all now evidence-backed rather than inferred:

1. **Removing the root-layout cookie read is sufficient to make routes
   prerenderable.** `/seo-probe-a`, `/_not-found`, and `/unauthorized` all
   flipped `ƒ` → `○`. The last two are free wins that need no other work.
2. **Convex data prerenders correctly with ISR** via `ConvexHttpClient` +
   `revalidate`. The worry that Convex's HTTP POST queries cannot participate in
   Next's caching is **unfounded** — the page is prerendered at build and
   revalidated on a timer, so the POST never happens on the request path at all.
3. **The two blockers are genuinely independent.** `/` and `/[slug]` stayed `ƒ`
   in the spike because they still call `fetchQuery` (blocker 2) directly and via
   the `(site)` layout. Fixing only the layout does not fix the content routes.
4. **No hidden third blocker exists.** This was the main risk going in, and the
   spike rules it out: nothing else in the tree forces dynamic rendering.

### Risk assessment per fix

| Fix | Mechanically hard? | Risk | Why |
| --- | --- | --- | --- |
| 200-with-empty-body | No | **Low** | Replace `return null` with `notFound()`; stop swallowing errors. Local to two files |
| `sitemap.ts` / `robots.ts` / canonical / OG | No | **Very low** | Purely additive new route files plus ~15 lines in `metadata.ts`. Nothing can regress |
| Move cookie read out of root layout | No | **Low–medium** | Only *one* consumer of `useAuth` exists (`auth/hasPermission.ts`, used solely by `components/AdminDemoButton.tsx`), and `AuthContext`'s default is `{ user: null }` (`context/AuthContext.tsx:10`) so unwrapped reads degrade instead of throwing. Risk is provider-composition churn across templates, not logic |
| `ThemeStyle` in root layout | No | **Low** | Either cache the theme read or move it below the public boundary. `ThemeLive` already re-subscribes client-side, so first-paint theming is the only concern |
| Cached read helper in `@vexcms/next` | No | **Low** | New export; `@vexcms/next` currently ships no data-fetching surface at all (only `NextAdminPage`/`NextAdminLayout`), so there is nothing to break |
| `generateStaticParams` for `[slug]` | No | **Low** | Needs one new `pages.listSlugs` query |

**Verdict: yes, straightforwardly and reliably.** No architectural change, no
dependency fork, no Convex feature requests. The largest single item is
provider re-composition in two templates, and the blast radius there is one demo
component.

The one thing that is *not* mechanical is the product decision inside fix 3:
whether public pages need server-known auth state at all (see open questions).
If they do, it has to move to a client component, which is a small refactor but
a deliberate one.

### Incidental defect found while tracing providers

`ConvexClientProvider` is mounted **twice** on every request:
`app/layout.tsx:76-77` renders `ServerProviders` → `ClientProviders`, and both
render it (`providers/server.tsx:11`, `providers/client.tsx:10`). On the server
`getClients()` (`providers/convex.tsx`) deliberately builds fresh clients per
call to avoid cross-request leaks, so this constructs two `ConvexReactClient` +
`QueryClient` pairs per render; the inner one wins for children and the outer is
wasted. Present in `apps/www`, `apps/test`, and both templates.

**RESOLVED 2026-09-04.** `ConvexClientProvider` removed from
`providers/server.tsx` in `apps/www`, `apps/test`, and
`templates/base-nextjs` (`marketing-site` has no provider overlay and inherits
base). The copy in `ClientProviders` is the one that reaches `children`;
nothing between the two needs Convex, and server components cannot read React
context anyway. Verified: `pnpm typecheck` clean, production build clean, and
`/`, `/features`, `/roadmap` all still render Convex content
(`h1` + 6/4/2 `h2`s respectively); `/admin` still 307s to sign-in,
`/auth/sign-in` and `/unauthorized` still 200.

---

## Slug-driven collection pages: can they be prerendered?

**Yes — proven.** This was the open worry: a `pages` collection rendered by
slug seems inherently dynamic, and build-time data seems doomed to go stale.
Neither holds.

A second spike added `app/seo-probe-slug/[slug]/page.tsx` with
`generateStaticParams` reading the collection through the already-deployed
generic `api.vex.find`, plus an `app/api/seo-probe-revalidate/route.ts` calling
`revalidatePath`. Both removed afterwards; baseline re-verified.

### 1. Slugs are discovered at build and each page is prerendered

```
[spike] generateStaticParams -> [{"slug":"features"},{"slug":"roadmap"},{"slug":"home"}]

├   /seo-probe-slug/[slug]
│ ├ ● /seo-probe-slug/features
│ ├ ● /seo-probe-slug/roadmap
│ └ ● /seo-probe-slug/home

●  (SSG)  prerendered as static HTML (uses generateStaticParams)
```

Real slugs, from the real collection, prerendered to static HTML with the
document content baked in. No new Convex function was needed — `api.vex.find`
already exists (`apps/www/convex/vex.ts`), and anonymous read access to `pages`
is already granted by the access config.

### 2. The prerendered HTML is CDN-cacheable

```
x-nextjs-cache: HIT
Cache-Control: s-maxage=3600, stale-while-revalidate=31532400
```

Versus the current `private, no-cache, no-store, max-age=0, must-revalidate`.
**This is the entire CDN objective, achieved without buying a CDN** — any edge
in front of the app can now cache the HTML, and `stale-while-revalidate` means
a revalidation never blocks a visitor.

### 3. Staleness is solved by on-demand revalidation, not by hoping

Measured sequence against `next start`:

```
hit 1: { cache: 'HIT',  rendered: '2026-09-04T23:33:20.859Z' }
hit 2: { cache: 'HIT',  rendered: '2026-09-04T23:33:20.859Z' }
hit 3: { cache: 'HIT',  rendered: '2026-09-04T23:33:20.859Z' }   ← cached, zero Convex calls

POST /api/seo-probe-revalidate?slug=home -> 200 { revalidated: 'home' }

after purge: { cache: 'MISS', rendered: '2026-09-04T23:33:49.891Z' }  ← re-rendered from Convex
next hit   : { cache: 'HIT',  rendered: '2026-09-04T23:33:49.891Z' }  ← re-cached
```

So the publish flow is: admin mutation → `afterChange` hook → Convex action
`fetch()`es the app's revalidation route → that page (and any index listing it)
is purged and re-rendered on next request. The `afterChange` hook is the only
missing piece, and it is already the recommended primitive in
`cdn-edge-caching-options.md` for five other reasons.

### 4. Pages created after the build still work — no rebuild required

A slug that did not exist at build time returned **200 and rendered on demand**
(`dynamicParams` defaults to `true`), then gets cached like any other. Editors
can publish new pages without a deploy; the first visitor pays one render.

Caveat: in the probe that on-demand render produced `<h1>NO DOCUMENT</h1>` with
a 200 — the same soft-404 defect as fix 1. With `notFound()` in place, an
unknown slug correctly 404s and a newly published slug correctly renders.

### 5. Human visitors never see stale content anyway

`PageContent` hydrates into a live `convexQuery` subscription with the
prerendered payload as `initialData`, and the query client sets no `staleTime`
(`providers/convex.tsx`), so it re-subscribes on mount. Stale HTML is therefore
only ever visible to crawlers and for the first paint before hydration —
which is precisely the audience prerendering is *for*. The combination is
strictly better than today on both axes.

### What this means for the `[slug]` route concretely

| Concern | Answer |
| --- | --- |
| Do slug pages stay dynamic forever? | No — `generateStaticParams` makes them `●` SSG |
| Can query results be passed in at build? | Yes, proven; the document content is in the static file |
| What about edits in the admin panel? | `revalidatePath`/`revalidateTag` from the `afterChange` hook; proven end-to-end |
| What about pages created after build? | Rendered on demand, then cached; no rebuild |
| What if revalidation fails or is not wired yet? | `revalidate = N` time-based bound is the floor, and live hydration corrects it for humans |

---

## Fix plan

Ordered by (SEO value ÷ effort). Items 1–3 are the ones that matter.

1. **Stop serving 200-with-empty-body.** `notFound()` on a missing document; let
   real errors throw. Owner: templates + `apps/www`/`apps/test`. Small.
2. **Add `app/sitemap.ts` and `app/robots.ts` to both templates**, driven by a
   `pages.listSlugs` query. Plus `metadataBase` and `alternates.canonical`, and
   make OG title/description unconditional. Small, entirely additive, and the
   largest SEO gain available.
3. **Move the cookie read out of the root layout.** Public routes get a layout
   with no auth read; only `(vexcms)/admin` and the auth routes read cookies.
   This is the structural change that makes prerendering *possible* at all.
   Owner: `create-vexcms` templates (and therefore `template-sync`). Contained
   but touches provider composition.
4. **Give `@vexcms/next` a cached read helper.** Wrap `ConvexHttpClient`
   (not `fetchQuery`) in a `"use cache"`/`cacheTag` boundary so users get
   ISR-capable reads without knowing any of this. Wrap the shared query in
   `React.cache()` so `generateMetadata` and the page share one round trip —
   that alone removes a duplicate Convex call per request.
5. **`generateStaticParams` for `[slug]`**, so published pages prerender at
   build and get served from the CDN.
6. Only then does edge caching (`s-maxage`, `stale-while-revalidate`,
   `revalidateTag` from the `afterChange` hook) become meaningful.

---

## How this reframes the CDN research

The SEO motivation recorded in `cdn-edge-caching-options.md` **does not require
a CDN, R2, or Cloudflare at all.** It requires prerendering plus cache headers,
which is upstream of every option in that document.

Re-scoping the two ideas accordingly:

- **R2 / Cloudflare** is about **media cost and media delivery** — a real win
  (two orders of magnitude on egress), but not an SEO win.
- **SEO** is about **provider placement, `no-store`, and metadata routes** —
  none of which involve a CDN.

They should be planned as separate work. Conflating them would spend the
expensive R2 budget on the cheap SEO problem and leave the actual SEO defects in
place.

---

## Sources

- Empirical: `pnpm --filter www build` route table and
  `.next/prerender-manifest.json`; `next start` on :3131 with `curl` for headers,
  timings, and HTML inspection; controlled `seo-probe` route experiment
  (added and removed)
- https://docs.convex.dev/production/state/limits

## Code references

- `apps/www/src/app/layout.tsx:73,76` — `ThemeStyle` + `ServerProviders` in root layout
- `apps/www/src/components/providers/auth.tsx:7` — `await getToken()` cookie read
- `apps/www/src/components/ThemeStyle.tsx:40` — uncached `fetchQuery` per request
- `apps/www/src/app/(frontend)/(site)/layout.tsx:25-26` — `headers.getFirst`, `footers.getFirst`
- `apps/www/src/app/(frontend)/(site)/page.tsx:17,20-24` — duplicate fetch; error swallowed
- `apps/www/src/app/(frontend)/(site)/PageContent.tsx:37-39` — `return null` → empty 200
- `apps/www/src/lib/metadata.ts:19,26,51-53,60-63,73` — round trips; conditional OG; error fallbacks
- `packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx:40` — same structure shipped to users
- `packages/create-vexcms/templates/base-nextjs/src/components/providers/auth.tsx:7` — same cookie read
- `node_modules/convex/dist/esm/nextjs/index.js:50` — `setFetchOptions({ cache: "no-store" })`
- `node_modules/convex/dist/esm/browser/http_client.js:53,142` — raw client leaves `fetchOptions` unset

## Open questions

- Does live reactivity on public pages need to survive prerendering? It can —
  a prerendered shell that hydrates into `convexQuery` is strictly better than
  today, but it needs a decision on staleness at first paint.
- Should `@vexcms/next` re-export a wrapped read helper and discourage
  `fetchQuery` in docs outright? That is the only way users stop hitting
  blocker 2 by default.
- Is auth state actually needed on public routes at all (e.g. an "edit this
  page" affordance for signed-in editors)? If yes, it must move to a client
  component so the server render stays static.
