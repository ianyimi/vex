"use client"

import Link from "next/link"

import { Container } from "~/components/Container"

/**
 * Body of `not-found.tsx`, split into its own client component because
 * `Container` calls `cn()` from `@vexcms/react`'s client bundle — a Server
 * Component (which `not-found.tsx` must stay, to keep its `metadata`
 * export) cannot call a client-only function. Same split as `app/tour/page.tsx`
 * + `TourContent.tsx`.
 */
export function NotFoundContent() {
  return (
    <Container className="py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mx-auto mt-4 max-w-[32rem] text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link className="mt-6 inline-block text-primary underline" href="/">
        Return to home
      </Link>
    </Container>
  )
}
