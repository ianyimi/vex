import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"

import PageContent from "../PageContent"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const pages = await fetchQuery(api.pages.getBySlug, { slug })

  if (!pages || pages.length === 0) {
    return { title: "Vex CMS" }
  }

  const page = pages[0]
  return {
    title: (page.metaTitle ?? page.title) + " | Vex CMS",
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  }
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pages = await fetchQuery(api.pages.getBySlug, { slug })

  const page = pages[0]
  if (!page) {
    notFound()
  }

  return <PageContent page={page} />
}
