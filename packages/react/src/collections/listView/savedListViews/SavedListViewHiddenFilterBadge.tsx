"use client";

import { Button, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../../../ui";

/** Props for {@link SavedListViewHiddenFilterBadge}. */
export interface SavedListViewHiddenFilterBadgeProps {
  /** The active view's `hiddenFilterCount` (`VexClientViewConfig`). Always ≥ 1 when this component is rendered. */
  count: number;
  /** The active view's own `description`, shown in the popover as the only explanation offered for the hidden condition (hidden from the UI, not secret). */
  description?: string;
}

/**
 * A lock badge naming how many filter conditions a config view hides from
 * the UI — never rendered as a filter chip or a
 * `ListViewFilterBuilder` row, since the condition isn't user-editable state.
 * Opening the popover shows the view's own `description` as the only
 * explanation offered; there is no way to inspect the hidden condition
 * itself from the client — the condition still ships in the client bundle like an access
 * rule, it just isn't surfaced here.
 *
 * @param props - See {@link SavedListViewHiddenFilterBadgeProps}.
 * @returns The lock badge button and its popover.
 */
export function SavedListViewHiddenFilterBadge(props: SavedListViewHiddenFilterBadgeProps) {
  const label = `${props.count} hidden filter${props.count === 1 ? "" : "s"}`;
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="default" icon="Lock" aria-label={label}>
            {props.count}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
          <PopoverDescription>
            {props.description ??
              "This view includes a filter condition that isn't shown here. It still only matches documents you have access to."}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
