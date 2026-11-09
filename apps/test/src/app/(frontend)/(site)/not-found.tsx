import type { Metadata } from "next"

import { NotFoundContent } from "./NotFoundContent"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * Renders inside `(site)/layout.tsx`'s skip-link/`<main>`/header/footer
 * chrome for every `notFound()` call within this group: an unseeded
 * `[slug]` path, a missing or unpublished post, or the home page before a
 * `home` document exists.
 */
export default function SiteNotFound() {
  return <NotFoundContent />
}
