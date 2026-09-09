import type { MetadataRoute } from "next";

import { env } from "~/env.mjs";

/**
 * Generates `/robots.txt`.
 *
 * Allows crawlers across the public site and points them at the generated
 * sitemap. `/admin` and `/api` are disallowed: the admin panel is
 * authenticated, and neither belongs in an index. Purely static — no Convex
 * call, so a placeholder-env build never affects it.
 *
 * @returns The robots directives for the public site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin", "/api"],
      userAgent: "*",
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
