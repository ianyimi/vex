"use client";

import { columnEntryField, type ColumnEntry } from "@vexcms/core";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type TouchEvent as ReactTouchEvent,
} from "react";

/**
 * Developer decision 2026-10-29: column widths become deterministic — every data
 * column (every column except the pinned `select`/`actions` columns, which keep
 * their own distinct `w-12`/48px) gets this SAME width unless its own resolved
 * `ColumnDef.size` overrides it, eliminating the skeleton→data layout shift that
 * variable content-fit auto-sizing caused (`<Table>` renders `table-fixed`, so
 * the browser no longer measures content to size columns at all — these
 * explicit widths are the only sizing input). 12rem/192px: a round Tailwind-
 * scale value wide enough for a typical short text/date/status value without
 * wasting space across a typical 5-8 column table, same order of magnitude as
 * the row-actions/selection columns' own 48px but sized for actual content
 * instead of an icon. Also `useReactTable`'s own `defaultColumn.size` — the
 * fallback for any columnDef (an unmigrated caller's own, or a UI-field
 * synthetic column) that sets no `size` of its own.
 */
const DEFAULT_COLUMN_WIDTH_PX = 192;

/**
 * The floor a column can be dragged/arrow-keyed down to — narrow enough for a short label plus its sort/resize
 * affordances to stay legible, never zero or negative.
 */
export const MIN_COLUMN_WIDTH_PX = 60;

/**
 * Share of the table container's visible width a single column may grow to,
 * so a widened column never pushes every other column fully out of view.
 */
export const MAX_COLUMN_WIDTH_RATIO = 0.9;

/**
 * The maximum used before the container has been measured (server render and
 * first paint): 90% of a 1067px-wide table, a typical admin list on a 1280px
 * screen with the sidebar open.
 */
export const DEFAULT_MAX_COLUMN_WIDTH_PX = 960;

/** Pixels a single `ArrowLeft`/`ArrowRight` keypress on a resize handle adjusts width by — matches the drag gesture's own granularity, a comfortable, visibly-incremental jump without requiring many presses to reach a useful width. */
const RESIZE_STEP_PX = 12;

/**
 * The widest a column may be resized to for a given table container width.
 *
 * @param props - Input props.
 * @param props.containerWidth - The table container's visible width in CSS px.
 * @returns {@link MAX_COLUMN_WIDTH_RATIO} of the container width, rounded down,
 *   never below {@link MIN_COLUMN_WIDTH_PX}.
 */
export function resolveMaxColumnWidth(props: { containerWidth: number }): number {
  return Math.max(MIN_COLUMN_WIDTH_PX, Math.floor(props.containerWidth * MAX_COLUMN_WIDTH_RATIO));
}

/**
 * Clamps a requested column width into `[MIN_COLUMN_WIDTH_PX, maxWidth]`.
 *
 * @param props - Input props.
 * @param props.width - The requested width in CSS px.
 * @param props.maxWidth - The current maximum from {@link resolveMaxColumnWidth}.
 * @returns The rounded, clamped width.
 */
export function clampColumnWidth(props: { width: number; maxWidth: number }): number {
  return Math.min(props.maxWidth, Math.max(MIN_COLUMN_WIDTH_PX, Math.round(props.width)));
}

/**
 * Replaces ONE field's `width` override in a {@link ColumnEntry} array,
 * preserving every other entry (and that field's own `pinned`/`hidden`/
 * `enableSorting`/`enableHiding` overrides, if any) untouched — the shared
 * "commit a resize" step both the live-drag-end handler and the keyboard
 * resize handler below call, so the two input methods can't drift in how
 * they build the next array.
 *
 * @param columns - The column entries to update.
 * @param fieldId - Which entry's `width` to replace.
 * @param width - The new pixel width.
 * @returns A new array with that one entry's `width` replaced.
 */
function withResizedColumn(columns: ColumnEntry<string>[], fieldId: string, width: number): ColumnEntry<string>[] {
  return columns.map((entry) => {
    if (columnEntryField(entry) !== fieldId) return entry;
    return typeof entry === "string" ? { field: entry, width } : { ...entry, width };
  });
}

