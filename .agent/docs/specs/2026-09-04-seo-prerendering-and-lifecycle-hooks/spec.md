---
status: draft
spec_id: 2026-09-04-seo-prerendering-and-lifecycle-hooks
touches:
  - "packages/core/src/api/publishedSlugs/**"
  - "packages/core/src/api/server.ts"
  - "packages/core/src/revalidate/**"
  - "packages/core/src/config/**"
  - "packages/core/src/index.ts"
  - "packages/next/src/cache/**"
  - "packages/next/src/seo/**"
  - "packages/next/src/index.ts"
  - "packages/next/package.json"
  - "packages/next/vitest.config.ts"
  - "packages/react/src/hooks/**"
  - "packages/react/src/context/VexRevalidateContext.tsx"
  - "packages/react/src/components/RevalidateButton.tsx"
  - "packages/react/src/components/views/**"
  - "packages/react/src/components/modals/CreateDocumentModal.tsx"
  - "packages/react/src/components/media/MediaUploadDropzone.tsx"
  - "packages/create-vexcms/templates/**"
  - "apps/www/src/**"
  - "apps/www/convex/pages.ts"
  - "apps/test/src/**"
  - "scripts/verify-scaffold.mjs"
  - "apps/docs/src/content/docs/guides/caching-and-seo.mdx"
prompt_version: 1
---

# 2026-09-04-seo-prerendering-and-lifecycle-hooks — Spec


## Overview

Public pages in every vexcms project are un-prerenderable, uncacheable, and
missing most of their SEO surface. Measured on `apps/www`: all 8 routes build as
`ƒ` (dynamic), the HTML is served `Cache-Control: private, no-cache, no-store`,
6–8 sequential Convex round trips sit in front of the first byte, and a
transient Convex failure returns HTTP 200 with an empty body — a soft 404 a
crawler will index. `/sitemap.xml`, `/robots.txt`, canonical links and OG tags
do not exist in either app or either template.

Content itself is *not* the problem — it is server-rendered and indexable today.
The problem is that nothing can be prerendered or cached, and the metadata
around it is absent.

This spec makes public routes prerender as `●`/`○` with CDN-cacheable headers,
adds the missing metadata routes, and purges the affected paths the moment a
document is saved in the admin panel. The general lifecycle-hook system is
deliberately deferred; see Out of Scope.

## Design Decisions

1. **Two independent blockers, both must be fixed.** A `cookies()` read in the
   root layout (`providers/auth.tsx` → `await getToken()`) forces every route
   dynamic, and `convex/nextjs`'s `fetchQuery` hard-codes
   `cache: "no-store"`. Proven: a probe page with zero data fetching still built
   as `ƒ`, and `/` stayed `ƒ` when only the layout was fixed.
2. **Reads move to a raw `ConvexHttpClient`, not `fetchQuery`.** The `no-store`
   lives only in `convex/nextjs`'s `setupClient`; `convex/browser`'s client
   leaves `fetchOptions` unset and prerenders correctly. Measured.
3. **The fix is subtractive — cache policy returns to the user.** `fetchQuery`'s
   forced `no-store` currently overrides whatever the user writes, so their
   `export const revalidate` is silently ineffective. After this spec, vexcms
   ships defaults and the user's Next cache config actually applies.
4. **Revalidation is path-based via `revalidatePath`, never tag-based.**
   `cacheTag`/`revalidateTag` require `cacheComponents: true`, which is
   incompatible with the `dynamic` and `runtime` segment configs the auth and
   admin routes legitimately need — measured, 5 failing files. `revalidatePath`
   works with plain ISR and no flags.
5. **The purge is client-driven from the admin panel.** Convex mutations cannot
   perform network I/O, so a server-side purge would need a scheduled action, an
   `internal.*` reference, a scaffold file, config plumbing, a shared secret and
   an env var. A hook in the admin panel needs none of that.
6. **The revalidation route is session-authorized, not secret-authorized.** The
   caller is a signed-in admin, so it reuses the existing auth surface. No new
   env var and no shared secret to leak. Same-origin, so the fetch is relative
   and needs no URL config.
7. **Purging is fire-and-forget.** A failed purge is a stale page; a failed save
   is lost work. The promise the caller awaits resolves on the mutation, never
   on the purge.
8. **`useVexMutation` is a new seam, not a refactor for its own sake.** The
   admin panel writes from seven scattered `useMutation({ mutationFn:
   useConvexMutation(...) })` call sites with no shared wrapper, so there is
   nowhere to hang post-write behavior. All seven move onto the new hook.
9. **The revalidation target vocabulary lives in core.** Resolving
   `{ collection, operation, oldDoc, newDoc }` to a path list is
   framework-agnostic, so the planned TanStack adapter and any later
   server-side dispatch inherit identical semantics.
10. **A rename purges both paths.** If a mapper's output changes between
    `oldDoc` and `newDoc`, both are returned — otherwise the pre-rename URL is
    served stale forever.
11. **Build-time reads degrade only when there is no deployment to reach.**
    A blanket "always return `[]`" would let a *configured but broken*
    deployment ship zero prerendered pages silently — the worst failure mode,
    because the build stays green. So the rule is two-branch: no
    `NEXT_PUBLIC_CONVEX_URL`, or a placeholder/unreachable one → return `[]` and
    render on demand (a fresh scaffold before `convex dev` has ever run, and
    P-020's CI builds, both need this). A URL that resolves but whose query
    fails → **let it throw and fail the build**, because that is a real
    regression and prerendering was expected to work. Requiring valid env
    unconditionally is the wrong trade for a library: it would make
    `create-vexcms` → `pnpm build` fail before the user has a backend, couple
    CI to a third-party service's uptime, and turn a Convex blip into a failed
    deploy rather than stale content. Step 7's `Verify` catches the silent case
    anyway by asserting `●` entries are present.
12. **Public pages keep the live `convexQuery` subscription** with the
    prerendered payload as `initialData`. Humans continue to see instant
    updates, so a missed purge costs crawler-visible HTML and first paint, not
    correctness.
13. **Unknown documents 404; infrastructure failures 500.** The current
    swallowing `try/catch` plus `return null` produces a 200 with an empty body,
    which is the single most damaging SEO defect found.
14. **`@vexcms/next` ships factories with escape hatches.** Templates express
    SEO in ~3 lines per file; the underlying primitives stay exported for
    non-standard setups.
15. **`Vex*` names in `@vexcms/next` are deliberate.** The naming convention
    reserves the `Next*` prefix for that package and `Vex*` for
    framework-agnostic APIs — but that rule is scoped to *components*
    (`NextAdminPage`). Everything added here is a function, and `createVexXxx`
    matches the existing factory precedent (`createGetAuth`, `collectionsApi`,
    `mediaQueryApi`). The names also survive being re-exported by a future
    TanStack adapter, which `Next*` would not.
16. **Built into the packages now, extractable into a plugin later — and
    most of it is not SEO.** The plugin system does not exist yet (post-v1
    roadmap), and building scaffolding for it would be speculative. It is also
    the wrong shape for most of this work: `createVexServerClient` is simply the
    correct way to read Convex from a server component, and `useVexMutation`
    replaces the admin panel's own write path — neither is opt-in behavior a
    plugin could own. The genuinely SEO-specific surface is just three pure
    functions (`createVexSitemap`, `createVexRobots`, `vexMetadata`), and this
    spec already isolates them in `packages/next/src/seo/` behind their own
    `./seo` export subpath with no inbound dependencies from `cache/`. Moving
    that directory into a `@vexcms/plugin-seo` package later is a package move,
    not a refactor. No plugin abstraction is introduced now.
17. **Templates are the deliverable, not `apps/www`.** The defect originates in
    `create-vexcms`, so the acceptance gate is a real scaffold run per AP-020 —
    typecheck plus build has already let five template defects ship.

## Out of Scope

Binding. None of the following may appear in any step of this spec.

- **The general lifecycle-hook system**: `beforeChange`, `afterChange`, hook
  registration in `defineConfig`/`defineCollection`, hook merge order.
- **`convex-helpers` `Triggers`** and the wrapped `mutation`/`internalMutation`
  drop-in exports, and therefore the `no-restricted-imports` ESLint rule that
  would enforce them.
- **Server-side revalidation dispatch**: no scheduled action, no `hooksApi()`
  factory, no `internal.*` callbacks reference, no shared secret, no
  `VEX_REVALIDATE_SECRET`.
- **Seed changes.** `convex/seed.ts` keeps its raw `ctx.db` writes and its
  insert-only-if-absent semantics, so P-021's workflow is untouched. Seed runs
  therefore do not purge; the admin panel's Revalidate control is the remedy.
- **`cacheComponents` migration** and tag-based invalidation.
- **R2 / CDN / media delivery**, and image derivatives. Tracked separately in
  `.agent/docs/research/cdn-edge-caching-options.md`.
- **Field-level or per-route caching policy config** beyond a single
  `revalidate` interval and the route mapper.

Known consequence, accepted: a client-driven purge does not cover Convex
dashboard edits, `npx convex import`, streaming import, or a tab that closes
mid-request. The admin panel's Revalidate control (Step 7) is the escape hatch,
and the configured `revalidate` interval is the backstop.

**There are three ways to cover all of those, and all are deliberately out of
scope here.** The question worth settling first: does Convex expose change
events to server-side code, or only to subscribed consumers?

**Inside Convex functions: only to subscribers.** There is no change-event hook,
no `_changes` system table, and no CDC available to a query, mutation or action.
Convex tracks read dependencies per query and pushes new snapshots to
*subscribed* clients over the WebSocket. `convex-helpers`' `Triggers` are
userland write-path interception, not a database feed, which is exactly why the
dashboard bypasses them.

**Out of band: yes, a real change feed exists.** `POST /data/sync` — the
[Data Sync API](https://docs.convex.dev/deployment-api/data-sync) — is
cursor-paginated and designed for continuous streaming export: call it
repeatedly, pass `pagination.nextCursor` back as `cursor`, sleep between
`upToDate` pages. This is what Fivetran's Convex connector uses (initial
consistent snapshot, then CDC at newer consistent views). Because it reads the
deployment's data rather than the write path, it sees **every** change
regardless of origin, and it tells you *which documents* changed — so paths can
be purged precisely rather than by collection.

The three viable designs, cheapest first:

1. **Client self-heal (no new infrastructure).** Public pages already hold a
   live `convexQuery` subscription with the prerendered payload as
   `initialData` (Decision 12). When Convex pushes data that differs from what
   was prerendered, the client already knows the HTML is stale — so it POSTs
   `{ collection, id }` and the route re-reads the document server-side and runs
   the mapper. Push-based, so latency is Convex's push latency rather than a
   poll interval; costs nothing because it reuses a subscription that exists;
   covers every change source. Weaknesses: it needs a visitor (a stale page with
   no visitors harms nobody, and the first visitor heals it for everyone after),
   crawler-first hits can see stale content once, and the endpoint is
   unauthenticated so it needs rate limiting. Accepting only `{ collection, id }`
   and resolving paths server-side is what keeps it from becoming an arbitrary
   purge oracle.
2. **Convex cron + fingerprint query.** `crons.interval()` supports
   seconds-level granularity. A query returning a per-document fingerprint is
   cache-invalidated by Convex whenever any document it read changes — whoever
   changed it — so no `updatedAt` is required. Convex does not bill database
   bandwidth for cached reads, so the idle cost is function calls only
   (~86k/month at 30s, ~259k at 10s, against a 1M free tier). Costs a full read
   of the fingerprinted set on every change, and the 16 MiB / 32,000-document
   transaction limits cap collection size unless the fingerprint is paginated or
   projected. **Unverified assumption that the whole cost model rests on:** that
   `ctx.runQuery` from a scheduled action hits the same query cache. If it does
   not, every sweep re-reads the collection and the cost is orders of magnitude
   worse. Measure before building.
3. **Data Sync API poller.** Complete and precise, and the only option that
   reports exactly what changed. Costs: **Convex Pro plan** (so it cannot be the
   default for an open-source CMS), a deploy key carrying
   `deployment:data:view` — full deployment read access, a strictly more
   dangerous credential than the revalidation secret this design avoided —
   durable cursor storage, and bandwidth for every document change in the
   deployment including better-auth session churn. Fivetran's own docs note that
   streaming export does not handle data imports or backup restores and
   recommend resetting the sync afterwards, so `npx convex import` may *break*
   the feed rather than be captured by it.

Recommended end state: the admin-panel purge for instant feedback on the 99%
case, plus client self-heal as the catch-all. Both reuse this spec's route,
payload and `resolveTargets` unchanged, so either can land as its own spec
without revisiting anything here.

## Implementation


### Step 1 — Metadata routes and the empty-200 fix [agent]

Why: Highest SEO value per hour, entirely additive, and independent of every
other step. Fixes the one defect that actively costs rankings — a soft 404
served as HTTP 200 — and adds the metadata surface that is absent from the
served HTML today. Depends on nothing here, so it can land and ship alone.

- [ ] `packages/core/src/api/publishedSlugs/server.ts` — slug reader for sitemaps and `generateStaticParams`
- [ ] `packages/core/src/api/publishedSlugs/server.test.ts`
- [ ] `packages/core/src/api/server.ts` — register `publishedSlugs` in `vexServerApi`
- [ ] `apps/www/src/vexcms/api.ts` — bind `publishedSlugs` from `vexServerApi`, so `apps/www/convex/pages.ts` can import it
- [ ] `apps/www/src/lib/metadata.ts` — unconditional OG, `metadataBase`, canonical
- [ ] `apps/www/src/app/(frontend)/(site)/page.tsx` — `notFound()` instead of a swallowed error
- [ ] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — same
- [ ] `apps/www/src/app/(frontend)/(site)/PageContent.tsx` — remove the `return null` branch
- [ ] `apps/www/src/app/sitemap.ts`
- [ ] `apps/www/src/app/robots.ts`

#### packages/core/src/api/publishedSlugs/server.ts

New file. Mirrors `find/server.ts`'s `{ ctx, collection, access }` server-args
shape and delegates the actual query work to `find` rather than re-implementing
index selection or RBAC. Sitemaps are anonymous, so callers pass
`access: { bypass: true }` exactly like `apps/www/convex/pages.ts`'s
`getBySlug`. Convex's `_creationTime` is set at insert and never moves, so it
is returned as `createdAt`, named for what it is. `updatedAt` is returned as
optional: nothing populates it until Step 9 injects and maintains it, and it
stays `undefined` for rows written outside the app (Convex dashboard, `convex
import`, streaming import). Consumers must treat it as absent-by-default — a
wrong `<lastmod>` is worse than none, because crawlers use it to decide what to
re-fetch.

```ts
import type { GenericDataModel } from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { AccessCallOptions, QueryCallActionFor } from "../types";
import { find } from "../find/server";

/**
 * Server-side args for `publishedSlugs`.
 *
 * @typeParam DataModel - The Convex data model (inferred from `ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 */
export interface PublishedSlugsServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> {
  /** Convex query context. */
  ctx: import("convex/server").GenericQueryCtx<DataModel>;
  /** The collection to read slugs from. */
  collection: TCollectionSlug;
  /** Per-call access override. Sitemaps are anonymous — pass `{ bypass: true }`. */
  access?: AccessCallOptions<QueryCallActionFor<TCollectionSlug>>;
  /** Maximum number of documents to return. Defaults to 5000. */
  limit?: number;
}

/** One collection document's slug and timestamps. */
export interface PublishedSlug {
  /** The document's `slug` field. */
  slug: string;
  /**
   * The document's `_creationTime` — Convex's insert timestamp. Never moves on
   * update, so it is NOT a last-modified time.
   */
  createdAt: number;
  /**
   * Last write through vexcms's own API, if known.
   *
   * `undefined` until Step 9 injects and maintains `updatedAt`, and permanently
   * `undefined` for rows written outside the app — the Convex dashboard,
   * `npx convex import`, and streaming import all bypass application code.
   * Emit `<lastmod>` only when this is defined.
   */
  updatedAt?: number;
}

/**
 * Reads every document's `slug` and `_creationTime` from a collection, for
 * `sitemap.xml` generation. Server-side only.
 *
 * Skips documents with no string `slug` field rather than throwing, so a
 * collection with mixed field shapes degrades to a partial sitemap instead of
 * failing the whole route.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @typeParam TCollectionSlug - Collection slug.
 * @param args - `{ ctx, collection, access?, limit? }`.
 * @returns Promise resolving to `{ slug, createdAt, updatedAt? }` for every matching document.
 * @example
 * ```ts
 * import { publishedSlugs } from "@vexcms/core/server";
 *
 * export const listSlugs = query({
 *   args: {},
 *   handler: (ctx) => publishedSlugs({ ctx, collection: "pages", access: { bypass: true } }),
 * });
 * ```
 */
export async function publishedSlugs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
>(args: PublishedSlugsServerArgs<DataModel, TCollectionSlug>): Promise<PublishedSlug[]> {
  const docs = await find({
    ctx: args.ctx,
    collection: args.collection,
    access: args.access,
    limit: args.limit ?? 5000,
  });

  return docs
    .filter(
      (doc): doc is typeof doc & { slug: string } => typeof (doc as { slug?: unknown }).slug === "string",
    )
    .map((doc) => ({
      slug: doc.slug,
      createdAt: (doc as unknown as { _creationTime: number })._creationTime,
      updatedAt: (doc as unknown as { updatedAt?: number }).updatedAt,
    }));
}
```

#### packages/core/src/api/publishedSlugs/server.test.ts

New file, following `get/server.test.ts`'s `convexTest` + fixture-schema
convention (same `../test/convex/_generated/api` and `../test/convex/schema`
fixtures the existing suite imports).

```ts
import { convexTest } from "convex-test";
import type { GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "../test/convex/_generated/api";
import schema from "../test/convex/schema";
import { publishedSlugs } from "./server";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

describe("publishedSlugs (server)", () => {
  test("returns slug and _creationTime for every document with a string slug", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<typeof schema>) => {
      await ctx.db.insert("posts", { title: "First", slug: "first" });
      await ctx.db.insert("posts", { title: "Second", slug: "second" });

      const result = await publishedSlugs({ ctx, collection: "posts", access: { bypass: true } });

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.slug).sort()).toEqual(["first", "second"]);
      for (const entry of result) {
        expect(typeof entry.createdAt).toBe("number");
      }
    });
  });

  test("skips documents with no string slug field", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<typeof schema>) => {
      await ctx.db.insert("posts", { title: "No slug" });
      await ctx.db.insert("posts", { title: "Has slug", slug: "has-slug" });

      const result = await publishedSlugs({ ctx, collection: "posts", access: { bypass: true } });

      expect(result).toEqual([{ slug: "has-slug", createdAt: expect.any(Number), updatedAt: undefined }]);
    });
  });

  test("respects limit", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<typeof schema>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a" });
      await ctx.db.insert("posts", { title: "B", slug: "b" });

      const result = await publishedSlugs({ ctx, collection: "posts", access: { bypass: true }, limit: 1 });

      expect(result).toHaveLength(1);
    });
  });
});
```

#### packages/core/src/api/server.ts

2 edits — everything else in the file is unchanged.

**1 — export `publishedSlugs` beside the other single-operation server exports.**
Add after the existing `export { search } from "./search/server";` block:

```ts
export { publishedSlugs } from "./publishedSlugs/server";
export type { PublishedSlugsServerArgs, PublishedSlug } from "./publishedSlugs/server";
```

**2 — bind it into `vexServerApi`, not `collectionsApi`.** `collectionsApi`
registers raw Convex endpoints for `convex/vex.ts` (`api.vex.*`); nothing in
this spec ever calls `api.vex.publishedSlugs`. Every consumer (Step 7's
`generateStaticParams`/sitemap, Step 8's template equivalents) calls
`apps/www/convex/pages.ts`'s own `publishedSlugs` query (added below), which
imports `publishedSlugs` from `~/vexcms/api` — the module `vexServerApi`'s
bound result backs, not `collectionsApi`'s. Add the value/type imports
beside the file's other sibling-module imports:

```ts
import type { PublishedSlug, PublishedSlugsServerArgs } from "./publishedSlugs/server";
import { publishedSlugs } from "./publishedSlugs/server";
```

Add the member to `VexServerApi<DataModel>`, after `remove`, before `globals`:

```ts
  /** List every document's slug + `_creationTime`, for sitemap generation. Always bypasses RBAC — sitemaps have no caller identity to filter by. */
  publishedSlugs: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<PublishedSlugsServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<PublishedSlug[]>;
```

Add the binding to `vexServerApi`'s returned object, after `remove`, before
`globals`. Unlike every other member here, this one needs no `inject()`
call: `PublishedSlugsServerArgs` carries no `config`/`auth` field —
`publishedSlugs` (core) always calls `find` with `access: { bypass: true }`
— so there is nothing for the factory to resolve before forwarding the call:

```ts
    publishedSlugs: (args) => publishedSlugs(args),
```

#### apps/www/src/vexcms/api.ts

1 edit — everything else in the file is unchanged.

**1 — bind `publishedSlugs` alongside the existing operations.**
`apps/www/convex/pages.ts`'s new `publishedSlugs` query (below) imports it
from here.

```ts
export const { get, find, search, create, remove, update, globals, publishedSlugs } = vexServerApi<DataModel>({
  config,
  getAuth: createGetAuth({
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: false,
  }),
})
```

#### apps/www/src/lib/metadata.ts

1 edit — the whole `generatePageMetadata` function body changes (title/description
now unconditional, `metadataBase` and `alternates.canonical` added); `resolveMediaUrl`
is unchanged.

**1 — `generatePageMetadata`, replacing lines 17–64.**

```ts
import { env } from "~/env.mjs"

const TITLE_SUFFIX = " | Vex CMS"

/**
 * Generate Next.js Metadata for a page.
 *
 * Fetches site settings and, when a slug is given, the matching page
 * document, then merges them — page-level `metaTitle`/`metaDescription`/
 * `ogImage` win over the site's defaults from `siteSettings`. Title and
 * description are always set; `openGraph`/`twitter`/`canonical` layer on top.
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: { slug?: string }): Promise<Metadata> {
  try {
    const settings = (await fetchQuery(api.siteSettings.get)) as null | Record<string, unknown>
    if (!settings) {
      return { title: "Untitled" }
    }

    let pageData: Record<string, unknown> | undefined
    if (props.slug) {
      const pages = (await fetchQuery(api.pages.getBySlug, { slug: props.slug })) as
        | Record<string, unknown>[]
        | undefined
      pageData = pages?.[0]
    }

    const pageTitle = (pageData?.metaTitle as string | undefined) ?? (pageData?.title as string | undefined)
    const siteName = settings.name as string | undefined
    const title = (pageTitle ?? (settings.metaTitle as string | undefined) ?? siteName ?? "Untitled") + TITLE_SUFFIX
    const description =
      (pageData?.metaDescription as string | undefined) ??
      (settings.metaDescription as string | undefined) ??
      (settings.description as string | undefined)

    // `upload()` fields always store an array of media ids — the first entry
    // is the selection. Page-level ogImage wins over the site default.
    const pageOgImageId = (pageData?.ogImage as string[] | undefined)?.[0]
    const siteOgImageId = (settings.ogImage as string[] | undefined)?.[0]
    const ogImageId = pageOgImageId ?? siteOgImageId
    const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

    const twitterHandle = settings.twitterHandle as string | undefined

    const canonicalPath = props.slug && props.slug !== "home" ? `/${props.slug}` : "/"

    const metadata: Metadata = {
      title,
      description,
      metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
      alternates: { canonical: canonicalPath },
      openGraph: {
        title,
        description,
        ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
      },
    }

    if (twitterHandle) {
      metadata.twitter = { card: "summary_large_image", site: twitterHandle }
    }

    return metadata
  } catch {
    // Convex not available — return minimal metadata
    return { title: "Vex CMS" }
  }
}
```

#### apps/www/src/app/(frontend)/(site)/page.tsx

1 edit — the default export's data fetch, replacing lines 14–23.

**1 — `HomePage`, `notFound()` on a missing document, throw on infrastructure errors.**

```tsx
import { notFound } from "next/navigation"

export default async function HomePage() {
  const initialData = await fetchQuery(api.pages.getBySlug, { slug: "home" })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} />
}
```

The `try {}catch {}` is gone: a Convex outage now throws out of the server
component and Next.js renders its error boundary as a real 500, instead of
swallowing the failure into an empty 200. A genuinely missing `home` document
still resolves the query successfully (`getBySlug` returns `[]`), so `notFound()`
is reached deliberately, not via a caught exception.

#### apps/www/src/app/(frontend)/(site)/[slug]/page.tsx

1 edit — same fix, replacing lines 15–26.

**1 — `PublicPage`, `notFound()` on a missing document, throw on infrastructure errors.**

```tsx
import { notFound } from "next/navigation"

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const initialData = await fetchQuery(api.pages.getBySlug, { slug: normalized })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
```

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

1 edit — remove the empty-body branch. Both page files above now only render
`PageContent` once `initialData` is a non-empty array, so this branch never
had a live path in practice, but it hid the same defect for any other future
caller.

**1 — `PageContent` body, deleting the `isPending`/`return null` guard.**
Removes:

```tsx
  if (isPending && initialData === undefined) {
    return null
  }

```

`isPending` is no longer read anywhere in the file, so its destructure changes
from `const { data: pages, isPending } = useQuery({...})` to `const { data: pages } = useQuery({...})`.

#### apps/www/src/app/sitemap.ts

New file. Uses plain `fetchQuery` — the cached, non-`no-store` client lands in
Step 2, and Step 7 migrates this route to it. Until then this route stays
dynamic (it was never in the static-route baseline), but it must still return
a valid document under P-020's placeholder-env CI build, so Convex errors are
caught and degrade to a base-URL-only sitemap rather than failing the build.

```ts
import type { MetadataRoute } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { env } from "~/env.mjs"

/**
 * Generates `/sitemap.xml` from every published `pages` document plus the
 * home route. Degrades to just the home route when Convex is unreachable
 * (P-020: CI builds with placeholder env) rather than failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL

  let entries: { slug: string; createdAt: number; updatedAt?: number }[] = []
  try {
    entries = await fetchQuery(api.pages.publishedSlugs, {})
  } catch {
    entries = []
  }

  // `lastModified` only when a real write timestamp exists. `_creationTime`
  // does not move when a page is edited, so using it would tell crawlers a
  // freshly-edited page is old.
  const pageEntries: MetadataRoute.Sitemap = entries
    .filter((entry) => entry.slug !== "home")
    .map((entry) => ({
      url: `${baseUrl}/${entry.slug}`,
      ...(entry.updatedAt === undefined ? {} : { lastModified: new Date(entry.updatedAt) }),
    }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    ...pageEntries,
  ]
}
```

This calls `api.pages.publishedSlugs`, a new query in `apps/www/convex/pages.ts`
(not shown as a separate file heading — it is a one-function addition to the
existing convex file mirroring `getBySlug`'s shape):

#### apps/www/convex/pages.ts

1 edit — add a `publishedSlugs` query beside the existing `getBySlug`.

**1 — new export, after `getBySlug`.**

```ts
import { publishedSlugs as publishedSlugsCore } from "~/vexcms/api"

export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await publishedSlugsCore({ ctx, collection: TABLE_SLUG_PAGES, access: { bypass: true } })
  },
})
```

`~/vexcms/api` is the same re-export path `pages.ts` already imports `find`
from (line 4), so `publishedSlugs` (core) joins that import rather than adding
a new module path.

#### apps/www/src/app/robots.ts

New file. Purely static — no Convex call, so P-020 does not apply here.

```ts
import type { MetadataRoute } from "next"

import { env } from "~/env.mjs"

/**
 * Generates `/robots.txt`. Allows all crawlers on the public site and points
 * them at the generated sitemap; disallows the authenticated `/admin` tree.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

Verify:

```bash
node scripts/verify-seo-routes.mjs --app apps/www --build --metadata --notfound
```

Exits non-zero on any failure. It builds the app, boots `next start` on a free
ephemeral port, asserts `<meta name="description">`, `og:title`,
`og:description` and `rel="canonical"` are present, that `/sitemap.xml` and
`/robots.txt` return 200 with real slugs and an `/admin` disallow, that an
unknown slug returns 404 with a non-empty body, and then always tears the
server down.

`og:image` is deliberately not asserted: it needs an uploaded image in
`siteSettings`, so gating on it would fail a fresh deployment for reasons
unrelated to this code (AP-012). The script reports its absence as a note.

### Step 2 — `@vexcms/next` cached read client and SEO factories [dev]

Why: The seam every later step consumes. The cached client drops
`fetchQuery`'s hard-coded `no-store` — the reason no route can prerender today
— and the factories let templates express correct SEO in three lines per
file.

- [ ] `packages/next/package.json` — add `./cache` and `./seo` export entries, a `test` script, and `vitest`/`@vitest/coverage-v8` dev deps
- [ ] `packages/next/vitest.config.ts` — required for the new test script; the package shipped no test runner
- [ ] `packages/next/src/cache/types.ts` — `VexServerClientOptions`, `VexServerClient`
- [ ] `packages/next/src/cache/createVexServerClient.ts` — `ConvexHttpClient`, no forced `no-store`, `React.cache` dedupe
- [ ] `packages/next/src/cache/createVexServerClient.test.ts`
- [ ] `packages/next/src/cache/index.ts` — barrel backing the new `./cache` export
- [ ] `packages/next/src/seo/vexStaticParams.ts` — `[]` when Convex is unreachable
- [ ] `packages/next/src/seo/vexStaticParams.test.ts`
- [ ] `packages/next/src/seo/createVexSitemap.ts`
- [ ] `packages/next/src/seo/createVexSitemap.test.ts`
- [ ] `packages/next/src/seo/createVexRobots.ts`
- [ ] `packages/next/src/seo/vexMetadata.ts`
- [ ] `packages/next/src/seo/vexMetadata.test.ts`
- [ ] `packages/next/src/seo/index.ts` — barrel backing the new `./seo` export
- [ ] `packages/next/src/index.ts` — re-export the new surface

#### packages/next/package.json

3 edits; everything else in the file is unchanged.

**1 — exports.** Beside the existing `"./client"` entry, add two subpaths
backed by the new barrels (same `source`/`import`/`types` shape):

```json
    "./cache": {
      "source": "./src/cache/index.ts",
      "import": "./dist/cache/index.js",
      "types": "./dist/cache/index.d.ts"
    },
    "./seo": {
      "source": "./src/seo/index.ts",
      "import": "./dist/seo/index.js",
      "types": "./dist/seo/index.d.ts"
    },
```

**2 — scripts.** Beside `"typecheck"`, add the test scripts every other
publishable package already carries (`packages/core`, `packages/react`):

```json
    "test": "vitest run",
    "coverage": "vitest run --coverage",
    "test:watch": "vitest",
```

**3 — devDependencies.** Add the two `catalog:` entries used for testing in
`packages/core`/`packages/react` (P-014 — every dev-time tool is a `catalog:`
devDependency; no version literals per P-015):

```json
    "@vitest/coverage-v8": "catalog:",
    "vitest": "catalog:",
```

#### packages/next/vitest.config.ts

New file, mirrors `packages/core/vitest.config.ts` — `node` environment, since
none of this package's new tests touch the DOM.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    coverage: {
      enabled: true,
    },
  },
});
```

#### packages/next/src/cache/types.ts

```ts
import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";

/** Configuration for {@link createVexServerClient}. */
export interface VexServerClientOptions {
  /** Convex deployment URL. Defaults to `process.env.NEXT_PUBLIC_CONVEX_URL`. */
  url?: string;
  /**
   * Skip Convex's deployment URL format check — for self-hosted backends
   * whose URL does not match `https://<name>.convex.cloud`.
   */
  skipConvexDeploymentUrlCheck?: boolean;
}

