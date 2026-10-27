"use client";

import { type RefObject, useLayoutEffect, useRef, useState } from "react";

/** Which built-ins {@link useHeaderActionsCollapse} currently collapses into the ⋯ menu. */
export interface HeaderActionsCollapseState {
  /** `true` once the header row is too narrow to hold `vex.delete` inline. */
  collapseDelete: boolean;
  /** `true` once the header row is narrower still, and `vex.livePreview` ALSO collapses. */
  collapsePreview: boolean;
  /**
   * `true` once the header row is narrower still, and `vex.cancel` ALSO collapses — a versioned
   * document's inline set (⋯, status badge, Save Draft, Publish/Unpublish, Cancel) alone already
   * overflows a ~375px-wide header even with the title shrunk to its floor and both Delete and
   * Preview already collapsed; Cancel is the only remaining candidate narrow enough to free
   * meaningful width without touching Save/Publish/Unpublish, which this hook never collapses.
   */
  collapseCancel: boolean;
}

const NOT_COLLAPSED: HeaderActionsCollapseState = {
  collapseDelete: false,
  collapsePreview: false,
  collapseCancel: false,
};

/**
 * Minimum rendered width (px) of the title's value span — the "new post title" part of "Edit Post
 * - new post title" — below which it stops shrinking and truncates with an ellipsis instead.
 * `CollectionEditView`/`GlobalEditView` set this as the span's inline `minWidth` style, so the
 * constant here and the rendered floor can never drift apart.
 */
export const HEADER_TITLE_VALUE_MIN_WIDTH_PX = 144;

/** The header row's `gap-2` between the title group and the actions group, in px. */
const HEADER_GAP_PX = 8;

/**
 * Extra slack (px) a collapsed action's freed width must clear before it is restored — keeps a
 * resize that lands exactly on the collapse boundary from flipping the state back and forth every
 * frame (the classic container-query hysteresis problem: collapsing frees width, which un-collapses,
 * which re-overflows, …).
 */
const COLLAPSE_HYSTERESIS_PX = 16;

type CollapseKey = keyof HeaderActionsCollapseState;

/**
 * Collapse order: `vex.delete` first (last item in the ⋯ menu), `vex.livePreview` second (first
 * item), `vex.cancel` third (narrowest — only once Delete and Preview collapsing still isn't
 * enough to fit the row).
 */
const COLLAPSE_ORDER: CollapseKey[] = ["collapseDelete", "collapsePreview", "collapseCancel"];

/** Elements {@link useHeaderActionsCollapse} measures. */
export interface HeaderActionsCollapseRefs {
  /** The header row — its `clientWidth` is the space available for title + actions. */
  header: RefObject<HTMLElement | null>;
  /** The title's `shrink-0` "Edit X - " prefix span — always rendered at its natural width. */
  titlePrefix: RefObject<HTMLElement | null>;
  /**
   * The `shrink-0` actions group (⋯ trigger, status badge, header actions) — always rendered at
   * its natural width for whichever actions are currently inline.
   */
  actions: RefObject<HTMLElement | null>;
}

/**
 * Measures an edit view's header row via `ResizeObserver` and reports which built-ins should
 * collapse into the `edit.actionsMenu` ⋯ menu to keep the header on one row as it narrows. Same
 * measurement paradigm as `forms/FormCompactContext.tsx`'s `useMeasuredCompact`, but driven by
 * actual overflow instead of a fixed width.
 *
 * Both `titlePrefix` and `actions` are `shrink-0` — flexbox never compresses them, so their
 * `scrollWidth` is always their true natural width, collapsed or not. That lets `needed` (the
 * title's floor plus the actions group's current width) compare directly against the header's
 * available width, instead of reading the header row's own `scrollWidth`: a non-overflowing
 * container's `scrollWidth` saturates at `clientWidth`, which would make "how much slack is left"
 * unmeasurable exactly when restoring a collapsed action needs it most.
 *
 * Each time `needed` exceeds the header's width, the next action in {@link COLLAPSE_ORDER} not yet
 * collapsed moves into the menu (`vex.delete`, then `vex.livePreview`, then `vex.cancel`);
 * `vex.save`/History/Publish/Unpublish never collapse — they simply aren't candidates here. Each
 * collapse's freed width (the drop in the actions group's `scrollWidth` it produced) is
 * remembered and used as a restore threshold: a collapsed action only comes back once the row has
 * at least that much slack again, plus {@link COLLAPSE_HYSTERESIS_PX} — so a resize that lands
 * exactly on the boundary doesn't thrash.
 *
 * @param refs - The header row, title prefix, and actions group elements to measure.
 * @returns `{ collapseDelete, collapsePreview, collapseCancel }` — all `false` until every element is measured (width 0: not laid out yet, or no layout engine).
 */
export function useHeaderActionsCollapse(
  refs: HeaderActionsCollapseRefs,
): HeaderActionsCollapseState {
  const [state, setState] = useState<HeaderActionsCollapseState>(NOT_COLLAPSED);
  const freedWidths = useRef<Record<CollapseKey, number>>({
    collapseDelete: 0,
    collapsePreview: 0,
    collapseCancel: 0,
  });
  const pending = useRef<{ key: CollapseKey; actionsWidthBefore: number } | null>(null);

  useLayoutEffect(() => {
    const header = refs.header.current;
    const titlePrefix = refs.titlePrefix.current;
    const actions = refs.actions.current;
    if (!header || !titlePrefix || !actions) return;

    const measure = () => {
      const headerWidth = header.clientWidth;
      if (headerWidth === 0) return;
      const actionsWidth = actions.scrollWidth;

      if (pending.current) {
        const freed = pending.current.actionsWidthBefore - actionsWidth;
        if (freed > 0) freedWidths.current[pending.current.key] = freed;
        pending.current = null;
      }

      const titleMinWidth = titlePrefix.scrollWidth + HEADER_TITLE_VALUE_MIN_WIDTH_PX;
      const needed = titleMinWidth + HEADER_GAP_PX + actionsWidth;
      const overflow = needed - headerWidth;

      if (overflow > 0) {
        const next = COLLAPSE_ORDER.find((key) => !state[key]);
        if (next) {
          pending.current = { key: next, actionsWidthBefore: actionsWidth };
          setState((prev) => ({ ...prev, [next]: true }));
        }
        return;
      }

      const slack = -overflow;
      // Only ever evaluate the most-recently-collapsed (innermost) action per pass: restoring it
      // changes the actions group's width, so anything collapsed earlier needs a fresh measurement.
      for (let i = COLLAPSE_ORDER.length - 1; i >= 0; i--) {
        const key = COLLAPSE_ORDER[i];
        if (!state[key]) continue;
        if (slack > freedWidths.current[key] + COLLAPSE_HYSTERESIS_PX) {
          setState((prev) => ({ ...prev, [key]: false }));
        }
        break;
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(actions);
    return () => observer.disconnect();
  }, [refs.header, refs.titlePrefix, refs.actions, state]);

  return state;
}
