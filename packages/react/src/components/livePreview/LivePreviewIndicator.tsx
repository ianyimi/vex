"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../styles/utils";

const POSITION_STORAGE_KEY = "vex-live-preview-indicator-position";

type LivePreviewIndicatorEdge = "left" | "right";

interface LivePreviewIndicatorPosition {
  edge: LivePreviewIndicatorEdge;
  /** Distance in pixels from the top of the viewport to the indicator's center. */
  offsetY: number;
}

const DEFAULT_POSITION: LivePreviewIndicatorPosition = {
  edge: "right",
  offsetY: 200,
};

/**
 * Reads the indicator's last dropped position. A UI convenience only —
 * unlike the panel's open/closed cookie, a wrong position on first paint is
 * cosmetic, not a content-shift problem, so plain `localStorage` (no SSR
 * concern) is enough.
 *
 * @returns The stored position, or the default when absent or unreadable.
 */
function readStoredPosition(): LivePreviewIndicatorPosition {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LivePreviewIndicatorPosition) : DEFAULT_POSITION;
  } catch {
    return DEFAULT_POSITION;
  }
}

/**
 * Persists the indicator's position after a drag.
 *
 * @param position - The edge and vertical offset the user dropped it at.
 */
function writeStoredPosition(position: LivePreviewIndicatorPosition): void {
  try {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // Ignored — same reasoning as useLivePreviewPanelState's cookie guard.
  }
}

/**
 * Whether this page is the top-level document rather than an embedded frame.
 *
 * Resolved after mount, never during render: `window` does not exist on the
 * server, and branching on it during the first client render would be a
 * hydration mismatch. The indicator is fixed-position, so appearing one frame
 * later shifts nothing.
 *
 * @returns `true` once confirmed top-level; `false` on the server and on the
 *   first client render.
 */
function useIsTopLevelWindow(): boolean {
  const [isTopLevel, setIsTopLevel] = useState(false);

  useEffect(() => {
    setIsTopLevel(window.top === window.self);
  }, []);

  return isTopLevel;
}

/**
 * Floating, draggable, collapsible badge marking the page as a live preview.
 * Rendered by `LivePreviewProvider` whenever preview mode is on — so it exists
 * on the real page however that page was opened.
 *
 * Renders nothing in an embedded frame: inside the admin's own split view the
 * panel already frames the preview and owns its controls, so a second "you are
 * viewing a live preview" badge is noise. Only a top-level document — a tab
 * opened from the panel's preview link, a duplicated tab, a manually-opened
 * preview URL — gets it.
 *
 * Collapsed: a small tab fixed to the last-dropped edge. Dragging it (plain
 * pointer events) previews the move live and snaps to the nearest edge on
 * release. Expanded: the "Live Preview" label.
 *
 * It carried a row of width presets calling `window.resizeTo` until the admin
 * dropped its pop-out button. `resizeTo` is a silent no-op unless the window
 * was opened by script, and a `target="_blank" rel="noreferrer"` link never
 * produces such a window, so the row could no longer render at all. The
 * panel's own breakpoint buttons remain the way to simulate widths.
 *
 * @returns The floating indicator, or `null` in an embedded frame.
 */
export function LivePreviewIndicator() {
  const [position, setPosition] = useState<LivePreviewIndicatorPosition>(() => readStoredPosition());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isTopLevelWindow = useIsTopLevelWindow();

  const dragStart = useRef<{ pointerStartY: number; offsetYStart: number } | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = {
        pointerStartY: event.clientY,
        offsetYStart: position.offsetY,
      };
      setIsDragging(true);
    },
    [position.offsetY],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStart.current) return;
      const pointerDeltaY = event.clientY - dragStart.current.pointerStartY;
      const nextOffsetY = Math.min(
        window.innerHeight,
        Math.max(0, dragStart.current.offsetYStart + pointerDeltaY),
      );
      setPosition((prev) => ({ ...prev, offsetY: nextOffsetY }));
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      setIsDragging(false);
      const snappedEdge: LivePreviewIndicatorEdge =
        event.clientX < window.innerWidth / 2 ? "left" : "right";
      const snappedPosition: LivePreviewIndicatorPosition = {
        edge: snappedEdge,
        offsetY: position.offsetY,
      };
      setPosition(snappedPosition);
      writeStoredPosition(snappedPosition);
    },
    [isDragging, position.offsetY],
  );

  // The admin's split view embeds the preview in an iframe and supplies its own
  // chrome; a badge in there would duplicate it. Only a top-level document gets
  // the indicator.
  if (!isTopLevelWindow) return null;

  return (
    <div
      className={cn(
        "fixed z-[9999] -translate-y-1/2 select-none",
        position.edge === "left" ? "left-0" : "right-0",
      )}
      style={{ top: position.offsetY }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {isExpanded ? (
        <div className="flex flex-col gap-2 rounded-md border bg-background p-3 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Live Preview</span>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="cursor-grab rounded-md border bg-background px-2 py-3 text-xs shadow-lg [writing-mode:vertical-rl]"
          onClick={() => setIsExpanded(true)}
        >
          Preview
        </button>
      )}
    </div>
  );
}
