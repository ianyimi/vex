"use client"

import { useState } from "react"

import { CopyButton } from "~/components/CopyButton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

/** Package managers the hero offers, in menu order (the docs' tabs use the same order). */
const MANAGERS = ["npm", "pnpm", "yarn", "bun", "deno"] as const
type Manager = (typeof MANAGERS)[number]

const CREATE_RE = /^(npm|pnpm|yarn|bun) create (\S+)((?: \S+)*)$/

/**
 * The same `create` command for every package manager, from one seeded command such as
 * `pnpm create vexcms@alpha`. npm needs `--` before flags; Deno runs the `create-` package
 * directly (`deno run -A npm:create-vexcms@alpha`).
 *
 * @param command - A `<npm|pnpm|yarn|bun> create <package>[@tag] [args]` command.
 * @returns One command per manager plus the manager the command was written for, or `null`
 *   when `command` isn't a create command (it then renders as is, without tabs).
 */
export function createCommands(
  command: string
): null | { commands: Record<Manager, string>; written: Manager } {
  const match = CREATE_RE.exec(command.trim())
  if (!match) {
    return null
  }
  const written = match[1] as Manager
  const pkg = match[2] ?? ""
  const rest = match[3] ?? ""
  const args = rest.trim().split(" ").filter(Boolean)
  const flagAt = args.findIndex((arg) => arg.startsWith("-"))
  const npmArgs = flagAt === -1 ? args : [...args.slice(0, flagAt), "--", ...args.slice(flagAt)]
  return {
    commands: {
      bun: ["bun create", pkg, ...args].join(" "),
      deno: [`deno run -A npm:create-${pkg}`, ...args].join(" "),
      npm: ["npm create", pkg, ...npmArgs].join(" "),
      pnpm: ["pnpm create", pkg, ...args].join(" "),
      yarn: ["yarn create", pkg, ...args].join(" "),
    },
    written,
  }
}

/**
 * The hero's install row — one bordered strip on the code-pane surface: a
 * package-manager select, the mono command, and a copy control. The select
 * only appears for a `create` command. The only client component in the hero.
 *
 * The select has a fixed width that fits every manager's name, and every
 * manager's command sits in the same grid cell (only the selected one
 * visible), so the strip is as wide as the longest command from the first
 * paint and changing the manager never resizes anything. The first paint
 * shows the manager the seeded command was written for, so the server render
 * and hydration agree; the choice isn't persisted, since reading it on the
 * server would make the prerendered home page dynamic.
 *
 * The `$` prompt is decoration: it is `aria-hidden` and never part of the
 * copied string, so pasting the result runs.
 *
 * @param props - Component props.
 * @param props.command - The command to display and copy.
 */
export function InstallCommand({ command }: { command: string }) {
  const derived = createCommands(command)
  const [active, setActive] = useState<Manager>(derived?.written ?? "npm")
  const shown = derived ? derived.commands[active] : command

  return (
    <div className="flex w-full max-w-full items-stretch rounded-sm border border-border bg-(--color-code-bg) sm:w-auto">
      {derived ? (
        <Select onValueChange={(value) => value && setActive(value)} value={active}>
          <SelectTrigger
            aria-label="Package manager"
            className="h-auto w-24 shrink-0 rounded-none rounded-l-sm border-0 border-r border-border bg-transparent py-1.5 pr-2 pl-3 font-mono text-[13px] text-(--color-code-fg) shadow-none dark:bg-transparent"
            size="sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANAGERS.map((pm) => (
              <SelectItem className="font-mono" key={pm} value={pm}>
                {pm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1.5 pl-3">
        <span aria-hidden className="shrink-0 font-mono text-[13px] text-(--color-code-dim)">
          $
        </span>
        {/* Below 640 the command scrolls rather than wrapping to two lines — a
            wrapped shell command reads as two commands. */}
        <code className="grid overflow-x-auto overscroll-x-contain text-left font-mono text-[13px] whitespace-pre text-(--color-code-fg)">
          <span className="col-start-1 row-start-1">{shown}</span>
          {derived
            ? MANAGERS.map((pm) => (
                <span aria-hidden className="invisible col-start-1 row-start-1" key={pm}>
                  {derived.commands[pm]}
                </span>
              ))
            : null}
        </code>
        <CopyButton
          className="text-(--color-code-dim) hover:bg-transparent hover:text-(--color-code-fg)"
          label={derived ? `Copy install command (${active})` : "Copy install command"}
          value={shown}
        />
      </div>
    </div>
  )
}