/**
 * Server-only Convex read client returned by {@link createVexServerClient}.
 *
 * Exposes only `query` — this client is for prerenderable read paths, and it
 * never sets `cache: "no-store"`, unlike `convex/nextjs`'s `fetchQuery`.
 */
export interface VexServerClient {
  /**
   * Runs a Convex query, deduped via `React.cache` for the lifetime of one
   * request when called again with the same function reference and args.
   *
   * @param query - The Convex query function reference to call.
   * @param args - Arguments for `query`, per Convex's `OptionalRestArgs`.
   * @returns The query's resolved return value.
   */
  query<Query extends FunctionReference<"query">>(
    query: Query,
    ...args: OptionalRestArgs<Query>
  ): Promise<FunctionReturnType<Query>>;
}
```

#### packages/next/src/cache/createVexServerClient.ts

```ts
import { ConvexHttpClient } from "convex/browser";
import { cache } from "react";
import type { FunctionReference, OptionalRestArgs } from "convex/server";

import type { VexServerClientOptions, VexServerClient } from "./types";

/**
 * Creates a server-only Convex read client safe to use in prerenderable
 * Next.js routes.
 *
 * Wraps `ConvexHttpClient` from `convex/browser` instead of `convex/nextjs`'s
 * `fetchQuery`, which hard-codes `client.setFetchOptions({ cache: "no-store" })`
 * — the reason every route calling it builds dynamic (`ƒ`). This client never
 * sets that option, so a route calling only `query()` can be prerendered and
 * governed by the route's own `export const revalidate`.
 *
 * Every `query()` call is deduped via `React.cache` for the lifetime of one
 * request: two identical `(query, args)` calls — e.g. `generateMetadata` and
 * its page both reading the same document — resolve from a single Convex
 * round trip instead of two.
 *
 * `React.cache` is instantiated fresh inside every `createVexServerClient()`
 * call, so that dedupe only holds across calls sharing the SAME client
 * instance — two clients built in two different modules cannot share a
 * round trip even when they read identical `(query, args)`. Each app
 * therefore creates exactly one instance, exported from its own
 * `src/lib/vex.ts`, and every route or component imports that shared `vex`
 * rather than calling `createVexServerClient()` itself.
 *
 * @param props - Client configuration.
 * @param props.url - Convex deployment URL. Defaults to
 *   `process.env.NEXT_PUBLIC_CONVEX_URL`.
 * @param props.skipConvexDeploymentUrlCheck - Skip Convex's deployment URL
 *   format check, for self-hosted backends.
 * @returns A {@link VexServerClient} whose `query` method is deduped per request.
 * @throws {Error} When no `url` is given and `process.env.NEXT_PUBLIC_CONVEX_URL`
 *   is unset.
 */
export function createVexServerClient(props: VexServerClientOptions = {}): VexServerClient {
  // TODO: implement
  // 1. Resolve the deployment url: `props.url ?? process.env.NEXT_PUBLIC_CONVEX_URL`
  //    → throw an `Error` naming `NEXT_PUBLIC_CONVEX_URL` if neither is set.
  // 2. `const client = new ConvexHttpClient(url, { skipConvexDeploymentUrlCheck: props.skipConvexDeploymentUrlCheck })`
  //    → deliberately never call `client.setFetchOptions({ cache: "no-store" })`.
  // 3. Wrap the read in `React.cache` so repeat calls within one request share
  //    a round trip:
  //    a. `const cachedQuery = cache(<Query extends FunctionReference<"query">>(
  //         query: Query, args: OptionalRestArgs<Query>[0],
  //       ) => client.query(query, args as OptionalRestArgs<Query>[0]))`
  //    → `React.cache` keys by referential identity of `query` plus a
  //      shallow-equal comparison of `args`.
  // 4. Return `{ query: (query, ...args) => cachedQuery(query, args[0]) }`,
  //    matching {@link VexServerClient}.
  // Edge cases:
  // - Two calls to the SAME query with DIFFERENT args must not share a cache
  //   entry — the cache key is (function reference, args), never the
  //   function reference alone.
  // - `React.cache` dedupes within one render/request only; a client built
  //   once at module scope is safe to reuse across requests because the
  //   dedupe boundary is per-request, not per-client-instance.
  // - `React.cache` is created per `createVexServerClient()` call, not once
  //   globally — a client instantiated in one file has its own cache, so
  //   another file calling `createVexServerClient()` for the identical
  //   query still costs a second Convex round trip. Cross-module dedupe
  //   requires a SINGLE shared instance; that is why each app exports one
  //   `vex` from `src/lib/vex.ts` instead of instantiating locally.
  throw new Error("Not implemented");
}
```

#### packages/next/src/cache/createVexServerClient.test.ts

Next's bundler resolves `react`'s `cache` to the real `react-server`
memoizing implementation at runtime; the plain `react` package vitest resolves
under Node ships a no-op passthrough
(`node_modules/react/cjs/react.development.js:917-921`). The mock below
substitutes a real memoizing implementation so this test exercises
`createVexServerClient`'s dedupe-key logic (query reference + args) in
isolation from that runtime difference.

```ts
import { describe, expect, test, vi } from "vitest";
import type { FunctionReference } from "convex/server";

const queryImpl = vi.fn(async () => ({ title: "Home" }));

vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({ query: queryImpl })),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: (fn: (...args: unknown[]) => unknown) => {
      const memo = new Map<string, unknown>();
      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) {
          memo.set(key, fn(...args));
        }
        return memo.get(key);
      };
    },
  };
});

const { createVexServerClient } = await import("./createVexServerClient");

const fakeQuery = { _type: "query" } as unknown as FunctionReference<"query">;

describe("createVexServerClient", () => {
  test("dedupes two identical reads into one Convex call", async () => {
    const client = createVexServerClient({ url: "https://example.convex.cloud" });

    const [first, second] = await Promise.all([
      client.query(fakeQuery, { slug: "home" }),
      client.query(fakeQuery, { slug: "home" }),
    ]);

    expect(first).toEqual({ title: "Home" });
    expect(second).toEqual({ title: "Home" });
    expect(queryImpl).toHaveBeenCalledTimes(1);
  });

  test("does not dedupe reads with different arguments", async () => {
    queryImpl.mockClear();
    const client = createVexServerClient({ url: "https://example.convex.cloud" });

    await client.query(fakeQuery, { slug: "home" });
    await client.query(fakeQuery, { slug: "about" });

    expect(queryImpl).toHaveBeenCalledTimes(2);
  });
});
```

#### packages/next/src/cache/index.ts

```ts
export { createVexServerClient } from "./createVexServerClient";
export type { VexServerClientOptions, VexServerClient } from "./types";
```

#### packages/next/src/seo/vexStaticParams.ts

```ts
import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";

import type { VexServerClient } from "../cache/types";

type ArrayItem<T> = T extends (infer Item)[] ? Item : never;

/**
 * Builds Next.js `generateStaticParams` output for a slug-driven route from a
 * Convex query.
 *
 * Returns `[]` when the read fails — including an unreachable Convex
 * deployment, which every CI build hits because it supplies placeholder env
 * rather than skipping validation (P-020). A route with no static params
 * still renders correctly on demand; it is simply not prerendered until the
 * next build.
 *
 * @param props - Static params configuration.
 * @param props.client - A {@link VexServerClient} to read through.
 * @param props.query - Convex query reference returning the collection's
 *   published items as an array.
 * @param props.args - Arguments for `query`.
 * @param props.paramName - The dynamic segment's param name, matching the
 *   route folder (`app/[slug]/page.tsx` → `"slug"`).
 * @param props.getSlug - Extracts the slug string from one returned item.
 * @returns `{ [paramName]: string }[]`, or `[]` if the read fails.
 */
export async function vexStaticParams<Query extends FunctionReference<"query">>(props: {
  client: VexServerClient;
  query: Query;
  args?: OptionalRestArgs<Query>[0];
  paramName: string;
  getSlug: (item: ArrayItem<FunctionReturnType<Query>>) => string;
}): Promise<Record<string, string>[]> {
  // TODO: implement
  // 1. try:
  //    a. `const items = await props.client.query(props.query, props.args ?? {})`
  //    b. → `return items.map((item) => ({ [props.paramName]: props.getSlug(item) }))`
  // 2. catch → `return []` (unreachable deployment, or any other read failure).
  // Edge cases:
  // - An empty `items` array is not an error — return `[]` either way, so the
  //   route just renders on demand.
  throw new Error("Not implemented");
}
```

#### packages/next/src/seo/vexStaticParams.test.ts

```ts
import { describe, expect, test, vi } from "vitest";
import type { FunctionReference } from "convex/server";

import { vexStaticParams } from "./vexStaticParams";
import type { VexServerClient } from "../cache/types";

const fakeQuery = { _type: "query" } as unknown as FunctionReference<"query">;

function fakeClient(query: VexServerClient["query"]): VexServerClient {
  return { query };
}

describe("vexStaticParams", () => {
  test("maps published items to route params", async () => {
    const client = fakeClient(vi.fn().mockResolvedValue([{ slug: "about" }, { slug: "pricing" }]));

    const params = await vexStaticParams({
      client,
      query: fakeQuery,
      paramName: "slug",
      getSlug: (item) => item.slug,
    });

    expect(params).toEqual([{ slug: "about" }, { slug: "pricing" }]);
  });

  test("returns [] when Convex is unreachable", async () => {
    const client = fakeClient(vi.fn().mockRejectedValue(new Error("fetch failed")));

    const params = await vexStaticParams({
      client,
      query: fakeQuery,
      paramName: "slug",
      getSlug: (item) => item.slug,
    });

    expect(params).toEqual([]);
  });
});
```

#### packages/next/src/seo/createVexSitemap.ts

```ts
import type { MetadataRoute } from "next";
import type { FunctionReference, FunctionReturnType, OptionalRestArgs } from "convex/server";

import type { VexServerClient } from "../cache/types";

type ArrayItem<T> = T extends (infer Item)[] ? Item : never;

/**
 * Creates a Next.js `sitemap.ts` default export from a Convex published-slugs
 * query (`packages/core/src/api/publishedSlugs/server.ts`).
 *
 * Tolerates an unreachable Convex deployment (P-020): a read failure returns
 * `[]` — an empty sitemap — rather than failing the build.
 *
 * @param props - Sitemap configuration.
 * @param props.client - A {@link VexServerClient} to read through.
 * @param props.query - Convex query reference returning published items.
 * @param props.args - Arguments for `query`.
 * @param props.toUrl - Maps one item's slug to its absolute public URL — the
 *   route mapper, so URL shape (e.g. `/blog/[slug]` vs `/[slug]`) is the
 *   caller's choice.
 * @param props.getSlug - Extracts the slug string from one item.
 * @param props.getUpdatedAt - Optional last-modified extractor (ms epoch)
 *   from one item.
 * @returns A `sitemap()` function suitable as `app/sitemap.ts`'s default export.
 */
export function createVexSitemap<Query extends FunctionReference<"query">>(props: {
  client: VexServerClient;
  query: Query;
  args?: OptionalRestArgs<Query>[0];
  toUrl: (slug: string) => string;
  getSlug: (item: ArrayItem<FunctionReturnType<Query>>) => string;
  /**
   * Optional last-modified extractor. Omit it when the collection carries no
   * modification timestamp — Convex's `_creationTime` is set at insert and
   * never moves, so reporting it as `lastModified` would be a lie. `lastModified`
   * is optional in the sitemap protocol; an absent value is correct, a wrong
   * one costs crawl budget.
   */
  getUpdatedAt?: (item: ArrayItem<FunctionReturnType<Query>>) => number;
}): () => Promise<MetadataRoute.Sitemap> {
  return async function sitemap() {
    // TODO: implement
    // 1. try:
    //    a. `const items = await props.client.query(props.query, props.args ?? {})`
    //    b. → `return items.map((item) => ({
    //         url: props.toUrl(props.getSlug(item)),
    //         ...(props.getUpdatedAt
    //           ? { lastModified: new Date(props.getUpdatedAt(item)) }
    //           : {}),
    //       }))`
    // 2. catch → `return []` (unreachable deployment, or any other read failure).
    throw new Error("Not implemented");
  };
}
```

#### packages/next/src/seo/createVexSitemap.test.ts

```ts
import { describe, expect, test, vi } from "vitest";
import type { FunctionReference } from "convex/server";

import { createVexSitemap } from "./createVexSitemap";
import type { VexServerClient } from "../cache/types";

const fakeQuery = { _type: "query" } as unknown as FunctionReference<"query">;

function fakeClient(query: VexServerClient["query"]): VexServerClient {
  return { query };
}

describe("createVexSitemap", () => {
  test("maps published items to sitemap entries", async () => {
    const client = fakeClient(
      vi.fn().mockResolvedValue([{ slug: "about", createdAt: 1_600_000_000_000, updatedAt: 1_700_000_000_000 }]),
    );
    const sitemap = createVexSitemap({
      client,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
      getSlug: (item) => item.slug,
          });

    expect(await sitemap()).toEqual([
      { url: "https://example.com/about", lastModified: new Date(1_700_000_000_000) },
    ]);
  });

  test("returns [] when Convex is unreachable", async () => {
    const client = fakeClient(vi.fn().mockRejectedValue(new Error("fetch failed")));
    const sitemap = createVexSitemap({
      client,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
      getSlug: (item) => item.slug,
          });

    expect(await sitemap()).toEqual([]);
  });
});
```

#### packages/next/src/seo/createVexRobots.ts

```ts
import type { MetadataRoute } from "next";

/**
 * Creates a Next.js `robots.ts` default export that allows all crawlers and
 * points to the site's sitemap.
 *
 * @param props - Robots configuration.
 * @param props.siteUrl - The site's absolute origin, no trailing slash (e.g.
 *   `https://example.com`). The sitemap URL is derived as
 *   `${siteUrl}/sitemap.xml`.
 * @returns A `robots()` function suitable as `app/robots.ts`'s default export.
 */
export function createVexRobots(props: {
  siteUrl: string;
  disallow?: string[];
}): () => MetadataRoute.Robots {
  return function robots() {
    // TODO: implement
    // 1. Build the rule: `{ userAgent: "*", allow: "/" }`, adding
    //    `disallow: props.disallow` only when the array is non-empty.
    // 2. → `return { rules, sitemap: \`${props.siteUrl}/sitemap.xml\` }`
    // Edge cases:
    // - `disallow` omitted → emit no `disallow` key at all rather than an
    //   empty array, which some crawlers read as "disallow nothing" noise.
    // - An admin panel and API routes should not be indexed, so every vexcms
    //   template passes `["/admin", "/api"]`.
    throw new Error("Not implemented");
  };
}
```

#### packages/next/src/seo/vexMetadata.ts

```ts
import type { Metadata } from "next";

/**
 * Builds a Next.js `Metadata` object with unconditional title/description, a
 * conditional OG image, `metadataBase`, and a canonical link.
 *
 * Generalizes what Step 1 fixed by hand in `apps/www/src/lib/metadata.ts`:
 * title and description are set regardless of whether an OG image resolved —
 * only the `openGraph.images` entry is conditional on `props.imageUrl`.
 *
 * @param props - Metadata inputs.
 * @param props.title - Page title.
 * @param props.description - Page description.
 * @param props.siteUrl - The site's absolute origin, used for `metadataBase`.
 * @param props.path - The page's path (e.g. `/about`), used for the
 *   canonical link.
 * @param props.imageUrl - Optional absolute OG image URL.
 * @returns A `Metadata` object for a page's `generateMetadata`/static `metadata` export.
 */
export function vexMetadata(props: {
  title: string;
  description?: string;
  siteUrl: string;
  path: string;
  imageUrl?: string;
}): Metadata {
  // TODO: implement
  // 1. `const metadataBase = new URL(props.siteUrl)`
  // 2. Build the base metadata unconditionally:
  //    `{ title: props.title, description: props.description, metadataBase, alternates: { canonical: props.path } }`
  // 3. When `props.imageUrl` is set, add
  //    `openGraph: { title: props.title, description: props.description, images: [{ url: props.imageUrl }] }`.
  // Edge cases:
  // - No `imageUrl` → metadata still carries title/description; `openGraph`
  //   is omitted entirely rather than emitted title-less/description-less.
  throw new Error("Not implemented");
}
```

#### packages/next/src/seo/vexMetadata.test.ts

```ts
import { describe, expect, test } from "vitest";

import { vexMetadata } from "./vexMetadata";

describe("vexMetadata", () => {
  test("sets title/description unconditionally, with no openGraph when imageUrl is absent", () => {
    const metadata = vexMetadata({
      title: "About",
      description: "About us.",
      siteUrl: "https://example.com",
      path: "/about",
    });

    expect(metadata.title).toBe("About");
    expect(metadata.description).toBe("About us.");
    expect(metadata.metadataBase).toEqual(new URL("https://example.com"));
    expect(metadata.alternates).toEqual({ canonical: "/about" });
    expect(metadata.openGraph).toBeUndefined();
  });

  test("adds openGraph with the image when imageUrl is set", () => {
    const metadata = vexMetadata({
      title: "About",
      description: "About us.",
      siteUrl: "https://example.com",
      path: "/about",
      imageUrl: "https://example.com/og.png",
    });

    expect(metadata.title).toBe("About");
    expect(metadata.description).toBe("About us.");
    expect(metadata.openGraph).toEqual({
      title: "About",
      description: "About us.",
      images: [{ url: "https://example.com/og.png" }],
    });
  });
});
```

#### packages/next/src/seo/index.ts

```ts
export { vexStaticParams } from "./vexStaticParams";
export { createVexSitemap } from "./createVexSitemap";
export { createVexRobots } from "./createVexRobots";
export { vexMetadata } from "./vexMetadata";
```

#### packages/next/src/index.ts

1 edit; everything else in the file is unchanged.

**1 — new surface.** At the end of the file, after the existing
`export type { RelationshipKeysOf, … } from "@vexcms/core";` block, add the
cache/SEO re-exports. None of these import a React context or `"use client"`
module, so they are safe inside this RSC-imported root barrel; they are also
independently reachable via the `"@vexcms/next/cache"` and
`"@vexcms/next/seo"` subpaths added above.

```ts
// Cache / SEO surface — server-only, no client context.
export { createVexServerClient } from "./cache/createVexServerClient";
export type { VexServerClientOptions, VexServerClient } from "./cache/types";
export { vexStaticParams } from "./seo/vexStaticParams";
export { createVexSitemap } from "./seo/createVexSitemap";
export { createVexRobots } from "./seo/createVexRobots";
export { vexMetadata } from "./seo/vexMetadata";
```

Verify: `pnpm --filter @vexcms/next build && pnpm --filter @vexcms/next test`.

### Step 3 — Core revalidation target vocabulary [dev]

Why: The one framework-agnostic piece of the revalidation feature: given a
collection, an operation, and the before/after documents, produce the list of
paths to purge. It lives in core so the future TanStack adapter and a later
server-side dispatch inherit identical semantics. Tiny and pure, so it lands
before both consumers.

`CrudWriteAction` reuses `CRUD_ACTIONS`/`CrudAction` (`Extract<CrudAction,
"create" | "update" | "delete">`) rather than a parallel constant map — P-003.
`sanitizeConfigForClient`'s `stripNonSerializable` already nulls every
function value recursively when a `VexConfig` crosses the RSC boundary (P-005,
`config/sanitizeConfig.ts:66-68`), so `routes.map` — server-only by
design — is stripped automatically with zero code change; `config/sanitizeConfig.ts`
is not touched by this step.

- [ ] `packages/core/src/revalidate/types.ts` — `VexRouteMapper`, `VexRoutesConfig`, `ResolveTargetsResult`, `VexRevalidateChange`
- [ ] `packages/core/src/revalidate/constants.ts` — `VEX_REVALIDATE_BATCH_SIZE`
- [ ] `packages/core/src/revalidate/resolveTargets.ts`
- [ ] `packages/core/src/revalidate/resolveTargets.test.ts`
- [ ] `packages/core/src/revalidate/index.ts` — barrel, now also `./constants`
- [ ] `packages/core/src/config/types.ts` — `revalidate` on `VexConfigInput`
- [ ] `packages/core/src/config/config.ts` — defaults for `revalidate`
- [ ] `packages/core/src/config/config.test.ts`
- [ ] `packages/core/src/index.ts` — re-export

#### packages/core/src/revalidate/types.ts

```ts
import { CrudAction } from "../access";
import { VexDocument } from "../api/convex";
import { CollectionSlug } from "../types";

/**
 * CRUD operations that can trigger a revalidation purge. A subset of
 * {@link CrudAction} — `"read"` never mutates a document, so it never
 * invalidates a cached path.
 */
export type CrudWriteAction = Extract<CrudAction, "create" | "update" | "delete">;

/**
 * The wire vocabulary for a revalidation request's `operation`.
 *
 * Named for the `vexConvexApi` function that produced the write
 * (`vexConvexApi.remove`, `vexConvexApi.globals.upsert`), which is why it
 * differs from {@link CrudWriteAction} / `CRUD_ACTIONS`: the route maps
 * `"remove"` -> `"delete"` and `"upsert"` -> `"update"` exactly once, before
 * either the permission check or target resolution.
 *
 * Declared here rather than in `@vexcms/react` because it is part of the wire
 * contract that `@vexcms/react` (the client) and `@vexcms/next` (the route)
 * must agree on, and `@vexcms/core` is the lowest package both depend on
 * (P-010).
 */
export type VexMutationOperation = "create" | "update" | "remove" | "upsert";


/**
 * User-supplied function mapping a document to the public paths that render
 * it. Configured once in `vex.config.ts`'s `routes.map` and invoked by
 * {@link resolveTargets} — once per document state involved in a write, so a
 * slug rename resolves BOTH the old and the new path.
 *
 * @param props - The collection slug and document to resolve paths for.
 * @param props.collection - Slug of the collection `props.doc` belongs to.
 * @param props.doc - The document state (before or after the write) to
 *   compute rendered paths for.
 * @returns The public paths that render `props.doc`. Empty when the
 *   collection or document is never rendered on a public page (e.g. an
 *   internal-only collection).
 *
 * @example
 * ```ts
 * const mapper: VexRouteMapper = ({ collection, doc }) => {
 *   if (collection !== "pages") return [];
 *   const slug = doc.slug as string;
 *   return [slug === "home" ? "/" : `/${slug}`];
 * };
 * ```
 */
export type VexRouteMapper = (props: { collection: CollectionSlug; doc: VexDocument }) => string[];

/**
 * The `revalidate` section of `vex.config.ts` — configures path-based cache
 * invalidation for prerendered public pages. Omit the whole section to opt
 * out; there is no sensible default mapper.
 *
 * **Defaults applied by `defineConfig()`:**
 * ```ts
 * { revalidateSeconds: 3600 } // 1 hour, applied only when `revalidate` is present
 * ```
 *
 * @see {@link VexRouteMapper} for the mapper contract
 * @see {@link resolveTargets} for how the mapper is invoked
 */
export interface VexRoutesConfig {
  /**
   * Maps a written document to the public paths that render it. Required —
   * without a mapper, purging a save has nothing to purge.
   */
  mapper: VexRouteMapper;
  /**
   * Default ISR interval, in seconds, for prerendered public routes that
   * don't declare their own `export const revalidate`.
   *
   * Default: `3600` (1 hour).
   */
  revalidateSeconds?: number;
}

/**
 * Result of {@link resolveTargets} — the deduped paths to purge for a single
 * document write, plus any route-mapper failures encountered while computing
 * them.
 *
 * `errors` is never thrown — a broken mapper must never block a save.
 * Callers (the revalidation route, a future CLI dispatch) decide how to
 * surface it.
 */
export interface ResolveTargetsResult {
  /** Deduped, order-stable public paths to pass to `revalidatePath`. */
  paths: string[];
  /**
   * Errors thrown by `mapper`, one per failed invocation. Empty when every
   * call to `mapper` succeeded.
   */
  errors: unknown[];
}

/**
 * One document's before/after pair for a single change in a revalidation
 * request. The wire-level counterpart to one {@link resolveTargets} call —
 * `@vexcms/next`'s route request types and `@vexcms/react`'s
 * `useVexMutation`/`useVexRevalidate` all consume this same shape, so it is
 * declared once here rather than once per consumer (P-010): `@vexcms/react`
 * cannot depend on `@vexcms/next`, and both depend on `@vexcms/core`.
 */
