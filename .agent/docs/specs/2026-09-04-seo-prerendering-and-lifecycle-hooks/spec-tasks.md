---
status: draft
spec_id: 2026-09-04-seo-prerendering-and-lifecycle-hooks
touches: []
prompt_version: 1
---

# 2026-09-04-seo-prerendering-and-lifecycle-hooks — Tasks

Scope: make public pages prerenderable, CDN-cacheable and correctly indexed, and
purge the affected paths the moment a document is saved in the admin panel. The
general lifecycle-hook system (`beforeChange`/`afterChange`, `convex-helpers`
triggers, a wrapped `mutation` export, server-side dispatch) is **deferred** —
see Out of Scope in `spec.md`.

## Step 1 — Metadata routes and the empty-200 fix [agent]

Why: Highest SEO value per hour, entirely additive, and independent of every
other step. Fixes the one defect that actively costs rankings — a soft 404
served as HTTP 200 — and adds the metadata surface that is absent from the
served HTML today. Depends on nothing else here, so it can land and ship alone.

Verify: `pnpm --filter www build && pnpm --filter www start`, then assert
`<meta name="description">`, `og:title`, `og:image` and `<link rel="canonical">`
are present; an unknown slug returns 404 not 200; `/sitemap.xml` and
`/robots.txt` return 200 and the sitemap lists the real page slugs.

