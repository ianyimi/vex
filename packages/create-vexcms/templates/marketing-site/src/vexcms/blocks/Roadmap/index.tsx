"use client"

import type { BlockComponentProps } from "@vexcms/react"

import { Check, Clock, Compass } from "lucide-react"
import { cn } from "@vexcms/react"

export { roadmapBlock } from "./config"

const statusConfig = {
  shipped: {
    label: "Shipped",
    icon: Check,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    icon: Clock,
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  planned: {
    label: "Planned",
    icon: Compass,
    badgeClass: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
  },
} as const

type RoadmapItem = { feature: string; description?: string; status: "shipped" | "coming-soon" | "planned" }
type StatusKey = keyof typeof statusConfig

const statusOrder: StatusKey[] = ["shipped", "coming-soon", "planned"]

export default function RoadmapBlock({ block }: BlockComponentProps) {
  const { heading, subheading, items } = block as unknown as {
    heading: string
    subheading?: string
    items?: RoadmapItem[]
  }

  const grouped = statusOrder
    .map((status) => ({
      status,
      config: statusConfig[status],
      items: (items ?? []).filter((item) => item.status === status && item.status in statusConfig),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <section className={cn("py-16 md:py-32")}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold text-balance lg:text-5xl">{heading}</h2>
          {subheading && <p className="text-muted-foreground mt-4 text-balance">{subheading}</p>}
        </div>

        {grouped.map((group, groupIndex) => {
          const StatusIcon = group.config.icon
          return (
            <div key={group.status} className={groupIndex === 0 ? "mt-16" : "mt-12"}>
              <div className="flex items-center gap-2">
                <StatusIcon className="size-5" />
                <h3 className="text-lg font-semibold">{group.config.label}</h3>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item, itemIndex) => {
                  const BadgeIcon = group.config.icon
                  return (
                    <div key={itemIndex} className="bg-card rounded-xl border p-5">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-medium">{item.feature}</span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                            group.config.badgeClass
                          )}
                        >
                          <BadgeIcon className="size-3" />
                          {group.config.label}
                        </span>
                      </div>
                      {item.description && <p className="text-muted-foreground mt-2 text-sm">{item.description}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
