import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import type { PagesDocument } from "~/vex.types"

import { generatePageMetadata } from "~/lib/metadata"

import { PageContent } from "../PageContent"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug: slug && slug.length > 0 ? slug : "home" })
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  let initialData: PagesDocument[] | undefined
  try {
    initialData = await fetchQuery(api.pages.getBySlug, { slug: normalized })
  } catch {
    // Fall back to client-only fetch
  }

  return <PageContent initialData={initialData} slug={normalized} />
}
