import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react";
import { Loader2 } from "lucide-react";

import { cn } from "../../styles/utils";

/**
 * Single-line text input with optional in-input loading spinner.
 *
 * When `loading` is true, a spinner renders absolutely positioned on the
 * right edge and the input gains right padding (`pr-9`). The default path
 * (no `loading` prop) is unchanged — a bare `<input>` element with no wrapper.
 *
 * `loading` is mutually visible with any other right-side adornment;
 * consumers should not stack right adornments and `loading` simultaneously.
 *
 * @example
 * ```tsx
 * <Input
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 *   loading={isPending}
 *   placeholder="Search…"
 * />
 * ```
 */
function Input({
  className,
  type,
  loading,
  ...props
}: React.ComponentProps<"input"> & { loading?: boolean }) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-sm border border-input bg-card px-2.5 py-1 text-[13px] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground-subtle focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        loading && "pr-9",
        className,
      )}
      {...props}
    />
  );
  if (!loading) return input;
  return (
    <span className="relative block w-full">
      {input}
      <Loader2
        aria-hidden="true"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground-subtle pointer-events-none"
      />
    </span>
  );
}

export { Input };
