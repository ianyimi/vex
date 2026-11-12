"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { keepPreviousData } from "@tanstack/react-query"
import { useIsLivePreviewActive, useLivePreviewQuery } from "@vexcms/react"
import { RichText } from "@vexcms/richtext-plate/render"

import type { Post } from "~/vex.types"

import { Container } from "~/components/Container"

import { NotFoundContent } from "../../NotFoundContent"

export interface PostContentProps {
  /** Server-fetched `posts.getBySlug`/`posts.getBySlugPreview` result, hydrated as the query's initial data. */
  initialData: Post[]
  /** URL slug to render. */
  slug: string
  /**
   * True when `page.tsx` server-rendered this post from `posts.getBySlugPreview`
   * (Draft Mode is active for this request — the live-preview iframe reaches this
   * route carrying the editor's session). Forces the preview query on this
   * component's FIRST client render too: `useIsLivePreviewActive()`'s own server
   * snapshot is always `false` (it can't read the live-preview cookie/query param
   * until mount), so without this prop the first client render would pick
   * `getBySlug` — a hydration mismatch against the server's `getBySlugPreview`
   * render, which briefly flashed `NotFoundContent` for a draft-only post before
   * `useIsLivePreviewActive` caught up.
   */
  draftMode?: boolean
}

/**
 * Renders one post's title and richtext `body`, live-preview aware.
 *
 * Same base-layer swap as `PageContent`: `posts.getBySlug` (published,
 * `access.bypass`) normally, `posts.getBySlugPreview` (session-gated on
 * `readDrafts`) once `useIsLivePreviewActive` confirms a preview session OR the
 * server already rendered the preview layer (`draftMode` prop).
 * `useLivePreviewQuery` then overlays the editor's unsaved values, so typing in
 * the admin's Plate editor re-renders `body` here without a save.
 *
 * `placeholderData: keepPreviousData` keeps the last-shown document on screen
 * while a newly-keyed query (a slug change, or the published→preview swap once
 * `useIsLivePreviewActive` resolves client-side) is still loading, instead of
 * flipping to `undefined` mid-flight — `NotFoundContent` below renders only
 * once a query has SETTLED with no match, never while one is merely loading.
 *
 * Renders the shared `NotFoundContent` state — never a blank 200 — when no
 * post resolves: the published row can vanish mid-visit (unpublish flips the
 * live subscription's result to `[]`), and a preview session can expire
 * mid-preview (the preview query then returns `[]`, discarding `initialData`).
 */
export function PostContent({ initialData, slug, draftMode }: PostContentProps) {
  const previewModeActive = useIsLivePreviewActive() || Boolean(draftMode)

  const { data: post } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.posts.getBySlugPreview : api.posts.getBySlug, {
        slug,
      }),
      initialData,
      placeholderData: keepPreviousData,
    },
    "posts",
  )

  if (!post) return <NotFoundContent />

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
      <RichText className="prose mt-8 max-w-[46rem]" content={post.body ?? []} />
    </Container>
  )
}
