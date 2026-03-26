import type { Metadata } from "next"

import { buildSiteMetadata } from "@vexcms/core"
import { fetchQuery } from "convex/nextjs"

import { api } from "@convex/_generated/api"
import { anyApi } from "convex/server"

/**
 * Generate Next.js Metadata for a page.
 * Fetches site settings and optionally a page document,
 * merges with buildSiteMetadata, and returns Next.js Metadata format.
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: {
  slug?: string
}): Promise<Metadata> {
  try {
    // Fetch site settings
    const settings = (await fetchQuery(api.siteSettings.get)) as Record<
      string,
      unknown
    > | null

    if (!settings) {
      return { title: "Untitled" }
    }

    // Resolve the ogImage URL from site settings (upload ID → URL)
    let siteOgImageUrl: string | undefined
    const ogImageId = settings.ogImage as string | undefined
    if (ogImageId) {
      try {
        const mediaDoc = (await fetchQuery(
          anyApi.vex.collections.getDocument,
          {
            collectionSlug: "media",
            documentId: ogImageId,
          }
        )) as Record<string, unknown> | null
        siteOgImageUrl = (mediaDoc?.url as string) || undefined
      } catch {
        // Media document not found — skip ogImage
      }
    }

    // Fetch page data for per-page overrides
    let pageData: Record<string, unknown> | null = null
    if (props.slug) {
      pageData = await fetchQuery(api.pages.getBySlug, {
        slug: props.slug,
        _vexDrafts: false,
      })
    }

    // Build framework-agnostic metadata
    const meta = buildSiteMetadata({
      site: {
        name: settings.name as string | undefined,
        metaTitle: settings.metaTitle as string | undefined,
        metaDescription: settings.metaDescription as string | undefined,
        description: settings.description as string | undefined,
        ogImage: siteOgImageUrl,
        twitterHandle: settings.twitterHandle as string | undefined,
      },
      page: pageData
        ? {
            title: pageData.title as string | undefined,
            metaTitle: pageData.metaTitle as string | undefined,
            metaDescription: pageData.metaDescription as string | undefined,
            ogImage: pageData.ogImage as string | undefined,
          }
        : undefined,
      titleSuffix: " | Vex CMS",
    })

    // Map to Next.js Metadata
    const metadata: Metadata = {
      title: meta.title,
      description: meta.description,
    }

    if (meta.ogImage) {
      metadata.openGraph = {
        title: meta.title,
        description: meta.description,
        images: [{ url: meta.ogImage }],
      }
    }

    if (meta.twitterHandle) {
      metadata.twitter = {
        card: "summary_large_image",
        site: meta.twitterHandle,
      }
    }

    return metadata
  } catch {
    // Convex not available — return minimal metadata
    return { title: "Vex CMS" }
  }
}
