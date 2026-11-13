import type { Metadata } from "next"

import { api } from "@convex/_generated/api"

import { env } from "~/env.mjs"
import { vex } from "~/lib/vex"
import type { PagesDocument, Post, SiteSettingsGlobal } from "~/vex.types"

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
 * Builds the `Metadata` shared shape for one document (page or post): title
 * (with site fallback and `TITLE_SUFFIX`), description, canonical path, OG
 * tags, and the conditional `twitter` card.
 *
 * Extracted from `generatePageMetadata`/`generatePostMetadata`, which differ
 * only in which collection they query and how they derive `canonicalPath` —
 * everything below is byte-identical between the two.
 *
 * @param props - Resolved inputs; `title`/`description`/`ogImageId` are the
 *   document-level overrides (already picked from whichever fields that
 *   collection exposes), falling back to `settings` the same way in both callers.
 * @returns Metadata with `title`, `description`, `metadataBase`,
 *   `alternates.canonical`, `openGraph`, and `twitter` (when an image or
 *   handle resolved).
 */
async function buildDocumentMetadata(props: {
  canonicalPath: string
  description?: unknown
  ogImageId?: string
  settings: SiteSettingsGlobal
  title?: unknown
}): Promise<Metadata> {
  const siteName = firstNonBlank(props.settings.name)
  const title = (firstNonBlank(props.title, props.settings.metaTitle, siteName) ?? "Untitled") + TITLE_SUFFIX
  const description = firstNonBlank(props.description, props.settings.metaDescription, props.settings.description)

  const siteOgImageId = (props.settings.ogImage as string[] | undefined)?.[0]
  const ogImageId = props.ogImageId ?? siteOgImageId
  const ogImageUrl = ogImageId ? await resolveMediaUrl(ogImageId) : undefined

  const twitterHandle = firstNonBlank(props.settings.twitterHandle)

  const metadata: Metadata = {
    alternates: { canonical: props.canonicalPath },
    description,
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    openGraph: {
      description,
      title,
      ...(ogImageUrl ? { images: [{ url: ogImageUrl }] } : {}),
    },
    title,
  }

  // Discord, Slack and X pick the large-image layout from `twitter:card`, not
  // from `og:image` alone — and Next auto-fills `card: "summary"` (a small
  // thumbnail) whenever `twitter` is omitted. So the card type must be emitted
  // whenever an image resolved, independently of whether a handle exists.
  if (ogImageUrl || twitterHandle) {
    metadata.twitter = {
      card: ogImageUrl ? "summary_large_image" : "summary",
      ...(twitterHandle ? { site: twitterHandle } : {}),
    }
  }

  return metadata
}

/**
 * Generate Next.js Metadata for a page.
 *
 * Fetches site settings and, when a slug is given, the matching page
 * document, then merges them via `buildDocumentMetadata` — page-level
 * `metaTitle`/`metaDescription`/`ogImage` win over the site's defaults from
 * `siteSettings`.
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
    const settings = await vex.query(api.siteSettings.get)
    if (!settings) {
      return { title: "Untitled" }
    }

    let pageData: PagesDocument | undefined
    if (props.slug) {
      const pages = await vex.query(api.pages.getBySlug, { slug: props.slug })
      pageData = pages?.[0]
    }

    // Optional text fields seed as `""`, not `undefined` — an unset
    // `metaDescription` in the admin panel is an empty string. `??` only falls
    // through on null/undefined, so a blank override used to win over a real
    // site-level value and Next then omitted the tag entirely.
    const canonicalPath = props.slug && props.slug !== "home" ? `/${props.slug}` : "/"

    return await buildDocumentMetadata({
      canonicalPath,
      description: pageData?.metaDescription,
      ogImageId: (pageData?.ogImage as string[] | undefined)?.[0],
      settings,
      title: firstNonBlank(pageData?.metaTitle, pageData?.title),
    })
  } catch {
    // Convex not available — return minimal metadata
    return { title: "Vex CMS" }
  }
}

/**
 * Generate Next.js Metadata for one post, by slug.
 *
 * @param props - Input props.
 * @param props.slug - The post slug to fetch.
 * @returns Metadata for the post, or the site default when the slug doesn't
 *   resolve or Convex is unreachable.
 * @throws Never — degrades to the site default on any failure.
 */
export async function generatePostMetadata(props: { slug: string }): Promise<Metadata> {
  try {
    const settings = await vex.query(api.siteSettings.get)
    if (!settings) {
      return { title: "Untitled" }
    }

    const posts = await vex.query(api.posts.getBySlug, { slug: props.slug })
    const postData: Post | undefined = posts?.[0]

    if (!postData) {
      const siteName = firstNonBlank(settings.name)
      return { title: (firstNonBlank(settings.metaTitle, siteName) ?? "Untitled") + TITLE_SUFFIX }
    }

    return await buildDocumentMetadata({
      canonicalPath: `/posts/${props.slug}`,
      description: postData.excerpt,
      ogImageId: (postData.ogImage as string[] | undefined)?.[0],
      settings,
      title: postData.title,
    })
  } catch {
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
