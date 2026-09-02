import type { BlockComponentProps } from "@vexcms/react"

import { cn } from "@vexcms/react"

import type { StatsBlock } from "~/vex.types"

import { Container } from "~/components/Container"
import { SectionHeader } from "~/components/SectionHeader"

export { statsBlock } from "./config"


/** Beyond this length the value stops being a headline number and has to
 *  step down a size to keep the cell from breaking. */
const LONG_VALUE_CHARS = 6

/**
 * Stats — four numbers on a raised band.
 *
 * Shorter than a standard block on purpose: this is a caption on the hero,
 * not a section. Cells are separated by 1px dividers rather than gaps, and
 * values are top-aligned per cell rather than baseline-aligned to each other,
 * so `"0"`, `"12"` and `"~30s"` all sit correctly next to one another.
 */
export default function StatsBlock({ block }: BlockComponentProps) {
  const { heading, items, subheading } = block as StatsBlock
  const stats = items ?? []

  if (stats.length === 0) {return null}

  return (
    <section className="border-y border-border bg-card py-10 md:py-14 xl:py-16">
      <Container>
        <SectionHeader heading={heading} subheading={subheading} />

        <dl
          className={cn(
            "grid grid-cols-1 divide-y divide-border md:divide-y-0",
            stats.length > 1 && "md:grid-cols-2 md:divide-x xl:grid-cols-4"
          )}
        >
          {stats.map((stat, index) => (
            <div
              className={cn(
                "flex flex-col items-start py-6 md:px-8 md:py-0",
                // The first cell of each row owns the left edge, so it must not
                // draw a divider; at md that is every other cell, at xl every
                // fourth. Rows after the first take a top rule instead.
                "md:[&:nth-child(odd)]:border-l-0 xl:[&:nth-child(odd)]:border-l xl:[&:nth-child(4n+1)]:border-l-0",
                index >= 2 && "md:border-t md:border-border xl:border-t-0",
                index >= 4 && "xl:border-t xl:border-border"
              )}
              key={`${stat.label}-${index}`}
            >
              <dd
                className={cn(
                  "font-extrabold tracking-[-0.04em] tabular-nums text-foreground",
                  stat.value.length > LONG_VALUE_CHARS
                    ? "text-3xl md:text-4xl"
                    : "text-[40px] leading-none md:text-5xl xl:text-[56px]"
                )}
              >
                {stat.value}
              </dd>
              <dt className="mt-3.5 text-[15px] font-semibold text-foreground">{stat.label}</dt>
              {stat.description ? (
                <p className="mt-2 max-w-[30ch] text-[13.5px] leading-[1.55] text-muted-foreground">
                  {stat.description}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
