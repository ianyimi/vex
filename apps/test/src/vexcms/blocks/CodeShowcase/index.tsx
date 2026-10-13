import type { BlockComponentProps } from "@vexcms/react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@vexcms/react"
import { Fragment } from "react"

import type { CodeShowcaseBlock } from "~/vex.types"

import { CodePane } from "~/components/CodePane"
import { Container } from "~/components/Container"
import { SectionHeader } from "~/components/SectionHeader"

export { codeShowcaseBlock } from "./config"



/**
 * CodeShowcase — the config, and the file it wrote.
 *
 * Two panes share one frame with a single seam, so the pairing reads as one
 * artefact rather than two cards. Three or more become a tab set inside the
 * same frame. Zero panes render nothing — an empty frame is worse than no
 * section.
 */
export default function CodeShowcaseBlock({ block }: BlockComponentProps) {
  const { heading, panes, subheading } = block as CodeShowcaseBlock
  const items = panes ?? []

  if (items.length === 0) {return null}

  const hasCaption = items.some((pane) => Boolean(pane.caption))

  return (
    <section className="py-14 md:py-20 xl:py-28">
      <Container>
        <SectionHeader heading={heading} subheading={subheading} />

        {items.length > 2 ? (
          <Tabs className="overflow-hidden rounded-md border border-border" defaultValue="0">
            <TabsList className="h-10 w-full justify-start rounded-none border-b border-border bg-card px-2">
              {items.map((pane, index) => (
                <TabsTrigger
                  className="rounded-sm px-3 py-[5px] text-[13px] font-medium"
                  key={`${pane.label}-${index}`}
                  value={String(index)}
                >
                  {pane.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {items.map((pane, index) => (
              <TabsContent key={`${pane.label}-panel-${index}`} value={String(index)}>
                <CodePane
                  code={pane.code}
                  filename={pane.filename}
                  language={pane.language}
                  tone={readTone(pane.authored)}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // The 1px middle track is the seam. `minmax(0,1fr)` on the pane
          // columns is what lets the panes scroll instead of overflowing.
          <div className="grid items-stretch overflow-hidden rounded-md border border-border xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
            {items.map((pane, index) => (
              // The keyed Fragment is what React needs: keys on the children
              // inside a bare `<>` do not count, so this logged "Each child in
              // a list should have a unique key prop" on every render.
              <Fragment key={`${pane.label}-${index}`}>
                {index > 0 ? (
                  <div aria-hidden className="bg-border max-xl:h-px xl:w-px" />
                ) : null}
                <CodePane
                  code={pane.code}
                  filename={pane.filename}
                  label={pane.label}
                  language={pane.language}
                  tone={readTone(pane.authored)}
                />
              </Fragment>
            ))}
          </div>
        )}

        {hasCaption ? (
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
            {items.map((pane, index) => (
              <Fragment key={`caption-${pane.label}-${index}`}>
                {index > 0 ? <div aria-hidden /> : null}
                <p className="text-[13px] leading-[1.55] text-muted-foreground">
                  {pane.caption ?? ""}
                </p>
              </Fragment>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}

/** `select` stores an array; `[0]` with a literal fallback survives both. */
function readTone(value: string | string[] | undefined): "authored" | "generated" {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === "authored" ? "authored" : "generated"
}
