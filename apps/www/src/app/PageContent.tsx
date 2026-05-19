"use client"
import Link from "next/link"

/**
 * Props for the `PageContent` component.
 *
 * @example
 * ```tsx
 * <PageContent page={{ _id: "abc123", title: "About Us", slug: "about-us", content: "..." }} />
 * ```
 */
export interface PageContentProps {
  /** The page document to render. */
  page: Page;
}

import type { Page } from "~/vex.types.ts"

/**
 * Renders a public-facing page with title, optional content body, and an admin link.
 *
 * Displays the page `title` as the heading and `content` as a plain-text body
 * (whitespace preserved). A "Go to Admin" button links to `/admin`.
 *
 * @param props.page - The page document to render.
 */
export default function PageContent({ page }: PageContentProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Admin link section */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <Link
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          href="/admin"
        >
          Go to Admin
        </Link>
      </section>

      {/* Hero section */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-32">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{page.title}</h1>
      </section>

      {/* Content section */}
      {page.content && (
        <section className="mx-auto max-w-3xl px-6 pb-20">
          <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line">
            {page.content}
          </div>
        </section>
      )}
    </main>
  )
}
