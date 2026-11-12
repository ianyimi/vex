import { api } from "@convex/_generated/api"
import { vexStaticParams } from "@vexcms/next/seo"
import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import type { PagesDocument } from "~/vex.types"

import { getToken } from "~/auth/server"
import { generatePageMetadata } from "~/lib/metadata"
import { highlightPageBlocks } from "~/lib/highlight"
import { resolveDocumentIconNodes } from "~/lib/iconNodes"
import { vex } from "~/lib/vex"

import { PageContent } from "../PageContent"

// Next requires this to be an inline literal — it is read by static analysis
// before any module executes, so neither `vexConfig.revalidate.revalidateSeconds`
// nor an imported constant is accepted ("Invalid segment configuration export").
export const revalidate = 3600

export async function generateStaticParams() {
  const entries = await vexStaticParams({
    client: vex,
    query: api.pages.publishedSlugs,
    paramName: "slug",
    getSlug: (item) => item.slug,
  })

  return entries.filter((entry) => entry.slug !== "home")
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return generatePageMetadata({ slug: slug && slug.length > 0 ? slug : "home" })
}

/**
 * Draft Mode (the live-preview iframe) fetches through `pages.getBySlugPreview`
 * with the editor's own token instead of `getBySlug` — the published-only query
 * always resolved to `[]` for a never-published page, and `PageContent` used to
 * start on the published query (its SSR snapshot of `useIsLivePreviewActive` is
 * always `false`), flashing `WelcomePage` before the client-side preview query
 * swapped in. Passing `draftMode` down makes `PageContent`'s FIRST client render
 * agree with this server render too. The `<meta name="vex-session">` hint lets
 * `components/providers/convex.tsx`'s `hasSessionHint()` see, synchronously at
 * hydration, that the iframe's Convex socket should start paused for auth.
 *
 * `draftMode().isEnabled` is read here because Draft Mode is enabled exclusively
 * by the session-verified `/api/vex/live-preview` route handler, so this stays
 * safe to read unconditionally without widening the route's own static/dynamic
 * contract: outside Draft Mode the published branch below never reads cookies.
 */
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const normalized = slug && slug.length > 0 ? slug : "home"

  const draft = await draftMode()
  if (draft.isEnabled) {
    const token = await getToken()
    let initialData: PagesDocument[] | undefined
    try {
      initialData = await fetchQuery(
        api.pages.getBySlugPreview,
        { slug: normalized },
        token ? { token } : undefined,
      )
    } catch {
      initialData = undefined
    }

    const [codeHighlights, iconNodes] = await Promise.all([
      highlightPageBlocks(initialData?.[0]?.blocks),
      resolveDocumentIconNodes({ documents: initialData ?? [] }),
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

  // The two failure modes are deliberately NOT the same:
  //
  // - The query THROWS: the deployment is unreachable. A scaffold builds with
  //   placeholder env, so throwing here would fail `next build` outright.
  //   Render with no seed and let the client's live subscription hydrate.
  // - The query SUCCEEDS and returns `[]`: the deployment answered, and this
  //   page genuinely does not exist. That must be a real 404, not an empty
  //   200 — an empty 200 gets the URL indexed as a live, blank page.
  let initialData: PagesDocument[] | undefined
  let reachable = true
  try {
    initialData = await vex.query(api.pages.getBySlug, { slug: normalized })
  } catch {
    reachable = false
  }

  if (reachable && (!initialData || initialData.length === 0)) {
    notFound()
  }

  const [codeHighlights, iconNodes] = await Promise.all([
    highlightPageBlocks(initialData?.[0]?.blocks),
    resolveDocumentIconNodes({ documents: initialData ?? [] }),
  ])

  return (
    <PageContent codeHighlights={codeHighlights} iconNodes={iconNodes} initialData={initialData} slug={normalized} />
  )
}
