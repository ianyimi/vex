"use client"

import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from "@vexcms/react"
import { Check, Copy } from "lucide-react"
import { useEffect, useRef, useState } from "react"

/** How long the confirmed state holds before reverting to the copy glyph. */
const CONFIRM_MS = 1600

/**
 * Copy-to-clipboard control shared by the hero install row and every code
 * pane, so the confirmation timing and the screen-reader announcement are
 * identical everywhere they appear.
 *
 * @param props - Component props.
 * @param props.value - Exact string written to the clipboard. Callers strip
 *   decoration (the `$` prompt, chrome) before passing it.
 * @param props.label - Accessible name for the control.
 * @param props.className - Extra classes for the trigger.
 */
export function CopyButton({
  className,
  label = "Copy",
  value,
}: {
  className?: string
  label?: string
  value: string
}) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<null | number>(null)

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current ?? undefined)
    }
  }, [])

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      window.clearTimeout(timeoutRef.current ?? undefined)
      timeoutRef.current = window.setTimeout(() => setIsCopied(false), CONFIRM_MS)
    })
  }

  const trigger = (
    <Button
      aria-label={label}
      className={cn(
        "shrink-0 transition-colors duration-[180ms] ease-[var(--ease-emphasized)] active:translate-y-px",
        isCopied && "text-primary",
        className
      )}
      onClick={handleCopy}
      size="icon-xs"
      type="button"
      variant="ghost"
    >
      {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  )

  return (
    <>
      {/* Tooltips are pointer affordances; the live region is what carries the
          confirmation to assistive tech. */}
      <span aria-live="polite" className="sr-only">
        {isCopied ? "Copied" : ""}
      </span>
      <span className="hidden md:contents">
        <Tooltip>
          <TooltipTrigger render={trigger} />
          <TooltipContent>{isCopied ? "Copied" : label}</TooltipContent>
        </Tooltip>
      </span>
      <span className="contents md:hidden">{trigger}</span>
    </>
  )
}
