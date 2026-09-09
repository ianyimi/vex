import type { MetadataRoute } from "next";

import { api } from "@convex/_generated/api";

import { env } from "~/env.mjs";
import { vex } from "~/lib/vex";

/**
 * Generates `/sitemap.xml` from every `pages` document plus the site root.
 *
 * Degrades to a root-only sitemap when Convex is unreachable — CI may build
 * this app with placeholder env, and a build must not fail because the
 * sitemap could not be enumerated.
 *
 * No `lastModified` is emitted for page entries. The only timestamp available
 * is `_creationTime`, which does not move when a page is edited, and crawlers
 * use `<lastmod>` to decide what to re-fetch — a wrong value is worse than an
 * absent one.
 *
 * @returns The sitemap entries for the public site.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  let entries: { createdAt: number; slug: string; updatedAt?: number }[] = [];
  try {
    entries = await vex.query(api.pages.publishedSlugs, {});
  } catch {
    entries = [];
  }

  const pageEntries: MetadataRoute.Sitemap = entries
    .filter((entry) => entry.slug !== "home")
    .map((entry) => ({
      url: `${baseUrl}/${entry.slug}`,
      ...(entry.updatedAt === undefined ? {} : { lastModified: new Date(entry.updatedAt) }),
    }));

  return [{ lastModified: new Date(), url: baseUrl }, ...pageEntries];
}
