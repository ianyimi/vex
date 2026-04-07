import type { BlockComponentProps } from "@vexcms/ui"

import Link from "next/link"

import { cn } from "~/lib/utils"
import { buttonVariants } from "~/components/ui/button"

export { ctaBlock } from "./config"

export default function CTABlock({ block }: BlockComponentProps) {
  const { heading, subheading, actions } = block as unknown as {
    heading: string
    subheading?: string
    actions?: Array<{ label: string; href: string }>
  }

  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-balance lg:text-5xl">
            {heading}
          </h2>
          {subheading && <p className="mt-4">{subheading}</p>}

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {(actions ?? []).map((action, index) => (
              <Link
                key={index}
                href={action.href ?? "/"}
                className={cn(
                  buttonVariants({
                    size: "lg",
                    variant: index % 2 === 1 ? "outline" : "default",
                  })
                )}
              >
                <span>{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
