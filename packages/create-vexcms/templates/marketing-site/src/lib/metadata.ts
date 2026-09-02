import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

const TITLE_SUFFIX = " | Vex CMS"

/**
 * Generate Next.js Metadata for a page.
 *
 * Fetches site settings and, when a slug is given, the matching page
 * document, then merges them — page-level `metaTitle`/`metaDescription`/
 * `ogImage` win over the site's defaults from `siteSettings`.
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: { slug?: string }): Promise<Metadata> {
  try {
    const settings = (await fetchQuery(api.siteSettings.get)) as null | Record<string, unknown>
    if (!settings) {
      return { title: "Untitled" }
    }

    let pageData: Record<string, unknown> | undefined
    if (props.slug) {
      const pages = (await fetchQuery(api.pages.getBySlug, { slug: props.slug })) as
        | Record<string, unknown>[]
        | undefined
      pageData = pages?.[0]
    }

    const pageTitle = (pageData?.metaTitle as string | undefined) ?? (pageData?.title as string | undefined)
    const siteName = settings.name as string | undefined
    const title = (pageTitle ?? (settings.metaTitle as string | undefined) ?? siteName ?? "Untitled") + TITLE_SUFFIX
    const description =
      (pageData?.metaDescription as string | undefined) ??
      (settings.metaDescription as string | undefined) ??
      (settings.description as string | undefined)

    // `upload()` fields always store an array of media ids — the first entry
    // is the selection. Page-level ogImage wins over the site default.
    const pageOgImageId = (pageData?.ogImage as string[] | undefined)?.[0]
    const siteOgImageId = (settings.ogImage as string[] | undefined)?.[0]
    const ogImageId = pageOgImageId ?? siteOgImageId
    const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

    const twitterHandle = settings.twitterHandle as string | undefined

    const metadata: Metadata = { title, description }

    if (ogImageUrl) {
      metadata.openGraph = { title, description, images: [{ url: ogImageUrl }] }
    }

    if (twitterHandle) {
      metadata.twitter = { card: "summary_large_image", site: twitterHandle }
    }

    return metadata
  } catch {
    // Convex not available — return minimal metadata
    return { title: "Vex CMS" }
  }
}

/**
 * Resolves an `upload()` field's stored media id to a public URL via the
 * Convex file storage adapter. Returns `undefined` when the media document
 * no longer exists or the deployment is unreachable.
 */
async function resolveMediaUrl(mediaId: string): Promise<string | undefined> {
  try {
    const result = (await fetchQuery(api.vex.media.getUrl, {
      adapter: "convex",
      mediaId,
    })) as { error?: string; url?: string; }
    return result.url
  } catch {
    return undefined
  }
}
