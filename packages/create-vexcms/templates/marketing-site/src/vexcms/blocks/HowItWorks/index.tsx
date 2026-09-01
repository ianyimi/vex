"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { icons } from "lucide-react"

import { cn } from "~/lib/utils"

export { howItWorksBlock } from "./config"

function LucideIcon({ name }: { name: string }) {
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon className="size-5" />
}

export default function HowItWorksBlock({ block }: BlockComponentProps) {
  const { heading, subheading, steps } = block as unknown as {
    heading: string
    subheading?: string
    steps?: Array<{ icon?: string; title: string; description: string }>
  }

  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-balance lg:text-5xl">
            {heading}
          </h2>
          {subheading && (
            <p className="text-muted-foreground mt-4 text-balance">
              {subheading}
            </p>
          )}
        </div>

        <div className="mt-16">
          {(steps ?? []).map((step, index) => {
            const isLast = index === (steps?.length ?? 1) - 1

            return (
              <div key={index} className="flex flex-row gap-6">
                <div className="flex flex-col items-center">
                  <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
                    {step.icon ? (
                      <LucideIcon name={step.icon} />
                    ) : (
                      <span className="text-sm font-semibold">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  {!isLast && (
                    <div className="bg-border w-px flex-1" />
                  )}
                </div>
                <div className={cn("flex-1", !isLast && "pb-10")}>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
