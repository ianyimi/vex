import React, { type ComponentPropsWithRef, type CSSProperties } from "react"

import { cn } from "~/lib/utils"

import styles from "./reveal.module.css"

export type AnimatedGroupProps = ComponentPropsWithRef<"div"> & {
  as?: React.ElementType
  /** Seconds before the first child starts animating. */
  delay?: number
  /** Seconds between each child's start. */
  stagger?: number
}

/**
 * Staggers a blur + fade + rise entrance across its direct children using a
 * pure-CSS keyframe (see `reveal.module.css`) — no animation-library
 * dependency. Each child is wrapped in a div carrying the animation with an
 * incremented `animation-delay`.
 */
export function AnimatedGroup({
  as: Tag = "div",
  children,
  className,
  delay = 0,
  stagger = 0.05,
  ...divProps
}: AnimatedGroupProps) {
  return (
    <Tag className={className} {...divProps}>
      {React.Children.map(children, (child, index) => (
        <div
          className={styles.item}
          style={{ "--reveal-delay": `${delay + index * stagger}s` } as CSSProperties}
        >
          {child}
        </div>
      ))}
    </Tag>
  )
}

/**
 * Applies the same reveal animation to a single element without adding a
 * wrapper div — for callers that only need one animated child.
 */
export function AnimatedItem({
  children,
  className,
  delay = 0,
  ...divProps
}: ComponentPropsWithRef<"div"> & { delay?: number }) {
  return (
    <div
      className={cn(styles.item, className)}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
      {...divProps}
    >
      {children}
    </div>
  )
}
