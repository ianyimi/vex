"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useLivePreviewQuery } from "@vexcms/react"
import { RichText } from "@vexcms/richtext-plate/render"

import type { Post } from "~/vex.types"

import { Container } from "~/components/Container"
import { useSitePreviewMode } from "~/lib/useSitePreviewMode"

export interface PostContentProps {
  /** Server-fetched `posts.getBySlug` result, hydrated as the query's initial data. */
  initialData: Post[]
  /** URL slug to render. */
  slug: string
}

/**
 * Renders one post's title and richtext `body`, live-preview aware.
 *
 * Same base-layer swap as `PageContent`: `posts.getBySlug` (published,
 * `access.bypass`) normally, `posts.getBySlugPreview` (session-gated on
 * `readDrafts`) once `useSitePreviewMode` confirms a preview session.
 * `useLivePreviewQuery` then overlays the editor's unsaved values, so typing in the
 * admin's Plate editor re-renders `body` here without a save.
 */
export function PostContent({ initialData, slug }: PostContentProps) {
  const previewModeActive = useSitePreviewMode()

  const { data: post } = useLivePreviewQuery(
    {
      ...convexQuery(previewModeActive ? api.posts.getBySlugPreview : api.posts.getBySlug, {
        slug,
      }),
      initialData,
    },
    "posts",
  )

  if (!post) return null

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
      <RichText className="prose mt-8 max-w-[46rem]" content={post.body ?? []} />
    </Container>
  )
}
