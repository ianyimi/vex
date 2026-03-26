# 41 — SEO & Metadata System

## Overview

Add a framework-agnostic `buildSiteMetadata` function to `@vexcms/core` that merges site-wide defaults (from globals) with per-page SEO overrides into a metadata object. Add per-page SEO fields to the pages collection. In the www app, wire it into Next.js `generateMetadata` via `fetchQuery` in server components. Add a static favicon.

## Design Decisions

- **`buildSiteMetadata` in `@vexcms/core`** — pure function, no framework dependency. Takes site settings + optional page overrides + optional title suffix. Returns a plain object with title, description, ogImage, twitterHandle.
- **Per-page SEO uses `imageUrl` (not `upload`)** for ogImage — avoids extra media document query. User pastes a URL directly.
- **Title suffix handled by `buildSiteMetadata`** — pass as optional param, function appends it. Keeps the Next.js layer thin.
- **Static favicon** — put in `public/favicons/`. Dynamic favicon from DB is a future enhancement.
- **Site settings ogImage stays as `upload`** — already exists, the server component resolves the media URL before calling `buildSiteMetadata`.

## Out of Scope

- `@vexcms/next` package extraction
- Dynamic favicon from DB
- Google Analytics script injection
- Sitemap generation, robots.txt
- Per-page og:image generation/screenshots

## Target Directory Structure

```
packages/core/src/
├── metadata/
│   ├── buildSiteMetadata.ts        # NEW — pure metadata merge function
│   └── buildSiteMetadata.test.ts   # NEW — tests
├── index.ts                        # MODIFY — add export

apps/www/
├── public/favicons/
│   └── favicon.ico                 # NEW — static favicon
├── src/
│   ├── lib/
│   │   └── metadata.ts             # NEW — Next.js generateMetadata helper
│   ├── app/
│   │   ├── layout.tsx              # MODIFY — add favicon + default metadata
│   │   ├── (frontend)/
│   │   │   ├── page.tsx            # MODIFY — add generateMetadata export
│   │   │   ├── [slug]/page.tsx     # MODIFY — add generateMetadata export
│   ├── vexcms/
│   │   └── collections/
│   │       └── pages.ts            # MODIFY — add SEO fields
```

## Implementation Order

1. **Step 1: `buildSiteMetadata` in core + tests** — After this step, the pure function exists and is tested.
2. **Step 2: Add per-page SEO fields to pages collection** — After this step, pages have metaTitle, metaDescription, ogImage fields.
3. **Step 3: Next.js metadata helper + wire into routes** — After this step, all public pages have proper metadata.
4. **Step 4: Static favicon + root layout metadata** — After this step, favicon and default site metadata are set.

---

## Step 1: `buildSiteMetadata` in core + tests

- [ ] Create `packages/core/src/metadata/buildSiteMetadata.ts`
- [ ] Create `packages/core/src/metadata/buildSiteMetadata.test.ts`
- [ ] Export from `packages/core/src/index.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/metadata/buildSiteMetadata.ts`

Pure function that merges site-level defaults with per-page overrides. Returns a framework-agnostic metadata object.

