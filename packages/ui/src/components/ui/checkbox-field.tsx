import * as React from "react";
import { cn } from "../../styles/utils";

function CheckboxField({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox-field"
      className={cn(
        "h-4 w-4 rounded border border-input bg-transparent shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "accent-primary",
        className,
      )}
      {...props}
    />
  );
}

export { CheckboxField };
