"use client"

import { CopyButton } from "~/components/CopyButton"

/**
 * The hero's install row — a mono command on the code-pane surface with a copy
 * control. The only client component in the hero.
 *
 * The `$` prompt is decoration: it is `aria-hidden` and never part of the
 * copied string, so pasting the result runs.
 *
 * @param props - Component props.
 * @param props.command - The command to display and copy.
 */
export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="flex w-full max-w-full items-center gap-2 rounded-sm border border-border bg-[--color-code-bg] py-1.5 pr-1.5 pl-3 sm:w-auto">
      <span aria-hidden className="shrink-0 font-mono text-[13px] text-muted-foreground">
        $
      </span>
      {/* Below 640 the command scrolls rather than wrapping to two lines — a
          wrapped shell command reads as two commands. */}
      <code className="overflow-x-auto overscroll-x-contain font-mono text-[13px] whitespace-pre text-[--color-code-fg]">
        {command}
      </code>
      <CopyButton label="Copy install command" value={command} />
    </div>
  )
}
