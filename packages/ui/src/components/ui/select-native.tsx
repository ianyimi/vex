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
        "appearance-none dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-0 rounded-md border bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-3 md:text-sm outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] pr-8",
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
