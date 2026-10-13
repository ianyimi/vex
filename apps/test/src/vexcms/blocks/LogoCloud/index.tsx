import type { BlockComponentProps } from "@vexcms/react"

export { logoCloudBlock } from "./config"

/**
 * Logo Cloud — grid of logos. Test-only: no www equivalent.
 */
export default function LogoCloudBlock({ block }: BlockComponentProps) {
  const { logos, title } = block as {
    logos?: { image: string; link?: string; name: string }[]
    title?: string
  }

  return (
    <section className="py-12">
      {title ? (
        <h3 className="mb-6 text-center text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {(logos ?? []).map((logo, i) =>
          logo.link ? (
            <a href={logo.link} key={`${logo.name}-${i}`} rel="noopener noreferrer" target="_blank">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={logo.name}
                className="h-8 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                src={logo.image}
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={logo.name} className="h-8 opacity-60 grayscale" key={`${logo.name}-${i}`} src={logo.image} />
          ),
        )}
      </div>
    </section>
  )
}
