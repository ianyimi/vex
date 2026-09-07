import { api } from "@convex/_generated/api"
import { notFound } from "next/navigation"

import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PageContent } from "./PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither a `vexConfig` member expression nor an
// imported constant is accepted ("Invalid segment configuration export").
// 3600s = 1 hour: the backstop for writes that never reached the purge route
// (Convex dashboard edits, `npx convex import`), since every admin-panel write
// purges this path immediately.
export const revalidate = 3600

export async function generateMetadata() {
  return generatePageMetadata({ slug: "home" })
}

/**
 * The site root, rendering the `home` page document.
 *
 * Reads through the shared `vex` client rather than `fetchQuery`: `fetchQuery`
 * hard-codes `cache: "no-store"`, which forces this route dynamic and defeats
 * the `revalidate` window above.
 *
 * The `try`/`catch` is gone deliberately. A Convex outage now throws out of
 * this server component and Next renders a real 500, instead of swallowing the
 * failure into an empty 200. A genuinely missing `home` document still resolves
 * the query successfully (`getBySlug` returns `[]`), so `notFound()` below is
 * reached on purpose rather than via a caught exception.
 */
export default async function HomePage() {
  const initialData = await vex.query(api.pages.getBySlug, { slug: "home" })

  if (!initialData || initialData.length === 0) {
    notFound()
  }

  return <PageContent initialData={initialData} />
}
