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
 * Renders nothing while resolving, and nothing if the media document is gone —
 * callers pair it with a text fallback rather than reserving empty space.
 *
 * @param props - Component props.
 * @param props.value - Raw `upload()` field value.
 * @param props.alt - Accessible name. Empty string for decorative marks.
 * @param props.width - Intrinsic width hint for `next/image`.
 * @param props.height - Intrinsic height hint for `next/image`.
 * @param props.className - Classes applied to the rendered image.
 */
export function MediaImage({
  alt,
  className,
  height,
  value,
  width,
}: {
  alt: string
  className?: string
  height: number
  value: string | string[] | undefined
  width: number
}) {
  const mediaId = Array.isArray(value) ? value[0] : value

  const { data } = useQuery({
    ...convexQuery(
      api.vex.media.getUrl,
      mediaId ? { adapter: "convex", mediaId } : "skip"
    ),
    enabled: Boolean(mediaId),
  })

  const url = (data as undefined | { url?: string })?.url
  if (!url) {return null}

  return (
    <Image alt={alt} className={className} height={height} src={url} width={width} />
  )
}
