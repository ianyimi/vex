import type { BlockComponentProps } from "@vexcms/react"

import { buttonVariants, cn } from "@vexcms/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { HeroBlock } from "~/vex.types"

import { Container } from "~/components/Container"
import { InstallCommand } from "~/components/InstallCommand"
import { AnimatedItem } from "~/components/motion-primitives/animated-group"
import { TextEffect } from "~/components/motion-primitives/text-effect"

export { heroBlock } from "./config"


/**
 * Hero — one headline, one command, no illustration.
 *
 * `full` is the landing hero: 90vh, centred, token-derived decorative
 * background, and the site's only entrance animation. `compact` is the
 * interior page-header band: left-aligned, no decoration, closed with a rule
 * so the block below starts against a line.
 */
export default function HeroBlock({ block }: BlockComponentProps) {
  const {
    badgeLink,
    badgeText,
    heading,
    installCommand,
    primaryCtaHref,
    primaryCtaLabel,
    secondaryCtaHref,
    secondaryCtaLabel,
    subheading,
    variant,
  } = block as HeroBlock

  const hasPrimary = Boolean(primaryCtaLabel && primaryCtaHref)
  const hasSecondary = Boolean(secondaryCtaLabel && secondaryCtaHref)

  if (readVariant(variant) === "compact") {
    return (
      <section className="border-b border-border pt-28 pb-10 md:pt-32 md:pb-14 xl:pt-36 xl:pb-16">
        <Container>
          {badgeText ? (
            <p className="mb-5 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
              {badgeText}
            </p>
          ) : null}

          <TextEffect
            as="h1"
            className="max-w-[24ch] text-[32px] leading-[1.12] font-bold tracking-[-0.03em] text-balance md:text-4xl xl:text-5xl"
            per="line"
          >
            {heading}
          </TextEffect>

          {subheading ? (
            <TextEffect
              as="p"
              className="mt-4 max-w-[64ch] text-[17px] leading-[1.6] text-pretty text-muted-foreground md:text-lg xl:text-[19px]"
              delay={0.1}
              per="line"
            >
              {subheading}
            </TextEffect>
          ) : null}

          {hasPrimary || hasSecondary ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {hasPrimary ? (
                <Link className={buttonVariants()} href={primaryCtaHref ?? "/"}>
                  {primaryCtaLabel}
                </Link>
              ) : null}
              {hasSecondary ? (
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={secondaryCtaHref ?? "/"}
                >
                  {secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </Container>
      </section>
    )
  }

  return (
    <section className="relative isolate flex min-h-[calc(100svh-7rem)] flex-col items-center justify-center overflow-hidden pt-24 pb-16 md:pt-28 md:pb-20 xl:pt-32 xl:pb-24">
      {/* Both layers derive from tokens, so a theme swap softens them rather
          than breaking them. No image, ever — a fresh scaffold has no media. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-80 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-primary/10 blur-[120px]"
      />

      <Container className="flex flex-col items-center text-center">
        {badgeText ? (
          <AnimatedItem>
            {badgeLink ? (
              <Link
                className="group inline-flex items-center gap-2 rounded-4xl border border-border bg-card py-[5px] pr-[6px] pl-3 text-[13px] font-medium text-muted-foreground transition-colors duration-[180ms] ease-[var(--ease-emphasized)] hover:border-primary/40"
                href={badgeLink}
              >
                {badgeText}
                <span className="flex size-5 items-center justify-center rounded-4xl bg-primary/14 text-primary transition-colors duration-[180ms] group-hover:bg-primary/22">
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-4xl border border-border bg-card px-3 py-[5px] text-[13px] font-medium text-muted-foreground">
                {badgeText}
              </span>
            )}
          </AnimatedItem>
        ) : null}

        <TextEffect
          as="h1"
          className={cn(
            "max-w-[18ch] text-[40px] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance md:text-[56px] xl:text-[72px]",
            badgeText && "mt-8"
          )}
          delay={0.08}
          per="word"
          stagger={0.04}
        >
          {heading}
        </TextEffect>

        {subheading ? (
          <AnimatedItem className="mt-7" delay={0.28}>
            <p className="max-w-[60ch] text-[17px] leading-[1.6] text-pretty text-muted-foreground md:text-lg xl:text-[19px]">
              {subheading}
            </p>
          </AnimatedItem>
        ) : null}

        {hasPrimary || hasSecondary ? (
          <AnimatedItem className="mt-10 w-full" delay={0.38}>
            <div className="mx-auto flex w-full max-w-[320px] flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              {hasPrimary ? (
                <Link
                  className={cn(buttonVariants({ size: "lg" }), "active:translate-y-px")}
                  href={primaryCtaHref ?? "/"}
                >
                  {primaryCtaLabel}
                </Link>
              ) : null}
              {hasSecondary ? (
                <Link
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "active:translate-y-px"
                  )}
                  href={secondaryCtaHref ?? "/"}
                >
                  {secondaryCtaLabel}
                </Link>
              ) : null}
            </div>
          </AnimatedItem>
        ) : null}

        {installCommand ? (
          <AnimatedItem className="mt-7 flex w-full justify-center" delay={0.46}>
            <InstallCommand command={installCommand} />
          </AnimatedItem>
        ) : null}
      </Container>
    </section>
  )
}

/**
 * `select` always stores an array. Reading `[0]` with a literal fallback keeps
 * a hand-edited scalar and an empty array both landing on the default.
 */
function readVariant(value: string | string[] | undefined): "compact" | "full" {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "compact" ? "compact" : "full"
}
