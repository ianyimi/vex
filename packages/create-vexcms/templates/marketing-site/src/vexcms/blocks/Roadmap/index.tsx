"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { cn, ScrollArea, Tabs, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipTrigger } from "@vexcms/react"
import { Check } from "lucide-react"
import { useState } from "react"

import type { RoadmapBlock } from "~/vex.types"

import { Container } from "~/components/Container"
import { SectionHeader } from "~/components/SectionHeader"

export { roadmapBlock } from "./config"



/**
 * Derived from the generated block type, never hand-written: `vex dev` emits
 * the literal union straight from the `select` options, so adding a status to
 * the config is a compile error here until this renderer handles it.
 */
type RoadmapItemStatus = RoadmapBlock["items"][number]["status"][number]

/**
 * Print order, and it is deliberately not the brief's Shipped-first order.
 * In progress is the page's news; Shipped is 15 rows of reassurance people
 * skim. Putting the reassurance first buries the news.
 */
const GROUP_ORDER: RoadmapItemStatus[] = ["in-progress", "planned", "future", "exploring", "shipped"]

const GROUP_LABEL: Record<RoadmapItemStatus, string> = {
  exploring: "Exploring",
  future: "Future",
  "in-progress": "In progress",
  planned: "Planned",
  shipped: "Shipped",
}

/** Below this many items the filter is noise — four short groups fit on one
 *  screen and the tab row costs more than it saves. */
const FILTER_MIN_ITEMS = 8

/**
 * Roadmap — four buckets of wildly different size, solved by giving each a
 * different density rather than a different colour.
 *
 * Every group is rendered server-side and toggled with `hidden`, so filtering
 * costs no request and the page is complete with JavaScript disabled.
 */
