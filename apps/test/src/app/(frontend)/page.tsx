import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { notFound } from "next/navigation"

import PageContent from "./PageContent"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchQuery(api.pages.getIndex)

  if (!page) {
    return { title: "Vex CMS" }
  }

  return {
    title: (page.metaTitle ?? page.title) + " | Vex CMS",
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  }
}

export default async function HomePage() {
  const page = await fetchQuery(api.pages.getIndex)

  if (!page) {
    notFound()
  }

  return <PageContent page={page} />
}
