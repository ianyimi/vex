import { api } from "@convex/_generated/api"
import { createVexSitemap } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

/**
 * Generates `/sitemap.xml` from every published `pages` document plus the
 * site root. Degrades to `[]` (no page entries) when Convex is unreachable —
 * the packed-tarball scaffold this template ships into has no live
 * deployment and builds against placeholder env (P-020).
 */
export default createVexSitemap({
  client: vex,
  query: api.pages.publishedSlugs,
  toUrl: (slug) => (slug === "home" ? env.NEXT_PUBLIC_SITE_URL : `${env.NEXT_PUBLIC_SITE_URL}/${slug}`),
  getSlug: (item) => item.slug,
})