export default function RoadmapBlock({ block }: BlockComponentProps) {
  const { heading, items, subheading } = block as RoadmapBlock
  const all = items ?? []
  const [filter, setFilter] = useState<"all" | RoadmapItemStatus>("all")

  if (all.length === 0) {return null}

  const grouped = GROUP_ORDER.map((status) => ({
    entries: all.filter((item) => readStatus(item.status) === status),
    status,
  })).filter((group) => group.entries.length > 0)

  const showFilter = all.length >= FILTER_MIN_ITEMS

  return (
    <section className="py-14 md:py-20 xl:py-24">
      <Container>
        <SectionHeader heading={heading} subheading={subheading} />

        {showFilter ? (
          <Tabs
            className="mb-10"
            onValueChange={(value) => setFilter(value as "all" | RoadmapItemStatus)}
            value={filter}
          >
            <ScrollArea>
              <TabsList className="h-10 w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger className="rounded-sm px-3 py-[5px] text-[13px] font-medium" value="all">
                  All {all.length}
                </TabsTrigger>
                {grouped.map((group) => (
                  <TabsTrigger
                    className="rounded-sm px-3 py-[5px] text-[13px] font-medium"
                    key={group.status}
                    value={group.status}
                  >
                    {GROUP_LABEL[group.status]} {group.entries.length}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </Tabs>
        ) : null}

        <div className="flex flex-col gap-11">
          {grouped.map((group) => (
            <div
              className={cn(filter !== "all" && filter !== group.status && "hidden")}
              key={group.status}
            >
              <div className="flex items-center gap-3">
                <h3 className="sr-only">{GROUP_LABEL[group.status]}</h3>
                <StatusBadge status={group.status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {group.entries.length}
                </span>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </div>

              {group.status === "in-progress" ? (
                <div
                  className={cn(
                    "mt-5 grid gap-4",
                    // A single card should not sit in a half-empty row.
                    group.entries.length >= 2 && "md:grid-cols-2"
                  )}
                >
                  {group.entries.map((item, index) => (
                    <div
                      className="rounded-md border border-border bg-card p-5"
                      key={`${item.feature}-${index}`}
                    >
                      <p className="text-[17px] font-semibold text-foreground">{item.feature}</p>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-[1.6] text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {group.status === "planned" ? (
                <ul className="mt-4 grid list-none md:grid-cols-2 md:gap-x-10">
                  {group.entries.map((item, index) => (
                    <li
                      className="flex gap-3 border-b border-border py-[11px]"
                      key={`${item.feature}-${index}`}
                    >
                      <span
                        aria-hidden
                        className="mt-[7px] size-[5px] shrink-0 rounded-4xl border border-muted-foreground"
                      />
                      <span>
                        <span className="text-[15px] text-foreground">{item.feature}</span>
                        {item.description ? (
                          <span className="block text-[13.5px] leading-[1.55] text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {group.status === "exploring" || group.status === "future" ? (
                <ul className="mt-4 flex list-none flex-wrap gap-2">
                  {group.entries.map((item, index) => {
                    const chip = (
                      <span
                        className={cn(
                          "inline-block rounded-sm border border-dashed border-border px-3 py-[7px] text-sm text-muted-foreground",
                          item.description && "cursor-help"
                        )}
                      >
                        {item.feature}
                      </span>
                    )
                    return (
                      <li key={`${item.feature}-${index}`}>
                        {item.description ? (
                          <Tooltip>
                            <TooltipTrigger render={chip} />
                            <TooltipContent>{item.description}</TooltipContent>
                          </Tooltip>
                        ) : (
                          chip
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : null}

              {group.status === "shipped" ? (
                // Quieter than every other bucket on purpose: 15 rows of
                // reassurance that people skim rather than read.
                <ul className="mt-4 grid list-none md:grid-cols-2 md:gap-x-10">
                  {group.entries.map((item, index) => (
                    <li
                      className="flex gap-3 border-b border-border/60 py-2"
                      key={`${item.feature}-${index}`}
                    >
                      <Check aria-hidden className="mt-[3px] size-3.5 shrink-0 text-primary" />
                      <span>
                        <span className="text-[14.5px] text-muted-foreground">{item.feature}</span>
                        {item.description ? (
                          <span className="block text-[13px] leading-[1.5] text-muted-foreground/80">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

/**
 * `select` stores an array; the first entry is the selection.
 *
 * No validation or casting: codegen emits the literal union straight from the
 * config's options, so `status[0]` is already narrowed and an unhandled value
 * is a compile error rather than a runtime fallback.
 *
 * @param status - The stored `status` value.
 * @returns The selected status, defaulting to `planned` for an empty array.
 */
function readStatus(status: RoadmapItemStatus[]): RoadmapItemStatus {
  return status[0] ?? "planned"
}

/**
 * Status badge. All four share one geometry and differ only in border, fill,
 * and leading glyph — no second accent hue is introduced, and status is never
 * carried by colour alone.
 */
function StatusBadge({ status }: { status: RoadmapItemStatus }) {
  const base =
    "inline-flex items-center gap-1.5 rounded-4xl border px-2.5 py-[3px] text-xs font-medium tracking-[0.04em] uppercase"

  if (status === "in-progress") {
    return (
      <span className={cn(base, "border-primary/40 bg-primary/12 text-primary")}>
        {/* The one blessed decorative loop on the site. */}
        <span aria-hidden className="live-dot size-[5px] rounded-4xl bg-primary" />
        {GROUP_LABEL[status]}
      </span>
    )
  }
  if (status === "planned") {
    return (
      <span className={cn(base, "border-border text-muted-foreground")}>
        <span
          aria-hidden
          className="size-[5px] rounded-4xl border border-current bg-transparent"
        />
        {GROUP_LABEL[status]}
      </span>
    )
  }
  if (status === "exploring") {
    // Dashed is the "not committed" signal.
    return (
      <span className={cn(base, "border-dashed border-border text-muted-foreground")}>
        {GROUP_LABEL[status]}
      </span>
    )
  }
  return (
    <span className={cn(base, "border-border bg-card text-muted-foreground")}>
      <Check aria-hidden className="size-3 text-primary" />
      {GROUP_LABEL[status]}
    </span>
  )
}
