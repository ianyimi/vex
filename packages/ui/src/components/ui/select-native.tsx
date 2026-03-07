import * as React from "react";
import { cn } from "../../styles/utils";

interface SelectNativeProps extends React.ComponentProps<"select"> {
  /** Placeholder shown as the first disabled option */
  placeholder?: string;
}

function SelectNative({
  className,
  placeholder,
  children,
  ...props
}: SelectNativeProps) {
  return (
    <select
      data-slot="select-native"
      className={cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

export { SelectNative, type SelectNativeProps };
