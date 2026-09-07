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

Verify: node scripts/verify-seo-routes.mjs --app apps/www --build --metadata --notfound

- [x] `packages/core/src/api/publishedSlugs/server.ts` — slug + `updatedAt` reader for sitemaps
- [x] `packages/core/src/api/publishedSlugs/server.test.ts`
- [x] `packages/core/src/api/server.ts` — register `publishedSlugs` in `vexServerApi`
- [x] `apps/www/src/vexcms/api.ts` — bind `publishedSlugs` from `vexServerApi`, so `apps/www/convex/pages.ts` can import it
- [x] `apps/www/convex/pages.ts` — expose `publishedSlugs` as a Convex query; core's reader is not callable without it
- [x] `apps/www/src/lib/metadata.ts` — unconditional OG, `metadataBase`, canonical
- [x] `apps/www/src/app/(frontend)/(site)/page.tsx` — `notFound()` instead of a swallowed error
- [x] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — same
- [x] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` — remove the `return null` branch
- [x] `apps/www/src/app/sitemap.ts` — plain `fetchQuery` for now; Step 7 migrates it to the cached client
- [x] `apps/www/src/app/robots.ts`

## Step 2 — `@vexcms/next` cached read client and SEO factories [dev]

Why: The seam every later step consumes. The cached client is what drops
`fetchQuery`'s hard-coded `no-store` — the reason no route can prerender today —
and the factories are what let templates express correct SEO in three lines per
file. Precedes the app and template rewiring (rule 6); follows Step 1 only
because the sitemap factory reads its `publishedSlugs` query.

Verify: pnpm --filter @vexcms/next build && pnpm --filter @vexcms/next test

- [x] `packages/next/vitest.config.ts` + `package.json` test scripts and vitest devDeps — the package ships zero test infrastructure today, so its own Verify cannot run without this
- [x] `packages/next/package.json` — add `./cache` and `./seo` export entries
- [x] `packages/next/src/cache/types.ts` — `VexServerClientOptions`, `VexServerClient`
- [x] `packages/next/src/cache/createVexServerClient.ts` — `ConvexHttpClient`, no forced `no-store`, `React.cache` dedupe
- [x] `packages/next/src/cache/createVexServerClient.test.ts`
- [x] `packages/next/src/cache/index.ts` — barrel the `./cache` entry resolves to
- [x] `packages/next/src/seo/vexStaticParams.ts` — `[]` when Convex is unreachable
- [x] `packages/next/src/seo/vexStaticParams.test.ts`
- [x] `packages/next/src/seo/createVexSitemap.ts`
- [x] `packages/next/src/seo/createVexSitemap.test.ts`
- [x] `packages/next/src/seo/createVexRobots.ts`
- [x] `packages/next/src/seo/vexMetadata.ts`
- [x] `packages/next/src/seo/vexMetadata.test.ts`
- [x] `packages/next/src/seo/index.ts` — barrel the `./seo` entry resolves to
- [x] `packages/next/src/index.ts` — re-export the new surface

## Step 3 — Core revalidation target vocabulary [dev]

Why: The only framework-agnostic piece of the revalidation feature. Given a
collection, an operation and the before/after documents, produce the deduped
list of paths to purge. It lives in core so the planned TanStack adapter and any
later server-side dispatch inherit identical semantics. Tiny and pure, so it
lands before both consumers (rule 6).

Verify: pnpm --filter @vexcms/core test

- [x] `packages/core/src/revalidate/types.ts` — `VexRouteMapper`, `VexRoutesConfig`, `ResolveTargetsResult`, `VexRevalidateChange`, `CrudWriteAction`
- [x] `packages/core/src/revalidate/constants.ts` — `VEX_REVALIDATE_BATCH_SIZE`
- [x] `packages/core/src/revalidate/resolveTargets.ts`
- [x] `packages/core/src/revalidate/resolveTargets.test.ts`
- [x] `packages/core/src/revalidate/index.ts` — barrel, now also `./constants`
- [x] `packages/core/src/config/types.ts` — `revalidate` on `VexConfigInput`
- [x] `packages/core/src/config/config.ts` — defaults for `revalidate`
- [x] `packages/core/src/config/config.test.ts`
- [x] `packages/core/src/index.ts` — re-export

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

Verify: pnpm --filter @vexcms/next test

- [x] `packages/next/src/cache/createVexRevalidateRoute.ts` — also handles `{ collection, all: true }` via `publishedSlugs`
- [x] `packages/next/src/cache/createVexRevalidateRoute.test.ts`
- [x] `packages/next/src/cache/types.ts` — extend with `VexRevalidateRequest` (`changes: VexRevalidateChange[]` batch), `VexRevalidateResponse`
- [x] `packages/next/src/cache/index.ts` — re-export the factory; consumers import from `@vexcms/next/cache`
- [x] `packages/next/src/index.ts` — re-export

## Step 5 — `useVexMutation` and migration of the admin write sites [dev]

Why: The admin panel writes from seven scattered `useMutation({ mutationFn:
useConvexMutation(...) })` call sites with no shared wrapper, so there is
nowhere to hang post-write behavior. This introduces that seam and moves all
seven onto it. Purging is fire-and-forget and must never fail a save: a failed
purge is a stale page, a failed save is lost work.

Verify: pnpm --filter @vexcms/react test

- [x] `packages/react/src/context/VexRevalidateContext.tsx` — endpoint override, disable switch
- [x] `packages/react/src/hooks/useVexMutation.ts`
- [x] `packages/react/src/hooks/useVexMutation.test.tsx` — `.tsx`: the `QueryClientProvider` wrapper needs JSX, matching every other hook test here
- [x] `packages/react/src/hooks/index.ts` — export
- [x] `packages/react/src/components/views/CollectionEditView.tsx` — migrate (~66)
- [x] `packages/react/src/components/views/CollectionListView.tsx` — migrate (~78)
- [x] `packages/react/src/components/views/GlobalEditView.tsx` — migrate (~32); `globals.upsert`, sends a single `after`-only change keyed on `global.slug`
- [x] `packages/react/src/components/views/MediaCollectionEditView.tsx` — migrate (~97)
- [x] `packages/react/src/components/views/MediaCollectionListView.tsx` — migrate (~69)
- [x] `packages/react/src/components/modals/CreateDocumentModal.tsx` — migrate (~42)
- [x] `packages/react/src/components/media/MediaUploadDropzone.tsx` — migrate `createMediaDocument` only, never `generateUploadUrl`

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

Verify: node scripts/verify-seo-routes.mjs --app apps/www --build --routes --static /_not-found,/unauthorized

- [x] `apps/www/src/components/providers/server.tsx` — the actual cookie-read site; the root layout renders `ServerProviders` opaquely
- [x] `apps/www/src/app/layout.tsx` — drop `ThemeStyle` from root
- [x] `apps/www/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider` here
- [x] `apps/www/src/lib/vex.ts` — shared `createVexServerClient` instance every server read in this app imports, so cross-file reads actually dedupe
- [x] `apps/www/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` and chrome reads
- [x] `apps/www/src/components/ThemeStyle.tsx` — read through the cached client
- [x] `apps/test/src/components/providers/server.tsx` — same restructure
- [x] `apps/test/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider`
- [x] `apps/test/src/app/(frontend)/PageContent.tsx` — drop the `console.log` permission probe
- [x] `apps/test/src/app/(frontend)/page.tsx` — cached read, then remove `force-dynamic`
- [x] `apps/test/src/app/(frontend)/[slug]/page.tsx` — cached read, then remove `force-dynamic`

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

Verify: node scripts/verify-seo-routes.mjs --app apps/www --build --routes --static /,/features,/roadmap --metadata --notfound --cache --path /

- [x] `apps/www/src/vex.config.ts` — `routes` config with the route mapper
- [x] `apps/www/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [x] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [x] `apps/www/src/lib/metadata.ts` — migrate off `fetchQuery`; `generateMetadata` runs on the page's own render path, so a `no-store` read here forces the whole route dynamic
- [x] `apps/www/src/app/sitemap.ts` — migrate off `fetchQuery`
- [x] `apps/www/src/app/api/vex/revalidate/route.ts` — `createVexRevalidateRoute`
- [x] `packages/react/src/hooks/useVexRevalidate.ts` — user-initiated purge; unlike `useVexMutation` it MUST surface failure
- [x] `packages/react/src/hooks/useVexRevalidate.test.tsx`
- [x] `packages/react/src/components/RevalidateButton.tsx`
- [x] `packages/react/src/components/RevalidateButton.test.tsx`
- [x] `packages/react/src/components/views/CollectionEditView.tsx` — mount the control for the open document
- [x] `packages/react/src/components/views/CollectionListView.tsx` — mount the control for the collection

