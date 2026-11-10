import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import { getToken } from "~/auth/server"
import { highlightPageBlocks } from "~/lib/highlight"
import { resolveDocumentIconNodes } from "~/lib/iconNodes"
import { generatePageMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither a `vexConfig` member expression nor an
// imported constant is accepted ("Invalid segment configuration export").
// 3600s = 1 hour: the backstop for writes that never reached the purge route
// (Convex dashboard edits, `npx convex import`), since every admin-panel write
// purges this path immediately.
export const revalidate = 3600

/**
 * Prerenders every published page slug at build time.
 *
 * `home` is dropped: `/` serves it via `page.tsx`, so leaving it in would
 * additionally prerender a duplicate `/home` for the same content.
 *
 * `vexStaticParams` swallows an unreachable Convex deployment into `[]` rather
 * than throwing (CI builds this app with placeholder env), so a build
 * with no live deployment still produces a valid route table.
 *
 * @returns One `{ slug }` entry per published page, excluding `home`.
 */
export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    getSlug: (item: { slug: string }) => item.slug,
    paramName: "slug",
    query: api.pages.publishedSlugs,
  })

  return entries.filter((entry) => entry.slug !== "home")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug: slug && slug.length > 0 ? slug : "home" })
}

/**
 * One public page, resolved by slug.
 *
 * Same contract as the site root: read through the shared cached `vex` client,
 * and 404 on a missing document rather than rendering an empty 200 that a
 * crawler would index as a live but blank page.
 *
 * Draft Mode (the live-preview iframe) fetches through `pages.getBySlugPreview`
 * with the editor's own token instead — `getBySlug` is published-only, so a
 * document that has never been published always resolved to `[]` there, and
 * `PageContent` used to start on the published query (its SSR snapshot of
 * `useSitePreviewMode` is always `false`), flashing `WelcomePage` before the
 * client-side preview query swapped in. Passing `draftMode` down makes
 * `PageContent`'s FIRST client render agree with this server render too (no
 * hydration mismatch, no flash). The `<meta name="vex-session">` hint lets
 * `components/providers/convex.tsx`'s `hasSessionHint()` see, synchronously at
 * hydration, that the iframe's Convex socket should start paused for auth —
 * `draftMode().isEnabled` is read here because Draft Mode is enabled
 * exclusively by the session-verified `/api/vex/live-preview` route handler,
 * so this stays safe to read unconditionally without widening the route's own
 * static/dynamic contract: outside Draft Mode the published branch below
 * never reads cookies at all, and the route stays statically prerendered.
 */
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const draft = await draftMode()
  if (draft.isEnabled) {
    const token = await getToken()
    const initialData = await fetchQuery(
      api.pages.getBySlugPreview,
      { slug: normalized },
      token ? { token } : undefined,
    )
    const [codeHighlights, iconNodes] = await Promise.all([
      highlightPageBlocks(initialData[0]?.blocks),
      resolveDocumentIconNodes({ documents: initialData }),
    ])
    return (
      <>
        <meta name="vex-session" content="1" />
        <PageContent
          codeHighlights={codeHighlights}
          iconNodes={iconNodes}
          initialData={initialData}
          slug={normalized}
          draftMode
        />
      </>
    )
  }

  const initialData = await vex.query(api.pages.getBySlug, { slug: normalized })
  if (!initialData || initialData.length === 0) {
    notFound()
  }

  const [codeHighlights, iconNodes] = await Promise.all([
    highlightPageBlocks(initialData[0]?.blocks),
    resolveDocumentIconNodes({ documents: initialData }),
  ])

  return (
    <PageContent codeHighlights={codeHighlights} iconNodes={iconNodes} initialData={initialData} slug={normalized} />
  )
}
