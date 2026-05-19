import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"

import PageContent from "../PageContent"

export const dynamic = "force-dynamic"

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
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const pages = await fetchQuery(api.pages.getBySlug, { slug })

  const page = pages[0]
  if (!pages || !page) {
    return { title: "Vex CMS" }
  }

  return {
    title: (page.metaTitle ?? page.title) + " | Vex CMS",
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  }
}

/**
 * Public page route — renders a CMS page by its URL slug.
 *
 * Fetches the page from Convex using `getBySlug`, renders `notFound()` if no
 * matching page exists, otherwise renders the page via `<PageContent>`.
 *
 * @param params.slug - URL slug from the route (e.g. `/about-us` → `"about-us"`)
 * @throws {notFound()} When no page with the given slug exists.
 */
export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pages = await fetchQuery(api.pages.getBySlug, { slug })

  const page = pages[0]
  if (!page) {
    notFound()
  }

  return <PageContent page={page} />
}
