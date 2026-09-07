import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { vexMetadata } from "@vexcms/next/seo"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const TITLE_SUFFIX = " | Vex CMS"

/**
 * Returns the first candidate that is a non-blank string.
 *
 * Optional text fields in a vexcms collection seed as `""` rather than being
 * absent, so `??` chains cannot express "fall back to the site default" — an
 * empty override would win. Mirrors `apps/www/src/lib/metadata.ts`'s helper
 * of the same name.
 */
function firstNonBlank(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }
  return undefined
}

/**
 * Generate Next.js Metadata for a page.
 *
 * Fetches site settings and, when a slug is given, the matching page
 * document, then merges them — page-level `metaTitle`/`metaDescription`/
 * `ogImage` win over the site's defaults from `siteSettings` — and delegates
 * the `Metadata` shape (title, description, `metadataBase`, canonical,
 * conditional OG image) to `vexMetadata` (`@vexcms/next/seo`).
 *
 * @param props.slug - Optional page slug to fetch per-page SEO overrides
 */
export async function generatePageMetadata(props: { slug?: string }): Promise<Metadata> {
  try {
    const settings = (await vex.query(api.siteSettings.get)) as null | Record<string, unknown>
    if (!settings) {
      return { title: "Untitled" }
    }

    let pageData: Record<string, unknown> | undefined
    if (props.slug) {
      const pages = (await vex.query(api.pages.getBySlug, { slug: props.slug })) as
        | Record<string, unknown>[]
        | undefined
      pageData = pages?.[0]
    }

    const pageTitle = firstNonBlank(pageData?.metaTitle, pageData?.title)
    const siteName = firstNonBlank(settings.name)
    const title =
      (firstNonBlank(pageTitle, settings.metaTitle, siteName) ?? "Untitled") + TITLE_SUFFIX
    const description = firstNonBlank(pageData?.metaDescription, settings.metaDescription, settings.description)

    // `upload()` fields always store an array of media ids — the first entry
    // is the selection. Page-level ogImage wins over the site default.
    const pageOgImageId = (pageData?.ogImage as string[] | undefined)?.[0]
    const siteOgImageId = (settings.ogImage as string[] | undefined)?.[0]
    const ogImageId = pageOgImageId ?? siteOgImageId
    const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

    const twitterHandle = firstNonBlank(settings.twitterHandle)
    const canonicalPath = props.slug && props.slug !== "home" ? `/${props.slug}` : "/"

    const metadata = vexMetadata({
      title,
      description,
      siteUrl: env.NEXT_PUBLIC_SITE_URL,
      path: canonicalPath,
      imageUrl: ogImageUrl,
    })

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
    const result = (await vex.query(api.vex.media.getUrl, {
      adapter: "convex",
      mediaId,
    })) as { error?: string; url?: string }
    return result.url
  } catch {
    return undefined
  }
}
