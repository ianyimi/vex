import * as React from "react"

import { cn } from "../utils/cn"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      // Deliberately NOT a scroll container of its own (no `overflow-x`/`overflow-y`
      // here) — `DataTable.tsx`'s `ScrollArea` now owns BOTH axes of scrolling on
      // its own `Viewport` (a horizontal `ScrollBar` sits alongside the existing
      // vertical one there). Two earlier bugs both traced back to this div being
      // its own competing scroll container:
      // (1) `overflow-x-auto` alone computes `overflow-y` to `auto` too (CSS
      //     Overflow's "visible converts to auto when the other axis isn't
      //     visible" rule), silently making this div its own (never-actually-
      //     scrolling, since its height is auto = content height) vertical scroll
      //     container — `TableHeader`'s `sticky top-0` resolved against THIS
      //     never-scrolling div instead of the real vertical scroller one level up,
      //     so the header just scrolled away with the body instead of sticking
      //     (header stuck to the wrong scroll container).
      // (2) the horizontal scrollING itself then happened on THIS div, with a
      //     native browser scrollbar positioned at ITS OWN bottom edge — i.e. right
      //     after the last row, not pinned to the visible viewport's bottom. Since
      //     this div (and that trailing scrollbar) scrolls vertically along with
      //     the rest of the table inside `ScrollArea`'s own real vertical scroll,
      //     the horizontal scrollbar was only ever visible once scrolled all the
      //     way to the bottom — effectively hidden behind the rows the rest of the
      //     time. `ScrollArea`'s own styled horizontal
      //     `ScrollBar`, absolutely positioned against `ScrollArea.Root`, stays
      //     pinned to the viewport's bottom edge regardless of vertical scroll
      //     position instead.
      className="relative w-full"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "group/row border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=highlighted]:!bg-primary/10 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
