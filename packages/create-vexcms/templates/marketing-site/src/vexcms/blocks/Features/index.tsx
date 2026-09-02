import type { BlockComponentProps } from "@vexcms/react"

import { icons } from "lucide-react"

import type { FeaturesBlock } from "~/vex.types"

import { Container } from "~/components/Container"
import { SectionHeader } from "~/components/SectionHeader"

export { featuresBlock } from "./config"


/**
 * Features — six cards, hairline-joined.
 *
 * The grid is a 1px mesh (`gap-px` over a `bg-border` wrapper) rather than
 * gapped cards with shadows. Dark mode has no box-shadow at all, so gapped
 * cards would lose their separation there; the mesh reads identically in both
 * modes and suits the sharp radius.
 */
export default function FeaturesBlock({ block }: BlockComponentProps) {
  const { features, heading, subheading } = block as FeaturesBlock
  const items = features ?? []

  if (items.length === 0) {return null}

  return (
    <section className="py-14 md:py-20 xl:py-28">
      <Container>
        <SectionHeader heading={heading} subheading={subheading} />

        <div className="grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
          {items.map((feature, index) => {
            const Glyph = feature.icon ? icons[feature.icon as keyof typeof icons] : undefined
            return (
              <div className="bg-background p-6" key={`${feature.title}-${index}`}>
                {/* An unresolvable icon drops the frame entirely rather than
                    leaving an empty square; the title then starts the cell and
                    a mixed array still reads as intentional. */}
                {Glyph ? (
                  <span className="mb-4 flex size-8 items-center justify-center rounded-sm border border-border">
                    <Glyph className="size-4 text-primary" />
                  </span>
                ) : null}
                <h3 className="text-[17px] leading-[1.35] font-semibold tracking-[-0.01em] text-foreground xl:text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-[1.6] text-pretty text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
