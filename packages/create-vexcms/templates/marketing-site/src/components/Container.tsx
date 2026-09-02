import type { ReactNode } from "react"

import { cn } from "@vexcms/react"

/**
 * The site's single container. Every block uses it, so the left edge of a
 * heading in one block lines up with the left edge of a card in the next.
 *
 * `max-w-[1280px]` with 20 / 32 / 40px gutters. Nothing changes above `xl`
 * except centring. Prose-only sections nest a second `max-w-[46rem]` measure
 * inside this one rather than narrowing it.
 */
export function Container({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1280px] px-5 md:px-8 xl:px-10", className)}>
      {children}
    </div>
  )
}
