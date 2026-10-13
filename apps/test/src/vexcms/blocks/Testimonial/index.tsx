import type { BlockComponentProps } from "@vexcms/react"

export { testimonialBlock } from "./config"

/**
 * Testimonial — customer quote with author info. Test-only: no www equivalent.
 */
export default function TestimonialBlock({ block }: BlockComponentProps) {
  const { authorAvatar, authorName, authorRole, quote } = block as {
    authorAvatar?: string
    authorName?: string
    authorRole?: string
    quote?: string
  }

  return (
    <section className="py-12">
      <blockquote className="rounded-lg border bg-card p-6 shadow-sm">
        <p className="text-lg italic">&ldquo;{quote}&rdquo;</p>
        <footer className="mt-4 flex items-center gap-3">
          {authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={authorName} className="h-10 w-10 rounded-full" src={authorAvatar} />
          ) : null}
          <div>
            <cite className="font-semibold not-italic">{authorName}</cite>
            {authorRole ? <p className="text-sm text-muted-foreground">{authorRole}</p> : null}
          </div>
        </footer>
      </blockquote>
    </section>
  )
}
