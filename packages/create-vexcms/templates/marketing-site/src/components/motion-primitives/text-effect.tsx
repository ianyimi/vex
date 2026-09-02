import React, { type CSSProperties } from "react"

import { cn } from "~/lib/utils"

import styles from "./reveal.module.css"

export type PerType = "line" | "word"

export type TextEffectProps = {
  as?: keyof React.JSX.IntrinsicElements
  children: string
  className?: string
  /** Seconds before the first segment starts animating. */
  delay?: number
  /** Split granularity for the stagger. Lines split on `\n`. */
  per?: PerType
  /** Seconds between each segment's start. */
  stagger?: number
}

const defaultStagger: Record<PerType, number> = {
  line: 0.15,
  word: 0.04,
}

/**
 * Staggered blur + fade + rise text entrance, split per word or per line —
 * pure CSS (see `reveal.module.css`), no animation-library dependency.
 * Word segments keep their trailing space inside the animated span so text
 * still wraps naturally.
 */
export function TextEffect({
  as = "p",
  children,
  className,
  delay = 0,
  per = "word",
  stagger,
}: TextEffectProps) {
  const Tag = as as React.ElementType
  const rawSegments =
    per === "line" ? children.split("\n") : children.split(/(\s+)/).filter(Boolean)
  const step = stagger ?? defaultStagger[per]

  // Whitespace segments are re-emitted verbatim so words still wrap, but they
  // must not consume a stagger slot. Both passes are pure: the React Compiler
  // rejects a counter reassigned inside a render-scope closure, because a
  // partially re-run render would resume from a stale count.
  const gaps = rawSegments.map((text) => per === "word" && /^\s+$/.test(text))
  const segments = rawSegments.map((text, index) => {
    if (gaps[index]) {return { delay: null, text }}
    const animatedBefore = gaps.slice(0, index).filter((isGap) => !isGap).length
    return { delay: delay + animatedBefore * step, text }
  })

  return (
    <Tag className={className}>
      {segments.map((segment, index) =>
        segment.delay === null ? (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        ) : (
          <span
            className={cn(styles.item, per === "line" ? "block" : "inline-block")}
            key={index}
            style={{ "--reveal-delay": `${segment.delay}s` } as CSSProperties}
          >
            {segment.text}
          </span>
        )
      )}
    </Tag>
  )
}
