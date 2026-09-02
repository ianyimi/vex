import type { BlockComponentProps } from "@vexcms/react"

import { buttonVariants, cn } from "@vexcms/react"
import Link from "next/link"

import type { CtaBlock } from "~/vex.types"

import { Container } from "~/components/Container"

export { ctaBlock } from "./config"


/**
 * CTA — the page's last surface.
 *
 * The only block permitted more air than a standard section: it is what
 * separates the page from the footer. Shares `bg-card` with Stats, so the two
 * must never sit adjacent.
 *
 * `actions` has no variant field, so the renderer assigns by index — first
 * solid, the rest outline.
 */
export default function CTABlock({ block }: BlockComponentProps) {
  const { actions, heading, subheading } = block as CtaBlock
  const items = actions ?? []

  return (
    <section className="border-y border-border bg-card py-16 text-center md:py-24 xl:py-32">
      <Container>
        <h2 className="mx-auto max-w-[24ch] text-[28px] leading-[1.12] font-bold tracking-[-0.03em] text-balance text-foreground md:text-4xl xl:text-[40px]">
          {heading}
        </h2>

        {subheading ? (
          <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-pretty text-muted-foreground">
            {subheading}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="mx-auto mt-9 flex w-full max-w-[320px] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
            {items.map((action, index) => (
              <Link
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: index === 0 ? "default" : "outline",
                  }),
                  "active:translate-y-px"
                )}
                href={action.href}
                key={`${action.label}-${index}`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
