import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { notFound } from "next/navigation"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.revalidate.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600

export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    query: api.pages.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })

  return entries.filter((entry) => entry.slug !== "home")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug: slug && slug.length > 0 ? slug : "home" })
}

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
