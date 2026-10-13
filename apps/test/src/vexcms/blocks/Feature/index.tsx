import type { BlockComponentProps } from "@vexcms/react"

import Link from "next/link"

export { featureBlock } from "./config"

/**
 * Feature — single feature card. Test-only: distinct slug ("feature") from
 * www's grid-based "features" block, kept alongside it.
 */
export default function FeatureBlock({ block }: BlockComponentProps) {
  const { description, icon, linkHref, linkLabel, title } = block as {
    description?: string
    icon?: string
    linkHref?: string
    linkLabel?: string
    title?: string
  }

  return (
    <section className="py-12">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        {icon ? <span className="mb-2 text-2xl">{icon}</span> : null}
        <h3 className="text-xl font-semibold">{title}</h3>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        {linkLabel ? (
          <Link
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            href={linkHref ?? "#"}
          >
            {linkLabel} →
          </Link>
        ) : null}
      </div>
    </section>
  )
}