export interface UseDataTableColumnResizeResult {
  /** The field currently mid-drag, and its live (uncommitted) width — `null` when no drag is in progress. */
  liveDrag: { fieldId: string; width: number } | null;
  /** The field whose divider is currently highlighted (a drag in progress, or hover/focus on its handle) — `null` when none. */
  activeDividerFieldId: string | null;
  /** Imperatively sets which field's divider is hover/focus-highlighted — the header/spacer handles' own `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur`. */
  setHoveredDividerFieldId: (updater: string | null | ((prev: string | null) => string | null)) => void;
  /** Resolves a column's live render width — the committed `columnDef.size` (`getCollectionColumnDefs`'s own `resolveListViewColumnConfig`-sourced value, falling back to {@link DEFAULT_COLUMN_WIDTH_PX} for an unmigrated caller's own columnDef), overridden by {@link liveDrag} while that SPECIFIC field is being actively dragged. */
  liveWidth: (columnId: string, declaredSize: number | undefined) => number;
  /**
   * Starts a pointer-drag resize for one column's handle — `invert` is
   * `true` for a PINNED-RIGHT column (its handle sits on the LEFT edge,
   * dragging the mouse LEFT grows it, mirroring a normal/pinned-left
   * column's own RIGHT-edge handle, where dragging RIGHT grows). Locks
   * the `ScrollArea` `Viewport`'s own `scrollLeft` to its value at drag-start
   * for the gesture's full duration (without this, a
   * drag on a pinned column also scrolled the table, since the handle
   * sits inside the SAME scrollable container the drag's own pointer
   * events bubble through). `scroll-area-viewport`, not `table-container`
   * (`table.tsx`'s own doc comment: that div is deliberately NOT a scroll
   * container anymore — both scroll axes live on the `Viewport` now).
   */
  startResize: (
    fieldId: string,
    startWidth: number,
    invert: boolean,
  ) => (event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => void;
  /** A focused resize handle's keys, per the APG window splitter: `ArrowLeft`/`ArrowRight` step by 12px, `Home`/`End` jump to the minimum/maximum. A discrete, one-keypress commit (no live-drag intermediate state needed, unlike the pointer gesture). `invert` mirrors {@link startResize}'s own — a pinned-right column's `ArrowLeft` grows, `ArrowRight` shrinks. */
  handleResizeKeyDown: (
    fieldId: string,
    currentWidth: number,
    invert: boolean,
    event: KeyboardEvent<HTMLDivElement>,
  ) => void;
  /** The narrowest a column can be resized to ({@link MIN_COLUMN_WIDTH_PX}); a resize handle's `aria-valuemin`. */
  minColumnWidth: number;
  /** The widest a column can be resized to: {@link resolveMaxColumnWidth} of the measured table container, re-measured whenever it resizes ({@link DEFAULT_MAX_COLUMN_WIDTH_PX} before the first measurement); a resize handle's `aria-valuemax`. */
  maxColumnWidth: number;
}

/**
 * Owns the custom column-resize state `DataTable`'s header/body render loops
 * share: a transient, LIVE-DRAG-ONLY width override ("a resize
 * commits a NEW explicit width... never a transient-only UI state that
 * forgets itself on reload") — every column's COMMITTED width already lives
 * in `columnDef.size` (resolved from `columnEntries` one level up, by
 * `getCollectionColumnDefs`); this is JUST the live visual feedback for the
 * ONE field currently being dragged/arrow-keyed, cleared the instant the
 * gesture commits. A fully CUSTOM implementation (NOT TanStack's own
 * `columnResizing` feature) — needed for two reasons, both developer-
 * reported: (1) a PINNED-RIGHT column's own resize handle must grow/shrink
 * from its LEFT edge (dragging left grows, mirroring how a normal/pinned-
 * left column's RIGHT-edge handle works), which TanStack's built-in per-
 * TABLE `columnResizeDirection` can't do per-column; (2) the drag must
 * never move the table's own horizontal scroll position, which needs
 * direct control over the gesture's own event handlers, not just a
 * post-hoc effect watching TanStack's state.
 *
 * @param containerRef - `DataTable/index.tsx`'s own outer wrapper ref, used
 *   to look up the `ScrollArea` `Viewport` to lock during a drag.
 */
export function useDataTableColumnResize(
  containerRef: RefObject<HTMLDivElement | null>,
  columnEntries: ColumnEntry<string>[] | undefined,
  onColumnEntriesChange: ((columns: ColumnEntry<string>[]) => void) | undefined,
): UseDataTableColumnResizeResult {
  const liveDragRef = useRef<{ fieldId: string; width: number } | null>(null);
  const [liveDrag, setLiveDrag] = useState<{ fieldId: string; width: number } | null>(null);

  // Which column's own divider is CURRENTLY highlighted (developer-
  // reported: "on hover, focus, or while dragging the handle, the
  // column's divider line highlights... along the FULL height of the
  // column") — a drag in progress always wins (it's the more SPECIFIC,
  // committed-to gesture); otherwise whichever handle most recently
  // reported hover/focus, cleared the instant it reports neither.
  // `DIVIDER_HIGHLIGHT_CLASS`'s own doc comment explains how one id here
  // drives an independent `<div>` in EVERY row (header + every body row)
  // of that one column into looking like a single continuous line.
  const [hoveredDividerFieldId, setHoveredDividerFieldId] = useState<string | null>(null);
  const activeDividerFieldId = liveDrag?.fieldId ?? hoveredDividerFieldId;
  const [maxColumnWidth, setMaxColumnWidth] = useState(DEFAULT_MAX_COLUMN_WIDTH_PX);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      if (container.clientWidth === 0) return;
      setMaxColumnWidth(resolveMaxColumnWidth({ containerWidth: container.clientWidth }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  function commitResize(fieldId: string, width: number): void {
    if (columnEntries === undefined || !onColumnEntriesChange) return;
    onColumnEntriesChange(withResizedColumn(columnEntries, fieldId, Math.round(width)));
  }

  function startResize(fieldId: string, startWidth: number, invert: boolean) {
    return (event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>): void => {
      if ("button" in event && event.button !== 0) return;
      event.preventDefault();
      const startX = "touches" in event ? event.touches[0]!.clientX : event.clientX;
      const scrollEl = containerRef.current?.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
      const startScrollLeft = scrollEl?.scrollLeft ?? 0;
      function handleMove(moveEvent: MouseEvent | TouchEvent): void {
        const clientX = "touches" in moveEvent ? moveEvent.touches[0]!.clientX : (moveEvent as MouseEvent).clientX;
        const rawDelta = clientX - startX;
        const delta = invert ? -rawDelta : rawDelta;
        const nextWidth = clampColumnWidth({ width: startWidth + delta, maxWidth: maxColumnWidth });
        const next = { fieldId, width: nextWidth };
        liveDragRef.current = next;
        setLiveDrag(next);
        if (scrollEl) scrollEl.scrollLeft = startScrollLeft;
      }
      function handleUp(): void {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleUp);
        const final = liveDragRef.current;
        liveDragRef.current = null;
        setLiveDrag(null);
        if (final && final.fieldId === fieldId) commitResize(fieldId, final.width);
      }
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
      document.addEventListener("touchmove", handleMove);
      document.addEventListener("touchend", handleUp);
    };
  }

  function liveWidth(columnId: string, declaredSize: number | undefined): number {
    if (liveDrag && liveDrag.fieldId === columnId) return liveDrag.width;
    return declaredSize ?? DEFAULT_COLUMN_WIDTH_PX;
  }

  function handleResizeKeyDown(
    fieldId: string,
    currentWidth: number,
    invert: boolean,
    event: KeyboardEvent<HTMLDivElement>,
  ): void {
    let nextWidth: number;
    if (event.key === "Home") {
      nextWidth = MIN_COLUMN_WIDTH_PX;
    } else if (event.key === "End") {
      nextWidth = maxColumnWidth;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const rawDelta = event.key === "ArrowRight" ? RESIZE_STEP_PX : -RESIZE_STEP_PX;
      const delta = invert ? -rawDelta : rawDelta;
      nextWidth = clampColumnWidth({ width: currentWidth + delta, maxWidth: maxColumnWidth });
    } else {
      return;
    }
    event.preventDefault();
    commitResize(fieldId, nextWidth);
  }

  return {
    liveDrag,
    activeDividerFieldId,
    setHoveredDividerFieldId,
    liveWidth,
    startResize,
    handleResizeKeyDown,
    minColumnWidth: MIN_COLUMN_WIDTH_PX,
    maxColumnWidth,
  };
}
