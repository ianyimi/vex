"use client";

import { useState } from "react";
import { VEX_VIEW_SOURCES, type VexViewSource } from "@vexcms/core";
import { Icon, ScrollSection } from "../../../../ui";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../ui/command";
import type { SavedListViewEntry } from "../useSavedListViews";

const TAB_DISPLAY_ORDER: Record<VexViewSource, number> = {
  [VEX_VIEW_SOURCES.default]: 0,
  [VEX_VIEW_SOURCES.config]: 1,
  [VEX_VIEW_SOURCES.shared]: 2,
  [VEX_VIEW_SOURCES.local]: 3,
};

/**
 * Overflow-menu group headings in the "All views" command list, by source.
 * `default` is unused here — the default ("All") view is always rendered as
 * its own hardcoded-position, ungrouped first item (there is only ever one),
 * never inside one of these three grouped sections — but `Record<VexViewSource, …>`
 * requires every source as a key.
 */
const SOURCE_GROUP_LABELS: Record<VexViewSource, string> = {
  [VEX_VIEW_SOURCES.default]: "",
  [VEX_VIEW_SOURCES.config]: "Preset views",
  [VEX_VIEW_SOURCES.shared]: "Shared views",
  [VEX_VIEW_SOURCES.local]: "Local views",
};

/**
 * Sorts `views` into display order (default, config, shared, local) — shared by the tab
 * row (`index.tsx`'s own `Tabs`) and {@link SavedListViewSwitcherMenu} below, via `index.tsx`'s
 * single `orderedViews` computation, so the two can never disagree on order.
 *
 * @param views - The views to order; not mutated.
 * @returns A new array in display order.
 */
export function sortViewsForDisplay<TFieldSlug extends string>(
  views: SavedListViewEntry<TFieldSlug>[],
): SavedListViewEntry<TFieldSlug>[] {
  return [...views].sort((a, b) => TAB_DISPLAY_ORDER[a.source] - TAB_DISPLAY_ORDER[b.source]);
}

/** Props for {@link SavedListViewSwitcherMenu}. */
export interface SavedListViewSwitcherMenuProps<TFieldSlug extends string> {
  /** Every view, already sorted via {@link sortViewsForDisplay} — the SAME list `index.tsx`'s tab row itself iterates. */
  orderedViews: SavedListViewEntry<TFieldSlug>[];
  /** The default ("All") view, when resolved — rendered as its own hardcoded-position, ungrouped first item. */
  defaultView: SavedListViewEntry<TFieldSlug> | undefined;
  activeViewId: string;
  onSelect: (viewId: string) => void;
}

/**
 * The "All views" switcher — a searchable `Command` list of every view, grouped by source
 * (config/shared/local, via {@link SOURCE_GROUP_LABELS}) with the default view always first,
 * ungrouped. Rendered inside `index.tsx`'s `DataTableResponsiveMenu` popover, which owns the
 * open/close (`menuOpen`) state; this component only owns its own search `query`.
 * @param props - See {@link SavedListViewSwitcherMenuProps}.
 * @returns The searchable view list.
 */
export function SavedListViewSwitcherMenu<TFieldSlug extends string>(
  props: SavedListViewSwitcherMenuProps<TFieldSlug>,
) {
  const [query, setQuery] = useState("");
  return (
    <Command>
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search views…" />
      <CommandList>
        <ScrollSection maxHeight={320}>
          <CommandEmpty>No views found.</CommandEmpty>
          {props.defaultView !== undefined && (
            <CommandItem value={props.defaultView.name} onSelect={() => props.onSelect("default")}>
              {props.defaultView.name}
              {props.activeViewId === "default" && <Icon name="Check" className="ml-auto size-3.5" />}
            </CommandItem>
          )}
          {([VEX_VIEW_SOURCES.config, VEX_VIEW_SOURCES.shared, VEX_VIEW_SOURCES.local] as const).map((source) => {
            const group = props.orderedViews.filter((view) => view.source === source);
            if (group.length === 0) return null;
            return (
              <CommandGroup key={source} heading={SOURCE_GROUP_LABELS[source]}>
                {group.map((view) => (
                  <CommandItem key={view.viewId} value={view.name} onSelect={() => props.onSelect(view.viewId)}>
                    {view.name}
                    {view.viewId === props.activeViewId && <Icon name="Check" className="ml-auto size-3.5" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </ScrollSection>
      </CommandList>
    </Command>
  );
}
