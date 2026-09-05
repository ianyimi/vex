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
11. **Anything reading Convex at build time degrades to empty, never throws.**
    P-020 builds CI with placeholder env, so `generateStaticParams`, sitemap and
    robots must all survive an unreachable deployment. Pages then render on
    demand — correct, just not prerendered.
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
16. **Templates are the deliverable, not `apps/www`.** The defect originates in
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
mid-request. The admin panel's Revalidate control (Step 7) is the escape hatch, and the configured
`revalidate` interval is the backstop.


## Implementation


### Step 1 — Metadata routes and the empty-200 fix [agent]

Why: Highest SEO value per hour, entirely additive, and independent of every
other step. Fixes the one defect that actively costs rankings — a soft 404
served as HTTP 200 — and adds the metadata surface that is absent from the
served HTML today. Depends on nothing here, so it can land and ship alone.

- [ ] `packages/core/src/api/publishedSlugs/server.ts` — slug + `updatedAt` reader for sitemaps
- [ ] `packages/core/src/api/publishedSlugs/server.test.ts`
- [ ] `packages/core/src/api/server.ts` — register `publishedSlugs` in `collectionsApi`
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
`getBySlug`. Convex documents carry no framework-level "last modified" field,
so `updatedAt` is `_creationTime` — the one timestamp every document has —
documented as a known approximation rather than a true last-write time.

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

