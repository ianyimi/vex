import type { Metadata } from "next";

import { api } from "@convex/_generated/api";
import { vexStaticParams } from "@vexcms/next/seo";
import { notFound } from "next/navigation";

import { vex } from "~/lib/vex";

import PageContent from "../PageContent";

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither a `vexConfig` member expression nor an
// imported constant is accepted ("Invalid segment configuration export").
// 3600s = 1 hour: the backstop for writes that never reached the purge route
// (Convex dashboard edits, `npx convex import`), since every admin-panel write
// purges this path immediately.
export const revalidate = 3600;

/**
 * Generates Open Graph and `<title>` metadata for a public page.
 *
 * Fetches the page by slug and uses `metaTitle` / `metaDescription` / `ogImage`
 * if set, falling back to the page title and description.
 *
 * @param params.slug - URL slug from the route
 * @returns Metadata object for `generateMetadata`
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pages = await vex.query(api.pages.getBySlug, { slug });

  const page = pages[0];
  if (!pages || !page) {
    return { title: "Vex CMS" };
  }

  return {
    title: (page.metaTitle ?? page.title) + " | Vex CMS",
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  };
}

/**
 * Prerenders every published page slug at build time.
 *
 * `home` is dropped: `/` serves it via `page.tsx`, so leaving it in would
 * additionally prerender a duplicate `/home` for the same content.
 *
 * `vexStaticParams` swallows an unreachable Convex deployment into `[]` rather
 * than throwing, so a build with no live deployment still produces a valid
 * route table.
 *
 * @returns One `{ slug }` entry per published page, excluding `home`.
 */
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    getSlug: (item: { slug: string }) => item.slug,
    paramName: "slug",
    query: api.pages.publishedSlugs,
  });

  return entries.filter((entry) => entry.slug !== "home");
}

/**
 * Public page route — renders a CMS page by its URL slug.
 *
 * Reads through the shared `vex` client rather than `fetchQuery`: `fetchQuery`
 * hard-codes `cache: "no-store"`, which forces this route dynamic and defeats
 * the `revalidate` window above. Renders `notFound()` if no matching page
 * exists, otherwise renders the page via `<PageContent>`.
 *
 * @param params.slug - URL slug from the route (e.g. `/about-us` → `"about-us"`)
 * @throws {notFound()} When no page with the given slug exists.
 */
export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pages = await vex.query(api.pages.getBySlug, { slug });

  const page = pages[0];
  if (!page) {
    notFound();
  }

  return <PageContent page={page} />;
}