export interface VexRevalidateChange {
  /** State before the write. Omitted for `"create"`. */
  before?: VexDocument;
  /** State after the write. Omitted for `"remove"`. */
  after?: VexDocument;
}
```

#### packages/core/src/revalidate/constants.ts

New file. `useVexMutation` (`@vexcms/react`, Step 5) and the route created by
`createVexRevalidateRoute` (`@vexcms/next`, Step 4) both read this value
rather than each hard-coding `100` (P-003) — the client chunks a larger
`changes` batch to this size, and the route rejects a batch that exceeds it
with `413`.

```ts
/**
 * Maximum number of `changes` entries accepted in a single revalidation
 * request. `useVexMutation` chunks a larger batch into requests of at most
 * this size, issued sequentially; the route created by
 * `createVexRevalidateRoute` rejects a request whose `changes` array exceeds
 * it with `413` — so a hand-rolled client cannot force an unbounded mapper
 * loop (the case this guards against is a "select all" bulk delete).
 */
export const VEX_REVALIDATE_BATCH_SIZE = 100;
```

#### packages/core/src/revalidate/resolveTargets.ts

```ts
import { CollectionSlug } from "../types";
import { VexDocument } from "../api/convex";
import { CrudWriteAction, ResolveTargetsResult, VexRouteMapper } from "./types";

/**
 * Input to {@link resolveTargets}.
 */
export interface ResolveTargetsProps {
  /** The project's route mapper, from `vex.config.ts`'s `routes.map`. */
  mapper: VexRouteMapper;
  /** Slug of the collection the write occurred against. */
  collection: CollectionSlug;
  /** CRUD operation that triggered the write. */
  operation: CrudWriteAction;
  /** Document state before the write. Omit for `"create"`. */
  before?: VexDocument;
  /** Document state after the write. Omit for `"delete"`. */
  after?: VexDocument;
}

/**
 * Resolves the deduped, order-stable list of public paths to purge for a
 * single document write, plus any route-mapper failures. The one
 * framework-agnostic piece of the revalidation feature — pure, no I/O — so a
 * future TanStack adapter and a possible later server-side dispatch inherit
 * identical semantics.
 *
 * @param props - The write description and the project's route mapper.
 * @param props.mapper - Maps `{ collection, doc }` to the paths that render it.
 * @param props.collection - Slug of the written collection.
 * @param props.operation - `"create"`, `"update"`, or `"delete"`.
 * @param props.before - Document state before the write.
 * @param props.after - Document state after the write.
 * @returns The deduped paths to purge, plus any mapper errors. Never throws —
 *   a mapper failure is captured in `errors`, not propagated.
 *
 * @example
 * ```ts
 * // Slug rename: "/about" -> "/company" — BOTH paths come back so the old
 * // URL never serves stale content.
 * resolveTargets({
 *   mapper,
 *   collection: "pages",
 *   operation: "update",
 *   before: { _id: "1", _creationTime: 0, slug: "about" },
 *   after: { _id: "1", _creationTime: 0, slug: "company" },
 * });
 * // → { paths: ["/about", "/company"], errors: [] }
 * ```
 */
export function resolveTargets(props: ResolveTargetsProps): ResolveTargetsResult {
  // 1. Build the ordered list of documents to map, per `props.operation`:
  //    a. "create" → [props.after]
  //    b. "delete" → [props.before]
  //    c. "update" → [props.before, props.after] — BOTH, so a mapper output
  //       change (e.g. a slug rename) also purges the stale old path.
  //    → an array of `VexDocument | undefined`.
  //
  // 2. For each doc in that list, in order:
  //    a. Skip `undefined` (caller omitted `before`/`after` for this operation).
  //    b. Call `props.mapper({ collection: props.collection, doc })` inside a
  //       try/catch — a throw from ONE call must never abort the others.
  //       → on success, push its returned `string[]` onto a path pool.
  //       → on throw, push the caught value onto an `errors: unknown[]`
  //         accumulator and contribute no paths for that call.
  //
  // 3. Dedupe the pooled paths while preserving first-seen order (build a
  //    `Set<string>` by inserting pool entries in order, then spread it) —
  //    NOT a sort, which would destroy the stable ordering the tests assert.
  //
  // 4. Return `{ paths: [...dedupedPaths], errors }`.
  //
  // Edge cases:
  // - A mapper returning `[]` for a doc contributes nothing — not an error.
  // - An update where before/after resolve to the SAME path (no rename)
  //   dedupes to one entry, not two.
  // - `before` and `after` both `undefined` → `paths: []`, `errors: []` —
  //   nothing to call, nothing to purge.
  throw new Error("Not implemented");
}
```

#### packages/core/src/revalidate/resolveTargets.test.ts

```ts
import { describe, it, expect } from "vitest";
import { resolveTargets } from "./resolveTargets";
import type { VexRouteMapper } from "./types";

const aboutPage = { _id: "doc1", _creationTime: 0, slug: "about" };
const companyPage = { _id: "doc1", _creationTime: 0, slug: "company" };
const homePage = { _id: "doc2", _creationTime: 0, slug: "home" };

const pageMapper: VexRouteMapper = ({ collection, doc }) => {
  if (collection !== "pages") return [];
  const slug = doc.slug as string;
  return [slug === "home" ? "/" : `/${slug}`];
};

describe("resolveTargets", () => {
  it("create — maps the new document only", () => {
    const result = resolveTargets({
      mapper: pageMapper,
      collection: "pages",
      operation: "create",
      after: aboutPage,
    });
    expect(result).toEqual({ paths: ["/about"], errors: [] });
  });

  it("update without a rename — dedupes to one path", () => {
    const result = resolveTargets({
      mapper: pageMapper,
      collection: "pages",
      operation: "update",
      before: aboutPage,
      after: { ...aboutPage, title: "About us" },
    });
    expect(result).toEqual({ paths: ["/about"], errors: [] });
  });

  it("update with a rename — returns BOTH the old and the new path", () => {
    const result = resolveTargets({
      mapper: pageMapper,
      collection: "pages",
      operation: "update",
      before: aboutPage,
      after: companyPage,
    });
    expect(result).toEqual({ paths: ["/about", "/company"], errors: [] });
  });

  it("delete — maps the old document only", () => {
    const result = resolveTargets({
      mapper: pageMapper,
      collection: "pages",
      operation: "delete",
      before: homePage,
    });
    expect(result).toEqual({ paths: ["/"], errors: [] });
  });

  it("contains a mapper that throws for every call — reports errors, never propagates", () => {
    const boom = new Error("boom");
    const throwingMapper: VexRouteMapper = () => {
      throw boom;
    };
    const result = resolveTargets({
      mapper: throwingMapper,
      collection: "pages",
      operation: "update",
      before: aboutPage,
      after: companyPage,
    });
    expect(result).toEqual({ paths: [], errors: [boom, boom] });
  });

  it("contains a mapper that throws for only one call — keeps the other's paths", () => {
    const boom = new Error("boom on rename");
    const partialMapper: VexRouteMapper = ({ doc }) => {
      if (doc.slug === "company") throw boom;
      return [`/${doc.slug as string}`];
    };
    const result = resolveTargets({
      mapper: partialMapper,
      collection: "pages",
      operation: "update",
      before: aboutPage,
      after: companyPage,
    });
    expect(result).toEqual({ paths: ["/about"], errors: [boom] });
  });
});
```

#### packages/core/src/revalidate/index.ts

```ts
export * from "./types";
export * from "./constants";
export * from "./resolveTargets";
```

#### packages/core/src/config/types.ts

3 edits — everything else in the file is unchanged.

**1 — import.** Add beside the existing `VexAccessConfig` import:

```ts
import { VexRoutesConfig } from "../revalidate";
```

**2 — `VexConfigInput.revalidate`.** Add a property beside `types?: TypesConfigInput;`:

```ts
  /**
   * Path-based cache-revalidation configuration — purges prerendered public
   * paths when a document is saved in the admin panel. Omit to opt out
   * entirely; there is no sensible default mapper.
   *
   * **Defaults applied by `defineConfig()`:** `revalidateSeconds` defaults to
   * `3600` (1 hour) when `revalidate` is supplied without one.
   *
   * @see {@link VexRoutesConfig} for all available options
   */
  revalidate?: VexRoutesConfig;
```

**3 — `VexConfig.revalidate`.** Add a property beside `types: TypesConfig;`:

```ts
  /**
   * Resolved revalidation configuration. `undefined` when the project never
   * configured `revalidate` — the feature is opt-in.
   */
  revalidate?: VexRoutesConfig;
```

#### packages/core/src/config/config.ts

1 edit — everything else in the file is unchanged.

**1 — `revalidate` default.** Add a property to the object returned by `defineConfig`, beside the existing `types: { outputPath: "/src/vex.types.ts", ...config?.types }` block:

```ts
    revalidate: config?.revalidate
      ? {
          ...config.routes,
          revalidateSeconds: config.routes.revalidateSeconds ?? 3600,
        }
      : undefined,
```

#### packages/core/src/config/config.test.ts

2 edits — everything else in the file is unchanged.

**1 — type imports.** Add `VexRouteMapper` to the existing `import type { VexStorageAdapter, MediaCollectionConfig } from "../";` line.

**2 — new describe block.** Append after the `defineConfig with storage adapters` describe block:

```ts
// ── Revalidate defaults ────────────────────────────────────────────────────

describe("defineConfig — revalidate defaults", () => {
  it("leaves revalidate undefined when omitted", () => {
    const config = defineConfig();
    expect(config.routes).toBeUndefined();
  });

  it("defaults revalidateSeconds to 3600 when a mapper is supplied without one", () => {
    const mapper: VexRouteMapper = () => [];
    const config = defineConfig({ revalidate: { mapper } });
    expect(config.routes?.revalidateSeconds).toBe(3600);
    expect(config.routes?.mapper).toBe(mapper);
  });

  it("keeps an explicit revalidateSeconds", () => {
    const mapper: VexRouteMapper = () => [];
    const config = defineConfig({
      revalidate: { mapper, revalidateSeconds: 60 },
    });
    expect(config.routes?.revalidateSeconds).toBe(60);
  });
});
```

#### packages/core/src/index.ts

1 edit — everything else in the file is unchanged.

**1 — re-export.** Add a new section after `export * from "./access";`:

```ts
// ============================================================================
// REVALIDATION
// ============================================================================

export * from "./revalidate";
```

Verify: `pnpm --filter @vexcms/core test`.

### Step 4 — `@vexcms/next` revalidation route factory [dev]

Why: The endpoint the admin panel calls. Session-authorized rather than
secret-authorized — the caller is a signed-in admin, so it reuses the existing
auth and needs no new env var. Path-based via `revalidatePath` because
`cacheComponents` (required for `cacheTag`/`revalidateTag`) is incompatible with
the `dynamic` and `runtime` segment configs the auth and admin routes require:
measured, 5 failing files.

This step deliberately adds **no env var and no shared secret**. The caller is
proven to be a signed-in admin — the route reads the same session token and
runs the same `hasPermission` check every Convex mutation already runs — so a
secret would protect nothing an authenticated session doesn't already prove,
and it would be one more value to provision, rotate, and leak. There is no
API-key fallback either: a caller with no browser session (a CLI, a webhook)
cannot call this route as designed, by choice.

- [ ] `packages/next/src/cache/createVexRevalidateRoute.ts`
- [ ] `packages/next/src/cache/createVexRevalidateRoute.test.ts`
- [ ] `packages/next/src/cache/types.ts` — extend with `VexRevalidateRequest`, `VexRevalidateResponse`
- [ ] `packages/next/src/cache/index.ts` — re-export the factory; `"./cache"` resolves here, not to the root barrel
- [ ] `packages/next/src/index.ts` — re-export

#### packages/next/src/cache/createVexRevalidateRoute.ts

New file. A guided stub — the developer implements the handler body. Consumes
core's `resolveTargets` (Step 3) for target resolution and `hasPermission`
(existing) for authorization. The request carries a `changes:
VexRevalidateChange[]` batch rather than a single `before`/`after` pair — a
list-view bulk delete produces N changed documents, not one — so the handler
calls `resolveTargets` once per entry and pools the results; a batch over
`VEX_REVALIDATE_BATCH_SIZE` (100, `@vexcms/core`) entries is rejected with
`413` before any mapper work runs, so a hand-rolled client cannot force an
unbounded mapper loop. The request's `operation` field is a
`VexMutationOperation` (`@vexcms/core`, Step 3) — `"create" | "update" |
"remove" | "upsert"`, named for the `vexConvexApi` function it came from —
not a `CrudAction`, so it does NOT double as the `hasPermission` action
directly: `hasPermission` only accepts `CRUD_ACTIONS` (`"create" | "read" |
"update" | "delete"`, `packages/core/src/access/constants.ts`). The handler
maps the wire verb to an action once, before using it for both the
permission check and target resolution — `"remove"` → `"delete"`,
`"upsert"` → `"update"`, `"create"`/`"update"` unchanged. `config`,
`getToken`, and `getAuth` are all injected props — the escape-hatch pattern
this package uses everywhere else (`createVexSitemap`, `createVexServerClient`)
— so the factory never imports an app's generated Convex `api` or its
`~/auth/server` module directly.

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasPermission, resolveTargets, VEX_REVALIDATE_BATCH_SIZE } from "@vexcms/core";
import type { VexConfig } from "@vexcms/core";

import type { VexRevalidateRequest, VexRevalidateResponse } from "./types";

/**
 * Props for {@link createVexRevalidateRoute}.
 */
export interface CreateVexRevalidateRouteProps {
  /**
   * The resolved VexCMS config. Supplies `access` for the write-permission
   * check and `revalidate` (the route mapper) for target resolution.
   */
  config: VexConfig;
  /**
   * Reads the caller's session token for the current request. Wire to the
   * host app's `getToken` export (`convexBetterAuthNextJs`'s output,
   * re-exported from e.g. `~/auth/server`). A falsy return means "no
   * session".
   */
  getToken: () => Promise<string | null | undefined>;
  /**
   * Resolves the authenticated user and active organization for the current
   * request. Wire to `() => fetchAuthQuery(api.auth.api.getUserOrg, {})` —
   * the same call the admin panel route already makes.
   */
  getAuth: () => Promise<{
    user: Record<string, unknown> | null;
    organization?: Record<string, unknown>;
  }>;
}

/**
 * Creates a Next.js route handler that purges the cached paths affected by a
 * document write. The admin panel calls this via `useVexMutation` (Step 5)
 * after every successful create/update/delete, same-origin, as a relative
 * fetch — no URL config, no shared secret.
 *
 * **Session-authorized, not secret-authorized.** The caller is a signed-in
 * admin, so this reuses `getToken`/`getAuth` exactly like the admin panel
 * route does, rather than introducing an env var or a shared secret. There is
 * no API-key fallback: a caller with no browser session cannot reach this
 * route as designed.
 *
 * **Path-based, not tag-based.** `revalidatePath` is the only purge mechanism.
 * `cacheComponents: true` — required for `cacheTag`/`revalidateTag` — is
 * incompatible with the `dynamic`/`runtime` segment configs the auth and
 * admin routes require (measured: 5 files fail to build with it enabled), so
 * `revalidateTag` is not an option in this codebase. Do not "upgrade" this to
 * tag-based revalidation without first removing that segment-config
 * dependency everywhere.
 *
 * **Never fails the caller past authorization.** A missing/invalid session
 * still returns a real 401, a session without write permission a real 403,
 * and a `changes` batch larger than `VEX_REVALIDATE_BATCH_SIZE` a real 413
 * — all three reject the request before any mapper or Convex work runs;
 * none is a purge failure. Past that point this handler never throws or
 * returns 5xx: an unconfigured mapper, a throwing mapper, or an individual
 * `revalidatePath` failure all resolve to 200 with the failures reported in
 * the body. A failed purge is a stale page; failing the endpoint would only
 * teach the fire-and-forget caller to retry pointlessly.
 *
 * @param props - `{ config, getToken, getAuth }`.
 * @returns `{ POST }` — mount directly as the route module's named export.
 * @throws Never. Every failure mode resolves to a response (401, 403, 413, or 200).
 * @example
 * ```ts
 * // app/api/vex/revalidate/route.ts
 * import { api } from "@convex/_generated/api";
 * import { createVexRevalidateRoute } from "@vexcms/next/cache";
 * import { fetchAuthQuery, getToken } from "~/auth/server";
 * import config from "~/vex.config";
 *
 * export const { POST } = createVexRevalidateRoute({
 *   config,
 *   getToken,
 *   getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
 * });
 * ```
 */
export function createVexRevalidateRoute(props: CreateVexRevalidateRouteProps): {
  POST: (request: NextRequest) => Promise<NextResponse<VexRevalidateResponse | { error: string }>>;
} {
  return {
    async POST(request: NextRequest) {
      // TODO: implement
      // 1. Read the session token via `props.getToken()`.
      //    a. Falsy → return `NextResponse.json({ error: "Unauthorized" }, { status: 401 })`.
      // 2. Parse the request body as `VexRevalidateRequest` via `await request.json()`.
      //    a. Throws (malformed JSON) → return `NextResponse.json({ error: "Bad Request" }, { status: 400 })`.
      // 3. Resolve `{ user, organization }` via `await props.getAuth()`.
      // 4. Map the wire operation to a CRUD action: `body.operation` is a
      //    `VexMutationOperation` ("create" | "update" | "remove" | "upsert",
      //    `@vexcms/core`,
      //    `@vexcms/react`, Step 5 — named for the `vexConvexApi` function, e.g.
      //    `vexConvexApi.remove`), not a `CrudAction`, so it does NOT double
      //    as the `hasPermission`/`resolveTargets` action directly:
      //    `hasPermission` only accepts `CRUD_ACTIONS`
      //    ("create" | "read" | "update" | "delete",
      //    `packages/core/src/access/constants.ts`). Map once —
      //    `"remove"` → `"delete"`, `"upsert"` → `"update"`, `"create"`/
      //    `"update"` unchanged — call the result `action`, then check
      //    write permission: `hasPermission({ access: props.config.access,
      //    user, organization, resource: body.collection, action })`.
      //    a. `false` → return `NextResponse.json({ error: "Forbidden" }, { status: 403 })`.
      // 5. `body.changes.length > VEX_REVALIDATE_BATCH_SIZE` → return
      //    `NextResponse.json({ error: "Cannot revalidate more than
      //    ${VEX_REVALIDATE_BATCH_SIZE} changes in a single request" },
      //    { status: 413 })` — before any mapper work runs, so a hand-rolled
      //    client cannot force an unbounded loop over `resolveTargets`.
      // 6. `props.config.routes` missing (no mapper configured) → return
      //    `NextResponse.json({ revalidated: [], errors: [] }, { status: 200 })`
      //    → a project with no route mapper still gets a working, harmless
      //    endpoint instead of a 500.
      // 7. Resolve targets across the whole batch: for each `change` of
      //    `body.changes`, call `resolveTargets({ mapper:
      //    props.config.routes.map, collection: body.collection,
      //    operation: action, before: change.before, after: change.after })`.
      //    A throwing mapper is already contained INSIDE `resolveTargets` —
      //    its failure lands in that call's `errors`, never propagates here.
      //    Pool every call's `paths` into one array in `body.changes` order,
      //    then dedupe the pool while preserving first-seen order (a
      //    `Set<string>` built by inserting pool entries in order, then
      //    spread) — matching `resolveTargets`' own dedupe contract, but now
      //    across every change in the batch rather than one document's
      //    before/after. Concatenate every call's `errors` onto one
      //    `errors: unknown[]` array, in the same order.
      // 8. For each deduped path, call `revalidatePath(path)` inside its own
      //    try/catch — this call is a Next API invoked here, not covered by
      //    `resolveTargets`'s containment. Push each succeeded path onto a
      //    `revalidated: string[]` array; push each failure onto `errors`.
      // 9. Return `NextResponse.json({ revalidated, errors }, { status: 200 })`.
      // Edge cases:
      // - Authorization (steps 1–4) always runs before the batch-size guard
      //   (item 5) or any mapper/Convex work, so a denied caller never
      //   triggers a purge attempt and never learns whether its batch was
      //   too large.
      // - `body.operation` is mapped to `action` ONCE (item 4) and that
      //   single value drives BOTH the permission check and target
      //   resolution — never a duplicated verb, never re-derived.
      // - An empty `body.changes` array resolves zero targets and returns
      //   `{ revalidated: [], errors: [] }` — not an error.
      // - This handler never returns 5xx once past the 401/403/413 checks.
      throw new Error("Not implemented");
    },
  };
}
```

#### packages/next/src/cache/createVexRevalidateRoute.test.ts

New file. Real `defineAccess`/`defineCollection` fixtures — no placeholder
mocks standing in for access config. Mocks only `next/cache`'s
`revalidatePath`, and asserts its exact call arguments and order. Exercises
the `changes` batch shape directly: a single-change update including the
pre-rename path, a three-change bulk remove, the `VEX_REVALIDATE_BATCH_SIZE`
boundary (`413` past it), and an empty batch — alongside the existing
401/403/throwing-mapper cases.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { defineAccess, defineCollection, text, VEX_REVALIDATE_BATCH_SIZE } from "@vexcms/core";
import type { VexConfig, VexRevalidateChange, VexRouteMapper } from "@vexcms/core";

import { createVexRevalidateRoute } from "./createVexRevalidateRoute";
import type { VexRevalidateResponse } from "./types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const pages = defineCollection({
  slug: "pages",
  fields: { title: text({ required: true }), slug: text() },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const access = defineAccess({
  roles: ["editor", "viewer"] as const,
  resources: [pages],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: {
      pages: { create: true, read: true, update: true, delete: true },
    },
    viewer: {
      pages: { read: true },
    },
  },
});

const editorUser = { _id: "u1", roles: "editor" };
const viewerUser = { _id: "u2", roles: "viewer" };

/** Maps a doc's `slug` field to `/pages/<slug>` — a stand-in for a real project's route mapper. */
const mapper: VexRouteMapper = ({ collection, doc }) => [`/${collection}/${doc.slug as string}`];

function makeConfig(overrides: Partial<VexConfig> = {}): VexConfig {
  return { access, revalidate: { mapper }, ...overrides } as VexConfig;
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/vex/revalidate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear();
});

describe("createVexRevalidateRoute", () => {
  it("returns 401 when there is no session token", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => null,
      getAuth: async () => ({ user: null }),
    });

    const response = await route.POST(
      postRequest({ collection: "pages", operation: "update", changes: [] }),
    );

    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns 403 when the session lacks write permission on the collection", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => "token",
      getAuth: async () => ({ user: viewerUser }),
    });

    const response = await route.POST(
      postRequest({
        collection: "pages",
        operation: "update",
        changes: [{ after: { _id: "d1", _creationTime: 1, slug: "home" } }],
      }),
    );

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("revalidates every resolved target exactly once, including the pre-rename path", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => "token",
      getAuth: async () => ({ user: editorUser }),
    });
    const before = { _id: "d1", _creationTime: 1, slug: "old-slug" };
    const after = { _id: "d1", _creationTime: 1, slug: "new-slug" };

    const response = await route.POST(
      postRequest({ collection: "pages", operation: "update", changes: [{ before, after }] }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/pages/old-slug");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/pages/new-slug");
    expect(body).toEqual({ revalidated: ["/pages/old-slug", "/pages/new-slug"], errors: [] });
  });

  it("revalidates a bulk remove's three changes as three distinct paths", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => "token",
      getAuth: async () => ({ user: editorUser }),
    });
    const changes: VexRevalidateChange[] = [
      { before: { _id: "d1", _creationTime: 1, slug: "one" } },
      { before: { _id: "d2", _creationTime: 2, slug: "two" } },
      { before: { _id: "d3", _creationTime: 3, slug: "three" } },
    ];

    const response = await route.POST(
      postRequest({ collection: "pages", operation: "remove", changes }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(3);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/pages/one");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/pages/two");
    expect(revalidatePath).toHaveBeenNthCalledWith(3, "/pages/three");
    expect(body).toEqual({ revalidated: ["/pages/one", "/pages/two", "/pages/three"], errors: [] });
  });

  it("rejects a batch larger than VEX_REVALIDATE_BATCH_SIZE with 413", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => "token",
      getAuth: async () => ({ user: editorUser }),
    });
    const changes: VexRevalidateChange[] = Array.from(
      { length: VEX_REVALIDATE_BATCH_SIZE + 1 },
      (_, i) => ({ before: { _id: `d${i}`, _creationTime: i, slug: `page-${i}` } }),
    );

    const response = await route.POST(
      postRequest({ collection: "pages", operation: "remove", changes }),
    );

    expect(response.status).toBe(413);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns an empty revalidated list for an empty changes array", async () => {
    const route = createVexRevalidateRoute({
      config: makeConfig(),
      getToken: async () => "token",
      getAuth: async () => ({ user: editorUser }),
    });

    const response = await route.POST(
      postRequest({ collection: "pages", operation: "update", changes: [] }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(body).toEqual({ revalidated: [], errors: [] });
  });

  it("returns 200 with failures listed when the mapper throws", async () => {
    const throwingMapper: VexRouteMapper = () => {
      throw new Error("boom");
    };
    const route = createVexRevalidateRoute({
      config: makeConfig({ revalidate: { mapper: throwingMapper } }),
      getToken: async () => "token",
      getAuth: async () => ({ user: editorUser }),
    });

    const response = await route.POST(
      postRequest({
        collection: "pages",
        operation: "remove",
        changes: [{ before: { _id: "d1", _creationTime: 1, slug: "gone" } }],
      }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(body.revalidated).toEqual([]);
    expect(body.errors).toHaveLength(1);
  });
});
```

#### packages/next/src/cache/types.ts

Existing file (created in Step 2, which adds `VexServerClientOptions` and
`VexServerClient`). 1 edit: append the request/response types after Step 2's
`VexServerClient` interface — the last export in the file. `VexRevalidateChange`
— the before/after pair for one document — is declared in `@vexcms/core`
(Step 3), not here: `useVexMutation` and `useVexRevalidate` (`@vexcms/react`)
need it too, and react cannot depend on `@vexcms/next`, so this file imports
it rather than redeclaring it.

```ts
import type {
  CollectionSlug,
  VexMutationOperation,
  VexRevalidateChange,
} from "@vexcms/core";

/**
 * A document-scoped purge, sent by `useVexMutation` after a successful admin
 * panel write and by `useVexRevalidate` for the open document. `changes`
 * carries one entry per affected document — a single-document write sends
 * one, a list-view bulk delete sends one per selected row — because
 * `resolveTargets` (`@vexcms/core`) resolves paths per document, and the
 * route pools every entry's result into one deduped list.
 */
export interface VexRevalidateDocumentsRequest {
  /** The collection the write occurred on — also the `hasPermission` resource. */
  collection: CollectionSlug;
  /** The write operation — mapped once to the `hasPermission`/`resolveTargets` action. */
  operation: VexMutationOperation;
  /**
   * One entry per affected document. Capped at `VEX_REVALIDATE_BATCH_SIZE`
   * (`@vexcms/core`) — a larger batch is rejected with `413` before any
   * mapper work runs, so a "select all" bulk delete cannot force an
   * unbounded loop over `resolveTargets`.
   */
  changes: VexRevalidateChange[];
}

/**
 * A collection-wide purge, sent by `useVexRevalidate` from the list view.
 *
 * The route resolves paths by reading `publishedSlugs` for the collection and
 * running the route mapper over each document, so it needs no document payload
 * from the client — which also means a client cannot ask for paths it has not
 * been authorized to see.
 */
export interface VexRevalidateCollectionRequest {
  /** The collection to purge — also the `hasPermission` resource. */
  collection: CollectionSlug;
  /** Discriminant selecting the collection-wide branch. */
  all: true;
}

/**
 * Request body accepted by the route created by `createVexRevalidateRoute`.
 */
export type VexRevalidateRequest =
  | VexRevalidateCollectionRequest
  | VexRevalidateDocumentsRequest;

/**
 * Response body returned by the route created by `createVexRevalidateRoute`.
 * Always HTTP 200 once the caller is authorized — `errors` never triggers a
 * non-200 status.
 */
export interface VexRevalidateResponse {
  /** Paths that were successfully purged via `revalidatePath`. */
  revalidated: string[];
  /**
   * Errors from a throwing route mapper (surfaced via `resolveTargets`) or a
   * failed individual `revalidatePath` call.
   */
  errors: unknown[];
}
```

#### packages/next/src/cache/index.ts

