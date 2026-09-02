import { Input as InputPrimitive } from "@base-ui/react"
import { Loader2 } from "lucide-react"
import * as React from "react"

import { cn } from "../../lib/utils"

/**
 * Single-line text input with optional in-input loading spinner.
 *
 * When `loading` is true, a spinner renders on the right edge and the input
 * gains right padding. The default path (no `loading` prop) is unchanged —
 * a bare `<input>` element with no wrapper.
 *
 * @example
 * ```tsx
 * <Input value={query} onChange={onChange} loading={isPending} placeholder="Search…" />
 */
function Input({
  className,
  type,
  loading,
  ...props
}: React.ComponentProps<"input"> & { loading?: boolean }) {
  const input = (
    <InputPrimitive
      className={cn(
        "h-8 w-full min-w-0 rounded-sm border border-input bg-card px-2.5 py-1 text-[13px] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        loading && "pr-9",
        className
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  )
  if (!loading) {
    return input
  }
  return (
    <span className="relative block w-full">
      {input}
      <Loader2
        aria-hidden="true"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground pointer-events-none"
      />
    </span>
  )
}

export { Input }