/** One collection document's slug plus its `_creationTime`-derived timestamp. */
export interface PublishedSlug {
  /** The document's `slug` field. */
  slug: string;
  /**
   * `_creationTime` of the document — Convex's built-in system timestamp.
   * An approximation of "last modified": vexcms collections do not track a
   * separate update timestamp, so this is the closest signal `<lastmod>`
   * generation has.
   */
  updatedAt: number;
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
 * @returns Promise resolving to `{ slug, updatedAt }` for every matching document.
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
      updatedAt: (doc as unknown as { _creationTime: number })._creationTime,
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
        expect(typeof entry.updatedAt).toBe("number");
      }
    });
  });

  test("skips documents with no string slug field", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx: GenericMutationCtx<typeof schema>) => {
      await ctx.db.insert("posts", { title: "No slug" });
      await ctx.db.insert("posts", { title: "Has slug", slug: "has-slug" });

      const result = await publishedSlugs({ ctx, collection: "posts", access: { bypass: true } });

      expect(result).toEqual([{ slug: "has-slug", updatedAt: expect.any(Number) }]);
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

1 edit. Everything else in the file is unchanged.

**1 — export `publishedSlugs` beside the other single-operation server exports.**
Add after the existing `export { search } from "./search/server";` block:

```ts
export { publishedSlugs } from "./publishedSlugs/server";
export type { PublishedSlugsServerArgs, PublishedSlug } from "./publishedSlugs/server";
```

**2 — register it in `collectionsApi`'s returned object**, alongside `find`,
`get`, and `search` (same file, `collectionsApi` body). Add after the `search`
query registration and before the `// MUTATIONS` comment:

```ts
    publishedSlugs: query({
      args: {
        collection: v.string(),
        limit: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        return await publishedSlugs({
          ctx,
          collection: args.collection as CollectionSlug,
          access: { bypass: true },
          limit: args.limit,
        });
      },
    }),
```

`publishedSlugs` is always anonymous-readable (sitemaps have no caller
identity to resolve), so this registration bypasses access unconditionally
rather than threading `getAuth` through — unlike `find`/`get`/`search`, which
enforce per-caller RBAC.

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

  let entries: { slug: string; updatedAt: number }[] = []
  try {
    entries = await fetchQuery(api.pages.publishedSlugs, {})
  } catch {
    entries = []
  }

  const pageEntries: MetadataRoute.Sitemap = entries
    .filter((entry) => entry.slug !== "home")
    .map((entry) => ({
      url: `${baseUrl}/${entry.slug}`,
      lastModified: new Date(entry.updatedAt),
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

Verify: `pnpm --filter www build && pnpm --filter www start`, then:

```bash
curl -s http://127.0.0.1:3131/ | grep -o '<meta name="description"[^>]*>\|property="og:title"[^>]*>\|property="og:image"[^>]*>\|rel="canonical"[^>]*>'
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3131/this-slug-does-not-exist   # expect 404
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3131/sitemap.xml                # expect 200
curl -s http://127.0.0.1:3131/sitemap.xml | grep -o '<loc>[^<]*</loc>'                    # expect real seeded slugs
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3131/robots.txt                  # expect 200
```

### Step 2 — `@vexcms/next` cached read client and SEO factories [dev]

Why: The seam every later step consumes. The cached client drops
`fetchQuery`'s hard-coded `no-store` — the reason no route can prerender today
— and the factories let templates express correct SEO in three lines per
file.

- [ ] `packages/next/package.json` — add `./cache` and `./seo` export entries, a `test` script, and `vitest`/`@vitest/coverage-v8` dev deps
- [ ] `packages/next/vitest.config.ts` — required for the new test script; the package shipped no test runner
- [ ] `packages/next/src/cache/types.ts` — `VexCacheOptions`, `VexServerClient`
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
export interface VexCacheOptions {
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

import type { VexCacheOptions, VexServerClient } from "./types";

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
 * @param props - Client configuration.
 * @param props.url - Convex deployment URL. Defaults to
 *   `process.env.NEXT_PUBLIC_CONVEX_URL`.
 * @param props.skipConvexDeploymentUrlCheck - Skip Convex's deployment URL
 *   format check, for self-hosted backends.
 * @returns A {@link VexServerClient} whose `query` method is deduped per request.
 * @throws {Error} When no `url` is given and `process.env.NEXT_PUBLIC_CONVEX_URL`
 *   is unset.
 */
export function createVexServerClient(props: VexCacheOptions = {}): VexServerClient {
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
export type { VexCacheOptions, VexServerClient } from "./types";
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
 * @param props.getUpdatedAt - Extracts the last-modified timestamp (ms epoch)
 *   from one item.
 * @returns A `sitemap()` function suitable as `app/sitemap.ts`'s default export.
 */
export function createVexSitemap<Query extends FunctionReference<"query">>(props: {
  client: VexServerClient;
  query: Query;
  args?: OptionalRestArgs<Query>[0];
  toUrl: (slug: string) => string;
  getSlug: (item: ArrayItem<FunctionReturnType<Query>>) => string;
  getUpdatedAt: (item: ArrayItem<FunctionReturnType<Query>>) => number;
}): () => Promise<MetadataRoute.Sitemap> {
  return async function sitemap() {
    // TODO: implement
    // 1. try:
    //    a. `const items = await props.client.query(props.query, props.args ?? {})`
    //    b. → `return items.map((item) => ({
    //         url: props.toUrl(props.getSlug(item)),
    //         lastModified: new Date(props.getUpdatedAt(item)),
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
      vi.fn().mockResolvedValue([{ slug: "about", updatedAt: 1_700_000_000_000 }]),
    );
    const sitemap = createVexSitemap({
      client,
      query: fakeQuery,
      toUrl: (slug) => `https://example.com/${slug}`,
      getSlug: (item) => item.slug,
      getUpdatedAt: (item) => item.updatedAt,
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
      getUpdatedAt: (item) => item.updatedAt,
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
export function createVexRobots(props: { siteUrl: string }): () => MetadataRoute.Robots {
  return function robots() {
    // TODO: implement
    // 1. → `return { rules: { userAgent: "*", allow: "/" }, sitemap: \`${props.siteUrl}/sitemap.xml\` }`
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
export type { VexCacheOptions, VexServerClient } from "./cache/types";
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

`RevalidateOperation` reuses `CRUD_ACTIONS`/`CrudAction` (`Extract<CrudAction,
"create" | "update" | "delete">`) rather than a parallel constant map — P-003.
`sanitizeConfigForClient`'s `stripNonSerializable` already nulls every
function value recursively when a `VexConfig` crosses the RSC boundary (P-005,
`config/sanitizeConfig.ts:66-68`), so `revalidate.mapper` — server-only by
design — is stripped automatically with zero code change; `config/sanitizeConfig.ts`
is not touched by this step.

- [ ] `packages/core/src/revalidate/types.ts` — `VexRouteMapper`, `VexRevalidateConfig`, `VexRevalidateTarget`
- [ ] `packages/core/src/revalidate/resolveTargets.ts`
- [ ] `packages/core/src/revalidate/resolveTargets.test.ts`
- [ ] `packages/core/src/revalidate/index.ts`
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
export type RevalidateOperation = Extract<CrudAction, "create" | "update" | "delete">;

/**
 * User-supplied function mapping a document to the public paths that render
 * it. Configured once in `vex.config.ts`'s `revalidate.mapper` and invoked by
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
export interface VexRevalidateConfig {
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
export interface VexRevalidateTarget {
  /** Deduped, order-stable public paths to pass to `revalidatePath`. */
  paths: string[];
  /**
   * Errors thrown by `mapper`, one per failed invocation. Empty when every
   * call to `mapper` succeeded.
   */
  errors: unknown[];
}
```

#### packages/core/src/revalidate/resolveTargets.ts

```ts
import { CollectionSlug } from "../types";
import { VexDocument } from "../api/convex";
import { RevalidateOperation, VexRevalidateTarget, VexRouteMapper } from "./types";

/**
 * Input to {@link resolveTargets}.
 */
export interface ResolveRevalidateTargetsProps {
  /** The project's route mapper, from `vex.config.ts`'s `revalidate.mapper`. */
  mapper: VexRouteMapper;
  /** Slug of the collection the write occurred against. */
  collection: CollectionSlug;
  /** CRUD operation that triggered the write. */
  operation: RevalidateOperation;
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
export function resolveTargets(props: ResolveRevalidateTargetsProps): VexRevalidateTarget {
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
export * from "./resolveTargets";
```

#### packages/core/src/config/types.ts

3 edits — everything else in the file is unchanged.

**1 — import.** Add beside the existing `VexAccessConfig` import:

```ts
import { VexRevalidateConfig } from "../revalidate";
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
   * @see {@link VexRevalidateConfig} for all available options
   */
  revalidate?: VexRevalidateConfig;
```

**3 — `VexConfig.revalidate`.** Add a property beside `types: TypesConfig;`:

```ts
  /**
   * Resolved revalidation configuration. `undefined` when the project never
   * configured `revalidate` — the feature is opt-in.
   */
  revalidate?: VexRevalidateConfig;
```

#### packages/core/src/config/config.ts

1 edit — everything else in the file is unchanged.

**1 — `revalidate` default.** Add a property to the object returned by `defineConfig`, beside the existing `types: { outputPath: "/src/vex.types.ts", ...config?.types }` block:

```ts
    revalidate: config?.revalidate
      ? {
          ...config.revalidate,
          revalidateSeconds: config.revalidate.revalidateSeconds ?? 3600,
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
    expect(config.revalidate).toBeUndefined();
  });

  it("defaults revalidateSeconds to 3600 when a mapper is supplied without one", () => {
    const mapper: VexRouteMapper = () => [];
    const config = defineConfig({ revalidate: { mapper } });
    expect(config.revalidate?.revalidateSeconds).toBe(3600);
    expect(config.revalidate?.mapper).toBe(mapper);
  });

  it("keeps an explicit revalidateSeconds", () => {
    const mapper: VexRouteMapper = () => [];
    const config = defineConfig({
      revalidate: { mapper, revalidateSeconds: 60 },
    });
    expect(config.revalidate?.revalidateSeconds).toBe(60);
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
- [ ] `packages/next/src/index.ts` — re-export

#### packages/next/src/cache/createVexRevalidateRoute.ts

New file. A guided stub — the developer implements the handler body. Consumes
core's `resolveTargets` (Step 3) for target resolution and `hasPermission`
(existing) for authorization; the request's `operation` field doubles as the
`hasPermission` action, since `RevalidateOperation` is already the
`"create" | "update" | "delete"` subset of `CrudAction`. `config`, `getToken`,
and `getAuth` are all injected props — the escape-hatch pattern this package
uses everywhere else (`createVexSitemap`, `createVexServerClient`) — so the
factory never imports an app's generated Convex `api` or its `~/auth/server`
module directly.

```ts
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hasPermission, resolveTargets } from "@vexcms/core";
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
 * **Never fails the caller.** A missing/invalid session still returns a real
 * 401, and a session without write permission a real 403 (those are
 * authorization failures, not purge failures). Past that point this handler
 * never throws or returns 5xx: an unconfigured mapper, a throwing mapper, or
 * an individual `revalidatePath` failure all resolve to 200 with the
 * failures reported in the body. A failed purge is a stale page; failing the
 * endpoint would only teach the fire-and-forget caller to retry pointlessly.
 *
 * @param props - `{ config, getToken, getAuth }`.
 * @returns `{ POST }` — mount directly as the route module's named export.
 * @throws Never. Every failure mode resolves to a response (401, 403, or 200).
 * @example
 * ```ts
 * // app/api/vex/revalidate/route.ts
 * import { api } from "@convex/_generated/api";
 * import { createVexRevalidateRoute } from "@vexcms/next";
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
      // 4. Check write permission: `hasPermission({ access: props.config.access,
      //    user, organization, resource: body.collection, action: body.operation })`.
      //    `body.operation` ("create" | "update" | "delete") is already a valid
      //    `hasPermission` action — no separate verb mapping needed.
      //    a. `false` → return `NextResponse.json({ error: "Forbidden" }, { status: 403 })`.
      // 5. `props.config.revalidate` missing (no mapper configured) → return
      //    `NextResponse.json({ revalidated: [], errors: [] }, { status: 200 })`
      //    → a project with no route mapper still gets a working, harmless
      //    endpoint instead of a 500.
      // 6. Resolve targets: `const { paths, errors } = resolveTargets({
      //    mapper: props.config.revalidate.mapper, collection: body.collection,
      //    operation: body.operation, before: body.before, after: body.after })`.
      //    A throwing mapper is already contained INSIDE `resolveTargets` — its
      //    failure lands in `errors`, never propagates here.
      // 7. For each path in `paths`, call `revalidatePath(path)` inside its own
      //    try/catch — this call is a Next API invoked here, not covered by
      //    `resolveTargets`'s containment. Push each succeeded path onto a
      //    `revalidated: string[]` array; push each failure onto `errors`.
      // 8. Return `NextResponse.json({ revalidated, errors }, { status: 200 })`.
      // Edge cases:
      // - Authorization (steps 1–4) always runs before any mapper/Convex work,
      //   so a denied caller never triggers a purge attempt.
      // - `body.operation` drives BOTH the permission check and target
      //   resolution — one field, never a duplicated verb.
      // - This handler never returns 5xx once past the 401/403 checks.
      throw new Error("Not implemented");
    },
  };
}
```

#### packages/next/src/cache/createVexRevalidateRoute.test.ts

New file. Real `defineAccess`/`defineCollection` fixtures — no placeholder
mocks standing in for access config. Mocks only `next/cache`'s
`revalidatePath`, and asserts its exact call arguments and order.

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { defineAccess, defineCollection, text } from "@vexcms/core";
import type { VexConfig, VexRouteMapper } from "@vexcms/core";

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

    const response = await route.POST(postRequest({ collection: "pages", operation: "update" }));

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
        after: { _id: "d1", _creationTime: 1, slug: "home" },
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
      postRequest({ collection: "pages", operation: "update", before, after }),
    );
    const body = (await response.json()) as VexRevalidateResponse;

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/pages/old-slug");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/pages/new-slug");
    expect(body).toEqual({ revalidated: ["/pages/old-slug", "/pages/new-slug"], errors: [] });
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
        operation: "delete",
        before: { _id: "d1", _creationTime: 1, slug: "gone" },
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

Existing file (created in Step 2, which adds `VexCacheOptions` and
`VexServerClient`). 1 edit: append the two request/response interfaces after
Step 2's `VexServerClient` interface — the last export in the file.

**1 — append below `VexServerClient`.**

```ts
import type { CollectionSlug, RevalidateOperation, VexDocument } from "@vexcms/core";

/**
 * A single-document purge, sent by `useVexMutation` after a successful admin
 * panel write and by `useVexRevalidate` for the open document.
 */
export interface VexRevalidateDocumentRequest {
  /** The collection the write occurred on — also the `hasPermission` resource. */
  collection: CollectionSlug;
  /** The write operation — also the `hasPermission` action. */
  operation: RevalidateOperation;
  /** The document's prior state. Omitted for `"create"`. */
  before?: VexDocument;
  /** The document's new state. Omitted for `"remove"`. */
  after?: VexDocument;
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
  | VexRevalidateDocumentRequest;

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
  VexRevalidateDocumentRequest,
  VexRevalidateRequest,
  VexRevalidateResponse,
} from "./cache/types";
```

Verify: `pnpm --filter @vexcms/next test` — an unauthenticated POST is 401, a
session without write permission on that collection is 403, a valid payload
calls `revalidatePath` for every resolved target including the pre-rename
path, and a mapper that throws returns 200 with the failures reported rather
than 500.

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
import { useVexRevalidateConfig } from "../context/VexRevalidateContext";

/**
 * Which write this mutation performs, passed through to the revalidation
 * endpoint's route mapper so it can resolve the right paths to purge. Named
 * for the Convex API operation (`vexConvexApi.remove`), not the CRUD verb —
 * `"remove"`, never `"delete"`.
 */
export type VexMutationOperation = "create" | "update" | "remove" | "upsert";

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
   * Derives the affected document ids from the mutation's variables and its
   * settled result, once the Convex mutation resolves. Omit for globals,
   * which have no document id and purge by `collection` (their slug) alone —
   * `ids` defaults to `[]`.
   */
  getIds?: (props: { args: TArgs; result: TResult }) => string[];
}

/**
 * Wraps a Convex mutation with a fire-and-forget cache purge.
 *
 * On success, POSTs `{ collection, operation, ids }` to the revalidation
 * endpoint (`createVexRevalidateRoute` from `@vexcms/next`) so the next
 * request for an affected public page gets fresh content instead of a stale
 * prerendered one. The purge NEVER fails, delays, or rejects the caller's
 * mutation — a failed purge is a stale page, a failed save is lost work — so
 * the promise `mutateAsync` returns settles on the Convex mutation alone.
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
  const revalidateConfig = useVexRevalidateConfig();
  const convexMutationFn = useConvexMutation(props.mutationFn);

  // TODO: implement
  // 1. Return `useMutation({ mutationFn: convexMutationFn, onSuccess })`
  //    where `onSuccess` is a SYNCHRONOUS function of `(result, args)`:
  //    a. → If `revalidateConfig.disabled`, return immediately — no fetch.
  //    b. → Otherwise compute `ids = props.getIds?.({ args, result }) ?? []`.
  //    c. → Call `fetch(revalidateConfig.endpoint, { method: "POST", headers:
  //       { "Content-Type": "application/json" }, body: JSON.stringify({
  //       collection: props.collection, operation: props.operation, ids }) })`
  //       WITHOUT `await`ing or `return`ing it — `onSuccess` must stay
  //       synchronous so TanStack Query never waits on the purge before
  //       resolving `mutateAsync`.
  //    d. → Chain `.catch(() => {})` onto that fetch promise so a network
  //       failure or non-2xx response never surfaces as an unhandled
  //       rejection or a mutation error.
  //
  // Edge cases:
  // - `getIds` omitted (globals) → `ids: []`; the route mapper resolves
  //   paths from `collection` (the global's slug) alone.
  // - `revalidateConfig.disabled` → skip the fetch entirely, not just the
  //   body — no network request should be observable.
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
provider (`usePermission.test.tsx`).

```tsx
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vexConvexApi } from "@vexcms/core";
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

/** Renders `useVexMutation` configured the way `CollectionEditView` configures it. */
function renderUpdateMutation() {
  return renderHook(
    () =>
      useVexMutation({
        mutationFn: vexConvexApi.update,
        collection: "posts",
        operation: "update",
        getIds: ({ args }) => [args.id],
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

  it("issues exactly one POST with the collection, operation, and ids on success", async () => {
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
      ids: ["doc1"],
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
  /** URL `useVexMutation` POSTs `{ collection, operation, ids }` to after a successful write. */
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
export function useVexRevalidateConfig(): VexRevalidateContextValue {
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

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.update,
    collection: props.collection.slug,
    operation: "update",
    getIds: ({ args }) => [args.id],
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

```ts
  const removeMutation = useVexMutation({
    mutationFn: vexConvexApi.remove,
    collection: collection.slug,
    operation: "remove",
    getIds: ({ args }) => args.ids,
  });
```

#### packages/react/src/components/views/GlobalEditView.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop `useConvexMutation` from the `@convex-dev/react-query`
import (`convexQuery` stays) and `useMutation` from the `@tanstack/react-query`
import (`useQuery` stays); add `useVexMutation` to the `../../hooks` import
beside `useGlobalForm, usePermission`.

```ts
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useGlobalForm, usePermission, useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call above `const form = useGlobalForm(...)`.
Globals have no document id, so `getIds` is omitted — the purge resolves
paths from `global.slug` alone.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.globals.upsert,
    collection: global.slug,
    operation: "upsert",
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

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.update,
    collection: props.collection.slug,
    operation: "update",
    getIds: ({ args }) => [args.id],
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

```ts
  const deleteMediaMutation = useVexMutation({
    mutationFn: vexConvexApi.remove,
    collection: props.collection.slug,
    operation: "remove",
    getIds: ({ args }) => args.ids,
  });
```

#### packages/react/src/components/modals/CreateDocumentModal.tsx

2 edits — everything else unchanged.

**1 — imports.** Drop the `useMutation` (`@tanstack/react-query`) and
`useConvexMutation` (`@convex-dev/react-query`) imports; add a `useVexMutation`
import beside the existing `useCollectionForm` import.

```ts
import { useVexMutation } from "../../hooks";
```

**2 — the mutation.** Replace the `useMutation` call above `const form = useCollectionForm(...)`.
The created document's id is only known from the mutation's result, so
`getIds` reads `result` rather than `args`.

```ts
  const { mutateAsync, isPending } = useVexMutation({
    mutationFn: vexConvexApi.create,
    collection: collection.slug,
    operation: "create",
    getIds: ({ result }) => [result],
  });
```

#### packages/react/src/components/media/MediaUploadDropzone.tsx

1 edit — everything else unchanged. `generateUploadUrl` is not a document
write (it only mints a presigned upload URL) and stays on plain `useMutation`;
only `createMediaDocument` migrates.

**1 — the mutation.** Replace the `useMutation` call bound to `createMediaDocument`;
add a `useVexMutation` import beside the existing `useStorageAdapterMap` import.

```ts
import { useVexMutation } from "../../hooks";
```

```ts
  const { mutateAsync: createMediaDocument } = useVexMutation({
    mutationFn: vexConvexApi.media.createMediaDocument,
    collection: props.targetCollection,
    operation: "create",
    getIds: ({ result }) => [result],
  });
```

Verify: `pnpm --filter @vexcms/react test` — a successful mutation issues
exactly one POST with the right collection, operation and document ids; a
failed mutation issues none; a rejected purge leaves the mutation resolved
and surfaces no error to the caller.

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

#### apps/www/src/components/ThemeStyle.tsx

1 edit — swap `fetchQuery` (hard-coded `no-store`, per the audit) for the
cached client from Step 2. Everything else (the `props`/scope contract, the
`buildThemeCss` call, the `<style>` element, the docblock) is unchanged; only
the docblock's closing sentence about build-time unreachability still applies
unmodified since `createVexServerClient`'s `.query()` rejects the same way
`fetchQuery` did when Convex is unreachable.

**1 — imports and query.** Replace `fetchQuery` with a module-scope
`createVexServerClient()` instance so repeated calls within one request dedupe
via `React.cache`.

```tsx
import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"
import { createVexServerClient } from "@vexcms/next/cache"

const client = createVexServerClient()
```

Body of `ThemeStyle` — only the `fetchQuery` line changes, from
`theme = await fetchQuery(...)` to:

```tsx
    theme = await client.query(scope === "admin" ? api.theme.getAdmin : api.theme.getActive)
```

#### apps/www/src/app/(frontend)/(site)/layout.tsx

2 edits. The skip-link, `<SiteHeader>`/`<SiteFooter>` props, and the
`try`/`catch` fallback shape are unchanged.

**1 — imports and client.** Replace `fetchQuery` with the cached client, and
render `ThemeStyle` here — first-paint site theming moved from the root layout
(above) to this one, the only group that needs it. `ThemeLive` is unaffected:
it already renders once at the root inside a client boundary and needs no
duplicate here.

```tsx
import type { ReactNode } from "react"

import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"

import type { FootersDocument, HeadersDocument } from "~/vex.types"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"

const client = createVexServerClient()
```

**2 — chrome reads and render.** Swap the two `fetchQuery` calls for
`client.query`, and render `<ThemeStyle />` above the skip link.

```tsx
  try {
    ;[headerData, footerData] = await Promise.all([
      client.query(api.headers.getFirst),
      client.query(api.footers.getFirst),
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

Verify: `pnpm --filter www build` shows `○` or `●` for `/`, `/[slug]`,
`/_not-found` and `/unauthorized`; `/admin` still 307s to sign-in;
`/auth/sign-in` returns 200; a signed-in user can still open and save a document
in the admin panel.

### Step 7 — Wire `apps/www` end to end, plus the manual purge control [dev]

Why: First point where the feature is observable, and the step whose build
output answers the question that started this work. Also ships the manual
purge control, because a client-driven purge cannot cover Convex dashboard
edits, `npx convex import`, streaming import, or a tab that closed
mid-request — as an admin-panel affordance, not a CLI, since the panel
already carries a signed-in session and needs no new credential to reach it.

- [ ] `apps/www/src/vex.config.ts` — `revalidate` config with the route mapper
- [ ] `apps/www/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate`
- [ ] `apps/www/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read
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
Keys the route mapper by `pages.slug` (already imported on line 7) rather than a
re-declared string literal, so a future rename of `TABLE_SLUG_PAGES` cannot drift
the mapper out of sync with the collection it targets. `home` maps to `/`; every
other slug maps to `/<slug>`. Both `before` and `after` are mapped so a rename
purges the old path as well as the new one (Step 3's `resolveTargets` contract).

```ts
  collections: [users, pages, headers, footers, themes],
  globals: [siteSettings],
  revalidate: {
    routes: {
      [pages.slug]: ({ before, after }) => {
        const slugs = new Set<string>()
        for (const doc of [before, after]) {
          if (doc && typeof (doc as { slug?: unknown }).slug === "string") {
            slugs.add((doc as { slug: string }).slug)
          }
        }
        return [...slugs].map((slug) => (slug === "home" ? "/" : `/${slug}`))
      },
    },
    interval: 3600,
  },
})
```

#### apps/www/src/app/(frontend)/(site)/page.tsx

Builds on Step 1's `notFound()` edit to this file. 2 edits; `generateMetadata`
and the JSX body are otherwise unchanged.

**1 — imports.** Replace the `convex/nextjs` `fetchQuery` import with the cached
client, and pull in the site's Convex URL and revalidate interval:

```tsx
import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"
import { notFound } from "next/navigation"

import { env } from "~/env.mjs"
import { generatePageMetadata } from "~/lib/metadata"
import vexConfig from "~/vex.config"

import { PageContent } from "./PageContent"

const vexClient = createVexServerClient({ convexUrl: env.NEXT_PUBLIC_CONVEX_URL })

export const revalidate = vexConfig.revalidate.interval
```

**2 — `HomePage`'s data fetch.** `fetchQuery` (hard-coded `no-store`, Blocker 2 in
the audit) becomes `vexClient.query`, which leaves Next's fetch cache untouched
and lets this route join the ISR path the ratified `revalidate` export declares:

```tsx
export default async function HomePage() {
  const initialData = await vexClient.query(api.pages.getBySlug, { slug: "home" })

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

**1 — imports.** Same cached-client swap as `page.tsx`, plus `vexStaticParams`
for the new `generateStaticParams` export:

```tsx
import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"
import { vexStaticParams } from "@vexcms/next/seo"
import { notFound } from "next/navigation"

import { env } from "~/env.mjs"
import { generatePageMetadata } from "~/lib/metadata"
import vexConfig from "~/vex.config"

import { PageContent } from "../PageContent"

const vexClient = createVexServerClient({ convexUrl: env.NEXT_PUBLIC_CONVEX_URL })

export const revalidate = vexConfig.revalidate.interval
```

**2 — new `generateStaticParams`, added before `generateMetadata`.** Reuses
Step 1's `api.pages.publishedSlugs` (added to `apps/www/convex/pages.ts` for the
sitemap) as the params source, and drops `home` — that slug is served by `/`
via `page.tsx`, not by this route:

```tsx
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
    query: api.pages.publishedSlugs,
    mapParams: (doc) => ({ slug: doc.slug }),
  })

  return entries.filter((entry) => entry.slug !== "home")
}
```

`vexStaticParams` swallows an unreachable Convex deployment into `[]` rather than
throwing (P-020: CI builds `apps/www` with placeholder env), so a CI build with
no live deployment still produces a valid `ƒ`/`○` route table instead of failing
at "Failed to collect page data".

**3 — `PublicPage`'s data fetch.** Same `fetchQuery` → `vexClient.query` swap as
`page.tsx`:

```tsx
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const initialData = await vexClient.query(api.pages.getBySlug, { slug: normalized })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} slug={normalized} />
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
import { createVexRevalidateRoute } from "@vexcms/next"

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
import type { CollectionSlug, VexDocument } from "@vexcms/core";

import { useVexRevalidateConfig } from "../context/VexRevalidateContext";

/** Body POSTed to purge exactly one document's currently-resolved paths. */
export interface VexRevalidateDocumentBody {
  /** Collection the purged document belongs to. */
  collection: CollectionSlug;
  /**
   * Always `"update"` — a manual purge re-resolves the document's current
   * paths, it does not model a create or delete.
   */
  operation: "update";
  /** The document whose current paths should be purged. */
  after: VexDocument;
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
  const revalidateConfig = useVexRevalidateConfig();

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
      mutation.mutateAsync({ collection, operation: "update", after: doc }),
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

  it('posts { collection, operation: "update", after: doc } for purgeDocument and resolves the parsed response', async () => {
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
    expect(JSON.parse(init.body as string)).toEqual({ collection: "pages", operation: "update", after: doc });
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

Not a new file — extends Step 4's factory. `RevalidateButton`'s
"purge the whole collection" mode POSTs `{ collection, all: true }` (no
`before`/`after` pair to resolve), which Step 4's handler as written does not
parse. This section is a forward note for that follow-up, not an
implementation here — Step 4's own file must gain the matching case before
the collection-wide purge does anything but fail.

**1 — `VexRevalidateRequest` (Step 4's `types.ts`) becomes a union.**

```ts
export type VexRevalidateRequest =
  | { collection: CollectionSlug; operation: RevalidateOperation; before?: VexDocument; after?: VexDocument }
  | { collection: CollectionSlug; all: true };
```

**2 — the POST handler gains an `all` branch before the existing
`resolveTargets` call (Step 4's step 6).** `body.all === true` resolves paths
by reading every document's slug via `publishedSlugs` (Step 1,
`@vexcms/core/server`) for `body.collection`, then running
`config.revalidate.routes[body.collection]` over each resulting `{ slug }` as
though it were `after`, collecting every path into the same
`paths`/`errors` shape the single-document branch already produces, before
falling into the existing per-path `revalidatePath` loop (Step 4's step 7)
unchanged. Reading `publishedSlugs` needs a Convex query call the factory has
no way to make today; this needs a new injected prop mirroring `getAuth`'s
pattern, which `apps/www/src/app/api/vex/revalidate/route.ts` will need to
wire once Step 4 adds it — out of scope here, so that file's block above is
unchanged.

Verify: `pnpm --filter www build` — the route table gains a `Revalidate` column
and flips from the Step 6 baseline (`○`/`ƒ` for `/`, `/[slug]`, `/_not-found`,
`/unauthorized`) to:

```
Route (app)                              Revalidate  Expire
┌ ● /                                          1h         1y
├ ○ /_not-found
├ ƒ /(...)auth/[pathname]
├ ● /[slug]
├   ├ /features
├   └ /roadmap
├ ƒ /admin/[[...path]]
├ ƒ /api/auth/[...all]
├ ƒ /api/vex/revalidate
├ ƒ /auth/[pathname]
└ ○ /unauthorized
```

Then, with `pnpm --filter www start`:

```bash
curl -D- -s -o /dev/null http://127.0.0.1:3131/roadmap | grep -i 'cache-control\|x-nextjs-cache'
# Cache-Control: s-maxage=3600, stale-while-revalidate=31532400
# x-nextjs-cache: HIT   (MISS on the very first request, HIT on every one after)
```

Edit the `roadmap` page's title in the admin panel and save; the next request
flips the cache header and serves the new title:

```bash
curl -D- -s -o /dev/null http://127.0.0.1:3131/roadmap | grep -i x-nextjs-cache   # x-nextjs-cache: MISS
curl -s http://127.0.0.1:3131/roadmap | grep -o '<h1[^<]*</h1>'                    # new title
```

Clicking `RevalidateButton` in the admin panel (`CollectionEditView`'s
control for `roadmap`, or `CollectionListView`'s collection-wide control)
reproduces the same flip without an admin-panel save:

```bash
curl -D- -s -o /dev/null http://127.0.0.1:3131/roadmap | grep -i x-nextjs-cache   # x-nextjs-cache: MISS
```

A signed-out `POST /api/vex/revalidate` gets 401, and a caller without write
permission on `pages` gets 403 — `RevalidateButton` renders that failure as
an inline error message rather than reporting success.

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
1. `marketing-site/src/lib/metadata.ts` (`generatePageMetadata`) is deleted.
   Its only two callers (`(site)/page.tsx`, `[slug]/page.tsx`) move to
   `vexMetadata` (`@vexcms/next/seo`), which fixes the exact bugs this file
   carried (conditional OG, missing `metadataBase`/canonical — the same
   defects Step 1 fixed in `apps/www/src/lib/metadata.ts`). An orphaned
   duplicate implementation left behind is exactly the drift P-010 warns
   about.
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

Verify: `pnpm verify:scaffold`; then per supported mode scaffold into a temp
dir, `pnpm build`, and assert the route table contains `●`/`○` entries for the
public routes and that `/sitemap.xml`/`/robots.txt` return `200` with valid
content. `node scripts/verify-scaffold.mjs --negative-routes` proves the new
assertion can fail (AP-013).

- [ ] `packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx` — drop `AuthServerProvider`
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider`
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/api/vex/revalidate/route.ts` — `createVexRevalidateRoute`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/layout.tsx` — drop `ThemeStyle` from root
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx` — cached `ThemeStyle` + chrome reads
- [ ] `packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx` — read through the cached client
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx` — mount `AuthServerProvider`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx` — cached read + `revalidate` + `vexMetadata`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx` — `generateStaticParams` + cached read + `vexMetadata`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/app/robots.ts`
- [ ] `packages/create-vexcms/templates/marketing-site/src/vex.config.ts` — `revalidate` config with the route mapper
- [ ] `packages/create-vexcms/templates/marketing-site/convex/pages.ts` — `publishedSlugs` query
- [ ] `packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts` — bind `publishedSlugs`
- [ ] `packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts` — removed, superseded by `vexMetadata`
- [ ] `scripts/verify-scaffold.mjs` — assert prerendered routes + sitemap/robots in the scaffold's own build output, plus a negative test
- [ ] `apps/docs/src/content/docs/guides/caching-and-seo.mdx`

#### packages/create-vexcms/templates/base-nextjs/src/components/providers/server.tsx

1 edit — everything else in this 31-line file is unchanged.

**1 — drop `AuthServerProvider`, rewrite the JSDoc and body.**

```tsx
import { ThemeProvider } from "@vexcms/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type PropsWithChildren } from "react";

/**
 * Server-side provider shell, mounted at the ROOT layout — reaches every
 * route, public and admin alike.
 *
 * Deliberately does **not** mount `AuthServerProvider`: its `getToken()` call
 * reads cookies, and a cookie read anywhere in the root layout's render tree
 * marks every route dynamic, including pages with zero data fetching
 * (measured — `seo-prerendering-audit.md`). `AuthServerProvider` now mounts
 * inside `(vexcms)/admin/layout.tsx`, where the admin panel already requires
 * a session, so dynamic rendering costs nothing there. `useAuth()`'s default
 * context value is `{ user: null }` (`context/AuthContext.tsx`), so a public
 * page calling `hasPermission()` still resolves — as anonymous, which is the
 * correct answer outside `/admin`.
 *
 * Also does not mount `ConvexClientProvider`: `ClientProviders` renders it
 * and is nested inside this component, so its copy is the one that reaches
 * `children`. Nothing between here and `ClientProviders` needs Convex.
 */
export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider defaultTheme="system">
      <NuqsAdapter>{children}</NuqsAdapter>
    </ThemeProvider>
  );
}
```

#### packages/create-vexcms/templates/base-nextjs/src/app/(vexcms)/admin/layout.tsx

1 edit — everything else unchanged.

**1 — mount `AuthServerProvider` around the existing subtree.**

```tsx
import type { ReactNode } from "react"

import { NextAdminLayout } from "@vexcms/next/client"

import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

import { AuthServerProvider } from "../../../components/providers/auth"
import { ClientProviders } from "./clientProviders"

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

New file.

```ts
import { createVexRevalidateRoute } from "@vexcms/next/cache"

import { getCurrentUser } from "~/auth/serverUtils"
import config from "~/vex.config"

/**
 * Purge endpoint `useVexMutation` (`@vexcms/react`) POSTs to after every
 * admin-panel save. Session-authorized through the app's own
 * `getCurrentUser` — no shared secret, no separate env var. Resolves which
 * paths to purge from `config.revalidate`'s route mapper; a bare scaffold
 * with no `revalidate` configured still answers every request, purging
 * nothing (`resolveTargets` returns `[]` with no mapper).
 */
export const { POST } = createVexRevalidateRoute({ config, getCurrentUser })
```

#### packages/create-vexcms/templates/marketing-site/src/app/layout.tsx

1 edit — everything else (fonts, metadata, `ClientProviders`/`ServerProviders`/`ThemeLive` nesting) unchanged.

**1 — drop `<ThemeStyle />` and its import from the root `<head>`.**

```tsx
import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"

// …
      <head>
        {/* ThemeScript applies the persisted light/dark class before first
            paint. The theme's CSS custom properties now render inside
            `(site)/layout.tsx` instead of here — a data read in the root
            layout marks every route dynamic, including `/auth/*`, which
            render outside the `(site)` group. Those routes rely on the
            `<ThemeLive />` mounted below to apply the theme after hydration
            instead of at first paint — a one-frame flash, traded for every
            marketing page being prerenderable. */}
        <ThemeScript />
      </head>
```

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/layout.tsx

1 edit — everything else (the skip link, `SiteHeader`/`SiteFooter` composition) unchanged.

**1 — cached client for `headers`/`footers`, add `<ThemeStyle />`.**

```tsx
import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"

import type { FootersDocument, HeadersDocument } from "~/vex.types"

import { SiteFooter } from "~/components/SiteFooter"
import { SiteHeader } from "~/components/SiteHeader"
import { ThemeStyle } from "~/components/ThemeStyle"

const vex = createVexServerClient()

/**
 * Marketing chrome: header + footer around every site page. Auth routes live
 * outside this group (directly under `(frontend)`), so they stay chrome-free.
 * Owns the site theme's first-paint `<ThemeStyle />` now that the root layout
 * no longer reads Convex (see `app/layout.tsx`).
 */
export default async function SiteLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  let headerData: HeadersDocument | null = null
  let footerData: FootersDocument | null = null

  try {
    ;[headerData, footerData] = await Promise.all([
      vex.query(api.headers.getFirst, {}),
      vex.query(api.footers.getFirst, {}),
    ])
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return (
    <>
      <ThemeStyle />
      {/* … skip link, SiteHeader/SiteFooter unchanged … */}
    </>
  )
}
```

#### packages/create-vexcms/templates/marketing-site/src/components/ThemeStyle.tsx

1 edit — everything else (the JSDoc's scope/specificity explanation, `buildThemeCss` call, `<style>` output) unchanged.

**1 — read through the cached client instead of `fetchQuery`.**

```tsx
import { api } from "@convex/_generated/api"
import { buildThemeCss, type ThemeScope } from "@vexcms/core"
import { createVexServerClient } from "@vexcms/next/cache"

const vex = createVexServerClient()

export async function ThemeStyle(props: { scope?: ThemeScope }) {
  const scope = props.scope ?? "site"

  let theme: null | Record<string, unknown> = null
  try {
    theme = await vex.query(scope === "admin" ? api.theme.getAdmin : api.theme.getActive, {})
  } catch {
    // No deployment reachable at build time — fall back to globals.css.
    return null
  }
  // … unchanged from here (null check, buildThemeCss, <style> return) …
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/(vexcms)/admin/layout.tsx

1 edit — everything else (the JSDoc, `ThemeStyle`/`ThemeLive` `scope="admin"` mounts) unchanged.

**1 — mount `AuthServerProvider` around the existing subtree.**

```tsx
import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getCurrentUser } from "~/auth/serverUtils";
import { AuthServerProvider } from "~/components/providers/auth";
import { ThemeLive } from "~/components/ThemeLive";
import { ThemeStyle } from "~/components/ThemeStyle";
import config from "~/vex.config";

import { ClientProviders } from "./clientProviders";

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

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/page.tsx

New shape — 14 lines, shown complete.

```tsx
import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"
import { vexMetadata } from "@vexcms/next/seo"

import type { PagesDocument } from "~/vex.types"

import { env } from "~/env.mjs"
import vexConfig from "~/vex.config"

import { PageContent } from "./PageContent"

export const revalidate = vexConfig.revalidate?.seconds ?? false

const vex = createVexServerClient()

export async function generateMetadata() {
  return vexMetadata({
    baseUrl: env.NEXT_PUBLIC_SITE_URL,
    pagesQuery: api.pages.getBySlug,
    siteSettingsQuery: api.siteSettings.get,
    slug: "home",
  })
}

export default async function HomePage() {
  let initialData: PagesDocument[] | undefined
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: "home" })
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return <PageContent initialData={initialData} />
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx

New shape, shown complete.

```tsx
import { api } from "@convex/_generated/api"
import { createVexServerClient } from "@vexcms/next/cache"
import { vexMetadata, vexStaticParams } from "@vexcms/next/seo"

import type { PagesDocument } from "~/vex.types"

import { env } from "~/env.mjs"
import vexConfig from "~/vex.config"

import { PageContent } from "../PageContent"

export const revalidate = vexConfig.revalidate?.seconds ?? false

/**
 * "home" is excluded — it renders at `/` via `page.tsx`; leaving it in would
 * additionally pre-render a duplicate `/home` for the same content.
 */
export const generateStaticParams = vexStaticParams({
  exclude: ["home"],
  paramName: "slug",
  slugsQuery: api.pages.publishedSlugs,
})

const vex = createVexServerClient()

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return vexMetadata({
    baseUrl: env.NEXT_PUBLIC_SITE_URL,
    pagesQuery: api.pages.getBySlug,
    siteSettingsQuery: api.siteSettings.get,
    slug: slug && slug.length > 0 ? slug : "home",
  })
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  let initialData: PagesDocument[] | undefined
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: normalized })
  } catch {
    // Convex not available — fall back to client-only fetch
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
```

#### packages/create-vexcms/templates/marketing-site/src/app/sitemap.ts

New file.

```ts
import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

/**
 * Lists the home route plus every published page slug. Degrades to just the
 * home entry when Convex is unreachable at build time (P-020) instead of
 * throwing, so a placeholder-env CI build still produces a valid sitemap.
 */
export default createVexSitemap({
  baseUrl: env.NEXT_PUBLIC_SITE_URL,
  exclude: ["home"],
  slugsQuery: api.pages.publishedSlugs,
})
```

#### packages/create-vexcms/templates/marketing-site/src/app/robots.ts

New file.

```ts
import { createVexRobots } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

/** Allows every crawler except under `/admin` and `/api`; points at the sitemap. */
export default createVexRobots({
  baseUrl: env.NEXT_PUBLIC_SITE_URL,
  disallow: ["/admin", "/api"],
})
```

#### packages/create-vexcms/templates/marketing-site/src/vex.config.ts

1 edit — everything else (`access`, `admin`, `authAdapter`, `storage`, `collections`, `globals`) unchanged.

**1 — add `revalidate` with the route mapper.**

```ts
import { TABLE_SLUG_PAGES } from "~/db/constants"

// …
const vexConfig = defineConfig({
  // … access, admin, authAdapter, storage, collections, globals unchanged …
  /**
   * ISR window for the cached public reads (`createVexServerClient`) and the
   * ceiling `useVexMutation`'s purge (`POST /api/vex/revalidate`) resets on
   * save. `routes` maps one changed `pages` document to the path it renders
   * at; `resolveTargets` (`@vexcms/core`) calls it once per before/after
   * document, so a slug rename purges both the old and the new path.
   */
  revalidate: {
    routes: ({ collection, document }) => {
      if (collection !== TABLE_SLUG_PAGES) {return null}
      const slug = (document as { slug?: string }).slug
      if (!slug) {return null}
      return slug === "home" ? "/" : `/${slug}`
    },
    seconds: 3600,
  },
})
```

#### packages/create-vexcms/templates/marketing-site/convex/pages.ts

1 edit — `getBySlug` unchanged.

**1 — import the bound `publishedSlugs` and export a query for it.**

```ts
import { publishedSlugs as readPublishedSlugs } from "~/vexcms/api"

// … getBySlug unchanged …

/**
 * Returns `{ slug, updatedAt }` for every published page. Consumed by
 * `app/sitemap.ts` and `[slug]/page.tsx`'s `generateStaticParams`
 * (`@vexcms/next/seo`) to build the sitemap and pre-render every slug at
 * build time. Access is bypassed like `getBySlug` — read at build time and by
 * anonymous crawlers, neither of which carries a session.
 */
export const publishedSlugs = query({
  args: {},
  handler: async (ctx) => {
    return await readPublishedSlugs({ ctx, collection: TABLE_SLUG_PAGES })
  },
})
```

#### packages/create-vexcms/templates/marketing-site/src/vexcms/api.ts

1 edit.

**1 — bind `publishedSlugs` alongside the existing operations.**

```ts
export const { create, find, get, globals, publishedSlugs, remove, search, update } = vexServerApi<DataModel>({
```

#### packages/create-vexcms/templates/marketing-site/src/lib/metadata.ts

Removed. `generatePageMetadata` had two callers, both migrated to `vexMetadata` (`@vexcms/next/seo`) above — `resolveMediaUrl`'s OG-image lookup and the same title/description-merge logic now live in the shared factory, fixing the unconditional-OG and `metadataBase`/canonical gaps `apps/www`'s copy had (Step 1).

#### scripts/verify-scaffold.mjs

7 edits — `readPublishablePackages`, `assertBuilt`, `packPublishables`, `injectOverrides`, `printSummary`, and the existing `runNegativeSelfTest`/`--negative` self-test are unchanged.

**1 — imports.** Add `spawn` alongside the existing `execFileSync, spawnSync`.

```js
import { execFileSync, spawn, spawnSync } from "node:child_process";
```

**2 — usage comment.** Extend the header comment's usage list.

```js
 *   node scripts/verify-scaffold.mjs                 pack + scaffold both templates, install/typecheck/build each,
 *                                                     then assert the build's route table and sitemap/robots
 *   node scripts/verify-scaffold.mjs --keep           preserve the tmp pack/scaffold dirs for debugging
 *   node scripts/verify-scaffold.mjs --negative       AP-013 self-test: corrupt one override mapping
 *   node scripts/verify-scaffold.mjs --negative-routes AP-013 self-test: sabotage a public page with a
 *                                                     cookies() read and confirm the route-table assertion
 *                                                     (added below) actually fails on it
```

**3 — new step runner that captures output.** Insert after `runStep`.

```js
/**
 * Like `runStep`, but also captures combined stdout+stderr so a later
 * assertion can inspect it — `next build`'s route table is the only place
 * "did this route prerender" is observable, and `runStep`'s `stdio:
 * "inherit"` streams it to the terminal without ever handing it back.
 *
 * @param {string} label
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {{ label: string, ok: boolean, exitCode: number | null, ms: number, output: string }}
 */
function runCapturedStep(label, command, args, cwd) {
  console.log(`  \u2192 ${label}`);
  const start = Date.now();
  const result = spawnSync(command, args, { cwd, encoding: "utf-8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  const ok = result.status === 0;
  const ms = Date.now() - start;
  console.log(
    ok ? `  \u2713 ${label} (${ms}ms)` : `  \u2717 ${label} \u2014 exit ${result.status} (${ms}ms)`
  );
  return { label, ok, exitCode: result.status, ms, output };
}

/**
 * Parses a `next build` route table and fails any route whose symbol isn't
 * `\u25cb` (static) or `\u25cf` (SSG) \u2014 AP-020's actual gate. Static analysis
 * only: the symbol reflects whether the route's code path avoids dynamic
 * APIs, so this holds even when Convex is unreachable at build time (P-020
 * degrades data, it doesn't force dynamic rendering).
 *
 * @param {string} buildOutput captured stdout+stderr from `pnpm build`
 * @param {string[]} routes route paths expected to prerender, e.g. `["/", "/[slug]"]`
 * @returns {string[]} one message per route that failed to prerender or wasn't found
 */
function assertPrerenderedRoutes(buildOutput, routes) {
  const failures = [];
  for (const route of routes) {
    const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const line =
      buildOutput.match(new RegExp(`^[\\s│├└─]*([○●ƒ])\\s+${escaped}\\s`, "m")) ??
      buildOutput.match(new RegExp(`^[\\s│├└─]*([○●ƒ])\\s+${escaped}$`, "m"));
    if (!line) {
      failures.push(`${route}: not found in the route table`);
      continue;
    }
    if (line[1] !== "○" && line[1] !== "●") {
      failures.push(`${route}: rendered ${line[1]} (dynamic) — expected ○ or ● (prerendered)`);
    }
  }
  return failures;
}

/** Blocking sleep — keeps this script fully synchronous like the rest of it. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Polls a URL with `curl` until it answers `200` or `timeoutMs` elapses.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {boolean} whether the server came up in time
 */
function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = spawnSync("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", url], {
      encoding: "utf-8",
    });
    if (result.status === 0 && result.stdout.trim() === "200") {return true;}
    sleepSync(250);
  }
  return false;
}

/**
 * Starts the scaffold's OWN built app (`pnpm start`) on an ephemeral port and
 * asserts `/sitemap.xml` and `/robots.txt` return `200` with parseable
 * content — proof the routes work end to end, not just that they compiled.
 * Does not assert specific seeded slugs: this scaffold has no live Convex
 * deployment (placeholder env, P-020), so the sitemap legitimately degrades
 * to its static entries only \u2014 see the file-level note in step-8.md for why
 * asserting real seeded content here would be an unpassable criterion
 * (AP-012). Step 7's `apps/www` build is what proves the seeded-slug case
 * against a real deployment.
 *
 * @param {string} projectDir
 * @returns {{ label: string, ok: boolean }}
 */
function checkPublicArtifacts(projectDir) {
  const port = 3900 + Math.floor(Math.random() * 500);
  const child = spawn("pnpm", ["start"], {
    cwd: projectDir,
    detached: true,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
  });

  try {
    const base = `http://127.0.0.1:${port}`;
    if (!waitForHttp(`${base}/`, 20000)) {
      return { label: "pnpm start (sitemap/robots check)", ok: false };
    }

    const sitemap = spawnSync("curl", ["-sS", `${base}/sitemap.xml`], { encoding: "utf-8" });
    const robots = spawnSync("curl", ["-sS", `${base}/robots.txt`], { encoding: "utf-8" });
    const sitemapOk = sitemap.status === 0 && sitemap.stdout.includes("<urlset");
    const robotsOk = robots.status === 0 && robots.stdout.includes("Sitemap:");

    if (!sitemapOk) {console.error("  \u2717 /sitemap.xml did not return a valid <urlset>");}
    if (!robotsOk) {console.error("  \u2717 /robots.txt did not reference the sitemap");}

    return { label: "assert /sitemap.xml + /robots.txt", ok: sitemapOk && robotsOk };
  } finally {
    if (child.pid) {
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // already exited
      }
    }
  }
}
```

**4 — `TEMPLATES` gains the routes each mode must prerender, and whether to run the sitemap/robots check.**

```js
const TEMPLATES = [
  {
    bare: true,
    key: "base-nextjs",
    label: "templates/base-nextjs (--bare)",
    routes: ["/", "/_not-found", "/unauthorized"],
  },
  {
    bare: false,
    checkArtifacts: true,
    key: "marketing-site",
    label: "templates/marketing-site (full)",
    routes: ["/", "/[slug]", "/_not-found", "/unauthorized"],
  },
];
```

**5 — `runTemplate`: drop `"pnpm build"` from the generic `remainingSteps` loop, capture it separately, and assert routes/artifacts after.**

```js
  const remainingSteps = [
    ["pnpm install", ["install", "--no-frozen-lockfile"]],
    ["pnpm typecheck", ["run", "typecheck"]],
  ];
  for (const [stepLabel, args] of remainingSteps) {
    if (!ok(runStep(stepLabel, "pnpm", args, projectDir))) {return { key, label, steps };}
  }

  const buildStep = runCapturedStep("pnpm build", "pnpm", ["run", "build"], projectDir);
  if (!ok(buildStep)) {return { key, label, steps };}

  const routeFailures = assertPrerenderedRoutes(buildStep.output, routes);
  if (routeFailures.length > 0) {
    for (const failure of routeFailures) {console.error(`    \u2717 ${failure}`);}
  }
  ok({ label: "assert prerendered routes", ok: routeFailures.length === 0 });
  if (routeFailures.length > 0) {return { key, label, steps };}

  if (checkArtifacts) {
    ok(checkPublicArtifacts(projectDir));
  }

  return { key, label, steps };
}
```

**6 — negative self-test for the new assertion.** Insert after `runNegativeSelfTest`.

```js
/**
 * Sabotages a freshly-scaffolded `marketing-site`'s home page with a
 * `cookies()` read, forcing `/` dynamic \u2014 the exact class of regression
 * `assertPrerenderedRoutes` exists to catch (AP-013: a check that has never
 * failed is not a check).
 *
 * @param {string} projectDir
 */
function sabotagePageWithCookieRead(projectDir) {
  const pagePath = path.join(projectDir, "src/app/(frontend)/(site)/page.tsx");
  const original = fs.readFileSync(pagePath, "utf-8");
  const sabotaged = original
    .replace(
      `import { api } from "@convex/_generated/api"`,
      `import { cookies } from "next/headers"\nimport { api } from "@convex/_generated/api"`
    )
    .replace(
      "export default async function HomePage() {",
      "export default async function HomePage() {\n  await cookies() // AP-013 self-test: forces this route dynamic"
    );
  if (sabotaged === original) {
    throw new Error(`negative route self-test: anchor text not found in ${pagePath}`);
  }
  fs.writeFileSync(pagePath, sabotaged);
}

/**
 * AP-013 self-test for `assertPrerenderedRoutes` specifically \u2014 separate
 * from `runNegativeSelfTest`'s override-corruption test, which exercises a
 * different mechanism (`pnpm.overrides`, not the route assertion). Scaffolds
 * `marketing-site` normally, sabotages `/` before building, and requires the
 * assertion to catch it. Always returns 1: a caught sabotage proves the gate
 * works (still a failing run \u2014 that IS the point), and an uncaught one is
 * the more alarming case and must not exit 0 either.
 *
 * @param {{ publishables: Array<{ dir: string, name: string }>, cliEntry: string }} params
 * @returns {number} always 1
 */
function runNegativeRouteSelfTest({ publishables, cliEntry }) {
  console.log(
    "Negative route self-test: scaffold marketing-site, force `/` dynamic with a cookies()\n" +
      "read, and confirm assertPrerenderedRoutes reports it \u2014 proof the gate is not vacuous (AP-013)."
  );

  const packRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negroutes-pack-"));
  const scaffoldRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vex-verify-negroutes-scaffold-"));

  try {
    const tarballs = packPublishables(publishables, packRoot);
    const scaffoldArgs = [cliEntry, "negative-routes-check", "--yes"];
    execFileSync("node", scaffoldArgs, { cwd: scaffoldRoot, stdio: "pipe" });

    const projectDir = path.join(scaffoldRoot, "negative-routes-check");
    injectOverrides(projectDir, tarballs);
    sabotagePageWithCookieRead(projectDir);

    execFileSync("pnpm", ["install", "--no-frozen-lockfile"], { cwd: projectDir, stdio: "pipe" });
    const build = runCapturedStep("pnpm build (sabotaged)", "pnpm", ["run", "build"], projectDir);
    if (!build.ok) {
      console.error("\n\u2717 CRITICAL: the sabotaged build itself failed \u2014 cannot exercise the route assertion.");
      return 1;
    }

    const failures = assertPrerenderedRoutes(build.output, ["/"]);
    if (failures.length === 0) {
      console.error(
        "\n\u2717 CRITICAL: assertPrerenderedRoutes reported no failures despite a cookies() read on `/`. " +
          "The route assertion is vacuous \u2014 it cannot be trusted to catch a real prerendering regression."
      );
      return 1;
    }

    console.log(`\n\u2713 negative route self-test passed: caught \u2014 ${failures[0]}`);
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

**7 — `main()` dispatches the new flag.**

```js
const negativeRoutes = cliArgs.includes("--negative-routes");

// … inside main(), alongside the existing `if (negative)` branch …
if (negativeRoutes) {
  process.exit(runNegativeRouteSelfTest({ publishables, cliEntry }));
}
```

#### apps/docs/src/content/docs/guides/caching-and-seo.mdx

New file.

````mdx
---
title: Caching and SEO
description: What prerenders, how to configure revalidation, how the admin-panel purge works, and what it doesn't cover.
---

Every public page in a VexCMS project — the home page and every `pages` slug — prerenders as
static HTML with incremental static regeneration (ISR), rather than rendering on every request.
That means CDN-cacheable responses, no per-request Convex round trip, and content that's in the
initial HTML byte stream for crawlers.

## What prerenders, and why

Two things had to be true for a route to prerender, and both are handled for you:

1. **No cookie read above the route.** A `cookies()`/session read anywhere in a layout marks
   every route beneath it dynamic — even a page with no data fetching at all. The root layout
   (`src/app/layout.tsx`) reads no cookies; `AuthServerProvider` (the one thing that does) mounts
   inside `src/app/(vexcms)/admin/layout.tsx` instead, where the admin panel already requires a
   session.
2. **Reads go through `createVexServerClient`, not `fetchQuery`.** `convex/nextjs`'s `fetchQuery`
   hard-codes `cache: "no-store"`, so any route that calls it is dynamic regardless of everything
   else. `createVexServerClient` (`@vexcms/next/cache`) uses a raw `ConvexHttpClient` instead,
   which leaves caching to Next's own `fetch`/route-segment config.

With both true, `next build` prerenders `/`, every `/[slug]`, `/_not-found`, and `/unauthorized`
as `○` (static) or `●` (SSG) routes — check with `pnpm build`, which prints a route table.

## Configuring `revalidate`

`vex.config.ts` takes a `revalidate` option:

```ts
revalidate: {
  seconds: 3600,
  routes: ({ collection, document }) => {
    if (collection !== "pages") {return null}
    const slug = (document as { slug?: string }).slug
    return slug ? (slug === "home" ? "/" : `/${slug}`) : null
  },
},
```

- `seconds` is the ISR window: every prerendered page revalidates in the background at most this
  often, even without an admin save.
- `routes` maps one changed document to the path it renders at. Return `null` to skip a
  document; return a path (or nothing, letting `seconds` be the only refresh) otherwise. A slug
  rename purges both the old and new path automatically — the mapper runs once per before/after
  document.

## How the admin-panel purge works

Saving a document in the admin panel calls `useVexMutation` (used by every collection/global
edit view in `@vexcms/react`), which — on a successful save — fires a same-origin,
fire-and-forget `POST /api/vex/revalidate` with the collection and the before/after documents.
That route (`createVexRevalidateRoute`, mounted at `src/app/api/vex/revalidate/route.ts`) is
session-authorized through your app's own `getCurrentUser` — there's no shared secret and
nothing to configure. It resolves the changed paths through your `revalidate.routes` mapper and
calls Next's `revalidatePath` for each one. The purge never blocks or fails a save: a rejected
purge leaves the mutation resolved with no error surfaced to the editor, because a stale page is
a smaller problem than a lost edit.

## What it does *not* cover

The purge only fires from the admin panel's own write path. Four cases bypass it, and the fix is
the same for all of them:

- **Editing a document directly from the Convex dashboard**, rather than through the admin panel.
- **`npx convex import`**, which writes documents without going through any mutation the app
  defines.
- **A streaming/bulk import** run from a script against the Convex deployment.
- **A tab that closed (or lost network) mid-request** — the fire-and-forget POST never left the
  browser.

None of these run application code, so none can call `useVexMutation`. Use the manual purge
control in the admin panel after any of them — **Revalidate** on a document's edit view purges
that document's paths, and the same control on a collection's list view purges every path that
collection can produce. It runs the identical `revalidate.routes` resolution and
`revalidatePath` calls a save would, just triggered by hand.

The control is in the admin panel rather than the CLI because the revalidation route is
authorized by your own admin session. A headless command would need a service-account
credential in the environment, which is a worse trade than the shared secret this design
deliberately avoids.
````

Verify: `pnpm verify:scaffold`; `node scripts/verify-scaffold.mjs --negative-routes` (expect a
reported failure on `/`, exit 1); then for each of `base-nextjs --bare` and `marketing-site`,
scaffold into a temp dir, `pnpm build`, and confirm the route table shows `●`/`○` for that
template's public routes and `/sitemap.xml`/`/robots.txt` return `200`.

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
