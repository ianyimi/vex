import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { LoaderCircle } from "lucide-react"

import { cn } from "../../styles/utils"

function Input({
  className,
  type,
  loading,
  ...props
}: React.ComponentProps<"input"> & { loading?: boolean }) {
  return (
    <div className="relative">
      <InputPrimitive
        type={type}
        data-slot="input"
        className={cn(
          "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] file:h-7 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          loading && "pr-8",
          className
        )}
        {...props}
      />
      {loading && (
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export { Input }
