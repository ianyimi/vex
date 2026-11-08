"use client"

import { convexQuery } from "@convex-dev/react-query"
import { api } from "@convex/_generated/api"
import { useQuery } from "@tanstack/react-query"
import Image from "next/image"

/**
 * Renders an `upload()` field value as a `next/image`.
 *
 * An `upload()` field stores an **array of media ids**, not a URL, so the id
 * has to be exchanged for a public URL through the storage adapter before
 * anything can be rendered. Passing the field value straight to `src` sets it
 * to a Convex document id and renders a broken image.
 *
 * Client-side by design: it is used from both the client Header and the
 * server Footer, and one component with one code path beats a server and a
 * client variant that can drift.
 *
 * Renders nothing until the URL has resolved — and, when `alt` is omitted,
 * until the media document's own `alt` has resolved too, so the image never
 * paints with a stale `alt=""` before the real value arrives. Also nothing
 * if the media document is gone — callers pair it with a text fallback
 * rather than reserving empty space.
 *
 * @param props - Component props.
 * @param props.value - Raw `upload()` field value.
 * @param props.alt - Accessible name. Omit to read the media document's own
 *   `alt` field (what an editor typed in the media library); pass `""` to
 *   force decorative regardless of what the document holds.
 * @param props.width - Intrinsic width hint for `next/image`.
 * @param props.height - Intrinsic height hint for `next/image`.
 * @param props.sizes - `next/image` `sizes`. Required whenever the rendered
 *   width tracks the viewport (a `w-full`-style `className`) rather than
 *   staying fixed — omitting it serves every viewport the same source width.
 * @param props.className - Classes applied to the rendered image.
 */
export function MediaImage({
  alt,
  className,
  height,
  sizes,
  value,
  width,
}: {
  alt?: string
  className?: string
  height: number
  sizes?: string
  value: string | string[] | undefined
  width: number
}) {
  const mediaId = Array.isArray(value) ? value[0] : value
  const needsAlt = alt === undefined && Boolean(mediaId)

  const { data } = useQuery({
    ...convexQuery(
      api.vex.media.getUrl,
      mediaId ? { adapter: "convex", mediaId } : "skip"
    ),
    enabled: Boolean(mediaId),
  })

  const { data: doc, isPending: altPending } = useQuery({
    ...convexQuery(
      api.images.getById,
      needsAlt && mediaId ? { id: mediaId } : "skip"
    ),
    enabled: needsAlt,
  })

  const url = (data as undefined | { url?: string })?.url
  if (!url) {return null}
  if (needsAlt && altPending) {return null}

  const resolvedAlt = alt ?? (doc as undefined | { alt?: string })?.alt ?? ""

  return (
    <Image alt={resolvedAlt} className={className} height={height} sizes={sizes} src={url} width={width} />
  )
}