Existing file (created in Step 2). 1 edit — this is the barrel `package.json`'s
`"./cache"` entry resolves to (`"source": "./src/cache/index.ts"`), so a
consumer writing `import { createVexRevalidateRoute } from "@vexcms/next/cache"`
resolves against THIS file, not the root barrel. Re-exporting from
`src/index.ts` alone would leave every such import unresolved.

`VexRevalidateChange` is deliberately absent: it is declared in `@vexcms/core`
(Step 3) and only *imported* here, so re-exporting it from `./types` would not
resolve. Consumers take it from `@vexcms/core`, which is also where
`@vexcms/react` gets it — one declaration, one source (P-010).

**1 — append below Step 2's `createVexServerClient` re-export.**

```ts
export { createVexRevalidateRoute } from "./createVexRevalidateRoute";
export type { CreateVexRevalidateRouteProps } from "./createVexRevalidateRoute";
export type {
  VexRevalidateCollectionRequest,
  VexRevalidateDocumentsRequest,
  VexRevalidateRequest,
  VexRevalidateResponse,
} from "./types";
```

#### packages/next/src/index.ts

Existing file. 1 edit: re-export the factory and its request/response types
alongside the existing `export * from "./NextAdminPage"` line — this barrel
already re-exports the server/client component surface, and
`createVexRevalidateRoute` carries no React import, so it is safe here (see
the file's own top-of-file note on why `NextAdminPage`'s React surface lives
behind the `/server` subpath instead).

**1 — beside `export * from "./NextAdminPage"`.**

```ts
export { createVexRevalidateRoute } from "./cache/createVexRevalidateRoute";
export type { CreateVexRevalidateRouteProps } from "./cache/createVexRevalidateRoute";
export type {
  VexRevalidateCollectionRequest,
  VexRevalidateDocumentsRequest,
  VexRevalidateRequest,
  VexRevalidateResponse,
} from "./cache/types";
```

Verify: `pnpm --filter @vexcms/next test` — an unauthenticated POST is 401, a
session without write permission on that collection is 403, a single-change
payload calls `revalidatePath` for every resolved target including the
pre-rename path, a three-change bulk remove calls it once per change, a
`changes` batch over `VEX_REVALIDATE_BATCH_SIZE` is rejected with 413 before
any mapper runs, an empty `changes` array returns `{ revalidated: [], errors:
[] }`, and a mapper that throws returns 200 with the failures reported
rather than 500.

The `{ collection, all: true }` branch reads `publishedSlugs` for the collection
and runs the mapper over every returned document. It composes Step 2's
`createVexServerClient` rather than taking a new injected client prop — the
factory already receives `config`, and the cached client needs nothing else.
Its test asserts one `revalidatePath` call per published slug, and that an
unreachable Convex returns 200 with the failure reported rather than 500.

### Step 5 — `useVexMutation` and migration of the admin write sites [dev]

- [ ] `packages/react/src/hooks/useVexMutation.ts`
- [ ] `packages/react/src/hooks/useVexMutation.test.tsx`
- [ ] `packages/react/src/hooks/index.ts` — export
- [ ] `packages/react/src/context/VexRevalidateContext.tsx` — endpoint override, disable switch
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — migrate (`useMutation` beside `mutationFn: useConvexMutation(vexConvexApi.update)`)
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — migrate (`removeMutation`)
- [ ] `packages/react/src/components/views/GlobalEditView.tsx` — migrate (`useMutation` feeding `useGlobalForm`)
- [ ] `packages/react/src/components/views/MediaCollectionEditView.tsx` — migrate (`useMutation` beside `mutationFn: useConvexMutation(vexConvexApi.update)`)
- [ ] `packages/react/src/components/views/MediaCollectionListView.tsx` — migrate (`deleteMediaMutation`)
- [ ] `packages/react/src/components/modals/CreateDocumentModal.tsx` — migrate (`useMutation` feeding `useCollectionForm`)
- [ ] `packages/react/src/components/media/MediaUploadDropzone.tsx` — migrate the `createMediaDocument` call only; `generateUploadUrl` is not a document write and stays on plain `useMutation`

The seven call sites live under `packages/react/src/components/views/` and
`packages/react/src/components/modals/` / `components/media/` — spec-tasks.md's
`packages/react/src/views/...` paths do not exist; the checklist above uses the
real paths.

#### packages/react/src/hooks/useVexMutation.ts

New file. A drop-in replacement for `useMutation({ mutationFn: useConvexMutation(fn) })`
that adds exactly one thing: a fire-and-forget cache purge after a successful write.

```ts
"use client";

import type { FunctionReference } from "convex/server";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  VEX_REVALIDATE_BATCH_SIZE,
  type VexMutationOperation,
  type VexRevalidateChange,
} from "@vexcms/core";
import { useVexRoutesConfig } from "../context/VexRevalidateContext";

/**
 * Props for `useVexMutation`.
 *
 * @typeParam TArgs - The Convex mutation's argument type.
 * @typeParam TResult - The Convex mutation's return type.
 */
export interface UseVexMutationProps<TArgs, TResult> {
  /** The Convex mutation function reference to call, e.g. `vexConvexApi.update`. */
  mutationFn: FunctionReference<"mutation", "public", TArgs, TResult>;
  /** Collection or global slug the mutation writes to — echoed to the revalidation endpoint. */
  collection: string;
  /** Which write this is — echoed to the revalidation endpoint alongside `collection`. */
  operation: VexMutationOperation;
  /**
   * Derives the before/after document snapshots to purge from the
   * mutation's variables and its settled result, once the Convex mutation
   * resolves — one entry per affected document, so a bulk delete returns
   * one change per row. Omitted → `changes: []`, which the route treats as
   * nothing to purge, not an error.
   */
  getChanges?: (props: { args: TArgs; result: TResult }) => VexRevalidateChange[];
}

/**
 * Wraps a Convex mutation with a fire-and-forget cache purge.
 *
 * On success, POSTs `{ collection, operation, changes }` to the revalidation
 * endpoint (`createVexRevalidateRoute` from `@vexcms/next`) — chunked into
 * requests of at most `VEX_REVALIDATE_BATCH_SIZE` changes each, issued
 * sequentially, so a "select all" bulk delete never sends one oversized
 * body — so the next request for an affected public page gets fresh content
 * instead of a stale prerendered one. The purge NEVER fails, delays, or
 * rejects the caller's mutation — a failed purge is a stale page, a failed
 * save is lost work — so the promise `mutateAsync` returns settles on the
 * Convex mutation alone.
 *
 * With no `VexRevalidateProvider` in scope, or one that leaves a field
 * unset, it POSTs to `DEFAULT_VEX_REVALIDATE_ENDPOINT` — a relative path,
 * since the admin panel is same-origin with the public site and the request
 * rides the admin's own session cookie. Both the endpoint and a full
 * disable switch (for an admin panel hosted separately, or a non-Next
 * consumer with no revalidation route to call) are configurable via
 * `VexRevalidateProvider`.
 *
 * @param props - See `UseVexMutationProps`.
 * @returns The same `UseMutationResult` `useMutation` would return —
 *   `mutate`, `mutateAsync`, `isPending`, etc. — unchanged, so every existing
 *   `useMutation({ mutationFn: useConvexMutation(fn) })` call site swaps in
 *   this hook without touching how its result is consumed.
 * @throws Never throws itself; a failed Convex mutation still rejects
 *   `mutateAsync` exactly as an unwrapped `useMutation` would.
 */
export function useVexMutation<TArgs, TResult>(
  props: UseVexMutationProps<TArgs, TResult>,
): UseMutationResult<TResult, Error, TArgs> {
  const revalidateConfig = useVexRoutesConfig();
  const convexMutationFn = useConvexMutation(props.mutationFn);

  // TODO: implement
  // 1. Return `useMutation({ mutationFn: convexMutationFn, onSuccess })`
  //    where `onSuccess` is a SYNCHRONOUS function of `(result, args)`:
  //    a. → If `revalidateConfig.disabled`, return immediately — no fetch.
  //    b. → Otherwise compute `changes = props.getChanges?.({ args, result }) ?? []`.
  //    c. → Split `changes` into consecutive chunks of at most
  //       `VEX_REVALIDATE_BATCH_SIZE` entries each — an empty `changes`
  //       array still produces ONE chunk (`[[]]`), so a write purges exactly
  //       once even when there is nothing to purge.
  //    d. → Fire an async IIFE that iterates the chunks in order, `await`ing
  //       each `fetch(revalidateConfig.endpoint, { method: "POST", headers:
  //       { "Content-Type": "application/json" }, body: JSON.stringify({
  //       collection: props.collection, operation: props.operation, changes:
  //       chunk }) })` inside its own try/catch before starting the next —
  //       sequential, never `Promise.all`, so a "select all" bulk delete
  //       cannot fire dozens of concurrent requests, and one failed chunk
  //       does not stop the chunks after it.
  //    e. → Do NOT `await` or `return` that IIFE's promise from `onSuccess`
  //       — it must stay synchronous so TanStack Query never waits on the
  //       purge before resolving `mutateAsync`.
  //
  // Edge cases:
  // - `getChanges` omitted → `changes: []`, sent as the single chunk
  //   `[[]]`; the route treats an empty `changes` array as nothing to
  //   purge, not an error.
  // - `revalidateConfig.disabled` → skip every fetch, not just the body —
  //   no network request should be observable.
  // - A batch larger than `VEX_REVALIDATE_BATCH_SIZE` (e.g. a "select all"
  //   bulk delete) is chunked and posted as multiple sequential requests,
  //   never one oversized body.
  // - The Convex mutation itself rejecting must reach the caller exactly as
  //   an unwrapped `useMutation` would — `onSuccess` never runs, so no purge
  //   is attempted.
  throw new Error("Not implemented");
}
```

#### packages/react/src/hooks/useVexMutation.test.tsx

New file. `@convex-dev/react-query`'s `useConvexMutation` is mocked at the
module boundary so the test drives a controllable mutation function instead
of a real Convex network call; `fetch` is stubbed the same way. Named `.tsx`
rather than spec-tasks.md's `.ts` because the `QueryClientProvider` wrapper
needs JSX, matching every other hook test in this directory that wraps a
provider (`usePermission.test.tsx`). The chunk-boundary test asserts a
`changes` array larger than `VEX_REVALIDATE_BATCH_SIZE` posts as two
sequential requests split at the boundary — sequential chunks land one
microtask apart, so it polls with `waitFor` rather than asserting
immediately after `mutateAsync` resolves.

```tsx
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VEX_REVALIDATE_BATCH_SIZE, vexConvexApi } from "@vexcms/core";
import type { VexRevalidateChange } from "@vexcms/core";
import { useVexMutation } from "./useVexMutation";
import { DEFAULT_VEX_REVALIDATE_ENDPOINT } from "../context/VexRevalidateContext";

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", () => ({
  useConvexMutation: () => convexMutationMock,
}));

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const beforeDoc = { _id: "doc1", _creationTime: 1, title: "Old" };

/** Renders `useVexMutation` configured the way `CollectionEditView` configures it. */
function renderUpdateMutation() {
  return renderHook(
    () =>
      useVexMutation({
        mutationFn: vexConvexApi.update,
        collection: "posts",
        operation: "update",
        getChanges: ({ args }) => [{ before: beforeDoc, after: { ...beforeDoc, ...args.data } }],
      }),
    { wrapper: Wrapper },
  );
}

describe("useVexMutation", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    convexMutationMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("issues exactly one POST with the collection, operation, and changes on success", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { result } = renderUpdateMutation();

    await act(async () => {
      await result.current.mutateAsync({ collection: "posts", id: "doc1", data: { title: "New" } });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(DEFAULT_VEX_REVALIDATE_ENDPOINT);
    expect(init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(init.body as string)).toEqual({
      collection: "posts",
      operation: "update",
      changes: [{ before: beforeDoc, after: { ...beforeDoc, title: "New" } }],
    });
  });

  it("chunks a changes array larger than VEX_REVALIDATE_BATCH_SIZE into sequential POSTs", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const changes: VexRevalidateChange[] = Array.from(
      { length: VEX_REVALIDATE_BATCH_SIZE + 50 },
      (_, i) => ({ before: { _id: `doc${i}`, _creationTime: i, slug: `post-${i}` } }),
    );
    const { result } = renderHook(
      () =>
        useVexMutation({
          mutationFn: vexConvexApi.remove,
          collection: "posts",
          operation: "remove",
          getChanges: () => changes,
        }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        collection: "posts",
        ids: changes.map((change) => change.before!._id),
      });
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body as string);
    expect(firstBody).toEqual({
      collection: "posts",
      operation: "remove",
      changes: changes.slice(0, VEX_REVALIDATE_BATCH_SIZE),
    });
    expect(secondBody).toEqual({
      collection: "posts",
      operation: "remove",
      changes: changes.slice(VEX_REVALIDATE_BATCH_SIZE),
    });
  });

  it("issues no POST when the Convex mutation itself rejects", async () => {
    convexMutationMock.mockRejectedValueOnce(new Error("convex mutation failed"));
    const { result } = renderUpdateMutation();

    await act(async () => {
      await expect(
        result.current.mutateAsync({ collection: "posts", id: "doc1", data: {} }),
      ).rejects.toThrow("convex mutation failed");
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("resolves the mutation and surfaces no error when the purge request rejects", async () => {
    convexMutationMock.mockResolvedValueOnce(undefined);
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderUpdateMutation();

    let resolvedValue: unknown = "unset";
    await act(async () => {
      resolvedValue = await result.current.mutateAsync({ collection: "posts", id: "doc1", data: {} });
    });

    expect(resolvedValue).toBeUndefined();
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isError).toBe(false);
  });
});
```

#### packages/react/src/hooks/index.ts

1 edit — everything else unchanged.

**1 — barrel export.** Add beside the existing `export * from "./usePaginatedQuery";` line.

```ts
export * from "./useVexMutation";
```

#### packages/react/src/context/VexRevalidateContext.tsx

New file. It ships a dedicated `<VexRevalidateProvider>` wrapper component for
the app to mount with config values, so — like `VexAccessProvider` and
`StorageAdapterContextProvider` — it belongs in `context/` as a `*Context.tsx`
file rather than the `hooks/useXxx.ts` shape reserved for a context+hook pair
with no dedicated provider component (`useFrameworkComponents.ts`).

```tsx
"use client";

import { createContext, useContext } from "react";

/**
 * Default revalidation endpoint — a same-origin relative path, since the
 * admin panel and the public site it purges are always one deployment (see
 * `createVexRevalidateRoute` in `@vexcms/next`). No env var or shared secret
 * is needed because the request rides the admin's own session cookie.
 */
export const DEFAULT_VEX_REVALIDATE_ENDPOINT = "/api/vex/revalidate";

interface VexRevalidateContextValue {
  /** URL `useVexMutation` POSTs `{ collection, operation, changes }` to after a successful write. */
  endpoint: string;
  /** When `true`, `useVexMutation` skips the purge request entirely. */
  disabled: boolean;
}

const VexRevalidateContext = createContext<VexRevalidateContextValue>({
  endpoint: DEFAULT_VEX_REVALIDATE_ENDPOINT,
  disabled: false,
});

/**
 * Reads the revalidation endpoint and enabled/disabled switch that
 * `useVexMutation` purges through.
 *
 * @returns The endpoint URL and disabled switch for the current admin
 *   session — the same-origin default when rendered outside
 *   `VexRevalidateProvider`.
 */
export function useVexRoutesConfig(): VexRevalidateContextValue {
  return useContext(VexRevalidateContext);
}

/**
 * Overrides where `useVexMutation` purges to, or disables purging entirely.
 *
 * Only needed for the two cases the same-origin relative default doesn't
 * cover: an admin panel hosted on a different origin from the public site
 * (`endpoint` as an absolute URL), or a non-Next consumer with no
 * `createVexRevalidateRoute` to call (`disabled`).
 *
 * @param props - The subtree that should see the override, plus the
 *   optional `endpoint` and `disabled` values. Both fall back to the
 *   same-origin default when omitted.
 * @returns The context provider wrapping `props.children`.
 *
 * @example
 * ```tsx
 * <VexRevalidateProvider endpoint="https://www.example.com/api/vex/revalidate">
 *   <AdminLayout config={vexConfig}>{children}</AdminLayout>
 * </VexRevalidateProvider>
 * ```
 */
export function VexRevalidateProvider(props: {
  endpoint?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <VexRevalidateContext.Provider
      value={{
        endpoint: props.endpoint ?? DEFAULT_VEX_REVALIDATE_ENDPOINT,
        disabled: props.disabled ?? false,
      }}
    >
      {props.children}
    </VexRevalidateContext.Provider>
  );
}
```

#### packages/react/src/components/views/CollectionEditView.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop `useMutation` from the `@tanstack/react-query` import
(`useQuery` stays) and `useConvexMutation` from the `@convex-dev/react-query`
import (`convexQuery` stays); add `useVexMutation` to the `../../hooks`
import beside `usePermission`.

```ts
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { usePermission, useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call beside `const form = useCollectionForm(...)`.
`before` is `currentDocument` — the document the form was initialised from —
and `after` merges it with the submitted `data`, so a mapper keyed on a
renamed field (e.g. `slug`) purges both the stale and the new path.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.update,
    collection: props.collection.slug,
    operation: "update",
    getChanges: ({ args }) => [{ before: currentDocument, after: { ...currentDocument, ...args.data } }],
  });
```

#### packages/react/src/components/views/CollectionListView.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop the standalone `useConvexMutation` and `useMutation`
imports; add `useVexMutation` to the `../../hooks` import beside
`usePaginatedQuery, usePermission`.

```ts
import { usePaginatedQuery, usePermission, useVexMutation } from "../../hooks";
```

**2 — `removeMutation`.** Replace the `useMutation` call above `handleBulkDelete`.
`pagination.results` already holds the rows the bulk delete is removing, so
`getChanges` filters it by the ids the mutation was called with — one change
per selected row, `before` only.

```ts
  const removeMutation = useVexMutation({
    mutationFn: vexConvexApi.remove,
    collection: collection.slug,
    operation: "remove",
    getChanges: ({ args }) =>
      pagination.results.filter((doc) => args.ids.includes(doc._id)).map((before) => ({ before })),
  });
```

#### packages/react/src/components/views/GlobalEditView.tsx

2 edits — everything else unchanged.

**1 — imports.** Add a `type { VexDocument }` import from `@vexcms/core`
beside the existing `CRUD_ACTIONS, GlobalEditViewProps, vexConvexApi` import;
drop `useConvexMutation` from the `@convex-dev/react-query` import
(`convexQuery` stays) and `useMutation` from the `@tanstack/react-query`
import (`useQuery` stays); add `useVexMutation` to the `../../hooks` import
beside `useGlobalForm, usePermission`.

```ts
import type { VexDocument } from "@vexcms/core";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useGlobalForm, usePermission, useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call above `const form = useGlobalForm(...)`.
Globals have no per-document identity, so `getChanges` sends a single change
with `after` only — the submitted data cast to `VexDocument`, since a
global's mapper keys on `collection` (the global's slug) and may ignore
`doc` entirely — and no `before`.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.globals.upsert,
    collection: global.slug,
    operation: "upsert",
    getChanges: ({ args }) => [{ after: args.data as VexDocument }],
  });
```

#### packages/react/src/components/views/MediaCollectionEditView.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop `useMutation` from the `@tanstack/react-query` import
(`useQuery` stays) and `useConvexMutation` from the `@convex-dev/react-query`
import (`convexQuery` stays); add `useVexMutation` to the `../../hooks`
import beside `useCollectionForm, usePermission`.

```ts
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useCollectionForm, usePermission, useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call above `const form = useCollectionForm(...)`.
`before` is `currentDocument` — the document the form was initialised from —
and `after` merges it with the submitted `data`, matching
`CollectionEditView`'s edit.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.update,
    collection: props.collection.slug,
    operation: "update",
    getChanges: ({ args }) => [{ before: currentDocument, after: { ...currentDocument, ...args.data } }],
  });
```

#### packages/react/src/components/views/MediaCollectionListView.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop the standalone `useMutation` (`@tanstack/react-query`)
and `useConvexMutation` (`@convex-dev/react-query`) imports; add
`useVexMutation` to the `../../hooks` import beside `usePaginatedQuery, usePermission`.

```ts
import { usePaginatedQuery, usePermission, useVexMutation } from "../../hooks";
```

**2 — `deleteMediaMutation`.** Replace the `useMutation` call above `handleBulkDelete`.
Same `pagination.results` filter as `CollectionListView`'s edit — one change
per selected row, `before` only.

```ts
  const deleteMediaMutation = useVexMutation({
    mutationFn: vexConvexApi.remove,
    collection: props.collection.slug,
    operation: "remove",
    getChanges: ({ args }) =>
      pagination.results.filter((doc) => args.ids.includes(doc._id)).map((before) => ({ before })),
  });
```

#### packages/react/src/components/modals/CreateDocumentModal.tsx

2 edits — everything else unchanged.

**1 — imports.** Add a `type { VexDocument }` import from `@vexcms/core`
beside the existing `CollectionConfig, CollectionSlug` import; drop the
`useMutation` (`@tanstack/react-query`) and `useConvexMutation`
(`@convex-dev/react-query`) imports; add a `useVexMutation` import beside
the existing `useCollectionForm` import.

```ts
import type { VexDocument } from "@vexcms/core";
import { useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call above `const form = useCollectionForm(...)`.
The created document's id is only known from the mutation's result, so
`after` merges the submitted `data` with the returned id; there is no
`before` for a create.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.create,
    collection: collection.slug,
    operation: "create",
    getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } as VexDocument }],
  });
```

#### packages/react/src/components/media/MediaUploadDropzone.tsx

1 edit — everything else unchanged. `generateUploadUrl` is not a document
write (it only mints a presigned upload URL) and stays on plain `useMutation`;
only `createMediaDocument` migrates.

**1 — the mutation.** Add a `type { VexDocument }` import from `@vexcms/core`
beside the existing `StorageAdapterSlug, vexConvexApi` import, and a
`useVexMutation` import beside the existing `useStorageAdapterMap` import;
replace the `useMutation` call bound to `createMediaDocument`.

```ts
import type { VexDocument } from "@vexcms/core";
import { useVexMutation } from "../../hooks";
```

```ts
  const { mutateAsync: createMediaDocument } = useVexMutation({
    mutationFn: vexConvexApi.media.createMediaDocument,
    collection: props.targetCollection,
    operation: "create",
    getChanges: ({ args, result }) => [{ after: { ...args, _id: result } as VexDocument }],
  });
```

Verify: `pnpm --filter @vexcms/react test` — a successful mutation issues
exactly one POST with the right collection, operation and `changes`; a
batch larger than `VEX_REVALIDATE_BATCH_SIZE` is chunked into sequential
POSTs at that boundary; a failed mutation issues none; a rejected purge
leaves the mutation resolved and surfaces no error to the caller.

### Step 6 — Provider restructure: cookie read below the public boundary [dev]

[dev]

Why: The single change that makes prerendering possible. A `cookies()` read in
the root layout forces every route dynamic — proven with a probe page containing
no data fetching at all, which still built as `ƒ`. The cookie read is
`await getToken()` in `providers/auth.tsx`, reached from the root layout via
`app/layout.tsx` → `ServerProviders` (`providers/server.tsx`) → `AuthServerProvider`.
Sequenced after the package work (Step 2) so the apps have `createVexServerClient`
available when this step's cached reads need it, and before Step 7 rewrites the
public page reads.

Risk is low: `useAuth` (`context/AuthContext.tsx`) has zero call sites in
`apps/www` today, zero in either template's app dir, and its one real caller in
`apps/test` (`(frontend)/PageContent.tsx`) only feeds a `console.log`, which this
step deletes outright. `AuthContext`'s default value is `{ user: null }` — an
object, never `null` — so `useAuth()`'s `context === null` guard never trips and
an unwrapped read degrades to "signed out" instead of throwing. `AdminDemoButton`
and `LogoutButton` already read `useSession()` from the Better Auth client, not
this context, so neither is affected. The admin panel keeps its own,
unrelated, cookie read (`getCurrentUser()` in `admin/layout.tsx`, backed by
`auth/serverUtils.ts`) — admin routes are meant to stay dynamic, and this step
does not touch that path.

The auth routes (`app/(frontend)/auth/[pathname]/page.tsx` and its
`@auth`/`(...)auth` interception route) already carry their own
`export const dynamic = "force-dynamic"` and never call `useAuth`, so they are
unaffected by removing `AuthServerProvider` from the root — they were dynamic
for their own reasons before this step and stay dynamic for the same reasons
after it.

Two files outside spec-tasks.md's list for this step turned out to require the
edit instead of the files it named — see the summary for both corrections.

- [ ] `apps/www/src/app/layout.tsx` — drop `ThemeStyle` from root
- [ ] `apps/www/src/components/providers/server.tsx` — drop `AuthServerProvider` (this is the file that actually mounted it; `app/layout.tsx` renders `ServerProviders` opaquely and never imported `AuthServerProvider` directly)
- [ ] `apps/www/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider` here
- [ ] `apps/www/src/lib/vex.ts` — shared `createVexServerClient` instance every server read in this app imports, so cross-file reads actually dedupe
- [ ] `apps/www/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` and chrome reads
- [ ] `apps/www/src/components/ThemeStyle.tsx` — read through the cached client
- [ ] `apps/test/src/components/providers/server.tsx` — drop `AuthServerProvider` (same correction as the `apps/www` file above; `apps/test/src/app/layout.tsx` needs no edit of its own — see summary)
- [ ] `apps/test/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider`
- [ ] `apps/test/src/app/(frontend)/PageContent.tsx` — drop the `console.log` permission probe
- [ ] `apps/test/src/app/(frontend)/page.tsx` — remove `force-dynamic`
- [ ] `apps/test/src/app/(frontend)/[slug]/page.tsx` — remove `force-dynamic`

#### apps/www/src/app/layout.tsx

2 edits; everything else (fonts, metadata, `<html>`/`<body>` structure,
`ServerProviders`/`ClientProviders`/`ThemeLive` nesting) is unchanged.
`ThemeScript` stays — it only toggles a class from `localStorage`, no cookie or
Convex read. `ServerProviders` and `ClientProviders` stay mounted at root:
`ThemeProvider` (inside `ServerProviders`) is a plain context with no I/O, and
`NuqsAdapter`/`ConvexClientProvider`/`BetterAuthClientProvider` are client
boundaries that don't affect server prerendering either way. Only `ThemeStyle`
leaves — its render moves to `(frontend)/(site)/layout.tsx` below, the only
route group that needs first-paint site theming; admin keeps its own
`<ThemeStyle scope="admin" />`.

**1 — imports.** Drop the `ThemeStyle` import.

```tsx
import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"
```

**2 — `<head>`.** Remove the `<ThemeStyle />` element and its comment; `<ThemeScript />` and the surrounding `<head>` are otherwise unchanged.

```tsx
      <head>
        {/* Applies the persisted light/dark class before first paint (no
            flash). Site theming now renders in `(frontend)/(site)/layout.tsx`
            — the admin layout re-emits its own scope for `/admin`. */}
        <ThemeScript />
      </head>
```

#### apps/www/src/components/providers/server.tsx

3 edits; the `ConvexClientProvider` composition comment (the second half of the
docblock) is unchanged.

**1 — imports.** Drop the `AuthServerProvider` import; nothing replaces it.

```tsx
import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";
```

**2 — docblock.** Record why `AuthServerProvider` left and where it went.

```tsx
/**
 * Server-side provider shell: theme context + the nuqs URL-state adapter.
 *
 * `AuthServerProvider` used to wrap `NuqsAdapter` here, putting a `getToken()`
 * cookie read on every route's render path — the reason no route in the app
 * could prerender (a probe page with zero data fetching still built as `ƒ`).
 * It now mounts directly in `app/(vexcms)/admin/layout.tsx`, the only route
 * group that needs it. `/auth/sign-in` stays dynamic for its own reasons
 * (`export const dynamic = "force-dynamic"`) and never read `useAuth`.
 *
 * Deliberately does **not** mount `ConvexClientProvider` — `ClientProviders`
 * renders it, and `ClientProviders` is nested inside this component, so its
 * copy is the one that actually reaches `children`. Mounting it here as well
 * built a second `ConvexReactClient` + `QueryClient` pair on every server
 * render (`providers/convex.tsx` intentionally creates fresh clients per call
 * server-side to avoid cross-request leaks) whose only consumer was the
 * discarded outer subtree.
 */