## Step 8 — Sync both templates and re-verify by scaffolding [agent]

Why: The defect originates in `create-vexcms`, so every scaffolded project
inherits it — fixing only `apps/www` leaves every user broken. AP-020 is
explicit that typecheck plus build is not evidence a template works: five
template defects shipped green. The acceptance gate is a real scaffold run in
every supported mode.

Verify: pnpm verify:scaffold && ! node scripts/verify-scaffold.mjs --negative-routes

- [x] `packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx` — provider restructure
- [x] `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx`
- [x] `packages/create-vexcms/templates/base-nextjs/src/app/api/vex/revalidate/route.ts`
- [x] `packages/create-vexcms/templates/marketing-site/src/lib/vex.ts` — shared `createVexServerClient` instance every template server read imports
- [x] `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx`
- [x] `packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx` — marketing-site owns its own copy
- [x] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` + chrome reads
- [x] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [x] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [x] `packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts` and `robots.ts`
- [x] `packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx`
- [x] `packages/create-vexcms/templates/marketing-site/src/vex.config.ts` — `routes` config
- [x] `packages/create-vexcms/templates/marketing-site/convex/pages.ts` — `publishedSlugs` query
- [x] `packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts` — binding
- [x] `packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts` — delete; superseded by `vexMetadata`
- [x] `scripts/verify-scaffold.mjs` — route-table + metadata-route assertions, plus the AP-013 negative self-test
- [x] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`

