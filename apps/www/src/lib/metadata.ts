import type { Metadata } from "next"

import { api } from "@convex/_generated/api"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"

const TITLE_SUFFIX = " | Vex CMS"

/**
 * Returns the first candidate that is a non-blank string.
 *
 * Optional text fields in a vexcms collection seed as `""` rather than being
 * absent, so `??` chains cannot be used to express "fall back to the site
 * default" — an empty override would win.
 *
 * @param candidates - Values to test, in precedence order.
 * @returns The first non-blank string, or `undefined` when every candidate is
 *   blank, absent, or not a string.
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
 * `ogImage` win over the site's defaults from `siteSettings`.
 *
 * `title`, `description`, `metadataBase` and `alternates.canonical` are always
 * emitted; only the OG image is conditional. Previously the whole `openGraph`
 * block was gated on an image resolving, so a page with no image published no
 * OG title or description at all.
 *
 * @param props - Input props.
 * @param props.slug - Optional page slug to fetch per-page SEO overrides.
 * @returns Metadata for the page, or a bare title when Convex is unreachable.
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

    // Optional text fields seed as `""`, not `undefined` — an unset
    // `metaDescription` in the admin panel is an empty string. `??` only falls
    // through on null/undefined, so a blank override used to win over a real
    // site-level value and Next then omitted the tag entirely.
    const pageTitle = firstNonBlank(pageData?.metaTitle, pageData?.title)
    const siteName = firstNonBlank(settings.name)
    const title =
      (firstNonBlank(pageTitle, settings.metaTitle, siteName) ?? "Untitled") + TITLE_SUFFIX
    const description = firstNonBlank(
      pageData?.metaDescription,
      settings.metaDescription,
      settings.description,
    )

    // `upload()` fields always store an array of media ids — the first entry
    // is the selection. Page-level ogImage wins over the site default.
    const pageOgImageId = (pageData?.ogImage as string[] | undefined)?.[0]
    const siteOgImageId = (settings.ogImage as string[] | undefined)?.[0]
    const ogImageId = pageOgImageId ?? siteOgImageId
    const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

    const twitterHandle = firstNonBlank(settings.twitterHandle)

    const canonicalPath = props.slug && props.slug !== "home" ? `/${props.slug}` : "/"

    const metadata: Metadata = {
      alternates: { canonical: canonicalPath },
      description,
      metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
      openGraph: {
        description,
        title,
        ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
      },
      title,
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
    const result = (await vex.query(api.vex.media.getUrl, {
      adapter: "convex",
      mediaId,
    })) as { error?: string; url?: string; }
    return result.url
  } catch {
    return undefined
  }
}