```

**3 — `ServerProviders` body.** Drop the `AuthServerProvider` wrap.

```tsx
export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
```

#### apps/www/src/app/(vexcms)/admin/layout.tsx

2 edits; `getCurrentUser()`, `ThemeStyle`/`ThemeLive` scope="admin", and
`NextAdminLayout` are unchanged — this only adds the `AuthContext` boundary
around the existing tree.

**1 — imports.** Add `AuthServerProvider` beside the other local imports.

```tsx
import { AuthServerProvider } from "~/components/providers/auth";
import { getCurrentUser } from "~/auth/serverUtils";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";
```

**2 — `AdminLayout` body.** Wrap the existing tree in `AuthServerProvider`.

```tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout config={config} user={user ?? undefined}>
          {children}
        </NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

#### apps/www/src/lib/vex.ts

New file. `createVexServerClient` builds a fresh `React.cache` on every call
(Step 2), so a client instantiated per route or component gets its own cache
and never dedupes against any other file's read — even an identical
`(query, args)` pair, like `generateMetadata` (Step 7) and its page both
reading the same `pages.getBySlug` slug. A single module-scope instance,
imported everywhere this app reads Convex server-side, is what makes that
dedupe actually cross-module instead of per-file.

```ts
import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

/**
 * The single shared Convex read client for every server component and route
 * in this app.
 *
 * `createVexServerClient` (`@vexcms/next/cache`) wraps its `query` method in
 * a `React.cache` created fresh on every call — so two files that each call
 * `createVexServerClient()` themselves get two independent caches and never
 * share a round trip, no matter how identical their reads are. Importing
 * this one instance everywhere is what lets `generatePageMetadata`
 * (`~/lib/metadata`) and the page calling it collapse their identical
 * `pages.getBySlug` read into a single Convex call within one request,
 * instead of two.
 */
export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })
```

#### apps/www/src/components/ThemeStyle.tsx

1 edit — import the shared `vex` client (`~/lib/vex`, this step) instead of
instantiating a local one; `createVexServerClient()` builds a fresh
`React.cache` on every call, so a client scoped to just this file could never
join any other file's dedupe. Everything else (the `props`/scope contract,
the `buildThemeCss` call, the `<style>` element, the docblock) is unchanged;
only the docblock's closing sentence about build-time unreachability still
applies unmodified since `createVexServerClient`'s `.query()` rejects the
same way `fetchQuery` did when Convex is unreachable.

**1 — imports and query.** Replace `fetchQuery` with the shared client.

```tsx
import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"

import { vex } from "~/lib/vex"
```

Body of `ThemeStyle` — only the `fetchQuery` line changes, from
`theme = await fetchQuery(...)` to:

```tsx
    theme = await vex.query(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
```

#### apps/www/src/app/(frontend)/(site)/layout.tsx

2 edits. The skip-link, `<SiteHeader>`/`<SiteFooter>` props, and the
`try`/`catch` fallback shape are unchanged.

**1 — imports.** Replace `fetchQuery` with the shared `vex` client
(`~/lib/vex`, this step) instead of instantiating a local one — `ThemeStyle`
renders in the same tree and reads Convex too, and only a single shared
instance lets any of this app's reads dedupe against each other. Also render
`ThemeStyle` here — first-paint site theming moved from the root layout
(above) to this one, the only group that needs it. `ThemeLive` is
unaffected: it already renders once at the root inside a client boundary and
needs no duplicate here.

```tsx
import type { ReactNode } from "react"

import { api } from "@convex/_generated/api"

import type { FootersDocument, HeadersDocument } from "~/vex.types"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"
import { vex } from "~/lib/vex"
```

**2 — chrome reads and render.** Swap the two `fetchQuery` calls for
`vex.query`, and render `<ThemeStyle />` above the skip link.

```tsx
  try {
    ;[headerData, footerData] = await Promise.all([
      vex.query(api.headers.getFirst),
      vex.query(api.footers.getFirst),
    ])
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return (
    <>
      <ThemeStyle />
      {/* Sits above the sticky header so it is the first tab stop on every
```

#### apps/test/src/components/providers/server.tsx

Same 3 edits as `apps/www/src/components/providers/server.tsx` above — the two
files are byte-identical today and diverge identically here. `apps/test/src/app/layout.tsx`
needs no edit of its own: it renders `ServerProviders` opaquely, exactly like
`apps/www`, so this file is where the cookie read actually leaves. Unlike
`apps/www`, `apps/test`'s root layout keeps its own `<ThemeStyle />` in
`<head>` (there is no `(frontend)/(site)/layout.tsx` in `apps/test` to move it
to — `apps/test`'s public pages render directly under `(frontend)/`); `apps/test`
is never built as part of this step's verification gate (see Verify), so its
`ThemeStyle.tsx` keeps its existing uncached `fetchQuery` call and its root
route table is not asserted to flip to `○`/`●` here.

**1 — imports.** Drop the `AuthServerProvider` import.

```tsx
import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";
```

**2 — docblock.**

```tsx
/**
 * Server-side provider shell: theme context + the nuqs URL-state adapter.
 *
 * `AuthServerProvider` used to wrap `NuqsAdapter` here, putting a `getToken()`
 * cookie read on every route's render path. It now mounts directly in
 * `app/(vexcms)/admin/layout.tsx`, the only route group that needs it.
 *
 * Deliberately does **not** mount `ConvexClientProvider` — `ClientProviders`
 * renders it, and `ClientProviders` is nested inside this component, so its
 * copy is the one that actually reaches `children`. Mounting it here as well
 * built a second `ConvexReactClient` + `QueryClient` pair on every server
 * render (`providers/convex.tsx` intentionally creates fresh clients per call
 * server-side to avoid cross-request leaks) whose only consumer was the
 * discarded outer subtree.
 */
```

**3 — `ServerProviders` body.**

```tsx
export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
```

#### apps/test/src/app/(vexcms)/admin/layout.tsx

Same 2 edits as `apps/www/src/app/(vexcms)/admin/layout.tsx` above.

**1 — imports.**

```tsx
import { AuthServerProvider } from "~/components/providers/auth";
import { getCurrentUser } from "~/auth/serverUtils";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";
```

**2 — `AdminLayout` body.**

```tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout config={config} user={user ?? undefined}>
          {children}
        </NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

#### apps/test/src/app/(frontend)/PageContent.tsx

1 edit — drop the permission probe. Everything below (the block renderer
dispatch table and every `*BlockRenderer`) is unchanged.

**1 — imports and `PageContent` body.** Drop the `hasPermission` import and
the two probe lines; the admin link, hero, and blocks sections are unchanged.

```tsx
"use client";
import { RenderBlocks, type BlockComponents } from "@vexcms/react";
import Link from "next/link";

import type { Page, PageBlock } from "~/vex.types.ts";
```

```tsx
export default function PageContent({ page }: PageContentProps) {
  return (
```

#### apps/test/src/app/(frontend)/page.tsx

1 edit — drop the now-unnecessary override; the route still calls `fetchQuery`
directly (out of scope for this step — `apps/test` isn't part of Step 7's
cached-read migration), so it stays dynamic on its own, but no longer via a
hardcoded flag that would mask a future fix.

**1 — segment config.** Remove the `export const dynamic` line.

```tsx
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"

import PageContent from "./PageContent"

export async function generateMetadata(): Promise<Metadata> {
```

#### apps/test/src/app/(frontend)/[slug]/page.tsx

1 edit, same reasoning as `page.tsx` above.

**1 — segment config.** Remove the `export const dynamic` line.

```tsx
import type { Metadata } from "next";

import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

import PageContent from "../PageContent";

/**
 * Generates Open Graph and `<title>` metadata for a public page.
```

Verify:

```bash
node scripts/verify-seo-routes.mjs --app apps/www --build --routes --static /_not-found,/unauthorized
```

Asserts from `.next/prerender-manifest.json` that the routes this step can flip
are prerendered — read from the manifest rather than by parsing the
human-readable route table, so the gate does not depend on stdout formatting.
Before this step the manifest lists only `/_global-error` and `/robots.txt`.

`/` and `/[slug]` are deliberately NOT asserted here. Removing the cookie read
is necessary but not sufficient for them: both still call `fetchQuery`, whose
hard-coded `no-store` keeps them dynamic on its own until Step 7 migrates them
to the shared cached client. Step 7's gate asserts them. Listing them here
would be a criterion this step cannot satisfy (AP-012). `/_not-found` and
`/unauthorized` read no Convex data at all, so the cookie read was the only
thing keeping them dynamic — which is exactly what makes them the correct
witnesses for this step.

`/admin` and the auth routes must stay dynamic and are deliberately absent from
`--static`; they read cookies and must never be cached.

### Step 7 — Wire `apps/www` end to end, plus the manual purge control [dev]

Why: First point where the feature is observable, and the step whose build
output answers the question that started this work. Also ships the manual
purge control, because a client-driven purge cannot cover Convex dashboard
edits, `npx convex import`, streaming import, or a tab that closed
mid-request — as an admin-panel affordance, not a CLI, since the panel
already carries a signed-in session and needs no new credential to reach it.

- [ ] `apps/www/src/vex.config.ts` — `routes` config with the route mapper
- [ ] `apps/www/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [ ] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [ ] `apps/www/src/lib/metadata.ts` — migrate off `fetchQuery`; `generateMetadata` runs on the page's own render path, so a `no-store` read here forces the whole route dynamic regardless of the page component
- [ ] `apps/www/src/app/sitemap.ts` — migrate off `fetchQuery`
- [ ] `apps/www/src/app/api/vex/revalidate/route.ts` — `createVexRevalidateRoute`
- [ ] `packages/react/src/hooks/useVexRevalidate.ts` — purge-one-document / purge-whole-collection request hook
- [ ] `packages/react/src/hooks/useVexRevalidate.test.tsx`
- [ ] `packages/react/src/hooks/index.ts` — export
- [ ] `packages/react/src/components/RevalidateButton.tsx` — the manual purge control
- [ ] `packages/react/src/components/RevalidateButton.test.tsx`
- [ ] `packages/react/src/components/index.ts` — export
- [ ] `packages/react/src/components/views/CollectionEditView.tsx` — mount `RevalidateButton` (purge the open document)
- [ ] `packages/react/src/components/views/CollectionListView.tsx` — mount `RevalidateButton` (purge the collection)
- [ ] `packages/next/src/cache/createVexRevalidateRoute.ts` — note: accept `{ collection, all: true }` (Step 4 follow-up)

#### apps/www/src/vex.config.ts

1 edit. Everything else in the file is unchanged.

**1 — add `revalidate` to the `defineConfig()` call, alongside `collections`/`globals`.**
Keys the mapper's collection check against `pages.slug` (already imported on
line 7) rather than a re-declared string literal, so a future rename of
`TABLE_SLUG_PAGES` cannot drift the mapper out of sync with the collection it
targets. `home` maps to `/`; every other slug maps to `/<slug>`. The mapper
receives one document at a time; `resolveTargets` (Step 3) calls it once for
`before` and once for `after` on an `update`, so a rename purges the old
path as well as the new one without the mapper itself looping over both.

```ts
  collections: [users, pages, headers, footers, themes],
  globals: [siteSettings],
  routes: {
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) return []
      const { slug } = doc
      if (typeof slug !== "string") return []
      return [slug === "home" ? "/" : `/${slug}`]
    },
  },
})

`revalidateSeconds` is deliberately absent from this config, and was removed
from `VexRoutesConfig` (`packages/core/src/revalidate/types.ts`) and
`defineConfig`'s defaults along with it. Next reads `export const revalidate`
by static analysis before any module executes, so it accepts only an inline
literal in the route file — measured: both a `vexConfig` member expression and
a plain imported `const` fail the build with "Invalid segment configuration
export detected". A config key that no adapter could ever honor is worse than
no key: it reads as configuration while silently doing nothing. The ISR window
therefore lives as a literal in each route, where Next requires it, and the
config keeps only `mapper` — the part `resolveTargets` genuinely consumes.
```

#### apps/www/src/app/(frontend)/(site)/page.tsx

Builds on Step 1's `notFound()` edit to this file. 2 edits; `generateMetadata`
and the JSX body are otherwise unchanged.

**1 — imports.** Replace the `convex/nextjs` `fetchQuery` import with the
shared `vex` client (`~/lib/vex`, Step 6) instead of instantiating a local
one — this route's `pages.getBySlug` read is the exact duplicate
`generatePageMetadata` (`~/lib/metadata`, below) makes for the same slug, and
only a single shared instance lets those two reads dedupe into one round
trip:

```tsx
import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"
import vexConfig from "~/vex.config"

import { PageContent } from "./PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.routes.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600
```

**2 — `HomePage`'s data fetch.** `fetchQuery` (hard-coded `no-store`, Blocker 2 in
the audit) becomes `vex.query`, which leaves Next's fetch cache untouched
and lets this route join the ISR path the ratified `revalidate` export declares:

```tsx
export default async function HomePage() {
  const initialData = await vex.query(api.pages.getBySlug, { slug: "home" })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} />
}
```

`initialData` still flows into `PageContent` as the live `convexQuery`
subscription's seed value (ratified decision 6) — nothing in `PageContent.tsx`
changes here.

#### apps/www/src/app/(frontend)/(site)/[slug]/page.tsx

Builds on Step 1's `notFound()` edit to this file. 3 edits.

**1 — imports.** Same shared-client swap as `page.tsx` — import `vex` from
`~/lib/vex` (Step 6) instead of instantiating a second client here — plus
`vexStaticParams` for the new `generateStaticParams` export:

```tsx
import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { notFound } from "next/navigation"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"
import vexConfig from "~/vex.config"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.routes.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600
```

**2 — new `generateStaticParams`, added before `generateMetadata`.** Reuses
Step 1's `api.pages.publishedSlugs` (added to `apps/www/convex/pages.ts` for the
sitemap) as the params source, and drops `home` — that slug is served by `/`
via `page.tsx`, not by this route:

```tsx
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    query: api.pages.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })

  return entries.filter((entry) => entry.slug !== "home")
}
```

`vexStaticParams` swallows an unreachable Convex deployment into `[]` rather than
throwing (P-020: CI builds `apps/www` with placeholder env), so a CI build with
no live deployment still produces a valid `ƒ`/`○` route table instead of failing
at "Failed to collect page data".

**3 — `PublicPage`'s data fetch.** Same `fetchQuery` → `vex.query` swap as
`page.tsx`:

```tsx
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const initialData = await vex.query(api.pages.getBySlug, { slug: normalized })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
```

#### apps/www/src/lib/metadata.ts

3 edits on top of Step 1's version — the settings/page merge logic, the
title/description precedence, and `resolveMediaUrl`'s try/catch shape are all
unchanged. `generateMetadata` runs on the same render path as the page
component itself, so `fetchQuery`'s hard-coded `cache: "no-store"` here forced
the whole route dynamic no matter what `page.tsx`/`[slug]/page.tsx` did —
this file, not the page components, was the actual remaining blocker to
Step 7's `●`/`○` route table.

**1 — imports.** Drop `fetchQuery`; import the shared `vex` client instead.

```ts
import { api } from "@convex/_generated/api"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const TITLE_SUFFIX = " | Vex CMS"
```

**2 — `generatePageMetadata`'s two reads.** `fetchQuery` becomes `vex.query`
for both `siteSettings.get` and `pages.getBySlug` — the latter is the same
query, same slug, `page.tsx`/`[slug]/page.tsx` already read, so this is the
read Decision 2's dedupe was for.

```ts
    const settings = (await vex.query(api.siteSettings.get)) as null | Record<string, unknown>
```

```ts
      const pages = (await vex.query(api.pages.getBySlug, { slug: props.slug })) as
        | Record<string, unknown>[]
        | undefined
```

**3 — `resolveMediaUrl`'s read.** Same swap; this one has no dedupe partner,
but it still has to leave `fetchQuery` to stop forcing the route dynamic.

```ts
    const result = (await vex.query(api.vex.media.getUrl, {
      adapter: "convex",
      mediaId,
    })) as { error?: string; url?: string; }
```

#### apps/www/src/app/sitemap.ts

2 edits on top of Step 1's version — the home-route fallback entry, the
`lastModified` guard, and the returned shape are unchanged. `/sitemap.xml` is
its own route; a `no-store` `fetchQuery` here keeps it dynamic on its own even
after every other public route migrates.

**1 — imports.** Drop `fetchQuery`; import the shared `vex` client instead.

```ts
import type { MetadataRoute } from "next"

import { api } from "@convex/_generated/api"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"
```

**2 — the read.** `fetchQuery` becomes `vex.query`.

```ts
  let entries: { slug: string; createdAt: number; updatedAt?: number }[] = []
  try {
    entries = await vex.query(api.pages.publishedSlugs, {})
  } catch {
    entries = []
  }
```

#### apps/www/src/app/api/vex/revalidate/route.ts

New file. Instantiates Step 4's factory with the three app-specific pieces it
needs: the resolved config (for the route mapper and RBAC resource names),
`getToken` (reads the session cookie), and `getAuth` (resolves the caller's user
+ organization for the `hasPermission` check) — both already used by the admin
route tree via `~/auth/server`.

```ts
import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { fetchAuthQuery, getToken } from "~/auth/server"
import config from "~/vex.config"

/**
 * `POST /api/vex/revalidate` — session-authorized path purge for `apps/www`.
 *
 * Called by `useVexMutation` (Step 5) after every admin-panel write, same
 * origin, and by the admin panel's Revalidate control over the same session.
 * Never secret-authorized: the caller must hold a real session with write
 * permission on the affected collection.
 */
export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
})
```

`vex revalidate` is dropped from this step. The manual purge doesn't need a
CLI: the admin panel already carries a signed-in session, so covering Convex
dashboard edits, `npx convex import`, streaming import, or a tab that closed
mid-request is a `RevalidateButton` control inside the panels that already
exist, not a new process to authenticate. A CLI has no browser session, and
the only way the earlier draft gave it one was signing in with
`VEX_ADMIN_EMAIL`/`VEX_ADMIN_PASSWORD` — a real admin service-account
password sitting in a CI/host environment, which is strictly worse than the
shared secret Step 4's session-only design was built to avoid. `vex
revalidate` and an API-key auth mode for it are deferred to the same
follow-up as server-side dispatch (a Convex-write-triggered purge with no
admin panel open at all).

#### packages/react/src/hooks/useVexRevalidate.ts

New file. A guided stub — the developer implements the fetch call. The data
layer behind `RevalidateButton`: posts to the same endpoint `useVexMutation`
(Step 5) posts to, resolved the same way via `VexRevalidateContext`, but
unlike `useVexMutation`'s fire-and-forget purge, this one is the user-
initiated action itself, so a failure must surface rather than be swallowed.

```ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { CollectionSlug, VexDocument, VexRevalidateChange } from "@vexcms/core";

import { useVexRoutesConfig } from "../context/VexRevalidateContext";

/** Body POSTed to purge exactly one document's currently-resolved paths. */
export interface VexRevalidateDocumentBody {
  /** Collection the purged document belongs to. */
  collection: CollectionSlug;
  /**
   * Always `"update"` — a manual purge re-resolves the document's current
   * paths, it does not model a create or delete.
   */
  operation: "update";
  /** Always exactly one change — the document's current state, `after` only. */
  changes: VexRevalidateChange[];
}

/** Body POSTed to purge every resolved path for a whole collection. */
export interface VexRevalidateCollectionBody {
  /** Collection every configured path is purged for. */
  collection: CollectionSlug;
  /** Discriminates this body from {@link VexRevalidateDocumentBody}. Always `true`. */
  all: true;
}

/**
 * Parsed JSON body returned by the revalidation endpoint
 * (`createVexRevalidateRoute`, `@vexcms/next`).
 */
export interface VexRevalidateResult {
  /** Paths that were successfully purged. */
  revalidated: string[];
  /** Errors from a throwing route mapper or a failed individual purge. */
  errors: unknown[];
}

/** Return shape of {@link useVexRevalidate}. */
export interface UseVexRevalidateResult {
  /** Purges the given document's currently-resolved paths. */
  purgeDocument: (props: {
    collection: CollectionSlug;
    doc: VexDocument;
  }) => Promise<VexRevalidateResult>;
  /** Purges every path configured for the given collection. */
  purgeCollection: (props: { collection: CollectionSlug }) => Promise<VexRevalidateResult>;
  /** `true` while a purge request is in flight. */
  isPending: boolean;
  /** The most recent purge request's failure, or `null` once one succeeds. */
  error: Error | null;
}

/**
 * Data layer for the admin panel's manual "Revalidate" control
 * (`RevalidateButton`). Posts to the same route `useVexMutation`'s
 * fire-and-forget purge posts to (resolved from `VexRevalidateContext`,
 * Step 5) — one purge route, two callers.
 *
 * Unlike `useVexMutation`'s purge, this one is user-initiated: the caller
 * clicked a button expecting a real outcome, so a failed request MUST
 * surface as `error` and a rejected promise, never resolve silently.
 *
 * @returns `purgeDocument`/`purgeCollection` request functions plus
 *   `isPending`/`error` for the calling button to render.
 * @throws Never itself; `purgeDocument`/`purgeCollection` reject on a
 *   network failure or non-2xx response, and that same failure populates
 *   `error` for the non-throwing render path.
 */
export function useVexRevalidate(): UseVexRevalidateResult {
  const revalidateConfig = useVexRoutesConfig();

  const mutation = useMutation({
    mutationFn: async (
      body: VexRevalidateDocumentBody | VexRevalidateCollectionBody,
    ): Promise<VexRevalidateResult> => {
      // TODO: implement
      // 1. `revalidateConfig.disabled` → throw a descriptive `Error`
      //    ("Revalidation is disabled") before touching the network — there
      //    is no route configured to call.
      // 2. `fetch(revalidateConfig.endpoint, { method: "POST", headers: {
      //    "Content-Type": "application/json" }, body: JSON.stringify(body) })`.
      // 3. → Non-2xx response (401 signed-out, 403 no write permission on
      //    `body.collection`, or anything else) → throw an `Error` naming
      //    the status, e.g. `Revalidate request failed: ${response.status}`.
      // 4. → Parse and return the JSON body as `VexRevalidateResult`.
      // Edge cases:
      // - A network failure (`fetch` itself rejecting) propagates as-is —
      //   same rejected-promise / `error` path as a non-2xx response.
      // - This hook never swallows a failure the way `useVexMutation` does:
      //   its purge is a side effect of a save that already succeeded, this
      //   one IS the requested action.
      throw new Error("Not implemented");
    },
  });

  return {
    purgeDocument: ({ collection, doc }) =>
      mutation.mutateAsync({ collection, operation: "update", changes: [{ after: doc }] }),
    purgeCollection: ({ collection }) => mutation.mutateAsync({ collection, all: true }),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
```

#### packages/react/src/hooks/useVexRevalidate.test.tsx

New file. Named `.tsx` for the same reason `useVexMutation.test.tsx` is
(Step 5): the `QueryClientProvider` wrapper needs JSX. `fetch` is stubbed the
same way `useVexMutation.test.tsx` stubs it.

```tsx
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVexRevalidate } from "./useVexRevalidate";
import { DEFAULT_VEX_REVALIDATE_ENDPOINT, VexRevalidateProvider } from "../context/VexRevalidateContext";

function Wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function DisabledWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <VexRevalidateProvider disabled>{children}</VexRevalidateProvider>
    </QueryClientProvider>
  );
}

const doc = { _id: "d1", _creationTime: 1, slug: "roadmap" };

describe("useVexRevalidate", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it('posts { collection, operation: "update", changes: [{ after: doc }] } for purgeDocument and resolves the parsed response', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ revalidated: ["/roadmap"], errors: [] }), { status: 200 }),
    );
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    let response: unknown;
    await act(async () => {
      response = await result.current.purgeDocument({ collection: "pages", doc });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(DEFAULT_VEX_REVALIDATE_ENDPOINT);
    expect(init).toMatchObject({ method: "POST", headers: { "Content-Type": "application/json" } });
    expect(JSON.parse(init.body as string)).toEqual({ collection: "pages", operation: "update", changes: [{ after: doc }] });
    expect(response).toEqual({ revalidated: ["/roadmap"], errors: [] });
  });

  it("posts { collection, all: true } for purgeCollection", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ revalidated: ["/features", "/roadmap"], errors: [] }), { status: 200 }),
    );
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.purgeCollection({ collection: "pages" });
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ collection: "pages", all: true });
  });

  it("rejects and populates `error` on a 403 response, rather than resolving silently", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.purgeDocument({ collection: "pages", doc })).rejects.toThrow(/403/);
    });

    expect(result.current.error).not.toBeNull();
  });

  it("rejects without calling fetch when the provider disables revalidation", async () => {
    const { result } = renderHook(() => useVexRevalidate(), { wrapper: DisabledWrapper });

    await act(async () => {
      await expect(result.current.purgeCollection({ collection: "pages" })).rejects.toThrow(/disabled/i);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/hooks/index.ts

1 edit — everything else unchanged.

**1 — barrel export.** Add beside Step 5's `export * from "./useVexMutation";` line.

```ts
export * from "./useVexRevalidate";
```

#### packages/react/src/components/RevalidateButton.tsx

New file.

```tsx
"use client";

import { CRUD_ACTIONS } from "@vexcms/core";
import type { CollectionSlug, VexDocument } from "@vexcms/core";

import { usePermission } from "../hooks";
import { useVexRevalidate } from "../hooks/useVexRevalidate";
import { Button } from "./ui";

/** Props for {@link RevalidateButton}. */
export interface RevalidateButtonProps {
  /** Collection to check write permission against and to purge. */
  collection: CollectionSlug;
  /**
   * The single document to purge. Omit to purge every path configured for
   * the whole collection (e.g. from `CollectionListView`).
   */
  doc?: VexDocument;
  /** Button label override. Defaults to "Revalidate" / "Revalidate all". */
  label?: string;
}

/**
 * Manual admin-panel purge control. Covers what a client-driven purge cannot
 * reach on its own: Convex dashboard edits, `npx convex import`, streaming
 * import, or a tab that closed before its automatic purge landed.
 *
 * Posts through `useVexRevalidate` to the same session-authorized route
 * `useVexMutation` posts to — no separate secret or API key. Gated on the
 * caller's write permission for `props.collection` (advisory only, per
 * P-004 — the route itself enforces via `hasPermission`), and renders the
 * request's pending/error state rather than failing silently, since this is
 * a user-initiated action.
 *
 * @param props - See {@link RevalidateButtonProps}.
 * @returns A button that purges one document (`props.doc` set) or an entire
 *   collection (`props.doc` omitted), plus an inline error message on
 *   failure.
 *
 * @example
 * ```tsx
 * // Purge the document currently open in CollectionEditView
 * <RevalidateButton collection={props.collection.slug} doc={currentDocument} />
 *
 * // Purge every path in the collection, from CollectionListView
 * <RevalidateButton collection={collection.slug} />
 * ```
 */
export function RevalidateButton(props: RevalidateButtonProps) {
  const canRevalidate = usePermission({ resource: props.collection, action: CRUD_ACTIONS.update });
  const { purgeDocument, purgeCollection, isPending, error } = useVexRevalidate();

  async function handleClick() {
    if (props.doc) {
      await purgeDocument({ collection: props.collection, doc: props.doc }).catch(() => {});
    } else {
      await purgeCollection({ collection: props.collection }).catch(() => {});
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        icon="RefreshCw"
        isPending={isPending}
        disabled={!canRevalidate || isPending}
        onClick={handleClick}
      >
        {props.label ?? (props.doc ? "Revalidate" : "Revalidate all")}
      </Button>
      {error && <p className="text-destructive text-xs">{error.message}</p>}
    </div>
  );
}
```

#### packages/react/src/components/RevalidateButton.test.tsx

New file. `usePermission` and `useVexRevalidate` are mocked at the module
boundary — their own behaviour is covered by `usePermission`'s existing
suite and `useVexRevalidate.test.tsx` above — so this test asserts only what
`RevalidateButton` itself is responsible for: which purge mode it calls,
gating, and rendering pending/error state.

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { RevalidateButton } from "./RevalidateButton";

const { usePermissionMock, purgeDocumentMock, purgeCollectionMock, useVexRevalidateMock } = vi.hoisted(() => ({
  usePermissionMock: vi.fn(),
  purgeDocumentMock: vi.fn(),
  purgeCollectionMock: vi.fn(),
  useVexRevalidateMock: vi.fn(),
}));

vi.mock("../hooks", () => ({ usePermission: usePermissionMock }));
vi.mock("../hooks/useVexRevalidate", () => ({ useVexRevalidate: useVexRevalidateMock }));

const doc = { _id: "d1", _creationTime: 1, slug: "roadmap" };

function defaultRevalidateState() {
  return {
    purgeDocument: purgeDocumentMock,
    purgeCollection: purgeCollectionMock,
    isPending: false,
    error: null,
  };
}

beforeEach(() => {
  usePermissionMock.mockReset().mockReturnValue(true);
  purgeDocumentMock.mockReset().mockResolvedValue({ revalidated: ["/roadmap"], errors: [] });
  purgeCollectionMock.mockReset().mockResolvedValue({ revalidated: ["/features", "/roadmap"], errors: [] });
  useVexRevalidateMock.mockReset().mockReturnValue(defaultRevalidateState());
});

describe("RevalidateButton", () => {
  it("purges only the given document when `doc` is supplied", async () => {
    render(<RevalidateButton collection="pages" doc={doc} />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(purgeDocumentMock).toHaveBeenCalledWith({ collection: "pages", doc }));
    expect(purgeCollectionMock).not.toHaveBeenCalled();
  });

  it("purges the whole collection when `doc` is omitted", async () => {
    render(<RevalidateButton collection="pages" />);

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(purgeCollectionMock).toHaveBeenCalledWith({ collection: "pages" }));
    expect(purgeDocumentMock).not.toHaveBeenCalled();
  });

  it("disables the button when the caller lacks write permission", () => {
    usePermissionMock.mockReturnValue(false);

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders the button's pending affordance while a purge is in flight", () => {
    useVexRevalidateMock.mockReturnValue({ ...defaultRevalidateState(), isPending: true });

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("surfaces the error message rather than failing silently", () => {
    useVexRevalidateMock.mockReturnValue({
      ...defaultRevalidateState(),
      error: new Error("Revalidate request failed: 403"),
    });

    render(<RevalidateButton collection="pages" doc={doc} />);

    expect(screen.queryByText("Revalidate request failed: 403")).not.toBeNull();
  });
});
```

#### packages/react/src/components/index.ts

1 edit — everything else unchanged.

**1 — barrel export.** Add beside the existing `export * from "./AdminLayout";` line.

```ts
export * from "./RevalidateButton";
```

#### packages/react/src/components/views/CollectionEditView.tsx

2 edits — everything else unchanged (builds on Step 5's edits to this file).

**1 — imports.** Add beside the existing `Button` import from `../ui`.

```ts
import { RevalidateButton } from "../RevalidateButton";
```

**2 — mount it beside the Save/Cancel buttons.** Add immediately before the
`Save` `<Button>`, inside the same `<div className="flex gap-2">` wrapper the
`form.Subscribe` render prop returns:

```tsx
<RevalidateButton collection={props.collection.slug} doc={currentDocument} />
```

#### packages/react/src/components/views/CollectionListView.tsx

2 edits — everything else unchanged (builds on Step 5's edits to this file).

**1 — imports.** Add beside the existing `VexLink` import from `../ui/VexLink`.

```ts
import { RevalidateButton } from "../RevalidateButton";
```

**2 — mount it beside the "+ New" button.** Add inside the header
`<div className="mb-6 flex items-center justify-between pt-4">`, immediately
before the `+ New` `<Button>`:

```tsx
<RevalidateButton collection={collection.slug} />
```

#### packages/next/src/cache/createVexRevalidateRoute.ts

Not a new file — Step 4's factory already parses the
`{ collection, all: true }` body and resolves it through its injected
`listCollection` prop, so nothing changes in this file here. This section
records what that means for the app wiring above.

**1 — the `{ collection, all: true }` branch reuses the existing
`VexRevalidateRequest`.** That type is the
`VexRevalidateCollectionRequest | VexRevalidateDocumentsRequest` union declared
in `@vexcms/core` — no new or duplicate type. It lives in core rather than
`@vexcms/next` because both ends of the wire consume it: the route that parses
it and the two `@vexcms/react` hooks that build it, and neither of those
packages depends on the other (P-010).

**2 — `apps/www`'s route must wire `listCollection`, and does (see its block
above).** The factory cannot read the collection itself: listing documents needs
a Convex query only the app can name. Left unwired, the collection-wide branch
purges nothing and reports that in `errors` — which would make
`RevalidateButton`'s "Revalidate all" mode a control that only ever fails. So
the app passes `listCollection`, reading `api.pages.publishedSlugs` (Step 1)
through the shared cached client and short-circuiting every other slug to `[]`,
since `pages` is the only collection this app's mapper resolves paths for.

Verify:

```bash
node scripts/verify-seo-routes.mjs --app apps/www --build --routes --static /,/features,/roadmap --metadata --notfound --cache --path /
```

`--cache` is the assertion that proves this step: `Cache-Control` must carry
`s-maxage` and must NOT say `no-store`. Measured before this step, `/` serves
`private, no-cache, no-store, max-age=0, must-revalidate` and the gate fails —
so it is a real gate, not a tautology (AP-013).

The purge loop was additionally verified live against a production build of
`apps/www` on a real Convex deployment, driving the route over HTTP with a real
Better Auth session rather than a mocked one. Measured:

| Case | Result |
| --- | --- |
| Signed-out caller, every body shape | `401` — auth is checked before parsing or batch bounds, so an unauthenticated caller costs no mapper work |
| Real session, `roles: ["user"]` (read-only on `pages`) | `403` — the route enforces, the button's `usePermission` gate is advisory only (P-004) |
| Real session, `roles: ["admin"]`, one document | `200 {"errors":[],"revalidated":["/roadmap"]}`; `/roadmap` went `HIT` -> **`MISS`** -> `HIT` |
| Same, collection-wide (`all: true`) | `200`, resolved `["/features","/roadmap","/"]` via the app's `listCollection`; all three went `HIT` -> **`MISS`** |
| Same, slug rename (`before`/`after` differ) | `200`, resolved **both** `["/roadmap","/roadmap-v2"]` — `resolveTargets`' before/after contract, live |
| Same, a collection the mapper ignores (`themes`) | `200 {"errors":[],"revalidated":[]}` — resolves nothing, reports no error |

The `MISS` transitions are the assertion that matters: they prove `revalidatePath`
evicted Next's real route cache, which the factory's unit tests cannot show
because they mock it.

Still genuinely manual (a human in the panel, no automation): that the mounted
`RevalidateButton` renders its pending affordance and surfaces a `403` inline
rather than appearing to succeed. Its logic is covered by
`RevalidateButton.test.tsx`; only the visual confirmation is outstanding.

### Step 8 — Sync both templates and re-verify by scaffolding [agent]

Why: The defect originates in `create-vexcms`, so every scaffolded project
inherits it — fixing only `apps/www` leaves every user broken. AP-020 is
explicit that typecheck plus build is not evidence a template works: five
template defects shipped green. The acceptance gate is a real scaffold run in
every supported mode.

**Ownership found (template-sync SKILL.md boundary):** `base-nextjs` owns
auth/admin/providers; `marketing-site` is a file-overwrite overlay with **no
`src/components/providers/` directory of its own** — it inherits base's
`server.tsx`/`client.tsx`/`convex.tsx`/`auth.tsx` untouched and overrides only
`(vexcms)/admin/layout.tsx` (adds `ThemeStyle`/`ThemeLive`). So the provider
restructure is a single shared edit (base's `server.tsx`); the admin-layout
`AuthServerProvider` mount has to land in **both** copies of
`(vexcms)/admin/layout.tsx` since marketing's is a full file override, not a
merge.

**Two deviations from the literal file list below, both required for the code
to compile and both within `template-sync`'s "clean cutover" mandate:**
1. `marketing-site/src/lib/metadata.ts` (`generatePageMetadata`) is rewritten,
   not deleted: it keeps the fetch-and-merge (which `vexMetadata` does not do)
   and delegates the formatting to `vexMetadata` (`@vexcms/next/seo`), fixing
   the exact bugs it carried — conditional OG, missing `metadataBase`/canonical,
   the same defects Step 1 fixed in `apps/www/src/lib/metadata.ts`. Deleting it
   would have pushed a duplicate fetch-and-merge into both callers, which is the
   drift P-010 warns about.
2. `marketing-site/src/vexcms/api.ts`'s `vexServerApi()` destructure gains
   `publishedSlugs` — the new collection-bound operation `convex/pages.ts`
   calls, alongside the existing `find`/`get`/etc.

**Gate honesty note (AP-012):** spec-tasks.md's Verify line says `/sitemap.xml`
must return "the seeded slugs". The packed-tarball scaffold this gate builds
has no live Convex deployment — it builds against a placeholder,
unreachable-deployment URL (P-020), under which `publishedSlugs` throws and
`createVexSitemap` degrades to its static entries only. Asserting real seeded
slugs here would be a criterion that can never pass in this harness (AP-012);
apps/www's own build (Step 7, real deployment) is what proves the seeded-slug
case. This gate instead asserts the two things that *are* true regardless of
Convex reachability: (a) the route table shows `●`/`○` for every public route
— a static-analysis fact, unaffected by whether the data fetch inside
succeeds — and (b) `/sitemap.xml`/`/robots.txt` return `200` with valid,
parseable content, degrading to the static entries rather than crashing.

**Modes enumerated** (read from `scripts/verify-scaffold.mjs` and
`packages/create-vexcms/README.md` — `--orgs`/`--monorepo` are CLI flags, not
additional entries in this gate's template matrix, and adding that matrix is
outside this step's Change list): exactly two, `TEMPLATES[0]` = `base-nextjs`
scaffolded with `--bare`, `TEMPLATES[1]` = `marketing-site` scaffolded with no
flags (the full overlay). Both already exist in `verify-scaffold.mjs`; this
step extends what each one asserts after `pnpm build`.

`spec-tasks.md`'s Step 8 checklist bundles `sitemap.ts`/`robots.ts` into one
line; every other step in this spec (Step 1's identical pair included) gives
each file its own checkbox and heading, so this reproduction splits it the
same way — 18 checkboxes/headings below, from spec-tasks.md's 17 lines.
`templates/base-nextjs/src/app/layout.tsx` is deliberately **not** among
them: unlike `apps/www`'s and `apps/test`'s root layouts, this template's
root layout never rendered `ThemeStyle` (base ships no theme system), so
there is nothing here for the provider restructure to drop.

- [ ] `packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx` — provider restructure
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx`
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/api/vex/revalidate/route.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/lib/vex.ts` — shared `createVexServerClient` instance every template server read imports
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx` — marketing-site owns its own copy
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` + chrome reads
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/robots.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx`
- [ ] `packages/create-vexcms/templates/marketing-site/src/vex.config.ts` — `routes` config
- [ ] `packages/create-vexcms/templates/marketing-site/convex/pages.ts` — `publishedSlugs` query
- [ ] `packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts` — binding
- [ ] `packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts` — rewritten to fetch + delegate to `vexMetadata` (not deleted — see the deviations above)
- [ ] `scripts/verify-scaffold.mjs` — route-table + SEO-route assertions, plus the AP-013 `--negative-routes` self-test
- [ ] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`

#### packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx

3 edits — the same restructure Step 6 already applies to `apps/www`'s and
`apps/test`'s copies of this file (a `cookies()` read in the root layout
forces every route dynamic). `marketing-site` has no `components/providers/`
directory of its own and inherits this file unchanged, so this is the
template system's only copy to edit.

**1 — imports.** Drop the `AuthServerProvider` import; nothing replaces it.

```tsx
import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";
```

**2 — docblock.** Record why `AuthServerProvider` left and where it went;
mirrors `apps/test`'s Step 6 docblock rather than `apps/www`'s, since this
template has no `/auth/sign-in` route to call out.

```tsx
/**
 * Server-side provider shell: theme context + the nuqs URL-state adapter.
 *
 * `AuthServerProvider` used to wrap `NuqsAdapter` here, putting a `getToken()`
 * cookie read on every route's render path. It now mounts directly in
 * `app/(vexcms)/admin/layout.tsx`, the only route group that needs it.
 *
 * Deliberately does **not** mount `ConvexClientProvider` — `ClientProviders`
 * renders it, and `ClientProviders` is nested inside this component, so its
 * copy is the one that actually reaches `children`. Mounting it here as well
 * built a second `ConvexReactClient` + `QueryClient` pair on every server
 * render (`providers/convex.tsx` intentionally creates fresh clients per call
 * server-side to avoid cross-request leaks) whose only consumer was the
 * discarded outer subtree.
 */
```

**3 — `ServerProviders` body.** Drop the `AuthServerProvider` wrap.

```tsx
export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
```

#### packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx

2 edits; `getCurrentUser()` and `NextAdminLayout` are unchanged.

**1 — imports.** Add `AuthServerProvider` beside the other local imports.

```tsx
import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { AuthServerProvider } from "~/components/providers/auth"
import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

import { ClientProviders } from "./clientProviders"
```

**2 — `AdminLayout` body.** Wrap the existing tree in `AuthServerProvider`.

```tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  return (
    <AuthServerProvider>
      <ClientProviders>
        <NextAdminLayout config={config} user={user ?? undefined}>
          {children}
        </NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  )
}
```

#### packages/create-vexcms/templates/base-nextjs/src/app/api/vex/revalidate/route.ts

New file. Instantiates `createVexRevalidateRoute` (`@vexcms/next/cache`,
Step 4) with this template's own `config`, `getToken`, and `getAuth` —
`~/auth/server` already exports the same `convexBetterAuthNextJs(...)`
binding `apps/www` uses, and `convex/auth/api.ts`'s `getUserOrg` query exists
here too, so the wiring is identical to `apps/www`'s Step 7 file even though
this template's own `vex.config.ts` sets no `revalidate` mapper — the route
still exists so a project that adds one (or `marketing-site`'s overlay, which
does) needs no new endpoint wiring.

```ts
import { api } from "@convex/_generated/api"
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { fetchAuthQuery, getToken } from "~/auth/server"
import config from "~/vex.config"

/**
 * `POST /api/vex/revalidate` — session-authorized path purge.
 *
 * Called by `useVexMutation` after every admin-panel write, same origin, and
 * by the admin panel's Revalidate control over the same session. Never
 * secret-authorized: the caller must hold a real session with write
 * permission on the affected collection.
 */
export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
})
```

#### packages/create-vexcms/templates/marketing-site/src/lib/vex.ts

New file. Same reasoning as `apps/www`'s Step 6 file: `createVexServerClient`
builds a fresh `React.cache` on every call, so a client instantiated per file
never dedupes against any other file's read. A single module-scope instance,
imported by every server read in this template, is what makes
`generatePageMetadata` (`~/lib/metadata`) and the page calling it collapse
their identical `pages.getBySlug` read into one Convex call.

```ts
import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

/**
 * The single shared Convex read client for every server component and route
 * in this project.
 *
 * `createVexServerClient` (`@vexcms/next/cache`) wraps its `query` method in
 * a `React.cache` created fresh on every call — so two files that each call
 * `createVexServerClient()` themselves get two independent caches and never
 * share a round trip, no matter how identical their reads are. Importing
 * this one instance everywhere is what lets `generatePageMetadata`
 * (`~/lib/metadata`) and the page calling it collapse their identical
 * `pages.getBySlug` read into a single Convex call within one request,
 * instead of two.
 */
export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })
```

#### packages/create-vexcms/templates/marketing-site/src/app/layout.tsx

2 edits; fonts, metadata, the `<html>`/`<body>` structure, and
`ServerProviders`/`ClientProviders`/`ThemeLive` nesting are unchanged.
`ThemeScript` stays (no cookie or Convex read); `ThemeLive` stays mounted at
root (it already renders once inside a client boundary, no duplicate
needed). Only `ThemeStyle` leaves — its render moves to
`(frontend)/(site)/layout.tsx` below, the only route group that needs
first-paint site theming; admin keeps its own `<ThemeStyle scope="admin" />`.

**1 — imports.** Drop the `ThemeStyle` import.

```tsx
import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"
```

**2 — `<head>`.** Remove the `<ThemeStyle />` element and update the
comment; `<ThemeScript />` is otherwise unchanged.

```tsx
      <head>
        {/* Applies the persisted light/dark class before first paint (no
            flash). Site theming now renders in `(frontend)/(site)/layout.tsx`
            — the admin layout re-emits its own scope for `/admin`. */}
        <ThemeScript />
      </head>
