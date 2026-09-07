import type { MetadataRoute } from "next";

/**
 * Creates a Next.js `robots.ts` default export that allows crawlers across the
 * site and points them at the generated sitemap.
 *
 * @param props - Robots configuration.
 * @returns A `robots()` function suitable as `app/robots.ts`'s default export.
 */
export function createVexRobots(props: {
  /**
   * Paths to disallow. Every vexcms template passes `["/admin", "/api"]` — the
   * admin panel is authenticated and neither belongs in an index. Omitted
   * entirely when absent or empty, rather than emitted as an empty array.
   */
  disallow?: string[];
  /**
   * The site's absolute origin, no trailing slash (e.g. `https://example.com`).
   * The sitemap URL is derived as `${siteUrl}/sitemap.xml`.
   */
  siteUrl: string;
}): () => MetadataRoute.Robots {
  return function robots(): MetadataRoute.Robots {
    const disallow = props.disallow ?? [];
    return {
      rules: {
        allow: "/",
        userAgent: "*",
        ...(disallow.length === 0 ? {} : { disallow }),
      },
      sitemap: `${props.siteUrl}/sitemap.xml`,
    };
  };
}
