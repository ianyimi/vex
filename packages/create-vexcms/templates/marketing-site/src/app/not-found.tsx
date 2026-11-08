import type { Metadata } from "next"
import Link from "next/link"

import { ThemeStyle } from "~/components/ThemeStyle"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * Root fallback for a request that matches no route segment at all (e.g. a
 * multi-segment path like `/foo/bar`, which the `(site)/[slug]` catch-all
 * can't match). Without this file Next falls back to its own built-in 404,
 * which bypasses the app's root layout entirely — no `lang` on `<html>`, no
 * landmark structure.
 *
 * Outside every route group, so it emits `<ThemeStyle />` itself — mirrors
 * `app/unauthorized/page.tsx`.
 */
export default function NotFound() {
  return (
    <>
      <ThemeStyle />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-[32rem] text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link className="text-primary underline" href="/">
          Return to site
        </Link>
      </main>
    </>
  )
}
