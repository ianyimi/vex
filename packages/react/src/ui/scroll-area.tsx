import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react";

import { cn } from "../utils/cn";

/**
 * Scrollable container built on Base UI `ScrollArea.Root` with a custom styled scrollbar.
 * `verticalScrollbarClassName` styles the vertical track only — e.g. `DataTable` uses it to
 * start the track below its sticky header row instead of overlapping it.
 */
function ScrollArea({
  className,
  children,
  verticalScrollbarClassName,
  ...props
}: ScrollAreaPrimitive.Root.Props & { verticalScrollbarClassName?: string }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar className={verticalScrollbarClassName} />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/** Styled scrollbar track and thumb used internally by `ScrollArea`. */
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      // `z-30` — Base UI's own scrollbar track is `position: absolute` with NO
      // z-index of its own (`z-index: auto`), a sibling of `Viewport` (not a
      // descendant), so it never shares a stacking context with anything inside
      // the scrolled content. Per the CSS stacking algorithm, a `z-index: auto`
      // positioned box paints in the SAME layer as non-positioned content
      // (painting step 6, "stack level 0 / auto"), strictly BELOW any descendant
      // that establishes its OWN stacking context via an explicit z-index —
      // which `DataTable.tsx`'s sticky header (`z-10`) and sticky/pinned cells
      // (up to `z-20`) both do, regardless of DOM nesting depth or paint order.
      // Without an explicit z-index here, those sticky cells painted ON TOP of
      // this scrollbar instead of the other way around — the horizontal
      // scrollbar (and the vertical one, at a narrower table width) rendered
      // visually hidden behind the table rows (developer-reported). `z-30`
      // outranks every sticky cell's own z-index unconditionally.
      className={cn(
        "z-30 flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