```

#### packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx

2 edits; the docblock, `getCurrentUser()`, and the `ThemeStyle`/`ThemeLive`
scope="admin" pair are unchanged — this only adds the `AuthContext` boundary
around the existing tree. Both this file and base's copy above need the
edit: marketing-site overrides `(vexcms)/admin/layout.tsx` wholesale, so it
is not something the shared `server.tsx` restructure alone can fix here.

**1 — imports.** Add `AuthServerProvider` beside the other local imports.

```tsx
import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { AuthServerProvider } from "~/components/providers/auth";
import { getCurrentUser } from "~/auth/serverUtils";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";
import config from "~/vex.config";

import { ClientProviders } from "./clientProviders";
```

**2 — `AdminLayout` body.** Wrap the existing tree in `AuthServerProvider`.

```tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AuthServerProvider>
      <ClientProviders>
        <ThemeStyle scope="admin" />
        <ThemeLive scope="admin" />
        <NextAdminLayout config={config} user={user ?? undefined}>
          {children}
        </NextAdminLayout>
      </ClientProviders>
    </AuthServerProvider>
  );
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx

2 edits. The skip-link, `<SiteHeader>`/`<SiteFooter>` props, and the
`try`/`catch` fallback shape are unchanged.

**1 — imports.** Replace `fetchQuery` with the shared `vex` client
(`~/lib/vex`, this step). Also import `ThemeStyle` — first-paint site
theming moves here from the root layout (above), the only group that needs
it.

```tsx
import type { ReactNode } from "react"

import { api } from "@convex/_generated/api"

import type { FootersDocument, HeadersDocument } from "~/vex.types"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"
import { vex } from "~/lib/vex"
```

**2 — chrome reads and render.** Swap the two `fetchQuery` calls for
`vex.query`, and render `<ThemeStyle />` above the skip link.

```tsx
  try {
    ;[headerData, footerData] = await Promise.all([
      vex.query(api.headers.getFirst),
      vex.query(api.footers.getFirst),
    ])
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return (
    <>
      <ThemeStyle />
      {/* Sits above the sticky header so it is the first tab stop on every
          page. Visually hidden until focused. */}
      <a
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-100 focus-visible:rounded-sm focus-visible:border focus-visible:border-border focus-visible:bg-card focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-foreground"
        href="#main"
      >
        Skip to content
      </a>
      <SiteHeader initialData={headerData} />
      <main id="main">{children}</main>
      <SiteFooter initialData={footerData} />
    </>
  )
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx

2 edits. `generateMetadata` and `PageContent`'s `WelcomePage` fallback
contract (no `PageContent.tsx` edit in this step's file list — the
try/catch-to-`undefined` shape stays, unlike `apps/www`'s `notFound()`
contract from Step 1, which this template never adopted) are unchanged.

**1 — imports.** Replace `fetchQuery` with the shared `vex` client, and add
the `revalidate` segment config sourced from `vex.config.ts`.

```tsx
import { api } from "@convex/_generated/api"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"
import vexConfig from "~/vex.config"

import { PageContent } from "./PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.routes.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600
```

**2 — `HomePage`'s data fetch.** `fetchQuery` becomes `vex.query`; the
try/catch-to-`undefined` fallback is unchanged.

```tsx
export default async function HomePage() {
  let initialData: PagesDocument[] | undefined
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: "home" })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx

3 edits.

**1 — imports.** Same shared-client swap as `page.tsx`, plus `vexStaticParams`
for the new `generateStaticParams` export and the `revalidate` segment
config.

```tsx
import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"
import vexConfig from "~/vex.config"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.routes.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600
```

**2 — new `generateStaticParams`, added after `generateMetadata`, before the
default export.** Reuses this step's new `api.pages.publishedSlugs` (below)
as the params source, dropping `home` — that slug is served by `/` via
`page.tsx`, not by this route.

```tsx
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    query: api.pages.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })

  return entries.filter((entry) => entry.slug !== "home")
}
```

`vexStaticParams` swallows an unreachable Convex deployment into `[]` rather
than throwing (P-020: the packed-tarball scaffold builds with placeholder
env), so a build with no live deployment still produces a valid route table.

**3 — `PublicPage`'s data fetch.** Same `fetchQuery` → `vex.query` swap as
`page.tsx`, but the two failure modes are split — which this step's draft did
not do.

`PageContent` renders `WelcomePage` whenever no document is found. At `/` that
is deliberate pre-seed onboarding, so `page.tsx` keeps the plain
try/catch-to-`undefined` shape. At `/<unknown-slug>` the same code path serves
a full welcome page with a **200**, which is a soft 404 — strictly worse than
the empty-200 Step 1 fixed in `apps/www`, because there is real content for a
crawler to index at every bogus URL.

So the catch is narrowed to what it is actually for:

```tsx
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  // The two failure modes are deliberately NOT the same:
  //
  // - The query THROWS: the deployment is unreachable. A scaffold builds with
  //   placeholder env, so throwing here would fail `next build` outright.
  //   Render with no seed and let the client's live subscription hydrate.
  // - The query SUCCEEDS and returns `[]`: the deployment answered, and this
  //   page genuinely does not exist. That must be a real 404, not an empty
  //   200 — an empty 200 gets the URL indexed as a live, blank page.
  let initialData: PagesDocument[] | undefined
  let reachable = true
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: normalized })
  } catch {
    reachable = false
  }

  if (reachable && (!initialData || initialData.length === 0)) {
    notFound()
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
```

`reachable` is what keeps this safe for a scaffold: `verify-scaffold.mjs`
builds with placeholder env, so the query throws, `reachable` is `false`, and
the route still prerenders instead of failing the build. `/[slug]` is not in
the gate's `staticRoutes`, so the `notFound()` branch cannot affect it.

#### packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts

New file. Uses `createVexSitemap` (`@vexcms/next/seo`, Step 2) rather than a
hand-rolled reducer — unlike `apps/www`'s own `sitemap.ts`, which predates
this factory (Step 1) and keeps its bespoke home-route entry unchanged
through Step 7, this template has no app-specific quirk to carry.
`getUpdatedAt` is deliberately omitted: no collection populates `updatedAt`
yet (Step 9 is the one that will), and passing it here would emit
`lastModified: new Date(undefined)` — an Invalid Date — for every entry,
which is worse than omitting `<lastmod>` entirely.

```ts
import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

/**
 * Generates `/sitemap.xml` from every published `pages` document plus the
 * site root. Degrades to `[]` (no page entries) when Convex is unreachable —
 * the packed-tarball scaffold this template ships into has no live
 * deployment and builds against placeholder env (P-020).
 */
export default createVexSitemap({
  client: vex,
  query: api.pages.publishedSlugs,
  toUrl: (slug) => (slug === "home" ? env.NEXT_PUBLIC_SITE_URL : `${env.NEXT_PUBLIC_SITE_URL}/${slug}`),
  getSlug: (item) => item.slug,
})
```

#### packages/create-vexcms/templates/marketing-site/src/app/robots.ts

New file. Uses `createVexRobots` (`@vexcms/next/seo`, Step 2). Purely
static — no Convex call, so the placeholder-env build concern (P-020) does
not apply here.

```ts
import { createVexRobots } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

/**
 * Generates `/robots.txt`. Allows all crawlers on the public site and points
 * them at the generated sitemap; disallows the authenticated `/admin` tree
 * and its `/api` routes.
 */
export default createVexRobots({
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  disallow: ["/admin", "/api"],
})
```

#### packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx

1 edit — import the shared `vex` client (`~/lib/vex`, this step) instead of
`fetchQuery`; `createVexServerClient()` builds a fresh `React.cache` on every
call, so a client scoped to just this file could never join any other
file's dedupe. Everything else (the `props`/scope contract, `buildThemeCss`,
the `<style>` element, the docblock) is unchanged.

**1 — imports and query.** Replace `fetchQuery` with the shared client; the
body's only change is `theme = await fetchQuery(...)` becoming
`theme = await vex.query(...)`.

```tsx
import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"

import { vex } from "~/lib/vex"
```

```tsx
  let theme: null | Record<string, unknown> = null
  try {
    theme = await vex.query(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
  } catch {
```

#### packages/create-vexcms/templates/marketing-site/src/vex.config.ts

1 edit. Everything else in the file (`access`, `admin.sidebar`, `authAdapter`,
`storage`) is unchanged.

**1 — add `revalidate` to the `defineConfig()` call, alongside
`collections`/`globals`.** Keys the mapper's collection check against
`pages.slug` (already imported) rather than a re-declared string literal, so
a future rename of `TABLE_SLUG_PAGES` cannot drift the mapper out of sync
with the collection it targets. `home` maps to `/`; every other slug maps to
`/<slug>`.

```ts
  collections: [users, pages, headers, footers, themes],
  globals: [siteSettings],
  routes: {
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) return []
      const { slug } = doc
      if (typeof slug !== "string") return []
      return [slug === "home" ? "/" : `/${slug}`]
    },
  },
})

`revalidateSeconds` is deliberately absent from this config, and was removed
from `VexRoutesConfig` (`packages/core/src/revalidate/types.ts`) and
`defineConfig`'s defaults along with it. Next reads `export const revalidate`
by static analysis before any module executes, so it accepts only an inline
literal in the route file — measured: both a `vexConfig` member expression and
a plain imported `const` fail the build with "Invalid segment configuration
export detected". A config key that no adapter could ever honor is worse than
no key: it reads as configuration while silently doing nothing. The ISR window
therefore lives as a literal in each route, where Next requires it, and the
config keeps only `mapper` — the part `resolveTargets` genuinely consumes.
```

#### packages/create-vexcms/templates/marketing-site/convex/pages.ts

2 edits — `getBySlug` is unchanged.

**1 — imports.** Bind `publishedSlugs` alongside `find`.

```ts
import { v } from "convex/values"

import { TABLE_SLUG_PAGES } from "~/db/constants"
import { find, publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

import { query } from "./_generated/server"
```

**2 — new export, after `getBySlug`.** Mirrors `apps/www/convex/pages.ts`'s
own `publishedSlugs` query byte-for-byte.

```ts
/**
 * Returns `{ slug, createdAt, updatedAt? }` for every page document.
 *
 * Consumed by `app/sitemap.ts` and `[slug]/page.tsx`'s `generateStaticParams`.
 * Access is bypassed for the same reason `getBySlug` bypasses it: both are
 * read at build time and by anonymous crawlers, neither of which carries a
 * session.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({
      access: { bypass: true },
      collection: TABLE_SLUG_PAGES,
      ctx,
    })
  },
})
```

#### packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts

1 edit — `getAuth`'s configuration is unchanged.

**1 — bind `publishedSlugs` alongside the existing operations.**
`convex/pages.ts`'s new `publishedSlugs` query (above) imports it from here.

```ts
export const { get, find, search, create, remove, update, globals, publishedSlugs } = vexServerApi<DataModel>({
  config,
  getAuth: createGetAuth({
    orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
    userCollectionSlug: TABLE_SLUG_USERS,
    sessionCollectionSlug: TABLE_SLUG_SESSIONS,
    resolveOrgs: true,
  }),
})
```

#### packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts

3 edits, per the deviation above: rewritten, not deleted. Keeps this file's
existing fetch-and-merge (`vexMetadata` does not fetch) and delegates
formatting to it, fixing the same two defects Step 1 fixed by hand in
`apps/www/src/lib/metadata.ts` — title/description no longer conditional on
an OG image resolving, and a `metadataBase`/canonical link are now emitted.

