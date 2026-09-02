import { cn } from "@vexcms/react"

/**
 * The one section-header pattern: left-aligned, capped at a 36rem measure,
 * h2 then subheading, 40px above the block's content.
 *
 * When `subheading` is blank the gap drops to 32px rather than the h2 growing
 * to compensate — every block that has a heading uses this, so the rhythm has
 * to be decided once.
 *
 * @param props - Component props.
 * @param props.heading - Section h2.
 * @param props.subheading - Optional supporting line.
 * @param props.align - `center` is used only by FAQ and CTA.
 * @param props.className - Extra classes on the wrapper.
 */
export function SectionHeader({
  align = "left",
  className,
  heading,
  subheading,
}: {
  align?: "center" | "left"
  className?: string
  heading?: string
  subheading?: string
}) {
  if (!heading && !subheading) {return null}

  return (
    <div
      className={cn(
        "max-w-[36rem]",
        align === "center" && "mx-auto text-center",
        subheading ? "mb-8 xl:mb-10" : "mb-7 xl:mb-8",
        className
      )}
    >
      {heading ? (
        <h2 className="text-[26px] leading-[1.18] font-bold tracking-[-0.025em] text-balance text-foreground md:text-3xl xl:text-4xl">
          {heading}
        </h2>
      ) : null}
      {subheading ? (
        <p className="mt-4 text-[17px] leading-[1.6] text-pretty text-muted-foreground md:text-lg">
          {subheading}
        </p>
      ) : null}
    </div>
  )
}
