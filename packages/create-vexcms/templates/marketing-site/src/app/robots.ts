import { createVexRobots } from "@vexcms/next/seo"

import { env } from "~/env.mjs"

/**
 * Generates `/robots.txt`. Allows all crawlers on the public site and points
 * them at the generated sitemap; disallows the authenticated `/admin` tree
 * and its `/api` routes.
 */
export default createVexRobots({
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  disallow: ["/admin", "/api"],
})