**1 — imports.** Replace `fetchQuery` with the shared `vex` client and add
`vexMetadata`.

```ts
import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { vexMetadata } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const TITLE_SUFFIX = " | Vex CMS"

/**
 * Returns the first candidate that is a non-blank string.
 *
 * Optional text fields in a vexcms collection seed as `""` rather than being
 * absent, so `??` chains cannot express "fall back to the site default" — an
 * empty override would win. Mirrors `apps/www/src/lib/metadata.ts`'s helper
 * of the same name (Step 1).
 */
function firstNonBlank(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }
  return undefined
}
```

**2 — `generatePageMetadata`.** Fetches and merges exactly as before, but
delegates the `Metadata` shape itself to `vexMetadata`.

```ts
/**
 * Generate Next.js Metadata for a page.
 *
 * Fetches site settings and, when a slug is given, the matching page
 * document, then merges them — page-level `metaTitle`/`metaDescription`/
 * `ogImage` win over the site's defaults from `siteSettings` — and delegates
 * the `Metadata` shape (title, description, `metadataBase`, canonical,
 * conditional OG image) to `vexMetadata` (`@vexcms/next/seo`).
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: { slug?: string }): Promise<Metadata> {
  try {
    const settings = (await vex.query(api.siteSettings.get)) as null | Record<string, unknown>
    if (!settings) {
      return { title: "Untitled" }
    }

    let pageData: Record<string, unknown> | undefined
    if (props.slug) {
      const pages = (await vex.query(api.pages.getBySlug, { slug: props.slug })) as
        | Record<string, unknown>[]
        | undefined
      pageData = pages?.[0]
    }

    const pageTitle = firstNonBlank(pageData?.metaTitle, pageData?.title)
    const siteName = firstNonBlank(settings.name)
    const title =
      (firstNonBlank(pageTitle, settings.metaTitle, siteName) ?? "Untitled") + TITLE_SUFFIX
    const description = firstNonBlank(pageData?.metaDescription, settings.metaDescription, settings.description)

    // `upload()` fields always store an array of media ids — the first entry
    // is the selection. Page-level ogImage wins over the site default.
    const pageOgImageId = (pageData?.ogImage as string[] | undefined)?.[0]
    const siteOgImageId = (settings.ogImage as string[] | undefined)?.[0]
    const ogImageId = pageOgImageId ?? siteOgImageId
    const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

    const twitterHandle = firstNonBlank(settings.twitterHandle)
    const canonicalPath = props.slug && props.slug !== "home" ? `/${props.slug}` : "/"

    const metadata = vexMetadata({
      title,
      description,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      path: canonicalPath,
      imageUrl: ogImageUrl,
    })

    if (twitterHandle) {
      metadata.twitter = { card: "summary_large_image", site: twitterHandle }
    }

    return metadata
  } catch {
    // Convex not available — return minimal metadata
    return { title: "Vex CMS" }
  }
}
```

**3 — `resolveMediaUrl`.** Same `fetchQuery` → `vex.query` swap; no other
change.

```ts
async function resolveMediaUrl(mediaId: string): Promise<string | undefined> {
  try {
    const result = (await vex.query(api.vex.media.getUrl, {
      adapter: "convex",
      mediaId,
    })) as { error?: string; url?: string }
    return result.url
  } catch {
    return undefined
  }
}
```

#### scripts/verify-scaffold.mjs

9 edits, extending the packed-tarball gate past "it compiled" (AP-020) with
the route-table + SEO-route assertions the Verify block above calls for, and
an AP-013 negative self-test proving the new assertion can actually fail.
`readPublishablePackages`, `assertBuilt`, `packPublishables`,
`injectOverrides`, `printSummary`, and `runNegativeSelfTest` are unchanged.

**1 — imports.** Add `node:net` (for the new `freePort` helper) and `spawn`
(to boot `next start`).

```js
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn, spawnSync } from "node:child_process";
```

**2 — CLI flags.** Add `--negative-routes`, distinct from the existing
`--negative` (which corrupts a tarball override — this one corrupts a route
instead).

```js
const cliArgs = process.argv.slice(2);
const keep = cliArgs.includes("--keep");
const negative = cliArgs.includes("--negative");
const negativeRoutes = cliArgs.includes("--negative-routes");
```

**3 — Usage docblock.** Document the new flag and what the gate now asserts.

```js
 * Usage:
 *   node scripts/verify-scaffold.mjs             pack + scaffold both templates, install/typecheck/build each
 *   node scripts/verify-scaffold.mjs --keep      preserve the tmp pack/scaffold dirs for debugging
 *   node scripts/verify-scaffold.mjs --negative  AP-013 self-test: corrupt one override mapping and confirm
 *                                                the pipeline (correctly) fails — see the file-level note
 *                                                above `runNegativeSelfTest` for why exit is always 1
 *   node scripts/verify-scaffold.mjs --negative-routes
 *                                                AP-013 self-test for the route-table assertion: forces
 *                                                `marketing-site`'s home route dynamic and confirms
 *                                                `assertScaffoldRoutes` (correctly) reports it unprerendered
 *                                                — see `runNegativeRoutesSelfTest`. Also always exits 1.
 *
 * Each template's own `pnpm build` output is also asserted now, past "it compiled": the
 * public routes named in `TEMPLATES` must appear in `.next/prerender-manifest.json`, and
 * (for templates that ship the generated SEO routes) `/sitemap.xml`/`/robots.txt` must be
 * structurally valid — 200, parseable, non-empty. Per AP-012 this never asserts seeded slug
 * content: this gate has no live Convex deployment and builds with placeholder env (P-020).
```

**4 — `TEMPLATES`.** Add each template's expected static routes and whether
it ships the generated SEO routes.

```js
const TEMPLATES = [
  {
    key: "base-nextjs",
    label: "templates/base-nextjs (--bare)",
    bare: true,
    staticRoutes: ["/", "/unauthorized"],
    seoRoutes: false,
  },
  {
    key: "marketing-site",
    label: "templates/marketing-site (full)",
    bare: false,
    staticRoutes: ["/"],
    seoRoutes: true,
  },
];
```

**5 — new `assertScaffoldRoutes` and `freePort`, inserted after `runStep`.**

```js
/**
 * Extends a template's build proof past "it compiled": reads which routes
 * the build actually prerendered from `.next/prerender-manifest.json` — a
 * static-analysis fact, unaffected by whether the page's own data fetch
 * succeeds — and, for templates that ship the generated SEO routes, boots
 * `next start` just long enough to confirm `/sitemap.xml` and `/robots.txt`
 * are structurally valid: 200, parseable, non-empty.
 *
 * Never asserts seeded slug content: the packed-tarball scaffold this gate
 * builds has no live Convex deployment and builds against placeholder env
 * (P-020), under which `publishedSlugs` throws and `createVexSitemap`
 * degrades to its static entries only (AP-012).
 *
 * @param {string} projectDir absolute path to the scaffolded, already-built project
 * @param {{ staticRoutes: string[], seoRoutes: boolean }} template
 * @returns {Promise<Array<{ label: string, ok: boolean }>>}
 */
async function assertScaffoldRoutes(projectDir, template) {
  const steps = [];
  const record = (label, ok, detail = "") => {
    console.log(`    ${ok ? "\u2713" : "\u2717"} ${label}${ok || !detail ? "" : ` \u2014 ${detail}`}`);
    steps.push({ label: `route: ${label}`, ok });
  };

  console.log("  \u2192 route-table + SEO-route assertions");

  let prerendered = [];
  try {
    const manifestPath = path.join(projectDir, ".next", "prerender-manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    prerendered = Object.keys(manifest.routes ?? {});
  } catch (error) {
    record("read prerender-manifest.json", false, error.message);
    return steps;
  }

  for (const route of template.staticRoutes) {
    record(
      `${route} is prerendered`,
      prerendered.includes(route),
      `manifest has: ${prerendered.join(", ") || "(none)"}`,
    );
  }

  if (!template.seoRoutes) return steps;

  let server;
  try {
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    server = spawn("pnpm", ["run", "start", "--port", String(port)], {
      cwd: projectDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const deadline = Date.now() + 60_000;
    let ready = false;
    while (Date.now() < deadline && !ready) {
      try {
        ready = (await fetch(base, { redirect: "manual" })).status > 0;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    if (!ready) throw new Error(`server did not become ready on ${base}`);

    const sitemapRes = await fetch(`${base}/sitemap.xml`);
    record("/sitemap.xml returns 200", sitemapRes.status === 200, `got ${sitemapRes.status}`);
    const sitemapBody = await sitemapRes.text();
    record(
      "/sitemap.xml is parseable XML with at least one <loc>",
      /<urlset[\s>]/.test(sitemapBody) && /<loc>[^<]+<\/loc>/.test(sitemapBody),
    );

    const robotsRes = await fetch(`${base}/robots.txt`);
    record("/robots.txt returns 200", robotsRes.status === 200, `got ${robotsRes.status}`);
    const robotsBody = await robotsRes.text();
    record(
      "/robots.txt names a user-agent and a sitemap",
      /user-agent:/i.test(robotsBody) && /sitemap:/i.test(robotsBody),
    );
  } catch (error) {
    record("SEO route harness", false, error.message);
  } finally {
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        server.kill("SIGTERM");
      }
    }
  }

  return steps;
}

/** @returns {Promise<number>} A TCP port currently free on the loopback interface. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}
```

**6 — `runTemplate` awaits the new route assertions after a successful
build.** Rewrites the whole function; only the added `staticRoutes`/`seoRoutes`
params and the final `if (built)` block are new.

```js
async function runTemplate({ key, label, bare, staticRoutes, seoRoutes, cliEntry, scaffoldRoot, tarballs }) {
  console.log(`\n=== ${label} ===`);
  const steps = [];
  const ok = (step) => {
    steps.push(step);
    return step.ok;
  };

  const scaffoldArgs = [cliEntry, key, "--yes", ...(bare ? ["--bare"] : [])];
  if (!ok(runStep("scaffold (create-vexcms --yes)", "node", scaffoldArgs, scaffoldRoot))) {
    return { key, label, steps };
  }

  const projectDir = path.join(scaffoldRoot, key);
  const overrideStart = Date.now();
  try {
    injectOverrides(projectDir, tarballs);
    ok({ label: "inject pnpm.overrides", ok: true, ms: Date.now() - overrideStart });
    console.log(`  \u2713 inject pnpm.overrides (${Date.now() - overrideStart}ms)`);
  } catch (error) {
    ok({ label: "inject pnpm.overrides", ok: false, ms: Date.now() - overrideStart });
    console.error(`  \u2717 inject pnpm.overrides \u2014 ${error.message}`);
    return { key, label, steps };
  }

  const remainingSteps = [
    ["pnpm install", ["install", "--no-frozen-lockfile"]],
    ["pnpm typecheck", ["run", "typecheck"]],
    ["pnpm build", ["run", "build"]],
  ];
  let built = true;
  for (const [stepLabel, args] of remainingSteps) {
    built = ok(runStep(stepLabel, "pnpm", args, projectDir));
    if (!built) break;
  }

  if (built) {
    const routeSteps = await assertScaffoldRoutes(projectDir, { staticRoutes, seoRoutes });
    for (const step of routeSteps) ok(step);
  }

  return { key, label, steps };
}
```

**7 — new `runNegativeRoutesSelfTest`, inserted after `runNegativeSelfTest`.**

```js
/**
 * AP-013 self-test for the route-table assertion specifically — as distinct
 * from `runNegativeSelfTest`'s override-corruption self-test above.
 * Scaffolds `marketing-site` for real, deliberately forces its home route
 * dynamic before building, and confirms `assertScaffoldRoutes` (correctly)
 * reports `/` as not prerendered. Without this, `assertScaffoldRoutes` could
 * report every route green unconditionally and nothing here would notice.
 *
 * Always returns 1, for the same reason `runNegativeSelfTest` does: the
 * expected outcome is a caught, reported failure, and the console message —
 * not the exit code — tells a human which branch fired.
 *
 * @param {{ publishables: Array<{ dir: string, name: string }>, cliEntry: string }} params
 * @returns {Promise<number>} always 1
 */
async function runNegativeRoutesSelfTest({ publishables, cliEntry }) {
  console.log(
    "Negative routes self-test: scaffold templates/marketing-site for real, force its home\n" +
      "route dynamic, and confirm the route-table assertion (correctly) reports it as not\n" +
      "prerendered \u2014 proving assertScaffoldRoutes is not a vacuous pass (AP-013)."
  );

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-routes-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negative-routes-scaffold-"));

  try {
    const tarballs = packPublishables(publishables, packRoot);
    const template = TEMPLATES.find((t) => t.key === "marketing-site");

    const scaffolded = runStep(
      "scaffold (create-vexcms --yes)",
      "node",
      [cliEntry, template.key, "--yes"],
      scaffoldRoot,
    );
    if (!scaffolded.ok) throw new Error("scaffold step failed \u2014 cannot run the routes self-test");

    const projectDir = path.join(scaffoldRoot, template.key);
    const pagePath = path.join(projectDir, "src/app/(frontend)/(site)/page.tsx");
    const original = fs.readFileSync(pagePath, "utf-8");
    fs.writeFileSync(pagePath, `export const dynamic = "force-dynamic";\n\n${original}`);

    injectOverrides(projectDir, tarballs);

    for (const [stepLabel, args] of [
      ["pnpm install", ["install", "--no-frozen-lockfile"]],
      ["pnpm build", ["run", "build"]],
    ]) {
      const step = runStep(stepLabel, "pnpm", args, projectDir);
      if (!step.ok) throw new Error(`${stepLabel} failed before the route assertion could run`);
    }

    // `seoRoutes: false` here — this self-test only needs the route-table
    // check, not a full server boot for the sitemap/robots assertions.
    const routeSteps = await assertScaffoldRoutes(projectDir, { staticRoutes: template.staticRoutes, seoRoutes: false });
    const homeStep = routeSteps.find((step) => step.label === "route: / is prerendered");

    if (homeStep?.ok) {
      console.error(
        "\n\u2717 CRITICAL: assertScaffoldRoutes reported `/` as prerendered after it was forced\n" +
          "dynamic. The route-table assertion cannot be trusted to catch a real prerendering\n" +
          "regression."
      );
      return 1;
    }

    console.log(
      "\n\u2713 negative routes self-test passed: assertScaffoldRoutes correctly reported `/`\n" +
        "as not prerendered once it was forced dynamic."
    );
    return 1;
  } finally {
    if (keep) {
      console.log(`--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }
}
```

**8 — `main` becomes `async` and gains the `--negative-routes` branch.**

```js
async function main() {
  console.log("verify-scaffold: packed-tarball demo gate\n");

  const publishables = readPublishablePackages();
  assertBuilt(publishables);
  const cliEntry = path.join(root, "packages/create-vexcms/dist/index.js");

  if (negative) {
    process.exit(runNegativeSelfTest({ publishables, cliEntry }));
  }

  if (negativeRoutes) {
    process.exit(await runNegativeRoutesSelfTest({ publishables, cliEntry }));
  }

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-scaffold-"));

  let exitCode = 0;
  try {
    console.log(`Packing ${publishables.length} publishable package(s)...`);
    const tarballs = packPublishables(publishables, packRoot);
    for (const [name, tarball] of tarballs) {
      console.log(`  \u2713 ${name} \u2192 ${tarball}`);
    }

    const results = [];
    for (const template of TEMPLATES) {
      results.push(await runTemplate({ ...template, cliEntry, scaffoldRoot, tarballs }));
    }

    exitCode = printSummary(results);
  } finally {
    if (keep) {
      console.log(`\n--keep: preserved ${packRoot} and ${scaffoldRoot}`);
    } else {
      fs.rmSync(packRoot, { recursive: true, force: true });
      fs.rmSync(scaffoldRoot, { recursive: true, force: true });
    }
  }

  process.exit(exitCode);
}
```

**9 — bottom invocation awaits `main`.**

```js
try {
  await main();
} catch (error) {
  console.error(`\nverify-scaffold: ${error.message}`);
  process.exit(1);
}
```

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

New file, following the existing guides' frontmatter + prose + code-block
shape (`theming.mdx`, `auth.mdx`).

````mdx
---
title: Caching, sitemaps and revalidation
description: Cached Convex reads for prerenderable public pages, generated sitemap.xml/robots.txt/metadata, and path-based revalidation triggered from the admin panel.
---

Public pages read Convex through a cached client so Next.js can prerender
them at build time and serve them from the CDN. `@vexcms/next`'s `cache` and
`seo` entry points, plus a `revalidate` mapper in `vex.config.ts`, are what
make that possible without hand-writing the plumbing per project.

## The shared read client

`createVexServerClient` (`@vexcms/next/cache`) wraps Convex's HTTP client in
a `React.cache`, so every `.query()` call it makes within one request dedupes
against every other call with the same arguments — a page component and its
`generateMetadata` reading the same document collapse into a single round
trip. That dedupe only works if every server read shares **one** client
instance: two files that each call `createVexServerClient()` build two
independent caches and never dedupe with each other.

Every template exports exactly one instance, from `src/lib/vex.ts`:

```ts
import { createVexServerClient } from "@vexcms/next/cache"

import { env } from "~/env.mjs"

export const vex = createVexServerClient({ url: env.NEXT_PUBLIC_CONVEX_URL })
```

Import `vex` everywhere a server component, layout, or route handler needs
to read Convex — never call `createVexServerClient` a second time.

## Static params, sitemaps, robots, and metadata

`@vexcms/next/seo` turns a Convex `publishedSlugs`-shaped query into the
four things a public site needs, without a bespoke reducer per project:

- **`vexStaticParams`** builds `generateStaticParams` output for a
  slug-driven route, returning `[]` — never throwing — when Convex is
  unreachable:

  ```ts
  export async function generateStaticParams() {
    const entries = await vexStaticParams({
      client: vex,
      query: api.pages.publishedSlugs,
      paramName: "slug",
      getSlug: (item) => item.slug,
    })

    return entries.filter((entry) => entry.slug !== "home")
  }
  ```

- **`createVexSitemap`** returns `app/sitemap.ts`'s default export and
  degrades to an empty sitemap on a read failure:

  ```ts
  // src/app/sitemap.ts
  export default createVexSitemap({
    client: vex,
    query: api.pages.publishedSlugs,
    toUrl: (slug) => (slug === "home" ? env.NEXT_PUBLIC_SITE_URL : `${env.NEXT_PUBLIC_SITE_URL}/${slug}`),
    getSlug: (item) => item.slug,
  })
  ```

  Leave `getUpdatedAt` unset until your collection actually populates an
  `updatedAt` field — passing it against documents that don't would emit
  `<lastmod>` from `undefined` for every entry, which is worse than omitting
  it.

- **`createVexRobots`** returns `app/robots.ts`'s default export:

  ```ts
  // src/app/robots.ts
  export default createVexRobots({
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    disallow: ["/admin", "/api"],
  })
  ```

- **`vexMetadata`** formats a `Metadata` object (title, description,
  `metadataBase`, canonical link, conditional OG image) but does **not**
  fetch — fetching and merging page/site-level SEO fields is your app's job.
  See `src/lib/metadata.ts` in `templates/marketing-site` for the reference
  implementation:

  ```ts
  const metadata = vexMetadata({
    title,
    description,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    path: canonicalPath,
    imageUrl: ogImageUrl,
  })
  ```

  Title and description are always set; only `openGraph.images` depends on
  `imageUrl` resolving. Never gate the whole `openGraph` block on the image —
  a page with no image published should still carry an OG title/description.

## Path-based revalidation

`vex.config.ts`'s `revalidate` option maps one changed document to the
public paths it affects:

```ts
const vexConfig = defineConfig({
  // …
  routes: {
    map: ({ collection, doc }) => {
      if (collection !== pages.slug) return []
      const { slug } = doc
      if (typeof slug !== "string") return []
      return [slug === "home" ? "/" : `/${slug}`]
    },
  },
})

`revalidateSeconds` is deliberately absent from this config, and was removed
from `VexRoutesConfig` (`packages/core/src/revalidate/types.ts`) and
`defineConfig`'s defaults along with it. Next reads `export const revalidate`
by static analysis before any module executes, so it accepts only an inline
literal in the route file — measured: both a `vexConfig` member expression and
a plain imported `const` fail the build with "Invalid segment configuration
export detected". A config key that no adapter could ever honor is worse than
no key: it reads as configuration while silently doing nothing. The ISR window
therefore lives as a literal in each route, where Next requires it, and the
config keeps only `mapper` — the part `resolveTargets` genuinely consumes.
```

`revalidateSeconds` also drives the page's own `revalidate` segment config:

```ts
// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.routes.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600
```

`createVexRevalidateRoute` (`@vexcms/next/cache`) turns that config into
`POST /api/vex/revalidate`, session-authorized rather than secret-authorized —
the caller must already hold a session with write permission on the affected
collection:

```ts
// src/app/api/vex/revalidate/route.ts
export const { POST } = createVexRevalidateRoute({
  config,
  getToken,
  getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
})
```

Every admin-panel write purges its own paths automatically through
`useVexMutation`. The **Revalidate** button in the collection edit/list
views covers what an automatic purge cannot: a Convex dashboard edit, `npx
convex import`, streaming import, or a tab that closed mid-request. Both
call the same route — there is one purge path, two triggers.

## What is deliberately out of scope

Server-side dispatch (a Convex-write-triggered purge with no admin panel
open at all), a `vex revalidate` CLI, and an API-key auth mode for that CLI
are deferred. The admin panel already carries a signed-in session; giving a
headless CLI one would mean a service-account password sitting in a CI/host
environment, which is strictly worse than the session-only design this
system was built around.
````

Four things this step surfaced that the plan did not anticipate:

**1 — a fresh scaffold's `pnpm install` was already broken.** The template pins
`better-auth` exactly but nothing constrained transitive `@better-auth/passkey`
(it arrives via `@daveyplate/better-auth-ui` on a caret range). It resolved to
`1.7.2`, whose peer range excludes the pinned `1.6.23`, and the whole install
died with `ERR_PNPM_PEER_DEP_ISSUES` before anything was built. Two more
followed once that was pinned — `@convex-dev/better-auth`'s stale
`better-auth@<1.6.0`, `better-call@1.3.7` vs the UI package's 2.x, and
`@triplit/logger`'s `typescript@^5`. `base-nextjs/package.json` now carries the
same `pnpm.overrides` + `pnpm.peerDependencyRules` block the vexcms monorepo
already ratified for the identical dependency set. `marketing-site` has no
`package.json` of its own, so base's covers both scaffolds.

This was pre-existing and invisible because it only bites once upstream
publishes a newer minor. It is exactly what a scaffold gate is for.

**2 — the negative self-test could never fail.** As first written,
`runNegativeRoutesSelfTest` returned `1` on BOTH branches. The Verify line
wraps it in `!`, so a broken route assertion would have inverted to a pass
forever — the precise vacuity the self-test exists to rule out. The exit code
now discriminates: `1` when the assertion caught the forced-dynamic
regression, `0` when it did not.

**3 — the sitemap assertion demanded content this gate cannot have.** It
asserted at least one `<loc>`, but the gate scaffolds with placeholder env and
no deployment, so `publishedSlugs` throws and `createVexSitemap` degrades to
`[]` *by design* (P-020). An empty `<urlset>` is the correct output here, so
the assertion is now well-formedness only; `verify-seo-routes.mjs` asserts real
slugs against `apps/www`, which has a live deployment.

**4 — template generated artifacts were stale, and regeneration is not
uniform.** Step 9's injection meant every template `vex.schema.ts` was missing
`updatedAt` on its content collections — not cosmetic, since the write path
stamps that column, so a scaffolded project fails Convex schema validation on
its first save. Regenerating standalone (`scripts/regen-template-schema.mjs`,
added here) is wrong twice over: prettier does not find the underscore-renamed
`_prettierrc`, so semicolons appear; and `marketing-site` cannot even resolve
its own config, because `convex/auth/options.ts` comes from base.

Regenerating inside the gate's own `--keep` scaffolds fixes both, and produced
a clean five-line diff for `marketing-site`. For `base-nextjs` it is still
lossy: the org tables are behind the conditional `{{ORGANIZATIONS_PLUGIN}}`
installer marker, so a `--bare` scaffold drops `organization`/`member`/
`invitation` and `session.activeOrganizationId` — tables the committed template
deliberately ships as a superset. Base therefore received only its one real
delta (`images.updatedAt`), copied verbatim from the generator's output.

Verify:

```bash
pnpm verify:scaffold
node scripts/verify-scaffold.mjs --negative-routes   # expect a reported failure and exit 1
```

Per AP-020 the gate is a real scaffold run in every supported mode — typecheck
plus build has already let five template defects ship. Per AP-013 the
`--negative-routes` run proves the gate can fail: it asserts against a
deliberately dynamic route and must exit 1.

Per AP-012 the scaffold gate asserts `/sitemap.xml` and `/robots.txt` are
structurally valid rather than that they list seeded slugs — the packed-tarball
scaffold has no live Convex deployment and builds with placeholder env (P-020),
so slug content is not observable there.

`pnpm verify:scaffold` builds several scaffolds and can exceed a 300s verify
budget; run it directly if the harness times it out.

### Step 9 — Automatic `updatedAt` on every collection [dev]

Sequenced last deliberately, not by oversight: every earlier step works without
it (Step 1's sitemap omits `<lastmod>` when `updatedAt` is `undefined`), and
this step changes the generated schema for *every* collection, so it is the one
change worth landing on its own with a clean build either side of it.

**Why the document cannot be inspected instead.** Convex's generated
`defineTable` is a closed object validator and `schemaValidation` defaults to
`true`, so writing a key the collection did not declare throws — it is not
silently dropped. A runtime `"updatedAt" in doc` check therefore answers the
wrong question: whether the *schema* permits the write is decided by
`config.collections[slug].fields`, not by any individual document. And a
per-collection opt-in leaves exactly the inconsistency this step exists to
remove — a sitemap, an admin column and an ordering key that work on some
collections and not others, with no way to know which without reading each
config.

**Why injection is the right mechanism.** `defineMediaCollection`
(`packages/file-storage-convex/src/config.ts:59-82`) already does this: it
merges required system fields into a collection's `fields` map with the user's
fields spread last so labels stay overridable. `defineCollection` gains the same
treatment for one field.

**Why optional and not required.** Three independent reasons, any one of which
is decisive: existing deployments have rows with no value, so a required field
fails the schema push; the Convex dashboard and `npx convex import` create rows
without running application code, so a required field would make them unable to
insert; and `v.optional` keeps this an additive, non-breaking schema change for
every project that already exists.

**What this does NOT do.** `updatedAt` is maintained by vexcms's own write path,
so it is blind to the same four bypass cases as the admin-panel purge — Convex
dashboard edits, `npx convex import`, streaming import, and any raw `ctx.db`
write. It is therefore a good signal for `<lastmod>`, an admin "last edited"
column, and ordering, and a **useless** one for change detection. Anything that
needs to notice arbitrary changes must ride Convex's own cache invalidation
instead (see Out of Scope).

- [ ] `packages/core/src/collections/constants.ts` — `RESERVED_COLLECTION_FIELDS` including `updatedAt`
- [ ] `packages/core/src/collections/types.ts` — reserved-key compile error on `TFieldSlug`, mirroring `defineGlobal`'s D15 pattern
- [ ] `packages/core/src/collections/config.ts` — inject `updatedAt` in `defineCollection`, user fields spread last
- [ ] `packages/core/src/collections/config.test.ts` — injection, opt-out, and a user field colliding
- [ ] `packages/core/src/collections/validator.ts` — no change needed; confirm `v.optional(v.number())` falls out of the existing per-field loop
- [ ] `packages/core/src/collections/validator.test.ts` — regression test pinning that emission
- [ ] `packages/core/src/api/test/convex/schema.ts` — add `updatedAt: v.optional(v.number())` to the `posts` fixture, or `convex-test`'s schema validation rejects every stamped write below
- [ ] `packages/core/src/api/create/server.ts` — stamp `updatedAt` on insert
- [ ] `packages/core/src/api/update/server.ts` — stamp `updatedAt` on patch
- [ ] `packages/core/src/api/globals/upsert.server.ts` — **cannot** carry it; `vex_globals` is one shared `{ slug, data }` table. Prose + a test pinning that nothing is written
- [ ] `packages/core/src/api/create/server.test.ts`
- [ ] `packages/core/src/api/update/server.test.ts`
- [ ] `packages/core/src/api/globals/upsert.server.test.ts`
- [ ] `packages/core/src/types/generateVexTypes.ts` — no change needed; `updatedAt?: number` falls out of the existing interface generator
- [ ] `packages/core/src/types/generateVexTypes.test.ts` — regression test pinning that emission
- [ ] `apps/www` + `apps/test` — run `vex dev` to regenerate `vex.schema.ts` / `vex.types.ts`, commit the diff

The opt-out is `defineCollection({ timestamps: false })`, for a collection that
genuinely must not carry one (an append-only log, or a table whose shape is
dictated by an external system).

#### packages/core/src/collections/constants.ts

1 edit — `CORE_ADMIN_FIELDS`/`CoreAdminField` (lines 1–28) are unchanged.
Appended at the end of the file. This is intentionally a *second* `as const`
map beside `CORE_ADMIN_FIELDS`, not a P-003 violation ("reuse an existing map
instead of adding a parallel one") — the two reserve different kinds of keys.
`CORE_ADMIN_FIELDS` names native Convex system columns (`_id`,
`_creationTime`) present on every document with no `fields` entry at all.
`RESERVED_COLLECTION_FIELDS` names an ordinary `fields` entry that
`defineCollection()` itself injects and that IS subject to Convex schema
validation — conflating the two would put `updatedAt` in the same union as
`_id`/`_creationTime`, which is wrong on both counts.

**1 — append after `CoreAdminField`.**

```ts
/**
 * Field keys that `defineCollection()` injects onto every collection's
 * `fields` map and that therefore cannot be used as user-defined field
 * names.
 *
 * Unlike {@link CORE_ADMIN_FIELDS} — native Convex system columns present on
 * every document regardless of any field declaration — these are ordinary
 * `fields` entries `defineCollection()` adds itself. Currently just
 * `updatedAt`, the auto-maintained last-write timestamp (Step 9,
 * `2026-09-04-seo-prerendering-and-lifecycle-hooks`).
 */
