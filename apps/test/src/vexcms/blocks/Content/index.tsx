import type { BlockComponentProps } from "@vexcms/react"

export { contentBlock } from "./config"

/**
 * Content — free-form prose text block. Test-only: no www equivalent.
 */
export default function ContentBlock({ block }: BlockComponentProps) {
  const { align, body, maxWidth } = block as {
    align?: string[]
    body?: string
    maxWidth?: string[]
  }
  const alignClass = align?.[0] === "center" ? "text-center" : "text-left"
  const widthClass =
    maxWidth?.[0] === "full"
      ? "max-w-none"
      : maxWidth?.[0] === "wide"
        ? "max-w-4xl"
        : "max-w-2xl prose prose-neutral dark:prose-invert"

  return (
    <section className={`${alignClass} py-8`}>
      <div className={`${widthClass} mx-auto whitespace-pre-line`}>{body}</div>
    </section>
  )
}
