/**
 * The VexCMS chevron, inline in the layout rather than in the media library.
 *
 * A freshly scaffolded project has an empty media library, so the mark cannot
 * be an upload — the header and footer would render a wordmark with a hole
 * next to it on first run. `logoImage` overrides this when an editor sets one.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 3.25 7.25 12.75a0.85 0.85 0 0 0 1.5 0L13.5 3.25"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="2.25"
      />
    </svg>
  )
}
