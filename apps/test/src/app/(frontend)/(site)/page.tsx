import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { vex } from "~/lib/vex"

import PageContent from "./PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither a `vexConfig` member expression nor an
// imported constant is accepted ("Invalid segment configuration export").
// 3600s = 1 hour: the backstop for writes that never reached the purge route
// (Convex dashboard edits, `npx convex import`), since every admin-panel write
// purges this path immediately.
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const pages = await vex.query(api.pages.getBySlug, { slug: "home" })
  const page = pages[0]

  if (!page) {
    return { title: "Vex CMS" }
  }

  return {
    title: (page.metaTitle ?? page.title) + " | Vex CMS",
    description: page.metaDescription ?? undefined,
    openGraph: page.ogImage ? { images: [{ url: page.ogImage }] } : undefined,
  }
}

/**
 * The site root, rendering the `home` page document.
 *
 * Reads through the shared `vex` client rather than `fetchQuery`: `fetchQuery`
 * hard-codes `cache: "no-store"`, which forces this route dynamic and defeats
 * the `revalidate` window above.
 *
 * A missing `home` document resolves the query successfully (`getBySlug`
 * returns `[]`) and reaches `notFound()` below on purpose — a Convex outage
 * instead throws out of this server component, rendering a real 500 rather
 * than swallowing the failure into an empty 200.
 */
export default async function HomePage() {
  const pages = await vex.query(api.pages.getBySlug, { slug: "home" })
  const page = pages[0]

  if (!page) {
    notFound()
  }

  return <PageContent page={page} />
}