- [ ] `packages/core/src/api/publishedSlugs/server.ts` — slug + `updatedAt` reader for sitemaps
- [ ] `packages/core/src/api/publishedSlugs/server.test.ts`
- [ ] `packages/core/src/api/server.ts` — register `publishedSlugs` in `collectionsApi`
- [ ] `apps/www/convex/pages.ts` — expose `publishedSlugs` as a Convex query; core's reader is not callable without it
- [ ] `apps/www/src/lib/metadata.ts` — unconditional OG, `metadataBase`, canonical
- [ ] `apps/www/src/app/(frontend)/(site)/page.tsx` — `notFound()` instead of a swallowed error
- [ ] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — same
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` — remove the `return null` branch
- [ ] `apps/www/src/app/sitemap.ts` — plain `fetchQuery` for now; Step 7 migrates it to the cached client
- [ ] `apps/www/src/app/robots.ts`

## Step 2 — `@vexcms/next` cached read client and SEO factories [dev]

Why: The seam every later step consumes. The cached client is what drops
`fetchQuery`'s hard-coded `no-store` — the reason no route can prerender today —
and the factories are what let templates express correct SEO in three lines per
file. Precedes the app and template rewiring (rule 6); follows Step 1 only
because the sitemap factory reads its `publishedSlugs` query.

Verify: `pnpm --filter @vexcms/next build && pnpm --filter @vexcms/next test`.
Tests cover `React.cache` dedupe (one Convex call for two identical reads) and
`vexStaticParams` returning `[]` when Convex is unreachable — P-020 builds CI
with placeholder env, so a throw here breaks CI.

- [ ] `packages/next/vitest.config.ts` + `package.json` test scripts and vitest devDeps — the package ships zero test infrastructure today, so its own Verify cannot run without this
- [ ] `packages/next/package.json` — add `./cache` and `./seo` export entries
- [ ] `packages/next/src/cache/types.ts` — `VexCacheOptions`, `VexServerClient`
- [ ] `packages/next/src/cache/createVexServerClient.ts` — `ConvexHttpClient`, no forced `no-store`, `React.cache` dedupe
- [ ] `packages/next/src/cache/createVexServerClient.test.ts`
- [ ] `packages/next/src/cache/index.ts` — barrel the `./cache` entry resolves to
- [ ] `packages/next/src/seo/vexStaticParams.ts` — `[]` when Convex is unreachable
- [ ] `packages/next/src/seo/vexStaticParams.test.ts`
- [ ] `packages/next/src/seo/createVexSitemap.ts`
- [ ] `packages/next/src/seo/createVexSitemap.test.ts`
- [ ] `packages/next/src/seo/createVexRobots.ts`
- [ ] `packages/next/src/seo/vexMetadata.ts`
- [ ] `packages/next/src/seo/vexMetadata.test.ts`
- [ ] `packages/next/src/seo/index.ts` — barrel the `./seo` entry resolves to
- [ ] `packages/next/src/index.ts` — re-export the new surface

## Step 3 — Core revalidation target vocabulary [dev]

Why: The only framework-agnostic piece of the revalidation feature. Given a
collection, an operation and the before/after documents, produce the deduped
list of paths to purge. It lives in core so the planned TanStack adapter and any
later server-side dispatch inherit identical semantics. Tiny and pure, so it
lands before both consumers (rule 6).

Verify: `pnpm --filter @vexcms/core test` — a rename yields BOTH the old and the
new path, a delete yields the old path, results are deduped and order-stable,
and a mapper that throws is contained rather than propagated. Operation names
reuse the existing CRUD constant map (P-003), so the create case is `create`,
never `insert`.

- [ ] `packages/core/src/revalidate/types.ts` — `VexRouteMapper`, `VexRevalidateConfig`, `VexRevalidateTarget`, `RevalidateOperation`
- [ ] `packages/core/src/revalidate/resolveTargets.ts`
- [ ] `packages/core/src/revalidate/resolveTargets.test.ts`
- [ ] `packages/core/src/revalidate/index.ts`
- [ ] `packages/core/src/config/types.ts` — `revalidate` on `VexConfigInput`
- [ ] `packages/core/src/config/config.ts` — defaults for `revalidate`
- [ ] `packages/core/src/config/config.test.ts`
- [ ] `packages/core/src/index.ts` — re-export

No `sanitizeConfig.ts` edit is required: `stripNonSerializable` is already
generically recursive over every config property, so the server-only route
mapper is stripped at the RSC boundary automatically (P-005).

## Step 4 — `@vexcms/next` revalidation route factory [dev]

Why: The endpoint the admin panel calls. Session-authorized rather than
secret-authorized — the caller is a signed-in admin, so it reuses the existing
auth and needs no new env var. Path-based via `revalidatePath` because
`cacheComponents` (required for `cacheTag`/`revalidateTag`) is incompatible with
the `dynamic` and `runtime` segment configs the auth and admin routes require:
measured, 5 failing files.

Verify: `pnpm --filter @vexcms/next test` — an unauthenticated POST is 401, a
session without write permission on that collection is 403, a valid payload
calls `revalidatePath` once per resolved target including the pre-rename path,
and a mapper that throws returns 200 with failures reported rather than 500.

- [ ] `packages/next/src/cache/createVexRevalidateRoute.ts` — also handles `{ collection, all: true }` via `publishedSlugs`
- [ ] `packages/next/src/cache/createVexRevalidateRoute.test.ts`
- [ ] `packages/next/src/cache/types.ts` — extend with `VexRevalidateRequest`, `VexRevalidateResponse`
- [ ] `packages/next/src/index.ts` — re-export

## Step 5 — `useVexMutation` and migration of the admin write sites [dev]

Why: The admin panel writes from seven scattered `useMutation({ mutationFn:
useConvexMutation(...) })` call sites with no shared wrapper, so there is
nowhere to hang post-write behavior. This introduces that seam and moves all
seven onto it. Purging is fire-and-forget and must never fail a save: a failed
purge is a stale page, a failed save is lost work.

Verify: `pnpm --filter @vexcms/react test` — a successful mutation issues exactly
one POST with the right collection, operation and ids; a failed mutation issues
none; a rejected purge leaves the mutation resolved and surfaces no error.

- [ ] `packages/react/src/context/VexRevalidateContext.tsx` — endpoint override, disable switch
- [ ] `packages/react/src/hooks/useVexMutation.ts`
- [ ] `packages/react/src/hooks/useVexMutation.test.tsx` — `.tsx`: the `QueryClientProvider` wrapper needs JSX, matching every other hook test here
- [ ] `packages/react/src/hooks/index.ts` — export
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — migrate (~66)
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — migrate (~78)
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — migrate (~32); `globals.upsert`, purges by slug alone
- [ ] `packages/react/src/components/views/MediaCollectionEditView.tsx` — migrate (~97)
- [ ] `packages/react/src/components/views/MediaCollectionListView.tsx` — migrate (~69)
- [ ] `packages/react/src/components/modals/CreateDocumentModal.tsx` — migrate (~42)
- [ ] `packages/react/src/components/media/MediaUploadDropzone.tsx` — migrate `createMediaDocument` only, never `generateUploadUrl`

Operation vocabulary here is `create` / `update` / `remove` / `upsert`, matching
the real `vexConvexApi` function names rather than `CRUD_ACTIONS` (which says
`delete` and has no `upsert`).

## Step 6 — Provider restructure: cookie read below the public boundary [dev]

Why: The single change that makes prerendering possible. A `cookies()` read in
the root layout forces every route dynamic — proven with a probe page containing
no data fetching at all, which still built as `ƒ`. Sequenced after the package
work so the apps have the cached client available when their reads move.
Low risk: `useAuth` has zero call sites in `apps/www`, none in either template's
app dir, and one `console.log`-only use in `apps/test`.

Verify: `pnpm --filter www build` shows `○` or `●` for `/`, `/[slug]`,
`/_not-found` and `/unauthorized`; `/admin` still 307s to sign-in;
`/auth/sign-in` returns 200; a signed-in user can still open and save a document
in the admin panel.

- [ ] `apps/www/src/components/providers/server.tsx` — the actual cookie-read site; the root layout renders `ServerProviders` opaquely
- [ ] `apps/www/src/app/layout.tsx` — drop `ThemeStyle` from root
- [ ] `apps/www/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider` here
- [ ] `apps/www/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` and chrome reads
- [ ] `apps/www/src/components/ThemeStyle.tsx` — read through the cached client
- [ ] `apps/test/src/components/providers/server.tsx` — same restructure
- [ ] `apps/test/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider`
- [ ] `apps/test/src/app/(frontend)/PageContent.tsx` — drop the `console.log` permission probe
- [ ] `apps/test/src/app/(frontend)/page.tsx` — cached read, then remove `force-dynamic`
- [ ] `apps/test/src/app/(frontend)/[slug]/page.tsx` — cached read, then remove `force-dynamic`

`apps/test` has no `(frontend)/(site)/layout.tsx` — its public pages sit directly
under `(frontend)`, so its `ThemeStyle` stays in the root layout. Its content
reads must move to the cached client in the SAME step as the `force-dynamic`
removal; dropping the flag alone leaves the routes dynamic via `fetchQuery`
while claiming otherwise.

## Step 7 — Wire `apps/www` end to end, plus the manual purge control [dev]

Why: First point where the feature is observable, and the step whose build
output answers the question that started this work. Also ships the manual purge,
because a client-driven purge cannot cover Convex dashboard edits,
`npx convex import`, streaming import, or a tab that closed mid-request.

The purge control is an admin-panel button, not a CLI command: the revalidation
route is session-authorized, and giving a headless CLI a service-account
password in env would be strictly worse than the shared secret this design
deliberately avoided. `vex revalidate` and API-key auth are deferred with
server-side dispatch.

Verify: `pnpm --filter www build` shows `●` entries with a Revalidate column for
the seeded slugs; `curl -D-` shows `Cache-Control: s-maxage=…,
stale-while-revalidate=…` and `x-nextjs-cache: HIT` on a second hit; saving a
page in the admin panel flips the next request to `MISS` with new content;
clicking the purge control does the same; a signed-out caller gets 401 and the
button reports it.

- [ ] `apps/www/src/vex.config.ts` — `revalidate` config with the route mapper
- [ ] `apps/www/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [ ] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [ ] `apps/www/src/app/api/vex/revalidate/route.ts` — `createVexRevalidateRoute`
- [ ] `packages/react/src/hooks/useVexRevalidate.ts` — user-initiated purge; unlike `useVexMutation` it MUST surface failure
- [ ] `packages/react/src/hooks/useVexRevalidate.test.tsx`
- [ ] `packages/react/src/components/RevalidateButton.tsx`
- [ ] `packages/react/src/components/RevalidateButton.test.tsx`
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — mount the control for the open document
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — mount the control for the collection