```typescript
/**
 * Framework-agnostic site metadata object.
 * Consumers (Next.js, TanStack Start, etc.) map this to their framework's metadata format.
 */
export interface SiteMetadata {
  title: string;
  description: string;
  ogImage?: string;
  twitterHandle?: string;
}

/**
 * Build site metadata by merging site-wide defaults with per-page overrides.
 *
 * Resolution order (per-page wins over site-wide):
 * - title: page.metaTitle → page.title → site.metaTitle → site.name → "Untitled"
 * - description: page.metaDescription → site.metaDescription → site.description → ""
 * - ogImage: page.ogImage → site.ogImage → undefined
 * - twitterHandle: site.twitterHandle → undefined
 *
 * @param props.site - Site settings fields (from globals)
 * @param props.page - Optional per-page overrides
 * @param props.titleSuffix - Optional suffix appended to title (e.g. " | My Site")
 * @returns Framework-agnostic metadata object
 */
export function buildSiteMetadata(props: {
  site: {
    name?: string;
    metaTitle?: string;
    metaDescription?: string;
    description?: string;
    ogImage?: string;
    twitterHandle?: string;
  };
  page?: {
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
  titleSuffix?: string;
}): SiteMetadata {
  // TODO: implement
  //
  // 1. Resolve title:
  //    → props.page?.metaTitle || props.page?.title || props.site.metaTitle || props.site.name || "Untitled"
  //    → If titleSuffix is provided AND the resolved title doesn't already end with it, append it
  //    → Exception: don't append suffix if the title equals the site name (home page avoids "My Site | My Site")
  //
  // 2. Resolve description:
  //    → props.page?.metaDescription || props.site.metaDescription || props.site.description || ""
  //
  // 3. Resolve ogImage:
  //    → props.page?.ogImage || props.site.ogImage || undefined
  //
  // 4. Resolve twitterHandle:
  //    → props.site.twitterHandle || undefined
  //
  // 5. Return { title, description, ogImage, twitterHandle }
  //
  // Edge cases:
  // - All fields undefined/empty: returns { title: "Untitled", description: "", ogImage: undefined, twitterHandle: undefined }
  // - Page has metaTitle but no title: metaTitle is used
  // - Site has no name: falls through to "Untitled"
  // - titleSuffix with home page: if resolved title === site.name, don't double-suffix
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/metadata/buildSiteMetadata.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { buildSiteMetadata } from "./buildSiteMetadata";

describe("buildSiteMetadata", () => {
  const baseSite = {
    name: "Vex CMS",
    metaTitle: "Vex CMS — The CMS for Convex",
    metaDescription: "A headless CMS built on Convex",
    description: "Site description fallback",
    ogImage: "https://vexcms.dev/og.png",
    twitterHandle: "@vexcms",
  };

  it("returns site defaults when no page overrides", () => {
    const result = buildSiteMetadata({ site: baseSite });
    expect(result.title).toBe("Vex CMS — The CMS for Convex");
    expect(result.description).toBe("A headless CMS built on Convex");
    expect(result.ogImage).toBe("https://vexcms.dev/og.png");
    expect(result.twitterHandle).toBe("@vexcms");
  });

  it("page metaTitle overrides site metaTitle", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaTitle: "Features — Vex CMS" },
    });
    expect(result.title).toBe("Features — Vex CMS");
  });

  it("page title used as fallback when no metaTitle", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { title: "Features" },
    });
    expect(result.title).toBe("Features");
  });

  it("page metaDescription overrides site", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaDescription: "All the features" },
    });
    expect(result.description).toBe("All the features");
  });

  it("page ogImage overrides site", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { ogImage: "https://vexcms.dev/features-og.png" },
    });
    expect(result.ogImage).toBe("https://vexcms.dev/features-og.png");
  });

  it("appends titleSuffix to page title", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { title: "Features" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Features | Vex CMS");
  });

  it("does not double-append titleSuffix", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaTitle: "Features | Vex CMS" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Features | Vex CMS");
  });

  it("does not append suffix when title equals site name", () => {
    const result = buildSiteMetadata({
      site: { name: "Vex CMS" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Vex CMS");
  });

  it("handles completely empty inputs", () => {
    const result = buildSiteMetadata({ site: {} });
    expect(result.title).toBe("Untitled");
    expect(result.description).toBe("");
    expect(result.ogImage).toBeUndefined();
    expect(result.twitterHandle).toBeUndefined();
  });

  it("site.description is fallback for metaDescription", () => {
    const result = buildSiteMetadata({
      site: { description: "Fallback desc" },
    });
    expect(result.description).toBe("Fallback desc");
  });

  it("site.name is fallback for metaTitle", () => {
    const result = buildSiteMetadata({
      site: { name: "My Site" },
    });
    expect(result.title).toBe("My Site");
  });
});
```

### Export from index.ts

Add to `packages/core/src/index.ts`:

```typescript
export { buildSiteMetadata, type SiteMetadata } from "./metadata/buildSiteMetadata";
```

---

## Step 2: Add per-page SEO fields to pages collection

- [ ] Add `metaTitle`, `metaDescription`, `ogImage` fields to `apps/www/src/vexcms/collections/pages.ts`
- [ ] Run `pnpm --filter @vexcms/core build` (for the new export)
- [ ] Run VEX CLI to regenerate schema (`pnpm --filter www vex dev` or equivalent)

### File: `apps/www/src/vexcms/collections/pages.ts`

Add three SEO fields after the existing `content` field. Use `admin.position: "sidebar"` to keep them out of the main content area.

```typescript
// Add these fields after content:
metaTitle: text({
  label: "Meta Title",
  admin: {
    description: "Custom <title> tag. Falls back to page title if empty.",
    position: "sidebar",
  },
}),
metaDescription: text({
  label: "Meta Description",
  admin: {
    description: "Custom meta description for search results.",
    position: "sidebar",
  },
}),
ogImage: imageUrl({
  label: "OG Image",
  admin: {
    description: "Custom Open Graph image URL for social sharing.",
    position: "sidebar",
  },
}),
```

Also add `import { imageUrl } from "@vexcms/core"` to the imports.

---

## Step 3: Next.js metadata helper + wire into routes

