import type { BlockComponentProps } from "@vexcms/react"

import Link from "next/link"

export { pricingBlock } from "./config"

/**
 * Pricing — single pricing card. Test-only: no www equivalent.
 */
export default function PricingBlock({ block }: BlockComponentProps) {
  const { badge, ctaHref, ctaLabel, description, features, highlighted, period, planName, price } = block as {
    badge?: string
    ctaHref?: string
    ctaLabel?: string
    description?: string
    features?: string[]
    highlighted?: boolean
    period?: string
    planName?: string
    price?: string
  }

  return (
    <section className="py-12">
      <div
        className={`${highlighted ? "border-primary ring-primary/20" : ""} rounded-lg border bg-card p-6 shadow-sm ring-2`}
      >
        {badge ? (
          <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {badge}
          </span>
        ) : null}
        <h3 className="text-xl font-bold">{planName}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period ? <span className="text-muted-foreground">{period}</span> : null}
        </div>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        {features && features.length > 0 ? (
          <ul className="mt-6 space-y-2">
            {features.map((feature, i) => (
              <li className="text-sm" key={`${feature}-${i}`}>
                ✓ {feature}
              </li>
            ))}
          </ul>
        ) : null}
        {ctaLabel ? (
          <Link
            className={`${highlighted ? "bg-primary hover:bg-primary/90" : "border hover:bg-accent"} mt-6 inline-flex w-full items-center justify-center rounded-md border-input bg-background px-6 py-3 text-sm font-medium text-primary-foreground`}
            href={ctaHref ?? "#"}
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