## Step 8 — Sync both templates and re-verify by scaffolding [agent]

Why: The defect originates in `create-vexcms`, so every scaffolded project
inherits it — fixing only `apps/www` leaves every user broken. AP-020 is
explicit that typecheck plus build is not evidence a template works: five
template defects shipped green. The acceptance gate is a real scaffold run in
every supported mode.

Verify: `pnpm verify:scaffold`; then per supported mode scaffold into a temp dir,
`pnpm build`, and assert the route table contains `●`/`○` entries for the public
routes and that `/sitemap.xml` and `/robots.txt` are structurally valid. Per
AP-012 the gate asserts structural validity, not seeded slugs — the packed
tarball gate has no live Convex deployment and builds with placeholder env
(P-020). Per AP-013 the gate ships with a negative self-test proving it fails
when a public route is dynamic.

- [ ] `packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx` — provider restructure
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx`
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/api/vex/revalidate/route.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx` — marketing-site owns its own copy
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` + chrome reads
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts` and `robots.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx`
- [ ] `packages/create-vexcms/templates/marketing-site/src/vex.config.ts` — `revalidate` config
- [ ] `packages/create-vexcms/templates/marketing-site/convex/pages.ts` — `publishedSlugs` query
- [ ] `packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts` — binding
- [ ] `packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts` — delete; superseded by `vexMetadata`
- [ ] `scripts/verify-scaffold.mjs` — route-table + metadata-route assertions, plus the AP-013 negative self-test
- [ ] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`

`marketing-site` has no `src/components/providers/` of its own and inherits
base's, but it DOES own a separate `(vexcms)/admin/layout.tsx`, so the
`AuthServerProvider` mount is a two-file edit.
