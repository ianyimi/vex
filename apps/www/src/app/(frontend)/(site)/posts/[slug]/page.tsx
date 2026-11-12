import type { Metadata } from "next"

import { api } from "@convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"

import { getToken } from "~/auth/server"
import { generatePostMetadata } from "~/lib/metadata"
import { vex } from "~/lib/vex"

import { PostContent } from "./PostContent"

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return generatePostMetadata({ slug })
}

/**
 * One public post, resolved by slug.
 *
 * Dogfoods the `richtext` field end to end: `posts.body` is saved by the
 * Plate editor in the admin panel (`editor: plateEditor()` in
 * `vex.config.ts`) and rendered through `RichText` by `PostContent`, which
 * also subscribes to live preview so admin edits show up without a save.
 *
 * Draft Mode (the live-preview iframe) fetches through `posts.getBySlugPreview`
 * with the editor's own token instead — `getBySlug` is published-only, so a
 * never-published (draft-only) post — e.g. a brand-new announcement before
 * its first publish — always resolved to `[]` there, and `PostContent` used
 * to start on the published query (its SSR snapshot of `useIsLivePreviewActive`
 * is always `false`), flashing `NotFoundContent` before the client-side
 * preview query swapped in. Passing `draftMode` down makes `PostContent`'s
 * FIRST client render agree with this server render too (no hydration
 * mismatch, no flash). The `<meta name="vex-session">` hint lets
 * `components/providers/convex.tsx`'s `hasSessionHint()` see, synchronously
 * at hydration, that the iframe's Convex socket should start paused for auth
 * — `draftMode().isEnabled` is read here because Draft Mode is enabled
 * exclusively by the session-verified `/api/vex/live-preview` route handler,
 * so this stays safe to read unconditionally without widening the route's
 * own static/dynamic contract: outside Draft Mode the published branch below
 * never reads cookies at all.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const draft = await draftMode()
  if (draft.isEnabled) {
    const token = await getToken()
    const initialData = await fetchQuery(
      api.posts.getBySlugPreview,
      { slug },
      token ? { token } : undefined,
    )
    return (
      <>
        <meta name="vex-session" content="1" />
        <PostContent initialData={initialData} slug={slug} draftMode />
      </>
    )
  }

  const initialData = await vex.query(api.posts.getBySlug, { slug })
  if (initialData.length === 0) {
    notFound()
  }

  return <PostContent initialData={initialData} slug={slug} />
}
