import type { BlockComponentProps } from "@vexcms/react"

import { cn } from "@vexcms/react"
import { icons } from "lucide-react"

import type { SplitBlock } from "~/vex.types"

import { CodePane } from "~/components/CodePane"
import { Container } from "~/components/Container"
import { MediaImage } from "~/components/MediaImage"

export { splitBlock } from "./config"


/** Above this many bullets the list splits into two columns inside the text
 *  column rather than running to an unreadable length. */
const BULLET_COLUMN_THRESHOLD = 8

/**
 * Split — argument left, evidence right. Then swap.
 *
 * `mediaPosition: "left"` is expressed with order classes rather than a
 * reversed source order, so the reading order stays text-first for assistive
 * technology no matter which side the media sits on.
 */
export default function SplitBlock({ block }: BlockComponentProps) {
  const {
    body,
    bullets,
    code,
    codeFilename,
    codeLanguage,
    eyebrow,
    heading,
    image,
    media,
    mediaPosition,
  } = block as SplitBlock

  const requested = readOption(media, ["code", "image", "none"] as const, "code")
  // A fresh scaffold has an empty media library. Rather than paint a
  // placeholder box, an image variant with no image degrades to the prose
  // layout, which is a legitimate quiet section.
  const resolved =
    requested === "code" && !code ? "none" : requested === "image" && !image ? "none" : requested
  const position = readOption(mediaPosition, ["left", "right"] as const, "right")
  const items = bullets ?? []

  const bulletList =
    items.length > 0 ? (
      <ul
        className={cn(
          "flex list-none flex-col gap-3.5",
          items.length >= BULLET_COLUMN_THRESHOLD && "md:grid md:grid-cols-2 md:gap-x-8"
        )}
      >
        {items.map((bullet, index) => {
          const Glyph = bullet.icon ? icons[bullet.icon as keyof typeof icons] : undefined
          return (
            <li className="flex items-start gap-3" key={`${bullet.text}-${index}`}>
              <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
                {Glyph ? (
                  <Glyph className="size-4 text-primary" />
                ) : (
                  // Keeps the 16px indent so mixed arrays stay aligned.
                  <span className="size-1 rounded-4xl bg-primary" />
                )}
              </span>
              <span className="text-[15px] leading-[1.6] text-foreground">{bullet.text}</span>
            </li>
          )
        })}
      </ul>
    ) : null

  const textColumn = (
    <div className={cn("min-w-0", position === "left" && "xl:order-2")}>
      {eyebrow ? (
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-[26px] leading-[1.18] font-bold tracking-[-0.025em] text-balance text-foreground md:text-3xl xl:max-w-[20ch] xl:text-4xl",
          eyebrow && "mt-4"
        )}
      >
        {heading}
      </h2>
      <p className="mt-4 max-w-[46rem] text-base leading-[1.65] text-pretty text-muted-foreground">
        {body}
      </p>
      {resolved !== "none" && bulletList ? <div className="mt-7">{bulletList}</div> : null}
    </div>
  )

  if (resolved === "none") {
    // No media: bullets move into their own column as a divided list. With no
    // bullets either, the block collapses to a single prose measure.
    return (
      <section className="py-14 md:py-20 xl:py-28">
        <Container>
          {bulletList ? (
            <div className="grid gap-8 xl:grid-cols-[7fr_5fr] xl:gap-14">
              {textColumn}
              <ul className="flex list-none flex-col border-border xl:border-l xl:pl-7">
                {items.map((bullet, index) => {
                  const Glyph = bullet.icon ? icons[bullet.icon as keyof typeof icons] : undefined
                  return (
                    <li
                      className="flex items-start gap-3 border-b border-border py-3 last:border-b-0"
                      key={`divided-${bullet.text}-${index}`}
                    >
                      <span className="mt-[3px] flex size-4 shrink-0 items-center justify-center">
                        {Glyph ? (
                          <Glyph className="size-4 text-primary" />
                        ) : (
                          <span className="size-1 rounded-4xl bg-primary" />
                        )}
                      </span>
                      <span className="text-[15px] leading-[1.6] text-foreground">
                        {bullet.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="max-w-[46rem]">{textColumn}</div>
          )}
        </Container>
      </section>
    )
  }

  return (
    <section className="py-14 md:py-20 xl:py-28">
      <Container>
        <div
          className={cn(
            "grid items-start gap-8 md:grid-cols-2 md:gap-10 xl:items-center xl:gap-14",
            position === "left" ? "xl:grid-cols-[6fr_5fr]" : "xl:grid-cols-[5fr_6fr]"
          )}
        >
          {textColumn}

          <div className={cn("min-w-0", position === "left" && "xl:order-1")}>
            {resolved === "code" && code ? (
              <div className="overflow-hidden rounded-md border border-border">
                <CodePane
                  bodyClassName="max-h-[360px] md:max-h-[460px]"
                  code={code}
                  filename={codeFilename}
                  language={codeLanguage}
                />
              </div>
            ) : null}

            {resolved === "image" && image ? (
              <div className="overflow-hidden rounded-md border border-border bg-card">
                <MediaImage
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  height={720}
                  value={image}
                  width={960}
                />
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}

function readOption<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = Array.isArray(value) ? value[0] : value
  return (allowed as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback
}
