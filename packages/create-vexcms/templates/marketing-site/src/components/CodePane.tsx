import { cn } from "@vexcms/react"

import { CopyButton } from "~/components/CopyButton"
import { highlightCode, toCodeLanguage } from "~/lib/highlight"

export type CodePaneProps = {
  /** Extra classes for the scroll body. */
  bodyClassName?: string
  /** Source text exactly as authored in the CMS. */
  code: string
  /** Optional filename shown in the chrome bar. */
  filename?: string
  /** Uppercase pane label. `text-primary` marks the hand-written pane. */
  label?: string
  /** Raw `language` field value — a `select`, so usually an array. */
  language?: string | string[]
  /** Marks this pane as the authored one, which is the only colour signal
   *  distinguishing human input from generated output. */
  tone?: "authored" | "generated"
}

/**
 * One code pane: a chrome bar and a scrolling body on the fixed dark surface.
 *
 * Shared by CodeShowcase and Split so the two never drift. A server
 * component — shiki runs here and the client receives only markup.
 */
export async function CodePane({
  bodyClassName,
  code,
  filename,
  language,
  label,
  tone = "generated",
}: CodePaneProps) {
  const resolvedLanguage = toCodeLanguage(language)
  const html = await highlightCode({ code, language: resolvedLanguage })

  return (
    // `min-w-0` is not optional. In a `1fr` grid track the longest line would
    // otherwise set the min-content width, the column would outgrow the frame,
    // and `overflow-x-auto` would never engage — the code gets clipped instead
    // of scrolling.
    <div className="flex min-w-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3.5">
        <div className="flex min-w-0 items-center gap-3">
          {label ? (
            <span
              className={cn(
                "shrink-0 text-[11px] font-medium tracking-[0.08em] uppercase",
                tone === "authored" ? "text-primary" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
          ) : null}
          {filename ? (
            <span className="hidden truncate font-mono text-xs text-muted-foreground sm:block">
              {filename}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {resolvedLanguage}
          </span>
          <CopyButton label={`Copy ${filename ?? "code"}`} value={code} />
        </div>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 overflow-auto overscroll-x-contain bg-[--color-code-bg] p-4 xl:px-4 xl:py-[18px]",
          "max-h-[420px] md:max-h-[560px]",
          bodyClassName
        )}
      >
        <pre className="font-mono text-xs leading-[1.7] whitespace-pre text-[--color-code-fg] xl:text-[12.5px]">
          {/* Highlighted server-side; the client ships no highlighter. */}
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </div>
  )
}