`marketing-site` has no `src/components/providers/` of its own and inherits
base's, but it DOES own a separate `(vexcms)/admin/layout.tsx`, so the
`AuthServerProvider` mount is a two-file edit.

## Step 9 — Automatic `updatedAt` on every collection [dev]

Why: No vexcms content collection declares `updatedAt` today — every one in the
repo belongs to a better-auth table — and Convex's `_creationTime` never moves
on update, so there is no honest `<lastmod>` signal and no "last edited" column.
A per-collection opt-in would leave the inconsistency unresolved, and the
document cannot be inspected instead: Convex's closed table validator throws on
an undeclared key, so whether the write is legal is a property of the config,
not the document. `defineCollection` therefore injects the field, exactly as
`defineMediaCollection` already injects media system fields. Optional, so it is
additive for existing deployments and does not stop the Convex dashboard
inserting rows.

Sequenced last because every earlier step works without it and this one changes
the generated schema for every collection.

Verify: pnpm --filter @vexcms/core test && pnpm --filter www exec vex dev --once

- [x] `packages/core/src/collections/constants.ts` — `RESERVED_COLLECTION_FIELDS`
- [x] `packages/core/src/collections/types.ts` — reserved-key compile error (D15 pattern)
- [x] `packages/core/src/collections/config.ts` — inject in `defineCollection`, `timestamps: false` opt-out
- [x] `packages/core/src/collections/config.test.ts`
- [x] `packages/core/src/collections/validator.ts` — no change; confirm the existing per-field loop emits `v.optional(v.number())`
- [x] `packages/core/src/collections/validator.test.ts` — regression test
- [x] `packages/core/src/api/test/convex/schema.ts` — `updatedAt` on the `posts` fixture, else `convex-test` rejects the stamped writes
- [x] `packages/core/src/api/create/server.ts` — stamp on insert
- [x] `packages/core/src/api/update/server.ts` — stamp on patch
- [x] `packages/core/src/api/globals/upsert.server.ts` — cannot carry it (`vex_globals` is one shared `{ slug, data }` table); prose + a test pinning that
- [x] `packages/core/src/api/create/server.test.ts`
- [x] `packages/core/src/api/update/server.test.ts`
- [x] `packages/core/src/api/globals/upsert.server.test.ts`
- [x] `packages/core/src/types/generateVexTypes.ts` — no change; confirm the interface generator emits `updatedAt?: number`
- [x] `packages/core/src/types/generateVexTypes.test.ts` — regression test
- [x] `apps/www` + `apps/test` — regenerate `vex.schema.ts` / `vex.types.ts` via `vex dev`