- [ ] Create `apps/www/src/lib/metadata.ts`
- [ ] Create `apps/www/convex/siteSettings.ts` (public query for site settings)
- [ ] Add `generateMetadata` export to `apps/www/src/app/(frontend)/page.tsx`
- [ ] Add `generateMetadata` export to `apps/www/src/app/(frontend)/[slug]/page.tsx`
- [ ] Verify build

### File: `apps/www/convex/siteSettings.ts`

Public query to fetch site settings for metadata generation. Similar to the existing `theme.ts` pattern.

```typescript
import { query } from "./_generated/server"

/**
 * Get the published site settings.
 * Used by server components for SEO metadata generation.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("site_settings").first()
    if (!settings) return null
    return settings
  },
})
```

### File: `apps/www/src/lib/metadata.ts`

Next.js helper that fetches site settings + page data, calls `buildSiteMetadata`, and returns a Next.js `Metadata` object.

```typescript
import type { Metadata } from "next"
import { fetchQuery } from "convex/nextjs"
import { buildSiteMetadata } from "@vexcms/core"
import { api } from "@convex/_generated/api"

/**
 * Generate Next.js Metadata for a page.
 * Fetches site settings and optionally a page document,
 * merges with buildSiteMetadata, and returns Next.js Metadata format.
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: {
  slug?: string;
}): Promise<Metadata> {
  // TODO: implement
  //
  // 1. Fetch site settings via fetchQuery(api.siteSettings.get)
  //    → Wrap in try/catch — return empty Metadata on failure
  //
  // 2. If slug is provided, fetch the page via fetchQuery(api.pages.getBySlug, { slug, _vexDrafts: false })
  //    → Extract metaTitle, metaDescription, ogImage, title from the page document
  //
  // 3. Resolve ogImage URL from site settings:
  //    → site settings ogImage is a Convex upload ID (not a URL)
  //    → If site settings has ogImage (ID), fetch the media document to get its URL
  //    → fetchQuery(api.vex.collections.getDocument, { collectionSlug: "media", documentId: ogImageId })
  //    → Use the media document's `url` field
  //
  // 4. Call buildSiteMetadata with:
  //    → site: { name, metaTitle, metaDescription, description, ogImage: resolvedUrl, twitterHandle }
  //    → page: { title, metaTitle, metaDescription, ogImage } (from page document if available)
  //    → titleSuffix: " | Vex CMS" (or from config)
  //
  // 5. Map SiteMetadata to Next.js Metadata:
  //    → title: result.title
  //    → description: result.description
  //    → openGraph: { title, description, images: [ogImage] } (if ogImage exists)
  //    → twitter: { card: "summary_large_image", site: twitterHandle } (if twitterHandle exists)
  //
  // Edge cases:
  // - No site settings in DB: return { title: "Untitled" }
  // - No page found: only site defaults are used
  // - ogImage is upload ID but media doc not found: skip ogImage
  throw new Error("Not implemented");
}
```

### Wire into page routes

Add to both `page.tsx` and `[slug]/page.tsx`:

```typescript
// apps/www/src/app/(frontend)/page.tsx
import { generatePageMetadata } from "~/lib/metadata"

export async function generateMetadata() {
  return generatePageMetadata({ slug: "home" })
}
```

```typescript
// apps/www/src/app/(frontend)/[slug]/page.tsx
import { generatePageMetadata } from "~/lib/metadata"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug })
}
```

---

## Step 4: Static favicon + root layout metadata

- [ ] Add a favicon.ico to `apps/www/public/favicons/`
- [ ] Update root layout `metadata` export with proper defaults
- [ ] Verify build

### File: `apps/www/src/app/layout.tsx`

Update the metadata export:

```typescript
export const metadata: Metadata = {
  title: {
    default: "Vex CMS",
    template: "%s",
  },
  description: "The headless CMS built for Convex. Real-time data, type-safe schemas, and a beautiful admin panel.",
  icons: {
    icon: "/favicons/favicon.ico",
  },
}
```

> Note: The `title.template: "%s"` means the `generateMetadata` return value is used as-is (no automatic suffix — `buildSiteMetadata` handles that). The `title.default` is the fallback when no `generateMetadata` export exists on a route.

---

## Success Criteria

- [ ] `pnpm --filter @vexcms/core test` — buildSiteMetadata tests pass
- [ ] `pnpm --filter @vexcms/core build` — exports buildSiteMetadata and SiteMetadata type
- [ ] `pnpm --filter www build` — www app builds with new SEO fields and metadata
- [ ] Home page HTML has proper `<title>` and `<meta name="description">` from site settings
- [ ] Dynamic pages (`/features`, `/pricing`, etc.) have per-page titles in HTML
- [ ] og:image and twitter:card meta tags present when configured in site settings
- [ ] Favicon loads from `/favicons/favicon.ico`
- [ ] Pages collection shows metaTitle, metaDescription, ogImage in admin sidebar
