"use client";

import { Smartphone, Tablet, Laptop, Monitor, Maximize } from "lucide-react";
import { Button } from "../components/ui/button";
import type { LivePreviewBreakpoint } from "@vexcms/core";

const ICON_MAP: Record<string, typeof Smartphone> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
};

/**
 * Renders breakpoint toggle buttons for the preview panel.
 * Includes a "Responsive" option that fills available space.
 *
 * @param props.breakpoints - Available breakpoints to display
 * @param props.selected - Currently selected breakpoint label, or null for responsive
 * @param props.onSelect - Callback when a breakpoint is selected (null = responsive)
 */
export function BreakpointSelector(props: {
  breakpoints: LivePreviewBreakpoint[];
  selected: string | null;
  onSelect: (breakpoint: LivePreviewBreakpoint | null) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button
        variant={props.selected === null ? "secondary" : "ghost"}
        size="sm"
        onClick={() => props.onSelect(null)}
        title="Responsive"
      >
        <Maximize className="h-4 w-4" />
      </Button>
      {props.breakpoints.map((breakpoint) => {
        const Icon = (breakpoint.icon && ICON_MAP[breakpoint.icon]) || Monitor;
        return (
          <Button
            key={breakpoint.label}
            variant={props.selected === breakpoint.label ? "secondary" : "ghost"}
            size="sm"
            onClick={() => props.onSelect(breakpoint)}
            title={`${breakpoint.label} (${breakpoint.width}×${breakpoint.height})`}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
