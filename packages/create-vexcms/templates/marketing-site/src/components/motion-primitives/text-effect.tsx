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
  const segments =
    per === "line" ? children.split("\n") : children.split(/(\s+)/).filter(Boolean)
  const step = stagger ?? defaultStagger[per]

  let animatedIndex = 0
  return (
    <Tag className={className}>
      {segments.map((segment, index) => {
        if (per === "word" && /^\s+$/.test(segment)) {
          return <React.Fragment key={index}>{segment}</React.Fragment>
        }
        const segmentDelay = delay + animatedIndex * step
        animatedIndex += 1
        return (
          <span
            className={cn(styles.item, per === "line" ? "block" : "inline-block")}
            key={index}
            style={{ "--reveal-delay": `${segmentDelay}s` } as CSSProperties}
          >
            {segment}
          </span>
        )
      })}
    </Tag>
  )
}
