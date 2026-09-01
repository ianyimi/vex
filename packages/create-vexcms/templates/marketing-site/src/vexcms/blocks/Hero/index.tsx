"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { buttonVariants, cn } from "@vexcms/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { AnimatedGroup, AnimatedItem } from "~/components/motion-primitives/animated-group"
import { TextEffect } from "~/components/motion-primitives/text-effect"

export { heroBlock } from "./config"


export default function HeroBlock({ block }: BlockComponentProps) {
  const {
    badgeText,
    badgeLink,
    heading,
    subheading,
    primaryCtaLabel,
    primaryCtaHref,
    secondaryCtaLabel,
    secondaryCtaHref,
  } = block as unknown as Record<string, string>

  return (
    <div className="overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
      >
        <div className="absolute top-0 left-0 h-320 w-140 -translate-y-87.5 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="absolute top-0 left-0 h-320 w-60 [translate:5%_-50%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        <div className="absolute top-0 left-0 h-320 w-60 -translate-y-87.5 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      <section>
        <div className="relative min-h-[90vh] flex flex-col items-center justify-center">
          <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]" />
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto">
              {badgeText && badgeLink && (
                <AnimatedItem>
                  <Link
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                    href={badgeLink}
                  >
                    <span className="text-foreground text-sm">{badgeText}</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700" />
                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </AnimatedItem>
              )}

              <TextEffect
                as="h1"
                className="mt-8 text-6xl text-balance md:text-7xl lg:mt-16 xl:text-[5.25rem]"
              >
                {heading ?? ""}
              </TextEffect>
              <TextEffect
                as="p"
                className="mx-auto mt-8 max-w-2xl text-lg text-balance text-muted-foreground"
                delay={0.5}
                per="line"
              >
                {subheading ?? ""}
              </TextEffect>

              <AnimatedGroup
                className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                delay={0.75}
              >
                <div className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                  <Link
                    className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-5 text-base")}
                    href={primaryCtaHref ?? "/"}
                  >
                    <span className="text-nowrap">{primaryCtaLabel}</span>
                  </Link>
                </div>
                {secondaryCtaLabel && (
                  <Link
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "lg" }),
                      "h-10.5 rounded-xl px-5"
                    )}
                    href={secondaryCtaHref ?? "/"}
                  >
                    <span className="text-nowrap">{secondaryCtaLabel}</span>
                  </Link>
                )}
              </AnimatedGroup>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