export const RESERVED_COLLECTION_FIELDS = {
  /** Auto-maintained last-write timestamp, stamped by `create`/`update` on every write. */
  updatedAt: {
    slug: "updatedAt",
  },
} as const;

/**
 * Union of the field slugs `defineCollection()` injects and therefore
 * reserves. Resolves to `"updatedAt"`.
 *
 * A user-defined field using one of these keys is a compile-time error in
 * `defineCollection()` (mirroring `defineGlobal`'s `ReservedGlobalFieldKey`
 * guard — D15, `.agent/docs/specs/35-globals-system/spec.md`) and a runtime
 * error for JS callers that bypass the type system.
 *
 * @see {@link RESERVED_COLLECTION_FIELDS} for the full map of reserved keys
 */
export type ReservedCollectionFieldKey =
  (typeof RESERVED_COLLECTION_FIELDS)[keyof typeof RESERVED_COLLECTION_FIELDS]["slug"];
```

#### packages/core/src/collections/types.ts

2 edits — `AdminCollectionConfigInput`, `CollectionConfig`,
`RelationshipPreviewProps`, and everything else in the file is unchanged.

**1 — import.** Add `ReservedCollectionFieldKey` to the existing
`./constants` import (currently `import { CoreAdminField } from
"./constants";`):

```ts
import { CoreAdminField, ReservedCollectionFieldKey } from "./constants";
```

**2 — `timestamps` option on `CollectionConfigInput`.** Add after the
existing `meta?: TCollectionMeta;` property (line 279), before the
interface's closing brace:

```ts
  /**
   * When `false`, opts this collection out of the auto-maintained
   * `updatedAt` timestamp `defineCollection()` otherwise injects into every
   * collection's `fields` (Step 9). Use for a collection that genuinely
   * must not carry one — an append-only log, or a table whose shape is
   * dictated by an external system.
   *
   * The constraint `[TFieldSlug & ReservedCollectionFieldKey] extends
   * [never]` is enforced in `defineCollection`'s function signature — a
   * compile-time error is emitted if a field is named `updatedAt` —
   * mirroring `GlobalConfigInput`'s identical `ReservedGlobalFieldKey` guard.
   *
   * @defaultValue `true`
   */
  timestamps?: boolean;
```

#### packages/core/src/collections/config.ts

3 edits — `populateCollectionFieldMeta` (the field-meta-stamping helper) and
the return object (`interfaceName`, `admin`, `labels`, `meta` defaults, lines
87–121) are unchanged; `fields: fields` in that return object continues to
reference the local computed by edit 3 below.

**1 — imports.** Add `number` to the existing `../fields` import and
`ReservedCollectionFieldKey` to the existing `./types` import:

```ts
import { AdminField, CollectionFieldMeta, ComponentHKT, number } from "../fields";
import { CollectionSlug } from "../types";
import { toTitleCase, plural } from "../utils";
import { CollectionConfigInput, CollectionConfig, ReservedCollectionFieldKey } from "./types";
import { slugToPascalCase } from "./utils";
```

**2 — signature, replacing lines 65–85 (the `defineCollection` declaration
through its opening brace).** Mirrors `defineGlobal`
(`packages/core/src/globals/config.ts:44-61`) exactly, including the
`string extends TFieldSlug` escape hatch — which the D15 draft (the
`.agent/docs/specs/35-globals-system/spec.md` write-up) does NOT show, but
the real shipped `defineGlobal` DOES carry, and it is REQUIRED here: unlike
every ordinary `defineCollection()` call (an object literal, so `TFieldSlug`
infers a literal-key union), `packages/better-auth/src/adapter.ts:178-186`
calls `defineCollection<AuthFieldMeta, AuthCollectionMeta>({ fields, ... })`
where `fields` is built by a loop (`addAuthCollectionFields`, `:222-226`)
over a runtime-discovered attribute map and typed `Record<string,
AdminField<AuthFieldMeta>>` — a widened index signature, never a field
literal. Verified empirically with `tsc`: without the escape hatch,
`[TFieldSlug & ReservedCollectionFieldKey] extends [never]` evaluates to
`false` when `TFieldSlug` widens to plain `string` (TypeScript collapses
`string & "updatedAt"` to `"updatedAt"`, not `never`), so the auth adapter's
own call would hit the reserved-key error branch and fail to compile.

```ts
export function defineCollection<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TFieldSlug extends string = string,
  TComponent extends ComponentHKT = ComponentHKT,
>(
  config: string extends TFieldSlug
    ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>
    : [TFieldSlug & ReservedCollectionFieldKey] extends [never]
      ? CollectionConfigInput<TFieldMeta, TCollectionMeta, TCollectionSlug, TFieldSlug, TComponent>
      : {
          fields: {
            [K in TFieldSlug &
              ReservedCollectionFieldKey]: "Field name is reserved — defineCollection injects \"updatedAt\" automatically; opt out with { timestamps: false }";
          };
        },
): CollectionConfig<
  TFieldMeta & CollectionFieldMeta,
  TCollectionMeta,
  TCollectionSlug,
  TFieldSlug,
  TComponent
> {
```

**3 — body opening, replacing line 86 (`const fields =
populateCollectionFieldMeta({ config });`).**

```ts
  // Runtime guard for JS consumers — the compile-time branch above only
  // protects TypeScript callers whose `fields` object is an object literal
  // with statically inferable literal keys (mirroring `defineGlobal`'s).
  //
  // `meta.locked` is the discriminator, and it is load-bearing: a bare
  // `"updatedAt" in fields` check REJECTS better-auth's own field and breaks
  // the auth adapter outright (measured — its `defineCollection` call threw).
  // An adapter may legitimately declare a reserved key because the external
  // system it mirrors owns that column; a user-authored field is never locked,
  // so it still throws.
  const reservedKeys: ReservedCollectionFieldKey[] = ["updatedAt"];
  for (const key of reservedKeys) {
    const declared = input.fields[key as TFieldSlug] as AdminField<TFieldMeta> | undefined;
    if (declared === undefined) continue;
    const meta: Record<string, unknown> = declared.meta;
    if (meta.locked === true) continue;
    throw new Error(
      `defineCollection: field key "${key}" is reserved and cannot be used in collection "${input.slug}". defineCollection injects it automatically; set { timestamps: false } to opt out.`,
    );
  }
  const input = config as CollectionConfigInput<
    TFieldMeta,
    TCollectionMeta,
    TCollectionSlug,
    TFieldSlug,
    TComponent
  >;

  // Three reasons not to inject, all about ownership:
  // - `timestamps: false` — the project opted out explicitly.
  // - `"updatedAt" in input.fields` — already declared. This is how
  //   better-auth's OWN `updatedAt` survives: its adapter populates the key
  //   from the auth table's real schema attribute (always `meta.locked`)
  //   before calling here.
  // - `meta.protected === true` — the whole collection is auth-adapter-owned
  //   (`isProtected = slug !== "user"`, `packages/better-auth/src/adapter.ts`).
  //   vexcms's `create`/`update` never write those rows.
  const meta: Record<string, unknown> = input.meta ?? {};
  const skipInjection =
    input.timestamps === false || "updatedAt" in input.fields || meta.protected === true;
  const fieldsWithTimestamp = skipInjection
    ? input.fields
    : {
        ...input.fields,
        updatedAt: number({
          admin: { position: "sidebar", readOnly: true },
          // `number()` defaults to `0`. An unsaved document has no update
          // time and epoch is a lie, so the injected field carries no default:
          // `getCollectionDefaultValues` then yields `undefined` on create and
          // the stored value on edit.
          defaultValue: undefined,
          label: "Updated At",
          required: false,
        }) as AdminField<TFieldMeta>,
      };

  // Runs the injected field through the SAME `collectionSlug` meta-stamping as
  // every other field.
  const fields = populateCollectionFieldMeta({
    config: { ...input, fields: fieldsWithTimestamp },
  });
```

#### packages/core/src/collections/config.test.ts

New file.

```ts
import { describe, it, expect } from "vitest";
import { defineCollection, text, number } from "../index";
import type { AdminField } from "../fields";

describe("defineCollection — updatedAt injection", () => {
  it("injects an optional updatedAt number field by default", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.fields.updatedAt).toBeDefined();
    expect(posts.fields.updatedAt.type).toBe("number");
    expect(posts.fields.updatedAt.required).toBe(false);
  });

  it("omits updatedAt when timestamps: false", () => {
    const log = defineCollection({
      slug: "log",
      fields: { message: text({ required: true }) },
      timestamps: false,
    });
    expect(log.fields.updatedAt).toBeUndefined();
  });

  it("stamps the injected field's meta.collectionSlug like every other field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(posts.fields.updatedAt.meta).toMatchObject({ collectionSlug: "posts" });
  });

  it("throws at runtime when a user field is literally named updatedAt", () => {
    expect(() =>
      defineCollection({
        slug: "posts",
        fields: { updatedAt: text({ label: "Updated At" }) } as any,
      }),
    ).toThrow(/reserved/);
  });

  it("does not overwrite or duplicate an already-declared updatedAt field (auth-adapter shape)", () => {
    // Mirrors how `betterAuthAdapter` calls `defineCollection`: a `fields`
    // object typed as a widened `Record<string, AdminField>` (not a field
    // literal), already carrying its OWN locked `updatedAt`
    // (`packages/better-auth/src/adapter.ts:115-186,255-269`).
    const lockedUpdatedAtField = number({
      required: false,
      admin: { readOnly: true },
      meta: { locked: true },
    });
    const authFields: Record<string, AdminField> = {
      email: text({ required: true }),
      updatedAt: lockedUpdatedAtField,
    };
    const user = defineCollection({ slug: "user", fields: authFields });
    expect(user.fields.updatedAt).toBe(lockedUpdatedAtField); // reference untouched — never replaced
  });
});
```

#### packages/core/src/collections/validator.ts

No change. `collectionConfigToVexSchema`'s per-field loop (`:115-117`)
already calls `adminFieldToValidator({ field })` for every entry in
`collection.fields`, and `numberFieldToValidator`
(`packages/core/src/fields/number/validator.ts:39-44`) already emits
`"v.optional(v.number())"` for any `number` field with `required: false` —
exactly the shape `defineCollection` injects (previous file). Once
`updatedAt` is a real entry in `collection.fields`, this file emits it for
free; `validator.test.ts` below pins the emergent behavior as a regression
guard.

#### packages/core/src/collections/validator.test.ts

1 edit — everything above (`getIncomingRelationships`, compound/relationship
auto-index, auto search index) is unchanged. Appended after the existing
`describe("collectionConfigToVexSchema — auto search index", ...)` block,
which ends at line 373 (end of file).

```ts
// ─── injected updatedAt field (Step 9) ────────────────────────────────────

describe("collectionConfigToVexSchema — injected updatedAt field", () => {
  it("emits v.optional(v.number()) for the injected updatedAt field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { title: text() },
    });
    const config = defineConfig({ collections: [posts] });
    const contents = collectionConfigToVexSchema({ collection: posts, config });
    expect(contents).toContain("updatedAt: v.optional(v.number()),");
  });

  it("does not emit updatedAt when timestamps: false", () => {
    const log = defineCollection({
      slug: "log",
      fields: { message: text() },
      timestamps: false,
    });
    const config = defineConfig({ collections: [log] });
    const contents = collectionConfigToVexSchema({ collection: log, config });
    expect(contents).not.toContain("updatedAt");
  });
});
```

#### packages/core/src/api/create/server.ts

1 edit — the JSDoc, `CreateServerArgs` interface, and the access-enforcement
block are unchanged. Replacing lines 90–94 (`const id = await
args.ctx.db.insert(...); return id;`).

```ts
  // TODO: implement
  // 1. Resolve the target `CollectionConfig`:
  //    `args.config.collections.find((c) => c.slug === args.collection)`.
  // 2. Decide whether to stamp:
  //    a. No matching collection, no `fields.updatedAt`, or
  //       `fields.updatedAt.meta?.locked === true` → do not stamp. The
  //       locked case is better-auth's OWN `updatedAt`
  //       (`packages/better-auth/src/adapter.ts:261,269`) — this insert path
  //       must never write it, even if `create()` is ever called against an
  //       auth-managed slug.
  //    b. Otherwise → `data = { ...args.data, updatedAt: Date.now() }`.
  //    → else `data = args.data`, unchanged.
  // 3. `const id = await args.ctx.db.insert(args.collection as
  //    TableNamesInDataModel<DataModel>, data);`
  // 4. → `return id;`
  // Edge cases:
  // - Stamp AFTER the access check above, never before — `hasPermission`'s
  //   payload-dependent rules (DD 44) must see exactly what the caller
  //   sent, not a value this function added.
  throw new Error("Not implemented");
```

#### packages/core/src/api/update/server.ts

1 edit — the JSDoc, `UpdateServerArgs` interface, and the access-enforcement
block (which reads the stored doc, not `args.data`) are unchanged. Replacing
line 95 (`await args.ctx.db.patch(args.id, args.data);`).

```ts
  // TODO: implement
  // 1. Resolve the target `CollectionConfig`:
  //    `args.config.collections.find((c) => c.slug === args.collection)`.
  // 2. Decide whether to stamp — identical rule to `create()` (this step,
  //    `packages/core/src/api/create/server.ts`):
  //    a. No matching collection, no `fields.updatedAt`, or
  //       `fields.updatedAt.meta?.locked === true` → do not stamp
  //       (better-auth's own field, `packages/better-auth/src/adapter.ts:261,269`).
  //    b. Otherwise → `data = { ...args.data, updatedAt: Date.now() }`.
  //    → else `data = args.data`, unchanged.
  // 3. `await args.ctx.db.patch(args.id, data);`
  // Edge cases:
  // - A patch that touches only non-content bookkeeping still bumps
  //   `updatedAt` — there is no way to distinguish "no observable change"
  //   from a genuine content edit at this layer.
  throw new Error("Not implemented");
```

#### packages/core/src/api/globals/upsert.server.ts

No change — dropped, per this step's own escape hatch ("if globals genuinely
cannot [carry the field], say so in prose and drop the file rather than
inventing a mechanism"). `vex_globals` is a single table SHARED by every
registered global — `defineTable({ slug: v.string(), data: v.any() })`
(`.agent/docs/specs/35-globals-system/spec.md` D1/D3; the real fixture table
at `packages/core/src/api/test/convex/schema.ts:53-56` matches). Unlike a
collection, there is no per-global `defineTable(...)` generated from
`GlobalConfig.fields` — every global's user fields live inside the single
`data: v.any()` blob, validated only by a per-global Zod schema
(`getGlobalInputSchema`) at the API layer, never by a Convex column.

Stamping `updatedAt` as a real system column on `vex_globals` would require
extending the SHARED table definition in
`packages/core/src/schema/generateVexSchema.ts` — not in this step's file
list and out of scope for a `[dev]` step scoped to
`defineCollection`/`create`/`update`. Stashing it inside the `data` blob
instead is not equivalent: it would require `STRIPPED_KEYS`
(`packages/core/src/api/globals/upsert.server.ts:11`) and
`getGlobalInputSchema`'s Zod schema to both learn about a field no
`GlobalConfigInput` declares, entangling a per-collection concern with the
globals system's separate `ReservedGlobalFieldKey`/flat-document machinery —
a real design on its own, not a one-line addition. `upsertGlobal` is
therefore unchanged; the test below pins that as the current, documented
contract.

#### packages/core/src/api/test/convex/schema.ts

Not a production file, but the stamped writes below cannot be tested without it.
`convex-test` enforces the fixture schema exactly as a real deployment would, so
a `create`/`update` that now writes `updatedAt` into `posts` is rejected until
the fixture declares the column. Optional, matching what `defineCollection`
generates.

1 edit — every other table in the fixture is unchanged.

**1 — add `updatedAt` to the `posts` table, beside the existing `body` field.**

```ts
export const posts = defineTable({
  title: v.string(),
  slug: v.string(),
  body: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  author: v.optional(v.array(v.id("authors"))),
})
  .searchIndex("search_title", { searchField: "title" })
  .index("by_slug", ["slug"]);
```

#### packages/core/src/api/create/server.test.ts

1 edit — everything above (the `create (server)` and `create (server) —
access enforcement`/`payload-dependent rules` describe blocks) is unchanged.
Appended after the file's last describe block (line 376, end of file).

Companion fixture edit, not in this step's file list but required for the
first assertion below to run against a real `ctx.db.insert` (Convex's
`schemaValidation: true` default rejects an undeclared column): add
`updatedAt: v.optional(v.number())` to the `posts` table in
`packages/core/src/api/test/convex/schema.ts:15-23`.

```ts
describe("create (server) — updatedAt stamp", () => {
  test("stamps updatedAt on insert when the collection declares the field", async () => {
    const t = convexTest(schema, modules);
    const stampedConfig = {
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text(), slug: text(), featured: checkbox() },
        }),
      ],
    } as unknown as VexConfig;
    const before = Date.now();
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await create({
        ctx,
        config: stampedConfig,
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      });
      const doc = await ctx.db.get(id as never);
      expect(doc?.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  test("does not stamp when the collection has no updatedAt field (fixtureConfig)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      const id = await create({
        ctx,
        config: fixtureConfig, // { collections: [] } — no matching collection
        collection: "posts",
        data: { title: "Hello", slug: "hello" },
      });
      const doc = await ctx.db.get(id as never);
      expect(doc?.updatedAt).toBeUndefined();
    });
  });
});
```

#### packages/core/src/api/update/server.test.ts

1 edit — everything above (the `update (server)` and `update (server) —
access enforcement` describe blocks) is unchanged. Appended after the file's
last describe block (line 447), before the `withTransaction` helper (line
449) it reuses. Relies on the same companion `updatedAt: v.optional(v.number())`
fixture-schema edit noted for `create/server.test.ts` above.

```ts
describe("update (server) — updatedAt stamp", () => {
  test("stamps updatedAt on patch when the collection declares the field", async () => {
    const stampedConfig = {
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text(), slug: text(), featured: checkbox() },
        }),
      ],
    } as unknown as VexConfig;
    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      const before = Date.now();
      await update({ ctx, id, collection: "posts", config: stampedConfig, data: { title: "New" } });
      const doc = await ctx.db.get(id);
      expect(doc?.updatedAt).toBeGreaterThanOrEqual(before);
    });
  });

  test("does not stamp when the collection has no updatedAt field (fixtureConfig)", async () => {
    await withTransaction(async (ctx) => {
      const id = await ctx.db.insert("posts", { title: "Old", slug: "old" });
      await update({ ctx, id, collection: "posts", config: fixtureConfig, data: { title: "New" } });
      const doc = await ctx.db.get(id);
      expect(doc?.updatedAt).toBeUndefined();
    });
  });
});
```

#### packages/core/src/api/globals/upsert.server.test.ts

1 edit — the four existing `it(...)` blocks are unchanged. Appended after
the existing `describe("updateGlobal (server)", ...)` block (ends at line
111, end of file). Pins the previous file's "dropped" decision as an
explicit, checked contract rather than a silent gap.

```ts
describe("updateGlobal (server) — updatedAt (Step 9)", () => {
  it("never writes an updatedAt key — globals cannot carry it (see upsert.server.ts's Step 9 note)", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await upsertGlobal({
        ctx,
        slug: "siteSettings",
        data: { siteName: "My Site" },
        config: fixtureConfig,
      });
    });
    const rows = (await t.run((ctx: GenericMutationCtx<GenericDataModel>) =>
      ctx.db.query("vex_globals").collect(),
    )) as unknown as GlobalRow[];
    expect(rows[0].data.updatedAt).toBeUndefined();
  });
});
```

#### packages/core/src/types/generateVexTypes.ts

No change. `generateVexTypes` delegates per-collection interface generation
to `collectionConfigToInterface`
(`packages/core/src/collections/interfaceGen.ts:31-92`), whose field loop
(`:38-82`) is already generic over every entry in `collection.fields` — it
reads `field.interfaceType`/`field.required` per key with no field-type
special-casing beyond `select`/`group`/`blocks`. Once `updatedAt` is a real
`number({ required: false })` entry in `collection.fields` (this step's
`config.ts` injection), the loop's closing line —
`` `${fieldKey}${field.required ? "" : "?"}: ${fieldType}` `` — emits
`updatedAt?: number` for free, for every collection, with zero changes to
this file. `generateVexTypes.test.ts` below pins the emergent behavior.

#### packages/core/src/types/generateVexTypes.test.ts

1 edit — everything above is unchanged. Appended after the file's last
describe block (`generateVexTypes - index-less collections`, ends at line
591, end of file).

```ts
// ─── injected updatedAt field (Step 9) ────────────────────────────────────

describe("generateVexTypes — injected updatedAt field", () => {
  it("emits updatedAt?: number on every generated document interface", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text({ required: true }) } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("updatedAt?: number");
  });

  it("omits updatedAt when the collection opts out with timestamps: false", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "log",
          fields: { message: text({ required: true }) },
          timestamps: false,
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).not.toContain("updatedAt");
  });
});
```

Three things this step got wrong on the first pass, all found by running it:

**1 — `meta.protected` has to be a skip reason, not just `meta.locked`.** The
plan had only the per-field `"updatedAt" in fields` check. That is enough for
`user`, `session`, `account`, `verification`, and `apikey`, which all declare
their own `updatedAt`. It is NOT enough for `jwks`, which declares none — so
the injection added a column to an auth-owned table, and `vex dev` emitted
`updatedAt: v.optional(v.number())` plus `updatedAt?: number` for a value
nothing will ever populate. The collection-level `meta.protected` flag the auth
adapter already sets is the right gate.

**2 — the runtime guard rejected the auth adapter.** A bare
`"updatedAt" in fields` throw fires on better-auth's own legitimately-declared
field. `meta.locked` distinguishes "an adapter mirrors a column it owns" from
"a user typed a reserved name".

**3 — `number()`'s `0` default leaked into create forms.**
`getCollectionDefaultValues` seeds form state from `field.defaultValue`, so
every create form carried `updatedAt: 0` — a document claiming it was last
updated at the epoch. The injected field overrides `defaultValue: undefined`.
Skipping `readOnly` fields wholesale was the wrong fix: those fields render
from form state, so edit mode would have stopped displaying them.

Also corrected: `CollectionConfig["fields"]` now intersects
`Partial<Record<ReservedCollectionFieldKey, ...>>`, because the resolved type
otherwise claimed `updatedAt` does not exist on a config that carries it, while
`stampUpdatedAt` read it anyway. `Partial` is the honest shape — `timestamps:
false` and `meta.protected` both make it absent, which is exactly why the
helper treats a missing entry as "do not stamp".

Verify:

```bash
pnpm --filter @vexcms/core test
pnpm --filter www exec vex dev --once
git diff --stat apps/www/convex/vex.schema.ts apps/www/src/vex.types.ts
```

`vex dev --once` regenerates and exits, unlike the watching `vex dev`. The diff
must show `updatedAt: v.optional(v.number())` added to every content collection
in `vex.schema.ts` and NOT to the better-auth tables, which own their own
`updatedAt` written by better-auth's adapter.

Then, manual (needs a human in the admin panel): save a page and confirm
`updatedAt` moves; edit the same document in the Convex dashboard and confirm it
does NOT. The second half is the documented limitation, not a bug — a dashboard
write never runs application code.

## Verification

Run from the repo root, in order. Every command must pass before the spec is done.

1. `pnpm typecheck` — all packages and apps.
2. `pnpm test` — all packages.
3. `pnpm lint`.
4. `pnpm build` — full turbo build.
5. `pnpm --filter www build` — the route table MUST show `●`/`○` for the public
   routes and `ƒ` for `/admin/[[...path]]`, `/auth/[pathname]` and
   `/api/auth/[...all]`. A public route still reading `ƒ` means a `cookies()`
   read or an uncached Convex read survived on its render path.
6. `pnpm verify:scaffold` — includes the AP-020 gate: a real scaffold run in
   every supported mode, built, with the route table asserted, plus the AP-013
   negative self-test proving the gate fails when a public route is dynamic.

Baseline for comparison, measured 2026-09-04 before this spec: all 8 `apps/www`
routes `ƒ`, `Cache-Control: private, no-cache, no-store, max-age=0,
must-revalidate`, and `.next/prerender-manifest.json` containing only
`/_global-error`.

## Deferred follow-ups

What this spec deliberately did not do, recorded so it is not rediscovered from
scratch. Both are tracked in `.agent/docs/product/backlog.md`.

**Tag-based cache control.** This spec delivers path-based invalidation only:
`revalidatePath`, driven by `routes.map`. Next also offers `cacheTag` /
`revalidateTag` / `updateTag` / `cacheLife` / `'use cache'`, none of which are
used. The gap bites wherever a document renders on a URL that `routes.map`
cannot derive from the document itself — a category listing, a nav built from a
collection, a "related posts" widget.

Assessed after this spec shipped, by enabling `cacheComponents: true` on
`apps/www` and building until every class of error was enumerated: four
blockers, all with known remedies, ~2–3 days. The notable finding is that
`cacheComponents` **forbids** `export const revalidate`, moving lifetime to a
runtime `cacheLife()` call — which would give back the configurable cache TTL
that was impossible here, and is precisely why `revalidateSeconds` was removed
from `VexRoutesConfig`.

Deferred because `cacheComponents` is an app-wide switch that also enables
Partial Prerendering, so it changes how every route renders including the
cookie-driven admin panel, and cannot be adopted per route. Tags are additive —
neither `routes.map` nor the revalidate route needs to change to add them — so
waiting costs nothing. One blocker was fixed immediately because it was a live
bug independent of any of this: `Math.random()` in a `useState` initializer in
`packages/react/src/components/ui/sidebar.tsx`, now derived from `React.useId()`.

Full assessment: `.agent/docs/research/nextjs-cache-components-and-tags.md`.

**Server-side revalidation dispatch.** A write that never passes through the
admin panel — a Convex dashboard edit, `npx convex import`, streaming import, or
a tab closed before its fire-and-forget purge landed — is covered only by the
1-hour ISR backstop and the manual **Revalidate** control. Ratified out of scope
in Design Decisions; still unassessed.
