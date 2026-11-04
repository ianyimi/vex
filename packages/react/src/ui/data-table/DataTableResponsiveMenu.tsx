"use client";

import type { ReactElement, ReactNode } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { cn } from "../../utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../sheet";

/**
 * Props for {@link DataTableResponsiveMenu}.
 */
export interface DataTableResponsiveMenuProps {
  /** Trigger element (typically a `Button`); rendered via `render` on `PopoverTrigger`/`SheetTrigger` in both containers — the same convention `DropdownMenuTrigger`'s own callers already use (Base UI's `render` prop, not an `asChild`/children wrapper). */
  trigger: ReactElement;
  /** Accessible title. Rendered as the `SheetTitle` on mobile; desktop omits a visible title to stay compact, matching `PopoverContent`'s existing callers. */
  title: string;
  /** Menu body, shared unchanged between the `Popover` and the `Sheet`. */
  children: ReactNode;
  /** Desktop `PopoverContent` alignment. Ignored on mobile. @default "end" */
  align?: "start" | "center" | "end";
  /** Controlled open state. Omitted (`undefined`) leaves the overlay uncontrolled — the common case for a plain menu. `ListViewFilterBuilder` controls this to seed a draft row on open before the overlay paints. */
  open?: boolean;
  /** Pairs with `open` for a controlled overlay. */
  onOpenChange?: (open: boolean) => void;
  /** Extra classes merged onto the DESKTOP `PopoverContent` only (e.g. a wider panel for a filter builder) — the mobile `SheetContent` keeps its own fixed `max-h-[85vh]` sizing, since a caller's desktop width override (`w-[520px]`) would overflow a narrow viewport instead of filling it. */
  className?: string;
}

/**
 * Renders one trigger + content pair as a `Popover` at `useIsMobile() === false`, and as a
 * bottom `Sheet` at `useIsMobile() === true` ("`useIsMobile` decides overlays only" — menus render as bottom sheets below
 * 768px, independent of the list container's own width). Every list-view menu composes this
 * instead of choosing `Popover` or `Sheet` itself, so they all collapse at the same viewport
 * boundary the same way: `DataTableColumnsMenu`, `ListViewFilterBuilder`, `SavedListViewTabs`'s mobile
 * view switcher, and `ListViewToolbar`'s ⋯ overflow all render through this one component.
 *
 * It never shifts first paint: it only opens on interaction (click/tap), so the server render
 * that prerenders the page is unaffected by which branch this component takes —
 * `useIsMobile` always returns a coerced boolean (`false` before its viewport-measuring effect
 * runs), so the first client render always takes the desktop (`Popover`) branch, with no
 * Sheet-then-Popover flash.
 *
 * @param props - Component props. See {@link DataTableResponsiveMenuProps}.
 * @returns The responsive trigger + content pair.
 */
export function DataTableResponsiveMenu(props: DataTableResponsiveMenuProps): ReactNode {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={props.onOpenChange}>
        <SheetTrigger render={props.trigger} />
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>{props.title}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">{props.children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={props.open} onOpenChange={props.onOpenChange}>
      <PopoverTrigger render={props.trigger} />
      <PopoverContent align={props.align ?? "end"} className={cn(props.className)}>
        {props.children}
      </PopoverContent>
    </Popover>
  );
}
