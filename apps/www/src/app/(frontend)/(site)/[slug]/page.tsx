import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { notFound } from "next/navigation"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither a `vexConfig` member expression nor an
// imported constant is accepted ("Invalid segment configuration export").
// 3600s = 1 hour: the backstop for writes that never reached the purge route
// (Convex dashboard edits, `npx convex import`), since every admin-panel write
// purges this path immediately.
export const revalidate = 3600

/**
 * Prerenders every published page slug at build time.
 *
 * `home` is dropped: `/` serves it via `page.tsx`, so leaving it in would
 * additionally prerender a duplicate `/home` for the same content.
 *
 * `vexStaticParams` swallows an unreachable Convex deployment into `[]` rather
 * than throwing (P-020: CI builds this app with placeholder env), so a build
 * with no live deployment still produces a valid route table.
 *
 * @returns One `{ slug }` entry per published page, excluding `home`.
 */
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    getSlug: (item: { slug: string }) => item.slug,
    paramName: "slug",
    query: api.pages.publishedSlugs,
  })

  return entries.filter((entry) => entry.slug !== "home")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug: slug && slug.length > 0 ? slug : "home" })
}

/**
 * One public page, resolved by slug.
 *
 * Same contract as the site root: read through the shared cached `vex` client,
 * and 404 on a missing document rather than rendering an empty 200 that a
 * crawler would index as a live but blank page.
 */
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const initialData = await vex.query(api.pages.getBySlug, { slug: normalized })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
