"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "../../styles/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  align = "start",
  sideOffset = 4,
  children,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Popup> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Portal container — pass a ref to render inside a dialog's stacking context */
  container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
}) {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Positioner align={align} sideOffset={sideOffset}>
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-[100] w-auto rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverContent };
