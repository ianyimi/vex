"use client";

import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "../../styles/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  );
}

const ResizablePanel = ResizablePrimitive.Panel;

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      // The element is 1px — the divider line, and the real boundary between
      // the panels, so every border inside a pane meets it. The grab zone
      // comes from `hitAreaMargins`, NOT from CSS: the library hit-tests
      // against `getBoundingClientRect()` plus these margins, so an overlaid
      // pseudo-element widens nothing it can see. Defaults are 5/15px; these
      // give a ~21px target without a single pixel of layout width.
      hitAreaMargins={{ coarse: 20, fine: 10 }}
      className={cn(
        "relative flex w-px shrink-0 items-center justify-center bg-border",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        className,
      )}
      {...props}
    >
      {withHandle && (
        // Absolutely positioned so it rides on top of the 1px line without
        // widening it, and opaque so the rule breaks cleanly around the grip.
        <div className="absolute left-1/2 z-20 flex h-5 w-3.5 -translate-x-1/2 items-center justify-center rounded-xs border bg-background">
          <GripVertical className="size-2.5 text-muted-foreground" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
